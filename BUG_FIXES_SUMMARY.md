# 🛠️ BUG FIXES - ChimeraAI Logo & Backend Integration

## ✅ Masalah yang Telah Diperbaiki

### 1. **Backend Tidak Auto-Start di Electron App**

**Masalah**: Backend Python tidak otomatis jalan saat aplikasi Electron dibuka.

**Solusi**: 
- Menambahkan fungsi `startBackend()` di `electron/main.ts`
- Backend otomatis start menggunakan `child_process.spawn()`
- Backend berjalan di `http://127.0.0.1:8001`
- Backend otomatis stop saat aplikasi ditutup

**Code Changes** (`electron/main.ts`):
```typescript
// Import child_process dan fs
import { spawn, ChildProcess } from 'node:child_process'
import fs from 'node:fs'

let backendProcess: ChildProcess | null = null

// Fungsi untuk start backend
function startBackend() {
  // Spawn Python uvicorn server
  backendProcess = spawn(pythonCmd, [
    '-m', 'uvicorn',
    'server:app',
    '--host', '127.0.0.1',
    '--port', '8001',
    '--reload'
  ], {
    cwd: backendDir,
    env: { ...process.env },
    stdio: 'pipe'
  })
}

// Auto-start backend saat app ready
app.whenReady().then(async () => {
  await startBackend()  // ✅ Backend start dulu
  setupIPC()
  createWindow()
})

// Kill backend saat app quit
app.on('will-quit', () => {
  stopBackend()
})
```

---

### 2. **Logo Tidak Muncul di Title Bar**

**Masalah**: 
- Path `/logo-128.png` tidak bekerja di production build
- Logo hanya berfungsi di development mode

**Solusi**:
- Menambahkan fallback path detection di `TitleBar.tsx`
- Logo dicoba load dari multiple paths
- Fallback ke gradient box jika logo gagal load

**Code Changes** (`TitleBar.tsx`):
```tsx
const [logoSrc, setLogoSrc] = useState('/logo-128.png')

useEffect(() => {
  // Try different logo paths
  const tryLogoPath = async () => {
    const paths = [
      '/logo-128.png',
      './logo-128.png',
      '../logo-128.png',
      'logo-128.png'
    ]
    
    for (const p of paths) {
      try {
        const response = await fetch(p)
        if (response.ok) {
          setLogoSrc(p)
          console.log('[TitleBar] Logo found at:', p)
          break
        }
      } catch (e) {
        // Try next path
      }
    }
  }
  
  tryLogoPath()
}, [])

// Render with fallback
<img 
  src={logoSrc}
  onError={() => setLogoSrc('')}
/>
{!logoSrc && (
  <div className="gradient-fallback">C</div>
)}
```

---

### 3. **Icon Tidak Muncul di AppImage/Executable**

**Masalah**:
- Icon tidak ter-embed di executable file
- Path icon salah di `electron/main.ts`

**Solusi**:
- Memperbaiki path icon dengan detection dev/production mode
- Menambahkan `extraResources` di `package.json` untuk bundle icon
- Icon otomatis di-copy ke `resources` folder saat build

**Code Changes**:

**`electron/main.ts`**:
```typescript
function createWindow() {
  // Determine icon path
  const isDev = VITE_DEV_SERVER_URL !== undefined
  const iconPath = isDev
    ? path.join(process.env.APP_ROOT || '', 'build', 'icon.png')
    : path.join(process.resourcesPath, 'icon.png')
  
  console.log('[Main] Icon path:', iconPath)
  
  mainWindow = new BrowserWindow({
    icon: iconPath,  // ✅ Correct icon path
    // ...
  })
}
```

**`package.json`**:
```json
{
  "build": {
    "files": [
      "dist/**/*",
      "dist-electron/**/*",
      "backend/**/*"
    ],
    "extraResources": [
      {
        "from": "backend",
        "to": "backend"
      },
      {
        "from": "build/icon.png",
        "to": "icon.png"
      },
      {
        "from": "public/logo-128.png",
        "to": "logo-128.png"
      }
    ]
  }
}
```

---

### 4. **Logo Tidak Di-Copy ke Dist Folder**

**Masalah**: Logo tidak tersedia di production build

**Solusi**: 
- Menambahkan custom Vite plugin untuk copy logo
- Logo otomatis di-copy ke `dist/` saat build

**Code Changes** (`vite.config.ts`):
```typescript
plugins: [
  // ...
  // Custom plugin to copy logo
  {
    name: 'copy-logo',
    closeBundle() {
      const distDir = path.resolve(__dirname, 'dist')
      const logoSrc = path.resolve(__dirname, 'public/logo-128.png')
      const logoDest = path.resolve(distDir, 'logo-128.png')
      
      if (existsSync(logoSrc) && existsSync(distDir)) {
        copyFileSync(logoSrc, logoDest)
        console.log('✅ Logo copied to dist/')
      }
    }
  }
]
```

---

### 5. **Backend Files Tidak Ter-Bundle**

**Masalah**: Backend Python tidak di-include saat build

**Solusi**: 
- Menambahkan backend files ke `package.json` build config
- Backend otomatis di-copy ke `resources/backend/` saat build

---

## 🚀 Cara Build Aplikasi (UPDATED)

### **1. Pre-Build Check**

Jalankan script untuk verify semua assets:

```bash
cd /app
node scripts/pre-build.cjs
```

Output expected:
```
🔧 Preparing build assets...

✓ Checking icon files...
  ✅ build/icon.png (141.0KB)
  ✅ build/icon.ico (148.9KB)
  ✅ build/icon.icns (326.1KB)

✓ Checking logo files...
  ✅ public/logo-128.png (17.3KB)

✓ Checking backend files...
  ✅ backend/ (15 files)
  
✅ Build preparation complete!
```

### **2. Build Electron App**

```bash
cd /app
yarn electron:build
```

Script ini akan otomatis:
1. ✅ Run pre-build checks
2. ✅ Build icon files
3. ✅ Compile TypeScript
4. ✅ Build Vite frontend
5. ✅ Bundle dengan Electron Builder
6. ✅ Include backend Python files
7. ✅ Embed icons untuk semua platform

### **3. Test Hasil Build**

Build output ada di `/app/release/`:

**Linux**:
```bash
./release/ChimeraAI-1.0.0.AppImage
```

**Windows**:
```
release\ChimeraAI Setup 1.0.0.exe
```

**macOS**:
```
release/ChimeraAI.app
```

---

## ✅ Verifikasi Fixes

### **Test 1: Backend Auto-Start**

1. Buka aplikasi Electron
2. Backend harus otomatis start di port 8001
3. Check console logs: `[Backend] Starting Python backend...`
4. Test API: `curl http://127.0.0.1:8001/api/tools`

### **Test 2: Logo di Title Bar**

1. Buka aplikasi
2. Logo singa biru harus muncul di pojok kiri atas
3. Check console logs: `[TitleBar] Logo found at: ...`

### **Test 3: Icon di Desktop**

1. Install/extract hasil build
2. Icon harus muncul di:
   - Desktop shortcut
   - Taskbar (Windows) / Dock (macOS)
   - Window title bar
   - File manager

### **Test 4: Backend Berfungsi**

1. Buka aplikasi
2. Go to Tools Management page
3. Backend API harus bisa diakses
4. Upload tool harus berhasil

---

## 📂 File Structure (After Build)

```
release/
├── ChimeraAI-1.0.0.AppImage          # Linux executable
├── ChimeraAI Setup 1.0.0.exe         # Windows installer
└── ChimeraAI.app/                    # macOS app
    └── Contents/
        └── Resources/
            ├── icon.png              # ✅ Icon app
            ├── logo-128.png          # ✅ Logo UI
            └── backend/              # ✅ Python backend
                ├── server.py
                ├── database.py
                └── ...
```

---

## 🔍 Debugging

### Backend tidak start?

Check logs di console:
```typescript
[Backend] Starting Python backend...
[Backend] Backend directory: /path/to/backend
[Backend] Assuming backend started successfully
```

Jika gagal:
1. Pastikan Python 3 installed
2. Install dependencies: `pip install -r backend/requirements.txt`
3. Test manual: `cd backend && uvicorn server:app --port 8001`

### Logo tidak muncul?

Check browser console:
```
[TitleBar] Logo found at: /logo-128.png
```

Jika tidak ketemu, logo akan fallback ke gradient box dengan huruf "C".

### Icon tidak muncul di executable?

1. Verify icon files exist:
   ```bash
   ls -lh build/icon.*
   ```

2. Check build output untuk errors
3. Re-build dengan: `yarn electron:build`

---

## 📝 Summary

**Yang Diperbaiki**:
✅ Backend auto-start saat aplikasi dibuka
✅ Logo muncul di title bar (dengan fallback)
✅ Icon ter-embed di executable semua platform
✅ Backend files ter-bundle dengan aplikasi
✅ Logo di-copy ke dist folder otomatis
✅ Pre-build validation script

**Files Modified**:
- `electron/main.ts` - Backend auto-start + icon path fix
- `src/components/TitleBar.tsx` - Logo dengan fallback
- `package.json` - extraResources untuk bundle files
- `vite.config.ts` - Copy logo plugin
- `scripts/pre-build.cjs` - Pre-build validation (NEW)

**Siap untuk Production!** 🚀
