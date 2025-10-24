import sqlite3
import json
import os
from pathlib import Path
from datetime import datetime
from typing import Optional, List, Dict, Any
from contextlib import contextmanager

class WorkflowDB:
    """SQLite Database Manager for RAG Studio Workflows"""
    
    def __init__(self, db_path: Optional[str] = None):
        # Use relative path from current file location
        if db_path is None:
            backend_dir = Path(__file__).parent
            data_dir = backend_dir / "data"
            data_dir.mkdir(exist_ok=True)
            db_path = str(data_dir / "chimera_workflow.db")
        
        self.db_path = db_path
        self.backend_dir = Path(__file__).parent
        self._init_db()
    
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
        """Initialize database tables and seed default workflows"""
        with self.get_connection() as conn:
            cursor = conn.cursor()
            
            # 1. RAG Workflows Table
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS rag_workflows (
                    id TEXT PRIMARY KEY,
                    mode TEXT NOT NULL,
                    name TEXT NOT NULL,
                    description TEXT,
                    version INTEGER DEFAULT 1,
                    is_active INTEGER DEFAULT 1,
                    created_at TEXT NOT NULL,
                    updated_at TEXT NOT NULL
                )
            """)
            
            # 2. Workflow Nodes Table
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS rag_workflow_nodes (
                    id TEXT PRIMARY KEY,
                    workflow_id TEXT NOT NULL,
                    node_type TEXT NOT NULL,
                    node_name TEXT NOT NULL,
                    position INTEGER NOT NULL,
                    config TEXT,
                    is_enabled INTEGER DEFAULT 1,
                    created_at TEXT NOT NULL,
                    FOREIGN KEY (workflow_id) REFERENCES rag_workflows(id) ON DELETE CASCADE
                )
            """)
            
            # 3. Workflow Connections Table
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS rag_workflow_connections (
                    id TEXT PRIMARY KEY,
                    workflow_id TEXT NOT NULL,
                    from_node_id TEXT NOT NULL,
                    to_node_id TEXT NOT NULL,
                    condition TEXT,
                    created_at TEXT NOT NULL,
                    FOREIGN KEY (workflow_id) REFERENCES rag_workflows(id) ON DELETE CASCADE,
                    FOREIGN KEY (from_node_id) REFERENCES rag_workflow_nodes(id) ON DELETE CASCADE,
                    FOREIGN KEY (to_node_id) REFERENCES rag_workflow_nodes(id) ON DELETE CASCADE
                )
            """)
            
            # 4. Workflow Test Results Table
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS rag_workflow_test_results (
                    id TEXT PRIMARY KEY,
                    workflow_id TEXT NOT NULL,
                    test_input TEXT NOT NULL,
                    execution_path TEXT,
                    node_outputs TEXT,
                    final_output TEXT,
                    processing_time REAL,
                    status TEXT,
                    error_message TEXT,
                    created_at TEXT NOT NULL,
                    FOREIGN KEY (workflow_id) REFERENCES rag_workflows(id) ON DELETE CASCADE
                )
            """)
            
            # Create indexes for performance
            cursor.execute("CREATE INDEX IF NOT EXISTS idx_workflows_mode ON rag_workflows(mode)")
            cursor.execute("CREATE INDEX IF NOT EXISTS idx_workflows_active ON rag_workflows(is_active)")
            cursor.execute("CREATE INDEX IF NOT EXISTS idx_nodes_workflow ON rag_workflow_nodes(workflow_id)")
            cursor.execute("CREATE INDEX IF NOT EXISTS idx_nodes_position ON rag_workflow_nodes(position)")
            cursor.execute("CREATE INDEX IF NOT EXISTS idx_connections_workflow ON rag_workflow_connections(workflow_id)")
            cursor.execute("CREATE INDEX IF NOT EXISTS idx_test_results_workflow ON rag_workflow_test_results(workflow_id)")
            cursor.execute("CREATE INDEX IF NOT EXISTS idx_test_results_created ON rag_workflow_test_results(created_at)")
            
            # Seed default workflows if table is empty
            cursor.execute("SELECT COUNT(*) FROM rag_workflows")
            count = cursor.fetchone()[0]
            if count == 0:
                self._seed_default_workflows(cursor)
    
    def _seed_default_workflows(self, cursor):
        """Seed default workflows for Flash, Pro, and Code RAG modes"""
        now = datetime.now().isoformat()
        
        # ============================================
        # FLASH MODE WORKFLOW
        # ============================================
        flash_workflow_id = 'wf_flash_v1'
        cursor.execute("""
            INSERT INTO rag_workflows (id, mode, name, description, version, is_active, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """, (flash_workflow_id, 'flash', 'Flash Mode Default', 'Fast response workflow', 1, 1, now, now))
        
        # Flash nodes
        flash_nodes = [
            ('node_flash_input', flash_workflow_id, 'input', 'User Input', 0, json.dumps({'max_length': 1000}), 1, now),
            ('node_flash_router', flash_workflow_id, 'router', 'Intent Router', 1, json.dumps({'use_simple_routing': True}), 1, now),
            ('node_flash_rag', flash_workflow_id, 'rag_retriever', 'Chimepaedia Search', 2, json.dumps({'max_results': 3, 'source': 'chimepaedia'}), 1, now),
            ('node_flash_llm', flash_workflow_id, 'llm', 'LLM Generator', 3, json.dumps({'model': 'fast', 'temperature': 0.7}), 1, now),
            ('node_flash_output', flash_workflow_id, 'output', 'Response Output', 4, json.dumps({'format': 'text'}), 1, now),
        ]
        cursor.executemany("""
            INSERT INTO rag_workflow_nodes (id, workflow_id, node_type, node_name, position, config, is_enabled, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """, flash_nodes)
        
        # Flash connections
        flash_connections = [
            ('conn_flash_1', flash_workflow_id, 'node_flash_input', 'node_flash_router', None, now),
            ('conn_flash_2', flash_workflow_id, 'node_flash_router', 'node_flash_rag', None, now),
            ('conn_flash_3', flash_workflow_id, 'node_flash_rag', 'node_flash_llm', None, now),
            ('conn_flash_4', flash_workflow_id, 'node_flash_llm', 'node_flash_output', None, now),
        ]
        cursor.executemany("""
            INSERT INTO rag_workflow_connections (id, workflow_id, from_node_id, to_node_id, condition, created_at)
            VALUES (?, ?, ?, ?, ?, ?)
        """, flash_connections)
        
        # ============================================
        # PRO MODE WORKFLOW
        # ============================================
        pro_workflow_id = 'wf_pro_v1'
        cursor.execute("""
            INSERT INTO rag_workflows (id, mode, name, description, version, is_active, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """, (pro_workflow_id, 'pro', 'Pro Mode Default', 'Deep analysis workflow', 1, 1, now, now))
        
        # Pro nodes
        pro_nodes = [
            ('node_pro_input', pro_workflow_id, 'input', 'User Input', 0, json.dumps({'max_length': 2000}), 1, now),
            ('node_pro_router', pro_workflow_id, 'router', 'Intent Router', 1, json.dumps({'use_advanced_routing': True}), 1, now),
            ('node_pro_rag', pro_workflow_id, 'rag_retriever', 'Deep Search', 2, json.dumps({'max_results': 5, 'source': 'chimepaedia'}), 1, now),
            ('node_pro_llm', pro_workflow_id, 'llm', 'Advanced LLM', 3, json.dumps({'model': 'advanced', 'temperature': 0.8}), 1, now),
            ('node_pro_output', pro_workflow_id, 'output', 'Detailed Output', 4, json.dumps({'format': 'detailed'}), 1, now),
        ]
        cursor.executemany("""
            INSERT INTO rag_workflow_nodes (id, workflow_id, node_type, node_name, position, config, is_enabled, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """, pro_nodes)
        
        # Pro connections
        pro_connections = [
            ('conn_pro_1', pro_workflow_id, 'node_pro_input', 'node_pro_router', None, now),
            ('conn_pro_2', pro_workflow_id, 'node_pro_router', 'node_pro_rag', None, now),
            ('conn_pro_3', pro_workflow_id, 'node_pro_rag', 'node_pro_llm', None, now),
            ('conn_pro_4', pro_workflow_id, 'node_pro_llm', 'node_pro_output', None, now),
        ]
        cursor.executemany("""
            INSERT INTO rag_workflow_connections (id, workflow_id, from_node_id, to_node_id, condition, created_at)
            VALUES (?, ?, ?, ?, ?, ?)
        """, pro_connections)
        
        # ============================================
        # CODE RAG MODE WORKFLOW
        # ============================================
        code_workflow_id = 'wf_code_v1'
        cursor.execute("""
            INSERT INTO rag_workflows (id, mode, name, description, version, is_active, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """, (code_workflow_id, 'code_rag', 'Code RAG Default', 'Code-focused workflow', 1, 1, now, now))
        
        # Code RAG nodes
        code_nodes = [
            ('node_code_input', code_workflow_id, 'input', 'Code Input', 0, json.dumps({'max_length': 5000}), 1, now),
            ('node_code_router', code_workflow_id, 'router', 'Code Router', 1, json.dumps({'use_code_routing': True}), 1, now),
            ('node_code_rag', code_workflow_id, 'rag_retriever', 'Code Search', 2, json.dumps({'max_results': 10, 'source': 'code_docs'}), 1, now),
            ('node_code_llm', code_workflow_id, 'llm', 'Code LLM', 3, json.dumps({'model': 'code_specialized', 'temperature': 0.5}), 1, now),
            ('node_code_output', code_workflow_id, 'output', 'Code Output', 4, json.dumps({'format': 'code'}), 1, now),
        ]
        cursor.executemany("""
            INSERT INTO rag_workflow_nodes (id, workflow_id, node_type, node_name, position, config, is_enabled, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """, code_nodes)
        
        # Code RAG connections
        code_connections = [
            ('conn_code_1', code_workflow_id, 'node_code_input', 'node_code_router', None, now),
            ('conn_code_2', code_workflow_id, 'node_code_router', 'node_code_rag', None, now),
            ('conn_code_3', code_workflow_id, 'node_code_rag', 'node_code_llm', None, now),
            ('conn_code_4', code_workflow_id, 'node_code_llm', 'node_code_output', None, now),
        ]
        cursor.executemany("""
            INSERT INTO rag_workflow_connections (id, workflow_id, from_node_id, to_node_id, condition, created_at)
            VALUES (?, ?, ?, ?, ?, ?)
        """, code_connections)
    
    # ============================================
    # WORKFLOW METHODS
    # ============================================
    
    def insert_workflow(self, workflow_data: Dict[str, Any]) -> str:
        """Insert a new workflow"""
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                INSERT INTO rag_workflows (
                    id, mode, name, description, version, is_active, created_at, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                workflow_data['id'],
                workflow_data['mode'],
                workflow_data['name'],
                workflow_data.get('description', ''),
                workflow_data.get('version', 1),
                workflow_data.get('is_active', 1),
                workflow_data['created_at'],
                workflow_data['updated_at']
            ))
            return workflow_data['id']
    
    def get_workflows(self, mode: Optional[str] = None) -> List[Dict[str, Any]]:
        """Get all workflows, optionally filtered by mode"""
        with self.get_connection() as conn:
            cursor = conn.cursor()
            
            if mode:
                cursor.execute("""
                    SELECT * FROM rag_workflows 
                    WHERE mode = ?
                    ORDER BY created_at DESC
                """, (mode,))
            else:
                cursor.execute("""
                    SELECT * FROM rag_workflows 
                    ORDER BY mode ASC, created_at DESC
                """)
            
            rows = cursor.fetchall()
            return [dict(row) for row in rows]
    
    def get_workflow(self, workflow_id: str) -> Optional[Dict[str, Any]]:
        """Get a specific workflow by ID"""
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM rag_workflows WHERE id = ?", (workflow_id,))
            row = cursor.fetchone()
            return dict(row) if row else None
    
    def get_workflow_with_nodes(self, workflow_id: str) -> Optional[Dict[str, Any]]:
        """Get workflow with all its nodes and connections"""
        workflow = self.get_workflow(workflow_id)
        if not workflow:
            return None
        
        workflow['nodes'] = self.get_workflow_nodes(workflow_id)
        workflow['connections'] = self.get_workflow_connections(workflow_id)
        return workflow
    
    def update_workflow(self, workflow_id: str, updates: Dict[str, Any]) -> bool:
        """Update a workflow"""
        with self.get_connection() as conn:
            cursor = conn.cursor()
            
            # Add updated_at
            updates['updated_at'] = datetime.now().isoformat()
            
            # Build UPDATE query dynamically
            set_clause = ", ".join([f"{k} = ?" for k in updates.keys()])
            values = list(updates.values()) + [workflow_id]
            
            cursor.execute(f"""
                UPDATE rag_workflows 
                SET {set_clause}
                WHERE id = ?
            """, values)
            
            return cursor.rowcount > 0
    
    def delete_workflow(self, workflow_id: str) -> bool:
        """Delete a workflow (cascades to nodes and connections)"""
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("DELETE FROM rag_workflows WHERE id = ?", (workflow_id,))
            return cursor.rowcount > 0
    
    # ============================================
    # NODE METHODS
    # ============================================
    
    def insert_node(self, node_data: Dict[str, Any]) -> str:
        """Insert a new node"""
        with self.get_connection() as conn:
            cursor = conn.cursor()
            
            # Convert config to JSON if it's a dict
            config = node_data.get('config')
            if isinstance(config, dict):
                config = json.dumps(config)
            
            cursor.execute("""
                INSERT INTO rag_workflow_nodes (
                    id, workflow_id, node_type, node_name, position, config, is_enabled, created_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                node_data['id'],
                node_data['workflow_id'],
                node_data['node_type'],
                node_data['node_name'],
                node_data['position'],
                config,
                node_data.get('is_enabled', 1),
                node_data['created_at']
            ))
            return node_data['id']
    
    def get_workflow_nodes(self, workflow_id: str) -> List[Dict[str, Any]]:
        """Get all nodes for a workflow, ordered by position"""
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                SELECT * FROM rag_workflow_nodes 
                WHERE workflow_id = ? 
                ORDER BY position ASC
            """, (workflow_id,))
            
            rows = cursor.fetchall()
            nodes = []
            for row in rows:
                node = dict(row)
                # Parse config JSON
                if node.get('config'):
                    try:
                        node['config'] = json.loads(node['config'])
                    except:
                        node['config'] = {}
                nodes.append(node)
            return nodes
    
    def get_node(self, node_id: str) -> Optional[Dict[str, Any]]:
        """Get a specific node by ID"""
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM rag_workflow_nodes WHERE id = ?", (node_id,))
            row = cursor.fetchone()
            if row:
                node = dict(row)
                # Parse config JSON
                if node.get('config'):
                    try:
                        node['config'] = json.loads(node['config'])
                    except:
                        node['config'] = {}
                return node
            return None
    
    def update_node(self, node_id: str, updates: Dict[str, Any]) -> bool:
        """Update a node"""
        with self.get_connection() as conn:
            cursor = conn.cursor()
            
            # Convert config to JSON if present
            if 'config' in updates and isinstance(updates['config'], dict):
                updates['config'] = json.dumps(updates['config'])
            
            # Build UPDATE query dynamically
            set_clause = ", ".join([f"{k} = ?" for k in updates.keys()])
            values = list(updates.values()) + [node_id]
            
            cursor.execute(f"""
                UPDATE rag_workflow_nodes 
                SET {set_clause}
                WHERE id = ?
            """, values)
            
            return cursor.rowcount > 0
    
    def delete_node(self, node_id: str) -> bool:
        """Delete a node (cascades to connections)"""
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("DELETE FROM rag_workflow_nodes WHERE id = ?", (node_id,))
            return cursor.rowcount > 0
    
    def update_node_position(self, node_id: str, position_x: float, position_y: float, width: float = None, height: float = None) -> bool:
        """Update node position on canvas"""
        with self.get_connection() as conn:
            cursor = conn.cursor()
            
            if width is not None and height is not None:
                cursor.execute("""
                    UPDATE rag_workflow_nodes 
                    SET position_x = ?, position_y = ?, width = ?, height = ?
                    WHERE id = ?
                """, (position_x, position_y, width, height, node_id))
            else:
                cursor.execute("""
                    UPDATE rag_workflow_nodes 
                    SET position_x = ?, position_y = ?
                    WHERE id = ?
                """, (position_x, position_y, node_id))
            
            return cursor.rowcount > 0
    
    def batch_update_positions(self, updates: List[Dict[str, Any]]) -> int:
        """Batch update multiple node positions for performance"""
        with self.get_connection() as conn:
            cursor = conn.cursor()
            updated_count = 0
            
            for update in updates:
                node_id = update.get('node_id')
                position_x = update.get('position_x')
                position_y = update.get('position_y')
                width = update.get('width')
                height = update.get('height')
                
                if node_id and position_x is not None and position_y is not None:
                    if width is not None and height is not None:
                        cursor.execute("""
                            UPDATE rag_workflow_nodes 
                            SET position_x = ?, position_y = ?, width = ?, height = ?
                            WHERE id = ?
                        """, (position_x, position_y, width, height, node_id))
                    else:
                        cursor.execute("""
                            UPDATE rag_workflow_nodes 
                            SET position_x = ?, position_y = ?
                            WHERE id = ?
                        """, (position_x, position_y, node_id))
                    
                    if cursor.rowcount > 0:
                        updated_count += 1
            
            return updated_count
    
    # ============================================
    # CONNECTION METHODS
    # ============================================
    
    def insert_connection(self, connection_data: Dict[str, Any]) -> str:
        """Insert a new connection"""
        with self.get_connection() as conn:
            cursor = conn.cursor()
            
            # Convert condition to JSON if it's a dict
            condition = connection_data.get('condition')
            if isinstance(condition, dict):
                condition = json.dumps(condition)
            
            cursor.execute("""
                INSERT INTO rag_workflow_connections (
                    id, workflow_id, from_node_id, to_node_id, condition, created_at
                ) VALUES (?, ?, ?, ?, ?, ?)
            """, (
                connection_data['id'],
                connection_data['workflow_id'],
                connection_data['from_node_id'],
                connection_data['to_node_id'],
                condition,
                connection_data['created_at']
            ))
            return connection_data['id']
    
    def get_workflow_connections(self, workflow_id: str) -> List[Dict[str, Any]]:
        """Get all connections for a workflow"""
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                SELECT * FROM rag_workflow_connections 
                WHERE workflow_id = ?
                ORDER BY created_at ASC
            """, (workflow_id,))
            
            rows = cursor.fetchall()
            connections = []
            for row in rows:
                conn_data = dict(row)
                # Parse condition JSON
                if conn_data.get('condition'):
                    try:
                        conn_data['condition'] = json.loads(conn_data['condition'])
                    except:
                        conn_data['condition'] = None
                connections.append(conn_data)
            return connections
    
    def delete_connection(self, connection_id: str) -> bool:
        """Delete a connection"""
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("DELETE FROM rag_workflow_connections WHERE id = ?", (connection_id,))
            return cursor.rowcount > 0
    
    # ============================================
    # TEST RESULTS METHODS
    # ============================================
    
    def insert_test_result(self, test_data: Dict[str, Any]) -> str:
        """Insert a new test result"""
        with self.get_connection() as conn:
            cursor = conn.cursor()
            
            # Convert complex fields to JSON
            execution_path = test_data.get('execution_path')
            if isinstance(execution_path, (list, dict)):
                execution_path = json.dumps(execution_path)
            
            node_outputs = test_data.get('node_outputs')
            if isinstance(node_outputs, (list, dict)):
                node_outputs = json.dumps(node_outputs)
            
            final_output = test_data.get('final_output')
            if isinstance(final_output, dict):
                final_output = json.dumps(final_output)
            
            cursor.execute("""
                INSERT INTO rag_workflow_test_results (
                    id, workflow_id, test_input, execution_path, node_outputs,
                    final_output, processing_time, status, error_message, created_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                test_data['id'],
                test_data['workflow_id'],
                test_data['test_input'],
                execution_path,
                node_outputs,
                final_output,
                test_data.get('processing_time', 0.0),
                test_data.get('status', 'success'),
                test_data.get('error_message'),
                test_data['created_at']
            ))
            return test_data['id']
    
    def get_test_results(self, workflow_id: str, limit: int = 50) -> List[Dict[str, Any]]:
        """Get test results for a workflow"""
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                SELECT * FROM rag_workflow_test_results 
                WHERE workflow_id = ? 
                ORDER BY created_at DESC 
                LIMIT ?
            """, (workflow_id, limit))
            
            rows = cursor.fetchall()
            results = []
            for row in rows:
                result = dict(row)
                # Parse JSON fields
                for field in ['execution_path', 'node_outputs', 'final_output']:
                    if result.get(field):
                        try:
                            result[field] = json.loads(result[field])
                        except:
                            pass
                results.append(result)
            return results
    
    def get_test_result(self, result_id: str) -> Optional[Dict[str, Any]]:
        """Get a specific test result by ID"""
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM rag_workflow_test_results WHERE id = ?", (result_id,))
            row = cursor.fetchone()
            if row:
                result = dict(row)
                # Parse JSON fields
                for field in ['execution_path', 'node_outputs', 'final_output']:
                    if result.get(field):
                        try:
                            result[field] = json.loads(result[field])
                        except:
                            pass
                return result
            return None
