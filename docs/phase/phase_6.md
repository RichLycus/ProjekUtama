# Phase 6: RAG Studio - Advanced Visual Editor 🎨

**Status:** 🔄 In Progress  
**Started:** January 24, 2025  
**Goal:** Transform RAG Studio menjadi full-featured visual workflow editor seperti n8n

---

## 🎯 Phase Overview

Mengubah RAG Studio dari viewer statis menjadi interactive visual editor dengan:
- Drag & drop nodes di canvas
- Pan & zoom canvas (React Flow)
- Save node positions ke database
- Visual connection lines (bezier curves)
- Node palette sidebar
- Auto-layout algorithms

---

## ✅ Phase 6.1: Database & Backend API (COMPLETE)

**Date Completed:** January 24, 2025

### What's Done:
1. **Database Migration** ✅
   - Added 4 columns to `rag_workflow_nodes`: `position_x`, `position_y`, `width`, `height`
   - Set default vertical layout positions (130px spacing)
   - Migration script: `backend/migrations/add_node_positions.py`

2. **Backend Database Methods** ✅
   - `update_node_position()` - Single node update
   - `batch_update_positions()` - Batch update for performance
   - Added to `workflow_database.py`

3. **Backend API Endpoints** ✅
   - `PUT /api/rag-studio/workflows/{id}/nodes/{node_id}/position`
   - `PUT /api/rag-studio/workflows/{id}/batch-positions`
   - `POST /api/rag-studio/workflows/{id}/auto-layout?layout_type=vertical|horizontal`

4. **Testing** ✅
   - Single position update: Working
   - Batch update (2+ nodes): Working
   - Auto-layout (vertical/horizontal): Working
   - Persistence verified

### Files Modified:
- `backend/workflow_database.py` (+60 lines)
- `backend/routes/rag_studio.py` (+200 lines, 3 endpoints)

### Files Created:
- `backend/migrations/add_node_positions.py`

---

## ✅ Phase 6.2: Install React Flow & Setup (COMPLETE)

**Status:** ✅ Complete  
**Date Completed:** January 24, 2025

### What's Done:
1. **Library Installation** ✅
   - Installed `reactflow@11.11.4` via yarn
   - Includes: Controls, MiniMap, Background components
   - 36 dependencies installed successfully

2. **WorkflowEditor Component** ✅
   - Created `src/components/rag-studio/editor/WorkflowEditor.tsx`
   - React Flow canvas with pan & zoom
   - Node color mapping by type (blue=input, purple=router, etc.)
   - Convert workflow data to React Flow format (nodes & edges)
   - Smooth step connections with animations
   - MiniMap and Controls included

3. **RAGStudioEditorPage** ✅
   - Created `src/pages/RAGStudioEditorPage.tsx`
   - Full-screen editor with toolbar
   - Save/Test/Back navigation buttons
   - Unsaved changes warning
   - Status bar with node/connection count
   - Loading & error states

4. **Routing & Navigation** ✅
   - Added route: `/rag-studio/editor/:mode` in App.tsx
   - Added "Edit Workflow" button in RAGStudioPage.tsx
   - Navigation flow: RAG Studio → Editor → Test Panel

### Files Created:
- `src/pages/RAGStudioEditorPage.tsx` (190 lines)
- `src/components/rag-studio/editor/WorkflowEditor.tsx` (140 lines)

### Files Modified:
- `src/App.tsx` (added import + route)
- `src/pages/RAGStudioPage.tsx` (added Edit button + handler)

---

## ✅ Phase 6.3: Visual Editor Components (COMPLETE)

**Status:** ✅ Complete  
**Date Completed:** January 24, 2025

### What's Done:
1. **CustomNode Component** ✅
   - Professional styled nodes with icons & colors
   - Color mapping: Blue (input), Purple (router), Green (RAG), Orange (LLM), Pink (output)
   - Gradient top bar for visual hierarchy
   - Edit button integrated in each node
   - Connection handles (top & bottom)
   - Dark mode support

2. **CustomEdge Component** ✅
   - Smooth bezier curves with custom styling
   - Primary color stroke with transparency
   - Edge labels with rounded pill styling
   - Dark mode compatible

3. **NodePaletteSidebar** ✅
   - Draggable node palette for adding new nodes
   - 5 node templates (Input, Router, RAG, LLM, Output)
   - Drag & drop functionality
   - Responsive sidebar (collapsible on mobile)
   - Helpful tooltip and descriptions

4. **EditorToolbar** ✅
   - Save/Run primary actions
   - Undo/Redo history controls
   - Zoom In/Out/Fit View controls
   - Auto-layout button
   - Toggle grid visibility
   - Unsaved changes indicator

5. **NodeConfigPanel** ✅
   - Side panel for editing node configuration
   - Node name editor
   - Enable/disable toggle with power icon
   - JSON configuration editor
   - Save/Delete actions
   - Node info display (ID, type)

6. **WorkflowEditor Integration** ✅
   - All custom components integrated
   - Drag & drop from sidebar to canvas
   - Node selection & highlighting
   - Click node to open config panel
   - Connection creation & deletion
   - Auto-layout functionality
   - Grid toggle
   - ReactFlowProvider wrapper

### Files Created:
- `src/components/rag-studio/editor/CustomNode.tsx` (130 lines)
- `src/components/rag-studio/editor/CustomEdge.tsx` (45 lines)
- `src/components/rag-studio/editor/NodePaletteSidebar.tsx` (120 lines)
- `src/components/rag-studio/editor/EditorToolbar.tsx` (180 lines)
- `src/components/rag-studio/editor/NodeConfigPanel.tsx` (220 lines)

### Files Modified:
- `src/components/rag-studio/editor/WorkflowEditor.tsx` (complete rewrite with integration)
- `src/pages/RAGStudioEditorPage.tsx` (simplified with ReactFlowProvider)

---

## 📋 Phase 6.4: Integration & Polish

**Status:** ⏳ Pending  
**Estimated:** 2-3 hours

### Tasks:
- [ ] Wire up save positions to backend API
- [ ] Implement debounced auto-save (300ms)
- [ ] Add minimap component (optional)
- [ ] Zoom controls (buttons + mouse wheel)
- [ ] Fit view functionality
- [ ] Keyboard shortcuts (Delete, Ctrl+S, Ctrl+Z)
- [ ] Unsaved changes warning
- [ ] Dark mode styling for React Flow
- [ ] Test workflow execution from editor
- [ ] Update `ragStudioStore.ts` with editor state

### Files to Modify:
- `src/store/ragStudioStore.ts` (add editor mode state)
- `src/lib/rag-studio-api.ts` (add position update functions)

### Features:
- [ ] Auto-save node positions
- [ ] Undo/redo (optional)
- [ ] Multi-select nodes (optional)
- [ ] Snap to grid (optional)

---

## 🎨 Design Specs

### Node Colors (by type):
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
- Consistent with existing ChimeraAI theme

---

## 📊 Progress Summary

| Phase | Status | Files Created | Files Modified | Testing |
|-------|--------|---------------|----------------|---------|
| 6.1: DB & Backend | ✅ Complete | 1 | 2 | ✅ Passed |
| 6.2: React Flow Setup | ✅ Complete | 2 | 2 | ✅ Manual |
| 6.3: Components | ✅ Complete | 5 | 2 | ⏳ Manual |
| 6.4: Polish | ⏳ Pending | 0 | 2 | - |

**Total Progress:** 75% (3/4 phases complete)

---

## 🔗 Dependencies

### Backend (Done ✅):
- SQLite database with position columns
- FastAPI endpoints for position updates
- WorkflowEngine for execution

### Frontend (Next):
- `reactflow` library (v11+)
- Framer Motion (already installed)
- Tailwind CSS (already configured)

---

## 🧪 Testing Strategy

### Phase 6.1 ✅:
- [x] Curl tests for all endpoints
- [x] Database persistence verification

### Phase 6.2:
- [ ] React Flow renders correctly
- [ ] Workflow data converts to nodes/edges
- [ ] Pan & zoom works

### Phase 6.3:
- [ ] Custom nodes display with correct styling
- [ ] Drag from sidebar creates new nodes
- [ ] Connections can be created/deleted
- [ ] Node selection works

### Phase 6.4:
- [ ] Positions save to backend
- [ ] Auto-save triggers correctly
- [ ] Dark mode styling works
- [ ] Workflow execution from editor works

---

## 📝 Notes

### Golden Rules Compliance:
- ✅ No hardcoded `/app/` paths (using relative paths)
- ✅ No auto-testing without user confirmation
- ✅ Backend restart via supervisor (hot reload enabled)
- ✅ Documentation in `docs/phase/`
- ✅ Consistent naming: `phase_6.md`

### Key Decisions:
- **Library Choice:** React Flow (best for React + TypeScript)
- **Position Storage:** SQLite (separate columns, not JSON)
- **Update Strategy:** Batch updates for performance
- **Layout Algorithm:** Simple vertical/horizontal (no dagre yet)

---

**Last Updated:** January 24, 2025  
**Next Chat:** Start Phase 6.2 - Install React Flow & create basic editor
