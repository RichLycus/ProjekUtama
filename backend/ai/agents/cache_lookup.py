"""Cache Lookup Agent - Simple in-memory cache lookup"""

from typing import Dict, Any, Optional
import logging
import hashlib
import time

from .base import BaseAgent
from ..flow.context import ExecutionContext

logger = logging.getLogger(__name__)


# Global in-memory cache (shared across instances)
_CACHE_STORE: Dict[str, Dict[str, Any]] = {}


class CacheLookupAgent(BaseAgent):
    """
    Simple in-memory cache lookup agent.
    
    Checks if a response is cached for the given message.
    Sets 'cache_hit' flag for conditional flow execution.
    
    Cache Structure:
    {
        "cache_key": {
            "response": "cached response text",
            "stored_at": timestamp,
            "ttl": 3600,
            "metadata": {...}
        }
    }
    
    Config options:
        - cache_key_field (str): Field to use as cache key (default: "message")
        - ttl_check (bool): Check TTL expiration (default: True)
    
    Example:
        ```python
        agent = CacheLookupAgent(config={"cache_key_field": "message"})
        
        context = ExecutionContext({"message": "What is Python?"})
        context = agent.run(context)
        
        # Check cache hit
        if context.get_flag("cache_hit"):
            print(context.get("cached_response"))
        ```
    """
    
    def __init__(self, config: Dict[str, Any] = None):
        """Initialize cache lookup agent."""
        super().__init__(config)
        self.agent_name = "cache_lookup"
        self.cache_key_field = self.config.get("cache_key_field", "message")
        self.ttl_check = self.config.get("ttl_check", True)
    
    def run(self, context: ExecutionContext) -> ExecutionContext:
        """
        Look up cached response.
        
        Args:
            context: Execution context with cache_key_field
        
        Returns:
            Updated context with 'cached_response' and 'cache_hit' flag
        """
        # Get cache key value
        key_value = context.get(self.cache_key_field, "")
        
        if not key_value:
            logger.warning(f"[{self.agent_name}] No value for cache key field '{self.cache_key_field}'")
            context.set_flag("cache_hit", False)
            return context
        
        # Generate cache key (hash of the value)
        cache_key = self._generate_cache_key(key_value)
        
        logger.info(f"[{self.agent_name}] Looking up cache key: {cache_key[:16]}...")
        
        # Check if cached
        if cache_key in _CACHE_STORE:
            cache_entry = _CACHE_STORE[cache_key]
            
            # Check TTL if enabled
            if self.ttl_check:
                stored_at = cache_entry.get("stored_at", 0)
                ttl = cache_entry.get("ttl", 3600)
                current_time = time.time()
                
                if current_time - stored_at > ttl:
                    # Cache expired
                    logger.info(f"[{self.agent_name}] Cache EXPIRED (TTL: {ttl}s)")
                    del _CACHE_STORE[cache_key]
                    context.set_flag("cache_hit", False)
                    
                    output = {
                        "cache_hit": False,
                        "reason": "expired",
                        "cache_key": cache_key
                    }
                    context.agent_outputs[self.agent_name] = output
                    return context
            
            # Cache hit!
            cached_response = cache_entry.get("response", "")
            context.set("cached_response", cached_response)
            context.set_flag("cache_hit", True)
            
            logger.info(f"[{self.agent_name}] Cache HIT! ({len(cached_response)} chars)")
            
            output = {
                "cache_hit": True,
                "response": cached_response,
                "cache_key": cache_key,
                "stored_at": cache_entry.get("stored_at"),
                "ttl": cache_entry.get("ttl"),
                "metadata": cache_entry.get("metadata", {})
            }
            context.agent_outputs[self.agent_name] = output
        else:
            # Cache miss
            logger.info(f"[{self.agent_name}] Cache MISS")
            context.set_flag("cache_hit", False)
            
            output = {
                "cache_hit": False,
                "reason": "not_found",
                "cache_key": cache_key
            }
            context.agent_outputs[self.agent_name] = output
        
        return context
    
    def validate_input(self, context: ExecutionContext) -> bool:
        """Validate that cache key field exists."""
        return self.cache_key_field in context.data
    
    def _generate_cache_key(self, value: str) -> str:
        """Generate cache key from value."""
        # Use SHA256 hash of the value
        return hashlib.sha256(value.encode()).hexdigest()
    
    @staticmethod
    def get_cache_stats() -> Dict[str, Any]:
        """Get cache statistics."""
        return {
            "total_entries": len(_CACHE_STORE),
            "cache_keys": list(_CACHE_STORE.keys())
        }
    
    @staticmethod
    def clear_cache() -> None:
        """Clear all cached entries."""
        _CACHE_STORE.clear()
        logger.info("[cache] All cache entries cleared")
