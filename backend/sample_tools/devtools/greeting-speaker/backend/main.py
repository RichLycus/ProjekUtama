# CATEGORY: Utilities
# NAME: Sapaan Login/Shutdown
# DESCRIPTION: Automatic greeting speaker with espeak - Indonesian language
# VERSION: 1.0.0
# AUTHOR: ChimeraAI Team

from fastapi import FastAPI, HTTPException
from fastapi.responses import JSONResponse
import subprocess
import random
from datetime import datetime
import os

app = FastAPI()

# Variasi sapaan berdasarkan waktu dan event
GREETINGS = {
    "login_morning": [
        "Selamat pagi, Tuan! Semoga hari ini penuh berkah.",
        "Pagi yang cerah, Tuan! Siap memulai petualangan?",
        "Halo Tuan! Semoga pagi ini membawa kebahagiaan.",
        "Selamat pagi! Ayo kita mulai hari dengan semangat!",
        "Pagi Tuan! Waktunya untuk produktif!"
    ],
    "login_afternoon": [
        "Selamat siang, Tuan! Semoga hari ini menyenangkan.",
        "Siang yang indah, Tuan! Apa kabar hari ini?",
        "Halo Tuan! Semoga siang ini produktif.",
        "Selamat siang! Mari kita lanjutkan pekerjaan.",
        "Siang Tuan! Jangan lupa istirahat sebentar ya."
    ],
    "login_evening": [
        "Selamat sore, Tuan! Bagaimana hari Anda?",
        "Sore yang tenang, Tuan! Waktunya bersantai.",
        "Halo Tuan! Selamat sore dan selamat beristirahat.",
        "Selamat sore! Hari ini pasti melelahkan ya?",
        "Sore Tuan! Mari kita akhiri hari dengan baik."
    ],
    "login_night": [
        "Selamat malam, Tuan! Masih semangat bekerja?",
        "Malam yang tenang, Tuan! Jangan begadang ya.",
        "Halo Tuan! Selamat malam dan selamat beristirahat.",
        "Selamat malam! Waktunya untuk rileks.",
        "Malam Tuan! Jaga kesehatan dan istirahat yang cukup."
    ],
    "shutdown": [
        "Sampai jumpa, Tuan! Semoga besok lebih baik.",
        "Selamat beristirahat, Tuan! Tidur yang nyenyak.",
        "Sampai bertemu lagi! Jaga kesehatan selalu.",
        "Selamat tinggal! Terima kasih sudah menggunakan ChimeraAI.",
        "Sampai jumpa besok! Mimpi indah ya Tuan.",
        "Hati-hati di jalan! Sampai bertemu kembali.",
        "Selamat beristirahat! Jangan lupa backup data."
    ]
}

def get_time_of_day():
    """Determine time of day based on current hour"""
    hour = datetime.now().hour
    if 5 <= hour < 12:
        return "morning"
    elif 12 <= hour < 15:
        return "afternoon"
    elif 15 <= hour < 18:
        return "evening"
    else:
        return "night"

def get_random_greeting(event_type: str = "login"):
    """Get random greeting based on event type and time"""
    if event_type == "shutdown":
        greetings_list = GREETINGS["shutdown"]
    else:
        time_of_day = get_time_of_day()
        key = f"login_{time_of_day}"
        greetings_list = GREETINGS.get(key, GREETINGS["login_morning"])
    
    return random.choice(greetings_list)

def speak_text(text: str):
    """Speak text using espeak"""
    try:
        # Check if espeak is installed
        result = subprocess.run(
            ["which", "espeak"],
            capture_output=True,
            text=True
        )
        
        if result.returncode != 0:
            # Try espeak-ng as fallback
            result = subprocess.run(
                ["which", "espeak-ng"],
                capture_output=True,
                text=True
            )
            if result.returncode != 0:
                return {
                    "success": False,
                    "message": "espeak not installed. Please install with: sudo apt-get install espeak"
                }
            espeak_cmd = "espeak-ng"
        else:
            espeak_cmd = "espeak"
        
        # Speak with Indonesian voice settings
        # -v id for Indonesian, -s 150 for speed
        subprocess.run(
            [espeak_cmd, "-v", "id", "-s", "150", text],
            check=True,
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL
        )
        
        return {"success": True, "message": "Speech completed"}
    except subprocess.CalledProcessError as e:
        return {
            "success": False,
            "message": f"espeak error: {str(e)}"
        }
    except Exception as e:
        return {
            "success": False,
            "message": f"Error: {str(e)}"
        }

@app.get("/")
async def root():
    return {
        "name": "Sapaan Login/Shutdown",
        "version": "1.0.0",
        "description": "Automatic greeting speaker with espeak"
    }

@app.get("/greetings/{event_type}")
async def get_greeting(event_type: str):
    """Get random greeting text without speaking"""
    try:
        if event_type not in ["login", "shutdown"]:
            raise HTTPException(400, "event_type must be 'login' or 'shutdown'")
        
        greeting = get_random_greeting(event_type)
        time_of_day = get_time_of_day() if event_type == "login" else "shutdown"
        
        return {
            "success": True,
            "greeting": greeting,
            "event_type": event_type,
            "time_of_day": time_of_day,
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        raise HTTPException(500, str(e))

@app.post("/speak")
async def speak_greeting(event_type: str = "login", custom_text: str = None):
    """Speak greeting using espeak"""
    try:
        if event_type not in ["login", "shutdown"]:
            raise HTTPException(400, "event_type must be 'login' or 'shutdown'")
        
        # Use custom text or get random greeting
        text = custom_text if custom_text else get_random_greeting(event_type)
        
        # Speak the text
        result = speak_text(text)
        
        return {
            "success": result["success"],
            "message": result["message"],
            "text_spoken": text,
            "event_type": event_type,
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        raise HTTPException(500, str(e))

@app.get("/check-espeak")
async def check_espeak():
    """Check if espeak is installed and working"""
    try:
        # Check espeak
        result = subprocess.run(
            ["which", "espeak"],
            capture_output=True,
            text=True
        )
        espeak_available = result.returncode == 0
        
        # Check espeak-ng as fallback
        result_ng = subprocess.run(
            ["which", "espeak-ng"],
            capture_output=True,
            text=True
        )
        espeak_ng_available = result_ng.returncode == 0
        
        return {
            "espeak_available": espeak_available,
            "espeak_ng_available": espeak_ng_available,
            "available": espeak_available or espeak_ng_available,
            "install_command": "sudo apt-get install espeak" if not (espeak_available or espeak_ng_available) else None
        }
    except Exception as e:
        return {
            "espeak_available": False,
            "espeak_ng_available": False,
            "available": False,
            "error": str(e),
            "install_command": "sudo apt-get install espeak"
        }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8002)
