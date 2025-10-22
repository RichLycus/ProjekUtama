"""
Enhanced Router Agent - Intelligent Request Routing
Validates input, improves ambiguous queries, and routes to appropriate specialized agents
"""

import logging
from typing import Dict, Any, Optional, Tuple
from .ollama_client import OllamaClient

logger = logging.getLogger(__name__)


class EnhancedRouterAgent:
    """
    Enhanced Router Agent with:
    - Input validation
    - Auto-improvement of unclear inputs
    - Intelligent routing to specialized agents
    - Tool requirement detection
    """
    
    def __init__(self, ollama_client: OllamaClient, config: Dict[str, Any]):
        self.client = ollama_client
        self.model = config.get('model_name', 'phi3:mini')
        self.temperature = config.get('temperature', 0.3)
        self.max_tokens = config.get('max_tokens', 500)
        # Load system prompt from config (database)
        self.system_prompt = config.get('system_prompt', """You are an intelligent request router.
Your task is to classify user requests into the correct category:
- chat: General conversation, simple Q&A
- code: Programming, debugging, code review
- analysis: Data analysis, reasoning, complex problem-solving
- creative: Writing, storytelling, creative content
- tool: Requests requiring tool execution

Respond with just the intent name.""")
        
        # Agent routing keywords
        self.routing_keywords = {
            'chat': ['hello', 'hi', 'hey', 'how are you', 'what is', 'who is', 'tell me about'],
            'code': ['code', 'program', 'function', 'script', 'debug', 'error', 'python', 'javascript', 'algorithm', 'implement'],
            'analysis': ['analyze', 'explain', 'compare', 'evaluate', 'research', 'investigate', 'why', 'how does'],
            'creative': ['write', 'story', 'create', 'generate', 'imagine', 'design', 'brainstorm', 'creative'],
            'tool': ['run', 'execute', 'open', 'launch', 'use tool', 'activate']
        }
    
    def validate_input(self, user_input: str) -> Dict[str, Any]:
        """
        Validate if user input is clear and specific enough
        Returns: {
            "is_valid": bool,
            "clarity_score": float (0-1),
            "issues": [list of issues],
            "suggestions": [list of improvements]
        }
        """
        try:
            issues = []
            suggestions = []
            
            # Check input length
            if len(user_input.strip()) < 3:
                issues.append("Input too short")
                suggestions.append("Please provide more details about what you need")
            
            # Check if it's just greeting
            greetings = ['hi', 'hello', 'hey']
            if user_input.strip().lower() in greetings:
                # Greetings are valid, but simple
                return {
                    "is_valid": True,
                    "clarity_score": 1.0,
                    "issues": [],
                    "suggestions": [],
                    "log": "Simple greeting - valid"
                }
            
            # Check for question words (good indicator of clear intent)
            question_words = ['what', 'how', 'why', 'when', 'where', 'who', 'which', 'can', 'could', 'would', 'should']
            has_question_word = any(word in user_input.lower() for word in question_words)
            
            # Check for action verbs (good indicator of clear request)
            action_verbs = ['make', 'create', 'build', 'write', 'generate', 'show', 'explain', 'help', 'find', 'run', 'execute']
            has_action_verb = any(verb in user_input.lower() for verb in action_verbs)
            
            # Calculate clarity score
            clarity_factors = []
            
            if has_question_word or has_action_verb:
                clarity_factors.append(1.0)
            else:
                clarity_factors.append(0.5)
                issues.append("No clear question or action verb")
                suggestions.append("Try starting with 'Can you...' or 'Please...'")
            
            if len(user_input.split()) > 3:
                clarity_factors.append(1.0)
            else:
                clarity_factors.append(0.7)
                issues.append("Very brief input")
                suggestions.append("Add more context for better results")
            
            clarity_score = sum(clarity_factors) / len(clarity_factors)
            is_valid = clarity_score > 0.6
            
            logger.info(f"🔍 Input Validation: Score={clarity_score:.2f}, Valid={is_valid}")
            
            return {
                "is_valid": is_valid,
                "clarity_score": clarity_score,
                "issues": issues,
                "suggestions": suggestions,
                "log": f"Validation score: {clarity_score:.2f}"
            }
            
        except Exception as e:
            logger.error(f"❌ Validation error: {str(e)}")
            return {
                "is_valid": True,  # Default to valid on error
                "clarity_score": 0.8,
                "issues": [],
                "suggestions": [],
                "log": f"Validation error: {str(e)}"
            }
    
    def improve_input(self, user_input: str, validation_result: Dict[str, Any]) -> Dict[str, Any]:
        """
        Auto-improve unclear or ambiguous input
        Returns: {
            "improved_input": str,
            "was_improved": bool,
            "improvements_made": [list of changes]
        }
        """
        try:
            if validation_result["clarity_score"] >= 0.8:
                # Input is already clear
                logger.info(f"✅ Input is clear (score: {validation_result['clarity_score']:.2f}), no improvement needed")
                return {
                    "improved_input": user_input,
                    "was_improved": False,
                    "improvements_made": [],
                    "log": "Input already clear"
                }
            
            logger.info(f"🔄 Improving unclear input (score: {validation_result['clarity_score']:.2f})...")
            
            system_prompt = """You are an input improvement specialist.
Given a vague or unclear user request, reformulate it to be more specific and actionable.
Keep the same intent but make it clearer and more structured.
Output ONLY the improved version, nothing else."""

            prompt = f"""Original request: "{user_input}"

Issues identified: {', '.join(validation_result['issues'])}

Improved request:"""
            
            result = self.client.generate(
                model=self.model,
                prompt=prompt,
                system=system_prompt,
                temperature=0.3,
                max_tokens=200
            )
            
            if result["success"]:
                improved = result["response"].strip().strip('"\'')
                
                # Don't improve if it's significantly longer (LLM might be adding too much)
                if len(improved) > len(user_input) * 2:
                    logger.warning("⚠️ Improved version too long, using original")
                    return {
                        "improved_input": user_input,
                        "was_improved": False,
                        "improvements_made": [],
                        "log": "Improvement too verbose, kept original"
                    }
                
                logger.info(f"✅ Input improved: '{user_input}' → '{improved}'")
                
                return {
                    "improved_input": improved,
                    "was_improved": True,
                    "improvements_made": validation_result['suggestions'],
                    "log": f"Input clarified and improved"
                }
            else:
                logger.error("⚠️ Failed to improve input, using original")
                return {
                    "improved_input": user_input,
                    "was_improved": False,
                    "improvements_made": [],
                    "log": "Improvement failed, kept original"
                }
                
        except Exception as e:
            logger.error(f"❌ Input improvement error: {str(e)}")
            return {
                "improved_input": user_input,
                "was_improved": False,
                "improvements_made": [],
                "log": f"Error: {str(e)}"
            }
    
    def classify_intent(self, user_input: str) -> Dict[str, Any]:
        """
        Classify user intent and determine which specialized agent should handle it
        Returns: {
            "intent": str (chat/code/analysis/creative/tool),
            "confidence": float (0-1),
            "needs_rag": bool,
            "needs_tools": bool
        }
        """
        try:
            logger.info("🔀 Enhanced Router: Classifying intent...")
            
            # Quick keyword-based routing for common patterns
            user_input_lower = user_input.lower()
            
            # Check for simple greetings (chat, no RAG needed)
            simple_greetings = ['hi', 'hello', 'hey', 'halo', 'hai']
            if user_input_lower.strip() in simple_greetings:
                logger.info("✅ Intent: chat (greeting)")
                return {
                    "success": True,
                    "intent": "chat",
                    "confidence": 1.0,
                    "needs_rag": False,
                    "needs_tools": False,
                    "keywords": [user_input_lower.strip()],
                    "log": "Simple greeting detected"
                }
            
            # Check keywords for each intent
            intent_scores = {}
            matched_keywords = []
            for intent_type, keywords in self.routing_keywords.items():
                score = sum(1 for keyword in keywords if keyword in user_input_lower)
                if score > 0:
                    intent_scores[intent_type] = score
                    matched_keywords.extend([kw for kw in keywords if kw in user_input_lower])
            
            # If we have clear keyword matches
            if intent_scores:
                best_intent = max(intent_scores, key=intent_scores.get)
                confidence = min(intent_scores[best_intent] / 3.0, 1.0)  # Normalize
                
                # Determine if RAG is needed
                needs_rag = best_intent in ['code', 'analysis', 'creative']
                needs_tools = best_intent == 'tool'
                
                logger.info(f"✅ Intent: {best_intent} (confidence: {confidence:.2f}, RAG: {needs_rag})")
                
                return {
                    "success": True,
                    "intent": best_intent,
                    "confidence": confidence,
                    "needs_rag": needs_rag,
                    "needs_tools": needs_tools,
                    "keywords": matched_keywords[:5],  # Top 5 matched keywords
                    "log": f"Keyword-based classification: {best_intent}"
                }
            
            # Fallback: Use LLM for classification
            logger.info("🤔 No clear keywords, using LLM classification...")
            
            prompt = f"User message: {user_input}\n\nCategory:"
            
            result = self.client.generate(
                model=self.model,
                prompt=prompt,
                system=self.system_prompt,
                temperature=0.2,
                max_tokens=10
            )
            
            if result["success"]:
                intent = result["response"].strip().lower()
                
                # Validate intent
                valid_intents = ['chat', 'code', 'analysis', 'creative', 'tool']
                if intent not in valid_intents:
                    intent = 'chat'  # Default fallback
                
                needs_rag = intent in ['code', 'analysis', 'creative']
                needs_tools = intent == 'tool'
                
                logger.info(f"✅ Intent: {intent} (LLM-based, RAG: {needs_rag})")
                
                return {
                    "success": True,
                    "intent": intent,
                    "confidence": 0.8,
                    "needs_rag": needs_rag,
                    "needs_tools": needs_tools,
                    "keywords": [],
                    "log": f"LLM classification: {intent}",
                    "prompts": {
                        "system_prompt": self.system_prompt,
                        "user_prompt": prompt,
                        "model": self.model,
                        "temperature": 0.2
                    }
                }
            else:
                logger.warning("⚠️ Classification failed, defaulting to chat")
                return {
                    "success": True,
                    "intent": "chat",
                    "confidence": 0.5,
                    "needs_rag": False,
                    "needs_tools": False,
                    "keywords": [],
                    "log": "Classification failed, default to chat"
                }
                
        except Exception as e:
            logger.error(f"❌ Classification error: {str(e)}")
            return {
                "success": False,
                "intent": "chat",
                "confidence": 0.5,
                "needs_rag": False,
                "needs_tools": False,
                "keywords": [],
                "log": f"Error: {str(e)}"
            }
    
    def route_request(self, user_input: str) -> Dict[str, Any]:
        """
        Complete routing process:
        1. Validate input
        2. Improve if needed
        3. Classify intent
        4. Return routing decision
        """
        try:
            logger.info("=" * 60)
            logger.info("🚦 Enhanced Router: Starting request analysis")
            logger.info(f"📝 Input: {user_input}")
            logger.info("=" * 60)
            
            # Step 1: Validate input
            logger.info("\n[Step 1/3] Validating input...")
            validation = self.validate_input(user_input)
            
            # Step 2: Improve input if needed
            logger.info("\n[Step 2/3] Checking if improvement needed...")
            improvement = self.improve_input(user_input, validation)
            
            # Use improved input for classification
            final_input = improvement["improved_input"]
            
            # Step 3: Classify intent
            logger.info("\n[Step 3/3] Classifying intent...")
            classification = self.classify_intent(final_input)
            
            logger.info("\n" + "=" * 60)
            logger.info("✅ Routing Complete!")
            logger.info(f"   Final Input: {final_input}")
            logger.info(f"   Intent: {classification['intent']}")
            logger.info(f"   Agent: {classification['intent']}_agent")
            logger.info(f"   Needs RAG: {classification['needs_rag']}")
            logger.info(f"   Needs Tools: {classification['needs_tools']}")
            logger.info("=" * 60)
            
            return {
                "success": True,
                "original_input": user_input,
                "final_input": final_input,
                "was_improved": improvement["was_improved"],
                "intent": classification["intent"],
                "confidence": classification["confidence"],
                "needs_rag": classification["needs_rag"],
                "needs_tools": classification["needs_tools"],
                "validation": validation,
                "improvement": improvement,
                "log": {
                    "validation": validation["log"],
                    "improvement": improvement["log"],
                    "classification": classification["log"]
                }
            }
            
        except Exception as e:
            logger.error(f"❌ Routing error: {str(e)}")
            return {
                "success": False,
                "original_input": user_input,
                "final_input": user_input,
                "was_improved": False,
                "intent": "chat",
                "confidence": 0.5,
                "needs_rag": False,
                "needs_tools": False,
                "log": {
                    "error": str(e)
                }
            }
