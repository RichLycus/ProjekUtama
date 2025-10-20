# Phase 10: Standalone Installer with Bundled Backend (PLANNED)

> **Status**: 📋 Planned  
> **Target Platform**: Linux (AppImage) + Windows (NSIS Installer)  
> **Goal**: Truly standalone desktop app dengan Python backend ter-bundle, auto-run, dan installer dengan desktop shortcut

---

## 🎯 Objectives

Membuat installer standalone ChimeraAI yang:
- ✅ **Tidak butuh Python installed** di sistem user
- ✅ **Bundle lengkap**: Python venv + dependencies + backend + frontend + database
- ✅ **Auto-run backend** saat aplikasi dibuka
- ✅ **Desktop shortcut** otomatis setelah install
- ✅ **Pilihan lokasi install** (custom install path)
- ✅ **Size ~700MB** (acceptable untuk standalone app)
- ✅ **Support Linux + Windows**

---

## 🏗️ Architecture Plan

### Current Architecture (Problematic)
```
AppImage/exe
├── dist/               # React frontend (✅ works)
├── dist-electron/      # Electron main process (✅ works)
└── backend/            # Python source files (❌ needs Python installed)
    ├── server.py
    ├── requirements.txt
    └── ...
```

**Problem**: User harus install Python + pip + requirements.txt secara manual

---

### New Architecture (Standalone)
```
AppImage/exe
├── dist/               # React frontend
├── dist-electron/      # Electron main process
├── backend/            # Python source (for reference)
├── python-runtime/     # ✨ BUNDLED Python portable environment
│   ├── python          # Python executable
│   ├── lib/            # Python libraries
│   ├── site-packages/  # All dependencies (FastAPI, uvicorn, etc)
│   └── Scripts/        # (Windows only)
├── backend-executable/ # ✨ Alternative: PyInstaller standalone backend
│   └── backend         # Single executable (Linux) / backend.exe (Windows)
└── data/               # SQLite database (portable)
    └── chimera_tools.db
```

**Solution**: Everything self-contained, no external dependencies

---

## 📦 Implementation Options

### Option 1: Python Portable Bundle (RECOMMENDED) ⭐
**Pros:**
- ✅ Easier debugging (Python scripts visible)
- ✅ Easier updates (just replace .py files)
- ✅ Better error messages
- ✅ Support hot reload during development

**Cons:**
- ❌ Larger size (~500-700MB)
- ❌ Slower startup (interpretasi Python)

**Tech Stack:**
- **Linux**: python3-embed atau venv copy
- **Windows**: python-embed-amd64 dari python.org
- **Dependencies**: Install semua requirements.txt ke venv portable

---

### Option 2: PyInstaller Backend Executable
**Pros:**
- ✅ Smaller size (~200-300MB)
- ✅ Faster startup
- ✅ Harder to reverse engineer

**Cons:**
- ❌ Debugging lebih susah
- ❌ Antivirus false positive (common issue)
- ❌ Dependency issues (C libraries, dll)
- ❌ No hot reload

**Tech Stack:**
- PyInstaller untuk build backend → `backend` / `backend.exe`
- Bundle with `--onefile` or `--onedir`

---

## 🛠️ Detailed Implementation Plan

### Phase 10.1: Setup Python Portable Bundle

#### Linux (AppImage)
```bash
# Create portable Python environment
python3 -m venv python-runtime
source python-runtime/bin/activate
pip install -r backend/requirements.txt

# Test portable execution
./python-runtime/bin/python backend/server.py
```

#### Windows (NSIS)
```bash
# Download python-embed-amd64
wget https://www.python.org/ftp/python/3.11.8/python-3.11.8-embed-amd64.zip
unzip python-3.11.8-embed-amd64.zip -d python-runtime

# Install pip to embedded Python
python-runtime/python.exe get-pip.py
python-runtime/python.exe -m pip install -r backend/requirements.txt

# Test
python-runtime\python.exe backend\server.py
```

---

### Phase 10.2: Update Electron Main Process

**File**: `electron/main.ts`

```typescript
function startBackend() {
  const isDev = process.env.NODE_ENV !== 'production'
  
  if (isDev) {
    // Development: use system Python
    backendProcess = spawn('python3', ['-m', 'uvicorn', 'server:app', ...])
  } else {
    // Production: use bundled Python
    const isWin = process.platform === 'win32'
    const pythonExec = isWin 
      ? path.join(process.resourcesPath, 'python-runtime', 'python.exe')
      : path.join(process.resourcesPath, 'python-runtime', 'bin', 'python')
    
    const backendDir = path.join(process.resourcesPath, 'backend')
    
    backendProcess = spawn(pythonExec, [
      '-m', 'uvicorn',
      'server:app',
      '--host', '127.0.0.1',
      '--port', '8001'
    ], {
      cwd: backendDir,
      env: { ...process.env, PYTHONHOME: path.dirname(pythonExec) }
    })
  }
}
```

---

### Phase 10.3: Update electron-builder Config

**File**: `package.json`

```json
{
  "build": {
    "files": [
      "dist/**/*",
      "dist-electron/**/*",
      "backend/**/*",
      "!backend/__pycache__",
      "!backend/**/*.pyc"
    ],
    "extraResources": [
      {
        "from": "python-runtime",
        "to": "python-runtime",
        "filter": ["**/*"]
      },
      {
        "from": "backend",
        "to": "backend",
        "filter": ["**/*", "!__pycache__", "!**/*.pyc"]
      },
      {
        "from": "backend/data",
        "to": "data"
      }
    ],
    "linux": {
      "target": "AppImage",
      "icon": "build/icon.png",
      "category": "Utility",
      "desktop": {
        "Name": "ChimeraAI",
        "Comment": "Intelligent Desktop Assistant",
        "Terminal": false,
        "Type": "Application",
        "Categories": "Utility;Development;"
      }
    },
    "win": {
      "target": "nsis",
      "icon": "build/icon.ico"
    },
    "nsis": {
      "oneClick": false,
      "allowToChangeInstallationDirectory": true,
      "createDesktopShortcut": true,
      "createStartMenuShortcut": true,
      "installerIcon": "build/icon.ico",
      "uninstallerIcon": "build/icon.ico",
      "installerHeaderIcon": "build/icon.ico",
      "perMachine": false,
      "artifactName": "ChimeraAI-Setup-${version}.${ext}"
    }
  }
}
```

---

### Phase 10.4: Build Script

**File**: `build_standalone.py`

```python
#!/usr/bin/env python3
"""
Build standalone ChimeraAI installer with bundled Python backend
"""
import os
import sys
import subprocess
import shutil
from pathlib import Path

PROJECT_ROOT = Path(__file__).parent

def build_python_portable():
    """Build portable Python environment"""
    print("🔧 Building portable Python environment...")
    
    runtime_dir = PROJECT_ROOT / "python-runtime"
    
    if runtime_dir.exists():
        shutil.rmtree(runtime_dir)
    
    # Create venv
    subprocess.run([sys.executable, "-m", "venv", str(runtime_dir)], check=True)
    
    # Install dependencies
    pip_path = runtime_dir / "bin" / "pip" if os.name != 'nt' else runtime_dir / "Scripts" / "pip.exe"
    subprocess.run([
        str(pip_path), 
        "install", 
        "-r", 
        str(PROJECT_ROOT / "backend" / "requirements.txt")
    ], check=True)
    
    print("✅ Python portable environment ready")

def build_electron():
    """Build Electron app with electron-builder"""
    print("🔧 Building Electron app...")
    
    subprocess.run(["yarn", "build"], cwd=PROJECT_ROOT, check=True)
    
    print("✅ Electron build complete")

def main():
    print("=" * 60)
    print("ChimeraAI Standalone Build Script")
    print("=" * 60)
    
    # Step 1: Build portable Python
    build_python_portable()
    
    # Step 2: Build Electron app
    build_electron()
    
    print("\n" + "=" * 60)
    print("✅ Build complete!")
    print("📦 Installer location: release/")
    print("=" * 60)

if __name__ == "__main__":
    main()
```

---

## 🧪 Testing Plan

### Local Testing (Before Build)
```bash
# Test backend with portable Python
./python-runtime/bin/python -m uvicorn backend.server:app --host 127.0.0.1 --port 8001

# Test frontend
yarn dev
```

### Build Testing
```bash
# Clean build
python build_standalone.py

# Test AppImage (Linux)
./release/ChimeraAI-*.AppImage

# Test installer (Windows)
# Run ChimeraAI-Setup-*.exe in Windows VM
```

---

## 📝 User Experience

### Installation Flow (Windows NSIS)
```
1. User downloads: ChimeraAI-Setup-1.0.0.exe
2. Double click → Installer opens
3. User sees:
   - Welcome screen
   - License agreement
   - Choose install location (C:\Program Files\ChimeraAI)
   - Install progress bar
   - Completion screen with options:
     ✅ Create desktop shortcut
     ✅ Run ChimeraAI now
4. Click Finish
5. Desktop icon appears
6. Click icon → App opens
7. Backend auto-starts in background
8. Frontend ready in 3-5 seconds
```

### Installation Flow (Linux AppImage)
```
1. User downloads: ChimeraAI-1.0.0.AppImage
2. chmod +x ChimeraAI-1.0.0.AppImage
3. ./ChimeraAI-1.0.0.AppImage
4. (Optional) AppImageLauncher detects → Integrate to system
5. Desktop shortcut created
6. Backend auto-starts
7. App ready
```

---

## 📊 Size Estimation

### Components Size Breakdown
```
Frontend (React build):           ~15MB
Electron runtime:                 ~100MB
Backend Python source:            ~5MB
Python portable + dependencies:   ~500MB
Database (empty):                 ~1MB
Icons & assets:                   ~5MB
-------------------------------------------
Total AppImage/Installer:         ~626MB
Installed size:                   ~650MB
```

**Note**: 700MB adalah acceptable untuk aplikasi desktop modern (contoh: VS Code ~300MB, Discord ~250MB)

---

## 🚀 Deployment Strategy

### Linux
```bash
# Build AppImage
python build_standalone.py --platform linux

# Upload to GitHub Releases
gh release create v1.0.0 ./release/ChimeraAI-*.AppImage
```

### Windows
```bash
# Build NSIS installer (di Windows atau Wine)
python build_standalone.py --platform windows

# Upload to GitHub Releases
gh release create v1.0.0 ./release/ChimeraAI-Setup-*.exe
```

---

## 🔐 Security Considerations

1. **Code Signing**
   - Linux: Sign AppImage (optional, tidak wajib)
   - Windows: Sign .exe dengan certificate (wajib untuk menghindari SmartScreen warning)

2. **Auto-update**
   - Implement electron-updater untuk auto-update
   - Backend update via API check

3. **Database Migration**
   - SQLite database portable, tidak perlu migrasi khusus
   - Backup otomatis sebelum update

---

## 📚 References

- [electron-builder Documentation](https://www.electron.build/)
- [Python Embedded Distribution](https://docs.python.org/3/using/windows.html#embedded-distribution)
- [NSIS Installer Options](https://www.electron.build/configuration/nsis)
- [AppImage Best Practices](https://docs.appimage.org/packaging-guide/index.html)

---

## ✅ Success Criteria

- [ ] User dapat install tanpa Python pre-installed
- [ ] Desktop shortcut otomatis muncul
- [ ] Backend auto-start tanpa manual intervention
- [ ] Database SQLite accessible dan portable
- [ ] Install path dapat dipilih oleh user
- [ ] Uninstaller berfungsi dengan baik (Windows)
- [ ] Size < 800MB
- [ ] Startup time < 10 detik

---

**Next Steps**: Implement Phase 10.1 - Setup Python Portable Bundle
