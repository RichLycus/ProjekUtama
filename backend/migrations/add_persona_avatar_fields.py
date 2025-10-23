"""
Migration: Add avatar_url and user_display_name to personas table
Version: 1.0.0
Date: 2025-01-XX

This migration adds:
- avatar_url: Path to persona's avatar image
- user_display_name: Name the persona uses to call the user
"""

import sqlite3
from pathlib import Path
from datetime import datetime

def run_migration():
    """Run the migration to add avatar fields to personas table"""
    
    # Get database path (relative to backend directory)
    backend_dir = Path(__file__).parent.parent
    db_path = backend_dir / "data" / "chimera_tools.db"
    
    if not db_path.exists():
        print(f"❌ Database not found at {db_path}")
        return False
    
    try:
        conn = sqlite3.connect(str(db_path))
        cursor = conn.cursor()
        
        # Check if columns already exist
        cursor.execute("PRAGMA table_info(personas)")
        columns = [col[1] for col in cursor.fetchall()]
        
        # Add avatar_url column if not exists
        if 'avatar_url' not in columns:
            print("➕ Adding avatar_url column to personas table...")
            cursor.execute("""
                ALTER TABLE personas 
                ADD COLUMN avatar_url TEXT DEFAULT NULL
            """)
            print("✅ avatar_url column added")
        else:
            print("ℹ️  avatar_url column already exists")
        
        # Add user_display_name column if not exists
        if 'user_display_name' not in columns:
            print("➕ Adding user_display_name column to personas table...")
            cursor.execute("""
                ALTER TABLE personas 
                ADD COLUMN user_display_name TEXT DEFAULT 'Friend'
            """)
            print("✅ user_display_name column added")
        else:
            print("ℹ️  user_display_name column already exists")
        
        # Update existing personas with sensible defaults
        if 'user_display_name' in columns:
            # Update Lycus persona to call user "Kawan"
            cursor.execute("""
                UPDATE personas 
                SET user_display_name = 'Kawan'
                WHERE name = 'Lycus' AND user_display_name = 'Friend'
            """)
            
            # Update Sarah persona to call user "Teman"
            cursor.execute("""
                UPDATE personas 
                SET user_display_name = 'Teman'
                WHERE name = 'Sarah' AND user_display_name = 'Friend'
            """)
            
            print("✅ Updated existing personas with default user display names")
        
        conn.commit()
        conn.close()
        
        print("\n🎉 Migration completed successfully!")
        print(f"📍 Database: {db_path}")
        
        return True
        
    except Exception as e:
        print(f"❌ Migration failed: {str(e)}")
        return False


if __name__ == "__main__":
    print("=" * 60)
    print("🔄 Running Migration: Add Persona Avatar Fields")
    print("=" * 60)
    run_migration()
