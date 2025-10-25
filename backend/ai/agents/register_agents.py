"""
Register All Agents to Global Registry

Helper module to register all available agents to the global registry.
Call register_all_agents() to automatically register all agents.
"""

import logging

# Import all agent classes
from .preprocessor import PreprocessorAgent
from .router_agent import RouterAgentWrapper
from .rag_agent import RAGAgentWrapper
from .execution_agent import ExecutionAgentWrapper
from .llm_agent import LLMAgent
from .formatter import FormatterAgent
from .persona_agent import PersonaAgentWrapper
from .cache_lookup import CacheLookupAgent
from .cache_store import CacheStoreAgent

logger = logging.getLogger(__name__)


def register_all_agents(registry=None):
    """
    Register all available agents to the registry.
    
    Args:
        registry: AgentRegistry instance (default: global registry)
    
    Returns:
        AgentRegistry with all agents registered
    """
    if registry is None:
        # Lazy import to avoid circular dependency
        from ..flow.registry import get_global_registry
        registry = get_global_registry()
    
    logger.info("🔧 Registering all agents...")
    
    # Register agents
    agents = [
        ("preprocessor", PreprocessorAgent),
        ("router", RouterAgentWrapper),
        ("rag", RAGAgentWrapper),
        ("execution", ExecutionAgentWrapper),
        ("llm_agent", LLMAgent),
        ("formatter", FormatterAgent),
        ("persona", PersonaAgentWrapper),
        ("cache_lookup", CacheLookupAgent),
        ("cache_store", CacheStoreAgent),
    ]
    
    for name, agent_class in agents:
        registry.register_agent(name, agent_class)
    
    logger.info(f"✅ Registered {len(agents)} agents")
    logger.info(f"   Available agents: {', '.join([n for n, _ in agents])}")
    
    return registry


def get_agent_info_all(registry=None):
    """
    Get information about all registered agents.
    
    Args:
        registry: AgentRegistry instance (default: global registry)
    
    Returns:
        Dict with agent information
    """
    if registry is None:
        # Lazy import to avoid circular dependency
        from ..flow.registry import get_global_registry
        registry = get_global_registry()
    
    agents_list = registry.list_agents()
    info = {}
    
    for agent_name in agents_list:
        try:
            info[agent_name] = registry.get_agent_info(agent_name)
        except Exception as e:
            info[agent_name] = {"error": str(e)}
    
    return info
