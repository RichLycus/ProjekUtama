"""
Flow Orchestration Module

Provides core components for dynamic flow execution:
- ExecutionContext: Shared context between agents
- FlowLoader: Load and validate flow configs
- FlowConfig: Flow configuration dataclasses
- FlowExecutor: Execute flows step by step (coming in 6.7.3)
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

__all__ = [
    'ExecutionContext',
    'FlowLoader',
    'FlowConfig',
    'StepConfig',
    'ExecutionProfile',
    'FlowSignature',
    'ErrorHandling',
    'OptimizationConfig'
]
