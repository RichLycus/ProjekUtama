import { useState, useEffect } from 'react'
import { ChevronDown, Check, Trash2, RefreshCw, Layers } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { getAvailableFlows, type FlowInfo } from '@/lib/rag-studio-api'

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
  const [availableFlows, setAvailableFlows] = useState<FlowInfo[]>([])
  const [loadingFlows, setLoadingFlows] = useState(false)

  const currentWorkflow = workflows.find(w => w.id === currentWorkflowId)
  
  // Load available flows from backend on mount
  useEffect(() => {
    loadAvailableFlows()
  }, [])
  
  const loadAvailableFlows = async () => {
    setLoadingFlows(true)
    try {
      const result = await getAvailableFlows()
      if (result.success && result.flows) {
        setAvailableFlows(result.flows)
      }
    } catch (error) {
      console.error('Failed to load available flows:', error)
    } finally {
      setLoadingFlows(false)
    }
  }
  
  // Group workflows by category
  const groupedWorkflows = workflows.reduce((acc, workflow) => {
    const category = workflow.mode || 'custom'
    if (!acc[category]) {
      acc[category] = []
    }
    acc[category].push(workflow)
    return acc
  }, {} as Record<string, Workflow[]>)

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
      {/* Selector Button - Modern Design */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={loading}
        className="
          group flex items-center justify-between w-full md:w-auto min-w-[320px]
          px-5 py-3 rounded-xl
          bg-gradient-to-br from-white to-gray-50 dark:from-dark-card dark:to-dark-surface
          border-2 border-gray-200 dark:border-dark-border
          hover:border-primary dark:hover:border-primary
          hover:shadow-lg hover:shadow-primary/20
          transition-all duration-300
          disabled:opacity-50 disabled:cursor-not-allowed
        "
      >
        <div className="flex items-center gap-3">
          {currentWorkflow ? (
            <>
              <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
                <span className="text-xl">
                  {currentWorkflow.mode === 'flash' ? '⚡' : 
                   currentWorkflow.mode === 'pro' ? '🚀' : 
                   currentWorkflow.mode === 'code_rag' ? '💻' : '🎯'}
                </span>
              </div>
              <div className="text-left">
                <p className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  {currentWorkflow.name}
                  <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${getModeColor(currentWorkflow.mode)}`}>
                    {currentWorkflow.mode.toUpperCase()}
                  </span>
                </p>
                {currentWorkflow.description && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-[200px]">
                    {currentWorkflow.description}
                  </p>
                )}
              </div>
            </>
          ) : (
            <>
              <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-gray-100 dark:bg-dark-surface flex items-center justify-center">
                <span className="text-xl">🎯</span>
              </div>
              <span className="text-sm text-gray-500 dark:text-gray-400 font-medium">
                Select a workflow...
              </span>
            </>
          )}
        </div>
        <ChevronDown className={`
          w-5 h-5 text-gray-400 group-hover:text-primary 
          transition-all duration-300 
          ${isOpen ? 'rotate-180' : ''}
        `} />
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
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="
                absolute top-full left-0 right-0 mt-2 z-50
                bg-white dark:bg-dark-card
                border-2 border-gray-200 dark:border-dark-border
                rounded-xl shadow-2xl
                max-h-[480px] overflow-y-auto
                custom-scrollbar
              "
            >
              {workflows.length === 0 ? (
                <div className="p-4 text-center text-gray-500 dark:text-gray-400 text-sm">
                  No workflows available. Create one to get started!
                </div>
              ) : (
                <div className="py-2">
                  {/* Available Flows Info */}
                  {availableFlows.length > 0 && (
                    <div className="px-4 py-3 mb-2 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-b border-blue-200 dark:border-blue-800">
                      <div className="flex items-center gap-2 text-xs text-blue-700 dark:text-blue-400">
                        <Layers className="w-4 h-4" />
                        <span className="font-semibold">{availableFlows.length} flow template{availableFlows.length !== 1 ? 's' : ''} available</span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            loadAvailableFlows()
                          }}
                          disabled={loadingFlows}
                          className="ml-auto p-1.5 hover:bg-blue-100 dark:hover:bg-blue-800/30 rounded transition-colors disabled:opacity-50"
                          title="Refresh flows"
                        >
                          <RefreshCw className={`w-3.5 h-3.5 ${loadingFlows ? 'animate-spin' : ''}`} />
                        </button>
                      </div>
                    </div>
                  )}
                  
                  {/* Grouped Workflows */}
                  {Object.entries(groupedWorkflows).map(([category, categoryWorkflows]) => (
                    <div key={category}>
                      {/* Category Header */}
                      <div className="sticky top-0 px-4 py-2.5 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-dark-surface dark:to-dark-surface-hover backdrop-blur-sm z-10">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider flex items-center gap-2">
                            <span className="text-base">
                              {category === 'flash' ? '⚡' : 
                               category === 'pro' ? '🚀' : 
                               category === 'code_rag' ? '💻' : '🎯'}
                            </span>
                            {category}
                          </span>
                          <span className="text-xs font-medium text-gray-500 dark:text-gray-400 bg-white dark:bg-dark-card px-2 py-0.5 rounded-full">
                            {categoryWorkflows.length}
                          </span>
                        </div>
                      </div>
                      
                      {/* Workflows in Category */}
                      {categoryWorkflows.map((workflow) => {
                        const isActive = workflow.id === currentWorkflowId
                        const isDeleteMode = deleteConfirm === workflow.id
                        
                        return (
                          <div
                            key={workflow.id}
                            className={`
                              group flex items-center justify-between px-4 py-3.5
                              hover:bg-gradient-to-r hover:from-primary/5 hover:to-primary/10 
                              dark:hover:from-primary/10 dark:hover:to-primary/5
                              transition-all duration-200 cursor-pointer
                              border-b border-gray-100 dark:border-dark-border/50 last:border-0
                              ${isActive ? 'bg-gradient-to-r from-primary/10 to-primary/5 dark:from-primary/20 dark:to-primary/10' : ''}
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
                              <div className="flex-shrink-0 w-9 h-9 rounded-lg bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
                                <span className="text-base">
                                  {workflow.mode === 'flash' ? '⚡' : 
                                   workflow.mode === 'pro' ? '🚀' : 
                                   workflow.mode === 'code_rag' ? '💻' : '🎯'}
                                </span>
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-gray-900 dark:text-white truncate flex items-center gap-2">
                                  {workflow.name}
                                  <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${getModeColor(workflow.mode)}`}>
                                    v{workflow.version}
                                  </span>
                                </p>
                                {workflow.description && (
                                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">
                                    {workflow.description}
                                  </p>
                                )}
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-2">
                              {isActive && (
                                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center">
                                  <Check className="w-4 h-4 text-primary" />
                                </div>
                              )}
                              
                              <button
                                onClick={(e) => handleDelete(e, workflow.id)}
                                className={`
                                  p-2 rounded-lg transition-all duration-200
                                  ${isDeleteMode 
                                    ? 'bg-red-500 text-white hover:bg-red-600 scale-110' 
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
                  ))}
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
