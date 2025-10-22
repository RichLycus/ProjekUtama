"""
Migration: Add chat mode and preferred language support
- Add 'mode' column to conversations table (flash/pro)
- Add 'preferred_language' column to personas table
- Add 'system_prompt' column to personas table
"""

import sqlite3
from pathlib import Path
from datetime import datetime

def run_migration():
    """Run the migration"""
    # Get database path
    backend_dir = Path(__file__).parent.parent
    data_dir = backend_dir / "data"
    db_path = str(data_dir / "chimera_tools.db")
    
    print(f"🔧 Running migration on: {db_path}")
    
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    try:
        # Check and add 'mode' column to conversations
        cursor.execute("PRAGMA table_info(conversations)")
        columns = [col[1] for col in cursor.fetchall()]
        
        if 'mode' not in columns:
            print("  ✅ Adding 'mode' column to conversations table...")
            cursor.execute("""
                ALTER TABLE conversations 
                ADD COLUMN mode TEXT DEFAULT 'flash'
            """)
            print("     Mode column added (default: 'flash')")
        else:
            print("  ⏭️  'mode' column already exists in conversations")
        
        # Check and add 'preferred_language' column to personas
        cursor.execute("PRAGMA table_info(personas)")
        persona_columns = [col[1] for col in cursor.fetchall()]
        
        if 'preferred_language' not in persona_columns:
            print("  ✅ Adding 'preferred_language' column to personas table...")
            cursor.execute("""
                ALTER TABLE personas 
                ADD COLUMN preferred_language TEXT DEFAULT 'id'
            """)
            print("     Preferred language column added (default: 'id' for Indonesian)")
        else:
            print("  ⏭️  'preferred_language' column already exists in personas")
        
        # Check and add 'system_prompt' column to personas
        if 'system_prompt' not in persona_columns:
            print("  ✅ Adding 'system_prompt' column to personas table...")
            cursor.execute("""
                ALTER TABLE personas 
                ADD COLUMN system_prompt TEXT
            """)
            print("     System prompt column added")
        else:
            print("  ⏭️  'system_prompt' column already exists in personas")
        
        # Update existing personas with default system prompts
        print("  ✅ Updating existing personas with default prompts...")
        
        # Default Indonesian persona prompt
        default_indonesian_prompt = """Anda adalah seorang Spesialis Penegakan Persona (Persona Enforcement Specialist). Tugas Anda adalah memproses final output dari Agent lain sebelum respons disampaikan kepada pengguna.

Instruksi Inti:

1. Analisis Input: Terima dan analisis teks masukan dari Agent sebelumnya (yang dianggap sebagai "draf jawaban").
2. Penyesuaian Persona: Tulis ulang atau format ulang seluruh konten masukan agar sepenuhnya konsisten dengan Persona Anda, termasuk nada, gaya bahasa, dan pilihan kata.
3. Adaptasi Bahasa: Jika masukan asli (draf) menggunakan Bahasa Inggris, pastikan terjemahan ke Bahasa Indonesia diterapkan dengan sempurna, sambil tetap menjaga akurasi fakta dan inti pesan. Jika masukan sudah dalam Bahasa Indonesia, pastikan tata bahasanya sempurna.
4. Keterlibatan Alami: Pastikan respons akhir terasa alami, menarik, dan sesuai konteks percakapan pengguna.

Output Anda harus menjadi respons akhir yang akan dibaca pengguna, dan HARUS mencerminkan Persona Anda secara ketat."""
        
        cursor.execute("""
            UPDATE personas 
            SET system_prompt = ?, 
                preferred_language = 'id',
                updated_at = ?
            WHERE system_prompt IS NULL OR system_prompt = ''
        """, (default_indonesian_prompt, datetime.now().isoformat()))
        
        updated_count = cursor.rowcount
        print(f"     Updated {updated_count} personas with default prompts")
        
        # Commit changes
        conn.commit()
        print("\n✅ Migration completed successfully!")
        
        return True
        
    except Exception as e:
        conn.rollback()
        print(f"\n❌ Migration failed: {e}")
        import traceback
        traceback.print_exc()
        return False
        
    finally:
        conn.close()


if __name__ == "__main__":
    print("=" * 60)
    print("  MIGRATION: Add chat mode and language support")
    print("=" * 60)
    print()
    
    success = run_migration()
    
    print()
    print("=" * 60)
    if success:
        print("  ✅ Migration completed!")
    else:
        print("  ❌ Migration failed!")
    print("=" * 60)
