# Phase 12: .deb Package Builder

**Status:** 🚧 **IN PROGRESS**

**Date Started:** November 2, 2025

**Goal:** Create production-ready Debian package (.deb) dengan auto-install scripts untuk distribution

---

## 📋 Overview

Phase 12 implements complete .deb package building system untuk ChimeraAI desktop application:
- PyInstaller backend executable bundling
- Electron frontend packaging
- DEBIAN control files dengan post-install scripts
- Desktop integration (.desktop file + icons)
- Automated build script (`build_deb.py`)

---

## 🎯 Objectives

### Primary Goals
1. ✅ Create PyInstaller spec file untuk backend bundling
2. ✅ Create DEBIAN control files (control, postinst, prerm, postrm)
3. ✅ Create desktop entry file (.desktop)
4. ✅ Implement automated build script (`build_deb.py`)
5. 🔄 Test .deb package installation (Next)
6. 🔄 Verify backend auto-start dari .deb installation (Next)

### Secondary Goals
- ✅ Production port separation (18001 for .deb, 8001 for dev)
- ✅ User data directory setup (`~/.local/share/chimera-ai/`)
- ✅ Launcher script creation (`/usr/bin/chimera-ai`)
- 🔄 Desktop icon integration (Test)
- 🔄 Clean uninstall dengan data preservation (Test)

---

## 🏗️ Implementation Details

### 1. PyInstaller Spec File (`backend/build_backend.spec`)

**Purpose:** Bundle Python backend ke standalone executable

**Key Features:**
- ✅ Bundle FastAPI + uvicorn + all dependencies
- ✅ Include database template (`chimera_tools.db`)
- ✅ Include AI config files
- ✅ Include sample tools
- ✅ Hidden imports untuk PyInstaller compatibility
- ✅ UPX compression enabled
- ✅ Exclude unnecessary packages (matplotlib, tkinter, etc.)

**Output:**
```
backend/dist/chimera-backend/
├── chimera-backend          # Main executable
└── _internal/               # Bundled Python libraries
    ├── libpython3.11.so
    ├── fastapi/
    ├── torch/
    └── ...
```

**Size Estimate:** ~200-300 MB

---

### 2. DEBIAN Control Files

#### `packaging/DEBIAN/control`
**Package metadata:**
- Package name: `chimera-ai`
- Version: `1.0.0` (auto-updated from package.json)
- Architecture: `amd64`
- Dependencies: `libc6`, `libgcc-s1`, `libstdc++6`
- Description: Complete package description

#### `packaging/DEBIAN/postinst`
**Post-installation script:**
```bash
✅ Create user data directories
   - ~/.local/share/chimera-ai/database/
   - ~/.local/share/chimera-ai/logs/
   - ~/.local/share/chimera-ai/cache/

✅ Create config directory
   - ~/.config/chimera-ai/

✅ Initialize database from template
   - Copy chimera_tools.db if not exists

✅ Set executable permissions
   - /opt/chimera-ai/bin/chimera-ai
   - /opt/chimera-ai/bin/chimera-backend

✅ Update desktop database
✅ Update icon cache
```

#### `packaging/DEBIAN/prerm`
**Pre-removal script:**
```bash
✅ Stop all running ChimeraAI processes
   - pkill chimera-ai
   - pkill chimera-backend

✅ Wait for graceful shutdown (2 seconds)
```

#### `packaging/DEBIAN/postrm`
**Post-removal script:**
```bash
✅ Inform user about preserved data
   - ~/.local/share/chimera-ai/
   - ~/.config/chimera-ai/

✅ Provide manual cleanup command
✅ Update desktop database
```

---

### 3. Desktop Integration

#### `packaging/chimera-ai.desktop`
**Desktop Entry File:**
```ini
[Desktop Entry]
Name=ChimeraAI
Comment=AI Desktop Assistant with Tools & Chat
Exec=/usr/bin/chimera-ai
Icon=chimera-ai
Terminal=false
Categories=Utility;Development;Office;Network;
Keywords=ai;assistant;chat;tools;productivity;
StartupWMClass=ChimeraAI
```

**Icon Locations:**
- `/opt/chimera-ai/share/icons/chimera-ai.png`
- `/usr/share/icons/hicolor/256x256/apps/chimera-ai.png`

---

### 4. Build Script (`build_deb.py`)

**Automated .deb Package Builder**

**Features:**
- ✅ Clean build artifacts (`--clean`)
- ✅ Build backend only (`--backend-only`)
- ✅ Build frontend only (`--frontend-only`)
- ✅ Colored console output
- ✅ Step-by-step progress logging
- ✅ Error handling dengan detailed messages
- ✅ Automatic version detection from package.json

**Build Steps:**
```python
Step 1: Build Backend Executable (PyInstaller)
   - Check PyInstaller installed
   - Run: pyinstaller --clean build_backend.spec
   - Test: ./chimera-backend --help
   - Output: backend/dist/chimera-backend/

Step 2: Build Frontend (Electron)
   - Check node_modules
   - Run: yarn build
   - Output: dist/ (React build)

Step 3: Create .deb Package Structure
   - Create: packaging/build/chimera-ai/
   - Directory tree:
     ├── opt/chimera-ai/
     ├── usr/bin/
     ├── usr/share/applications/
     ├── usr/share/icons/
     ├── var/log/chimera-ai/
     └── DEBIAN/

Step 4: Copy Application Files
   - Backend: → /opt/chimera-ai/bin/chimera-backend/
   - Frontend: → /opt/chimera-ai/lib/resources/app/
   - Electron: → /opt/chimera-ai/lib/resources/electron/
   - Database: → /opt/chimera-ai/data/database/
   - Icon: → /usr/share/icons/hicolor/256x256/apps/

Step 5: Setup DEBIAN Control Files
   - Copy control, postinst, prerm, postrm
   - Update version in control file
   - Set permissions (755)

Step 6: Build .deb Package
   - Run: dpkg-deb --build
   - Output: release/chimera-ai_1.0.0_amd64.deb
```

---

### 5. Package Structure (After Installation)

```
/opt/chimera-ai/                          # Main application
├── bin/
│   ├── chimera-ai                       # Launcher script
│   └── chimera-backend/                 # Backend executable
│       ├── chimera-backend
│       └── _internal/
├── lib/
│   └── resources/
│       ├── app/                         # React frontend
│       └── electron/                    # Electron main
├── share/
│   └── icons/                           # App icons
├── data/
│   └── database/                        # Database template
│       └── chimera_tools.db

/usr/bin/chimera-ai                       # Symlink to launcher

/usr/share/applications/chimera-ai.desktop # Desktop entry

~/.local/share/chimera-ai/               # User data
├── database/                            # User's database
│   └── chimera_tools.db
├── logs/                                # Application logs
│   ├── electron.log
│   └── backend.log
└── cache/                               # Temporary cache

~/.config/chimera-ai/                     # User config
└── config.json                          # User settings
```

---

## 🔧 Build Commands

### Quick Build (Everything)
```bash
# Clean build with all steps
python3 build_deb.py --clean

# Output: release/chimera-ai_1.0.0_amd64.deb
```

### Backend Only (Testing)
```bash
# Build backend executable only
python3 build_deb.py --backend-only

# Test backend:
cd backend/dist/chimera-backend
./chimera-backend --port 18001 --mode production
curl http://localhost:18001/health
```

### Frontend Only (Quick Rebuild)
```bash
# Build frontend only (requires existing backend)
python3 build_deb.py --frontend-only
```

---

## 🧪 Testing Plan

### Phase 2A: Backend Executable Testing ✅ **CURRENT**
```bash
1. Build backend:
   python3 build_deb.py --backend-only

2. Test standalone:
   cd backend/dist/chimera-backend
   ./chimera-backend --port 18001 --mode production

3. Test API:
   curl http://localhost:18001/health
   curl http://localhost:18001/api/tools

4. Expected:
   ✅ Backend starts without errors
   ✅ Production port 18001 used
   ✅ API responds with JSON
   ✅ No Python installation required
```

### Phase 2B: .deb Package Testing 🔄 **NEXT**
```bash
1. Build .deb package:
   python3 build_deb.py --clean

2. Install:
   sudo dpkg -i release/chimera-ai_*.deb

3. Verify installation:
   dpkg -l | grep chimera-ai
   which chimera-ai
   ls -la /opt/chimera-ai/

4. Run application:
   chimera-ai

5. Check backend:
   ps aux | grep chimera-backend
   curl http://localhost:18001/health

6. Check desktop entry:
   ls /usr/share/applications/ | grep chimera
   # Open from app menu (GUI)

7. Uninstall:
   sudo dpkg -r chimera-ai

8. Verify cleanup:
   ls /opt/ | grep chimera-ai        # Should not exist
   which chimera-ai                   # Should return nothing
   ls ~/.local/share/chimera-ai/     # Should exist (data preserved)
```

### Phase 2C: Integration Testing 🔄 **UPCOMING**
```bash
# Test 1: Development vs Production Isolation
Terminal 1: cd /app/backend && python3 server.py  # Port 8001
Terminal 2: chimera-ai                              # Port 18001
Both should work simultaneously! ✅

# Test 2: Backend Auto-Recovery
1. Run: chimera-ai
2. Kill backend: kill -9 <PID>
3. Wait 5 seconds
4. Verify: curl http://localhost:18001/health
   Should work again (auto-restart) ✅

# Test 3: Desktop Icon
1. Press Super key
2. Type "ChimeraAI"
3. Click icon
4. Backend should auto-start ✅
```

---

## 📊 Implementation Progress

### ✅ Completed (Phase 2A)
- [x] PyInstaller spec file created
- [x] DEBIAN control files created
- [x] Desktop entry file created
- [x] Build script implemented
- [x] Directory structure defined
- [x] Launcher script created
- [x] File permissions configured
- [x] Documentation written

### 🔄 In Progress
- [ ] Build backend executable (testing)
- [ ] Build .deb package (testing)
- [ ] Test installation on clean system

### ⏳ Upcoming
- [ ] Test backend auto-start
- [ ] Test desktop icon integration
- [ ] Test uninstall cleanup
- [ ] Performance testing
- [ ] Multi-distro testing (Ubuntu 20.04, 22.04, 24.04)

---

## 📝 Files Created

### Core Build Files
```
/app/backend/build_backend.spec          # PyInstaller spec
/app/build_deb.py                        # Main build script
```

### DEBIAN Package Files
```
/app/packaging/DEBIAN/control            # Package metadata
/app/packaging/DEBIAN/postinst           # Post-install script
/app/packaging/DEBIAN/prerm              # Pre-removal script
/app/packaging/DEBIAN/postrm             # Post-removal script
/app/packaging/chimera-ai.desktop        # Desktop entry
```

### Documentation
```
/app/docs/phase/phase_12.md              # This file
/app/docs/BUILD_STANDALONE.md            # Updated with Phase 2 status
```

---

## 🐛 Known Issues & Considerations

### Issue 1: Large Package Size
**Problem:** .deb package may be 400-500 MB

**Solutions:**
- ✅ Exclude matplotlib, tkinter in PyInstaller spec
- ✅ Enable UPX compression
- ⏳ Test actual size after build
- ⏳ Consider splitting into base + AI models package

### Issue 2: Electron Dependency
**Problem:** .deb needs Electron runtime

**Solutions:**
- ⏳ Bundle Electron with package
- ⏳ Or add electron as dependency in control file
- ⏳ Test on system without Electron

### Issue 3: Python Version Compatibility
**Problem:** PyInstaller bundles specific Python version

**Solutions:**
- ✅ Use Python 3.11 (current system)
- ⏳ Test on older distros (Ubuntu 20.04)
- ⏳ Consider building on older system for better compatibility

---

## 🎯 Success Criteria

**Phase 2 Complete When:**
1. ✅ Backend executable builds successfully
2. ✅ .deb package builds successfully
3. ✅ Package installs without errors (`sudo dpkg -i`)
4. ✅ Application launches from terminal (`chimera-ai`)
5. ✅ Backend auto-starts on application launch
6. ✅ Backend runs on production port (18001)
7. ✅ API accessible and working
8. ✅ Desktop icon appears in app menu
9. ✅ Application works without Python installed
10. ✅ Clean uninstall preserves user data

---

## 📚 References

### Documentation
- [BUILD_STANDALONE.md](../BUILD_STANDALONE.md) - Complete build guide
- [golden-rules.md](../golden-rules.md) - Project conventions
- [phase_11.md](phase_11.md) - Phase 1 (Backend Auto-Start)

### External Resources
- [PyInstaller Documentation](https://pyinstaller.org/)
- [Debian Package Guide](https://www.debian.org/doc/manuals/maint-guide/)
- [Electron Builder](https://www.electron.build/)
- [Desktop Entry Specification](https://specifications.freedesktop.org/desktop-entry-spec/)

---

## 🚀 Next Steps

### Immediate (Phase 2B)
1. **Build backend executable:**
   ```bash
   python3 build_deb.py --backend-only
   ```

2. **Test backend standalone:**
   ```bash
   cd backend/dist/chimera-backend
   ./chimera-backend --port 18001
   curl http://localhost:18001/health
   ```

3. **Build full .deb package:**
   ```bash
   python3 build_deb.py --clean
   ```

4. **User testing:**
   - User akan test install .deb
   - User akan verify backend auto-start
   - User akan test dari application menu

### Future (Phase 3)
- Implement production configuration
- Add auto-update mechanism
- Create AppImage variant
- Multi-distro testing
- Performance optimization

---

**Last Updated:** Phase 2A Complete - Build Scripts Ready  
**Next Milestone:** Phase 2B - Backend Build & Testing  
**Status:** 🚧 Ready for Backend Build

---

**Implementation Notes:**
- All files follow portable path conventions (golden-rules.md)
- Backend uses CLI args from Phase 1
- Production port 18001 configured
- User data preserved on uninstall
- Desktop integration planned
- Auto-restart mechanism from Phase 1 integrated
