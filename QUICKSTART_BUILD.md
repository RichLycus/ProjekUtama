# 🚀 ChimeraAI - Build Standalone AppImage

## Quick Start

### 1️⃣ Build Backend + Frontend (Recommended)

```bash
python3 build_standalone.py
```

Ini akan:
- ✅ Build backend dengan PyInstaller → `backend/dist/chimera-backend/`
- ✅ Build frontend dengan Electron → `release/ChimeraAI-*.AppImage`
- ✅ Bundle semuanya jadi single AppImage

**Waktu:** ~5-8 menit

---

### 2️⃣ Jalankan AppImage

```bash
# Make executable
chmod +x release/ChimeraAI-*.AppImage

# Run!
./release/ChimeraAI-*.AppImage
```

**AppImage akan:**
- ✅ Auto-start backend (port 8001)
- ✅ Open frontend window
- ✅ Tidak butuh Python installed!

---

## Build Options

### Backend Only
```bash
python3 build_standalone.py --backend-only
```

### Frontend Only
```bash
python3 build_standalone.py --frontend-only
```

### Clean Build
```bash
python3 build_standalone.py --clean
```

---

## Troubleshooting

### Backend tidak start?

1. Test backend manual:
```bash
cd backend/dist/chimera-backend
./chimera-backend
# Should start on http://localhost:8001
```

2. Check logs:
```bash
./release/ChimeraAI-*.AppImage
# Watch console output
```

### Build error?

1. Install dependencies:
```bash
pip install pyinstaller
cd backend && pip install -r requirements.txt
cd .. && yarn install
```

2. Try clean build:
```bash
python3 build_standalone.py --clean
```

---

## File Locations

```
backend/dist/chimera-backend/    # Backend executable
release/ChimeraAI-*.AppImage     # Final installer
```

---

## 📖 Full Documentation

Lihat [docs/BUILD_STANDALONE.md](docs/BUILD_STANDALONE.md) untuk dokumentasi lengkap.

---

**Status:** ✅ Ready for Production  
**Platform:** Linux (AppImage)  
**Size:** ~400-600 MB
