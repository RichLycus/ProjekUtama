"""
Agent Configuration API Routes
Manage agent models and configurations
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
import uuid
import logging

router = APIRouter(prefix="/api/agents", tags=["agents"])

# Import database
from database import SQLiteDB

db = SQLiteDB()
logger = logging.getLogger(__name__)


# ============================================
# REQUEST/RESPONSE MODELS
# ============================================

class AgentConfigRequest(BaseModel):
    agent_type: str
    model_name: str
    display_name: str
    description: Optional[str] = ""
    temperature: Optional[float] = 0.7
    max_tokens: Optional[int] = 2000
    is_enabled: Optional[int] = 1


class AgentConfigUpdateRequest(BaseModel):
    model_name: Optional[str] = None
    display_name: Optional[str] = None
    description: Optional[str] = None
    temperature: Optional[float] = None
    max_tokens: Optional[int] = None
    is_enabled: Optional[int] = None


# ============================================
# AGENT CONFIGURATION ENDPOINTS
# ============================================

@router.get("/configs")
async def get_agent_configs():
    """Get all agent configurations"""
    try:
        configs = db.get_agent_configs()
        return {
            "success": True,
            "configs": configs,
            "count": len(configs)
        }
    except Exception as e:
        logger.error(f"❌ Failed to get agent configs: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to get agent configs: {str(e)}")


@router.get("/configs/{agent_id}")
async def get_agent_config(agent_id: str):
    """Get a specific agent configuration"""
    try:
        config = db.get_agent_config(agent_id)
        if not config:
            raise HTTPException(status_code=404, detail="Agent config not found")
        
        return {
            "success": True,
            "config": config
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Failed to get agent config: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to get agent config: {str(e)}")


@router.get("/configs/type/{agent_type}")
async def get_agent_config_by_type(agent_type: str):
    """Get agent configuration by type (router, chat, code, etc.)"""
    try:
        config = db.get_agent_config_by_type(agent_type)
        if not config:
            raise HTTPException(status_code=404, detail=f"Agent config for type '{agent_type}' not found")
        
        return {
            "success": True,
            "config": config
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Failed to get agent config by type: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to get agent config: {str(e)}")


@router.post("/configs")
async def create_agent_config(request: AgentConfigRequest):
    """Create a new agent configuration"""
    try:
        # Check if agent_type already exists
        existing = db.get_agent_config_by_type(request.agent_type)
        if existing:
            raise HTTPException(status_code=400, detail=f"Agent config for type '{request.agent_type}' already exists")
        
        # Create new config
        config_id = str(uuid.uuid4())
        now = datetime.now().isoformat()
        
        config_data = {
            'id': config_id,
            'agent_type': request.agent_type,
            'model_name': request.model_name,
            'display_name': request.display_name,
            'description': request.description,
            'is_enabled': request.is_enabled,
            'temperature': request.temperature,
            'max_tokens': request.max_tokens,
            'created_at': now,
            'updated_at': now
        }
        
        db.insert_agent_config(config_data)
        
        logger.info(f"✅ Created agent config: {request.agent_type} → {request.model_name}")
        
        return {
            "success": True,
            "message": "Agent config created successfully",
            "config": config_data
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Failed to create agent config: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to create agent config: {str(e)}")


@router.put("/configs/{agent_id}")
async def update_agent_config(agent_id: str, request: AgentConfigUpdateRequest):
    """Update an agent configuration"""
    try:
        # Check if config exists
        existing = db.get_agent_config(agent_id)
        if not existing:
            raise HTTPException(status_code=404, detail="Agent config not found")
        
        # Build updates dict (only include provided fields)
        updates = {}
        if request.model_name is not None:
            updates["model_name"] = request.model_name
        if request.display_name is not None:
            updates["display_name"] = request.display_name
        if request.description is not None:
            updates["description"] = request.description
        if request.temperature is not None:
            updates["temperature"] = request.temperature
        if request.max_tokens is not None:
            updates["max_tokens"] = request.max_tokens
        if request.is_enabled is not None:
            updates["is_enabled"] = request.is_enabled
        
        # Update config
        success = db.update_agent_config(agent_id, updates)
        
        if success:
            updated_config = db.get_agent_config(agent_id)
            logger.info(f"✅ Updated agent config: {agent_id}")
            
            return {
                "success": True,
                "message": "Agent config updated successfully",
                "config": updated_config
            }
        else:
            raise HTTPException(status_code=400, detail="Failed to update agent config")
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Failed to update agent config: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to update agent config: {str(e)}")


@router.delete("/configs/{agent_id}")
async def delete_agent_config(agent_id: str):
    """Delete an agent configuration"""
    try:
        # Check if config exists
        config = db.get_agent_config(agent_id)
        if not config:
            raise HTTPException(status_code=404, detail="Agent config not found")
        
        # Delete config
        success = db.delete_agent_config(agent_id)
        
        if success:
            logger.info(f"✅ Deleted agent config: {agent_id}")
            return {
                "success": True,
                "message": "Agent config deleted successfully"
            }
        else:
            raise HTTPException(status_code=400, detail="Failed to delete agent config")
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Failed to delete agent config: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to delete agent config: {str(e)}")


@router.post("/configs/{agent_id}/toggle")
async def toggle_agent_config(agent_id: str):
    """Toggle agent enabled/disabled status"""
    try:
        # Check if config exists
        config = db.get_agent_config(agent_id)
        if not config:
            raise HTTPException(status_code=404, detail="Agent config not found")
        
        # Toggle status
        success = db.toggle_agent_config(agent_id)
        
        if success:
            updated_config = db.get_agent_config(agent_id)
            new_status = "enabled" if updated_config['is_enabled'] == 1 else "disabled"
            
            logger.info(f"✅ Toggled agent config: {agent_id} → {new_status}")
            
            return {
                "success": True,
                "message": f"Agent config {new_status}",
                "config": updated_config
            }
        else:
            raise HTTPException(status_code=400, detail="Failed to toggle agent config")
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Failed to toggle agent config: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to toggle agent config: {str(e)}")


@router.get("/types")
async def get_agent_types():
    """Get list of available agent types"""
    return {
        "success": True,
        "agent_types": [
            {
                "type": "router",
                "name": "Router Agent",
                "description": "Validates input, classifies intent, and routes requests",
                "recommended_models": ["phi3:mini", "phi3:3.8b", "llama3.2:3b"]
            },
            {
                "type": "rag",
                "name": "RAG Agent",
                "description": "Retrieves context using vector embeddings",
                "recommended_models": ["all-MiniLM-L6-v2", "bge-large", "nomic-embed-text"]
            },
            {
                "type": "chat",
                "name": "Chat Agent",
                "description": "Handles simple conversational requests",
                "recommended_models": ["gemma2:2b", "llama3.2:3b", "phi3:mini"]
            },
            {
                "type": "code",
                "name": "Code Agent",
                "description": "Specialized for programming tasks",
                "recommended_models": ["qwen2.5-coder:7b", "codellama:7b", "deepseek-coder:6.7b"]
            },
            {
                "type": "analysis",
                "name": "Analysis Agent",
                "description": "Handles analytical and reasoning tasks",
                "recommended_models": ["qwen2.5:7b", "llama3:8b", "mixtral:8x7b"]
            },
            {
                "type": "creative",
                "name": "Creative Agent",
                "description": "Handles creative and artistic tasks",
                "recommended_models": ["llama3:8b", "mistral:7b", "gemma2:9b"]
            },
            {
                "type": "tool",
                "name": "Tool Agent",
                "description": "Detects and coordinates tool execution",
                "recommended_models": ["phi3:mini", "gemma2:2b", "llama3.2:3b"]
            },
            {
                "type": "persona",
                "name": "Persona Agent",
                "description": "Formats responses with personality",
                "recommended_models": ["gemma2:2b", "phi3:mini", "llama3.2:3b"]
            }
        ]
    }


@router.post("/reload")
async def reload_agents():
    """Reload agent configurations (will be implemented in orchestrator)"""
    try:
        # This endpoint will trigger orchestrator reload
        # For now, just return success
        logger.info("🔄 Agent reload requested")
        
        return {
            "success": True,
            "message": "Agent configurations reloaded. Restart backend to apply changes."
        }
    except Exception as e:
        logger.error(f"❌ Failed to reload agents: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to reload agents: {str(e)}")
