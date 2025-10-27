#!/usr/bin/env python3
"""
Fix Tool Paths Migration Script
================================
Converts hardcoded absolute paths in database to portable relative paths.

This script fixes the golden rule violation where tools have absolute paths
like /app/backend/... instead of relative paths like sample_tools/...
"""

import sqlite3
from pathlib import Path
import sys

def fix_paths():
    """Convert all absolute paths to relative paths"""
    
    # Get database path
    backend_dir = Path(__file__).parent
    data_dir = backend_dir / "data"
    db_path = data_dir / "chimera_tools.db"
    
    if not db_path.exists():
        print(f"❌ Database not found at: {db_path}")
        return False
    
    print("=" * 80)
    print("🔧 FIXING TOOL PATHS - Converting Absolute → Relative")
    print("=" * 80)
    print(f"📂 Database: {db_path}")
    print(f"📂 Backend Dir: {backend_dir}")
    print()
    
    # Connect to database
    conn = sqlite3.connect(str(db_path))
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    
    try:
        # Get all tools
        cursor.execute("SELECT id, name, backend_path, frontend_path FROM tools")
        tools = cursor.fetchall()
        
        if not tools:
            print("ℹ️  No tools found in database")
            return True
        
        print(f"📊 Found {len(tools)} tool(s) to check\n")
        
        updates = []
        for tool in tools:
            tool_id = tool['id']
            name = tool['name']
            backend_path = tool['backend_path']
            frontend_path = tool['frontend_path']
            
            print(f"🔍 Checking: {name}")
            print(f"   Current Backend: {backend_path}")
            print(f"   Current Frontend: {frontend_path}")
            
            # Convert backend path
            new_backend_path = convert_to_relative(backend_path, backend_dir)
            new_frontend_path = convert_to_relative(frontend_path, backend_dir) if frontend_path else None
            
            if new_backend_path != backend_path or new_frontend_path != frontend_path:
                print(f"   ✏️  New Backend: {new_backend_path}")
                print(f"   ✏️  New Frontend: {new_frontend_path}")
                
                # Verify files exist
                backend_file = backend_dir / new_backend_path
                frontend_file = backend_dir / new_frontend_path if new_frontend_path else None
                
                if not backend_file.exists():
                    print(f"   ⚠️  Backend file not found: {backend_file}")
                else:
                    print(f"   ✅ Backend file exists")
                
                if frontend_file and not frontend_file.exists():
                    print(f"   ⚠️  Frontend file not found: {frontend_file}")
                elif frontend_file:
                    print(f"   ✅ Frontend file exists")
                
                updates.append({
                    'id': tool_id,
                    'backend': new_backend_path,
                    'frontend': new_frontend_path
                })
            else:
                print(f"   ℹ️  Already using relative paths")
            
            print()
        
        if not updates:
            print("✅ All tools already have relative paths!")
            return True
        
        # Apply updates
        print("=" * 80)
        print(f"📝 Updating {len(updates)} tool(s)...")
        print("=" * 80)
        
        for update in updates:
            cursor.execute("""
                UPDATE tools 
                SET backend_path = ?, frontend_path = ?
                WHERE id = ?
            """, (update['backend'], update['frontend'], update['id']))
            print(f"✅ Updated: {update['id']}")
        
        conn.commit()
        print()
        print("=" * 80)
        print(f"✅ SUCCESS! Updated {len(updates)} tool(s)")
        print("=" * 80)
        print()
        print("📋 Next steps:")
        print("   1. Restart backend: sudo supervisorctl restart backend")
        print("   2. Check logs: tail -f /var/log/supervisor/backend.err.log")
        print()
        
        return True
        
    except Exception as e:
        conn.rollback()
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
        return False
    finally:
        conn.close()

def convert_to_relative(path_str: str, backend_dir: Path) -> str:
    """
    Convert absolute path to relative path.
    
    Examples:
        /app/backend/sample_tools/... → sample_tools/...
        /app/backend/frontend_tools/... → frontend_tools/...
        sample_tools/... → sample_tools/... (unchanged)
    """
    if not path_str:
        return path_str
    
    path = Path(path_str)
    
    # If already relative, return as-is
    if not path.is_absolute():
        return path_str
    
    # Try to make relative to backend_dir
    try:
        rel_path = path.relative_to(backend_dir)
        return str(rel_path)
    except ValueError:
        # Path is not under backend_dir
        # Try to extract meaningful part
        
        # Handle /app/backend/... → sample_tools/...
        if '/backend/' in path_str:
            parts = path_str.split('/backend/')
            if len(parts) > 1:
                return parts[-1]  # Get part after last '/backend/'
        
        # Fallback: return as-is (better than breaking)
        return path_str

if __name__ == "__main__":
    success = fix_paths()
    sys.exit(0 if success else 1)
