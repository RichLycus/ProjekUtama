"""
PersonaBuilder - Build system prompts from YAML character definitions
Part of Phase 6.9.7 - Character/Persona System Migration
"""

from typing import Dict, Optional, List
from ai.character_loader import Character, CharacterLoader


class PersonaBuilder:
    """Build system prompts from character YAML data"""
    
    def __init__(self, loader: Optional[CharacterLoader] = None):
        """
        Initialize PersonaBuilder
        
        Args:
            loader: CharacterLoader instance (creates new if None)
        """
        self.loader = loader or CharacterLoader()
    
    def build_system_prompt(
        self,
        agent_name: str,
        user_name: Optional[str] = None,
        include_examples: bool = True,
        include_scene: bool = False,
        task_mode: bool = False,
    ) -> str:
        """
        Build complete system prompt for an agent character
        
        Args:
            agent_name: Name of agent character
            user_name: Name of user character (optional)
            include_examples: Include example dialogue
            include_scene: Include scene description
            task_mode: Use task mode instructions
            
        Returns:
            Complete system prompt string
        """
        # Load agent character
        agent = self.loader.load_agent(agent_name)
        
        # Load user character (if specified)
        user = None
        if user_name:
            try:
                user = self.loader.load_user(user_name)
            except FileNotFoundError:
                # Fall back to default user
                user = self.loader.load_user("default_user")
        
        # Build prompt sections
        sections = []
        
        # 1. Character Identity
        sections.append(f"# Character: {agent.name}")
        sections.append(f"Role: {agent.role}")
        sections.append("")
        sections.append(agent.description.strip())
        sections.append("")
        
        # 2. Personality
        sections.append("## Personality")
        sections.append(agent.personality.strip())
        sections.append("")
        
        # 3. Background (if available)
        if agent.background:
            sections.append("## Background")
            sections.append(agent.background.strip())
            sections.append("")
        
        # 4. Abilities (if available)
        if agent.abilities:
            sections.append("## Abilities & Skills")
            sections.append(agent.abilities.strip())
            sections.append("")
        
        # 5. Interaction Rules
        if agent.interaction_rules:
            sections.append("## Interaction Rules")
            sections.append(agent.interaction_rules.strip())
            sections.append("")
        
        # 6. Scene Context (if requested)
        if include_scene and agent.scene:
            sections.append("## Scene Context")
            sections.append(agent.scene.strip())
            sections.append("")
        
        # 7. Task Mode (if requested)
        if task_mode and agent.task_mode:
            sections.append("## Task Mode Instructions")
            sections.append(agent.task_mode.strip())
            sections.append("")
        
        # 8. Example Dialogue (if requested)
        if include_examples and agent.example_dialogue:
            sections.append("## Example Interactions")
            sections.append(agent.example_dialogue.strip())
            sections.append("")
        
        # 9. User Context (if user loaded)
        if user:
            sections.append("## About the User")
            sections.append(f"Name: {user.name}")
            if user.role:
                sections.append(f"Role: {user.role}")
            if user.preferences:
                sections.append("")
                sections.append("User Preferences:")
                for key, value in user.preferences.items():
                    sections.append(f"- {key}: {value}")
            sections.append("")
        
        # 10. Memory Tags
        if agent.memory_tags:
            sections.append("## Memory Tags")
            sections.append(", ".join(agent.memory_tags))
            sections.append("")
        
        # Combine all sections
        prompt = "\n".join(sections)
        
        # Replace placeholders
        prompt = self._replace_placeholders(prompt, agent, user)
        
        return prompt.strip()
    
    def build_short_prompt(self, agent_name: str, user_name: Optional[str] = None) -> str:
        """
        Build minimal system prompt (for flash mode / low token usage)
        
        Args:
            agent_name: Name of agent character
            user_name: Name of user character (optional)
            
        Returns:
            Short system prompt string
        """
        agent = self.loader.load_agent(agent_name)
        user = None
        if user_name:
            try:
                user = self.loader.load_user(user_name)
            except FileNotFoundError:
                pass
        
        sections = [
            f"You are {agent.name}, {agent.role}.",
            agent.personality.strip()[:200] + "...",  # Truncate for brevity
        ]
        
        if agent.interaction_rules:
            # Extract key rules (first 2 lines)
            rules = agent.interaction_rules.strip().split('\n')[:2]
            sections.append("\nKey Rules:")
            sections.extend(rules)
        
        prompt = "\n".join(sections)
        prompt = self._replace_placeholders(prompt, agent, user)
        
        return prompt.strip()
    
    def build_roleplay_prompt(
        self,
        agent_name: str,
        user_name: Optional[str] = None,
        scenario: Optional[str] = None,
    ) -> str:
        """
        Build immersive roleplay prompt with scene and scenario
        
        Args:
            agent_name: Name of agent character
            user_name: Name of user character
            scenario: Custom scenario description (overrides default scene)
            
        Returns:
            Roleplay-focused system prompt
        """
        agent = self.loader.load_agent(agent_name)
        user = None
        if user_name:
            try:
                user = self.loader.load_user(user_name)
            except FileNotFoundError:
                pass
        
        sections = []
        
        # Character identity
        sections.append(f"# Roleplay as {agent.name}")
        sections.append(f"**Role:** {agent.role}")
        sections.append("")
        sections.append(agent.description.strip())
        sections.append("")
        
        # Personality (full version for immersion)
        sections.append("## Your Personality")
        sections.append(agent.personality.strip())
        sections.append("")
        
        # Background for context
        if agent.background:
            sections.append("## Your Background")
            sections.append(agent.background.strip())
            sections.append("")
        
        # Scene setting
        sections.append("## Current Scene")
        if scenario:
            sections.append(scenario)
        elif agent.scene:
            sections.append(agent.scene.strip())
        else:
            sections.append("A comfortable, intimate setting where you can connect with {{user}}.")
        sections.append("")
        
        # Relationship context (if user has relationships defined)
        if user and user.relationships:
            for rel in user.relationships:
                if rel.get('name') == agent.name:
                    sections.append(f"## Your Relationship with {user.name}")
                    sections.append(f"Type: {rel.get('type', 'companion')}")
                    sections.append(f"Quality: {rel.get('relationship_quality', 'close')}")
                    if rel.get('description'):
                        sections.append(f"Description: {rel['description']}")
                    sections.append("")
                    break
        
        # Interaction rules
        if agent.interaction_rules:
            sections.append("## How You Interact")
            sections.append(agent.interaction_rules.strip())
            sections.append("")
        
        # Example dialogue for consistency
        if agent.example_dialogue:
            sections.append("## Example Interactions")
            sections.append(agent.example_dialogue.strip())
            sections.append("")
        
        # Final instruction
        sections.append("## Important")
        sections.append(f"Stay in character as {agent.name} at all times. Respond naturally and authentically based on your personality and relationship with {{user}}.")
        
        prompt = "\n".join(sections)
        prompt = self._replace_placeholders(prompt, agent, user)
        
        return prompt.strip()
    
    def _replace_placeholders(
        self,
        text: str,
        agent: Character,
        user: Optional[Character] = None,
    ) -> str:
        """
        Replace {{char}} and {{user}} placeholders
        
        Args:
            text: Text with placeholders
            agent: Agent character
            user: User character (optional)
            
        Returns:
            Text with replaced placeholders
        """
        # Replace {{char}} with agent name
        text = text.replace("{{char}}", agent.name)
        
        # Replace {{user}} with user name (or "User" if not specified)
        user_name = user.name if user else "User"
        text = text.replace("{{user}}", user_name)
        
        return text
    
    def get_character_metadata(self, agent_name: str) -> Dict:
        """
        Get character metadata for frontend display
        
        Args:
            agent_name: Name of agent character
            
        Returns:
            Metadata dictionary
        """
        agent = self.loader.load_agent(agent_name)
        
        return {
            "name": agent.name,
            "role": agent.role,
            "description": agent.description,
            "avatar_color": agent.metadata.get("avatar_color", "#666666"),
            "tags": agent.metadata.get("tags", []),
            "memory_tags": agent.memory_tags,
            "version": agent.metadata.get("version", "1.0.0"),
        }
    
    def build_context_aware_prompt(
        self,
        agent_name: str,
        user_name: Optional[str] = None,
        conversation_context: Optional[List[Dict]] = None,
        current_mood: Optional[str] = None,
    ) -> str:
        """
        Build prompt with conversation context and mood awareness
        
        Args:
            agent_name: Name of agent character
            user_name: Name of user character
            conversation_context: Recent conversation history
            current_mood: Current detected mood (happy, sad, focused, etc.)
            
        Returns:
            Context-aware system prompt
        """
        # Start with base prompt
        base_prompt = self.build_system_prompt(
            agent_name=agent_name,
            user_name=user_name,
            include_examples=False,  # Don't need examples with context
            include_scene=True,
        )
        
        sections = [base_prompt, ""]
        
        # Add conversation context if available
        if conversation_context:
            sections.append("## Recent Conversation Context")
            sections.append("Previous exchanges (for context):")
            for msg in conversation_context[-5:]:  # Last 5 messages
                role = msg.get("role", "unknown")
                content = msg.get("content", "")[:100]  # Truncate
                sections.append(f"- {role}: {content}...")
            sections.append("")
        
        # Add mood awareness
        if current_mood:
            sections.append("## User's Current Mood")
            sections.append(f"Detected mood: {current_mood}")
            sections.append("Adjust your responses accordingly to be supportive and appropriate.")
            sections.append("")
        
        return "\n".join(sections)
