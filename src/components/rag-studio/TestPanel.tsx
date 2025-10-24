import { useState } from 'react'
import { motion } from 'framer-motion'
import { ArrowLeft, Play, Loader2, AlertCircle } from 'lucide-react'
import { testWorkflow, TestWorkflowResponse } from '@/lib/rag-studio-api'
import ExecutionFlow from './ExecutionFlow'
import toast from 'react-hot-toast'

interface TestPanelProps {
  workflowId: string
  stopAtNode: string | null
  onBack: () => void
}

export default function TestPanel({ workflowId, stopAtNode, onBack }: TestPanelProps) {
  const [testInput, setTestInput] = useState('')
  const [isRunning, setIsRunning] = useState(false)
  const [result, setResult] = useState<TestWorkflowResponse | null>(null)
  
  const handleRunTest = async () => {
    if (!testInput.trim()) {
      toast.error('Please enter test input')
      return
    }
    
    setIsRunning(true)
    setResult(null)
    
    try {
      const response = await testWorkflow({
        workflow_id: workflowId,
        test_input: testInput,
        stop_at_node: stopAtNode === 'all' ? null : stopAtNode
      })
      
      setResult(response)
      
      if (response.success) {
        toast.success('Test completed successfully!')
      } else {
        toast.error('Test execution failed')
      }
    } catch (error) {
      toast.error('Test failed: ' + (error instanceof Error ? error.message : 'Unknown error'))
    } finally {
      setIsRunning(false)
    }
  }
  
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && e.ctrlKey && !isRunning) {
      handleRunTest()
    }
  }
  
  return (
    <div className="h-full flex flex-col bg-white dark:bg-dark-surface">
      {/* Header */}
      <div className="flex items-center gap-4 p-6 border-b border-gray-200 dark:border-dark-border">
        <button
          onClick={onBack}
          className="p-2 hover:bg-gray-100 dark:hover:bg-dark-surface-hover rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Testing Workflow
          </h2>
          <p className="text-sm text-secondary mt-1">
            {stopAtNode === 'all' 
              ? 'Complete workflow execution'
              : 'Partial execution (stop at selected node)'
            }
          </p>
        </div>
      </div>
      
      {/* Content */}
      <div className="flex-1 overflow-auto custom-scrollbar p-6">
        {/* Input Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 glass rounded-xl p-6"
        >
          <label className="block text-sm font-medium mb-3 text-gray-900 dark:text-white">
            Test Input:
          </label>
          <textarea
            value={testInput}
            onChange={(e) => setTestInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type your test message here...\n\nTip: Press Ctrl+Enter to run test"
            className="w-full p-4 rounded-lg border border-gray-300 dark:border-dark-border bg-white dark:bg-dark-surface-hover text-gray-900 dark:text-white min-h-[120px] resize-y focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            disabled={isRunning}
          />
          
          <div className="flex items-center justify-between mt-4">
            <p className="text-xs text-secondary">
              {testInput.length} characters
            </p>
            
            <button
              onClick={handleRunTest}
              disabled={isRunning || !testInput.trim()}
              className="flex items-center gap-2 px-6 py-3 bg-primary hover:bg-secondary text-white rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md"
            >
              {isRunning ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Running Test...
                </>
              ) : (
                <>
                  <Play className="w-5 h-5" />
                  Run Test
                </>
              )}
            </button>
          </div>
        </motion.div>
        
        {/* Results Section */}
        {result && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <ExecutionFlow result={result} />
          </motion.div>
        )}
        
        {/* Error State */}
        {result && !result.success && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6 p-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl"
          >
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-red-800 dark:text-red-300 mb-1">Test Execution Failed</h4>
                <p className="text-sm text-red-700 dark:text-red-400">
                  {result.error_message || 'Unknown error occurred'}
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  )
}
