"""
Multi-Model Agent Orchestrator
Intelligent routing with specialized agents using different models
"""

import logging
import time
import uuid
from typing import Dict, Any, Optional
from .ollama_client import OllamaClient
from .enhanced_router import EnhancedRouterAgent
from .specialized_agents import ChatAgent, CodeAgent, AnalysisAgent, CreativeAgent, ToolAgent
from .agents import RAGAgent, PersonaAgent
from .config_manager import AIConfigManager

# Import Chat Flow Logger
try:
    from utils.chat_flow_logger import get_chat_flow_logger
    CHAT_FLOW_LOGGER_AVAILABLE = True
except ImportError:
    CHAT_FLOW_LOGGER_AVAILABLE = False

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
            
            # Initialize Chat Flow Logger
            flow_logger = None
            message_id = str(uuid.uuid4())
            if CHAT_FLOW_LOGGER_AVAILABLE:
                try:
                    flow_logger = get_chat_flow_logger()
                    persona_dict = persona if isinstance(persona, dict) else {'ai_name': str(persona), 'name': str(persona)}
                    flow_logger.start_message(message_id, user_input, persona_dict)
                except Exception as e:
                    logger.warning(f"⚠️ Failed to initialize chat flow logger: {e}")
            
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
            router_start = time.time()
            routing_result = self.router.route_request(user_input)
            router_duration = time.time() - router_start
            execution_log["router"] = routing_result.get("log", {})
            
            intent = routing_result.get("intent", "chat")
            final_input = routing_result.get("final_input", user_input)
            needs_rag = routing_result.get("needs_rag", False)
            needs_tools = routing_result.get("needs_tools", False)
            confidence = routing_result.get("confidence", 0.0) * 100  # Convert to percentage
            
            logger.info(f"   ✅ Routing complete: intent={intent}, RAG={needs_rag}, Tools={needs_tools}")
            
            # Log to chat flow
            if flow_logger:
                try:
                    router_config = self.agent_configs.get('router', {})
                    keywords = routing_result.get("keywords", [])
                    # Get agent display name from database
                    agent_display_name = router_config.get('display_name', 'Router Agent')
                    
                    flow_logger.log_router(
                        intent=intent,
                        confidence=confidence,
                        keywords=keywords,
                        model_info={
                            'model_name': router_config.get('model_name', 'phi3:mini'),
                            'temperature': router_config.get('temperature', 0.3),
                            'max_tokens': router_config.get('max_tokens', 500)
                        },
                        duration=router_duration,
                        agent_display_name=agent_display_name
                    )
                except Exception as e:
                    logger.warning(f"⚠️ Failed to log router step: {e}")
            
            # ========================================
            # STEP 2: Conditional RAG
            # ========================================
            rag_context = ""
            rag_start = time.time()
            if needs_rag:
                logger.info("\n[STEP 2/4] RAG Agent (Context Retrieval)")
                rag_result = self.rag.retrieve_context(final_input, intent)
                execution_log["rag"] = rag_result.get("log", "")
                rag_context = rag_result.get("context", "")
                rag_duration = time.time() - rag_start
                logger.info(f"   ✅ RAG context retrieved")
                
                # Log to chat flow
                if flow_logger:
                    try:
                        # Extract RAG metrics from result
                        docs_found = len(rag_result.get("documents", []))
                        relevant_docs = len([d for d in rag_result.get("documents", []) if d.get("score", 0) > 0.7])
                        context_length = len(rag_context)
                        
                        # Get agent display name from database
                        rag_config = self.agent_configs.get('rag', {})
                        agent_display_name = rag_config.get('display_name', 'RAG Agent')
                        
                        flow_logger.log_rag(
                            docs_found=docs_found,
                            relevant_docs=relevant_docs,
                            context_length=context_length,
                            duration=rag_duration,
                            agent_display_name=agent_display_name
                        )
                    except Exception as e:
                        logger.warning(f"⚠️ Failed to log RAG step: {e}")
            else:
                rag_duration = time.time() - rag_start
                logger.info("\n[STEP 2/4] RAG Agent - SKIPPED (not needed)")
                execution_log["rag"] = "Skipped - not needed for this request"
                
                # Log skipped RAG
                if flow_logger:
                    try:
                        # Get agent display name from database
                        rag_config = self.agent_configs.get('rag', {})
                        agent_display_name = rag_config.get('display_name', 'RAG Agent')
                        
                        flow_logger.log_rag(
                            docs_found=0,
                            relevant_docs=0,
                            context_length=0,
                            duration=rag_duration,
                            agent_display_name=agent_display_name
                        )
                    except Exception as e:
                        logger.warning(f"⚠️ Failed to log RAG step: {e}")
            
            # ========================================
            # STEP 3: Specialized Agent Processing
            # ========================================
            logger.info(f"\n[STEP 3/4] Specialized Agent: {intent.upper()}")
            specialist_start = time.time()
            
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
            
            specialist_duration = time.time() - specialist_start
            execution_log["specialist"] = agent_result.get("log", "")
            raw_response = agent_result.get("response", "")
            
            logger.info(f"   ✅ {intent.capitalize()} agent completed")
            
            # Log to chat flow
            if flow_logger:
                try:
                    agent_config = self.agent_configs.get(intent, {})
                    
                    # Get agent display name from database
                    agent_display_name = agent_config.get('display_name', f'{intent.capitalize()} Agent')
                    
                    # Fallback names if display_name not in database
                    agent_name_map = {
                        'chat': 'Chat Agent',
                        'code': 'Code Agent',
                        'analysis': 'Analysis Agent',
                        'creative': 'Creative Agent',
                        'tool': 'Tool Agent'
                    }
                    
                    flow_logger.log_specialized_agent(
                        agent_name=agent_name_map.get(intent, f'{intent.capitalize()} Agent'),
                        agent_type=intent,
                        model_info={
                            'model_name': agent_config.get('model_name', 'gemma2:2b'),
                            'temperature': agent_config.get('temperature', 0.7),
                            'max_tokens': agent_config.get('max_tokens', 2000)
                        },
                        metrics={
                            'response_length': len(raw_response),
                            'tokens_generated': len(raw_response.split())  # Rough estimate
                        },
                        duration=specialist_duration,
                        step_num=3,
                        agent_display_name=agent_display_name
                    )
                except Exception as e:
                    logger.warning(f"⚠️ Failed to log specialist agent step: {e}")
            
            # ========================================
            # STEP 4: Persona Formatting
            # ========================================
            logger.info("\n[STEP 4/4] Persona Agent")
            persona_start = time.time()
            persona_result = self.persona.format_response(raw_response, persona)
            persona_duration = time.time() - persona_start
            execution_log["persona"] = persona_result.get("log", "")
            final_response = persona_result.get("response", raw_response)
            
            logger.info("\n" + "=" * 60)
            logger.info("✅ Multi-Model Pipeline Complete!")
            logger.info(f"   Intent: {intent}")
            logger.info(f"   Used RAG: {needs_rag}")
            logger.info(f"   Response: {len(final_response)} chars")
            logger.info("=" * 60)
            
            # Log persona to chat flow
            if flow_logger:
                try:
                    persona_config = self.agent_configs.get('persona', {})
                    persona_dict = persona if isinstance(persona, dict) else {'ai_name': str(persona), 'name': str(persona)}
                    persona_name = persona_dict.get('ai_name', persona_dict.get('name', 'Unknown'))
                    
                    # Get personality traits if available
                    traits = persona_dict.get('personality_traits', {
                        'technical': 90,
                        'friendly': 70,
                        'direct': 85,
                        'creative': 60,
                        'professional': 75
                    })
                    
                    # Get agent display name from database
                    agent_display_name = persona_config.get('display_name', 'Persona Agent')
                    
                    flow_logger.log_persona(
                        persona_name=persona_name,
                        traits=traits,
                        model_info={
                            'model_name': persona_config.get('model_name', 'gemma2:2b'),
                            'temperature': persona_config.get('temperature', 0.6),
                            'max_tokens': persona_config.get('max_tokens', 1000)
                        },
                        duration=persona_duration,
                        agent_display_name=agent_display_name,
                        step_num=4  # This is step 4 in multi-model (Router->RAG->Specialist->Persona)
                    )
                    
                    # Finish the flow log
                    flow_logger.finish_message(
                        response_length=len(final_response),
                        success=True
                    )
                except Exception as e:
                    logger.warning(f"⚠️ Failed to finish chat flow log: {e}")
            
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
