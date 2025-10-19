"""
Chat API Routes for ChimeraAI Phase 3
Simple message storage and retrieval (20% implementation)
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
import uuid

router = APIRouter(prefix="/api/chat", tags=["chat"])

# Import database
from database import SQLiteDB

db = SQLiteDB()

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
    - Returns mock AI response (for now, real LLM integration in future)
    """
    try:
        # Generate IDs
        message_id = str(uuid.uuid4())
        timestamp = datetime.now().isoformat()
        
        # Create or get conversation
        conversation_id = request.conversation_id
        if not conversation_id:
            # Create new conversation
            conversation_id = str(uuid.uuid4())
            db.insert_conversation({
                'id': conversation_id,
                'title': request.content[:50] + ('...' if len(request.content) > 50 else ''),
                'persona': 'lycus',  # Default persona
                'created_at': timestamp,
                'updated_at': timestamp
            })
        
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
        
        # Generate mock AI response (Phase 3.2 will replace with real LLM)
        ai_message_id = str(uuid.uuid4())
        ai_timestamp = datetime.now().isoformat()
        
        ai_response = f"[Mock Response] I received your message: '{request.content[:30]}...'. Real AI integration coming in Phase 3.2!"
        
        ai_message_data = {
            'id': ai_message_id,
            'conversation_id': conversation_id,
            'role': 'assistant',
            'content': ai_response,
            'agent_tag': 'mock-agent',
            'execution_log': {
                'router': 'Mock intent detected',
                'rag': 'No RAG yet',
                'reasoning': 'Mock response generated',
                'persona': 'lycus'
            },
            'timestamp': ai_timestamp
        }
        db.insert_message(ai_message_data)
        
        # Return AI response
        return MessageResponse(**ai_message_data)
        
    except Exception as e:
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
        conversations = db.get_conversations(limit=1)
        total_convs = len(db.get_conversations(limit=1000))  # Quick count
        
        return {
            "status": "operational",
            "total_conversations": total_convs,
            "llm_integrated": False,  # Will be True in Phase 3.2
            "rag_active": False,       # Will be True in Phase 3.2
            "agents_ready": {
                "router": False,
                "rag": False,
                "execution": False,
                "reasoning": False,
                "persona": False
            },
            "message": "Chat infrastructure ready. LLM integration pending."
        }
    except Exception as e:
        return {
            "status": "error",
            "message": str(e)
        }
