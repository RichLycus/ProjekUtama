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
    
    def __init__(self):
        """Initialize RAG system with ChromaDB and embedding model"""
        # Initialize ChromaDB client
        self.chroma_client = chromadb.PersistentClient(
            path=str(VECTOR_DB_PATH),
            settings=Settings(
                anonymized_telemetry=False,
                allow_reset=True
            )
        )
        
        # Load embedding model (lightweight and fast)
        print("Loading embedding model...")
        self.embedding_model = SentenceTransformer('all-MiniLM-L6-v2')
        print("✅ Embedding model loaded")
        
        # Get or create collections
        self.tools_collection = self._get_or_create_collection("tools_collection")
        self.docs_collection = self._get_or_create_collection("docs_collection")
        self.conversations_collection = self._get_or_create_collection("conversations_collection")
        
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
    
    def query(self, query_text: str, n_results: int = 5) -> List[Dict[str, Any]]:
        """
        Query RAG system for relevant context
        
        Args:
            query_text: User query or message
            n_results: Number of results to return
        
        Returns:
            List of relevant documents with metadata and relevance scores
        """
        try:
            # Generate query embedding
            query_embedding = self.embedding_model.encode(query_text).tolist()
            
            # Query all collections
            tools_results = self.tools_collection.query(
                query_embeddings=[query_embedding],
                n_results=min(n_results, 3)
            )
            
            docs_results = self.docs_collection.query(
                query_embeddings=[query_embedding],
                n_results=min(n_results, 2)
            )
            
            # Combine and format results
            combined_results = []
            
            # Process tools results
            if tools_results['ids'] and len(tools_results['ids'][0]) > 0:
                for i, doc_id in enumerate(tools_results['ids'][0]):
                    combined_results.append({
                        "id": doc_id,
                        "content": tools_results['documents'][0][i] if tools_results['documents'] else "",
                        "metadata": tools_results['metadatas'][0][i] if tools_results['metadatas'] else {},
                        "relevance": 1 - tools_results['distances'][0][i] if tools_results['distances'] else 0.0,
                        "source": "tool"
                    })
            
            # Process docs results
            if docs_results['ids'] and len(docs_results['ids'][0]) > 0:
                for i, doc_id in enumerate(docs_results['ids'][0]):
                    combined_results.append({
                        "id": doc_id,
                        "content": docs_results['documents'][0][i] if docs_results['documents'] else "",
                        "metadata": docs_results['metadatas'][0][i] if docs_results['metadatas'] else {},
                        "relevance": 1 - docs_results['distances'][0][i] if docs_results['distances'] else 0.0,
                        "source": "document"
                    })
            
            # Sort by relevance
            combined_results.sort(key=lambda x: x['relevance'], reverse=True)
            
            return combined_results[:n_results]
            
        except Exception as e:
            print(f"Error querying RAG: {e}")
            return []
    
    def get_status(self) -> Dict[str, Any]:
        """Get RAG system status"""
        try:
            tools_count = self.tools_collection.count()
            docs_count = self.docs_collection.count()
            conversations_count = self.conversations_collection.count()
            
            return {
                "status": self.status,
                "indexed_tools": tools_count,
                "indexed_docs": docs_count,
                "indexed_conversations": conversations_count,
                "total_sources": tools_count + docs_count + conversations_count,
                "embedding_model": "all-MiniLM-L6-v2",
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


# Global RAG instance
_rag_instance: Optional[RAGSystem] = None


def get_rag_system() -> RAGSystem:
    """Get or create global RAG system instance"""
    global _rag_instance
    
    if _rag_instance is None:
        print("🚀 Initializing RAG system...")
        _rag_instance = RAGSystem()
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
