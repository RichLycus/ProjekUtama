# 🎨 Handoff: RAG Studio - Visual Workflow Management System

**Created:** January 2025  
**Last Updated:** January 2025  
**Status:** 📝 Ready for Implementation  
**Priority:** HIGH  
**Estimated Effort:** 12-16 hours

---

## 📋 Executive Summary

RAG Studio adalah fitur baru di Settings yang memungkinkan user untuk:
- ✅ **Visualisasi workflow RAG** seperti n8n/Node-RED dengan node visual
- ✅ **Real-time testing** - Test workflow langsung dengan input text
- ✅ **Live data flow inspection** - Lihat data yang mengalir antar node
- ✅ **Multiple workflow modes** - Flash, Pro, Code RAG (future)
- ✅ **Database-driven** - Workflow disimpan di database, bukan hardcode script
- ✅ **Partial execution** - Test dari INPUT sampai node tertentu (contoh: sampai Router saja)

---

## 🎯 Problem Statement

### Current Issues:
1. ❌ RAG workflow saat ini **hardcoded di backend script**
2. ❌ Sulit untuk **test dan debug** alur RAG
3. ❌ Tidak ada **visualisasi** bagaimana data mengalir antar komponen
4. ❌ Harus **edit code** untuk ganti workflow atau test skenario berbeda
5. ❌ Tidak bisa lihat **output intermediate** (contoh: output Router sebelum ke RAG)

### Desired Solution:
1. ✅ Visual workflow builder seperti **n8n/i18n**
2. ✅ Lihat data flow **real-time** saat testing
3. ✅ Test **partial execution** (INPUT → Router saja, atau INPUT → Router → RAG saja)
4. ✅ **Database-driven** workflows untuk flexibility
5. ✅ Support **multiple modes** (Flash, Pro, Code RAG)
6. ✅ **Professional UI** untuk workflow management

---

## 🎨 UI/UX Design Specification

### 1. New Settings Tab: "RAG Studio"

**Location:** Settings sidebar, sebelah kiri "About"

```
Settings Sidebar:
├── Tools
├── Appearance  
├── AI Chat
├── Personas
├── Games
├── 🆕 RAG Studio ⭐ (NEW)
└── About
```

### 2. RAG Studio Main View

**When "RAG Studio" tab clicked:**

```
┌─────────────────────────────────────────────────────────────┐
│ ← Back to Settings                                          │
├─────────────────────────────────────────────────────────────┤
│                      RAG STUDIO                              │
├─────────────────────────────────────────────────────────────┤
│ Workflow Modes:                                             │
│  [⚡ Flash] [🧠 Pro] [💻 Code RAG] (tabs)                  │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Selected: ⚡ Flash Mode Workflow                           │
│                                                              │
│  ┌────────────────────────────────────────────────────┐    │
│  │                                                     │    │
│  │     [INPUT]                                        │    │
│  │        │                                           │    │
│  │        ├─► Click to test from INPUT                │    │
│  │        ↓                                           │    │
│  │     [ROUTER]                                       │    │
│  │        │                                           │    │
│  │        ├─► Click to test up to ROUTER              │    │
│  │        ↓                                           │    │
│  │     [RAG RETRIEVER]                               │    │
│  │        │                                           │    │
│  │        ├─► Click to test up to RAG                 │    │
│  │        ↓                                           │    │
│  │     [LLM PROCESSING]                              │    │
│  │        │                                           │    │
│  │        ├─► Click to test up to LLM                 │    │
│  │        ↓                                           │    │
│  │     [OUTPUT]                                       │    │
│  │                                                     │    │
│  └────────────────────────────────────────────────────┘    │
│                                                              │
│  [Edit Workflow] [Save Changes] [Reset to Default]         │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### 3. Interactive Node Testing

**When user clicks pada node atau panah:**

```
┌─────────────────────────────────────────────────────────────┐
│ ← Back to Workflow View                                     │
├─────────────────────────────────────────────────────────────┤
│  Testing: INPUT → ROUTER                                    │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Test Input:                                                │
│  ┌────────────────────────────────────────────────────┐    │
│  │ Type your test message here...                     │    │
│  │                                                     │    │
│  └────────────────────────────────────────────────────┘    │
│  [Run Test ▶]                                              │
│                                                              │
│  ─────────────────────────────────────────────────────────  │
│                                                              │
│  📊 Execution Flow:                                         │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ 🟢 [INPUT NODE]                                     │   │
│  │    Input received:                                   │   │
│  │    {                                                 │   │
│  │      "message": "Apa itu RAG?",                     │   │
│  │      "timestamp": "2025-01-20 10:30:00"             │   │
│  │    }                                                 │   │
│  │    Status: ✅ Success                               │   │
│  └─────────────────────────────────────────────────────┘   │
│            ↓                                                 │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ 🟢 [ROUTER NODE]                                    │   │
│  │    Input from INPUT:                                 │   │
│  │    {                                                 │   │
│  │      "message": "Apa itu RAG?",                     │   │
│  │      "timestamp": "2025-01-20 10:30:00"             │   │
│  │    }                                                 │   │
│  │                                                      │   │
│  │    Processing...                                     │   │
│  │    - Detected intent: "question"                     │   │
│  │    - Category: "technical"                           │   │
│  │    - Routing decision: "use_rag"                     │   │
│  │                                                      │   │
│  │    Output to next node:                              │   │
│  │    {                                                 │   │
│  │      "intent": "question",                           │   │
│  │      "category": "technical",                        │   │
│  │      "route": "rag_retriever",                       │   │
│  │      "confidence": 0.95                              │   │
│  │    }                                                 │   │
│  │    Status: ✅ Success                               │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                              │
│  🔴 [RAG RETRIEVER] - Not executed (testing stopped here)   │
│  🔴 [LLM PROCESSING] - Not executed                         │
│  🔴 [OUTPUT] - Not executed                                 │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### 4. Full Workflow Testing

**When testing complete workflow:**

```
┌─────────────────────────────────────────────────────────────┐
│ ← Back to Workflow View                                     │
├─────────────────────────────────────────────────────────────┤
│  Testing: Complete Workflow                                 │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Test Input:                                                │
│  ┌────────────────────────────────────────────────────┐    │
│  │ Jelaskan tentang RAG dan bagaimana cara kerjanya   │    │
│  └────────────────────────────────────────────────────┘    │
│  [Run Test ▶]                                              │
│                                                              │
│  ─────────────────────────────────────────────────────────  │
│                                                              │
│  📊 Complete Execution Flow:                                │
│                                                              │
│  🟢 INPUT → 🟢 ROUTER → 🟢 RAG → 🟢 LLM → 🟢 OUTPUT        │
│                                                              │
│  [View Detailed Logs ▼]                                     │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ 📝 Final Output:                                    │   │
│  │                                                      │   │
│  │ "RAG (Retrieval-Augmented Generation) adalah       │   │
│  │  teknik yang menggabungkan retrieval dengan         │   │
│  │  generative AI. Cara kerjanya:                      │   │
│  │  1. Query dari user diproses                        │   │
│  │  2. Sistem retrieve dokumen relevan                 │   │
│  │  3. Dokumen dijadikan context untuk LLM             │   │
│  │  4. LLM generate response berdasarkan context"      │   │
│  │                                                      │   │
│  │ Sources: [chimepaedia_001, doc_rag_intro.pdf]       │   │
│  │ Processing time: 2.3s                                │   │
│  │ Status: ✅ Success                                  │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 🗄️ Database Schema

### 1. RAG Workflows Table

```sql
-- Main workflows table
CREATE TABLE rag_workflows (
    id TEXT PRIMARY KEY,
    mode TEXT NOT NULL,  -- 'flash', 'pro', 'code_rag'
    name TEXT NOT NULL,
    description TEXT,
    version INTEGER DEFAULT 1,
    is_active BOOLEAN DEFAULT true,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);

-- Example data:
INSERT INTO rag_workflows (id, mode, name, description, version, is_active) VALUES
('wf_flash_v1', 'flash', 'Flash Mode Default', 'Fast response workflow', 1, true),
('wf_pro_v1', 'pro', 'Pro Mode Default', 'Deep analysis workflow', 1, true),
('wf_code_v1', 'code_rag', 'Code RAG Default', 'Code-focused workflow', 1, true);
```

### 2. Workflow Nodes Table

```sql
-- Workflow nodes (each step in the workflow)
CREATE TABLE rag_workflow_nodes (
    id TEXT PRIMARY KEY,
    workflow_id TEXT NOT NULL,
    node_type TEXT NOT NULL,  -- 'input', 'router', 'rag_retriever', 'llm', 'output'
    node_name TEXT NOT NULL,
    position INTEGER NOT NULL,  -- Order in workflow (0, 1, 2, 3, 4)
    config TEXT,  -- JSON config for this node
    is_enabled BOOLEAN DEFAULT true,
    created_at TEXT NOT NULL,
    FOREIGN KEY (workflow_id) REFERENCES rag_workflows(id)
);

-- Example data for Flash mode:
INSERT INTO rag_workflow_nodes (id, workflow_id, node_type, node_name, position, config) VALUES
('node_flash_input', 'wf_flash_v1', 'input', 'User Input', 0, '{"max_length": 1000}'),
('node_flash_router', 'wf_flash_v1', 'router', 'Intent Router', 1, '{"use_simple_routing": true}'),
('node_flash_rag', 'wf_flash_v1', 'rag_retriever', 'Chimepaedia Search', 2, '{"max_results": 3, "source": "chimepaedia"}'),
('node_flash_llm', 'wf_flash_v1', 'llm', 'LLM Generator', 3, '{"model": "fast", "temperature": 0.7}'),
('node_flash_output', 'wf_flash_v1', 'output', 'Response Output', 4, '{"format": "text"}');
```

### 3. Workflow Connections Table

```sql
-- Connections between nodes (edges in the graph)
CREATE TABLE rag_workflow_connections (
    id TEXT PRIMARY KEY,
    workflow_id TEXT NOT NULL,
    from_node_id TEXT NOT NULL,
    to_node_id TEXT NOT NULL,
    condition TEXT,  -- Optional condition for routing (JSON)
    created_at TEXT NOT NULL,
    FOREIGN KEY (workflow_id) REFERENCES rag_workflows(id),
    FOREIGN KEY (from_node_id) REFERENCES rag_workflow_nodes(id),
    FOREIGN KEY (to_node_id) REFERENCES rag_workflow_nodes(id)
);

-- Example connections for Flash mode:
INSERT INTO rag_workflow_connections (id, workflow_id, from_node_id, to_node_id) VALUES
('conn_flash_1', 'wf_flash_v1', 'node_flash_input', 'node_flash_router'),
('conn_flash_2', 'wf_flash_v1', 'node_flash_router', 'node_flash_rag'),
('conn_flash_3', 'wf_flash_v1', 'node_flash_rag', 'node_flash_llm'),
('conn_flash_4', 'wf_flash_v1', 'node_flash_llm', 'node_flash_output');
```

### 4. Workflow Test Results Table

```sql
-- Store test execution results
CREATE TABLE rag_workflow_test_results (
    id TEXT PRIMARY KEY,
    workflow_id TEXT NOT NULL,
    test_input TEXT NOT NULL,
    execution_path TEXT,  -- JSON: which nodes were executed
    node_outputs TEXT,  -- JSON: output from each node
    final_output TEXT,
    processing_time REAL,  -- in seconds
    status TEXT,  -- 'success', 'error', 'partial'
    error_message TEXT,
    created_at TEXT NOT NULL,
    FOREIGN KEY (workflow_id) REFERENCES rag_workflows(id)
);
```

---

## 🔌 Backend API Endpoints

### 1. Workflow Management

```python
# backend/routes/rag_studio.py

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, List, Dict, Any

router = APIRouter()

# ============================================
# GET WORKFLOWS
# ============================================

@router.get("/api/rag-studio/workflows")
async def get_workflows():
    """
    Get all RAG workflows
    Returns: List of workflows grouped by mode
    """
    # Implementation
    return {
        "flash": {...},
        "pro": {...},
        "code_rag": {...}
    }

@router.get("/api/rag-studio/workflows/{workflow_id}")
async def get_workflow(workflow_id: str):
    """
    Get specific workflow with nodes and connections
    """
    # Implementation
    return {
        "id": "wf_flash_v1",
        "mode": "flash",
        "name": "Flash Mode Default",
        "nodes": [...],
        "connections": [...]
    }

# ============================================
# WORKFLOW TESTING
# ============================================

@router.post("/api/rag-studio/test")
async def test_workflow(request: WorkflowTestRequest):
    """
    Test workflow execution
    
    Request body:
    {
        "workflow_id": "wf_flash_v1",
        "test_input": "Apa itu RAG?",
        "stop_at_node": "node_flash_router"  // Optional: for partial testing
    }
    
    Response:
    {
        "execution_id": "exec_123",
        "status": "success",
        "execution_flow": [
            {
                "node_id": "node_flash_input",
                "node_name": "User Input",
                "input": {...},
                "output": {...},
                "processing_time": 0.001,
                "status": "success"
            },
            {
                "node_id": "node_flash_router",
                "node_name": "Intent Router",
                "input": {...},
                "output": {...},
                "processing_time": 0.05,
                "status": "success"
            }
        ],
        "final_output": "...",
        "total_time": 2.3
    }
    """
    # Implementation
    pass

# ============================================
# NODE MANAGEMENT
# ============================================

@router.post("/api/rag-studio/workflows/{workflow_id}/nodes")
async def add_node(workflow_id: str, node: NodeCreate):
    """Add new node to workflow"""
    pass

@router.put("/api/rag-studio/workflows/{workflow_id}/nodes/{node_id}")
async def update_node(workflow_id: str, node_id: str, node: NodeUpdate):
    """Update node configuration"""
    pass

@router.delete("/api/rag-studio/workflows/{workflow_id}/nodes/{node_id}")
async def delete_node(workflow_id: str, node_id: str):
    """Delete node from workflow"""
    pass

# ============================================
# CONNECTION MANAGEMENT
# ============================================

@router.post("/api/rag-studio/workflows/{workflow_id}/connections")
async def add_connection(workflow_id: str, connection: ConnectionCreate):
    """Add connection between nodes"""
    pass

@router.delete("/api/rag-studio/workflows/{workflow_id}/connections/{connection_id}")
async def delete_connection(workflow_id: str, connection_id: str):
    """Delete connection"""
    pass
```

### 2. Workflow Execution Engine

```python
# backend/ai/workflow_engine.py

class WorkflowEngine:
    """
    Executes RAG workflows node by node
    Supports partial execution for testing
    """
    
    def __init__(self, workflow_id: str):
        self.workflow_id = workflow_id
        self.workflow = self._load_workflow()
        self.execution_log = []
    
    async def execute(
        self, 
        test_input: str, 
        stop_at_node: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Execute workflow with optional stop point
        
        Args:
            test_input: User input for testing
            stop_at_node: Node ID to stop at (for partial testing)
        
        Returns:
            Execution result with logs for each node
        """
        result = {
            "execution_id": self._generate_execution_id(),
            "status": "running",
            "execution_flow": [],
            "final_output": None,
            "total_time": 0
        }
        
        start_time = time.time()
        current_data = {"message": test_input}
        
        # Execute nodes in order
        for node in self.workflow.nodes:
            node_start = time.time()
            
            try:
                # Execute node
                node_output = await self._execute_node(node, current_data)
                
                # Log execution
                node_log = {
                    "node_id": node.id,
                    "node_name": node.name,
                    "node_type": node.type,
                    "input": current_data,
                    "output": node_output,
                    "processing_time": time.time() - node_start,
                    "status": "success"
                }
                result["execution_flow"].append(node_log)
                
                # Update current data for next node
                current_data = node_output
                
                # Stop if requested
                if stop_at_node and node.id == stop_at_node:
                    result["status"] = "partial"
                    break
                    
            except Exception as e:
                # Handle node error
                node_log = {
                    "node_id": node.id,
                    "node_name": node.name,
                    "node_type": node.type,
                    "input": current_data,
                    "output": None,
                    "processing_time": time.time() - node_start,
                    "status": "error",
                    "error": str(e)
                }
                result["execution_flow"].append(node_log)
                result["status"] = "error"
                break
        
        result["final_output"] = current_data
        result["total_time"] = time.time() - start_time
        
        if result["status"] == "running":
            result["status"] = "success"
        
        # Save test result to database
        await self._save_test_result(result)
        
        return result
    
    async def _execute_node(self, node, input_data):
        """Execute single node based on its type"""
        
        if node.type == "input":
            return await self._execute_input_node(node, input_data)
        
        elif node.type == "router":
            return await self._execute_router_node(node, input_data)
        
        elif node.type == "rag_retriever":
            return await self._execute_rag_node(node, input_data)
        
        elif node.type == "llm":
            return await self._execute_llm_node(node, input_data)
        
        elif node.type == "output":
            return await self._execute_output_node(node, input_data)
        
        else:
            raise ValueError(f"Unknown node type: {node.type}")
    
    async def _execute_input_node(self, node, input_data):
        """Process input node"""
        config = json.loads(node.config)
        max_length = config.get("max_length", 1000)
        
        message = input_data.get("message", "")
        if len(message) > max_length:
            message = message[:max_length]
        
        return {
            "message": message,
            "timestamp": datetime.now().isoformat(),
            "length": len(message)
        }
    
    async def _execute_router_node(self, node, input_data):
        """Process router node - determine intent and routing"""
        config = json.loads(node.config)
        message = input_data.get("message", "")
        
        # Simple routing logic (can be more sophisticated)
        if "?" in message or any(q in message.lower() for q in ["apa", "bagaimana", "kapan", "siapa", "mengapa"]):
            intent = "question"
            route = "rag_retriever"
        elif any(cmd in message.lower() for cmd in ["buat", "buatkan", "generate"]):
            intent = "generation"
            route = "llm"
        else:
            intent = "conversation"
            route = "llm"
        
        return {
            "message": message,
            "intent": intent,
            "category": "general",
            "route": route,
            "confidence": 0.85,
            "reasoning": f"Detected as {intent} based on message content"
        }
    
    async def _execute_rag_node(self, node, input_data):
        """Process RAG retrieval node"""
        config = json.loads(node.config)
        max_results = config.get("max_results", 3)
        source = config.get("source", "chimepaedia")
        
        message = input_data.get("message", "")
        
        # Perform retrieval (simplified)
        # In real implementation, use ChimepaediaRetriever or DocumentRetriever
        retrieved_docs = [
            {
                "id": "doc_1",
                "title": "RAG Introduction",
                "content": "RAG is a technique...",
                "relevance": 0.92
            },
            {
                "id": "doc_2", 
                "title": "How RAG Works",
                "content": "RAG combines retrieval...",
                "relevance": 0.88
            }
        ]
        
        return {
            "message": message,
            "intent": input_data.get("intent"),
            "retrieved_documents": retrieved_docs,
            "retrieval_source": source,
            "num_results": len(retrieved_docs)
        }
    
    async def _execute_llm_node(self, node, input_data):
        """Process LLM generation node"""
        config = json.loads(node.config)
        model = config.get("model", "default")
        temperature = config.get("temperature", 0.7)
        
        message = input_data.get("message", "")
        context = input_data.get("retrieved_documents", [])
        
        # Generate response using LLM (simplified)
        # In real implementation, use actual LLM API
        response = f"Based on the retrieved context, here's the answer to '{message}'..."
        
        return {
            "message": message,
            "response": response,
            "model": model,
            "temperature": temperature,
            "sources": [doc["id"] for doc in context] if context else []
        }
    
    async def _execute_output_node(self, node, input_data):
        """Process output node - format final response"""
        config = json.loads(node.config)
        output_format = config.get("format", "text")
        
        return {
            "final_response": input_data.get("response", ""),
            "format": output_format,
            "sources": input_data.get("sources", []),
            "metadata": {
                "intent": input_data.get("intent"),
                "model": input_data.get("model")
            }
        }
```

---

## 🎨 Frontend Implementation

### 1. RAG Studio Page Component

```typescript
// src/pages/RAGStudioPage.tsx

import { useState, useEffect } from 'react'
import { ArrowLeft, Play, Save, RotateCcw } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import WorkflowCanvas from '@/components/rag-studio/WorkflowCanvas'
import WorkflowModeSelector from '@/components/rag-studio/WorkflowModeSelector'
import TestPanel from '@/components/rag-studio/TestPanel'
import { useRAGStudioStore } from '@/store/ragStudioStore'

type WorkflowMode = 'flash' | 'pro' | 'code_rag'

export default function RAGStudioPage() {
  const navigate = useNavigate()
  const [currentMode, setCurrentMode] = useState<WorkflowMode>('flash')
  const [showTestPanel, setShowTestPanel] = useState(false)
  const [selectedNode, setSelectedNode] = useState<string | null>(null)
  
  const { 
    workflow, 
    loadWorkflow, 
    saveWorkflow,
    resetWorkflow
  } = useRAGStudioStore()
  
  useEffect(() => {
    loadWorkflow(currentMode)
  }, [currentMode])
  
  const handleBack = () => {
    // If user is in test panel, go back to workflow view
    if (showTestPanel) {
      setShowTestPanel(false)
      setSelectedNode(null)
    } else {
      // Go back to settings
      navigate('/settings?tab=rag-studio')
    }
  }
  
  const handleNodeClick = (nodeId: string) => {
    setSelectedNode(nodeId)
    setShowTestPanel(true)
  }
  
  const handleSave = async () => {
    await saveWorkflow(workflow)
    toast.success('Workflow saved successfully')
  }
  
  const handleReset = async () => {
    if (confirm('Reset workflow to default? This cannot be undone.')) {
      await resetWorkflow(currentMode)
      toast.success('Workflow reset to default')
    }
  }
  
  return (
    <div className="h-full flex flex-col bg-background">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <button
          onClick={handleBack}
          className="flex items-center gap-2 px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back</span>
        </button>
        
        <h1 className="text-2xl font-bold">RAG Studio</h1>
        
        <div className="flex gap-2">
          <button
            onClick={handleReset}
            className="flex items-center gap-2 px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Reset</span>
          </button>
          <button
            onClick={handleSave}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition"
          >
            <Save className="w-4 h-4" />
            <span>Save Changes</span>
          </button>
        </div>
      </div>
      
      {/* Mode Selector */}
      <WorkflowModeSelector
        currentMode={currentMode}
        onModeChange={setCurrentMode}
      />
      
      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        {showTestPanel ? (
          <TestPanel
            workflowId={workflow.id}
            stopAtNode={selectedNode}
            onBack={() => setShowTestPanel(false)}
          />
        ) : (
          <WorkflowCanvas
            workflow={workflow}
            onNodeClick={handleNodeClick}
          />
        )}
      </div>
    </div>
  )
}
```

### 2. Workflow Canvas Component

```typescript
// src/components/rag-studio/WorkflowCanvas.tsx

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Play } from 'lucide-react'
import WorkflowNode from './WorkflowNode'
import WorkflowConnection from './WorkflowConnection'

interface WorkflowCanvasProps {
  workflow: Workflow
  onNodeClick: (nodeId: string) => void
}

export default function WorkflowCanvas({ workflow, onNodeClick }: WorkflowCanvasProps) {
  return (
    <div className="h-full p-8 overflow-auto">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-xl font-semibold mb-6">
          {workflow.mode === 'flash' && '⚡ Flash Mode Workflow'}
          {workflow.mode === 'pro' && '🧠 Pro Mode Workflow'}
          {workflow.mode === 'code_rag' && '💻 Code RAG Workflow'}
        </h2>
        
        <div className="relative">
          {/* Render nodes */}
          {workflow.nodes.map((node, index) => (
            <div key={node.id} className="mb-8">
              <WorkflowNode
                node={node}
                onClick={() => onNodeClick(node.id)}
              />
              
              {/* Connection arrow */}
              {index < workflow.nodes.length - 1 && (
                <WorkflowConnection
                  from={node.id}
                  to={workflow.nodes[index + 1].id}
                  onClick={() => onNodeClick(workflow.nodes[index + 1].id)}
                />
              )}
            </div>
          ))}
        </div>
        
        {/* Test Complete Workflow Button */}
        <div className="mt-8 flex justify-center">
          <button
            onClick={() => onNodeClick('all')}
            className="flex items-center gap-2 px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors font-semibold"
          >
            <Play className="w-5 h-5" />
            Test Complete Workflow
          </button>
        </div>
      </div>
    </div>
  )
}
```

### 3. Workflow Node Component

```typescript
// src/components/rag-studio/WorkflowNode.tsx

import { motion } from 'framer-motion'
import { 
  KeyRound, 
  GitBranch, 
  Database, 
  Cpu, 
  FileOutput,
  Play 
} from 'lucide-react'

interface WorkflowNodeProps {
  node: WorkflowNode
  onClick: () => void
}

const NODE_ICONS = {
  input: KeyRound,
  router: GitBranch,
  rag_retriever: Database,
  llm: Cpu,
  output: FileOutput
}

const NODE_COLORS = {
  input: 'bg-blue-100 dark:bg-blue-900 border-blue-300 dark:border-blue-700',
  router: 'bg-purple-100 dark:bg-purple-900 border-purple-300 dark:border-purple-700',
  rag_retriever: 'bg-green-100 dark:bg-green-900 border-green-300 dark:border-green-700',
  llm: 'bg-orange-100 dark:bg-orange-900 border-orange-300 dark:border-orange-700',
  output: 'bg-pink-100 dark:bg-pink-900 border-pink-300 dark:border-pink-700'
}

export default function WorkflowNode({ node, onClick }: WorkflowNodeProps) {
  const Icon = NODE_ICONS[node.node_type]
  const colorClass = NODE_COLORS[node.node_type]
  
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={`
        relative p-6 rounded-xl border-2 cursor-pointer
        transition-all duration-200
        ${colorClass}
        hover:shadow-lg
      `}
    >
      <div className="flex items-center gap-4">
        {/* Icon */}
        <div className="flex-shrink-0">
          <Icon className="w-8 h-8" />
        </div>
        
        {/* Content */}
        <div className="flex-1">
          <h3 className="font-semibold text-lg">{node.node_name}</h3>
          <p className="text-sm opacity-70 mt-1">
            {node.node_type.replace('_', ' ').toUpperCase()}
          </p>
        </div>
        
        {/* Test button */}
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={(e) => {
            e.stopPropagation()
            onClick()
          }}
          className="flex items-center gap-1 px-3 py-1.5 bg-white dark:bg-gray-800 rounded-lg text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        >
          <Play className="w-3 h-3" />
          Test
        </motion.button>
      </div>
      
      {/* Config preview */}
      {node.config && (
        <div className="mt-3 text-xs opacity-60">
          Config: {JSON.parse(node.config).description || 'Default'}
        </div>
      )}
    </motion.div>
  )
}
```

### 4. Test Panel Component

```typescript
// src/components/rag-studio/TestPanel.tsx

import { useState } from 'react'
import { ArrowLeft, Play, Loader2 } from 'lucide-react'
import { testWorkflow } from '@/lib/api/rag-studio'
import ExecutionFlow from './ExecutionFlow'

interface TestPanelProps {
  workflowId: string
  stopAtNode: string | null
  onBack: () => void
}

export default function TestPanel({ workflowId, stopAtNode, onBack }: TestPanelProps) {
  const [testInput, setTestInput] = useState('')
  const [isRunning, setIsRunning] = useState(false)
  const [result, setResult] = useState<any>(null)
  
  const handleRunTest = async () => {
    if (!testInput.trim()) {
      toast.error('Please enter test input')
      return
    }
    
    setIsRunning(true)
    setResult(null)
    
    try {
      const response = await testWorkflow({
        workflow_id: workflowId,
        test_input: testInput,
        stop_at_node: stopAtNode === 'all' ? null : stopAtNode
      })
      
      setResult(response)
      toast.success('Test completed')
    } catch (error) {
      toast.error('Test failed: ' + error.message)
    } finally {
      setIsRunning(false)
    }
  }
  
  return (
    <div className="h-full flex flex-col p-6">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={onBack}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h2 className="text-xl font-semibold">
            Testing Workflow
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            {stopAtNode === 'all' 
              ? 'Complete workflow execution'
              : `Partial execution (stop at selected node)`
            }
          </p>
        </div>
      </div>
      
      {/* Input Section */}
      <div className="mb-6">
        <label className="block text-sm font-medium mb-2">
          Test Input:
        </label>
        <textarea
          value={testInput}
          onChange={(e) => setTestInput(e.target.value)}
          placeholder="Type your test message here..."
          className="w-full p-4 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 min-h-[100px] resize-y"
        />
        
        <button
          onClick={handleRunTest}
          disabled={isRunning}
          className="mt-3 flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isRunning ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Running Test...
            </>
          ) : (
            <>
              <Play className="w-5 h-5" />
              Run Test
            </>
          )}
        </button>
      </div>
      
      {/* Results Section */}
      {result && (
        <div className="flex-1 overflow-auto">
          <ExecutionFlow result={result} />
        </div>
      )}
    </div>
  )
}
```

### 5. Execution Flow Component

```typescript
// src/components/rag-studio/ExecutionFlow.tsx

import { motion } from 'framer-motion'
import { Check, X, Clock, ChevronDown, ChevronUp } from 'lucide-react'
import { useState } from 'react'

interface ExecutionFlowProps {
  result: any
}

export default function ExecutionFlow({ result }: ExecutionFlowProps) {
  return (
    <div>
      <h3 className="text-lg font-semibold mb-4">📊 Execution Flow:</h3>
      
      {/* Status indicator */}
      <div className={`
        px-4 py-2 rounded-lg mb-6 inline-flex items-center gap-2
        ${result.status === 'success' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100' : ''}
        ${result.status === 'partial' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100' : ''}
        ${result.status === 'error' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100' : ''}
      `}>
        <Clock className="w-4 h-4" />
        <span className="font-medium">
          Total time: {result.total_time.toFixed(2)}s
        </span>
      </div>
      
      {/* Execution nodes */}
      <div className="space-y-4">
        {result.execution_flow.map((nodeExec, index) => (
          <NodeExecutionCard
            key={nodeExec.node_id}
            nodeExec={nodeExec}
            index={index}
            isLast={index === result.execution_flow.length - 1}
          />
        ))}
      </div>
      
      {/* Final output */}
      {result.status === 'success' && result.final_output && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-6 p-6 bg-green-50 dark:bg-green-900/20 rounded-xl border-2 border-green-200 dark:border-green-800"
        >
          <h4 className="font-semibold text-green-800 dark:text-green-100 mb-3 flex items-center gap-2">
            <Check className="w-5 h-5" />
            Final Output:
          </h4>
          <pre className="text-sm whitespace-pre-wrap text-green-900 dark:text-green-50">
            {JSON.stringify(result.final_output, null, 2)}
          </pre>
        </motion.div>
      )}
    </div>
  )
}

function NodeExecutionCard({ nodeExec, index, isLast }) {
  const [expanded, setExpanded] = useState(true)
  
  const isSuccess = nodeExec.status === 'success'
  const isError = nodeExec.status === 'error'
  
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.1 }}
      className={`
        p-4 rounded-xl border-2
        ${isSuccess ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' : ''}
        ${isError ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800' : ''}
        ${!isSuccess && !isError ? 'bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700' : ''}
      `}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-3">
          <div className={`
            w-8 h-8 rounded-full flex items-center justify-center
            ${isSuccess ? 'bg-green-500' : ''}
            ${isError ? 'bg-red-500' : ''}
            ${!isSuccess && !isError ? 'bg-gray-400' : ''}
          `}>
            {isSuccess && <Check className="w-4 h-4 text-white" />}
            {isError && <X className="w-4 h-4 text-white" />}
            {!isSuccess && !isError && <span className="text-white text-xs">{index + 1}</span>}
          </div>
          
          <div>
            <h4 className="font-semibold">{nodeExec.node_name}</h4>
            <p className="text-xs opacity-70">{nodeExec.node_type}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <span className="text-xs opacity-70">
            {(nodeExec.processing_time * 1000).toFixed(0)}ms
          </span>
          {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </div>
      </div>
      
      {/* Details */}
      {expanded && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="mt-4 space-y-3"
        >
          {/* Input */}
          <div>
            <p className="text-xs font-semibold opacity-70 mb-1">Input:</p>
            <pre className="text-xs bg-white dark:bg-gray-900 p-3 rounded border overflow-x-auto">
              {JSON.stringify(nodeExec.input, null, 2)}
            </pre>
          </div>
          
          {/* Output */}
          {nodeExec.output && (
            <div>
              <p className="text-xs font-semibold opacity-70 mb-1">Output:</p>
              <pre className="text-xs bg-white dark:bg-gray-900 p-3 rounded border overflow-x-auto">
                {JSON.stringify(nodeExec.output, null, 2)}
              </pre>
            </div>
          )}
          
          {/* Error */}
          {nodeExec.error && (
            <div className="text-red-600 dark:text-red-400 text-sm">
              <p className="font-semibold mb-1">Error:</p>
              <p>{nodeExec.error}</p>
            </div>
          )}
        </motion.div>
      )}
      
      {/* Connection arrow */}
      {!isLast && (
        <div className="flex justify-center my-2">
          <div className="text-2xl opacity-50">↓</div>
        </div>
      )}
    </motion.div>
  )
}
```

---

## 📊 Implementation Roadmap

### Phase 1: Database & Backend Foundation (4-5 hours)

#### Checklist:
- [ ] Create database schema (workflows, nodes, connections, test results)
- [ ] Seed default workflows (Flash, Pro, Code RAG)
- [ ] Create backend API endpoints (`/api/rag-studio/*`)
- [ ] Implement `WorkflowEngine` class
- [ ] Implement node execution methods (input, router, rag, llm, output)
- [ ] Test API with curl/Postman

### Phase 2: Frontend UI Components (4-5 hours)

#### Checklist:
- [ ] Create RAG Studio page component
- [ ] Create Workflow Canvas component
- [ ] Create Workflow Node component
- [ ] Create Workflow Connection component
- [ ] Create Test Panel component
- [ ] Create Execution Flow component
- [ ] Add RAG Studio to Settings sidebar
- [ ] Implement navigation (back button, mode switching)

### Phase 3: State Management & Integration (2-3 hours)

#### Checklist:
- [ ] Create `useRAGStudioStore` Zustand store
- [ ] Implement API integration functions
- [ ] Connect components to backend APIs
- [ ] Handle loading states
- [ ] Handle error states
- [ ] Implement toast notifications

### Phase 4: Testing & Polish (2-3 hours)

#### Checklist:
- [ ] Test workflow loading for each mode
- [ ] Test partial execution (stop at specific node)
- [ ] Test complete workflow execution
- [ ] Test error handling
- [ ] UI responsive testing (mobile, tablet, desktop)
- [ ] Theme support (light/dark mode)
- [ ] Performance optimization
- [ ] Add animations and transitions

---

## 🧪 Testing Strategy

### Backend Testing

```python
# Test workflow execution
async def test_workflow_execution():
    engine = WorkflowEngine('wf_flash_v1')
    result = await engine.execute(
        test_input="Apa itu RAG?",
        stop_at_node=None  # Full execution
    )
    assert result['status'] == 'success'
    assert len(result['execution_flow']) == 5  # 5 nodes

# Test partial execution
async def test_partial_execution():
    engine = WorkflowEngine('wf_flash_v1')
    result = await engine.execute(
        test_input="Apa itu RAG?",
        stop_at_node='node_flash_router'  # Stop at Router
    )
    assert result['status'] == 'partial'
    assert len(result['execution_flow']) == 2  # Only INPUT and ROUTER
```

### Frontend Testing

```typescript
// Test node click
test('clicking node opens test panel', () => {
  render(<RAGStudioPage />)
  const node = screen.getByText('Intent Router')
  fireEvent.click(node)
  expect(screen.getByText('Testing Workflow')).toBeInTheDocument()
})

// Test workflow execution
test('run test executes workflow', async () => {
  render(<TestPanel workflowId="wf_flash_v1" />)
  const input = screen.getByPlaceholderText('Type your test message...')
  const button = screen.getByText('Run Test')
  
  fireEvent.change(input, { target: { value: 'Test message' } })
  fireEvent.click(button)
  
  await waitFor(() => {
    expect(screen.getByText('Execution Flow:')).toBeInTheDocument()
  })
})
```

---

## 🔐 Security Considerations

1. **Input Validation**
   - Sanitize test inputs to prevent injection
   - Limit test input length (max 10,000 chars)
   - Rate limiting for test executions

2. **Workflow Protection**
   - Validate workflow structure before save
   - Prevent infinite loops in connections
   - Backup before modifying default workflows

3. **Access Control**
   - Only authenticated users can access RAG Studio
   - Implement role-based permissions (future)

---

## 📝 Documentation Requirements

After implementation:

1. **User Guide**
   - How to use RAG Studio
   - Understanding workflow nodes
   - Running tests and interpreting results

2. **Developer Guide**
   - How to add new node types
   - How to extend workflow engine
   - API documentation

3. **Video Tutorial** (Optional)
   - Screen recording of RAG Studio features
   - Step-by-step workflow testing

---

## 🚀 Future Enhancements

### Phase 2 Features:
1. **Drag & Drop Editor**
   - Visual node editor with drag-drop
   - Custom node positioning
   - Visual connection drawing

2. **Advanced Node Types**
   - Conditional branching
   - Parallel execution
   - Loop nodes
   - Custom function nodes

3. **Workflow Templates**
   - Save custom workflows as templates
   - Share workflows with team
   - Import/export workflows

4. **Real-time Collaboration**
   - Multi-user editing
   - Live cursor tracking
   - Comments and annotations

5. **Performance Monitoring**
   - Node execution time graphs
   - Bottleneck detection
   - Optimization suggestions

---

## 📞 Questions & Clarifications

Before starting implementation, confirm:

1. ✅ Should we implement drag-drop editor in Phase 1 or use fixed layout first?
   - **Answer:** Start with fixed layout, drag-drop in Phase 2

2. ✅ Do we need authentication/permissions for RAG Studio?
   - **Answer:** Not in Phase 1, add in future

3. ✅ Should test results be saved permanently or temporary?
   - **Answer:** Save to database for history/analytics

4. ✅ Max number of nodes per workflow?
   - **Answer:** Start with 10 nodes max

---

## 🎯 Success Criteria

### Must Have (Phase 1):
- [ ] Visual workflow display for Flash, Pro, Code RAG modes
- [ ] Click node to test up to that node
- [ ] Real-time execution flow display
- [ ] Show input/output for each node
- [ ] Test complete workflow
- [ ] Save test results to database

### Should Have:
- [ ] Edit node configuration
- [ ] Add/remove nodes
- [ ] Custom workflow creation
- [ ] Export test results

### Nice to Have:
- [ ] Drag & drop editor
- [ ] Workflow templates
- [ ] Performance analytics
- [ ] Collaboration features

---

## 🔗 Related Documentation

- [Golden Rules](./golden-rules.md) - Project conventions
- [HANDOFF_CHAT_CONSOLIDATED.md](./HANDOFF_CHAT_CONSOLIDATED.md) - RAG context
- [PHASE_4_0_COMPLETE.md](./PHASE_4_0_COMPLETE.md) - Previous work

---

## 📋 Summary for User Review

**Konsep:**
- RAG Studio = Visual workflow builder untuk RAG pipeline
- Mirip n8n/Node-RED tapi untuk ChimeraAI RAG
- Test workflow step-by-step atau complete
- Lihat real-time data flow antar node
- Database-driven (bukan hardcode script)

**UI:**
- Tabs baru "RAG Studio" di Settings
- Mode selector: Flash, Pro, Code RAG
- Visual nodes dengan icon dan warna
- Click node untuk test sampai node tersebut
- Execution flow dengan expand/collapse detail

**Implementation:**
- Database schema untuk workflows, nodes, connections
- Backend WorkflowEngine untuk execute workflows
- Frontend React components dengan Framer Motion
- Real-time testing dengan detailed logs
- Estimated 12-16 hours total

**Apakah sudah sesuai dengan yang Anda bayangkan?** 🚀

---

**Last Updated:** January 2025  
**Version:** 1.0  
**Status:** 📝 Awaiting User Confirmation

---

_Made with ❤️ by E1 Agent for ChimeraAI Team_
