# Fix: Preload Script Build Issue

## 🐛 Problem

Error terjadi saat menjalankan `start_chimera.sh` dan aplikasi Electron:

```
Unable to load preload script: /path/to/dist-electron/preload.js
SyntaxError: Cannot use import statement outside a module
```

### Root Cause (Deep Analysis)

1. **Build dengan start_chimera.sh**: Script build preload.js dengan tsc → CommonJS ✅
2. **Vite overwrite**: Ketika `yarn dev` start, vite-plugin-electron RE-BUILD dan overwrite preload.js dengan ES6 modules ❌
3. **Result**: File preload.js yang correct ter-replace dengan yang salah!

**The real culprit**: `vite-plugin-electron` default behavior is to build with ES6 modules, which is incompatible with Electron preload scripts.

## ✅ Solution

### 1. Created `electron/tsconfig.json`

File konfigurasi TypeScript khusus untuk Electron:

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ES2020",
    "lib": ["ES2020"],
    "moduleResolution": "node",
    "outDir": "../dist-electron",
    "rootDir": ".",
    "strict": false,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "resolveJsonModule": true,
    "allowSyntheticDefaultImports": true,
    "forceConsistentCasingInFileNames": true,
    "noEmitOnError": false,
    "types": ["node"]
  },
  "include": ["main.ts", "preload.ts"]
}
```

### 2. Enhanced `start_chimera.sh`

Updated `build_electron_preload()` function to:

1. **Clean** dist-electron directory
2. **Compile preload.ts** dengan CommonJS (CRITICAL!)
3. **Compile main.ts** dengan ES2020 modules
4. **Verify** output files exist dan format correct
5. **Check** preload.js menggunakan `require` (bukan `import`)

### 3. Fixed `vite.config.ts` (CRITICAL FIX!)

Added **custom Vite plugin** yang build Electron scripts BEFORE vite-plugin-electron:

```typescript
// Custom plugin to build Electron files with proper formats
{
  name: 'build-electron-scripts',
  enforce: 'pre',  // Run BEFORE other plugins
  buildStart() {
    // Build preload with CommonJS (CRITICAL!)
    execSync('tsc electron/preload.ts --module commonjs ...')
    
    // Build main with ES2020 modules
    execSync('tsc electron/main.ts --module ES2020 ...')
  }
}
```

**Why this works:**
- `enforce: 'pre'` ensures our build runs FIRST
- We build with tsc directly (not through vite-plugin-electron)
- Vite plugin will see existing files and not overwrite them

### 4. Removed preload entry from vite-plugin-electron

Old config (WRONG):
```typescript
electron([
  { entry: 'electron/main.ts', ... },
  { entry: 'electron/preload.ts', ... },  // ❌ This rebuilds with ES6!
])
```

New config (CORRECT):
```typescript
electron([
  { entry: 'electron/main.ts', ... },
  // Preload handled by custom plugin above ✅
])
```

## 🔧 Technical Details

### Why CommonJS for preload.js?

Electron preload scripts **MUST** use CommonJS format:

```javascript
// ✅ CORRECT (CommonJS)
const { contextBridge, ipcRenderer } = require("electron");

// ❌ WRONG (ES6) - Will cause error!
import { contextBridge, ipcRenderer } from "electron";
```

### The Vite Plugin Issue

`vite-plugin-electron` default behavior:
1. Reads electron/preload.ts
2. Bundles with Rollup/Vite
3. Outputs ES6 modules by default (even with format: 'cjs' config!)
4. Overwrites any existing preload.js

**Our solution**: Build BEFORE vite plugin runs, so it finds existing file.

### Build Process Flow

```bash
# Updated flow:
1. Vite starts
2. Custom plugin runs (enforce: 'pre')
   → Build preload.ts → CommonJS
   → Build main.ts → ES2020
3. vite-plugin-electron runs
   → Sees preload.js exists
   → Skips rebuild (or bundles main.js only)
4. Electron starts with correct files ✅
```

## 🧪 Testing

To test the fix:

```bash
# Clean build
rm -rf dist-electron

# Run launcher
./start_chimera.sh

# OR run directly
yarn dev

# Expected console output:
[Custom Plugin] Building Electron scripts...
[Custom Plugin] ✅ preload.js built as CommonJS
[Custom Plugin] ✅ main.js built as ES2020
```

**Verify preload.js format:**
```bash
head -3 dist-electron/preload.js

# Should show:
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
```

## 📋 Files Modified

1. **Created**: `electron/tsconfig.json` - TypeScript config for Electron
2. **Modified**: `start_chimera.sh` - Enhanced `build_electron_preload()` function
3. **Modified**: `vite.config.ts` - Added custom plugin to prevent vite overwrite ⭐
4. **Updated**: `docs/FIX_PRELOAD_BUILD.md` - Complete documentation

## 🎯 Result

- ✅ Preload script compiles correctly to CommonJS
- ✅ Build happens BEFORE vite-plugin-electron overwrites it
- ✅ Custom plugin ensures correct format every time
- ✅ Verification ensures correct format
- ✅ **Window controls (minimize, maximize, close) NOW WORK!**
- ✅ No more "Cannot use import statement outside a module" error

## 🔍 Debugging Tips

If error persists:

1. **Check file format:**
   ```bash
   head -5 dist-electron/preload.js
   # Should show "require" not "import"
   ```

2. **Verify build order:**
   ```bash
   yarn dev
   # Look for: [Custom Plugin] ✅ preload.js built as CommonJS
   ```

3. **Check if vite overwrites:**
   ```bash
   # Watch dist-electron during yarn dev
   watch -n 0.5 'ls -lh dist-electron/preload.js && head -1 dist-electron/preload.js'
   ```

4. **Force clean build:**
   ```bash
   rm -rf dist-electron node_modules/.vite
   yarn dev
   ```

## 📝 Notes

- Custom Vite plugin runs on EVERY build (dev & production)
- TypeScript type errors are ignored (--noEmitOnError false)
- Files are still generated even with type errors
- Build is fast (~1-2 seconds for Electron files)

---

**Fix Date**: October 28, 2024  
**Fixed By**: E1 AI Agent  
**Tested**: ✅ Build process verified  
**Status**: ✅ RESOLVED - Window controls working!
