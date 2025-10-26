import { create } from 'zustand'
import { Workflow, getWorkflows, getWorkflow, batchUpdatePositions, deleteConnection, getAllWorkflows, createWorkflow, deleteWorkflow, updateNode, getAvailableFlows, getFlowConfig, type FlowInfo } from '@/lib/rag-studio-api'
import toast from 'react-hot-toast'

interface RAGStudioStore {
  // State
  workflows: Record<string, Workflow>
  allWorkflows: Workflow[]
  availableFlows: FlowInfo[]  // NEW: Available flows from flows/ directory
  currentWorkflow: Workflow | null
  currentFlowConfig: any | null  // NEW: Current flow config from JSON
  loading: boolean
  error: string | null
  hasUnsavedChanges: boolean
  
  // Actions
  loadWorkflows: () => Promise<void>
  loadAllWorkflows: () => Promise<void>
  loadAvailableFlows: () => Promise<void>  // NEW: Load flows from flows/ directory
  loadWorkflow: (mode: 'flash' | 'pro' | 'code_rag') => Promise<void>
  loadWorkflowById: (workflowId: string) => Promise<void>
  loadFlowByMode: (mode: string) => Promise<void>  // NEW: Load flow config from JSON
  setCurrentWorkflow: (workflow: Workflow | null) => void
  resetWorkflow: (mode: 'flash' | 'pro' | 'code_rag') => Promise<void>
  saveNodePositions: (positions: Array<{ node_id: string; position_x: number; position_y: number }>) => Promise<boolean>
  setHasUnsavedChanges: (value: boolean) => void
  removeConnection: (connectionId: string) => Promise<boolean>
  createNewWorkflow: (data: { name: string; description?: string; mode: string }) => Promise<string | null>
  deleteWorkflowById: (workflowId: string) => Promise<boolean>
  updateNodeConfig: (nodeId: string, config: any) => Promise<boolean>
}

export const useRAGStudioStore = create<RAGStudioStore>((set, get) => ({
  workflows: {},
  allWorkflows: [],
  availableFlows: [],
  currentWorkflow: null,
  currentFlowConfig: null,
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
  
  // NEW: Load available flows from flows/ directory
  loadAvailableFlows: async () => {
    set({ loading: true, error: null })
    
    try {
      const result = await getAvailableFlows()
      
      if (result.success && result.flows) {
        set({ availableFlows: result.flows, loading: false })
        console.log('[RAG Studio] Available flows loaded:', result.flows)
      } else {
        set({ error: result.error || 'Failed to load available flows', loading: false })
        toast.error('Failed to load available flows')
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error'
      set({ error: errorMsg, loading: false })
      toast.error('Failed to load available flows')
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
  
  // NEW: Load flow config from JSON file (flows/ directory)
  loadFlowByMode: async (mode: string) => {
    set({ loading: true, error: null })
    
    try {
      console.log('[RAG Studio] Loading flow config for mode:', mode)
      
      // Get available flows to find the matching one
      const flowsResult = await getAvailableFlows()
      
      if (flowsResult.success && flowsResult.flows) {
        // Find matching flow by category
        const matchingFlow = flowsResult.flows.find(f => f.category === mode)
        
        if (matchingFlow) {
          console.log('[RAG Studio] Found matching flow:', matchingFlow)
          
          // Extract flow filename without extension
          const flowFileName = matchingFlow.file_path.split('/').pop()?.replace('.json', '') || 'base'
          
          // Get detailed flow config
          const configResult = await getFlowConfig(mode, flowFileName)
          
          if (configResult.success && configResult.flow_config) {
            const flowConfig = configResult.flow_config
            console.log('[RAG Studio] Flow config loaded:', flowConfig)
            
            // Convert flow config steps to workflow nodes
            const nodes = flowConfig.steps.map((step: any, index: number) => ({
              id: step.id || `step_${index}`,
              workflow_id: matchingFlow.id,
              node_type: step.agent,  // Use 'agent' field from JSON (preprocessor, llm_agent, etc.)
              node_name: step.description || step.id,  // Use description as name
              position: index,
              position_x: 100,  // Default position
              position_y: 100 + (index * 120),  // Vertical spacing
              width: 200,
              height: 80,
              config: JSON.stringify(step.config || {}),
              is_enabled: true,
              created_at: new Date().toISOString()
            }))
            
            // Convert steps to connections (sequential flow)
            const connections = flowConfig.steps.slice(0, -1).map((step: any, index: number) => ({
              id: `conn_${index}`,
              workflow_id: matchingFlow.id,
              from_node_id: flowConfig.steps[index].id,
              to_node_id: flowConfig.steps[index + 1].id,
              condition: null,
              created_at: new Date().toISOString()
            }))
            
            // Create workflow object
            const workflow: Workflow = {
              id: matchingFlow.id,
              mode: mode as any,
              name: matchingFlow.name,
              description: matchingFlow.description,
              version: parseInt(matchingFlow.version) || 1,
              is_active: true,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
              nodes: nodes,
              connections: connections
            }
            
            console.log('[RAG Studio] Workflow created with', nodes.length, 'nodes')
            
            set({ 
              currentWorkflow: workflow, 
              currentFlowConfig: flowConfig,
              loading: false, 
              hasUnsavedChanges: false 
            })
          } else {
            const errorMsg = configResult.error || 'Failed to load flow config details'
            console.error('[RAG Studio] Error:', errorMsg)
            set({ error: errorMsg, loading: false })
            toast.error(errorMsg)
          }
        } else {
          const errorMsg = `No flow config found for mode: ${mode}`
          console.error('[RAG Studio] Error:', errorMsg)
          set({ error: errorMsg, loading: false })
          toast.error(errorMsg)
        }
      } else {
        const errorMsg = flowsResult.error || 'Failed to load flow configs'
        console.error('[RAG Studio] Error:', errorMsg)
        set({ error: errorMsg, loading: false })
        toast.error(errorMsg)
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error'
      console.error('[RAG Studio] Exception:', error)
      set({ error: errorMsg, loading: false })
      toast.error('Failed to load flow config')
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
  },
  
  updateNodeConfig: async (nodeId: string, config: any) => {
    const workflow = get().currentWorkflow
    if (!workflow) {
      toast.error('No workflow loaded')
      return false
    }
    
    try {
      // Send all node updates including node_name and is_enabled
      const result = await updateNode(workflow.id, nodeId, {
        node_name: config.nodeName,
        config: config.config,
        is_enabled: config.isEnabled
      })
      
      if (result.success) {
        toast.success('Node configuration saved')
        // Reload workflow to get updated node
        await get().loadWorkflowById(workflow.id)
        return true
      } else {
        toast.error('Failed to save node: ' + (result.error || 'Unknown error'))
        return false
      }
    } catch (error) {
      console.error('Failed to update node:', error)
      toast.error('Failed to save node')
      return false
    }
  }
}))
