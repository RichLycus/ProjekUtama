import { motion } from 'framer-motion'
import { 
  KeyRound, 
  GitBranch, 
  Database, 
  Cpu, 
  FileOutput,
  Play,
  Settings
} from 'lucide-react'
import { WorkflowNode as WorkflowNodeType } from '@/lib/rag-studio-api'

interface WorkflowNodeProps {
  node: WorkflowNodeType
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
  input: {
    bg: 'bg-blue-100 dark:bg-blue-900/30',
    border: 'border-blue-300 dark:border-blue-700',
    text: 'text-blue-600 dark:text-blue-400',
    hover: 'hover:border-blue-400 dark:hover:border-blue-600'
  },
  router: {
    bg: 'bg-purple-100 dark:bg-purple-900/30',
    border: 'border-purple-300 dark:border-purple-700',
    text: 'text-purple-600 dark:text-purple-400',
    hover: 'hover:border-purple-400 dark:hover:border-purple-600'
  },
  rag_retriever: {
    bg: 'bg-green-100 dark:bg-green-900/30',
    border: 'border-green-300 dark:border-green-700',
    text: 'text-green-600 dark:text-green-400',
    hover: 'hover:border-green-400 dark:hover:border-green-600'
  },
  llm: {
    bg: 'bg-orange-100 dark:bg-orange-900/30',
    border: 'border-orange-300 dark:border-orange-700',
    text: 'text-orange-600 dark:text-orange-400',
    hover: 'hover:border-orange-400 dark:hover:border-orange-600'
  },
  output: {
    bg: 'bg-pink-100 dark:bg-pink-900/30',
    border: 'border-pink-300 dark:border-pink-700',
    text: 'text-pink-600 dark:text-pink-400',
    hover: 'hover:border-pink-400 dark:hover:border-pink-600'
  }
}

export default function WorkflowNode({ node, onClick }: WorkflowNodeProps) {
  const Icon = NODE_ICONS[node.node_type]
  const colors = NODE_COLORS[node.node_type]
  
  // Parse config if it's a string
  let config: Record<string, any> = {}
  try {
    config = typeof node.config === 'string' ? JSON.parse(node.config) : node.config
  } catch (e) {
    console.error('Failed to parse node config:', e)
  }
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.01 }}
      className={`
        relative p-5 rounded-xl border-2 cursor-pointer
        transition-all duration-200
        ${colors.bg} ${colors.border} ${colors.hover}
        shadow-sm hover:shadow-md
      `}
      onClick={onClick}
    >
      <div className="flex items-center gap-4">
        {/* Icon */}
        <div className={`flex-shrink-0 w-12 h-12 rounded-lg ${colors.bg} border ${colors.border} flex items-center justify-center`}>
          <Icon className={`w-6 h-6 ${colors.text}`} />
        </div>
        
        {/* Content */}
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-lg text-gray-900 dark:text-white">{node.node_name}</h3>
          <p className="text-xs text-secondary mt-0.5 uppercase tracking-wide">
            {node.node_type.replace('_', ' ')}
          </p>
          
          {/* Config preview */}
          {Object.keys(config).length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {Object.entries(config).slice(0, 2).map(([key, value]) => (
                <span key={key} className="text-xs px-2 py-0.5 rounded bg-white dark:bg-dark-surface border border-gray-200 dark:border-dark-border">
                  {key}: {String(value)}
                </span>
              ))}
            </div>
          )}
        </div>
        
        {/* Test button */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={(e) => {
            e.stopPropagation()
            onClick()
          }}
          className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-dark-surface rounded-lg text-sm font-medium hover:bg-gray-50 dark:hover:bg-dark-surface-hover transition-colors border border-gray-200 dark:border-dark-border"
        >
          <Play className="w-3.5 h-3.5" />
          <span>Test</span>
        </motion.button>
      </div>
      
      {/* Status indicator */}
      {node.is_enabled && (
        <div className="absolute top-3 right-3 w-2 h-2 rounded-full bg-green-500 animate-pulse" />
      )}
    </motion.div>
  )
}
