"""
System Power Control Backend

NAME: System Power Control
CATEGORY: Utilities
DESCRIPTION: Restart or shutdown the computer with female voice confirmation using eSpeak or system TTS
VERSION: 1.0.0
AUTHOR: ChimeraAI Team
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import subprocess
import sys
import os

# ✅ FastAPI app instance - REQUIRED
app = FastAPI(
    title="System Power Control API",
    description="Control system power actions (restart/shutdown) with voice feedback",
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

# Request model
class PowerRequest(BaseModel):
    action: str  # "restart" or "shutdown"
    delay_seconds: int = 5

# Response model
class PowerResponse(BaseModel):
    status: str
    message: str
    action: str
    delay_seconds: int
    os_detected: str

def run_logic(params: dict):
    """
    Core logic (mimics old `run(params)`) for internal use or testing.
    """
    action = params.get("action", "").lower()
    delay = params.get("delay_seconds", 5)

    if action not in ["restart", "shutdown"]:
        return {
            "status": "error",
            "message": "Invalid action. Use 'restart' or 'shutdown'.",
            "action": action,
            "delay_seconds": delay,
            "os_detected": sys.platform
        }

    if not isinstance(delay, int) or delay < 0:
        delay = 5

    system = sys.platform
    message = f"{'Restarting' if action == 'restart' else 'Shutting down'} computer in {delay} seconds. Please save your work."

    try:
        # Speak using system TTS with female voice
        if system.startswith("linux"):
            # Use eSpeak with mb-en1 (female)
            subprocess.run(["espeak", "-v", "mb-en1", "-s", "140", "-p", "40", message], check=False, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        elif system == "darwin":
            # macOS: Samantha (female)
            subprocess.run(["say", "-v", "Samantha", message], check=False, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        elif system == "win32":
            # Windows: Zira (female)
            ps_script = f'''
            Add-Type -AssemblyName System.Speech
            $speak = New-Object System.Speech.Synthesis.SpeechSynthesizer
            $speak.SelectVoice("Microsoft Zira Desktop")
            $speak.Speak("{message}")
            '''
            subprocess.run(["powershell", "-Command", ps_script], check=False, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

        # ⚠️ SECURITY: In real deployment, you'd trigger actual shutdown here.
        # For ChimeraAI safety, we SIMULATE only.
        # Actual command would require sudo/admin and is disabled by default.

        return {
            "status": "success",
            "message": f"Voice command spoken. System will {action} in {delay} seconds. (Simulated for safety)",
            "action": action,
            "delay_seconds": delay,
            "os_detected": system
        }

    except Exception as e:
        return {
            "status": "error",
            "message": f"Failed to speak or simulate: {str(e)}",
            "action": action,
            "delay_seconds": delay,
            "os_detected": system
        }

@app.post("/run", response_model=PowerResponse)
async def run_endpoint(request: PowerRequest):
    """
    Main endpoint called by ChimeraAI frontend.
    Accepts action and delay, speaks message, simulates power action.
    """
    try:
        result = run_logic({
            "action": request.action,
            "delay_seconds": request.delay_seconds
        })

        if result["status"] == "error":
            raise HTTPException(status_code=400, detail=result["message"])

        return PowerResponse(**result)

    except Exception as e:
        # 🛡️ Always return valid JSON even on uncaught errors
        return {
            "status": "error",
            "message": f"Unexpected server error: {str(e)}",
            "action": request.action,
            "delay_seconds": request.delay_seconds,
            "os_detected": sys.platform
        }

@app.get("/health")
def health_check():
    return {"status": "ok", "service": "System Power Control", "os": sys.platform}