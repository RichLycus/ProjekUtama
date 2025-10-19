# 🔧 DUAL UPLOAD - KONSEP YANG BENAR

## ⚠️ MASALAH IMPLEMENTASI SEBELUMNYA

### ❌ Yang SALAH (Implementasi Lama)
**Backend**:
```python
"""
NAME: Tool Name
CATEGORY: DevTools
"""

def run(params):
    # Logic here
    return {"result": "something"}
```

**Masalah**:
- ❌ Tidak ada FastAPI endpoint
- ❌ Frontend tidak bisa panggil API
- ❌ Hanya bisa dijalankan dari backend internal
- ❌ Tidak ada HTTP endpoint yang bisa di-fetch

---

## ✅ KONSEP YANG BENAR

### Prinsip Dasar
1. **Backend** = FastAPI Router dengan endpoint HTTP yang bisa dipanggil
2. **Frontend** = HTML/React yang fetch ke endpoint backend
3. **Server.py** = Mount router backend secara dinamis
4. **Frontend** dapat akses backend via `http://localhost:8001/tools/{tool_id}/...`

---

## 📝 STRUKTUR BACKEND YANG BENAR

### Template Backend (FastAPI Router)

```python
# CATEGORY: DevTools  
# NAME: Advanced Calculator  
# DESCRIPTION: Perform advanced mathematical operations
# VERSION: 1.0.0  
# AUTHOR: ChimeraAI Team  

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import math

app = FastAPI(
    title="Advanced Calculator API",
    description="Perform advanced mathematical operations",
    version="1.0.0"
)

# Pydantic Models untuk request/response validation
class CalcRequest(BaseModel):
    expression: str
    precision: int = 10

class CalcResponse(BaseModel):
    status: str
    expression: str
    result: float | int | str
    precision: int

# Endpoint yang bisa dipanggil frontend
@app.post("/calculate", response_model=CalcResponse)
def calculate(req: CalcRequest):
    expr = req.expression.strip()
    precision = req.precision

    if not expr:
        raise HTTPException(status_code=400, detail="Expression cannot be empty")

    # Safe evaluation namespace
    allowed_names = {
        "__builtins__": {},
        "sin": math.sin,
        "cos": math.cos,
        "tan": math.tan,
        "sqrt": math.sqrt,
        "pi": math.pi,
        "e": math.e,
    }

    try:
        result = eval(expr, {"__builtins__": {}}, allowed_names)
        if isinstance(result, float):
            result = round(result, precision)
        return CalcResponse(
            status="success",
            expression=expr,
            result=result,
            precision=precision
        )
    except ZeroDivisionError:
        raise HTTPException(status_code=400, detail="Division by zero")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Calculation error: {e}")
```

**Key Points**:
- ✅ `app = FastAPI()` - Buat FastAPI instance
- ✅ `@app.post("/calculate")` - Endpoint HTTP yang bisa di-fetch
- ✅ Pydantic models untuk validation
- ✅ Error handling dengan HTTPException
- ✅ Metadata di comment header (CATEGORY, NAME, dll)

---

## 🎨 STRUKTUR FRONTEND YANG BENAR

### Template Frontend (HTML with Fetch)

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Advanced Calculator</title>
  <style>
    body {
      font-family: 'Segoe UI', sans-serif;
      max-width: 600px;
      margin: 40px auto;
      padding: 20px;
      background: #f9f9fb;
    }
    h1 { text-align: center; color: #333; }
    input, button {
      width: 100%;
      padding: 12px;
      margin: 8px 0;
      box-sizing: border-box;
      border: 1px solid #ccc;
      border-radius: 6px;
    }
    button {
      background: #4f46e5;
      color: white;
      font-weight: bold;
      cursor: pointer;
    }
    button:hover { background: #4338ca; }
    #result {
      margin-top: 20px;
      padding: 16px;
      background: white;
      border-radius: 8px;
      box-shadow: 0 2px 6px rgba(0,0,0,0.1);
      display: none;
    }
    .error { color: #ef4444; }
    .success { color: #10b981; }
  </style>
</head>
<body>
  <h1>🧮 Advanced Calculator</h1>
  <input type="text" id="expression" placeholder="e.g., sqrt(16) + sin(pi/2)" />
  <input type="number" id="precision" value="10" min="0" max="15" placeholder="Precision (0-15)" />
  <button onclick="calculate()">Calculate</button>
  <div id="result"></div>

  <script>
    // IMPORTANT: Get tool_id from URL or window context
    const TOOL_ID = window.TOOL_ID || 'current-tool-id';
    
    async function calculate() {
      const expr = document.getElementById('expression').value;
      const prec = parseInt(document.getElementById('precision').value) || 10;
      const resultDiv = document.getElementById('result');

      try {
        // Fetch ke backend endpoint tool ini
        const res = await fetch(`http://localhost:8001/tools/${TOOL_ID}/calculate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ expression: expr, precision: prec })
        });

        const data = await res.json();

        resultDiv.style.display = 'block';
        if (data.status === 'success') {
          resultDiv.className = 'success';
          resultDiv.innerHTML = `
            <strong>Result:</strong> ${data.result}<br>
            <small>Expression: ${data.expression} | Precision: ${data.precision}</small>
          `;
        } else {
          resultDiv.className = 'error';
          resultDiv.textContent = `Error: ${data.detail || data.message}`;
        }
      } catch (err) {
        resultDiv.style.display = 'block';
        resultDiv.className = 'error';
        resultDiv.textContent = `Network or parsing error: ${err}`;
      }
    }

    // Allow Enter key to trigger calculation
    document.getElementById('expression').addEventListener('keypress', (e) => {
      if (e.key === 'Enter') calculate();
    });
  </script>
</body>
</html>
```

**Key Points**:
- ✅ Frontend fetch ke endpoint backend: `http://localhost:8001/tools/{tool_id}/calculate`
- ✅ Error handling untuk network & parsing
- ✅ Display result dengan styling
- ✅ Input validation di frontend

---

## 🔌 SERVER.PY - DYNAMIC ROUTER MOUNTING

### Konsep
Backend server.py harus:
1. Load semua tool backends yang sudah diupload
2. Mount setiap tool sebagai sub-application dengan prefix `/tools/{tool_id}`
3. Tool backend bisa diakses via endpoint uniknya

### Pseudocode

```python
# server.py
from fastapi import FastAPI
import importlib.util
from pathlib import Path

app = FastAPI()

# Load all uploaded tools from database
tools = db.list_tools()

for tool in tools:
    if tool['status'] == 'active':
        # Load backend module
        spec = importlib.util.spec_from_file_location(
            f"tool_{tool['_id']}", 
            tool['backend_path']
        )
        module = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(module)
        
        # Mount FastAPI app dari tool
        if hasattr(module, 'app'):
            app.mount(
                f"/tools/{tool['_id']}", 
                module.app, 
                name=f"tool_{tool['_id']}"
            )

# Existing endpoints
@app.get("/api/tools")
async def list_tools():
    # ...
```

**Flow**:
```
Frontend request: POST http://localhost:8001/tools/abc-123/calculate
                                              ↓
Server.py mounts:  /tools/abc-123 → tool_backend.app
                                              ↓
Tool backend app:  @app.post("/calculate") handler
                                              ↓
Response: {"status": "success", "result": 42}
```

---

## 📂 FILE STRUCTURE

```
backend/
├── server.py                           # Main FastAPI server
│   └── Mount all tool routers dynamically
│
├── tools/                              # Backend Python files
│   ├── devtools/
│   │   └── abc-123.py                  # FastAPI app with endpoints
│   ├── office/
│   │   └── def-456.py                  # FastAPI app with endpoints
│   └── utilities/
│       └── ghi-789.py                  # FastAPI app with endpoints
│
└── frontend_tools/                     # Frontend UI files
    ├── devtools/
    │   └── abc-123.html                # Fetch to /tools/abc-123/...
    ├── office/
    │   └── def-456.html                # Fetch to /tools/def-456/...
    └── utilities/
        └── ghi-789.html                # Fetch to /tools/ghi-789/...
```

---

## 🔄 FLOW DIAGRAM

```
┌─────────────────────────────────────────────────────────────┐
│                      USER CLICKS TOOL                       │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│  Frontend Executor loads:                                   │
│  GET /api/tools/file/{tool_id}?file_type=frontend          │
│  → Returns HTML content                                     │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│  Render HTML in iframe                                      │
│  Inject: window.TOOL_ID = "abc-123"                        │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│  USER interacts with frontend (click button, input data)   │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│  Frontend JavaScript:                                       │
│  fetch(`/tools/${TOOL_ID}/calculate`, {                    │
│    method: 'POST',                                          │
│    body: JSON.stringify({expression: "sqrt(16)"})          │
│  })                                                         │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│  server.py routes to mounted tool app:                     │
│  /tools/abc-123/calculate → tool_backend.app               │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│  Tool Backend FastAPI:                                      │
│  @app.post("/calculate")                                    │
│  def calculate(req):                                        │
│      # Process calculation                                  │
│      return {"status": "success", "result": 4}             │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│  Response back to Frontend                                  │
│  Frontend displays result in UI                             │
└─────────────────────────────────────────────────────────────┘
```

---

## ✅ CHECKLIST IMPLEMENTASI YANG BENAR

### Backend Validator
- [ ] Check: File Python valid
- [ ] Check: Ada `app = FastAPI()` instance
- [ ] Check: Ada minimal 1 endpoint decorator (`@app.get`, `@app.post`, dll)
- [ ] Check: Ada metadata di comment header (CATEGORY, NAME, DESCRIPTION)
- [ ] ❌ JANGAN check fungsi `run()` lagi!

### Backend Upload
- [ ] Save file Python ke `backend/tools/{category}/{tool_id}.py`
- [ ] Import module dan extract `app` object
- [ ] Mount app ke server.py dengan prefix `/tools/{tool_id}`
- [ ] Store routing info di database

### Frontend Validator
- [ ] Check: File HTML/JS/JSX/TSX valid
- [ ] Check: Ada fetch/axios call ke backend (optional warning)
- [ ] Check: Proper HTML structure

### Frontend Upload
- [ ] Save file ke `backend/frontend_tools/{category}/{tool_id}.{ext}`
- [ ] No mounting needed (just serve static file)

### Frontend Executor
- [ ] Load HTML dari `/api/tools/file/{tool_id}?file_type=frontend`
- [ ] Inject `window.TOOL_ID = "{tool_id}"` ke iframe
- [ ] Render in isolated iframe

---

## 📋 TODO LIST UNTUK PERCAKAPAN BERIKUTNYA

### 1. Update Backend Validator
File: `/app/backend/modules/tool_validator.py`
- [ ] Ubah validation logic:
  - Check `app = FastAPI()` instead of `def run()`
  - Check ada @app decorator (get, post, put, delete, dll)
  - Extract endpoints list
- [ ] Update error messages

### 2. Update Server.py - Dynamic Mounting
File: `/app/backend/server.py`
- [ ] Add function `mount_tool_routers()` di startup
- [ ] Loop semua active tools dari database
- [ ] Import module dan get `app` object
- [ ] Mount dengan `app.mount(f"/tools/{tool_id}", tool_app)`
- [ ] Add reload mechanism saat upload tool baru

### 3. Buat Ulang Sample Tools
- [ ] Delete sample tools lama (yang pakai `run()`)
- [ ] Buat 3 sample tools baru:
  - **Advanced Calculator** (contoh dari user)
  - **Text Formatter** (FastAPI + HTML fetch)
  - **Color Converter** (FastAPI + HTML fetch)
- [ ] Setiap tool harus punya:
  - Backend: FastAPI router dengan endpoint
  - Frontend: HTML yang fetch ke endpoint

### 4. Update Frontend Executor
File: `/app/src/components/FrontendToolExecutor.tsx` (atau sejenisnya)
- [ ] Inject `window.TOOL_ID` sebelum render iframe
- [ ] Update CORS handling jika perlu

### 5. Update Documentation
- [ ] Update HANDOFF.md dengan konsep baru
- [ ] Update Help Modal dengan contoh yang benar
- [ ] Add API documentation untuk tool endpoints

### 6. Testing
- [ ] Test upload tool dengan struktur baru
- [ ] Test frontend bisa fetch ke backend
- [ ] Test dynamic mounting works
- [ ] Test 3 sample tools

---

## 🎯 EXPECTED RESULT

**User clicks "Advanced Calculator" tool**:
1. Frontend loads HTML
2. User input: `sqrt(16) + sin(pi/2)`
3. JavaScript fetch to: `POST /tools/abc-123/calculate`
4. Backend calculates: `4 + 1 = 5`
5. Response: `{"status": "success", "result": 5}`
6. Frontend displays: "Result: 5"

**✅ Frontend dan Backend terhubung dengan sempurna!**

---

## 📝 NOTES PENTING

1. **Breaking Change Total**: Semua tools lama harus di-upload ulang dengan format baru
2. **Database Schema**: Tetap sama (backend_path + frontend_path)
3. **CORS**: Pastikan FastAPI CORS allow localhost
4. **Security**: Validate semua input di backend (Pydantic models)
5. **Error Handling**: Proper HTTPException di backend, try-catch di frontend

---

## 🚨 KESALAHAN YANG HARUS DIHINDARI

❌ **JANGAN**:
- Backend tanpa FastAPI app instance
- Backend hanya fungsi `run()` 
- Frontend tanpa fetch ke backend
- Hardcode `http://localhost:8001` di frontend (gunakan relative path atau env)
- Mount tool router tanpa prefix `/tools/{tool_id}`

✅ **HARUS**:
- Backend = FastAPI router dengan HTTP endpoints
- Frontend = Fetch ke endpoint backend
- Dynamic mounting di server.py
- Proper error handling di kedua sisi
- Validation dengan Pydantic models

---

**Status**: Dokumentasi untuk perbaikan di percakapan berikutnya  
**Prioritas**: HIGH - Konsep fundamental salah, perlu rewrite total  
**Estimasi**: ~3-4 jam untuk implementasi lengkap

**Selamat istirahat! 🛌**
