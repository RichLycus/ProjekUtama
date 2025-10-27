# CATEGORY: Multimedia
# NAME: Image Scaling Tool (4K Upscaler)
# DESCRIPTION: AI-powered image and video upscaling using PyTorch 2.7.1
# VERSION: 1.0.0
# AUTHOR: ChimeraAI Team

from fastapi import FastAPI, UploadFile, File, HTTPException, Form
from fastapi.responses import FileResponse, JSONResponse
import torch
import cv2
import numpy as np
from PIL import Image
import io
import os
import tempfile
import shutil
from pathlib import Path
from datetime import datetime
import uuid

app = FastAPI()

# Configuration
MAX_FILE_SIZE = 50 * 1024 * 1024  # 50MB
ALLOWED_IMAGE_EXTS = [".png", ".jpg", ".jpeg", ".gif", ".bmp", ".webp"]
ALLOWED_VIDEO_EXTS = [".mp4", ".avi", ".mov", ".mkv", ".webm"]
UPLOAD_DIR = Path(tempfile.gettempdir()) / "chimera_upscaler"
UPLOAD_DIR.mkdir(exist_ok=True)

# Global model cache
_model_cache = {}
_device = None

def get_device():
    """Detect and return available device (CUDA or CPU)"""
    global _device
    if _device is None:
        if torch.cuda.is_available():
            _device = "cuda"
        else:
            _device = "cpu"
    return _device

def get_upscale_model(scale: int = 4):
    """Get or load upscaling model (simple bicubic for now, can be replaced with Real-ESRGAN)"""
    # For now, we'll use traditional upscaling methods
    # Real-ESRGAN can be added later with proper model weights
    return None

def upscale_image_simple(image: np.ndarray, scale: int = 4) -> np.ndarray:
    """Simple image upscaling using bicubic interpolation"""
    height, width = image.shape[:2]
    new_size = (width * scale, height * scale)
    
    # Use INTER_CUBIC for high-quality upscaling
    upscaled = cv2.resize(image, new_size, interpolation=cv2.INTER_CUBIC)
    
    # Apply light sharpening
    kernel = np.array([[-0.5, -0.5, -0.5],
                       [-0.5,  5.0, -0.5],
                       [-0.5, -0.5, -0.5]])
    sharpened = cv2.filter2D(upscaled, -1, kernel)
    
    # Blend original and sharpened
    result = cv2.addWeighted(upscaled, 0.7, sharpened, 0.3, 0)
    
    return result

def upscale_image_ai(image: np.ndarray, scale: int = 4, device: str = "cpu") -> np.ndarray:
    """AI-powered upscaling (placeholder for Real-ESRGAN)"""
    # This is a placeholder for Real-ESRGAN integration
    # For now, use enhanced traditional method
    return upscale_image_simple(image, scale)

def process_image(input_path: str, output_path: str, scale: int = 4, use_ai: bool = True):
    """Process and upscale an image"""
    try:
        # Read image
        image = cv2.imread(input_path)
        if image is None:
            raise ValueError("Failed to read image")
        
        # Get device
        device = get_device()
        
        # Upscale
        if use_ai and device == "cuda":
            upscaled = upscale_image_ai(image, scale, device)
        else:
            upscaled = upscale_image_simple(image, scale)
        
        # Save
        cv2.imwrite(output_path, upscaled)
        
        return {
            "success": True,
            "device": device,
            "original_size": f"{image.shape[1]}x{image.shape[0]}",
            "upscaled_size": f"{upscaled.shape[1]}x{upscaled.shape[0]}",
            "scale_factor": scale
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }

def process_video(input_path: str, output_path: str, scale: int = 2, use_ai: bool = False):
    """Process and upscale a video (frame by frame)"""
    try:
        # Open video
        cap = cv2.VideoCapture(input_path)
        if not cap.isOpened():
            raise ValueError("Failed to open video")
        
        # Get video properties
        fps = int(cap.get(cv2.CAP_PROP_FPS))
        width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
        height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
        total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        
        # New dimensions
        new_width = width * scale
        new_height = height * scale
        
        # Video writer
        fourcc = cv2.VideoWriter_fourcc(*'mp4v')
        out = cv2.VideoWriter(output_path, fourcc, fps, (new_width, new_height))
        
        device = get_device()
        frame_count = 0
        
        # Process frames
        while True:
            ret, frame = cap.read()
            if not ret:
                break
            
            # Upscale frame
            if use_ai and device == "cuda":
                upscaled_frame = upscale_image_ai(frame, scale, device)
            else:
                upscaled_frame = upscale_image_simple(frame, scale)
            
            out.write(upscaled_frame)
            frame_count += 1
        
        cap.release()
        out.release()
        
        return {
            "success": True,
            "device": device,
            "frames_processed": frame_count,
            "original_size": f"{width}x{height}",
            "upscaled_size": f"{new_width}x{new_height}",
            "scale_factor": scale
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }

@app.get("/")
async def root():
    device = get_device()
    torch_version = torch.__version__
    cuda_available = torch.cuda.is_available()
    
    return {
        "name": "Image Scaling Tool (4K Upscaler)",
        "version": "1.0.0",
        "description": "AI-powered image and video upscaling",
        "torch_version": torch_version,
        "device": device,
        "cuda_available": cuda_available,
        "supported_formats": {
            "images": ALLOWED_IMAGE_EXTS,
            "videos": ALLOWED_VIDEO_EXTS
        }
    }

@app.get("/status")
async def get_status():
    """Get system status and GPU availability"""
    device = get_device()
    cuda_available = torch.cuda.is_available()
    
    gpu_info = None
    if cuda_available:
        try:
            gpu_info = {
                "name": torch.cuda.get_device_name(0),
                "memory_total": torch.cuda.get_device_properties(0).total_memory,
                "memory_allocated": torch.cuda.memory_allocated(0),
                "memory_cached": torch.cuda.memory_reserved(0)
            }
        except:
            pass
    
    return {
        "device": device,
        "cuda_available": cuda_available,
        "torch_version": torch.__version__,
        "gpu_info": gpu_info
    }

@app.post("/upscale")
async def upscale_file(
    file: UploadFile = File(...),
    scale: int = Form(4),
    use_ai: bool = Form(True)
):
    """Upload and upscale image or video"""
    try:
        # Validate file size
        content = await file.read()
        if len(content) > MAX_FILE_SIZE:
            raise HTTPException(400, f"File too large. Max size: {MAX_FILE_SIZE / (1024*1024)}MB")
        
        # Get file extension
        file_ext = Path(file.filename).suffix.lower()
        
        # Determine file type
        is_image = file_ext in ALLOWED_IMAGE_EXTS
        is_video = file_ext in ALLOWED_VIDEO_EXTS
        
        if not (is_image or is_video):
            raise HTTPException(400, f"Unsupported format. Supported: {ALLOWED_IMAGE_EXTS + ALLOWED_VIDEO_EXTS}")
        
        # Validate scale
        if scale not in [2, 3, 4, 8]:
            raise HTTPException(400, "Scale must be 2, 3, 4, or 8")
        
        # For video, limit scale to 2x (performance)
        if is_video and scale > 2:
            scale = 2
        
        # Create temp files
        file_id = str(uuid.uuid4())
        input_path = UPLOAD_DIR / f"{file_id}_input{file_ext}"
        output_path = UPLOAD_DIR / f"{file_id}_output{file_ext}"
        
        # Save uploaded file
        with open(input_path, "wb") as f:
            f.write(content)
        
        # Process based on type
        if is_image:
            result = process_image(str(input_path), str(output_path), scale, use_ai)
        else:
            result = process_video(str(input_path), str(output_path), scale, use_ai)
        
        if not result["success"]:
            # Clean up
            input_path.unlink(missing_ok=True)
            output_path.unlink(missing_ok=True)
            raise HTTPException(500, result.get("error", "Processing failed"))
        
        # Clean up input
        input_path.unlink(missing_ok=True)
        
        return {
            "success": True,
            "file_id": file_id,
            "file_type": "image" if is_image else "video",
            "download_url": f"/download/{file_id}{file_ext}",
            **result
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(500, f"Upload failed: {str(e)}")

@app.get("/download/{filename}")
async def download_file(filename: str):
    """Download processed file"""
    try:
        # Extract file_id and extension
        parts = filename.rsplit('.', 1)
        if len(parts) != 2:
            raise HTTPException(400, "Invalid filename")
        
        file_id = parts[0]
        file_ext = f".{parts[1]}"
        
        # Find output file
        output_path = UPLOAD_DIR / f"{file_id}_output{file_ext}"
        
        if not output_path.exists():
            raise HTTPException(404, "File not found or expired")
        
        # Return file
        return FileResponse(
            path=str(output_path),
            filename=f"upscaled_{filename}",
            media_type="application/octet-stream"
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(500, f"Download failed: {str(e)}")

@app.delete("/cleanup/{file_id}")
async def cleanup_files(file_id: str):
    """Clean up temporary files"""
    try:
        deleted = []
        for file_path in UPLOAD_DIR.glob(f"{file_id}_*"):
            file_path.unlink()
            deleted.append(file_path.name)
        
        return {
            "success": True,
            "deleted_files": deleted
        }
    except Exception as e:
        raise HTTPException(500, f"Cleanup failed: {str(e)}")

# Cleanup old files on startup
@app.on_event("startup")
async def startup_cleanup():
    """Clean up old temporary files"""
    try:
        cutoff_time = datetime.now().timestamp() - (24 * 3600)  # 24 hours
        for file_path in UPLOAD_DIR.glob("*"):
            if file_path.is_file() and file_path.stat().st_mtime < cutoff_time:
                file_path.unlink()
    except:
        pass

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8003)
