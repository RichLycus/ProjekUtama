"""Persona Agent Wrapper - Wraps existing PersonaAgent for flow system"""

from typing import Dict, Any
import logging

from .base import BaseAgent
from ..flow.context import ExecutionContext

logger = logging.getLogger(__name__)


class PersonaAgentWrapper(BaseAgent):
    """
    Wrapper for existing PersonaAgent.
    
    Applies persona formatting to response using LLM.
    Uses existing PersonaAgent from ai.agents module (single file).
    This keeps persona ALIVE with natural LLM-based formatting.
    
    Config options:
        - model (str): Model to use (default: from config_manager)
        - persona (str|dict): Persona name or full persona object
        - format (str): Output format - text/json/markdown (default: text)
        - include_metadata (bool): Include execution metadata (default: False)
    
    Example:
        ```python
        # With persona name
        agent = PersonaAgentWrapper(config={"persona": "lycus"})
        
        # With full persona object (from database)
        persona_obj = {
            "name": "lycus",
            "ai_name": "Lycus",
            "personality_traits": {"friendly": 80, "technical": 90},
            "system_prompt": "You are Lycus, a helpful AI...",
            "preferred_language": "id"
        }
        agent = PersonaAgentWrapper(config={"persona": persona_obj})
        
        context = ExecutionContext({"llm_response": "Python is a programming language."})
        context = agent.run(context)
        
        # Persona-formatted output
        print(context.get("output"))
        ```
    """
    
    def __init__(self, config: Dict[str, Any] = None):
        """Initialize persona wrapper."""
        super().__init__(config)
        self.agent_name = "persona"
        
        # Import from parent module
        import ai.legacy_agents as agents_module
        import ai.ollama_client as ollama_module
        import ai.config_manager as config_module
        
        # Get configuration
        config_manager = config_module.AIConfigManager()
        ollama_url = config_manager.get_ollama_url()
        model = self.config.get("model") or config_manager.get_model()
        
        # Initialize Ollama client and persona agent
        self.ollama = ollama_module.OllamaClient(ollama_url)
        self.persona = agents_module.PersonaAgent(self.ollama, model)
        
        # Get persona config
        self.persona_config = self.config.get("persona", "lycus")
        self.format_type = self.config.get("format", "text")
        self.include_metadata = self.config.get("include_metadata", False)
        
        logger.info(f"[{self.agent_name}] Initialized with model: {model}")
    
    def run(self, context: ExecutionContext) -> ExecutionContext:
        """
        Apply persona formatting to response.
        
        Args:
            context: Execution context with 'llm_response' or 'cached_response'
        
        Returns:
            Updated context with 'output', 'persona_log'
        """
        # Get input response (prefer cached_response if available, fallback to llm_response)
        raw_response = context.get("cached_response") or context.get("llm_response", "")
        
        if not raw_response:
            logger.warning(f"[{self.agent_name}] No response to format")
            context.set("output", "")
            return context
        
        logger.info(f"[{self.agent_name}] Applying persona formatting...")
        
        # Call existing PersonaAgent
        result = self.persona.format_response(
            raw_response=raw_response,
            persona=self.persona_config
        )
        
        # Extract results
        formatted_response = result.get("response", raw_response)
        log = result.get("log", "")
        persona_name = result.get("persona", "unknown")
        prompts = result.get("prompts", {})
        
        # Apply additional formatting if requested
        if self.format_type == "json":
            # Wrap in JSON structure
            import json
            formatted_output = json.dumps({
                "response": formatted_response,
                "persona": persona_name,
                "metadata": self._get_metadata(context) if self.include_metadata else None
            }, ensure_ascii=False, indent=2)
        elif self.format_type == "markdown":
            # Format as markdown
            formatted_output = f"**{persona_name.title()}:**\n\n{formatted_response}"
            if self.include_metadata:
                formatted_output += f"\n\n---\n*Metadata: {self._get_metadata(context)}*"
        else:
            # Plain text (default)
            formatted_output = formatted_response
            if self.include_metadata:
                metadata = self._get_metadata(context)
                formatted_output += f"\n\n[Metadata: {metadata}]"
        
        # Store in context
        context.set("output", formatted_output)
        context.set("persona_log", log)
        context.set("persona_name", persona_name)
        
        # Store output for tracking
        output = {
            "output": formatted_output,
            "persona": persona_name,
            "log": log,
            "format": self.format_type,
            "include_metadata": self.include_metadata,
            "output_length": len(formatted_output),
            "prompts": prompts,
            "success": result.get("success", True)
        }
        context.agent_outputs[self.agent_name] = output
        
        logger.info(f"[{self.agent_name}] Formatted as '{persona_name}' ({len(formatted_output)} chars)")
        
        return context
    
    def validate_input(self, context: ExecutionContext) -> bool:
        """Validate that response exists."""
        return "llm_response" in context.data or "cached_response" in context.data
    
    def _get_metadata(self, context: ExecutionContext) -> Dict[str, Any]:
        """Get execution metadata for output."""
        return {
            "total_time": context.get_total_time(),
            "steps": len(context.metadata["steps_executed"]),
            "errors": len(context.metadata["errors"])
        }
