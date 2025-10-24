import { motion } from 'framer-motion'
import { Zap, Brain, Code } from 'lucide-react'

interface WorkflowModeSelectorProps {
  currentMode: 'flash' | 'pro' | 'code_rag'
  onModeChange: (mode: 'flash' | 'pro' | 'code_rag') => void
}

const modes = [
  {
    id: 'flash' as const,
    label: 'Flash Mode',
    icon: Zap,
    description: 'Fast response workflow',
    color: 'text-yellow-600 dark:text-yellow-400',
    bgColor: 'bg-yellow-100 dark:bg-yellow-900/30',
    borderColor: 'border-yellow-300 dark:border-yellow-700'
  },
  {
    id: 'pro' as const,
    label: 'Pro Mode',
    icon: Brain,
    description: 'Deep analysis workflow',
    color: 'text-purple-600 dark:text-purple-400',
    bgColor: 'bg-purple-100 dark:bg-purple-900/30',
    borderColor: 'border-purple-300 dark:border-purple-700'
  },
  {
    id: 'code_rag' as const,
    label: 'Code RAG',
    icon: Code,
    description: 'Code-focused workflow',
    color: 'text-cyan-600 dark:text-cyan-400',
    bgColor: 'bg-cyan-100 dark:bg-cyan-900/30',
    borderColor: 'border-cyan-300 dark:border-cyan-700'
  }
]

export default function WorkflowModeSelector({ currentMode, onModeChange }: WorkflowModeSelectorProps) {
  return (
    <div className="p-4 border-b border-gray-200 dark:border-dark-border bg-white dark:bg-dark-surface">
      <div className="flex items-center gap-4">
        <p className="text-sm font-medium text-secondary">Workflow Mode:</p>
        
        <div className="flex gap-2">
          {modes.map((mode) => {
            const Icon = mode.icon
            const isActive = currentMode === mode.id
            
            return (
              <motion.button
                key={mode.id}
                onClick={() => onModeChange(mode.id)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`
                  relative px-4 py-2 rounded-lg font-medium transition-all
                  flex items-center gap-2 border-2
                  ${isActive 
                    ? `${mode.bgColor} ${mode.borderColor} ${mode.color}` 
                    : 'bg-gray-50 dark:bg-dark-surface-hover border-gray-200 dark:border-dark-border hover:border-gray-300 dark:hover:border-gray-600'
                  }
                `}
              >
                <Icon className="w-4 h-4" />
                <span className="text-sm">{mode.label}</span>
                
                {isActive && (
                  <motion.div
                    layoutId="activeMode"
                    className="absolute inset-0 rounded-lg border-2 border-primary"
                    initial={false}
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  />
                )}
              </motion.button>
            )
          })}
        </div>
      </div>
      
      {/* Mode Description */}
      <p className="text-xs text-secondary mt-2">
        {modes.find(m => m.id === currentMode)?.description}
      </p>
    </div>
  )
}
