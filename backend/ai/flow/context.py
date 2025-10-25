"""
Execution Context

Shared context object passed between agents during flow execution.
Provides a unified interface for data storage, metadata tracking, and logging.
"""

from typing import Dict, Any, List, Optional
from datetime import datetime
import uuid
import json


class ExecutionContext:
    """
    Shared execution context passed between agents in a flow.
    
    The context acts as a shared memory space where:
    - Agents read input data
    - Agents write output data
    - Execution metadata is tracked
    - Errors are logged
    
    Example:
        ```python
        context = ExecutionContext({
            "message": "Hello world",
            "user_id": "user_123"
        })
        
        # Agents read from context
        message = context.get("message")
        
        # Agents write to context
        context.set("processed_message", message.upper())
        
        # Log agent execution
        context.log_step("preprocessor", timing=0.5, output={"status": "success"})
        ```
    """
    
    def __init__(self, initial_data: Optional[Dict[str, Any]] = None):
        """
        Initialize execution context.
        
        Args:
            initial_data: Initial data to populate context (e.g., user input)
        """
        self.context_id = f"ctx_{uuid.uuid4().hex[:12]}"
        self.created_at = datetime.now()
        
        # Core data storage
        self.data: Dict[str, Any] = initial_data or {}
        
        # Execution metadata
        self.metadata = {
            "context_id": self.context_id,
            "created_at": self.created_at.isoformat(),
            "flow_id": None,
            "steps_executed": [],
            "errors": [],
            "timing": {}
        }
        
        # Agent outputs (keyed by agent name)
        self.agent_outputs: Dict[str, Any] = {}
        
        # Flags for conditional execution
        self.flags: Dict[str, bool] = {}
    
    def get(self, key: str, default: Any = None) -> Any:
        """
        Get value from context.
        
        Args:
            key: Data key to retrieve
            default: Default value if key not found
        
        Returns:
            Value associated with key, or default if not found
        """
        return self.data.get(key, default)
    
    def set(self, key: str, value: Any) -> None:
        """
        Set value in context.
        
        Args:
            key: Data key
            value: Value to store
        """
        self.data[key] = value
    
    def update(self, updates: Dict[str, Any]) -> None:
        """
        Update multiple values at once.
        
        Args:
            updates: Dictionary of key-value pairs to update
        """
        self.data.update(updates)
    
    def has(self, key: str) -> bool:
        """
        Check if key exists in context.
        
        Args:
            key: Key to check
        
        Returns:
            True if key exists, False otherwise
        """
        return key in self.data
    
    def delete(self, key: str) -> None:
        """
        Delete key from context.
        
        Args:
            key: Key to delete
        """
        if key in self.data:
            del self.data[key]
    
    def get_flag(self, flag_name: str) -> bool:
        """
        Get boolean flag value.
        
        Flags are used for conditional execution (e.g., "cache_hit", "needs_rag").
        
        Args:
            flag_name: Name of flag
        
        Returns:
            Flag value (False if not set)
        """
        return self.flags.get(flag_name, False)
    
    def set_flag(self, flag_name: str, value: bool = True) -> None:
        """
        Set boolean flag.
        
        Args:
            flag_name: Name of flag
            value: Flag value (default: True)
        """
        self.flags[flag_name] = value
    
    def log_step(self, agent_name: str, timing: float, output: Any = None, status: str = "success") -> None:
        """
        Log agent execution step.
        
        Args:
            agent_name: Name of agent that executed
            timing: Execution time in seconds
            output: Agent output data (optional)
            status: Execution status (success/error/skipped)
        """
        step_log = {
            "agent": agent_name,
            "timing": timing,
            "status": status,
            "timestamp": datetime.now().isoformat()
        }
        
        self.metadata["steps_executed"].append(step_log)
        self.metadata["timing"][agent_name] = timing
        
        if output is not None:
            self.agent_outputs[agent_name] = output
    
    def add_error(self, agent_name: str, error: str, error_type: str = "error") -> None:
        """
        Log error from agent execution.
        
        Args:
            agent_name: Name of agent that errored
            error: Error message
            error_type: Type of error (error/warning)
        """
        error_log = {
            "agent": agent_name,
            "error": error,
            "type": error_type,
            "timestamp": datetime.now().isoformat()
        }
        
        self.metadata["errors"].append(error_log)
    
    def get_agent_output(self, agent_name: str) -> Optional[Any]:
        """
        Get output from specific agent.
        
        Args:
            agent_name: Name of agent
        
        Returns:
            Agent output, or None if not found
        """
        return self.agent_outputs.get(agent_name)
    
    def get_total_time(self) -> float:
        """
        Get total execution time across all agents.
        
        Returns:
            Total time in seconds
        """
        return sum(self.metadata["timing"].values())
    
    def has_errors(self) -> bool:
        """
        Check if any errors occurred.
        
        Returns:
            True if errors exist, False otherwise
        """
        return len(self.metadata["errors"]) > 0
    
    def to_dict(self) -> Dict[str, Any]:
        """
        Export context as dictionary.
        
        Returns:
            Dictionary representation of context
        """
        return {
            "context_id": self.context_id,
            "data": self.data,
            "metadata": self.metadata,
            "agent_outputs": self.agent_outputs,
            "flags": self.flags,
            "total_time": self.get_total_time(),
            "has_errors": self.has_errors()
        }
    
    def to_json(self) -> str:
        """
        Export context as JSON string.
        
        Returns:
            JSON representation of context
        """
        return json.dumps(self.to_dict(), indent=2, default=str)
    
    def __repr__(self) -> str:
        """String representation of context."""
        return f"ExecutionContext(id={self.context_id}, steps={len(self.metadata['steps_executed'])}, errors={len(self.metadata['errors'])})"
