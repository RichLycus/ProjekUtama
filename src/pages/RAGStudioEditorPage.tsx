import { useState, useEffect } from 'react'
import { ArrowLeft, Play, Save } from 'lucide-react'
import { useNavigate, useParams } from 'react-router-dom'
import WorkflowEditor from '@/components/rag-studio/editor/WorkflowEditor'
import { useRAGStudioStore } from '@/store/ragStudioStore'
import toast from 'react-hot-toast'
import { Node, Edge } from 'reactflow'

type WorkflowMode = 'flash' | 'pro' | 'code_rag'

export default function RAGStudioEditorPage() {
  const navigate = useNavigate()
  const { mode } = useParams<{ mode: WorkflowMode }>()
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  
  const { 
    currentWorkflow, 
    loadWorkflow, 
    loading 
  } = useRAGStudioStore()
  
  // Load workflow when mode changes
  useEffect(() => {
    if (mode) {
      loadWorkflow(mode as WorkflowMode)
    }
  }, [mode, loadWorkflow])
  
  const handleBack = () => {
    if (hasUnsavedChanges) {
      if (confirm('You have unsaved changes. Are you sure you want to leave?')) {
        navigate('/rag-studio')
      }
    } else {
      navigate('/rag-studio')
    }
  }
  
  const handleSave = () => {
    // TODO: Implement save functionality in Phase 6.4
    toast.success('Save functionality coming in Phase 6.4!')
    setHasUnsavedChanges(false)
  }
  
  const handleRun = () => {
    // Navigate back to test panel
    navigate('/rag-studio')
    toast.success('Opening test panel...')
  }
  
  const handleNodesChange = (_nodes: Node[]) => {
    setHasUnsavedChanges(true)
    // TODO: Implement auto-save in Phase 6.4
  }
  
  const handleEdgesChange = (_edges: Edge[]) => {
    setHasUnsavedChanges(true)
    // TODO: Implement auto-save in Phase 6.4
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
        
        {/* Center: Title */}
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
        
        {/* Right: Action Buttons */}
        <div className="flex items-center gap-2">
          {hasUnsavedChanges && (
            <span className="text-sm text-amber-600 dark:text-amber-400 mr-2">
              Unsaved changes
            </span>
          )}
          
          <button
            onClick={handleRun}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
          >
            <Play className="w-4 h-4" />
            <span>Test</span>
          </button>
          
          <button
            onClick={handleSave}
            disabled={!hasUnsavedChanges}
            className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-secondary text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save className="w-4 h-4" />
            <span>Save</span>
          </button>
        </div>
      </div>
      
      {/* Editor Canvas */}
      <div className="flex-1 relative">
        <WorkflowEditor
          workflow={currentWorkflow}
          onNodesChange={handleNodesChange}
          onEdgesChange={handleEdgesChange}
        />
      </div>
      
      {/* Status Bar */}
      <div className="flex items-center justify-between px-6 py-2 border-t border-gray-200 dark:border-dark-border bg-white dark:bg-dark-card text-sm text-secondary">
        <div className="flex items-center gap-4">
          <span>{currentWorkflow.nodes.length} nodes</span>
          <span>•</span>
          <span>{currentWorkflow.connections.length} connections</span>
        </div>
        <div className="flex items-center gap-2">
          <span>Pan: Drag canvas</span>
          <span>•</span>
          <span>Zoom: Mouse wheel</span>
        </div>
      </div>
    </div>
  )
}
