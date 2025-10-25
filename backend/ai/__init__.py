"""
AI Module for ChimeraAI

New architecture (Phase 6.7+):
- flow/ - Flow orchestration
- agents/ - Plugin-based agents
- retrievers/ - Unified retrieval interface
"""

# Only import what's available
from .ollama_client import OllamaClient

__all__ = ['OllamaClient']
