import { create } from 'zustand'
import { Workflow, getWorkflows, getWorkflow, batchUpdatePositions, deleteConnection, getAllWorkflows, createWorkflow, deleteWorkflow } from '@/lib/rag-studio-api'
import toast from 'react-hot-toast'

interface RAGStudioStore {
  // State
  workflows: Record<string, Workflow>
  allWorkflows: Workflow[]
  currentWorkflow: Workflow | null
  loading: boolean
  error: string | null
  hasUnsavedChanges: boolean
  
  // Actions
  loadWorkflows: () => Promise<void>
  loadAllWorkflows: () => Promise<void>
  loadWorkflow: (mode: 'flash' | 'pro' | 'code_rag') => Promise<void>
  loadWorkflowById: (workflowId: string) => Promise<void>
  setCurrentWorkflow: (workflow: Workflow | null) => void
  resetWorkflow: (mode: 'flash' | 'pro' | 'code_rag') => Promise<void>
  saveNodePositions: (positions: Array<{ node_id: string; position_x: number; position_y: number }>) => Promise<boolean>
  setHasUnsavedChanges: (value: boolean) => void
  removeConnection: (connectionId: string) => Promise<boolean>
  createNewWorkflow: (data: { name: string; description?: string; mode: string }) => Promise<string | null>
  deleteWorkflowById: (workflowId: string) => Promise<boolean>
}

export const useRAGStudioStore = create<RAGStudioStore>((set, get) => ({
  workflows: {},
  allWorkflows: [],
  currentWorkflow: null,
  loading: false,
  error: null,
  hasUnsavedChanges: false,
  
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
  
  loadAllWorkflows: async () => {
    set({ loading: true, error: null })
    
    try {
      const result = await getAllWorkflows()
      
      if (result.success && result.workflows) {
        set({ allWorkflows: result.workflows, loading: false })
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
        set({ currentWorkflow: result.workflow, loading: false, hasUnsavedChanges: false })
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
  
  loadWorkflowById: async (workflowId: string) => {
    set({ loading: true, error: null })
    
    try {
      console.log('[RAG Studio] Loading workflow by ID:', workflowId)
      
      const result = await getWorkflow(workflowId)
      
      if (result.success && result.workflow) {
        console.log('[RAG Studio] Workflow loaded:', result.workflow)
        set({ currentWorkflow: result.workflow, loading: false, hasUnsavedChanges: false })
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
  },
  
  saveNodePositions: async (positions: Array<{ node_id: string; position_x: number; position_y: number }>) => {
    const workflow = get().currentWorkflow
    if (!workflow) {
      toast.error('No workflow loaded')
      return false
    }
    
    try {
      const result = await batchUpdatePositions(workflow.id, positions)
      
      if (result.success) {
        set({ hasUnsavedChanges: false })
        return true
      } else {
        toast.error('Failed to save positions: ' + (result.error || 'Unknown error'))
        return false
      }
    } catch (error) {
      console.error('Failed to save node positions:', error)
      toast.error('Failed to save positions')
      return false
    }
  },
  
  setHasUnsavedChanges: (value: boolean) => {
    set({ hasUnsavedChanges: value })
  },
  
  removeConnection: async (connectionId: string) => {
    const workflow = get().currentWorkflow
    if (!workflow) {
      toast.error('No workflow loaded')
      return false
    }
    
    try {
      const result = await deleteConnection(workflow.id, connectionId)
      
      if (result.success) {
        toast.success('Connection deleted')
        return true
      } else {
        toast.error('Failed to delete connection: ' + (result.error || 'Unknown error'))
        return false
      }
    } catch (error) {
      console.error('Failed to delete connection:', error)
      toast.error('Failed to delete connection')
      return false
    }
  },
  
  createNewWorkflow: async (data: { name: string; description?: string; mode: string }) => {
    set({ loading: true, error: null })
    
    try {
      const result = await createWorkflow(data)
      
      if (result.success && result.workflow) {
        toast.success('Workflow created successfully!')
        // Force reload all workflows to update selector
        const reloadResult = await getAllWorkflows()
        if (reloadResult.success && reloadResult.workflows) {
          set({ allWorkflows: reloadResult.workflows, loading: false })
        } else {
          set({ loading: false })
        }
        return result.workflow.id
      } else {
        toast.error('Failed to create workflow: ' + (result.error || 'Unknown error'))
        set({ loading: false })
        return null
      }
    } catch (error) {
      console.error('Failed to create workflow:', error)
      toast.error('Failed to create workflow')
      set({ loading: false })
      return null
    }
  },
  
  deleteWorkflowById: async (workflowId: string) => {
    try {
      const result = await deleteWorkflow(workflowId)
      
      if (result.success) {
        toast.success('Workflow deleted')
        
        // Force reload all workflows to update selector
        const reloadResult = await getAllWorkflows()
        if (reloadResult.success && reloadResult.workflows) {
          set({ allWorkflows: reloadResult.workflows })
        }
        
        // If deleted workflow was current, clear it
        if (get().currentWorkflow?.id === workflowId) {
          set({ currentWorkflow: null })
        }
        
        return true
      } else {
        toast.error('Failed to delete workflow: ' + (result.error || 'Unknown error'))
        return false
      }
    } catch (error) {
      console.error('Failed to delete workflow:', error)
      toast.error('Failed to delete workflow')
      return false
    }
  }
}))
