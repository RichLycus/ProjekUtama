"""
RAG (Retrieval-Augmented Generation) Module
Uses ChromaDB for vector database and sentence-transformers for embeddings
"""

import os
from pathlib import Path
from typing import List, Dict, Any, Optional
import chromadb
from chromadb.config import Settings
from sentence_transformers import SentenceTransformer
import json

# Get paths relative to this file
BASE_DIR = Path(__file__).parent.parent
DATA_DIR = BASE_DIR / "data"
VECTOR_DB_PATH = DATA_DIR / "vector_db"
AI_CONFIG_PATH = DATA_DIR / "ai_config.json"

# Ensure directories exist
DATA_DIR.mkdir(exist_ok=True)
VECTOR_DB_PATH.mkdir(exist_ok=True)


class RAGSystem:
    """
    RAG System for ChimeraAI
    Handles document indexing and retrieval using ChromaDB
    """
    
    def __init__(self, embedding_model: str = "all-MiniLM-L6-v2"):
        """
        Initialize RAG system with ChromaDB and embedding model
        
        Args:
            embedding_model: Model ID from sentence-transformers
                Options: all-MiniLM-L6-v2 (default), all-mpnet-base-v2, 
                         bge-large-en-v1.5, nomic-embed-text-v1.5,
                         paraphrase-multilingual-MiniLM-L12-v2
        """
        # Initialize ChromaDB client
        self.chroma_client = chromadb.PersistentClient(
            path=str(VECTOR_DB_PATH),
            settings=Settings(
                anonymized_telemetry=False,
                allow_reset=True
            )
        )
        
        # Load configurable embedding model
        self.embedding_model_name = embedding_model
        print(f"Loading embedding model: {embedding_model}...")
        self.embedding_model = SentenceTransformer(embedding_model)
        print(f"✅ Embedding model loaded: {embedding_model}")
        
        # Get or create collections
        self.tools_collection = self._get_or_create_collection("tools_collection")
        self.docs_collection = self._get_or_create_collection("docs_collection")
        self.conversations_collection = self._get_or_create_collection("conversations_collection")
        self.chimepedia_collection = self._get_or_create_collection("chimepedia_collection")
        
        self.status = "ready"
        
    def _get_or_create_collection(self, name: str):
        """Get or create a ChromaDB collection"""
        try:
            return self.chroma_client.get_or_create_collection(
                name=name,
                metadata={"hnsw:space": "cosine"}
            )
        except Exception as e:
            print(f"Error creating collection {name}: {e}")
            raise
    
    def index_tool(self, tool_id: str, tool_data: Dict[str, Any]) -> bool:
        """
        Index a tool's schema and metadata
        
        Args:
            tool_id: Unique tool identifier
            tool_data: Tool information (name, description, category, etc.)
        
        Returns:
            True if successful, False otherwise
        """
        try:
            # Create document text from tool data
            doc_text = f"""
Tool Name: {tool_data.get('name', 'Unknown')}
Category: {tool_data.get('category', 'Unknown')}
Description: {tool_data.get('description', 'No description')}
Version: {tool_data.get('version', '1.0.0')}
Author: {tool_data.get('author', 'Unknown')}
            """.strip()
            
            # Generate embedding
            embedding = self.embedding_model.encode(doc_text).tolist()
            
            # Add to collection
            self.tools_collection.add(
                ids=[tool_id],
                documents=[doc_text],
                embeddings=[embedding],
                metadatas=[{
                    "type": "tool",
                    "name": tool_data.get('name', 'Unknown'),
                    "category": tool_data.get('category', 'Unknown')
                }]
            )
            
            return True
        except Exception as e:
            print(f"Error indexing tool {tool_id}: {e}")
            return False
    
    def index_document(self, doc_id: str, doc_title: str, doc_content: str, doc_type: str = "general") -> bool:
        """
        Index a documentation file
        
        Args:
            doc_id: Unique document identifier
            doc_title: Document title
            doc_content: Document content (markdown, text, etc.)
            doc_type: Type of document (golden-rules, phase-doc, etc.)
        
        Returns:
            True if successful, False otherwise
        """
        try:
            # Create document text
            doc_text = f"{doc_title}\n\n{doc_content}"
            
            # Generate embedding
            embedding = self.embedding_model.encode(doc_text).tolist()
            
            # Add to collection
            self.docs_collection.add(
                ids=[doc_id],
                documents=[doc_text],
                embeddings=[embedding],
                metadatas=[{
                    "type": doc_type,
                    "title": doc_title
                }]
            )
            
            return True
        except Exception as e:
            print(f"Error indexing document {doc_id}: {e}")
            return False
    
    def index_conversation(self, conversation_id: str, messages: List[Dict[str, Any]]) -> bool:
        """
        Index past conversation for context retrieval
        
        Args:
            conversation_id: Unique conversation identifier
            messages: List of messages in the conversation
        
        Returns:
            True if successful, False otherwise
        """
        try:
            # Combine messages into document
            doc_text = "\n".join([
                f"{msg.get('role', 'unknown')}: {msg.get('content', '')}"
                for msg in messages
            ])
            
            # Generate embedding
            embedding = self.embedding_model.encode(doc_text).tolist()
            
            # Add to collection
            self.conversations_collection.add(
                ids=[conversation_id],
                documents=[doc_text],
                embeddings=[embedding],
                metadatas=[{
                    "type": "conversation",
                    "message_count": len(messages)
                }]
            )
            
            return True
        except Exception as e:
            print(f"Error indexing conversation {conversation_id}: {e}")
            return False
    
    def query(
        self, 
        query_text: str, 
        n_results: int = 5, 
        collections: Optional[List[str]] = None
    ) -> List[Dict[str, Any]]:
        """
        Query RAG system for relevant context
        
        Args:
            query_text: User query or message
            n_results: Number of results to return
            collections: List of collections to query (default: ["tools", "docs"])
        
        Returns:
            List of relevant documents with metadata and relevance scores
        """
        try:
            # Default collections if not specified
            if collections is None:
                collections = ["tools", "docs"]
            
            # Generate query embedding
            query_embedding = self.embedding_model.encode(query_text).tolist()
            
            # Query selected collections
            combined_results = []
            
            # Query tools collection
            if "tools" in collections:
                tools_results = self.tools_collection.query(
                    query_embeddings=[query_embedding],
                    n_results=min(n_results, 3)
                )
                combined_results.extend(self._format_results(tools_results, "tool"))
            
            # Query docs collection
            if "docs" in collections:
                docs_results = self.docs_collection.query(
                    query_embeddings=[query_embedding],
                    n_results=min(n_results, 2)
                )
                combined_results.extend(self._format_results(docs_results, "document"))
            
            # Query chimepedia collection
            if "chimepedia" in collections:
                chimepedia_results = self.chimepedia_collection.query(
                    query_embeddings=[query_embedding],
                    n_results=n_results
                )
                combined_results.extend(self._format_results(chimepedia_results, "chimepedia"))
            
            # Query conversations collection
            if "conversations" in collections:
                conv_results = self.conversations_collection.query(
                    query_embeddings=[query_embedding],
                    n_results=min(n_results, 2)
                )
                combined_results.extend(self._format_results(conv_results, "conversation"))
            
            # Sort by relevance
            combined_results.sort(key=lambda x: x['relevance'], reverse=True)
            
            return combined_results[:n_results]
            
        except Exception as e:
            print(f"Error querying RAG: {e}")
            return []
    
    def _format_results(self, raw_results: Dict, source_type: str) -> List[Dict[str, Any]]:
        """Helper to format ChromaDB results"""
        formatted = []
        
        if raw_results['ids'] and len(raw_results['ids'][0]) > 0:
            for i, doc_id in enumerate(raw_results['ids'][0]):
                formatted.append({
                    "id": doc_id,
                    "content": raw_results['documents'][0][i] if raw_results['documents'] else "",
                    "metadata": raw_results['metadatas'][0][i] if raw_results['metadatas'] else {},
                    "relevance": 1 - raw_results['distances'][0][i] if raw_results['distances'] else 0.0,
                    "source": source_type
                })
        
        return formatted
    
    def query_chimepedia(
        self, 
        query_text: str, 
        n_results: int = 5,
        category: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """
        Query Chimepedia collection specifically
        
        Args:
            query_text: User query
            n_results: Number of results to return
            category: Optional category filter
        
        Returns:
            List of relevant Chimepedia articles
        """
        try:
            query_embedding = self.embedding_model.encode(query_text).tolist()
            
            # Build filter if category specified
            where_filter = {"category": category} if category else None
            
            results = self.chimepedia_collection.query(
                query_embeddings=[query_embedding],
                n_results=n_results,
                where=where_filter if where_filter else None
            )
            
            return self._format_results(results, "chimepedia")
            
        except Exception as e:
            print(f"Error querying Chimepedia: {e}")
            return []
    
    def get_status(self) -> Dict[str, Any]:
        """Get RAG system status"""
        try:
            tools_count = self.tools_collection.count()
            docs_count = self.docs_collection.count()
            conversations_count = self.conversations_collection.count()
            chimepedia_count = self.chimepedia_collection.count()
            
            return {
                "status": self.status,
                "indexed_tools": tools_count,
                "indexed_docs": docs_count,
                "indexed_conversations": conversations_count,
                "indexed_chimepedia": chimepedia_count,
                "total_sources": tools_count + docs_count + conversations_count + chimepedia_count,
                "embedding_model": self.embedding_model_name,
                "vector_db_path": str(VECTOR_DB_PATH)
            }
        except Exception as e:
            return {
                "status": "error",
                "error": str(e)
            }
    
    def clear_collection(self, collection_name: str) -> bool:
        """Clear a specific collection"""
        try:
            if collection_name == "tools":
                self.chroma_client.delete_collection("tools_collection")
                self.tools_collection = self._get_or_create_collection("tools_collection")
            elif collection_name == "docs":
                self.chroma_client.delete_collection("docs_collection")
                self.docs_collection = self._get_or_create_collection("docs_collection")
            elif collection_name == "conversations":
                self.chroma_client.delete_collection("conversations_collection")
                self.conversations_collection = self._get_or_create_collection("conversations_collection")
            elif collection_name == "chimepedia":
                self.chroma_client.delete_collection("chimepedia_collection")
                self.chimepedia_collection = self._get_or_create_collection("chimepedia_collection")
            else:
                return False
            
            return True
        except Exception as e:
            print(f"Error clearing collection {collection_name}: {e}")
            return False
    
    def index_golden_rules(self) -> bool:
        """Index golden rules documentation"""
        try:
            golden_rules_path = BASE_DIR.parent / "docs" / "golden-rules.md"
            
            if not golden_rules_path.exists():
                print(f"⚠️ Golden rules not found at {golden_rules_path}")
                return False
            
            with open(golden_rules_path, 'r', encoding='utf-8') as f:
                content = f.read()
            
            return self.index_document(
                doc_id="golden-rules",
                doc_title="ChimeraAI Golden Rules",
                doc_content=content,
                doc_type="golden-rules"
            )
        except Exception as e:
            print(f"Error indexing golden rules: {e}")
            return False
    
    def index_chimepedia(
        self, 
        doc_id: str, 
        doc_title: str, 
        doc_content: str, 
        doc_type: str = "general",
        metadata: Optional[Dict[str, Any]] = None
    ) -> bool:
        """
        Index a Chimepedia article
        
        Args:
            doc_id: Unique document identifier
            doc_title: Article title
            doc_content: Article content (markdown, text, etc.)
            doc_type: Type/category (tutorial, guide, reference, api-doc, etc.)
            metadata: Additional metadata (author, tags, etc.)
        
        Returns:
            True if successful, False otherwise
        """
        try:
            # Create document text
            doc_text = f"{doc_title}\n\n{doc_content}"
            
            # Generate embedding
            embedding = self.embedding_model.encode(doc_text).tolist()
            
            # Prepare metadata
            doc_metadata = metadata or {}
            doc_metadata["type"] = doc_type
            doc_metadata["title"] = doc_title
            doc_metadata["category"] = doc_type  # For filtering
            
            # Add to chimepedia collection
            self.chimepedia_collection.add(
                ids=[doc_id],
                documents=[doc_text],
                embeddings=[embedding],
                metadatas=[doc_metadata]
            )
            
            return True
        except Exception as e:
            print(f"Error indexing Chimepedia document {doc_id}: {e}")
            return False


# Global RAG instance
_rag_instance: Optional[RAGSystem] = None


def get_rag_system(embedding_model: str = "all-MiniLM-L6-v2") -> RAGSystem:
    """
    Get or create global RAG system instance
    
    Args:
        embedding_model: Model ID for embeddings (default: all-MiniLM-L6-v2)
    
    Returns:
        RAG system instance
    """
    global _rag_instance
    
    if _rag_instance is None:
        print(f"🚀 Initializing RAG system with model: {embedding_model}")
        _rag_instance = RAGSystem(embedding_model=embedding_model)
        print("✅ RAG system initialized")
        
        # Index golden rules on startup
        print("📚 Indexing golden rules...")
        if _rag_instance.index_golden_rules():
            print("✅ Golden rules indexed")
        else:
            print("⚠️ Failed to index golden rules")
    
    return _rag_instance


# Cleanup on module unload
def cleanup_rag():
    """Cleanup RAG system resources"""
    global _rag_instance
    if _rag_instance is not None:
        _rag_instance = None
        print("🔄 RAG system cleaned up")
