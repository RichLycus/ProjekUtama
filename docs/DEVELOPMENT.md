# 🚀 ChimeraAI Development Guide

## Quick Start

### Prerequisites
- Node.js 18+ 
- Yarn package manager
- **For running Electron**: Desktop OS with GUI (Windows/Mac/Linux)

### Installation
```bash
cd /app
yarn install
```

### Development Commands

#### Option 1: Full Electron Mode (Desktop with GUI)
```bash
yarn dev
```
This will:
- Start Vite dev server on http://localhost:5173
- Launch Electron desktop window
- Enable hot reload for both processes
- Open DevTools automatically

#### Option 2: Web Preview Mode (No Electron)
```bash
yarn vite
```
This will:
- Start only Vite dev server
- Access at http://localhost:5173
- Test UI without Electron
- Perfect for UI development

### Building
```bash
yarn build
```
Creates production-ready Electron app in `release/` directory.

## 📁 Key Files

### Electron (Main Process)
- `electron/main.ts` - Electron entry point, window management
- `electron/preload.ts` - Secure IPC bridge

### React (Renderer Process)
- `src/main.tsx` - React entry point
- `src/App.tsx` - Root component with routing
- `src/components/` - Reusable UI components
- `src/pages/` - Page components
- `src/styles/globals.css` - Tailwind + custom styles

### Configuration
- `vite.config.ts` - Vite bundler config
- `tailwind.config.js` - Design system tokens
- `tsconfig.json` - TypeScript settings
- `package.json` - Dependencies and scripts

## 🎨 Design System

### Color Tokens
```css
background: #1e1e1e    /* Main background */
surface: #2d2d30       /* Card/panel background */
primary: #007acc       /* Primary brand color */
secondary: #0098ff     /* Secondary actions */
accent: #00d4ff        /* Highlights */
text: #ffffff          /* Main text */
text-secondary: #cccccc /* Secondary text */
text-muted: #808080    /* Disabled/muted */
```

### Utility Classes
- `.glass` - Glassmorphism effect (40% opacity)
- `.glass-strong` - Stronger glass effect (60% opacity)
- `.card` - Elevated card with hover effects
- `.btn-primary` - Primary button with gradient hover
- `.btn-secondary` - Glass button
- `.input` - Styled form input

### Components
```tsx
// Example usage
<div className="card">
  <h2 className="text-text font-bold">Card Title</h2>
  <p className="text-text-secondary">Description</p>
  <button className="btn-primary">Action</button>
</div>
```

## 🔌 IPC Communication

### Current (Phase 0)
```typescript
// Renderer → Main
const result = await window.electronAPI.ping()
console.log(result) // "pong"
```

### Upcoming (Phase 2+)
```typescript
// Run Python tool
window.electronAPI.runPythonTool('image-converter', { 
  input: '/path/to/image.png',
  format: 'jpg' 
})

// Listen for tool status
window.electronAPI.onToolStatus((data) => {
  console.log(data.progress, data.result)
})

// Send AI chat message
window.electronAPI.sendChatMessage('Hello AI!', context)

// Listen for AI responses
window.electronAPI.onChatResponse((chunk) => {
  console.log(chunk) // Streaming response
})
```

## 🛠️ Adding New Features

### 1. Add New Page
```bash
# Create page component
touch src/pages/NewPage.tsx
```

```tsx
// src/pages/NewPage.tsx
export default function NewPage() {
  return (
    <div className="container mx-auto px-6 py-12">
      <h1 className="text-4xl font-display font-bold text-text mb-6">
        New Page
      </h1>
      <div className="card">
        Content here
      </div>
    </div>
  )
}
```

```tsx
// src/App.tsx - Add route
<Route path="/newpage" element={<NewPage />} />
```

### 2. Add IPC Handler (Main Process)
```typescript
// electron/main.ts
ipcMain.handle('my-handler', async (event, arg) => {
  // Do something
  return { success: true, data: arg }
})
```

```typescript
// electron/preload.ts - Expose to renderer
contextBridge.exposeInMainWorld('electronAPI', {
  myMethod: (arg) => ipcRenderer.invoke('my-handler', arg)
})
```

### 3. Add Zustand Store (State Management)
```typescript
// src/stores/useAppStore.ts
import { create } from 'zustand'

interface AppState {
  theme: 'dark' | 'light'
  setTheme: (theme: 'dark' | 'light') => void
}

export const useAppStore = create<AppState>((set) => ({
  theme: 'dark',
  setTheme: (theme) => set({ theme }),
}))
```

## 🐛 Debugging

### Renderer Process (React)
- DevTools opens automatically in dev mode
- Console logs appear in Electron window
- React DevTools extension supported

### Main Process (Electron)
```bash
# Add to electron/main.ts
console.log('Debug info:', data)
```
Logs appear in terminal where `yarn dev` is running.

### IPC Communication
```typescript
// Test IPC in renderer console
await window.electronAPI.ping() // Should return "pong"
```

## 📦 Project Structure Explained

```
chimera-ai/
├── electron/           # Main process (Node.js)
│   ├── main.ts        # App lifecycle, window management
│   └── preload.ts     # IPC bridge (security layer)
│
├── src/               # Renderer process (React)
│   ├── components/    # Reusable UI components
│   │   ├── Layout.tsx
│   │   └── Header.tsx
│   ├── pages/        # Route pages
│   │   ├── HomePage.tsx
│   │   ├── ToolsPage.tsx
│   │   └── ...
│   ├── stores/       # Zustand state management
│   ├── lib/          # Utilities (cn, formatters, etc.)
│   ├── styles/       # Global CSS + Tailwind
│   ├── App.tsx       # Router setup
│   └── main.tsx      # React entry point
│
├── tools/            # Python automation tools
│   └── [tool-name]/
│       ├── tool.py
│       └── requirements.txt
│
├── games/            # Web games
│   └── [game-name]/
│       └── index.html
│
├── public/           # Static assets
│   └── icon.svg
│
└── dist-electron/    # Compiled Electron code
    ├── main.js
    └── preload.js
```

## 🔒 Security Notes

✅ **Implemented**:
- `contextIsolation: true` - Renderer can't access Node.js directly
- `nodeIntegration: false` - No Node.js in renderer
- Preload script - Controlled IPC exposure
- Type-safe IPC calls via TypeScript

❌ **Never Do**:
- `nodeIntegration: true` - Security risk
- Expose entire `ipcRenderer` - Use specific methods only
- Load untrusted content without sandbox

## 🚀 Next Steps

### Phase 1: UI Enhancement
- [ ] Lottie avatar animation
- [ ] Enhanced glassmorphism effects
- [ ] Smooth page transitions
- [ ] Loading states

### Phase 2: Python Tools
- [ ] Tool execution framework
- [ ] Sample tools (image converter, file organizer)
- [ ] Progress tracking UI
- [ ] Error handling

### Phase 3: AI Chat
- [ ] Ollama integration
- [ ] Streaming response UI
- [ ] Chat history
- [ ] Context management

### Phase 4: Advanced Features
- [ ] Settings persistence
- [ ] Custom themes
- [ ] Keyboard shortcuts
- [ ] System tray integration

### Phase 5: Games & Polish
- [ ] Embedded web games
- [ ] Performance optimization
- [ ] Auto-updates
- [ ] Final testing

---

**Made with ❤️ using Electron + React + TypeScript**
