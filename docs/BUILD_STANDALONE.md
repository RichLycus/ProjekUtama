# ChimeraAI Standalone Build Guide

> **Build production-ready AppImage dengan bundled Python backend**

## 🎯 Overview

Script ini memungkinkan Anda membuat standalone Linux AppImage yang:
- ✅ **Tidak butuh Python installed** di sistem user
- ✅ **Backend otomatis jalan** saat AppImage dibuka
- ✅ **Single file installer** yang siap distribusi
- ✅ **Portable** - bisa jalan di semua distro Linux modern

---

## 📋 Prerequisites

### System Requirements
```bash
# Check yang sudah installed:
python3 --version    # Python 3.8+
node --version       # Node.js 16+
yarn --version       # Yarn 1.22+
```

### Dependencies
```bash
# Install jika belum ada:
pip install pyinstaller
yarn install
```

---

## 🚀 Build Process

### Option 1: Full Build (RECOMMENDED)

Build backend + frontend sekaligus:

```bash
# Method 1: Langsung pakai Python script
python3 build_standalone.py

# Method 2: Pakai yarn command
yarn build:full
```

**Output:**
```
backend/dist/chimera-backend/      # Backend executable
release/ChimeraAI-*.AppImage       # Final AppImage
```

---

### Option 2: Backend Only

Hanya build backend executable:

```bash
python3 build_standalone.py --backend-only
# atau
yarn build:backend
```

**Output:**
```
backend/dist/chimera-backend/chimera-backend    # Executable
```

**Test backend:**
```bash
cd backend/dist/chimera-backend
./chimera-backend
# Backend should start on http://localhost:8001
```

---

### Option 3: Frontend Only

Build Electron app tanpa rebuild backend:

```bash
python3 build_standalone.py --frontend-only
```

**Note:** Backend executable harus sudah ada di `backend/dist/chimera-backend/`

---

### Clean Build

Hapus semua build artifacts sebelum build ulang:

```bash
python3 build_standalone.py --clean
```

Ini akan menghapus:
- `backend/build/`
- `backend/dist/`
- `dist/`
- `dist-electron/`
- `release/`

---

## 📦 Build Output

### Structure

Setelah build sukses, struktur output:

```
backend/dist/chimera-backend/
├── chimera-backend              # Main executable
├── _internal/                   # PyInstaller bundled files
│   ├── libpython3.11.so.1.0
│   ├── fastapi/
│   ├── uvicorn/
│   ├── torch/
│   └── ...
└── ...

release/
└── ChimeraAI-1.0.0.AppImage    # Final installer (~400-600MB)
```

### File Sizes

Typical sizes:
- **Backend executable**: ~200-300 MB
- **Final AppImage**: ~400-600 MB
- **Installed size**: ~500-700 MB

---

## 🧪 Testing

### Test Backend Executable

```bash
# Navigate to backend dist
cd backend/dist/chimera-backend

# Run backend
./chimera-backend

# Test API (in another terminal)
curl http://localhost:8001/health
curl http://localhost:8001/api/tools
```

### Test AppImage

```bash
# Make executable
chmod +x release/ChimeraAI-*.AppImage

# Run AppImage
./release/ChimeraAI-*.AppImage
```

**Expected behavior:**
1. AppImage starts
2. Backend automatically launches in background
3. Frontend opens in window
4. Backend API accessible at http://localhost:8001

---

## 🔧 Troubleshooting

### Issue 1: PyInstaller not found

**Error:**
```
ModuleNotFoundError: No module named 'PyInstaller'
```

**Solution:**
```bash
pip install pyinstaller
# or
pip3 install pyinstaller
```

---

### Issue 2: Backend build fails

**Error:**
```
Failed to execute script 'server' due to unhandled exception
```

**Solution:**

1. Check backend dependencies:
```bash
cd backend
pip install -r requirements.txt
```

2. Test backend manually:
```bash
cd backend
python3 server.py
```

3. Check PyInstaller spec file:
```bash
# Edit backend/build_backend.spec
# Add missing modules to hiddenimports
```

---

### Issue 3: Backend not starting in AppImage

**Symptoms:**
- AppImage opens but backend not responding
- http://localhost:8001 not accessible

**Debug steps:**

1. Run AppImage from terminal to see logs:
```bash
./ChimeraAI-*.AppImage
```

2. Check if backend executable exists:
```bash
# Extract AppImage
./ChimeraAI-*.AppImage --appimage-extract
# Check backend
ls squashfs-root/resources/backend-dist/chimera-backend/
```

3. Run backend manually:
```bash
cd squashfs-root/resources/backend-dist/chimera-backend/
./chimera-backend
```

---

### Issue 4: Large AppImage size

**Problem:** AppImage > 800MB

**Solutions:**

1. Exclude unnecessary dependencies in `build_backend.spec`:
```python
excludes=[
    'matplotlib',
    'tkinter',
    'PyQt5',
    'PyQt6',
    'PySide2',
    'PySide6',
    # Add more...
],
```

2. Use UPX compression (already enabled):
```python
upx=True,
```

3. Remove test files from backend before build:
```bash
rm -rf backend/tests/
rm -rf backend/__pycache__/
```

---

### Issue 5: AppImage won't run on older distros

**Error:**
```
GLIBC_X.XX not found
```

**Solution:**

Build on older distro (e.g., Ubuntu 20.04) untuk better compatibility:
```bash
docker run -it --rm \
  -v $(pwd):/app \
  ubuntu:20.04 \
  bash -c "cd /app && python3 build_standalone.py"
```

---

## 📝 Build Script Options

### Command Line Arguments

```bash
python3 build_standalone.py [OPTIONS]

Options:
  --clean           Clean previous builds first
  --backend-only    Build backend executable only
  --frontend-only   Build Electron app only (skip backend)
  -h, --help        Show help message
```

### Examples

```bash
# Clean build from scratch
python3 build_standalone.py --clean

# Quick rebuild (backend already built)
python3 build_standalone.py --frontend-only

# Test backend changes only
python3 build_standalone.py --backend-only
```

---

## 🚀 Distribution

### Upload to GitHub Releases

```bash
# Create release
gh release create v1.0.0 \
  release/ChimeraAI-*.AppImage \
  --title "ChimeraAI v1.0.0" \
  --notes "Standalone Linux AppImage with bundled backend"
```

### Direct Download

Users can download and run:

```bash
# Download (example)
wget https://github.com/your-repo/ChimeraAI/releases/download/v1.0.0/ChimeraAI-1.0.0.AppImage

# Make executable
chmod +x ChimeraAI-1.0.0.AppImage

# Run
./ChimeraAI-1.0.0.AppImage
```

---

## 📊 Performance

### Build Time

On typical development machine:
- Backend build: 3-5 minutes
- Frontend build: 2-3 minutes
- **Total**: ~5-8 minutes

### Runtime Performance

- AppImage startup: 2-3 seconds
- Backend startup: 3-5 seconds (first run)
- Total ready time: ~5-8 seconds

---

## 🔐 Security

### Code Signing (Optional)

For better security and trust:

```bash
# Sign AppImage
gpg --detach-sign ChimeraAI-*.AppImage

# Verify
gpg --verify ChimeraAI-*.AppImage.sig ChimeraAI-*.AppImage
```

---

## 📚 Architecture

### Production Bundle Structure

```
AppImage
├── AppRun                    # Entry point
├── ChimeraAI.desktop        # Desktop file
├── chimera-ai.png           # Icon
└── usr/
    ├── bin/
    │   └── chimera-ai       # Electron wrapper
    └── lib/
        └── ChimeraAI/
            ├── dist/                      # React build
            ├── dist-electron/             # Electron main
            └── resources/
                ├── backend-dist/          # ✨ Backend executable
                │   └── chimera-backend/
                │       ├── chimera-backend
                │       └── _internal/
                ├── backend-data/          # Database
                └── app.asar              # Electron app
```

### Startup Flow

```
1. User runs: ./ChimeraAI.AppImage
   ↓
2. AppImage mounts & runs AppRun
   ↓
3. Electron main process starts
   ↓
4. main.ts detects production mode
   ↓
5. Spawns backend executable:
      resources/backend-dist/chimera-backend/chimera-backend
   ↓
6. Backend starts on http://localhost:8001
   ↓
7. Frontend loads & connects to backend
   ↓
8. ✅ App ready!
```

---

## ✅ Checklist

Sebelum distribusi, pastikan:

- [ ] Build tanpa error
- [ ] Backend executable bisa standalone run
- [ ] AppImage bisa run di clean system (no Python)
- [ ] Backend auto-start saat AppImage dibuka
- [ ] API http://localhost:8001 accessible
- [ ] Database di-create di user directory (~/.chimera-ai/)
- [ ] File size reasonable (< 800MB)
- [ ] No hardcoded paths (portable!)
- [ ] Tested on minimal 2 different distros

---

## 🆘 Support

Issues? Check:
1. This documentation
2. Build logs output
3. [Golden Rules](golden-rules.md)
4. [Development Guide](DEVELOPMENT.md)

---

**Last Updated:** Phase 10 - Standalone Build Implementation  
**Maintainer:** ChimeraAI Team  
**Status:** ✅ Production Ready
