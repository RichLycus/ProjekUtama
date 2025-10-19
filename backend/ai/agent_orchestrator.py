"""Agent Orchestrator - Coordinates the 5-Core Agent Pipeline"""

import logging
from typing import Dict, Any
from .ollama_client import OllamaClient
from .agents import RouterAgent, RAGAgent, ExecutionAgent, ReasoningAgent, PersonaAgent

logger = logging.getLogger(__name__)

class AgentOrchestrator:
    """
    Orchestrates the 5-agent pipeline:
    User Input → Router → RAG → Execution → Reasoning → Persona → Final Output
    """
    
    def __init__(
        self, 
        ollama_url: str = "http://localhost:11434",
        model: str = "llama3:8b",
        db_manager=None
    ):
        # Initialize Ollama client
        self.ollama = OllamaClient(ollama_url)
        self.model = model
        
        # Initialize all 5 agents
        self.router = RouterAgent(self.ollama, model)
        self.rag = RAGAgent(db_manager)
        self.execution = ExecutionAgent(self.ollama, model)
        self.reasoning = ReasoningAgent(self.ollama, model)
        self.persona = PersonaAgent(self.ollama, model)
        
        logger.info(f"✅ Agent Orchestrator initialized with model: {model}")
    
    def test_ollama_connection(self) -> bool:
        """Test if Ollama is available"""
        return self.ollama.test_connection()
    
    def process_message(
        self, 
        user_input: str, 
        persona: str = "lycus",
        conversation_history: list = None
    ) -> Dict[str, Any]:
        """
        Process user message through the 5-agent pipeline
        
        Returns:
            {
                "success": bool,
                "response": str,
                "execution_log": {
                    "router": str,
                    "rag": str,
                    "execution": str,
                    "reasoning": str,
                    "persona": str
                }
            }
        """
        try:
            execution_log = {}
            
            logger.info("=" * 60)
            logger.info("🚀 Starting 5-Agent Pipeline")
            logger.info("=" * 60)
            
            # STEP 1: Router Agent - Classify Intent
            logger.info("\n[STEP 1/5] Router Agent")
            router_result = self.router.classify_intent(user_input)
            execution_log["router"] = router_result.get("log", "")
            intent = router_result.get("intent", "general")
            
            # STEP 2: RAG Agent - Retrieve Context
            logger.info("\n[STEP 2/5] RAG Agent")
            rag_result = self.rag.retrieve_context(user_input, intent)
            execution_log["rag"] = rag_result.get("log", "")
            context = rag_result.get("context", "")
            
            # STEP 3: Execution Agent - Check Tool Execution
            logger.info("\n[STEP 3/5] Execution Agent")
            exec_result = self.execution.should_execute_tool(user_input, intent, context)
            execution_log["execution"] = exec_result.get("log", "")
            
            # STEP 4: Reasoning Agent - Generate Response
            logger.info("\n[STEP 4/5] Reasoning Agent")
            reasoning_result = self.reasoning.process(
                user_input=user_input,
                intent=intent,
                context=context,
                execution_result=exec_result
            )
            execution_log["reasoning"] = reasoning_result.get("log", "")
            raw_response = reasoning_result.get("response", "")
            
            # STEP 5: Persona Agent - Format Response
            logger.info("\n[STEP 5/5] Persona Agent")
            persona_result = self.persona.format_response(raw_response, persona)
            execution_log["persona"] = persona_result.get("log", "")
            final_response = persona_result.get("response", raw_response)
            
            logger.info("\n" + "=" * 60)
            logger.info("✅ Pipeline Complete!")
            logger.info("=" * 60)
            
            return {
                "success": True,
                "response": final_response,
                "agent_tag": f"{intent}-agent",
                "execution_log": execution_log
            }
            
        except Exception as e:
            logger.error(f"❌ Pipeline error: {str(e)}")
            return {
                "success": False,
                "response": "I apologize, but I encountered an error processing your request.",
                "agent_tag": "error",
                "execution_log": {
                    "error": str(e)
                }
            }
    
    def get_system_status(self) -> Dict[str, Any]:
        """Get status of all agents"""
        ollama_connected = self.test_ollama_connection()
        
        return {
            "ollama_connected": ollama_connected,
            "agents_ready": {
                "router": ollama_connected,
                "rag": True,  # RAG doesn't depend on Ollama
                "execution": ollama_connected,
                "reasoning": ollama_connected,
                "persona": ollama_connected
            },
            "model": self.model,
            "ollama_url": self.ollama.base_url
        }
