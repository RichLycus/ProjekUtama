"""
Tools Management Logger

Logs all tools-related operations (upload, validation, delete, execute)
to a dedicated log file for easier debugging.
"""

import logging
from pathlib import Path
from datetime import datetime

# Create logs directory if not exists
LOGS_DIR = Path(__file__).parent.parent.parent / "logs"
LOGS_DIR.mkdir(exist_ok=True)

# Tools log file
TOOLS_LOG_FILE = LOGS_DIR / "tools.log"

# Configure tools logger
tools_logger = logging.getLogger("tools")
tools_logger.setLevel(logging.INFO)

# File handler
file_handler = logging.FileHandler(TOOLS_LOG_FILE)
file_handler.setLevel(logging.INFO)

# Formatter with more detail
formatter = logging.Formatter(
    '%(asctime)s | %(levelname)-8s | %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S'
)
file_handler.setFormatter(formatter)

# Add handler
if not tools_logger.handlers:
    tools_logger.addHandler(file_handler)


def log_tool_operation(operation: str, tool_name: str, status: str, details: str = ""):
    """
    Log a tools operation
    
    Args:
        operation: upload, validate, delete, execute, etc.
        tool_name: Name of the tool
        status: success, error, warning
        details: Additional details
    """
    emoji_map = {
        "success": "✅",
        "error": "❌",
        "warning": "⚠️",
        "info": "ℹ️"
    }
    emoji = emoji_map.get(status.lower(), "📝")
    
    msg = f"{emoji} {operation.upper()} | Tool: {tool_name}"
    if details:
        msg += f" | {details}"
    
    tools_logger.info(msg)


def log_validation_details(tool_name: str, backend_valid: bool, frontend_valid: bool, 
                          backend_errors: list, frontend_errors: list):
    """Log detailed validation results with smart error reporting"""
    tools_logger.info(f"📋 VALIDATION | Tool: {tool_name}")
    tools_logger.info(f"   Backend: {'✅ Valid' if backend_valid else '❌ Invalid'}")
    
    if backend_errors:
        tools_logger.info(f"   Backend Errors ({len(backend_errors)}):")
        for err in backend_errors:
            tools_logger.info(f"      - {err}")
    
    tools_logger.info(f"   Frontend: {'✅ Valid' if frontend_valid else '❌ Invalid'}")
    
    if frontend_errors:
        tools_logger.info(f"   Frontend Errors ({len(frontend_errors)}):")
        for err in frontend_errors:
            tools_logger.info(f"      - {err}")


def log_upload_start(tool_name: str, source: str = "zip"):
    """Log upload start"""
    tools_logger.info(f"📦 UPLOAD START | Tool: {tool_name} | Source: {source}")


def log_upload_success(tool_name: str, slug: str, category: str, overwritten: bool = False):
    """Log successful upload"""
    action = "UPDATED" if overwritten else "CREATED"
    tools_logger.info(f"✅ UPLOAD {action} | Tool: {tool_name} | Slug: {slug} | Category: {category}")


def log_upload_failed(tool_name: str, reason: str, backend_errors: list = None, frontend_errors: list = None):
    """Log failed upload with detailed errors"""
    tools_logger.error(f"❌ UPLOAD FAILED | Tool: {tool_name} | Reason: {reason}")
    
    if backend_errors:
        tools_logger.error(f"   Backend Issues ({len(backend_errors)}):")
        for err in backend_errors:
            tools_logger.error(f"      - {err}")
    
    if frontend_errors:
        tools_logger.error(f"   Frontend Issues ({len(frontend_errors)}):")
        for err in frontend_errors:
            tools_logger.error(f"      - {err}")


def log_structure_validation(tool_name: str, structure_valid: bool, errors: list = None):
    """Log ZIP structure validation"""
    if structure_valid:
        tools_logger.info(f"✅ STRUCTURE VALID | Tool: {tool_name} | ZIP structure is correct")
    else:
        tools_logger.error(f"❌ STRUCTURE INVALID | Tool: {tool_name}")
        if errors:
            for err in errors:
                tools_logger.error(f"      - {err}")
