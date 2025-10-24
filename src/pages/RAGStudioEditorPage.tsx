import { useEffect } from 'react'
import { ArrowLeft } from 'lucide-react'
import { useNavigate, useParams } from 'react-router-dom'
import { ReactFlowProvider } from 'reactflow'
import WorkflowEditor from '@/components/rag-studio/editor/WorkflowEditor'
import { useRAGStudioStore } from '@/store/ragStudioStore'
import { Node, Edge } from 'reactflow'

type WorkflowMode = 'flash' | 'pro' | 'code_rag'

export default function RAGStudioEditorPage() {
  const navigate = useNavigate()
  const { mode } = useParams<{ mode: WorkflowMode }>()
  
  const { 
    currentWorkflow, 
    loadWorkflow, 
    loading,
    hasUnsavedChanges,
    setHasUnsavedChanges
  } = useRAGStudioStore()
  
  // Load workflow when mode changes
  useEffect(() => {
    if (mode) {
      loadWorkflow(mode as WorkflowMode)
    }
  }, [mode, loadWorkflow])
  
  // Warn before leaving with unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault()
        e.returnValue = ''
      }
    }
    
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [hasUnsavedChanges])
  
  const handleBack = () => {
    if (hasUnsavedChanges) {
      if (confirm('You have unsaved changes. Are you sure you want to leave?')) {
        setHasUnsavedChanges(false)
        navigate('/rag-studio')
      }
    } else {
      navigate('/rag-studio')
    }
  }
  
  
  const handleNodesChange = (_nodes: Node[]) => {
    // Position changes are handled by WorkflowEditor
  }
  
  const handleEdgesChange = (_edges: Edge[]) => {
    // Edge changes are handled by WorkflowEditor
  }
  
  const getModeName = (mode?: string) => {
    const names = {
      flash: 'Flash Mode',
      pro: 'Pro Mode',
      code_rag: 'Code RAG Mode'
    }
    return names[mode as keyof typeof names] || 'Unknown Mode'
  }
  
  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50 dark:bg-dark-surface">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-secondary">Loading workflow editor...</p>
        </div>
      </div>
    )
  }
  
  if (!currentWorkflow) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50 dark:bg-dark-surface">
        <div className="text-center">
          <p className="text-secondary mb-4">No workflow available</p>
          <button
            onClick={() => navigate('/rag-studio')}
            className="px-4 py-2 bg-primary hover:bg-secondary text-white rounded-lg transition-colors"
          >
            Back to RAG Studio
          </button>
        </div>
      </div>
    )
  }
  
  return (
    <ReactFlowProvider>
      <div className="h-screen flex flex-col bg-gray-50 dark:bg-dark-surface">
      {/* Header Toolbar */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-dark-border bg-white dark:bg-dark-card shadow-sm">
        {/* Left: Back Button */}
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
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">
              {currentWorkflow.name}
            </h1>
            <p className="text-sm text-secondary">
              {getModeName(mode)} • Visual Editor
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          {hasUnsavedChanges && (
            <div className="flex items-center gap-2 text-sm text-amber-600 dark:text-amber-400">
              <div className="w-2 h-2 rounded-full bg-amber-600 dark:bg-amber-400 animate-pulse" />
              <span>Auto-saving...</span>
            </div>
          )}
          <div className="w-24">
            {/* Spacer for alignment */}
          </div>
        </div>
      </div>
      
        {/* Editor Canvas */}
        <div className="flex-1 overflow-hidden">
          <WorkflowEditor
            workflow={currentWorkflow}
            onNodesChange={handleNodesChange}
            onEdgesChange={handleEdgesChange}
          />
        </div>
      </div>
    </ReactFlowProvider>
  )
}
