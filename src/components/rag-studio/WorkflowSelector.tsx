import { useState } from 'react'
import { ChevronDown, Check, Trash2 } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface Workflow {
  id: string
  mode: string
  name: string
  description?: string
  version: number
  is_active: number
  created_at: string
  updated_at: string
}

interface WorkflowSelectorProps {
  workflows: Workflow[]
  currentWorkflowId: string | null
  onSelect: (workflowId: string) => void
  onDelete: (workflowId: string) => void
  loading?: boolean
}

export default function WorkflowSelector({ 
  workflows, 
  currentWorkflowId, 
  onSelect, 
  onDelete,
  loading = false 
}: WorkflowSelectorProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

  const currentWorkflow = workflows.find(w => w.id === currentWorkflowId)

  const handleDelete = (e: React.MouseEvent, workflowId: string) => {
    e.stopPropagation()
    
    if (deleteConfirm === workflowId) {
      // Confirm delete
      onDelete(workflowId)
      setDeleteConfirm(null)
      setIsOpen(false)
    } else {
      // First click - show confirm
      setDeleteConfirm(workflowId)
      
      // Auto-reset after 3 seconds
      setTimeout(() => setDeleteConfirm(null), 3000)
    }
  }

  const getModeColor = (mode: string) => {
    const colors = {
      flash: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400',
      pro: 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400',
      code_rag: 'bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-400',
      custom: 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400'
    }
    return colors[mode as keyof typeof colors] || colors.custom
  }

  return (
    <div className="relative">
      {/* Selector Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={loading}
        className="
          flex items-center justify-between w-full md:w-auto min-w-[280px]
          px-4 py-2.5 rounded-lg
          bg-white dark:bg-dark-card
          border-2 border-gray-200 dark:border-dark-border
          hover:border-primary dark:hover:border-primary
          transition-all
          disabled:opacity-50 disabled:cursor-not-allowed
        "
      >
        <div className="flex items-center gap-3">
          {currentWorkflow ? (
            <>
              <span className={`px-2 py-0.5 rounded text-xs font-medium ${getModeColor(currentWorkflow.mode)}`}>
                {currentWorkflow.mode}
              </span>
              <div className="text-left">
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {currentWorkflow.name}
                </p>
                {currentWorkflow.description && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-[180px]">
                    {currentWorkflow.description}
                  </p>
                )}
              </div>
            </>
          ) : (
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Select a workflow...
            </span>
          )}
        </div>
        <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown Menu */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 z-40"
              onClick={() => {
                setIsOpen(false)
                setDeleteConfirm(null)
              }}
            />
            
            {/* Dropdown */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="
                absolute top-full left-0 right-0 mt-2 z-50
                bg-white dark:bg-dark-card
                border border-gray-200 dark:border-dark-border
                rounded-lg shadow-xl
                max-h-[400px] overflow-y-auto
              "
            >
              {workflows.length === 0 ? (
                <div className="p-4 text-center text-gray-500 dark:text-gray-400 text-sm">
                  No workflows available. Create one to get started!
                </div>
              ) : (
                <div className="py-2">
                  {workflows.map((workflow) => {
                    const isActive = workflow.id === currentWorkflowId
                    const isDeleteMode = deleteConfirm === workflow.id
                    
                    return (
                      <div
                        key={workflow.id}
                        className={`
                          group flex items-center justify-between px-4 py-3
                          hover:bg-gray-50 dark:hover:bg-dark-surface
                          transition-colors cursor-pointer
                          ${isActive ? 'bg-primary/5 dark:bg-primary/10' : ''}
                        `}
                        onClick={() => {
                          if (!isDeleteMode) {
                            onSelect(workflow.id)
                            setIsOpen(false)
                            setDeleteConfirm(null)
                          }
                        }}
                      >
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <span className={`px-2 py-0.5 rounded text-xs font-medium ${getModeColor(workflow.mode)}`}>
                            {workflow.mode}
                          </span>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                              {workflow.name}
                            </p>
                            {workflow.description && (
                              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                {workflow.description}
                              </p>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          {isActive && (
                            <Check className="w-4 h-4 text-primary" />
                          )}
                          
                          <button
                            onClick={(e) => handleDelete(e, workflow.id)}
                            className={`
                              p-1.5 rounded transition-colors
                              ${isDeleteMode 
                                ? 'bg-red-500 text-white hover:bg-red-600' 
                                : 'opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20'
                              }
                            `}
                            title={isDeleteMode ? 'Click again to confirm' : 'Delete workflow'}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
