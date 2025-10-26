"""
CharacterLoader - Load and manage YAML-based character definitions
Part of Phase 6.9.7 - Character/Persona System Migration
"""

import yaml
from pathlib import Path
from typing import Dict, List, Optional, Any
from dataclasses import dataclass, field
from datetime import datetime


@dataclass
class Character:
    """Represents a character loaded from YAML"""
    
    # Required fields
    name: str
    role: str
    description: str
    personality: str
    
    # Optional fields
    background: Optional[str] = None
    abilities: Optional[str] = None
    interaction_rules: Optional[str] = None
    example_dialogue: Optional[str] = None
    memory_tags: List[str] = field(default_factory=list)
    scene: Optional[str] = None
    task_mode: Optional[str] = None
    
    # Metadata
    metadata: Dict[str, Any] = field(default_factory=dict)
    
    # User-specific fields (for user characters)
    preferences: Dict[str, Any] = field(default_factory=dict)
    relationships: List[Dict[str, Any]] = field(default_factory=list)
    work_style: Dict[str, Any] = field(default_factory=dict)
    emotional_preferences: Dict[str, Any] = field(default_factory=dict)
    
    # Internal fields
    file_path: Optional[Path] = None
    loaded_at: datetime = field(default_factory=datetime.now)
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert character to dictionary"""
        return {
            "name": self.name,
            "role": self.role,
            "description": self.description,
            "personality": self.personality,
            "background": self.background,
            "abilities": self.abilities,
            "interaction_rules": self.interaction_rules,
            "example_dialogue": self.example_dialogue,
            "memory_tags": self.memory_tags,
            "scene": self.scene,
            "task_mode": self.task_mode,
            "metadata": self.metadata,
            "preferences": self.preferences,
            "relationships": self.relationships,
            "work_style": self.work_style,
            "emotional_preferences": self.emotional_preferences,
        }


class CharacterLoader:
    """Load and manage character YAML files"""
    
    def __init__(self, characters_dir: Optional[Path] = None):
        """
        Initialize CharacterLoader
        
        Args:
            characters_dir: Path to characters directory (defaults to backend/characters/)
        """
        if characters_dir is None:
            # Get absolute path relative to this file
            backend_dir = Path(__file__).parent.parent
            characters_dir = backend_dir / "characters"
        
        self.characters_dir = Path(characters_dir)
        self.agents_dir = self.characters_dir / "agents"
        self.users_dir = self.characters_dir / "users"
        
        # Cache loaded characters
        self._agent_cache: Dict[str, Character] = {}
        self._user_cache: Dict[str, Character] = {}
        
        # Verify directories exist
        if not self.characters_dir.exists():
            raise FileNotFoundError(f"Characters directory not found: {self.characters_dir}")
        if not self.agents_dir.exists():
            raise FileNotFoundError(f"Agents directory not found: {self.agents_dir}")
        if not self.users_dir.exists():
            raise FileNotFoundError(f"Users directory not found: {self.users_dir}")
    
    def load_agent(self, name: str, use_cache: bool = True) -> Character:
        """
        Load an agent character from YAML file
        
        Args:
            name: Character name (without .yaml extension)
            use_cache: Use cached character if available
            
        Returns:
            Character object
            
        Raises:
            FileNotFoundError: If character file doesn't exist
            ValueError: If YAML is invalid or missing required fields
        """
        # Check cache first
        if use_cache and name in self._agent_cache:
            return self._agent_cache[name]
        
        # Load from file
        file_path = self.agents_dir / f"{name}.yaml"
        if not file_path.exists():
            raise FileNotFoundError(f"Agent character not found: {file_path}")
        
        character = self._load_character_from_file(file_path)
        
        # Cache and return
        self._agent_cache[name] = character
        return character
    
    def load_user(self, name: str, use_cache: bool = True) -> Character:
        """
        Load a user character from YAML file
        
        Args:
            name: User name (without .yaml extension)
            use_cache: Use cached character if available
            
        Returns:
            Character object
            
        Raises:
            FileNotFoundError: If user file doesn't exist
            ValueError: If YAML is invalid or missing required fields
        """
        # Check cache first
        if use_cache and name in self._user_cache:
            return self._user_cache[name]
        
        # Load from file
        file_path = self.users_dir / f"{name}.yaml"
        if not file_path.exists():
            raise FileNotFoundError(f"User character not found: {file_path}")
        
        character = self._load_character_from_file(file_path)
        
        # Cache and return
        self._user_cache[name] = character
        return character
    
    def _load_character_from_file(self, file_path: Path) -> Character:
        """
        Load character from YAML file
        
        Args:
            file_path: Path to YAML file
            
        Returns:
            Character object
            
        Raises:
            ValueError: If YAML is invalid or missing required fields
        """
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                data = yaml.safe_load(f)
            
            if not data:
                raise ValueError(f"Empty YAML file: {file_path}")
            
            # Validate required fields
            required_fields = ['name', 'role', 'description', 'personality']
            missing_fields = [field for field in required_fields if field not in data]
            if missing_fields:
                raise ValueError(f"Missing required fields in {file_path}: {missing_fields}")
            
            # Create Character object
            character = Character(
                name=data['name'],
                role=data['role'],
                description=data['description'],
                personality=data['personality'],
                background=data.get('background'),
                abilities=data.get('abilities'),
                interaction_rules=data.get('interaction_rules'),
                example_dialogue=data.get('example_dialogue'),
                memory_tags=data.get('memory_tags', []),
                scene=data.get('scene'),
                task_mode=data.get('task_mode'),
                metadata=data.get('metadata', {}),
                preferences=data.get('preferences', {}),
                relationships=data.get('relationships', []),
                work_style=data.get('work_style', {}),
                emotional_preferences=data.get('emotional_preferences', {}),
                file_path=file_path,
            )
            
            return character
            
        except yaml.YAMLError as e:
            raise ValueError(f"Invalid YAML in {file_path}: {e}")
        except Exception as e:
            raise ValueError(f"Error loading character from {file_path}: {e}")
    
    def list_agents(self) -> List[Dict[str, Any]]:
        """
        List all available agent characters
        
        Returns:
            List of agent info dictionaries
        """
        agents = []
        for yaml_file in self.agents_dir.glob("*.yaml"):
            try:
                with open(yaml_file, 'r', encoding='utf-8') as f:
                    data = yaml.safe_load(f)
                
                agents.append({
                    "name": data.get("name", yaml_file.stem),
                    "role": data.get("role", "Unknown"),
                    "description": data.get("description", "")[:100] + "...",  # Truncate
                    "avatar_color": data.get("metadata", {}).get("avatar_color", "#666666"),
                    "tags": data.get("metadata", {}).get("tags", []),
                    "file_name": yaml_file.name,
                })
            except Exception as e:
                print(f"Error reading {yaml_file}: {e}")
                continue
        
        return agents
    
    def list_users(self) -> List[Dict[str, Any]]:
        """
        List all available user characters
        
        Returns:
            List of user info dictionaries
        """
        users = []
        for yaml_file in self.users_dir.glob("*.yaml"):
            try:
                with open(yaml_file, 'r', encoding='utf-8') as f:
                    data = yaml.safe_load(f)
                
                users.append({
                    "name": data.get("name", yaml_file.stem),
                    "role": data.get("role", "Unknown"),
                    "description": data.get("description", "")[:100] + "...",
                    "avatar_color": data.get("metadata", {}).get("avatar_color", "#666666"),
                    "tags": data.get("metadata", {}).get("tags", []),
                    "file_name": yaml_file.name,
                })
            except Exception as e:
                print(f"Error reading {yaml_file}: {e}")
                continue
        
        return users
    
    def reload_agent(self, name: str) -> Character:
        """
        Reload agent character from file (bypass cache)
        
        Args:
            name: Character name
            
        Returns:
            Freshly loaded Character object
        """
        # Clear cache for this character
        if name in self._agent_cache:
            del self._agent_cache[name]
        
        # Load fresh from file
        return self.load_agent(name, use_cache=False)
    
    def reload_user(self, name: str) -> Character:
        """
        Reload user character from file (bypass cache)
        
        Args:
            name: User name
            
        Returns:
            Freshly loaded Character object
        """
        # Clear cache for this character
        if name in self._user_cache:
            del self._user_cache[name]
        
        # Load fresh from file
        return self.load_user(name, use_cache=False)
    
    def clear_cache(self):
        """Clear all cached characters"""
        self._agent_cache.clear()
        self._user_cache.clear()
    
    def get_schema(self) -> Dict[str, Any]:
        """
        Get character schema definition
        
        Returns:
            Schema dictionary from schema.yaml
        """
        schema_file = self.characters_dir / "schema.yaml"
        if not schema_file.exists():
            return {}
        
        try:
            with open(schema_file, 'r', encoding='utf-8') as f:
                return yaml.safe_load(f)
        except Exception as e:
            print(f"Error reading schema: {e}")
            return {}
    
    def health_check(self) -> Dict[str, Any]:
        """
        Check health of character system
        
        Returns:
            Health check dictionary
        """
        return {
            "characters_dir_exists": self.characters_dir.exists(),
            "agents_dir_exists": self.agents_dir.exists(),
            "users_dir_exists": self.users_dir.exists(),
            "agent_count": len(list(self.agents_dir.glob("*.yaml"))),
            "user_count": len(list(self.users_dir.glob("*.yaml"))),
            "cached_agents": len(self._agent_cache),
            "cached_users": len(self._user_cache),
        }
