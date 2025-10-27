"""
Reset Database and Load Sample Tools (V2 - Organized Structure)

This script will:
1. Reset the tools database
2. Scan sample_tools folder for organized structure
3. Auto-detect single vs dual tools
4. Upload all sample tools with proper categorization

New Structure:
sample_tools/
├── category/
│   └── tool-slug/
│       ├── backend/
│       │   └── main.py
│       └── frontend/  (optional for dual tools)
│           └── Component.tsx|html
"""

import sys
import os
from pathlib import Path
from datetime import datetime
import uuid
import shutil
import json

# Add backend to path
backend_dir = Path(__file__).parent
sys.path.insert(0, str(backend_dir))

from database import SQLiteDB

# Initialize database
data_dir = backend_dir / "data"
data_dir.mkdir(exist_ok=True)

db = SQLiteDB(str(data_dir / "chimera_tools.db"))

print("="*60)
print("🔄 RESETTING DATABASE...")
print("="*60)
db.reset_tools_table()
print("✅ Database reset complete!\n")

# Scan sample_tools directory
sample_tools_dir = backend_dir / "sample_tools"
tools_dir = backend_dir / "tools"
frontend_tools_dir = backend_dir / "frontend_tools"

# Create directories
tools_dir.mkdir(exist_ok=True)
frontend_tools_dir.mkdir(exist_ok=True)

print("="*60)
print("📦 SCANNING SAMPLE TOOLS...")
print("="*60)
print(f"Source: {sample_tools_dir}\n")

tools_found = []

# Scan categories
for category_dir in sorted(sample_tools_dir.iterdir()):
    if not category_dir.is_dir():
        continue
    
    category = category_dir.name
    print(f"📂 Category: {category}")
    
    # Scan tools in category
    for tool_dir in sorted(category_dir.iterdir()):
        if not tool_dir.is_dir():
            continue
        
        slug = tool_dir.name
        backend_dir_path = tool_dir / "backend"
        frontend_dir_path = tool_dir / "frontend"
        
        # Check backend exists
        if not backend_dir_path.exists():
            print(f"  ⚠️  Skipping {slug}: No backend/ folder")
            continue
        
        # Find backend main.py
        backend_file = backend_dir_path / "main.py"
        if not backend_file.exists():
            print(f"  ⚠️  Skipping {slug}: No main.py in backend/")
            continue
        
        # Detect tool type
        frontend_file = None
        tool_type = "single"
        
        if frontend_dir_path.exists():
            # Find frontend file (any .tsx, .jsx, .html)
            frontend_files = list(frontend_dir_path.glob("*.*"))
            frontend_files = [f for f in frontend_files if f.suffix in ['.tsx', '.jsx', '.html', '.js']]
            
            if frontend_files:
                frontend_file = frontend_files[0]
                tool_type = "dual"
        
        # Generate tool name from slug (Title Case)
        tool_name = ' '.join(word.capitalize() for word in slug.split('-'))
        
        tool_info = {
            'slug': slug,
            'name': tool_name,
            'category': category.capitalize(),
            'backend_file': backend_file,
            'frontend_file': frontend_file,
            'tool_type': tool_type
        }
        
        tools_found.append(tool_info)
        
        print(f"  ✅ {tool_name} ({tool_type})")

print(f"\n📊 Found {len(tools_found)} tools\n")

print("="*60)
print("🚀 LOADING TOOLS TO DATABASE...")
print("="*60)

loaded_count = 0
failed_count = 0

for tool in tools_found:
    try:
        tool_id = str(uuid.uuid4())
        slug = tool['slug']
        category = tool['category']
        
        print(f"\n📦 Processing: {tool['name']}")
        
        # Create category folders
        backend_category = tools_dir / category.lower()
        frontend_category = frontend_tools_dir / category.lower()
        backend_category.mkdir(exist_ok=True)
        frontend_category.mkdir(exist_ok=True)
        
        # Copy backend file
        backend_dest = backend_category / f"{tool_id}.py"
        shutil.copy2(tool['backend_file'], backend_dest)
        print(f"  📄 Backend: {backend_dest.relative_to(backend_dir)}")
        
        # Copy frontend file (if dual tool)
        frontend_dest = None
        if tool['frontend_file']:
            frontend_ext = tool['frontend_file'].suffix
            frontend_dest = frontend_category / f"{tool_id}{frontend_ext}"
            shutil.copy2(tool['frontend_file'], frontend_dest)
            print(f"  📄 Frontend: {frontend_dest.relative_to(backend_dir)}")
        
        # Extract description from backend file (if available)
        description = f"{tool['name']} tool"
        try:
            with open(tool['backend_file'], 'r') as f:
                content = f.read()
                # Look for # DESCRIPTION: comment
                import re
                desc_match = re.search(r'#\s*DESCRIPTION:\s*(.+)', content)
                if desc_match:
                    description = desc_match.group(1).strip()
        except:
            pass
        
        # Insert to database
        tool_doc = {
            "_id": tool_id,
            "name": tool['name'],
            "description": description,
            "category": category,
            "tool_type": tool['tool_type'],
            "version": "1.0.0",
            "author": "ChimeraAI Team",
            "backend_path": str(backend_dest),
            "frontend_path": str(frontend_dest) if frontend_dest else None,
            "dependencies": [],
            "status": "active",
            "last_validated": datetime.utcnow().isoformat(),
            "created_at": datetime.utcnow().isoformat(),
            "updated_at": datetime.utcnow().isoformat()
        }
        
        db.insert_tool(tool_doc)
        print(f"  ✅ Loaded to database (ID: {tool_id[:8]}...)")
        
        loaded_count += 1
        
    except Exception as e:
        print(f"  ❌ Failed: {str(e)}")
        failed_count += 1

print("\n" + "="*60)
print("📊 SUMMARY")
print("="*60)
print(f"✅ Successfully loaded: {loaded_count} tools")
print(f"❌ Failed: {failed_count} tools")
print(f"📁 Deployed to: {tools_dir}")
print("\n🎉 Database is ready to use!")
print("="*60)

# List tools by category
print("\n📋 LOADED TOOLS BY CATEGORY:")
print("="*60)

tools_list = db.list_tools()
by_category = {}
for tool in tools_list:
    cat = tool['category']
    if cat not in by_category:
        by_category[cat] = []
    by_category[cat].append(tool)

for category in sorted(by_category.keys()):
    print(f"\n📂 {category}:")
    for tool in by_category[category]:
        tool_type_icon = "🔗" if tool['tool_type'] == 'dual' else "⚙️"
        print(f"  {tool_type_icon} {tool['name']}")

print("\n" + "="*60)
