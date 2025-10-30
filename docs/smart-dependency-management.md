# Smart Dependency Management System

## Overview

ChimeraAI menggunakan sistem dependency management yang cerdas untuk memisahkan Python (backend) dan Node.js (frontend) dependencies, serta memastikan kompatibilitas dengan Python 3.11+.

## Structure

### Requirements Files

#### 1. `requirements-base.txt`
**Purpose:** Core dependencies untuk FastAPI backend
**Includes:**
- FastAPI & Web Framework (uvicorn, starlette)
- HTTP Clients (requests, httpx)
- Data Validation (pydantic)
- Database (pymongo, motor)
- Security & Authentication
- Data Processing libraries
- Development tools (pytest, black, flake8)

#### 2. `requirements-chat.txt`
**Purpose:** AI Chat dependencies (heavyweight packages)
**Includes:**
- 🔒 **torch==2.7.1** (LOCKED VERSION - DO NOT CHANGE!)
  - Tested and stable untuk Python 3.11
  - ARM64 (aarch64) compatible
  - Breaking changes di versi lain!
- ChromaDB untuk vector database
- sentence-transformers untuk embeddings
- transformers & tokenizers
- ONNX Runtime
- ML libraries (scikit-learn, scipy)
- Cloud & monitoring tools

#### 3. `requirements-tools.txt`
**Purpose:** Dynamic tool dependencies
**Auto-updated:** Ketika tools baru dengan dependencies diupload
**Initially empty:** Akan diisi otomatis oleh system

## Smart Installer

### File: `install_deps_smart.py`

**Features:**
1. ✅ **Python 3.11+ Compatibility Check** - Memastikan Python version compatible
2. ✅ **Smart Installation** - Hanya install package yang missing atau outdated
3. ✅ **No Force Downgrade** - Tidak downgrade package yang sudah installed dengan version lebih tinggi
4. ✅ **Version Comparison** - Compare versions dan skip jika sudah installed
5. ✅ **Two-Pass Installation** - First pass: install packages tanpa deps, Second pass: install dependencies
6. ✅ **Detailed Logging** - Clear output dengan color-coded messages

**Usage:**
```bash
cd /app/backend
python3 install_deps_smart.py
```

**Output Example:**
```
============================================================
🐍 ChimeraAI Smart Dependency Installer
============================================================

✅ Python 3.11.14 - Compatible ✓

ℹ️  Scanning installed packages...
ℹ️  Found 70 installed packages

📦 Processing: requirements-base.txt
------------------------------------------------------------
⚠️  urllib3: current=2.5.0, required=2.3.0 (keeping current, no downgrade)
ℹ️  Installing 26 packages from requirements-base.txt...
✅ Installed 26 packages from requirements-base.txt
ℹ️  Installed: 26 packages
ℹ️  Skipped (already installed): 48 packages
```

## Database Schema Changes

### Tools Table - New Columns

```sql
CREATE TABLE tools (
    ...
    dependencies TEXT,              -- Legacy field (backward compatibility)
    python_dependencies TEXT,       -- 🆕 Python backend deps (JSON array)
    node_dependencies TEXT,         -- 🆕 Node.js frontend deps (JSON array)
    ...
)
```

**Migration:** Automatic migration runs on backend startup untuk add columns jika belum ada.

## Backend API Changes

### 1. Tool Upload Endpoints

**Changed:**
- `/api/tools/upload` (dual file upload)
- `/api/tools/upload-zip` (ZIP upload)

**New behavior:**
```python
# Separate Python and Node.js dependencies
python_deps = backend_validation.get("dependencies", [])
node_deps = frontend_validation.get("dependencies", [])

# Store separately in database
tool_doc = {
    "dependencies": combined_deps,           # Legacy
    "python_dependencies": python_deps,      # Backend only
    "node_dependencies": node_deps          # Frontend only
}
```

### 2. Dependencies Endpoint

**Endpoint:** `GET /api/tools/{tool_id}/dependencies`

**Changed behavior:**
```python
# Get Python dependencies (backend only!)
python_deps = tool.get("python_dependencies", [])

# Backward compatibility: filter out frontend packages
if not python_deps and tool.get("dependencies"):
    frontend_packages = {'react', 'lucide-react', 'framer-motion', 'axios', 'react-dom'}
    old_deps = tool.get("dependencies", [])
    python_deps = [dep for dep in old_deps if dep not in frontend_packages]
```

### 3. Install Python Deps Endpoint

**Endpoint:** `POST /api/tools/{tool_id}/install-python-deps`

**Changed behavior:**
```python
# Use python_dependencies field, not dependencies field
python_deps = tool.get("python_dependencies", [])

# Backward compatibility for old tools
if not python_deps and tool.get("dependencies"):
    python_deps = filter_frontend_packages(tool.get("dependencies"))
```

## Start Script Changes

### File: `start_chimera.sh`

**Updated functions:**

#### 1. `check_python()`
```bash
# Now checks for Python 3.11+
if [ "$PYTHON_MAJOR" -eq 3 ] && [ "$PYTHON_MINOR" -ge 11 ]; then
    log_success "Python $PYTHON_VERSION found (compatible ✓)"
else
    log_error "Python $PYTHON_VERSION found, but ChimeraAI requires Python 3.11+"
    exit 1
fi
```

#### 2. `install_backend_deps()`
```bash
# Use smart installer if available
if [ -f "install_deps_smart.py" ]; then
    log_info "Using smart dependency installer (Python 3.11+ compatible)"
    python3 install_deps_smart.py
else
    # Fallback to legacy method
    python3 -m pip install -r requirements.txt
fi
```

## Backward Compatibility

### For Existing Tools

**Scenario:** Tools uploaded before this update have `dependencies` field with mixed Python + Node deps

**Solution:** Automatic filtering in backend API:
```python
# Filter out common frontend packages
frontend_packages = {'react', 'lucide-react', 'framer-motion', 'axios', 'react-dom'}
python_deps = [dep for dep in old_deps if dep not in frontend_packages]
```

**Migration:** No manual migration needed! System handles it automatically.

### For New Tools

**Scenario:** Tools uploaded after this update

**Behavior:**
- `python_dependencies` → populated from backend validator
- `node_dependencies` → populated from frontend validator
- `dependencies` → combined (legacy, for backward compatibility)

## Locked Versions

### Critical Packages

#### torch==2.7.1
**Why locked?**
- ✅ Tested & stable untuk Python 3.11
- ✅ ARM64 (aarch64) compatible
- ✅ No breaking changes
- ❌ Other versions may have breaking API changes
- ❌ Different ARM64 compatibility

**Rules:**
- ❌ NEVER upgrade: `pip install torch --upgrade`
- ❌ NEVER downgrade: `pip install torch==2.5.0`
- ✅ ALWAYS specify: `pip install torch==2.7.1`

**Verification:**
```bash
python3 -m pip show torch | grep Version
# Should output: Version: 2.7.1
```

## Testing

### 1. Test Smart Installer
```bash
cd /app/backend
python3 install_deps_smart.py
```

Expected output:
- Python version check ✓
- Scan installed packages
- Install missing packages only
- Skip already installed packages
- No downgrade warnings

### 2. Test Tool Settings UI
1. Upload a tool with frontend dependencies (react, lucide-react)
2. Open tool settings modal
3. Check "Python Dependencies" section → Should NOT show react/lucide-react
4. Check "Node.js Dependencies" section → Should show react/lucide-react

### 3. Test Backend API
```bash
# Get tool dependencies
curl http://localhost:8001/api/tools/{tool_id}/dependencies | jq

# Expected response:
{
  "dependencies": {
    "python": {
      "dependencies": ["requests", "beautifulsoup4"],  # No react!
      "missing": [],
      "installed": ["requests", "beautifulsoup4"]
    },
    "node": {
      "dependencies": ["react", "lucide-react"],
      "missing": [],
      "installed": ["react", "lucide-react"]
    }
  }
}
```

## Benefits

1. ✅ **Clear Separation** - Python dan Node.js dependencies terpisah
2. ✅ **No More Confusion** - React tidak muncul sebagai Python dependency
3. ✅ **Smart Installation** - Skip packages yang sudah installed
4. ✅ **No Force Downgrade** - Protect package versions
5. ✅ **Python 3.11+ Compatible** - Version check built-in
6. ✅ **Backward Compatible** - Old tools still work
7. ✅ **Future Proof** - Easy to add more requirement files

## Common Issues & Solutions

### Issue 1: "Python 3.11 required" Error

**Cause:** Python version < 3.11

**Solution:**
```bash
# Check Python version
python3 --version

# If < 3.11, upgrade Python
# On Ubuntu/Debian:
sudo apt-get install python3.11

# On macOS:
brew install python@3.11
```

### Issue 2: torch Version Wrong

**Cause:** torch was upgraded/downgraded

**Solution:**
```bash
# Uninstall current torch
pip uninstall torch -y

# Install correct version
pip install torch==2.7.1

# Verify
pip show torch | grep Version
```

### Issue 3: Frontend Dependencies in Python Section

**Cause:** Old tool with mixed dependencies

**Solution:** Backend automatically filters it! No action needed.

If still showing:
```bash
# Restart backend to reload database schema
sudo supervisorctl restart backend
```

## Maintenance

### Adding New Base Dependencies

Edit `requirements-base.txt`:
```bash
# Add new package
echo "new-package==1.0.0" >> /app/backend/requirements-base.txt

# Install
cd /app/backend
python3 install_deps_smart.py
```

### Adding New Chat Dependencies

Edit `requirements-chat.txt`:
```bash
# Add new AI/ML package
echo "new-ml-library==2.0.0" >> /app/backend/requirements-chat.txt

# Install
cd /app/backend
python3 install_deps_smart.py
```

### Tool Dependencies (Auto-managed)

**No manual editing needed!** System automatically updates `requirements-tools.txt` when:
- New tool with Python dependencies is uploaded
- Dependencies are installed via tool settings

## Future Improvements

1. [ ] Auto-detect and resolve dependency conflicts
2. [ ] Suggest package upgrades when safe
3. [ ] Virtual environment per tool (isolation)
4. [ ] Dependency caching for faster installs
5. [ ] Health check untuk detect missing deps at startup

---

**Version:** 1.0.0  
**Last Updated:** 2025  
**Maintained By:** ChimeraAI Team
