# ChimeraAI - Scripts Guide

This folder contains utility scripts for development and deployment.

## 📋 Available Scripts

### 1. `verify_setup.py` ✅
**Purpose**: Verify project setup before GitHub push

**Features**:
- ✅ Check Node.js, Yarn, Python installation
- ✅ Verify project structure
- ✅ Check TypeScript compilation
- ✅ Find large files (>50MB)
- ✅ Verify .gitignore configuration
- ✅ Check documentation completeness

**Usage**:
```bash
# Full verification
python3 verify_setup.py

# Check file sizes only
python3 verify_setup.py --check-size

# Full check including build (slower)
python3 verify_setup.py --full
```

**When to run**:
- ✅ Before committing to Git
- ✅ Before pushing to GitHub
- ✅ After installing new dependencies
- ✅ After major changes

---

### 2. `build_release.py` 📦
**Purpose**: Build Electron app and manage release artifacts

**Features**:
- 🔨 Build production Electron app
- 📦 Create platform-specific installers (.AppImage, .exe, .dmg)
- 📊 Show release build information
- 🧹 Clean release folder

**Usage**:
```bash
# Build releases
python3 build_release.py

# Clean and rebuild
python3 build_release.py --clean

# Show release info only
python3 build_release.py --info
```

**Output**:
- Linux: `.AppImage`, `.deb`, `.rpm`
- Windows: `.exe`
- macOS: `.dmg`, `.pkg`

---

## 🚀 Quick Start Workflow

### Before Committing to GitHub:

```bash
# 1. Run verification
python3 verify_setup.py

# 2. If all checks pass, commit
git add .
git commit -m "Your commit message"
git push origin main
```

### Building for Distribution:

```bash
# 1. Clean previous builds
python3 build_release.py --clean

# 2. Build will create files in /app/release/
# 3. Release folder is in .gitignore (won't be pushed)

# 4. To download release files:
cd /app/release
python3 -m http.server 8080
# Then download via browser: http://your-server:8080
```

---

## ⚠️ Important Notes

### Release Folder:
- 📁 Location: `/app/release/`
- 🚫 **NOT committed to GitHub** (in .gitignore)
- 💾 Files can be 100MB+ (GitHub limit is 100MB per file)
- ☁️ Use GitHub Releases or cloud storage for distribution

### .gitignore Configuration:
The following are automatically ignored:
```
release/           # All release builds
*.AppImage        # Linux AppImage
*.exe             # Windows installer
*.dmg             # macOS disk image
*.pkg             # macOS package
*.deb             # Debian package
*.rpm             # Red Hat package
node_modules/     # Dependencies
dist/             # Build output
dist-electron/    # Electron build
```

---

## 📊 Verification Checklist

When you run `verify_setup.py`, it checks:

### ✅ System Requirements
- [x] Node.js 18+ installed
- [x] Yarn package manager
- [x] Python 3.8+

### ✅ Project Structure
- [x] All required files present
- [x] package.json valid
- [x] node_modules installed

### ✅ Code Quality
- [x] TypeScript compiles without errors
- [x] No syntax errors

### ✅ Documentation
- [x] README.md exists
- [x] Phase documentation complete
- [x] Golden rules documented

### ✅ Git Configuration
- [x] .gitignore properly configured
- [x] No large files (>50MB) in tracked files
- [x] Release folder excluded

---

## 🔧 Troubleshooting

### "Large files found" warning:
```bash
# Check what files are large
python3 verify_setup.py --check-size

# Common culprits:
# - release/ folder → Already in .gitignore ✅
# - node_modules/ → Already in .gitignore ✅
# - Custom large assets → Add to .gitignore
```

### Build fails:
```bash
# 1. Clean and reinstall dependencies
rm -rf node_modules
yarn install

# 2. Try building again
python3 build_release.py --clean
```

### TypeScript errors:
```bash
# Check errors in detail
npx tsc --noEmit

# Fix errors in code
# Then re-run verification
python3 verify_setup.py
```

---

## 📦 Distribution Best Practices

### Recommended Workflow:

1. **Development**: Work on features, commit code to GitHub
2. **Build**: Run `build_release.py` to create installers
3. **Test**: Test the built app on target platforms
4. **Distribute**: Upload to GitHub Releases or cloud storage

### GitHub Releases (Recommended):
```bash
# 1. Build releases
python3 build_release.py

# 2. Create GitHub release
# Go to: https://github.com/your-repo/releases/new

# 3. Upload release files manually
# Or use GitHub CLI:
gh release create v1.0.0 /app/release/*.AppImage /app/release/*.exe
```

### Alternative: Cloud Storage
- Google Drive
- Dropbox
- AWS S3
- Azure Blob Storage

---

## 🎯 Summary

| Script | Purpose | When to Use |
|--------|---------|-------------|
| `verify_setup.py` | Check project health | Before Git push |
| `build_release.py` | Build installers | When releasing |

**Golden Rule**: 
✅ Always run `verify_setup.py` before pushing to GitHub!
🚫 Never commit `release/` folder (it's in .gitignore)

---

## 📞 Support

If you encounter issues:
1. Check this README
2. Run `verify_setup.py` for diagnostics
3. Check `docs/DEVELOPMENT.md` for detailed guide
4. Review `docs/golden-rules.md` for conventions

---

**Happy Building! 🚀**
