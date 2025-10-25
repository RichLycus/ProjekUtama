"""
Agent Plugins Module

Provides base interface and implementations for agent plugins.
All agents must inherit from BaseAgent and implement the run() method.
"""

from .base import BaseAgent
from .preprocessor import PreprocessorAgent
from .router_agent import RouterAgentWrapper
from .rag_agent import RAGAgentWrapper
from .execution_agent import ExecutionAgentWrapper
from .llm_agent import LLMAgent
from .formatter import FormatterAgent
from .persona_agent import PersonaAgentWrapper
from .cache_lookup import CacheLookupAgent
from .cache_store import CacheStoreAgent
from .register_agents import register_all_agents, get_agent_info_all

__all__ = [
    'BaseAgent',
    'PreprocessorAgent',
    'RouterAgentWrapper',
    'RAGAgentWrapper',
    'ExecutionAgentWrapper',
    'LLMAgent',
    'FormatterAgent',
    'PersonaAgentWrapper',
    'CacheLookupAgent',
    'CacheStoreAgent',
    'register_all_agents',
    'get_agent_info_all',
]
