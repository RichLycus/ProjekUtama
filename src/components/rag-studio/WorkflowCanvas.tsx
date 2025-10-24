import { motion } from 'framer-motion'
import { Play } from 'lucide-react'
import WorkflowNode from './WorkflowNode'
import WorkflowConnection from './WorkflowConnection'
import { Workflow } from '@/lib/rag-studio-api'

interface WorkflowCanvasProps {
  workflow: Workflow
  onNodeClick: (nodeId: string) => void
}

export default function WorkflowCanvas({ workflow, onNodeClick }: WorkflowCanvasProps) {
  if (!workflow) {
    return (
      <div className="h-full flex items-center justify-center">
        <p className="text-secondary">No workflow loaded</p>
      </div>
    )
  }
  
  // Ensure nodes is an array before sorting
  const nodes = Array.isArray(workflow.nodes) ? workflow.nodes : []
  
  if (nodes.length === 0) {
    return (
      <div className="h-full flex items-center justify-center">
        <p className="text-secondary">No nodes found in workflow</p>
      </div>
    )
  }
  
  // Sort nodes by position
  const sortedNodes = [...nodes].sort((a, b) => a.position - b.position)
  
  return (
    <div className="h-full overflow-auto custom-scrollbar bg-gray-50 dark:bg-dark-surface">
      <div className="max-w-4xl mx-auto p-8">
        {/* Workflow Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            {workflow.name}
          </h2>
          <p className="text-secondary">{workflow.description}</p>
        </motion.div>
        
        {/* Workflow Nodes */}
        <div className="space-y-6">
          {sortedNodes.map((node, index) => (
            <div key={node.id}>
              <WorkflowNode
                node={node}
                onClick={() => onNodeClick(node.id)}
              />
              
              {/* Connection arrow between nodes */}
              {index < sortedNodes.length - 1 && (
                <WorkflowConnection
                  from={node.id}
                  to={sortedNodes[index + 1].id}
                  onClick={() => onNodeClick(sortedNodes[index + 1].id)}
                />
              )}
            </div>
          ))}
        </div>
        
        {/* Test Complete Workflow Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-12 flex justify-center"
        >
          <button
            onClick={() => onNodeClick('all')}
            className="flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all transform hover:scale-105"
          >
            <Play className="w-5 h-5" />
            Test Complete Workflow
          </button>
        </motion.div>
      </div>
    </div>
  )
}
