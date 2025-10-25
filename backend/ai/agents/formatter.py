"""Formatter Agent - Output formatting and finalization"""

from typing import Dict, Any
import logging
import json

from .base import BaseAgent
from ..flow.context import ExecutionContext

logger = logging.getLogger(__name__)


class FormatterAgent(BaseAgent):
    """
    Formatter Agent for final output formatting.
    
    Handles:
    - Text formatting (plain, markdown, JSON)
    - Metadata inclusion (execution stats, timing)
    - Output structuring
    - Response finalization
    
    Config options:
        - format (str): Output format - 'text', 'markdown', 'json' (default: 'text')
        - include_metadata (bool): Include execution metadata (default: False)
        - metadata_fields (list): Specific metadata fields to include
        - response_field (str): Field to format (default: 'llm_response')
        - fallback_field (str): Fallback if response_field missing (default: 'cached_response')
    
    Example:
        ```python
        # Simple text formatting
        agent = FormatterAgent(config={"format": "text"})
        context = ExecutionContext({"llm_response": "Hello world"})
        context = agent.run(context)
        print(context.get("output"))  # "Hello world"
        
        # JSON with metadata
        agent = FormatterAgent(config={
            "format": "json",
            "include_metadata": True
        })
        context = agent.run(context)
        output = json.loads(context.get("output"))
        print(output["response"], output["metadata"])
        ```
    """
    
    def __init__(self, config: Dict[str, Any] = None):
        """Initialize formatter with config."""
        super().__init__(config)
        self.agent_name = "formatter"
        
        # Get config
        self.format = self.config.get("format", "text")
        self.include_metadata = self.config.get("include_metadata", False)
        self.metadata_fields = self.config.get("metadata_fields", [])
        self.response_field = self.config.get("response_field", "llm_response")
        self.fallback_field = self.config.get("fallback_field", "cached_response")
    
    def run(self, context: ExecutionContext) -> ExecutionContext:
        """
        Format output based on configuration.
        
        Args:
            context: Execution context with response data
        
        Returns:
            Updated context with 'output' field
        """
        # Get response to format
        response = context.get(self.response_field) or context.get(self.fallback_field, "")
        
        if not response:
            logger.warning(f"[{self.agent_name}] No response to format")
            context.set("output", "")
            return context
        
        logger.info(f"[{self.agent_name}] Formatting output (format: {self.format})...")
        
        # Format based on type
        if self.format == "json":
            formatted = self._format_json(response, context)
        elif self.format == "markdown":
            formatted = self._format_markdown(response, context)
        else:
            # Plain text (default)
            formatted = self._format_text(response, context)
        
        # Store formatted output
        context.set("output", formatted)
        
        # Store tracking info
        output = {
            "format": self.format,
            "include_metadata": self.include_metadata,
            "response_length": len(response),
            "output_length": len(str(formatted)),
            "response_field": self.response_field,
            "had_fallback": not bool(context.get(self.response_field))
        }
        context.agent_outputs[self.agent_name] = output
        
        logger.info(f"[{self.agent_name}] Formatted {len(response)} → {len(str(formatted))} chars")
        
        return context
    
    def _format_text(self, response: str, context: ExecutionContext) -> str:
        """
        Format as plain text.
        
        Args:
            response: Response text
            context: Execution context
        
        Returns:
            Formatted text
        """
        if not self.include_metadata:
            return response
        
        # Add metadata footer
        metadata = self._get_metadata(context)
        footer = f"\n\n---\n{metadata}"
        return response + footer
    
    def _format_markdown(self, response: str, context: ExecutionContext) -> str:
        """
        Format as markdown.
        
        Args:
            response: Response text
            context: Execution context
        
        Returns:
            Markdown formatted text
        """
        output = response
        
        if self.include_metadata:
            metadata = self._get_metadata(context)
            output += f"\n\n---\n\n**Execution Info:**\n\n{metadata}"
        
        return output
    
    def _format_json(self, response: str, context: ExecutionContext) -> str:
        """
        Format as JSON.
        
        Args:
            response: Response text
            context: Execution context
        
        Returns:
            JSON string
        """
        output_dict = {
            "response": response,
            "format": "json",
            "success": not context.has_errors()
        }
        
        if self.include_metadata:
            output_dict["metadata"] = self._build_metadata_dict(context)
        
        return json.dumps(output_dict, indent=2, ensure_ascii=False)
    
    def _get_metadata(self, context: ExecutionContext) -> str:
        """
        Get metadata as formatted string.
        
        Args:
            context: Execution context
        
        Returns:
            Metadata string
        """
        meta_dict = self._build_metadata_dict(context)
        
        lines = []
        for key, value in meta_dict.items():
            lines.append(f"- {key}: {value}")
        
        return "\n".join(lines)
    
    def _build_metadata_dict(self, context: ExecutionContext) -> Dict[str, Any]:
        """
        Build metadata dictionary.
        
        Args:
            context: Execution context
        
        Returns:
            Metadata dict
        """
        # Default metadata
        metadata = {
            "total_time": f"{context.get_total_time():.2f}s",
            "steps_executed": len(context.metadata.get("steps_executed", [])),
            "errors": len(context.metadata.get("errors", [])),
            "flow_id": context.metadata.get("flow_id", "unknown"),
            "flow_version": context.metadata.get("flow_version", "unknown")
        }
        
        # Add LLM mode if available
        if context.get("llm_mode"):
            metadata["llm_mode"] = context.get("llm_mode")
        
        # Add cache info if available
        if context.get_flag("cache_hit") is not None:
            metadata["cache_hit"] = context.get_flag("cache_hit")
        
        # Add specific fields if requested
        if self.metadata_fields:
            for field in self.metadata_fields:
                if field in context.data:
                    metadata[field] = context.get(field)
        
        return metadata
    
    def validate_input(self, context: ExecutionContext) -> bool:
        """Validate that response field or fallback exists."""
        return (
            self.response_field in context.data or 
            self.fallback_field in context.data
        )
