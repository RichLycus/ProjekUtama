import { useState } from 'react'
import { X, Zap, Brain, Code, User } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface CreateWorkflowModalProps {
  isOpen: boolean
  onClose: () => void
  onCreate: (data: {
    name: string
    description: string
    mode: string
  }) => Promise<void>
}

const WORKFLOW_TEMPLATES = [
  {
    id: 'flash',
    name: 'Flash Mode',
    icon: Zap,
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-50 dark:bg-yellow-900/20',
    borderColor: 'border-yellow-300 dark:border-yellow-700',
    description: 'Quick response with basic RAG retrieval'
  },
  {
    id: 'pro',
    name: 'Pro Mode',
    icon: Brain,
    color: 'text-purple-600',
    bgColor: 'bg-purple-50 dark:bg-purple-900/20',
    borderColor: 'border-purple-300 dark:border-purple-700',
    description: 'Deep analysis with advanced reasoning'
  },
  {
    id: 'code_rag',
    name: 'Code RAG',
    icon: Code,
    color: 'text-cyan-600',
    bgColor: 'bg-cyan-50 dark:bg-cyan-900/20',
    borderColor: 'border-cyan-300 dark:border-cyan-700',
    description: 'Specialized for code-related queries'
  },
  {
    id: 'custom',
    name: 'Custom Workflow',
    icon: User,
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-50 dark:bg-indigo-900/20',
    borderColor: 'border-indigo-300 dark:border-indigo-700',
    description: 'Start from scratch with empty workflow'
  }
]

export default function CreateWorkflowModal({ isOpen, onClose, onCreate }: CreateWorkflowModalProps) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [selectedMode, setSelectedMode] = useState<string>('custom')
  const [isCreating, setIsCreating] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!name.trim()) {
      return
    }

    setIsCreating(true)
    try {
      await onCreate({
        name: name.trim(),
        description: description.trim(),
        mode: selectedMode
      })
      
      // Reset form
      setName('')
      setDescription('')
      setSelectedMode('custom')
      onClose()
    } catch (error) {
      console.error('Failed to create workflow:', error)
    } finally {
      setIsCreating(false)
    }
  }

  const handleClose = () => {
    if (!isCreating) {
      setName('')
      setDescription('')
      setSelectedMode('custom')
      onClose()
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            {/* Modal */}
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-dark-card rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-dark-border">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                    Create New Workflow
                  </h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    Design a custom RAG workflow for your needs
                  </p>
                </div>
                <button
                  onClick={handleClose}
                  disabled={isCreating}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-dark-surface rounded-lg transition-colors disabled:opacity-50"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              {/* Content */}
              <form onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto max-h-[calc(90vh-140px)]">
                {/* Workflow Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Workflow Name *
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g., Customer Support RAG"
                    required
                    disabled={isCreating}
                    className="
                      w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-dark-border
                      bg-white dark:bg-dark-surface
                      text-gray-900 dark:text-white
                      placeholder-gray-400 dark:placeholder-gray-500
                      focus:ring-2 focus:ring-primary focus:border-transparent
                      disabled:opacity-50 disabled:cursor-not-allowed
                      transition-colors
                    "
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Description (Optional)
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe what this workflow does..."
                    rows={3}
                    disabled={isCreating}
                    className="
                      w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-dark-border
                      bg-white dark:bg-dark-surface
                      text-gray-900 dark:text-white
                      placeholder-gray-400 dark:placeholder-gray-500
                      focus:ring-2 focus:ring-primary focus:border-transparent
                      disabled:opacity-50 disabled:cursor-not-allowed
                      transition-colors resize-none
                    "
                  />
                </div>

                {/* Template Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    Choose Template
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {WORKFLOW_TEMPLATES.map((template) => {
                      const Icon = template.icon
                      const isSelected = selectedMode === template.id
                      
                      return (
                        <button
                          key={template.id}
                          type="button"
                          onClick={() => setSelectedMode(template.id)}
                          disabled={isCreating}
                          className={`
                            relative p-4 rounded-lg border-2 transition-all text-left
                            disabled:opacity-50 disabled:cursor-not-allowed
                            ${isSelected 
                              ? `${template.bgColor} ${template.borderColor}` 
                              : 'bg-gray-50 dark:bg-dark-surface border-gray-200 dark:border-dark-border hover:border-gray-300 dark:hover:border-gray-600'
                            }
                          `}
                        >
                          <div className="flex items-start gap-3">
                            <div className={`p-2 rounded-lg ${template.bgColor} border ${template.borderColor}`}>
                              <Icon className={`w-5 h-5 ${template.color}`} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className={`font-semibold text-sm ${isSelected ? template.color : 'text-gray-900 dark:text-white'}`}>
                                {template.name}
                              </h3>
                              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                {template.description}
                              </p>
                            </div>
                          </div>
                          
                          {isSelected && (
                            <div className="absolute top-2 right-2 w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                              <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                              </svg>
                            </div>
                          )}
                        </button>
                      )
                    })}
                  </div>
                </div>
              </form>

              {/* Footer */}
              <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 dark:border-dark-border bg-gray-50 dark:bg-dark-surface">
                <button
                  type="button"
                  onClick={handleClose}
                  disabled={isCreating}
                  className="
                    px-4 py-2 rounded-lg
                    text-gray-700 dark:text-gray-300
                    hover:bg-gray-200 dark:hover:bg-dark-surface-hover
                    transition-colors font-medium
                    disabled:opacity-50 disabled:cursor-not-allowed
                  "
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  onClick={handleSubmit}
                  disabled={isCreating || !name.trim()}
                  className="
                    px-6 py-2 rounded-lg
                    bg-primary hover:bg-secondary text-white
                    transition-colors font-medium
                    disabled:opacity-50 disabled:cursor-not-allowed
                    flex items-center gap-2
                  "
                >
                  {isCreating ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Creating...</span>
                    </>
                  ) : (
                    <>
                      <span>Create Workflow</span>
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
