"""
File Upload Routes
Handle file and image uploads for chat
"""

from fastapi import APIRouter, UploadFile, File, HTTPException
from fastapi.responses import JSONResponse
from typing import List, Optional
import os
from pathlib import Path
import uuid
import shutil
from datetime import datetime

from utils.file_parser import FileParser
from database import SQLiteDB
from pathlib import Path as PathlibPath

router = APIRouter()

# Get database instance
DATA_DIR = PathlibPath(__file__).parent.parent / "data"
db = SQLiteDB(str(DATA_DIR / "chimera_tools.db"))

# File storage directory (relative path)
UPLOAD_DIR = Path("backend/data/uploads")
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

# Allowed file extensions
ALLOWED_DOCUMENT_EXTENSIONS = {'.pdf', '.docx', '.doc', '.txt', '.md', '.csv'}
ALLOWED_IMAGE_EXTENSIONS = {'.png', '.jpg', '.jpeg', '.webp', '.gif'}
ALLOWED_EXTENSIONS = ALLOWED_DOCUMENT_EXTENSIONS | ALLOWED_IMAGE_EXTENSIONS

# File size limits (10MB for documents, 5MB for images)
MAX_DOCUMENT_SIZE = 10 * 1024 * 1024  # 10MB
MAX_IMAGE_SIZE = 5 * 1024 * 1024  # 5MB


def get_file_extension(filename: str) -> str:
    """Extract file extension from filename"""
    return Path(filename).suffix.lower()


def validate_file_size(file_size: int, file_type: str) -> bool:
    """Validate file size based on type"""
    if file_type in ALLOWED_IMAGE_EXTENSIONS:
        return file_size <= MAX_IMAGE_SIZE
    else:
        return file_size <= MAX_DOCUMENT_SIZE


def save_uploaded_file(file: UploadFile, file_id: str) -> Path:
    """Save uploaded file to disk"""
    file_extension = get_file_extension(file.filename)
    file_path = UPLOAD_DIR / f"{file_id}{file_extension}"
    
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    return file_path


@router.post("/api/chat/upload-file")
async def upload_file(
    file: UploadFile = File(...),
    conversation_id: Optional[str] = None
):
    """
    Upload and parse a document file (PDF, DOCX, TXT)
    
    Returns:
        - file_id: Unique identifier for the file
        - filename: Original filename
        - file_type: File extension
        - file_size: Size in bytes
        - parsed_content: Extracted text content
        - metadata: File-specific metadata
    """
    try:
        # Validate file extension
        file_extension = get_file_extension(file.filename)
        if file_extension not in ALLOWED_DOCUMENT_EXTENSIONS:
            raise HTTPException(
                status_code=400,
                detail=f"Unsupported file type. Allowed: {', '.join(ALLOWED_DOCUMENT_EXTENSIONS)}"
            )
        
        # Read file to check size
        file_content = await file.read()
        file_size = len(file_content)
        
        # Validate file size
        if not validate_file_size(file_size, file_extension):
            raise HTTPException(
                status_code=400,
                detail=f"File too large. Max size: {MAX_DOCUMENT_SIZE / (1024*1024)}MB"
            )
        
        # Reset file pointer
        await file.seek(0)
        
        # Generate unique file ID
        file_id = str(uuid.uuid4())
        
        # Save file
        file_path = save_uploaded_file(file, file_id)
        
        # Parse file content
        parser = FileParser()
        parsed_result = parser.parse_file(str(file_path), file_extension)
        
        # Store file metadata in database
        file_record = {
            'id': file_id,
            'filename': file.filename,
            'file_type': file_extension,
            'file_size': file_size,
            'file_path': str(file_path),
            'conversation_id': conversation_id,
            'uploaded_at': datetime.utcnow().isoformat(),
            'parsed': parsed_result.get('success', False)
        }
        
        # Create files table if not exists
        db.execute("""
            CREATE TABLE IF NOT EXISTS uploaded_files (
                id TEXT PRIMARY KEY,
                filename TEXT NOT NULL,
                file_type TEXT NOT NULL,
                file_size INTEGER NOT NULL,
                file_path TEXT NOT NULL,
                conversation_id TEXT,
                uploaded_at TEXT NOT NULL,
                parsed INTEGER DEFAULT 0
            )
        """)
        
        # Insert file record
        db.execute("""
            INSERT INTO uploaded_files 
            (id, filename, file_type, file_size, file_path, conversation_id, uploaded_at, parsed)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            file_record['id'],
            file_record['filename'],
            file_record['file_type'],
            file_record['file_size'],
            file_record['file_path'],
            file_record['conversation_id'],
            file_record['uploaded_at'],
            1 if file_record['parsed'] else 0
        ))
        
        return {
            'success': True,
            'file_id': file_id,
            'filename': file.filename,
            'file_type': file_extension,
            'file_size': file_size,
            'file_size_mb': round(file_size / (1024*1024), 2),
            'parsed_content': parsed_result.get('content', ''),
            'metadata': parsed_result.get('metadata', {}),
            'parsing_success': parsed_result.get('success', False),
            'uploaded_at': file_record['uploaded_at']
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"File upload failed: {str(e)}")


@router.post("/api/chat/upload-image")
async def upload_image(
    file: UploadFile = File(...),
    conversation_id: Optional[str] = None
):
    """
    Upload an image file
    
    Returns:
        - file_id: Unique identifier for the image
        - filename: Original filename
        - file_type: Image extension
        - file_size: Size in bytes
        - image_url: URL to access the image
        - metadata: Image metadata (dimensions, format, etc.)
    """
    try:
        # Validate file extension
        file_extension = get_file_extension(file.filename)
        if file_extension not in ALLOWED_IMAGE_EXTENSIONS:
            raise HTTPException(
                status_code=400,
                detail=f"Unsupported image type. Allowed: {', '.join(ALLOWED_IMAGE_EXTENSIONS)}"
            )
        
        # Read file to check size
        file_content = await file.read()
        file_size = len(file_content)
        
        # Validate file size
        if not validate_file_size(file_size, file_extension):
            raise HTTPException(
                status_code=400,
                detail=f"Image too large. Max size: {MAX_IMAGE_SIZE / (1024*1024)}MB"
            )
        
        # Reset file pointer
        await file.seek(0)
        
        # Generate unique file ID
        file_id = str(uuid.uuid4())
        
        # Save file
        file_path = save_uploaded_file(file, file_id)
        
        # Process image metadata
        parser = FileParser()
        image_result = parser.process_image(str(file_path))
        
        # Store image metadata in database
        
        # Create files table if not exists
        db.execute("""
            CREATE TABLE IF NOT EXISTS uploaded_files (
                id TEXT PRIMARY KEY,
                filename TEXT NOT NULL,
                file_type TEXT NOT NULL,
                file_size INTEGER NOT NULL,
                file_path TEXT NOT NULL,
                conversation_id TEXT,
                uploaded_at TEXT NOT NULL,
                parsed INTEGER DEFAULT 0
            )
        """)
        
        # Insert image record
        db.execute("""
            INSERT INTO uploaded_files 
            (id, filename, file_type, file_size, file_path, conversation_id, uploaded_at, parsed)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            file_id,
            file.filename,
            file_extension,
            file_size,
            str(file_path),
            conversation_id,
            datetime.utcnow().isoformat(),
            1 if image_result.get('success', False) else 0
        ))
        
        return {
            'success': True,
            'file_id': file_id,
            'filename': file.filename,
            'file_type': file_extension,
            'file_size': file_size,
            'file_size_mb': round(file_size / (1024*1024), 2),
            'image_url': f"/api/chat/files/{file_id}/view",
            'metadata': image_result.get('metadata', {}),
            'uploaded_at': datetime.utcnow().isoformat()
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Image upload failed: {str(e)}")


@router.get("/api/chat/files/{file_id}")
async def get_file_info(file_id: str):
    """Get file information by ID"""
    try:
        cursor = db.execute("""
            SELECT * FROM uploaded_files WHERE id = ?
        """, (file_id,))
        
        file_record = cursor.fetchone()
        
        if not file_record:
            raise HTTPException(status_code=404, detail="File not found")
        
        return {
            'success': True,
            'file_id': file_record[0],
            'filename': file_record[1],
            'file_type': file_record[2],
            'file_size': file_record[3],
            'file_size_mb': round(file_record[3] / (1024*1024), 2),
            'conversation_id': file_record[5],
            'uploaded_at': file_record[6]
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get file info: {str(e)}")


@router.get("/api/chat/files/{file_id}/content")
async def get_file_content(file_id: str):
    """Get parsed file content by ID"""
    try:
        cursor = db.execute("""
            SELECT file_path, file_type FROM uploaded_files WHERE id = ?
        """, (file_id,))
        
        file_record = cursor.fetchone()
        
        if not file_record:
            raise HTTPException(status_code=404, detail="File not found")
        
        file_path = file_record[0]
        file_type = file_record[1]
        
        # Parse file again (or use cached result)
        parser = FileParser()
        parsed_result = parser.parse_file(file_path, file_type)
        
        if not parsed_result.get('success'):
            raise HTTPException(status_code=500, detail="Failed to parse file")
        
        return {
            'success': True,
            'content': parsed_result.get('content', ''),
            'metadata': parsed_result.get('metadata', {})
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get file content: {str(e)}")


@router.get("/api/chat/files/{file_id}/view")
async def view_file(file_id: str):
    """View/download file by ID"""
    try:
        cursor = db.execute("""
            SELECT file_path, filename, file_type FROM uploaded_files WHERE id = ?
        """, (file_id,))
        
        file_record = cursor.fetchone()
        
        if not file_record:
            raise HTTPException(status_code=404, detail="File not found")
        
        file_path = Path(file_record[0])
        
        if not file_path.exists():
            raise HTTPException(status_code=404, detail="File not found on disk")
        
        # Return file
        from fastapi.responses import FileResponse
        return FileResponse(
            path=str(file_path),
            filename=file_record[1],
            media_type='application/octet-stream'
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to view file: {str(e)}")


@router.delete("/api/chat/files/{file_id}")
async def delete_file(file_id: str):
    """Delete file by ID"""
    try:
        cursor = db.execute("""
            SELECT file_path FROM uploaded_files WHERE id = ?
        """, (file_id,))
        
        file_record = cursor.fetchone()
        
        if not file_record:
            raise HTTPException(status_code=404, detail="File not found")
        
        file_path = Path(file_record[0])
        
        # Delete file from disk
        if file_path.exists():
            file_path.unlink()
        
        # Delete from database
        db.execute("DELETE FROM uploaded_files WHERE id = ?", (file_id,))
        
        return {
            'success': True,
            'message': 'File deleted successfully'
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete file: {str(e)}")
