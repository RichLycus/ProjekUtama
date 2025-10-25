"""
Cache Manager

SQLite-based cache with TTL and LRU eviction.
Supports different cache strategies for Flash vs Pro modes.
"""

import sqlite3
import json
import hashlib
import time
from typing import Optional, Dict, Any, List
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from pathlib import Path
import logging

logger = logging.getLogger(__name__)

# Default cache database path
BASE_DIR = Path(__file__).parent.parent.parent
DATA_DIR = BASE_DIR / "data"
CACHE_DB_PATH = DATA_DIR / "cache.db"

# Ensure data directory exists
DATA_DIR.mkdir(exist_ok=True)


@dataclass
class CacheEntry:
    """
    Cache entry data structure.
    
    Attributes:
        key: Cache key (hash of query + context)
        value: Cached response (JSON serializable)
        mode: Mode used (flash, pro, hybrid)
        ttl: Time to live in seconds
        created_at: Creation timestamp
        accessed_at: Last access timestamp
        access_count: Number of times accessed
        metadata: Additional metadata
    """
    key: str
    value: Any
    mode: str = "flash"
    ttl: int = 900  # 15 minutes default
    created_at: str = field(default_factory=lambda: datetime.now().isoformat())
    accessed_at: str = field(default_factory=lambda: datetime.now().isoformat())
    access_count: int = 0
    metadata: Dict[str, Any] = field(default_factory=dict)
    
    def is_expired(self) -> bool:
        """Check if cache entry is expired."""
        created_time = datetime.fromisoformat(self.created_at)
        expiry_time = created_time + timedelta(seconds=self.ttl)
        return datetime.now() > expiry_time
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary."""
        return {
            "key": self.key,
            "value": self.value,
            "mode": self.mode,
            "ttl": self.ttl,
            "created_at": self.created_at,
            "accessed_at": self.accessed_at,
            "access_count": self.access_count,
            "metadata": self.metadata
        }


@dataclass
class CacheStats:
    """
    Cache statistics.
    
    Attributes:
        total_entries: Total cached entries
        flash_entries: Flash mode entries
        pro_entries: Pro mode entries
        hit_rate: Cache hit rate (0.0-1.0)
        total_hits: Total cache hits
        total_misses: Total cache misses
        avg_ttl: Average TTL in seconds
        oldest_entry: Oldest entry timestamp
        newest_entry: Newest entry timestamp
    """
    total_entries: int = 0
    flash_entries: int = 0
    pro_entries: int = 0
    hit_rate: float = 0.0
    total_hits: int = 0
    total_misses: int = 0
    avg_ttl: float = 0.0
    oldest_entry: Optional[str] = None
    newest_entry: Optional[str] = None
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary."""
        return {
            "total_entries": self.total_entries,
            "flash_entries": self.flash_entries,
            "pro_entries": self.pro_entries,
            "hit_rate": round(self.hit_rate, 3),
            "total_hits": self.total_hits,
            "total_misses": self.total_misses,
            "avg_ttl": round(self.avg_ttl, 1),
            "oldest_entry": self.oldest_entry,
            "newest_entry": self.newest_entry
        }


class CacheManager:
    """
    Cache Manager for ChimeraAI.
    
    SQLite-based cache with:
    - TTL-based expiration (Flash: 15 min, Pro: 1 hour)
    - LRU eviction (max 1000 entries)
    - Mode-specific strategies
    - Hit/miss tracking
    
    Config options:
        db_path (str): Path to SQLite database
        max_entries (int): Maximum cache entries (default: 1000)
        flash_ttl (int): TTL for Flash mode in seconds (default: 900 = 15 min)
        pro_ttl (int): TTL for Pro mode in seconds (default: 3600 = 1 hour)
        auto_cleanup (bool): Auto cleanup expired entries (default: True)
    
    Example:
        ```python
        cache = CacheManager(config={
            "max_entries": 500,
            "flash_ttl": 600,  # 10 minutes
            "pro_ttl": 1800     # 30 minutes
        })
        
        # Store response
        cache.set("user_query_hash", {"response": "...", "sources": [...]}, mode="flash")
        
        # Retrieve response
        result = cache.get("user_query_hash")
        if result:
            print("Cache hit!", result)
        ```
    """
    
    def __init__(self, config: Optional[Dict[str, Any]] = None):
        """Initialize cache manager."""
        self.config = config or {}
        
        # Get configuration
        self.db_path = self.config.get("db_path", str(CACHE_DB_PATH))
        self.max_entries = self.config.get("max_entries", 1000)
        self.flash_ttl = self.config.get("flash_ttl", 900)  # 15 minutes
        self.pro_ttl = self.config.get("pro_ttl", 3600)     # 1 hour
        self.auto_cleanup = self.config.get("auto_cleanup", True)
        
        # Statistics tracking
        self._hits = 0
        self._misses = 0
        
        # Initialize database
        self._init_database()
        
        # Auto cleanup on init
        if self.auto_cleanup:
            self.cleanup_expired()
        
        logger.info(f"[CacheManager] Initialized (max: {self.max_entries}, flash: {self.flash_ttl}s, pro: {self.pro_ttl}s)")
    
    def _init_database(self):
        """Initialize SQLite database and tables."""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        # Create cache table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS cache_entries (
                key TEXT PRIMARY KEY,
                value TEXT NOT NULL,
                mode TEXT NOT NULL,
                ttl INTEGER NOT NULL,
                created_at TEXT NOT NULL,
                accessed_at TEXT NOT NULL,
                access_count INTEGER DEFAULT 0,
                metadata TEXT
            )
        """)
        
        # Create index on accessed_at for LRU
        cursor.execute("""
            CREATE INDEX IF NOT EXISTS idx_accessed_at 
            ON cache_entries(accessed_at)
        """)
        
        # Create index on created_at for expiry
        cursor.execute("""
            CREATE INDEX IF NOT EXISTS idx_created_at 
            ON cache_entries(created_at)
        """)
        
        conn.commit()
        conn.close()
        
        logger.info(f"[CacheManager] Database initialized at {self.db_path}")
    
    def generate_key(self, query: str, context: Optional[Dict[str, Any]] = None) -> str:
        """
        Generate cache key from query and context.
        
        Args:
            query: User query text
            context: Optional context (session_id, persona, etc.)
        
        Returns:
            Cache key (SHA256 hash)
        """
        # Combine query and context into single string
        key_parts = [query.strip().lower()]
        
        if context:
            # Add relevant context parts
            if "session_id" in context:
                key_parts.append(f"session:{context['session_id']}")
            if "persona_id" in context:
                key_parts.append(f"persona:{context['persona_id']}")
            if "mode" in context:
                key_parts.append(f"mode:{context['mode']}")
        
        # Generate hash
        key_string = "|".join(key_parts)
        key_hash = hashlib.sha256(key_string.encode()).hexdigest()
        
        return key_hash
    
    def set(
        self, 
        key: str, 
        value: Any, 
        mode: str = "flash",
        ttl: Optional[int] = None,
        metadata: Optional[Dict[str, Any]] = None
    ) -> bool:
        """
        Store value in cache.
        
        Args:
            key: Cache key
            value: Value to cache (must be JSON serializable)
            mode: Mode (flash, pro, hybrid)
            ttl: Custom TTL in seconds (overrides default)
            metadata: Additional metadata
        
        Returns:
            True if successful, False otherwise
        """
        try:
            # Determine TTL
            if ttl is None:
                ttl = self.flash_ttl if mode == "flash" else self.pro_ttl
            
            # Serialize value
            value_json = json.dumps(value)
            metadata_json = json.dumps(metadata or {})
            
            # Create entry
            now = datetime.now().isoformat()
            
            # Check if we need to evict
            self._evict_if_needed()
            
            # Insert or replace
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            cursor.execute("""
                INSERT OR REPLACE INTO cache_entries 
                (key, value, mode, ttl, created_at, accessed_at, access_count, metadata)
                VALUES (?, ?, ?, ?, ?, ?, 0, ?)
            """, (key, value_json, mode, ttl, now, now, metadata_json))
            
            conn.commit()
            conn.close()
            
            logger.debug(f"[CacheManager] Stored key: {key[:16]}... (mode: {mode}, ttl: {ttl}s)")
            return True
        
        except Exception as e:
            logger.error(f"[CacheManager] Error storing cache: {e}")
            return False
    
    def get(self, key: str) -> Optional[Any]:
        """
        Retrieve value from cache.
        
        Args:
            key: Cache key
        
        Returns:
            Cached value if found and not expired, None otherwise
        """
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            # Fetch entry
            cursor.execute("""
                SELECT value, mode, ttl, created_at, accessed_at, access_count, metadata
                FROM cache_entries
                WHERE key = ?
            """, (key,))
            
            row = cursor.fetchone()
            
            if not row:
                conn.close()
                self._misses += 1
                logger.debug(f"[CacheManager] Cache miss: {key[:16]}...")
                return None
            
            # Parse entry
            value_json, mode, ttl, created_at, accessed_at, access_count, metadata_json = row
            
            # Check expiry
            created_time = datetime.fromisoformat(created_at)
            expiry_time = created_time + timedelta(seconds=ttl)
            
            if datetime.now() > expiry_time:
                # Expired, delete and return None
                cursor.execute("DELETE FROM cache_entries WHERE key = ?", (key,))
                conn.commit()
                conn.close()
                self._misses += 1
                logger.debug(f"[CacheManager] Cache expired: {key[:16]}...")
                return None
            
            # Update access stats
            now = datetime.now().isoformat()
            cursor.execute("""
                UPDATE cache_entries
                SET accessed_at = ?, access_count = access_count + 1
                WHERE key = ?
            """, (now, key))
            
            conn.commit()
            conn.close()
            
            # Parse and return value
            value = json.loads(value_json)
            self._hits += 1
            
            logger.debug(f"[CacheManager] Cache hit: {key[:16]}... (mode: {mode}, accessed: {access_count + 1}x)")
            return value
        
        except Exception as e:
            logger.error(f"[CacheManager] Error retrieving cache: {e}")
            return None
    
    def delete(self, key: str) -> bool:
        """Delete specific cache entry."""
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            cursor.execute("DELETE FROM cache_entries WHERE key = ?", (key,))
            deleted = cursor.rowcount > 0
            
            conn.commit()
            conn.close()
            
            if deleted:
                logger.info(f"[CacheManager] Deleted key: {key[:16]}...")
            
            return deleted
        
        except Exception as e:
            logger.error(f"[CacheManager] Error deleting cache: {e}")
            return False
    
    def clear(self, mode: Optional[str] = None) -> int:
        """
        Clear cache entries.
        
        Args:
            mode: Optional mode filter (flash, pro, hybrid). If None, clear all.
        
        Returns:
            Number of entries deleted
        """
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            if mode:
                cursor.execute("DELETE FROM cache_entries WHERE mode = ?", (mode,))
            else:
                cursor.execute("DELETE FROM cache_entries")
            
            deleted = cursor.rowcount
            
            conn.commit()
            conn.close()
            
            logger.info(f"[CacheManager] Cleared {deleted} entries (mode: {mode or 'all'})")
            return deleted
        
        except Exception as e:
            logger.error(f"[CacheManager] Error clearing cache: {e}")
            return 0
    
    def cleanup_expired(self) -> int:
        """
        Clean up expired cache entries.
        
        Returns:
            Number of entries deleted
        """
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            # Find expired entries
            now = datetime.now().isoformat()
            cursor.execute("""
                SELECT key, created_at, ttl FROM cache_entries
            """)
            
            expired_keys = []
            for key, created_at, ttl in cursor.fetchall():
                created_time = datetime.fromisoformat(created_at)
                expiry_time = created_time + timedelta(seconds=ttl)
                if datetime.now() > expiry_time:
                    expired_keys.append(key)
            
            # Delete expired
            if expired_keys:
                cursor.executemany(
                    "DELETE FROM cache_entries WHERE key = ?",
                    [(k,) for k in expired_keys]
                )
            
            conn.commit()
            conn.close()
            
            if expired_keys:
                logger.info(f"[CacheManager] Cleaned up {len(expired_keys)} expired entries")
            
            return len(expired_keys)
        
        except Exception as e:
            logger.error(f"[CacheManager] Error cleaning up: {e}")
            return 0
    
    def _evict_if_needed(self):
        """
        Evict least recently used entries if max limit reached.
        """
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            # Count current entries
            cursor.execute("SELECT COUNT(*) FROM cache_entries")
            count = cursor.fetchone()[0]
            
            if count >= self.max_entries:
                # Evict 10% of entries (LRU)
                evict_count = max(1, int(self.max_entries * 0.1))
                
                cursor.execute("""
                    DELETE FROM cache_entries
                    WHERE key IN (
                        SELECT key FROM cache_entries
                        ORDER BY accessed_at ASC
                        LIMIT ?
                    )
                """, (evict_count,))
                
                conn.commit()
                logger.info(f"[CacheManager] Evicted {evict_count} LRU entries")
            
            conn.close()
        
        except Exception as e:
            logger.error(f"[CacheManager] Error evicting entries: {e}")
    
    def get_stats(self) -> CacheStats:
        """
        Get cache statistics.
        
        Returns:
            CacheStats object with current statistics
        """
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            # Total entries
            cursor.execute("SELECT COUNT(*) FROM cache_entries")
            total = cursor.fetchone()[0]
            
            # Mode breakdown
            cursor.execute("""
                SELECT mode, COUNT(*) 
                FROM cache_entries 
                GROUP BY mode
            """)
            mode_counts = {mode: count for mode, count in cursor.fetchall()}
            
            # Average TTL
            cursor.execute("SELECT AVG(ttl) FROM cache_entries")
            avg_ttl = cursor.fetchone()[0] or 0.0
            
            # Oldest and newest
            cursor.execute("SELECT MIN(created_at), MAX(created_at) FROM cache_entries")
            oldest, newest = cursor.fetchone()
            
            conn.close()
            
            # Calculate hit rate
            total_requests = self._hits + self._misses
            hit_rate = self._hits / total_requests if total_requests > 0 else 0.0
            
            return CacheStats(
                total_entries=total,
                flash_entries=mode_counts.get("flash", 0),
                pro_entries=mode_counts.get("pro", 0),
                hit_rate=hit_rate,
                total_hits=self._hits,
                total_misses=self._misses,
                avg_ttl=avg_ttl,
                oldest_entry=oldest,
                newest_entry=newest
            )
        
        except Exception as e:
            logger.error(f"[CacheManager] Error getting stats: {e}")
            return CacheStats()
    
    def health_check(self) -> bool:
        """Check if cache is healthy."""
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            cursor.execute("SELECT COUNT(*) FROM cache_entries")
            conn.close()
            return True
        except Exception as e:
            logger.error(f"[CacheManager] Health check failed: {e}")
            return False
