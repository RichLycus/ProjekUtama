"""
Specialized Agents for ChimeraAI
Each agent has specific expertise and uses dedicated models
"""

import logging
from typing import Dict, Any, Optional
from .ollama_client import OllamaClient

logger = logging.getLogger(__name__)


class ChatAgent:
    """
    Agent for simple conversational tasks
    - General Q&A
    - Casual conversation
    - Simple information requests
    Uses: lightweight model (gemma2:2b)
    """
    
    def __init__(self, ollama_client: OllamaClient, config: Dict[str, Any]):
        self.client = ollama_client
        self.model = config.get('model_name', 'gemma2:2b')
        self.temperature = config.get('temperature', 0.7)
        self.max_tokens = config.get('max_tokens', 1500)
        # Load system prompt from config (database)
        self.system_prompt = config.get('system_prompt', """You are a helpful and friendly AI assistant.
Provide clear, concise answers to user questions.
Be conversational and engaging.""")
        
    def process(self, user_input: str, context: str = "") -> Dict[str, Any]:
        """Process simple chat request"""
        try:
            system_prompt = self.system_prompt

            prompt = f"User: {user_input}\n\nAssistant:"
            
            logger.info(f"💬 Chat Agent: Processing simple conversation...")
            
            result = self.client.generate(
                model=self.model,
                prompt=prompt,
                system=system_prompt,
                temperature=self.temperature,
                max_tokens=self.max_tokens
            )
            
            if result["success"]:
                response = result["response"].strip()
                logger.info(f"✅ Chat Agent: Generated {len(response)} chars")
                return {
                    "success": True,
                    "response": response,
                    "agent": "chat",
                    "log": f"Chat response ({len(response)} chars)"
                }
            else:
                logger.error("⚠️ Chat Agent failed")
                return {
                    "success": False,
                    "response": "I'm having trouble responding right now.",
                    "agent": "chat",
                    "log": f"Error: {result.get('error', 'Unknown')}"
                }
                
        except Exception as e:
            logger.error(f"❌ Chat Agent error: {str(e)}")
            return {
                "success": False,
                "response": "I encountered an error.",
                "agent": "chat",
                "log": f"Error: {str(e)}"
            }


class CodeAgent:
    """
    Agent for programming tasks
    - Code generation
    - Debugging
    - Code review
    - Technical documentation
    Uses: specialized coding model (qwen2.5-coder:7b)
    """
    
    def __init__(self, ollama_client: OllamaClient, config: Dict[str, Any]):
        self.client = ollama_client
        self.model = config.get('model_name', 'qwen2.5-coder:7b')
        self.temperature = config.get('temperature', 0.5)
        self.max_tokens = config.get('max_tokens', 2500)
        # Load system prompt from config (database)
        self.system_prompt = config.get('system_prompt', """You are an expert programming assistant.
Provide clean, well-documented code with explanations.
Follow best practices and include error handling.
Use appropriate design patterns and modern conventions.""")
        
    def process(self, user_input: str, context: str = "", rag_context: str = "") -> Dict[str, Any]:
        """Process code-related request"""
        try:
            system_prompt = self.system_prompt

            # Build enhanced prompt with RAG context
            prompt = f"User: {user_input}\n\n"
            if rag_context:
                prompt += f"Relevant Context:\n{rag_context}\n\n"
            prompt += "Assistant:"
            
            logger.info(f"💻 Code Agent: Processing programming task...")
            
            result = self.client.generate(
                model=self.model,
                prompt=prompt,
                system=system_prompt,
                temperature=self.temperature,
                max_tokens=self.max_tokens
            )
            
            if result["success"]:
                response = result["response"].strip()
                logger.info(f"✅ Code Agent: Generated {len(response)} chars")
                return {
                    "success": True,
                    "response": response,
                    "agent": "code",
                    "log": f"Code solution generated ({len(response)} chars)"
                }
            else:
                logger.error("⚠️ Code Agent failed")
                return {
                    "success": False,
                    "response": "I'm having trouble generating code right now.",
                    "agent": "code",
                    "log": f"Error: {result.get('error', 'Unknown')}"
                }
                
        except Exception as e:
            logger.error(f"❌ Code Agent error: {str(e)}")
            return {
                "success": False,
                "response": "I encountered an error while processing your code request.",
                "agent": "code",
                "log": f"Error: {str(e)}"
            }


class AnalysisAgent:
    """
    Agent for analytical tasks
    - Data analysis
    - Logical reasoning
    - Problem solving
    - Research and investigation
    Uses: strong reasoning model (qwen2.5:7b)
    """
    
    def __init__(self, ollama_client: OllamaClient, config: Dict[str, Any]):
        self.client = ollama_client
        self.model = config.get('model_name', 'qwen2.5:7b')
        self.temperature = config.get('temperature', 0.6)
        self.max_tokens = config.get('max_tokens', 2000)
        # Load system prompt from config (database)
        self.system_prompt = config.get('system_prompt', """You are an expert analytical assistant.
Provide detailed, well-reasoned analysis with clear explanations.
Break down complex problems into manageable steps.
Support your conclusions with evidence and logical reasoning.""")
        
    def process(self, user_input: str, context: str = "", rag_context: str = "") -> Dict[str, Any]:
        """Process analytical request"""
        try:
            system_prompt = self.system_prompt

            # Build enhanced prompt with RAG context
            prompt = f"User: {user_input}\n\n"
            if rag_context:
                prompt += f"Relevant Context:\n{rag_context}\n\n"
            prompt += "Assistant:"
            
            logger.info(f"📊 Analysis Agent: Processing analytical task...")
            
            result = self.client.generate(
                model=self.model,
                prompt=prompt,
                system=system_prompt,
                temperature=self.temperature,
                max_tokens=self.max_tokens
            )
            
            if result["success"]:
                response = result["response"].strip()
                logger.info(f"✅ Analysis Agent: Generated {len(response)} chars")
                return {
                    "success": True,
                    "response": response,
                    "agent": "analysis",
                    "log": f"Analysis completed ({len(response)} chars)"
                }
            else:
                logger.error("⚠️ Analysis Agent failed")
                return {
                    "success": False,
                    "response": "I'm having trouble analyzing this right now.",
                    "agent": "analysis",
                    "log": f"Error: {result.get('error', 'Unknown')}"
                }
                
        except Exception as e:
            logger.error(f"❌ Analysis Agent error: {str(e)}")
            return {
                "success": False,
                "response": "I encountered an error while analyzing your request.",
                "agent": "analysis",
                "log": f"Error: {str(e)}"
            }


class CreativeAgent:
    """
    Agent for creative tasks
    - Story writing
    - Content creation
    - Brainstorming
    - Artistic concepts
    Uses: creative model (llama3:8b)
    """
    
    def __init__(self, ollama_client: OllamaClient, config: Dict[str, Any]):
        self.client = ollama_client
        self.model = config.get('model_name', 'llama3:8b')
        self.temperature = config.get('temperature', 0.8)
        self.max_tokens = config.get('max_tokens', 2000)
        # Load system prompt from config (database)
        self.system_prompt = config.get('system_prompt', """You are a creative AI assistant with artistic flair.
Generate imaginative, engaging content with vivid descriptions.
Use metaphors, storytelling techniques, and emotional resonance.
Be original, inspiring, and encourage creative exploration.""")
        
    def process(self, user_input: str, context: str = "", rag_context: str = "") -> Dict[str, Any]:
        """Process creative request"""
        try:
            system_prompt = self.system_prompt

            # Build enhanced prompt with RAG context
            prompt = f"User: {user_input}\n\n"
            if rag_context:
                prompt += f"Inspiration:\n{rag_context}\n\n"
            prompt += "Assistant:"
            
            logger.info(f"🎨 Creative Agent: Processing creative task...")
            
            result = self.client.generate(
                model=self.model,
                prompt=prompt,
                system=system_prompt,
                temperature=self.temperature,
                max_tokens=self.max_tokens
            )
            
            if result["success"]:
                response = result["response"].strip()
                logger.info(f"✅ Creative Agent: Generated {len(response)} chars")
                return {
                    "success": True,
                    "response": response,
                    "agent": "creative",
                    "log": f"Creative content generated ({len(response)} chars)"
                }
            else:
                logger.error("⚠️ Creative Agent failed")
                return {
                    "success": False,
                    "response": "I'm having trouble being creative right now.",
                    "agent": "creative",
                    "log": f"Error: {result.get('error', 'Unknown')}"
                }
                
        except Exception as e:
            logger.error(f"❌ Creative Agent error: {str(e)}")
            return {
                "success": False,
                "response": "I encountered an error while creating content.",
                "agent": "creative",
                "log": f"Error: {str(e)}"
            }


class ToolAgent:
    """
    Agent for tool execution tasks
    - Tool detection
    - Parameter extraction
    - Execution coordination
    Uses: lightweight model (phi3:mini)
    """
    
    def __init__(self, ollama_client: OllamaClient, config: Dict[str, Any]):
        self.client = ollama_client
        self.model = config.get('model_name', 'phi3:mini')
        self.temperature = config.get('temperature', 0.4)
        self.max_tokens = config.get('max_tokens', 1000)
        # Load system prompt from config (database)
        self.system_prompt = config.get('system_prompt', """You are a tool detection specialist.
Analyze user requests to determine if external tools are needed.
Respond with YES if tools/execution is required, NO if it's just a question.
Examples:
- "run calculator" → YES
- "how do I use the calculator?" → NO
- "execute python script" → YES
- "what is Python?" → NO""")
        
    def detect_tool_need(self, user_input: str, context: str = "") -> Dict[str, Any]:
        """Detect if tools are needed"""
        try:
            system_prompt = self.system_prompt

            prompt = f"User request: {user_input}\n\nNeed tools? (YES/NO):"
            
            logger.info(f"🔧 Tool Agent: Detecting tool requirements...")
            
            result = self.client.generate(
                model=self.model,
                prompt=prompt,
                system=system_prompt,
                temperature=self.temperature,
                max_tokens=50
            )
            
            if result["success"]:
                response = result["response"].strip().upper()
                needs_tools = "YES" in response
                
                logger.info(f"✅ Tool Agent: Tools needed = {needs_tools}")
                return {
                    "success": True,
                    "needs_tools": needs_tools,
                    "agent": "tool",
                    "log": f"Tool detection: {needs_tools}"
                }
            else:
                logger.error("⚠️ Tool Agent detection failed")
                return {
                    "success": False,
                    "needs_tools": False,
                    "agent": "tool",
                    "log": f"Error: {result.get('error', 'Unknown')}"
                }
                
        except Exception as e:
            logger.error(f"❌ Tool Agent error: {str(e)}")
            return {
                "success": False,
                "needs_tools": False,
                "agent": "tool",
                "log": f"Error: {str(e)}"
            }
