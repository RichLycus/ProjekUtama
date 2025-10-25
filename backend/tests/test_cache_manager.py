"""
Test Cache Manager (Phase 6.9.2)

Tests for CacheManager with SQLite backend.
"""

import pytest
import time
import os
from pathlib import Path
from ai.cache import CacheManager, CacheEntry, CacheStats


@pytest.fixture
def temp_cache():
    """Create temporary cache for testing."""
    test_db_path = "/tmp/test_cache.db"
    
    # Remove if exists
    if os.path.exists(test_db_path):
        os.remove(test_db_path)
    
    cache = CacheManager(config={
        "db_path": test_db_path,
        "max_entries": 100,
        "flash_ttl": 5,  # 5 seconds for testing
        "pro_ttl": 10,    # 10 seconds for testing
        "auto_cleanup": True
    })
    
    yield cache
    
    # Cleanup
    if os.path.exists(test_db_path):
        os.remove(test_db_path)


class TestCacheManager:
    """Test CacheManager functionality."""
    
    def test_init_default_config(self):
        """Test initialization with default config."""
        test_db = "/tmp/test_default_cache.db"
        if os.path.exists(test_db):
            os.remove(test_db)
        
        cache = CacheManager(config={"db_path": test_db})
        
        assert cache is not None
        assert cache.max_entries == 1000
        assert cache.flash_ttl == 900
        assert cache.pro_ttl == 3600
        assert cache.auto_cleanup is True
        
        # Cleanup
        if os.path.exists(test_db):
            os.remove(test_db)
    
    def test_generate_key_simple(self, temp_cache):
        """Test key generation from query only."""
        key1 = temp_cache.generate_key("What is Python?")
        key2 = temp_cache.generate_key("What is Python?")
        key3 = temp_cache.generate_key("What is JavaScript?")
        
        assert key1 == key2  # Same query = same key
        assert key1 != key3  # Different query = different key
        assert len(key1) == 64  # SHA256 hash length
    
    def test_generate_key_with_context(self, temp_cache):
        """Test key generation with context."""
        key1 = temp_cache.generate_key(
            "Hello", 
            context={"session_id": "user123", "mode": "flash"}
        )
        key2 = temp_cache.generate_key(
            "Hello", 
            context={"session_id": "user456", "mode": "flash"}
        )
        
        assert key1 != key2  # Different session = different key
    
    def test_set_and_get_flash(self, temp_cache):
        """Test set and get for Flash mode."""
        key = temp_cache.generate_key("test query")
        value = {"response": "This is a test response", "sources": []}
        
        # Set
        success = temp_cache.set(key, value, mode="flash")
        assert success is True
        
        # Get
        retrieved = temp_cache.get(key)
        assert retrieved is not None
        assert retrieved["response"] == "This is a test response"
    
    def test_set_and_get_pro(self, temp_cache):
        """Test set and get for Pro mode."""
        key = temp_cache.generate_key("complex query")
        value = {
            "response": "Detailed analysis...",
            "sources": [{"id": "1", "title": "Source 1"}],
            "reasoning": "Because..."
        }
        
        # Set
        success = temp_cache.set(key, value, mode="pro")
        assert success is True
        
        # Get
        retrieved = temp_cache.get(key)
        assert retrieved is not None
        assert retrieved["response"] == "Detailed analysis..."
        assert len(retrieved["sources"]) == 1
    
    def test_get_nonexistent_key(self, temp_cache):
        """Test get with nonexistent key."""
        result = temp_cache.get("nonexistent_key_12345")
        
        assert result is None
    
    def test_ttl_expiration(self, temp_cache):
        """Test TTL-based expiration."""
        key = temp_cache.generate_key("expiring query")
        value = {"response": "This will expire"}
        
        # Set with 2 second TTL
        temp_cache.set(key, value, mode="flash", ttl=2)
        
        # Should exist immediately
        result1 = temp_cache.get(key)
        assert result1 is not None
        
        # Wait for expiration
        time.sleep(3)
        
        # Should be expired now
        result2 = temp_cache.get(key)
        assert result2 is None
    
    def test_delete(self, temp_cache):
        """Test delete functionality."""
        key = temp_cache.generate_key("to delete")
        value = {"response": "Delete me"}
        
        # Set
        temp_cache.set(key, value)
        assert temp_cache.get(key) is not None
        
        # Delete
        success = temp_cache.delete(key)
        assert success is True
        
        # Should be gone
        assert temp_cache.get(key) is None
    
    def test_clear_all(self, temp_cache):
        """Test clear all entries."""
        # Add multiple entries
        for i in range(5):
            key = temp_cache.generate_key(f"query_{i}")
            temp_cache.set(key, {"response": f"Response {i}"})
        
        # Clear all
        deleted = temp_cache.clear()
        assert deleted == 5
        
        # All should be gone
        for i in range(5):
            key = temp_cache.generate_key(f"query_{i}")
            assert temp_cache.get(key) is None
    
    def test_clear_by_mode(self, temp_cache):
        """Test clear by mode."""
        # Add flash entries
        for i in range(3):
            key = temp_cache.generate_key(f"flash_{i}")
            temp_cache.set(key, {"response": f"Flash {i}"}, mode="flash")
        
        # Add pro entries
        for i in range(2):
            key = temp_cache.generate_key(f"pro_{i}")
            temp_cache.set(key, {"response": f"Pro {i}"}, mode="pro")
        
        # Clear only flash
        deleted = temp_cache.clear(mode="flash")
        assert deleted == 3
        
        # Flash should be gone, pro should remain
        assert temp_cache.get(temp_cache.generate_key("flash_0")) is None
        assert temp_cache.get(temp_cache.generate_key("pro_0")) is not None
    
    def test_cleanup_expired(self, temp_cache):
        """Test cleanup of expired entries."""
        # Add entries with short TTL
        for i in range(3):
            key = temp_cache.generate_key(f"expire_{i}")
            temp_cache.set(key, {"response": f"Expire {i}"}, ttl=1)
        
        # Add entry with long TTL
        key_long = temp_cache.generate_key("keep_me")
        temp_cache.set(key_long, {"response": "Keep me"}, ttl=100)
        
        # Wait for short TTL to expire
        time.sleep(2)
        
        # Cleanup
        deleted = temp_cache.cleanup_expired()
        assert deleted == 3
        
        # Long TTL should still exist
        assert temp_cache.get(key_long) is not None
    
    def test_access_count(self, temp_cache):
        """Test access count tracking."""
        key = temp_cache.generate_key("popular query")
        value = {"response": "Popular response"}
        
        # Set
        temp_cache.set(key, value)
        
        # Access multiple times
        for i in range(5):
            result = temp_cache.get(key)
            assert result is not None
        
        # Access count should be tracked (checked via logs)
        # Note: Actual count stored in DB, not returned in get()
    
    def test_lru_eviction(self):
        """Test LRU eviction when max entries reached."""
        test_db = "/tmp/test_lru_cache.db"
        if os.path.exists(test_db):
            os.remove(test_db)
        
        # Small cache for testing
        cache = CacheManager(config={
            "db_path": test_db,
            "max_entries": 10,
            "auto_cleanup": False
        })
        
        # Fill cache
        keys = []
        for i in range(12):
            key = cache.generate_key(f"query_{i}")
            keys.append(key)
            cache.set(key, {"response": f"Response {i}"})
        
        # Get stats
        stats = cache.get_stats()
        
        # Should have evicted to stay under max
        assert stats.total_entries <= 10
        
        # Cleanup
        if os.path.exists(test_db):
            os.remove(test_db)
    
    def test_get_stats(self, temp_cache):
        """Test get statistics."""
        # Add some entries
        for i in range(3):
            key = temp_cache.generate_key(f"flash_{i}")
            temp_cache.set(key, {"response": f"Flash {i}"}, mode="flash")
        
        for i in range(2):
            key = temp_cache.generate_key(f"pro_{i}")
            temp_cache.set(key, {"response": f"Pro {i}"}, mode="pro")
        
        # Get stats
        stats = temp_cache.get_stats()
        
        assert isinstance(stats, CacheStats)
        assert stats.total_entries == 5
        assert stats.flash_entries == 3
        assert stats.pro_entries == 2
        assert stats.hit_rate >= 0.0
        assert stats.avg_ttl > 0
    
    def test_hit_rate_calculation(self, temp_cache):
        """Test hit rate calculation."""
        key1 = temp_cache.generate_key("hit query")
        key2 = temp_cache.generate_key("miss query")
        
        # Set one key
        temp_cache.set(key1, {"response": "Hit me"})
        
        # Hit
        temp_cache.get(key1)
        
        # Miss
        temp_cache.get(key2)
        
        # Get stats
        stats = temp_cache.get_stats()
        
        assert stats.total_hits == 1
        assert stats.total_misses == 1
        assert stats.hit_rate == 0.5  # 50%
    
    def test_health_check(self, temp_cache):
        """Test health check."""
        is_healthy = temp_cache.health_check()
        
        assert is_healthy is True
    
    def test_complex_value_serialization(self, temp_cache):
        """Test complex value serialization."""
        key = temp_cache.generate_key("complex query")
        complex_value = {
            "response": "Complex response",
            "sources": [
                {"id": "1", "title": "Source 1", "score": 0.95},
                {"id": "2", "title": "Source 2", "score": 0.87}
            ],
            "metadata": {
                "model": "gemma2:2b",
                "tokens": 150,
                "timing": 2.5
            },
            "reasoning": ["Step 1", "Step 2", "Step 3"]
        }
        
        # Set
        success = temp_cache.set(key, complex_value)
        assert success is True
        
        # Get
        retrieved = temp_cache.get(key)
        assert retrieved is not None
        assert retrieved["response"] == "Complex response"
        assert len(retrieved["sources"]) == 2
        assert retrieved["metadata"]["model"] == "gemma2:2b"
        assert len(retrieved["reasoning"]) == 3


class TestCacheIntegration:
    """Integration tests for cache system."""
    
    def test_cache_workflow(self, temp_cache):
        """Test complete cache workflow."""
        query = "What is machine learning?"
        context = {"session_id": "user123", "mode": "flash"}
        
        # Generate key
        key = temp_cache.generate_key(query, context)
        
        # Check cache (should be miss)
        result = temp_cache.get(key)
        assert result is None
        
        # Simulate generating response
        response = {
            "response": "Machine learning is a subset of AI...",
            "sources": [{"id": "ml_intro", "title": "ML Introduction"}]
        }
        
        # Store in cache
        temp_cache.set(key, response, mode="flash")
        
        # Get from cache (should be hit)
        cached = temp_cache.get(key)
        assert cached is not None
        assert cached["response"] == response["response"]
        
        # Stats should reflect hit
        stats = temp_cache.get_stats()
        assert stats.total_hits >= 1


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
