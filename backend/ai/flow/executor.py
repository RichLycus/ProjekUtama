"""
Flow Executor

Core execution engine for running flows step-by-step.
Handles step execution, error recovery, conditional logic, and flow orchestration.
"""

from typing import Dict, Any, Optional, List
from pathlib import Path
import logging
import time
from datetime import datetime

from .context import ExecutionContext
from .loader import FlowConfig, StepConfig
from .registry import AgentRegistry, get_global_registry
from ..agents.base import BaseAgent

logger = logging.getLogger(__name__)


class FlowExecutor:
    """
    Execute flows with step-by-step orchestration.
    
    The executor is responsible for:
    - Loading agents from registry
    - Executing steps in sequence
    - Handling conditional execution
    - Managing errors and retries
    - Implementing fallback flows
    - Processing on_success actions
    - Tracking execution metadata
    
    Example:
        ```python
        # Load flow
        loader = FlowLoader()
        flow = loader.load_flow_by_id("flash", "base")
        
        # Create executor
        executor = FlowExecutor()
        
        # Execute flow
        context = ExecutionContext({"message": "Hello world"})
        result = executor.execute_flow(flow, context)
        
        # Check results
        if not result.has_errors():
            output = result.get("output")
            print(f"Success: {output}")
        ```
    """
    
    def __init__(self, registry: Optional[AgentRegistry] = None):
        """
        Initialize flow executor.
        
        Args:
            registry: Agent registry (default: global registry)
        """
        self.registry = registry or get_global_registry()
        logger.info("FlowExecutor initialized")
    
    def execute_flow(
        self, 
        flow: FlowConfig, 
        context: ExecutionContext
    ) -> ExecutionContext:
        """
        Execute complete flow.
        
        Args:
            flow: Flow configuration
            context: Initial execution context
        
        Returns:
            Updated execution context with results
        """
        start_time = time.time()
        
        # Set flow metadata in context
        context.metadata["flow_id"] = flow.flow_id
        context.metadata["flow_name"] = flow.name
        context.metadata["flow_version"] = flow.version
        
        # Store flow config in context (for condition evaluation)
        for key, value in flow.config.items():
            context.set(f"_config_{key}", value)
        
        logger.info(f"🚀 Starting flow execution: {flow.name} (v{flow.version})")
        logger.info(f"   Steps: {len(flow.steps)}, Mode: {flow.profile.hardware_mode}")
        
        try:
            # Execute steps sequentially
            for i, step in enumerate(flow.steps):
                step_num = i + 1
                logger.info(f"\n📍 Step {step_num}/{len(flow.steps)}: {step.id}")
                
                # Check if step should execute
                if not step.should_execute(context):
                    logger.info(f"⏭️  Skipping step (condition not met)")
                    context.log_step(
                        step.agent, 
                        timing=0, 
                        status="skipped"
                    )
                    continue
                
                # Execute step with error handling
                try:
                    self.execute_step(step, context)
                    
                    # Process on_success actions
                    if step.on_success:
                        skip_to = self.handle_on_success(step, context, flow)
                        if skip_to:
                            logger.info(f"⏩ Skipping to step: {skip_to}")
                            # Find target step index
                            for j, target_step in enumerate(flow.steps[i+1:], start=i+1):
                                if target_step.id == skip_to:
                                    # Skip to target by breaking inner loop
                                    # and continuing from target index
                                    break
                
                except Exception as e:
                    # Handle step error
                    error_msg = str(e)
                    logger.error(f"❌ Step failed: {error_msg}")
                    
                    # Try retry logic
                    if flow.error_handling.max_retries > 0:
                        success = self.handle_retry(step, context, e, flow)
                        if success:
                            logger.info(f"✅ Retry successful")
                            continue
                    
                    # Check if step is critical
                    if step.critical:
                        logger.error(f"🛑 Critical step failed, stopping flow")
                        context.add_error(step.agent, error_msg, "critical")
                        
                        # Try recovery agent
                        if flow.error_handling.on_fail:
                            self.handle_error_recovery(context, flow, e)
                        
                        # Try fallback flows
                        if flow.error_handling.fallback_flows:
                            return self.handle_fallback(flow, context, e)
                        
                        break
                    else:
                        # Non-critical step, continue execution
                        logger.warning(f"⚠️  Non-critical step failed, continuing")
                        context.add_error(step.agent, error_msg, "warning")
                        continue
        
        except Exception as e:
            logger.error(f"❌ Flow execution failed: {e}")
            context.add_error("flow_executor", str(e), "fatal")
        
        finally:
            # Record total execution time
            total_time = time.time() - start_time
            context.metadata["total_execution_time"] = total_time
            context.metadata["completed_at"] = datetime.now().isoformat()
            
            # Log summary
            steps_executed = len([
                s for s in context.metadata["steps_executed"] 
                if s["status"] == "success"
            ])
            steps_skipped = len([
                s for s in context.metadata["steps_executed"] 
                if s["status"] == "skipped"
            ])
            
            logger.info(f"\n✨ Flow execution complete:")
            logger.info(f"   Time: {total_time:.2f}s")
            logger.info(f"   Steps: {steps_executed} executed, {steps_skipped} skipped")
            logger.info(f"   Errors: {len(context.metadata['errors'])}")
        
        return context
    
    def execute_step(
        self, 
        step: StepConfig, 
        context: ExecutionContext
    ) -> None:
        """
        Execute a single step.
        
        Args:
            step: Step configuration
            context: Execution context
        
        Raises:
            Exception: If step execution fails
        """
        start_time = time.time()
        
        logger.info(f"   Agent: {step.agent}")
        logger.info(f"   Description: {step.description}")
        
        try:
            # Get agent from registry
            agent = self.registry.get_agent(step.agent, config=step.config)
            
            # Execute agent run() method directly (not execute())
            # FlowExecutor handles all orchestration and logging
            logger.debug(f"   Config: {step.config}")
            updated_context = agent.run(context)
            
            # Update context reference (in case agent returns new context)
            if updated_context is not context:
                context.data.update(updated_context.data)
                context.flags.update(updated_context.flags)
            
            # Log successful execution
            elapsed = time.time() - start_time
            logger.info(f"   ✅ Complete ({elapsed:.3f}s)")
            
            context.log_step(
                step.agent,
                timing=elapsed,
                output=context.get_agent_output(step.agent),
                status="success"
            )
        
        except Exception as e:
            elapsed = time.time() - start_time
            logger.error(f"   ❌ Failed ({elapsed:.3f}s): {e}")
            
            context.log_step(
                step.agent,
                timing=elapsed,
                status="error"
            )
            
            raise
    
    def handle_retry(
        self,
        step: StepConfig,
        context: ExecutionContext,
        error: Exception,
        flow: FlowConfig
    ) -> bool:
        """
        Handle step retry logic.
        
        Args:
            step: Step that failed
            context: Execution context
            error: Original error
            flow: Flow configuration
        
        Returns:
            True if retry succeeded, False otherwise
        """
        max_retries = flow.error_handling.max_retries
        retry_delay = flow.error_handling.retry_delay
        
        logger.info(f"🔄 Attempting retry (max: {max_retries})")
        
        for retry_num in range(1, max_retries + 1):
            try:
                logger.info(f"   Retry {retry_num}/{max_retries}")
                
                # Wait before retry
                if retry_delay > 0:
                    time.sleep(retry_delay)
                
                # Re-execute step
                self.execute_step(step, context)
                
                # Success!
                logger.info(f"   ✅ Retry {retry_num} succeeded")
                return True
            
            except Exception as e:
                logger.warning(f"   ❌ Retry {retry_num} failed: {e}")
                
                if retry_num == max_retries:
                    logger.error(f"   🛑 All retries exhausted")
                    return False
        
        return False
    
    def handle_fallback(
        self,
        flow: FlowConfig,
        context: ExecutionContext,
        error: Exception
    ) -> ExecutionContext:
        """
        Handle fallback to alternative flows.
        
        Args:
            flow: Current flow that failed
            context: Execution context
            error: Error that triggered fallback
        
        Returns:
            Updated execution context from fallback flow
        """
        fallback_flows = flow.error_handling.fallback_flows
        
        logger.info(f"🔀 Attempting fallback flows: {fallback_flows}")
        
        for fallback_id in fallback_flows:
            try:
                logger.info(f"   Trying fallback: {fallback_id}")
                
                # TODO: Load fallback flow from loader
                # For now, just log the attempt
                logger.warning(f"   Fallback flow loading not yet implemented")
                
                # Would be:
                # from .loader import FlowLoader
                # loader = FlowLoader()
                # fallback_flow = loader.load_flow(fallback_id)
                # return self.execute_flow(fallback_flow, context)
            
            except Exception as e:
                logger.error(f"   ❌ Fallback {fallback_id} failed: {e}")
                continue
        
        logger.error(f"🛑 All fallback flows failed")
        context.add_error("fallback", "All fallback flows failed", "error")
        
        return context
    
    def handle_on_success(
        self,
        step: StepConfig,
        context: ExecutionContext,
        flow: FlowConfig
    ) -> Optional[str]:
        """
        Handle on_success actions.
        
        Args:
            step: Step that succeeded
            context: Execution context
            flow: Flow configuration
        
        Returns:
            Target step ID if skip_to action, None otherwise
        """
        if not step.on_success:
            return None
        
        actions = step.on_success
        
        # Handle set_flag action
        if "set_flag" in actions:
            flag_name = actions["set_flag"]
            context.set_flag(flag_name, True)
            logger.info(f"   🏁 Set flag: {flag_name}")
        
        # Handle skip_to action
        if "skip_to" in actions:
            target_step = actions["skip_to"]
            logger.info(f"   ⏩ Skip to: {target_step}")
            return target_step
        
        return None
    
    def handle_error_recovery(
        self,
        context: ExecutionContext,
        flow: FlowConfig,
        error: Exception
    ) -> None:
        """
        Handle error recovery with recovery agent.
        
        Args:
            context: Execution context
            flow: Flow configuration
            error: Error that occurred
        """
        on_fail = flow.error_handling.on_fail
        if not on_fail:
            return
        
        agent_name = on_fail.get("agent")
        agent_config = on_fail.get("config", {})
        
        if not agent_name:
            return
        
        logger.info(f"🔧 Running error recovery agent: {agent_name}")
        
        try:
            # Add error info to config
            recovery_config = agent_config.copy()
            recovery_config["error"] = str(error)
            recovery_config["error_type"] = type(error).__name__
            
            # Execute recovery agent
            if self.registry.has_agent(agent_name):
                agent = self.registry.get_agent(agent_name, config=recovery_config)
                agent.run(context)  # Call run() directly
                logger.info(f"   ✅ Recovery agent executed")
            else:
                logger.warning(f"   ⚠️  Recovery agent '{agent_name}' not found")
        
        except Exception as e:
            logger.error(f"   ❌ Recovery agent failed: {e}")
    
    def __repr__(self) -> str:
        """String representation of executor."""
        return f"FlowExecutor(registry={self.registry})"
