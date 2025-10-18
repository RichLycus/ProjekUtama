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

# Ensure directories exist
DATA_DIR.mkdir(exist_ok=True)
TOOLS_DIR.mkdir(exist_ok=True)

# SQLite Database Connection
db = SQLiteDB(str(DATA_DIR / "chimera_tools.db"))

# Initialize modules
validator = ToolValidator()
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
    file: UploadFile = File(...),
    name: str = Form(...),
    description: str = Form(...),
    category: str = Form(...),
    version: str = Form("1.0.0"),
    author: str = Form("Anonymous")
):
    """Upload and validate a new Python tool"""
    try:
        # Validate category
        if category not in CATEGORIES:
            raise HTTPException(400, f"Invalid category. Must be one of: {CATEGORIES}")
        
        # Generate tool ID
        tool_id = str(uuid.uuid4())
        
        # Read file content
        content = await file.read()
        script_content = content.decode('utf-8')
        
        # Save to category folder (portable path)
        category_folder = TOOLS_DIR / category.lower()
        category_folder.mkdir(exist_ok=True)
        script_path = category_folder / f"{tool_id}.py"
        
        with open(script_path, 'w') as f:
            f.write(script_content)
        
        # Validate tool (convert Path to string for validator)
        validation_result = validator.validate(str(script_path), script_content)
        
        # Determine status
        status = "active" if validation_result["valid"] else "disabled"
        
        # Create tool document
        tool_doc = {
            "_id": tool_id,
            "name": name,
            "description": description,
            "category": category,
            "version": version,
            "author": author,
            "script_path": str(script_path),  # Store as string
            "dependencies": validation_result.get("dependencies", []),
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
            "success" if validation_result["valid"] else "error",
            f"Tool uploaded and {'validated' if validation_result['valid'] else 'failed validation'}",
            json.dumps(validation_result.get("errors", []))
        )
        
        return {
            "success": True,
            "tool_id": tool_id,
            "tool": tool_doc,
            "validation": validation_result
        }
        
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
    
    # Read script
    with open(tool["script_path"], 'r') as f:
        script_content = f.read()
    
    # Validate
    validation_result = validator.validate(tool["script_path"], script_content)
    
    # Update status
    new_status = "active" if validation_result["valid"] else "disabled"
    db.update_tool(tool_id, {
        "status": new_status,
        "last_validated": datetime.utcnow().isoformat()
    })
    
    # Log
    log_action(
        tool_id,
        "validate",
        "success" if validation_result["valid"] else "error",
        f"Tool {'validated successfully' if validation_result['valid'] else 'validation failed'}",
        json.dumps(validation_result.get("errors", []))
    )
    
    return {"success": True, "validation": validation_result}


@app.post("/api/tools/{tool_id}/execute")
async def execute_tool(tool_id: str, params: dict = {}):
    """Execute a tool with parameters"""
    tool = db.get_tool(tool_id)
    if not tool:
        raise HTTPException(404, "Tool not found")
    
    if tool["status"] != "active":
        raise HTTPException(400, "Tool is not active")
    
    try:
        result = await executor.execute(tool["script_path"], params)
        
        # Log
        log_action(
            tool_id,
            "execute",
            "success",
            "Tool executed successfully",
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
    
    # Delete file
    if os.path.exists(tool["script_path"]):
        os.remove(tool["script_path"])
    
    # Delete from database
    db.delete_tool(tool_id)
    
    # Log
    log_action(
        tool_id,
        "delete",
        "success",
        "Tool deleted",
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
        with open(tool["script_path"], 'r') as f:
            script_content = f.read()
        
        validation_result = validator.validate(tool["script_path"], script_content)
        
        # Update status
        new_status = "active" if validation_result["valid"] else "disabled"
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
        
        return {"success": result["success"], "result": result, "validation": validation_result}
    except Exception as e:
        raise HTTPException(500, f"Dependency installation failed: {str(e)}")


@app.get("/api/tools/{tool_id}/logs")
async def get_tool_logs(tool_id: str, limit: int = 50):
    """Get logs for a specific tool"""
    logs = db.get_logs(tool_id, limit)
    return {"logs": logs, "count": len(logs)}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
