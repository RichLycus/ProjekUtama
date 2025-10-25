"""
Retriever Interface Module

Provides unified interface for all retrieval backends:
- RAG (ChromaDB)
- Chimepedia
- Cache
- Database
"""

from .base import RetrieverInterface, RetrievalResult
from .rag_retriever import RAGRetriever
from .chimepedia_retriever import ChimepediaRetriever

__all__ = ['RetrieverInterface', 'RetrievalResult', 'RAGRetriever', 'ChimepediaRetriever']
