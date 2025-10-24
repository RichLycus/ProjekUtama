import { useState, useEffect } from 'react'
import { ArrowLeft, RotateCcw, Loader2, Edit3, Plus } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import WorkflowCanvas from '@/components/rag-studio/WorkflowCanvas'
import WorkflowSelector from '@/components/rag-studio/WorkflowSelector'
import CreateWorkflowModal from '@/components/rag-studio/CreateWorkflowModal'
import TestPanel from '@/components/rag-studio/TestPanel'
import { useRAGStudioStore } from '@/store/ragStudioStore'

type WorkflowMode = 'flash' | 'pro' | 'code_rag'

export default function RAGStudioPage() {
  const navigate = useNavigate()
  const [currentMode, setCurrentMode] = useState<WorkflowMode>('flash')
  const [showTestPanel, setShowTestPanel] = useState(false)
  const [selectedNode, setSelectedNode] = useState<string | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  
  const { 
    currentWorkflow,
    allWorkflows,
    loadWorkflow,
    loadAllWorkflows,
    loadWorkflowById,
    loading,
    resetWorkflow,
    createNewWorkflow,
    deleteWorkflowById
  } = useRAGStudioStore()
  
  // Load all workflows on mount
  useEffect(() => {
    loadAllWorkflows()
  }, [loadAllWorkflows])
  
  // Load workflow when mode changes
  useEffect(() => {
    loadWorkflow(currentMode)
  }, [currentMode, loadWorkflow])
  
  const handleBack = () => {
    // If user is in test panel, go back to workflow view
    if (showTestPanel) {
      setShowTestPanel(false)
      setSelectedNode(null)
    } else {
      // Go back to settings
      navigate('/settings')
    }
  }
  
  const handleNodeClick = (nodeId: string) => {
    setSelectedNode(nodeId)
    setShowTestPanel(true)
  }
  
  const handleReset = async () => {
    if (confirm('Reset workflow to default? This cannot be undone.')) {
      await resetWorkflow(currentMode)
    }
  }
  
  const handleEditWorkflow = () => {
    // Navigate to visual editor
    navigate(`/rag-studio/editor/${currentMode}`)
  }
  
  const handleCreateWorkflow = async (data: {
    name: string
    description: string
    mode: string
  }) => {
    const workflowId = await createNewWorkflow(data)
    if (workflowId) {
      // Reload all workflows to update the selector
      await loadAllWorkflows()
      // Load the newly created workflow
      await loadWorkflowById(workflowId)
    }
  }
  
  const handleSelectWorkflow = (workflowId: string) => {
    loadWorkflowById(workflowId)
  }
  
  const handleDeleteWorkflow = async (workflowId: string) => {
    await deleteWorkflowById(workflowId)
  }
  
  return (
    <div className="h-[calc(100vh-5.5rem)] flex flex-col bg-gray-50 dark:bg-dark-surface">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-dark-border bg-white dark:bg-dark-surface">
        <button
          onClick={handleBack}
          className="flex items-center gap-2 px-4 py-2 hover:bg-gray-100 dark:hover:bg-dark-surface-hover rounded-lg transition-colors text-gray-700 dark:text-gray-300"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back</span>
        </button>
        
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
            <span className="text-2xl">🎨</span>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">RAG Studio</h1>
            <p className="text-sm text-secondary">Visual Workflow Management</p>
          </div>
        </div>
        
        <div className="flex gap-2">
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Create Workflow</span>
          </button>
          <button
            onClick={handleEditWorkflow}
            disabled={loading || !currentWorkflow}
            className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-secondary text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Edit3 className="w-4 h-4" />
            <span>Edit Workflow</span>
          </button>
          <button
            onClick={handleReset}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 hover:bg-gray-100 dark:hover:bg-dark-surface-hover rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-gray-700 dark:text-gray-300"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Reset</span>
          </button>
        </div>
      </div>
      
      {/* Workflow Selector */}
      {!showTestPanel && (
        <div className="border-b border-gray-200 dark:border-dark-border bg-white dark:bg-dark-surface">
          <div className="p-4 flex items-center gap-3">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Select Workflow:
            </span>
            <WorkflowSelector
              workflows={allWorkflows}
              currentWorkflowId={currentWorkflow?.id || null}
              onSelect={handleSelectWorkflow}
              onDelete={handleDeleteWorkflow}
              loading={loading}
            />
          </div>
        </div>
      )}
      
      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        {loading ? (
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
              <p className="text-secondary">Loading workflow...</p>
            </div>
          </div>
        ) : showTestPanel && currentWorkflow ? (
          <TestPanel
            workflowId={currentWorkflow.id}
            stopAtNode={selectedNode}
            onBack={() => {
              setShowTestPanel(false)
              setSelectedNode(null)
            }}
          />
        ) : currentWorkflow ? (
          <WorkflowCanvas
            workflow={currentWorkflow}
            onNodeClick={handleNodeClick}
          />
        ) : (
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <p className="text-secondary mb-4">No workflow available</p>
              <button
                onClick={() => loadWorkflow(currentMode)}
                className="px-4 py-2 bg-primary hover:bg-secondary text-white rounded-lg transition-colors"
              >
                Reload Workflow
              </button>
            </div>
          </div>
        )}
      </div>
      
      {/* Create Workflow Modal */}
      <CreateWorkflowModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreate={handleCreateWorkflow}
      />
    </div>
  )
}
