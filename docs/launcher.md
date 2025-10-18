# 🚀 ChimeraAI Launcher Documentation

## Overview

`launcher_app.sh` is an intelligent development launcher that automates the entire startup process for ChimeraAI development.

## Features

✅ **Auto Dependency Check** - Detects if node_modules exists  
✅ **Smart Installation** - Only installs when needed  
✅ **Port Management** - Auto-kills processes on busy ports  
✅ **Comprehensive Logging** - Separate logs for launcher & dev server  
✅ **Colored Output** - Easy-to-read terminal output  
✅ **Error Handling** - Graceful error messages  
✅ **Interactive Prompts** - Asks before installing dependencies  

---

## Quick Start

### 1. Basic Usage

```bash
# From project root
./launcher_app.sh
```

### 2. What It Does

```
1. Shows ChimeraAI banner 🎨
2. Checks Node.js installation ✅
3. Checks Yarn installation ✅
4. Checks if dependencies are installed
   - If YES → Skip to step 6
   - If NO → Prompt to install
5. Installs dependencies (if needed)
6. Checks if ports are available
   - Kills processes on port 5173 if busy
7. Starts yarn dev (Electron + Vite) 🚀
```

---

## Usage Examples

### First Time Setup

```bash
./launcher_app.sh

# Output:
# ✅ Node.js installed: v18.x.x
# ✅ Yarn installed: v1.22.x
# ⚠️  Dependencies not found
# Install dependencies now? [Y/n]: Y
# 🚀 Installing dependencies...
# ✅ Dependencies installed successfully!
# 🚀 Starting development server...
```

### Regular Development

```bash
./launcher_app.sh

# Output:
# ✅ Node.js installed: v18.x.x
# ✅ Yarn installed: v1.22.x
# ✅ Dependencies already installed
# ✅ Port 5173 is available
# ✅ All checks passed! ✅
# 🚀 Starting development server...
```

### When Port is Busy

```bash
./launcher_app.sh

# Output:
# ⚠️  Port 5173 is already in use
# ℹ️  Killing process on port 5173...
# ✅ Port 5173 is now available
# 🚀 Starting development server...
```

---

## Log Files

All logs are saved in `/app/logs/` directory:

### Log Types

1. **Launcher Logs** - `launcher_YYYYMMDD_HHMMSS.log`
   - Startup checks
   - Dependency installation
   - Port checks
   - General launcher activity

2. **Dev Server Logs** - `dev_YYYYMMDD_HHMMSS.log`
   - Vite output
   - Electron output
   - Build messages
   - Runtime logs

### View Logs

```bash
# Latest launcher log
ls -lt logs/launcher_*.log | head -1 | xargs cat

# Latest dev log
ls -lt logs/dev_*.log | head -1 | xargs cat

# Tail live dev log
tail -f logs/dev_*.log
```

---

## Advanced Usage

### Skip Dependency Check

If you want to force reinstall:

```bash
# Remove node_modules first
rm -rf node_modules

# Run launcher (will auto-install)
./launcher_app.sh
```

### Clean Start

```bash
# Clean everything
rm -rf node_modules logs dist dist-electron

# Fresh start
./launcher_app.sh
```

### Background Mode (Not Recommended)

```bash
# Run in background
nohup ./launcher_app.sh > /dev/null 2>&1 &

# Check logs
tail -f logs/dev_*.log
```

---

## Troubleshooting

### Issue: "Yarn is not installed"

**Solution:**
```bash
npm install -g yarn
# or
corepack enable
```

### Issue: "Port 5173 is already in use"

**Solution:** Launcher auto-kills the process, but if it persists:
```bash
# Manual kill
kill -9 $(lsof -t -i:5173)

# Then run launcher
./launcher_app.sh
```

### Issue: "Dependencies failed to install"

**Solution:**
```bash
# Clear cache
yarn cache clean

# Remove node_modules
rm -rf node_modules

# Try again
./launcher_app.sh
```

### Issue: "Electron won't start"

**Solution:** Check dev logs:
```bash
cat logs/dev_*.log | tail -50
```

Common causes:
- Missing dependencies
- Port conflicts
- Permission issues

---

## Output Colors

| Color | Meaning |
|-------|---------|
| 🔵 Blue | General information |
| 🟢 Green | Success messages |
| 🟡 Yellow | Warnings |
| 🔴 Red | Errors |
| 🟣 Purple | Process steps |
| 🟦 Cyan | Info messages |

---

## Script Flow Diagram

```
START
  ↓
Show Banner
  ↓
Check Node.js ────→ ❌ Not Found → EXIT
  ↓ ✅
Check Yarn ───────→ ❌ Not Found → EXIT
  ↓ ✅
Check Dependencies
  ↓
  ├─ ✅ Found ─────→ Continue
  │
  └─ ❌ Not Found
      ↓
    Prompt User
      ↓
    Install Deps ──→ ❌ Failed → EXIT
      ↓ ✅
Check Ports
  ↓
  ├─ ✅ Available → Continue
  │
  └─ ⚠️ Busy
      ↓
    Kill Process
      ↓ ✅
Start Dev Server
  ↓
RUNNING (Ctrl+C to stop)
```

---

## Configuration

### Edit Log Directory

Open `launcher_app.sh` and modify:

```bash
# Line 17
LOG_DIR="$PROJECT_DIR/logs"  # Change this path
```

### Edit Port

Launcher checks port 5173 by default. To change:

```bash
# Line 136 - Edit port number
if lsof -Pi :5173 -sTCP:LISTEN -t >/dev/null 2>&1; then
#            ^^^^ Change this
```

### Disable Colors

To disable colored output:

```bash
# Add this at the top of launcher_app.sh
export NO_COLOR=1
```

---

## Integration with Development Workflow

### Option 1: Direct Execution

```bash
./launcher_app.sh
```

### Option 2: Add to package.json

```json
{
  "scripts": {
    "launch": "./launcher_app.sh"
  }
}
```

Then run:
```bash
yarn launch
```

### Option 3: Add Alias

Add to `~/.bashrc` or `~/.zshrc`:

```bash
alias chimera='cd /app && ./launcher_app.sh'
```

Then run from anywhere:
```bash
chimera
```

---

## Best Practices

1. **Always use launcher for development**
   - Ensures dependencies are up to date
   - Handles port conflicts automatically
   - Creates proper logs

2. **Check logs when issues occur**
   ```bash
   ls -lt logs/ | head -5
   ```

3. **Clean logs periodically**
   ```bash
   # Keep last 10 logs, delete older
   cd logs && ls -t | tail -n +11 | xargs rm -f
   ```

4. **Use Ctrl+C to stop gracefully**
   - Launcher handles cleanup
   - Stops Vite and Electron properly

---

## Differences from Manual Start

| Aspect | Manual (`yarn dev`) | Launcher (`./launcher_app.sh`) |
|--------|---------------------|--------------------------------|
| Dependency check | ❌ No | ✅ Yes |
| Port management | ❌ Manual | ✅ Automatic |
| Logging | ❌ Terminal only | ✅ Files + Terminal |
| Error handling | ❌ Basic | ✅ Comprehensive |
| Visual feedback | ❌ Plain | ✅ Colored + Banner |
| First-time setup | ❌ Manual steps | ✅ Automated |

---

## Performance

- **Startup time**: ~5-10 seconds (with deps)
- **Startup time**: ~2-3 seconds (without deps install)
- **Log file size**: ~10-50 KB per session
- **Resource usage**: Same as `yarn dev`

---

## Security Notes

- Launcher runs with current user permissions
- No sudo required (unless installing yarn globally)
- Logs may contain sensitive info - add to `.gitignore`
- Port killing only affects ChimeraAI ports

---

## Maintenance

### Update Launcher

1. Edit `launcher_app.sh`
2. Update version in banner (line 48)
3. Test thoroughly

### Add New Checks

Add function in "Check Functions" section:

```bash
check_new_thing() {
    log_step "Checking new thing..."
    
    if [ condition ]; then
        log_success "Check passed"
        return 0
    else
        log_error "Check failed"
        return 1
    fi
}
```

Then call in `main()`:

```bash
check_new_thing
```

---

## Changelog

### v1.0 (Current)
- ✅ Initial release
- ✅ Auto dependency check
- ✅ Port management
- ✅ Comprehensive logging
- ✅ Colored output
- ✅ Interactive prompts

### Future Plans
- 🔜 Auto-update check
- 🔜 Environment validation
- 🔜 Performance metrics
- 🔜 Multiple environment support

---

## FAQ

**Q: Can I run this on Windows?**  
A: Use Git Bash or WSL. Native Windows batch script coming soon.

**Q: Does it work with npm instead of yarn?**  
A: Currently yarn-only. Fork and modify for npm support.

**Q: Can I customize the banner?**  
A: Yes! Edit lines 35-48 in `launcher_app.sh`

**Q: How do I stop the server?**  
A: Press `Ctrl+C`. Launcher will cleanup gracefully.

**Q: Where are the logs stored?**  
A: In `/app/logs/` directory. Auto-created on first run.

---

## Support

- **Issues**: Check logs first (`logs/`)
- **Documentation**: This file
- **Community**: ChimeraAI team

---

## License

Part of ChimeraAI project. See main LICENSE file.

---

**Last Updated**: Phase 0  
**Maintained By**: ChimeraAI Team  
**Location**: `/app/docs/launcher.md`
