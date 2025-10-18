# 🚀 Quick Start

## Start Development Server

```bash
./launcher_app.sh
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
├── launcher_YYYYMMDD_HHMMSS.log  # Startup checks
└── dev_YYYYMMDD_HHMMSS.log       # Dev server output
```

## Manual Start (Alternative)

```bash
yarn dev
```

## Full Documentation

See [docs/launcher.md](docs/launcher.md) for complete guide.

---

**Made with ❤️ for ChimeraAI Development**
