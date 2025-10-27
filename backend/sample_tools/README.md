# 📂 Sample Tools - Organized Structure

**Last Updated:** October 27, 2025  
**Version:** 2.0 (Organized Structure)

## 🎯 Overview

Sample tools are now organized in a **self-contained folder structure** where each tool has its own directory with backend and frontend components.

## 📁 Structure

```
sample_tools/
├── {category}/
│   └── {tool-slug}/
│       ├── backend/
│       │   └── main.py          ← Backend API (FastAPI)
│       └── frontend/            ← Optional (for dual tools)
│           └── Component.tsx|html
```

### Categories:
- **converters** - Data conversion tools
- **devtools** - Development utilities
- **multimedia** - Image/video processing
- **office** - Document & text tools
- **utilities** - General purpose tools

## 📊 Current Tools

### Converters (3 tools - Single)
- **csv-to-json** - Convert CSV files to JSON format
- **json-formatter** - Format and validate JSON
- **text-counter** - Count words, characters, lines

### DevTools (2 tools - Dual)
- **color-picker** - Convert colors (HEX, RGB, HSL)
- **greeting-speaker** - Text-to-speech greetings

### Multimedia (1 tool - Dual)
- **image-upscaler** - Upscale images with AI (2x/4x/8x)

### Office (1 tool - Dual)
- **text-formatter** - Transform text (uppercase, lowercase, etc)

### Utilities (2 tools - Dual)
- **calculator** - Basic arithmetic operations
- **advanced-calculator** - Scientific calculator

**Total: 9 tools (6 dual + 3 single)**

## 🚀 Usage

### Load Sample Tools to Database

```bash
cd /app/backend
python reset_and_load_samples_v2.py
```

This will:
1. Reset the tools database
2. Scan `sample_tools/` directory
3. Auto-detect single vs dual tools
4. Load all tools to database
5. Deploy to `/app/backend/tools/` and `/app/backend/frontend_tools/`

### Migrate Flat Structure to Organized

If you have old flat structure:

```bash
cd /app/backend
python migrate_sample_tools.py --dry-run  # Preview changes
python migrate_sample_tools.py            # Execute migration
```

## 📝 Creating New Sample Tools

### Step 1: Create Folder Structure

```bash
cd /app/backend/sample_tools

# For dual tool (backend + frontend)
mkdir -p {category}/{tool-slug}/backend
mkdir -p {category}/{tool-slug}/frontend

# For single tool (backend only)
mkdir -p {category}/{tool-slug}/backend
```

### Step 2: Create Backend (main.py)

```python
# /app/backend/sample_tools/{category}/{tool-slug}/backend/main.py

# CATEGORY: YourCategory
# NAME: Your Tool Name
# DESCRIPTION: What this tool does
# VERSION: 1.0.0
# AUTHOR: Your Name

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

@app.post("/process")
async def process_data(data: dict):
    """Process data and return result"""
    try:
        # Your logic here
        result = {"success": True, "data": data}
        return result
    except Exception as e:
        raise HTTPException(500, str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8002)
```

### Step 3: Create Frontend (Optional for Dual Tools)

**For React/TSX:**

```tsx
// /app/backend/sample_tools/{category}/{tool-slug}/frontend/YourTool.tsx

import React, { useState } from 'react'
import { Upload, Download } from 'lucide-react'

interface YourToolProps {
  toolId: string
  toolData?: any
}

const YourTool: React.FC<YourToolProps> = ({ toolId }) => {
  const [result, setResult] = useState(null)
  
  const handleProcess = async () => {
    const response = await fetch(`/api/tools/${toolId}/process`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ data: 'your data' })
    })
    const data = await response.json()
    setResult(data)
  }
  
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">Your Tool</h1>
      <button onClick={handleProcess} className="btn-primary">
        Process
      </button>
    </div>
  )
}

export default YourTool
```

**For HTML:**

```html
<!-- /app/backend/sample_tools/{category}/{tool-slug}/frontend/YourTool.html -->

<!DOCTYPE html>
<html>
<head>
    <title>Your Tool</title>
    <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-gray-50">
    <div class="container mx-auto p-6">
        <h1 class="text-2xl font-bold mb-4">Your Tool</h1>
        <button onclick="processData()" class="bg-blue-500 text-white px-4 py-2 rounded">
            Process
        </button>
        <div id="result" class="mt-4"></div>
    </div>
    
    <script>
        const TOOL_ID = '{{TOOL_ID}}';  // Will be replaced by backend
        
        async function processData() {
            const response = await fetch(`/api/tools/${TOOL_ID}/process`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ data: 'your data' })
            });
            const data = await response.json();
            document.getElementById('result').textContent = JSON.stringify(data, null, 2);
        }
    </script>
</body>
</html>
```

### Step 4: Load to Database

```bash
cd /app/backend
python reset_and_load_samples_v2.py
```

## 🔍 Validation

The loading script automatically validates:

### Backend Validation:
- ✅ Python syntax check (AST parsing)
- ✅ Code compilation test
- ✅ File exists and readable

### Frontend Validation:
- ✅ HTML: Basic structure, balanced tags
- ✅ TSX/JSX: React imports, export statements
- ✅ File exists and readable

## 📋 Naming Conventions

### Slug Format:
- **Lowercase only**
- **Dashes for spaces**: `my-tool` not `my_tool` or `MyTool`
- **No special chars**: Only alphanumeric + dashes
- **Examples:**
  - "Image Upscaler" → `image-upscaler`
  - "CSV to JSON" → `csv-to-json`
  - "Text Counter Pro" → `text-counter-pro`

### Component Names (Frontend):
- **PascalCase**: `ImageUpscaler.tsx`
- **Match slug**: `image-upscaler` → `ImageUpscaler`
- **Extensions**: `.tsx`, `.jsx`, `.html`, `.js`

### Backend Files:
- **Always**: `main.py`
- **Location**: `backend/main.py`

## 🔧 File Locations After Loading

When loaded to database, files are deployed to:

```
/app/backend/
├── tools/{category}/{uuid}.py               ← Backend files
└── frontend_tools/{category}/{uuid}.tsx     ← Frontend files (if dual)
```

The UUID ensures no conflicts between tools.

## 🚨 Troubleshooting

### Tool Not Loading?

1. **Check structure:**
   ```bash
   tree sample_tools/{category}/{tool-slug}
   ```
   
2. **Validate manually:**
   ```bash
   python -m py_compile sample_tools/{category}/{tool-slug}/backend/main.py
   ```

3. **Check logs:**
   ```bash
   cat /app/backend/migration_report.json
   ```

### Validation Errors?

- **Backend syntax error**: Check Python syntax
- **Frontend missing**: Dual tool needs frontend/
- **File not found**: Check paths and filenames

## 📦 Migration from Old Structure

Old flat structure is automatically backed up to:
```
/app/backend/sample_tools_backup/
```

You can restore if needed:
```bash
rm -rf sample_tools/
mv sample_tools_backup/ sample_tools/
```

## 🎯 Next Steps

After Priority 1 completion:
- ✅ Folder structure organized
- ✅ Validation system working
- ✅ Database supports single tools
- ⏭️ **Priority 2**: ZIP upload system

## 📚 Related Documentation

- `/app/docs/TOOLS_ROADMAP.md` - Complete tools system guide
- `/app/docs/golden-rules.md` - Project guidelines
- `/app/backend/reset_and_load_samples_v2.py` - Loading script
- `/app/backend/migrate_sample_tools.py` - Migration script

---

**Status:** ✅ Production Ready  
**Version:** 2.0 - Organized Structure  
**Last Migration:** October 27, 2025
