/**
 * RAG Studio API Functions
 * Handles all API calls related to RAG Studio workflow management
 */

import { BACKEND_URL } from './backend'

// Types
export interface Workflow {
  id: string
  mode: 'flash' | 'pro' | 'code_rag'
  name: string
  description: string
  version: number
  is_active: boolean
  created_at: string
  updated_at: string
  nodes: WorkflowNode[]
  connections: WorkflowConnection[]
}

export interface WorkflowNode {
  id: string
  workflow_id: string
  node_type: 'input' | 'router' | 'rag_retriever' | 'llm' | 'output'
  node_name: string
  position: number
  config: string | Record<string, any>
  is_enabled: boolean
  created_at: string
}

export interface WorkflowConnection {
  id: string
  workflow_id: string
  from_node_id: string
  to_node_id: string
  condition: string | null
  created_at: string
}

export interface TestWorkflowRequest {
  workflow_id: string
  test_input: string
  stop_at_node?: string | null
}

export interface NodeExecution {
  node_id: string
  node_name: string
  node_type: string
  input: any
  output: any
  processing_time: number
  status: 'success' | 'error'
  error?: string
}

export interface TestWorkflowResponse {
  success: boolean
  execution_id: string
  workflow_id: string
  status: 'success' | 'partial' | 'error'
  execution_flow: NodeExecution[]
  final_output: any
  total_time: number
  error_message?: string
}

// API Functions

/**
 * Get all workflows grouped by mode
 */
export async function getWorkflows(): Promise<{ success: boolean; workflows?: Record<string, Workflow>; error?: string }> {
  try {
    const response = await fetch(`${BACKEND_URL}/api/rag-studio/workflows`)
    const data = await response.json()
    return { success: true, workflows: data }
  } catch (error) {
    console.error('Failed to fetch workflows:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

/**
 * Get specific workflow with nodes and connections
 */
export async function getWorkflow(workflowId: string): Promise<{ success: boolean; workflow?: Workflow; error?: string }> {
  try {
    const response = await fetch(`${BACKEND_URL}/api/rag-studio/workflows/${workflowId}`)
    const data = await response.json()
    
    if (!response.ok) {
      return { success: false, error: data.message || 'Failed to fetch workflow' }
    }
    
    // Backend returns structure: { success, workflow, nodes, connections }
    // We need to merge nodes and connections into workflow object
    let workflow = data.workflow || data
    
    // If nodes and connections are at root level, move them into workflow
    if (data.nodes && Array.isArray(data.nodes)) {
      workflow.nodes = data.nodes
    }
    if (data.connections && Array.isArray(data.connections)) {
      workflow.connections = data.connections
    }
    
    // Ensure nodes and connections are arrays
    workflow.nodes = Array.isArray(workflow.nodes) ? workflow.nodes : []
    workflow.connections = Array.isArray(workflow.connections) ? workflow.connections : []
    
    console.log('[API] Workflow after parsing:', workflow)
    console.log('[API] Nodes count:', workflow.nodes.length)
    
    return { success: true, workflow: workflow }
  } catch (error) {
    console.error('Failed to fetch workflow:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

/**
 * Test workflow execution
 */
export async function testWorkflow(request: TestWorkflowRequest): Promise<TestWorkflowResponse> {
  try {
    const response = await fetch(`${BACKEND_URL}/api/rag-studio/test`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(request)
    })
    
    const data = await response.json()
    
    if (!response.ok) {
      return {
        success: false,
        execution_id: '',
        workflow_id: request.workflow_id,
        status: 'error',
        execution_flow: [],
        final_output: null,
        total_time: 0,
        error_message: data.message || 'Test execution failed'
      }
    }
    
    return data
  } catch (error) {
    console.error('Failed to test workflow:', error)
    return {
      success: false,
      execution_id: '',
      workflow_id: request.workflow_id,
      status: 'error',
      execution_flow: [],
      final_output: null,
      total_time: 0,
      error_message: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Update node configuration
 */
export async function updateNode(workflowId: string, nodeId: string, config: Record<string, any>): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch(`${BACKEND_URL}/api/rag-studio/workflows/${workflowId}/nodes/${nodeId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ config })
    })
    
    const data = await response.json()
    
    if (!response.ok) {
      return { success: false, error: data.message || 'Failed to update node' }
    }
    
    return { success: true }
  } catch (error) {
    console.error('Failed to update node:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

/**
 * Get test results for a workflow
 */
export async function getTestResults(workflowId: string, limit = 10): Promise<{ success: boolean; results?: any[]; error?: string }> {
  try {
    const response = await fetch(`${BACKEND_URL}/api/rag-studio/workflows/${workflowId}/tests?limit=${limit}`)
    const data = await response.json()
    
    if (!response.ok) {
      return { success: false, error: data.message || 'Failed to fetch test results' }
    }
    
    return { success: true, results: data.results || [] }
  } catch (error) {
    console.error('Failed to fetch test results:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

/**
 * Update single node position
 */
export async function updateNodePosition(
  workflowId: string, 
  nodeId: string, 
  position: { x: number; y: number }
): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch(`${BACKEND_URL}/api/rag-studio/workflows/${workflowId}/nodes/${nodeId}/position`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ position_x: position.x, position_y: position.y })
    })
    
    const data = await response.json()
    
    if (!response.ok) {
      return { success: false, error: data.message || 'Failed to update node position' }
    }
    
    return { success: true }
  } catch (error) {
    console.error('Failed to update node position:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

/**
 * Batch update node positions
 */
export async function batchUpdatePositions(
  workflowId: string,
  positions: Array<{ node_id: string; position_x: number; position_y: number }>
): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch(`${BACKEND_URL}/api/rag-studio/workflows/${workflowId}/batch-positions`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ updates: positions })
    })
    
    const data = await response.json()
    
    if (!response.ok) {
      return { success: false, error: data.message || 'Failed to batch update positions' }
    }
    
    return { success: true }
  } catch (error) {
    console.error('Failed to batch update positions:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

/**
 * Delete a connection between nodes
 */
export async function deleteConnection(
  workflowId: string,
  connectionId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch(`${BACKEND_URL}/api/rag-studio/workflows/${workflowId}/connections/${connectionId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json'
      }
    })
    
    const data = await response.json()
    
    if (!response.ok) {
      return { success: false, error: data.message || 'Failed to delete connection' }
    }
    
    return { success: true }
  } catch (error) {
    console.error('Failed to delete connection:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

/**
 * Trigger auto-layout for workflow
 */
export async function autoLayoutWorkflow(
  workflowId: string,
  layoutType: 'vertical' | 'horizontal' = 'vertical'
): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch(`${BACKEND_URL}/api/rag-studio/workflows/${workflowId}/auto-layout?layout_type=${layoutType}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    })
    
    const data = await response.json()
    
    if (!response.ok) {
      return { success: false, error: data.message || 'Failed to auto-layout workflow' }
    }
    
    return { success: true }
  } catch (error) {
    console.error('Failed to auto-layout workflow:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}
