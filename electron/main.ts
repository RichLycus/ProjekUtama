import { app, BrowserWindow, ipcMain } from 'electron'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// Disable GPU acceleration for better compatibility
app.disableHardwareAcceleration()

process.env.APP_ROOT = path.join(__dirname, '..')

export const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL']
export const MAIN_DIST = path.join(process.env.APP_ROOT, 'dist-electron')
export const RENDERER_DIST = path.join(process.env.APP_ROOT, 'dist')

process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL
  ? path.join(process.env.APP_ROOT, 'public')
  : RENDERER_DIST

let mainWindow: BrowserWindow | null

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    frame: false, // Frameless window - custom title bar
    backgroundColor: '#1e1e1e',
    icon: path.join(process.env.VITE_PUBLIC || '', 'icon.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  })

  // Load the app
  if (VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(VITE_DEV_SERVER_URL)
    mainWindow.webContents.openDevTools()
  } else {
    mainWindow.loadFile(path.join(RENDERER_DIST, 'index.html'))
  }

  // Handle window events
  mainWindow.on('closed', () => {
    mainWindow = null
  })

  // Test IPC
  ipcMain.handle('ping', () => 'pong')
}

app.whenReady().then(() => {
  createWindow()
  setupIPC()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// IPC Handlers for Window Controls
function setupIPC() {
  // Window control handlers
  ipcMain.on('window:minimize', () => {
    const window = BrowserWindow.getFocusedWindow()
    if (window) window.minimize()
  })

  ipcMain.on('window:maximize', () => {
    const window = BrowserWindow.getFocusedWindow()
    if (window) {
      if (window.isMaximized()) {
        window.unmaximize()
      } else {
        window.maximize()
      }
    }
  })

  ipcMain.on('window:close', () => {
    const window = BrowserWindow.getFocusedWindow()
    if (window) window.close()
  })

  ipcMain.handle('window:isMaximized', () => {
    const window = BrowserWindow.getFocusedWindow()
    return window ? window.isMaximized() : false
  })

  // Python Tools API handlers
  const BACKEND_URL = 'http://localhost:8001'

  ipcMain.handle('tool:upload', async (_event, formData) => {
    try {
      const fetch = (await import('node-fetch')).default
      const FormData = (await import('form-data')).default
      
      const form = new FormData()
      Object.keys(formData).forEach(key => {
        form.append(key, formData[key])
      })
      
      const response = await fetch(`${BACKEND_URL}/api/tools/upload`, {
        method: 'POST',
        body: form
      })
      return await response.json()
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle('tool:list', async (_event, filters = {}) => {
    try {
      const fetch = (await import('node-fetch')).default
      const params = new URLSearchParams(filters)
      const response = await fetch(`${BACKEND_URL}/api/tools?${params}`)
      return await response.json()
    } catch (error: any) {
      return { tools: [], error: error.message }
    }
  })

  ipcMain.handle('tool:get', async (_event, toolId) => {
    try {
      const fetch = (await import('node-fetch')).default
      const response = await fetch(`${BACKEND_URL}/api/tools/${toolId}`)
      return await response.json()
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle('tool:execute', async (_event, toolId, params) => {
    try {
      const fetch = (await import('node-fetch')).default
      const response = await fetch(`${BACKEND_URL}/api/tools/${toolId}/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params)
      })
      return await response.json()
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle('tool:toggle', async (_event, toolId) => {
    try {
      const fetch = (await import('node-fetch')).default
      const response = await fetch(`${BACKEND_URL}/api/tools/${toolId}/toggle`, {
        method: 'PUT'
      })
      return await response.json()
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle('tool:delete', async (_event, toolId) => {
    try {
      const fetch = (await import('node-fetch')).default
      const response = await fetch(`${BACKEND_URL}/api/tools/${toolId}`, {
        method: 'DELETE'
      })
      return await response.json()
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle('tool:validate', async (_event, toolId) => {
    try {
      const fetch = (await import('node-fetch')).default
      const response = await fetch(`${BACKEND_URL}/api/tools/${toolId}/validate`, {
        method: 'POST'
      })
      return await response.json()
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle('tool:install-deps', async (_event, toolId) => {
    try {
      const fetch = (await import('node-fetch')).default
      const response = await fetch(`${BACKEND_URL}/api/tools/${toolId}/install-deps`, {
        method: 'POST'
      })
      return await response.json()
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle('tool:logs', async (_event, toolId) => {
    try {
      const fetch = (await import('node-fetch')).default
      const response = await fetch(`${BACKEND_URL}/api/tools/${toolId}/logs`)
      return await response.json()
    } catch (error: any) {
      return { logs: [], error: error.message }
    }
  })

  ipcMain.handle('tool:categories', async () => {
    try {
      const fetch = (await import('node-fetch')).default
      const response = await fetch(`${BACKEND_URL}/api/tools/categories`)
      return await response.json()
    } catch (error: any) {
      return { categories: [], error: error.message }
    }
  })
}

// IPC Handlers will be added here in future phases
// python-tool:run
// ai-chat:send
// etc.
