"""
Personas API Routes
Manage AI personas with different personalities
"""

from fastapi import APIRouter, HTTPException, UploadFile, File
from fastapi.responses import FileResponse
from pydantic import BaseModel
from typing import Optional, Dict, Any
from datetime import datetime
from pathlib import Path
import uuid
import shutil

from database import SQLiteDB

router = APIRouter(prefix="/api/personas", tags=["personas"])
db = SQLiteDB()

# Avatar storage directory (relative path)
BACKEND_DIR = Path(__file__).parent.parent
AVATAR_DIR = BACKEND_DIR / "data" / "avatars"
AVATAR_DIR.mkdir(parents=True, exist_ok=True)

# Allowed avatar file extensions
ALLOWED_AVATAR_EXTENSIONS = {'.png', '.jpg', '.jpeg', '.webp'}
MAX_AVATAR_SIZE = 2 * 1024 * 1024  # 2MB


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
    user_display_name: Optional[str] = None
    personality_traits: Optional[Dict[str, int]] = None
    response_style: Optional[str] = None
    tone: Optional[str] = None
    sample_greeting: Optional[str] = None
    avatar_color: Optional[str] = None
    avatar_url: Optional[str] = None


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


@router.post("/{persona_id}/avatar")
async def upload_persona_avatar(persona_id: str, file: UploadFile = File(...)):
    """
    Upload avatar image for a persona
    
    Args:
        persona_id: ID of the persona
        file: Avatar image file (PNG, JPG, JPEG, WEBP, max 2MB)
    
    Returns:
        Success status and avatar URL
    """
    try:
        # Check if persona exists
        persona = db.get_persona(persona_id)
        if not persona:
            raise HTTPException(status_code=404, detail="Persona not found")
        
        # Validate file extension
        file_extension = Path(file.filename).suffix.lower()
        if file_extension not in ALLOWED_AVATAR_EXTENSIONS:
            raise HTTPException(
                status_code=400,
                detail=f"Unsupported file type. Allowed: {', '.join(ALLOWED_AVATAR_EXTENSIONS)}"
            )
        
        # Read file to check size
        file_content = await file.read()
        file_size = len(file_content)
        
        if file_size > MAX_AVATAR_SIZE:
            raise HTTPException(
                status_code=400,
                detail=f"File too large. Max size: {MAX_AVATAR_SIZE / (1024*1024)}MB"
            )
        
        # Create persona-specific avatar directory
        persona_avatar_dir = AVATAR_DIR / persona_id
        persona_avatar_dir.mkdir(parents=True, exist_ok=True)
        
        # Delete old avatar files if exist
        for old_file in persona_avatar_dir.glob("avatar.*"):
            old_file.unlink()
        
        # Save new avatar
        avatar_filename = f"avatar{file_extension}"
        avatar_path = persona_avatar_dir / avatar_filename
        
        # Reset file pointer and save
        await file.seek(0)
        with open(avatar_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        # Generate relative URL for database (portable!)
        avatar_url = f"/api/personas/{persona_id}/avatar/view"
        
        # Update persona with avatar URL
        success = db.update_persona(persona_id, {
            "avatar_url": avatar_url
        })
        
        if not success:
            raise HTTPException(status_code=500, detail="Failed to update persona avatar")
        
        return {
            "success": True,
            "message": "Avatar uploaded successfully",
            "avatar_url": avatar_url,
            "file_size": file_size,
            "file_size_mb": round(file_size / (1024*1024), 2)
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Avatar upload failed: {str(e)}")


@router.get("/{persona_id}/avatar/view")
async def view_persona_avatar(persona_id: str):
    """
    View/download persona avatar image
    
    Args:
        persona_id: ID of the persona
    
    Returns:
        Avatar image file
    """
    try:
        # Check if persona exists
        persona = db.get_persona(persona_id)
        if not persona:
            raise HTTPException(status_code=404, detail="Persona not found")
        
        # Find avatar file
        persona_avatar_dir = AVATAR_DIR / persona_id
        
        if not persona_avatar_dir.exists():
            raise HTTPException(status_code=404, detail="Avatar not found")
        
        # Find avatar file (any supported extension)
        avatar_file = None
        for ext in ALLOWED_AVATAR_EXTENSIONS:
            potential_file = persona_avatar_dir / f"avatar{ext}"
            if potential_file.exists():
                avatar_file = potential_file
                break
        
        if not avatar_file:
            raise HTTPException(status_code=404, detail="Avatar file not found")
        
        # Return file
        return FileResponse(
            path=str(avatar_file),
            media_type="image/png",
            filename=avatar_file.name
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to view avatar: {str(e)}")


@router.delete("/{persona_id}/avatar")
async def delete_persona_avatar(persona_id: str):
    """
    Delete persona avatar
    
    Args:
        persona_id: ID of the persona
    
    Returns:
        Success status
    """
    try:
        # Check if persona exists
        persona = db.get_persona(persona_id)
        if not persona:
            raise HTTPException(status_code=404, detail="Persona not found")
        
        # Delete avatar directory
        persona_avatar_dir = AVATAR_DIR / persona_id
        
        if persona_avatar_dir.exists():
            shutil.rmtree(persona_avatar_dir)
        
        # Remove avatar_url from database
        success = db.update_persona(persona_id, {
            "avatar_url": None
        })
        
        if not success:
            raise HTTPException(status_code=500, detail="Failed to update persona")
        
        return {
            "success": True,
            "message": "Avatar deleted successfully"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete avatar: {str(e)}")
