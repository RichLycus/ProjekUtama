from fastapi import FastAPI, UploadFile, File, HTTPException, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, StreamingResponse
from fastapi.staticfiles import StaticFiles
from contextlib import asynccontextmanager
import os
import uuid
import json
import yaml
import importlib.util
from pathlib import Path
from datetime import datetime
from typing import Optional, List
import logging
import re
import zipfile
import tempfile
import shutil

from database import SQLiteDB
from modules.tool_validator import ToolValidator
from modules.frontend_tool_validator import FrontendToolValidator
from modules.tool_executor import ToolExecutor
from modules.dependency_manager import DependencyManager
from modules.tool_builder import ToolBuilder
from modules.badge_system import BadgeDetector
from utils.tools_logger import (
    log_tool_operation, 
    log_validation_details, 
    log_upload_start,
    log_upload_success,
    log_upload_failed,
    log_structure_validation
)
from routes.chat_routes import router as chat_router
from routes.personas import router as personas_router
from routes.agent_routes import router as agent_router
from routes.embedding_routes import router as embedding_router
from routes.games_routes import router as games_router
from routes.file_upload import router as file_upload_router
from routes.rag_studio import router as rag_studio_router
from routes.characters import router as characters_router

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Global readiness flag
_system_ready = False

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifespan event handler - startup and shutdown"""
    global _system_ready
    # Startup
    logger.info("=" * 60)
    logger.info("ChimeraAI Tools API - Starting Up")
    logger.info("=" * 60)
    mount_tool_routers()
    logger.info("=" * 60)
    
    # Mark system as ready after all initialization
    _system_ready = True
    logger.info("✅ System fully initialized and ready!")
    
    yield
    # Shutdown
    _system_ready = False
    logger.info("Shutting down ChimeraAI Tools API")

app = FastAPI(title="ChimeraAI Tools API", lifespan=lifespan)

# Include routers
app.include_router(chat_router)
app.include_router(personas_router)
app.include_router(agent_router)
app.include_router(embedding_router)
app.include_router(games_router)
app.include_router(file_upload_router)
app.include_router(rag_studio_router)
app.include_router(characters_router)

# CORS Configuration for Electron Desktop App
# Allow localhost (development) and electron:// protocol
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:*",
        "http://127.0.0.1:*",
        "http://localhost:5173",
        "http://localhost:3000",
    ],
    allow_origin_regex=r"http://localhost:\d+",
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

# CSP Middleware for iframe support (HTML tools)
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request

class CSPMiddleware(BaseHTTPMiddleware):
    """Add Content Security Policy headers to allow iframes and external scripts"""
    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)
        
        # Allow iframe embedding from same origin and localhost
        # RELAXED: Allow unpkg.com and cdn.jsdelivr.net for React CDN
        response.headers["Content-Security-Policy"] = (
            "default-src 'self'; "
            "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://unpkg.com https://cdn.jsdelivr.net; "
            "style-src 'self' 'unsafe-inline' https://unpkg.com https://cdn.jsdelivr.net; "
            "img-src 'self' data: blob: https:; "
            "font-src 'self' data:; "
            "connect-src 'self' http://localhost:* http://127.0.0.1:* ws://localhost:* ws://127.0.0.1:*; "
            "frame-src 'self' http://localhost:* http://127.0.0.1:*; "
            "frame-ancestors 'self' http://localhost:* http://127.0.0.1:*"
        )
        
        # Allow cross-origin for tools
        response.headers["X-Frame-Options"] = "ALLOW-FROM http://localhost:3000"
        
        return response

app.add_middleware(CSPMiddleware)

# Get backend directory (portable path)
BACKEND_DIR = Path(__file__).parent
DATA_DIR = BACKEND_DIR / "data"
TOOLS_DIR = BACKEND_DIR / "tools"
FRONTEND_TOOLS_DIR = BACKEND_DIR / "frontend_tools"

# Mount static files for built tools
PUBLIC_DIR = BACKEND_DIR.parent / "public"
PUBLIC_DIR.mkdir(parents=True, exist_ok=True)

# Custom middleware to add no-cache headers for tool files
@app.middleware("http")
async def add_no_cache_headers(request: Request, call_next):
    response = await call_next(request)
    
    # Add no-cache headers for tool bundle files to prevent stale previews
    if request.url.path.startswith("/tools/") and (
        request.url.path.endswith(".js") or 
        request.url.path.endswith(".html") or
        request.url.path.endswith(".css")
    ):
        response.headers["Cache-Control"] = "no-cache, no-store, must-revalidate"
        response.headers["Pragma"] = "no-cache"
        response.headers["Expires"] = "0"
    
    return response

app.mount("/tools", StaticFiles(directory=str(PUBLIC_DIR / "tools")), name="tools")

# Ensure directories exist
DATA_DIR.mkdir(exist_ok=True)
TOOLS_DIR.mkdir(exist_ok=True)
FRONTEND_TOOLS_DIR.mkdir(exist_ok=True)

# SQLite Database Connection
db = SQLiteDB(str(DATA_DIR / "chimera_tools.db"))

# Initialize modules
validator = ToolValidator()
frontend_validator = FrontendToolValidator()
executor = ToolExecutor()
dep_manager = DependencyManager()
tool_builder = ToolBuilder(BACKEND_DIR)
badge_detector = BadgeDetector()

CATEGORIES = ["Office", "DevTools", "Multimedia", "Utilities", "Security", "Network", "Data"]


# ========================================
# Utility Functions
# ========================================

def slugify(text: str) -> str:
    """
    Convert text to kebab-case slug
    
    Examples:
        "Sapaan Login" → "sapaan-login"
        "Form Builder 2.0!" → "form-builder-20"
        "My Tool (Beta)" → "my-tool-beta"
    """
    # Lowercase
    text = text.lower()
    
    # Replace spaces and underscores with dash
    text = re.sub(r'[\s_]+', '-', text)
    
    # Remove special characters (keep only alphanumeric and dash)
    text = re.sub(r'[^\w\-]', '', text)
    
    # Replace multiple dashes with single dash
    text = re.sub(r'-+', '-', text)
    
    # Remove leading/trailing dashes
    text = text.strip('-')
    
    return text


def mount_tool_routers():
    """Mount all active tool routers dynamically"""
    logger.info("🚀 Mounting tool routers...")
    try:
        tools = db.list_tools({"status": "active"})
        mounted_count = 0
        
        if not tools:
            logger.info("ℹ️  No active tools found to mount")
            return {"success": True, "mounted": 0}
        
        for tool in tools:
            tool_name = tool.get('name', 'Unknown')
            tool_type = tool.get('tool_type', 'unknown')
            
            try:
                # Only mount dual tools with FastAPI backend
                if tool_type != 'dual':
                    logger.info(f"⏭️  Skipping {tool_name}: Not a dual tool (type: {tool_type})")
                    continue
                
                backend_path = Path(tool['backend_path'])
                if not backend_path.exists():
                    logger.warning(f"⚠️  Tool '{tool_name}': Backend file not found at {backend_path}")
                    continue
                
                # Import tool module
                logger.info(f"🔄 Loading tool '{tool_name}'...")
                spec = importlib.util.spec_from_file_location(
                    f"tool_{tool['_id']}", 
                    str(backend_path)
                )
                if not spec or not spec.loader:
                    logger.error(f"❌ Tool '{tool_name}': Could not create module spec")
                    continue
                
                module = importlib.util.module_from_spec(spec)
                spec.loader.exec_module(module)
                
                # Check if module has FastAPI app
                if hasattr(module, 'app'):
                    tool_app = getattr(module, 'app')
                    
                    # Mount with prefix /tools/{tool_id}
                    mount_path = f"/tools/{tool['_id']}"
                    app.mount(
                        mount_path, 
                        tool_app, 
                        name=f"tool_{tool['_id']}"
                    )
                    logger.info(f"✅ Mounted: '{tool_name}' at {mount_path}")
                    logger.info(f"   📍 Frontend: /api/tools/file/{tool['_id']}?file_type=frontend")
                    logger.info(f"   📍 Backend: {mount_path}/*")
                    mounted_count += 1
                else:
                    logger.warning(f"⚠️  Tool '{tool_name}': No 'app' object found (old format? needs FastAPI router)")
                    
            except Exception as e:
                logger.error(f"❌ Failed to mount tool '{tool_name}': {str(e)}")
                import traceback
                logger.debug(traceback.format_exc())
        
        logger.info(f"✅ Successfully mounted {mounted_count} tool(s)")
        return {"success": True, "mounted": mounted_count}
        
    except Exception as e:
        logger.error(f"❌ Error during tool mounting: {str(e)}")
        import traceback
        logger.error(traceback.format_exc())
        return {"success": False, "error": str(e)}


def log_action(tool_id: str, action: str, status: str, message: str, trace: str = ""):
    """Log tool action to database"""
    log = {
        "_id": str(uuid.uuid4()),
        "tool_id": tool_id,
        "action": action,
        "status": status,
        "message": message,
        "trace": trace,
        "timestamp": datetime.utcnow().isoformat()
    }
    db.insert_log(log)
    return log


@app.get("/")
async def root():
    return {"status": "ok", "message": "ChimeraAI Tools API v2.0"}


@app.get("/health")
@app.get("/api/health")
async def health_check():
    """
    Health check endpoint with readiness validation.
    Returns detailed system status including:
    - Basic health (alive)
    - Readiness (fully initialized)
    - Component status (database, RAG, agents)
    """
    from routes.chat_routes import orchestrator, rag_system
    
    # Basic health
    health_status = {
        "status": "healthy",
        "ready": _system_ready,
        "timestamp": datetime.utcnow().isoformat()
    }
    
    # Check components if system is ready
    if _system_ready:
        try:
            # Database check
            db_ok = db is not None
            
            # RAG check
            rag_ok = rag_system is not None
            
            # Orchestrator check
            orchestrator_ok = orchestrator is not None
            ollama_connected = False
            if orchestrator:
                try:
                    ollama_connected = orchestrator.test_ollama_connection()
                except:
                    pass
            
            health_status["components"] = {
                "database": "ok" if db_ok else "unavailable",
                "rag_system": "ok" if rag_ok else "unavailable", 
                "orchestrator": "ok" if orchestrator_ok else "unavailable",
                "ollama": "connected" if ollama_connected else "disconnected"
            }
            
            # Set ready to false if critical components are missing
            if not (db_ok and orchestrator_ok):
                health_status["ready"] = False
                health_status["status"] = "degraded"
                
        except Exception as e:
            logger.error(f"Health check component validation error: {e}")
            health_status["components_error"] = str(e)
    
    return health_status


@app.get("/api/tools/categories")
async def get_categories():
    """Get all available categories"""
    return {"categories": CATEGORIES}


@app.get("/api/tools/styles.css")
async def get_tools_styles():
    """
    Serve Tailwind CSS for tools (offline-friendly)
    
    Returns minified Tailwind CSS with all custom classes.
    Built from: /app/backend/public/tools-styles.css
    """
    from fastapi.responses import FileResponse
    
    css_file = BACKEND_DIR / "public" / "tools-styles.css"
    
    if not css_file.exists():
        logger.error(f"❌ Tools CSS not found: {css_file}")
        raise HTTPException(404, "Tools styles not found. Please rebuild CSS.")
    
    logger.info(f"✅ Serving tools CSS: {css_file}")
    return FileResponse(css_file, media_type="text/css")


@app.get("/api/tools/check-name")
async def check_tool_name(name: str):
    """
    Check if tool name already exists (real-time checking)
    Returns slug and existing tool info if found
    """
    try:
        # Generate slug from name
        slug = slugify(name)
        
        if not slug:
            return {
                "exists": False,
                "slug": "",
                "message": "Invalid name"
            }
        
        # Search for tool with same slug in database
        # Check by looking for tools where slugified name matches
        all_tools = db.list_tools()
        existing_tool = None
        
        for tool in all_tools:
            tool_slug = slugify(tool.get("name", ""))
            if tool_slug == slug:
                existing_tool = tool
                break
        
        if existing_tool:
            return {
                "exists": True,
                "slug": slug,
                "tool": {
                    "id": existing_tool.get("_id"),
                    "name": existing_tool.get("name"),
                    "category": existing_tool.get("category"),
                    "version": existing_tool.get("version"),
                    "created_at": existing_tool.get("created_at"),
                    "backend_path": existing_tool.get("backend_path"),
                    "frontend_path": existing_tool.get("frontend_path")
                },
                "message": f"Tool '{existing_tool.get('name')}' already exists"
            }
        
        return {
            "exists": False,
            "slug": slug,
            "message": "Name available"
        }
        
    except Exception as e:
        raise HTTPException(500, f"Check failed: {str(e)}")


@app.post("/api/tools/upload-zip")
async def upload_tool_zip(
    file: UploadFile = File(...),
    name: str = Form(...),
    description: str = Form(...),
    category: str = Form(...),
    version: str = Form("1.0.0"),
    author: str = Form("Anonymous"),
    force_overwrite: bool = Form(False)
):
    """
    ZIP Upload endpoint - Upload tool as ZIP archive
    
    ZIP Structure (Supports both nested and flat):
    
    Option 1 (Flat):
    tool-name.zip
    ├── backend/
    │   └── main.py (exactly 1 .py file)
    └── frontend/
        └── Component.tsx (exactly 1 file: .tsx/.jsx/.html/.js)
    
    Option 2 (Nested):
    tool-name.zip
    └── tool-name/
        ├── backend/
        │   └── main.py
        └── frontend/
            └── Component.tsx
    
    Output Structure:
    backend/tools/{category}/{slug}/
    ├── backend/
    │   └── main.py
    ├── frontend/
    │   └── Component.tsx
    └── {slug}.yaml  (auto-generated metadata)
    """
    temp_dir = None
    try:
        # Log upload start
        log_upload_start(name, source="zip")
        
        # Validate category
        if category not in CATEGORIES:
            raise HTTPException(400, f"Invalid category. Must be one of: {CATEGORIES}")
        
        # Validate ZIP file
        if not file.filename.endswith('.zip'):
            raise HTTPException(400, "File must be a ZIP archive (.zip)")
        
        # Generate slug from name
        slug = slugify(name)
        if not slug:
            raise HTTPException(400, "Invalid tool name. Cannot generate valid slug.")
        
        # Check if tool exists
        all_tools = db.list_tools()
        existing_tool = None
        for tool in all_tools:
            tool_slug = slugify(tool.get("name", ""))
            if tool_slug == slug:
                existing_tool = tool
                break
        
        # If exists and not force overwrite, return error
        if existing_tool and not force_overwrite:
            raise HTTPException(
                409,
                f"Tool with name '{existing_tool.get('name')}' already exists. Set force_overwrite=true to replace it."
            )
        
        # Create temp directory for extraction
        temp_dir = tempfile.mkdtemp(prefix=f"tool_{slug}_")
        logger.info(f"📦 Extracting ZIP to: {temp_dir}")
        
        # Save uploaded ZIP to temp file
        zip_path = Path(temp_dir) / file.filename
        with open(zip_path, 'wb') as f:
            content = await file.read()
            f.write(content)
        
        # Extract ZIP
        try:
            with zipfile.ZipFile(zip_path, 'r') as zip_ref:
                zip_ref.extractall(temp_dir)
        except zipfile.BadZipFile:
            raise HTTPException(400, "Invalid ZIP file. Cannot extract.")
        
        # Remove the ZIP file itself
        zip_path.unlink()
        
        # Validate structure: Support nested or flat structure
        # Case 1: tool-name/backend/ + tool-name/frontend/
        # Case 2: backend/ + frontend/ (direct)
        extracted_root = Path(temp_dir)
        
        # Check for nested structure first (tool-name/ folder inside)
        nested_folders = [d for d in extracted_root.iterdir() if d.is_dir() and d.name != "__MACOSX"]
        
        backend_folder = None
        frontend_folder = None
        
        # Try nested structure first
        if len(nested_folders) == 1:
            nested_root = nested_folders[0]
            potential_backend = nested_root / "backend"
            potential_frontend = nested_root / "frontend"
            
            if potential_backend.exists() and potential_frontend.exists():
                backend_folder = potential_backend
                frontend_folder = potential_frontend
                logger.info(f"📂 Detected nested ZIP structure: {nested_root.name}/backend/ + {nested_root.name}/frontend/")
        
        # If nested not found, try flat structure
        if backend_folder is None:
            potential_backend = extracted_root / "backend"
            potential_frontend = extracted_root / "frontend"
            
            if potential_backend.exists() and potential_frontend.exists():
                backend_folder = potential_backend
                frontend_folder = potential_frontend
                logger.info(f"📂 Detected flat ZIP structure: backend/ + frontend/")
        
        # Validate that we found the folders
        errors = []
        
        if backend_folder is None:
            errors.append("❌ 'backend/' folder not found in ZIP (tried nested and flat structures)")
        
        if frontend_folder is None:
            errors.append("❌ 'frontend/' folder not found in ZIP (tried nested and flat structures)")
        
        if errors:
            # Log structure validation failure
            log_structure_validation(name, False, errors)
            log_upload_failed(name, "Invalid ZIP structure", [], errors)
            
            raise HTTPException(400, {
                "error": "Invalid ZIP structure",
                "details": errors,
                "expected": "ZIP must contain 'backend/' and 'frontend/' folders (nested or flat)"
            })
        
        # Find backend file (exactly 1 .py file)
        backend_files = list(backend_folder.glob("*.py"))
        if len(backend_files) == 0:
            errors.append("❌ No Python (.py) file found in backend/ folder")
        elif len(backend_files) > 1:
            errors.append(f"❌ Multiple Python files found in backend/ ({len(backend_files)}), expected exactly 1")
        
        # Find frontend file (exactly 1 .tsx/.jsx/.html/.js file)
        frontend_exts = ['.tsx', '.jsx', '.html', '.js']
        frontend_files = []
        for ext in frontend_exts:
            frontend_files.extend(list(frontend_folder.glob(f"*{ext}")))
        
        if len(frontend_files) == 0:
            errors.append(f"❌ No frontend file found (.tsx/.jsx/.html/.js) in frontend/ folder")
        elif len(frontend_files) > 1:
            errors.append(f"❌ Multiple frontend files found ({len(frontend_files)}), expected exactly 1")
        
        if errors:
            # Log structure validation failure
            log_structure_validation(name, False, errors)
            log_upload_failed(name, "ZIP file structure validation failed", [], errors)
            
            raise HTTPException(400, {
                "error": "ZIP validation failed",
                "details": errors
            })
        
        # Read files
        backend_file_path = backend_files[0]
        frontend_file_path = frontend_files[0]
        
        with open(backend_file_path, 'r', encoding='utf-8') as f:
            backend_content = f.read()
        
        with open(frontend_file_path, 'r', encoding='utf-8') as f:
            frontend_content = f.read()
        
        frontend_ext = frontend_file_path.suffix
        
        # NEW STRUCTURE: tools/{category}/{slug}/
        # tools/{category}/{slug}/backend/main.py
        # tools/{category}/{slug}/frontend/Component.tsx
        # tools/{category}/{slug}/{slug}.yaml
        tool_root_dir = TOOLS_DIR / category.lower() / slug
        target_backend_dir = tool_root_dir / "backend"
        target_frontend_dir = tool_root_dir / "frontend"
        
        # If overwriting, delete old tool directory
        if existing_tool:
            # Get old backend path to determine old location
            old_backend_path = BACKEND_DIR / existing_tool.get("backend_path", "")
            
            # Try to find the tool root directory (where YAML would be)
            # Navigate up to find tools/{category}/{slug}/
            old_tool_root = None
            if "tools/" in str(old_backend_path):
                # New structure: tools/{category}/{slug}/backend/main.py
                old_tool_root = old_backend_path.parent.parent  # Go up from backend/ to {slug}/
            elif "sample_tools/" in str(old_backend_path):
                # Old structure: sample_tools/{category}/{slug}/backend/main.py
                old_tool_root = old_backend_path.parent.parent  # Go up from backend/ to {slug}/
            
            if old_tool_root and old_tool_root.exists():
                shutil.rmtree(old_tool_root)
                logger.info(f"🗑️ Deleted old tool directory: {old_tool_root}")
            
            # Also clean up old frontend_tools if exists
            old_frontend_path = BACKEND_DIR / existing_tool.get("frontend_path", "")
            if "frontend_tools/" in str(old_frontend_path):
                old_frontend_dir = old_frontend_path.parent
                if old_frontend_dir.exists():
                    shutil.rmtree(old_frontend_dir)
                    logger.info(f"🗑️ Deleted old frontend_tools folder: {old_frontend_dir}")
        
        # Create new directories
        target_backend_dir.mkdir(parents=True, exist_ok=True)
        target_frontend_dir.mkdir(parents=True, exist_ok=True)
        
        # Save backend file as main.py
        backend_save_path = target_backend_dir / "main.py"
        with open(backend_save_path, 'w', encoding='utf-8') as f:
            f.write(backend_content)
        
        # Save frontend file with PascalCase name (like GreetingSpeaker.tsx)
        # Convert slug to PascalCase: greeting-speaker -> GreetingSpeaker
        component_name = ''.join(word.capitalize() for word in slug.split('-'))
        frontend_filename = f"{component_name}{frontend_ext}"
        frontend_save_path = target_frontend_dir / frontend_filename
        with open(frontend_save_path, 'w', encoding='utf-8') as f:
            f.write(frontend_content)
        
        logger.info(f"✅ Saved backend: {backend_save_path}")
        logger.info(f"✅ Saved frontend: {frontend_save_path}")
        
        # Generate YAML metadata file
        import yaml
        
        # Default author to ChimeraAiUser if not provided or Anonymous
        if not author or author == "Anonymous":
            author = "ChimeraAiUser"
        
        yaml_data = {
            "name": name,
            "slug": slug,
            "category": category,
            "description": description,
            "version": version,
            "author": author,
            "status": "pending",  # Will be updated after validation
            "tool_type": "dual",
            "dependencies": [],  # Will be updated after validation
            "python_dependencies": [],  # Will be populated from backend validation
            "node_dependencies": [],  # Will be populated from frontend validation
            "badges": [],  # Will be auto-detected from dependencies & file types
            "backend_path": str(backend_save_path.relative_to(BACKEND_DIR)),
            "frontend_path": str(frontend_save_path.relative_to(BACKEND_DIR)),
            "created_at": existing_tool.get("created_at") if existing_tool else datetime.utcnow().isoformat(),
            "updated_at": datetime.utcnow().isoformat()
        }
        
        yaml_path = tool_root_dir / f"{slug}.yaml"
        with open(yaml_path, 'w', encoding='utf-8') as f:
            yaml.dump(yaml_data, f, default_flow_style=False, sort_keys=False)
        
        logger.info(f"✅ Generated YAML metadata: {yaml_path}")
        
        # Validate backend file
        backend_validation = validator.validate(str(backend_save_path), backend_content)
        
        # Validate frontend file
        frontend_validation = frontend_validator.validate(
            str(frontend_save_path), 
            frontend_content, 
            frontend_ext
        )
        
        # Combine validations
        all_valid = backend_validation["valid"] and frontend_validation["valid"]
        combined_errors = backend_validation.get("errors", []) + frontend_validation.get("errors", [])
        
        # Separate Python and Node.js dependencies
        python_deps = backend_validation.get("dependencies", [])
        node_deps = frontend_validation.get("dependencies", [])
        
        # Legacy combined_deps for backward compatibility
        combined_deps = python_deps + node_deps
        
        # ❌ AUTO-CLEANUP: Jika validation fail, hapus tool directory & return error
        if not all_valid:
            logger.warning(f"❌ Validation failed for '{name}'. Auto-deleting tool directory...")
            
            # Log detailed validation failure
            log_validation_details(
                name,
                backend_validation["valid"],
                frontend_validation["valid"],
                backend_validation.get("errors", []),
                frontend_validation.get("errors", [])
            )
            
            # Log upload failure with component-specific errors
            backend_err = backend_validation.get("errors", [])
            frontend_err = frontend_validation.get("errors", [])
            
            if backend_err and frontend_err:
                reason = "Both backend and frontend validation failed"
            elif backend_err:
                reason = "Backend validation failed"
            elif frontend_err:
                reason = "Frontend validation failed"
            else:
                reason = "Unknown validation error"
            
            log_upload_failed(name, reason, backend_err, frontend_err)
            
            # Cleanup tool directory
            if tool_root_dir.exists():
                shutil.rmtree(tool_root_dir)
                logger.info(f"🗑️ Deleted tool directory: {tool_root_dir}")
            
            # Cleanup temp directory
            if temp_dir and Path(temp_dir).exists():
                shutil.rmtree(temp_dir)
                logger.info(f"🧹 Cleaned up temp directory: {temp_dir}")
            
            # Return error with validation details (SMART ERROR MESSAGE)
            error_response = {
                "error": "Tool validation failed",
                "details": {
                    "message": "Tool files have been deleted. Please fix the errors and try again."
                }
            }
            
            # Add backend errors if any
            if backend_err:
                error_response["details"]["backend_errors"] = backend_err
                error_response["details"]["backend_file"] = backend_file_path.name
            
            # Add frontend errors if any
            if frontend_err:
                error_response["details"]["frontend_errors"] = frontend_err
                error_response["details"]["frontend_file"] = frontend_file_path.name
            
            raise HTTPException(400, error_response)
        
        # If validation passes, continue with database registration
        status = "active"
        
        # Generate badges based on dependencies and file types
        badges = badge_detector.generate_badges(
            python_deps=python_deps,
            node_deps=node_deps,
            backend_path=str(backend_save_path),
            frontend_path=str(frontend_save_path),
            category=category
        )
        
        # Update YAML with validation results and badges
        yaml_data["status"] = status
        yaml_data["dependencies"] = list(set(combined_deps))
        yaml_data["python_dependencies"] = list(set(python_deps))
        yaml_data["node_dependencies"] = list(set(node_deps))
        yaml_data["badges"] = badges
        yaml_data["last_validated"] = datetime.utcnow().isoformat()
        
        with open(yaml_path, 'w', encoding='utf-8') as f:
            yaml.dump(yaml_data, f, default_flow_style=False, sort_keys=False)
        
        logger.info(f"✅ Updated YAML with validation results (status: {status}, badges: {len(badges)})")
        
        # Use existing tool_id if overwriting, otherwise generate new one
        tool_id = existing_tool.get("_id") if existing_tool else slug
        
        # Create tool document with RELATIVE paths
        tool_doc = {
            "_id": tool_id,
            "name": name,
            "description": description,
            "category": category,
            "tool_type": "dual",
            "version": version,
            "author": author,
            "backend_path": str(backend_save_path.relative_to(BACKEND_DIR)),
            "frontend_path": str(frontend_save_path.relative_to(BACKEND_DIR)),
            "yaml_path": str(yaml_path.relative_to(BACKEND_DIR)),  # Add YAML path
            "dependencies": list(set(combined_deps)),  # Legacy field
            "python_dependencies": list(set(python_deps)),  # Backend Python deps
            "node_dependencies": list(set(node_deps)),  # Frontend Node deps
            "status": status,
            "last_validated": datetime.utcnow().isoformat(),
            "created_at": existing_tool.get("created_at") if existing_tool else datetime.utcnow().isoformat(),
            "updated_at": datetime.utcnow().isoformat()
        }
        
        # Update or insert tool in database
        if existing_tool:
            db.update_tool(tool_id, tool_doc)
            action_type = "update"
            logger.info(f"♻️ Updated existing tool from ZIP: {name} (slug: {slug})")
            log_upload_success(name, slug, category, overwritten=True)
        else:
            db.insert_tool(tool_doc)
            action_type = "upload"
            logger.info(f"✅ Created new tool from ZIP: {name} (slug: {slug})")
            log_upload_success(name, slug, category, overwritten=False)
        
        # Log validation success
        log_validation_details(
            name,
            backend_validation["valid"],
            frontend_validation["valid"],
            [],
            []
        )
        
        # Log action
        log_action(
            tool_id,
            action_type,
            "success" if all_valid else "warning",
            f"Tool from ZIP {'updated' if existing_tool else 'uploaded'}: backend {'✓' if backend_validation['valid'] else '✗'}, frontend {'✓' if frontend_validation['valid'] else '✗'}",
            json.dumps({
                "backend_errors": backend_validation.get("errors", []),
                "frontend_errors": frontend_validation.get("errors", []),
                "overwrite": existing_tool is not None,
                "source": "zip"
            })
        )
        
        # Reload routers if tool is active
        if status == "active":
            logger.info(f"🔄 Reloading routers after ZIP upload: {name}")
            mount_tool_routers()
        
        # 🔨 AUTO-BUILD: Build tool for dynamic iframe loading
        logger.info(f"🔨 Building tool for dynamic loading: {name}")
        build_result = tool_builder.build_tool(tool_doc)
        
        if not build_result["success"]:
            logger.warning(f"⚠️ Tool build failed: {build_result.get('error')}")
            logger.warning(f"   Tool can still be used but won't load dynamically in iframe")
            build_info = {
                "built": False,
                "error": build_result.get("error")
            }
        else:
            logger.info(f"✅ Tool built successfully!")
            logger.info(f"   URL: {build_result.get('url')}")
            build_info = {
                "built": True,
                "url": build_result.get("url"),
                "bundle_path": build_result.get("bundle_path"),
                "html_path": build_result.get("html_path")
            }
        
        # Cleanup temp directory
        if temp_dir and Path(temp_dir).exists():
            shutil.rmtree(temp_dir)
            logger.info(f"🧹 Cleaned up temp directory: {temp_dir}")
        
        return {
            "success": True,
            "tool_id": tool_id,
            "slug": slug,
            "overwritten": existing_tool is not None,
            "tool": tool_doc,
            "build": build_info,
            "validation": {
                "valid": all_valid,
                "backend": backend_validation,
                "frontend": frontend_validation,
                "errors": combined_errors,
                "dependencies": list(set(combined_deps))
            },
            "structure": {
                "backend": str(backend_save_path.relative_to(BACKEND_DIR)),
                "frontend": str(frontend_save_path.relative_to(BACKEND_DIR)),
                "yaml": str(yaml_path.relative_to(BACKEND_DIR)),
                "root": str(tool_root_dir.relative_to(BACKEND_DIR))
            }
        }
        
    except HTTPException:
        # Cleanup on error
        if temp_dir and Path(temp_dir).exists():
            shutil.rmtree(temp_dir)
        raise
    except Exception as e:
        # Cleanup on error
        if temp_dir and Path(temp_dir).exists():
            shutil.rmtree(temp_dir)
        logger.error(f"❌ ZIP upload failed: {str(e)}")
        log_upload_failed(name if name else "Unknown", f"System error: {str(e)}")
        raise HTTPException(500, f"ZIP upload failed: {str(e)}")


@app.post("/api/tools/upload")
async def upload_tool(
    backend_file: UploadFile = File(...),
    frontend_file: UploadFile = File(...),
    name: str = Form(...),
    description: str = Form(...),
    category: str = Form(...),
    version: str = Form("1.0.0"),
    author: str = Form("Anonymous"),
    force_overwrite: bool = Form(False)
):
    """Dual file upload endpoint - MANDATORY: 1 backend (.py) + 1 frontend (.jsx, .tsx, .html, .js) file"""
    try:
        # Validate category
        if category not in CATEGORIES:
            raise HTTPException(400, f"Invalid category. Must be one of: {CATEGORIES}")
        
        # Validate backend file
        backend_ext = Path(backend_file.filename).suffix.lower()
        if backend_ext != '.py':
            raise HTTPException(400, f"Backend file must be a Python (.py) file. Got: {backend_ext}")
        
        # Validate frontend file
        frontend_ext = Path(frontend_file.filename).suffix.lower()
        frontend_valid_exts = ['.jsx', '.tsx', '.html', '.js']
        if frontend_ext not in frontend_valid_exts:
            raise HTTPException(
                400, 
                f"Frontend file must be one of: {frontend_valid_exts}. Got: {frontend_ext}"
            )
        
        # Generate slug from name (instead of UUID)
        slug = slugify(name)
        
        if not slug:
            raise HTTPException(400, "Invalid tool name. Cannot generate valid slug.")
        
        # Read both files
        backend_content = (await backend_file.read()).decode('utf-8')
        frontend_content = (await frontend_file.read()).decode('utf-8')
        
        # Check if tool with same slug already exists
        all_tools = db.list_tools()
        existing_tool = None
        
        for tool in all_tools:
            tool_slug = slugify(tool.get("name", ""))
            if tool_slug == slug:
                existing_tool = tool
                break
        
        # If exists and not force overwrite, return error
        if existing_tool and not force_overwrite:
            raise HTTPException(
                409,  # Conflict
                f"Tool with name '{existing_tool.get('name')}' already exists. Set force_overwrite=true to replace it."
            )
        
        # Create slug-based folder structure (new organized structure!)
        # Backend: sample_tools/{category}/{slug}/backend/main.py
        # Frontend: frontend_tools/{slug}/{ComponentName}.tsx
        
        backend_tool_folder = BACKEND_DIR / "sample_tools" / category.lower() / slug / "backend"
        frontend_tool_folder = BACKEND_DIR / "frontend_tools" / slug
        backend_tool_folder.mkdir(parents=True, exist_ok=True)
        frontend_tool_folder.mkdir(parents=True, exist_ok=True)
        
        # If overwriting, delete old folders first
        if existing_tool:
            old_backend_path = BACKEND_DIR / existing_tool.get("backend_path", "")
            old_frontend_path = BACKEND_DIR / existing_tool.get("frontend_path", "")
            
            # Delete old backend folder (if in old structure)
            if old_backend_path.exists() and old_backend_path.parent.name != "backend":
                old_backend_path.unlink()
                logger.info(f"🗑️ Deleted old backend file: {old_backend_path}")
            
            # Delete old frontend folder (if in old structure)
            if old_frontend_path.exists() and old_frontend_path.parent == old_frontend_path.parent.parent:
                old_frontend_path.unlink()
                logger.info(f"🗑️ Deleted old frontend file: {old_frontend_path}")
        
        # Save backend file as main.py (slug-based structure!)
        backend_path = backend_tool_folder / "main.py"
        with open(backend_path, 'w', encoding='utf-8') as f:
            f.write(backend_content)
        
        # Save frontend file with PascalCase name (slug-based structure!)
        # Convert slug to PascalCase: greeting-speaker -> GreetingSpeaker
        component_name = ''.join(word.capitalize() for word in slug.split('-'))
        frontend_filename = f"{component_name}{frontend_ext}"
        frontend_path = frontend_tool_folder / frontend_filename
        with open(frontend_path, 'w', encoding='utf-8') as f:
            f.write(frontend_content)
        
        # Validate backend file
        backend_validation = validator.validate(str(backend_path), backend_content)
        
        # Validate frontend file
        frontend_validation = frontend_validator.validate(
            str(frontend_path), 
            frontend_content, 
            frontend_ext
        )
        
        # Combine validations
        all_valid = backend_validation["valid"] and frontend_validation["valid"]
        combined_errors = backend_validation.get("errors", []) + frontend_validation.get("errors", [])
        
        # Separate Python and Node.js dependencies
        python_deps = backend_validation.get("dependencies", [])
        node_deps = frontend_validation.get("dependencies", [])
        
        # Legacy combined_deps for backward compatibility
        combined_deps = python_deps + node_deps
        
        # Determine status
        status = "active" if all_valid else "disabled"
        
        # Default author to ChimeraAiUser if not provided or Anonymous
        if not author or author == "Anonymous":
            author = "ChimeraAiUser"
        
        # Generate badges based on dependencies and file types
        badges = badge_detector.generate_badges(
            python_deps=python_deps,
            node_deps=node_deps,
            backend_path=str(backend_path),
            frontend_path=str(frontend_path),
            category=category
        )
        
        # Generate YAML metadata file for dual upload
        yaml_data = {
            "name": name,
            "slug": slug,
            "category": category,
            "description": description,
            "version": version,
            "author": author,
            "status": status,
            "tool_type": "dual",
            "dependencies": list(set(combined_deps)),
            "python_dependencies": list(set(python_deps)),
            "node_dependencies": list(set(node_deps)),
            "badges": badges,
            "backend_path": str(backend_path.relative_to(BACKEND_DIR)),
            "frontend_path": str(frontend_path.relative_to(BACKEND_DIR)),
            "created_at": existing_tool.get("created_at") if existing_tool else datetime.utcnow().isoformat(),
            "updated_at": datetime.utcnow().isoformat(),
            "last_validated": datetime.utcnow().isoformat()
        }
        
        # Save YAML file
        yaml_path = backend_tool_folder.parent / f"{slug}.yaml"
        with open(yaml_path, 'w', encoding='utf-8') as f:
            yaml.dump(yaml_data, f, default_flow_style=False, sort_keys=False)
        
        logger.info(f"✅ Generated YAML: {yaml_path} (badges: {len(badges)})")
        
        # Use existing tool_id if overwriting, otherwise generate new one
        tool_id = existing_tool.get("_id") if existing_tool else slug
        
        # Create tool document with RELATIVE paths (portable!)
        tool_doc = {
            "_id": tool_id,
            "name": name,
            "description": description,
            "category": category,
            "tool_type": "dual",
            "version": version,
            "author": author,
            "backend_path": str(backend_path.relative_to(BACKEND_DIR)),  # ✅ Relative path
            "frontend_path": str(frontend_path.relative_to(BACKEND_DIR)),  # ✅ Relative path
            "dependencies": list(set(combined_deps)),  # Legacy field
            "python_dependencies": list(set(python_deps)),  # Backend Python deps
            "node_dependencies": list(set(node_deps)),  # Frontend Node deps
            "status": status,
            "last_validated": datetime.utcnow().isoformat(),
            "created_at": existing_tool.get("created_at") if existing_tool else datetime.utcnow().isoformat(),
            "updated_at": datetime.utcnow().isoformat()
        }
        
        # Update or insert tool in database
        if existing_tool:
            db.update_tool(tool_id, tool_doc)
            action_type = "update"
            logger.info(f"♻️ Updated existing tool: {name} (slug: {slug})")
        else:
            db.insert_tool(tool_doc)
            action_type = "upload"
            logger.info(f"✅ Created new tool: {name} (slug: {slug})")
        
        # Log action
        log_action(
            tool_id,
            action_type,
            "success" if all_valid else "warning",
            f"Dual tool {'updated' if existing_tool else 'uploaded'}: backend {'✓' if backend_validation['valid'] else '✗'}, frontend {'✓' if frontend_validation['valid'] else '✗'}",
            json.dumps({
                "backend_errors": backend_validation.get("errors", []),
                "frontend_errors": frontend_validation.get("errors", []),
                "overwrite": existing_tool is not None
            })
        )
        
        # Reload routers if tool is active
        if status == "active":
            print(f"🔄 Reloading routers after {'updating' if existing_tool else 'uploading'} tool: {name}")
            mount_tool_routers()
        
        return {
            "success": True,
            "tool_id": tool_id,
            "slug": slug,
            "overwritten": existing_tool is not None,
            "tool": tool_doc,
            "validation": {
                "valid": all_valid,
                "backend": backend_validation,
                "frontend": frontend_validation,
                "errors": combined_errors,
                "dependencies": list(set(combined_deps))
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(500, f"Upload failed: {str(e)}")


@app.get("/api/tools")
async def list_tools(category: Optional[str] = None, status: Optional[str] = None):
    """List all tools with optional filters"""
    filters = {}
    if category:
        filters["category"] = category
    if status:
        filters["status"] = status
    
    tools = db.list_tools(filters)
    return {"tools": tools, "count": len(tools)}


@app.post("/api/tools/reload-routers")
async def reload_routers():
    """Reload all tool routers without restarting server"""
    try:
        result = mount_tool_routers()
        return {
            "success": result["success"],
            "message": "Tool routers reloaded successfully",
            "mounted": result.get("mounted", 0)
        }
    except Exception as e:
        raise HTTPException(500, f"Failed to reload routers: {str(e)}")


@app.get("/api/tools/{tool_id}")
async def get_tool(tool_id: str):
    """Get tool details"""
    tool = db.get_tool(tool_id)
    if not tool:
        raise HTTPException(404, "Tool not found")
    return {"tool": tool}


@app.post("/api/tools/{tool_id}/validate")
async def validate_tool(tool_id: str):
    """Re-validate a tool"""
    tool = db.get_tool(tool_id)
    if not tool:
        raise HTTPException(404, "Tool not found")
    
    # Read both scripts
    with open(tool["backend_path"], 'r', encoding='utf-8') as f:
        backend_content = f.read()
    
    with open(tool["frontend_path"], 'r', encoding='utf-8') as f:
        frontend_content = f.read()
    
    # Get frontend extension
    frontend_ext = Path(tool["frontend_path"]).suffix.lower()
    
    # Validate both
    backend_validation = validator.validate(tool["backend_path"], backend_content)
    frontend_validation = frontend_validator.validate(
        tool["frontend_path"], 
        frontend_content, 
        frontend_ext
    )
    
    # Combine results
    all_valid = backend_validation["valid"] and frontend_validation["valid"]
    
    # Update status
    new_status = "active" if all_valid else "disabled"
    db.update_tool(tool_id, {
        "status": new_status,
        "last_validated": datetime.utcnow().isoformat()
    })
    
    # Log
    log_action(
        tool_id,
        "validate",
        "success" if all_valid else "error",
        f"Tool {'validated successfully' if all_valid else 'validation failed'}",
        json.dumps({
            "backend_errors": backend_validation.get("errors", []),
            "frontend_errors": frontend_validation.get("errors", [])
        })
    )
    
    return {
        "success": True, 
        "validation": {
            "valid": all_valid,
            "backend": backend_validation,
            "frontend": frontend_validation
        }
    }


@app.post("/api/tools/execute")
async def execute_tool_legacy(request: Request, request_data: dict = {}):
    """
    LEGACY ENDPOINT: Execute tool (backward compatibility)
    
    Auto-detects tool_id from:
    1. Request body: {"tool_id": "...", "params": {...}}
    2. Referer header: extracts from /tools/{slug}/ URL
    
    This endpoint exists for backward compatibility with old tools
    that POST to /api/tools/execute instead of /api/tools/{tool_id}/execute
    """
    tool_id = request_data.get("tool_id")
    params = request_data.get("params", request_data)
    
    # If tool_id not in body, try to extract from referer
    if not tool_id:
        referer = request.headers.get("referer", "")
        logger.info(f"🔍 No tool_id in body, checking referer: {referer}")
        
        # Extract tool slug from referer
        # Example: http://localhost:8001/tools/voice-preview/index.html
        import re
        match = re.search(r'/tools/([^/]+)/', referer)
        if match:
            tool_id = match.group(1)
            logger.info(f"✅ Extracted tool_id from referer: {tool_id}")
        else:
            raise HTTPException(400, "Cannot determine tool_id. Please include 'tool_id' in request body or ensure referer header is set.")
    
    # Remove tool_id from params if it exists
    if "tool_id" in params:
        params = {k: v for k, v in params.items() if k != "tool_id"}
    
    logger.info(f"📥 Legacy execute endpoint called for tool: {tool_id}")
    
    # Delegate to main execute_tool function
    return await execute_tool(tool_id, params)


@app.post("/api/tools/{tool_id}/execute")
async def execute_tool(tool_id: str, params: dict = {}):
    """
    Execute a tool with parameters
    
    Supports lookup by:
    - tool_id (integer ID)
    - slug (text-counter, greeting-speaker, etc.)
    
    For tools with run() function:
    - Executes run() function directly
    - Returns result from run(params)
    """
    # Try to find tool by ID first, then by slug
    tool = db.get_tool(tool_id)
    
    # If not found and tool_id looks like a slug (contains hyphen or letters)
    if not tool and ('-' in tool_id or not tool_id.isdigit()):
        # Search by slug
        all_tools = db.list_tools()
        for t in all_tools:
            # Check if slug matches (case insensitive)
            t_name = t.get('name', '')
            t_slug = slugify(t_name) if t_name else ''
            if t_slug.lower() == tool_id.lower():
                tool = t
                break
    
    if not tool:
        raise HTTPException(404, f"Tool not found: {tool_id}")
    
    if tool["status"] != "active":
        raise HTTPException(400, "Tool is not active")
    
    tool_type = tool.get("tool_type", "dual")  # Default to dual for new tools
    tool_name = tool.get("name", "Unknown")
    tool_real_id = tool.get("id", tool_id)
    
    logger.info(f"📥 Execute request for '{tool_name}' (type: {tool_type})")
    logger.info(f"   Params: {params}")
    
    # Execute tool with run() function (new standard format)
    try:
        logger.info(f"🔄 Executing tool '{tool_name}' run() function...")
        
        # Get backend path (relative path from database)
        backend_path = tool.get("backend_path", "")
        if not backend_path:
            raise HTTPException(500, "Tool backend path not found")
        
        # Convert to absolute path
        abs_backend_path = os.path.join(BACKEND_DIR, backend_path)
        
        # Check if file exists
        if not os.path.exists(abs_backend_path):
            raise HTTPException(500, f"Backend file not found: {backend_path}")
        
        # Execute using ToolExecutor
        result = await executor.execute(abs_backend_path, params)
        
        logger.info(f"✅ Tool '{tool_name}' executed successfully")
        logger.info(f"   Result: {str(result)[:200]}...")  # First 200 chars
        
        # Log to database
        log_action(
            str(tool_real_id),
            "execute",
            "success",
            f"Tool '{tool_name}' executed successfully",
            ""
        )
        
        # Return result from run() function
        # Expected format: {"success": True/False, "data": ..., "error": ...}
        if isinstance(result, dict) and "success" in result:
            return result
        else:
            # Wrap non-standard result
            return {"success": True, "result": result}
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Tool '{tool_name}' execution failed: {str(e)}")
        
        # Log error to database
        log_action(
            str(tool_real_id),
            "execute",
            "error",
            f"Execution failed: {str(e)}",
            str(e)
        )
        raise HTTPException(500, f"Execution failed: {str(e)}")


@app.put("/api/tools/{tool_id}/toggle")
async def toggle_tool(tool_id: str):
    """Toggle tool status (active/disabled)"""
    tool = db.get_tool(tool_id)
    if not tool:
        raise HTTPException(404, "Tool not found")
    
    new_status = "disabled" if tool["status"] == "active" else "active"
    
    db.update_tool(tool_id, {"status": new_status})
    
    # Log
    log_action(
        tool_id,
        "toggle",
        "success",
        f"Tool status changed to {new_status}",
        ""
    )
    
    return {"success": True, "status": new_status}


@app.delete("/api/tools/{tool_id}")
async def delete_tool(tool_id: str):
    """Delete a tool and its entire directory"""
    tool = db.get_tool(tool_id)
    if not tool:
        raise HTTPException(404, "Tool not found")
    
    try:
        # Determine tool root directory from backend_path
        # Example path: /app/backend/tools/devtools/text-counter/backend/main.py
        # Tool root: /app/backend/tools/devtools/text-counter/
        backend_path = Path(tool["backend_path"])
        
        # Navigate up to find tool root directory
        # From: tools/{category}/{slug}/backend/main.py
        # To: tools/{category}/{slug}/
        if "tools/" in str(backend_path):
            # New structure: tools/{category}/{slug}/backend/main.py
            tool_root = backend_path.parent.parent  # Go up from backend/ to {slug}/
        elif "sample_tools/" in str(backend_path):
            # Old structure: sample_tools/{category}/{slug}/backend/main.py
            tool_root = backend_path.parent.parent  # Go up from backend/ to {slug}/
        else:
            # Fallback: delete individual files
            tool_root = None
        
        # Delete entire tool directory if found
        if tool_root and tool_root.exists():
            import shutil
            shutil.rmtree(tool_root)
            logger.info(f"🗑️ Deleted tool directory: {tool_root}")
        else:
            # Fallback: delete individual files (old behavior)
            if backend_path.exists():
                backend_path.unlink()
                logger.info(f"🗑️ Deleted backend file: {backend_path}")
            
            frontend_path = Path(tool.get("frontend_path", ""))
            if frontend_path.exists():
                frontend_path.unlink()
                logger.info(f"🗑️ Deleted frontend file: {frontend_path}")
            
            # Try to delete YAML if exists
            yaml_path = Path(tool.get("yaml_path", ""))
            if yaml_path.exists():
                yaml_path.unlink()
                logger.info(f"🗑️ Deleted YAML file: {yaml_path}")
        
        # Delete from database
        db.delete_tool(tool_id)
        
        # Log
        log_action(
            tool_id,
            "delete",
            "success",
            "Tool deleted (entire directory removed)",
            ""
        )
        log_tool_operation("delete", tool.get("name", tool_id), "success", "Entire directory removed")
        
        return {"success": True, "message": "Tool and its directory deleted successfully"}
        
    except Exception as e:
        logger.error(f"❌ Failed to delete tool '{tool_id}': {str(e)}")
        raise HTTPException(500, f"Failed to delete tool: {str(e)}")


@app.post("/api/tools/{tool_id}/install-deps")
async def install_dependencies(tool_id: str):
    """Install missing dependencies for a tool"""
    tool = db.get_tool(tool_id)
    if not tool:
        raise HTTPException(404, "Tool not found")
    
    try:
        result = await dep_manager.install_dependencies(tool["dependencies"])
        
        # Re-validate after installation
        with open(tool["backend_path"], 'r', encoding='utf-8') as f:
            backend_content = f.read()
        
        with open(tool["frontend_path"], 'r', encoding='utf-8') as f:
            frontend_content = f.read()
        
        frontend_ext = Path(tool["frontend_path"]).suffix.lower()
        
        backend_validation = validator.validate(tool["backend_path"], backend_content)
        frontend_validation = frontend_validator.validate(
            tool["frontend_path"],
            frontend_content,
            frontend_ext
        )
        
        all_valid = backend_validation["valid"] and frontend_validation["valid"]
        
        # Update status
        new_status = "active" if all_valid else "disabled"
        db.update_tool(tool_id, {
            "status": new_status,
            "last_validated": datetime.utcnow().isoformat()
        })
        
        # Log
        log_action(
            tool_id,
            "install-deps",
            "success" if result["success"] else "error",
            result["message"],
            result.get("output", "")
        )
        
        return {
            "success": result["success"], 
            "result": result, 
            "validation": {
                "valid": all_valid,
                "backend": backend_validation,
                "frontend": frontend_validation
            }
        }
    except Exception as e:
        raise HTTPException(500, f"Dependency installation failed: {str(e)}")



@app.get("/api/tools/{tool_id}/dependencies")
async def get_tool_dependencies(tool_id: str):
    """Get dependency status for a tool (Python and Node.js)"""
    tool = db.get_tool(tool_id)
    if not tool:
        raise HTTPException(404, "Tool not found")
    
    try:
        # Get absolute paths
        backend_path = BACKEND_DIR / tool["backend_path"]
        frontend_path = BACKEND_DIR / tool["frontend_path"]
        
        # Get Python dependencies (backend only!)
        python_deps = tool.get("python_dependencies", [])
        
        # If python_dependencies is empty but old dependencies field exists, use it
        # (for backward compatibility with old tools)
        if not python_deps and tool.get("dependencies"):
            # Only use dependencies from old field if they don't include common frontend deps
            frontend_packages = {'react', 'lucide-react', 'framer-motion', 'axios', 'react-dom'}
            old_deps = tool.get("dependencies", [])
            # Filter out frontend packages
            python_deps = [dep for dep in old_deps if dep not in frontend_packages]
        
        # Check all dependencies
        dep_status = await dep_manager.check_all_dependencies(
            str(backend_path),
            str(frontend_path),
            python_deps
        )
        
        return {
            "success": True,
            "tool_id": tool_id,
            "tool_name": tool.get("name"),
            "dependencies": dep_status
        }
    except Exception as e:
        raise HTTPException(500, f"Failed to check dependencies: {str(e)}")


@app.post("/api/tools/{tool_id}/install-python-deps")
async def install_python_dependencies(tool_id: str):
    """Install Python dependencies for a tool"""
    tool = db.get_tool(tool_id)
    if not tool:
        raise HTTPException(404, "Tool not found")
    
    try:
        # Get Python dependencies (backend only!)
        python_deps = tool.get("python_dependencies", [])
        
        # Backward compatibility: if python_dependencies is empty, filter old dependencies
        if not python_deps and tool.get("dependencies"):
            frontend_packages = {'react', 'lucide-react', 'framer-motion', 'axios', 'react-dom'}
            old_deps = tool.get("dependencies", [])
            python_deps = [dep for dep in old_deps if dep not in frontend_packages]
        
        result = await dep_manager.install_dependencies(python_deps)
        
        # Log action
        log_action(
            tool_id,
            "install-python-deps",
            "success" if result["success"] else "error",
            result["message"],
            result.get("output", "")
        )
        
        return {
            "success": result["success"],
            "message": result["message"],
            "output": result.get("output", "")
        }
    except Exception as e:
        raise HTTPException(500, f"Python dependency installation failed: {str(e)}")


@app.post("/api/tools/{tool_id}/install-node-deps")
async def install_node_dependencies(tool_id: str):
    """Install Node.js dependencies for a tool"""
    tool = db.get_tool(tool_id)
    if not tool:
        raise HTTPException(404, "Tool not found")
    
    try:
        # Get absolute path
        frontend_path = BACKEND_DIR / tool["frontend_path"]
        
        result = await dep_manager.install_node_dependencies(str(frontend_path))
        
        # Log action
        log_action(
            tool_id,
            "install-node-deps",
            "success" if result["success"] else "error",
            result["message"],
            result.get("output", "")
        )
        
        return {
            "success": result["success"],
            "message": result["message"],
            "output": result.get("output", ""),
            "dependencies": result.get("dependencies", [])
        }
    except Exception as e:
        raise HTTPException(500, f"Node.js dependency installation failed: {str(e)}")


@app.post("/api/tools/{tool_id}/install-all-deps")
async def install_all_dependencies(tool_id: str):
    """Install both Python and Node.js dependencies for a tool"""
    tool = db.get_tool(tool_id)
    if not tool:
        raise HTTPException(404, "Tool not found")
    
    try:
        results = {
            "python": {"success": True, "message": "No dependencies"},
            "node": {"success": True, "message": "No dependencies"}
        }
        
        # Install Python dependencies
        python_deps = tool.get("python_dependencies", [])
        
        # Backward compatibility
        if not python_deps and tool.get("dependencies"):
            frontend_packages = {'react', 'lucide-react', 'framer-motion', 'axios', 'react-dom'}
            old_deps = tool.get("dependencies", [])
            python_deps = [dep for dep in old_deps if dep not in frontend_packages]
        
        if python_deps:
            results["python"] = await dep_manager.install_dependencies(python_deps)
            log_action(
                tool_id,
                "install-python-deps",
                "success" if results["python"]["success"] else "error",
                results["python"]["message"],
                results["python"].get("output", "")
            )
        
        # Install Node.js dependencies
        frontend_path = BACKEND_DIR / tool["frontend_path"]
        results["node"] = await dep_manager.install_node_dependencies(str(frontend_path))
        log_action(
            tool_id,
            "install-node-deps",
            "success" if results["node"]["success"] else "error",
            results["node"]["message"],
            results["node"].get("output", "")
        )
        
        # Re-validate tool after installation
        with open(BACKEND_DIR / tool["backend_path"], 'r', encoding='utf-8') as f:
            backend_content = f.read()
        
        with open(frontend_path, 'r', encoding='utf-8') as f:
            frontend_content = f.read()
        
        frontend_ext = Path(tool["frontend_path"]).suffix.lower()
        
        backend_validation = validator.validate(str(BACKEND_DIR / tool["backend_path"]), backend_content)
        frontend_validation = frontend_validator.validate(
            str(frontend_path),
            frontend_content,
            frontend_ext
        )
        
        all_valid = backend_validation["valid"] and frontend_validation["valid"]
        all_success = results["python"]["success"] and results["node"]["success"]
        
        # Update tool status if all dependencies installed successfully
        if all_success and all_valid:
            db.update_tool(tool_id, {
                "status": "active",
                "last_validated": datetime.utcnow().isoformat()
            })
        
        return {
            "success": all_success,
            "results": results,
            "validation": {
                "valid": all_valid,
                "backend": backend_validation,
                "frontend": frontend_validation
            },
            "tool_status": "active" if (all_success and all_valid) else "disabled"
        }
    except Exception as e:
        raise HTTPException(500, f"Dependency installation failed: {str(e)}")


@app.post("/api/system/restart")
async def restart_application():
    """Restart the application (reload routers and remount tools)"""
    try:
        # Reload all tool routers
        result = mount_tool_routers()
        
        return {
            "success": True,
            "message": "Application restarted successfully",
            "mounted_tools": result.get("mounted", 0)
        }
    except Exception as e:
        raise HTTPException(500, f"Restart failed: {str(e)}")



@app.get("/api/tools/{tool_id}/logs")
async def get_tool_logs(tool_id: str, limit: int = 50):
    """Get logs for a specific tool"""
    logs = db.get_logs(tool_id, limit)
    return {"logs": logs, "count": len(logs)}


@app.get("/api/tools/file/{tool_id}")
async def get_tool_file(tool_id: str, file_type: str = "frontend"):
    """Get the source file content of a tool (frontend or backend)"""
    tool = db.get_tool(tool_id)
    if not tool:
        raise HTTPException(404, "Tool not found")
    
    tool_name = tool.get("name", "Unknown")
    logger.info(f"📂 Loading {file_type} file for tool '{tool_name}'")
    
    # Determine which file to return
    if file_type == "frontend":
        script_path = Path(tool["frontend_path"])
    elif file_type == "backend":
        script_path = Path(tool["backend_path"])
    else:
        raise HTTPException(400, "file_type must be 'frontend' or 'backend'")
    
    logger.info(f"   Path: {script_path}")
    
    if not script_path.exists():
        logger.error(f"❌ {file_type.title()} file not found at {script_path}")
        raise HTTPException(404, f"{file_type.title()} file not found")
    
    try:
        with open(script_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Determine content type
        file_ext = script_path.suffix.lower()
        content_type = "text/plain"
        if file_ext == ".html":
            content_type = "text/html"
        elif file_ext in [".jsx", ".tsx", ".js"]:
            content_type = "application/javascript"
        elif file_ext == ".py":
            content_type = "text/x-python"
        
        logger.info(f"✅ Successfully loaded {file_type} file ({len(content)} chars, type: {content_type})")
        
        return JSONResponse(
            content={"success": True, "content": content, "filename": script_path.name},
            media_type="application/json"
        )
    except Exception as e:
        logger.error(f"❌ Failed to read tool file: {str(e)}")
        raise HTTPException(500, f"Failed to read tool file: {str(e)}")



@app.post("/api/tools/file/{tool_id}")
async def save_tool_file(tool_id: str, file_data: dict):
    """Save/update tool source file"""
    tool = db.get_tool(tool_id)
    if not tool:
        raise HTTPException(404, "Tool not found")
    
    file_type = file_data.get("file_type", "frontend")
    content = file_data.get("content", "")
    
    tool_name = tool.get("name", "Unknown")
    logger.info(f"💾 Saving {file_type} file for tool '{tool_name}'")
    
    # Determine which file to save
    if file_type == "frontend":
        script_path = Path(tool["frontend_path"])
    elif file_type == "backend":
        script_path = Path(tool["backend_path"])
    else:
        raise HTTPException(400, "file_type must be 'frontend' or 'backend'")
    
    logger.info(f"   Path: {script_path}")
    
    if not script_path.parent.exists():
        script_path.parent.mkdir(parents=True, exist_ok=True)
    
    try:
        with open(script_path, 'w', encoding='utf-8') as f:
            f.write(content)
        
        logger.info(f"✅ Successfully saved {file_type} file ({len(content)} chars)")
        
        # Log operation
        log_tool_operation(
            f"save_{file_type}",
            tool.get("name", tool_id),
            "success",
            f"{file_type.title()} file saved successfully (path: {script_path.name}, size: {len(content)} chars)"
        )
        
        return JSONResponse({
            "success": True,
            "message": f"{file_type.title()} file saved successfully",
            "filename": script_path.name
        })
    except Exception as e:
        logger.error(f"❌ Failed to save tool file: {str(e)}")
        db.insert_log({
            "_id": str(uuid.uuid4()),
            "tool_id": tool_id,
            "action": f"save_{file_type}",
            "status": "error",
            "message": f"Failed to save {file_type} file",
            "trace": json.dumps({"error": str(e)}),
            "timestamp": datetime.now().isoformat()
        })
        raise HTTPException(500, f"Failed to save tool file: {str(e)}")


@app.post("/api/tools/rebuild/{tool_id}")
async def rebuild_tool(tool_id: str):
    """Rebuild tool - delete build artifacts and rebuild"""
    tool = db.get_tool(tool_id)
    if not tool:
        raise HTTPException(404, "Tool not found")
    
    tool_name = tool.get("name", "Unknown")
    slug = tool.get("slug", "")
    
    logger.info(f"🔨 Rebuilding tool '{tool_name}'")
    
    try:
        # Step 1: Delete build artifacts
        public_dir = BACKEND_DIR.parent / "public" / "tools" / slug
        if public_dir.exists():
            shutil.rmtree(public_dir)
            logger.info(f"   🗑️  Deleted build artifacts at {public_dir}")
        
        # Step 2: Rebuild tool using ToolBuilder
        builder = ToolBuilder(backend_dir=BACKEND_DIR)
        
        # Build tool - pass tool_data dictionary
        build_result = builder.build_tool(tool)
        
        if build_result["success"]:
            logger.info(f"✅ Tool '{tool_name}' rebuilt successfully")
            
            # Log operation
            db.insert_log({
                "_id": str(uuid.uuid4()),
                "tool_id": tool_id,
                "action": "rebuild",
                "status": "success",
                "message": "Tool rebuilt successfully",
                "trace": json.dumps({"build_path": str(public_dir), "slug": slug}),
                "timestamp": datetime.now().isoformat()
            })
            
            return JSONResponse({
                "success": True,
                "message": "Tool rebuilt successfully",
                "build_path": str(public_dir),
                "url": build_result.get("url", "")
            })
        else:
            error_msg = build_result.get("error", "Unknown error")
            logger.error(f"❌ Build failed: {error_msg}")
            db.insert_log({
                "_id": str(uuid.uuid4()),
                "tool_id": tool_id,
                "action": "rebuild",
                "status": "error",
                "message": f"Build failed: {error_msg}",
                "trace": json.dumps({"error": error_msg}),
                "timestamp": datetime.now().isoformat()
            })
            return JSONResponse({
                "success": False,
                "message": f"Build failed: {error_msg}"
            }, status_code=500)
            
    except Exception as e:
        logger.error(f"❌ Rebuild failed: {str(e)}")
        db.insert_log({
            "_id": str(uuid.uuid4()),
            "tool_id": tool_id,
            "action": "rebuild",
            "status": "error",
            "message": "Rebuild failed",
            "trace": json.dumps({"error": str(e)}),
            "timestamp": datetime.now().isoformat()
        })
        raise HTTPException(500, f"Rebuild failed: {str(e)}")




@app.get("/api/tools/{tool_id}/yaml")
async def get_tool_yaml(tool_id: str):
    """Get tool YAML configuration file"""
    tool = db.get_tool(tool_id)
    if not tool:
        raise HTTPException(404, "Tool not found")
    
    tool_name = tool.get("name", "Unknown")
    logger.info(f"📄 Loading YAML for tool '{tool_name}'")
    
    try:
        # Get tool directory from frontend_path or backend_path
        if tool.get("frontend_path"):
            tool_file = BACKEND_DIR / tool["frontend_path"]
        elif tool.get("backend_path"):
            tool_file = BACKEND_DIR / tool["backend_path"]
        else:
            raise HTTPException(400, "Tool has no frontend_path or backend_path")
        
        # YAML file is in parent directory of frontend/backend folder
        yaml_file = tool_file.parent.parent / f"{tool.get('slug', tool_name.lower().replace(' ', '-'))}.yaml"
        
        if not yaml_file.exists():
            raise HTTPException(404, f"YAML file not found: {yaml_file}")
        
        with open(yaml_file, 'r', encoding='utf-8') as f:
            content = f.read()
        
        logger.info(f"✅ YAML loaded successfully ({len(content)} chars)")
        
        return JSONResponse({
            "success": True,
            "content": content,
            "filename": yaml_file.name,
            "path": str(yaml_file)
        })
        
    except Exception as e:
        logger.error(f"❌ Failed to load YAML: {str(e)}")
        raise HTTPException(500, f"Failed to load YAML: {str(e)}")


@app.post("/api/tools/{tool_id}/yaml")
async def save_tool_yaml(tool_id: str, yaml_data: dict):
    """Save tool YAML configuration file"""
    tool = db.get_tool(tool_id)
    if not tool:
        raise HTTPException(404, "Tool not found")
    
    content = yaml_data.get("content", "")
    if not content:
        raise HTTPException(400, "Content is required")
    
    tool_name = tool.get("name", "Unknown")
    logger.info(f"💾 Saving YAML for tool '{tool_name}'")
    
    try:
        # Get tool directory from frontend_path or backend_path
        if tool.get("frontend_path"):
            tool_file = BACKEND_DIR / tool["frontend_path"]
        elif tool.get("backend_path"):
            tool_file = BACKEND_DIR / tool["backend_path"]
        else:
            raise HTTPException(400, "Tool has no frontend_path or backend_path")
        
        # YAML file is in parent directory of frontend/backend folder
        yaml_file = tool_file.parent.parent / f"{tool.get('slug', tool_name.lower().replace(' ', '-'))}.yaml"
        
        # Backup existing YAML
        if yaml_file.exists():
            backup_file = yaml_file.with_suffix('.yaml.bak')
            shutil.copy2(yaml_file, backup_file)
            logger.info(f"   📋 Backup created: {backup_file.name}")
        
        # Write new content
        with open(yaml_file, 'w', encoding='utf-8') as f:
            f.write(content)
        
        logger.info(f"✅ YAML saved successfully ({len(content)} chars)")
        
        # Log operation
        log_tool_operation(
            "save_yaml",
            tool_name,
            "success",
            f"YAML file saved successfully (size: {len(content)} chars)"
        )
        
        return JSONResponse({
            "success": True,
            "message": "YAML file saved successfully",
            "filename": yaml_file.name
        })
        
    except Exception as e:
        logger.error(f"❌ Failed to save YAML: {str(e)}")
        db.insert_log({
            "_id": str(uuid.uuid4()),
            "tool_id": tool_id,
            "action": "save_yaml",
            "status": "error",
            "message": "Failed to save YAML",
            "trace": json.dumps({"error": str(e)}),
            "timestamp": datetime.now().isoformat()
        })
        raise HTTPException(500, f"Failed to save YAML: {str(e)}")



@app.get("/api/tools/{tool_id}/render")
async def render_tool(tool_id: str):
    """
    Render tool in iframe (dynamic loading endpoint)
    
    Returns built index.html for uploaded tools.
    Built tools are stored in: /public/tools/{slug}/index.html
    """
    from fastapi.responses import FileResponse, HTMLResponse
    
    tool = db.get_tool(tool_id)
    if not tool:
        raise HTTPException(404, "Tool not found")
    
    tool_name = tool.get("name", "Unknown")
    logger.info(f"📦 Rendering tool: {tool_name} (ID: {tool_id})")
    
    # Check if tool has built bundle
    # Try to get slug field first, fallback to _id
    slug = tool.get("slug", tool.get("_id", tool_id))
    public_dir = BACKEND_DIR.parent / "public" / "tools" / slug
    index_html = public_dir / "index.html"
    
    logger.info(f"   Looking for: {index_html}")
    
    if not index_html.exists():
        # Tool not built yet - return error page
        error_html = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Tool Not Built</title>
            <style>
                body {{
                    font-family: system-ui, -apple-system, sans-serif;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    min-height: 100vh;
                    margin: 0;
                    background: #f3f4f6;
                }}
                .error-box {{
                    text-align: center;
                    padding: 2rem;
                    background: white;
                    border-radius: 0.5rem;
                    box-shadow: 0 4px 6px rgba(0,0,0,0.1);
                    max-width: 500px;
                }}
                h2 {{ color: #ef4444; margin-bottom: 1rem; }}
                p {{ color: #6b7280; margin-bottom: 1.5rem; }}
                code {{ background: #f3f4f6; padding: 0.25rem 0.5rem; border-radius: 0.25rem; }}
            </style>
        </head>
        <body>
            <div class="error-box">
                <h2>⚠️ Tool Not Built</h2>
                <p>This tool has not been built yet.</p>
                <p>Expected path: <code>{index_html}</code></p>
                <p>Please trigger a rebuild or contact the developer.</p>
            </div>
        </body>
        </html>
        """
        logger.warning(f"⚠️ Tool not built: {tool_name}")
        return HTMLResponse(content=error_html, status_code=404)
    
    logger.info(f"✅ Serving built tool: {tool_name}")
    
    # Create response with aggressive no-cache headers
    response = FileResponse(index_html, media_type="text/html")
    
    # CRITICAL: Prevent any caching to avoid stale tool previews
    response.headers["Cache-Control"] = "no-store, no-cache, must-revalidate, max-age=0"
    response.headers["Pragma"] = "no-cache"
    response.headers["Expires"] = "0"
    
    # Add ETag based on file modification time for better cache invalidation
    import hashlib
    import time
    mtime = index_html.stat().st_mtime
    etag = hashlib.md5(f"{tool_id}-{mtime}".encode()).hexdigest()
    response.headers["ETag"] = f'"{etag}"'
    
    return response



# ============================================================
# 🚀 SMART API ROUTING SYSTEM
# ============================================================

@app.get("/api/tools/{tool_id}/meta")
async def get_tool_metadata(tool_id: str):
    """
    Get tool metadata including available endpoints for auto-discovery.
    This enables frontend to dynamically discover tool capabilities.
    """
    tool = db.get_tool(tool_id)
    if not tool:
        raise HTTPException(404, "Tool not found")
    
    # Build base URL for this tool
    base_url = f"/api/tools/{tool_id}"
    
    # Standard endpoints available for all tools
    standard_endpoints = [
        {'path': '/', 'methods': ['GET'], 'name': 'info', 'description': 'Get tool info'},
        {'path': '/meta', 'methods': ['GET'], 'name': 'metadata', 'description': 'Get tool metadata'},
        {'path': '/execute', 'methods': ['POST'], 'name': 'execute', 'description': 'Execute tool'},
        {'path': '/validate', 'methods': ['POST'], 'name': 'validate', 'description': 'Validate tool'},
        {'path': '/logs', 'methods': ['GET'], 'name': 'logs', 'description': 'Get tool logs'},
    ]
    
    metadata = {
        'tool_id': tool_id,
        'name': tool['name'],
        'slug': tool.get('slug'),
        'slug_aliases': json.loads(tool.get('slug_aliases', '[]')),
        'category': tool['category'],
        'version': tool['version'],
        'author': tool['author'],
        'description': tool['description'],
        'tool_type': tool['tool_type'],
        'status': tool['status'],
        'base_url': base_url,
        'endpoints': standard_endpoints,
        'created_at': tool['created_at'],
        'updated_at': tool['updated_at']
    }
    
    logger.info(f"📋 Metadata requested for: {tool['name']} (ID: {tool_id[:8]}...)")
    
    return metadata


@app.get("/api/tools/by-slug/{category}/{slug}")
async def get_tool_by_slug(category: str, slug: str):
    """
    Get tool by category + slug (human-readable alternative to UUID).
    Returns redirect to UUID-based endpoint.
    """
    tool = db.get_tool_by_slug(category, slug)
    
    if not tool:
        # Try slug aliases
        tool = db.find_tool_by_slug_alias(slug)
        
        if not tool:
            raise HTTPException(
                404, 
                f"Tool not found: category='{category}', slug='{slug}'"
            )
        
        # If found via alias, log redirect
        logger.info(f"🔄 Slug alias redirect: {slug} → {tool['slug']} (ID: {tool['_id'][:8]}...)")
    
    # Return tool info with UUID for client to use
    return {
        'tool_id': tool['_id'],
        'name': tool['name'],
        'slug': tool.get('slug'),
        'category': tool['category'],
        'redirect_url': f"/api/tools/{tool['_id']}",
        'meta_url': f"/api/tools/{tool['_id']}/meta"
    }


@app.get("/api/tools/resolve/{slug}")
async def resolve_tool_slug(slug: str):
    """
    Resolve slug to tool (search across all categories).
    Useful for quick lookup without knowing category.
    """
    tool = db.find_tool_by_slug_alias(slug)
    
    if not tool:
        raise HTTPException(404, f"Tool with slug '{slug}' not found")
    
    return {
        'tool_id': tool['_id'],
        'name': tool['name'],
        'slug': tool.get('slug'),
        'category': tool['category'],
        'redirect_url': f"/api/tools/{tool['_id']}",
        'meta_url': f"/api/tools/{tool['_id']}/meta"
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
