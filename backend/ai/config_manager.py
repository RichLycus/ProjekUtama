"""AI Configuration Manager for ChimeraAI"""

import json
import os
from pathlib import Path
from typing import Dict, Any, Optional
import logging

logger = logging.getLogger(__name__)

class AIConfigManager:
    """Manages AI configuration (Ollama URL, model, persona settings, etc.)"""
    
    def __init__(self):
        # Use relative path from backend directory
        self.backend_dir = Path(__file__).parent.parent
        self.config_dir = self.backend_dir / "data"
        self.config_file = self.config_dir / "ai_config.json"
        
        # Ensure data directory exists
        self.config_dir.mkdir(exist_ok=True)
        
        # Default configuration
        self.default_config = {
            "ollama_url": "http://localhost:11434",
            "model": "llama3:8b",
            "default_persona": "lycus",
            "context_window_size": 4000,
            "temperature": 0.7,
            "execution_enabled": True,
            "execution_policy": "ask",
            "vector_db_path": "data/vector_db"  # Relative path!
        }
        
        # Load config on init
        self.config = self.load_config()
    
    def load_config(self) -> Dict[str, Any]:
        """Load configuration from file"""
        try:
            if self.config_file.exists():
                with open(self.config_file, 'r') as f:
                    config = json.load(f)
                logger.info(f"✅ Loaded AI config from {self.config_file}")
                return {**self.default_config, **config}  # Merge with defaults
            else:
                logger.info("ℹ️  No config file found, using defaults")
                return self.default_config.copy()
        except Exception as e:
            logger.error(f"❌ Failed to load config: {str(e)}")
            return self.default_config.copy()
    
    def save_config(self, updates: Dict[str, Any]) -> bool:
        """Save configuration to file"""
        try:
            # Merge updates with current config
            self.config.update(updates)
            
            # Write to file
            with open(self.config_file, 'w') as f:
                json.dump(self.config, f, indent=2)
            
            logger.info(f"✅ Saved AI config to {self.config_file}")
            logger.info(f"   Model: {self.config['model']}")
            logger.info(f"   Ollama URL: {self.config['ollama_url']}")
            return True
        except Exception as e:
            logger.error(f"❌ Failed to save config: {str(e)}")
            return False
    
    def get_config(self, key: Optional[str] = None) -> Any:
        """Get configuration value(s)"""
        if key:
            return self.config.get(key)
        return self.config.copy()
    
    def get_ollama_url(self) -> str:
        """Get Ollama server URL"""
        return self.config.get("ollama_url", "http://localhost:11434")
    
    def get_model(self) -> str:
        """Get current model"""
        return self.config.get("model", "llama3:8b")
    
    def get_vector_db_path(self) -> str:
        """Get vector database path (as absolute path)"""
        relative_path = self.config.get("vector_db_path", "data/vector_db")
        # Convert to absolute path
        abs_path = self.backend_dir / relative_path
        # Ensure directory exists
        abs_path.mkdir(parents=True, exist_ok=True)
        return str(abs_path)
    
    def reset_to_defaults(self) -> bool:
        """Reset configuration to defaults"""
        try:
            self.config = self.default_config.copy()
            with open(self.config_file, 'w') as f:
                json.dump(self.config, f, indent=2)
            logger.info("✅ Reset AI config to defaults")
            return True
        except Exception as e:
            logger.error(f"❌ Failed to reset config: {str(e)}")
            return False
