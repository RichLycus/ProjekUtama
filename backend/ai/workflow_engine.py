"""
Workflow Engine for RAG Studio
Executes RAG workflows node by node with support for partial execution
Integrated with real Ollama agents (Phase 6.6.3)
"""

import time
import uuid
import json
from pathlib import Path
from typing import Optional, Dict, Any, List
from datetime import datetime
import logging

from workflow_database import WorkflowDB
from ai.multi_model_orchestrator import MultiModelOrchestrator
from ai.config_manager import AIConfigManager

# Setup logging
logger = logging.getLogger(__name__)


class WorkflowEngine:
    """
    Executes RAG workflows node by node
    Supports partial execution for testing
    Integrated with real Ollama agents (Phase 6.6.3)
    """
    
    def __init__(self, workflow_id: str, db_manager=None, rag_system=None, persona=None, conversation_history=None):
        """
        Initialize workflow engine
        
        Args:
            workflow_id: ID of the workflow to execute
            db_manager: Database manager for agent configs
            rag_system: Optional RAG system instance (deprecated, use orchestrator.rag)
            persona: Optional persona object with personality & relationship context (Phase 6.6.3c)
            conversation_history: Optional conversation history for context (Phase 6.6.3c)
        """
        self.workflow_id = workflow_id
        self.rag_system = rag_system
        self.workflow_db = WorkflowDB()
        self.db_manager = db_manager
        self.persona = persona  # Store persona for agent processing
        self.conversation_history = conversation_history or []  # Store history for context
        
        # Initialize Multi-Model Orchestrator for real agent calls
        try:
            config_manager = AIConfigManager()
            self.orchestrator = MultiModelOrchestrator(db_manager, config_manager)
            self.use_real_agents = self.orchestrator.test_ollama_connection()
            if self.use_real_agents:
                logger.info("✅ Workflow Engine: Using real Ollama agents")
            else:
                logger.warning("⚠️ Workflow Engine: Ollama not available, using mock agents")
        except Exception as e:
            logger.error(f"Failed to initialize orchestrator: {str(e)}")
            self.orchestrator = None
            self.use_real_agents = False
            logger.warning("⚠️ Workflow Engine: Falling back to mock agents")
        
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
                    
                    # Generate summary for clean UI display
                    summary = self._generate_node_summary(node, node_output)
                    
                    # Log successful execution
                    node_log = {
                        "node_id": node['id'],
                        "node_name": node['node_name'],
                        "node_type": node['node_type'],
                        "input": current_data.copy(),
                        "output": node_output.copy() if isinstance(node_output, dict) else node_output,
                        "summary": summary,  # Clean summary for UI
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
        Process router node - determine intent and routing using EnhancedRouterAgent
        
        Args:
            node: Node configuration
            input_data: Input from previous node
        
        Returns:
            Routing decision with intent
        """
        config = node.get('config', {})
        message = input_data.get('message', '')
        
        # Use real EnhancedRouterAgent if available
        if self.use_real_agents and self.orchestrator:
            try:
                logger.info("🧭 Using EnhancedRouterAgent for routing")
                routing_result = self.orchestrator.router.route_request(message)
                
                intent = routing_result.get("intent", "chat")
                final_input = routing_result.get("final_input", message)
                needs_rag = routing_result.get("needs_rag", False)
                confidence = routing_result.get("confidence", 0.0)
                was_improved = routing_result.get("was_improved", False)
                keywords = routing_result.get("keywords", [])
                
                return {
                    "message": final_input,
                    "original_message": message,
                    "intent": intent,
                    "category": intent,
                    "route": "rag_retriever" if needs_rag else "llm",
                    "confidence": confidence,
                    "needs_rag": needs_rag,
                    "was_improved": was_improved,
                    "keywords": keywords,
                    "reasoning": f"Classified as '{intent}' with {confidence*100:.1f}% confidence",
                    "timestamp": datetime.now().isoformat()
                }
            except Exception as e:
                logger.error(f"EnhancedRouterAgent failed: {str(e)}")
                logger.warning("Falling back to simple routing")
        
        # Fallback: Simple intent detection (mock)
        intent = "unknown"
        route = "llm"  # default route
        confidence = 0.5
        reasoning = "Default routing (mock)"
        
        message_lower = message.lower()
        
        # Question detection
        if "?" in message or any(q in message_lower for q in ["apa", "bagaimana", "kapan", "siapa", "mengapa", "what", "how", "when", "who", "why"]):
            intent = "question"
            route = "rag_retriever"
            confidence = 0.85
            reasoning = "Detected question pattern (mock)"
        
        # Generation/creation request
        elif any(cmd in message_lower for cmd in ["buat", "buatkan", "generate", "create", "write"]):
            intent = "generation"
            route = "llm"
            confidence = 0.80
            reasoning = "Detected generation request (mock)"
        
        # Greeting
        elif any(greet in message_lower for greet in ["halo", "hai", "hello", "hi", "hey"]):
            intent = "greeting"
            route = "llm"
            confidence = 0.90
            reasoning = "Detected greeting (mock)"
        
        return {
            "message": message,
            "intent": intent,
            "category": "general",
            "route": route,
            "confidence": confidence,
            "needs_rag": route == "rag_retriever",
            "reasoning": reasoning,
            "timestamp": datetime.now().isoformat()
        }
    
    async def _execute_rag_node(self, node: Dict[str, Any], input_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Process RAG retrieval node - search for relevant documents using RAGAgent
        
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
        intent = input_data.get('intent', 'unknown')
        
        # Use real RAGAgent if available
        retrieved_docs = []
        if self.use_real_agents and self.orchestrator:
            try:
                logger.info(f"🔍 Using RAGAgent for retrieval")
                rag_result = self.orchestrator.rag.retrieve_context(message, intent)
                
                # Extract documents from result
                documents = rag_result.get("documents", [])
                context = rag_result.get("context", "")
                
                # Format results
                for i, doc in enumerate(documents[:max_results]):
                    retrieved_docs.append({
                        "id": f"doc_{i+1}",
                        "title": doc.get('metadata', {}).get('title', f"Document {i+1}"),
                        "content": doc.get('content', doc.get('text', ''))[:500],  # First 500 chars
                        "relevance": doc.get('score', doc.get('distance', 0.0)),
                        "source": source,
                        "metadata": doc.get('metadata', {})
                    })
                
                logger.info(f"✅ RAGAgent retrieved {len(retrieved_docs)} documents")
                
                return {
                    "message": message,
                    "intent": intent,
                    "retrieved_documents": retrieved_docs,
                    "context": context,
                    "retrieval_source": source,
                    "num_results": len(retrieved_docs),
                    "timestamp": datetime.now().isoformat()
                }
            except Exception as e:
                logger.error(f"RAGAgent failed: {str(e)}")
                logger.warning("Falling back to mock RAG results")
        
        # Fallback: Try legacy RAG system or use mock data
        if self.rag_system:
            try:
                logger.info(f"🔍 Querying legacy RAG system for: {message[:50]}...")
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
                
                logger.info(f"✅ Retrieved {len(retrieved_docs)} documents from legacy system")
            except Exception as e:
                logger.error(f"Legacy RAG query failed: {str(e)}")
                # Return mock data on error
                retrieved_docs = self._get_mock_rag_results(message, max_results, source)
        else:
            # No RAG system - return mock data
            logger.warning("RAG system not available, using mock data")
            retrieved_docs = self._get_mock_rag_results(message, max_results, source)
        
        return {
            "message": message,
            "intent": intent,
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
        Process LLM generation node - generate response using specialized agents with persona
        
        Args:
            node: Node configuration with config.agent_type, config.model, config.temperature
            input_data: Input from RAG or router
        
        Returns:
            Generated response
        """
        config = node.get('config', {})
        agent_type = config.get('agent_type', 'chat')
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
        
        # Use real Specialized Agents if available
        if self.use_real_agents and self.orchestrator:
            try:
                logger.info(f"🤖 Using {agent_type.capitalize()} Agent for generation")
                
                # Get the appropriate specialized agent
                agent = self.orchestrator.specialized_agents.get(agent_type)
                
                if not agent:
                    logger.warning(f"No agent for type '{agent_type}', using chat agent")
                    agent = self.orchestrator.specialized_agents.get('chat')
                    agent_type = 'chat'
                
                # ===================================================
                # PERSONA INTEGRATION (Phase 6.6.3c)
                # ===================================================
                # Pass persona to agent if available
                # This will format the response according to persona's style
                
                # Process with specialized agent
                if agent_type == 'chat':
                    # Chat agent supports persona directly
                    agent_result = agent.process(message, persona=self.persona if self.persona else None)
                elif agent_type == 'tool':
                    # Tool agent just detects, doesn't generate response
                    tool_result = agent.detect_tool_need(message)
                    if tool_result.get("needs_tools"):
                        agent_result = {
                            "success": True,
                            "response": "Tool execution would be triggered here.",
                            "agent": "tool"
                        }
                    else:
                        # Not actually a tool request, route to chat with persona
                        agent = self.orchestrator.specialized_agents.get('chat')
                        agent_result = agent.process(message, persona=self.persona if self.persona else None)
                else:
                    # code, analysis, creative agents support RAG context
                    agent_result = agent.process(message, rag_context=context)
                
                response = agent_result.get("response", "")
                
                # Apply persona formatting if persona provided (final touch)
                if self.persona and self.orchestrator.persona:
                    try:
                        persona_result = self.orchestrator.persona.format_response(
                            response, 
                            self.persona, 
                            self.conversation_history
                        )
                        response = persona_result.get("response", response)
                        logger.info(f"✅ Applied persona formatting: {self.persona.get('name', 'Unknown')}")
                    except Exception as e:
                        logger.error(f"❌ Persona formatting failed: {str(e)}")
                
                logger.info(f"✅ {agent_type.capitalize()} Agent generated response ({len(response)} chars)")
                
                return {
                    "message": message,
                    "response": response,
                    "agent_type": agent_type,
                    "model": model,
                    "temperature": temperature,
                    "sources": [doc.get('id', '') for doc in context_docs] if context_docs else [],
                    "context_used": len(context) > 0,
                    "persona_applied": self.persona is not None,
                    "timestamp": datetime.now().isoformat()
                }
            except Exception as e:
                logger.error(f"Specialized Agent failed: {str(e)}")
                logger.warning("Falling back to mock response")
        
        # Fallback: Generate mock response with persona formatting
        response = self._generate_mock_response(message, context, model)
        
        # Apply persona formatting even for mock responses (Phase 6.6.3c enhancement)
        if self.persona:
            try:
                response = self._apply_persona_to_mock(response, message)
                logger.info(f"✅ Applied persona formatting to mock response: {self.persona.get('name', 'Unknown')}")
            except Exception as e:
                logger.error(f"❌ Persona formatting for mock failed: {str(e)}")
        
        return {
            "message": message,
            "response": response,
            "model": model,
            "temperature": temperature,
            "sources": [doc.get('id', '') for doc in context_docs] if context_docs else [],
            "context_used": len(context) > 0,
            "persona_applied": self.persona is not None,  # Add this flag
            "timestamp": datetime.now().isoformat()
        }
    
    def _generate_mock_response(self, message: str, context: str, model: str) -> str:
        """Generate base mock LLM response for testing (will be enhanced with persona)"""
        if context:
            return f"Based on the retrieved context, here's what I found:\n\n{context[:300]}...\n\nLet me know if you need more details!"
        else:
            return f"Regarding your question about '{message[:50]}...', I'd be happy to help you with that. Could you provide more context so I can give you a more detailed answer?"
    
    def _apply_persona_to_mock(self, response: str, user_message: str) -> str:
        """
        Apply persona formatting to mock response (Phase 6.6.3c)
        This simulates what PersonaAgent would do if Ollama was running
        """
        if not self.persona:
            return response
        
        persona_name = self.persona.get('ai_name', 'Assistant')
        user_greeting = self.persona.get('user_greeting', 'friend')
        tone = self.persona.get('tone', 'friendly')
        personality_traits = self.persona.get('personality_traits', {})
        
        # Get relationship context if available
        greeting_prefix = ""
        if hasattr(self, 'persona') and self.persona:
            system_prompt = self.persona.get('system_prompt', '')
            # Check if there's relationship context (enhanced persona)
            if 'relationship' in system_prompt.lower() or 'nickname' in system_prompt.lower():
                # Extract nickname from system prompt if relationship exists
                import re
                nickname_match = re.search(r"call.*?['\"](.*?)['\"]", system_prompt, re.IGNORECASE)
                if nickname_match:
                    user_greeting = nickname_match.group(1)
        
        # Build persona-formatted response
        # 1. Add greeting based on tone
        if tone == 'warm' or tone == 'friendly':
            greeting_prefix = f"Halo {user_greeting}! "
        elif tone == 'direct' or tone == 'professional':
            greeting_prefix = f"{user_greeting}, "
        elif tone == 'casual':
            greeting_prefix = f"Hai {user_greeting}~ "
        
        # 2. Apply personality traits to response style
        technical = personality_traits.get('technical', 50)
        friendly = personality_traits.get('friendly', 50)
        creative = personality_traits.get('creative', 50)
        
        # Enhance response based on traits
        enhanced_response = response
        
        # High technical: Add technical accuracy note
        if technical > 75:
            enhanced_response = response.replace(
                "I'd be happy to help", 
                "I can provide you with accurate information"
            )
        
        # High friendly: Add warm closing
        if friendly > 75:
            enhanced_response += "\n\nLet me know if there's anything else you'd like to know! 😊"
        elif friendly > 60:
            enhanced_response += "\n\nFeel free to ask if you need more clarification!"
        
        # High creative: Add creative touch
        if creative > 75:
            enhanced_response = enhanced_response.replace(
                "here's what I found",
                "here's an interesting perspective"
            )
        
        # 3. Combine greeting + enhanced response
        final_response = greeting_prefix + enhanced_response
        
        return final_response
    
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
    
    def _generate_node_summary(self, node: Dict[str, Any], output: Dict[str, Any]) -> str:
        """
        Generate clean summary for UI display (bullet-point format)
        
        Args:
            node: Node configuration
            output: Node execution output
        
        Returns:
            Clean summary string
        """
        node_type = node['node_type']
        
        if node_type == "input":
            length = output.get('length', 0)
            truncated = output.get('truncated', False)
            if truncated:
                return f"Processed input ({length} characters, truncated)"
            return f"Processed input ({length} characters)"
        
        elif node_type == "router":
            intent = output.get('intent', 'unknown')
            confidence = output.get('confidence', 0.0)
            needs_rag = output.get('needs_rag', False)
            was_improved = output.get('was_improved', False)
            
            summary = f"Intent: '{intent}' ({confidence*100:.0f}% confidence)"
            if needs_rag:
                summary += " → RAG retrieval needed"
            if was_improved:
                summary += " | Query improved"
            return summary
        
        elif node_type == "rag_retriever":
            num_results = output.get('num_results', 0)
            source = output.get('retrieval_source', 'unknown')
            return f"Retrieved {num_results} documents from {source}"
        
        elif node_type == "llm":
            response_length = len(output.get('response', ''))
            agent_type = output.get('agent_type', 'default')
            context_used = output.get('context_used', False)
            
            summary = f"Generated response ({response_length} chars)"
            if agent_type != 'default':
                summary += f" using {agent_type} agent"
            if context_used:
                summary += " with RAG context"
            return summary
        
        elif node_type == "output":
            output_format = output.get('format', 'text')
            response_length = len(output.get('final_response', ''))
            return f"Formatted output as {output_format} ({response_length} chars)"
        
        else:
            return f"Node executed successfully"
    
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


def get_workflow_engine(workflow_id: str, db_manager=None, rag_system=None) -> WorkflowEngine:
    """
    Factory function to create WorkflowEngine instance
    
    Args:
        workflow_id: ID of the workflow to execute
        db_manager: Database manager for agent configs
        rag_system: Optional RAG system instance
    
    Returns:
        WorkflowEngine instance
    """
    return WorkflowEngine(workflow_id, db_manager, rag_system)
