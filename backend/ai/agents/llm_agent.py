"""LLM Agent - Core LLM processing with Ollama fallback strategy"""

from typing import Dict, Any, Optional
import logging
import time

from .base import BaseAgent
from ..flow.context import ExecutionContext

logger = logging.getLogger(__name__)


class LLMAgent(BaseAgent):
    """
    LLM Agent with smart fallback strategy.
    
    **Fallback Strategy:**
    1. Try to connect to Ollama on initialization
    2. If Ollama unavailable → Switch to Mock Mode automatically
    3. Mock Mode generates deterministic responses for testing
    4. Clear logging indicates which mode is active
    
    This allows:
    - Docker/CI environments to run without Ollama
    - Development without local Ollama installation
    - Production automatically uses real Ollama when available
    - Graceful degradation instead of crashes
    
    Config options:
        - model (str): Model to use (default: from config_manager)
        - temperature (float): Temperature for generation (default: 0.7)
        - max_tokens (int): Maximum tokens to generate (default: 2000)
        - force_mock (bool): Force mock mode even if Ollama available (default: False)
    
    Example:
        ```python
        # Automatic detection
        agent = LLMAgent(config={"model": "gemma2:2b"})
        
        context = ExecutionContext({"message": "Hello"})
        context = agent.run(context)
        
        # Check mode
        output = context.agent_outputs["llm_agent"]
        print(f"Mode: {output['mode']}")  # 'real' or 'mock'
        ```
    """
    
    def __init__(self, config: Dict[str, Any] = None):
        """Initialize LLM agent with fallback detection."""
        super().__init__(config)
        self.agent_name = "llm_agent"
        
        # Check if force mock mode
        self.force_mock = self.config.get("force_mock", False)
        
        # Try to initialize real Ollama
        self.mode = "mock"  # Default to mock
        self.ollama = None
        self.reasoning = None
        self.model = self.config.get("model", "gemma2:2b")
        self.temperature = self.config.get("temperature", 0.7)
        self.max_tokens = self.config.get("max_tokens", 2000)
        
        if not self.force_mock:
            try:
                # Try to import and initialize Ollama
                import ai.legacy_agents as agents_module
                import ai.ollama_client as ollama_module
                import ai.config_manager as config_module
                
                # Get configuration
                config_manager = config_module.AIConfigManager()
                ollama_url = config_manager.get_ollama_url()
                
                # Override model if provided in config
                if not self.config.get("model"):
                    self.model = config_manager.get_model()
                
                # Initialize Ollama client
                self.ollama = ollama_module.OllamaClient(ollama_url)
                
                # Test connection
                logger.info(f"[{self.agent_name}] Testing Ollama connection at {ollama_url}...")
                if self.ollama.test_connection():
                    # Success! Use real mode
                    self.reasoning = agents_module.ReasoningAgent(self.ollama, self.model)
                    self.mode = "real"
                    logger.info(f"✅ [{self.agent_name}] Ollama connected! Using REAL mode (model: {self.model})")
                else:
                    # Connection failed, fallback to mock
                    logger.warning(f"⚠️  [{self.agent_name}] Ollama not responding - Switching to MOCK mode")
                    self.ollama = None
                    self.reasoning = None
            
            except ImportError as e:
                logger.warning(f"⚠️  [{self.agent_name}] Failed to import Ollama modules: {e}")
                logger.warning(f"    Switching to MOCK mode")
            
            except Exception as e:
                logger.warning(f"⚠️  [{self.agent_name}] Ollama initialization failed: {e}")
                logger.warning(f"    Switching to MOCK mode")
        else:
            logger.info(f"[{self.agent_name}] Force mock mode enabled")
        
        # Log final mode
        if self.mode == "mock":
            logger.info(f"🎭 [{self.agent_name}] Running in MOCK mode (testing/development)")
            logger.info(f"    - Responses will be deterministic")
            logger.info(f"    - Install & start Ollama for real inference")
    
    def run(self, context: ExecutionContext) -> ExecutionContext:
        """
        Generate LLM response (real or mock based on availability).
        
        Args:
            context: Execution context with 'message', optional 'intent', 'rag_context'
        
        Returns:
            Updated context with 'llm_response', 'llm_log', 'llm_mode'
        """
        # Get input
        message = context.get("processed_message") or context.get("message", "")
        
        if not message:
            logger.warning(f"[{self.agent_name}] No message for LLM processing")
            context.set("llm_response", "")
            context.set("llm_mode", self.mode)
            return context
        
        logger.info(f"[{self.agent_name}] Generating response (mode: {self.mode}, model: {self.model})...")
        
        start_time = time.time()
        
        if self.mode == "real":
            # Use real Ollama
            result = self._generate_real(context, message)
        else:
            # Use mock mode
            result = self._generate_mock(context, message)
        
        elapsed = time.time() - start_time
        
        # Extract results
        llm_response = result.get("response", "")
        log = result.get("log", "")
        success = result.get("success", False)
        
        # Store in context
        context.set("llm_response", llm_response)
        context.set("llm_log", log)
        context.set("llm_mode", self.mode)
        
        # Store output for tracking
        output = {
            "response": llm_response,
            "log": log,
            "mode": self.mode,
            "model": self.model,
            "temperature": self.temperature,
            "max_tokens": self.max_tokens,
            "response_length": len(llm_response),
            "success": success,
            "elapsed_time": elapsed
        }
        context.agent_outputs[self.agent_name] = output
        
        logger.info(f"[{self.agent_name}] Generated {len(llm_response)} chars in {elapsed:.2f}s")
        
        return context
    
    def _generate_real(self, context: ExecutionContext, message: str) -> Dict[str, Any]:
        """
        Generate response using real Ollama.
        
        Args:
            context: Execution context
            message: User message
        
        Returns:
            Response dict with success, response, log
        """
        intent = context.get("intent", "general")
        rag_context = context.get("rag_context", "")
        execution_result = {
            "should_execute": context.get("should_execute", False),
            "tool_name": context.get("tool_name", "")
        }
        
        try:
            # Call existing ReasoningAgent
            result = self.reasoning.process(
                user_input=message,
                intent=intent,
                context=rag_context,
                execution_result=execution_result
            )
            return result
        
        except Exception as e:
            logger.error(f"[{self.agent_name}] Real mode generation failed: {e}")
            # Fallback to error response
            return {
                "success": False,
                "response": "I apologize, but I encountered an error generating a response.",
                "log": f"Error: {str(e)}"
            }
    
    def _generate_mock(self, context: ExecutionContext, message: str) -> Dict[str, Any]:
        """
        Generate mock response for testing.
        
        Args:
            context: Execution context
            message: User message
        
        Returns:
            Response dict with success, response, log
        """
        intent = context.get("intent", "general")
        rag_context = context.get("rag_context", "")
        
        # Generate deterministic mock response
        # This allows testing the entire pipeline without Ollama
        
        if intent == "code":
            response = f"""Here's a code example for: {message[:50]}

```python
# Mock code example
def example_function():
    '''Demonstrating the concept'''
    return "This is a mock response for testing"

result = example_function()
print(result)
```

This is a **mock response** generated for testing purposes.
Install and start Ollama for real AI-powered responses."""
        
        elif intent == "tool":
            response = f"""I understand you want to use a tool: {message[:50]}

In production mode (with Ollama), I would execute the appropriate tool and provide real results.

This is a **mock response** for testing the flow system without requiring Ollama."""
        
        else:
            # General response
            response = f"""Thank you for your message: "{message[:100]}{'...' if len(message) > 100 else ''}"

This is a **mock response** generated by ChimeraAI's testing system.

**Context:**
- Intent: {intent}
- Has RAG context: {bool(rag_context)}
- Message length: {len(message)} characters

To get real AI-powered responses:
1. Install Ollama: https://ollama.ai
2. Start Ollama service
3. Pull a model: `ollama pull {self.model}`
4. Restart ChimeraAI - it will auto-detect Ollama!

The system will automatically switch from mock mode to real mode when Ollama is available."""
        
        return {
            "success": True,
            "response": response,
            "log": f"Generated mock response ({len(response)} chars) - Intent: {intent}"
        }
    
    def validate_input(self, context: ExecutionContext) -> bool:
        """Validate that message exists."""
        return "message" in context.data or "processed_message" in context.data
    
    def get_metadata(self) -> Dict[str, Any]:
        """Return agent metadata with mode information."""
        metadata = super().get_metadata()
        metadata.update({
            "mode": self.mode,
            "model": self.model,
            "ollama_available": self.mode == "real",
            "fallback_enabled": True
        })
        return metadata
