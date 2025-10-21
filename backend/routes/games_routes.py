"""
Games API Routes - WebGL Game Management
Upload, list, delete WebGL games with ZIP extraction
"""

from fastapi import APIRouter, UploadFile, File, HTTPException, Form
from fastapi.responses import JSONResponse, FileResponse
from pathlib import Path
import uuid
import zipfile
import shutil
from datetime import datetime
from typing import Optional
import os

from database import SQLiteDB

router = APIRouter(prefix="/api/games", tags=["games"])

# Get backend directory
BACKEND_DIR = Path(__file__).parent.parent
GAMES_DIR = BACKEND_DIR / "games"

# Ensure directories exist
GAMES_DIR.mkdir(exist_ok=True)

# Initialize database
db = SQLiteDB()

@router.post("/upload")
async def upload_game(
    name: str = Form(...),
    description: str = Form(...),
    cover_image_url: str = Form(""),
    game_zip: UploadFile = File(...)
):
    """
    Upload a WebGL game as ZIP file
    ZIP must contain index.html at root or in a folder
    """
    try:
        # Validate file type
        if not game_zip.filename.endswith('.zip'):
            raise HTTPException(400, "Only ZIP files are allowed")
        
        # Generate unique game ID
        game_id = str(uuid.uuid4())
        game_folder = GAMES_DIR / game_id
        game_folder.mkdir(parents=True, exist_ok=True)
        
        # Save uploaded ZIP temporarily
        zip_path = game_folder / "game.zip"
        with open(zip_path, 'wb') as f:
            content = await game_zip.read()
            f.write(content)
        
        # Extract ZIP
        extract_folder = game_folder / "game"
        extract_folder.mkdir(exist_ok=True)
        
        with zipfile.ZipFile(zip_path, 'r') as zip_ref:
            zip_ref.extractall(extract_folder)
        
        # Find index.html
        index_path = None
        for root, dirs, files in os.walk(extract_folder):
            if 'index.html' in files:
                index_path = Path(root) / 'index.html'
                break
        
        if not index_path:
            # Cleanup
            shutil.rmtree(game_folder)
            raise HTTPException(400, "No index.html found in ZIP file")
        
        # Get relative path from extract_folder
        relative_index = index_path.relative_to(extract_folder)
        
        # Create game metadata
        now = datetime.utcnow().isoformat()
        game_doc = {
            "id": game_id,
            "name": name,
            "description": description,
            "cover_image_url": cover_image_url or f"https://via.placeholder.com/400x300/667eea/ffffff?text={name[:10]}",
            "folder_path": str(game_folder.relative_to(BACKEND_DIR)),
            "index_file": str(relative_index),
            "uploaded_at": now,
            "updated_at": now,
            "file_size": os.path.getsize(zip_path),
            "status": "active"
        }
        
        # Insert to database
        db.insert_game(game_doc)
        
        # Remove temp ZIP
        zip_path.unlink()
        
        return {
            "success": True,
            "game": game_doc,
            "message": f"Game '{name}' uploaded successfully!"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        # Cleanup on error
        if game_folder.exists():
            shutil.rmtree(game_folder)
        raise HTTPException(500, f"Upload failed: {str(e)}")


@router.get("/list")
async def list_games():
    """Get all uploaded games"""
    try:
        games = db.get_games()
        return {
            "success": True,
            "games": games,
            "count": len(games)
        }
    except Exception as e:
        raise HTTPException(500, f"Failed to load games: {str(e)}")


@router.get("/{game_id}")
async def get_game(game_id: str):
    """Get specific game details"""
    try:
        game = db.get_game(game_id)
        
        if not game:
            raise HTTPException(404, "Game not found")
        
        return {
            "success": True,
            "game": game
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(500, f"Failed to get game: {str(e)}")


@router.delete("/{game_id}")
async def delete_game(game_id: str):
    """Delete a game and its files"""
    try:
        game = db.get_game(game_id)
        
        if not game:
            raise HTTPException(404, "Game not found")
        
        # Delete game folder
        game_folder = BACKEND_DIR / game["folder_path"]
        if game_folder.exists():
            shutil.rmtree(game_folder)
        
        # Remove from database
        db.delete_game(game_id)
        
        return {
            "success": True,
            "message": f"Game '{game['name']}' deleted successfully"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(500, f"Failed to delete game: {str(e)}")


@router.get("/{game_id}/files/{file_path:path}")
async def serve_game_file(game_id: str, file_path: str):
    """Serve game files (for loading game assets)"""
    try:
        game = db.get_game(game_id)
        
        if not game:
            raise HTTPException(404, "Game not found")
        
        # Construct full file path
        game_folder = BACKEND_DIR / game["folder_path"] / "game"
        requested_file = game_folder / file_path
        
        # Security check - prevent directory traversal
        if not requested_file.resolve().is_relative_to(game_folder.resolve()):
            raise HTTPException(403, "Access denied")
        
        if not requested_file.exists():
            raise HTTPException(404, "File not found")
        
        return FileResponse(requested_file)
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(500, f"Failed to serve file: {str(e)}")


@router.get("/{game_id}/tree")
async def get_game_file_tree(game_id: str):
    """Get file tree structure of the game folder"""
    try:
        game = db.get_game(game_id)
        
        if not game:
            raise HTTPException(404, "Game not found")
        
        game_folder = BACKEND_DIR / game["folder_path"] / "game"
        
        def build_tree(path: Path, max_depth=3, current_depth=0):
            """Recursively build file tree"""
            if current_depth >= max_depth:
                return None
            
            items = []
            try:
                for item in sorted(path.iterdir()):
                    rel_path = item.relative_to(game_folder)
                    if item.is_dir():
                        children = build_tree(item, max_depth, current_depth + 1)
                        items.append({
                            "name": item.name,
                            "type": "folder",
                            "path": str(rel_path),
                            "children": children if children else []
                        })
                    else:
                        items.append({
                            "name": item.name,
                            "type": "file",
                            "path": str(rel_path),
                            "size": item.stat().st_size
                        })
            except PermissionError:
                pass
            
            return items
        
        tree = build_tree(game_folder)
        
        return {
            "success": True,
            "game_id": game_id,
            "game_name": game["name"],
            "tree": tree
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(500, f"Failed to get file tree: {str(e)}")
