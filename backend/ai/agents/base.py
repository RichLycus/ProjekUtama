"""
Base Agent Interface

Defines the contract that all agent plugins must follow.
Each agent is an independent, composable unit that can be used in flows.
"""

from abc import ABC, abstractmethod
from typing import Dict, Any, Optional
import time
import logging

# Import ExecutionContext (will be created)
try:
    from ai.flow.context import ExecutionContext
except ImportError:
    # Fallback for tests
    ExecutionContext = Any

logger = logging.getLogger(__name__)


class BaseAgent(ABC):
    """
    Base interface for all agent plugins.
    
    An agent is a self-contained unit that:
    - Reads data from ExecutionContext
    - Performs some operation (preprocess, retrieve, generate, etc.)
    - Writes results back to ExecutionContext
    - Logs execution metadata
    
    Example Implementation:
        ```python
        class PreprocessorAgent(BaseAgent):
            def run(self, context: ExecutionContext) -> ExecutionContext:
                message = context.get("message", "")
                processed = message.strip().lower()
                context.set("processed_message", processed)
                return context
        ```
    
    Example Usage:
        ```python
        agent = PreprocessorAgent(config={"normalize": True})
        context = ExecutionContext({"message": "Hello World"})
        context = agent.run(context)
        print(context.get("processed_message"))  # "hello world"
        ```
    """
    
    def __init__(self, config: Optional[Dict[str, Any]] = None):
        """
        Initialize agent with configuration.
        
        Args:
            config: Agent-specific configuration from flow JSON
        """
        self.config = config or {}
        self.name = self.__class__.__name__
        self.version = "1.0.0"
    
    @abstractmethod
    def run(self, context: ExecutionContext) -> ExecutionContext:
        """
        Execute agent logic and update context.
        
        This is the main method that must be implemented by all agents.
        
        Args:
            context: Current execution context with input data
        
        Returns:
            Updated execution context with agent output
        
        Raises:
            Exception: If agent execution fails
        """
        pass
    
    def should_run(self, context: ExecutionContext) -> bool:
        """
        Check if agent should run based on conditions.
        
        Override this method to implement conditional execution.
        For example:
        - Skip if cache hit
        - Skip if certain flags are set
        - Skip if required data is missing
        
        Args:
            context: Current execution context
        
        Returns:
            True if agent should run, False to skip
        """
        return True
    
    def validate_input(self, context: ExecutionContext) -> bool:
        """
        Validate required input fields exist in context.
        
        Override this method to check for required data before execution.
        
        Args:
            context: Current execution context
        
        Returns:
            True if input is valid, False otherwise
        """
        return True
    
    def execute(self, context: ExecutionContext) -> ExecutionContext:
        """
        Execute agent with timing and error handling.
        
        This is a wrapper around run() that handles:
        - Timing measurement
        - Logging
        - Error handling
        - Metadata updates
        
        Do not override this method - override run() instead.
        
        Args:
            context: Execution context
        
        Returns:
            Updated context
        """
        start_time = time.time()
        
        try:
            # Check if should run
            if not self.should_run(context):
                logger.info(f"⏭️ Skipping agent: {self.name}")
                context.log_step(self.name, 0, status="skipped")
                return context
            
            # Validate input
            if not self.validate_input(context):
                error_msg = f"Input validation failed for {self.name}"
                logger.error(f"❌ {error_msg}")
                context.add_error(self.name, error_msg)
                context.log_step(self.name, time.time() - start_time, status="error")
                return context
            
            # Execute agent
            logger.info(f"🔄 Executing agent: {self.name}")
            context = self.run(context)
            
            # Log success
            elapsed = time.time() - start_time
            logger.info(f"✅ Agent completed: {self.name} ({elapsed:.3f}s)")
            context.log_step(self.name, elapsed, status="success")
            
            return context
            
        except Exception as e:
            elapsed = time.time() - start_time
            error_msg = f"Agent execution failed: {str(e)}"
            logger.error(f"❌ {self.name}: {error_msg}")
            context.add_error(self.name, error_msg)
            context.log_step(self.name, elapsed, status="error")
            
            # Re-raise if critical
            if self.config.get("critical", False):
                raise
            
            return context
    
    def get_metadata(self) -> Dict[str, Any]:
        """
        Return agent metadata for observability.
        
        Returns:
            Metadata dict with agent info
        """
        return {
            "name": self.name,
            "version": self.version,
            "config": self.config,
            "type": "agent"
        }
    
    def __repr__(self) -> str:
        """String representation of agent."""
        return f"{self.name}(config={self.config})"
