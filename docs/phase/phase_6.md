# Phase 6: RAG Studio - Visual Workflow Editor ✅

**Status:** ✅ Visual Editor Complete | 🔄 Execution Engine Being Redesigned  
**Started:** January 24, 2025  
**Redesign Started:** October 25, 2025

---

## 📢 IMPORTANT NOTICE

### Phase 6 dibagi menjadi 2 bagian:

1. **✅ Visual Workflow Editor (COMPLETE - This Document)**
   - React Flow drag & drop canvas
   - Node palette & configuration
   - Visual connections & layout
   - Database schema untuk workflows
   - **Status:** WORKING & PRODUCTION READY

2. **🔄 Dynamic Execution Engine (IN REDESIGN)**
   - Workflow execution logic
   - Agent orchestration
   - Smart routing & caching
   - **Status:** See `phase_6_roadmap.md` for new architecture

---

## 🎯 What's Working (Visual Editor)

RAG Studio sekarang memiliki full-featured visual workflow editor:

### ✅ Core Features:
- ✨ **Drag & Drop Canvas** - Intuitive node placement
- 🎨 **Custom Nodes** - Styled dengan icons & colors per type
- 🔗 **Visual Connections** - Bezier curves dengan edge labels
- 💾 **Position Persistence** - Save/load node positions dari database
- 🎛️ **Node Configuration** - Edit config via side panel
- 📐 **Auto-Layout** - Vertical/horizontal arrangement
- 🔍 **Zoom & Pan** - React Flow controls & minimap
- 🎨 **Dark Mode** - Full theme support

### ✅ Workflow Management:
- ➕ **Create Custom Workflows** - Modal dengan templates
- 📝 **Workflow Selector** - Switch between workflows
- 🗑️ **Delete Workflows** - With confirmation pattern
- 💾 **Manual Save** - Ctrl+S untuk save positions
- ⚠️ **Unsaved Changes Warning** - Prevent data loss

### ✅ Node Types:
- 📥 **Input** - User input preprocessing (Blue)
- 🧭 **Router** - Intent classification (Purple)
- 🔍 **RAG Retriever** - Document retrieval (Green)
- 🤖 **LLM** - AI generation (Orange)
- 📤 **Output** - Response formatting (Pink)

---

## 📊 Architecture (Visual Editor)

### Frontend Components

```
src/
├── pages/
│   └── RAGStudioEditorPage.tsx       # Main editor page
│
├── components/rag-studio/
│   ├── editor/
│   │   ├── WorkflowEditor.tsx        # React Flow canvas
│   │   ├── CustomNode.tsx            # Styled nodes
│   │   ├── CustomEdge.tsx            # Styled connections
│   │   ├── NodePaletteSidebar.tsx    # Drag source
│   │   ├── EditorToolbar.tsx         # Action buttons
│   │   ├── NodeConfigPanel.tsx       # Config editor
│   │   ├── LLMAgentConfig.tsx        # LLM node config
│   │   ├── RAGConfig.tsx             # RAG node config
│   │   └── RouterConfig.tsx          # Router node config
│   │
│   ├── CreateWorkflowModal.tsx       # New workflow modal
│   ├── WorkflowSelector.tsx          # Workflow dropdown
│   ├── TestPanel.tsx                 # Workflow testing
│   ├── ExecutionFlow.tsx             # Test results display
│   └── ExecutionStepSummary.tsx      # Clean summary view
│
└── store/
    └── ragStudioStore.ts             # Zustand store
```

### Backend API

```
backend/
├── routes/
│   └── rag_studio.py                 # REST API endpoints
│
├── workflow_database.py              # Database operations
│
└── data/
    └── chimera_tools.db              # SQLite database
```

### Database Schema

```sql
-- Workflows table
CREATE TABLE rag_workflows (
    id TEXT PRIMARY KEY,
    mode TEXT NOT NULL,              -- flash, pro, code_rag, custom
    name TEXT NOT NULL,
    description TEXT,
    version INTEGER DEFAULT 1,
    is_active INTEGER DEFAULT 1,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);

-- Nodes table
CREATE TABLE rag_workflow_nodes (
    id TEXT PRIMARY KEY,
    workflow_id TEXT NOT NULL,
    node_type TEXT NOT NULL,         -- input, router, rag_retriever, llm, output
    node_name TEXT NOT NULL,
    position INTEGER NOT NULL,       -- Execution order
    position_x REAL DEFAULT 0,       -- Canvas X coordinate
    position_y REAL DEFAULT 0,       -- Canvas Y coordinate
    width REAL DEFAULT 200,          -- Node width
    height REAL DEFAULT 80,          -- Node height
    config TEXT,                     -- JSON configuration
    is_enabled INTEGER DEFAULT 1,
    created_at TEXT NOT NULL,
    FOREIGN KEY (workflow_id) REFERENCES rag_workflows(id) ON DELETE CASCADE
);

-- Connections table
CREATE TABLE rag_workflow_connections (
    id TEXT PRIMARY KEY,
    workflow_id TEXT NOT NULL,
    from_node_id TEXT NOT NULL,
    to_node_id TEXT NOT NULL,
    condition TEXT,                  -- Optional routing condition (JSON)
    created_at TEXT NOT NULL,
    FOREIGN KEY (workflow_id) REFERENCES rag_workflows(id) ON DELETE CASCADE,
    FOREIGN KEY (from_node_id) REFERENCES rag_workflow_nodes(id) ON DELETE CASCADE,
    FOREIGN KEY (to_node_id) REFERENCES rag_workflow_nodes(id) ON DELETE CASCADE
);

-- Test results table
CREATE TABLE rag_test_results (
    id TEXT PRIMARY KEY,
    workflow_id TEXT NOT NULL,
    test_input TEXT NOT NULL,
    execution_path TEXT,             -- JSON array of node IDs
    node_outputs TEXT,               -- JSON array of outputs
    final_output TEXT,               -- JSON final result
    processing_time REAL,            -- Seconds
    status TEXT,                     -- success, partial, error
    error_message TEXT,
    created_at TEXT NOT NULL,
    FOREIGN KEY (workflow_id) REFERENCES rag_workflows(id) ON DELETE CASCADE
);
```

---

## 🔌 API Endpoints (Visual Editor)

### Workflow Management

```
GET    /api/rag-studio/workflows                    # List all workflows
GET    /api/rag-studio/workflows/{id}               # Get workflow with nodes
POST   /api/rag-studio/workflows                    # Create workflow
PUT    /api/rag-studio/workflows/{id}               # Update workflow
DELETE /api/rag-studio/workflows/{id}               # Delete workflow
```

### Node Management

```
POST   /api/rag-studio/workflows/{id}/nodes         # Add node
PUT    /api/rag-studio/workflows/{id}/nodes/{node_id}            # Update node
DELETE /api/rag-studio/workflows/{id}/nodes/{node_id}            # Delete node
PUT    /api/rag-studio/workflows/{id}/nodes/{node_id}/position   # Update position
PUT    /api/rag-studio/workflows/{id}/batch-positions            # Batch update positions
POST   /api/rag-studio/workflows/{id}/auto-layout                # Auto-arrange nodes
```

### Connection Management

```
POST   /api/rag-studio/workflows/{id}/connections                # Add connection
DELETE /api/rag-studio/workflows/{id}/connections/{conn_id}      # Delete connection
```

### Test Execution

```
POST   /api/rag-studio/test                         # Test workflow execution
GET    /api/rag-studio/workflows/{id}/tests         # Get test results history
GET    /api/rag-studio/tests/{result_id}            # Get specific test result
```

---

## ✅ Completed Features

### Phase 6.1: Database & Backend API ✅
**Date:** January 24, 2025

- ✅ Database migration dengan position columns
- ✅ Backend API endpoints (workflows, nodes, connections)
- ✅ Batch position update untuk performance
- ✅ Auto-layout algorithms (vertical/horizontal)

### Phase 6.2: React Flow Setup ✅
**Date:** January 24, 2025

- ✅ Installed reactflow@11.11.4
- ✅ WorkflowEditor component dengan pan & zoom
- ✅ Convert workflow data → React Flow format
- ✅ RAGStudioEditorPage dengan full-screen editor
- ✅ Routing & navigation integration

### Phase 6.3: Visual Editor Components ✅
**Date:** January 24, 2025

- ✅ CustomNode dengan icons & gradient styling
- ✅ CustomEdge dengan bezier curves
- ✅ NodePaletteSidebar untuk drag & drop
- ✅ EditorToolbar dengan save/undo/zoom controls
- ✅ NodeConfigPanel untuk edit node settings

### Phase 6.4: Integration & Polish ✅
**Date:** January 24, 2025 | Updated: October 24, 2025

- ✅ Manual save via button atau Ctrl+S
- ✅ Unsaved changes warning
- ✅ Keyboard shortcuts (Delete untuk node, Ctrl+D untuk edge)
- ✅ Toast notifications untuk feedback
- ✅ Performance optimizations

**Important Fix (Oct 24, 2025):**
- ❌ Auto-save DISABLED (was causing bugs during operations)
- ✅ Manual save only untuk prevent conflicts
- ✅ Fixed Backspace accidentally deleting nodes while typing

### Phase 6.5: Bug Fixes ✅
**Date:** October 24, 2025

- ✅ Fixed batch position update API (422 error)
- ✅ Enhanced edge selection & deletion
- ✅ Fixed Controls positioning (tidak terpotong)
- ✅ Node name/config persistence to database
- ✅ Safe keyboard shortcuts (tidak interfere dengan typing)

### Phase 6.6.1: Create Workflow + Workflow List ✅
**Date:** January 24, 2025

- ✅ CreateWorkflowModal dengan template selection
- ✅ WorkflowSelector dropdown dengan delete confirmation
- ✅ Real-time update after create/delete
- ✅ Template options: Flash, Pro, Code RAG, Custom

### Phase 6.6.2: Enhanced Node Configuration ✅
**Date:** October 24, 2025

- ✅ LLMAgentConfig - Agent selection dari database
- ✅ RAGConfig - Retriever settings
- ✅ RouterConfig - Visual condition builder
- ✅ JSON editor fallback untuk advanced users
- ✅ Save node config to database

---

## 🎨 Design Specs

### Node Colors by Type:
- **Input**: Blue (`bg-blue-50 border-blue-300`)
- **Router**: Purple (`bg-purple-50 border-purple-300`)
- **RAG Retriever**: Green (`bg-green-50 border-green-300`)
- **LLM**: Orange (`bg-orange-50 border-orange-300`)
- **Output**: Pink (`bg-pink-50 border-pink-300`)

### Canvas Layout:
- Default position: Center canvas (400, 50)
- Vertical spacing: 130px between nodes
- Horizontal spacing: 250px between nodes
- Node size: 200px × 80px (default)

### Theme Support:
- Light mode: White bg, subtle borders
- Dark mode: `dark:bg-dark-surface`, `dark:border-dark-border`

---

## 🔧 How to Use (Visual Editor)

### 1. Create New Workflow:
1. Click "+ Create Workflow" button
2. Enter name & description
3. Choose template (Flash/Pro/Code/Custom)
4. Click "Create"

### 2. Edit Workflow:
1. Select workflow from dropdown
2. Drag nodes from sidebar to canvas
3. Connect nodes by dragging from output to input handle
4. Click node to open config panel
5. Configure node settings (agent, model, parameters)
6. Press **Ctrl+S** to save positions

### 3. Delete Elements:
- **Delete Node:** Click node → Press Delete key
- **Delete Connection:** Click edge → Press Delete key
- **Delete Workflow:** Click trash icon twice (confirmation)

### 4. Layout Options:
- **Auto-Layout:** Click "Auto Layout" button → Choose vertical/horizontal
- **Manual:** Drag nodes ke posisi yang diinginkan
- **Zoom:** Use mouse wheel atau controls panel
- **Pan:** Click & drag canvas background

---

## ⚠️ Known Limitations (Visual Editor)

1. **No Workflow Execution** - Visual editor working, tapi execution engine sedang di-redesign
2. **Template Workflows Incomplete** - Beberapa template masih placeholder
3. **No Workflow Version Control** - Belum ada history/rollback
4. **No Import/Export** - Belum bisa export workflow sebagai JSON

---

## 🚀 What's Next: Dynamic Execution Engine

Visual editor sudah complete dan production-ready. Yang sedang di-redesign adalah **execution engine** - cara workflow dijalankan.

### Problem dengan Current Engine:
- ❌ Hardcoded flow logic (if mode == "flash" vs "pro")
- ❌ Tightly coupled agents (semua di workflow_engine.py)
- ❌ Mock response tidak intelligent
- ❌ Tidak ada smart routing
- ❌ Tidak ada cache layer

### New Architecture (Phase 6.7+):
- ✅ JSON-based flow configurations
- ✅ Plugin-based agent system
- ✅ Smart auto-routing
- ✅ Unified retriever interface
- ✅ Cache layer untuk Flash+ mode
- ✅ Observability & metrics

**📖 Full details:** See `phase_6_roadmap.md`

---

## 📝 Usage Tips

### Best Practices:
1. **Save Often:** Press Ctrl+S after moving nodes
2. **Name Nodes:** Give descriptive names untuk easy identification
3. **Test Incrementally:** Test workflow setelah add/modify nodes
4. **Use Templates:** Start dengan template lalu customize

### Keyboard Shortcuts:
- **Ctrl+S / Cmd+S:** Save node positions
- **Delete:** Delete selected node or edge (only, not Backspace!)
- **Mouse Wheel:** Zoom in/out
- **Space + Drag:** Pan canvas

### Troubleshooting:
- **Nodes tidak save:** Check "Unsaved changes" indicator, press Ctrl+S
- **Cannot delete edge:** Click edge first (should highlight), then press Delete
- **Controls terpotong:** Refresh page, controls di bottom-right
- **Backspace deletes node:** Fixed - only Delete key works now

---

## 🎯 Files Reference

### Frontend (Working):
- `src/pages/RAGStudioEditorPage.tsx` - Main editor page
- `src/components/rag-studio/editor/WorkflowEditor.tsx` - Canvas
- `src/components/rag-studio/editor/CustomNode.tsx` - Node styling
- `src/components/rag-studio/editor/NodeConfigPanel.tsx` - Config UI
- `src/components/rag-studio/CreateWorkflowModal.tsx` - New workflow
- `src/components/rag-studio/WorkflowSelector.tsx` - Workflow picker
- `src/store/ragStudioStore.ts` - State management

### Backend (Working):
- `backend/routes/rag_studio.py` - API endpoints
- `backend/workflow_database.py` - Database operations
- `backend/data/chimera_tools.db` - SQLite storage

### Backend (Being Redesigned):
- `backend/ai/workflow_engine.py` - ⚠️ DEPRECATED - See phase_6_roadmap.md

---

## 📊 Statistics

| Metric | Count |
|--------|-------|
| Frontend Components | 13 |
| Backend Endpoints | 15 |
| Database Tables | 4 |
| Node Types | 5 |
| Keyboard Shortcuts | 3 |
| Auto-Layout Options | 2 |

---

## 🏆 Success Criteria (Visual Editor)

✅ All criteria met:
- [x] Drag & drop nodes working
- [x] Visual connections creation/deletion
- [x] Node configuration saving to database
- [x] Position persistence across sessions
- [x] Create/delete workflows
- [x] Workflow selection & switching
- [x] Manual save dengan Ctrl+S
- [x] Dark mode support
- [x] Responsive layout
- [x] No breaking bugs

---

## 📚 Related Documentation

- **phase_6_roadmap.md** - New execution engine architecture
- **Phase_6_analysis.md** - Problem analysis dari execution engine
- **golden-rules.md** - Project conventions

---

**Last Updated:** October 25, 2025  
**Status:** ✅ Visual Editor Complete & Production Ready  
**Next:** Implement Phase 6.7 (Dynamic Execution Engine) - See phase_6_roadmap.md

---

**Note:** Visual workflow editor ini fully functional dan bisa digunakan untuk manual workflow design. Execution engine sedang di-redesign dengan arsitektur yang lebih modular dan flexible. Backward compatibility akan dijaga - workflows yang sudah dibuat akan tetap berfungsi.
