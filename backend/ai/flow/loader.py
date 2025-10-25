"""
Flow Loader & Parser

Loads and validates JSON flow configurations.
Provides dataclasses for structured flow representation.
"""

from typing import Dict, Any, List, Optional
from dataclasses import dataclass, field
from pathlib import Path
import json
import logging
import hashlib
from datetime import datetime

logger = logging.getLogger(__name__)


@dataclass
class ExecutionProfile:
    """
    Hardware execution profile for flow optimization.
    
    Attributes:
        target_device: Target device (local, cloud, edge)
        hardware_mode: Specific hardware (gpu_4060, cpu_only, etc.)
        max_memory_gb: Maximum memory available
        concurrency_limit: Max parallel operations
        precision: Model precision (fp16, fp32, int8)
        offload_kv_cache: Whether to offload KV cache to CPU
    """
    target_device: str = "local"
    hardware_mode: str = "auto"
    max_memory_gb: int = 8
    concurrency_limit: int = 2
    precision: str = "fp16"
    offload_kv_cache: bool = True
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'ExecutionProfile':
        """Create profile from dictionary."""
        return cls(
            target_device=data.get("target_device", "local"),
            hardware_mode=data.get("hardware_mode", "auto"),
            max_memory_gb=data.get("max_memory_gb", 8),
            concurrency_limit=data.get("concurrency_limit", 2),
            precision=data.get("precision", "fp16"),
            offload_kv_cache=data.get("offload_kv_cache", True)
        )


@dataclass
class FlowSignature:
    """
    Flow signature for versioning and integrity.
    
    Attributes:
        hash: SHA-256 hash of flow content
        last_verified: Last verification timestamp
        auto_update: Enable automatic updates
    """
    hash: str
    last_verified: str
    auto_update: bool = True
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'FlowSignature':
        """Create signature from dictionary."""
        return cls(
            hash=data.get("hash", ""),
            last_verified=data.get("last_verified", datetime.now().isoformat()),
            auto_update=data.get("auto_update", True)
        )


@dataclass
class StepConfig:
    """
    Configuration for a single flow step.
    
    Attributes:
        id: Unique step identifier
        agent: Agent name to execute
        description: Human-readable description
        config: Agent-specific configuration
        condition: Optional condition for execution (e.g., "cache_hit == false")
        timeout: Maximum execution time in seconds
        critical: Whether step failure should fail entire flow
        on_success: Actions to take on success (set flags, skip steps)
    """
    id: str
    agent: str
    description: str = ""
    config: Dict[str, Any] = field(default_factory=dict)
    condition: Optional[str] = None
    timeout: float = 5.0
    critical: bool = False
    on_success: Optional[Dict[str, Any]] = None
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'StepConfig':
        """Create step config from dictionary."""
        return cls(
            id=data["id"],
            agent=data["agent"],
            description=data.get("description", ""),
            config=data.get("config", {}),
            condition=data.get("condition"),
            timeout=data.get("timeout", 5.0),
            critical=data.get("critical", False),
            on_success=data.get("on_success")
        )
    
    def should_execute(self, context: Any) -> bool:
        """
        Check if step should execute based on condition.
        
        Args:
            context: Execution context with data and flags
        
        Returns:
            True if should execute, False to skip
        """
        if self.condition is None:
            return True
        
        try:
            # Simple condition evaluation
            # TODO: Implement safe expression evaluator
            return self._evaluate_condition(self.condition, context)
        except Exception as e:
            logger.warning(f"Failed to evaluate condition '{self.condition}': {e}")
            return True  # Execute on evaluation failure (safe default)
    
    def _evaluate_condition(self, condition: str, context: Any) -> bool:
        """
        Evaluate condition string against context.
        
        Simple implementation for now - will be enhanced in Phase 6.8.
        
        Args:
            condition: Condition string (e.g., "cache_hit == false")
            context: Execution context
        
        Returns:
            Boolean result
        """
        # For now, just check simple flag conditions
        if "==" in condition:
            parts = condition.split("==")
            if len(parts) == 2:
                key = parts[0].strip()
                value = parts[1].strip()
                
                # Handle config.key format
                if key.startswith("config."):
                    config_key = key.replace("config.", "")
                    return str(context.get(f"_config_{config_key}")) == value
                
                # Handle flags.key format
                elif key.startswith("flags."):
                    flag_key = key.replace("flags.", "")
                    expected = value.lower() == "true"
                    return context.get_flag(flag_key) == expected
                
                # Handle direct key
                else:
                    return str(context.get(key)) == value
        
        return True


@dataclass
class ErrorHandling:
    """
    Error handling configuration.
    
    Attributes:
        retry_on_timeout: Retry on timeout errors
        max_retries: Maximum retry attempts
        retry_delay: Delay between retries (seconds)
        fallback_flows: List of fallback flow IDs
        log_level: Logging level (debug, info, warning, error)
        on_fail: Recovery agent configuration
    """
    retry_on_timeout: bool = False
    max_retries: int = 0
    retry_delay: float = 0.5
    fallback_flows: List[str] = field(default_factory=list)
    log_level: str = "info"
    on_fail: Optional[Dict[str, Any]] = None
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'ErrorHandling':
        """Create error handling from dictionary."""
        return cls(
            retry_on_timeout=data.get("retry_on_timeout", False),
            max_retries=data.get("max_retries", 0),
            retry_delay=data.get("retry_delay", 0.5),
            fallback_flows=data.get("fallback_flows", []),
            log_level=data.get("log_level", "info"),
            on_fail=data.get("on_fail")
        )


@dataclass
class OptimizationConfig:
    """
    Flow optimization configuration.
    
    Attributes:
        enable_parallel: Enable parallel execution
        parallel_groups: Groups of steps that can run in parallel
        priority: Optimization priority (speed, quality, balanced)
        adaptive_timeout: Enable adaptive timeout based on load
        resource_aware: Enable resource-aware execution
    """
    enable_parallel: bool = False
    parallel_groups: List[List[str]] = field(default_factory=list)
    priority: str = "balanced"
    adaptive_timeout: bool = False
    resource_aware: bool = True
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'OptimizationConfig':
        """Create optimization config from dictionary."""
        return cls(
            enable_parallel=data.get("enable_parallel", False),
            parallel_groups=data.get("parallel_groups", []),
            priority=data.get("priority", "balanced"),
            adaptive_timeout=data.get("adaptive_timeout", False),
            resource_aware=data.get("resource_aware", True)
        )


@dataclass
class FlowConfig:
    """
    Complete flow configuration.
    
    Attributes:
        flow_id: Unique flow identifier
        name: Human-readable flow name
        description: Flow description
        version: Flow version (semver)
        metadata: Additional metadata
        profile: Execution profile
        signature: Flow signature
        config: Flow-level configuration
        steps: List of step configurations
        error_handling: Error handling configuration
        optimization: Optimization configuration
    """
    flow_id: str
    name: str
    description: str = ""
    version: str = "1.0.0"
    metadata: Dict[str, Any] = field(default_factory=dict)
    profile: ExecutionProfile = field(default_factory=ExecutionProfile)
    signature: Optional[FlowSignature] = None
    config: Dict[str, Any] = field(default_factory=dict)
    steps: List[StepConfig] = field(default_factory=list)
    error_handling: ErrorHandling = field(default_factory=ErrorHandling)
    optimization: OptimizationConfig = field(default_factory=OptimizationConfig)
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'FlowConfig':
        """Create flow config from dictionary."""
        # Check required fields
        if "flow_id" not in data:
            raise ValueError("Missing required field: flow_id")
        if "name" not in data:
            raise ValueError("Missing required field: name")
        
        return cls(
            flow_id=data["flow_id"],
            name=data["name"],
            description=data.get("description", ""),
            version=data.get("version", "1.0.0"),
            metadata=data.get("metadata", {}),
            profile=ExecutionProfile.from_dict(data.get("profile", {})),
            signature=FlowSignature.from_dict(data["signature"]) if "signature" in data else None,
            config=data.get("config", {}),
            steps=[StepConfig.from_dict(step) for step in data.get("steps", [])],
            error_handling=ErrorHandling.from_dict(data.get("error_handling", {})),
            optimization=OptimizationConfig.from_dict(data.get("optimization", {}))
        )
    
    def get_step_by_id(self, step_id: str) -> Optional[StepConfig]:
        """Get step configuration by ID."""
        for step in self.steps:
            if step.id == step_id:
                return step
        return None
    
    def validate(self) -> tuple[bool, List[str]]:
        """
        Validate flow configuration.
        
        Returns:
            Tuple of (is_valid, error_messages)
        """
        errors = []
        
        # Check required fields
        if not self.flow_id:
            errors.append("Missing required field: flow_id")
        
        if not self.name:
            errors.append("Missing required field: name")
        
        if not self.steps:
            errors.append("Flow must have at least one step")
        
        # Check step IDs are unique
        step_ids = [step.id for step in self.steps]
        if len(step_ids) != len(set(step_ids)):
            errors.append("Step IDs must be unique")
        
        # Check critical steps
        has_critical = any(step.critical for step in self.steps)
        if not has_critical:
            logger.warning("Flow has no critical steps - might not fail on errors")
        
        # Validate profile
        if self.profile.max_memory_gb <= 0:
            errors.append("max_memory_gb must be positive")
        
        if self.profile.concurrency_limit <= 0:
            errors.append("concurrency_limit must be positive")
        
        return (len(errors) == 0, errors)


class FlowLoader:
    """
    Flow configuration loader and parser.
    
    Loads JSON flow configurations from files and validates structure.
    """
    
    def __init__(self, base_path: Optional[Path] = None):
        """
        Initialize flow loader.
        
        Args:
            base_path: Base directory for flow configs (default: ai/flows/)
        """
        if base_path is None:
            # Default to ai/flows/ relative to this file
            base_path = Path(__file__).parent.parent / "flows"
        
        self.base_path = Path(base_path)
        logger.info(f"FlowLoader initialized with base_path: {self.base_path}")
    
    def load_flow(self, flow_path: str) -> FlowConfig:
        """
        Load flow configuration from file.
        
        Args:
            flow_path: Path to flow JSON file (relative to base_path or absolute)
        
        Returns:
            Parsed FlowConfig object
        
        Raises:
            FileNotFoundError: If flow file not found
            ValueError: If flow validation fails
            json.JSONDecodeError: If JSON is invalid
        """
        # Resolve path
        path = Path(flow_path)
        if not path.is_absolute():
            path = self.base_path / path
        
        logger.info(f"Loading flow from: {path}")
        
        # Check file exists
        if not path.exists():
            raise FileNotFoundError(f"Flow file not found: {path}")
        
        # Load JSON
        try:
            with open(path, 'r', encoding='utf-8') as f:
                data = json.load(f)
        except json.JSONDecodeError as e:
            raise ValueError(f"Invalid JSON in flow file: {e}")
        
        # Parse to FlowConfig
        flow = FlowConfig.from_dict(data)
        
        # Validate
        is_valid, errors = flow.validate()
        if not is_valid:
            error_msg = "Flow validation failed:\n" + "\n".join(f"  - {e}" for e in errors)
            raise ValueError(error_msg)
        
        # Verify signature if present
        if flow.signature:
            self._verify_signature(flow, data)
        
        logger.info(f"✅ Flow loaded successfully: {flow.flow_id} (v{flow.version})")
        logger.info(f"   Steps: {len(flow.steps)}, Profile: {flow.profile.hardware_mode}")
        
        return flow
    
    def load_flow_by_id(self, mode: str, flow_name: str) -> FlowConfig:
        """
        Load flow by mode and name.
        
        Args:
            mode: Flow mode (flash, pro, hybrid, persona)
            flow_name: Flow name (base, rag_full, cached, etc.)
        
        Returns:
            Parsed FlowConfig object
        
        Example:
            loader.load_flow_by_id("flash", "base") → flash/base.json
            loader.load_flow_by_id("pro", "rag_full") → pro/rag_full.json
        """
        flow_path = f"{mode}/{flow_name}.json"
        return self.load_flow(flow_path)
    
    def list_flows(self, mode: Optional[str] = None) -> List[str]:
        """
        List available flow configurations.
        
        Args:
            mode: Optional mode filter (flash, pro, etc.)
        
        Returns:
            List of available flow paths
        """
        flows = []
        
        if mode:
            # List flows in specific mode
            mode_path = self.base_path / mode
            if mode_path.exists():
                flows.extend([
                    f"{mode}/{f.name}"
                    for f in mode_path.glob("*.json")
                ])
        else:
            # List all flows
            for mode_dir in self.base_path.iterdir():
                if mode_dir.is_dir():
                    flows.extend([
                        f"{mode_dir.name}/{f.name}"
                        for f in mode_dir.glob("*.json")
                    ])
        
        return sorted(flows)
    
    def _verify_signature(self, flow: FlowConfig, data: Dict[str, Any]) -> bool:
        """
        Verify flow signature matches content.
        
        Args:
            flow: Parsed flow config
            data: Raw flow data
        
        Returns:
            True if signature valid, False otherwise
        """
        if not flow.signature:
            return True
        
        # Calculate hash (excluding signature field)
        data_copy = data.copy()
        data_copy.pop("signature", None)
        content = json.dumps(data_copy, sort_keys=True)
        calculated_hash = f"sha256:{hashlib.sha256(content.encode()).hexdigest()}"
        
        if flow.signature.hash != calculated_hash:
            logger.warning(
                f"⚠️ Flow signature mismatch!\n"
                f"   Expected: {flow.signature.hash[:20]}...\n"
                f"   Got: {calculated_hash[:20]}..."
            )
            return False
        
        logger.debug("✅ Flow signature verified")
        return True
    
    def validate_flow_data(self, data: Dict[str, Any]) -> tuple[bool, List[str]]:
        """
        Validate raw flow data without creating FlowConfig.
        
        Args:
            data: Raw flow dictionary
        
        Returns:
            Tuple of (is_valid, error_messages)
        """
        errors = []
        
        # Check required top-level fields
        required_fields = ["flow_id", "name", "steps"]
        for field in required_fields:
            if field not in data:
                errors.append(f"Missing required field: {field}")
        
        # Check steps structure
        if "steps" in data:
            if not isinstance(data["steps"], list):
                errors.append("'steps' must be an array")
            elif len(data["steps"]) == 0:
                errors.append("'steps' array cannot be empty")
            else:
                # Check each step
                for i, step in enumerate(data["steps"]):
                    if not isinstance(step, dict):
                        errors.append(f"Step {i} must be an object")
                        continue
                    
                    # Check required step fields
                    if "id" not in step:
                        errors.append(f"Step {i} missing required field: id")
                    if "agent" not in step:
                        errors.append(f"Step {i} missing required field: agent")
        
        return (len(errors) == 0, errors)
    
    def __repr__(self) -> str:
        """String representation of loader."""
        return f"FlowLoader(base_path={self.base_path})"
