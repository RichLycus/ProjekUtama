# Phase 2 - Python Tools Management System (Backend)

## 📋 Overview

Phase 2 membangun sistem manajemen Python tools yang profesional, modular, dan aman. Backend menggunakan FastAPI dengan fitur auto-validation, safe execution, dan dependency management.

---

## 🎯 Goals

1. ✅ Sistem upload & register Python tools
2. ✅ Auto-validation lengkap (syntax, imports, structure)
3. ✅ Safe execution dengan subprocess isolation
4. ✅ Category-based organization
5. ✅ Dependency auto-installer
6. ✅ Logging system
7. ✅ Status management (active/disabled)

---

## 🏗️ Architecture

### Backend Structure
```
/app/backend/
├── server.py              # Main FastAPI application
├── requirements.txt       # Python dependencies
├── .env                   # Environment variables
├── modules/
│   ├── tool_validator.py  # Validation engine
│   ├── tool_executor.py   # Safe execution engine
│   └── dependency_manager.py # Dependency installer
└── tools/                 # Category-based storage
    ├── office/
    ├── devtools/
    ├── multimedia/
    ├── utilities/
    ├── security/
    ├── network/
    └── data/
```

### Database Schema (MongoDB)

#### Tools Collection
```javascript
{
  _id: "uuid",
  name: "Tool Name",
  description: "Tool description",
  category: "DevTools",
  version: "1.0.0",
  author: "Author Name",
  script_path: "/path/to/script.py",
  dependencies: ["json", "requests"],
  status: "active", // active, disabled, pending
  last_validated: "2025-10-18T05:00:00",
  created_at: "2025-10-18T05:00:00",
  updated_at: "2025-10-18T05:00:00"
}
```

#### Tool Logs Collection
```javascript
{
  _id: "uuid",
  tool_id: "tool-uuid",
  action: "upload", // upload, validate, execute, toggle, delete
  status: "success", // success, error
  message: "Action description",
  trace: "Error trace if any",
  timestamp: "2025-10-18T05:00:00"
}
```

---

## 🚀 Getting Started

### Installation

```bash
# Install backend dependencies
cd /app/backend
pip install -r requirements.txt
```

### Start Backend Server

**Option 1: Direct**
```bash
cd /app/backend
python server.py
```

**Option 2: With Launcher (Recommended)**
```bash
# From project root
./start_chimera.sh
```

### Verify Server Running
```bash
curl http://localhost:8001/
# Response: {"status":"ok","message":"ChimeraAI Tools API v2.0"}
```

---

## 📡 API Endpoints

### Base URL
```
http://localhost:8001
```

### 1. Health Check
```bash
GET /

# Response
{
  "status": "ok",
  "message": "ChimeraAI Tools API v2.0"
}
```

### 2. Get Categories
```bash
GET /api/tools/categories

# Response
{
  "categories": [
    "Office",
    "DevTools",
    "Multimedia",
    "Utilities",
    "Security",
    "Network",
    "Data"
  ]
}
```

### 3. Upload Tool
```bash
POST /api/tools/upload
Content-Type: multipart/form-data

# Form Fields
file: <Python file>
name: "Tool Name"
description: "Tool description"
category: "DevTools"
version: "1.0.0" (optional, default: 1.0.0)
author: "Author Name" (optional, default: Anonymous)

# Example with curl
curl -X POST "http://localhost:8001/api/tools/upload" \
  -F "file=@/path/to/tool.py" \
  -F "name=My Tool" \
  -F "description=Does something cool" \
  -F "category=DevTools" \
  -F "version=1.0.0" \
  -F "author=John Doe"

# Response
{
  "success": true,
  "tool_id": "uuid",
  "tool": { ...tool object... },
  "validation": {
    "valid": true,
    "errors": [],
    "warnings": [],
    "dependencies": ["json"]
  }
}
```

### 4. List Tools
```bash
GET /api/tools?category=DevTools&status=active

# Query Parameters (all optional)
- category: Filter by category
- status: Filter by status (active, disabled, pending)

# Example
curl "http://localhost:8001/api/tools?category=DevTools"

# Response
{
  "tools": [
    {
      "_id": "uuid",
      "name": "JSON Formatter",
      "category": "DevTools",
      "status": "active",
      ...
    }
  ],
  "count": 1
}
```

### 5. Get Tool Details
```bash
GET /api/tools/{tool_id}

# Example
curl "http://localhost:8001/api/tools/uuid-here"

# Response
{
  "tool": { ...tool object... }
}
```

### 6. Execute Tool
```bash
POST /api/tools/{tool_id}/execute
Content-Type: application/json

# Body: Tool parameters as JSON
{
  "param1": "value1",
  "param2": "value2"
}

# Example - JSON Formatter
curl -X POST "http://localhost:8001/api/tools/uuid-here/execute" \
  -H "Content-Type: application/json" \
  -d '{"json_string": "{\"name\":\"test\"}", "indent": 2}'

# Response
{
  "success": true,
  "result": {
    "success": true,
    "result": {
      "status": "success",
      "formatted_json": "{\n  \"name\": \"test\"\n}",
      "line_count": 3
    }
  }
}
```

### 7. Re-validate Tool
```bash
POST /api/tools/{tool_id}/validate

# Example
curl -X POST "http://localhost:8001/api/tools/uuid-here/validate"

# Response
{
  "success": true,
  "validation": {
    "valid": true,
    "errors": [],
    "warnings": [],
    "dependencies": ["json"]
  }
}
```

### 8. Toggle Tool Status
```bash
PUT /api/tools/{tool_id}/toggle

# Example
curl -X PUT "http://localhost:8001/api/tools/uuid-here/toggle"

# Response
{
  "success": true,
  "status": "disabled"  # or "active"
}
```

### 9. Delete Tool
```bash
DELETE /api/tools/{tool_id}

# Example
curl -X DELETE "http://localhost:8001/api/tools/uuid-here"

# Response
{
  "success": true,
  "message": "Tool deleted"
}
```

### 10. Install Dependencies
```bash
POST /api/tools/{tool_id}/install-deps

# Example
curl -X POST "http://localhost:8001/api/tools/uuid-here/install-deps"

# Response
{
  "success": true,
  "result": {
    "success": true,
    "message": "Successfully installed 2 packages",
    "output": "...pip output..."
  },
  "validation": { ...new validation result... }
}
```

### 11. Get Tool Logs
```bash
GET /api/tools/{tool_id}/logs?limit=50

# Query Parameters
- limit: Number of logs to return (default: 50)

# Example
curl "http://localhost:8001/api/tools/uuid-here/logs?limit=10"

# Response
{
  "logs": [
    {
      "_id": "log-uuid",
      "tool_id": "tool-uuid",
      "action": "execute",
      "status": "success",
      "message": "Tool executed successfully",
      "trace": "",
      "timestamp": "2025-10-18T05:00:00"
    }
  ],
  "count": 1
}
```

---

## 🔧 Tool Development Standard

### Required Tool Format

Setiap Python tool harus mengikuti format ini:

```python
# CATEGORY: DevTools
# NAME: My Awesome Tool
# DESCRIPTION: Does something amazing
# VERSION: 1.0.0
# AUTHOR: John Doe

import json  # Import dependencies

def run(params):
    """
    Main function that will be called
    
    Args:
        params (dict): Parameters passed to the tool
    
    Returns:
        dict: Result with status and data
    """
    try:
        # Your tool logic here
        result = do_something(params)
        
        return {
            "status": "success",
            "data": result
        }
    except Exception as e:
        return {
            "status": "error",
            "message": str(e)
        }

if __name__ == "__main__":
    # Test your tool
    test_params = {"key": "value"}
    print(run(test_params))
```

### Metadata Requirements

**Required:**
- `CATEGORY`: Must be one of the 7 categories
- `NAME`: Tool name
- `DESCRIPTION`: What the tool does

**Optional but Recommended:**
- `VERSION`: Semantic versioning (1.0.0)
- `AUTHOR`: Your name

### Function Requirements

1. Must have a `run(params)` function
2. `params` is a dictionary
3. Must return a dictionary
4. Should handle errors gracefully

---

## 🧪 Testing Backend

### Test 1: Upload Example Tool

```bash
# Upload JSON Formatter
curl -X POST "http://localhost:8001/api/tools/upload" \
  -F "file=@/app/backend/tools/devtools/example_json_formatter.py" \
  -F "name=JSON Formatter" \
  -F "description=Format and beautify JSON data" \
  -F "category=DevTools" \
  -F "version=1.0.0" \
  -F "author=ChimeraAI Team"

# Save the tool_id from response
```

### Test 2: List All Tools

```bash
curl "http://localhost:8001/api/tools" | python -m json.tool
```

### Test 3: Execute Tool

```bash
# Replace TOOL_ID with actual ID from upload
curl -X POST "http://localhost:8001/api/tools/TOOL_ID/execute" \
  -H "Content-Type: application/json" \
  -d '{"json_string": "{\"name\":\"test\",\"value\":123}", "indent": 2}'
```

### Test 4: Check Tool Logs

```bash
curl "http://localhost:8001/api/tools/TOOL_ID/logs" | python -m json.tool
```

### Test 5: Toggle Tool Status

```bash
# Disable tool
curl -X PUT "http://localhost:8001/api/tools/TOOL_ID/toggle"

# Enable again
curl -X PUT "http://localhost:8001/api/tools/TOOL_ID/toggle"
```

---

## 🛡️ Validation System

### Validation Checks

1. **Metadata Check**
   - Verifies all required metadata exists
   - Extracts VERSION and AUTHOR if present

2. **Syntax Check**
   - Uses Python AST to parse code
   - Catches syntax errors before execution

3. **Structure Check**
   - Ensures `run()` function exists
   - Validates function signature

4. **Import Check**
   - Extracts all imports
   - Checks if modules are available
   - Creates dependency list

5. **Test Execution**
   - Safe test run with empty params
   - Catches runtime errors early

### Validation Response

```javascript
{
  "valid": true,  // Overall validation status
  "errors": [],   // List of errors (empty if valid)
  "warnings": [], // Non-critical warnings
  "dependencies": ["json", "requests"] // Extracted dependencies
}
```

---

## 🔒 Security Features

### 1. Subprocess Isolation
- Tools run in separate process
- Timeout protection (30s default)
- No access to main process memory

### 2. Safe Execution
- Tools can't modify system files
- Limited to their own scope
- Error handling prevents crashes

### 3. Dependency Management
- Only installs explicitly listed dependencies
- Uses pip in isolated mode
- Logs all installations

---

## 📊 Example Tools

### 1. JSON Formatter (DevTools)
**Location:** `backend/tools/devtools/example_json_formatter.py`

**Usage:**
```json
{
  "json_string": "{\"name\":\"test\"}",
  "indent": 2
}
```

### 2. Text Counter (Utilities)
**Location:** `backend/tools/utilities/example_text_counter.py`

**Usage:**
```json
{
  "text": "Your text here"
}
```

### 3. CSV to JSON (Office)
**Location:** `backend/tools/office/example_csv_to_json.py`

**Usage:**
```json
{
  "csv_data": "name,age\nJohn,30\nJane,25",
  "delimiter": ","
}
```

---

## 🐛 Troubleshooting

### Backend Won't Start

```bash
# Check if port is in use
lsof -i :8001

# Kill existing process
pkill -f "python.*server.py"

# Restart
cd /app/backend && python server.py
```

### Tool Upload Fails

**Check validation errors:**
```bash
# Response will include validation details
{
  "success": false,
  "validation": {
    "valid": false,
    "errors": [
      "Missing required metadata: CATEGORY"
    ]
  }
}
```

**Fix:** Ensure tool has all required metadata

### Tool Execution Fails

**Check logs:**
```bash
curl "http://localhost:8001/api/tools/TOOL_ID/logs"
```

**Common issues:**
- Missing dependencies → Use install-deps endpoint
- Invalid parameters → Check tool documentation
- Timeout → Increase timeout in executor

---

## 📝 Next Steps

### Phase 2 Frontend (Upcoming)

1. **Settings Page - Tools Manager**
   - Upload UI form
   - Tool list with badges
   - Status management
   - Validation display

2. **Tools Page - Execution Interface**
   - Category filters
   - Tool cards
   - Parameter forms
   - Output display

3. **Components**
   - ToolCard
   - CategoryBadge
   - ToolUploadForm
   - ValidationReport
   - ToolExecutor

---

## 📚 Resources

- [FastAPI Documentation](https://fastapi.tiangolo.com)
- [Python AST Module](https://docs.python.org/3/library/ast.html)
- [Subprocess Security](https://docs.python.org/3/library/subprocess.html)

---

**Phase 2 Backend Status:** ✅ **COMPLETE & PRODUCTION READY**
