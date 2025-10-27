# 🎨 Frontend Tools Directory

**Purpose:** Stores all frontend tool components (React TSX/JSX/HTML) separately from main app source code.

## 📁 Structure

```
/app/backend/frontend_tools/
├── {tool-slug}/
│   └── {ComponentName}.tsx   (or .jsx, .html)
│
├── greeting-speaker/
│   └── GreetingSpeaker.tsx
├── image-upscaler/
│   └── ImageUpscaler.tsx
└── calculator/
    └── Calculator.html
```

## ✅ Benefits

1. **Clean Separation**
   - `/app/src/` = Main app code (core components, pages, lib)
   - `/app/backend/frontend_tools/` = Tool components (modular, isolated)

2. **Scalability**
   - 1000 tools won't pollute `/app/src/`
   - Each tool in its own folder (easy to manage/delete)

3. **Upload-Friendly**
   - ZIP upload automatically extracts frontend to this directory
   - Structure: `{tool-slug}/{ComponentName}.tsx`

4. **Full Dependencies Access**
   - Tools can import from `lucide-react` ✅
   - Full Tailwind CSS support ✅
   - All `package.json` dependencies available ✅

## 🔧 How It Works

### 1. Auto-Discovery
```typescript
// /app/src/lib/toolLoader.tsx
const toolModules = import.meta.glob('../../backend/frontend_tools/**/*.tsx')

// Automatically discovers all .tsx files in this directory!
```

### 2. Vite Configuration
```typescript
// /app/vite.config.web.ts
server: {
  fs: {
    allow: [
      'backend/frontend_tools'  // ← Allows imports from here!
    ]
  }
}
```

### 3. Import Example
```typescript
// Tool component can use main app dependencies:
import { Upload, Download } from 'lucide-react'  // ✅ Works!

const MyTool = () => {
  return (
    <div className="bg-primary text-white">  {/* ✅ Tailwind works! */}
      <Upload className="w-6 h-6" />
    </div>
  )
}
```

## 📦 ZIP Upload Integration

When user uploads a tool via ZIP:

```
my-tool.zip
├── backend/
│   └── main.py
└── frontend/
    └── MyTool.tsx

Backend extracts to:
/app/backend/frontend_tools/my-tool/MyTool.tsx  ← Auto-created!
```

## 🎯 Naming Convention

**Slug Format:** `{tool-name}` (lowercase, dash-separated)
- "Greeting Speaker" → `greeting-speaker/`
- "CSV to JSON" → `csv-to-json/`
- "Image Upscaler 4K" → `image-upscaler-4k/`

**Component Name:** PascalCase (matches tool name)
- Tool: "Greeting Speaker" → File: `GreetingSpeaker.tsx`
- Tool: "Image Upscaler" → File: `ImageUpscaler.tsx`

## ⚠️ Important Notes

1. **Do NOT delete this directory** - Required by toolLoader.tsx
2. **Each tool = One folder** - Keep tools isolated
3. **Only frontend files here** - Backend files go to `backend/sample_tools/`
4. **Supported formats:** `.tsx`, `.jsx`, `.html`, `.js`

## 🔄 Migration Path

**Old Structure (DEPRECATED):**
```
/app/src/components/tools/dynamic/
├── GreetingSpeaker.tsx  ❌ Pollutes src/
└── ImageUpscaler.tsx
```

**New Structure (CURRENT):**
```
/app/backend/frontend_tools/
├── greeting-speaker/
│   └── GreetingSpeaker.tsx  ✅ Clean separation!
└── image-upscaler/
    └── ImageUpscaler.tsx
```

## 📋 Current Tools

| Slug | Component | Format | Status |
|------|-----------|--------|--------|
| greeting-speaker | GreetingSpeaker.tsx | TSX | ✅ Active |
| image-upscaler | ImageUpscaler.tsx | TSX | ✅ Active |
| color-picker | ColorPicker.html | HTML | ✅ Active |
| text-formatter | TextFormatter.html | HTML | ✅ Active |
| calculator | Calculator.html | HTML | ✅ Active |
| advanced-calculator | AdvancedCalculator.html | HTML | ✅ Active |

---

**Created:** 2025  
**Last Updated:** 2025  
**Maintained By:** ChimeraAI Team
