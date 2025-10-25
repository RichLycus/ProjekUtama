"""Execution Agent Wrapper - Wraps existing ExecutionAgent for flow system"""

from typing import Dict, Any
import logging

from .base import BaseAgent
from ..flow.context import ExecutionContext

logger = logging.getLogger(__name__)


class ExecutionAgentWrapper(BaseAgent):
    """
    Wrapper for existing ExecutionAgent.
    
    Decides if tools need to be executed and runs them.
    Uses existing ExecutionAgent from ai.agents module (single file).
    
    Config options:
        - model (str): Model to use (default: from config_manager)
    
    Example:
        ```python
        agent = ExecutionAgentWrapper(config={"model": "gemma2:2b"})
        
        context = ExecutionContext({
            "message": "Run the formatter tool",
            "intent": "tool",
            "rag_context": "Available tools: formatter"
        })
        context = agent.run(context)
        
        # Check if tool execution needed
        print(context.get("should_execute"))
        ```
    """
    
    def __init__(self, config: Dict[str, Any] = None):
        """Initialize execution wrapper."""
        super().__init__(config)
        self.agent_name = "execution"
        
        # Import from parent module
        import ai.legacy_agents as agents_module
        import ai.ollama_client as ollama_module
        import ai.config_manager as config_module
        
        # Get configuration
        config_manager = config_module.AIConfigManager()
        ollama_url = config_manager.get_ollama_url()
        model = self.config.get("model") or config_manager.get_model()
        
        # Initialize Ollama client and execution agent
        self.ollama = ollama_module.OllamaClient(ollama_url)
        self.execution = agents_module.ExecutionAgent(self.ollama, model)
        
        logger.info(f"[{self.agent_name}] Initialized with model: {model}")
    
    def run(self, context: ExecutionContext) -> ExecutionContext:
        """
        Check if tool execution is needed.
        
        Args:
            context: Execution context with 'message', 'intent', 'rag_context'
        
        Returns:
            Updated context with 'should_execute', 'tool_name', 'execution_log'
        """
        # Get input
        message = context.get("processed_message") or context.get("message", "")
        intent = context.get("intent", "general")
        rag_context = context.get("rag_context", "")
        
        if not message:
            logger.warning(f"[{self.agent_name}] No message for execution check")
            context.set("should_execute", False)
            return context
        
        logger.info(f"[{self.agent_name}] Checking tool execution...")
        
        # Call existing ExecutionAgent
        result = self.execution.should_execute_tool(message, intent, rag_context)
        
        # Extract results
        should_execute = result.get("should_execute", False)
        tool_name = result.get("tool_name", "")
        log = result.get("log", "")
        
        # Store in context
        context.set("should_execute", should_execute)
        context.set("tool_name", tool_name)
        context.set("execution_log", log)
        
        # Store output for tracking
        output = {
            "should_execute": should_execute,
            "tool_name": tool_name,
            "log": log,
            "success": result.get("success", False)
        }
        context.agent_outputs[self.agent_name] = output
        
        logger.info(f"[{self.agent_name}] Should execute: {should_execute}")
        
        return context
    
    def validate_input(self, context: ExecutionContext) -> bool:
        """Validate that message exists."""
        return "message" in context.data or "processed_message" in context.data
