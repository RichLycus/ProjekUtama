"""Cache Store Agent - Simple in-memory cache storage"""

from typing import Dict, Any
import logging
import hashlib
import time

from .base import BaseAgent
from ..flow.context import ExecutionContext

# Import shared cache store
from .cache_lookup import _CACHE_STORE

logger = logging.getLogger(__name__)


class CacheStoreAgent(BaseAgent):
    """
    Simple in-memory cache storage agent.
    
    Stores response in cache for future lookups.
    Works in conjunction with CacheLookupAgent.
    
    Config options:
        - cache_key_field (str): Field to use as cache key (default: "message")
        - response_field (str): Field to cache (default: "llm_response")
        - ttl (int): Time to live in seconds (default: 3600 = 1 hour)
        - store_metadata (bool): Store additional metadata (default: True)
    
    Example:
        ```python
        agent = CacheStoreAgent(config={
            "cache_key_field": "message",
            "response_field": "llm_response",
            "ttl": 3600
        })
        
        context = ExecutionContext({
            "message": "What is Python?",
            "llm_response": "Python is a programming language."
        })
        context = agent.run(context)
        
        # Response now cached
        ```
    """
    
    def __init__(self, config: Dict[str, Any] = None):
        """Initialize cache store agent."""
        super().__init__(config)
        self.agent_name = "cache_store"
        self.cache_key_field = self.config.get("cache_key_field", "message")
        self.response_field = self.config.get("response_field", "llm_response")
        self.ttl = self.config.get("ttl", 3600)
        self.store_metadata = self.config.get("store_metadata", True)
    
    def run(self, context: ExecutionContext) -> ExecutionContext:
        """
        Store response in cache.
        
        Args:
            context: Execution context with cache_key_field and response_field
        
        Returns:
            Updated context (no changes, just stores in cache)
        """
        # Get cache key value
        key_value = context.get(self.cache_key_field, "")
        
        if not key_value:
            logger.warning(f"[{self.agent_name}] No value for cache key field '{self.cache_key_field}'")
            return context
        
        # Get response to cache
        response = context.get(self.response_field, "")
        
        if not response:
            logger.warning(f"[{self.agent_name}] No response to cache (field: '{self.response_field}')")
            return context
        
        # Generate cache key
        cache_key = self._generate_cache_key(key_value)
        
        logger.info(f"[{self.agent_name}] Storing in cache (key: {cache_key[:16]}...)")
        
        # Prepare cache entry
        cache_entry = {
            "response": response,
            "stored_at": time.time(),
            "ttl": self.ttl
        }
        
        # Add metadata if enabled
        if self.store_metadata:
            cache_entry["metadata"] = {
                "response_length": len(response),
                "cache_key_field": self.cache_key_field,
                "response_field": self.response_field,
                "intent": context.get("intent", "unknown"),
                "persona": context.get("persona_name", "unknown")
            }
        
        # Store in cache
        _CACHE_STORE[cache_key] = cache_entry
        
        logger.info(f"[{self.agent_name}] Stored successfully (TTL: {self.ttl}s)")
        
        # Store output for tracking
        output = {
            "cached": True,
            "cache_key": cache_key,
            "response_length": len(response),
            "ttl": self.ttl,
            "stored_at": cache_entry["stored_at"],
            "metadata": cache_entry.get("metadata", {})
        }
        context.agent_outputs[self.agent_name] = output
        
        return context
    
    def validate_input(self, context: ExecutionContext) -> bool:
        """Validate that cache key field and response field exist."""
        return (
            self.cache_key_field in context.data and 
            self.response_field in context.data
        )
    
    def _generate_cache_key(self, value: str) -> str:
        """Generate cache key from value."""
        # Use SHA256 hash of the value
        return hashlib.sha256(value.encode()).hexdigest()
    
    @staticmethod
    def get_cache_size() -> int:
        """Get current cache size."""
        return len(_CACHE_STORE)
    
    @staticmethod
    def clear_expired(current_time: float = None) -> int:
        """Clear expired cache entries."""
        if current_time is None:
            current_time = time.time()
        
        expired_keys = []
        for key, entry in _CACHE_STORE.items():
            stored_at = entry.get("stored_at", 0)
            ttl = entry.get("ttl", 3600)
            if current_time - stored_at > ttl:
                expired_keys.append(key)
        
        for key in expired_keys:
            del _CACHE_STORE[key]
        
        if expired_keys:
            logger.info(f"[cache] Cleared {len(expired_keys)} expired entries")
        
        return len(expired_keys)
