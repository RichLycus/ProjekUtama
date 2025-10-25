"""RAG Agent Wrapper - Wraps existing RAGAgent for flow system"""

from typing import Dict, Any
import logging

from .base import BaseAgent
from ..flow.context import ExecutionContext

logger = logging.getLogger(__name__)


class RAGAgentWrapper(BaseAgent):
    """
    Wrapper for existing RAGAgent.
    
    Retrieves relevant context from tools, docs, and history.
    Uses existing RAGAgent from ai.agents module (single file).
    
    Config options:
        - db_manager: Database manager instance (optional)
        - max_sources (int): Maximum sources to retrieve (default: 5)
    
    Example:
        ```python
        agent = RAGAgentWrapper(config={"max_sources": 5})
        
        context = ExecutionContext({
            "message": "How do I use Python tools?",
            "intent": "code"
        })
        context = agent.run(context)
        
        # Retrieved context available
        print(context.get("rag_context"))
        ```
    """
    
    def __init__(self, config: Dict[str, Any] = None):
        """Initialize RAG wrapper."""
        super().__init__(config)
        self.agent_name = "rag"
        
        # Import from parent module
        import ai.legacy_agents as agents_module
        
        # Get db_manager from config if provided
        db_manager = self.config.get("db_manager")
        
        # Initialize RAGAgent
        self.rag = agents_module.RAGAgent(db_manager)
        
        logger.info(f"[{self.agent_name}] Initialized")
    
    def run(self, context: ExecutionContext) -> ExecutionContext:
        """
        Retrieve relevant context.
        
        Args:
            context: Execution context with 'message' and 'intent'
        
        Returns:
            Updated context with 'rag_context', 'rag_sources', 'rag_log'
        """
        # Get input
        message = context.get("processed_message") or context.get("message", "")
        intent = context.get("intent", "general")
        
        if not message:
            logger.warning(f"[{self.agent_name}] No message for retrieval")
            context.set("rag_context", "")
            context.set("rag_sources", [])
            return context
        
        logger.info(f"[{self.agent_name}] Retrieving context (intent: {intent})...")
        
        # Call existing RAGAgent
        result = self.rag.retrieve_context(message, intent)
        
        # Extract results
        rag_context = result.get("context", "")
        sources = result.get("sources", [])
        log = result.get("log", "")
        
        # Store in context
        context.set("rag_context", rag_context)
        context.set("rag_sources", sources)
        context.set("rag_log", log)
        
        # Store output for tracking
        output = {
            "context": rag_context,
            "sources": sources,
            "source_count": len(sources),
            "log": log,
            "success": result.get("success", False)
        }
        context.agent_outputs[self.agent_name] = output
        
        logger.info(f"[{self.agent_name}] Retrieved {len(sources)} sources")
        
        return context
    
    def validate_input(self, context: ExecutionContext) -> bool:
        """Validate that message exists."""
        return "message" in context.data or "processed_message" in context.data
