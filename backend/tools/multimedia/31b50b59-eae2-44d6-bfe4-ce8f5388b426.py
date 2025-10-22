"""
Background Remover Backend

NAME: Background Remover
CATEGORY: multimedia
DESCRIPTION: Remove image background using AI. Accepts base64-encoded image and returns transparent PNG as base64.
VERSION: 1.0.0
AUTHOR: ChimeraAI Team
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import base64
import io
import sys
from PIL import Image

# ✅ FastAPI app instance - REQUIRED
app = FastAPI(
    title="Background Remover API",
    description="AI-powered background removal service for ChimeraAI",
    version="1.0.0"
)

# ✅ CORS middleware - REQUIRED for iframe/frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Try to import rembg; if not available, disable processing
try:
    from rembg import remove
    REMBG_AVAILABLE = True
except ImportError:
    REMBG_AVAILABLE = False

# Request model
class BackgroundRemovalRequest(BaseModel):
    image: str  # base64-encoded image string (e.g., "image/jpeg;base64,/9j/...")

# Response model
class BackgroundRemovalResponse(BaseModel):
    status: str
    message: str
    result: str | None = None  # base64 PNG with transparent background
    os_detected: str

def run_logic(params: dict):
    """
    Core logic mimicking the old `run(params)` pattern for internal/test use.
    """
    if not REMBG_AVAILABLE:
        return {
            "status": "error",
            "message": "rembg library not installed. Background removal unavailable.",
            "result": None,
            "os_detected": sys.platform
        }

    image_data_url = params.get("image", "")
    if not image_data_url or "," not in image_data_url:
        return {
            "status": "error",
            "message": "Invalid image format. Expected base64 data URL (e.g., 'image/...;base64,...').",
            "result": None,
            "os_detected": sys.platform
        }

    try:
        # Extract base64 part
        header, encoded = image_data_url.split(",", 1)
        image_bytes = base64.b64decode(encoded)
        input_image = Image.open(io.BytesIO(image_bytes)).convert("RGB")

        # Remove background
        output_image = remove(input_image)  # Returns RGBA PIL Image

        # Save to base64 PNG
        output_buffer = io.BytesIO()
        output_image.save(output_buffer, format="PNG")
        output_base64 = base64.b64encode(output_buffer.getvalue()).decode("utf-8")
        result_data_url = f"image/png;base64,{output_base64}"

        return {
            "status": "success",
            "message": "Background removed successfully.",
            "result": result_data_url,
            "os_detected": sys.platform
        }

    except Exception as e:
        return {
            "status": "error",
            "message": f"Processing failed: {str(e)}",
            "result": None,
            "os_detected": sys.platform
        }

@app.post("/run", response_model=BackgroundRemovalResponse)
async def run_endpoint(request: BackgroundRemovalRequest):
    """
    Main endpoint called by ChimeraAI frontend.
    Accepts base64 image, removes background, returns base64 PNG.
    """
    try:
        result = run_logic({"image": request.image})

        if result["status"] == "error":
            raise HTTPException(status_code=400, detail=result["message"])

        return BackgroundRemovalResponse(**result)

    except Exception as e:
        return {
            "status": "error",
            "message": f"Unexpected server error: {str(e)}",
            "result": None,
            "os_detected": sys.platform
        }

@app.get("/health")
def health_check():
    return {
        "status": "ok",
        "service": "Background Remover",
        "os": sys.platform,
        "rembg_available": REMBG_AVAILABLE
    }