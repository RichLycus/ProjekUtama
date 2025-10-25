"""
Integration Tests for Real Agents (Phase 6.7.4)

Tests real agent implementations with fallback mechanisms.
Verifies that agents work in both real and mock modes.
"""

import pytest
import sys
from pathlib import Path

# Add backend to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from ai.agents.preprocessor import PreprocessorAgent
from ai.agents.llm_agent import LLMAgent
from ai.agents.formatter import FormatterAgent
from ai.agents.cache_lookup import CacheLookupAgent
from ai.agents.cache_store import CacheStoreAgent
from ai.flow.context import ExecutionContext
from ai.flow.registry import AgentRegistry
from ai.flow.executor import FlowExecutor
from ai.flow.loader import FlowLoader


class TestPreprocessorAgent:
    """Test PreprocessorAgent."""
    
    def test_basic_preprocessing(self):
        """Test basic text preprocessing."""
        agent = PreprocessorAgent(config={
            "normalize_whitespace": True,
            "max_length": 100
        })
        
        context = ExecutionContext({"message": "  Hello   World!  \n\n  Test  "})
        result = agent.run(context)
        
        assert result.get("processed_message") == "Hello World! Test"
    
    def test_lowercase(self):
        """Test lowercase conversion."""
        agent = PreprocessorAgent(config={"lowercase": True})
        
        context = ExecutionContext({"message": "HELLO WORLD"})
        result = agent.run(context)
        
        assert result.get("processed_message") == "hello world"
    
    def test_uppercase(self):
        """Test uppercase conversion."""
        agent = PreprocessorAgent(config={"uppercase": True})
        
        context = ExecutionContext({"message": "hello world"})
        result = agent.run(context)
        
        assert result.get("processed_message") == "HELLO WORLD"
    
    def test_max_length_truncation(self):
        """Test max length truncation."""
        agent = PreprocessorAgent(config={"max_length": 10})
        
        context = ExecutionContext({"message": "This is a very long message"})
        result = agent.run(context)
        
        processed = result.get("processed_message")
        assert len(processed) == 10
        assert processed == "This is a "
    
    def test_output_tracking(self):
        """Test that output is tracked."""
        agent = PreprocessorAgent(config={})
        
        context = ExecutionContext({"message": "Test"})
        result = agent.run(context)
        
        output = result.agent_outputs.get("preprocessor")
        assert output is not None
        assert "original" in output
        assert "processed" in output
        assert "original_length" in output


class TestLLMAgent:
    """Test LLMAgent with fallback strategy."""
    
    def test_initialization_fallback(self):
        """Test that LLMAgent initializes with fallback."""
        agent = LLMAgent(config={})
        
        # Should initialize successfully (either real or mock)
        assert agent.mode in ["real", "mock"]
        assert agent.model is not None
    
    def test_mock_mode_response(self):
        """Test mock mode generation."""
        agent = LLMAgent(config={"force_mock": True})
        
        assert agent.mode == "mock"
        
        context = ExecutionContext({"message": "Hello, how are you?"})
        result = agent.run(context)
        
        response = result.get("llm_response")
        assert response is not None
        assert len(response) > 0
        assert "mock" in response.lower() or "test" in response.lower()
    
    def test_mock_mode_code_intent(self):
        """Test mock mode with code intent."""
        agent = LLMAgent(config={"force_mock": True})
        
        context = ExecutionContext({
            "message": "Write a Python function",
            "intent": "code"
        })
        result = agent.run(context)
        
        response = result.get("llm_response")
        assert "```python" in response or "code" in response.lower()
    
    def test_mock_mode_tool_intent(self):
        """Test mock mode with tool intent."""
        agent = LLMAgent(config={"force_mock": True})
        
        context = ExecutionContext({
            "message": "Use calculator tool",
            "intent": "tool"
        })
        result = agent.run(context)
        
        response = result.get("llm_response")
        assert "tool" in response.lower()
    
    def test_metadata_includes_mode(self):
        """Test that metadata includes mode information."""
        agent = LLMAgent(config={"force_mock": True})
        
        metadata = agent.get_metadata()
        assert "mode" in metadata
        assert "ollama_available" in metadata
        assert "fallback_enabled" in metadata
        assert metadata["fallback_enabled"] is True
    
    def test_output_tracking(self):
        """Test that output is tracked with mode info."""
        agent = LLMAgent(config={"force_mock": True})
        
        context = ExecutionContext({"message": "Test"})
        result = agent.run(context)
        
        output = result.agent_outputs.get("llm_agent")
        assert output is not None
        assert "mode" in output
        assert "response" in output
        assert "elapsed_time" in output


class TestFormatterAgent:
    """Test FormatterAgent."""
    
    def test_text_format(self):
        """Test plain text formatting."""
        agent = FormatterAgent(config={"format": "text"})
        
        context = ExecutionContext({"llm_response": "Hello world"})
        result = agent.run(context)
        
        assert result.get("output") == "Hello world"
    
    def test_text_with_metadata(self):
        """Test text with metadata."""
        agent = FormatterAgent(config={
            "format": "text",
            "include_metadata": True
        })
        
        context = ExecutionContext({"llm_response": "Hello"})
        context.metadata["flow_id"] = "test_flow"
        result = agent.run(context)
        
        output = result.get("output")
        assert "Hello" in output
        assert "---" in output  # Metadata separator
    
    def test_json_format(self):
        """Test JSON formatting."""
        agent = FormatterAgent(config={"format": "json"})
        
        context = ExecutionContext({"llm_response": "Test response"})
        result = agent.run(context)
        
        output = result.get("output")
        assert '"response"' in output
        assert '"format"' in output
        assert "Test response" in output
    
    def test_json_with_metadata(self):
        """Test JSON with metadata."""
        agent = FormatterAgent(config={
            "format": "json",
            "include_metadata": True
        })
        
        context = ExecutionContext({"llm_response": "Test"})
        context.metadata["flow_id"] = "test_flow"
        result = agent.run(context)
        
        output = result.get("output")
        assert '"metadata"' in output
        assert '"flow_id"' in output
    
    def test_markdown_format(self):
        """Test markdown formatting."""
        agent = FormatterAgent(config={"format": "markdown"})
        
        context = ExecutionContext({"llm_response": "# Test"})
        result = agent.run(context)
        
        assert result.get("output") == "# Test"
    
    def test_fallback_field(self):
        """Test fallback to cached_response."""
        agent = FormatterAgent(config={
            "response_field": "llm_response",
            "fallback_field": "cached_response"
        })
        
        # No llm_response, should use cached_response
        context = ExecutionContext({"cached_response": "Cached data"})
        result = agent.run(context)
        
        assert result.get("output") == "Cached data"
        
        # Check tracking
        output = result.agent_outputs.get("formatter")
        assert output["had_fallback"] is True
    
    def test_output_tracking(self):
        """Test output tracking."""
        agent = FormatterAgent(config={})
        
        context = ExecutionContext({"llm_response": "Test"})
        result = agent.run(context)
        
        output = result.agent_outputs.get("formatter")
        assert output is not None
        assert "format" in output
        assert "response_length" in output


class TestCacheAgents:
    """Test cache agents."""
    
    def setup_method(self):
        """Clear cache before each test."""
        CacheLookupAgent.clear_cache()
    
    def test_cache_miss(self):
        """Test cache miss scenario."""
        lookup = CacheLookupAgent(config={})
        
        context = ExecutionContext({"message": "New message"})
        result = lookup.run(context)
        
        assert result.get_flag("cache_hit") is False
    
    def test_cache_store_and_hit(self):
        """Test storing and retrieving from cache."""
        # Store
        store = CacheStoreAgent(config={
            "cache_key_field": "message",
            "response_field": "llm_response",
            "ttl": 3600
        })
        
        context = ExecutionContext({
            "message": "Test message",
            "llm_response": "Test response"
        })
        store.run(context)
        
        # Lookup
        lookup = CacheLookupAgent(config={"cache_key_field": "message"})
        
        context2 = ExecutionContext({"message": "Test message"})
        result = lookup.run(context2)
        
        assert result.get_flag("cache_hit") is True
        assert result.get("cached_response") == "Test response"
    
    def test_cache_stats(self):
        """Test cache statistics."""
        store = CacheStoreAgent(config={})
        
        context = ExecutionContext({
            "message": "Test",
            "llm_response": "Response"
        })
        store.run(context)
        
        stats = CacheLookupAgent.get_cache_stats()
        assert stats["total_entries"] == 1


class TestIntegrationFlow:
    """Test complete flow integration."""
    
    def test_simple_flow_mock_mode(self):
        """Test simple flow in mock mode."""
        # Create registry and register agents
        registry = AgentRegistry()
        registry.register_agent("preprocessor", PreprocessorAgent)
        registry.register_agent("llm_agent", LLMAgent)
        registry.register_agent("formatter", FormatterAgent)
        
        # Create simple flow manually
        from ai.flow.loader import FlowConfig, StepConfig, ExecutionProfile, ErrorHandling, OptimizationConfig
        
        flow = FlowConfig(
            flow_id="test_flow",
            name="Test Flow",
            description="Test flow with mock mode",
            version="1.0.0",
            profile=ExecutionProfile(),
            config={},
            steps=[
                StepConfig(
                    id="step_1",
                    agent="preprocessor",
                    description="Preprocess",
                    config={"normalize_whitespace": True},
                    timeout=1
                ),
                StepConfig(
                    id="step_2",
                    agent="llm_agent",
                    description="Generate",
                    config={"force_mock": True},
                    timeout=10
                ),
                StepConfig(
                    id="step_3",
                    agent="formatter",
                    description="Format",
                    config={"format": "text"},
                    timeout=1
                )
            ],
            error_handling=ErrorHandling(),
            optimization=OptimizationConfig()
        )
        
        # Execute flow
        executor = FlowExecutor(registry=registry)
        context = ExecutionContext({"message": "  Hello World  "})
        result = executor.execute_flow(flow, context)
        
        # Verify results
        assert result.get("processed_message") == "Hello World"
        assert result.get("llm_response") is not None
        assert result.get("output") is not None
        assert not result.has_errors()
        
        # Verify all steps executed
        steps = result.metadata["steps_executed"]
        assert len(steps) == 3
        assert all(s["status"] == "success" for s in steps)


class TestAgentRegistry:
    """Test agent registration."""
    
    def test_register_all_agents(self):
        """Test registering all agents."""
        from ai.agents.register_agents import register_all_agents
        
        registry = AgentRegistry()
        register_all_agents(registry)
        
        # Check all agents registered
        agents = registry.list_agents()
        assert "preprocessor" in agents
        assert "llm_agent" in agents
        assert "formatter" in agents
        assert "cache_lookup" in agents
        assert "cache_store" in agents
        
        assert len(agents) >= 5


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
