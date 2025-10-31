# ChimeraAI Documentation Index

> **📌 IMPORTANT**: Always read [Golden Rules](golden-rules.md) first before any development!

## 📚 Core Documentation

### Essential Reading
- **[Golden Rules](golden-rules.md)** ⭐ - Project conventions & guidelines (MUST READ!)
- **[Fix: Preload Build Issue](FIX_PRELOAD_BUILD.md)** - Solution for "Cannot use import statement" error

### Setup & Deployment
- **[Container Setup](CONTAINER_SETUP.md)** - Running ChimeraAI in Docker/container
- **[Build Standalone](BUILD_STANDALONE.md)** - Creating standalone executables

---

## 🚀 Phase Documentation

Phase documentation follows the format: `phase/phase_X.md`

### Completed Phases

| Phase | Title | Status | Description |
|-------|-------|--------|-------------|
| Phase 0 | Foundation & Architecture | ✅ Complete | Electron app setup, React UI, IPC |
| Phase 1 | UI Enhancement & Animations | ✅ Complete | Glassmorphism, responsive design |
| Phase 2 | Tools System & SQLite | ✅ Complete | Dynamic tools, database integration |
| Phase 3 | AI Chat with RAG System | ✅ Complete | ChromaDB, vector embeddings, multi-agent |
| Phase 6 | Enhanced Chat Features | ✅ Complete | Syntax highlighting, markdown, history |
| Phase 7 | Advanced Features | ✅ Complete | Workflow builder, smart router |

### In Planning

| Phase | Title | Status | Description |
|-------|-------|--------|-------------|
| Phase 5 | Local Server Management | 📋 Planned | Apache/Nginx bundling, www/ projects, domain management |

### Planned Phases

| Phase | Title | Status | File |
|-------|-------|--------|------|
| Phase 5 | Local Server Management | 📋 Planned | [phase_5.md](phase/phase_5.md) |
| Phase 10 | Standalone Installer | 📋 Planned | [phase-10-planned.md](phase/phase-10-planned.md) |

---

## 📁 Directory Structure

```
docs/
├── README.md                    # This file (documentation index)
├── golden-rules.md             # ⭐ Project conventions (CRITICAL!)
├── FIX_PRELOAD_BUILD.md        # Preload script build fix
├── CONTAINER_SETUP.md          # Container/Docker setup
├── BUILD_STANDALONE.md         # Standalone build guide
└── phase/                      # Phase documentation
    ├── phase_0.md              # Foundation
    ├── phase_1.md              # UI Enhancement
    ├── phase_2.md              # Tools System
    ├── phase_3.md              # AI Chat & RAG
    ├── phase_6.md              # Enhanced Chat
    ├── phase_7.md              # Advanced Features
    ├── phase_10.md             # Standalone (completed)
    └── phase-10-planned.md     # Standalone planning
```

---

## 🎯 Quick Links by Topic

### 🏗️ Architecture & Setup
- [Golden Rules](golden-rules.md) - Project structure & conventions
- [Phase 0 - Foundation](phase/phase_0.md) - Architecture overview
- [Container Setup](CONTAINER_SETUP.md) - Docker/container configuration

### 🎨 UI & Design
- [Phase 1 - UI Enhancement](phase/phase_1.md) - Design system, animations
- [Phase 6 - Enhanced Chat](phase/phase_6.md) - Syntax highlighting, markdown

### 🔧 Features & Tools
- [Phase 2 - Tools System](phase/phase_2.md) - Dynamic tools, SQLite database
- [Phase 5 - Server Management](phase/phase_5.md) - Apache/Nginx, www/ projects, local domains
- [Phase 7 - Advanced Features](phase/phase_7.md) - Workflow builder

### 🤖 AI & Chat
- [Phase 3 - AI Chat](phase/phase_3.md) - RAG system, multi-agent architecture
- [Phase 6 - Enhanced Chat](phase/phase_6.md) - Chat improvements

### 🐛 Troubleshooting
- [Fix: Preload Build](FIX_PRELOAD_BUILD.md) - Electron preload script issues

### 🚀 Deployment
- [Build Standalone](BUILD_STANDALONE.md) - Creating executables
- [Phase 10 - Installer](phase/phase_10.md) - Standalone installer (completed)

---

## 📝 Documentation Guidelines

Following [Golden Rules - Rule #2](golden-rules.md#rule-2-documentation-files-md):

### ✅ Correct Locations
```
docs/                          # All documentation here
docs/phase/phase_X.md         # Phase documentation
README.md                     # Root (project overview only)
```

### ❌ Incorrect Locations
```
root/*.md                     # Don't put docs in root!
tools/README.md               # Don't put docs in feature folders!
PHASE_X_COMPLETE.md          # Use docs/phase/phase_X.md format!
```

### Naming Convention
- Phase docs: `phase_0.md`, `phase_1.md`, etc. (use underscore)
- Feature docs: `feature-name.md` or `FEATURE_NAME.md`
- Guide docs: `GUIDE_NAME.md` (uppercase for guides)

---

## 🔄 Keeping Documentation Updated

When adding new features:

1. **Update appropriate phase doc** (e.g., `phase/phase_X.md`)
2. **Add to this index** if it's a new major document
3. **Follow naming conventions** strictly
4. **Keep golden-rules.md updated** with new conventions

When completing a phase:
- ✅ Mark phase as complete in this index
- ✅ Update main README.md status
- ❌ Don't create separate "PHASE_X_COMPLETE.md" files

---

## 📚 Additional Resources

- **Main README**: [../README.md](../README.md) - Project overview
- **Package Info**: [../package.json](../package.json) - Dependencies & scripts
- **Golden Rules**: [golden-rules.md](golden-rules.md) - ⭐ MUST READ!

---

**Last Updated**: October 28, 2024  
**ChimeraAI Version**: Phase 7 Complete  
**Status**: Documentation Cleanup ✅
