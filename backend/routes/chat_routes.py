"""
Chat API Routes for ChimeraAI Phase 3
Multi-Agent System with Ollama Integration (60% implementation)
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
import uuid
import logging

router = APIRouter(prefix="/api/chat", tags=["chat"])

# Import database
from database import SQLiteDB

# Import AI orchestrator
from ai.agent_orchestrator import AgentOrchestrator

db = SQLiteDB()

# Initialize Agent Orchestrator
# It will try to connect to Ollama, but will work with mock if unavailable
try:
    orchestrator = AgentOrchestrator(
        ollama_url="http://localhost:11434",
        model="llama3:8b",
        db_manager=db
    )
    logger = logging.getLogger(__name__)
    logger.info("✅ Agent Orchestrator initialized successfully")
except Exception as e:
    logger = logging.getLogger(__name__)
    logger.error(f"⚠️ Failed to initialize Agent Orchestrator: {str(e)}")
    orchestrator = None

# ============================================
# REQUEST/RESPONSE MODELS
# ============================================

class MessageRequest(BaseModel):
    conversation_id: Optional[str] = None
    content: str
    role: str = "user"  # user | assistant | system

class MessageResponse(BaseModel):
    id: str
    conversation_id: str
    role: str
    content: str
    agent_tag: Optional[str] = None
    execution_log: Optional[dict] = None
    timestamp: str

class ConversationResponse(BaseModel):
    id: str
    title: str
    persona: str
    created_at: str
    updated_at: str

# ============================================
# API ENDPOINTS
# ============================================

@router.post("/message", response_model=MessageResponse)
async def send_message(request: MessageRequest):
    """
    Send a chat message
    - Creates new conversation if conversation_id is None
    - Saves user message
    - Processes through 5-Agent Pipeline (Router → RAG → Execution → Reasoning → Persona)
    - Returns AI response from Ollama LLM
    """
    try:
        # Generate IDs
        message_id = str(uuid.uuid4())
        timestamp = datetime.now().isoformat()
        
        # Create or get conversation
        conversation_id = request.conversation_id
        persona = 'lycus'  # Default persona
        
        if not conversation_id:
            # Create new conversation
            conversation_id = str(uuid.uuid4())
            db.insert_conversation({
                'id': conversation_id,
                'title': request.content[:50] + ('...' if len(request.content) > 50 else ''),
                'persona': persona,
                'created_at': timestamp,
                'updated_at': timestamp
            })
        else:
            # Get persona from existing conversation
            conv = db.get_conversation(conversation_id)
            if conv:
                persona = conv.get('persona', 'lycus')
        
        # Save user message
        user_message_data = {
            'id': message_id,
            'conversation_id': conversation_id,
            'role': request.role,
            'content': request.content,
            'agent_tag': None,
            'execution_log': None,
            'timestamp': timestamp
        }
        db.insert_message(user_message_data)
        
        # Process through Agent Orchestrator
        ai_message_id = str(uuid.uuid4())
        ai_timestamp = datetime.now().isoformat()
        
        if orchestrator and orchestrator.test_ollama_connection():
            logger.info(f"🤖 Processing message through 5-Agent Pipeline...")
            
            # Get conversation history (last 5 messages for context)
            history = db.get_messages(conversation_id, limit=5)
            
            # Process through agents
            result = orchestrator.process_message(
                user_input=request.content,
                persona=persona,
                conversation_history=history
            )
            
            ai_response = result.get("response", "")
            agent_tag = result.get("agent_tag", "multi-agent")
            execution_log = result.get("execution_log", {})
            
            logger.info(f"✅ Agent pipeline complete: {len(ai_response)} chars")
            
        else:
            # Fallback to mock response if Ollama unavailable
            logger.warning("⚠️ Ollama not available, using mock response")
            ai_response = f"[Mock Response] I received your message: '{request.content[:30]}...'. Ollama integration ready, but server not connected."
            agent_tag = 'mock-agent'
            execution_log = {
                'router': 'Ollama not connected',
                'rag': 'Skipped',
                'execution': 'Skipped',
                'reasoning': 'Mock response',
                'persona': persona
            }
        
        # Save AI response
        ai_message_data = {
            'id': ai_message_id,
            'conversation_id': conversation_id,
            'role': 'assistant',
            'content': ai_response,
            'agent_tag': agent_tag,
            'execution_log': execution_log,
            'timestamp': ai_timestamp
        }
        db.insert_message(ai_message_data)
        
        # Return AI response
        return MessageResponse(**ai_message_data)
        
    except Exception as e:
        logger.error(f"❌ Error in send_message: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to send message: {str(e)}")

@router.get("/history/{conversation_id}", response_model=List[MessageResponse])
async def get_chat_history(conversation_id: str, limit: int = 100):
    """Get all messages for a conversation"""
    try:
        messages = db.get_messages(conversation_id, limit)
        return [MessageResponse(**msg) for msg in messages]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get chat history: {str(e)}")

@router.get("/conversations", response_model=List[ConversationResponse])
async def get_conversations(limit: int = 50):
    """Get all conversations"""
    try:
        conversations = db.get_conversations(limit)
        return [ConversationResponse(**conv) for conv in conversations]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get conversations: {str(e)}")

@router.get("/conversation/{conversation_id}", response_model=ConversationResponse)
async def get_conversation(conversation_id: str):
    """Get a specific conversation"""
    try:
        conversation = db.get_conversation(conversation_id)
        if not conversation:
            raise HTTPException(status_code=404, detail="Conversation not found")
        return ConversationResponse(**conversation)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get conversation: {str(e)}")

@router.delete("/conversation/{conversation_id}")
async def delete_conversation(conversation_id: str):
    """Delete a conversation and all its messages"""
    try:
        success = db.delete_conversation(conversation_id)
        if not success:
            raise HTTPException(status_code=404, detail="Conversation not found")
        return {"status": "success", "message": "Conversation deleted"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete conversation: {str(e)}")

@router.post("/clear")
async def clear_all_conversations():
    """Clear all conversations (for testing)"""
    try:
        # This is a destructive operation, use with caution
        conversations = db.get_conversations(limit=1000)
        for conv in conversations:
            db.delete_conversation(conv['id'])
        return {"status": "success", "message": f"Cleared {len(conversations)} conversations"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to clear conversations: {str(e)}")

@router.get("/status")
async def get_chat_status():
    """Get chat system status (for monitoring)"""
    try:
        total_convs = len(db.get_conversations(limit=1000))  # Quick count
        
        if orchestrator:
            system_status = orchestrator.get_system_status()
            ollama_connected = system_status["ollama_connected"]
            agents_ready = system_status["agents_ready"]
        else:
            ollama_connected = False
            agents_ready = {
                "router": False,
                "rag": False,
                "execution": False,
                "reasoning": False,
                "persona": False
            }
        
        return {
            "status": "operational" if orchestrator else "limited",
            "total_conversations": total_convs,
            "llm_integrated": ollama_connected,
            "rag_active": True,  # Basic RAG is active
            "agents_ready": agents_ready,
            "model": orchestrator.model if orchestrator else "N/A",
            "message": "5-Agent system operational with Ollama" if ollama_connected else "Mock mode - Ollama not connected"
        }
    except Exception as e:
        logger.error(f"❌ Status check error: {str(e)}")
        return {
            "status": "error",
            "message": str(e)
        }
