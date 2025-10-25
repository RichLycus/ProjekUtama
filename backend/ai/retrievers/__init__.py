"""
Retriever Interface Module

Provides unified interface for all retrieval backends:
- RAG (ChromaDB)
- Chimepedia
- Cache
- Database
"""

from .base import RetrieverInterface, RetrievalResult

__all__ = ['RetrieverInterface', 'RetrievalResult']
