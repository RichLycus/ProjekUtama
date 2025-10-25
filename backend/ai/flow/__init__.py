"""
Flow Orchestration Module

Provides core components for dynamic flow execution:
- ExecutionContext: Shared context between agents
- FlowLoader: Load and validate flow configs
- FlowConfig: Flow configuration dataclasses
- FlowExecutor: Execute flows step by step
- AgentRegistry: Manage and load agents
"""

from .context import ExecutionContext
from .loader import (
    FlowLoader,
    FlowConfig,
    StepConfig,
    ExecutionProfile,
    FlowSignature,
    ErrorHandling,
    OptimizationConfig
)
from .executor import FlowExecutor
from .registry import AgentRegistry, get_global_registry, register_agent

__all__ = [
    'ExecutionContext',
    'FlowLoader',
    'FlowConfig',
    'StepConfig',
    'ExecutionProfile',
    'FlowSignature',
    'ErrorHandling',
    'OptimizationConfig',
    'FlowExecutor',
    'AgentRegistry',
    'get_global_registry',
    'register_agent'
]
