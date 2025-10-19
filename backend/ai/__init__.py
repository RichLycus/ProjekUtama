"""AI Module for ChimeraAI Phase 3 - Multi-Agent System"""

from .ollama_client import OllamaClient
from .agents import RouterAgent, RAGAgent, ExecutionAgent, ReasoningAgent, PersonaAgent
from .agent_orchestrator import AgentOrchestrator

__all__ = [
    'OllamaClient',
    'RouterAgent',
    'RAGAgent',
    'ExecutionAgent',
    'ReasoningAgent',
    'PersonaAgent',
    'AgentOrchestrator'
]
