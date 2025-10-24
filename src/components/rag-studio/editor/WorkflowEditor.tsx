import { useCallback, useMemo, useState, DragEvent } from 'react'
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
} from 'reactflow'
import 'reactflow/dist/style.css'
import { Workflow } from '@/lib/rag-studio-api'
import CustomNode from './CustomNode'
import CustomEdge from './CustomEdge'
import NodePaletteSidebar from './NodePaletteSidebar'
import EditorToolbar from './EditorToolbar'
import NodeConfigPanel from './NodeConfigPanel'

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
  const [showSidebar, setShowSidebar] = useState(true)
  const [showGrid, setShowGrid] = useState(true)
  const [selectedNode, setSelectedNode] = useState<Node | null>(null)
  const [showConfigPanel, setShowConfigPanel] = useState(false)

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
    (params: Connection) => setEdges((eds) => addEdge({ ...params, type: 'custom', animated: true }, eds)),
    [setEdges]
  )

  // Notify parent of changes
  const onNodesChangeHandler = useCallback(
    (changes: any) => {
      handleNodesChange(changes)
      if (onNodesChange) {
        onNodesChange(nodes)
      }
    },
    [handleNodesChange, nodes, onNodesChange]
  )

  const onEdgesChangeHandler = useCallback(
    (changes: any) => {
      handleEdgesChange(changes)
      if (onEdgesChange) {
        onEdgesChange(edges)
      }
    },
    [handleEdgesChange, edges, onEdgesChange]
  )

  // Node selection handler
  const onNodeClick = useCallback((_event: any, node: Node) => {
    setSelectedNode(node)
    setShowConfigPanel(true)
  }, [])

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
    },
    [setNodes]
  )

  // Auto layout handler
  const handleAutoLayout = useCallback(() => {
    const layoutedNodes = nodes.map((node, index) => ({
      ...node,
      position: { x: 400, y: index * 150 + 50 }
    }))
    setNodes(layoutedNodes)
  }, [nodes, setNodes])

  // Config panel handlers
  const handleConfigSave = useCallback((nodeId: string, config: any) => {
    setNodes((nds) =>
      nds.map((node) => {
        if (node.id === nodeId) {
          return {
            ...node,
            data: {
              ...node.data,
              ...config,
            }
          }
        }
        return node
      })
    )
    setShowConfigPanel(false)
  }, [setNodes])

  const handleNodeDelete = useCallback((nodeId: string) => {
    setNodes((nds) => nds.filter((node) => node.id !== nodeId))
    setEdges((eds) => eds.filter((edge) => edge.source !== nodeId && edge.target !== nodeId))
    setShowConfigPanel(false)
  }, [setNodes, setEdges])

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
  }, [setNodes])

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
          onZoomIn={() => zoomIn()}
          onZoomOut={() => zoomOut()}
          onFitView={() => fitView({ padding: 0.2 })}
          onAutoLayout={handleAutoLayout}
          onToggleGrid={() => setShowGrid(!showGrid)}
          showGrid={showGrid}
        />

        {/* React Flow Canvas */}
        <div className="flex-1">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChangeHandler}
            onEdgesChange={onEdgesChangeHandler}
            onConnect={onConnect}
            onNodeClick={onNodeClick}
            onDragOver={onDragOver}
            onDrop={onDrop}
            nodeTypes={nodeTypes}
            edgeTypes={edgeTypes}
            fitView
            fitViewOptions={{ padding: 0.2 }}
            className="bg-gray-50 dark:bg-dark-surface"
          >
            <Controls className="bg-white dark:bg-dark-card border border-gray-200 dark:border-dark-border rounded-lg" />
            <MiniMap 
              className="bg-white dark:bg-dark-card border border-gray-200 dark:border-dark-border rounded-lg"
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
