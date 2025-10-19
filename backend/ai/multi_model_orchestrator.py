"""
Multi-Model Agent Orchestrator
Intelligent routing with specialized agents using different models
"""

import logging
from typing import Dict, Any, Optional
from .ollama_client import OllamaClient
from .enhanced_router import EnhancedRouterAgent
from .specialized_agents import ChatAgent, CodeAgent, AnalysisAgent, CreativeAgent, ToolAgent
from .agents import RAGAgent, PersonaAgent
from .config_manager import AIConfigManager

logger = logging.getLogger(__name__)


class MultiModelOrchestrator:
    """
    Multi-Model Orchestrator with intelligent routing:
    - Enhanced Router for validation & classification
    - Specialized agents for different tasks
    - Each agent uses dedicated model from database
    - Dynamic RAG usage based on task type
    """
    
    def __init__(
        self, 
        db_manager=None,
        config_manager: Optional[AIConfigManager] = None
    ):
        self.db = db_manager
        self.config_manager = config_manager or AIConfigManager()
        
        # Get Ollama URL
        ollama_url = self.config_manager.get_ollama_url()
        self.ollama = OllamaClient(ollama_url)
        
        # Load agent configurations from database
        self.agent_configs = {}
        if self.db:
            configs = self.db.get_agent_configs()
            for config in configs:
                self.agent_configs[config['agent_type']] = config
            logger.info(f"✅ Loaded {len(self.agent_configs)} agent configurations from database")
        
        # Initialize agents with their dedicated models
        self._initialize_agents()
        
        logger.info(f"✅ Multi-Model Orchestrator initialized")
        logger.info(f"   Ollama URL: {ollama_url}")
        logger.info(f"   Agents initialized: {len(self.specialized_agents)}")
    
    def _initialize_agents(self):
        """Initialize all agents with their dedicated models from database"""
        
        # Get configs with fallbacks
        router_config = self.agent_configs.get('router', {
            'model_name': 'phi3:mini',
            'temperature': 0.3,
            'max_tokens': 500
        })
        
        chat_config = self.agent_configs.get('chat', {
            'model_name': 'gemma2:2b',
            'temperature': 0.7,
            'max_tokens': 1500
        })
        
        code_config = self.agent_configs.get('code', {
            'model_name': 'qwen2.5-coder:7b',
            'temperature': 0.5,
            'max_tokens': 2500
        })
        
        analysis_config = self.agent_configs.get('analysis', {
            'model_name': 'qwen2.5:7b',
            'temperature': 0.6,
            'max_tokens': 2000
        })
        
        creative_config = self.agent_configs.get('creative', {
            'model_name': 'llama3:8b',
            'temperature': 0.8,
            'max_tokens': 2000
        })
        
        tool_config = self.agent_configs.get('tool', {
            'model_name': 'phi3:mini',
            'temperature': 0.4,
            'max_tokens': 1000
        })
        
        persona_config = self.agent_configs.get('persona', {
            'model_name': 'gemma2:2b',
            'temperature': 0.6,
            'max_tokens': 1000
        })
        
        # Initialize Router (Enhanced)
        self.router = EnhancedRouterAgent(self.ollama, router_config)
        
        # Initialize RAG Agent (uses embedding model, not LLM)
        self.rag = RAGAgent(self.db)
        
        # Initialize Specialized Agents
        self.specialized_agents = {
            'chat': ChatAgent(self.ollama, chat_config),
            'code': CodeAgent(self.ollama, code_config),
            'analysis': AnalysisAgent(self.ollama, analysis_config),
            'creative': CreativeAgent(self.ollama, creative_config),
            'tool': ToolAgent(self.ollama, tool_config)
        }
        
        # Initialize Persona Agent
        self.persona = PersonaAgent(self.ollama, persona_config)
        
        logger.info("✅ All agents initialized with dedicated models")
    
    def reload_config(self):
        """Reload configuration and reinitialize agents"""
        logger.info("🔄 Reloading Multi-Model configuration...")
        
        # Reload config manager
        self.config_manager.config = self.config_manager.load_config()
        
        # Reload agent configs from database
        if self.db:
            configs = self.db.get_agent_configs()
            self.agent_configs = {}
            for config in configs:
                self.agent_configs[config['agent_type']] = config
            logger.info(f"✅ Reloaded {len(self.agent_configs)} agent configurations")
        
        # Get new Ollama URL
        ollama_url = self.config_manager.get_ollama_url()
        self.ollama = OllamaClient(ollama_url)
        
        # Reinitialize all agents
        self._initialize_agents()
        
        logger.info(f"✅ Multi-Model configuration reloaded")
    
    def test_ollama_connection(self) -> bool:
        """Test if Ollama is available"""
        return self.ollama.test_connection()
    
    def process_message(
        self, 
        user_input: str, 
        persona = None,
        conversation_history: list = None
    ) -> Dict[str, Any]:
        """
        Process user message through intelligent multi-model pipeline:
        1. Router: Validate, improve, classify
        2. Conditional RAG: Only if needed
        3. Specialized Agent: Based on intent
        4. Persona: Format output
        """
        try:
            execution_log = {}
            
            # Handle persona
            if persona is None:
                persona = "lycus"
            
            logger.info("=" * 60)
            logger.info("🚀 Starting Multi-Model Pipeline")
            if isinstance(persona, dict):
                logger.info(f"👤 Persona: {persona.get('ai_name', 'Unknown')}")
            else:
                logger.info(f"👤 Persona: {persona}")
            logger.info("=" * 60)
            
            # ========================================
            # STEP 1: Enhanced Router
            # ========================================
            logger.info("\n[STEP 1/4] Enhanced Router Agent")
            routing_result = self.router.route_request(user_input)
            execution_log["router"] = routing_result.get("log", {})
            
            intent = routing_result.get("intent", "chat")
            final_input = routing_result.get("final_input", user_input)
            needs_rag = routing_result.get("needs_rag", False)
            needs_tools = routing_result.get("needs_tools", False)
            
            logger.info(f"   ✅ Routing complete: intent={intent}, RAG={needs_rag}, Tools={needs_tools}")
            
            # ========================================
            # STEP 2: Conditional RAG
            # ========================================
            rag_context = ""
            if needs_rag:
                logger.info("\n[STEP 2/4] RAG Agent (Context Retrieval)")
                rag_result = self.rag.retrieve_context(final_input, intent)
                execution_log["rag"] = rag_result.get("log", "")
                rag_context = rag_result.get("context", "")
                logger.info(f"   ✅ RAG context retrieved")
            else:
                logger.info("\n[STEP 2/4] RAG Agent - SKIPPED (not needed)")
                execution_log["rag"] = "Skipped - not needed for this request"
            
            # ========================================
            # STEP 3: Specialized Agent Processing
            # ========================================
            logger.info(f"\n[STEP 3/4] Specialized Agent: {intent.upper()}")
            
            # Get the appropriate specialized agent
            agent = self.specialized_agents.get(intent)
            
            if not agent:
                # Fallback to chat agent
                logger.warning(f"⚠️ No agent for intent '{intent}', using chat agent")
                agent = self.specialized_agents['chat']
                intent = 'chat'
            
            # Process with specialized agent
            if intent == 'chat':
                agent_result = agent.process(final_input)
            elif intent == 'tool':
                # Tool agent just detects, doesn't generate response
                tool_result = agent.detect_tool_need(final_input)
                execution_log["tool"] = tool_result.get("log", "")
                if tool_result.get("needs_tools"):
                    agent_result = {
                        "success": True,
                        "response": "Tool execution would be triggered here. (Integration with tool system pending)",
                        "agent": "tool",
                        "log": "Tool execution requested"
                    }
                else:
                    # Not actually a tool request, route to chat
                    agent = self.specialized_agents['chat']
                    agent_result = agent.process(final_input)
            else:
                # code, analysis, creative agents support RAG context
                agent_result = agent.process(final_input, rag_context=rag_context)
            
            execution_log["specialist"] = agent_result.get("log", "")
            raw_response = agent_result.get("response", "")
            
            logger.info(f"   ✅ {intent.capitalize()} agent completed")
            
            # ========================================
            # STEP 4: Persona Formatting
            # ========================================
            logger.info("\n[STEP 4/4] Persona Agent")
            persona_result = self.persona.format_response(raw_response, persona)
            execution_log["persona"] = persona_result.get("log", "")
            final_response = persona_result.get("response", raw_response)
            
            logger.info("\n" + "=" * 60)
            logger.info("✅ Multi-Model Pipeline Complete!")
            logger.info(f"   Intent: {intent}")
            logger.info(f"   Used RAG: {needs_rag}")
            logger.info(f"   Response: {len(final_response)} chars")
            logger.info("=" * 60)
            
            return {
                "success": True,
                "response": final_response,
                "agent_tag": f"{intent}-agent",
                "execution_log": execution_log,
                "routing_info": {
                    "original_input": user_input,
                    "final_input": final_input,
                    "was_improved": routing_result.get("was_improved", False),
                    "intent": intent,
                    "confidence": routing_result.get("confidence", 0.0),
                    "used_rag": needs_rag,
                    "used_tools": needs_tools
                }
            }
            
        except Exception as e:
            logger.error(f"❌ Multi-Model Pipeline error: {str(e)}")
            import traceback
            logger.error(traceback.format_exc())
            return {
                "success": False,
                "response": "I apologize, but I encountered an error processing your request.",
                "agent_tag": "error",
                "execution_log": {
                    "error": str(e)
                }
            }
    
    def get_system_status(self) -> Dict[str, Any]:
        """Get status of all agents and their models"""
        ollama_connected = self.test_ollama_connection()
        
        # Get model info for each agent
        agent_models = {}
        for agent_type, config in self.agent_configs.items():
            agent_models[agent_type] = {
                "model": config.get('model_name', 'unknown'),
                "enabled": bool(config.get('is_enabled', 1)),
                "temperature": config.get('temperature', 0.7)
            }
        
        return {
            "ollama_connected": ollama_connected,
            "orchestrator_type": "multi-model",
            "agents_ready": {
                "router": ollama_connected,
                "rag": True,  # RAG doesn't depend on Ollama
                "specialized": ollama_connected,
                "persona": ollama_connected
            },
            "specialized_agents": list(self.specialized_agents.keys()),
            "agent_models": agent_models,
            "ollama_url": self.ollama.base_url
        }
