# Quick Start - Phase 2 Backend

## 🚀 Start Development Environment

### Option 1: Full Stack (Backend + Frontend)

```bash
cd .
./start_chimera.sh
```

Ini akan:
✅ Check Python, Node, Yarn
✅ Install dependencies (backend & frontend)
✅ Start backend API (port 8001)
✅ Start Electron + Vite (port 5173)

---

### Option 2: Backend Only

```bash
cd ./backend
python3 server.py
```

Backend akan running di: `http://localhost:8001`

---

## ⚡ Quick Test

```bash
# Test backend
curl http://localhost:8001/

# Get categories
curl http://localhost:8001/api/tools/categories

# Upload test tool
curl -X POST "http://localhost:8001/api/tools/upload" \
  -F "file=@backend/tools/devtools/example_json_formatter.py" \
  -F "name=JSON Formatter" \
  -F "description=Format JSON" \
  -F "category=DevTools"
```

---

## 📚 Documentation

**Phase 2 Docs:**
- [Backend API Documentation](docs/phase/phase_2_backend.md)
- [Testing Guide](docs/BACKEND_TESTING_GUIDE.md)
- [Roadmap](docs/phase/phase_2_roadmap.md)

**Tool Development:**
- Tool format standard: See `backend/tools/devtools/example_json_formatter.py`
- Example tools in `backend/tools/`

---

## 🎯 What's Working Now

✅ **Backend API** (100% Complete)
- 10+ REST endpoints
- Tool upload & validation
- Safe tool execution
- Dependency management
- Category-based organization
- Logging system

✅ **Electron IPC** (80% Complete)
- IPC handlers configured
- Backend communication ready

🚧 **Frontend** (0% Complete)
- Settings page - Tools Manager (TODO)
- Tools page - Execution interface (TODO)

---

## 🔥 Example Usage

### Upload Your Own Tool

Create `my_tool.py`:
```python
# CATEGORY: Utilities
# NAME: My Tool
# DESCRIPTION: Does something cool
# VERSION: 1.0.0
# AUTHOR: Your Name

def run(params):
    text = params.get('text', '')
    return {
        \"status\": \"success\",
        \"result\": text.upper()
    }
```

Upload it:
```bash
curl -X POST "http://localhost:8001/api/tools/upload" \
  -F "file=@my_tool.py" \
  -F "name=My Tool" \
  -F "description=Makes text uppercase" \
  -F "category=Utilities"
```

Execute it:
```bash
# Get tool_id from upload response
curl -X POST "http://localhost:8001/api/tools/TOOL_ID/execute" \
  -H "Content-Type: application/json" \
  -d '{\"text\": \"hello world\"}'
```

---

## 🛑 Stop Services

**If using launcher:**
Press `Ctrl+C` - akan auto stop backend dan frontend

**Manual:**
```bash
# Stop backend
pkill -f "python.*server.py"

# Or find and kill by PID
lsof -ti :8001 | xargs kill
```

---

## 📍 Important Paths

```
backend/              - Backend source
backend/server.py     - Main API server
backend/tools/        - Tools storage
logs/                 - All logs
docs/                 - Documentation
```

---

## 💡 Tips

1. **Testing:** Gunakan testing guide di `docs/BACKEND_TESTING_GUIDE.md`
2. **Logs:** Check logs di `logs/backend_*.log`
3. **Example Tools:** Lihat di `backend/tools/` untuk reference
4. **API Docs:** Full API docs di `docs/phase/phase_2_backend.md`

---

**Next:** Implement Frontend untuk Tools Management! 🎨
