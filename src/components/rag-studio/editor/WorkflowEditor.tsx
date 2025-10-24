import { useCallback, useMemo } from 'react'
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
  ConnectionLineType,
} from 'reactflow'
import 'reactflow/dist/style.css'
import { Workflow } from '@/lib/rag-studio-api'

interface WorkflowEditorProps {
  workflow: Workflow
  onNodesChange?: (nodes: Node[]) => void
  onEdgesChange?: (edges: Edge[]) => void
}

// Node color mapping by type
const NODE_COLORS = {
  input: { bg: 'bg-blue-50', border: 'border-blue-300', dark: 'dark:bg-blue-900/20 dark:border-blue-700' },
  router: { bg: 'bg-purple-50', border: 'border-purple-300', dark: 'dark:bg-purple-900/20 dark:border-purple-700' },
  rag_retriever: { bg: 'bg-green-50', border: 'border-green-300', dark: 'dark:bg-green-900/20 dark:border-green-700' },
  llm: { bg: 'bg-orange-50', border: 'border-orange-300', dark: 'dark:bg-orange-900/20 dark:border-orange-700' },
  output: { bg: 'bg-pink-50', border: 'border-pink-300', dark: 'dark:bg-pink-900/20 dark:border-pink-700' },
}

// Convert workflow data to React Flow format
function convertToReactFlow(workflow: Workflow) {
  // Convert nodes
  const nodes: Node[] = workflow.nodes.map((node) => {
    const colors = NODE_COLORS[node.node_type as keyof typeof NODE_COLORS] || NODE_COLORS.input
    
    return {
      id: node.id,
      type: 'default',
      position: { 
        x: (node as any).position_x || 400, 
        y: (node as any).position_y || node.position * 130 + 50 
      },
      data: {
        label: (
          <div className="px-3 py-2">
            <div className="font-semibold text-sm text-gray-900 dark:text-white">
              {node.node_name}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {node.node_type.replace('_', ' ')}
            </div>
          </div>
        ),
      },
      style: {
        background: 'white',
        border: '2px solid',
        borderRadius: '8px',
        width: 200,
        height: 80,
      },
      className: `${colors.bg} ${colors.border} ${colors.dark}`,
    }
  })

  // Convert connections to edges
  const edges: Edge[] = workflow.connections.map((conn) => ({
    id: conn.id,
    source: conn.from_node_id,
    target: conn.to_node_id,
    type: ConnectionLineType.SmoothStep,
    animated: true,
    style: { stroke: '#6366f1', strokeWidth: 2 },
    label: conn.condition || undefined,
  }))

  return { nodes, edges }
}

export default function WorkflowEditor({ workflow, onNodesChange, onEdgesChange }: WorkflowEditorProps) {
  const { nodes: initialNodes, edges: initialEdges } = useMemo(
    () => convertToReactFlow(workflow),
    [workflow]
  )

  const [nodes, , handleNodesChange] = useNodesState(initialNodes)
  const [edges, setEdges, handleEdgesChange] = useEdgesState(initialEdges)

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
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

  return (
    <div className="w-full h-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChangeHandler}
        onEdgesChange={onEdgesChangeHandler}
        onConnect={onConnect}
        connectionLineType={ConnectionLineType.SmoothStep}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        className="bg-gray-50 dark:bg-dark-surface"
      >
        <Controls className="bg-white dark:bg-dark-card border border-gray-200 dark:border-dark-border rounded-lg" />
        <MiniMap 
          className="bg-white dark:bg-dark-card border border-gray-200 dark:border-dark-border rounded-lg"
          nodeColor={(node) => {
            const nodeData = workflow.nodes.find(n => n.id === node.id)
            if (!nodeData) return '#6366f1'
            
            const colorMap = {
              input: '#3b82f6',
              router: '#a855f7',
              rag_retriever: '#22c55e',
              llm: '#f97316',
              output: '#ec4899',
            }
            return colorMap[nodeData.node_type as keyof typeof colorMap] || '#6366f1'
          }}
        />
        <Background 
          variant={BackgroundVariant.Dots} 
          gap={16} 
          size={1}
          className="bg-gray-50 dark:bg-dark-surface"
        />
      </ReactFlow>
    </div>
  )
}
