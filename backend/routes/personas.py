"""
Personas API Routes
Manage AI personas with different personalities
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, Dict, Any
from datetime import datetime
import uuid

from database import SQLiteDB

router = APIRouter(prefix="/api/personas", tags=["personas"])
db = SQLiteDB()


class PersonaCreate(BaseModel):
    name: str
    ai_name: str
    ai_nickname: Optional[str] = ""
    user_greeting: str
    personality_traits: Dict[str, int]
    response_style: str = "balanced"
    tone: str = "friendly"
    sample_greeting: Optional[str] = ""
    avatar_color: str = "purple"


class PersonaUpdate(BaseModel):
    name: Optional[str] = None
    ai_name: Optional[str] = None
    ai_nickname: Optional[str] = None
    user_greeting: Optional[str] = None
    personality_traits: Optional[Dict[str, int]] = None
    response_style: Optional[str] = None
    tone: Optional[str] = None
    sample_greeting: Optional[str] = None
    avatar_color: Optional[str] = None


@router.get("")
async def get_personas():
    """Get all personas"""
    try:
        personas = db.get_personas()
        return {
            "success": True,
            "personas": personas,
            "count": len(personas)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/default")
async def get_default_persona():
    """Get the default persona"""
    try:
        persona = db.get_default_persona()
        if not persona:
            raise HTTPException(status_code=404, detail="No default persona found")
        
        return {
            "success": True,
            "persona": persona
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{persona_id}")
async def get_persona(persona_id: str):
    """Get a specific persona"""
    try:
        persona = db.get_persona(persona_id)
        if not persona:
            raise HTTPException(status_code=404, detail="Persona not found")
        
        return {
            "success": True,
            "persona": persona
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("")
async def create_persona(persona: PersonaCreate):
    """Create a new persona"""
    try:
        # Check if name already exists
        existing = db.get_persona_by_name(persona.name)
        if existing:
            raise HTTPException(status_code=400, detail="Persona with this name already exists")
        
        # Create persona
        persona_id = str(uuid.uuid4())
        now = datetime.now().isoformat()
        
        persona_data = {
            "id": persona_id,
            "name": persona.name,
            "ai_name": persona.ai_name,
            "ai_nickname": persona.ai_nickname,
            "user_greeting": persona.user_greeting,
            "personality_traits": persona.personality_traits,
            "response_style": persona.response_style,
            "tone": persona.tone,
            "sample_greeting": persona.sample_greeting,
            "avatar_color": persona.avatar_color,
            "is_default": 0,
            "created_at": now,
            "updated_at": now
        }
        
        db.insert_persona(persona_data)
        
        return {
            "success": True,
            "message": "Persona created successfully",
            "persona_id": persona_id
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/{persona_id}")
async def update_persona(persona_id: str, updates: PersonaUpdate):
    """Update a persona"""
    try:
        # Check if persona exists
        existing = db.get_persona(persona_id)
        if not existing:
            raise HTTPException(status_code=404, detail="Persona not found")
        
        # Prepare updates (only include non-None values)
        update_data = {k: v for k, v in updates.dict().items() if v is not None}
        
        if not update_data:
            raise HTTPException(status_code=400, detail="No updates provided")
        
        success = db.update_persona(persona_id, update_data)
        
        if success:
            return {
                "success": True,
                "message": "Persona updated successfully"
            }
        else:
            raise HTTPException(status_code=500, detail="Failed to update persona")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/{persona_id}")
async def delete_persona(persona_id: str):
    """Delete a persona"""
    try:
        success = db.delete_persona(persona_id)
        
        if success:
            return {
                "success": True,
                "message": "Persona deleted successfully"
            }
        else:
            raise HTTPException(status_code=404, detail="Persona not found")
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/{persona_id}/default")
async def set_default_persona(persona_id: str):
    """Set a persona as default"""
    try:
        # Check if persona exists
        persona = db.get_persona(persona_id)
        if not persona:
            raise HTTPException(status_code=404, detail="Persona not found")
        
        success = db.set_default_persona(persona_id)
        
        if success:
            return {
                "success": True,
                "message": f"Persona '{persona['name']}' set as default"
            }
        else:
            raise HTTPException(status_code=500, detail="Failed to set default persona")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
