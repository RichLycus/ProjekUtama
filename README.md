# ChimeraAI Desktop App

<div align="center">
  <h3>Your Intelligent Desktop Companion</h3>
  <p>Built with Electron, React, TypeScript, and powered by AI</p>
</div>

## 📚 Documentation

- **🏅 [Golden Rules](docs/golden-rules.md)** - MUST READ! Project conventions
- **📖 [Full Documentation](docs/index.md)** - Complete documentation index
- **🚀 [Development Guide](docs/DEVELOPMENT.md)** - Setup & development
- **📅 [Phase 0 Complete](docs/phase/phase_0.md)** - Foundation status

## 🚀 Phase 0 - Foundation Complete

### ✅ Implemented Features

- **Modern Tech Stack**
  - Electron for desktop application
  - React 19 for UI
  - TypeScript for type safety
  - Vite for blazing fast development
  - Tailwind CSS with custom dark theme

- **Core Architecture**
  - Main process (Electron)
  - Renderer process (React)
  - Secure IPC communication with preload script
  - Context isolation enabled

- **UI Components**
  - Glassmorphism design system
  - Responsive navigation header
  - Page routing (Home, Portfolio, Tools, Chat, Games, Settings)
  - Animated avatar placeholder
  - Dark theme with custom color palette

- **Security**
  - `contextIsolation: true`
  - `nodeIntegration: false`
  - Secure IPC via preload script

## 📦 Development

### Install Dependencies
```bash
yarn install
```

### Run Development Mode

**🚀 Recommended (with auto-checks):**
```bash
./launcher_app.sh
```

**Manual:**
```bash
yarn dev
```

This will:
1. Start Vite dev server on port 5173
2. Launch Electron with hot reload
3. Open DevTools automatically

### Verify Setup Before Push
```bash
python3 verify_setup.py
```

This checks:
- ✅ Dependencies installed correctly
- ✅ TypeScript compilation
- ✅ No large files (>100MB)
- ✅ .gitignore configured properly

### Build Application
```bash
yarn build
```

Creates production builds for your platform in the `release/` directory.

**Note**: `release/` folder is in `.gitignore` and won't be pushed to GitHub (files are too large).

## 📁 Project Structure

```
chimera-ai/
├── README.md            # You are here (project overview)
├── docs/               # 📚 All documentation
│   ├── index.md       # Documentation index
│   ├── golden-rules.md # Project conventions (MUST READ)
│   ├── DEVELOPMENT.md # Complete dev guide
│   ├── tools.md       # Python tools docs
│   ├── games.md       # Web games docs
│   └── phase/         # Phase documentation
│       └── phase_0.md # Foundation complete
├── electron/           # Electron main process
│   ├── main.ts        # Entry point
│   └── preload.ts     # Secure IPC bridge
├── src/               # React renderer
│   ├── components/    # Reusable UI components
│   ├── pages/        # Page components
│   ├── stores/       # Zustand state (future)
│   ├── styles/       # Global styles
│   ├── lib/          # Utilities
│   ├── App.tsx       # Root component
│   └── main.tsx      # React entry
├── tests/            # All test files (test_*.py)
├── tools/            # Python tools
├── games/            # Web games
├── public/           # Static assets
└── build/            # Build configs
```

## 🎨 Design System

### Colors
- **Background**: `#1e1e1e`
- **Surface**: `#2d2d30`
- **Primary**: `#007acc`
- **Secondary**: `#0098ff`
- **Accent**: `#00d4ff`

### Components
- `.glass` - Glassmorphism effect
- `.card` - Elevated card with hover
- `.btn-primary` - Primary action button
- `.input` - Styled form input

## 🔮 Upcoming Phases

- **Phase 1**: ✅ **COMPLETE** - Animated avatar (Jarvis/Gemini style), glassmorphism, page transitions
- **Phase 2**: Python Tools - Tool execution framework  
- **Phase 3**: AI Chat - Ollama integration
- **Phase 4**: Animations - Advanced avatar states
- **Phase 5**: Games & Polish - Final features

📖 **See [docs/index.md](docs/index.md) for complete documentation**

## 🛠️ Tech Stack

- **Desktop**: Electron 33
- **UI**: React 19, TypeScript
- **Bundler**: Vite 6
- **Styling**: Tailwind CSS 3
- **State**: Zustand (when needed)
- **Icons**: Lucide React
- **Router**: React Router 7
- **Animation**: Framer Motion

## 🔧 Utility Scripts

**Universal scripts that work anywhere** (local, Docker, CI/CD):

### `verify_setup.py`
Check project health before GitHub push:
```bash
python3 verify_setup.py              # Full verification
python3 verify_setup.py --check-size # Check large files only
```

### `build_release.py`
Build and manage release artifacts:
```bash
python3 build_release.py             # Build releases
python3 build_release.py --clean     # Clean and rebuild
python3 build_release.py --info      # Show release info
```

📖 **See [docs/scripts-universal.md](docs/scripts-universal.md) for complete guide**

## 📝 Notes

- Hot reload enabled for both processes
- DevTools open automatically in development  
- IPC communication is type-safe
- Security best practices from day one

## 🤝 Contributing

1. **Read [Golden Rules](docs/golden-rules.md)** first!
2. Check [Development Guide](docs/DEVELOPMENT.md)
3. Follow project conventions strictly
4. All tests pass before commit

## 📖 Learn More

- [Complete Documentation](docs/index.md)
- [Development Guide](docs/DEVELOPMENT.md)
- [Golden Rules](docs/golden-rules.md)
- [Phase 0 Status](docs/phase/phase_0.md)

---

**Current Status**: Phase 1 Complete ✅  
**Next**: Phase 2 - Python Tools Integration
