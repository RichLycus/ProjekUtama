from fastapi import APIRouter, HTTPException, Body
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime
import uuid
import logging

from workflow_database import WorkflowDB
from ai.workflow_engine import WorkflowEngine
from ai.prompts.persona_system_prompts import build_persona_prompt_with_relationship

# Setup logging
logger = logging.getLogger(__name__)

router = APIRouter()

# Initialize workflow database
workflow_db = WorkflowDB()

# RAG system will be injected at runtime
_rag_system = None

def set_rag_system(rag_system):
    """Set RAG system instance for workflow execution"""
    global _rag_system
    _rag_system = rag_system

# ============================================
# PYDANTIC MODELS
# ============================================

class WorkflowTestRequest(BaseModel):
    workflow_id: str
    test_input: str
    stop_at_node: Optional[str] = None
    persona_id: Optional[str] = None  # Optional persona for enhanced context
    character_id: Optional[str] = None  # Optional user character for relationship context
    conversation_id: Optional[str] = None  # Optional conversation for history context
    mode: Optional[str] = None  # NEW: flash or pro mode selection

class NodeCreate(BaseModel):
    workflow_id: str
    node_type: str
    node_name: str
    position: int
    config: Optional[Dict[str, Any]] = None
    is_enabled: bool = True

class NodeUpdate(BaseModel):
    node_name: Optional[str] = None
    position: Optional[int] = None
    config: Optional[Dict[str, Any]] = None
    is_enabled: Optional[bool] = None

class ConnectionCreate(BaseModel):
    workflow_id: str
    from_node_id: str
    to_node_id: str
    condition: Optional[Dict[str, Any]] = None

class NodePositionUpdate(BaseModel):
    position_x: float
    position_y: float
    width: Optional[float] = None
    height: Optional[float] = None

class BatchPositionUpdate(BaseModel):
    node_id: str
    position_x: float
    position_y: float
    width: Optional[float] = None
    height: Optional[float] = None

class BatchPositionRequest(BaseModel):
    updates: List[BatchPositionUpdate]

class WorkflowCreate(BaseModel):
    mode: str
    name: str
    description: Optional[str] = None
    version: int = 1

class WorkflowUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    is_active: Optional[bool] = None

class FlowConfigStep(BaseModel):
    id: str
    agent: str
    description: str
    config: Dict[str, Any]
    condition: Optional[Dict[str, Any]] = None
    timeout: int
    critical: bool

class FlowConfigUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    steps: Optional[List[FlowConfigStep]] = None
    config: Optional[Dict[str, Any]] = None
    error_handling: Optional[Dict[str, Any]] = None
    optimization: Optional[Dict[str, Any]] = None

# ============================================
# WORKFLOW ENDPOINTS
# ============================================

@router.get("/api/rag-studio/workflows")
async def get_workflows(mode: Optional[str] = None):
    """
    Get all RAG workflows, optionally filtered by mode
    
    Query params:
    - mode: Filter by workflow mode (flash, pro, code_rag)
    
    Returns: List of workflows grouped by mode
    """
    try:
        workflows = workflow_db.get_workflows(mode=mode)
        
        # Group by mode if no filter
        if not mode:
            grouped = {
                'flash': [w for w in workflows if w['mode'] == 'flash'],
                'pro': [w for w in workflows if w['mode'] == 'pro'],
                'code_rag': [w for w in workflows if w['mode'] == 'code_rag']
            }
            return {
                "success": True,
                "workflows": grouped,
                "count": len(workflows)
            }
        
        return {
            "success": True,
            "workflows": workflows,
            "count": len(workflows)
        }
    except Exception as e:
        logger.error(f"Error fetching workflows: {str(e)}")
        raise HTTPException(500, f"Failed to fetch workflows: {str(e)}")


@router.get("/api/rag-studio/workflows/{workflow_id}")
async def get_workflow(workflow_id: str):
    """
    Get specific workflow with nodes and connections
    
    Returns: Complete workflow structure with all nodes and connections
    """
    try:
        workflow = workflow_db.get_workflow_with_nodes(workflow_id)
        
        if not workflow:
            raise HTTPException(404, f"Workflow not found: {workflow_id}")
        
        return {
            "success": True,
            "workflow": workflow
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching workflow {workflow_id}: {str(e)}")
        raise HTTPException(500, f"Failed to fetch workflow: {str(e)}")


@router.post("/api/rag-studio/workflows")
async def create_workflow(workflow_data: WorkflowCreate):
    """
    Create a new workflow
    
    Request body:
    {
        "mode": "flash" | "pro" | "code_rag",
        "name": "My Custom Workflow",
        "description": "Description here",
        "version": 1
    }
    """
    try:
        workflow_id = f"wf_{workflow_data.mode}_{uuid.uuid4().hex[:8]}"
        now = datetime.now().isoformat()
        
        workflow = {
            'id': workflow_id,
            'mode': workflow_data.mode,
            'name': workflow_data.name,
            'description': workflow_data.description,
            'version': workflow_data.version,
            'is_active': 1,
            'created_at': now,
            'updated_at': now
        }
        
        workflow_db.insert_workflow(workflow)
        
        return {
            "success": True,
            "workflow_id": workflow_id,
            "workflow": workflow
        }
    except Exception as e:
        logger.error(f"Error creating workflow: {str(e)}")
        raise HTTPException(500, f"Failed to create workflow: {str(e)}")


@router.put("/api/rag-studio/workflows/{workflow_id}")
async def update_workflow(workflow_id: str, updates: WorkflowUpdate):
    """
    Update a workflow
    
    Request body:
    {
        "name": "New Name",
        "description": "New Description",
        "is_active": true
    }
    """
    try:
        # Check if workflow exists
        workflow = workflow_db.get_workflow(workflow_id)
        if not workflow:
            raise HTTPException(404, f"Workflow not found: {workflow_id}")
        
        # Build updates dict (only include provided fields)
        update_data = {}
        if updates.name is not None:
            update_data['name'] = updates.name
        if updates.description is not None:
            update_data['description'] = updates.description
        if updates.is_active is not None:
            update_data['is_active'] = 1 if updates.is_active else 0
        
        if not update_data:
            raise HTTPException(400, "No update fields provided")
        
        success = workflow_db.update_workflow(workflow_id, update_data)
        
        if not success:
            raise HTTPException(500, "Failed to update workflow")
        
        # Get updated workflow
        updated_workflow = workflow_db.get_workflow(workflow_id)
        
        return {
            "success": True,
            "workflow": updated_workflow
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating workflow {workflow_id}: {str(e)}")
        raise HTTPException(500, f"Failed to update workflow: {str(e)}")


@router.delete("/api/rag-studio/workflows/{workflow_id}")
async def delete_workflow(workflow_id: str):
    """
    Delete a workflow (cascades to nodes and connections)
    """
    try:
        # Check if workflow exists
        workflow = workflow_db.get_workflow(workflow_id)
        if not workflow:
            raise HTTPException(404, f"Workflow not found: {workflow_id}")
        
        success = workflow_db.delete_workflow(workflow_id)
        
        if not success:
            raise HTTPException(500, "Failed to delete workflow")
        
        return {
            "success": True,
            "message": f"Workflow {workflow_id} deleted successfully"
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting workflow {workflow_id}: {str(e)}")
        raise HTTPException(500, f"Failed to delete workflow: {str(e)}")


# ============================================
# NODE MANAGEMENT ENDPOINTS
# ============================================

@router.post("/api/rag-studio/workflows/{workflow_id}/nodes")
async def add_node(workflow_id: str, node: NodeCreate):
    """
    Add new node to workflow
    
    Request body:
    {
        "workflow_id": "wf_flash_v1",
        "node_type": "router",
        "node_name": "Custom Router",
        "position": 1,
        "config": {"key": "value"},
        "is_enabled": true
    }
    """
    try:
        # Check if workflow exists
        workflow = workflow_db.get_workflow(workflow_id)
        if not workflow:
            raise HTTPException(404, f"Workflow not found: {workflow_id}")
        
        node_id = f"node_{workflow_id}_{uuid.uuid4().hex[:8]}"
        now = datetime.now().isoformat()
        
        node_data = {
            'id': node_id,
            'workflow_id': workflow_id,
            'node_type': node.node_type,
            'node_name': node.node_name,
            'position': node.position,
            'config': node.config,
            'is_enabled': 1 if node.is_enabled else 0,
            'created_at': now
        }
        
        workflow_db.insert_node(node_data)
        
        return {
            "success": True,
            "node_id": node_id,
            "node": node_data
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error adding node to workflow {workflow_id}: {str(e)}")
        raise HTTPException(500, f"Failed to add node: {str(e)}")


@router.put("/api/rag-studio/workflows/{workflow_id}/nodes/{node_id}")
async def update_node(workflow_id: str, node_id: str, node: NodeUpdate):
    """
    Update node configuration
    
    Request body:
    {
        "node_name": "New Name",
        "position": 2,
        "config": {"new": "config"},
        "is_enabled": false
    }
    """
    try:
        # Check if node exists
        existing_node = workflow_db.get_node(node_id)
        if not existing_node:
            raise HTTPException(404, f"Node not found: {node_id}")
        
        # Verify node belongs to workflow
        if existing_node['workflow_id'] != workflow_id:
            raise HTTPException(400, "Node does not belong to this workflow")
        
        # Build updates dict (only include provided fields)
        update_data = {}
        if node.node_name is not None:
            update_data['node_name'] = node.node_name
        if node.position is not None:
            update_data['position'] = node.position
        if node.config is not None:
            update_data['config'] = node.config
        if node.is_enabled is not None:
            update_data['is_enabled'] = 1 if node.is_enabled else 0
        
        if not update_data:
            raise HTTPException(400, "No update fields provided")
        
        success = workflow_db.update_node(node_id, update_data)
        
        if not success:
            raise HTTPException(500, "Failed to update node")
        
        # Get updated node
        updated_node = workflow_db.get_node(node_id)
        
        return {
            "success": True,
            "node": updated_node
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating node {node_id}: {str(e)}")
        raise HTTPException(500, f"Failed to update node: {str(e)}")


@router.delete("/api/rag-studio/workflows/{workflow_id}/nodes/{node_id}")
async def delete_node(workflow_id: str, node_id: str):
    """
    Delete node from workflow (cascades to connections)
    """
    try:
        # Check if node exists
        node = workflow_db.get_node(node_id)
        if not node:
            raise HTTPException(404, f"Node not found: {node_id}")
        
        # Verify node belongs to workflow
        if node['workflow_id'] != workflow_id:
            raise HTTPException(400, "Node does not belong to this workflow")
        
        success = workflow_db.delete_node(node_id)
        
        if not success:
            raise HTTPException(500, "Failed to delete node")
        
        return {
            "success": True,
            "message": f"Node {node_id} deleted successfully"
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting node {node_id}: {str(e)}")
        raise HTTPException(500, f"Failed to delete node: {str(e)}")


# ============================================
# CONNECTION MANAGEMENT ENDPOINTS
# ============================================

@router.post("/api/rag-studio/workflows/{workflow_id}/connections")
async def add_connection(workflow_id: str, connection: ConnectionCreate):
    """
    Add connection between nodes
    
    Request body:
    {
        "workflow_id": "wf_flash_v1",
        "from_node_id": "node_flash_input",
        "to_node_id": "node_flash_router",
        "condition": {"key": "value"}
    }
    """
    try:
        # Check if workflow exists
        workflow = workflow_db.get_workflow(workflow_id)
        if not workflow:
            raise HTTPException(404, f"Workflow not found: {workflow_id}")
        
        # Check if both nodes exist
        from_node = workflow_db.get_node(connection.from_node_id)
        to_node = workflow_db.get_node(connection.to_node_id)
        
        if not from_node or not to_node:
            raise HTTPException(404, "One or both nodes not found")
        
        # Verify nodes belong to workflow
        if from_node['workflow_id'] != workflow_id or to_node['workflow_id'] != workflow_id:
            raise HTTPException(400, "Nodes do not belong to this workflow")
        
        connection_id = f"conn_{workflow_id}_{uuid.uuid4().hex[:8]}"
        now = datetime.now().isoformat()
        
        connection_data = {
            'id': connection_id,
            'workflow_id': workflow_id,
            'from_node_id': connection.from_node_id,
            'to_node_id': connection.to_node_id,
            'condition': connection.condition,
            'created_at': now
        }
        
        workflow_db.insert_connection(connection_data)
        
        return {
            "success": True,
            "connection_id": connection_id,
            "connection": connection_data
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error adding connection to workflow {workflow_id}: {str(e)}")
        raise HTTPException(500, f"Failed to add connection: {str(e)}")


@router.delete("/api/rag-studio/workflows/{workflow_id}/connections/{connection_id}")
async def delete_connection(workflow_id: str, connection_id: str):
    """
    Delete connection
    """
    try:
        success = workflow_db.delete_connection(connection_id)
        
        if not success:
            raise HTTPException(404, f"Connection not found: {connection_id}")
        
        return {
            "success": True,
            "message": f"Connection {connection_id} deleted successfully"
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting connection {connection_id}: {str(e)}")
        raise HTTPException(500, f"Failed to delete connection: {str(e)}")


# ============================================
# TEST RESULTS ENDPOINTS
# ============================================

@router.get("/api/rag-studio/workflows/{workflow_id}/tests")
async def get_test_results(workflow_id: str, limit: int = 50):
    """
    Get test results history for a workflow
    
    Query params:
    - limit: Max number of results to return (default: 50)
    """
    try:
        # Check if workflow exists
        workflow = workflow_db.get_workflow(workflow_id)
        if not workflow:
            raise HTTPException(404, f"Workflow not found: {workflow_id}")
        
        results = workflow_db.get_test_results(workflow_id, limit)
        
        return {
            "success": True,
            "workflow_id": workflow_id,
            "results": results,
            "count": len(results)
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching test results for {workflow_id}: {str(e)}")
        raise HTTPException(500, f"Failed to fetch test results: {str(e)}")


@router.get("/api/rag-studio/tests/{result_id}")
async def get_test_result(result_id: str):
    """
    Get specific test result by ID
    """
    try:
        result = workflow_db.get_test_result(result_id)
        
        if not result:
            raise HTTPException(404, f"Test result not found: {result_id}")
        
        return {
            "success": True,
            "result": result
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching test result {result_id}: {str(e)}")
        raise HTTPException(500, f"Failed to fetch test result: {str(e)}")


# ============================================
# WORKFLOW TESTING ENDPOINT
# ============================================

@router.post("/api/rag-studio/test")
async def test_workflow(request: WorkflowTestRequest):
    """
    Test workflow execution with NEW FlowExecutor system (JSON-based flows)
    
    Request body:
    {
        "workflow_id": "wf_flash_v1",
        "test_input": "Apa itu RAG?",
        "mode": "flash" or "pro",  // NEW: Mode selection (flash/pro)
        "stop_at_node": "node_flash_router",  // Optional: for partial testing
        "persona_id": "persona-lycus",  // Optional: persona for enhanced context
        "character_id": "char-123",  // Optional: user character for relationship
        "conversation_id": "conv-456"  // Optional: conversation for history
    }
    
    Response:
    {
        "success": true,
        "mode": "flash",
        "execution_id": "exec_123",
        "status": "success",
        "execution_flow": [...],
        "final_output": "...",
        "total_time": 2.3
    }
    """
    try:
        # Check if workflow exists
        workflow = workflow_db.get_workflow_with_nodes(request.workflow_id)
        if not workflow:
            raise HTTPException(404, f"Workflow not found: {request.workflow_id}")
        
        # Determine mode (default to flash if not provided)
        mode = request.mode or "flash"
        if mode not in ["flash", "pro"]:
            raise HTTPException(400, f"Invalid mode: {mode}. Must be 'flash' or 'pro'")
        
        logger.info(f"🚀 Starting NEW FlowExecutor test: {request.workflow_id}")
        logger.info(f"   Mode: {mode.upper()}")
        logger.info(f"   Input: {request.test_input[:50]}...")
        
        # ==================================================
        # NEW SYSTEM: FlowExecutor with JSON Flows
        # ==================================================
        
        from pathlib import Path
        from ai.flow.executor import FlowExecutor
        from ai.flow.loader import FlowLoader
        from ai.flow.registry import AgentRegistry
        from ai.flow.context import ExecutionContext
        from ai.agents.register_agents import register_all_agents
        import time
        
        # 1. Load flow config based on mode
        # Determine flow filename
        if mode == "pro":
            flow_filename = "rag_full.json"
        else:
            flow_filename = "base.json"
        
        # FlowLoader base_path is already set to ai/flows/
        # So we only need: {mode}/{filename}
        flow_path = f"{mode}/{flow_filename}"
        
        logger.info(f"📄 Loading flow config: {flow_path}")
        
        # 2. Load flow
        loader = FlowLoader()
        flow_config = loader.load_flow(flow_path)  # loader will handle base_dir
        
        logger.info(f"✅ Flow loaded: {flow_config.name} ({len(flow_config.steps)} steps)")
        
        # 3. Setup agent registry
        registry = AgentRegistry()
        register_all_agents(registry)
        
        logger.info(f"✅ Agents registered: {len(registry.list_agents())} agents")
        
        # 4. Create execution context
        context = ExecutionContext({
            "message": request.test_input,
            "workflow_id": request.workflow_id,
            "mode": mode,
            "persona_id": request.persona_id,
            "character_id": request.character_id,
            "conversation_id": request.conversation_id
        })
        
        # 5. Execute flow
        start_time = time.time()
        
        executor = FlowExecutor(registry)  # Only pass registry
        result_context = executor.execute_flow(flow_config, context)  # Then call execute_flow
        
        total_time = time.time() - start_time
        
        logger.info(f"✅ Flow execution complete: {result_context.get('status', 'unknown')}")
        logger.info(f"   Total time: {total_time:.3f}s")
        logger.info(f"   Steps executed: {len(result_context.metadata['steps_executed'])}")
        
        # 6. Format response for frontend (compatible with old format)
        execution_flow = []
        for step in result_context.metadata['steps_executed']:
            execution_flow.append({
                'node_id': step['agent'],
                'node_name': step['agent'].replace('_', ' ').title(),
                'node_type': step['agent'],
                'status': 'success',
                'processing_time': step['timing'],
                'input': {},
                'output': result_context.agent_outputs.get(step['agent'], {})
            })
        
        # Get final response
        final_output = result_context.get("response", result_context.get("formatted_response", ""))
        
        # Check for errors
        has_errors = len(result_context.metadata['errors']) > 0
        status = "error" if has_errors else "success"
        error_message = result_context.metadata['errors'][0]['error'] if has_errors else None
        
        return {
            "success": not has_errors,
            "mode": mode,
            "execution_id": result_context.context_id,
            "workflow_id": request.workflow_id,
            "status": status,
            "execution_flow": execution_flow,
            "final_output": final_output,
            "total_time": total_time,
            "error_message": error_message,
            "metadata": {
                "flow_name": flow_config.name,
                "flow_version": flow_config.version,
                "steps_count": len(flow_config.steps),
                "executed_steps": len(result_context.metadata['steps_executed'])
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Flow execution failed: {str(e)}")
        import traceback
        logger.error(traceback.format_exc())
        raise HTTPException(500, f"Flow execution failed: {str(e)}")


# ============================================
# NODE POSITION ENDPOINTS (Phase 6)
# ============================================

@router.put("/api/rag-studio/workflows/{workflow_id}/batch-positions")
async def batch_update_node_positions(
    workflow_id: str,
    request: BatchPositionRequest
):
    """
    Batch update multiple node positions at once
    
    Body: {
        "updates": [
            {
                "node_id": "node1",
                "position_x": 100,
                "position_y": 50,
                "width": 200,
                "height": 80
            },
            {
                "node_id": "node2",
                "position_x": 300,
                "position_y": 50
            }
        ]
    }
    """
    try:
        updates = request.updates
        logger.info(f"📐 Batch updating {len(updates)} node positions")
        
        # Verify all nodes exist and belong to workflow
        for update in updates:
            node = workflow_db.get_node(update.node_id)
            if not node:
                raise HTTPException(404, f"Node not found: {update.node_id}")
            if node['workflow_id'] != workflow_id:
                raise HTTPException(400, f"Node {update.node_id} does not belong to this workflow")
        
        # Batch update positions
        update_data = [
            {
                'node_id': u.node_id,
                'position_x': u.position_x,
                'position_y': u.position_y,
                'width': u.width,
                'height': u.height
            }
            for u in updates
        ]
        
        updated_count = workflow_db.batch_update_positions(update_data)
        
        logger.info(f"✅ Batch update complete: {updated_count} nodes updated")
        
        return {
            "success": True,
            "message": f"Updated {updated_count} node positions",
            "updated_count": updated_count
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Batch position update failed: {str(e)}")
        raise HTTPException(500, f"Batch position update failed: {str(e)}")

@router.put("/api/rag-studio/workflows/{workflow_id}/nodes/{node_id}/position")
async def update_node_position(
    workflow_id: str,
    node_id: str,
    position_update: NodePositionUpdate
):
    """
    Update node position on canvas
    
    Body: {
        "position_x": 250.0,
        "position_y": 100.0,
        "width": 200.0,  // optional
        "height": 80.0   // optional
    }
    """
    try:
        logger.info(f"📐 Updating position for node: {node_id}")
        
        # Verify node exists and belongs to workflow
        node = workflow_db.get_node(node_id)
        if not node:
            raise HTTPException(404, f"Node not found: {node_id}")
        
        if node['workflow_id'] != workflow_id:
            raise HTTPException(400, "Node does not belong to this workflow")
        
        # Update position
        success = workflow_db.update_node_position(
            node_id=node_id,
            position_x=position_update.position_x,
            position_y=position_update.position_y,
            width=position_update.width,
            height=position_update.height
        )
        
        if not success:
            raise HTTPException(500, "Failed to update node position")
        
        logger.info(f"✅ Node position updated: ({position_update.position_x}, {position_update.position_y})")
        
        return {
            "success": True,
            "message": "Node position updated",
            "node_id": node_id,
            "position": {
                "x": position_update.position_x,
                "y": position_update.position_y,
                "width": position_update.width,
                "height": position_update.height
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Failed to update node position: {str(e)}")
        raise HTTPException(500, f"Failed to update node position: {str(e)}")

@router.post("/api/rag-studio/workflows/{workflow_id}/auto-layout")
async def auto_layout_workflow(
    workflow_id: str,
    layout_type: str = "vertical"
):
    """
    Auto-arrange nodes using layout algorithm
    
    Query params:
    - layout_type: "vertical", "horizontal", or "dagre"
    
    Returns updated node positions
    """
    try:
        logger.info(f"🎨 Auto-layout workflow: {workflow_id} ({layout_type})")
        
        # Get workflow with nodes
        workflow = workflow_db.get_workflow_with_nodes(workflow_id)
        if not workflow:
            raise HTTPException(404, "Workflow not found")
        
        nodes = workflow.get('nodes', [])
        if not nodes:
            raise HTTPException(400, "No nodes to layout")
        
        # Calculate positions based on layout type
        updates = []
        
        if layout_type == "vertical":
            # Vertical layout: center x, incremental y
            center_x = 400
            start_y = 50
            spacing = 130
            
            for i, node in enumerate(sorted(nodes, key=lambda n: n['position'])):
                updates.append({
                    'node_id': node['id'],
                    'position_x': center_x,
                    'position_y': start_y + (i * spacing),
                    'width': 200,
                    'height': 80
                })
        
        elif layout_type == "horizontal":
            # Horizontal layout: incremental x, center y
            start_x = 50
            center_y = 300
            spacing = 250
            
            for i, node in enumerate(sorted(nodes, key=lambda n: n['position'])):
                updates.append({
                    'node_id': node['id'],
                    'position_x': start_x + (i * spacing),
                    'position_y': center_y,
                    'width': 200,
                    'height': 80
                })
        
        else:
            raise HTTPException(400, f"Unsupported layout type: {layout_type}")
        
        # Batch update
        updated_count = workflow_db.batch_update_positions(updates)
        
        logger.info(f"✅ Auto-layout complete: {updated_count} nodes positioned")
        
        return {
            "success": True,
            "message": f"Auto-layout applied: {layout_type}",
            "updated_count": updated_count,
            "positions": updates
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Auto-layout failed: {str(e)}")
        raise HTTPException(500, f"Auto-layout failed: {str(e)}")


# ============================================
# FLOW CONFIG EDITOR ENDPOINTS
# ============================================

@router.get("/api/rag-studio/flow-configs/{mode}")
async def get_flow_config(mode: str):
    """
    Load flow config JSON (flash or pro)
    
    Returns: Complete flow config for editing
    """
    try:
        from pathlib import Path
        import json
        
        if mode not in ["flash", "pro"]:
            raise HTTPException(400, f"Invalid mode: {mode}. Must be 'flash' or 'pro'")
        
        # Determine file path
        base_dir = Path(__file__).parent.parent / "ai" / "flows"
        if mode == "flash":
            config_path = base_dir / "flash" / "base.json"
        else:
            config_path = base_dir / "pro" / "rag_full.json"
        
        if not config_path.exists():
            raise HTTPException(404, f"Flow config not found: {config_path}")
        
        # Load JSON
        with open(config_path, 'r', encoding='utf-8') as f:
            flow_config = json.load(f)
        
        logger.info(f"✅ Loaded flow config: {mode} ({len(flow_config.get('steps', []))} steps)")
        
        return {
            "success": True,
            "mode": mode,
            "config": flow_config
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Failed to load flow config: {str(e)}")
        raise HTTPException(500, f"Failed to load flow config: {str(e)}")


@router.put("/api/rag-studio/flow-configs/{mode}")
async def update_flow_config(mode: str, updates: FlowConfigUpdate):
    """
    Update and save flow config JSON
    
    Request body:
    {
        "name": "Updated name",
        "description": "Updated description",
        "steps": [...],  // Updated steps array
        "config": {...},  // Updated config
        "error_handling": {...},
        "optimization": {...}
    }
    """
    try:
        from pathlib import Path
        import json
        
        if mode not in ["flash", "pro"]:
            raise HTTPException(400, f"Invalid mode: {mode}. Must be 'flash' or 'pro'")
        
        # Determine file path
        base_dir = Path(__file__).parent.parent / "ai" / "flows"
        if mode == "flash":
            config_path = base_dir / "flash" / "base.json"
        else:
            config_path = base_dir / "pro" / "rag_full.json"
        
        if not config_path.exists():
            raise HTTPException(404, f"Flow config not found: {config_path}")
        
        # Load existing config
        with open(config_path, 'r', encoding='utf-8') as f:
            flow_config = json.load(f)
        
        # Update fields (only provided ones)
        if updates.name is not None:
            flow_config['name'] = updates.name
        if updates.description is not None:
            flow_config['description'] = updates.description
        if updates.steps is not None:
            flow_config['steps'] = [step.dict() for step in updates.steps]
        if updates.config is not None:
            flow_config['config'] = updates.config
        if updates.error_handling is not None:
            flow_config['error_handling'] = updates.error_handling
        if updates.optimization is not None:
            flow_config['optimization'] = updates.optimization
        
        # Update timestamp
        from datetime import datetime
        flow_config['metadata']['updated_at'] = datetime.now().strftime("%Y-%m-%d")
        
        # Save back to JSON
        with open(config_path, 'w', encoding='utf-8') as f:
            json.dump(flow_config, f, indent=2, ensure_ascii=False)
        
        logger.info(f"✅ Updated flow config: {mode}")
        logger.info(f"   Steps: {len(flow_config.get('steps', []))}")
        
        return {
            "success": True,
            "mode": mode,
            "message": f"Flow config updated: {mode}",
            "config": flow_config
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Failed to update flow config: {str(e)}")
        import traceback
        logger.error(traceback.format_exc())
        raise HTTPException(500, f"Failed to update flow config: {str(e)}")


@router.get("/api/rag-studio/available-agents")
async def get_available_agents():
    """
    Get list of available agents for flow editor
    
    Returns: List of agent types with descriptions
    """
    try:
        # Get available agents from registry
        from ai.flow.registry import AgentRegistry
        from ai.agents.register_agents import register_all_agents
        
        registry = AgentRegistry()
        register_all_agents(registry)
        
        agents = registry.list_agents()
        
        # Add descriptions
        agent_info = {
            "preprocessor": {
                "name": "Preprocessor",
                "description": "Normalize and clean user input",
                "params": ["normalize_whitespace", "max_length"]
            },
            "llm_agent": {
                "name": "LLM Agent",
                "description": "Generate response with LLM",
                "params": ["model", "temperature", "max_tokens"]
            },
            "persona": {
                "name": "Persona",
                "description": "Apply persona formatting",
                "params": ["persona", "format", "include_metadata"]
            },
            "router": {
                "name": "Router",
                "description": "Classify intent and route",
                "params": []
            },
            "rag": {
                "name": "RAG",
                "description": "Retrieve relevant context",
                "params": []
            },
            "execution": {
                "name": "Execution",
                "description": "Check tool execution",
                "params": []
            },
            "cache_lookup": {
                "name": "Cache Lookup",
                "description": "Check cache for response",
                "params": []
            },
            "cache_store": {
                "name": "Cache Store",
                "description": "Store response in cache",
                "params": []
            }
        }
        
        result = []
        for agent_name in agents:
            info = agent_info.get(agent_name, {
                "name": agent_name.replace('_', ' ').title(),
                "description": f"{agent_name} agent",
                "params": []
            })
            result.append({
                "id": agent_name,
                **info
            })
        
        return {
            "success": True,
            "agents": result,
            "count": len(result)
        }
    except Exception as e:
        logger.error(f"❌ Failed to get available agents: {str(e)}")
        raise HTTPException(500, f"Failed to get available agents: {str(e)}")
