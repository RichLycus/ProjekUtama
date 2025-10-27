# 🛠️ ChimeraAI Dynamic Tools System - Production Guide

**Last Updated:** December 2025  
**Status:** ✅ PRODUCTION READY - Universal Structure

---

## 📊 System Status

| Feature | Status | Notes |
|---------|--------|-------|
| Universal File Structure | ✅ Complete | Portable across all OS |
| Frontend Tools Separation | ✅ Complete | Clean separation from app code |
| Auto-Discovery System | ✅ Complete | Zero manual registration |
| Dual File Upload | ✅ Complete | Backend + Frontend upload |
| ZIP Upload | ✅ Complete | Single archive upload |
| Slug-based Naming | ✅ Complete | Human-readable names |

---

## 📁 Universal File Structure

### **⚠️ GOLDEN RULE: UNIVERSAL PATHS ONLY!**

**HARUS pakai RELATIVE paths. DILARANG hardcode absolute paths!**

```bash
❌ SALAH (Hardcoded - Not Portable):
/app/backend/sample_tools/...           # Docker only!
/home/user/chimera-ai/backend/...       # Linux specific!
C:\Projects\chimera-ai\backend\...      # Windows specific!

✅ BENAR (Relative - Universal):
backend/sample_tools/...                # Works everywhere!
backend/frontend_tools/...              # Works everywhere!
```

**Why?** App harus jalan di Docker, Windows, macOS, Linux tanpa modifikasi!

---

## 🏗️ Current Structure (Production)

```
project-root/                          (bisa di mana saja!)
│
├── backend/
│   │
│   ├── sample_tools/                  ← Backend files (organized by category)
│   │   │
│   │   ├── devtools/
│   │   │   ├── greeting-speaker/
│   │   │   │   └── backend/
│   │   │   │       └── main.py       ← FastAPI backend
│   │   │   │
│   │   │   └── color-picker/
│   │   │       └── backend/
│   │   │           └── main.py
│   │   │
│   │   ├── multimedia/
│   │   │   └── image-upscaler/
│   │   │       └── backend/
│   │   │           └── main.py
│   │   │
│   │   ├── office/
│   │   │   └── text-formatter/
│   │   │       └── backend/
│   │   │           └── main.py
│   │   │
│   │   └── utilities/
│   │       ├── calculator/
│   │       │   └── backend/
│   │       │       └── main.py
│   │       │
│   │       └── advanced-calculator/
│   │           └── backend/
│   │               └── main.py
│   │
│   └── frontend_tools/                ← Frontend files (flat by slug)
│       │
│       ├── greeting-speaker/
│       │   └── GreetingSpeaker.tsx   ← React component
│       │
│       ├── image-upscaler/
│       │   └── ImageUpscaler.tsx
│       │
│       ├── color-picker/
│       │   └── ColorPicker.html      ← HTML tools also supported!
│       │
│       ├── text-formatter/
│       │   └── TextFormatter.html
│       │
│       ├── calculator/
│       │   └── Calculator.html
│       │
│       └── advanced-calculator/
│           └── AdvancedCalculator.html
│
├── src/                               ← Main app code
│   ├── lib/
│   │   └── toolLoader.tsx            ← Auto-discovery magic!
│   │
│   ├── components/
│   └── pages/
│
└── vite.config.ts                     ← Vite config (allows backend imports)
```

---

## 🎯 Design Principles

### **1. Clean Separation**

```
src/                    → Main app code (core features)
backend/frontend_tools/ → Tool components (modular, isolated)
backend/sample_tools/   → Tool backends (FastAPI APIs)
```

**Benefits:**
- 1000 tools won't pollute `src/` folder
- Easy to backup/delete individual tools
- Clear responsibility separation

### **2. Backend: Organized by Category**

```
sample_tools/
├── devtools/      → Development tools
├── multimedia/    → Image, video, audio tools
├── office/        → Document, text tools
├── utilities/     → Calculators, converters
└── converters/    → Format converters
```

**Benefits:**
- Easy to find tools by type
- Natural grouping
- Scalable structure

### **3. Frontend: Flat by Slug**

```
frontend_tools/
├── greeting-speaker/
├── image-upscaler/
└── calculator/
```

**Benefits:**
- Fast auto-discovery (no nested scanning)
- Simple import paths
- Slug-based identification

---

## 🚀 Auto-Discovery System

### **How It Works**

```typescript
// File: src/lib/toolLoader.tsx

// 1. Vite scans backend/frontend_tools/ for .tsx files
const toolModules = import.meta.glob('../../backend/frontend_tools/**/*.tsx')

// Output example:
// {
//   '../../backend/frontend_tools/greeting-speaker/GreetingSpeaker.tsx': () => import(...),
//   '../../backend/frontend_tools/image-upscaler/ImageUpscaler.tsx': () => import(...)
// }

// 2. Extract component names
// 'GreetingSpeaker.tsx' → 'GreetingSpeaker'
// 'ImageUpscaler.tsx' → 'ImageUpscaler'

// 3. Build registry
const DynamicToolRegistry = {
  'GreetingSpeaker': () => import('../../backend/frontend_tools/greeting-speaker/GreetingSpeaker.tsx'),
  'ImageUpscaler': () => import('../../backend/frontend_tools/image-upscaler/ImageUpscaler.tsx')
}

// 4. Load on demand (code splitting!)
const ToolComponent = await DynamicToolRegistry['GreetingSpeaker']()
```

**Magic:** Zero manual registration! Just drop file → auto-discovered!

---

## 📤 Upload System

### **Two Upload Methods**

#### **Method 1: Dual File Upload**

```
User uploads:
├── backend.py         (1 Python file)
└── frontend.tsx       (1 React/HTML file)

System saves to:
├── backend/sample_tools/{category}/{slug}/backend/main.py
└── backend/frontend_tools/{slug}/{ComponentName}.tsx
```

#### **Method 2: ZIP Upload** (Recommended!)

```
User uploads: my-tool.zip

ZIP structure:
my-tool.zip
├── backend/
│   └── main.py       ← Exactly 1 Python file
└── frontend/
    └── MyTool.tsx    ← Exactly 1 frontend file (.tsx/.jsx/.html/.js)

System extracts to same structure as Method 1!
```

---

## 🔧 Slug Generation

### **Naming Convention**

```python
def slugify(name: str) -> str:
    """
    Convert tool name to slug
    
    Rules:
    - Lowercase
    - Spaces → dashes
    - Remove special chars: ()!@#$%^&*
    - Keep: alphanumeric + dashes
    """
    
    slug = name.lower()
    slug = slug.replace(' ', '-')
    slug = re.sub(r'[^\w\-]', '', slug)  # Remove special chars
    slug = re.sub(r'\-+', '-', slug)     # Collapse multiple dashes
    return slug.strip('-')
```

### **Examples**

| Tool Name | Slug |
|-----------|------|
| Greeting Speaker | `greeting-speaker` |
| Image Upscaler 4K | `image-upscaler-4k` |
| CSV to JSON Converter | `csv-to-json-converter` |
| Text Formatter (Pro) | `text-formatter-pro` |

### **Component Name Convention**

Slug → PascalCase ComponentName

| Slug | ComponentName |
|------|---------------|
| `greeting-speaker` | `GreetingSpeaker.tsx` |
| `image-upscaler` | `ImageUpscaler.tsx` |
| `csv-converter` | `CsvConverter.tsx` |

**Auto-conversion:**
```python
component_name = ''.join(word.capitalize() for word in slug.split('-'))
# 'greeting-speaker' → 'GreetingSpeaker'
```

---

## 📦 Active Tools (Production)

### **Current Tools: 6**

| Name | Category | Backend | Frontend |
|------|----------|---------|----------|
| **Greeting Speaker** | Devtools | ✅ | ✅ TSX |
| **Image Upscaler** | Multimedia | ✅ | ✅ TSX |
| **Color Picker** | Devtools | ✅ | ✅ HTML |
| **Text Formatter** | Office | ✅ | ✅ HTML |
| **Calculator** | Utilities | ✅ | ✅ HTML |
| **Advanced Calculator** | Utilities | ✅ | ✅ HTML |

### **Database Paths (Relative!)**

```python
# Example: Greeting Speaker
{
  "name": "Greeting Speaker",
  "slug": "greeting-speaker",
  "category": "Devtools",
  "tool_type": "dual",
  "backend_path": "backend/sample_tools/devtools/greeting-speaker/backend/main.py",   # ✅ Relative!
  "frontend_path": "backend/frontend_tools/greeting-speaker/GreetingSpeaker.tsx"       # ✅ Relative!
}
```

**⚠️ CRITICAL:** Paths dalam database HARUS relative, bukan absolute!

---

## 🔌 Vite Configuration

### **Electron Mode** (`vite.config.ts`)

```typescript
export default defineConfig({
  server: {
    fs: {
      strict: false,  // Allow universal paths
      allow: [
        path.resolve(__dirname, '.'),         // Project root
        path.resolve(__dirname, 'backend'),   // Allow backend/frontend_tools
      ]
    },
    watch: {
      ignored: [
        '**/backend/!(frontend_tools)/**',    // Ignore backend except frontend_tools
      ]
    }
  }
})
```

### **Web Mode** (`vite.config.web.ts`)

Same config as Electron mode.

**Why `backend` allowed?**
- Vite needs to import from `backend/frontend_tools/`
- Other backend files (`sample_tools/`, `.py` files) are ignored

---

## 👨‍💻 Developer Workflow

### **Creating a New Tool**

#### **Option A: Via UI Upload**

1. Click "Upload Tool" button
2. Choose upload method:
   - Dual File: Select `backend.py` + `frontend.tsx`
   - ZIP: Select `my-tool.zip`
3. Fill in:
   - Name: "My Awesome Tool"
   - Category: "Utilities"
   - Description: "Does awesome things"
4. Click Upload
5. Done! Tool auto-deployed!

#### **Option B: Manual Creation**

**Step 1: Create Backend**

```bash
# Create folder structure
mkdir -p backend/sample_tools/utilities/my-tool/backend
```

```python
# backend/sample_tools/utilities/my-tool/backend/main.py
from fastapi import FastAPI

app = FastAPI()

@app.get("/")
async def root():
    return {"name": "My Tool", "version": "1.0.0"}

@app.post("/process")
async def process(data: dict):
    # Your logic here
    return {"result": "success", "data": data}
```

**Step 2: Create Frontend**

```bash
# Create folder
mkdir -p backend/frontend_tools/my-tool
```

```tsx
// backend/frontend_tools/my-tool/MyTool.tsx
import React, { useState } from 'react'
import { Upload, Download } from 'lucide-react'  // ✅ Works!

const MyTool: React.FC<{ toolId: string }> = ({ toolId }) => {
  const [result, setResult] = useState(null)
  
  const handleProcess = async () => {
    const response = await fetch(`/api/tools/${toolId}/process`, {
      method: 'POST',
      body: JSON.stringify({ data: 'test' })
    })
    setResult(await response.json())
  }
  
  return (
    <div className="p-6">  {/* ✅ Tailwind works! */}
      <h1 className="text-2xl font-bold">My Tool</h1>
      <button 
        onClick={handleProcess}
        className="px-4 py-2 bg-blue-500 text-white rounded"
      >
        <Upload className="w-4 h-4 inline mr-2" />
        Process
      </button>
      {result && <pre>{JSON.stringify(result, null, 2)}</pre>}
    </div>
  )
}

export default MyTool
```

**Step 3: Register in Database**

Use upload API or add manually to database with relative paths:
```python
{
  "name": "My Tool",
  "slug": "my-tool",
  "backend_path": "backend/sample_tools/utilities/my-tool/backend/main.py",
  "frontend_path": "backend/frontend_tools/my-tool/MyTool.tsx"
}
```

**Step 4: Restart Backend**

```bash
# Auto-mounts new tool
sudo supervisorctl restart backend
```

Done! Tool is live! 🚀

---

## 🐛 Troubleshooting

### **Problem: Tool Not Found**

**Symptom:**
```
❌ No matching component found for tool: My Tool
💡 Available components: []
```

**Solutions:**
1. ✅ Check file exists: `backend/frontend_tools/my-tool/MyTool.tsx`
2. ✅ Check filename matches PascalCase convention
3. ✅ Restart frontend to refresh glob cache
4. ✅ Check vite config allows `backend/` imports

---

### **Problem: 403 Forbidden**

**Symptom:**
```
The request url ".../backend/frontend_tools/..." is outside of Vite serving allow list
```

**Solution:**
Update `vite.config.ts`:
```typescript
server: {
  fs: {
    allow: [
      path.resolve(__dirname, 'backend')  // ← Add this!
    ]
  }
}
```

---

### **Problem: Backend Not Mounted**

**Symptom:**
```
⚠️ Tool 'My Tool': Backend file not found at ...
```

**Solutions:**
1. ✅ Check backend file exists at path in database
2. ✅ Check path is RELATIVE (not absolute `/app/...`)
3. ✅ Check file is named `main.py`
4. ✅ Restart backend: `sudo supervisorctl restart backend`

---

### **Problem: API Returns HTML**

**Symptom:**
```
SyntaxError: Unexpected token '<', "<!DOCTYPE "... is not valid JSON
```

**Root Cause:** Backend not mounted, so request goes to fallback HTML page.

**Solution:**
1. Check backend logs for mounting errors
2. Fix backend file path in database
3. Restart backend

---

## 📝 Database Schema

### **Tools Collection**

```python
{
  "_id": str,                    # UUID or slug
  "name": str,                   # "Greeting Speaker"
  "slug": str,                   # "greeting-speaker"
  "description": str,
  "category": str,               # "Devtools"
  "tool_type": "dual",           # Always "dual" (backend + frontend)
  "version": str,                # "1.0.0"
  "author": str,
  
  # ⚠️ MUST be RELATIVE paths!
  "backend_path": str,           # "backend/sample_tools/devtools/greeting-speaker/backend/main.py"
  "frontend_path": str,          # "backend/frontend_tools/greeting-speaker/GreetingSpeaker.tsx"
  
  "dependencies": list[str],
  "status": "active" | "disabled",
  "created_at": str,             # ISO datetime
  "updated_at": str,
  "last_validated": str
}
```

---

## 🎯 Best Practices

### **1. Universal Paths**
✅ Always use relative paths  
❌ Never hardcode `/app/`, `/home/`, `C:\`

### **2. Naming Conventions**
✅ Tool Name: "My Awesome Tool"  
✅ Slug: `my-awesome-tool`  
✅ Component: `MyAwesomeTool.tsx`  
✅ Backend file: `main.py`

### **3. File Organization**
✅ Backend: Organized by category  
✅ Frontend: Flat by slug  
✅ One backend file per tool  
✅ One frontend file per tool

### **4. Dependencies**
✅ Backend: FastAPI, any Python packages  
✅ Frontend: Full access to lucide-react, Tailwind, TypeScript

### **5. Testing**
✅ Backend: Test with curl or Postman  
✅ Frontend: Test in browser  
✅ Full E2E: Use testing agent

---

## 📚 Quick Reference

### **Key Files**

| File | Purpose |
|------|---------|
| `src/lib/toolLoader.tsx` | Auto-discovery system |
| `vite.config.ts` | Vite config (Electron) |
| `vite.config.web.ts` | Vite config (web preview) |
| `backend/server.py` | Backend mounting logic |
| `backend/database.py` | Database operations |

### **Key Paths (Relative!)**

| Purpose | Path |
|---------|------|
| Backend tools | `backend/sample_tools/{category}/{slug}/backend/main.py` |
| Frontend tools | `backend/frontend_tools/{slug}/{ComponentName}.tsx` |
| Tool loader | `src/lib/toolLoader.tsx` |

### **Commands**

```bash
# Restart services
sudo supervisorctl restart backend
sudo supervisorctl restart frontend

# Check logs
tail -f /var/log/supervisor/backend.err.log
tail -f /var/log/supervisor/frontend.err.log

# Verify structure
tree backend/sample_tools/
tree backend/frontend_tools/
```

---

## 🎉 Summary

**ChimeraAI Dynamic Tools System:**

✅ **Universal** - Works on any OS  
✅ **Auto-Discovery** - Zero manual config  
✅ **Clean Separation** - Organized structure  
✅ **Slug-based** - Human-readable names  
✅ **Full Dependencies** - lucide-react, Tailwind, TypeScript  
✅ **Production Ready** - 6 active tools running

**Structure:**
- Backend: `backend/sample_tools/{category}/{slug}/backend/main.py`
- Frontend: `backend/frontend_tools/{slug}/{ComponentName}.tsx`
- Database: Relative paths only!

**Upload:** Dual-file or ZIP → Auto-deployed!

---

**Created:** December 2025  
**Status:** ✅ PRODUCTION READY  
**Maintained By:** ChimeraAI Team
