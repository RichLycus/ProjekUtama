"""
Workflow Engine for RAG Studio
Executes RAG workflows node by node with support for partial execution
"""

import time
import uuid
import json
from pathlib import Path
from typing import Optional, Dict, Any, List
from datetime import datetime
import logging

from workflow_database import WorkflowDB

# Setup logging
logger = logging.getLogger(__name__)


class WorkflowEngine:
    """
    Executes RAG workflows node by node
    Supports partial execution for testing
    """
    
    def __init__(self, workflow_id: str, rag_system=None):
        """
        Initialize workflow engine
        
        Args:
            workflow_id: ID of the workflow to execute
            rag_system: Optional RAG system instance for retrieval
        """
        self.workflow_id = workflow_id
        self.rag_system = rag_system
        self.workflow_db = WorkflowDB()
        
        # Load workflow with nodes and connections
        self.workflow = self.workflow_db.get_workflow_with_nodes(workflow_id)
        if not self.workflow:
            raise ValueError(f"Workflow not found: {workflow_id}")
        
        self.execution_log = []
    
    async def execute(
        self, 
        test_input: str, 
        stop_at_node: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Execute workflow with optional stop point
        
        Args:
            test_input: User input for testing
            stop_at_node: Node ID to stop at (for partial testing)
        
        Returns:
            Execution result with logs for each node
        """
        execution_id = f"exec_{uuid.uuid4().hex[:12]}"
        
        result = {
            "execution_id": execution_id,
            "workflow_id": self.workflow_id,
            "status": "running",
            "execution_flow": [],
            "final_output": None,
            "total_time": 0
        }
        
        start_time = time.time()
        current_data = {"message": test_input, "raw_input": test_input}
        
        try:
            # Execute nodes in order by position
            for node in self.workflow['nodes']:
                # Skip disabled nodes
                if not node.get('is_enabled', 1):
                    logger.info(f"⏭️ Skipping disabled node: {node['node_name']}")
                    continue
                
                node_start = time.time()
                
                try:
                    logger.info(f"🔄 Executing node: {node['node_name']} ({node['node_type']})")
                    
                    # Execute node based on type
                    node_output = await self._execute_node(node, current_data)
                    
                    # Log successful execution
                    node_log = {
                        "node_id": node['id'],
                        "node_name": node['node_name'],
                        "node_type": node['node_type'],
                        "input": current_data.copy(),
                        "output": node_output.copy() if isinstance(node_output, dict) else node_output,
                        "processing_time": time.time() - node_start,
                        "status": "success"
                    }
                    result["execution_flow"].append(node_log)
                    
                    logger.info(f"✅ Node completed in {node_log['processing_time']:.3f}s")
                    
                    # Update current data for next node
                    current_data = node_output
                    
                    # Stop if requested
                    if stop_at_node and node['id'] == stop_at_node:
                        result["status"] = "partial"
                        logger.info(f"⏸️ Execution stopped at node: {node['node_name']}")
                        break
                        
                except Exception as e:
                    # Handle node execution error
                    logger.error(f"❌ Node execution failed: {str(e)}")
                    node_log = {
                        "node_id": node['id'],
                        "node_name": node['node_name'],
                        "node_type": node['node_type'],
                        "input": current_data.copy(),
                        "output": None,
                        "processing_time": time.time() - node_start,
                        "status": "error",
                        "error": str(e)
                    }
                    result["execution_flow"].append(node_log)
                    result["status"] = "error"
                    result["error_message"] = str(e)
                    break
            
            result["final_output"] = current_data
            result["total_time"] = time.time() - start_time
            
            # Mark as success if completed without errors
            if result["status"] == "running":
                result["status"] = "success"
            
            # Save test result to database
            await self._save_test_result(result, test_input)
            
            logger.info(f"🎉 Workflow execution completed: {result['status']} in {result['total_time']:.2f}s")
            
        except Exception as e:
            logger.error(f"💥 Workflow execution failed: {str(e)}")
            result["status"] = "error"
            result["error_message"] = str(e)
            result["total_time"] = time.time() - start_time
        
        return result
    
    async def _execute_node(self, node: Dict[str, Any], input_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Execute single node based on its type
        
        Args:
            node: Node configuration
            input_data: Input data from previous node
        
        Returns:
            Output data for next node
        """
        node_type = node['node_type']
        
        if node_type == "input":
            return await self._execute_input_node(node, input_data)
        
        elif node_type == "router":
            return await self._execute_router_node(node, input_data)
        
        elif node_type == "rag_retriever":
            return await self._execute_rag_node(node, input_data)
        
        elif node_type == "llm":
            return await self._execute_llm_node(node, input_data)
        
        elif node_type == "output":
            return await self._execute_output_node(node, input_data)
        
        else:
            raise ValueError(f"Unknown node type: {node_type}")
    
    async def _execute_input_node(self, node: Dict[str, Any], input_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Process input node - validate and format user input
        
        Args:
            node: Node configuration with config.max_length
            input_data: Raw input data
        
        Returns:
            Processed input data
        """
        config = node.get('config', {})
        max_length = config.get('max_length', 1000)
        
        message = input_data.get('message', '')
        
        # Truncate if too long
        if len(message) > max_length:
            message = message[:max_length]
            logger.warning(f"Input truncated to {max_length} chars")
        
        return {
            "message": message,
            "timestamp": datetime.now().isoformat(),
            "length": len(message),
            "truncated": len(input_data.get('message', '')) > max_length
        }
    
    async def _execute_router_node(self, node: Dict[str, Any], input_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Process router node - determine intent and routing
        
        Args:
            node: Node configuration
            input_data: Input from previous node
        
        Returns:
            Routing decision with intent
        """
        config = node.get('config', {})
        message = input_data.get('message', '')
        
        # Simple intent detection (can be enhanced with ML model)
        intent = "unknown"
        route = "llm"  # default route
        confidence = 0.5
        reasoning = "Default routing"
        
        message_lower = message.lower()
        
        # Question detection
        if "?" in message or any(q in message_lower for q in ["apa", "bagaimana", "kapan", "siapa", "mengapa", "what", "how", "when", "who", "why"]):
            intent = "question"
            route = "rag_retriever"
            confidence = 0.85
            reasoning = "Detected question pattern"
        
        # Generation/creation request
        elif any(cmd in message_lower for cmd in ["buat", "buatkan", "generate", "create", "write"]):
            intent = "generation"
            route = "llm"
            confidence = 0.80
            reasoning = "Detected generation request"
        
        # Greeting
        elif any(greet in message_lower for greet in ["halo", "hai", "hello", "hi", "hey"]):
            intent = "greeting"
            route = "llm"
            confidence = 0.90
            reasoning = "Detected greeting"
        
        # If using advanced routing (from config)
        if config.get('use_advanced_routing'):
            confidence = min(confidence + 0.1, 1.0)
        
        return {
            "message": message,
            "intent": intent,
            "category": "general",
            "route": route,
            "confidence": confidence,
            "reasoning": reasoning,
            "timestamp": datetime.now().isoformat()
        }
    
    async def _execute_rag_node(self, node: Dict[str, Any], input_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Process RAG retrieval node - search for relevant documents
        
        Args:
            node: Node configuration with config.max_results, config.source
            input_data: Input from router
        
        Returns:
            Retrieved documents with relevance scores
        """
        config = node.get('config', {})
        max_results = config.get('max_results', 3)
        source = config.get('source', 'chimepaedia')
        
        message = input_data.get('message', '')
        
        # If RAG system is available, use it
        retrieved_docs = []
        if self.rag_system:
            try:
                logger.info(f"🔍 Querying RAG system for: {message[:50]}...")
                results = self.rag_system.query(message, n_results=max_results)
                
                # Format results
                for i, result in enumerate(results):
                    retrieved_docs.append({
                        "id": f"doc_{i+1}",
                        "title": result.get('metadata', {}).get('title', f"Document {i+1}"),
                        "content": result.get('document', '')[:500],  # First 500 chars
                        "relevance": result.get('distance', 0.0),
                        "source": source
                    })
                
                logger.info(f"✅ Retrieved {len(retrieved_docs)} documents")
            except Exception as e:
                logger.error(f"RAG query failed: {str(e)}")
                # Return mock data on error
                retrieved_docs = self._get_mock_rag_results(message, max_results, source)
        else:
            # No RAG system - return mock data
            logger.warning("RAG system not available, using mock data")
            retrieved_docs = self._get_mock_rag_results(message, max_results, source)
        
        return {
            "message": message,
            "intent": input_data.get('intent', 'unknown'),
            "retrieved_documents": retrieved_docs,
            "retrieval_source": source,
            "num_results": len(retrieved_docs),
            "timestamp": datetime.now().isoformat()
        }
    
    def _get_mock_rag_results(self, message: str, max_results: int, source: str) -> List[Dict[str, Any]]:
        """Generate mock RAG results for testing without RAG system"""
        return [
            {
                "id": f"doc_{i+1}",
                "title": f"Document {i+1} - {message[:30]}...",
                "content": f"This is mock content for testing. Query: {message}. This document contains relevant information.",
                "relevance": 0.9 - (i * 0.1),
                "source": source
            }
            for i in range(min(max_results, 3))
        ]
    
    async def _execute_llm_node(self, node: Dict[str, Any], input_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Process LLM generation node - generate response
        
        Args:
            node: Node configuration with config.model, config.temperature
            input_data: Input from RAG or router
        
        Returns:
            Generated response
        """
        config = node.get('config', {})
        model = config.get('model', 'default')
        temperature = config.get('temperature', 0.7)
        
        message = input_data.get('message', '')
        context_docs = input_data.get('retrieved_documents', [])
        
        # Build context from retrieved documents
        context = ""
        if context_docs:
            context = "\n\n".join([
                f"[{doc.get('title', 'Document')}]\n{doc.get('content', '')}"
                for doc in context_docs[:3]  # Use top 3 docs
            ])
        
        # Generate response (simplified - in real impl, use actual LLM API)
        response = self._generate_mock_response(message, context, model)
        
        return {
            "message": message,
            "response": response,
            "model": model,
            "temperature": temperature,
            "sources": [doc.get('id', '') for doc in context_docs] if context_docs else [],
            "context_used": len(context) > 0,
            "timestamp": datetime.now().isoformat()
        }
    
    def _generate_mock_response(self, message: str, context: str, model: str) -> str:
        """Generate mock LLM response for testing"""
        if context:
            return f"[{model.upper()} Response]\n\nBased on the retrieved context about '{message}', here's a comprehensive answer:\n\n{context[:200]}...\n\nThis response was generated using the {model} model with relevant context from the knowledge base."
        else:
            return f"[{model.upper()} Response]\n\nRegarding your query '{message}', I can help you with that. This is a generated response using the {model} model."
    
    async def _execute_output_node(self, node: Dict[str, Any], input_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Process output node - format final response
        
        Args:
            node: Node configuration with config.format
            input_data: Input from LLM
        
        Returns:
            Formatted final output
        """
        config = node.get('config', {})
        output_format = config.get('format', 'text')
        
        response = input_data.get('response', '')
        sources = input_data.get('sources', [])
        
        # Format output based on config
        if output_format == 'detailed':
            final_output = {
                "response": response,
                "sources": sources,
                "metadata": {
                    "intent": input_data.get('intent'),
                    "model": input_data.get('model'),
                    "context_used": input_data.get('context_used', False)
                },
                "format": "detailed"
            }
        elif output_format == 'code':
            final_output = {
                "response": response,
                "sources": sources,
                "format": "code",
                "metadata": {
                    "model": input_data.get('model')
                }
            }
        else:  # text format (default)
            final_output = {
                "response": response,
                "sources": sources,
                "format": "text"
            }
        
        return {
            "final_response": response,
            "format": output_format,
            "sources": sources,
            "metadata": final_output.get('metadata', {}),
            "timestamp": datetime.now().isoformat()
        }
    
    async def _save_test_result(self, result: Dict[str, Any], test_input: str):
        """
        Save test execution result to database
        
        Args:
            result: Execution result
            test_input: Original test input
        """
        try:
            test_result = {
                "id": result['execution_id'],
                "workflow_id": self.workflow_id,
                "test_input": test_input,
                "execution_path": [node['node_id'] for node in result['execution_flow']],
                "node_outputs": result['execution_flow'],
                "final_output": result.get('final_output'),
                "processing_time": result['total_time'],
                "status": result['status'],
                "error_message": result.get('error_message'),
                "created_at": datetime.now().isoformat()
            }
            
            self.workflow_db.insert_test_result(test_result)
            logger.info(f"💾 Test result saved: {result['execution_id']}")
        except Exception as e:
            logger.error(f"Failed to save test result: {str(e)}")


def get_workflow_engine(workflow_id: str, rag_system=None) -> WorkflowEngine:
    """
    Factory function to create WorkflowEngine instance
    
    Args:
        workflow_id: ID of the workflow to execute
        rag_system: Optional RAG system instance
    
    Returns:
        WorkflowEngine instance
    """
    return WorkflowEngine(workflow_id, rag_system)
