# 🎨 Handoff: RAG Studio Phase 6 - Advanced Visual Editor

**Created:** January 2025  
**Last Updated:** January 2025  
**Status:** 📝 Ready for Implementation  
**Priority:** HIGH  
**Estimated Effort:** 16-20 hours

---

## 📋 Executive Summary

Phase 6 adalah pengembangan lanjutan RAG Studio yang mengubah workflow viewer menjadi **full-featured visual editor** seperti n8n/Node-RED dengan kemampuan:
- ✅ **Full-screen editing mode** - Mode edit khusus dengan canvas penuh
- ✅ **Drag & drop nodes** - Node bisa dipindah/geser di canvas
- ✅ **Draggable sidebar** - Sidebar dengan node palette yang bisa di-drag
- ✅ **Visual node connections** - Koneksi antar node dengan garis visual
- ✅ **Node positioning** - Save posisi node (x, y coordinates)
- ✅ **Pan & zoom canvas** - Canvas bisa di-pan dan zoom seperti n8n

---

## 🎯 Goals Phase 6

### Current State (Phase 4 Complete):
- ✅ Workflow visualization (linear/vertical)
- ✅ Node testing (partial & full)
- ✅ Execution flow viewer
- ✅ 3 workflow modes (Flash, Pro, Code RAG)
- ❌ Nodes dalam posisi tetap (tidak bisa dipindah)
- ❌ Layout vertical saja
- ❌ Tidak ada visual node editor

### Target State (Phase 6):
- ✅ Full-screen workflow editor mode
- ✅ Nodes bisa dipindah dengan drag & drop
- ✅ Canvas dengan pan & zoom (react-flow / xyflow)
- ✅ Sidebar dengan node palette
- ✅ Visual connection lines (bezier curves)
- ✅ Node positioning persistence (save x, y ke database)
- ✅ Minimap untuk navigation (optional)
- ✅ Auto-layout algorithm (optional)

---

## 🎨 UI/UX Design Specification

### 1. Full-Screen Editor Mode

**Trigger:** Click "Edit Workflow" button di RAGStudioPage

**Layout:**
```
┌────────────────────────────────────────────────────────────┐
│ [< Back] RAG Studio Editor - Flash Mode        [Save] [Run]│
├────────────────────────────────────────────────────────────┤
│ ┌─────────┐                                                │
│ │ Sidebar │                                                │
│ │ (Drag)  │                                                │
│ │         │           CANVAS (Pan & Zoom)                  │
│ │ Nodes:  │                                                │
│ │ ┌─────┐ │         ┌─────────┐                            │
│ │ │INPUT│ │         │  INPUT  │                            │
│ │ └─────┘ │         └────┬────┘                            │
│ │ ┌─────┐ │              │                                 │
│ │ │ROUTR│ │         ┌────▼────┐                            │
│ │ └─────┘ │         │ ROUTER  │───┐                        │
│ │ ┌─────┐ │         └─────────┘   │                        │
│ │ │ RAG │ │                     ┌──▼──┐                     │
│ │ └─────┘ │                     │ RAG │                     │
│ │ ┌─────┐ │                     └──┬──┘                     │
│ │ │ LLM │ │                        │                        │
│ │ └─────┘ │                   ┌────▼───┐                    │
│ │ ┌─────┐ │                   │  LLM   │                    │
│ │ │OUTPT│ │                   └────┬───┘                    │
│ │ └─────┘ │                        │                        │
│ └─────────┘                   ┌────▼────┐                   │
│                                │ OUTPUT  │                   │
│                                └─────────┘                   │
│                                                              │
│                                                              │
│ [Zoom: 100%] [Fit View] [Minimap]                          │
└────────────────────────────────────────────────────────────┘
```

### 2. Sidebar - Node Palette (Draggable)

**Features:**
- Drag node dari sidebar ke canvas
- Categorized nodes:
  - 📥 Input Nodes
  - 🔀 Processing Nodes (Router)
  - 📚 Retrieval Nodes (RAG)
  - 🤖 AI Nodes (LLM)
  - 📤 Output Nodes
- Search/filter nodes
- Collapsible sections

**Interaction:**
```
1. User drag node dari sidebar
2. Drop ke canvas
3. Node baru dibuat di posisi drop
4. Auto-connect jika ada logic (optional)
```

### 3. Canvas - Workflow Editor

**Features:**
- **Pan:** Click & drag background
- **Zoom:** Mouse wheel atau pinch
- **Select:** Click node untuk select
- **Move:** Drag node untuk pindah posisi
- **Connect:** Drag dari output handle ke input handle
- **Delete:** Select node → Delete key

**Node Structure:**
```
┌─────────────────────┐
│  🔹 Node Type       │ ← Header (draggable)
├─────────────────────┤
│  Node Name          │
│  Config preview     │
├─────────────────────┤
│  ◉ Input handle     │ ← Connection points
│  ◉ Output handle    │
└─────────────────────┘
```

### 4. Node Connection Lines

**Visual Style:**
- Bezier curves (smooth)
- Animated flow (optional)
- Color-coded by status:
  - Gray: Not executed
  - Green: Success
  - Red: Error
  - Blue: Executing

**Interaction:**
- Click line to select
- Select + Delete to remove connection
- Hover to show info

---

## 🗄️ Database Schema Updates

### Updated: `rag_workflow_nodes` Table

**Add columns for positioning:**
```sql
ALTER TABLE rag_workflow_nodes 
ADD COLUMN position_x REAL DEFAULT 0;

ALTER TABLE rag_workflow_nodes 
ADD COLUMN position_y REAL DEFAULT 0;

ALTER TABLE rag_workflow_nodes
ADD COLUMN width REAL DEFAULT 200;

ALTER TABLE rag_workflow_nodes
ADD COLUMN height REAL DEFAULT 100;
```

**Example data:**
```json
{
  "id": "node_flash_input",
  "workflow_id": "wf_flash_v1",
  "node_type": "input",
  "node_name": "User Input",
  "position": 0,
  "position_x": 250.0,
  "position_y": 50.0,
  "width": 200.0,
  "height": 80.0,
  "config": "{...}",
  "is_enabled": true
}
```

---

## 🔌 Backend API Updates

### New Endpoints:

#### 1. Update Node Position
```python
@router.put("/api/rag-studio/workflows/{workflow_id}/nodes/{node_id}/position")
async def update_node_position(
    workflow_id: str, 
    node_id: str,
    position: NodePositionUpdate
):
    """
    Update node position on canvas
    
    Body: {
        "position_x": 250.0,
        "position_y": 100.0,
        "width": 200.0,
        "height": 80.0
    }
    """
    pass
```

#### 2. Batch Update Positions
```python
@router.put("/api/rag-studio/workflows/{workflow_id}/nodes/batch-position")
async def batch_update_positions(
    workflow_id: str,
    updates: List[NodePositionUpdate]
):
    """
    Update multiple node positions at once (for performance)
    
    Body: [
        {"node_id": "node1", "position_x": 100, "position_y": 50},
        {"node_id": "node2", "position_x": 300, "position_y": 50}
    ]
    """
    pass
```

#### 3. Auto-Layout
```python
@router.post("/api/rag-studio/workflows/{workflow_id}/auto-layout")
async def auto_layout_workflow(
    workflow_id: str,
    layout_type: str = "vertical"  # vertical, horizontal, dagre
):
    """
    Auto-arrange nodes using layout algorithm
    Returns updated node positions
    """
    pass
```

---

## 🎨 Frontend Implementation

### 1. Technology Stack

**Recommended Library: React Flow (xyflow/react-flow)**
```bash
yarn add reactflow
```

**Why React Flow?**
- ✅ Built for React
- ✅ Excellent TypeScript support
- ✅ Pan, zoom, minimap built-in
- ✅ Customizable nodes & edges
- ✅ Performance optimized
- ✅ Active development
- ✅ Great documentation

**Alternative:** React Diagrams (projectstorm/react-diagrams)

### 2. Component Structure

```
pages/
  RAGStudioEditorPage.tsx          ← New full-screen editor

components/rag-studio/
  editor/
    WorkflowEditor.tsx              ← Main editor container
    NodePaletteSidebar.tsx          ← Draggable sidebar
    CustomNode.tsx                  ← Custom node component
    CustomEdge.tsx                  ← Custom edge/connection
    EditorControls.tsx              ← Zoom, fit, minimap controls
    NodeConfigPanel.tsx             ← Side panel for node config
    EditorToolbar.tsx               ← Top toolbar (save, run, etc)
```

### 3. WorkflowEditor Component (Core)

```typescript
// components/rag-studio/editor/WorkflowEditor.tsx

import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  Edge,
  Node
} from 'reactflow'
import 'reactflow/dist/style.css'

interface WorkflowEditorProps {
  workflow: Workflow
  onSave: (nodes: Node[], edges: Edge[]) => void
}

export default function WorkflowEditor({ workflow, onSave }: WorkflowEditorProps) {
  // Convert workflow nodes to React Flow nodes
  const initialNodes: Node[] = workflow.nodes.map(node => ({
    id: node.id,
    type: 'custom', // Use custom node component
    position: { x: node.position_x || 0, y: node.position_y || 0 },
    data: {
      label: node.node_name,
      nodeType: node.node_type,
      config: node.config,
      isEnabled: node.is_enabled
    }
  }))
  
  // Convert workflow connections to React Flow edges
  const initialEdges: Edge[] = workflow.connections.map(conn => ({
    id: conn.id,
    source: conn.from_node_id,
    target: conn.to_node_id,
    type: 'smoothstep', // Bezier curves
    animated: false
  }))
  
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges)
  
  const onConnect = (connection: Connection) => {
    setEdges((eds) => addEdge(connection, eds))
  }
  
  const onNodeDragStop = (event: any, node: Node) => {
    // Save position to backend
    updateNodePosition(node.id, node.position)
  }
  
  return (
    <div className="h-full w-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeDragStop={onNodeDragStop}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        fitView
      >
        <Background />
        <Controls />
        <MiniMap />
      </ReactFlow>
    </div>
  )
}
```

### 4. Custom Node Component

```typescript
// components/rag-studio/editor/CustomNode.tsx

import { Handle, Position } from 'reactflow'
import { motion } from 'framer-motion'

interface CustomNodeProps {
  data: {
    label: string
    nodeType: string
    config: any
    isEnabled: boolean
  }
  selected: boolean
}

export default function CustomNode({ data, selected }: CustomNodeProps) {
  const colors = getNodeColors(data.nodeType)
  
  return (
    <motion.div
      className={`
        px-4 py-3 rounded-xl border-2 shadow-lg
        ${colors.bg} ${colors.border}
        ${selected ? 'ring-2 ring-primary' : ''}
      `}
      whileHover={{ scale: 1.02 }}
    >
      {/* Input handle */}
      <Handle
        type="target"
        position={Position.Top}
        className="w-3 h-3 !bg-primary"
      />
      
      {/* Node content */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xl">{getNodeIcon(data.nodeType)}</span>
          <p className="font-semibold text-sm">{data.label}</p>
        </div>
        <p className="text-xs text-secondary uppercase">
          {data.nodeType.replace('_', ' ')}
        </p>
      </div>
      
      {/* Output handle */}
      <Handle
        type="source"
        position={Position.Bottom}
        className="w-3 h-3 !bg-primary"
      />
    </motion.div>
  )
}
```

### 5. Node Palette Sidebar

```typescript
// components/rag-studio/editor/NodePaletteSidebar.tsx

import { useState } from 'react'
import { motion } from 'framer-motion'

const nodeCategories = [
  {
    name: 'Input',
    icon: '📥',
    nodes: [
      { type: 'input', label: 'User Input', icon: '📝' }
    ]
  },
  {
    name: 'Processing',
    icon: '⚙️',
    nodes: [
      { type: 'router', label: 'Intent Router', icon: '🔀' }
    ]
  },
  {
    name: 'Retrieval',
    icon: '📚',
    nodes: [
      { type: 'rag_retriever', label: 'RAG Search', icon: '🔍' }
    ]
  },
  {
    name: 'AI',
    icon: '🤖',
    nodes: [
      { type: 'llm', label: 'LLM Generator', icon: '🧠' }
    ]
  },
  {
    name: 'Output',
    icon: '📤',
    nodes: [
      { type: 'output', label: 'Response Output', icon: '✅' }
    ]
  }
]

export default function NodePaletteSidebar() {
  const [isOpen, setIsOpen] = useState(true)
  
  const onDragStart = (event: React.DragEvent, nodeType: string) => {
    event.dataTransfer.setData('application/reactflow', nodeType)
    event.dataTransfer.effectAllowed = 'move'
  }
  
  return (
    <motion.div
      initial={{ width: 280 }}
      animate={{ width: isOpen ? 280 : 60 }}
      className="h-full bg-white dark:bg-dark-surface border-r border-gray-200 dark:border-dark-border overflow-y-auto"
    >
      {/* Sidebar header */}
      <div className="p-4 border-b border-gray-200 dark:border-dark-border">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="p-2 hover:bg-gray-100 dark:hover:bg-dark-surface-hover rounded-lg"
        >
          {isOpen ? '◀' : '▶'}
        </button>
        {isOpen && <h3 className="font-bold mt-2">Node Palette</h3>}
      </div>
      
      {/* Node categories */}
      {isOpen && (
        <div className="p-4 space-y-4">
          {nodeCategories.map((category) => (
            <div key={category.name}>
              <h4 className="text-sm font-semibold text-secondary mb-2 flex items-center gap-2">
                <span>{category.icon}</span>
                {category.name}
              </h4>
              <div className="space-y-2">
                {category.nodes.map((node) => (
                  <motion.div
                    key={node.type}
                    draggable
                    onDragStart={(e) => onDragStart(e, node.type)}
                    whileHover={{ scale: 1.05 }}
                    className="p-3 bg-gray-50 dark:bg-dark-surface-hover rounded-lg border border-gray-200 dark:border-dark-border cursor-move flex items-center gap-2"
                  >
                    <span>{node.icon}</span>
                    <span className="text-sm font-medium">{node.label}</span>
                  </motion.div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  )
}
```

### 6. Editor Toolbar

```typescript
// components/rag-studio/editor/EditorToolbar.tsx

import { Save, Play, RotateCcw, ZoomIn, ZoomOut, Maximize } from 'lucide-react'

interface EditorToolbarProps {
  onSave: () => void
  onRun: () => void
  onReset: () => void
  onAutoLayout: () => void
  zoom: number
  onZoomIn: () => void
  onZoomOut: () => void
  onFitView: () => void
}

export default function EditorToolbar({ 
  onSave, 
  onRun, 
  onReset,
  onAutoLayout,
  zoom,
  onZoomIn,
  onZoomOut,
  onFitView
}: EditorToolbarProps) {
  return (
    <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-dark-border bg-white dark:bg-dark-surface">
      {/* Left: Actions */}
      <div className="flex items-center gap-2">
        <button
          onClick={onSave}
          className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-secondary text-white rounded-lg transition-all"
        >
          <Save className="w-4 h-4" />
          Save
        </button>
        <button
          onClick={onRun}
          className="flex items-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-all"
        >
          <Play className="w-4 h-4" />
          Run Test
        </button>
        <button
          onClick={onReset}
          className="flex items-center gap-2 px-4 py-2 hover:bg-gray-100 dark:hover:bg-dark-surface-hover rounded-lg transition-all"
        >
          <RotateCcw className="w-4 h-4" />
          Reset
        </button>
        <button
          onClick={onAutoLayout}
          className="flex items-center gap-2 px-4 py-2 hover:bg-gray-100 dark:hover:bg-dark-surface-hover rounded-lg transition-all"
        >
          Auto Layout
        </button>
      </div>
      
      {/* Right: Zoom controls */}
      <div className="flex items-center gap-2">
        <button onClick={onZoomOut} className="p-2 hover:bg-gray-100 dark:hover:bg-dark-surface-hover rounded">
          <ZoomOut className="w-4 h-4" />
        </button>
        <span className="text-sm font-mono">{Math.round(zoom * 100)}%</span>
        <button onClick={onZoomIn} className="p-2 hover:bg-gray-100 dark:hover:bg-dark-surface-hover rounded">
          <ZoomIn className="w-4 h-4" />
        </button>
        <button onClick={onFitView} className="p-2 hover:bg-gray-100 dark:hover:bg-dark-surface-hover rounded">
          <Maximize className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}
```

---

## 🔄 State Management Updates

### Update `ragStudioStore.ts`

```typescript
interface RAGStudioStore {
  // ... existing state
  
  // New editor state
  editorMode: 'view' | 'edit'
  selectedNodeId: string | null
  isDirty: boolean  // Unsaved changes
  
  // New actions
  setEditorMode: (mode: 'view' | 'edit') => void
  setSelectedNode: (nodeId: string | null) => void
  updateNodePosition: (nodeId: string, x: number, y: number) => Promise<void>
  batchUpdatePositions: (updates: NodePositionUpdate[]) => Promise<void>
  setDirty: (dirty: boolean) => void
}
```

---

## 📊 Implementation Roadmap

### Phase 6.1: Setup & Basic Editor (6-8 hours)

#### Checklist:
- [ ] Install React Flow library
- [ ] Create database migration for position columns
- [ ] Update backend API with position endpoints
- [ ] Create `RAGStudioEditorPage.tsx`
- [ ] Create `WorkflowEditor.tsx` with React Flow
- [ ] Convert workflow data to React Flow format
- [ ] Basic pan & zoom functionality
- [ ] Save button (persist positions)

### Phase 6.2: Drag & Drop (4-6 hours)

#### Checklist:
- [ ] Create `NodePaletteSidebar.tsx`
- [ ] Implement drag from sidebar
- [ ] Implement drop on canvas
- [ ] Create new node on drop
- [ ] Update node position on drag
- [ ] Batch save positions (performance)

### Phase 6.3: Custom Nodes & Connections (4-6 hours)

#### Checklist:
- [ ] Create `CustomNode.tsx` component
- [ ] Style nodes by type (colors, icons)
- [ ] Add input/output handles
- [ ] Create `CustomEdge.tsx` for connections
- [ ] Implement connection creation (drag handles)
- [ ] Delete connections functionality
- [ ] Node selection & highlight

### Phase 6.4: Polish & Features (2-4 hours)

#### Checklist:
- [ ] Add minimap component
- [ ] Zoom controls (buttons + mouse wheel)
- [ ] Fit view functionality
- [ ] Auto-layout algorithm
- [ ] Keyboard shortcuts (Delete, Ctrl+S)
- [ ] Unsaved changes warning
- [ ] Dark mode styling
- [ ] Animations & transitions

---

## 🧪 Testing Strategy

### Editor Functionality:
- [ ] Open editor mode from RAGStudioPage
- [ ] Drag node from sidebar to canvas
- [ ] Move existing node
- [ ] Connect two nodes
- [ ] Delete connection
- [ ] Delete node
- [ ] Pan canvas
- [ ] Zoom in/out
- [ ] Fit view
- [ ] Save workflow
- [ ] Verify positions persisted

### Data Persistence:
- [ ] Save positions to database
- [ ] Reload workflow with saved positions
- [ ] Batch update performance test
- [ ] Handle connection updates

---

## 🎯 Success Criteria

### Must Have (Phase 6):
- [ ] Full-screen editor mode accessible
- [ ] Nodes draggable on canvas
- [ ] Node positions saved to database
- [ ] Pan & zoom canvas functionality
- [ ] Sidebar with node palette
- [ ] Visual connection lines
- [ ] Save workflow button
- [ ] Run test integration

### Should Have:
- [ ] Auto-layout algorithm
- [ ] Minimap for navigation
- [ ] Keyboard shortcuts
- [ ] Undo/redo functionality
- [ ] Node duplication

### Nice to Have:
- [ ] Multi-select nodes
- [ ] Group nodes
- [ ] Canvas grid/snap
- [ ] Connection labels
- [ ] Export/import workflow

---

## 🔗 Related Documentation

- [Phase 1-3 Complete](./RAG_STUDIO_PHASE_1_2_COMPLETE.md) - Backend
- [Phase 4 Complete](./RAG_STUDIO_PHASE_4_COMPLETE.md) - Frontend Viewer
- [Golden Rules](../golden-rules.md) - Project conventions
- [React Flow Docs](https://reactflow.dev/learn) - Library documentation

---

## 📝 Notes for Implementation

### Important Considerations:

1. **Performance:**
   - Use batch updates for position changes
   - Debounce position saves (300ms)
   - Optimize re-renders with React.memo

2. **UX:**
   - Show unsaved changes indicator
   - Warn before leaving with unsaved changes
   - Auto-save draft (localStorage)
   - Smooth animations for drag

3. **Data Consistency:**
   - Validate node connections (input → output)
   - Prevent duplicate connections
   - Handle node deletion cascade (connections)

4. **Theme Support:**
   - React Flow custom theme for dark mode
   - Match existing ChimeraAI color scheme
   - Consistent component styling

5. **Mobile/Tablet:**
   - Touch support for pan/zoom
   - Responsive sidebar (collapsible)
   - Touch-friendly node handles

---

## 🚀 Getting Started (Next Chat)

### Setup Commands:
```bash
# Install React Flow
cd /app
yarn add reactflow

# Run database migration (backend)
# Will be provided in implementation

# Start development
./start_web.sh
```

### Files to Create:
1. `/app/src/pages/RAGStudioEditorPage.tsx`
2. `/app/src/components/rag-studio/editor/WorkflowEditor.tsx`
3. `/app/src/components/rag-studio/editor/CustomNode.tsx`
4. `/app/src/components/rag-studio/editor/CustomEdge.tsx`
5. `/app/src/components/rag-studio/editor/NodePaletteSidebar.tsx`
6. `/app/src/components/rag-studio/editor/EditorToolbar.tsx`
7. `/app/src/components/rag-studio/editor/NodeConfigPanel.tsx`

### Files to Update:
1. `/app/src/App.tsx` - Add editor route
2. `/app/src/pages/RAGStudioPage.tsx` - Add "Edit Workflow" button
3. `/app/src/store/ragStudioStore.ts` - Add editor state
4. `/app/src/lib/rag-studio-api.ts` - Add position update APIs
5. `/app/backend/workflow_database.py` - Add position columns
6. `/app/backend/routes/rag_studio.py` - Add position endpoints

---

## 💡 Inspiration & References

**Similar Tools for Reference:**
- n8n - https://n8n.io (workflow automation)
- Node-RED - https://nodered.org
- Apache Airflow (DAG editor)
- Retool Workflows
- Zapier Canvas (beta)

**React Flow Examples:**
- https://reactflow.dev/examples
- Stress test: https://reactflow.dev/examples/nodes/stress
- Custom nodes: https://reactflow.dev/examples/nodes/custom-node

---

**Last Updated:** January 2025  
**Version:** 1.0  
**Status:** 📝 Ready for Phase 6 Implementation  
**Dependencies:** Phase 4 Complete ✅

---

_Prepared for next conversation - Focus: Advanced Visual Editor dengan drag & drop functionality seperti n8n_ 🎨
