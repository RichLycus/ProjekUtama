# ChimeraAI Package Builder Scripts

Interactive scripts untuk build standalone packages (AppImage & .deb).

## 🚀 Quick Start

### Run Interactive Builder

```bash
# Make executable (first time only)
chmod +x scripts/install_package.sh

# Run interactive menu
./scripts/install_package.sh
```

## 📋 Menu Options

### Build Options

1. **🚀 Quick Build (All)** - Build backend, frontend, dan AppImage sekaligus
2. **🐍 Build Backend Only** - Build Python backend dengan PyInstaller
3. **⚛️ Build Frontend Only** - Build React + Electron
4. **📦 Build AppImage** - Create portable AppImage package
5. **📦 Build .deb Package** - *(Coming in Phase 2)*

### Utility Options

6. **🧪 Test Backend** - Test backend executable standalone
7. **🧹 Clean Build** - Remove all build artifacts
8. **📥 Install Dependencies** - Install frontend & backend dependencies
9. **ℹ️ Build Info** - Show current build status

## 📦 Build Outputs

### Backend Executable
```
backend/dist/chimera-backend/
├── chimera-backend           # Main executable
└── _internal/                # Bundled dependencies
    ├── libpython3.11.so
    ├── fastapi/
    ├── torch/
    └── ...
```

**Size:** ~200-300 MB

**Test:**
```bash
cd backend/dist/chimera-backend
./chimera-backend --port 18001 --mode production
```

### AppImage Package
```
release/
└── ChimeraAI-1.0.0.AppImage  # Portable executable
```

**Size:** ~400-600 MB

**Run:**
```bash
chmod +x release/ChimeraAI-*.AppImage
./release/ChimeraAI-*.AppImage
```

### .deb Package *(Phase 2 - Coming Soon)*
```
release/
└── chimera-ai_1.0.0_amd64.deb
```

**Install:**
```bash
sudo dpkg -i release/chimera-ai_*.deb
chimera-ai
```

## 🔧 Manual Build Commands

If you prefer manual control:

### Backend Only
```bash
cd backend
/root/.venv/bin/pyinstaller \
    --name chimera-backend \
    --onedir \
    --console \
    server.py
```

### Frontend Only
```bash
yarn build
```

### AppImage
```bash
yarn build
yarn electron-builder --linux AppImage
```

## 📊 Build Requirements

### System Requirements
- **Python:** 3.8+
- **Node.js:** 16+
- **Yarn:** 1.22+
- **RAM:** 4GB minimum (8GB recommended)
- **Disk:** 2GB free space for build

### Dependencies
```bash
# Frontend
yarn install

# Backend
cd backend
/root/.venv/bin/pip install -r requirements.txt
/root/.venv/bin/pip install pyinstaller
```

## 🎯 Build Targets

### Development Environment
- Backend: `http://localhost:8001`
- Frontend: `http://localhost:3000` (Vite dev server)

### Production (.deb)
- Backend: `http://localhost:18001`
- Frontend: Internal Electron renderer

### Production (AppImage)
- Backend: `http://localhost:18002`
- Frontend: Internal Electron renderer

## 🐛 Troubleshooting

### Backend Build Fails

**Issue:** Missing Python dependencies
```bash
cd backend
/root/.venv/bin/pip install -r requirements.txt
```

**Issue:** PyInstaller not found
```bash
/root/.venv/bin/pip install pyinstaller
```

### Frontend Build Fails

**Issue:** Missing node modules
```bash
yarn install
```

**Issue:** Out of memory
```bash
# Increase Node.js heap size
export NODE_OPTIONS="--max-old-space-size=4096"
yarn build
```

### AppImage Too Large

**Solution:** Exclude unnecessary dependencies in PyInstaller spec

### Backend Won't Start

**Check logs:**
```bash
tail -f /tmp/backend_test.log
```

**Test manually:**
```bash
cd backend/dist/chimera-backend
./chimera-backend --port 18001 --mode production
```

## 📝 Build Script Features

### ✅ Implemented
- ✅ Interactive menu system
- ✅ Color-coded output
- ✅ Prerequisite checking
- ✅ Backend build (PyInstaller)
- ✅ Frontend build (Electron)
- ✅ AppImage creation
- ✅ Clean build artifacts
- ✅ Dependency installation
- ✅ Backend testing
- ✅ Build information display

### 🚧 Coming Soon (Phase 2)
- 🚧 .deb package builder
- 🚧 DEBIAN control files generation
- 🚧 Post-install scripts
- 🚧 Desktop integration
- 🚧 Automatic testing suite
- 🚧 Multi-distro support verification

## 🔄 Development Workflow

### First Time Setup
```bash
# 1. Run interactive builder
./scripts/install_package.sh

# 2. Install dependencies (Option 8)
# 3. Build backend (Option 2)
# 4. Test backend (Option 6)
# 5. Build AppImage (Option 4)
```

### Incremental Builds
```bash
# Backend changes only
./scripts/install_package.sh
# Choose option 2 (Build Backend Only)

# Frontend changes only
./scripts/install_package.sh
# Choose option 3 (Build Frontend Only)
```

### Clean Rebuild
```bash
./scripts/install_package.sh
# Choose option 7 (Clean Build)
# Then option 1 (Quick Build All)
```

## 📚 Related Documentation

- [Build Standalone Guide](../docs/BUILD_STANDALONE.md) - Complete build documentation
- [Golden Rules](../docs/golden-rules.md) - Project conventions
- [Phase 11 Documentation](../docs/phase/phase_11.md) - Backend auto-start implementation

## 🆘 Support

**Issues?**
1. Check this documentation
2. Check build logs
3. View [BUILD_STANDALONE.md](../docs/BUILD_STANDALONE.md)
4. Check [Golden Rules](../docs/golden-rules.md)

**Build Time Estimates:**
- Backend Only: 3-5 minutes
- Frontend Only: 2-3 minutes
- AppImage (Full): 6-8 minutes
- .deb Package: 6-8 minutes *(Phase 2)*

---

**Last Updated:** Phase 11 - Backend Auto-Start Complete  
**Script Version:** 1.0  
**Status:** ✅ Production Ready
