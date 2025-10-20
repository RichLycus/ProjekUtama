# ChimeraAI Desktop App

<div align="center">
  <h3>Your Intelligent Desktop Companion</h3>
  <p>Built with Electron, React, TypeScript, and powered by AI</p>
</div>

## 📚 Documentation

### Core Documentation
- **🏅 [Golden Rules](docs/golden-rules.md)** - MUST READ! Project conventions
- **📖 [Full Documentation](docs/index.md)** - Complete documentation index
- **🚀 [Quick Start Guide](docs/quick-start.md)** - Get started in 1 minute!
- **📘 [Development Guide](docs/DEVELOPMENT.md)** - Setup & development

### Phase Documentation
- **✅ [Phase 0 Complete](docs/phase/phase_0.md)** - Foundation & Architecture
- **✅ [Phase 1 Complete](docs/phase/phase_1.md)** - UI Enhancement & Animations
- **✅ [Phase 2 Complete](docs/phase/phase_2.md)** - Tools System & SQLite
- **✅ [Phase 3 Complete](docs/phase/phase_3.md)** - AI Chat with RAG System
- **📋 [Phase 4 Planned](docs/phase/phase_4_planned.md)** - Advanced Chat Features

### Technical Guides
- **🧪 [Backend Testing Guide](docs/BACKEND_TESTING_GUIDE.md)** - Test backend API
- **⚙️ [Model Management](docs/MODEL_MANAGEMENT_QUICKSTART.md)** - AI models configuration
- **🎨 [Phase 3 Wireframes](docs/phase/phase-3-wireframes.md)** - Visual reference

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
./start_chimera.sh
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

## 🔮 Development Phases

- **Phase 0**: ✅ **COMPLETE** - Foundation & Architecture
- **Phase 1**: ✅ **COMPLETE** - UI Enhancement & Animations  
- **Phase 2**: ✅ **COMPLETE** - Tools System & SQLite Database
- **Phase 3**: ✅ **COMPLETE** - AI Chat System with RAG
- **Phase 4**: 📋 **PLANNED** - Advanced Chat Features (File upload, OCR, STT/TTS)
- **Phase 5**: 🔜 **UPCOMING** - Games & Final Polish

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
- [Phase Documentation](docs/phase/)

---

**Current Status**: Phase 4.0 Complete ✅  
**Next**: Phase 4.1-4.4 OR Phase 10 (Standalone Installer)

### Phase 4.0 Highlights 🎉 (NEW!)
- ✅ **Syntax highlighting** untuk 50+ languages dengan copy button
- ✅ **Markdown rendering** lengkap (tables, lists, code, headings)
- ✅ **Conversation History** sidebar dengan search & filter
- ✅ **Agent Status Modal** dengan real-time indicators
- ✅ **Collapsible sidebar** ChatGPT-style dengan smooth animation
- ✅ **Mobile responsive** dengan auto-collapse

### Phase 3 Highlights 🎉
- ✅ Responsive chat interface (mobile, tablet, desktop)
- ✅ RAG system dengan ChromaDB
- ✅ Vector embeddings (all-MiniLM-L6-v2)
- ✅ Multi-agent architecture (Router, RAG, Execution, Reasoning, Persona)
- ✅ Chat history & conversations management
- ✅ Model management system
- ✅ Real-time agent status indicators

### What's New in Phase 4.0:
```bash
# UI/UX Foundation
- Syntax highlighting (OneDark theme)
- Code copy button dengan feedback
- Markdown support (GFM)
- Conversation list dengan grouping
- Agent status popup modal
- Better chat layout

# New Components
- CodeBlock.tsx (syntax highlighting)
- MarkdownRenderer.tsx (full markdown)
- ConversationList.tsx (history sidebar)
- AgentStatusModal.tsx (popup dialog)

# Dependencies Added
- react-markdown, remark-gfm
- react-syntax-highlighter
- date-fns
```

### Quick Start:
```bash
# Development mode (Electron app)
cd /app && yarn dev

# Production build
cd /app && yarn build

# Backend only (FastAPI)
sudo supervisorctl restart backend

# Check status
curl http://localhost:8001/api/chat/status
```

📖 **[See Phase 4 Documentation](docs/phase/phase_4_planned.md)** for complete details!  
📋 **[See Phase 10 Planning](docs/phase/phase-10-planned.md)** for standalone installer plan!

