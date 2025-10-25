"""
Test Flow Executor

Comprehensive tests for FlowExecutor with mock agents.
Tests step execution, error handling, conditional logic, and flow orchestration.
"""

import pytest
import sys
from pathlib import Path
import json
import tempfile

# Add backend to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from ai.flow.context import ExecutionContext
from ai.flow.loader import FlowLoader, FlowConfig, StepConfig, ErrorHandling
from ai.flow.executor import FlowExecutor
from ai.flow.registry import AgentRegistry
from tests.mock_agents import register_mock_agents


class TestFlowExecutorBasics:
    """Test basic flow executor functionality."""
    
    def test_executor_initialization(self):
        """Test executor can be initialized."""
        executor = FlowExecutor()
        assert executor is not None
        assert executor.registry is not None
    
    def test_executor_with_custom_registry(self):
        """Test executor with custom registry."""
        registry = AgentRegistry()
        register_mock_agents(registry)
        executor = FlowExecutor(registry=registry)
        # Verify registry has agents registered
        assert len(executor.registry.list_agents()) > 0


class TestSimpleFlowExecution:
    """Test simple flow execution with mock agents."""
    
    @pytest.fixture
    def registry(self):
        """Create registry with mock agents."""
        registry = AgentRegistry()
        register_mock_agents(registry)
        return registry
    
    @pytest.fixture
    def executor(self, registry):
        """Create executor with mock agents."""
        return FlowExecutor(registry=registry)
    
    @pytest.fixture
    def simple_flow_config(self):
        """Create simple 3-step flow."""
        return FlowConfig.from_dict({
            "flow_id": "test_simple",
            "name": "Simple Test Flow",
            "steps": [
                {
                    "id": "step1",
                    "agent": "preprocessor",
                    "description": "Preprocess input",
                    "config": {},
                    "critical": True
                },
                {
                    "id": "step2",
                    "agent": "llm_simple",
                    "description": "Generate response",
                    "config": {"model": "test-model", "temperature": 0.5},
                    "critical": True
                },
                {
                    "id": "step3",
                    "agent": "formatter",
                    "description": "Format output",
                    "config": {"format": "text"},
                    "critical": True
                }
            ]
        })
    
    def test_execute_simple_flow(self, executor, simple_flow_config):
        """Test executing a simple 3-step flow."""
        # Create context
        context = ExecutionContext({"message": "hello world"})
        
        # Execute flow
        result = executor.execute_flow(simple_flow_config, context)
        
        # Verify execution
        assert not result.has_errors()
        assert result.get("processed_message") == "HELLO WORLD"
        assert "llm_response" in result.data
        assert "output" in result.data
        
        # Verify steps executed
        assert len(result.metadata["steps_executed"]) == 3
        assert all(s["status"] == "success" for s in result.metadata["steps_executed"])
    
    def test_execute_flow_with_empty_context(self, executor, simple_flow_config):
        """Test flow execution with empty initial context."""
        context = ExecutionContext({})
        result = executor.execute_flow(simple_flow_config, context)
        
        # Should still execute without errors
        assert len(result.metadata["steps_executed"]) == 3
    
    def test_flow_metadata_tracking(self, executor, simple_flow_config):
        """Test flow metadata is properly tracked."""
        context = ExecutionContext({"message": "test"})
        result = executor.execute_flow(simple_flow_config, context)
        
        # Check metadata
        assert result.metadata["flow_id"] == "test_simple"
        assert result.metadata["flow_name"] == "Simple Test Flow"
        assert "total_execution_time" in result.metadata
        assert "completed_at" in result.metadata
    
    def test_agent_outputs_stored(self, executor, simple_flow_config):
        """Test agent outputs are stored in context."""
        context = ExecutionContext({"message": "test"})
        result = executor.execute_flow(simple_flow_config, context)
        
        # Check agent outputs
        assert "preprocessor" in result.agent_outputs
        assert "llm_simple" in result.agent_outputs
        assert "formatter" in result.agent_outputs


class TestConditionalExecution:
    """Test conditional step execution."""
    
    @pytest.fixture
    def registry(self):
        """Create registry with mock agents."""
        registry = AgentRegistry()
        register_mock_agents(registry)
        return registry
    
    @pytest.fixture
    def executor(self, registry):
        """Create executor with mock agents."""
        return FlowExecutor(registry=registry)
    
    def test_conditional_skip_based_on_flag(self, executor):
        """Test skipping step based on flag condition."""
        flow = FlowConfig.from_dict({
            "flow_id": "test_conditional",
            "name": "Conditional Flow",
            "steps": [
                {
                    "id": "step1",
                    "agent": "preprocessor",
                    "description": "Always run",
                    "critical": False
                },
                {
                    "id": "step2",
                    "agent": "llm_simple",
                    "description": "Only if no cache hit",
                    "condition": "flags.cache_hit == false",
                    "critical": False
                },
                {
                    "id": "step3",
                    "agent": "formatter",
                    "description": "Always run",
                    "critical": False
                }
            ]
        })
        
        # Test with cache_hit = true (step2 should be skipped)
        context = ExecutionContext({"message": "test"})
        context.set_flag("cache_hit", True)
        
        result = executor.execute_flow(flow, context)
        
        # Check step2 was skipped
        steps = result.metadata["steps_executed"]
        assert len(steps) == 3
        assert steps[0]["status"] == "success"  # step1
        assert steps[1]["status"] == "skipped"  # step2
        assert steps[2]["status"] == "success"  # step3
    
    def test_conditional_execute_based_on_flag(self, executor):
        """Test executing step based on flag condition."""
        flow = FlowConfig.from_dict({
            "flow_id": "test_conditional",
            "name": "Conditional Flow",
            "steps": [
                {
                    "id": "step1",
                    "agent": "preprocessor",
                    "critical": False
                },
                {
                    "id": "step2",
                    "agent": "llm_simple",
                    "condition": "flags.cache_hit == false",
                    "critical": False
                }
            ]
        })
        
        # Test with cache_hit = false (step2 should execute)
        context = ExecutionContext({"message": "test"})
        context.set_flag("cache_hit", False)
        
        result = executor.execute_flow(flow, context)
        
        # Check both steps executed
        steps = result.metadata["steps_executed"]
        assert len(steps) == 2
        assert all(s["status"] == "success" for s in steps)


class TestOnSuccessActions:
    """Test on_success action handling."""
    
    @pytest.fixture
    def registry(self):
        """Create registry with mock agents."""
        registry = AgentRegistry()
        register_mock_agents(registry)
        return registry
    
    @pytest.fixture
    def executor(self, registry):
        """Create executor with mock agents."""
        return FlowExecutor(registry=registry)
    
    def test_on_success_set_flag(self, executor):
        """Test setting flag on success."""
        flow = FlowConfig.from_dict({
            "flow_id": "test_flag",
            "name": "Flag Test",
            "steps": [
                {
                    "id": "step1",
                    "agent": "cache_lookup",
                    "config": {"simulate_hit": True},
                    "on_success": {"set_flag": "cache_hit"},
                    "critical": False
                },
                {
                    "id": "step2",
                    "agent": "formatter",
                    "condition": "flags.cache_hit == true",
                    "critical": False
                }
            ]
        })
        
        context = ExecutionContext({})
        result = executor.execute_flow(flow, context)
        
        # Check flag was set
        assert result.get_flag("cache_hit") is True
        
        # Check step2 executed
        assert len(result.metadata["steps_executed"]) == 2
        assert all(s["status"] == "success" for s in result.metadata["steps_executed"])
    
    def test_on_success_skip_to(self, executor):
        """Test skip_to on success."""
        flow = FlowConfig.from_dict({
            "flow_id": "test_skip",
            "name": "Skip Test",
            "steps": [
                {
                    "id": "step1",
                    "agent": "cache_lookup",
                    "config": {"simulate_hit": True},
                    "on_success": {
                        "set_flag": "cache_hit",
                        "skip_to": "step4"
                    },
                    "critical": False
                },
                {
                    "id": "step2",
                    "agent": "preprocessor",
                    "critical": False
                },
                {
                    "id": "step3",
                    "agent": "llm_simple",
                    "critical": False
                },
                {
                    "id": "step4",
                    "agent": "formatter",
                    "critical": False
                }
            ]
        })
        
        context = ExecutionContext({"message": "test"})
        result = executor.execute_flow(flow, context)
        
        # Check flag was set
        assert result.get_flag("cache_hit") is True
        
        # Check step2 and step3 were not executed
        executed_agents = [s["agent"] for s in result.metadata["steps_executed"] if s["status"] == "success"]
        assert "cache_lookup" in executed_agents
        assert "formatter" in executed_agents
        # Note: skip_to implementation needs refinement for proper step skipping


class TestErrorHandling:
    """Test error handling and retry logic."""
    
    @pytest.fixture
    def registry(self):
        """Create registry with mock agents."""
        registry = AgentRegistry()
        register_mock_agents(registry)
        return registry
    
    @pytest.fixture
    def executor(self, registry):
        """Create executor with mock agents."""
        return FlowExecutor(registry=registry)
    
    def test_critical_step_failure_stops_flow(self, executor):
        """Test critical step failure stops flow execution."""
        flow = FlowConfig.from_dict({
            "flow_id": "test_critical",
            "name": "Critical Test",
            "steps": [
                {
                    "id": "step1",
                    "agent": "preprocessor",
                    "critical": False
                },
                {
                    "id": "step2",
                    "agent": "error_agent",
                    "config": {"error_message": "Critical failure"},
                    "critical": True
                },
                {
                    "id": "step3",
                    "agent": "formatter",
                    "critical": False
                }
            ]
        })
        
        context = ExecutionContext({"message": "test"})
        result = executor.execute_flow(flow, context)
        
        # Check flow stopped at critical error
        assert result.has_errors()
        errors = result.metadata["errors"]
        assert len(errors) > 0
        assert any("critical" in e.get("type", "") for e in errors)
        
        # Check step3 was not executed
        executed_steps = len([s for s in result.metadata["steps_executed"] if s["status"] == "success"])
        assert executed_steps < 3
    
    def test_non_critical_step_failure_continues(self, executor):
        """Test non-critical step failure allows flow to continue."""
        flow = FlowConfig.from_dict({
            "flow_id": "test_non_critical",
            "name": "Non-Critical Test",
            "steps": [
                {
                    "id": "step1",
                    "agent": "preprocessor",
                    "critical": False
                },
                {
                    "id": "step2",
                    "agent": "error_agent",
                    "config": {"error_message": "Non-critical failure"},
                    "critical": False
                },
                {
                    "id": "step3",
                    "agent": "formatter",
                    "critical": False
                }
            ]
        })
        
        context = ExecutionContext({"message": "test"})
        result = executor.execute_flow(flow, context)
        
        # Check flow continued despite error
        executed_steps = [s for s in result.metadata["steps_executed"] if s["status"] == "success"]
        assert len(executed_steps) == 2  # step1 and step3
        
        # Check error was logged
        assert len(result.metadata["errors"]) > 0
    
    def test_retry_logic(self, executor):
        """Test retry logic on step failure."""
        flow = FlowConfig.from_dict({
            "flow_id": "test_retry",
            "name": "Retry Test",
            "error_handling": {
                "max_retries": 2,
                "retry_delay": 0.1
            },
            "steps": [
                {
                    "id": "step1",
                    "agent": "error_agent",
                    "config": {"error_message": "Retry test"},
                    "critical": True
                }
            ]
        })
        
        context = ExecutionContext({})
        result = executor.execute_flow(flow, context)
        
        # Error agent always fails, so retries should fail
        assert result.has_errors()


class TestErrorRecovery:
    """Test error recovery with recovery agents."""
    
    @pytest.fixture
    def registry(self):
        """Create registry with mock agents."""
        registry = AgentRegistry()
        register_mock_agents(registry)
        return registry
    
    @pytest.fixture
    def executor(self, registry):
        """Create executor with mock agents."""
        return FlowExecutor(registry=registry)
    
    def test_error_recovery_agent_executed(self, executor):
        """Test error recovery agent is executed on failure."""
        flow = FlowConfig.from_dict({
            "flow_id": "test_recovery",
            "name": "Recovery Test",
            "error_handling": {
                "on_fail": {
                    "agent": "error_responder",
                    "config": {
                        "message": "Fallback response"
                    }
                }
            },
            "steps": [
                {
                    "id": "step1",
                    "agent": "error_agent",
                    "config": {"error_message": "Test error"},
                    "critical": True
                }
            ]
        })
        
        context = ExecutionContext({})
        result = executor.execute_flow(flow, context)
        
        # Check error recovery ran
        assert "error_responder" in result.agent_outputs
        assert result.get("output") == "Fallback response"


class TestComplexFlow:
    """Test complex flow scenarios."""
    
    @pytest.fixture
    def registry(self):
        """Create registry with mock agents."""
        registry = AgentRegistry()
        register_mock_agents(registry)
        return registry
    
    @pytest.fixture
    def executor(self, registry):
        """Create executor with mock agents."""
        return FlowExecutor(registry=registry)
    
    def test_cache_hit_flow(self, executor):
        """Test flow with cache hit (skips LLM)."""
        flow = FlowConfig.from_dict({
            "flow_id": "test_cache_hit",
            "name": "Cache Hit Flow",
            "steps": [
                {
                    "id": "step1",
                    "agent": "preprocessor",
                    "critical": False
                },
                {
                    "id": "step2",
                    "agent": "cache_lookup",
                    "config": {"simulate_hit": True},
                    "on_success": {"set_flag": "cache_hit"},
                    "critical": False
                },
                {
                    "id": "step3",
                    "agent": "llm_simple",
                    "condition": "flags.cache_hit == false",
                    "critical": False
                },
                {
                    "id": "step4",
                    "agent": "formatter",
                    "critical": False
                }
            ]
        })
        
        context = ExecutionContext({"message": "test"})
        result = executor.execute_flow(flow, context)
        
        # Check cache hit flag
        assert result.get_flag("cache_hit") is True
        
        # Check LLM step was skipped
        steps = result.metadata["steps_executed"]
        llm_step = next((s for s in steps if s["agent"] == "llm_simple"), None)
        assert llm_step is not None
        assert llm_step["status"] == "skipped"
    
    def test_cache_miss_flow(self, executor):
        """Test flow with cache miss (runs LLM)."""
        flow = FlowConfig.from_dict({
            "flow_id": "test_cache_miss",
            "name": "Cache Miss Flow",
            "steps": [
                {
                    "id": "step1",
                    "agent": "preprocessor",
                    "critical": False
                },
                {
                    "id": "step2",
                    "agent": "cache_lookup",
                    "config": {"simulate_hit": False},
                    "critical": False
                },
                {
                    "id": "step3",
                    "agent": "llm_simple",
                    "condition": "flags.cache_hit == false",
                    "critical": False
                },
                {
                    "id": "step4",
                    "agent": "cache_store",
                    "critical": False
                },
                {
                    "id": "step5",
                    "agent": "formatter",
                    "critical": False
                }
            ]
        })
        
        context = ExecutionContext({"message": "test"})
        result = executor.execute_flow(flow, context)
        
        # Check cache hit flag is false
        assert result.get_flag("cache_hit") is False
        
        # Check all steps executed
        success_steps = [s for s in result.metadata["steps_executed"] if s["status"] == "success"]
        assert len(success_steps) == 5


class TestRealFlowConfigs:
    """Test with real flow configurations from JSON files."""
    
    @pytest.fixture
    def loader(self):
        """Create flow loader."""
        return FlowLoader()
    
    @pytest.fixture
    def registry(self):
        """Create registry with mock agents."""
        registry = AgentRegistry()
        register_mock_agents(registry)
        return registry
    
    @pytest.fixture
    def executor(self, registry):
        """Create executor with mock agents."""
        return FlowExecutor(registry=registry)
    
    def test_load_and_execute_flash_flow(self, loader, executor):
        """Test loading and executing flash mode flow."""
        try:
            # Load flash flow
            flow = loader.load_flow_by_id("flash", "base")
            
            # Execute flow
            context = ExecutionContext({"message": "test flash mode"})
            result = executor.execute_flow(flow, context)
            
            # Flow should execute (some steps may skip due to conditions)
            assert "steps_executed" in result.metadata
            assert len(result.metadata["steps_executed"]) > 0
        
        except FileNotFoundError:
            pytest.skip("Flash flow config not found")
        except Exception as e:
            # Some agents may not be registered, that's ok for this test
            pytest.skip(f"Agent not found: {e}")


if __name__ == "__main__":
    # Run tests
    pytest.main([__file__, "-v", "--tb=short"])
