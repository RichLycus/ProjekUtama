"""
Unit Tests for Base Interfaces (Phase 6.7.1)

Tests for:
- ExecutionContext
- BaseAgent
- RetrieverInterface
"""

import pytest
from datetime import datetime
from ai.flow.context import ExecutionContext
from ai.agents.base import BaseAgent
from ai.retrievers.base import RetrieverInterface, RetrievalResult


# ============================================
# ExecutionContext Tests
# ============================================

def test_context_initialization():
    """Test context initialization with and without initial data."""
    # Empty context
    context = ExecutionContext()
    assert context.context_id is not None
    assert context.context_id.startswith("ctx_")
    assert len(context.data) == 0
    
    # Context with initial data
    initial = {"message": "Hello", "user_id": "123"}
    context = ExecutionContext(initial)
    assert context.get("message") == "Hello"
    assert context.get("user_id") == "123"


def test_context_data_operations():
    """Test context get/set/update/delete operations."""
    context = ExecutionContext()
    
    # Set
    context.set("key1", "value1")
    assert context.get("key1") == "value1"
    
    # Get with default
    assert context.get("missing", "default") == "default"
    
    # Has
    assert context.has("key1") is True
    assert context.has("missing") is False
    
    # Update
    context.update({"key2": "value2", "key3": "value3"})
    assert context.get("key2") == "value2"
    assert context.get("key3") == "value3"
    
    # Delete
    context.delete("key1")
    assert context.has("key1") is False


def test_context_flags():
    """Test context flag operations."""
    context = ExecutionContext()
    
    # Default flag is False
    assert context.get_flag("cache_hit") is False
    
    # Set flag to True
    context.set_flag("cache_hit")
    assert context.get_flag("cache_hit") is True
    
    # Set flag to False
    context.set_flag("cache_hit", False)
    assert context.get_flag("cache_hit") is False


def test_context_logging():
    """Test context step logging and error logging."""
    context = ExecutionContext()
    
    # Log successful step
    context.log_step("agent1", timing=0.5, output={"result": "success"})
    assert len(context.metadata["steps_executed"]) == 1
    assert context.metadata["steps_executed"][0]["agent"] == "agent1"
    assert context.metadata["steps_executed"][0]["timing"] == 0.5
    assert context.metadata["steps_executed"][0]["status"] == "success"
    assert context.get_agent_output("agent1") == {"result": "success"}
    
    # Log error
    context.add_error("agent2", "Something went wrong")
    assert len(context.metadata["errors"]) == 1
    assert context.metadata["errors"][0]["agent"] == "agent2"
    assert context.has_errors() is True
    
    # Get total time
    context.log_step("agent3", timing=0.3)
    assert context.get_total_time() == 0.8  # 0.5 + 0.3


def test_context_export():
    """Test context to_dict and to_json exports."""
    context = ExecutionContext({"message": "test"})
    context.set_flag("test_flag")
    context.log_step("agent1", timing=0.1)
    
    # to_dict
    data = context.to_dict()
    assert "context_id" in data
    assert "data" in data
    assert "metadata" in data
    assert "agent_outputs" in data
    assert "flags" in data
    assert data["data"]["message"] == "test"
    assert data["flags"]["test_flag"] is True
    
    # to_json
    json_str = context.to_json()
    assert isinstance(json_str, str)
    assert "context_id" in json_str
    assert "test" in json_str


# ============================================
# BaseAgent Tests
# ============================================

class MockAgent(BaseAgent):
    """Mock agent for testing."""
    
    def run(self, context: ExecutionContext) -> ExecutionContext:
        message = context.get("message", "")
        context.set("processed", message.upper())
        return context


class ConditionalAgent(BaseAgent):
    """Agent that only runs if flag is set."""
    
    def should_run(self, context: ExecutionContext) -> bool:
        return context.get_flag("should_process")
    
    def run(self, context: ExecutionContext) -> ExecutionContext:
        context.set("conditional_ran", True)
        return context


class ValidatingAgent(BaseAgent):
    """Agent that validates input."""
    
    def validate_input(self, context: ExecutionContext) -> bool:
        return context.has("required_field")
    
    def run(self, context: ExecutionContext) -> ExecutionContext:
        context.set("validated", True)
        return context


def test_agent_basic_execution():
    """Test basic agent execution."""
    agent = MockAgent(config={"test": True})
    context = ExecutionContext({"message": "hello"})
    
    context = agent.execute(context)
    
    assert context.get("processed") == "HELLO"
    assert len(context.metadata["steps_executed"]) == 1
    assert context.metadata["steps_executed"][0]["agent"] == "MockAgent"
    assert context.metadata["steps_executed"][0]["status"] == "success"


def test_agent_conditional_execution():
    """Test agent conditional execution (should_run)."""
    agent = ConditionalAgent()
    
    # Should not run (flag not set)
    context = ExecutionContext()
    context = agent.execute(context)
    assert context.get("conditional_ran") is None
    assert context.metadata["steps_executed"][0]["status"] == "skipped"
    
    # Should run (flag set)
    context = ExecutionContext()
    context.set_flag("should_process")
    context = agent.execute(context)
    assert context.get("conditional_ran") is True
    assert context.metadata["steps_executed"][0]["status"] == "success"


def test_agent_input_validation():
    """Test agent input validation."""
    agent = ValidatingAgent()
    
    # Should fail validation
    context = ExecutionContext()
    context = agent.execute(context)
    assert context.get("validated") is None
    assert context.has_errors() is True
    assert context.metadata["steps_executed"][0]["status"] == "error"
    
    # Should pass validation
    context = ExecutionContext({"required_field": "value"})
    context = agent.execute(context)
    assert context.get("validated") is True
    assert context.metadata["steps_executed"][0]["status"] == "success"


def test_agent_metadata():
    """Test agent metadata."""
    agent = MockAgent(config={"param": "value"})
    metadata = agent.get_metadata()
    
    assert metadata["name"] == "MockAgent"
    assert metadata["version"] == "1.0.0"
    assert metadata["config"]["param"] == "value"
    assert metadata["type"] == "agent"


# ============================================
# RetrieverInterface Tests
# ============================================

class MockRetriever(RetrieverInterface):
    """Mock retriever for testing."""
    
    def retrieve(self, query: str, top_k: int = 5, filters=None) -> list:
        # Return mock results
        results = []
        for i in range(min(top_k, 3)):
            results.append(RetrievalResult(
                id=f"doc_{i}",
                content=f"Document {i} about {query}",
                score=1.0 - (i * 0.1),
                metadata={"rank": i},
                source="mock"
            ))
        return results


def test_retrieval_result():
    """Test RetrievalResult dataclass."""
    result = RetrievalResult(
        id="doc_1",
        content="Test content",
        score=0.95,
        metadata={"title": "Test"},
        source="test"
    )
    
    assert result.id == "doc_1"
    assert result.content == "Test content"
    assert result.score == 0.95
    assert result.metadata["title"] == "Test"
    assert result.source == "test"
    assert result.timestamp is not None
    
    # to_dict
    data = result.to_dict()
    assert data["id"] == "doc_1"
    assert data["content"] == "Test content"


def test_retriever_basic_retrieval():
    """Test basic retriever retrieval."""
    retriever = MockRetriever(config={"test": True})
    results = retriever.retrieve("test query", top_k=2)
    
    assert len(results) == 2
    assert results[0].id == "doc_0"
    assert results[0].score == 1.0
    assert "test query" in results[0].content
    assert results[1].score == 0.9


def test_retriever_health_check():
    """Test retriever health check."""
    retriever = MockRetriever()
    assert retriever.health_check() is True


def test_retriever_stats():
    """Test retriever get_stats."""
    retriever = MockRetriever()
    stats = retriever.get_stats()
    
    assert "name" in stats
    assert stats["name"] == "MockRetriever"


# ============================================
# Integration Tests
# ============================================

def test_agent_with_retriever_integration():
    """Test agent using retriever in execution."""
    
    class RetrieverAgent(BaseAgent):
        def __init__(self, retriever, config=None):
            super().__init__(config)
            self.retriever = retriever
        
        def run(self, context: ExecutionContext) -> ExecutionContext:
            query = context.get("query", "")
            results = self.retriever.retrieve(query, top_k=2)
            context.set("retrieved_docs", [r.to_dict() for r in results])
            return context
    
    retriever = MockRetriever()
    agent = RetrieverAgent(retriever)
    context = ExecutionContext({"query": "test"})
    
    context = agent.execute(context)
    
    docs = context.get("retrieved_docs")
    assert len(docs) == 2
    assert docs[0]["id"] == "doc_0"
    assert "test" in docs[0]["content"]


def test_multi_agent_pipeline():
    """Test multiple agents in sequence."""
    
    class Agent1(BaseAgent):
        def run(self, context: ExecutionContext) -> ExecutionContext:
            context.set("step1", "complete")
            return context
    
    class Agent2(BaseAgent):
        def run(self, context: ExecutionContext) -> ExecutionContext:
            context.set("step2", "complete")
            return context
    
    context = ExecutionContext({"input": "test"})
    agent1 = Agent1()
    agent2 = Agent2()
    
    # Execute pipeline
    context = agent1.execute(context)
    context = agent2.execute(context)
    
    # Verify
    assert context.get("step1") == "complete"
    assert context.get("step2") == "complete"
    assert len(context.metadata["steps_executed"]) == 2
    assert context.get_total_time() > 0


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
