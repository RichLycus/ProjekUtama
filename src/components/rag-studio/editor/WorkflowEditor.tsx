import { useCallback, useMemo, useState, DragEvent, useEffect, useRef } from 'react'
import ReactFlow, {
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  Edge,
  Node,
  BackgroundVariant,
  NodeTypes,
  EdgeTypes,
  useReactFlow,
  NodeChange,
  EdgeChange,
} from 'reactflow'
import 'reactflow/dist/style.css'
import './workflow-editor.css'
import { Workflow } from '@/lib/rag-studio-api'
import { useRAGStudioStore } from '@/store/ragStudioStore'
import CustomNode from './CustomNode'
import CustomEdge from './CustomEdge'
import NodePaletteSidebar from './NodePaletteSidebar'
import EditorToolbar from './EditorToolbar'
import NodeConfigPanel from './NodeConfigPanel'
import toast from 'react-hot-toast'
import { Scissors } from 'lucide-react'

interface WorkflowEditorProps {
  workflow: Workflow
  onNodesChange?: (nodes: Node[]) => void
  onEdgesChange?: (edges: Edge[]) => void
}

// Register custom node types
const nodeTypes: NodeTypes = {
  custom: CustomNode,
}

// Register custom edge types
const edgeTypes: EdgeTypes = {
  custom: CustomEdge,
}

// Convert workflow data to React Flow format
function convertToReactFlow(workflow: Workflow) {
  // Convert nodes
  const nodes: Node[] = workflow.nodes.map((node) => {
    return {
      id: node.id,
      type: 'custom',
      position: { 
        x: (node as any).position_x || 400, 
        y: (node as any).position_y || node.position * 130 + 50 
      },
      data: {
        label: node.node_name,
        nodeType: node.node_type,
        nodeName: node.node_name,
        isEnabled: node.is_enabled,
        config: node.config,
        onEdit: () => {}, // Will be set later
      },
    }
  })

  // Convert connections to edges
  const edges: Edge[] = workflow.connections.map((conn) => ({
    id: conn.id,
    source: conn.from_node_id,
    target: conn.to_node_id,
    type: 'custom',
    animated: true,
    label: conn.condition || undefined,
  }))

  return { nodes, edges }
}

export default function WorkflowEditor({ workflow, onNodesChange, onEdgesChange }: WorkflowEditorProps) {
  const { zoomIn, zoomOut, fitView } = useReactFlow()
  const { saveNodePositions, setHasUnsavedChanges, removeConnection, updateNodeConfig } = useRAGStudioStore()
  const [showSidebar, setShowSidebar] = useState(true)
  const [showGrid, setShowGrid] = useState(true)
  const [deleteMode, setDeleteMode] = useState(false)
  const [selectedNode, setSelectedNode] = useState<Node | null>(null)
  const [showConfigPanel, setShowConfigPanel] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  
  // Debounced auto-save ref
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const { nodes: initialNodes, edges: initialEdges } = useMemo(
    () => convertToReactFlow(workflow),
    [workflow]
  )

  const [nodes, setNodes, handleNodesChange] = useNodesState(
    initialNodes.map(node => ({
      ...node,
      data: {
        ...node.data,
        onEdit: () => {
          setSelectedNode(node)
          setShowConfigPanel(true)
        }
      }
    }))
  )
  const [edges, setEdges, handleEdgesChange] = useEdgesState(initialEdges)

  const onConnect = useCallback(
    (params: Connection) => {
      setEdges((eds) => addEdge({ ...params, type: 'custom', animated: true }, eds))
      setHasUnsavedChanges(true)
    },
    [setEdges, setHasUnsavedChanges]
  )

  // Debounced auto-save function
  const scheduleAutoSave = useCallback(() => {
    // Clear existing timeout
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current)
    }
    
    // Schedule new auto-save
    autoSaveTimeoutRef.current = setTimeout(async () => {
      const positions = nodes.map(node => ({
        node_id: node.id,
        position_x: Math.round(node.position.x),
        position_y: Math.round(node.position.y),
      }))
      
      console.log('[Auto-save] Saving positions:', positions)
      setIsSaving(true)
      const success = await saveNodePositions(positions)
      setIsSaving(false)
      
      if (success) {
        console.log('[Auto-save] Positions saved successfully')
      }
    }, 300) // 300ms debounce
  }, [nodes, saveNodePositions])

  // Notify parent of changes & trigger auto-save
  const onNodesChangeHandler = useCallback(
    (changes: NodeChange[]) => {
      handleNodesChange(changes)
      
      // Check if any position changes
      const hasPositionChange = changes.some(change => change.type === 'position' && change.dragging === false)
      
      if (hasPositionChange) {
        setHasUnsavedChanges(true)
        scheduleAutoSave()
      }
      
      if (onNodesChange) {
        onNodesChange(nodes)
      }
    },
    [handleNodesChange, nodes, onNodesChange, setHasUnsavedChanges, scheduleAutoSave]
  )

  const onEdgesChangeHandler = useCallback(
    (changes: EdgeChange[]) => {
      console.log('[Edge Changes]', changes)
      
      // First update local state immediately for better UX
      handleEdgesChange(changes)
      
      // Check if any edge is being removed
      const removeChanges = changes.filter(change => change.type === 'remove')
      
      // Handle edge deletion via API (async in background)
      if (removeChanges.length > 0) {
        console.log('[Edge Deletion] Removing edges:', removeChanges)
        removeChanges.forEach(async (change) => {
          if ('id' in change) {
            const edgeId = change.id
            console.log('[Edge Deletion] Calling API to delete:', edgeId)
            // Call API to delete connection
            const success = await removeConnection(edgeId)
            console.log('[Edge Deletion] API result:', success)
          }
        })
      } else {
        setHasUnsavedChanges(true)
      }
      
      if (onEdgesChange) {
        onEdgesChange(edges)
      }
    },
    [handleEdgesChange, edges, onEdgesChange, setHasUnsavedChanges, removeConnection]
  )

  // Node selection handler
  const onNodeClick = useCallback((_event: any, node: Node) => {
    setSelectedNode(node)
    setShowConfigPanel(true)
  }, [])

  // Edge click handler (with selection state + delete mode)
  const [selectedEdge, setSelectedEdge] = useState<Edge | null>(null)
  
  const onEdgeClick = useCallback((_event: any, edge: Edge) => {
    console.log('[Edge Click] Selected edge:', edge.id)
    setSelectedEdge(edge)
    
    // If delete mode is active, delete immediately
    if (deleteMode) {
      console.log('[Delete Mode] Immediately deleting edge:', edge.id)
      setEdges((eds) => eds.filter((e) => e.id !== edge.id))
      removeConnection(edge.id)
      toast.success('✂️ Connection removed')
      setSelectedEdge(null)
    } else {
      // Otherwise, just show selection toast
      toast.success(`📌 Edge selected. Press Delete, Backspace, or Ctrl+D to remove.`, { 
        duration: 3000,
        icon: 'ℹ️'
      })
    }
  }, [deleteMode, setEdges, removeConnection])

  // Drag & drop from sidebar
  const onDragOver = useCallback((event: DragEvent) => {
    event.preventDefault()
    event.dataTransfer.dropEffect = 'move'
  }, [])

  const onDrop = useCallback(
    (event: DragEvent) => {
      event.preventDefault()

      const type = event.dataTransfer.getData('application/reactflow')
      if (!type) return

      const reactFlowBounds = (event.target as HTMLElement).getBoundingClientRect()
      const position = {
        x: event.clientX - reactFlowBounds.left,
        y: event.clientY - reactFlowBounds.top,
      }

      const newNode: Node = {
        id: `node_${Date.now()}`,
        type: 'custom',
        position,
        data: {
          label: `New ${type}`,
          nodeType: type,
          nodeName: `New ${type}`,
          isEnabled: true,
          onEdit: () => {
            setSelectedNode(newNode)
            setShowConfigPanel(true)
          }
        },
      }

      setNodes((nds) => nds.concat(newNode))
      setHasUnsavedChanges(true)
    },
    [setNodes, setHasUnsavedChanges]
  )

  // Auto layout handler
  const handleAutoLayout = useCallback(() => {
    const layoutedNodes = nodes.map((node, index) => ({
      ...node,
      position: { x: 400, y: index * 150 + 50 }
    }))
    setNodes(layoutedNodes)
    setHasUnsavedChanges(true)
    scheduleAutoSave()
    toast.success('Auto-layout applied')
  }, [nodes, setNodes, setHasUnsavedChanges, scheduleAutoSave])

  // Toggle delete mode handler
  const handleToggleDeleteMode = useCallback(() => {
    setDeleteMode(!deleteMode)
    if (!deleteMode) {
      toast.success('✂️ Delete Mode ON: Click any edge to remove it', { duration: 2000, icon: '✂️' })
    } else {
      toast.success('Delete Mode OFF', { duration: 1500 })
    }
  }, [deleteMode])
  const handleSave = useCallback(async () => {
    const positions = nodes.map(node => ({
      node_id: node.id,
      position_x: Math.round(node.position.x),
      position_y: Math.round(node.position.y),
    }))
    
    setIsSaving(true)
    const success = await saveNodePositions(positions)
    setIsSaving(false)
    
    if (success) {
      toast.success('Positions saved!')
    }
  }, [nodes, saveNodePositions])

  // Config panel handlers
  const handleConfigSave = useCallback(async (nodeId: string, config: any) => {
    // Update node config via store (saves to backend)
    const success = await updateNodeConfig(nodeId, config)
    
    if (success) {
      // Update local state
      setNodes((nds) =>
        nds.map((node) => {
          if (node.id === nodeId) {
            return {
              ...node,
              data: {
                ...node.data,
                nodeName: config.nodeName,
                config: config.config,
                isEnabled: config.isEnabled,
              }
            }
          }
          return node
        })
      )
      setShowConfigPanel(false)
    }
  }, [setNodes, updateNodeConfig])

  const handleNodeDelete = useCallback((nodeId: string) => {
    setNodes((nds) => nds.filter((node) => node.id !== nodeId))
    setEdges((eds) => eds.filter((edge) => edge.source !== nodeId && edge.target !== nodeId))
    setHasUnsavedChanges(true)
    setShowConfigPanel(false)
    scheduleAutoSave()
    toast.success('Node deleted')
  }, [setNodes, setEdges, setHasUnsavedChanges, scheduleAutoSave])

  const handleToggleEnabled = useCallback((nodeId: string, enabled: boolean) => {
    setNodes((nds) =>
      nds.map((node) => {
        if (node.id === nodeId) {
          return {
            ...node,
            data: {
              ...node.data,
              isEnabled: enabled,
            }
          }
        }
        return node
      })
    )
    setHasUnsavedChanges(true)
  }, [setNodes, setHasUnsavedChanges])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // ESC: Exit delete mode
      if (event.key === 'Escape' && deleteMode) {
        setDeleteMode(false)
        toast.success('Delete Mode OFF', { duration: 1500 })
        return
      }
      
      // Ctrl+S / Cmd+S: Save
      if ((event.ctrlKey || event.metaKey) && event.key === 's') {
        event.preventDefault()
        handleSave()
      }
      
      // Ctrl+D: Delete selected edge
      if ((event.ctrlKey || event.metaKey) && event.key === 'd' && selectedEdge) {
        event.preventDefault()
        console.log('[Keyboard] Ctrl+D pressed, deleting edge:', selectedEdge.id)
        setEdges((eds) => eds.filter((e) => e.id !== selectedEdge.id))
        removeConnection(selectedEdge.id)
        setSelectedEdge(null)
        toast.success('🔗 Connection removed')
      }
      
      // Delete / Backspace: Delete selected node (when config panel is open)
      if ((event.key === 'Delete' || event.key === 'Backspace') && selectedNode && showConfigPanel) {
        event.preventDefault()
        handleNodeDelete(selectedNode.id)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleSave, handleNodeDelete, selectedNode, showConfigPanel, selectedEdge, setEdges, removeConnection, deleteMode])

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current)
      }
    }
  }, [])

  return (
    <div className="w-full h-full flex">
      {/* Node Palette Sidebar */}
      <NodePaletteSidebar 
        isOpen={showSidebar} 
        onClose={() => setShowSidebar(false)} 
      />

      {/* Main Editor */}
      <div className="flex-1 flex flex-col relative">
        {/* Toolbar */}
        <EditorToolbar
          onSave={handleSave}
          onZoomIn={() => zoomIn()}
          onZoomOut={() => zoomOut()}
          onFitView={() => fitView({ padding: 0.2 })}
          onAutoLayout={handleAutoLayout}
          onToggleGrid={() => setShowGrid(!showGrid)}
          onToggleDeleteMode={handleToggleDeleteMode}
          showGrid={showGrid}
          deleteMode={deleteMode}
          hasUnsavedChanges={isSaving}
        />

        {/* Delete Mode Banner */}
        {deleteMode && (
          <div className="bg-red-50 dark:bg-red-900/20 border-b border-red-200 dark:border-red-800 px-4 py-2">
            <div className="flex items-center justify-between max-w-7xl mx-auto">
              <div className="flex items-center gap-2 text-red-700 dark:text-red-400">
                <Scissors className="w-4 h-4" />
                <span className="text-sm font-medium">
                  ✂️ Delete Mode Active: Click any edge to remove it, or press ESC to exit
                </span>
              </div>
              <button
                onClick={handleToggleDeleteMode}
                className="text-sm text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 font-medium"
              >
                Exit (ESC)
              </button>
            </div>
          </div>
        )}

        {/* React Flow Canvas */}
        <div className="flex-1">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChangeHandler}
            onEdgesChange={onEdgesChangeHandler}
            onConnect={onConnect}
            onNodeClick={onNodeClick}
            onEdgeClick={onEdgeClick}
            onDragOver={onDragOver}
            onDrop={onDrop}
            nodeTypes={nodeTypes}
            edgeTypes={edgeTypes}
            fitView
            fitViewOptions={{ padding: 0.2 }}
            className={`bg-gray-50 dark:bg-dark-surface ${deleteMode ? 'cursor-crosshair' : ''}`}
            deleteKeyCode={['Delete', 'Backspace']}
            edgesReconnectable={false}
            edgesFocusable={true}
            elementsSelectable={true}
          >
            <Controls 
              className="bg-white dark:bg-dark-card border border-gray-200 dark:border-dark-border rounded-lg" 
              position="bottom-right"
              style={{ bottom: 20, right: 20 }}
              showZoom={true}
              showFitView={true}
              showInteractive={true}
            />
            <MiniMap 
              className="bg-white dark:bg-dark-card border border-gray-200 dark:border-dark-border rounded-lg"
              position="bottom-left"
              style={{ bottom: 20, left: 20 }}
              nodeColor={(node) => {
                const colorMap = {
                  input: '#3b82f6',
                  router: '#a855f7',
                  rag_retriever: '#22c55e',
                  llm: '#f97316',
                  output: '#ec4899',
                }
                return colorMap[node.data.nodeType as keyof typeof colorMap] || '#6366f1'
              }}
            />
            {showGrid && (
              <Background 
                variant={BackgroundVariant.Dots} 
                gap={16} 
                size={1}
                className="bg-gray-50 dark:bg-dark-surface"
              />
            )}
          </ReactFlow>
        </div>
        
        {/* Auto-save indicator */}
        {isSaving && (
          <div className="absolute bottom-4 right-4 bg-white dark:bg-dark-card border border-gray-200 dark:border-dark-border rounded-lg px-4 py-2 shadow-lg flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            <span className="text-sm text-gray-700 dark:text-gray-300">Saving...</span>
          </div>
        )}
      </div>

      {/* Node Config Panel */}
      {showConfigPanel && (
        <NodeConfigPanel
          node={selectedNode}
          onClose={() => setShowConfigPanel(false)}
          onSave={handleConfigSave}
          onDelete={handleNodeDelete}
          onToggleEnabled={handleToggleEnabled}
        />
      )}
    </div>
  )
}
