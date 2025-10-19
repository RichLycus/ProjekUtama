"""
Embedding Models API Routes
Manage embedding models for RAG system
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime
import logging
from pathlib import Path
from sentence_transformers import SentenceTransformer
import torch

router = APIRouter(prefix="/api/embeddings", tags=["embeddings"])
logger = logging.getLogger(__name__)

# Available embedding models with metadata
AVAILABLE_EMBEDDING_MODELS = [
    {
        "model_id": "all-MiniLM-L6-v2",
        "display_name": "MiniLM L6 v2 (Fast & Lightweight)",
        "description": "Best for RTX 4060 8GB - Fast, lightweight, good accuracy",
        "size_mb": 90,
        "dimension": 384,
        "speed": "fast",
        "accuracy": "good",
        "recommended": True,
        "vram_usage": "~200MB"
    },
    {
        "model_id": "all-mpnet-base-v2",
        "display_name": "MPNet Base v2 (Balanced)",
        "description": "Balanced speed and accuracy",
        "size_mb": 420,
        "dimension": 768,
        "speed": "medium",
        "accuracy": "very good",
        "recommended": True,
        "vram_usage": "~500MB"
    },
    {
        "model_id": "bge-large-en-v1.5",
        "display_name": "BGE Large EN v1.5 (High Accuracy)",
        "description": "Best accuracy for English - Slower but more accurate",
        "size_mb": 1340,
        "dimension": 1024,
        "speed": "slow",
        "accuracy": "excellent",
        "recommended": False,
        "vram_usage": "~1.5GB"
    },
    {
        "model_id": "nomic-embed-text-v1.5",
        "display_name": "Nomic Embed Text v1.5",
        "description": "Good for long documents and context",
        "size_mb": 550,
        "dimension": 768,
        "speed": "medium",
        "accuracy": "very good",
        "recommended": False,
        "vram_usage": "~600MB"
    },
    {
        "model_id": "paraphrase-multilingual-MiniLM-L12-v2",
        "display_name": "Multilingual MiniLM L12 v2",
        "description": "Supports 50+ languages - Good for multilingual content",
        "size_mb": 470,
        "dimension": 384,
        "speed": "medium",
        "accuracy": "good",
        "recommended": False,
        "vram_usage": "~500MB"
    }
]


class EmbeddingModelTestRequest(BaseModel):
    model_id: str


@router.get("/models/list")
async def list_embedding_models():
    """Get list of available embedding models"""
    try:
        # Check which models are already downloaded
        cache_dir = Path.home() / ".cache" / "huggingface" / "hub"
        
        models_with_status = []
        for model in AVAILABLE_EMBEDDING_MODELS:
            model_copy = model.copy()
            
            # Check if model is downloaded (simplified check)
            model_cache_name = f"models--sentence-transformers--{model['model_id']}"
            is_downloaded = (cache_dir / model_cache_name).exists() if cache_dir.exists() else False
            
            model_copy["is_downloaded"] = is_downloaded
            models_with_status.append(model_copy)
        
        return {
            "success": True,
            "models": models_with_status,
            "count": len(models_with_status)
        }
    except Exception as e:
        logger.error(f"❌ Failed to list embedding models: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to list embedding models: {str(e)}")


@router.post("/models/test")
async def test_embedding_model(request: EmbeddingModelTestRequest):
    """
    Test an embedding model (download if needed and run test)
    """
    try:
        model_id = request.model_id
        
        # Check if model exists in our list
        model_info = next((m for m in AVAILABLE_EMBEDDING_MODELS if m["model_id"] == model_id), None)
        if not model_info:
            raise HTTPException(status_code=404, detail=f"Model '{model_id}' not found in available models")
        
        logger.info(f"🧪 Testing embedding model: {model_id}")
        
        # Check GPU availability
        has_gpu = torch.cuda.is_available()
        device = "cuda" if has_gpu else "cpu"
        
        logger.info(f"   Device: {device}")
        if has_gpu:
            logger.info(f"   GPU: {torch.cuda.get_device_name(0)}")
            logger.info(f"   VRAM Available: {torch.cuda.get_device_properties(0).total_memory / 1024**3:.2f} GB")
        
        # Load model (will download if not cached)
        logger.info(f"   Loading model (will download if needed)...")
        start_time = datetime.now()
        
        try:
            model = SentenceTransformer(model_id, device=device)
            load_time = (datetime.now() - start_time).total_seconds()
            
            logger.info(f"   ✅ Model loaded in {load_time:.2f}s")
            
            # Test encoding
            test_text = "This is a test sentence for embedding generation."
            logger.info(f"   Testing encoding...")
            
            encode_start = datetime.now()
            embedding = model.encode(test_text)
            encode_time = (datetime.now() - encode_start).total_seconds()
            
            logger.info(f"   ✅ Encoding successful in {encode_time:.3f}s")
            logger.info(f"   Embedding dimension: {len(embedding)}")
            
            # Get VRAM usage if GPU
            vram_used = None
            if has_gpu:
                vram_used = torch.cuda.memory_allocated(0) / 1024**2  # MB
                logger.info(f"   VRAM Used: {vram_used:.2f} MB")
            
            return {
                "success": True,
                "model_id": model_id,
                "model_info": model_info,
                "test_results": {
                    "load_time_seconds": round(load_time, 2),
                    "encode_time_seconds": round(encode_time, 3),
                    "embedding_dimension": len(embedding),
                    "device": device,
                    "has_gpu": has_gpu,
                    "vram_used_mb": round(vram_used, 2) if vram_used else None
                },
                "message": f"✅ Model '{model_id}' tested successfully!"
            }
            
        except Exception as e:
            logger.error(f"   ❌ Model test failed: {str(e)}")
            return {
                "success": False,
                "model_id": model_id,
                "error": str(e),
                "message": f"❌ Failed to test model '{model_id}'"
            }
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Test failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Test failed: {str(e)}")


@router.post("/models/download")
async def download_embedding_model(request: EmbeddingModelTestRequest):
    """
    Download an embedding model
    """
    try:
        model_id = request.model_id
        
        # Check if model exists in our list
        model_info = next((m for m in AVAILABLE_EMBEDDING_MODELS if m["model_id"] == model_id), None)
        if not model_info:
            raise HTTPException(status_code=404, detail=f"Model '{model_id}' not found")
        
        logger.info(f"📥 Downloading embedding model: {model_id}")
        
        start_time = datetime.now()
        
        # Load model (triggers download)
        model = SentenceTransformer(model_id)
        
        download_time = (datetime.now() - start_time).total_seconds()
        
        logger.info(f"✅ Model downloaded in {download_time:.2f}s")
        
        return {
            "success": True,
            "model_id": model_id,
            "download_time_seconds": round(download_time, 2),
            "message": f"✅ Model '{model_id}' downloaded successfully!"
        }
        
    except Exception as e:
        logger.error(f"❌ Download failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Download failed: {str(e)}")


@router.get("/models/recommended")
async def get_recommended_models():
    """Get recommended embedding models for RTX 4060 8GB"""
    try:
        recommended = [m for m in AVAILABLE_EMBEDDING_MODELS if m.get("recommended", False)]
        
        return {
            "success": True,
            "recommended_models": recommended,
            "count": len(recommended),
            "gpu_info": {
                "has_gpu": torch.cuda.is_available(),
                "device_name": torch.cuda.get_device_name(0) if torch.cuda.is_available() else "CPU",
                "total_vram_gb": round(torch.cuda.get_device_properties(0).total_memory / 1024**3, 2) if torch.cuda.is_available() else None
            }
        }
    except Exception as e:
        logger.error(f"❌ Failed to get recommended models: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
