#!/usr/bin/env python3
"""
Migration Script: Convert Absolute Paths to Relative Paths

PROBLEM:
- Database menyimpan absolute paths (/app/backend/tools/...)
- Paths tidak portable - break di environment berbeda

SOLUTION:
- Convert absolute → relative paths
- Example: /app/backend/tools/devtools/abc.py → tools/devtools/abc.py

USAGE:
    python3 migrate_paths_to_relative.py
"""

from pathlib import Path
from database import SQLiteDB
from datetime import datetime

def migrate_paths():
    """Migrate all tools from absolute to relative paths"""
    
    print("=" * 60)
    print("🔄 PATH MIGRATION: Absolute → Relative")
    print("=" * 60)
    
    # Initialize database
    db = SQLiteDB()
    backend_dir = Path(__file__).parent
    
    # Get all tools
    tools = db.list_tools()
    
    if not tools:
        print("ℹ️  No tools found in database. Nothing to migrate.")
        return
    
    print(f"\n📦 Found {len(tools)} tool(s) to check\n")
    
    migrated_count = 0
    skipped_count = 0
    error_count = 0
    
    for tool in tools:
        tool_id = tool['_id']
        tool_name = tool['name']
        
        print(f"🔍 Checking: {tool_name} ({tool_id})")
        
        try:
            backend_path = tool['backend_path']
            frontend_path = tool['frontend_path']
            
            # Check if paths are already relative
            backend_is_absolute = Path(backend_path).is_absolute()
            frontend_is_absolute = Path(frontend_path).is_absolute()
            
            if not backend_is_absolute and not frontend_is_absolute:
                print(f"   ✓ Already using relative paths - SKIP")
                skipped_count += 1
                continue
            
            # Convert to relative paths
            updates = {}
            
            if backend_is_absolute:
                rel_backend = db.get_relative_path(backend_path)
                updates['backend_path'] = rel_backend
                print(f"   📝 Backend: {backend_path}")
                print(f"      → {rel_backend}")
            
            if frontend_is_absolute:
                rel_frontend = db.get_relative_path(frontend_path)
                updates['frontend_path'] = rel_frontend
                print(f"   📝 Frontend: {frontend_path}")
                print(f"      → {rel_frontend}")
            
            # Update database
            if updates:
                db.update_tool(tool_id, updates)
                print(f"   ✅ Migrated successfully!")
                migrated_count += 1
            
        except Exception as e:
            print(f"   ❌ Error: {str(e)}")
            error_count += 1
        
        print()
    
    # Summary
    print("=" * 60)
    print("📊 MIGRATION SUMMARY")
    print("=" * 60)
    print(f"✅ Migrated: {migrated_count}")
    print(f"⏭️  Skipped: {skipped_count}")
    print(f"❌ Errors: {error_count}")
    print(f"📦 Total: {len(tools)}")
    print("=" * 60)
    
    if migrated_count > 0:
        print("\n✅ Migration completed successfully!")
        print("   All paths are now portable and environment-agnostic.")
    elif skipped_count == len(tools):
        print("\n✓ All tools already using relative paths. No migration needed.")
    
    if error_count > 0:
        print(f"\n⚠️  Warning: {error_count} tool(s) had errors during migration.")
        print("   Please check the errors above and fix manually if needed.")

if __name__ == "__main__":
    try:
        migrate_paths()
    except KeyboardInterrupt:
        print("\n\n⚠️  Migration cancelled by user.")
    except Exception as e:
        print(f"\n\n❌ Migration failed: {str(e)}")
        import traceback
        traceback.print_exc()
