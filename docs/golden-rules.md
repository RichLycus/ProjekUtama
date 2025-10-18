# 🏅 Golden Rules - ChimeraAI Project

## 📜 Aturan Wajib untuk Semua Developer

Sebelum melakukan **APAPUN** di project ini, baca dan ikuti aturan berikut dengan ketat!

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
   - ✅ Gunakan naming yang jelas: `feature-name.md`
   - ❌ JANGAN taruh di root
   - ❌ JANGAN taruh di folder fitur (tools/, games/, dll)

3. **Phase Documentation**
   - ✅ HARUS di `docs/phase/phase_X.md`
   - ✅ Format: `phase_0.md`, `phase_1.md`, dst
   - ✅ Dokumentasi setiap fase development
   - ❌ JANGAN gunakan nama lain (PHASE0_COMPLETE.md ❌)

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

## 🧪 **RULE #3: Test Files (test_*.py)**

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

4. **Documentation**
   - ❌ Dokumentasi tidak sinkron dengan kode
   - ❌ Missing docstrings di functions
   - ❌ Incomplete phase documentation

---

## ✅ **RULE #9: Before Every Commit**

### Checklist WAJIB:

```bash
□ All .md files in docs/ (except README.md)
□ All test_*.py files in tests/
□ Phase docs in docs/phase/phase_X.md
□ No hardcoded secrets
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
# Should list: phase_0.md, phase_1.md, etc.
```

---

## 🎯 **RULE #10: Quick Reference**

### File Location Quick Guide:

| File Type | Location | Example |
|-----------|----------|---------|
| Project overview | `/README.md` | README.md |
| Documentation | `/docs/` | docs/DEVELOPMENT.md |
| Phase docs | `/docs/phase/` | docs/phase/phase_0.md |
| Python tests | `/tests/` | tests/test_ipc.py |
| Python tools | `/tools/[name]/` | tools/image-converter/main.py |
| Web games | `/games/[name]/` | games/tetris/index.html |
| React components | `/src/components/` | src/components/Header.tsx |
| Electron main | `/electron/` | electron/main.ts |

---

## 💡 **Why These Rules?**

1. **Consistency** - Semua developer tahu dimana menemukan sesuatu
2. **Maintainability** - Project mudah di-maintain dan di-scale
3. **Professionalism** - Project terlihat professional dan organized
4. **Collaboration** - Tim bisa kolaborasi tanpa konflik
5. **Automation** - CI/CD bisa otomatis karena struktur konsisten

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

---

**⚠️ PENTING: Aturan ini WAJIB diikuti oleh SEMUA developer tanpa exception!**

**✅ Jika ragu, tanya dulu sebelum commit!**

---

**Last Updated**: Phase 0 Complete  
**Maintained By**: ChimeraAI Team  
**Status**: ✅ Active & Enforced
