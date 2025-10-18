# 🚀 Quick Start

## Start Development Server

```bash
./start_chimera.sh
```

That's it! The launcher will:
- ✅ Check Node.js & Yarn
- ✅ Auto-install dependencies if needed
- ✅ Check & free up ports
- ✅ Start Electron + Vite
- ✅ Create comprehensive logs

## Features

- **Smart Dependency Check** - Only installs when needed
- **Port Management** - Auto-kills busy processes
- **Colored Output** - Easy-to-read terminal
- **Comprehensive Logging** - All logs in `logs/` folder
- **Error Handling** - Clear error messages

## Logs Location

```
logs/
├── launcher.log  # Startup checks (reset on each run)
├── backend.log   # Backend server output (reset on each run)
└── frontend.log  # Frontend dev server output (reset on each run)
```

**Note**: All log files are reset (overwritten) on each run for clean output.

## Manual Start (Alternative)

```bash
yarn dev
```

## Full Documentation

See [docs/launcher.md](docs/launcher.md) for complete guide.

---

**Made with ❤️ for ChimeraAI Development**
