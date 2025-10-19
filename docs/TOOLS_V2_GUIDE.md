# 🔧 Tools V2 - FastAPI Backend Guide

## ✅ Implementasi Selesai!

**Status**: Phase 2 Tools Update - COMPLETE ✅  
**Tanggal**: 19 Oktober 2025

---

## 📋 Yang Sudah Diimplementasikan

### 1. ✅ Backend Validator Update
**File**: `/app/backend/modules/tool_validator.py`

**Changes**:
- ✅ Check `app = FastAPI()` instance (bukan `def run()` lagi)
- ✅ Check minimal 1 endpoint decorator (@app.get, @app.post, dll)
- ✅ Extract endpoints list untuk dokumentasi
- ✅ Validate FastAPI app dapat di-import
- ✅ Updated error messages

**Validation Checks**:
1. Metadata (CATEGORY, NAME, DESCRIPTION)
2. Python syntax
3. FastAPI app structure
4. Import dependencies
5. Safe module import test

---

### 2. ✅ Server.py Dynamic Mounting
**File**: `/app/backend/server.py`

**New Features**:
- ✅ Function `mount_tool_routers()` - mount semua active tools
- ✅ `@app.on_event("startup")` - auto-mount saat server start
- ✅ Endpoint `POST /api/tools/reload-routers` - manual reload
- ✅ Auto-reload setelah upload tool baru (jika status=active)
- ✅ Proper error handling dan logging

**How It Works**:
```python
# Startup: Load all active tools
tools = db.list_tools({"status": "active"})

# For each tool:
# 1. Import backend module
# 2. Get 'app' object
# 3. Mount dengan prefix /tools/{tool_id}

app.mount(f"/tools/{tool_id}", tool_app)
```

**Result**:
```
Tool endpoint: http://localhost:8001/tools/{tool_id}/calculate
OpenAPI docs: http://localhost:8001/tools/{tool_id}/docs
```

---

### 3. ✅ Frontend Executor Update
**File**: `/app/src/components/FrontendToolExecutor.tsx`

**Changes**:
- ✅ Inject `window.TOOL_ID` ke iframe HTML
- ✅ Tool ID available untuk fetch ke backend
- ✅ Supports HTML, JSX, TSX, JS files

**Injection**:
```javascript
// Before rendering iframe
<script>
  window.TOOL_ID = "{tool_id}";
</script>
```

**Frontend Usage**:
```javascript
const TOOL_ID = window.TOOL_ID;
fetch(`http://localhost:8001/tools/${TOOL_ID}/calculate`, {...})
```

---

### 4. ✅ Sample Tool Created
**Files**:
- `/app/backend/sample_tools_v2/advanced_calculator_backend.py`
- `/app/backend/sample_tools_v2/advanced_calculator_frontend.html`

**Features**:
- ✅ Backend: FastAPI router dengan `/calculate` endpoint
- ✅ Frontend: Fetch ke backend API
- ✅ Scientific functions: sin, cos, tan, sqrt, log, exp
- ✅ Constants: pi, e
- ✅ Error handling frontend & backend
- ✅ Beautiful UI dengan examples

---

## 🎯 Cara Membuat Tool Baru

### Backend Structure (FastAPI Router)

```python
# CATEGORY: DevTools
# NAME: Tool Name
# DESCRIPTION: Tool description
# VERSION: 1.0.0
# AUTHOR: Your Name

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel

app = FastAPI(
    title="Tool Name API",
    description="Tool description",
    version="1.0.0"
)

# Request/Response Models
class RequestModel(BaseModel):
    param1: str
    param2: int

class ResponseModel(BaseModel):
    status: str
    result: str

# Endpoints
@app.post("/endpoint_name", response_model=ResponseModel)
def handler(req: RequestModel):
    # Your logic here
    return ResponseModel(
        status="success",
        result="result data"
    )

@app.get("/health")
def health_check():
    return {"status": "ok", "service": "Tool Name"}
```

**Required**:
- ✅ `app = FastAPI()` instance
- ✅ Minimal 1 endpoint (@app.get, @app.post, dll)
- ✅ Metadata di comment header (CATEGORY, NAME, DESCRIPTION)
- ✅ Pydantic models untuk validation

---

### Frontend Structure (HTML with Fetch)

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Tool Name</title>
  <style>
    /* Your styles */
  </style>
</head>
<body>
  <h1>Tool Name</h1>
  <input type="text" id="input" />
  <button onclick="callBackend()">Submit</button>
  <div id="result"></div>

  <script>
    // IMPORTANT: Get tool ID from window context
    const TOOL_ID = window.TOOL_ID || 'current-tool-id';
    const API_BASE = `http://localhost:8001/tools/${TOOL_ID}`;
    
    async function callBackend() {
      const input = document.getElementById('input').value;
      const resultDiv = document.getElementById('result');

      try {
        // Fetch to backend endpoint
        const response = await fetch(`${API_BASE}/endpoint_name`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ param1: input, param2: 123 })
        });

        const data = await response.json();

        if (response.ok) {
          resultDiv.innerHTML = `Result: ${data.result}`;
        } else {
          resultDiv.innerHTML = `Error: ${data.detail}`;
        }
      } catch (err) {
        resultDiv.innerHTML = `Network error: ${err.message}`;
      }
    }
  </script>
</body>
</html>
```

**Key Points**:
- ✅ Use `window.TOOL_ID` untuk dynamic routing
- ✅ Fetch ke `http://localhost:8001/tools/${TOOL_ID}/endpoint`
- ✅ Handle errors (network & API)
- ✅ Display results in UI

---

## 📤 Upload Tool

### Via cURL:
```bash
curl -X POST "http://localhost:8001/api/tools/upload" \
  -F "backend_file=@your_backend.py" \
  -F "frontend_file=@your_frontend.html" \
  -F "name=Tool Name" \
  -F "description=Tool description" \
  -F "category=DevTools" \
  -F "version=1.0.0" \
  -F "author=Your Name"
```

### Via Frontend:
1. Go to Settings → Tools Management
2. Click "Upload Tool"
3. Select backend (.py) file
4. Select frontend (.html, .jsx, .tsx, .js) file
5. Fill metadata form
6. Click "Upload"

**If validation passes**:
- Status = `active`
- Router automatically mounted
- Tool available di Tools page

**If validation fails**:
- Status = `disabled`
- Check errors in validation response
- Fix issues and re-upload

---

## 🧪 Testing

### 1. Backend Test (cURL)
```bash
# Get tool ID from upload response
TOOL_ID="your-tool-id"

# Test endpoint
curl -X POST "http://localhost:8001/tools/${TOOL_ID}/calculate" \
  -H "Content-Type: application/json" \
  -d '{"expression": "sqrt(16)", "precision": 10}'

# Check OpenAPI docs
curl "http://localhost:8001/tools/${TOOL_ID}/openapi.json"

# Health check
curl "http://localhost:8001/tools/${TOOL_ID}/health"
```

### 2. Frontend Test (Browser)
1. Open app in browser
2. Go to Tools page
3. Click on your tool
4. FrontendToolExecutor will load HTML
5. `window.TOOL_ID` automatically injected
6. Interact with UI
7. Frontend fetches to backend
8. Result displayed

### 3. Reload Routers
```bash
# Manual reload (jika perlu)
curl -X POST "http://localhost:8001/api/tools/reload-routers"
```

---

## 🔄 Migration dari Old Format

### Old Format (DEPRECATED):
```python
def run(params):
    return {"result": "something"}
```

### New Format (CURRENT):
```python
from fastapi import FastAPI
app = FastAPI()

@app.post("/endpoint")
def handler(req):
    return {"result": "something"}
```

**Catatan**: Tools lama dengan `def run()` tidak akan di-mount dan tidak bisa diakses dari frontend!

---

## 📊 Status Check

### Via Logs:
```bash
tail -f /var/log/supervisor/backend.*.log
```

**Startup logs**:
```
🚀 Mounting tool routers...
✅ Mounted: Tool Name at /tools/{tool_id}
✅ Successfully mounted 3 tool(s)
```

### Via API:
```bash
# List all tools
curl "http://localhost:8001/api/tools"

# Get tool details
curl "http://localhost:8001/api/tools/{tool_id}"

# Check if router mounted (OpenAPI)
curl "http://localhost:8001/tools/{tool_id}/openapi.json"
```

---

## 🎉 Sample Tool - Advanced Calculator

**Features**:
- Scientific functions (sin, cos, tan, sqrt, log, exp)
- Mathematical constants (pi, e)
- Custom precision (0-15 decimal places)
- Error handling
- Example expressions
- Beautiful UI

**Test**:
```bash
# Backend test
curl -X POST "http://localhost:8001/tools/{tool_id}/calculate" \
  -H "Content-Type: application/json" \
  -d '{"expression": "sqrt(16) + sin(pi/2)", "precision": 10}'

# Expected: {"status":"success","result":5.0}
```

**Frontend**: Interactive calculator dengan click-to-try examples!

---

## 🚀 Next Steps

### User Side:
1. ✅ Upload sample tool untuk testing
2. ✅ Test frontend-backend communication
3. ✅ Create your own tools mengikuti template
4. ✅ Share tools dengan team

### Development:
- Frontend improvements (dari user akan ada pembaruan)
- Tool templates/examples
- Documentation updates
- Help modal dengan examples

---

## 📝 Important Notes

1. **Breaking Change**: Tools lama tidak compatible. Harus re-upload dengan format baru.
2. **Auto-Mount**: Active tools otomatis di-mount saat:
   - Server startup
   - After successful upload
   - Manual reload via `/api/tools/reload-routers`
3. **CORS**: Already configured untuk localhost development
4. **Security**: Pydantic validation di backend, safe eval di calculator
5. **OpenAPI**: Automatic documentation untuk setiap tool

---

## 🆘 Troubleshooting

### Tool tidak di-mount?
1. Check logs: `tail -f /var/log/supervisor/backend.*.log`
2. Verify status: `curl http://localhost:8001/api/tools/{tool_id}`
3. Check validation errors
4. Manual reload: `curl -X POST http://localhost:8001/api/tools/reload-routers`

### Frontend tidak bisa fetch?
1. Check `window.TOOL_ID` ada di console
2. Check CORS di browser console
3. Verify endpoint: `curl http://localhost:8001/tools/{tool_id}/endpoint`
4. Check network tab di DevTools

### Validation failed?
1. Check error messages di response
2. Verify `app = FastAPI()` exists
3. Verify minimal 1 endpoint (@app.post, @app.get, dll)
4. Check metadata (CATEGORY, NAME, DESCRIPTION)

---

**Status**: ✅ Backend V2 Complete - Ready for Frontend Updates!  
**Last Updated**: 19 Oktober 2025
