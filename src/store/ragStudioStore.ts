import { create } from 'zustand'
import { Workflow, getWorkflows, getWorkflow } from '@/lib/rag-studio-api'
import toast from 'react-hot-toast'

interface RAGStudioStore {
  // State
  workflows: Record<string, Workflow>
  currentWorkflow: Workflow | null
  loading: boolean
  error: string | null
  
  // Actions
  loadWorkflows: () => Promise<void>
  loadWorkflow: (mode: 'flash' | 'pro' | 'code_rag') => Promise<void>
  setCurrentWorkflow: (workflow: Workflow | null) => void
  resetWorkflow: (mode: 'flash' | 'pro' | 'code_rag') => Promise<void>
}

export const useRAGStudioStore = create<RAGStudioStore>((set, get) => ({
  workflows: {},
  currentWorkflow: null,
  loading: false,
  error: null,
  
  loadWorkflows: async () => {
    set({ loading: true, error: null })
    
    try {
      const result = await getWorkflows()
      
      if (result.success && result.workflows) {
        set({ workflows: result.workflows, loading: false })
      } else {
        set({ error: result.error || 'Failed to load workflows', loading: false })
        toast.error('Failed to load workflows')
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error'
      set({ error: errorMsg, loading: false })
      toast.error('Failed to load workflows')
    }
  },
  
  loadWorkflow: async (mode: 'flash' | 'pro' | 'code_rag') => {
    set({ loading: true, error: null })
    
    try {
      // Determine workflow ID based on mode
      const workflowIds = {
        flash: 'wf_flash_v1',
        pro: 'wf_pro_v1',
        code_rag: 'wf_code_v1'
      }
      
      const workflowId = workflowIds[mode]
      console.log('[RAG Studio] Loading workflow:', workflowId)
      
      const result = await getWorkflow(workflowId)
      
      console.log('[RAG Studio] API Result:', result)
      
      if (result.success && result.workflow) {
        console.log('[RAG Studio] Workflow loaded:', result.workflow)
        console.log('[RAG Studio] Nodes:', result.workflow.nodes)
        set({ currentWorkflow: result.workflow, loading: false })
      } else {
        const errorMsg = result.error || 'Failed to load workflow'
        console.error('[RAG Studio] Error:', errorMsg)
        set({ error: errorMsg, loading: false })
        toast.error('Failed to load workflow: ' + errorMsg)
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error'
      console.error('[RAG Studio] Exception:', error)
      set({ error: errorMsg, loading: false })
      toast.error('Failed to load workflow')
    }
  },
  
  setCurrentWorkflow: (workflow: Workflow | null) => {
    set({ currentWorkflow: workflow })
  },
  
  resetWorkflow: async (mode: 'flash' | 'pro' | 'code_rag') => {
    // Reload the default workflow for the mode
    await get().loadWorkflow(mode)
    toast.success('Workflow reset to default')
  }
}))
