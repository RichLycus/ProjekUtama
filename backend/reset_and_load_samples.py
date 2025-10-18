"""
Reset Database and Load Sample Tools

This script will:
1. Reset the tools database
2. Upload 3 sample dual tools
"""

import sys
import os
from pathlib import Path

# Add backend to path
backend_dir = Path(__file__).parent
sys.path.insert(0, str(backend_dir))

from database import SQLiteDB
from datetime import datetime
import uuid
import shutil

# Initialize database
data_dir = backend_dir / "data"
data_dir.mkdir(exist_ok=True)

db = SQLiteDB(str(data_dir / "chimera_tools.db"))

print("🔄 Resetting database...")
db.reset_tools_table()
print("✅ Database reset complete!")

# Define sample tools
sample_tools = [
    {
        "name": "Simple Calculator",
        "category": "Utilities",
        "description": "Perform basic arithmetic operations (add, subtract, multiply, divide)",
        "backend_file": "calculator_backend.py",
        "frontend_file": "calculator_frontend.html",
        "version": "1.0.0",
        "author": "ChimeraAI Team"
    },
    {
        "name": "Text Formatter",
        "category": "Office",
        "description": "Format and transform text (uppercase, lowercase, title case, reverse, word count)",
        "backend_file": "text_formatter_backend.py",
        "frontend_file": "text_formatter_frontend.html",
        "version": "1.0.0",
        "author": "ChimeraAI Team"
    },
    {
        "name": "Color Picker",
        "category": "DevTools",
        "description": "Convert colors between formats (HEX, RGB, HSL) and generate color palettes",
        "backend_file": "color_picker_backend.py",
        "frontend_file": "color_picker_frontend.html",
        "version": "1.0.0",
        "author": "ChimeraAI Team"
    }
]

# Create tool directories
tools_dir = backend_dir / "tools"
frontend_tools_dir = backend_dir / "frontend_tools"
sample_tools_dir = backend_dir / "sample_tools"

tools_dir.mkdir(exist_ok=True)
frontend_tools_dir.mkdir(exist_ok=True)

print("\n📦 Loading sample tools...")

for tool in sample_tools:
    tool_id = str(uuid.uuid4())
    
    # Create category folders
    backend_category = tools_dir / tool["category"].lower()
    frontend_category = frontend_tools_dir / tool["category"].lower()
    backend_category.mkdir(exist_ok=True)
    frontend_category.mkdir(exist_ok=True)
    
    # Copy backend file
    backend_src = sample_tools_dir / tool["backend_file"]
    backend_dest = backend_category / f"{tool_id}.py"
    shutil.copy2(backend_src, backend_dest)
    
    # Copy frontend file
    frontend_src = sample_tools_dir / tool["frontend_file"]
    frontend_ext = Path(tool["frontend_file"]).suffix
    frontend_dest = frontend_category / f"{tool_id}{frontend_ext}"
    shutil.copy2(frontend_src, frontend_dest)
    
    # Insert to database
    tool_doc = {
        "_id": tool_id,
        "name": tool["name"],
        "description": tool["description"],
        "category": tool["category"],
        "tool_type": "dual",
        "version": tool["version"],
        "author": tool["author"],
        "backend_path": str(backend_dest),
        "frontend_path": str(frontend_dest),
        "dependencies": [],
        "status": "active",
        "last_validated": datetime.utcnow().isoformat(),
        "created_at": datetime.utcnow().isoformat(),
        "updated_at": datetime.utcnow().isoformat()
    }
    
    db.insert_tool(tool_doc)
    print(f"  ✅ {tool['name']} ({tool['category']})")

print(f"\n🎉 Successfully loaded {len(sample_tools)} sample tools!")
print("🚀 Database is ready to use!")
