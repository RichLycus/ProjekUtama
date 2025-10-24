import { memo } from 'react'
import { Handle, Position, NodeProps } from 'reactflow'
import { 
  FileInput, 
  GitBranch, 
  Database, 
  Sparkles, 
  FileOutput,
  Settings
} from 'lucide-react'

// Node type definitions
export type NodeType = 'input' | 'router' | 'rag_retriever' | 'llm' | 'output'

interface CustomNodeData {
  label: string
  nodeType: NodeType
  nodeName: string
  isEnabled?: boolean
  onEdit?: () => void
}

// Icon mapping by node type
const NODE_ICONS = {
  input: FileInput,
  router: GitBranch,
  rag_retriever: Database,
  llm: Sparkles,
  output: FileOutput,
}

// Color mapping by node type
const NODE_STYLES = {
  input: {
    bg: 'bg-blue-50 dark:bg-blue-900/20',
    border: 'border-blue-400 dark:border-blue-600',
    icon: 'text-blue-600 dark:text-blue-400',
    gradient: 'from-blue-500 to-blue-600',
  },
  router: {
    bg: 'bg-purple-50 dark:bg-purple-900/20',
    border: 'border-purple-400 dark:border-purple-600',
    icon: 'text-purple-600 dark:text-purple-400',
    gradient: 'from-purple-500 to-purple-600',
  },
  rag_retriever: {
    bg: 'bg-green-50 dark:bg-green-900/20',
    border: 'border-green-400 dark:border-green-600',
    icon: 'text-green-600 dark:text-green-400',
    gradient: 'from-green-500 to-green-600',
  },
  llm: {
    bg: 'bg-orange-50 dark:bg-orange-900/20',
    border: 'border-orange-400 dark:border-orange-600',
    icon: 'text-orange-600 dark:text-orange-400',
    gradient: 'from-orange-500 to-orange-600',
  },
  output: {
    bg: 'bg-pink-50 dark:bg-pink-900/20',
    border: 'border-pink-400 dark:border-pink-600',
    icon: 'text-pink-600 dark:text-pink-400',
    gradient: 'from-pink-500 to-pink-600',
  },
}

function CustomNode({ data, selected }: NodeProps<CustomNodeData>) {
  const nodeType = data.nodeType
  const styles = NODE_STYLES[nodeType]
  const Icon = NODE_ICONS[nodeType]
  const isEnabled = data.isEnabled ?? true

  return (
    <div
      className={`
        relative rounded-lg shadow-lg transition-all duration-200
        ${styles.bg} ${styles.border} border-2
        ${selected ? 'ring-4 ring-primary/30 shadow-xl' : 'shadow-md'}
        ${!isEnabled ? 'opacity-50' : ''}
        min-w-[220px]
      `}
    >
      {/* Top gradient bar */}
      <div className={`h-1 rounded-t-md bg-gradient-to-r ${styles.gradient}`} />
      
      {/* Main content */}
      <div className="p-4">
        <div className="flex items-start gap-3">
          {/* Icon */}
          <div className={`flex-shrink-0 ${styles.icon}`}>
            <Icon className="w-6 h-6" />
          </div>
          
          {/* Text content */}
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm text-gray-900 dark:text-white truncate">
              {data.nodeName}
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              {nodeType.replace('_', ' ')}
            </p>
          </div>
          
          {/* Edit button */}
          {data.onEdit && (
            <button
              onClick={data.onEdit}
              className="flex-shrink-0 p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
              title="Edit node"
            >
              <Settings className="w-4 h-4 text-gray-600 dark:text-gray-400" />
            </button>
          )}
        </div>
      </div>
      
      {/* Connection handles */}
      <Handle
        type="target"
        position={Position.Top}
        className="!w-3 !h-3 !bg-gray-400 dark:!bg-gray-600 !border-2 !border-white dark:!border-gray-800"
      />
      <Handle
        type="source"
        position={Position.Bottom}
        className="!w-3 !h-3 !bg-gray-400 dark:!bg-gray-600 !border-2 !border-white dark:!border-gray-800"
      />
    </div>
  )
}

export default memo(CustomNode)
