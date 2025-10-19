# 📋 Manual Testing Guide - Path Management Fix

## ✅ What Was Fixed

### Problem:
- Database menyimpan **absolute paths** (`/app/backend/tools/...`)
- Paths tidak portable - hanya jalan di Docker
- Break saat run di environment berbeda

### Solution:
- Database sekarang menyimpan **relative paths** (`tools/devtools/abc.py`)
- Paths di-construct at runtime dari `BACKEND_DIR`
- 100% portable - jalan di Docker, Windows, macOS, Linux

---

## 🧪 Testing Checklist

### **1. ✅ Verify Database Migration**

**Test**: Check paths in database
```bash
cd backend
python3 -c "
import sqlite3
conn = sqlite3.connect('data/chimera_tools.db')
cursor = conn.cursor()
cursor.execute('SELECT name, backend_path, frontend_path FROM tools LIMIT 3')
for row in cursor.fetchall():
    print(f'{row[0]}:')
    print(f'  Backend: {row[1]}')
    print(f'  Frontend: {row[2]}')
conn.close()
"
```

**Expected Result**:
```
✅ Paths should be RELATIVE:
   tools/devtools/abc.py
   frontend_tools/devtools/abc.html

❌ NOT absolute:
   /app/backend/tools/devtools/abc.py
```

---

### **2. ✅ Test Backend API**

**Test A: List All Tools**
```bash
curl http://localhost:8001/api/tools | python3 -m json.tool
```

**Expected**:
- ✅ Tools list returned
- ✅ Paths are absolute (constructed at runtime)
- ✅ All tools have `backend_path` and `frontend_path`

**Test B: Get Single Tool**
```bash
# Ganti TOOL_ID dengan ID dari test A
curl http://localhost:8001/api/tools/TOOL_ID | python3 -m json.tool
```

**Expected**:
- ✅ Tool details returned
- ✅ Paths exist and files accessible

---

### **3. ⚡ Test Tool Upload (NEW TOOL)**

**Important**: Ini test yang PALING PENTING karena test upload logic yang sudah diupdate.

**Steps dalam Electron App**:

1. **Buka Tools Page** di app
2. **Click "Upload Tool"**
3. **Upload 2 files**:
   - Backend: `sample_tools_v2/advanced_calculator_backend.py`
   - Frontend: `sample_tools_v2/advanced_calculator_frontend.html`
4. **Fill form**:
   - Name: "Test Calculator"
   - Description: "Test for path portability"
   - Category: "DevTools"
5. **Submit**

**Expected Result**:
✅ Tool uploaded successfully
✅ Tool appears in tools list
✅ Tool status = "active" (if validation passed)

**Verify in Database**:
```bash
cd backend
python3 -c "
import sqlite3
conn = sqlite3.connect('data/chimera_tools.db')
cursor = conn.cursor()
cursor.execute('SELECT name, backend_path FROM tools ORDER BY created_at DESC LIMIT 1')
row = cursor.fetchone()
print(f'Latest tool: {row[0]}')
print(f'Backend path: {row[1]}')
print(f'Is relative: {not row[1].startswith(\"/\")}')
conn.close()
"
```

**Expected**:
```
Latest tool: Test Calculator
Backend path: tools/devtools/xxxxx.py
Is relative: True  ✅
```

---

### **4. 🎨 Test Frontend Tool Execution**

**Steps**:
1. Open "Advanced Calculator" tool di app
2. Click untuk execute tool
3. Tool frontend should load in iframe
4. Test calculator functions (2 + 2, sin(30), etc)

**Expected**:
✅ Frontend loads correctly
✅ Backend API calls work
✅ Results displayed correctly

---

### **5. 🔄 Test Tool Validation**

**Test**: Re-validate a tool
```bash
# Ganti TOOL_ID
curl -X POST http://localhost:8001/api/tools/TOOL_ID/validate | python3 -m json.tool
```

**Expected**:
✅ Validation completes
✅ Status updated in database
✅ No path-related errors

---

### **6. 🗑️ Test Tool Deletion**

**Test**: Delete a tool
```bash
# Ganti TOOL_ID dengan test tool yang diupload di step 3
curl -X DELETE http://localhost:8001/api/tools/TOOL_ID
```

**Expected**:
✅ Tool deleted from database
✅ Files deleted from disk
✅ No path errors

---

### **7. 📦 Test in Different Environment (CRITICAL)**

**This is THE MOST IMPORTANT TEST untuk verify portability!**

**Option A: Test di Local Machine (bukan Docker)**

1. Copy project ke local: `/home/lycus/Nourivex/CursorProject/ProjekUtama/`
2. Install dependencies
3. Start backend:
   ```bash
   cd backend
   python3 server.py
   ```
4. Test API: `curl http://localhost:8001/api/tools`

**Expected**:
✅ Backend starts successfully
✅ Tools loaded dari database
✅ Paths constructed correctly untuk local environment
✅ Files accessible

**Option B: Test Path Construction**

Run this script di local:
```python
# test_portability.py
from pathlib import Path
from database import SQLiteDB

print(f"Current directory: {Path.cwd()}")
print(f"Backend dir: {Path(__file__).parent}")

db = SQLiteDB()
tools = db.list_tools()

print(f"\nFound {len(tools)} tools:")
for tool in tools:
    print(f"\n{tool['name']}:")
    print(f"  Backend: {tool['backend_path']}")
    print(f"  Exists: {Path(tool['backend_path']).exists()}")
```

**Expected**:
✅ Paths constructed based on actual location
✅ NOT hardcoded to `/app/`
✅ Files found correctly

---

## 🐛 Troubleshooting

### Issue: "File not found" errors

**Check**:
```bash
cd backend
python3 -c "
from database import SQLiteDB
from pathlib import Path
db = SQLiteDB()
print(f'Backend DIR: {db.backend_dir}')
tools = db.list_tools()
for tool in tools[:2]:
    print(f'{tool[\"name\"]}:')
    print(f'  DB value: {tool[\"backend_path\"]}')
    print(f'  Exists: {Path(tool[\"backend_path\"]).exists()}')
"
```

### Issue: Tools not mounting

**Check logs**:
```bash
tail -n 50 /var/log/supervisor/backend.err.log
```

Look for:
- Import errors
- Path errors
- Module loading errors

---

## ✅ Success Criteria

All tests should pass with:
- ✅ No hardcoded `/app/` in database
- ✅ Paths stored as relative in DB
- ✅ Paths constructed correctly at runtime
- ✅ New tools uploaded dengan relative paths
- ✅ All CRUD operations work (Create, Read, Update, Delete)
- ✅ Tools execute correctly
- ✅ Portable - jalan di environment manapun

---

## 📝 Test Results Template

Copy template ini dan isi hasil testing Anda:

```
# Testing Results - Path Management Fix

Date: ___________
Tester: ___________
Environment: ___________

## Test Results:

[ ] 1. Database Migration ✅ / ❌
    Notes: _______________________

[ ] 2. Backend API (List Tools) ✅ / ❌
    Notes: _______________________

[ ] 3. Tool Upload (NEW) ✅ / ❌
    Notes: _______________________

[ ] 4. Frontend Execution ✅ / ❌
    Notes: _______________________

[ ] 5. Tool Validation ✅ / ❌
    Notes: _______________________

[ ] 6. Tool Deletion ✅ / ❌
    Notes: _______________________

[ ] 7. Portability Test ✅ / ❌
    Notes: _______________________

## Overall Result: ✅ PASS / ❌ FAIL

## Issues Found:
1. _______________________
2. _______________________

## Additional Notes:
_______________________________
```

---

## 🎯 Priority Testing Order

**Must Test (Critical)**:
1. ✅ Database migration verification
2. ✅ Tool upload (new tool)
3. ✅ Backend API (list tools)

**Should Test (Important)**:
4. ✅ Frontend tool execution
5. ✅ Tool validation
6. ✅ Tool deletion

**Nice to Test (Verification)**:
7. ✅ Portability in different environment

---

**Questions?** Check:
- `docs/golden-rules.md` - Path management rules
- `docs/TOOLS_V2_GUIDE.md` - Tools architecture
- Backend logs: `/var/log/supervisor/backend.*.log`
