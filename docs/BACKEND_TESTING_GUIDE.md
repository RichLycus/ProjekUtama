# Backend Testing Guide - Phase 2

## 🎯 Tujuan Testing

Panduan ini membantu kamu test backend API ChimeraAI secara manual untuk memastikan semua fitur berjalan dengan baik.

---

## 🚀 Persiapan

### 1. Start Backend Server

**Option A: Menggunakan Launcher (Recommended)**
```bash
cd /app
./launcher_app.sh
```
Launcher akan otomatis:
- Check Python
- Install backend dependencies
- Start backend server di port 8001
- Start Electron frontend

**Option B: Start Backend Saja**
```bash
cd /app/backend
python3 server.py
```

### 2. Verifikasi Server Running

```bash
curl http://localhost:8001/
```

**Expected Response:**
```json
{
  "status": "ok",
  "message": "ChimeraAI Tools API v2.0"
}
```

✅ Jika dapat response ini, backend berhasil running!

---

## 🧪 Test Scenarios

### Test 1: Get Categories ✅

**Request:**
```bash
curl -X GET "http://localhost:8001/api/tools/categories"
```

**Expected Response:**
```json
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

**✅ Pass Criteria:**
- Status code: 200
- 7 categories returned

---

### Test 2: Upload Tool ✅

**Request:**
```bash
curl -X POST "http://localhost:8001/api/tools/upload" \
  -F "file=@/app/backend/tools/devtools/example_json_formatter.py" \
  -F "name=JSON Formatter Test" \
  -F "description=Test upload tool" \
  -F "category=DevTools" \
  -F "version=1.0.0" \
  -F "author=Tester"
```

**Expected Response:**
```json
{
  "success": true,
  "tool_id": "uuid-here",
  "tool": {
    "_id": "uuid-here",
    "name": "JSON Formatter Test",
    "description": "Test upload tool",
    "category": "DevTools",
    "version": "1.0.0",
    "author": "Tester",
    "script_path": "/app/backend/tools/devtools/uuid-here.py",
    "dependencies": ["json"],
    "status": "active",
    "last_validated": "timestamp",
    "created_at": "timestamp",
    "updated_at": "timestamp"
  },
  "validation": {
    "valid": true,
    "errors": [],
    "warnings": [],
    "dependencies": ["json"]
  }
}
```

**✅ Pass Criteria:**
- Status code: 200
- success: true
- validation.valid: true
- status: "active"
- **Save the tool_id for next tests!**

---

### Test 3: List All Tools ✅

**Request:**
```bash
curl -X GET "http://localhost:8001/api/tools"
```

**Expected Response:**
```json
{
  "tools": [
    {
      "_id": "uuid",
      "name": "JSON Formatter Test",
      "category": "DevTools",
      "status": "active",
      ...
    }
  ],
  "count": 1
}
```

**✅ Pass Criteria:**
- Status code: 200
- count >= 1
- tools array not empty

---

### Test 4: Get Tool Details ✅

**Request:**
```bash
# Replace TOOL_ID with actual ID from Test 2
curl -X GET "http://localhost:8001/api/tools/TOOL_ID"
```

**Expected Response:**
```json
{
  "tool": {
    "_id": "TOOL_ID",
    "name": "JSON Formatter Test",
    "description": "Test upload tool",
    ...
  }
}
```

**✅ Pass Criteria:**
- Status code: 200
- tool object returned
- All fields present

---

### Test 5: Execute Tool ✅

**Request:**
```bash
# Replace TOOL_ID
curl -X POST "http://localhost:8001/api/tools/TOOL_ID/execute" \
  -H "Content-Type: application/json" \
  -d '{"json_string": "{\"test\":\"value\",\"number\":123}", "indent": 2}'
```

**Expected Response:**
```json
{
  "success": true,
  "result": {
    "success": true,
    "result": {
      "status": "success",
      "formatted_json": "{\n  \"number\": 123,\n  \"test\": \"value\"\n}",
      "line_count": 4
    }
  }
}
```

**✅ Pass Criteria:**
- Status code: 200
- success: true
- result.result.status: "success"
- JSON formatted correctly

---

### Test 6: Filter by Category ✅

**Request:**
```bash
curl -X GET "http://localhost:8001/api/tools?category=DevTools"
```

**Expected Response:**
```json
{
  "tools": [
    {
      "_id": "uuid",
      "category": "DevTools",
      ...
    }
  ],
  "count": 1
}
```

**✅ Pass Criteria:**
- Only DevTools category tools returned
- count matches tools length

---

### Test 7: Toggle Tool Status ✅

**Request:**
```bash
# Disable tool
curl -X PUT "http://localhost:8001/api/tools/TOOL_ID/toggle"
```

**Expected Response:**
```json
{
  "success": true,
  "status": "disabled"
}
```

**Test Again:**
```bash
# Enable tool
curl -X PUT "http://localhost:8001/api/tools/TOOL_ID/toggle"
```

**Expected Response:**
```json
{
  "success": true,
  "status": "active"
}
```

**✅ Pass Criteria:**
- First toggle: status = "disabled"
- Second toggle: status = "active"

---

### Test 8: Get Tool Logs ✅

**Request:**
```bash
curl -X GET "http://localhost:8001/api/tools/TOOL_ID/logs?limit=10"
```

**Expected Response:**
```json
{
  "logs": [
    {
      "_id": "log-uuid",
      "tool_id": "TOOL_ID",
      "action": "execute",
      "status": "success",
      "message": "Tool executed successfully",
      "trace": "",
      "timestamp": "2025-10-18T05:00:00"
    },
    {
      "action": "upload",
      "status": "success",
      ...
    }
  ],
  "count": 2
}
```

**✅ Pass Criteria:**
- Logs array not empty
- Latest log at top
- Contains upload, execute actions

---

### Test 9: Re-validate Tool ✅

**Request:**
```bash
curl -X POST "http://localhost:8001/api/tools/TOOL_ID/validate"
```

**Expected Response:**
```json
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

**✅ Pass Criteria:**
- validation.valid: true
- No errors

---

### Test 10: Upload Invalid Tool ❌

**Create Invalid Tool:**
```bash
# Create test file with error
cat > /tmp/invalid_tool.py << 'EOF'
# Missing CATEGORY metadata
# NAME: Invalid Tool
# DESCRIPTION: This will fail

def run(params):
    return {"status": "success"}
EOF

# Try to upload
curl -X POST "http://localhost:8001/api/tools/upload" \
  -F "file=@/tmp/invalid_tool.py" \
  -F "name=Invalid Tool" \
  -F "description=Should fail validation" \
  -F "category=DevTools"
```

**Expected Response:**
```json
{
  "success": true,
  "tool": {
    ...
    "status": "disabled"
  },
  "validation": {
    "valid": false,
    "errors": [
      "Missing required metadata: CATEGORY"
    ],
    ...
  }
}
```

**✅ Pass Criteria:**
- Tool uploaded but disabled
- validation.valid: false
- Error message explains issue

---

### Test 11: Execute Disabled Tool ❌

**Request:**
```bash
# First disable a tool
curl -X PUT "http://localhost:8001/api/tools/TOOL_ID/toggle"

# Then try to execute
curl -X POST "http://localhost:8001/api/tools/TOOL_ID/execute" \
  -H "Content-Type: application/json" \
  -d '{"test": "data"}'
```

**Expected Response:**
```json
{
  "detail": "Tool is not active"
}
```

**✅ Pass Criteria:**
- Status code: 400
- Error message about inactive tool

---

### Test 12: Delete Tool ✅

**Request:**
```bash
curl -X DELETE "http://localhost:8001/api/tools/TOOL_ID"
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Tool deleted"
}
```

**Verify Deletion:**
```bash
# Try to get deleted tool
curl -X GET "http://localhost:8001/api/tools/TOOL_ID"
```

**Expected Response:**
```json
{
  "detail": "Tool not found"
}
```

**✅ Pass Criteria:**
- Delete successful
- Tool not found after deletion
- File removed from filesystem

---

## 📊 Complete Test Suite

Jalankan semua test sekaligus dengan script ini:

```bash
#!/bin/bash
# Save as test_backend.sh

BACKEND_URL="http://localhost:8001"
TOOL_ID=""

echo "🧪 Starting Backend Test Suite..."
echo ""

# Test 1: Health Check
echo "Test 1: Health Check"
curl -s $BACKEND_URL/ | python -m json.tool
echo ""

# Test 2: Get Categories
echo "Test 2: Get Categories"
curl -s $BACKEND_URL/api/tools/categories | python -m json.tool
echo ""

# Test 3: Upload Tool
echo "Test 3: Upload Tool"
UPLOAD_RESPONSE=$(curl -s -X POST "$BACKEND_URL/api/tools/upload" \
  -F "file=@/app/backend/tools/devtools/example_json_formatter.py" \
  -F "name=Test JSON Formatter" \
  -F "description=Testing" \
  -F "category=DevTools")

echo $UPLOAD_RESPONSE | python -m json.tool

# Extract tool_id
TOOL_ID=$(echo $UPLOAD_RESPONSE | python -c "import sys, json; print(json.load(sys.stdin)['tool_id'])")
echo "Tool ID: $TOOL_ID"
echo ""

# Test 4: List Tools
echo "Test 4: List Tools"
curl -s "$BACKEND_URL/api/tools" | python -m json.tool
echo ""

# Test 5: Execute Tool
echo "Test 5: Execute Tool"
curl -s -X POST "$BACKEND_URL/api/tools/$TOOL_ID/execute" \
  -H "Content-Type: application/json" \
  -d '{"json_string": "{\"test\":\"value\"}", "indent": 2}' | python -m json.tool
echo ""

# Test 6: Get Logs
echo "Test 6: Get Tool Logs"
curl -s "$BACKEND_URL/api/tools/$TOOL_ID/logs" | python -m json.tool
echo ""

# Test 7: Toggle Status
echo "Test 7: Toggle Status"
curl -s -X PUT "$BACKEND_URL/api/tools/$TOOL_ID/toggle" | python -m json.tool
echo ""

# Test 8: Delete Tool
echo "Test 8: Delete Tool"
curl -s -X DELETE "$BACKEND_URL/api/tools/$TOOL_ID" | python -m json.tool
echo ""

echo "✅ Test Suite Complete!"
```

**Run:**
```bash
chmod +x test_backend.sh
./test_backend.sh
```

---

## 🐛 Troubleshooting

### Backend Won't Start

**Check:**
```bash
# Check if port is in use
lsof -i :8001

# Check backend logs
tail -f /app/logs/backend_*.log
```

**Solution:**
```bash
# Kill process on port
pkill -f "python.*server.py"

# Restart
cd /app/backend && python3 server.py
```

---

### Tool Upload Fails

**Common Issues:**

1. **Missing Metadata**
   - Ensure file has all required comments
   - Check spelling: CATEGORY, NAME, DESCRIPTION

2. **Invalid Category**
   - Must be one of: Office, DevTools, Multimedia, Utilities, Security, Network, Data

3. **Syntax Error**
   - Check Python syntax
   - Test file with `python3 tool.py`

---

### Tool Execution Fails

**Check Logs:**
```bash
curl "http://localhost:8001/api/tools/TOOL_ID/logs"
```

**Common Issues:**

1. **Missing Dependencies**
   - Use install-deps endpoint
   ```bash
   curl -X POST "http://localhost:8001/api/tools/TOOL_ID/install-deps"
   ```

2. **Wrong Parameters**
   - Check tool's expected params
   - Verify JSON format

3. **Tool Disabled**
   - Enable tool first
   ```bash
   curl -X PUT "http://localhost:8001/api/tools/TOOL_ID/toggle"
   ```

---

## ✅ Success Checklist

Setelah testing, pastikan:

- [ ] Backend server running on port 8001
- [ ] Health check returns OK
- [ ] Can get categories (7 categories)
- [ ] Can upload tool successfully
- [ ] Tool auto-validates correctly
- [ ] Can execute tool and get result
- [ ] Can toggle tool status
- [ ] Can get tool logs
- [ ] Can delete tool
- [ ] Invalid tools are disabled automatically
- [ ] Disabled tools cannot be executed

---

## 📞 Support

Jika ada masalah:

1. Check logs di `/app/logs/`
2. Lihat dokumentasi lengkap: `/app/docs/phase/phase_2_backend.md`
3. Test dengan contoh tools di `/app/backend/tools/`

---

**Happy Testing! 🚀**
