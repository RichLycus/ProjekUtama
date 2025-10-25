"""
Agent Registry

Central registry for managing and loading agent instances.
Supports plugin-based architecture where agents can be registered dynamically.
"""

from typing import Dict, Any, Optional, Type, List
from pathlib import Path
import logging

from ..agents.base import BaseAgent

logger = logging.getLogger(__name__)


class AgentRegistry:
    """
    Central registry for agent management.
    
    The registry acts as a factory for agent instances, allowing:
    - Dynamic agent registration
    - Lazy loading of agents
    - Agent discovery and listing
    - Type safety through BaseAgent interface
    
    Example:
        ```python
        registry = AgentRegistry()
        
        # Register agent
        registry.register_agent("preprocessor", PreprocessorAgent)
        
        # Get agent instance
        agent = registry.get_agent("preprocessor", config={"max_length": 1000})
        
        # List all agents
        available = registry.list_agents()
        ```
    """
    
    def __init__(self):
        """Initialize empty agent registry."""
        self._agents: Dict[str, Type[BaseAgent]] = {}
        self._instances: Dict[str, BaseAgent] = {}
        logger.info("AgentRegistry initialized")
    
    def register_agent(self, name: str, agent_class: Type[BaseAgent]) -> None:
        """
        Register an agent class.
        
        Args:
            name: Unique agent identifier (e.g., "preprocessor", "llm_simple")
            agent_class: Agent class (must inherit from BaseAgent)
        
        Raises:
            ValueError: If agent_class doesn't inherit from BaseAgent
            ValueError: If agent name already registered
        """
        # Validate agent class
        if not issubclass(agent_class, BaseAgent):
            raise ValueError(
                f"Agent class must inherit from BaseAgent, got {agent_class}"
            )
        
        # Check for duplicate registration
        if name in self._agents:
            logger.warning(f"Agent '{name}' already registered, overwriting")
        
        self._agents[name] = agent_class
        logger.info(f"✅ Registered agent: {name} ({agent_class.__name__})")
    
    def get_agent(
        self, 
        name: str, 
        config: Optional[Dict[str, Any]] = None,
        reuse: bool = False
    ) -> BaseAgent:
        """
        Get agent instance.
        
        Args:
            name: Agent name
            config: Agent-specific configuration
            reuse: If True, reuse existing instance (default: create new)
        
        Returns:
            Agent instance
        
        Raises:
            ValueError: If agent not found in registry
        """
        if name not in self._agents:
            available = ", ".join(self._agents.keys()) or "none"
            raise ValueError(
                f"Agent '{name}' not found in registry. "
                f"Available agents: {available}"
            )
        
        # Reuse existing instance if requested
        if reuse and name in self._instances:
            logger.debug(f"Reusing existing agent instance: {name}")
            return self._instances[name]
        
        # Create new instance
        agent_class = self._agents[name]
        agent = agent_class(config=config or {})
        
        # Cache instance if reuse enabled
        if reuse:
            self._instances[name] = agent
        
        logger.debug(f"Created agent instance: {name}")
        return agent
    
    def has_agent(self, name: str) -> bool:
        """
        Check if agent is registered.
        
        Args:
            name: Agent name
        
        Returns:
            True if agent exists, False otherwise
        """
        return name in self._agents
    
    def list_agents(self) -> List[str]:
        """
        List all registered agent names.
        
        Returns:
            List of agent names
        """
        return sorted(self._agents.keys())
    
    def unregister_agent(self, name: str) -> None:
        """
        Unregister an agent.
        
        Args:
            name: Agent name to remove
        """
        if name in self._agents:
            del self._agents[name]
            logger.info(f"Unregistered agent: {name}")
        
        if name in self._instances:
            del self._instances[name]
    
    def clear(self) -> None:
        """Clear all registered agents and instances."""
        self._agents.clear()
        self._instances.clear()
        logger.info("Cleared all agents from registry")
    
    def get_agent_info(self, name: str) -> Dict[str, Any]:
        """
        Get agent metadata.
        
        Args:
            name: Agent name
        
        Returns:
            Dictionary with agent information
        
        Raises:
            ValueError: If agent not found
        """
        if name not in self._agents:
            raise ValueError(f"Agent '{name}' not found")
        
        agent_class = self._agents[name]
        return {
            "name": name,
            "class": agent_class.__name__,
            "module": agent_class.__module__,
            "description": agent_class.__doc__ or "No description",
            "cached": name in self._instances
        }
    
    def __repr__(self) -> str:
        """String representation of registry."""
        count = len(self._agents)
        cached = len(self._instances)
        return f"AgentRegistry(agents={count}, cached={cached})"
    
    def __len__(self) -> int:
        """Number of registered agents."""
        return len(self._agents)


# Global registry instance (singleton pattern)
_global_registry: Optional[AgentRegistry] = None


def get_global_registry() -> AgentRegistry:
    """
    Get global agent registry instance.
    
    Returns:
        Global AgentRegistry singleton
    """
    global _global_registry
    if _global_registry is None:
        _global_registry = AgentRegistry()
    return _global_registry


def register_agent(name: str, agent_class: Type[BaseAgent]) -> None:
    """
    Register agent in global registry.
    
    Convenience function for registering agents globally.
    
    Args:
        name: Agent name
        agent_class: Agent class
    """
    registry = get_global_registry()
    registry.register_agent(name, agent_class)
