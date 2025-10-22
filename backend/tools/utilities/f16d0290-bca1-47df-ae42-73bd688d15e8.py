"""
Background Remover

NAME: Background Remover
CATEGORY: multimedia
DESCRIPTION: Remove image background using AI-powered processing. Accepts image URL or base64-encoded image data.
VERSION: 1.0.0
AUTHOR: Your Name
"""

import base64
import io
import requests
from PIL import Image
from rembg import remove  # Pastikan rembg terinstal di environment backend

def run(params):
    """
    Main execution function for background removal.
    
    Expected params:
    {
        "image": "data:image/jpeg;base64,/9j/4AAQ..."  # atau URL gambar
    }
    
    Returns:
    {
        "success": True,
        "result": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA..."
    }
    """
    try:
        image_input = params.get("image")
        if not image_input:
            return {"success": False, "error": "Missing 'image' parameter"}

        # Handle base64 image
        if image_input.startswith("data:image"):
            header, encoded = image_input.split(",", 1)
            image_data = base64.b64decode(encoded)
            input_image = Image.open(io.BytesIO(image_data))
        # Handle URL
        elif image_input.startswith("http"):
            response = requests.get(image_input)
            response.raise_for_status()
            input_image = Image.open(io.BytesIO(response.content))
        else:
            return {"success": False, "error": "Invalid image format. Must be base64 or URL."}

        # Remove background
        output_image = remove(input_image)

        # Convert to base64 PNG
        output_buffer = io.BytesIO()
        output_image.save(output_buffer, format="PNG")
        output_base64 = base64.b64encode(output_buffer.getvalue()).decode("utf-8")
        result_data_url = f"data:image/png;base64,{output_base64}"

        return {"success": True, "result": result_data_url}

    except Exception as e:
        return {"success": False, "error": str(e)}