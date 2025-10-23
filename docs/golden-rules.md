# 🏅 Golden Rules - ChimeraAI Project

## 📜 Aturan Wajib untuk Semua Developer

Sebelum melakukan **APAPUN** di project ini, baca dan ikuti aturan berikut dengan ketat!

---

## 🖥️ **RULE #0: Project Context (CRITICAL)**

### **ChimeraAI adalah Electron Desktop Application**

**PENTING:**
- ✅ Ini adalah **desktop app** berbasis Electron (bukan web app)
- ✅ Frontend: React + TypeScript + Vite
- ✅ Backend: FastAPI Python (optional local API server)
- ✅ Main Process: Electron (Node.js)
- ✅ Renderer Process: React (browser context)

### **Universal & Portable Development**

**WAJIB - Environment Agnostic:**

```
✅ HARUS support multiple environments:
- 🐳 Docker containers (path: /app/)
- 💻 Local development (path: ~/Projects/chimera-ai/)
- 🖥️ Windows (path: C:\Users\...\chimera-ai\)
- 🍎 macOS (path: /Users/.../chimera-ai/)
- 🐧 Linux (path: /home/.../chimera-ai/)
```

### **❌ DILARANG - Hardcoded Absolute Paths**

```bash
❌ SALAH:
/app/backend/tools/          # Docker-only path
/home/user/chimera-ai/      # User-specific path
C:\Projects\chimera-ai\     # Windows-specific path

✅ BENAR:
./backend/tools/             # Relative path
backend/tools/               # Relative path
process.cwd() + '/backend'   # Runtime path (Node.js)
__dirname                    # Current directory (Node.js)
import.meta.url              # ES module path
```

### **Cara Menulis Path yang Portable**

**1. Python Code:**
```python
import os
from pathlib import Path

# ✅ BENAR - Relative to script
BASE_DIR = Path(__file__).parent.parent
TOOLS_DIR = BASE_DIR / "backend" / "tools"

# ✅ BENAR - From CWD
import os
TOOLS_DIR = os.path.join(os.getcwd(), "backend", "tools")

# ❌ SALAH - Hardcoded
TOOLS_DIR = "/app/backend/tools"
```

**2. TypeScript/JavaScript Code:**
```typescript
import path from 'path'
import { fileURLToPath } from 'url'

// ✅ BENAR - ES Modules
const __dirname = path.dirname(fileURLToPath(import.meta.url))
const toolsDir = path.join(__dirname, '..', 'backend', 'tools')

// ✅ BENAR - Node.js
const toolsDir = path.join(process.cwd(), 'backend', 'tools')

// ❌ SALAH - Hardcoded
const toolsDir = '/app/backend/tools'
```

**3. Bash Scripts:**
```bash
# ✅ BENAR - Script relative
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TOOLS_DIR="$SCRIPT_DIR/backend/tools"

# ❌ SALAH - Hardcoded
TOOLS_DIR="/app/backend/tools"
```

**4. Documentation:**
```markdown
✅ BENAR:
See backend/tools/ directory
Run: ./start_chimera.sh
Location: logs/launcher_*.log

❌ SALAH:
See /app/backend/tools/ directory
Run: /app/start_chimera.sh
```

### **Environment Variables (Optional)**

```bash
# .env example
PROJECT_ROOT=${PROJECT_ROOT:-$(pwd)}
BACKEND_DIR=${PROJECT_ROOT}/backend
LOGS_DIR=${PROJECT_ROOT}/logs
```

---

## 🐳 **RULE #0.5: Container & Web Preview Environment (CRITICAL)**

### **Running ChimeraAI in Container/Preview Mode**

**PENTING untuk Development di Container/Cloud:**

ChimeraAI adalah Electron desktop app, tapi untuk development di Docker/container atau cloud preview, kita perlu run dalam **Web Mode** (tanpa Electron wrapper).

### **📁 Konfigurasi Files**

**1. Vite Configs:**
```
vite.config.ts          ← Electron mode (local development)
vite.config.web.ts      ← Web mode (container/preview) ⭐
```

**2. Startup Scripts:**
```
start_web.sh            ← Quick start untuk web mode ⭐
```

### **🚀 Running App di Container**

**Quick Start:**
```bash
# Method 1: Using startup script (RECOMMENDED)
./start_web.sh

# Method 2: Manual vite
cd /app
npx vite --config vite.config.web.ts --host 0.0.0.0 --port 3000
```

**Services:**
- ✅ Frontend: Port **3000** (Vite web mode)
- ✅ Backend: Port **8001** (FastAPI via supervisor)
- ✅ MongoDB: Port **27017** (via supervisor)

### **⚙️ Vite Web Config Details**

**File**: `vite.config.web.ts`

**Key Features:**
```typescript
{
  server: {
    host: '0.0.0.0',      // Allow external connections
    port: 5173,            // Default vite port (or 3000)
    fs: {
      deny: ['**/backend/**'],  // Exclude backend dari scan
      allow: ['.', 'src', 'public', 'node_modules']
    }
  },
  optimizeDeps: {
    exclude: ['electron']  // Skip electron di web mode
  }
}
```

**Why exclude backend?**
- Backend folder punya HTML files dengan TypeScript type assertions
- Vite will error jika scan file-file ini
- Example error: `Expected ")" but found "as"` in HTML script tags

### **🔧 Environment Variables**

**File**: `.env` (root level)
```bash
VITE_API_URL=http://localhost:8001
VITE_BACKEND_URL=http://localhost:8001
```

**Usage in code:**
```typescript
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL
```

### **📝 Startup Script Structure**

**File**: `start_web.sh`

**What it does:**
1. Kill existing vite processes
2. Start Vite dengan vite.config.web.ts
3. Check frontend health
4. Check/start backend via supervisor
5. Display status & URLs

**Usage:**
```bash
chmod +x start_web.sh
./start_web.sh
```

### **🐛 Common Issues & Solutions**

**Issue 1: "vite: not found"**
```bash
# Solution: Install dependencies
cd /app && yarn install
```

**Issue 2: Vite scanning backend folder**
```bash
# Solution: Already fixed in vite.config.web.ts
# Check fs.deny includes '**/backend/**'
```

**Issue 3: Frontend not accessible**
```bash
# Check if vite running:
ps aux | grep vite

# Check logs:
tail -f /tmp/vite-web.log

# Restart:
pkill -f vite
./start_web.sh
```

**Issue 4: Backend not running**
```bash
# Check status:
sudo supervisorctl status backend

# Start if stopped:
sudo supervisorctl start backend

# Check logs:
tail -f /var/log/supervisor/backend.err.log
```

### **🎯 Development Workflow**

**Local Desktop Development:**
```bash
# Use Electron mode
yarn dev           # or npm run dev
```

**Container/Preview Development:**
```bash
# Use Web mode
./start_web.sh     # or npx vite --config vite.config.web.ts
```

### **📊 Port Reference**

| Service | Port | Config |
|---------|------|--------|
| Vite Dev Server | 3000 atau 5173 | vite.config.web.ts |
| FastAPI Backend | 8001 | backend/server.py |
| MongoDB | 27017 | supervisor |
| Electron (local) | 5173 | vite.config.ts |

### **✅ Checklist Setup Container**

Sebelum mulai development di container:
```
□ Dependencies installed (yarn install)
□ vite.config.web.ts exists
□ start_web.sh exists & executable
□ .env file configured
□ Backend running (supervisorctl status)
□ MongoDB running
□ Port 3000 accessible
```

---

## 🗂️ **RULE #1: File Organization (WAJIB)**

### 📁 Struktur Folder yang HARUS Diikuti:

```
chimera-ai/
├── README.md                    ← HANYA ini di root
├── docs/                        ← SEMUA dokumentasi
│   ├── golden-rules.md         ← File ini (aturan project)
│   ├── DEVELOPMENT.md          ← Development guide
│   ├── tools.md                ← Python tools docs
│   ├── games.md                ← Web games docs
│   ├── test_result.md          ← Test results
│   └── phase/                  ← SEMUA phase documentation
│       ├── phase_0.md          ← Phase 0 complete
│       ├── phase_1.md          ← Phase 1 (upcoming)
│       ├── phase_2.md          ← Phase 2 (upcoming)
│       └── ...
│
├── tests/                       ← SEMUA test files
│   ├── test_ipc.py             ← IPC tests
│   ├── test_tools.py           ← Python tools tests
│   ├── test_ui.py              ← UI tests
│   └── ...
│
├── electron/                    ← Main process
├── src/                        ← Renderer process
├── tools/                      ← Python tools (NO .md here!)
└── games/                      ← Web games (NO .md here!)
```

---

## 📝 **RULE #2: Documentation Files (.md)**

### ✅ ATURAN KETAT:

1. **README.md**
   - ✅ HANYA 1 file di root
   - ✅ Berisi overview project
   - ❌ JANGAN pindah atau hapus

2. **Semua .md lainnya**
   - ✅ HARUS di folder `docs/`
   - ✅ Gunakan naming yang jelas: `feature-name.md` atau `feature_name.md`
   - ❌ JANGAN taruh di root
   - ❌ JANGAN taruh di folder fitur (tools/, games/, dll)

3. **Phase Documentation**
   - ✅ HARUS di `docs/phase/phase_X.md`
   - ✅ Format: `phase_0.md`, `phase_1.md`, `phase_2.md`, dst
   - ✅ Dokumentasi setiap fase development (complete status)
   - ❌ JANGAN gunakan nama lain seperti:
     - ❌ `PHASE0_COMPLETE.md`
     - ❌ `phase-2-complete.md`
     - ❌ `Phase2Done.md`

### 📋 Contoh Dokumentasi:
```bash
✅ BENAR:
docs/DEVELOPMENT.md           # Dev guide
docs/phase/phase_0.md        # Phase 0 complete
docs/phase/phase_1.md        # Phase 1 progress
docs/tools.md                # Tools documentation
docs/games.md                # Games documentation

❌ SALAH:
DEVELOPMENT.md               # Di root ❌
tools/README.md              # Di folder fitur ❌
PHASE0_COMPLETE.md           # Nama tidak konsisten ❌
docs/phase/phase-1.md        # Gunakan underscore ❌
```

---

## 🧪 **RULE #3: Test Files dan Testing Protocol**

### ✅ ATURAN KETAT:

1. **Naming Convention**
   - ✅ HARUS format: `test_*.py`
   - ✅ Descriptive name: `test_ipc_communication.py`
   - ❌ JANGAN: `ipc_test.py`, `testing_ipc.py`

2. **Location**
   - ✅ HARUS di folder `tests/`
   - ❌ JANGAN taruh di folder lain
   - ❌ JANGAN taruh di root

3. **Structure**
   ```python
   # tests/test_feature.py
   import pytest
   
   def test_feature_name():
       """Clear description of what this tests"""
       # Test implementation
       assert result == expected
   ```

### 🚫 TESTING PROTOCOL (PENTING!)

**JANGAN auto-test di setiap percakapan!**

1. **Manual Testing First** (DEFAULT)
   - ✅ Biarkan user yang test sendiri terlebih dahulu
   - ✅ User akan report jika ada bug atau issue
   - ✅ Fokus pada implementation dan bug fixing
   - ❌ JANGAN langsung run automated tests setelah setiap perubahan

2. **Automated Testing** (ONLY WHEN REQUESTED)
   - ✅ HANYA jalankan automated tests jika user explicitly meminta
   - ✅ Contoh request valid: "tolong test dengan testing agent", "run automated tests"
   - ❌ JANGAN auto-test tanpa diminta, ini membuang waktu dan resources

3. **Backend Testing Protocol** ⚠️ **SUPER CRITICAL**
   - ✅ Untuk backend changes: User akan test manual via UI atau curl
   - ✅ Backend restart otomatis via supervisor (hot reload aktif)
   - ❌ **DILARANG KERAS**: curl test setiap endpoint tanpa konfirmasi
   - ❌ **DILARANG KERAS**: run integration tests tanpa konfirmasi
   - ❌ **DILARANG KERAS**: cek backend logs tanpa konfirmasi user
   - ❌ **DILARANG KERAS**: tail logs backend untuk verification
   - 🛑 **WAJIB**: **MINTA KONFIRMASI USER** sebelum testing backend dengan cara apapun
   - 🛑 **WAJIB**: Setelah selesai implementation, **STOP dan MINTA USER untuk test**
   - ℹ️  User lebih paham workflow mereka sendiri

4. **Bug Fixing Protocol**
   - ✅ User report bug → Fix bug → Biarkan user verify
   - ✅ Fokus pada root cause analysis dan solution
   - ❌ JANGAN auto-test setelah bug fix
   - ℹ️  User akan confirm jika fix berhasil

5. **After Implementation Protocol** ⭐ **NEW**
   - ✅ Selesai coding → **STOP IMMEDIATELY**
   - ✅ **JANGAN cek logs backend** tanpa diminta
   - ✅ **JANGAN curl test** tanpa diminta
   - ✅ **ASK USER**: "Implementasi sudah selesai, apakah Anda ingin saya bantu test backend?"
   - ✅ Tunggu user response sebelum lakukan apapun
   - ❌ JANGAN asumsi user mau test otomatis

### 📋 Contoh Test Files:
```bash
✅ BENAR:
tests/test_ipc.py              # IPC communication tests
tests/test_python_tools.py     # Python tools execution
tests/test_ai_chat.py          # AI chat functionality
tests/test_ui_components.py    # UI component tests

❌ SALAH:
test_ipc.py                    # Di root ❌
electron/test_main.py          # Di folder fitur ❌
tests/ipc_tests.py             # Format nama salah ❌
```

### 💡 Why This Rule?

- **Efficiency**: User testing lebih cepat untuk simple changes
- **Context**: User tahu better apa yang perlu di-test
- **Resources**: Automated tests consume CPU/memory
- **Workflow**: User punya workflow testing sendiri yang lebih efficient

---

## 🏗️ **RULE #4: Adding New Features**

### Workflow WAJIB:

1. **Planning** → Buat `docs/phase/phase_X.md`
2. **Implementation** → Code di folder yang sesuai
3. **Testing** → Buat `tests/test_feature.py`
4. **Documentation** → Update `docs/DEVELOPMENT.md`

### Checklist Setiap Feature Baru:
```
□ Dokumentasi di docs/
□ Test file di tests/
□ Update DEVELOPMENT.md
□ Update phase documentation
□ Code review passed
```

---

## 🔧 **RULE #5: Python Tools**

### Structure:
```
tools/
├── tool-name/
│   ├── main.py              ← Entry point
│   ├── requirements.txt     ← Dependencies
│   ├── config.json          ← Configuration
│   └── build/              ← PyInstaller output
```

### Rules:
- ✅ Each tool in separate folder
- ✅ Documentation in `docs/tools.md`
- ✅ Tests in `tests/test_tool_name.py`
- ❌ NO README.md inside tool folder

---

## 🎮 **RULE #6: Web Games**

### Structure:
```
games/
├── game-name/
│   ├── index.html           ← Entry point
│   ├── game.js              ← Game logic
│   ├── style.css            ← Styles
│   └── assets/             ← Images, sounds
```

### Rules:
- ✅ Each game in separate folder
- ✅ Documentation in `docs/games.md`
- ❌ NO README.md inside game folder

---

## 📊 **RULE #7: Phase Development**

### Phase Documentation Template:

**File**: `docs/phase/phase_X.md`

```markdown
# Phase X: [Phase Name]

## Status: [In Progress / Complete / Planned]

## Goals
- [ ] Goal 1
- [ ] Goal 2

## Implementation
- Feature 1 implementation details
- Feature 2 implementation details

## Testing
- Test coverage: X%
- Test files:
  - tests/test_feature1.py
  - tests/test_feature2.py

## Documentation
- Updated files:
  - docs/DEVELOPMENT.md
  - docs/feature.md

## Next Steps
- [ ] Next item 1
- [ ] Next item 2
```

### Phase Numbering:
- ✅ `phase_0.md` - Foundation
- ✅ `phase_1.md` - UI Enhancement
- ✅ `phase_2.md` - Python Tools
- ✅ `phase_3.md` - AI Chat
- etc.

---

## 🚫 **RULE #8: DILARANG KERAS**

### ❌ JANGAN PERNAH:

1. **File Organization**
   - ❌ Taruh .md di root (kecuali README.md)
   - ❌ Taruh test_*.py di luar folder tests/
   - ❌ Buat dokumentasi di folder fitur

2. **Naming**
   - ❌ Gunakan spasi di nama file
   - ❌ Gunakan CamelCase untuk .md files
   - ❌ Format phase selain `phase_X.md`

3. **Code**
   - ❌ Hardcode URLs atau API keys
   - ❌ Commit sensitive data
   - ❌ Skip testing untuk feature baru
   - ❌ **Hardcode absolute paths** (use relative paths!)

4. **Paths (CRITICAL)**
   - ❌ **Hardcode /app/ paths** (Docker-only, not portable!)
   - ❌ **Hardcode user-specific paths** (/home/user/, C:\Users\...)
   - ❌ **OS-specific path separators** (use path.join() atau pathlib)
   - ✅ **Use relative paths** (./backend/, ../tools/)
   - ✅ **Use runtime paths** (__dirname, process.cwd(), Path(__file__))

5. **Documentation**
   - ❌ Dokumentasi tidak sinkron dengan kode
   - ❌ Missing docstrings di functions
   - ❌ Incomplete phase documentation
   - ❌ **Hardcode paths in examples** (use relative paths in docs!)

---

## ✅ **RULE #9: Before Every Commit**

### Checklist WAJIB:

```bash
□ All .md files in docs/ (except README.md)
□ All test_*.py files in tests/
□ Phase docs in docs/phase/phase_X.md
□ No hardcoded secrets
□ No hardcoded absolute paths (/app/, /home/, C:\, etc)
□ Paths are portable (relative or runtime-based)
□ Tests passing
□ Documentation updated
□ golden-rules.md followed
```

### Verification Commands:
```bash
# Check documentation
find . -name "*.md" -not -path "./node_modules/*" -not -path "./docs/*" -not -name "README.md"
# Should return NOTHING (empty)

# Check tests
find . -name "test_*.py" -not -path "./tests/*" -not -path "./node_modules/*"
# Should return NOTHING (empty)

# Check phase docs
ls docs/phase/
# Should list: phase_0.md, phase_1.md, phase_2.md, etc.

# Check for hardcoded paths (Python)
grep -r "/app/" --include="*.py" backend/ src/ electron/ 2>/dev/null || echo "✅ No /app/ hardcoded paths"

# Check for hardcoded paths (JavaScript/TypeScript)
grep -r '"/app/' --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" src/ electron/ 2>/dev/null || echo "✅ No /app/ hardcoded paths"

# Check for hardcoded paths in docs
grep -r "/app/" --include="*.md" docs/ 2>/dev/null | grep -v "Example:" || echo "✅ No /app/ in docs"
```

---

## 🎯 **RULE #10: Quick Reference**

### Project Type: Electron Desktop Application

```
ChimeraAI Architecture:
┌─────────────────────────────────────────┐
│  Electron Desktop App (Cross-platform)  │
├─────────────────────────────────────────┤
│ Main Process (Node.js)                  │
│  - electron/main.ts                     │
│  - IPC handlers                         │
│  - Window management                    │
├─────────────────────────────────────────┤
│ Renderer Process (Browser)              │
│  - React + TypeScript                   │
│  - src/ directory                       │
│  - UI Components                        │
├─────────────────────────────────────────┤
│ Backend API (Optional)                  │
│  - FastAPI (Python)                     │
│  - backend/server.py                    │
│  - SQLite database                      │
└─────────────────────────────────────────┘
```

### File Location Quick Guide:

| File Type | Location | Example | Path Type |
|-----------|----------|---------|-----------|
| Project overview | `/README.md` | README.md | Root only |
| Documentation | `/docs/` | docs/DEVELOPMENT.md | Relative |
| Phase docs | `/docs/phase/` | docs/phase/phase_0.md | Relative |
| Python tests | `/tests/` | tests/test_ipc.py | Relative |
| Backend API | `/backend/` | backend/server.py | Relative |
| React components | `/src/components/` | src/components/Header.tsx | Relative |
| Electron main | `/electron/` | electron/main.ts | Relative |
| Python tools (future) | `/backend/tools/` | backend/tools/formatter/ | Relative |
| Web games (future) | `/games/` | games/tetris/index.html | Relative |

---

## 💡 **Why These Rules?**

1. **Consistency** - Semua developer tahu dimana menemukan sesuatu
2. **Maintainability** - Project mudah di-maintain dan di-scale
3. **Professionalism** - Project terlihat professional dan organized
4. **Collaboration** - Tim bisa kolaborasi tanpa konflik
5. **Automation** - CI/CD bisa otomatis karena struktur konsisten
6. **Portability** - Code bisa running di Docker, Windows, macOS, Linux tanpa modifikasi
7. **Universal Development** - Developer bisa work di environment apapun
8. **Electron Best Practices** - Follow standard Electron app architecture

---

## 🆘 **Need Help?**

- 📖 Read: `docs/DEVELOPMENT.md` untuk development guide
- 🔍 Check: `docs/phase/phase_X.md` untuk phase-specific info
- 🧪 See: `tests/` untuk testing examples
- 📝 Update: File ini jika ada aturan baru

---

## 🔄 **Version History**

- **v1.0** (Phase 0) - Initial golden rules established
  - File organization rules
  - Testing conventions
  - Documentation structure
  - Phase management

- **v2.0** (Phase 2) - Universal & Portable Development
  - ✅ **RULE #0 added**: Project context (Electron app)
  - ✅ **Path portability rules**: No hardcoded absolute paths
  - ✅ Environment-agnostic development (Docker/Local/Multi-OS)
  - ✅ Updated phase docs naming (phase_2.md format)
  - ✅ Moved PHASE2_COMPLETE.md → docs/phase/phase_2.md
  - ✅ Moved LAUNCHER_QUICKSTART.md → docs/quick-start.md
  - ✅ Added path verification commands

- **v2.1** (Chat UI Enhancement) - Container & Web Preview Setup
  - ✅ **RULE #0.5 added**: Container & web preview environment
  - ✅ **Vite web config**: vite.config.web.ts untuk container mode
  - ✅ **Startup script**: start_web.sh untuk quick start
  - ✅ **Port configuration**: Frontend 3000, Backend 8001
  - ✅ **Environment variables**: .env setup untuk web mode
  - ✅ **Troubleshooting guide**: Common issues & solutions
  - ✅ **Development workflow**: Local vs Container development
  - ✅ Enhanced upload preview dengan bingkai khusus
  - ✅ Fixed welcome screen hiding behavior

---

**⚠️ PENTING: Aturan ini WAJIB diikuti oleh SEMUA developer tanpa exception!**

**✅ Jika ragu, tanya dulu sebelum commit!**

---

**Last Updated**: Chat UI Enhancement (Upload Preview & Container Setup)  
**Maintained By**: ChimeraAI Team  
**Status**: ✅ Active & Enforced
