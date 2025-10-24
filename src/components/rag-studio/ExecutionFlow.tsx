import { motion } from 'framer-motion'
import { Check, X, Clock, ChevronDown, ChevronUp, Zap, Sparkles } from 'lucide-react'
import { useState } from 'react'
import { TestWorkflowResponse, NodeExecution } from '@/lib/rag-studio-api'
import ExecutionStepSummary from './ExecutionStepSummary'

interface ExecutionFlowProps {
  result: TestWorkflowResponse
}

export default function ExecutionFlow({ result }: ExecutionFlowProps) {
  const [showVerboseLog, setShowVerboseLog] = useState(false)
  
  const getStatusColor = () => {
    switch (result.status) {
      case 'success':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 border-green-200 dark:border-green-800'
      case 'partial':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800'
      case 'error':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300 border-red-200 dark:border-red-800'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300 border-gray-200 dark:border-gray-800'
    }
  }
  
  return (
    <div className="glass rounded-xl p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold flex items-center gap-2 text-gray-900 dark:text-white">
          <Sparkles className="w-5 h-5 text-primary" />
          Execution Flow
        </h3>
        
        {/* Toggle Verbose Log */}
        <button
          onClick={() => setShowVerboseLog(!showVerboseLog)}
          className="text-xs px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-dark-surface hover:bg-gray-200 dark:hover:bg-dark-surface-hover transition-colors text-secondary"
        >
          {showVerboseLog ? 'Hide Details' : 'Show Details'}
        </button>
      </div>
      
      {/* Status Summary */}
      <div className={`px-4 py-3 rounded-lg mb-6 inline-flex items-center gap-3 border ${getStatusColor()}`}>
        <Clock className="w-4 h-4" />
        <div>
          <p className="font-semibold text-sm">
            Status: {result.status.toUpperCase()}
          </p>
          <p className="text-xs opacity-80 mt-0.5">
            Total time: {result.total_time.toFixed(3)}s
          </p>
        </div>
      </div>
      
      {/* Clean Step Summary (Default View) */}
      {!showVerboseLog && (
        <ExecutionStepSummary 
          execution_flow={result.execution_flow}
          status={result.status}
          total_time={result.total_time}
        />
      )}
      
      {/* Verbose Execution Nodes (Toggle View) */}
      {showVerboseLog && (
        <div className="space-y-4">
          {result.execution_flow.map((nodeExec, index) => (
            <NodeExecutionCard
              key={nodeExec.node_id}
              nodeExec={nodeExec}
              index={index}
              isLast={index === result.execution_flow.length - 1}
            />
          ))}
        </div>
      )}
      
      {/* Final Output */}
      {result.status === 'success' && result.final_output && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-6 p-6 bg-green-50 dark:bg-green-900/20 rounded-xl border-2 border-green-200 dark:border-green-800"
        >
          <h4 className="font-semibold text-green-800 dark:text-green-300 mb-3 flex items-center gap-2">
            <Check className="w-5 h-5" />
            Final Output:
          </h4>
          <pre className="text-sm whitespace-pre-wrap text-green-900 dark:text-green-50 bg-white dark:bg-dark-surface p-4 rounded-lg overflow-x-auto">
            {JSON.stringify(result.final_output, null, 2)}
          </pre>
        </motion.div>
      )}
    </div>
  )
}

interface NodeExecutionCardProps {
  nodeExec: NodeExecution
  index: number
  isLast: boolean
}

function NodeExecutionCard({ nodeExec, index, isLast }: NodeExecutionCardProps) {
  const [expanded, setExpanded] = useState(index < 2) // Auto-expand first 2 nodes
  
  const isSuccess = nodeExec.status === 'success'
  const isError = nodeExec.status === 'error'
  
  return (
    <>
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: index * 0.1 }}
        className={`
          p-4 rounded-xl border-2 transition-all
          ${isSuccess 
            ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' 
            : ''
          }
          ${isError 
            ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800' 
            : ''
          }
          ${!isSuccess && !isError 
            ? 'bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700' 
            : ''
          }
        `}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between cursor-pointer"
          onClick={() => setExpanded(!expanded)}
        >
          <div className="flex items-center gap-3 flex-1">
            <div className={`
              w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0
              ${isSuccess ? 'bg-green-500' : ''}
              ${isError ? 'bg-red-500' : ''}
              ${!isSuccess && !isError ? 'bg-gray-400' : ''}
            `}>
              {isSuccess && <Check className="w-4 h-4 text-white" />}
              {isError && <X className="w-4 h-4 text-white" />}
              {!isSuccess && !isError && <span className="text-white text-xs font-bold">{index + 1}</span>}
            </div>
            
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-gray-900 dark:text-white">{nodeExec.node_name}</h4>
              <p className="text-xs text-secondary uppercase tracking-wide">{nodeExec.node_type}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <span className="text-xs text-secondary font-mono">
              {(nodeExec.processing_time * 1000).toFixed(1)}ms
            </span>
            {expanded ? (
              <ChevronUp className="w-4 h-4 text-gray-400" />
            ) : (
              <ChevronDown className="w-4 h-4 text-gray-400" />
            )}
          </div>
        </div>
        
        {/* Details */}
        {expanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-4 space-y-3"
          >
            {/* Input */}
            <div>
              <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Input:</p>
              <pre className="text-xs bg-white dark:bg-dark-surface p-3 rounded border border-gray-200 dark:border-dark-border overflow-x-auto">
                {JSON.stringify(nodeExec.input, null, 2)}
              </pre>
            </div>
            
            {/* Output */}
            {nodeExec.output && (
              <div>
                <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Output:</p>
                <pre className="text-xs bg-white dark:bg-dark-surface p-3 rounded border border-gray-200 dark:border-dark-border overflow-x-auto">
                  {JSON.stringify(nodeExec.output, null, 2)}
                </pre>
              </div>
            )}
            
            {/* Error */}
            {nodeExec.error && (
              <div className="text-red-600 dark:text-red-400 text-sm bg-red-50 dark:bg-red-900/20 p-3 rounded border border-red-200 dark:border-red-800">
                <p className="font-semibold mb-1">Error:</p>
                <p>{nodeExec.error}</p>
              </div>
            )}
          </motion.div>
        )}
      </motion.div>
      
      {/* Connection arrow to next node */}
      {!isLast && (
        <div className="flex justify-center my-2">
          <div className="text-2xl text-gray-400 dark:text-gray-600">↓</div>
        </div>
      )}
    </>
  )
}
