"""
Mock Agents for Testing

Simple mock agents for testing flow execution without real implementations.
These agents will be replaced with real implementations in Phase 6.7.4.
"""

from typing import Dict, Any
import sys
from pathlib import Path
import logging

# Add backend to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent))

from ai.agents.base import BaseAgent
from ai.flow.context import ExecutionContext

logger = logging.getLogger(__name__)


class MockPreprocessorAgent(BaseAgent):
    """
    Mock preprocessor agent.
    
    Simply uppercases the input message for testing.
    """
    
    def __init__(self, config: Dict[str, Any] = None):
        """Initialize with config."""
        super().__init__(config=config)
        self.agent_name = "preprocessor"
    
    def run(self, context: ExecutionContext) -> ExecutionContext:
        """
        Preprocess message by converting to uppercase.
        
        Args:
            context: Execution context
        
        Returns:
            Updated context with processed message
        """
        message = context.get("message", "")
        processed = message.upper()
        
        context.set("processed_message", processed)
        
        # Store output for tracking
        output = {
            "original": message,
            "processed": processed,
            "length": len(processed)
        }
        context.agent_outputs[self.agent_name] = output
        
        logger.info(f"[{self.agent_name}] Processed: '{message}' -> '{processed}'")
        
        return context


class MockLLMAgent(BaseAgent):
    """
    Mock LLM agent.
    
    Generates a simple mock response based on input.
    """
    
    def __init__(self, config: Dict[str, Any] = None):
        """Initialize with config."""
        super().__init__(config=config)
        self.agent_name = "llm_simple"
    
    def run(self, context: ExecutionContext) -> ExecutionContext:
        """
        Generate mock LLM response.
        
        Args:
            context: Execution context
        
        Returns:
            Updated context with generated response
        """
        message = context.get("processed_message") or context.get("message", "")
        model = self.config.get("model", "mock-llm")
        temperature = self.config.get("temperature", 0.7)
        
        # Generate mock response
        response = f"Mock response to: {message} (model: {model}, temp: {temperature})"
        
        context.set("llm_response", response)
        
        # Store output
        output = {
            "model": model,
            "temperature": temperature,
            "input": message,
            "response": response,
            "tokens": len(response.split())
        }
        context.agent_outputs[self.agent_name] = output
        
        logger.info(f"[{self.agent_name}] Generated response: '{response[:50]}...'")
        
        return context


class MockFormatterAgent(BaseAgent):
    """
    Mock formatter agent.
    
    Formats the final output.
    """
    
    def __init__(self, config: Dict[str, Any] = None):
        """Initialize with config."""
        super().__init__(config=config)
        self.agent_name = "formatter"
    
    def run(self, context: ExecutionContext) -> ExecutionContext:
        """
        Format final output.
        
        Args:
            context: Execution context
        
        Returns:
            Updated context with formatted output
        """
        response = context.get("llm_response") or context.get("cached_response", "")
        format_type = self.config.get("format", "text")
        include_metadata = self.config.get("include_metadata", False)
        
        # Format output
        if include_metadata:
            formatted = {
                "response": response,
                "format": format_type,
                "metadata": {
                    "total_time": context.get_total_time(),
                    "steps": len(context.metadata["steps_executed"])
                }
            }
        else:
            formatted = response
        
        context.set("output", formatted)
        
        # Store output
        output = {
            "format": format_type,
            "include_metadata": include_metadata,
            "output": formatted
        }
        context.agent_outputs[self.agent_name] = output
        
        logger.info(f"[{self.agent_name}] Formatted output: {format_type}")
        
        return context


class MockCacheLookupAgent(BaseAgent):
    """
    Mock cache lookup agent.
    
    Simulates cache hit/miss based on config.
    """
    
    def __init__(self, config: Dict[str, Any] = None):
        """Initialize with config."""
        super().__init__(config=config)
        self.agent_name = "cache_lookup"
    
    def run(self, context: ExecutionContext) -> ExecutionContext:
        """
        Simulate cache lookup.
        
        Args:
            context: Execution context
        
        Returns:
            Updated context with cache result
        """
        # Check if cache hit should be simulated
        simulate_hit = self.config.get("simulate_hit", False)
        
        if simulate_hit:
            # Cache hit
            cached_response = "Cached response from mock cache"
            context.set("cached_response", cached_response)
            context.set_flag("cache_hit", True)
            
            logger.info(f"[{self.agent_name}] Cache HIT")
        else:
            # Cache miss
            context.set_flag("cache_hit", False)
            logger.info(f"[{self.agent_name}] Cache MISS")
        
        # Store output
        output = {
            "cache_hit": simulate_hit,
            "response": context.get("cached_response") if simulate_hit else None
        }
        context.agent_outputs[self.agent_name] = output
        
        return context


class MockCacheStoreAgent(BaseAgent):
    """
    Mock cache store agent.
    
    Simulates storing response in cache.
    """
    
    def __init__(self, config: Dict[str, Any] = None):
        """Initialize with config."""
        super().__init__(config=config)
        self.agent_name = "cache_store"
    
    def run(self, context: ExecutionContext) -> ExecutionContext:
        """
        Simulate cache store.
        
        Args:
            context: Execution context
        
        Returns:
            Updated context
        """
        response = context.get("llm_response", "")
        ttl = self.config.get("ttl", 3600)
        
        logger.info(f"[{self.agent_name}] Stored in cache (TTL: {ttl}s)")
        
        # Store output
        output = {
            "stored": True,
            "ttl": ttl,
            "size": len(response)
        }
        context.agent_outputs[self.agent_name] = output
        
        return context


class MockErrorAgent(BaseAgent):
    """
    Mock agent that always fails.
    
    Used for testing error handling and retry logic.
    """
    
    def __init__(self, config: Dict[str, Any] = None):
        """Initialize with config."""
        super().__init__(config=config)
        self.agent_name = "error_agent"
    
    def run(self, context: ExecutionContext) -> ExecutionContext:
        """
        Always raise an error.
        
        Args:
            context: Execution context
        
        Returns:
            Never returns (always raises exception)
        
        Raises:
            RuntimeError: Always
        """
        error_message = self.config.get("error_message", "Mock error for testing")
        logger.error(f"[{self.agent_name}] Raising mock error: {error_message}")
        raise RuntimeError(error_message)


class MockErrorResponderAgent(BaseAgent):
    """
    Mock error responder agent.
    
    Handles errors gracefully by providing fallback response.
    """
    
    def __init__(self, config: Dict[str, Any] = None):
        """Initialize with config."""
        super().__init__(config=config)
        self.agent_name = "error_responder"
    
    def run(self, context: ExecutionContext) -> ExecutionContext:
        """
        Handle error with fallback response.
        
        Args:
            context: Execution context
        
        Returns:
            Updated context with error response
        """
        error = self.config.get("error", "Unknown error")
        fallback_message = self.config.get("message", "An error occurred")
        
        # Set fallback output
        context.set("output", fallback_message)
        
        logger.info(f"[{self.agent_name}] Error handled: {error}")
        
        # Store output
        output = {
            "error": error,
            "fallback_message": fallback_message
        }
        context.agent_outputs[self.agent_name] = output
        
        return context


# Helper function to register all mock agents
def register_mock_agents(registry):
    """
    Register all mock agents in the given registry.
    
    Args:
        registry: AgentRegistry instance
    """
    registry.register_agent("preprocessor", MockPreprocessorAgent)
    registry.register_agent("llm_simple", MockLLMAgent)
    registry.register_agent("formatter", MockFormatterAgent)
    registry.register_agent("cache_lookup", MockCacheLookupAgent)
    registry.register_agent("cache_store", MockCacheStoreAgent)
    registry.register_agent("error_agent", MockErrorAgent)
    registry.register_agent("error_responder", MockErrorResponderAgent)
    
    # Aliases for compatibility
    registry.register_agent("llm_agent", MockLLMAgent)
    registry.register_agent("persona_formatter", MockFormatterAgent)
