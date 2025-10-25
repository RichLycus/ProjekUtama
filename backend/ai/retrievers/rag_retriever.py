"""
RAG Retriever Implementation

Wraps existing RAGSystem for unified retrieval interface.
Supports multi-collection queries (tools, docs, conversations, chimepedia).
"""

from typing import List, Dict, Any, Optional
import logging
from pathlib import Path

from .base import RetrieverInterface, RetrievalResult

logger = logging.getLogger(__name__)


class RAGRetriever(RetrieverInterface):
    """
    RAG Retriever using ChromaDB backend.
    
    Wraps existing RAGSystem to provide unified RetrieverInterface.
    Supports querying multiple collections:
    - tools_collection: Tool schemas and metadata
    - docs_collection: General documentation
    - conversations_collection: Past conversation history
    - chimepedia_collection: Tech knowledge base (if available)
    
    Config options:
        embedding_model (str): Embedding model ID (default: "all-MiniLM-L6-v2")
        collections (list): Collections to query (default: ["tools", "docs"])
        min_score (float): Minimum relevance score (default: 0.3)
        max_results (int): Maximum results per collection (default: 5)
    
    Example:
        ```python
        retriever = RAGRetriever(config={
            "embedding_model": "all-mpnet-base-v2",
            "collections": ["docs", "chimepedia"],
            "min_score": 0.5
        })
        
        results = retriever.retrieve("What is RAG?", top_k=5)
        for result in results:
            print(f"{result.score:.2f}: {result.content[:100]}...")
        ```
    """
    
    def __init__(self, config: Optional[Dict[str, Any]] = None):
        """Initialize RAG retriever."""
        super().__init__(config)
        
        # Get or import RAGSystem
        from ai.rag import get_rag_system
        
        # Get embedding model from config
        embedding_model = self.config.get("embedding_model", "all-MiniLM-L6-v2")
        
        # Initialize RAG system with configured model
        self.rag = get_rag_system(embedding_model=embedding_model)
        
        # Get configuration
        self.collections = self.config.get("collections", ["tools", "docs"])
        self.min_score = self.config.get("min_score", 0.3)
        self.max_results = self.config.get("max_results", 5)
        
        logger.info(f"[RAGRetriever] Initialized with model: {embedding_model}")
        logger.info(f"[RAGRetriever] Collections: {self.collections}")
    
    def retrieve(
        self, 
        query: str, 
        top_k: int = 5,
        filters: Optional[Dict[str, Any]] = None
    ) -> List[RetrievalResult]:
        """
        Retrieve relevant documents from RAG system.
        
        Args:
            query: Search query
            top_k: Maximum number of results to return
            filters: Optional filters (collections, min_score, etc.)
        
        Returns:
            List of RetrievalResult objects, sorted by relevance
        """
        if not query or not query.strip():
            logger.warning("[RAGRetriever] Empty query provided")
            return []
        
        try:
            # Apply filters if provided
            collections = filters.get("collections", self.collections) if filters else self.collections
            min_score = filters.get("min_score", self.min_score) if filters else self.min_score
            
            # Query RAG system
            logger.info(f"[RAGRetriever] Querying: '{query[:50]}...' (top_k={top_k})")
            raw_results = self.rag.query(
                query_text=query,
                n_results=top_k,
                collections=collections
            )
            
            # Convert to RetrievalResult format
            results = []
            for item in raw_results:
                score = item.get("relevance", 0.0)
                
                # Filter by minimum score
                if score < min_score:
                    continue
                
                result = RetrievalResult(
                    id=item.get("id", "unknown"),
                    content=item.get("content", ""),
                    score=score,
                    metadata=item.get("metadata", {}),
                    source=f"rag_{item.get('source', 'unknown')}"
                )
                results.append(result)
            
            logger.info(f"[RAGRetriever] Retrieved {len(results)} results (filtered by score >= {min_score})")
            
            return results[:top_k]
        
        except Exception as e:
            logger.error(f"[RAGRetriever] Error retrieving: {e}")
            return []
    
    def health_check(self) -> bool:
        """Check if RAG system is healthy."""
        try:
            status = self.rag.get_status()
            return status.get("status") == "ready"
        except Exception as e:
            logger.error(f"[RAGRetriever] Health check failed: {e}")
            return False
    
    def get_stats(self) -> Dict[str, Any]:
        """Get RAG system statistics."""
        try:
            status = self.rag.get_status()
            return {
                "name": self.name,
                "status": status.get("status", "unknown"),
                "embedding_model": status.get("embedding_model", "unknown"),
                "indexed_tools": status.get("indexed_tools", 0),
                "indexed_docs": status.get("indexed_docs", 0),
                "indexed_conversations": status.get("indexed_conversations", 0),
                "indexed_chimepedia": status.get("indexed_chimepedia", 0),
                "total_sources": status.get("total_sources", 0),
                "collections": self.collections,
                "min_score": self.min_score
            }
        except Exception as e:
            logger.error(f"[RAGRetriever] Error getting stats: {e}")
            return {
                "name": self.name,
                "status": "error",
                "error": str(e)
            }
