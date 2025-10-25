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

# Import AI modules
from ai.multi_model_orchestrator import MultiModelOrchestrator
from ai.config_manager import AIConfigManager
from ai.rag import get_rag_system
from ai.prompts.persona_system_prompts import build_persona_prompt_with_relationship

db = SQLiteDB()
config_manager = AIConfigManager()
logger = logging.getLogger(__name__)

# Initialize RAG system
try:
    rag_system = get_rag_system()
    logger.info("✅ RAG system initialized successfully")
except Exception as e:
    logger.error(f"⚠️ Failed to initialize RAG system: {str(e)}")
    rag_system = None

# Initialize Multi-Model Orchestrator with config manager
try:
    orchestrator = MultiModelOrchestrator(
        db_manager=db,
        config_manager=config_manager
    )
    logger.info("✅ Multi-Model Orchestrator initialized successfully")
except Exception as e:
    logger.error(f"⚠️ Failed to initialize Multi-Model Orchestrator: {str(e)}")
    orchestrator = None

# ============================================
# REQUEST/RESPONSE MODELS
# ============================================

class MessageRequest(BaseModel):
    conversation_id: Optional[str] = None
    content: str
    role: str = "user"  # user | assistant | system
    persona_id: Optional[str] = None  # Optional persona override
    mode: Optional[str] = "flash"  # Chat mode: flash | pro
    character_id: Optional[str] = None  # Optional user character for relationship context

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
    mode: Optional[str] = "flash"  # Chat mode: flash | pro
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
        
        # Get persona - priority: request.persona_id > default from DB
        persona_obj = None
        persona_id = request.persona_id
        
        if persona_id:
            # User specified a persona
            persona_obj = db.get_persona(persona_id)
        else:
            # Get default persona from database
            persona_obj = db.get_default_persona()
        
        # Fallback to Lycus if no persona found
        if not persona_obj:
            logger.warning("⚠️ No persona found, using fallback")
            persona_obj = {
                'id': 'fallback-lycus',
                'name': 'Lycus',
                'ai_name': 'Lycus',
                'ai_nickname': '',
                'user_greeting': 'Kawan',
                'personality_traits': {
                    'technical': 90,
                    'friendly': 70,
                    'direct': 85,
                    'creative': 60,
                    'professional': 75
                },
                'response_style': 'technical',
                'tone': 'direct',
                'preferred_language': 'id',  # ✅ Default to Indonesian
                'system_prompt': """Anda adalah Lycus, asisten AI yang teknis dan direct.
Gunakan Bahasa Indonesia untuk semua respons Anda.
Panggil user dengan sebutan 'Kawan'.
Berikan jawaban yang akurat, teknis namun tetap ramah."""
            }
        
        # Create or get conversation
        conversation_id = request.conversation_id
        
        if not conversation_id:
            # Create new conversation with persona_id and mode
            conversation_id = str(uuid.uuid4())
            db.insert_conversation({
                'id': conversation_id,
                'title': request.content[:50] + ('...' if len(request.content) > 50 else ''),
                'persona': persona_obj['id'],  # Store persona_id instead of name
                'mode': request.mode or 'flash',  # Store chat mode
                'created_at': timestamp,
                'updated_at': timestamp
            })
        else:
            # Get existing conversation
            conv = db.get_conversation(conversation_id)
            if conv and not persona_id:
                # Use conversation's persona if no override
                conv_persona = db.get_persona(conv.get('persona', persona_obj['id']))
                if conv_persona:
                    persona_obj = conv_persona
        
        # Get relationship and character if character_id provided
        relationship = None
        character = None
        enhanced_persona = persona_obj  # Will be enhanced with relationship context
        
        if request.character_id:
            try:
                # Fetch character details
                character = db.get_user_character(request.character_id)
                
                if character:
                    # Fetch relationship between persona and character
                    relationship = db.get_relationship_by_persona_character(
                        persona_obj['id'],
                        request.character_id
                    )
                    
                    if relationship:
                        logger.info(f"✅ Relationship found: {relationship['relationship_type']} - {relationship['primary_nickname']}")
                        
                        # Build enhanced system prompt with relationship context
                        enhanced_system_prompt = build_persona_prompt_with_relationship(
                            persona_obj,
                            relationship,
                            character
                        )
                        
                        # Create enhanced persona object with new system prompt
                        enhanced_persona = persona_obj.copy()
                        enhanced_persona['system_prompt'] = enhanced_system_prompt
                        
                        logger.info(f"🔗 Enhanced persona with relationship context for {character['name']}")
                    else:
                        logger.warning(f"⚠️ No relationship found between {persona_obj['name']} and {character['name']}")
                else:
                    logger.warning(f"⚠️ Character not found: {request.character_id}")
            except Exception as e:
                logger.error(f"❌ Error fetching relationship context: {str(e)}")
        
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
            logger.info("🤖 Processing message through 5-Agent Pipeline...")
            
            # Get conversation history (last 5 messages for context)
            history = db.get_messages(conversation_id, limit=5)
            
            # Process through agents with enhanced persona (includes relationship context)
            result = orchestrator.process_message(
                user_input=request.content,
                persona=enhanced_persona,  # Pass enhanced persona with relationship context
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
                'persona': persona_obj['name']
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
            orchestrator_type = system_status.get("orchestrator_type", "multi-model")
            agent_models = system_status.get("agent_models", {})
        else:
            ollama_connected = False
            agents_ready = {
                "router": False,
                "rag": False,
                "specialized": False,
                "persona": False
            }
            orchestrator_type = "unknown"
            agent_models = {}
        
        return {
            "status": "operational" if orchestrator else "limited",
            "orchestrator_type": orchestrator_type,
            "total_conversations": total_convs,
            "llm_integrated": ollama_connected,
            "rag_active": True,
            "agents_ready": agents_ready,
            "agent_models": agent_models,
            "message": "Multi-Model system operational with Ollama" if ollama_connected else "Mock mode - Ollama not connected"
        }
    except Exception as e:
        logger.error(f"❌ Status check error: {str(e)}")
        return {
            "status": "error",
            "message": str(e)
        }

# ============================================
# AI CONFIGURATION ENDPOINTS
# ============================================

class AIConfigRequest(BaseModel):
    ollama_url: Optional[str] = None
    model: Optional[str] = None
    default_persona: Optional[str] = None
    context_window_size: Optional[int] = None
    temperature: Optional[float] = None
    execution_enabled: Optional[bool] = None
    execution_policy: Optional[str] = None

@router.get("/ai/config")
async def get_ai_config():
    """Get current AI configuration"""
    try:
        config = config_manager.get_config()
        return {
            "success": True,
            "config": config
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get config: {str(e)}")

@router.post("/ai/config")
async def update_ai_config(request: AIConfigRequest):
    """Update AI configuration"""
    try:
        # Build updates dict (only include provided fields)
        updates = {}
        if request.ollama_url is not None:
            updates["ollama_url"] = request.ollama_url
        if request.model is not None:
            updates["model"] = request.model
        if request.default_persona is not None:
            updates["default_persona"] = request.default_persona
        if request.context_window_size is not None:
            updates["context_window_size"] = request.context_window_size
        if request.temperature is not None:
            updates["temperature"] = request.temperature
        if request.execution_enabled is not None:
            updates["execution_enabled"] = request.execution_enabled
        if request.execution_policy is not None:
            updates["execution_policy"] = request.execution_policy
        
        # Save configuration
        success = config_manager.save_config(updates)
        
        if success and orchestrator:
            # Reload orchestrator with new config
            orchestrator.reload_config()
        
        return {
            "success": success,
            "message": "Configuration saved successfully" if success else "Failed to save configuration",
            "config": config_manager.get_config()
        }
    except Exception as e:
        logger.error(f"❌ Failed to update config: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to update config: {str(e)}")

@router.post("/ai/test-connection")
async def test_ollama_connection():
    """Test connection to Ollama server"""
    try:
        if not orchestrator:
            return {
                "success": False,
                "connected": False,
                "message": "Agent Orchestrator not initialized"
            }
        
        # Test connection
        connected = orchestrator.test_ollama_connection()
        
        if connected:
            # Try to list models
            models = orchestrator.ollama.list_models()
            return {
                "success": True,
                "connected": True,
                "message": "✅ Connected to Ollama successfully!",
                "ollama_url": config_manager.get_ollama_url(),
                "available_models": models,
                "current_model": config_manager.get_model()
            }
        else:
            return {
                "success": False,
                "connected": False,
                "message": "❌ Cannot connect to Ollama server. Make sure Ollama is running.",
                "ollama_url": config_manager.get_ollama_url()
            }
    except Exception as e:
        logger.error(f"❌ Connection test error: {str(e)}")
        return {
            "success": False,
            "connected": False,
            "message": f"❌ Connection test failed: {str(e)}"
        }

@router.get("/ai/models")
async def list_ollama_models():
    """List available Ollama models"""
    try:
        if not orchestrator:
            return {
                "success": False,
                "models": [],
                "message": "Agent Orchestrator not initialized"
            }
        
        models = orchestrator.ollama.list_models()
        return {
            "success": True,
            "models": models,
            "current_model": config_manager.get_model()
        }
    except Exception as e:
        logger.error(f"❌ Failed to list models: {str(e)}")
        return {
            "success": False,
            "models": [],
            "message": str(e)
        }


# ============================================
# AI MODELS MANAGEMENT ENDPOINTS (Database)
# ============================================

class AIModelRequest(BaseModel):
    model_name: str
    display_name: str
    description: Optional[str] = ""

@router.get("/ai/models/list")
async def get_ai_models_from_db():
    """Get all AI models from database"""
    try:
        models = db.get_ai_models()
        return {
            "success": True,
            "models": models
        }
    except Exception as e:
        logger.error(f"❌ Failed to get models: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to get models: {str(e)}")

@router.post("/ai/models/add")
async def add_ai_model(request: AIModelRequest):
    """Add a new AI model to database"""
    try:
        # Check if model_name already exists
        existing = db.get_ai_model_by_name(request.model_name)
        if existing:
            raise HTTPException(status_code=400, detail="Model with this name already exists")
        
        # Create new model
        model_id = str(uuid.uuid4())
        model_data = {
            'id': model_id,
            'model_name': request.model_name,
            'display_name': request.display_name,
            'description': request.description,
            'is_default': 0,
            'created_at': datetime.now().isoformat()
        }
        
        db.insert_ai_model(model_data)
        
        return {
            "success": True,
            "message": "Model added successfully",
            "model": model_data
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Failed to add model: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to add model: {str(e)}")

@router.put("/ai/models/{model_id}")
async def update_ai_model(model_id: str, request: AIModelRequest):
    """Update an AI model"""
    try:
        # Check if model exists
        existing = db.get_ai_model(model_id)
        if not existing:
            raise HTTPException(status_code=404, detail="Model not found")
        
        # Update model
        updates = {
            'model_name': request.model_name,
            'display_name': request.display_name,
            'description': request.description
        }
        
        success = db.update_ai_model(model_id, updates)
        
        if success:
            return {
                "success": True,
                "message": "Model updated successfully"
            }
        else:
            raise HTTPException(status_code=400, detail="Failed to update model")
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Failed to update model: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to update model: {str(e)}")

@router.delete("/ai/models/{model_id}")
async def delete_ai_model(model_id: str):
    """Delete an AI model (cannot delete default)"""
    try:
        success = db.delete_ai_model(model_id)
        
        if success:
            return {
                "success": True,
                "message": "Model deleted successfully"
            }
        else:
            raise HTTPException(status_code=400, detail="Failed to delete model")
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"❌ Failed to delete model: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to delete model: {str(e)}")

@router.post("/ai/models/set-default/{model_id}")
async def set_default_model(model_id: str):
    """Set a model as default"""
    try:
        # Check if model exists
        model = db.get_ai_model(model_id)
        if not model:
            raise HTTPException(status_code=404, detail="Model not found")
        
        # Set as default
        success = db.set_default_ai_model(model_id)
        
        if success:
            # Update config to use this model
            config_manager.save_config({'model': model['model_name']})
            
            # Reload orchestrator
            if orchestrator:
                orchestrator.reload_config()
            
            return {
                "success": True,
                "message": f"Default model set to: {model['display_name']}"
            }
        else:
            raise HTTPException(status_code=400, detail="Failed to set default model")
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Failed to set default model: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to set default model: {str(e)}")

@router.post("/ai/models/test/{model_name}")
async def test_specific_model(model_name: str):
    """Test a specific model (check if it exists in Ollama)"""
    try:
        if not orchestrator:
            return {
                "success": False,
                "available": False,
                "message": "Agent Orchestrator not initialized"
            }
        
        # Test connection first
        if not orchestrator.test_ollama_connection():
            return {
                "success": False,
                "available": False,
                "message": "❌ Cannot connect to Ollama server. Make sure Ollama is running."
            }
        
        # List available models
        available_models = orchestrator.ollama.list_models()
        
        # Check if the model exists
        model_exists = model_name in available_models
        
        if model_exists:
            return {
                "success": True,
                "available": True,
                "message": f"✅ Model '{model_name}' is available in Ollama!"
            }
        else:
            return {
                "success": False,
                "available": False,
                "message": f"❌ Model '{model_name}' not found in Ollama. Available models: {', '.join(available_models[:3])}..."
            }
    except Exception as e:
        logger.error(f"❌ Failed to test model: {str(e)}")
        return {
            "success": False,
            "available": False,
            "message": f"❌ Test failed: {str(e)}"
        }


# ============================================
# RAG ENDPOINTS
# ============================================

class RAGQueryRequest(BaseModel):
    query: str
    n_results: int = 5

@router.post("/rag/query")
async def query_rag(request: RAGQueryRequest):
    """
    Query RAG system for relevant context
    Returns: List of relevant documents with scores
    """
    try:
        if not rag_system:
            raise HTTPException(status_code=503, detail="RAG system not initialized")
        
        results = rag_system.query(request.query, request.n_results)
        
        return {
            "success": True,
            "query": request.query,
            "results": results,
            "count": len(results)
        }
    except Exception as e:
        logger.error(f"❌ RAG query error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"RAG query failed: {str(e)}")

@router.get("/rag/status")
async def get_rag_status():
    """Get RAG system status and statistics"""
    try:
        if not rag_system:
            return {
                "success": False,
                "status": "not_initialized",
                "message": "RAG system not initialized"
            }
        
        status = rag_system.get_status()
        return {
            "success": True,
            **status
        }
    except Exception as e:
        logger.error(f"❌ RAG status error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to get RAG status: {str(e)}")

@router.post("/rag/index-tools")
async def index_all_tools():
    """Index all tools from database into RAG"""
    try:
        if not rag_system:
            raise HTTPException(status_code=503, detail="RAG system not initialized")
        
        # Get all tools
        tools = db.list_tools()
        indexed_count = 0
        
        for tool in tools:
            success = rag_system.index_tool(tool['_id'], tool)
            if success:
                indexed_count += 1
        
        return {
            "success": True,
            "message": f"Indexed {indexed_count}/{len(tools)} tools",
            "indexed": indexed_count,
            "total": len(tools)
        }
    except Exception as e:
        logger.error(f"❌ Tool indexing error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to index tools: {str(e)}")

@router.post("/rag/clear/{collection_name}")
async def clear_rag_collection(collection_name: str):
    """Clear a specific RAG collection (tools, docs, conversations)"""
    try:
        if not rag_system:
            raise HTTPException(status_code=503, detail="RAG system not initialized")
        
        if collection_name not in ['tools', 'docs', 'conversations']:
            raise HTTPException(status_code=400, detail="Invalid collection name. Must be: tools, docs, or conversations")
        
        success = rag_system.clear_collection(collection_name)
        
        if success:
            return {
                "success": True,
                "message": f"Collection '{collection_name}' cleared successfully"
            }
        else:
            raise HTTPException(status_code=400, detail=f"Failed to clear collection '{collection_name}'")
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Clear collection error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to clear collection: {str(e)}")

