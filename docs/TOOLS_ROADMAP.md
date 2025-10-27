# 🛠️ ChimeraAI Dynamic Tools System - Complete Guide

**Last Updated:** October 27, 2025  
**Status:** ✅ Production Ready - Auto-Discovery System + Slugified Upload

---

## 📋 Table of Contents

1. [System Overview](#system-overview)
2. [Architecture](#architecture)
3. [Recent Updates](#recent-updates)
4. [Developer Workflow](#developer-workflow)
5. [Tool Components](#tool-components)
6. [API Integration](#api-integration)
7. [Troubleshooting](#troubleshooting)
8. [Roadmap](#roadmap)

---

## 🎯 System Overview

### **What is the Dynamic Tools System?**

ChimeraAI menggunakan **Auto-Discovery Tool System** yang memungkinkan tools di-load sebagai **native React components** dengan full access ke dependencies utama (lucide-react, Tailwind CSS, TypeScript).

### **Key Features:**

✅ **Auto-Discovery** - No manual registration needed!  
✅ **Full Dependencies** - lucide-react, Tailwind CSS, TypeScript  
✅ **Hot Reload** - Save file = instant update  
✅ **Code Splitting** - Each tool = separate chunk  
✅ **Lazy Loading** - Tools load only when needed  
✅ **Scalable** - Add 1000 tools without code changes!
✅ **Slugified Naming** - Human-readable file names (NEW!)
✅ **Smart Overwrite** - Prevent accidental file replacement (NEW!)

### **Before vs After:**

| Aspect | Before (Iframe) | After (Native Components) |
|--------|----------------|---------------------------|
| **Icons** | Manual SVG (500+ lines) | Import from lucide-react (1 line!) |
| **Tailwind** | Limited CDN version | Full main app config |
| **TypeScript** | ❌ Not available | ✅ Full type safety |
| **Performance** | Iframe overhead | Native React rendering |
| **Scalability** | Manual registration | Auto-discovery |
| **Hot Reload** | ❌ Doesn't work | ✅ Works perfectly |
| **File Names** | Random UUID | Human-readable slugs |

---

## 🆕 Recent Updates

### **✅ October 27, 2025 - Slugified Upload System**

#### **1. Slugified File Naming**

**Before:**
```
Random UUID: a1b2c3d4-e5f6-7890.py
Frontend:    a1b2c3d4-e5f6-7890.tsx
```

**After:**
```
Human-readable: sapaan-login.py
Frontend:       sapaan-login.tsx
```

**Slug Rules:**
- Lowercase everything
- Spaces → dashes (-)
- Remove special characters: `()!@#$%^&*`
- Keep: alphanumeric & dashes
- Examples:
  - "Sapaan Login" → `sapaan-login`
  - "CSV Converter Pro!" → `csv-converter-pro`
  - "My Tool (Beta)" → `my-tool-beta`

#### **2. Real-time Name Checking**

**Feature:** Cek nama tool saat user mengetik (debounce 500ms)

**UI Indicators:**
- ✅ **Green badge** - Name available, shows slug preview
- ⚠️ **Yellow badge** - Name already exists, warning
- 🔄 **Spinner** - Checking in progress

**API Endpoint:**
```
GET /api/tools/check-name?name=Sapaan Login

Response:
{
  "exists": false,
  "slug": "sapaan-login",
  "message": "Name available"
}
```

#### **3. Smart Overwrite Confirmation**

**Feature:** Modal konfirmasi sebelum mengganti file existing

**Confirmation Modal Shows:**
- Tool name & slug yang akan diganti
- Category, version, creation date
- Backend & frontend file paths
- Safety warning dengan warna merah
- Tombol: "Batal" atau "Ganti File"

**API Parameter:**
```
POST /api/tools/upload
{
  ...
  "force_overwrite": true/false
}
```

**Backend Logic:**
1. Check if slug exists
2. If exists & `force_overwrite=false` → Return 409 Conflict
3. If exists & `force_overwrite=true` → Delete old files → Upload new
4. Update database (not insert new record)

#### **Files Changed:**
- ✅ `/app/backend/server.py` - Added slugify(), check-name endpoint, update upload logic
- ✅ `/app/src/components/UploadToolModal.tsx` - Real-time checking, overwrite modal

---

## 🏗️ Architecture

### **How Auto-Discovery Works:**

```typescript
// 1. Vite Glob Import automatically finds all tools
const toolModules = import.meta.glob('../components/tools/dynamic/*.tsx')

// 2. System builds dynamic registry
const DynamicToolRegistry = {
  'GreetingSpeaker': () => import('./GreetingSpeaker'),
  'ImageUpscaler': () => import('./ImageUpscaler'),
  'YourNewTool': () => import('./YourNewTool')  // ← Auto-added!
}

// 3. Smart name matching when tool loads
// Tries: Direct mapping → PascalCase → Fuzzy match
```

### **File Structure:**

```
/app/
├── src/
│   ├── lib/
│   │   └── toolLoader.tsx              # Auto-discovery system
│   │
│   ├── components/tools/dynamic/       # DROP TOOLS HERE! 📥
│   │   ├── GreetingSpeaker.tsx        # Auto-discovered ✅
│   │   ├── ImageUpscaler.tsx          # Auto-discovered ✅
│   │   └── YourNewTool.tsx            # Auto-discovered ✅
│   │
│   └── pages/
│       └── ToolExecutionPage.tsx       # Renders tools dynamically
│
└── backend/
    ├── tools/                          # Backend APIs
    │   ├── utilities/
    │   │   └── greeting_speaker.py
    │   └── multimedia/
    │       └── image_upscaler.py
    │
    └── frontend_tools/                 # Legacy (for reference)
        └── ...
```

### **System Components:**

1. **toolLoader.tsx** - Auto-discovery & dynamic loading
2. **ToolExecutionPage.tsx** - Renders tools (no iframe!)
3. **Tool Components** - Individual React components
4. **Backend APIs** - FastAPI endpoints per tool

---

## 👨‍💻 Developer Workflow

### **Creating a New Tool (3 Steps!):**

#### **Step 1: Create Component File**

```bash
# Just create file in the right location:
touch /app/src/components/tools/dynamic/YourToolName.tsx
```

#### **Step 2: Write Component**

```typescript
import React, { useState } from 'react'
import { Upload, Download, CheckCircle } from 'lucide-react'  // ← Real icons!

interface YourToolProps {
  toolId: string
  toolData?: any
}

const YourToolName: React.FC<YourToolProps> = ({ toolId }) => {
  const [state, setState] = useState(initialState)
  
  // Call backend API
  const handleAction = async () => {
    const response = await fetch(`http://localhost:8001/tools/${toolId}/endpoint`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ data })
    })
    const result = await response.json()
    setState(result)
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800">
      {/* Full Tailwind CSS works! */}
      <div className="max-w-6xl mx-auto px-6 py-12">
        <div className="bg-white dark:bg-dark-surface rounded-xl shadow-lg p-6">
          <div className="flex items-center space-x-3 mb-4">
            <Upload className="w-8 h-8 text-primary" />  {/* Real lucide-react! */}
            <h1 className="text-2xl font-bold dark:text-white">Your Tool</h1>
          </div>
          
          <button
            onClick={handleAction}
            className="px-6 py-3 bg-primary hover:bg-secondary text-white rounded-lg
                       transform hover:scale-105 transition-all shadow-lg"
          >
            <CheckCircle className="w-5 h-5 inline-block mr-2" />
            Do Action
          </button>
        </div>
      </div>
    </div>
  )
}

export default YourToolName
```

#### **Step 3: Done!** 🎉

Tool automatically discovered and ready to use!

### **Naming Convention:**

**Best Practice:** Match tool name to component filename (PascalCase)

| Tool Display Name | Component Filename | Auto-Match? |
|-------------------|-------------------|-------------|
| "Image Upscaler" | `ImageUpscaler.tsx` | ✅ Yes |
| "PDF Converter" | `PDFConverter.tsx` | ✅ Yes |
| "Background Remover" | `BackgroundRemover.tsx` | ✅ Yes |

**If names don't match**, add to ToolNameMappings:

```typescript
// In /app/src/lib/toolLoader.tsx
const ToolNameMappings = {
  'Sapaan Login/Shutdown': 'GreetingSpeaker',  // Special chars
  'Your Display Name': 'ComponentFileName',
}
```

This is the **ONLY place** you might need to edit!

---

## 🧩 Tool Components

### **Available Tools:**

#### 1. **Sapaan Login/Shutdown** 🔊
**File:** `/app/src/components/tools/dynamic/GreetingSpeaker.tsx`  
**Backend:** `/app/backend/tools/utilities/greeting_speaker.py`

**Features:**
- ✅ Automatic greeting on login
- ✅ Shutdown greetings
- ✅ 25+ variations in Indonesian
- ✅ Time-based (morning/afternoon/evening/night)
- ✅ espeak text-to-speech integration

**Dependencies:**
```bash
# System dependency
sudo apt-get install espeak
```

**API Endpoints:**
- `GET /tools/{toolId}/check-espeak` - Check espeak availability
- `GET /tools/{toolId}/greetings/{type}` - Get greeting text
- `POST /tools/{toolId}/speak` - Speak greeting

**Icons Used:** `Volume2`, `Sunrise`, `Power` (lucide-react)

---

#### 2. **Image Scaling Tool (4K Upscaler)** 🎨
**File:** `/app/src/components/tools/dynamic/ImageUpscaler.tsx`  
**Backend:** `/app/backend/tools/multimedia/image_upscaler.py`

**Features:**
- ✅ Image upscaling (PNG, JPG, GIF, BMP, WebP) - 2x/3x/4x/8x
- ✅ Video upscaling (MP4, AVI, MOV, MKV) - 2x
- ✅ GPU acceleration with PyTorch
- ✅ CPU fallback
- ✅ Progress tracking
- ✅ Auto-cleanup (24 hours)

**Dependencies:**
```bash
# Python dependencies
pip install torch==2.7.1 torchvision opencv-python Pillow numpy
```

**API Endpoints:**
- `GET /tools/{toolId}/status` - Get system status (GPU/CPU)
- `POST /tools/{toolId}/upscale` - Upload & upscale file
- `GET /tools/{toolId}/download/{filename}` - Download result
- `DELETE /tools/{toolId}/cleanup/{file_id}` - Clean up files

**Icons Used:** `Upload`, `Download`, `Image`, `Film`, `Cpu`, `Zap`, `CheckCircle`, `XCircle`, `Trash2`, `RefreshCw`, `ArrowUp` (lucide-react)

---

## 🔌 API Integration

### **Backend Structure:**

Each tool consists of:
1. **Backend API** (FastAPI) - `/app/backend/tools/{category}/{tool_name}.py`
2. **Frontend Component** (React TSX) - `/app/src/components/tools/dynamic/{ComponentName}.tsx`

### **Backend Template:**

```python
# /app/backend/tools/category/your_tool.py

# CATEGORY: YourCategory
# NAME: Your Tool Name
# DESCRIPTION: Tool description
# VERSION: 1.0.0
# AUTHOR: ChimeraAI Team

from fastapi import FastAPI, HTTPException
from fastapi.responses import JSONResponse

app = FastAPI()

@app.get("/")
async def root():
    return {
        "name": "Your Tool Name",
        "version": "1.0.0",
        "description": "Tool description"
    }

@app.get("/status")
async def get_status():
    """Get tool status"""
    return {"status": "ready"}

@app.post("/action")
async def perform_action(data: dict):
    """Perform tool action"""
    try:
        # Your logic here
        result = process_data(data)
        return {"success": True, "result": result}
    except Exception as e:
        raise HTTPException(500, str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8002)
```

### **Calling Backend from Frontend:**

```typescript
// In your tool component:
const callBackend = async () => {
  try {
    const response = await fetch(
      `http://localhost:8001/tools/${toolId}/endpoint`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ your: 'data' })
      }
    )
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }
    
    const data = await response.json()
    return data
  } catch (error) {
    console.error('Backend call failed:', error)
    throw error
  }
}
```

### **Tool Registration (Backend Database):**

Tools are registered via backend API:

```bash
curl -X POST "http://localhost:8001/api/tools/upload" \
  -F "backend_file=@/app/backend/tools/category/your_tool.py" \
  -F "frontend_file=@/app/backend/frontend_tools/category/your_tool.tsx" \
  -F "name=Your Tool Name" \
  -F "description=Tool description" \
  -F "category=YourCategory" \
  -F "version=1.0.0" \
  -F "author=ChimeraAI Team"

# Reload routers to mount tool
curl -X POST http://localhost:8001/api/tools/reload-routers
```

**Note:** Frontend component should be in `/app/src/components/tools/dynamic/` for auto-discovery!

---

## 🎨 Full Features Guide

### **1. Lucide React Icons**

All 1000+ icons available:

```typescript
import { 
  // Common
  Upload, Download, Trash2, RefreshCw, Check, X,
  // Status
  CheckCircle, XCircle, AlertCircle, Info,
  // Actions
  Plus, Minus, Edit, Save, Settings,
  // Media
  Image, Film, Music, Video,
  // ... and 1000+ more!
} from 'lucide-react'

// Use directly:
<Upload className="w-6 h-6 text-primary" />
<CheckCircle className="w-5 h-5 text-green-500" />
```

### **2. Tailwind CSS Classes**

Full Tailwind config from main app:

```typescript
// Colors
className="bg-primary text-white"
className="text-secondary"
className="bg-dark-surface dark:bg-dark-background"

// Gradients
className="bg-gradient-to-r from-blue-500 to-purple-500"
className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50"

// Dark Mode
className="bg-white dark:bg-dark-surface"
className="text-gray-800 dark:text-gray-200"

// Animations
className="animate-spin"
className="animate-pulse"
className="hover:scale-105 transition-all"

// Responsive
className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
className="px-4 sm:px-6 lg:px-8"

// Shadows & Effects
className="shadow-lg hover:shadow-xl"
className="rounded-xl border border-gray-200"
```

### **3. TypeScript Support**

Full type safety:

```typescript
interface ToolProps {
  toolId: string
  toolData?: any
}

interface State {
  loading: boolean
  result: Result | null
  error: string | null
}

interface APIResponse {
  success: boolean
  data?: any
  error?: string
}

// All autocomplete & type checking works!
```

### **4. React Hooks & Libraries**

```typescript
import { useState, useEffect, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'

// All available from main app!
```

---

## 🐛 Troubleshooting

### **Issue: Tool Not Found**

**Console shows:**
```
❌ No matching component found for tool: Your Tool Name
💡 Available components: ['GreetingSpeaker', 'ImageUpscaler']
```

**Solutions:**
1. ✅ Verify file is in `/app/src/components/tools/dynamic/`
2. ✅ Check component exports `export default YourTool`
3. ✅ Try renaming file to match tool name (PascalCase)
4. ✅ Add mapping to `ToolNameMappings` in `toolLoader.tsx`

### **Issue: Icons Not Showing**

**Solutions:**
1. ✅ Verify import: `import { IconName } from 'lucide-react'`
2. ✅ Check spelling (case-sensitive!)
3. ✅ Ensure lucide-react installed: `yarn list lucide-react`

### **Issue: Tailwind Classes Not Working**

**Solutions:**
1. ✅ Check for typos in class names
2. ✅ Verify dark mode classes: `dark:bg-dark-surface`
3. ✅ Clear Vite cache: `rm -rf node_modules/.vite`
4. ✅ Restart dev server

### **Issue: Backend API Fails**

**Solutions:**
1. ✅ Check backend running: `sudo supervisorctl status backend`
2. ✅ Verify tool mounted: Check backend logs
3. ✅ Test endpoint: `curl http://localhost:8001/tools/{toolId}/`
4. ✅ Check CORS settings in backend

### **Issue: Hot Reload Not Working**

**Solutions:**
1. ✅ Check file saved properly
2. ✅ Verify file in correct directory
3. ✅ Restart Vite: `sudo supervisorctl restart frontend`
4. ✅ Check browser console for errors

---

## 🚀 Roadmap

### **✅ Completed Features:**

- [x] Dynamic tool loading system
- [x] Auto-discovery with Vite glob import
- [x] Native React component rendering (no iframe)
- [x] Full lucide-react integration
- [x] Full Tailwind CSS support
- [x] TypeScript type safety
- [x] Error boundary & loading states
- [x] Smart name matching
- [x] Code splitting per tool
- [x] Hot reload support
- [x] Converted 2 tools (Greeting Speaker, Image Upscaler)
- [x] **Slugified file naming** (October 27, 2025)
- [x] **Real-time name checking** (October 27, 2025)
- [x] **Smart overwrite confirmation** (October 27, 2025)

---

## 🚀 Next Phase: Folder Structure & Zip Upload System

### **📋 Phase Goals:**

Restructure tools system untuk organized folder structure dan ZIP upload untuk kemudahan deployment.

### **🎯 Priority 1: Folder Structure Reorganization**

#### **Current Structure (FLAT):**
```
/app/backend/tools/
├── office/
│   ├── calculator.py          ❌ Flat
│   └── text-formatter.py      ❌ Flat
└── devtools/
    ├── greeting-speaker.py    ❌ Flat
    └── image-upscaler.py      ❌ Flat

/app/backend/frontend_tools/
├── office/
│   ├── calculator.tsx         ❌ Separated
│   └── text-formatter.tsx     ❌ Separated
```

#### **Target Structure (ORGANIZED):**
```
/app/backend/tools/
├── office/
│   ├── calculator/
│   │   ├── backend/
│   │   │   └── main.py        ✅ Python backend
│   │   └── frontend/
│   │       └── Calculator.tsx  ✅ React frontend
│   │
│   └── text-formatter/
│       ├── backend/
│       │   └── main.py
│       └── frontend/
│           └── TextFormatter.tsx
│
└── devtools/
    ├── greeting-speaker/
    │   ├── backend/
    │   │   └── main.py
    │   └── frontend/
    │       └── GreetingSpeaker.tsx
    │
    └── image-upscaler/
        ├── backend/
        │   └── main.py
        └── frontend/
            └── ImageUpscaler.tsx
```

#### **Benefits:**
✅ **Self-contained** - Each tool = 1 folder with backend + frontend  
✅ **Easy backup** - Zip 1 folder = complete tool  
✅ **Clear organization** - No confusion between backend/frontend  
✅ **Scalable** - Easy to add configs, tests, docs per tool  
✅ **Version control** - Git-friendly structure

#### **Migration Tasks:**
- [ ] Create migration script to restructure existing tools
- [ ] Update `database.py` to handle new path structure
- [ ] Update `server.py` to serve from new structure
- [ ] Update frontend `toolLoader.tsx` to load from new paths
- [ ] Migrate sample_tools to new structure
- [ ] Test all existing tools after migration
- [ ] Update documentation with new structure

---

### **🎯 Priority 2: ZIP Upload System**

#### **Current Upload (DUAL FILES):**
```
User selects:
- backend_file.py
- frontend_file.tsx

Issues:
❌ Manual selection of 2 files
❌ Easy to mismatch files
❌ No folder structure preservation
❌ No additional files (configs, assets)
```

#### **Target Upload (ZIP ARCHIVE):**
```
User uploads:
- my-tool.zip

ZIP Structure:
my-tool.zip
├── backend/
│   └── main.py           ← Must exist
└── frontend/
    └── MyTool.tsx        ← Must exist

Auto-extraction:
1. Unzip to temp folder
2. Validate structure
3. Check: backend/main.py exists
4. Check: frontend/*.tsx exists (exactly 1 file)
5. Move to: /app/backend/tools/{category}/{slug}/
6. Update database
7. Clean temp files
```

#### **Validation Rules:**

**Mandatory:**
- ✅ Must have `backend/` folder
- ✅ Must have `frontend/` folder
- ✅ `backend/` must contain exactly **1 Python file** (.py)
- ✅ `frontend/` must contain exactly **1 file** (.tsx, .jsx, .html, .js)
- ✅ Python file must have valid syntax
- ✅ Frontend file must have valid syntax
- ✅ No duplicate file names in same type

**Optional (Future):**
- Config files: `backend/config.json`, `frontend/config.json`
- Requirements: `backend/requirements.txt`
- Assets: `frontend/assets/`
- Documentation: `README.md`

#### **Upload Flow:**

```
1. User clicks "Upload Tool"
2. Modal: "Drop ZIP file or click to browse"
3. User selects my-tool.zip
4. Real-time name extraction from ZIP
5. Check name availability (existing logic)
6. If exists → Show overwrite confirmation
7. Upload ZIP to backend
8. Backend:
   - Unzip to /tmp/tool-{uuid}/
   - Validate structure
   - Count files: backend/*.py (must be 1), frontend/*.tsx (must be 1)
   - If validation fails → Return error + details
   - If validation OK:
     - Generate slug from tool name
     - Move to /app/backend/tools/{category}/{slug}/
     - Update database with new paths
     - Clean temp files
9. Success → Show slug preview → Reload tools list
```

#### **API Changes:**

**New Endpoint:**
```python
@app.post("/api/tools/upload-zip")
async def upload_tool_zip(
    file: UploadFile = File(...),
    name: str = Form(...),
    description: str = Form(...),
    category: str = Form(...),
    version: str = Form("1.0.0"),
    author: str = Form("Anonymous"),
    force_overwrite: bool = Form(False)
):
    """
    Upload tool as ZIP archive
    
    ZIP Structure:
    - tool-name.zip
      ├── backend/
      │   └── main.py (exactly 1 .py file)
      └── frontend/
          └── ToolName.tsx (exactly 1 .tsx/.jsx/.html/.js file)
    """
```

**Validation Response:**
```json
{
  "success": false,
  "errors": [
    "backend/ folder not found",
    "frontend/ folder contains 2 files, expected exactly 1",
    "backend/main.py has syntax errors: Line 10..."
  ]
}
```

#### **Frontend Changes:**

**UploadToolModal.tsx Updates:**
- Change file input to accept `.zip` only
- Remove dual file selection
- Add ZIP preview with file tree
- Show extracted structure before upload
- Validation indicators per file

**UI Mockup:**
```
┌─────────────────────────────────────┐
│  📦 Upload Tool (ZIP Archive)       │
├─────────────────────────────────────┤
│                                     │
│  [Drop ZIP file or click to browse]│
│                                     │
│  Selected: my-tool.zip (23.4 KB)   │
│                                     │
│  📂 Archive Contents:               │
│  ├── 📁 backend/                    │
│  │   └── ✅ main.py                 │
│  └── 📁 frontend/                   │
│      └── ✅ MyTool.tsx               │
│                                     │
│  Tool Name: My Tool                 │
│  Slug: my-tool ✅ Available         │
│                                     │
│  Category: [DevTools ▼]            │
│  Version: 1.0.0                     │
│  Author: Your Name                  │
│                                     │
│  [Cancel]  [Upload Tool]           │
└─────────────────────────────────────┘
```

#### **Implementation Tasks:**
- [ ] Backend: Add ZIP handling library (e.g., `zipfile`)
- [ ] Backend: Create `/api/tools/upload-zip` endpoint
- [ ] Backend: Implement ZIP extraction & validation
- [ ] Backend: Update file counting logic (exactly 1 per type)
- [ ] Backend: Implement folder structure creation
- [ ] Frontend: Update UploadToolModal for ZIP input
- [ ] Frontend: Add ZIP file preview component
- [ ] Frontend: Show file tree from ZIP
- [ ] Frontend: Update validation UI for ZIP structure
- [ ] Testing: Create sample ZIP files
- [ ] Testing: Test validation errors
- [ ] Testing: Test overwrite with ZIP
- [ ] Documentation: Create ZIP structure guide
- [ ] Documentation: Update upload workflow

#### **Sample ZIP Templates:**

Create downloadable templates:
```
📦 tool-template-basic.zip
├── backend/
│   └── main.py (with boilerplate)
└── frontend/
    └── ToolName.tsx (with boilerplate)

📦 tool-template-advanced.zip
├── backend/
│   ├── main.py
│   ├── config.json
│   └── requirements.txt
├── frontend/
│   ├── ToolName.tsx
│   └── assets/
│       └── icon.png
└── README.md
```

---

### **📋 Backlog - Future Tools:**

#### **Priority: HIGH**
- [ ] Audio Processing Tool 🎵
- [ ] Document Converter 📄
- [ ] Video Editor 🎬

#### **Priority: MEDIUM**
- [ ] Code Formatter 💻
- [ ] QR Code Generator 📱
- [ ] Background Remover 🖼️

#### **Priority: LOW**
- [ ] Text-to-Speech 🔊
- [ ] File Compressor 📦

### **🔮 Future Enhancements:**

- [ ] Tool marketplace UI
- [ ] Tool rating & reviews
- [ ] CLI tool generator
- [ ] Auto-generate TypeScript types from backend
- [ ] Performance monitoring per tool

---

## 📚 Quick Reference

### **File Locations:**

```bash
# Tool Components (Frontend)
/app/src/components/tools/dynamic/{ToolName}.tsx

# Tool APIs (Backend)
/app/backend/tools/{category}/{tool_name}.py

# Auto-Discovery System
/app/src/lib/toolLoader.tsx

# Documentation
/app/docs/TOOLS_ROADMAP.md
```

### **Commands:**

```bash
# Check services
sudo supervisorctl status

# Restart services
sudo supervisorctl restart frontend
sudo supervisorctl restart backend

# Check logs
tail -f /var/log/supervisor/frontend.err.log
tail -f /var/log/supervisor/backend.err.log
```

---

## ✨ Summary

**System Status:** 🎯 Production Ready!

**Recent Achievements (October 27, 2025):**
- ✅ Slugified file naming (human-readable)
- ✅ Real-time name checking (debounce 500ms)
- ✅ Smart overwrite confirmation with detailed preview
- ✅ Improved upload UX with validation badges

**System Achievements:**
- ✅ Auto-discovery (zero manual registration!)
- ✅ Full dependencies (lucide-react, Tailwind, TypeScript)
- ✅ Native React rendering (no iframe)
- ✅ Scalable architecture
- ✅ 2 tools converted & working

**Developer Experience:**
- Create file → Auto-discovered → Works! 🎉
- Upload tool → Real-time validation → Safe overwrite! 🔒

**Next Phase:**
- 🚀 Folder structure reorganization (tool-name/backend + frontend)
- 📦 ZIP upload system with auto-extraction
- ✅ Validation: exactly 1 backend + 1 frontend file per tool

---

**Created:** August 26, 2025  
**Last Major Update:** October 27, 2025 (Slugified Upload System)  
**Status:** ✅ Active & Production Ready  
**Maintainer:** ChimeraAI Team
