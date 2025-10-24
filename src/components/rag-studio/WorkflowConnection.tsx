import { motion } from 'framer-motion'
import { ArrowDown, Play } from 'lucide-react'

interface WorkflowConnectionProps {
  from: string
  to: string
  onClick: () => void
}

export default function WorkflowConnection({ from, to, onClick }: WorkflowConnectionProps) {
  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      className="flex items-center justify-center my-4 group"
    >
      <div className="relative flex flex-col items-center gap-1">
        {/* Arrow */}
        <motion.div
          whileHover={{ scale: 1.1 }}
          className="text-gray-400 dark:text-gray-600 group-hover:text-primary dark:group-hover:text-primary transition-colors"
        >
          <ArrowDown className="w-8 h-8" />
        </motion.div>
        
        {/* Test to here button */}
        <motion.button
          initial={{ opacity: 0, scale: 0.8 }}
          whileHover={{ opacity: 1, scale: 1 }}
          className="absolute top-1/2 -translate-y-1/2 px-3 py-1 bg-white dark:bg-dark-surface border border-gray-200 dark:border-dark-border rounded-full text-xs font-medium opacity-0 group-hover:opacity-100 transition-all shadow-sm hover:shadow-md flex items-center gap-1"
          onClick={onClick}
        >
          <Play className="w-3 h-3" />
          <span>Test to here</span>
        </motion.button>
      </div>
    </motion.div>
  )
}
