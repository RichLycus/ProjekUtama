import { motion } from 'framer-motion'
import { Check, ArrowRight, Zap, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react'
import { useState } from 'react'
import { NodeExecution } from '@/lib/rag-studio-api'

interface ExecutionStepSummaryProps {
  execution_flow: NodeExecution[]
  status: string
  total_time: number
}

export default function ExecutionStepSummary({ execution_flow, status, total_time }: ExecutionStepSummaryProps) {
  return (
    <div className="space-y-4">
      {/* Clean Step-by-Step Display */}
      <div className="space-y-2">
        {execution_flow.map((step, index) => (
          <ExecutionStep 
            key={step.node_id} 
            step={step} 
            index={index}
            isLast={index === execution_flow.length - 1}
          />
        ))}
      </div>
      
      {/* Summary Stats */}
      <div className="flex items-center gap-4 pt-4 border-t border-gray-200 dark:border-dark-border">
        <div className="flex items-center gap-2 text-sm">
          <Check className="w-4 h-4 text-green-500" />
          <span className="text-secondary">{execution_flow.length} steps completed</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <Zap className="w-4 h-4 text-primary" />
          <span className="text-secondary">{total_time.toFixed(2)}s total</span>
        </div>
      </div>
    </div>
  )
}

interface ExecutionStepProps {
  step: NodeExecution
  index: number
  isLast: boolean
}

function ExecutionStep({ step, index, isLast }: ExecutionStepProps) {
  const [showDetails, setShowDetails] = useState(false)
  
  const isSuccess = step.status === 'success'
  const isError = step.status === 'error'
  
  // Get icon by node type
  const getNodeIcon = () => {
    switch (step.node_type) {
      case 'input':
        return '📥'
      case 'router':
        return '🧭'
      case 'rag_retriever':
        return '🔍'
      case 'llm':
        return '🤖'
      case 'output':
        return '📤'
      default:
        return '⚙️'
    }
  }
  
  return (
    <>
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: index * 0.05 }}
        className="group"
      >
        <div 
          className={`
            flex items-start gap-3 p-3 rounded-lg cursor-pointer transition-all
            ${isSuccess ? 'hover:bg-green-50 dark:hover:bg-green-900/10' : ''}
            ${isError ? 'bg-red-50 dark:bg-red-900/20' : ''}
            ${showDetails ? 'bg-gray-50 dark:bg-dark-surface-hover' : ''}
          `}
          onClick={() => setShowDetails(!showDetails)}
        >
          {/* Status Icon */}
          <div className={`
            flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center
            ${isSuccess ? 'bg-green-500 text-white' : ''}
            ${isError ? 'bg-red-500 text-white' : ''}
          `}>
            {isSuccess && <Check className="w-4 h-4" />}
            {isError && <AlertCircle className="w-4 h-4" />}
          </div>
          
          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-lg">{getNodeIcon()}</span>
              <span className="font-medium text-gray-900 dark:text-white">
                {step.node_name}
              </span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 dark:bg-dark-surface text-secondary uppercase tracking-wider">
                {step.node_type.replace('_', ' ')}
              </span>
              <span className="text-xs text-secondary font-mono ml-auto">
                {(step.processing_time * 1000).toFixed(0)}ms
              </span>
            </div>
            
            {/* Clean Summary */}
            {step.summary && (
              <p className="text-sm text-secondary mt-1 flex items-center gap-2">
                <ArrowRight className="w-3 h-3 flex-shrink-0" />
                {step.summary}
              </p>
            )}
            
            {/* Error Message */}
            {isError && step.error && (
              <p className="text-sm text-red-600 dark:text-red-400 mt-1 flex items-center gap-2">
                <AlertCircle className="w-3 h-3 flex-shrink-0" />
                {step.error}
              </p>
            )}
          </div>
          
          {/* Toggle Details Icon */}
          <div className="flex-shrink-0">
            {showDetails ? (
              <ChevronUp className="w-4 h-4 text-gray-400" />
            ) : (
              <ChevronDown className="w-4 h-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
            )}
          </div>
        </div>
        
        {/* Detailed View (Collapsible) */}
        {showDetails && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="ml-9 mt-2 space-y-3"
          >
            {/* Input */}
            <div>
              <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1 flex items-center gap-1">
                Input Data:
              </p>
              <pre className="text-xs bg-white dark:bg-dark-surface p-3 rounded border border-gray-200 dark:border-dark-border overflow-x-auto">
                {JSON.stringify(step.input, null, 2)}
              </pre>
            </div>
            
            {/* Output */}
            {step.output && (
              <div>
                <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1 flex items-center gap-1">
                  Output Data:
                </p>
                <pre className="text-xs bg-white dark:bg-dark-surface p-3 rounded border border-gray-200 dark:border-dark-border overflow-x-auto">
                  {JSON.stringify(step.output, null, 2)}
                </pre>
              </div>
            )}
          </motion.div>
        )}
      </motion.div>
      
      {/* Connection Arrow */}
      {!isLast && (
        <div className="flex justify-start ml-3">
          <div className="text-gray-300 dark:text-gray-600">↓</div>
        </div>
      )}
    </>
  )
}
