"""
Migration: Add position columns to rag_workflow_nodes table
Version: Phase 6.1
Date: January 2025

Adds:
- position_x (REAL) - X coordinate on canvas
- position_y (REAL) - Y coordinate on canvas  
- width (REAL) - Node width in pixels
- height (REAL) - Node height in pixels
"""

import sqlite3
import os
from pathlib import Path

def run_migration():
    """Run the migration to add position columns"""
    
    # Get database path
    backend_dir = Path(__file__).parent.parent
    db_path = backend_dir / "data" / "chimera_workflow.db"
    
    if not db_path.exists():
        print(f"❌ Database not found at: {db_path}")
        return False
    
    print(f"🔧 Running migration on: {db_path}")
    
    try:
        conn = sqlite3.connect(str(db_path))
        cursor = conn.cursor()
        
        # Check if columns already exist
        cursor.execute("PRAGMA table_info(rag_workflow_nodes)")
        columns = [col[1] for col in cursor.fetchall()]
        
        if 'position_x' in columns:
            print("⚠️  Migration already applied! Columns exist.")
            conn.close()
            return True
        
        # Add position columns
        print("📊 Adding position_x column...")
        cursor.execute("""
            ALTER TABLE rag_workflow_nodes 
            ADD COLUMN position_x REAL DEFAULT 0
        """)
        
        print("📊 Adding position_y column...")
        cursor.execute("""
            ALTER TABLE rag_workflow_nodes 
            ADD COLUMN position_y REAL DEFAULT 0
        """)
        
        print("📊 Adding width column...")
        cursor.execute("""
            ALTER TABLE rag_workflow_nodes 
            ADD COLUMN width REAL DEFAULT 200
        """)
        
        print("📊 Adding height column...")
        cursor.execute("""
            ALTER TABLE rag_workflow_nodes 
            ADD COLUMN height REAL DEFAULT 80
        """)
        
        # Set default positions for existing nodes (vertical layout)
        # Flash Mode
        print("📐 Setting default positions for Flash workflow...")
        cursor.execute("""
            UPDATE rag_workflow_nodes 
            SET position_x = 400, position_y = 50, width = 200, height = 80
            WHERE id = 'node_flash_input'
        """)
        cursor.execute("""
            UPDATE rag_workflow_nodes 
            SET position_x = 400, position_y = 180, width = 200, height = 80
            WHERE id = 'node_flash_router'
        """)
        cursor.execute("""
            UPDATE rag_workflow_nodes 
            SET position_x = 400, position_y = 310, width = 200, height = 80
            WHERE id = 'node_flash_rag'
        """)
        cursor.execute("""
            UPDATE rag_workflow_nodes 
            SET position_x = 400, position_y = 440, width = 200, height = 80
            WHERE id = 'node_flash_llm'
        """)
        cursor.execute("""
            UPDATE rag_workflow_nodes 
            SET position_x = 400, position_y = 570, width = 200, height = 80
            WHERE id = 'node_flash_output'
        """)
        
        # Pro Mode
        print("📐 Setting default positions for Pro workflow...")
        cursor.execute("""
            UPDATE rag_workflow_nodes 
            SET position_x = 400, position_y = 50, width = 200, height = 80
            WHERE id = 'node_pro_input'
        """)
        cursor.execute("""
            UPDATE rag_workflow_nodes 
            SET position_x = 400, position_y = 180, width = 200, height = 80
            WHERE id = 'node_pro_router'
        """)
        cursor.execute("""
            UPDATE rag_workflow_nodes 
            SET position_x = 400, position_y = 310, width = 200, height = 80
            WHERE id = 'node_pro_rag'
        """)
        cursor.execute("""
            UPDATE rag_workflow_nodes 
            SET position_x = 400, position_y = 440, width = 200, height = 80
            WHERE id = 'node_pro_llm'
        """)
        cursor.execute("""
            UPDATE rag_workflow_nodes 
            SET position_x = 400, position_y = 570, width = 200, height = 80
            WHERE id = 'node_pro_output'
        """)
        
        # Code RAG Mode
        print("📐 Setting default positions for Code RAG workflow...")
        cursor.execute("""
            UPDATE rag_workflow_nodes 
            SET position_x = 400, position_y = 50, width = 200, height = 80
            WHERE id = 'node_code_input'
        """)
        cursor.execute("""
            UPDATE rag_workflow_nodes 
            SET position_x = 400, position_y = 180, width = 200, height = 80
            WHERE id = 'node_code_router'
        """)
        cursor.execute("""
            UPDATE rag_workflow_nodes 
            SET position_x = 400, position_y = 310, width = 200, height = 80
            WHERE id = 'node_code_rag'
        """)
        cursor.execute("""
            UPDATE rag_workflow_nodes 
            SET position_x = 400, position_y = 440, width = 200, height = 80
            WHERE id = 'node_code_llm'
        """)
        cursor.execute("""
            UPDATE rag_workflow_nodes 
            SET position_x = 400, position_y = 570, width = 200, height = 80
            WHERE id = 'node_code_output'
        """)
        
        conn.commit()
        conn.close()
        
        print("✅ Migration completed successfully!")
        print("📊 Schema updated:")
        print("   - position_x (REAL, default: 0)")
        print("   - position_y (REAL, default: 0)")
        print("   - width (REAL, default: 200)")
        print("   - height (REAL, default: 80)")
        print("📐 Default positions set for all workflows (vertical layout)")
        
        return True
        
    except Exception as e:
        print(f"❌ Migration failed: {e}")
        if conn:
            conn.rollback()
            conn.close()
        return False

if __name__ == "__main__":
    print("="*60)
    print("RAG Studio Phase 6.1 - Database Migration")
    print("="*60)
    success = run_migration()
    print("="*60)
    exit(0 if success else 1)
