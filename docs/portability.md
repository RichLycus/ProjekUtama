# 🌐 Portability Guide - ChimeraAI

## Overview

ChimeraAI adalah **Electron Desktop Application** yang dirancang untuk berjalan di berbagai environment:
- 🐳 Docker containers
- 💻 Local development (Windows, macOS, Linux)
- ☁️ Cloud environments
- 🚀 Production builds

Document ini menjelaskan best practices untuk memastikan code tetap portable dan universal.

---

## ❌ Common Mistakes

### 1. Hardcoded Absolute Paths

```python
# ❌ SALAH - Docker only
TOOLS_DIR = "/app/backend/tools"

# ❌ SALAH - User specific
TOOLS_DIR = "/home/user/chimera-ai/backend/tools"

# ❌ SALAH - Windows specific
TOOLS_DIR = "C:\\Users\\user\\chimera-ai\\backend\\tools"
```

### 2. OS-Specific Path Separators

```python
# ❌ SALAH - Unix only
path = "backend/tools/devtools"  # Breaks on Windows

# ❌ SALAH - Windows only
path = "backend\\tools\\devtools"  # Breaks on Unix
```

### 3. Hardcoded Environment Assumptions

```python
# ❌ SALAH - Assumes specific directory name
BASE_DIR = "/app"

# ❌ SALAH - Assumes Docker
if os.path.exists("/app"):
    # Docker-specific code
```

---

## ✅ Best Practices

### 1. Python: Use pathlib.Path

```python
from pathlib import Path

# ✅ BENAR - Relative to current file
BASE_DIR = Path(__file__).parent
BACKEND_DIR = BASE_DIR.parent
TOOLS_DIR = BACKEND_DIR / "backend" / "tools"

# ✅ BENAR - From current working directory
import os
TOOLS_DIR = Path(os.getcwd()) / "backend" / "tools"

# ✅ BENAR - Ensure directory exists
TOOLS_DIR.mkdir(parents=True, exist_ok=True)

# ✅ BENAR - Convert to string when needed
db_path = str(DATA_DIR / "database.db")
```

### 2. TypeScript/JavaScript: Use path module

```typescript
import path from 'path'
import { fileURLToPath } from 'url'

// ✅ BENAR - ES Modules
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const toolsDir = path.join(__dirname, '..', 'backend', 'tools')

// ✅ BENAR - Node.js CommonJS
const toolsDir = path.join(process.cwd(), 'backend', 'tools')

// ✅ BENAR - Electron main process
import { app } from 'electron'
const userDataPath = app.getPath('userData')
```

### 3. Bash Scripts: Use Script-Relative Paths

```bash
#!/bin/bash

# ✅ BENAR - Get script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# ✅ BENAR - Relative to script
BACKEND_DIR="$SCRIPT_DIR/backend"
TOOLS_DIR="$SCRIPT_DIR/backend/tools"

# ✅ BENAR - Check if directory exists
if [ ! -d "$TOOLS_DIR" ]; then
    mkdir -p "$TOOLS_DIR"
fi
```

### 4. Configuration Files

```json
// .env or config.json
{
  "toolsDir": "./backend/tools",
  "dataDir": "./backend/data",
  "logsDir": "./logs"
}
```

```python
# Load with relative path resolution
import os
from pathlib import Path

config = load_config("config.json")
BASE_DIR = Path(os.getcwd())
TOOLS_DIR = BASE_DIR / config["toolsDir"]
```

---

## 🏗️ ChimeraAI Path Structure

### Current Structure (Portable)

```python
# backend/server.py
from pathlib import Path

# ✅ Get backend directory dynamically
BACKEND_DIR = Path(__file__).parent
DATA_DIR = BACKEND_DIR / "data"
TOOLS_DIR = BACKEND_DIR / "tools"

# Ensure directories exist
DATA_DIR.mkdir(exist_ok=True)
TOOLS_DIR.mkdir(exist_ok=True)
```

### Database Connection (Portable)

```python
# backend/database.py
from pathlib import Path

class SQLiteDB:
    def __init__(self, db_path: Optional[str] = None):
        if db_path is None:
            # ✅ Default to relative path
            backend_dir = Path(__file__).parent
            data_dir = backend_dir / "data"
            data_dir.mkdir(exist_ok=True)
            db_path = str(data_dir / "chimera_tools.db")
        
        self.db_path = db_path
```

---

## 📝 Documentation Best Practices

### In Documentation Files (.md)

```markdown
❌ SALAH:
- See tools at `/app/backend/tools/`
- Run: `cd /app && ./start_chimera.sh`
- Logs location: `/app/logs/`

✅ BENAR:
- See tools at `backend/tools/`
- Run: `./start_chimera.sh` (from project root)
- Logs location: `logs/` (project root)
```

### In Code Comments

```python
# ❌ SALAH
# Tools are located at /app/backend/tools/

# ✅ BENAR
# Tools are located at backend/tools/ (relative to project root)
```

---

## 🧪 Testing Portability

### Manual Testing

Test your code works in different environments:

```bash
# Test 1: Docker (if available)
docker run -it --rm -v $(pwd):/app python:3.11 \
  bash -c "cd /app && python backend/server.py"

# Test 2: Different directory
mkdir -p ~/test-chimera && cp -r . ~/test-chimera/
cd ~/test-chimera && ./start_chimera.sh

# Test 3: Windows (if WSL)
cd /mnt/c/Users/YourName/chimera-ai && ./start_chimera.sh
```

### Automated Checks

```bash
# Check for hardcoded /app/ paths
grep -r '"/app/' --include="*.py" backend/ src/ electron/ || echo "✅ OK"
grep -r "'\/app\/" --include="*.py" backend/ src/ electron/ || echo "✅ OK"

# Check for hardcoded Windows paths
grep -r 'C:\\' --include="*.py" --include="*.ts" . || echo "✅ OK"

# Check for hardcoded Unix user paths
grep -r '"/home/' --include="*.py" backend/ src/ electron/ || echo "✅ OK"
```

---

## 🔧 Migration Checklist

When refactoring existing code:

```
□ Replace all absolute paths with relative paths
□ Use Path(__file__).parent for file-relative paths
□ Use path.join() or Path() / operator for path construction
□ Test in multiple environments (Docker, local, different OS)
□ Update documentation to use relative paths
□ Add path verification to pre-commit checks
□ Ensure all mkdir commands use exist_ok=True or equivalent
```

---

## 📚 Reference Examples

### Example: Tool Upload Handler

```python
# ✅ PORTABLE VERSION
from pathlib import Path

# Get backend directory
BACKEND_DIR = Path(__file__).parent
TOOLS_DIR = BACKEND_DIR / "tools"

async def upload_tool(category: str, tool_id: str, content: str):
    # Create category folder
    category_folder = TOOLS_DIR / category.lower()
    category_folder.mkdir(parents=True, exist_ok=True)
    
    # Save tool file
    tool_path = category_folder / f"{tool_id}.py"
    tool_path.write_text(content)
    
    return str(tool_path)
```

### Example: Database Path

```python
# ✅ PORTABLE VERSION
from pathlib import Path
from typing import Optional

def get_db_path(custom_path: Optional[str] = None) -> str:
    if custom_path:
        return custom_path
    
    # Default: backend/data/chimera_tools.db
    backend_dir = Path(__file__).parent
    data_dir = backend_dir / "data"
    data_dir.mkdir(exist_ok=True)
    
    return str(data_dir / "chimera_tools.db")
```

### Example: Logs Directory

```python
# ✅ PORTABLE VERSION
from pathlib import Path

def get_logs_dir() -> Path:
    # Project root is one level up from backend/
    project_root = Path(__file__).parent.parent
    logs_dir = project_root / "logs"
    logs_dir.mkdir(exist_ok=True)
    return logs_dir
```

---

## 🎯 Quick Tips

1. **Always use Path objects** in Python for path manipulation
2. **Always use path.join()** in JavaScript/TypeScript
3. **Never hardcode drive letters** (C:\, D:\, etc.)
4. **Never hardcode user directories** (/home/user, /Users/name)
5. **Never hardcode container paths** (/app, /workspace, etc.)
6. **Always create directories with exist_ok=True**
7. **Test on multiple OS** before committing
8. **Use relative paths in documentation**

---

## ✅ Benefits

**Why Portability Matters:**

1. **Developer Experience** - Any developer can clone and run immediately
2. **CI/CD** - Tests work in any environment
3. **Production** - Deploy anywhere without modifications
4. **Cross-Platform** - Windows, macOS, Linux support
5. **Docker** - Container-friendly code
6. **Collaboration** - No environment-specific bugs
7. **Maintenance** - Less code to update when paths change

---

## 📖 See Also

- [Golden Rules](golden-rules.md) - RULE #0: Path Portability
- [Development Guide](DEVELOPMENT.md) - Setup for different environments
- [Quick Start](quick-start.md) - Getting started guide

---

**Last Updated**: Phase 2 Complete  
**Status**: ✅ All ChimeraAI code is now portable
