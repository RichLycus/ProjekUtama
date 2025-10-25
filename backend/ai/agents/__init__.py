"""
Agent Plugins Module

Provides base interface and implementations for agent plugins.
All agents must inherit from BaseAgent and implement the run() method.
"""

from .base import BaseAgent

__all__ = ['BaseAgent']
