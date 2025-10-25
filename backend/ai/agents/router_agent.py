"""Router Agent Wrapper - Wraps existing RouterAgent for flow system"""

from typing import Dict, Any
import logging
import sys
from pathlib import Path

from .base import BaseAgent
from ..flow.context import ExecutionContext

logger = logging.getLogger(__name__)


class RouterAgentWrapper(BaseAgent):
    """
    Wrapper for existing RouterAgent.
    
    Classifies user intent: code/creative/tool/general
    Uses existing RouterAgent from ai.agents module (single file).
    
    Config options:
        - model (str): Model to use (default: from config_manager)
    
    Example:
        ```python
        agent = RouterAgentWrapper(config={"model": "gemma2:2b"})
        
        context = ExecutionContext({"message": "How do I write a Python function?"})
        context = agent.run(context)
        
        # Result: "code"
        print(context.get("intent"))
        ```
    """
    
    def __init__(self, config: Dict[str, Any] = None):
        """Initialize router wrapper."""
        super().__init__(config)
        self.agent_name = "router"
        
        # Import from parent module (must be done at runtime to avoid circular import)
        # ai.agents refers to /app/backend/ai/agents.py file
        import ai.legacy_agents as agents_module
        import ai.ollama_client as ollama_module
        import ai.config_manager as config_module
        
        # Get configuration
        config_manager = config_module.AIConfigManager()
        ollama_url = config_manager.get_ollama_url()
        model = self.config.get("model") or config_manager.get_model()
        
        # Initialize Ollama client and router
        self.ollama = ollama_module.OllamaClient(ollama_url)
        self.router = agents_module.RouterAgent(self.ollama, model)
        
        logger.info(f"[{self.agent_name}] Initialized with model: {model}")
    
    def run(self, context: ExecutionContext) -> ExecutionContext:
        """
        Classify user intent.
        
        Args:
            context: Execution context with 'message' or 'processed_message'
        
        Returns:
            Updated context with 'intent' and 'router_log'
        """
        # Get input message (prefer processed_message if available)
        message = context.get("processed_message") or context.get("message", "")
        
        if not message:
            logger.warning(f"[{self.agent_name}] No message to classify")
            context.set("intent", "general")
            return context
        
        logger.info(f"[{self.agent_name}] Classifying intent...")
        
        # Call existing RouterAgent
        result = self.router.classify_intent(message)
        
        # Extract results
        intent = result.get("intent", "general")
        log = result.get("log", "")
        
        # Store in context
        context.set("intent", intent)
        context.set("router_log", log)
        
        # Store output for tracking
        output = {
            "intent": intent,
            "log": log,
            "success": result.get("success", False)
        }
        context.agent_outputs[self.agent_name] = output
        
        logger.info(f"[{self.agent_name}] Intent: {intent}")
        
        return context
    
    def validate_input(self, context: ExecutionContext) -> bool:
        """Validate that message exists."""
        return "message" in context.data or "processed_message" in context.data
