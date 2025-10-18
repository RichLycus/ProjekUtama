# ChimeraAI Scripts - Universal Usage Guide

## 🌍 Universal Compatibility

All scripts in this project are **universal** and work in any directory:
- ✅ Local development (macOS, Windows, Linux)
- ✅ Docker containers
- ✅ CI/CD pipelines
- ✅ Remote servers

**Scripts automatically detect your project location!**

---

## 📋 Scripts Overview

### 1. verify_setup.py ✅
Verify project health and readiness for GitHub push.

### 2. build_release.py 📦
Build Electron app releases for all platforms.

### 3. pre-commit-check.sh 🔍
Quick pre-commit verification wrapper.

---

## 🚀 Usage Examples

### Local Development (macOS/Linux)

```bash
# Navigate to your project
cd ~/Projects/ChimeraAI

# Run verification
python3 verify_setup.py

# Build releases
python3 build_release.py

# Pre-commit check
./pre-commit-check.sh
```

### Local Development (Windows)

```bash
# Navigate to your project
cd C:\Projects\ChimeraAI

# Run verification (using python or python3)
python verify_setup.py

# Build releases
python build_release.py
```

### Docker Container

```bash
# Inside container
cd /app
python3 verify_setup.py
```

### CI/CD Pipeline

```yaml
# GitHub Actions example
- name: Verify Setup
  run: python3 verify_setup.py
  
- name: Build Releases
  run: python3 build_release.py --clean
```

---

## 🔧 verify_setup.py

### Features
- ✅ Auto-detects project directory
- ✅ Checks all dependencies
- ✅ TypeScript compilation
- ✅ Large file detection (>50MB)
- ✅ Documentation completeness
- ✅ Git configuration

### Commands

```bash
# Full verification
python3 verify_setup.py

# Check file sizes only
python3 verify_setup.py --check-size

# Full check including build (slower)
python3 verify_setup.py --full
```

### Output

```
ChimeraAI Setup Verification
============================================================
Project: /Users/you/Projects/ChimeraAI   ← Auto-detected!

============================================================
1. System Requirements
============================================================
✅ Node.js installed: v22.20.0
✅ Yarn installed: 1.22.22
✅ Python installed: Python 3.11.13

... (more checks) ...

============================================================
Verification Summary
============================================================
✅ Passed: 10
❌ Failed: 0
⚠️  Warnings: 1

✅ ALL CHECKS PASSED!
```

---

## 📦 build_release.py

### Features
- ✅ Auto-detects project directory
- ✅ Builds for all platforms
- ✅ Shows release information
- ✅ Clean build option

### Commands

```bash
# Build releases
python3 build_release.py

# Clean and rebuild
python3 build_release.py --clean

# Show release info only (no build)
python3 build_release.py --info
```

### Output

```
ChimeraAI Release Builder
============================================================
Project: /Users/you/Projects/ChimeraAI   ← Auto-detected!

Building Electron App
============================================================
This will take a few minutes...
✅ Build completed successfully!

Release Build Information
============================================================
Found 3 release build(s):

📦 ChimeraAI-1.0.0-arm64.AppImage
   Size: 142.35 MB
   Path: /Users/you/Projects/ChimeraAI/release/ChimeraAI-1.0.0-arm64.AppImage

... (more files) ...
```

---

## 🔍 pre-commit-check.sh

### Features
- ✅ Works in any directory
- ✅ Runs full verification
- ✅ Shows git commands if passed

### Usage

```bash
# Make executable (first time only)
chmod +x pre-commit-check.sh

# Run before commit
./pre-commit-check.sh
```

### Output

```
🔍 ChimeraAI Pre-Commit Verification
=====================================

(runs verify_setup.py)

✅ All checks passed! Safe to commit.

Next steps:
  git add .
  git commit -m 'Your commit message'
  git push origin main
```

---

## 🌐 Platform-Specific Notes

### macOS

```bash
# Python might be 'python3'
python3 verify_setup.py

# Scripts should be executable
chmod +x pre-commit-check.sh
./pre-commit-check.sh
```

### Windows

```bash
# Python might be 'python' or 'py'
python verify_setup.py

# Or use py launcher
py verify_setup.py

# Bash scripts need Git Bash or WSL
bash pre-commit-check.sh
```

### Linux

```bash
# Standard python3
python3 verify_setup.py

# Make scripts executable
chmod +x *.sh *.py
./pre-commit-check.sh
```

### Docker

```bash
# Standard usage
cd /app
python3 verify_setup.py
```

---

## 🔍 How Auto-Detection Works

Scripts use Python's `Path(__file__).parent.absolute()` to find the project root:

```python
# Get project root directory (where script is located)
SCRIPT_DIR = Path(__file__).parent.absolute()
PROJECT_ROOT = SCRIPT_DIR
```

This means:
- ✅ Works in any directory
- ✅ No hardcoded paths
- ✅ Always finds correct project location
- ✅ Cross-platform compatible

---

## 🛠️ Troubleshooting

### "python3: command not found"

**macOS/Linux:**
```bash
# Use python instead
python verify_setup.py
```

**Windows:**
```bash
# Try these in order
python verify_setup.py
py verify_setup.py
python3 verify_setup.py
```

### "Permission denied" (Linux/macOS)

```bash
# Make scripts executable
chmod +x verify_setup.py build_release.py pre-commit-check.sh

# Then run
./verify_setup.py
```

### Script finds wrong directory

Scripts always use the directory where they're located. Make sure:
1. Scripts are in your project root
2. You're running them from project root or with full path

```bash
# Good
cd /path/to/ChimeraAI
python3 verify_setup.py

# Also good
python3 /path/to/ChimeraAI/verify_setup.py

# Bad - wrong directory
cd /tmp
python3 verify_setup.py  # ❌ This will check /tmp!
```

**Solution**: Always keep scripts in project root, or use full path.

---

## 📊 Common Workflows

### Daily Development

```bash
# 1. Navigate to project
cd ~/Projects/ChimeraAI

# 2. Make changes to code
# ... edit files ...

# 3. Verify before commit
python3 verify_setup.py

# 4. If passed, commit
git add .
git commit -m "Add new feature"
git push origin main
```

### Pre-Release

```bash
# 1. Verify everything is good
python3 verify_setup.py --full

# 2. Build releases
python3 build_release.py --clean

# 3. Check what was built
python3 build_release.py --info

# 4. Upload to GitHub Releases
gh release create v1.0.0 release/*.AppImage release/*.exe
```

### CI/CD Integration

```yaml
# .github/workflows/verify.yml
name: Verify

on: [push, pull_request]

jobs:
  verify:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'
      
      - name: Install dependencies
        run: yarn install
      
      - name: Run verification
        run: python3 verify_setup.py
```

---

## 📝 Summary

✅ **Universal scripts** - Work anywhere
✅ **Auto-detection** - No configuration needed
✅ **Cross-platform** - macOS, Windows, Linux
✅ **Clear output** - Color-coded messages
✅ **Easy to use** - Simple commands

**Always verify before pushing to GitHub:**
```bash
python3 verify_setup.py
```

---

## 🆘 Need Help?

1. Check this guide first
2. Run verification: `python3 verify_setup.py`
3. Check [docs/scripts.md](scripts.md) for detailed docs
4. Check [docs/DEVELOPMENT.md](DEVELOPMENT.md) for dev guide

---

**Happy Coding! 🚀**
