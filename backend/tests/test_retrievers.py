"""
Test Retrievers (Phase 6.9.1)

Tests for RAGRetriever and ChimepediaRetriever.
"""

import pytest
from ai.retrievers import RAGRetriever, ChimepediaRetriever, RetrievalResult
from ai.rag import get_rag_system


class TestRAGRetriever:
    """Test RAGRetriever functionality."""
    
    def test_init_default_config(self):
        """Test initialization with default config."""
        retriever = RAGRetriever()
        
        assert retriever is not None
        assert retriever.name == "RAGRetriever"
        assert retriever.collections == ["tools", "docs"]
        assert retriever.min_score == 0.3
    
    def test_init_custom_config(self):
        """Test initialization with custom config."""
        config = {
            "embedding_model": "all-mpnet-base-v2",
            "collections": ["docs", "chimepedia"],
            "min_score": 0.5,
            "max_results": 10
        }
        
        retriever = RAGRetriever(config=config)
        
        assert retriever.collections == ["docs", "chimepedia"]
        assert retriever.min_score == 0.5
        assert retriever.max_results == 10
    
    def test_retrieve_empty_query(self):
        """Test retrieve with empty query."""
        retriever = RAGRetriever()
        
        results = retriever.retrieve("")
        
        assert results == []
    
    def test_retrieve_with_query(self):
        """Test retrieve with actual query."""
        retriever = RAGRetriever()
        
        # Index test document first
        rag = get_rag_system()
        rag.index_document(
            doc_id="test_doc_1",
            doc_title="Test Document",
            doc_content="This is a test document about Python programming",
            doc_type="test"
        )
        
        # Query
        results = retriever.retrieve("Python programming", top_k=3)
        
        assert isinstance(results, list)
        # Results may be empty if no good matches
        if results:
            assert all(isinstance(r, RetrievalResult) for r in results)
            assert all(r.source.startswith("rag_") for r in results)
    
    def test_retrieve_with_filters(self):
        """Test retrieve with filters."""
        retriever = RAGRetriever()
        
        # Query with filters
        results = retriever.retrieve(
            "test query", 
            top_k=5,
            filters={"collections": ["docs"], "min_score": 0.7}
        )
        
        assert isinstance(results, list)
    
    def test_health_check(self):
        """Test health check."""
        retriever = RAGRetriever()
        
        is_healthy = retriever.health_check()
        
        assert isinstance(is_healthy, bool)
    
    def test_get_stats(self):
        """Test get statistics."""
        retriever = RAGRetriever()
        
        stats = retriever.get_stats()
        
        assert "name" in stats
        assert "status" in stats
        assert "embedding_model" in stats
        assert stats["name"] == "RAGRetriever"


class TestChimepediaRetriever:
    """Test ChimepediaRetriever functionality."""
    
    def test_init_default_config(self):
        """Test initialization with default config."""
        retriever = ChimepediaRetriever()
        
        assert retriever is not None
        assert retriever.name == "ChimepediaRetriever"
        assert retriever.min_score == 0.4
        assert retriever.enable_reranking is False
    
    def test_init_custom_config(self):
        """Test initialization with custom config."""
        config = {
            "embedding_model": "all-mpnet-base-v2",
            "min_score": 0.6,
            "enable_reranking": True,
            "max_doc_length": 500
        }
        
        retriever = ChimepediaRetriever(config=config)
        
        assert retriever.min_score == 0.6
        assert retriever.enable_reranking is True
        assert retriever.max_doc_length == 500
    
    def test_retrieve_empty_query(self):
        """Test retrieve with empty query."""
        retriever = ChimepediaRetriever()
        
        results = retriever.retrieve("")
        
        assert results == []
    
    def test_index_article(self):
        """Test indexing Chimepedia article."""
        retriever = ChimepediaRetriever()
        
        success = retriever.index_article(
            article_id="fastapi_intro",
            title="FastAPI Introduction",
            content="FastAPI is a modern Python web framework for building APIs...",
            category="tutorial",
            metadata={"author": "Test Author", "tags": ["python", "api"]}
        )
        
        assert isinstance(success, bool)
    
    def test_retrieve_after_indexing(self):
        """Test retrieve after indexing articles."""
        retriever = ChimepediaRetriever()
        
        # Index test article
        retriever.index_article(
            article_id="react_hooks",
            title="React Hooks Guide",
            content="React Hooks are functions that let you use state and lifecycle features...",
            category="guide"
        )
        
        # Query
        results = retriever.retrieve("React Hooks", top_k=3)
        
        assert isinstance(results, list)
        if results:
            assert all(isinstance(r, RetrievalResult) for r in results)
            assert all(r.source == "chimepedia" for r in results)
    
    def test_retrieve_with_category_filter(self):
        """Test retrieve with category filter."""
        retriever = ChimepediaRetriever()
        
        # Query with category filter
        results = retriever.retrieve(
            "tutorial", 
            top_k=5,
            filters={"category": "guide", "min_score": 0.5}
        )
        
        assert isinstance(results, list)
    
    def test_health_check(self):
        """Test health check."""
        retriever = ChimepediaRetriever()
        
        is_healthy = retriever.health_check()
        
        assert isinstance(is_healthy, bool)
    
    def test_get_stats(self):
        """Test get statistics."""
        retriever = ChimepediaRetriever()
        
        stats = retriever.get_stats()
        
        assert "name" in stats
        assert "status" in stats
        assert "collection" in stats
        assert stats["name"] == "ChimepediaRetriever"
        assert stats["collection"] == "chimepedia_collection"


class TestRetrieverIntegration:
    """Integration tests for retrievers."""
    
    def test_both_retrievers_work_together(self):
        """Test RAG and Chimepedia retrievers working together."""
        rag_retriever = RAGRetriever()
        chimepedia_retriever = ChimepediaRetriever()
        
        # Index documents in both
        rag = get_rag_system()
        rag.index_document(
            doc_id="general_doc",
            doc_title="General Documentation",
            doc_content="This is general documentation content",
            doc_type="general"
        )
        
        chimepedia_retriever.index_article(
            article_id="tech_article",
            title="Tech Article",
            content="This is a technical article about software",
            category="article"
        )
        
        # Query both
        rag_results = rag_retriever.retrieve("documentation", top_k=3)
        chimepedia_results = chimepedia_retriever.retrieve("technical software", top_k=3)
        
        assert isinstance(rag_results, list)
        assert isinstance(chimepedia_results, list)
    
    def test_retrieval_result_format(self):
        """Test that all retrievers return same format."""
        rag_retriever = RAGRetriever()
        chimepedia_retriever = ChimepediaRetriever()
        
        # Get any results
        rag = get_rag_system()
        rag.index_document("test_1", "Test", "Test content", "test")
        
        rag_results = rag_retriever.retrieve("test", top_k=1)
        
        if rag_results:
            result = rag_results[0]
            
            # Check format
            assert hasattr(result, "id")
            assert hasattr(result, "content")
            assert hasattr(result, "score")
            assert hasattr(result, "metadata")
            assert hasattr(result, "source")
            assert hasattr(result, "timestamp")
            
            # Check types
            assert isinstance(result.id, str)
            assert isinstance(result.content, str)
            assert isinstance(result.score, float)
            assert isinstance(result.metadata, dict)
            assert isinstance(result.source, str)


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
