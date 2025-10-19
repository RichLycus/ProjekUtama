"""Ollama Client Wrapper for ChimeraAI"""

import requests
import json
from typing import Optional, Dict, Any, List
import logging

logger = logging.getLogger(__name__)

class OllamaClient:
    """Client for interacting with Ollama LLM server"""
    
    def __init__(self, base_url: str = "http://localhost:11434"):
        self.base_url = base_url.rstrip('/')
        self.api_url = f"{self.base_url}/api"
        
    def test_connection(self) -> bool:
        """Test if Ollama server is accessible"""
        try:
            response = requests.get(f"{self.base_url}/api/tags", timeout=5)
            return response.status_code == 200
        except Exception as e:
            logger.error(f"Ollama connection test failed: {str(e)}")
            return False
    
    def list_models(self) -> List[str]:
        """List available models"""
        try:
            response = requests.get(f"{self.base_url}/api/tags")
            if response.status_code == 200:
                data = response.json()
                return [model['name'] for model in data.get('models', [])]
            return []
        except Exception as e:
            logger.error(f"Failed to list models: {str(e)}")
            return []
    
    def generate(
        self,
        model: str,
        prompt: str,
        system: Optional[str] = None,
        temperature: float = 0.7,
        max_tokens: int = 2000,
        stream: bool = False
    ) -> Dict[str, Any]:
        """Generate completion from Ollama"""
        try:
            payload = {
                "model": model,
                "prompt": prompt,
                "stream": stream,
                "options": {
                    "temperature": temperature,
                    "num_predict": max_tokens
                }
            }
            
            if system:
                payload["system"] = system
            
            logger.info(f"Generating with model {model}...")
            logger.debug(f"Prompt: {prompt[:100]}...")
            
            response = requests.post(
                f"{self.api_url}/generate",
                json=payload,
                timeout=60
            )
            
            if response.status_code == 200:
                result = response.json()
                logger.info(f"✅ Generation successful ({len(result.get('response', ''))} chars)")
                return {
                    "success": True,
                    "response": result.get('response', ''),
                    "model": result.get('model', model),
                    "total_duration": result.get('total_duration', 0),
                    "eval_count": result.get('eval_count', 0)
                }
            else:
                logger.error(f"Ollama API error: {response.status_code}")
                return {
                    "success": False,
                    "error": f"API returned status {response.status_code}",
                    "response": ""
                }
                
        except requests.Timeout:
            logger.error("Ollama request timeout")
            return {
                "success": False,
                "error": "Request timeout (60s)",
                "response": ""
            }
        except Exception as e:
            logger.error(f"Ollama generation failed: {str(e)}")
            return {
                "success": False,
                "error": str(e),
                "response": ""
            }
    
    def chat(
        self,
        model: str,
        messages: List[Dict[str, str]],
        temperature: float = 0.7,
        max_tokens: int = 2000
    ) -> Dict[str, Any]:
        """Chat completion (multi-turn conversation)"""
        try:
            payload = {
                "model": model,
                "messages": messages,
                "stream": False,
                "options": {
                    "temperature": temperature,
                    "num_predict": max_tokens
                }
            }
            
            logger.info(f"Chat with model {model} ({len(messages)} messages)...")
            
            response = requests.post(
                f"{self.api_url}/chat",
                json=payload,
                timeout=60
            )
            
            if response.status_code == 200:
                result = response.json()
                message = result.get('message', {})
                logger.info(f"✅ Chat successful")
                return {
                    "success": True,
                    "response": message.get('content', ''),
                    "model": result.get('model', model),
                    "total_duration": result.get('total_duration', 0)
                }
            else:
                logger.error(f"Ollama chat API error: {response.status_code}")
                return {
                    "success": False,
                    "error": f"API returned status {response.status_code}",
                    "response": ""
                }
                
        except Exception as e:
            logger.error(f"Ollama chat failed: {str(e)}")
            return {
                "success": False,
                "error": str(e),
                "response": ""
            }
