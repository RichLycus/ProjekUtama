"""
Character Routes - API endpoints for YAML-based character management
Part of Phase 6.9.7 - Character/Persona System Migration
"""

from fastapi import APIRouter, HTTPException, Query
from typing import Dict, Any, Optional, List
from pydantic import BaseModel

from ai.character_loader import CharacterLoader
from ai.persona_builder import PersonaBuilder


# Initialize router
router = APIRouter(prefix="/api/characters", tags=["characters"])

# Initialize character system
character_loader = CharacterLoader()
persona_builder = PersonaBuilder(loader=character_loader)


# ===== Request/Response Models =====

class PromptRequest(BaseModel):
    """Request model for building prompts"""
    agent_name: str
    user_name: Optional[str] = None
    include_examples: bool = True
    include_scene: bool = False
    task_mode: bool = False


class RoleplayPromptRequest(BaseModel):
    """Request model for roleplay prompts"""
    agent_name: str
    user_name: Optional[str] = None
    scenario: Optional[str] = None


class ConversationMessage(BaseModel):
    """Message in conversation context"""
    role: str
    content: str


class ContextAwarePromptRequest(BaseModel):
    """Request model for context-aware prompts"""
    agent_name: str
    user_name: Optional[str] = None
    conversation_context: Optional[List[ConversationMessage]] = None
    current_mood: Optional[str] = None


# ===== API Endpoints =====

@router.get("/health")
async def health_check() -> Dict[str, Any]:
    """
    Health check for character system
    
    Returns health status and statistics
    """
    try:
        health = character_loader.health_check()
        return {
            "status": "healthy",
            "details": health,
        }
    except Exception as e:
        return {
            "status": "unhealthy",
            "error": str(e),
        }


@router.get("/schema")
async def get_schema() -> Dict[str, Any]:
    """
    Get character schema definition
    
    Returns the schema.yaml content
    """
    try:
        schema = character_loader.get_schema()
        return {
            "success": True,
            "schema": schema,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error loading schema: {e}")


@router.get("/agents")
async def list_agents() -> Dict[str, Any]:
    """
    List all available agent characters
    
    Returns list of agents with basic info
    """
    try:
        agents = character_loader.list_agents()
        return {
            "success": True,
            "agents": agents,
            "count": len(agents),
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error listing agents: {e}")


@router.get("/agents/{agent_name}")
async def get_agent(agent_name: str) -> Dict[str, Any]:
    """
    Get specific agent character details
    
    Args:
        agent_name: Name of agent (without .yaml extension)
        
    Returns:
        Complete agent character data
    """
    try:
        agent = character_loader.load_agent(agent_name)
        return {
            "success": True,
            "agent": agent.to_dict(),
        }
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail=f"Agent '{agent_name}' not found")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error loading agent: {e}")


@router.post("/agents/{agent_name}/reload")
async def reload_agent(agent_name: str) -> Dict[str, Any]:
    """
    Reload agent character from file (hot reload)
    
    Args:
        agent_name: Name of agent to reload
        
    Returns:
        Reload status and updated character data
    """
    try:
        agent = character_loader.reload_agent(agent_name)
        return {
            "success": True,
            "message": f"Agent '{agent_name}' reloaded successfully",
            "agent": agent.to_dict(),
        }
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail=f"Agent '{agent_name}' not found")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error reloading agent: {e}")


@router.get("/agents/{agent_name}/metadata")
async def get_agent_metadata(agent_name: str) -> Dict[str, Any]:
    """
    Get agent metadata for frontend display
    
    Args:
        agent_name: Name of agent
        
    Returns:
        Agent metadata (name, role, avatar color, etc.)
    """
    try:
        metadata = persona_builder.get_character_metadata(agent_name)
        return {
            "success": True,
            "metadata": metadata,
        }
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail=f"Agent '{agent_name}' not found")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error loading metadata: {e}")


@router.get("/users")
async def list_users() -> Dict[str, Any]:
    """
    List all available user characters
    
    Returns list of users with basic info
    """
    try:
        users = character_loader.list_users()
        return {
            "success": True,
            "users": users,
            "count": len(users),
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error listing users: {e}")


@router.get("/users/{user_name}")
async def get_user(user_name: str) -> Dict[str, Any]:
    """
    Get specific user character details
    
    Args:
        user_name: Name of user (without .yaml extension)
        
    Returns:
        Complete user character data
    """
    try:
        user = character_loader.load_user(user_name)
        return {
            "success": True,
            "user": user.to_dict(),
        }
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail=f"User '{user_name}' not found")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error loading user: {e}")


@router.post("/users/{user_name}/reload")
async def reload_user(user_name: str) -> Dict[str, Any]:
    """
    Reload user character from file (hot reload)
    
    Args:
        user_name: Name of user to reload
        
    Returns:
        Reload status and updated character data
    """
    try:
        user = character_loader.reload_user(user_name)
        return {
            "success": True,
            "message": f"User '{user_name}' reloaded successfully",
            "user": user.to_dict(),
        }
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail=f"User '{user_name}' not found")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error reloading user: {e}")


@router.post("/prompts/system")
async def build_system_prompt(request: PromptRequest) -> Dict[str, Any]:
    """
    Build system prompt from character data
    
    Args:
        request: Prompt configuration
        
    Returns:
        Generated system prompt
    """
    try:
        prompt = persona_builder.build_system_prompt(
            agent_name=request.agent_name,
            user_name=request.user_name,
            include_examples=request.include_examples,
            include_scene=request.include_scene,
            task_mode=request.task_mode,
        )
        return {
            "success": True,
            "prompt": prompt,
            "config": {
                "agent": request.agent_name,
                "user": request.user_name,
                "include_examples": request.include_examples,
                "include_scene": request.include_scene,
                "task_mode": request.task_mode,
            }
        }
    except FileNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error building prompt: {e}")


@router.post("/prompts/short")
async def build_short_prompt(
    agent_name: str = Query(..., description="Agent character name"),
    user_name: Optional[str] = Query(None, description="User character name"),
) -> Dict[str, Any]:
    """
    Build short system prompt (for flash mode)
    
    Args:
        agent_name: Name of agent
        user_name: Name of user (optional)
        
    Returns:
        Short system prompt
    """
    try:
        prompt = persona_builder.build_short_prompt(
            agent_name=agent_name,
            user_name=user_name,
        )
        return {
            "success": True,
            "prompt": prompt,
            "config": {
                "agent": agent_name,
                "user": user_name,
                "type": "short",
            }
        }
    except FileNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error building prompt: {e}")


@router.post("/prompts/roleplay")
async def build_roleplay_prompt(request: RoleplayPromptRequest) -> Dict[str, Any]:
    """
    Build immersive roleplay prompt
    
    Args:
        request: Roleplay prompt configuration
        
    Returns:
        Roleplay-focused system prompt
    """
    try:
        prompt = persona_builder.build_roleplay_prompt(
            agent_name=request.agent_name,
            user_name=request.user_name,
            scenario=request.scenario,
        )
        return {
            "success": True,
            "prompt": prompt,
            "config": {
                "agent": request.agent_name,
                "user": request.user_name,
                "scenario": request.scenario,
                "type": "roleplay",
            }
        }
    except FileNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error building prompt: {e}")


@router.post("/prompts/context-aware")
async def build_context_aware_prompt(request: ContextAwarePromptRequest) -> Dict[str, Any]:
    """
    Build context-aware prompt with conversation history
    
    Args:
        request: Context-aware prompt configuration
        
    Returns:
        Context-aware system prompt
    """
    try:
        # Convert Pydantic models to dicts
        context = None
        if request.conversation_context:
            context = [msg.dict() for msg in request.conversation_context]
        
        prompt = persona_builder.build_context_aware_prompt(
            agent_name=request.agent_name,
            user_name=request.user_name,
            conversation_context=context,
            current_mood=request.current_mood,
        )
        return {
            "success": True,
            "prompt": prompt,
            "config": {
                "agent": request.agent_name,
                "user": request.user_name,
                "has_context": context is not None,
                "mood": request.current_mood,
                "type": "context_aware",
            }
        }
    except FileNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error building prompt: {e}")


@router.post("/cache/clear")
async def clear_cache() -> Dict[str, Any]:
    """
    Clear all cached characters
    
    Forces reload from files on next access
    """
    try:
        character_loader.clear_cache()
        return {
            "success": True,
            "message": "Character cache cleared successfully",
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error clearing cache: {e}")
