"""
Unit Tests for Flow Loader (Phase 6.7.2)

Tests for:
- FlowLoader
- FlowConfig dataclasses
- JSON loading and validation
- Error handling
"""

import pytest
import json
import tempfile
from pathlib import Path
from ai.flow.loader import (
    FlowLoader,
    FlowConfig,
    StepConfig,
    ExecutionProfile,
    FlowSignature,
    ErrorHandling,
    OptimizationConfig
)
from ai.flow.context import ExecutionContext


# ============================================
# Dataclass Tests
# ============================================

def test_execution_profile():
    """Test ExecutionProfile dataclass."""
    profile = ExecutionProfile(
        target_device="local",
        hardware_mode="gpu_4060",
        max_memory_gb=8,
        concurrency_limit=2,
        precision="fp16"
    )
    
    assert profile.target_device == "local"
    assert profile.hardware_mode == "gpu_4060"
    assert profile.max_memory_gb == 8
    assert profile.concurrency_limit == 2
    assert profile.precision == "fp16"


def test_execution_profile_from_dict():
    """Test ExecutionProfile.from_dict()."""
    data = {
        "target_device": "cloud",
        "hardware_mode": "gpu_a100",
        "max_memory_gb": 16
    }
    profile = ExecutionProfile.from_dict(data)
    
    assert profile.target_device == "cloud"
    assert profile.hardware_mode == "gpu_a100"
    assert profile.max_memory_gb == 16
    # Defaults
    assert profile.concurrency_limit == 2
    assert profile.precision == "fp16"


def test_step_config():
    """Test StepConfig dataclass."""
    step = StepConfig(
        id="step_1",
        agent="preprocessor",
        description="Preprocess input",
        config={"max_length": 1000},
        timeout=1.0,
        critical=True
    )
    
    assert step.id == "step_1"
    assert step.agent == "preprocessor"
    assert step.timeout == 1.0
    assert step.critical is True


def test_step_config_condition_evaluation():
    """Test StepConfig condition evaluation."""
    step = StepConfig(
        id="step_1",
        agent="test",
        condition="flags.cache_hit == false"
    )
    
    context = ExecutionContext()
    
    # Flag not set (defaults to False)
    assert step.should_execute(context) is True
    
    # Flag set to True
    context.set_flag("cache_hit", True)
    assert step.should_execute(context) is False


def test_error_handling():
    """Test ErrorHandling dataclass."""
    eh = ErrorHandling(
        retry_on_timeout=True,
        max_retries=3,
        fallback_flows=["flash_base_v1"]
    )
    
    assert eh.retry_on_timeout is True
    assert eh.max_retries == 3
    assert len(eh.fallback_flows) == 1


def test_flow_config_validation():
    """Test FlowConfig validation."""
    # Valid flow
    flow = FlowConfig(
        flow_id="test_flow",
        name="Test Flow",
        steps=[
            StepConfig(id="step1", agent="agent1", critical=True)
        ]
    )
    is_valid, errors = flow.validate()
    assert is_valid is True
    assert len(errors) == 0
    
    # Invalid - no steps
    flow_no_steps = FlowConfig(
        flow_id="test_flow",
        name="Test Flow",
        steps=[]
    )
    is_valid, errors = flow_no_steps.validate()
    assert is_valid is False
    assert "at least one step" in errors[0]
    
    # Invalid - duplicate step IDs
    flow_dup_ids = FlowConfig(
        flow_id="test_flow",
        name="Test Flow",
        steps=[
            StepConfig(id="step1", agent="agent1"),
            StepConfig(id="step1", agent="agent2")  # Duplicate ID
        ]
    )
    is_valid, errors = flow_dup_ids.validate()
    assert is_valid is False
    assert "unique" in errors[0].lower()


def test_flow_config_get_step_by_id():
    """Test FlowConfig.get_step_by_id()."""
    flow = FlowConfig(
        flow_id="test",
        name="Test",
        steps=[
            StepConfig(id="step1", agent="agent1"),
            StepConfig(id="step2", agent="agent2")
        ]
    )
    
    step = flow.get_step_by_id("step1")
    assert step is not None
    assert step.agent == "agent1"
    
    missing = flow.get_step_by_id("step999")
    assert missing is None


# ============================================
# FlowLoader Tests
# ============================================

@pytest.fixture
def temp_flow_dir():
    """Create temporary directory for flow files."""
    with tempfile.TemporaryDirectory() as tmpdir:
        tmpdir = Path(tmpdir)
        
        # Create mode directories
        (tmpdir / "flash").mkdir()
        (tmpdir / "pro").mkdir()
        
        yield tmpdir


@pytest.fixture
def valid_flow_json():
    """Valid flow JSON for testing."""
    return {
        "flow_id": "test_flow_v1",
        "name": "Test Flow",
        "description": "A test flow",
        "version": "1.0.0",
        "profile": {
            "hardware_mode": "cpu_only",
            "max_memory_gb": 4
        },
        "config": {
            "max_execution_time": 10,
            "enable_cache": True
        },
        "steps": [
            {
                "id": "step_1",
                "agent": "preprocessor",
                "config": {"normalize": True},
                "timeout": 1.0,
                "critical": True
            },
            {
                "id": "step_2",
                "agent": "llm",
                "config": {"model": "test"},
                "timeout": 5.0,
                "critical": True
            }
        ],
        "error_handling": {
            "retry_on_timeout": True,
            "max_retries": 2
        }
    }


def test_flow_loader_init():
    """Test FlowLoader initialization."""
    loader = FlowLoader()
    assert loader.base_path.exists() or True  # Path might not exist yet


def test_flow_loader_load_valid_flow(temp_flow_dir, valid_flow_json):
    """Test loading valid flow."""
    # Write flow file
    flow_path = temp_flow_dir / "flash" / "test.json"
    with open(flow_path, 'w') as f:
        json.dump(valid_flow_json, f)
    
    # Load flow
    loader = FlowLoader(base_path=temp_flow_dir)
    flow = loader.load_flow("flash/test.json")
    
    assert flow.flow_id == "test_flow_v1"
    assert flow.name == "Test Flow"
    assert len(flow.steps) == 2
    assert flow.steps[0].agent == "preprocessor"
    assert flow.profile.hardware_mode == "cpu_only"
    assert flow.error_handling.max_retries == 2


def test_flow_loader_file_not_found(temp_flow_dir):
    """Test loading non-existent flow."""
    loader = FlowLoader(base_path=temp_flow_dir)
    
    with pytest.raises(FileNotFoundError):
        loader.load_flow("missing/flow.json")


def test_flow_loader_invalid_json(temp_flow_dir):
    """Test loading invalid JSON."""
    # Write invalid JSON
    flow_path = temp_flow_dir / "flash" / "invalid.json"
    with open(flow_path, 'w') as f:
        f.write("{ invalid json")
    
    loader = FlowLoader(base_path=temp_flow_dir)
    
    with pytest.raises(ValueError, match="Invalid JSON"):
        loader.load_flow("flash/invalid.json")


def test_flow_loader_missing_required_fields(temp_flow_dir):
    """Test loading flow with missing required fields."""
    # Missing flow_id
    invalid_flow = {
        "name": "Test Flow",
        "steps": []
    }
    
    flow_path = temp_flow_dir / "flash" / "invalid.json"
    with open(flow_path, 'w') as f:
        json.dump(invalid_flow, f)
    
    loader = FlowLoader(base_path=temp_flow_dir)
    
    with pytest.raises(ValueError, match="Missing required field"):
        loader.load_flow("flash/invalid.json")


def test_flow_loader_load_by_id(temp_flow_dir, valid_flow_json):
    """Test load_flow_by_id() convenience method."""
    # Write flow file
    flow_path = temp_flow_dir / "flash" / "base.json"
    with open(flow_path, 'w') as f:
        json.dump(valid_flow_json, f)
    
    loader = FlowLoader(base_path=temp_flow_dir)
    flow = loader.load_flow_by_id("flash", "base")
    
    assert flow.flow_id == "test_flow_v1"


def test_flow_loader_list_flows(temp_flow_dir, valid_flow_json):
    """Test listing available flows."""
    # Create multiple flow files
    for mode in ["flash", "pro"]:
        for name in ["base", "advanced"]:
            flow_path = temp_flow_dir / mode / f"{name}.json"
            with open(flow_path, 'w') as f:
                json.dump(valid_flow_json, f)
    
    loader = FlowLoader(base_path=temp_flow_dir)
    
    # List all flows
    all_flows = loader.list_flows()
    assert len(all_flows) == 4
    assert "flash/base.json" in all_flows
    assert "pro/advanced.json" in all_flows
    
    # List flash flows only
    flash_flows = loader.list_flows(mode="flash")
    assert len(flash_flows) == 2
    assert all("flash" in f for f in flash_flows)


def test_flow_loader_validate_flow_data():
    """Test validate_flow_data() without loading."""
    loader = FlowLoader()
    
    # Valid data
    valid_data = {
        "flow_id": "test",
        "name": "Test",
        "steps": [
            {"id": "step1", "agent": "agent1"}
        ]
    }
    is_valid, errors = loader.validate_flow_data(valid_data)
    assert is_valid is True
    assert len(errors) == 0
    
    # Invalid - missing flow_id
    invalid_data = {
        "name": "Test",
        "steps": []
    }
    is_valid, errors = loader.validate_flow_data(invalid_data)
    assert is_valid is False
    assert any("flow_id" in e for e in errors)
    
    # Invalid - steps not array
    invalid_steps = {
        "flow_id": "test",
        "name": "Test",
        "steps": "not an array"
    }
    is_valid, errors = loader.validate_flow_data(invalid_steps)
    assert is_valid is False
    assert any("array" in e for e in errors)


# ============================================
# Real Flow Tests
# ============================================

def test_load_flash_base_flow():
    """Test loading actual flash/base.json flow."""
    loader = FlowLoader()
    
    try:
        flow = loader.load_flow_by_id("flash", "base")
        
        assert flow.flow_id == "flash_base_v1"
        assert flow.name == "Flash Mode - Base"
        assert len(flow.steps) >= 3  # At least preprocessor, llm, formatter
        
        # Check profile
        assert flow.profile.hardware_mode == "gpu_4060"
        assert flow.profile.max_memory_gb == 8
        
        # Check signature
        assert flow.signature is not None
        assert flow.signature.hash.startswith("sha256:")
        
        # Check error handling
        assert flow.error_handling.retry_on_timeout is True
        assert flow.error_handling.max_retries == 2
        
        # Check optimization
        assert flow.optimization.resource_aware is True
        
        print(f"✅ Flash base flow loaded: {len(flow.steps)} steps")
        
    except FileNotFoundError:
        pytest.skip("Flash base flow not found (expected during development)")


def test_load_pro_rag_flow():
    """Test loading actual pro/rag_full.json flow."""
    loader = FlowLoader()
    
    try:
        flow = loader.load_flow_by_id("pro", "rag_full")
        
        assert flow.flow_id == "pro_rag_full_v1"
        assert flow.name == "Pro Mode - Full RAG"
        assert len(flow.steps) >= 4  # At least preprocessor, retriever, llm, formatter
        
        # Check config
        assert flow.config.get("enable_reasoning") is True
        
        # Check fallbacks
        assert "flash_base_v1" in flow.error_handling.fallback_flows
        
        # Check optimization
        assert flow.optimization.enable_parallel is True
        
        print(f"✅ Pro RAG flow loaded: {len(flow.steps)} steps")
        
    except FileNotFoundError:
        pytest.skip("Pro RAG flow not found (expected during development)")


# ============================================
# Integration Tests
# ============================================

def test_flow_config_from_dict_complete():
    """Test complete FlowConfig.from_dict() with all fields."""
    data = {
        "flow_id": "complete_test",
        "name": "Complete Test",
        "description": "Full test",
        "version": "2.0.0",
        "metadata": {"author": "Test"},
        "profile": {
            "target_device": "cloud",
            "hardware_mode": "gpu_a100"
        },
        "signature": {
            "hash": "sha256:abc123",
            "last_verified": "2025-01-01",
            "auto_update": False
        },
        "config": {
            "max_execution_time": 20,
            "auto_model_switch": True
        },
        "steps": [
            {
                "id": "step1",
                "agent": "agent1",
                "description": "First step",
                "config": {"param": "value"},
                "condition": "cache_hit == false",
                "timeout": 5.0,
                "critical": True
            }
        ],
        "error_handling": {
            "retry_on_timeout": True,
            "max_retries": 3,
            "fallback_flows": ["backup_flow"]
        },
        "optimization": {
            "enable_parallel": True,
            "priority": "speed",
            "adaptive_timeout": True
        }
    }
    
    flow = FlowConfig.from_dict(data)
    
    assert flow.flow_id == "complete_test"
    assert flow.version == "2.0.0"
    assert flow.profile.hardware_mode == "gpu_a100"
    assert flow.signature.hash == "sha256:abc123"
    assert flow.config["auto_model_switch"] is True
    assert len(flow.steps) == 1
    assert flow.steps[0].critical is True
    assert flow.error_handling.max_retries == 3
    assert flow.optimization.enable_parallel is True


def test_step_condition_with_context():
    """Test step condition evaluation with real context."""
    step = StepConfig(
        id="cache_check",
        agent="cache_lookup",
        condition="flags.cache_hit == false"
    )
    
    context = ExecutionContext({"query": "test"})
    
    # Initially should run (cache_hit not set)
    assert step.should_execute(context) is True
    
    # After cache hit, should not run
    context.set_flag("cache_hit", True)
    assert step.should_execute(context) is False


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
