"""5-Core Agent System for ChimeraAI Phase 3"""

import logging
from typing import Dict, Any, List, Optional
from .ollama_client import OllamaClient

logger = logging.getLogger(__name__)

class RouterAgent:
    """
    Agent 1: Router / Intent Classifier
    Classifies user intent: code/creative/tool/general
    """
    
    def __init__(self, ollama_client: OllamaClient, model: str = "llama3:8b"):
        self.client = ollama_client
        self.model = model
        
    def classify_intent(self, user_input: str) -> Dict[str, Any]:
        """Classify user's intent"""
        try:
            system_prompt = """You are an intent classifier for an AI assistant.
Classify the user's message into ONE of these categories:
- code: Programming questions, debugging, code review
- creative: Story writing, art ideas, design concepts
- tool: Requests to use specific tools or utilities
- general: General conversation, questions, chitchat

Respond with ONLY the category name, nothing else."""

            prompt = f"User message: {user_input}\n\nIntent:"
            
            logger.info("🔀 Router Agent: Classifying intent...")
            
            result = self.client.generate(
                model=self.model,
                prompt=prompt,
                system=system_prompt,
                temperature=0.3,
                max_tokens=10
            )
            
            if result["success"]:
                intent = result["response"].strip().lower()
                # Validate intent
                valid_intents = ['code', 'creative', 'tool', 'general']
                if intent not in valid_intents:
                    intent = 'general'
                
                logger.info(f"✅ Intent classified: {intent}")
                return {
                    "success": True,
                    "intent": intent,
                    "log": f"Intent classified as '{intent}'"
                }
            else:
                logger.warning("⚠️ Intent classification failed, defaulting to 'general'")
                return {
                    "success": True,
                    "intent": "general",
                    "log": "Classification failed, defaulted to general"
                }
                
        except Exception as e:
            logger.error(f"❌ Router Agent error: {str(e)}")
            return {
                "success": False,
                "intent": "general",
                "log": f"Error: {str(e)}"
            }


class RAGAgent:
    """
    Agent 2: RAG / Retrieval Engine
    Retrieves relevant context from tools, docs, and history
    """
    
    def __init__(self, db_manager=None):
        self.db = db_manager
        
    def retrieve_context(self, query: str, intent: str) -> Dict[str, Any]:
        """Retrieve relevant context based on query and intent"""
        try:
            logger.info("🔍 RAG Agent: Retrieving context...")
            
            context_items = []
            sources = []
            
            # For now, basic keyword matching (Phase 3.3 will add vector search)
            if intent == "tool" or intent == "code":
                # Search for relevant tools
                if self.db:
                    tools = self.db.list_tools({"status": "active"})
                    # Simple keyword matching
                    relevant_tools = []
                    keywords = query.lower().split()
                    for tool in tools[:5]:  # Limit to 5 tools
                        tool_text = f"{tool['name']} {tool['description']}".lower()
                        if any(keyword in tool_text for keyword in keywords):
                            relevant_tools.append(tool)
                    
                    if relevant_tools:
                        context_items.append(f"Available tools: {', '.join([t['name'] for t in relevant_tools])}")
                        sources.append(f"{len(relevant_tools)} tools")
            
            # Golden rules context (basic example)
            if intent == "code":
                context_items.append("Golden Rule: Write clean, well-documented code")
                sources.append("golden-rules")
            
            # Combine context
            context = "\n".join(context_items) if context_items else "No specific context found"
            
            logger.info(f"✅ RAG: Retrieved {len(sources)} sources")
            
            return {
                "success": True,
                "context": context,
                "sources": sources,
                "log": f"Retrieved {len(sources)} sources"
            }
            
        except Exception as e:
            logger.error(f"❌ RAG Agent error: {str(e)}")
            return {
                "success": False,
                "context": "",
                "sources": [],
                "log": f"Error: {str(e)}"
            }


class ExecutionAgent:
    """
    Agent 3: Execution / Tool Agent
    Decides if tools need to be executed and runs them
    """
    
    def __init__(self, ollama_client: OllamaClient, model: str = "llama3:8b"):
        self.client = ollama_client
        self.model = model
        
    def should_execute_tool(self, user_input: str, intent: str, context: str) -> Dict[str, Any]:
        """Determine if a tool should be executed"""
        try:
            # Simple heuristic for now (Phase 3.3 will improve)
            needs_execution = intent == "tool" or "run" in user_input.lower() or "execute" in user_input.lower()
            
            if needs_execution:
                logger.info("🔧 Execution Agent: Tool execution requested")
                return {
                    "success": True,
                    "should_execute": True,
                    "tool_name": "example_tool",  # Would be parsed from context
                    "log": "Tool execution recommended"
                }
            else:
                logger.info("⏭️ Execution Agent: No tool execution needed")
                return {
                    "success": True,
                    "should_execute": False,
                    "log": "No tool execution needed"
                }
                
        except Exception as e:
            logger.error(f"❌ Execution Agent error: {str(e)}")
            return {
                "success": False,
                "should_execute": False,
                "log": f"Error: {str(e)}"
            }


class ReasoningAgent:
    """
    Agent 4: Reasoning / Core Processing
    Main LLM that generates the actual response
    """
    
    def __init__(self, ollama_client: OllamaClient, model: str = "llama3:8b"):
        self.client = ollama_client
        self.model = model
        
    def process(
        self, 
        user_input: str, 
        intent: str, 
        context: str, 
        execution_result: Optional[Dict] = None
    ) -> Dict[str, Any]:
        """Generate the core response using LLM"""
        try:
            system_prompt = f"""You are Lycus, a helpful AI assistant.
Intent: {intent}
Context: {context}

Provide accurate, helpful responses based on the user's question and the provided context."""

            # Build prompt
            prompt = f"User: {user_input}\n\nAssistant:"
            
            if execution_result and execution_result.get("should_execute"):
                prompt = f"User: {user_input}\n[Tool execution would happen here]\n\nAssistant:"
            
            logger.info("🧠 Reasoning Agent: Generating response...")
            
            result = self.client.generate(
                model=self.model,
                prompt=prompt,
                system=system_prompt,
                temperature=0.7,
                max_tokens=2000
            )
            
            if result["success"]:
                response = result["response"].strip()
                logger.info(f"✅ Reasoning: Generated {len(response)} chars")
                return {
                    "success": True,
                    "response": response,
                    "log": f"Generated response ({len(response)} chars)"
                }
            else:
                logger.error("⚠️ Reasoning failed, using fallback")
                return {
                    "success": False,
                    "response": "I apologize, but I'm having trouble generating a response right now.",
                    "log": f"Error: {result.get('error', 'Unknown error')}"
                }
                
        except Exception as e:
            logger.error(f"❌ Reasoning Agent error: {str(e)}")
            return {
                "success": False,
                "response": "I encountered an error processing your request.",
                "log": f"Error: {str(e)}"
            }


class PersonaAgent:
    """
    Agent 5: Persona / Output Formatter
    Applies persona tone to the response
    """
    
    def __init__(self, ollama_client: OllamaClient, model: str = "llama3:8b"):
        self.client = ollama_client
        self.model = model
        
    def format_response(self, raw_response: str, persona = None) -> Dict[str, Any]:
        """
        Apply persona formatting to response
        
        Args:
            raw_response: The response to format
            persona: Either persona name (string) or full persona object (dict)
        """
        try:
            # Handle different persona input types
            if persona is None:
                persona_name = "lycus"
                persona_obj = None
            elif isinstance(persona, dict):
                # Full persona object from database
                persona_obj = persona
                persona_name = persona_obj.get('name', 'lycus').lower()
            else:
                # Legacy string persona
                persona_name = str(persona).lower()
                persona_obj = None
            
            logger.info(f"✨ Persona Agent: Applying '{persona_name}' style...")
            
            # If we have full persona object, use personality_traits
            if persona_obj and 'personality_traits' in persona_obj:
                traits = persona_obj['personality_traits']
                response_style = persona_obj.get('response_style', 'balanced')
                tone = persona_obj.get('tone', 'friendly')
                user_greeting = persona_obj.get('user_greeting', 'Kawan')
                ai_name = persona_obj.get('ai_name', 'Assistant')
                
                logger.info(f"   Using personality traits: technical={traits.get('technical', 50)}, "
                          f"friendly={traits.get('friendly', 50)}, direct={traits.get('direct', 50)}")
                logger.info(f"   Style: {response_style}, Tone: {tone}")
                
                # Apply personality-based formatting
                formatted = self._apply_personality_formatting(
                    raw_response, traits, response_style, tone, user_greeting, ai_name
                )
                
                logger.info(f"✅ Persona: Applied personality-based formatting for '{ai_name}'")
                
                return {
                    "success": True,
                    "response": formatted,
                    "persona": persona_name,
                    "log": f"Applied {ai_name} persona with personality traits"
                }
            
            # Fallback to legacy persona handling
            personas = {
                "lycus": "Technical, direct, practical. Use code examples when relevant. Stay concise.",
                "polar": "Creative, inspiring, artistic. Use metaphors. Encourage exploration.",
                "sarah": "Friendly, warm, helpful. Be conversational. Explain clearly."
            }
            
            persona_style = personas.get(persona_name, personas["lycus"])
            
            # Simple formatting based on legacy persona
            formatted = raw_response
            
            if persona_name == "lycus":
                # Already technical, minimal changes
                pass
            elif persona_name == "polar":
                # Add creative flair
                if not raw_response.startswith(("Imagine", "Think of", "Picture")):
                    formatted = raw_response
            elif persona_name == "sarah":
                # Add friendly tone
                if not raw_response.startswith(("I'd be happy", "Let me help", "Sure")):
                    formatted = raw_response
            
            logger.info(f"✅ Persona: Applied '{persona_name}' formatting (legacy)")
            
            return {
                "success": True,
                "response": formatted,
                "persona": persona_name,
                "log": f"Applied {persona_name} persona (legacy)"
            }
            
        except Exception as e:
            logger.error(f"❌ Persona Agent error: {str(e)}")
            return {
                "success": False,
                "response": raw_response,  # Return original on error
                "persona": "unknown",
                "log": f"Error: {str(e)}, returned original response"
            }
    
    def _apply_personality_formatting(
        self, 
        response: str, 
        traits: dict,
        response_style: str,
        tone: str,
        user_greeting: str,
        ai_name: str
    ) -> str:
        """
        Apply personality-based formatting using personality_traits
        
        This is a simplified implementation. In future, we can use LLM to rewrite
        the response based on personality traits.
        """
        # For now, we'll do minimal formatting based on dominant traits
        # In Phase 3.3+, we can add full LLM-based persona transformation
        
        formatted = response
        
        # If response doesn't start with a greeting-like phrase, add one based on traits
        greeting_phrases = ["Hi", "Hello", "Hey", "Sure", "I'd", "Let me"]
        starts_with_greeting = any(formatted.startswith(phrase) for phrase in greeting_phrases)
        
        if not starts_with_greeting and len(formatted) > 100:
            # Add personality-appropriate intro based on traits
            friendly_level = traits.get('friendly', 50)
            professional_level = traits.get('professional', 50)
            
            if friendly_level > 70:
                # High friendly: warm greeting
                intro = f"Halo {user_greeting}! "
            elif professional_level > 70:
                # High professional: formal
                intro = f"Tentu, {user_greeting}. "
            else:
                # Balanced: simple
                intro = ""
            
            if intro:
                formatted = intro + formatted
        
        return formatted
