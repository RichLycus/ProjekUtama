import { motion, AnimatePresence } from 'framer-motion'
import { Activity, Database, Cog, Brain, Sparkles, X } from 'lucide-react'
import { useEffect } from 'react'
import { createPortal } from 'react-dom'

interface AgentStatus {
  name: string
  status: 'idle' | 'active' | 'ready'
  icon: any
  color: string
}

interface AgentStatusModalProps {
  isOpen: boolean
  onClose: () => void
  loading?: boolean
}

export default function AgentStatusModal({ isOpen, onClose, loading = false }: AgentStatusModalProps) {
  const agents: AgentStatus[] = [
    { 
      name: 'Router', 
      status: loading ? 'active' : 'ready',
      icon: Activity,
      color: 'text-blue-500'
    },
    { 
      name: 'RAG', 
      status: loading ? 'active' : 'ready',
      icon: Database,
      color: 'text-green-500'
    },
    { 
      name: 'Execution', 
      status: 'ready',
      icon: Cog,
      color: 'text-orange-500'
    },
    { 
      name: 'Reasoning', 
      status: loading ? 'active' : 'ready',
      icon: Brain,
      color: 'text-purple-500'
    },
    { 
      name: 'Persona', 
      status: loading ? 'active' : 'ready',
      icon: Sparkles,
      color: 'text-pink-500'
    }
  ]
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-500'
      case 'ready':
        return 'bg-blue-500'
      default:
        return 'bg-gray-400'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active':
        return 'Active'
      case 'ready':
        return 'Ready'
      default:
        return 'Idle'
    }
  }

  // Close on Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    
    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      return () => document.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen, onClose])
  
  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            data-testid="agent-status-backdrop"
          />
          
          {/* Modal - Centered with proper spacing */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 30 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="relative w-full max-w-md mx-4 z-10"
            data-testid="agent-status-modal"
          >
            <div className="glass-strong rounded-2xl shadow-2xl overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-dark-border">
                <h2 className="text-lg font-bold text-text dark:text-white">
                  Agent Status
                </h2>
                <button
                  onClick={onClose}
                  className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-surface-hover transition-colors"
                  data-testid="close-agent-status"
                >
                  <X className="w-5 h-5 text-text dark:text-gray-400" />
                </button>
              </div>
              
              {/* Content */}
              <div className="p-6">
                <div className="space-y-4">
                  {agents.map((agent, index) => {
                    const Icon = agent.icon
                    const isActive = agent.status === 'active'
                    
                    return (
                      <motion.div
                        key={agent.name}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="flex items-center gap-4 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-dark-surface transition-colors"
                      >
                        {/* Status indicator */}
                        <motion.div
                          animate={{
                            scale: isActive ? [1, 1.2, 1] : 1,
                          }}
                          transition={{
                            duration: 1,
                            repeat: isActive ? Infinity : 0,
                          }}
                          className={`w-3 h-3 rounded-full ${getStatusColor(agent.status)} ${isActive ? 'animate-pulse' : ''}`}
                        />
                        
                        {/* Icon */}
                        <div className={`p-2 rounded-lg bg-gray-100 dark:bg-dark-surface ${agent.color}`}>
                          <Icon className="w-5 h-5" />
                        </div>
                        
                        {/* Info */}
                        <div className="flex-1">
                          <div className="text-sm font-medium text-text dark:text-white">
                            {agent.name}
                          </div>
                          <div className="text-xs text-text-muted dark:text-gray-500">
                            {getStatusText(agent.status)}
                          </div>
                        </div>
                        
                        {/* Status badge */}
                        <div className={`
                          px-2 py-1 rounded-full text-xs font-medium
                          ${isActive 
                            ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' 
                            : 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
                          }
                        `}>
                          {getStatusText(agent.status)}
                        </div>
                      </motion.div>
                    )
                  })}
                </div>
                
                {/* Overall status */}
                <div className="mt-6 pt-4 border-t border-gray-200 dark:border-dark-border">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-text-secondary dark:text-gray-400">
                      System Status
                    </span>
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${loading ? 'bg-yellow-500 animate-pulse' : 'bg-green-500'}`} />
                      <span className={`text-sm font-medium ${loading ? 'text-yellow-600 dark:text-yellow-400' : 'text-green-600 dark:text-green-400'}`}>
                        {loading ? 'Processing' : 'Operational'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  )
}
