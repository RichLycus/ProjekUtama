"""
Retriever Interface

Unified interface for all retrieval backends.
All retrievers (RAG, Chimepedia, Cache) must implement this interface.
"""

from abc import ABC, abstractmethod
from typing import List, Dict, Any, Optional
from dataclasses import dataclass, field
from datetime import datetime


@dataclass
class RetrievalResult:
    """
    Standard result format for all retrievers.
    
    Attributes:
        id: Unique identifier for retrieved item
        content: Main content/text of retrieved item
        score: Relevance score (0.0-1.0, higher is better)
        metadata: Additional metadata (source, title, tags, etc.)
        source: Source system (rag, chimepedia, cache, etc.)
        timestamp: When item was retrieved
    """
    id: str
    content: str
    score: float
    metadata: Dict[str, Any] = field(default_factory=dict)
    source: str = "unknown"
    timestamp: str = field(default_factory=lambda: datetime.now().isoformat())
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary."""
        return {
            "id": self.id,
            "content": self.content,
            "score": self.score,
            "metadata": self.metadata,
            "source": self.source,
            "timestamp": self.timestamp
        }


class RetrieverInterface(ABC):
    """
    Base interface for all retriever implementations.
    
    A retriever fetches relevant information based on a query.
    Different backends (RAG, Chimepedia, Cache) implement this interface.
    
    Example Implementation:
        ```python
        class RAGRetriever(RetrieverInterface):
            def retrieve(self, query: str, top_k: int = 5) -> List[RetrievalResult]:
                # Query ChromaDB
                results = self.chroma.query(query, n_results=top_k)
                return [RetrievalResult(
                    id=r['id'],
                    content=r['document'],
                    score=r['distance'],
                    source='rag'
                ) for r in results]
        ```
    
    Example Usage:
        ```python
        retriever = RAGRetriever(config={"collection": "chimepaedia"})
        results = retriever.retrieve("What is RAG?", top_k=3)
        for result in results:
            print(f"{result.score:.2f}: {result.content[:100]}...")
        ```
    """
    
    def __init__(self, config: Optional[Dict[str, Any]] = None):
        """
        Initialize retriever with configuration.
        
        Args:
            config: Retriever-specific configuration
        """
        self.config = config or {}
        self.name = self.__class__.__name__
    
    @abstractmethod
    def retrieve(
        self, 
        query: str, 
        top_k: int = 5,
        filters: Optional[Dict[str, Any]] = None
    ) -> List[RetrievalResult]:
        """
        Retrieve relevant items based on query.
        
        Args:
            query: Search query
            top_k: Maximum number of results to return
            filters: Optional filters (e.g., date range, tags, source)
        
        Returns:
            List of RetrievalResult objects, sorted by relevance (highest first)
        """
        pass
    
    def health_check(self) -> bool:
        """
        Check if retriever backend is healthy and accessible.
        
        Returns:
            True if healthy, False otherwise
        """
        return True
    
    def get_stats(self) -> Dict[str, Any]:
        """
        Get retriever statistics.
        
        Returns:
            Dictionary with stats (indexed_docs, avg_score, etc.)
        """
        return {
            "name": self.name,
            "status": "unknown",
            "indexed_items": 0
        }
    
    def __repr__(self) -> str:
        """String representation of retriever."""
        return f"{self.name}(config={self.config})"
