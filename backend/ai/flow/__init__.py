"""
Flow Orchestration Module

Provides core components for dynamic flow execution:
- ExecutionContext: Shared context between agents
- FlowLoader: Load and validate flow configs
- FlowExecutor: Execute flows step by step
"""

from .context import ExecutionContext

__all__ = ['ExecutionContext']
