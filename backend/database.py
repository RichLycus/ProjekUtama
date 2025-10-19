import sqlite3
import json
import os
from pathlib import Path
from datetime import datetime
from typing import Optional, List, Dict, Any
from contextlib import contextmanager

class SQLiteDB:
    """SQLite Database Manager for ChimeraAI Tools"""
    
    def __init__(self, db_path: Optional[str] = None):
        # Use relative path from current file location
        if db_path is None:
            backend_dir = Path(__file__).parent
            data_dir = backend_dir / "data"
            data_dir.mkdir(exist_ok=True)
            db_path = str(data_dir / "chimera_tools.db")
        
        self.db_path = db_path
        self.backend_dir = Path(__file__).parent
        self._init_db()
    
    def get_relative_path(self, absolute_path: str) -> str:
        """
        Convert absolute path to relative path from backend directory.
        Example: /app/backend/tools/devtools/abc.py -> tools/devtools/abc.py
        """
        try:
            abs_path = Path(absolute_path)
            rel_path = abs_path.relative_to(self.backend_dir)
            return str(rel_path)
        except ValueError:
            # If path is not under backend_dir, return as-is
            # (might already be relative)
            return str(absolute_path)
    
    def get_absolute_path(self, relative_path: str) -> str:
        """
        Convert relative path to absolute path.
        Example: tools/devtools/abc.py -> /full/path/to/backend/tools/devtools/abc.py
        """
        # If already absolute, return as-is
        path_obj = Path(relative_path)
        if path_obj.is_absolute():
            return str(path_obj)
        
        # Construct absolute path from backend_dir
        abs_path = self.backend_dir / relative_path
        return str(abs_path)
    
    @contextmanager
    def get_connection(self):
        """Context manager for database connections"""
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row  # Enable column access by name
        try:
            yield conn
            conn.commit()
        except Exception as e:
            conn.rollback()
            raise e
        finally:
            conn.close()
    
    def _init_db(self):
        """Initialize database tables"""
        with self.get_connection() as conn:
            cursor = conn.cursor()
            
            # Tools table
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS tools (
                    id TEXT PRIMARY KEY,
                    name TEXT NOT NULL,
                    description TEXT,
                    category TEXT NOT NULL,
                    tool_type TEXT DEFAULT 'dual',
                    version TEXT DEFAULT '1.0.0',
                    author TEXT DEFAULT 'Anonymous',
                    backend_path TEXT NOT NULL,
                    frontend_path TEXT NOT NULL,
                    dependencies TEXT,
                    status TEXT DEFAULT 'disabled',
                    last_validated TEXT,
                    created_at TEXT NOT NULL,
                    updated_at TEXT NOT NULL
                )
            """)
            
            # Tool logs table
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS tool_logs (
                    id TEXT PRIMARY KEY,
                    tool_id TEXT NOT NULL,
                    action TEXT NOT NULL,
                    status TEXT NOT NULL,
                    message TEXT,
                    trace TEXT,
                    timestamp TEXT NOT NULL,
                    FOREIGN KEY (tool_id) REFERENCES tools(id) ON DELETE CASCADE
                )
            """)
            
            # Create indexes for tools
            cursor.execute("CREATE INDEX IF NOT EXISTS idx_tools_category ON tools(category)")
            cursor.execute("CREATE INDEX IF NOT EXISTS idx_tools_status ON tools(status)")
            cursor.execute("CREATE INDEX IF NOT EXISTS idx_tools_type ON tools(tool_type)")
            cursor.execute("CREATE INDEX IF NOT EXISTS idx_logs_tool_id ON tool_logs(tool_id)")
            cursor.execute("CREATE INDEX IF NOT EXISTS idx_logs_timestamp ON tool_logs(timestamp)")
            
            # Chat conversations table
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS conversations (
                    id TEXT PRIMARY KEY,
                    title TEXT,
                    persona TEXT DEFAULT 'lycus',
                    created_at TEXT NOT NULL,
                    updated_at TEXT NOT NULL
                )
            """)
            
            # Chat messages table
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS messages (
                    id TEXT PRIMARY KEY,
                    conversation_id TEXT NOT NULL,
                    role TEXT NOT NULL,
                    content TEXT NOT NULL,
                    agent_tag TEXT,
                    execution_log TEXT,
                    timestamp TEXT NOT NULL,
                    FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE
                )
            """)
            
            # Create indexes for chat
            cursor.execute("CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id)")
            cursor.execute("CREATE INDEX IF NOT EXISTS idx_messages_timestamp ON messages(timestamp)")
            cursor.execute("CREATE INDEX IF NOT EXISTS idx_conversations_updated ON conversations(updated_at)")
    
    def reset_tools_table(self):
        """Drop and recreate tools table - USE WITH CAUTION"""
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("DROP TABLE IF EXISTS tools")
            cursor.execute("DROP TABLE IF EXISTS tool_logs")
            conn.commit()
        # Recreate tables
        self._init_db()
    
    def insert_tool(self, tool_data: Dict[str, Any]) -> str:
        """Insert a new tool"""
        with self.get_connection() as conn:
            cursor = conn.cursor()
            
            # Convert dependencies list to JSON string
            deps = json.dumps(tool_data.get('dependencies', []))
            
            cursor.execute("""
                INSERT INTO tools (
                    id, name, description, category, tool_type, version, author,
                    backend_path, frontend_path, dependencies, status, last_validated,
                    created_at, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                tool_data['_id'],
                tool_data['name'],
                tool_data['description'],
                tool_data['category'],
                tool_data.get('tool_type', 'dual'),
                tool_data['version'],
                tool_data['author'],
                tool_data['backend_path'],
                tool_data['frontend_path'],
                deps,
                tool_data['status'],
                tool_data['last_validated'],
                tool_data['created_at'],
                tool_data['updated_at']
            ))
            
            return tool_data['_id']
    
    def get_tool(self, tool_id: str) -> Optional[Dict[str, Any]]:
        """Get a tool by ID"""
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM tools WHERE id = ?", (tool_id,))
            row = cursor.fetchone()
            
            if row:
                tool_data = self._row_to_dict(row)
                # Convert relative paths to absolute paths at runtime
                if 'backend_path' in tool_data:
                    tool_data['backend_path'] = self.get_absolute_path(tool_data['backend_path'])
                if 'frontend_path' in tool_data:
                    tool_data['frontend_path'] = self.get_absolute_path(tool_data['frontend_path'])
                return tool_data
            return None
    
    def list_tools(self, filters: Optional[Dict[str, str]] = None) -> List[Dict[str, Any]]:
        """List all tools with optional filters"""
        with self.get_connection() as conn:
            cursor = conn.cursor()
            
            query = "SELECT * FROM tools WHERE 1=1"
            params = []
            
            if filters:
                if 'category' in filters:
                    query += " AND category = ?"
                    params.append(filters['category'])
                if 'status' in filters:
                    query += " AND status = ?"
                    params.append(filters['status'])
            
            query += " ORDER BY created_at DESC"
            
            cursor.execute(query, params)
            rows = cursor.fetchall()
            
            tools = []
            for row in rows:
                tool_data = self._row_to_dict(row)
                # Convert relative paths to absolute paths at runtime
                if 'backend_path' in tool_data:
                    tool_data['backend_path'] = self.get_absolute_path(tool_data['backend_path'])
                if 'frontend_path' in tool_data:
                    tool_data['frontend_path'] = self.get_absolute_path(tool_data['frontend_path'])
                tools.append(tool_data)
            
            return tools
    
    def update_tool(self, tool_id: str, updates: Dict[str, Any]) -> bool:
        """Update a tool"""
        with self.get_connection() as conn:
            cursor = conn.cursor()
            
            # Build dynamic update query
            set_clause = ", ".join([f"{key} = ?" for key in updates.keys()])
            query = f"UPDATE tools SET {set_clause}, updated_at = ? WHERE id = ?"
            
            params = list(updates.values())
            params.append(datetime.utcnow().isoformat())
            params.append(tool_id)
            
            cursor.execute(query, params)
            return cursor.rowcount > 0
    
    def delete_tool(self, tool_id: str) -> bool:
        """Delete a tool"""
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("DELETE FROM tools WHERE id = ?", (tool_id,))
            return cursor.rowcount > 0
    
    def insert_log(self, log_data: Dict[str, Any]) -> str:
        """Insert a tool log"""
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                INSERT INTO tool_logs (
                    id, tool_id, action, status, message, trace, timestamp
                ) VALUES (?, ?, ?, ?, ?, ?, ?)
            """, (
                log_data['_id'],
                log_data['tool_id'],
                log_data['action'],
                log_data['status'],
                log_data['message'],
                log_data['trace'],
                log_data['timestamp']
            ))
            
            return log_data['_id']
    
    def get_logs(self, tool_id: str, limit: int = 50) -> List[Dict[str, Any]]:
        """Get logs for a tool"""
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                SELECT * FROM tool_logs 
                WHERE tool_id = ? 
                ORDER BY timestamp DESC 
                LIMIT ?
            """, (tool_id, limit))
            
            rows = cursor.fetchall()
            return [self._row_to_dict(row) for row in rows]
    
    def _row_to_dict(self, row: sqlite3.Row) -> Dict[str, Any]:
        """Convert a Row object to a dictionary"""
        data = dict(row)
        
        # Rename 'id' to '_id' for consistency with MongoDB
        if 'id' in data:
            data['_id'] = data.pop('id')
        
        # Parse dependencies JSON
        if 'dependencies' in data and data['dependencies']:
            data['dependencies'] = json.loads(data['dependencies'])
        
        return data

    # ============================================
    # CHAT METHODS
    # ============================================
    
    def insert_conversation(self, conversation_data: Dict[str, Any]) -> str:
        """Insert a new conversation"""
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                INSERT INTO conversations (
                    id, title, persona, created_at, updated_at
                ) VALUES (?, ?, ?, ?, ?)
            """, (
                conversation_data['id'],
                conversation_data.get('title', 'New Conversation'),
                conversation_data.get('persona', 'lycus'),
                conversation_data['created_at'],
                conversation_data['updated_at']
            ))
            return conversation_data['id']
    
    def get_conversations(self, limit: int = 50) -> List[Dict[str, Any]]:
        """Get all conversations"""
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                SELECT * FROM conversations 
                ORDER BY updated_at DESC 
                LIMIT ?
            """, (limit,))
            
            rows = cursor.fetchall()
            return [dict(row) for row in rows]
    
    def get_conversation(self, conversation_id: str) -> Optional[Dict[str, Any]]:
        """Get a specific conversation"""
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM conversations WHERE id = ?", (conversation_id,))
            row = cursor.fetchone()
            return dict(row) if row else None
    
    def update_conversation(self, conversation_id: str, updates: Dict[str, Any]) -> bool:
        """Update conversation (title, persona, updated_at)"""
        with self.get_connection() as conn:
            cursor = conn.cursor()
            
            set_clause = ", ".join([f"{key} = ?" for key in updates.keys()])
            values = list(updates.values()) + [conversation_id]
            
            cursor.execute(f"""
                UPDATE conversations 
                SET {set_clause}
                WHERE id = ?
            """, values)
            
            return cursor.rowcount > 0
    
    def delete_conversation(self, conversation_id: str) -> bool:
        """Delete a conversation (cascades to messages)"""
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("DELETE FROM conversations WHERE id = ?", (conversation_id,))
            return cursor.rowcount > 0
    
    def insert_message(self, message_data: Dict[str, Any]) -> str:
        """Insert a new message"""
        with self.get_connection() as conn:
            cursor = conn.cursor()
            
            # Convert execution_log to JSON if it's a dict
            exec_log = message_data.get('execution_log')
            if isinstance(exec_log, dict):
                exec_log = json.dumps(exec_log)
            
            cursor.execute("""
                INSERT INTO messages (
                    id, conversation_id, role, content, agent_tag, execution_log, timestamp
                ) VALUES (?, ?, ?, ?, ?, ?, ?)
            """, (
                message_data['id'],
                message_data['conversation_id'],
                message_data['role'],
                message_data['content'],
                message_data.get('agent_tag'),
                exec_log,
                message_data['timestamp']
            ))
            
            # Update conversation updated_at
            cursor.execute("""
                UPDATE conversations 
                SET updated_at = ? 
                WHERE id = ?
            """, (message_data['timestamp'], message_data['conversation_id']))
            
            return message_data['id']
    
    def get_messages(self, conversation_id: str, limit: int = 100) -> List[Dict[str, Any]]:
        """Get messages for a conversation"""
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                SELECT * FROM messages 
                WHERE conversation_id = ? 
                ORDER BY timestamp ASC 
                LIMIT ?
            """, (conversation_id, limit))
            
            rows = cursor.fetchall()
            messages = []
            for row in rows:
                msg = dict(row)
                # Parse execution_log JSON
                if msg.get('execution_log'):
                    try:
                        msg['execution_log'] = json.loads(msg['execution_log'])
                    except:
                        pass
                messages.append(msg)
            return messages
    
    def delete_message(self, message_id: str) -> bool:
        """Delete a specific message"""
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("DELETE FROM messages WHERE id = ?", (message_id,))
            return cursor.rowcount > 0

