"""
Chimepedia Retriever Implementation

Specialized retriever for Chimepedia knowledge base.
Focus on tech/digital knowledge, tutorials, tool guides.
"""

from typing import List, Dict, Any, Optional
import logging

from .base import RetrieverInterface, RetrievalResult

logger = logging.getLogger(__name__)


class ChimepediaRetriever(RetrieverInterface):
    """
    Chimepedia Retriever - Specialized for tech knowledge base.
    
    Chimepedia is a curated collection of:
    - Tech articles & tutorials
    - Tool documentation & guides
    - API references
    - Best practices & patterns
    - Digital world knowledge
    
    Uses ChromaDB with dedicated chimepedia_collection.
    Supports multiple embedding models for flexibility.
    
    Config options:
        embedding_model (str): Embedding model ID (default: "all-MiniLM-L6-v2")
        min_score (float): Minimum relevance score (default: 0.4)
        enable_reranking (bool): Enable LLM reranking (default: False)
        max_doc_length (int): Max characters per result (default: 1000)
    
    Example:
        ```python
        retriever = ChimepediaRetriever(config={
            "embedding_model": "all-mpnet-base-v2",
            "min_score": 0.5
        })
        
        results = retriever.retrieve("How to use FastAPI?", top_k=3)
        for result in results:
            print(f"[{result.score:.2f}] {result.metadata.get('title')}")
            print(result.content[:200])
        ```
    """
    
    def __init__(self, config: Optional[Dict[str, Any]] = None):
        """Initialize Chimepedia retriever."""
        super().__init__(config)
        
        # Get or import RAGSystem
        from ai.rag import get_rag_system
        
        # Get embedding model from config
        embedding_model = self.config.get("embedding_model", "all-MiniLM-L6-v2")
        
        # Initialize RAG system with configured model
        self.rag = get_rag_system(embedding_model=embedding_model)
        
        # Get configuration
        self.min_score = self.config.get("min_score", 0.4)
        self.enable_reranking = self.config.get("enable_reranking", False)
        self.max_doc_length = self.config.get("max_doc_length", 1000)
        
        logger.info(f"[ChimepediaRetriever] Initialized with model: {embedding_model}")
        logger.info(f"[ChimepediaRetriever] Min score: {self.min_score}, Reranking: {self.enable_reranking}")
    
    def retrieve(
        self, 
        query: str, 
        top_k: int = 5,
        filters: Optional[Dict[str, Any]] = None
    ) -> List[RetrievalResult]:
        """
        Retrieve relevant Chimepedia articles.
        
        Args:
            query: Search query (tech question, topic, tool name)
            top_k: Maximum number of results to return
            filters: Optional filters (category, min_score, etc.)
        
        Returns:
            List of RetrievalResult objects, sorted by relevance
        """
        if not query or not query.strip():
            logger.warning("[ChimepediaRetriever] Empty query provided")
            return []
        
        try:
            # Apply filters if provided
            min_score = filters.get("min_score", self.min_score) if filters else self.min_score
            category_filter = filters.get("category") if filters else None
            
            # Query chimepedia collection specifically
            logger.info(f"[ChimepediaRetriever] Querying: '{query[:50]}...' (top_k={top_k})")
            
            # Query with higher n_results for potential reranking
            query_limit = top_k * 2 if self.enable_reranking else top_k
            
            raw_results = self.rag.query_chimepedia(
                query_text=query,
                n_results=query_limit,
                category=category_filter
            )
            
            # Convert to RetrievalResult format
            results = []
            for item in raw_results:
                score = item.get("relevance", 0.0)
                
                # Filter by minimum score
                if score < min_score:
                    continue
                
                # Truncate content if needed
                content = item.get("content", "")
                if len(content) > self.max_doc_length:
                    content = content[:self.max_doc_length] + "..."
                
                # Extract metadata
                metadata = item.get("metadata", {})
                metadata["category"] = metadata.get("category", "general")
                metadata["doc_type"] = "chimepedia"
                
                result = RetrievalResult(
                    id=item.get("id", "unknown"),
                    content=content,
                    score=score,
                    metadata=metadata,
                    source="chimepedia"
                )
                results.append(result)
            
            # Optional: LLM reranking for better quality
            if self.enable_reranking and len(results) > top_k:
                logger.info(f"[ChimepediaRetriever] Reranking {len(results)} results...")
                results = self._rerank_results(query, results)[:top_k]
            
            logger.info(f"[ChimepediaRetriever] Retrieved {len(results)} results (score >= {min_score})")
            
            return results[:top_k]
        
        except Exception as e:
            logger.error(f"[ChimepediaRetriever] Error retrieving: {e}")
            return []
    
    def _rerank_results(self, query: str, results: List[RetrievalResult]) -> List[RetrievalResult]:
        """
        Rerank results using LLM for better quality (optional).
        
        Note: This is a placeholder for future enhancement.
        Actual reranking would use LLM to score relevance.
        """
        # For now, just return original results
        # Future: Use LLM to score each result against query
        logger.warning("[ChimepediaRetriever] Reranking not implemented yet, returning original order")
        return results
    
    def health_check(self) -> bool:
        """Check if Chimepedia collection is healthy."""
        try:
            status = self.rag.get_status()
            chimepedia_count = status.get("indexed_chimepedia", 0)
            
            # Healthy if at least some docs indexed
            is_healthy = chimepedia_count > 0
            
            if not is_healthy:
                logger.warning("[ChimepediaRetriever] No documents indexed in Chimepedia collection")
            
            return is_healthy
        except Exception as e:
            logger.error(f"[ChimepediaRetriever] Health check failed: {e}")
            return False
    
    def get_stats(self) -> Dict[str, Any]:
        """Get Chimepedia statistics."""
        try:
            status = self.rag.get_status()
            return {
                "name": self.name,
                "status": status.get("status", "unknown"),
                "embedding_model": status.get("embedding_model", "unknown"),
                "indexed_chimepedia": status.get("indexed_chimepedia", 0),
                "min_score": self.min_score,
                "reranking_enabled": self.enable_reranking,
                "max_doc_length": self.max_doc_length,
                "collection": "chimepedia_collection"
            }
        except Exception as e:
            logger.error(f"[ChimepediaRetriever] Error getting stats: {e}")
            return {
                "name": self.name,
                "status": "error",
                "error": str(e)
            }
    
    def index_article(
        self, 
        article_id: str, 
        title: str, 
        content: str,
        category: str = "general",
        metadata: Optional[Dict[str, Any]] = None
    ) -> bool:
        """
        Index a Chimepedia article.
        
        Args:
            article_id: Unique article identifier
            title: Article title
            content: Article content (markdown/text)
            category: Article category (tutorial, guide, reference, etc.)
            metadata: Additional metadata (author, tags, etc.)
        
        Returns:
            True if successful, False otherwise
        """
        try:
            article_metadata = metadata or {}
            article_metadata["category"] = category
            article_metadata["title"] = title
            
            success = self.rag.index_chimepedia(
                doc_id=article_id,
                doc_title=title,
                doc_content=content,
                doc_type=category,
                metadata=article_metadata
            )
            
            if success:
                logger.info(f"[ChimepediaRetriever] Indexed article: {title} ({category})")
            else:
                logger.error(f"[ChimepediaRetriever] Failed to index article: {title}")
            
            return success
        
        except Exception as e:
            logger.error(f"[ChimepediaRetriever] Error indexing article: {e}")
            return False
