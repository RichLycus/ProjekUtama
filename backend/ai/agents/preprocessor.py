"""Preprocessor Agent - Simple text preprocessing"""

from typing import Dict, Any
import logging
import re

from .base import BaseAgent
from ..flow.context import ExecutionContext

logger = logging.getLogger(__name__)


class PreprocessorAgent(BaseAgent):
    """
    Preprocessor Agent for text cleaning and normalization.
    
    Operations:
    - Strip whitespace
    - Normalize newlines
    - Remove extra spaces
    - Optional: lowercase/uppercase
    - Optional: remove special chars
    
    Config options:
        - lowercase (bool): Convert to lowercase (default: False)
        - uppercase (bool): Convert to uppercase (default: False)
        - remove_special_chars (bool): Remove special characters (default: False)
        - normalize_whitespace (bool): Normalize whitespace (default: True)
        - max_length (int): Maximum length (default: None)
    
    Example:
        ```python
        agent = PreprocessorAgent(config={
            "lowercase": True,
            "normalize_whitespace": True,
            "max_length": 1000
        })
        
        context = ExecutionContext({"message": "  Hello   World!  "})
        context = agent.run(context)
        
        # Result: "hello world!"
        print(context.get("processed_message"))
        ```
    """
    
    def __init__(self, config: Dict[str, Any] = None):
        """Initialize preprocessor with config."""
        super().__init__(config)
        self.agent_name = "preprocessor"
    
    def run(self, context: ExecutionContext) -> ExecutionContext:
        """
        Preprocess message.
        
        Args:
            context: Execution context with 'message' key
        
        Returns:
            Updated context with 'processed_message' key
        """
        # Get input message
        message = context.get("message", "")
        
        if not message:
            logger.warning(f"[{self.agent_name}] No message to preprocess")
            context.set("processed_message", "")
            return context
        
        # Start preprocessing
        processed = message
        
        # Strip leading/trailing whitespace
        processed = processed.strip()
        
        # Normalize whitespace if enabled
        if self.config.get("normalize_whitespace", True):
            # Replace multiple spaces with single space
            processed = re.sub(r'\s+', ' ', processed)
            # Normalize newlines
            processed = re.sub(r'\n+', '\n', processed)
        
        # Remove special characters if enabled
        if self.config.get("remove_special_chars", False):
            # Keep alphanumeric, spaces, and basic punctuation
            processed = re.sub(r'[^a-zA-Z0-9\s.,!?-]', '', processed)
        
        # Convert case
        if self.config.get("lowercase", False):
            processed = processed.lower()
        elif self.config.get("uppercase", False):
            processed = processed.upper()
        
        # Truncate if max_length specified
        max_length = self.config.get("max_length")
        if max_length and len(processed) > max_length:
            processed = processed[:max_length]
            logger.info(f"[{self.agent_name}] Truncated to {max_length} chars")
        
        # Store result
        context.set("processed_message", processed)
        
        # Store output for tracking
        output = {
            "original": message,
            "processed": processed,
            "original_length": len(message),
            "processed_length": len(processed),
            "operations": {
                "lowercase": self.config.get("lowercase", False),
                "uppercase": self.config.get("uppercase", False),
                "remove_special_chars": self.config.get("remove_special_chars", False),
                "normalize_whitespace": self.config.get("normalize_whitespace", True),
                "truncated": max_length and len(message) > max_length
            }
        }
        context.agent_outputs[self.agent_name] = output
        
        logger.info(f"[{self.agent_name}] Processed: {len(message)} → {len(processed)} chars")
        
        return context
    
    def validate_input(self, context: ExecutionContext) -> bool:
        """Validate that message exists."""
        return "message" in context.data
