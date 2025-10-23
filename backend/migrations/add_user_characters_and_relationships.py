"""
Migration: Add user_characters and persona_user_relationships tables
Version: 1.0.0
Date: 2025-01-XX

This migration adds:
- user_characters table: Store user character profiles (name, bio, preferences)
- persona_user_relationships table: Link personas with user characters and define relationships
"""

import sqlite3
from pathlib import Path
from datetime import datetime
import json

def run_migration():
    """Run the migration to add user characters and relationships tables"""
    
    # Get database path (relative to backend directory)
    backend_dir = Path(__file__).parent.parent
    db_path = backend_dir / "data" / "chimera_tools.db"
    
    if not db_path.exists():
        print(f"❌ Database not found at {db_path}")
        return False
    
    try:
        conn = sqlite3.connect(str(db_path))
        cursor = conn.cursor()
        
        # Create user_characters table
        print("➕ Creating user_characters table...")
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS user_characters (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                bio TEXT,
                preferences TEXT,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL
            )
        """)
        print("✅ user_characters table created")
        
        # Create persona_user_relationships table
        print("➕ Creating persona_user_relationships table...")
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS persona_user_relationships (
                id TEXT PRIMARY KEY,
                persona_id TEXT NOT NULL,
                user_character_id TEXT NOT NULL,
                relationship_type TEXT NOT NULL,
                primary_nickname TEXT NOT NULL,
                alternate_nicknames TEXT,
                notes TEXT,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL,
                FOREIGN KEY (persona_id) REFERENCES personas(id) ON DELETE CASCADE,
                FOREIGN KEY (user_character_id) REFERENCES user_characters(id) ON DELETE CASCADE
            )
        """)
        print("✅ persona_user_relationships table created")
        
        # Create indexes
        print("➕ Creating indexes...")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_relationships_persona ON persona_user_relationships(persona_id)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_relationships_character ON persona_user_relationships(user_character_id)")
        print("✅ Indexes created")
        
        # Seed default user character (Lycus example)
        print("➕ Seeding default user character...")
        cursor.execute("SELECT COUNT(*) FROM user_characters")
        count = cursor.fetchone()[0]
        
        if count == 0:
            now = datetime.now().isoformat()
            default_character = {
                'id': 'char-lycus-default',
                'name': 'Lycus',
                'bio': 'Developer dan creator ChimeraAI',
                'preferences': json.dumps({
                    'hobi': ['coding', 'technology', 'AI'],
                    'kesukaan': {
                        'warna': 'purple',
                        'makanan': 'nasi goreng'
                    }
                }),
                'created_at': now,
                'updated_at': now
            }
            
            cursor.execute("""
                INSERT INTO user_characters (id, name, bio, preferences, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, ?)
            """, (
                default_character['id'],
                default_character['name'],
                default_character['bio'],
                default_character['preferences'],
                default_character['created_at'],
                default_character['updated_at']
            ))
            print(f"✅ Default character '{default_character['name']}' created")
        else:
            print("ℹ️  User characters already exist")
        
        conn.commit()
        conn.close()
        
        print("\n🎉 Migration completed successfully!")
        print(f"📍 Database: {db_path}")
        
        return True
        
    except Exception as e:
        print(f"❌ Migration failed: {str(e)}")
        import traceback
        traceback.print_exc()
        return False


if __name__ == "__main__":
    print("=" * 60)
    print("🔄 Running Migration: Add User Characters & Relationships")
    print("=" * 60)
    run_migration()
