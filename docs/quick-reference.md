# 🚀 Quick Reference Card

**ChimeraAI Project - Developer Cheat Sheet**

---

## 📂 File Placement Rules (MUST FOLLOW!)

| File Type | Location | Example |
|-----------|----------|---------|
| Project README | `/README.md` | README.md |
| All documentation | `/docs/` | docs/DEVELOPMENT.md |
| Phase docs | `/docs/phase/` | docs/phase/phase_0.md |
| Test files | `/tests/` | tests/test_ipc.py |
| Test docs | `/tests/` | tests/README.md |

---

## 🎯 Quick Commands

### Development
```bash
./launcher_app.sh # 🚀 RECOMMENDED: Auto-check & start
yarn dev          # Manual: Run Electron + Vite
yarn vite         # Web preview only
yarn build        # Production build
```

### Verification & Release
```bash
python3 verify_setup.py              # Check before commit
python3 verify_setup.py --check-size # Check file sizes
python3 build_release.py             # Build releases
./pre-commit-check.sh                # Pre-commit helper
```

### Testing
```bash
pytest tests/                    # Run all tests
pytest tests/test_feature.py    # Run specific test
pytest --cov=src tests/         # With coverage
```

### Verification
```bash
# Check no misplaced .md files
find . -name "*.md" -not -path "./node_modules/*" -not -path "./docs/*" -not -name "README.md" -not -path "./tests/*"
# Should return nothing!

# Check no misplaced test files
find . -name "test_*.py" -not -path "./tests/*" -not -path "./node_modules/*"
# Should return nothing!
```

---

## 📋 Adding New Feature Checklist

```
□ Read docs/golden-rules.md
□ Plan feature in docs/phase/phase_X.md
□ Implement code in appropriate folder
□ Create tests/test_feature.py
□ Update docs/DEVELOPMENT.md
□ Run all tests (must pass)
□ Commit with clear message
```

---

## 🔍 Where to Find Things

| Need | Location |
|------|----------|
| **Project rules** | `docs/golden-rules.md` |
| **Setup guide** | `docs/DEVELOPMENT.md` |
| **All docs index** | `docs/index.md` |
| **Current phase** | `docs/phase/phase_0.md` |
| **Testing guide** | `tests/README.md` |
| **Tools docs** | `docs/tools.md` |
| **Games docs** | `docs/games.md` |

---

## ⚡ Common Tasks

### Add New Page
```bash
# 1. Create page component
touch src/pages/NewPage.tsx

# 2. Add route in src/App.tsx
<Route path="/newpage" element={<NewPage />} />
```

### Add New Test
```bash
# 1. Create test file (MUST be in tests/)
touch tests/test_new_feature.py

# 2. Write test
# See tests/README.md for template

# 3. Run test
pytest tests/test_new_feature.py
```

### Add New Documentation
```bash
# 1. Create .md file (MUST be in docs/)
touch docs/new-feature.md

# 2. Add to docs/index.md
```

### Start New Phase
```bash
# 1. Create phase doc
touch docs/phase/phase_X.md

# 2. Use template from docs/golden-rules.md
```

---

## 🚨 Common Mistakes (AVOID!)

### ❌ WRONG:
```bash
# Documentation in wrong place
touch DEVELOPMENT.md              ❌
touch tools/README.md             ❌
touch PHASE1_COMPLETE.md          ❌

# Tests in wrong place  
touch test_feature.py             ❌
touch src/test_component.py       ❌

# Wrong naming
touch docs/phase/phase-1.md       ❌
touch tests/feature_test.py       ❌
```

### ✅ CORRECT:
```bash
# Documentation
touch docs/DEVELOPMENT.md         ✅
touch docs/tools.md              ✅
touch docs/phase/phase_1.md      ✅

# Tests
touch tests/test_feature.py      ✅
touch tests/test_component.py    ✅
```

---

## 🎨 Design Tokens Quick Ref

```css
/* Colors */
--background: #1e1e1e
--surface: #2d2d30
--primary: #007acc
--secondary: #0098ff
--accent: #00d4ff

/* Utility Classes */
.glass           /* Glassmorphism 40% */
.glass-strong    /* Glassmorphism 60% */
.card           /* Elevated card */
.btn-primary    /* Primary button */
.input          /* Form input */
```

---

## 🔗 Important Links

- **Golden Rules**: `docs/golden-rules.md` ← START HERE!
- **Dev Guide**: `docs/DEVELOPMENT.md`
- **Docs Index**: `docs/index.md`
- **Phase Status**: `docs/phase/phase_0.md`

---

## 💡 Pro Tips

1. **Before coding**: Read `docs/golden-rules.md`
2. **Need help?**: Check `docs/index.md`
3. **Adding feature?**: Update phase doc
4. **Before commit**: Run verification commands
5. **Stuck?**: Ask team, don't guess!

---

## 📊 Project Status

- ✅ **Phase 0**: Foundation Complete
- 🔜 **Phase 1**: UI Enhancement (Next)
- 📋 **Phase 2**: Python Tools (Planned)
- 📋 **Phase 3**: AI Chat (Planned)

---

**🎯 Remember**: Follow golden-rules.md or your PR will be rejected!

**📖 Full docs**: `docs/index.md`

---

*Keep this card handy! Print it, bookmark it, memorize it!* 🚀
