from fastapi import FastAPI, UploadFile, File, HTTPException, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, StreamingResponse
import os
import uuid
import json
from pathlib import Path
from datetime import datetime
from typing import Optional, List

from database import SQLiteDB
from modules.tool_validator import ToolValidator
from modules.frontend_tool_validator import FrontendToolValidator
from modules.tool_executor import ToolExecutor
from modules.dependency_manager import DependencyManager

app = FastAPI(title="ChimeraAI Tools API")

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

# Get backend directory (portable path)
BACKEND_DIR = Path(__file__).parent
DATA_DIR = BACKEND_DIR / "data"
TOOLS_DIR = BACKEND_DIR / "tools"
FRONTEND_TOOLS_DIR = BACKEND_DIR / "frontend_tools"

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

CATEGORIES = ["Office", "DevTools", "Multimedia", "Utilities", "Security", "Network", "Data"]


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


@app.get("/api/tools/categories")
async def get_categories():
    """Get all available categories"""
    return {"categories": CATEGORIES}


@app.post("/api/tools/upload")
async def upload_tool(
    backend_file: UploadFile = File(...),
    frontend_file: UploadFile = File(...),
    name: str = Form(...),
    description: str = Form(...),
    category: str = Form(...),
    version: str = Form("1.0.0"),
    author: str = Form("Anonymous")
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
        
        # Generate tool ID
        tool_id = str(uuid.uuid4())
        
        # Read both files
        backend_content = (await backend_file.read()).decode('utf-8')
        frontend_content = (await frontend_file.read()).decode('utf-8')
        
        # Create category folders
        backend_category_folder = TOOLS_DIR / category.lower()
        frontend_category_folder = FRONTEND_TOOLS_DIR / category.lower()
        backend_category_folder.mkdir(exist_ok=True)
        frontend_category_folder.mkdir(exist_ok=True)
        
        # Save backend file
        backend_path = backend_category_folder / f"{tool_id}.py"
        with open(backend_path, 'w', encoding='utf-8') as f:
            f.write(backend_content)
        
        # Save frontend file
        frontend_path = frontend_category_folder / f"{tool_id}{frontend_ext}"
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
        combined_deps = backend_validation.get("dependencies", []) + frontend_validation.get("dependencies", [])
        
        # Determine status
        status = "active" if all_valid else "disabled"
        
        # Create tool document
        tool_doc = {
            "_id": tool_id,
            "name": name,
            "description": description,
            "category": category,
            "tool_type": "dual",
            "version": version,
            "author": author,
            "backend_path": str(backend_path),
            "frontend_path": str(frontend_path),
            "dependencies": list(set(combined_deps)),  # Remove duplicates
            "status": status,
            "last_validated": datetime.utcnow().isoformat(),
            "created_at": datetime.utcnow().isoformat(),
            "updated_at": datetime.utcnow().isoformat()
        }
        
        db.insert_tool(tool_doc)
        
        # Log action
        log_action(
            tool_id,
            "upload",
            "success" if all_valid else "warning",
            f"Dual tool uploaded: backend {'✓' if backend_validation['valid'] else '✗'}, frontend {'✓' if frontend_validation['valid'] else '✗'}",
            json.dumps({
                "backend_errors": backend_validation.get("errors", []),
                "frontend_errors": frontend_validation.get("errors", [])
            })
        )
        
        return {
            "success": True,
            "tool_id": tool_id,
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


@app.post("/api/tools/{tool_id}/execute")
async def execute_tool(tool_id: str, params: dict = {}):
    """Execute a tool with parameters (backend only)"""
    tool = db.get_tool(tool_id)
    if not tool:
        raise HTTPException(404, "Tool not found")
    
    if tool["status"] != "active":
        raise HTTPException(400, "Tool is not active")
    
    try:
        # Execute backend script
        result = await executor.execute(tool["backend_path"], params)
        
        # Log
        log_action(
            tool_id,
            "execute",
            "success",
            "Backend tool executed successfully",
            ""
        )
        
        return {"success": True, "result": result}
    except Exception as e:
        # Log error
        log_action(
            tool_id,
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
    """Delete a tool"""
    tool = db.get_tool(tool_id)
    if not tool:
        raise HTTPException(404, "Tool not found")
    
    # Delete both files
    if os.path.exists(tool["backend_path"]):
        os.remove(tool["backend_path"])
    
    if os.path.exists(tool["frontend_path"]):
        os.remove(tool["frontend_path"])
    
    # Delete from database
    db.delete_tool(tool_id)
    
    # Log
    log_action(
        tool_id,
        "delete",
        "success",
        "Tool deleted (backend + frontend)",
        ""
    )
    
    return {"success": True, "message": "Tool deleted"}


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
    
    # Determine which file to return
    if file_type == "frontend":
        script_path = Path(tool["frontend_path"])
    elif file_type == "backend":
        script_path = Path(tool["backend_path"])
    else:
        raise HTTPException(400, "file_type must be 'frontend' or 'backend'")
    
    if not script_path.exists():
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
        
        return JSONResponse(
            content={"content": content, "filename": script_path.name},
            media_type="application/json"
        )
    except Exception as e:
        raise HTTPException(500, f"Failed to read tool file: {str(e)}")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
