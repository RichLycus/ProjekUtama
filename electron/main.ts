import { app, BrowserWindow, ipcMain } from 'electron'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import Store from 'electron-store'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// Initialize electron-store
const store = new Store()

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
    backgroundColor: '#1e1e2f',
    icon: path.join(process.env.VITE_PUBLIC || '', 'icon.png'),
    webPreferences: {
      preload: path.join(MAIN_DIST, 'preload.js'),
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
  // Setup IPC handlers BEFORE creating window
  setupIPC()
  createWindow()

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

// Cleanup on quit - Kill backend if running
app.on('will-quit', () => {
  console.log('App is quitting, cleaning up...')
  // Additional cleanup can be added here if needed
})

// IPC Handlers for Window Controls
function setupIPC() {
  console.log('[Main] Setting up IPC handlers...')
  
  // Window control handlers
  ipcMain.on('window:minimize', () => {
    console.log('[Main] window:minimize called')
    const window = BrowserWindow.getFocusedWindow() || mainWindow
    if (window) {
      window.minimize()
      console.log('[Main] Window minimized')
    } else {
      console.error('[Main] No window found to minimize')
    }
  })

  ipcMain.on('window:maximize', () => {
    console.log('[Main] window:maximize called')
    const window = BrowserWindow.getFocusedWindow() || mainWindow
    if (window) {
      if (window.isMaximized()) {
        window.unmaximize()
        console.log('[Main] Window unmaximized')
      } else {
        window.maximize()
        console.log('[Main] Window maximized')
      }
    } else {
      console.error('[Main] No window found to maximize')
    }
  })

  ipcMain.on('window:close', () => {
    console.log('[Main] window:close called')
    const window = BrowserWindow.getFocusedWindow() || mainWindow
    if (window) {
      window.close()
      console.log('[Main] Window closed')
    } else {
      console.error('[Main] No window found to close')
    }
  })

  ipcMain.handle('window:isMaximized', () => {
    const window = BrowserWindow.getFocusedWindow()
    return window ? window.isMaximized() : false
  })

  // Theme handlers
  ipcMain.on('theme:save', (_event, theme) => {
    store.set('theme', theme)
  })

  ipcMain.handle('theme:get', () => {
    return store.get('theme', 'system')
  })

  // Python Tools API handlers
  const BACKEND_URL = 'http://localhost:8001'

  ipcMain.handle('tool:upload', async (_event, formData) => {
    try {
      const fetch = (await import('node-fetch')).default
      const FormData = (await import('form-data')).default
      
      const form = new FormData()
      
      // Handle file content - convert string to Buffer
      if (formData.file) {
        const fileBuffer = Buffer.from(formData.file, 'utf-8')
        form.append('file', fileBuffer, {
          filename: `${formData.name || 'tool'}.py`,
          contentType: 'text/x-python'
        })
      }
      
      // Append other fields
      if (formData.name) form.append('name', formData.name)
      if (formData.description) form.append('description', formData.description)
      if (formData.category) form.append('category', formData.category)
      if (formData.version) form.append('version', formData.version)
      if (formData.author) form.append('author', formData.author)
      
      const response = await fetch(`${BACKEND_URL}/api/tools/upload`, {
        method: 'POST',
        body: form,
        headers: form.getHeaders()
      })
      
      return await response.json()
    } catch (error: any) {
      console.error('[IPC] tool:upload error:', error)
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle('tool:upload-frontend', async (_event, formData) => {
    try {
      const fetch = (await import('node-fetch')).default
      const FormData = (await import('form-data')).default
      
      const form = new FormData()
      
      // Determine file extension based on content
      let fileExt = '.jsx' // default
      if (formData.file) {
        const content = formData.file
        if (content.includes('<!DOCTYPE') || content.includes('<html')) {
          fileExt = '.html'
        } else if (content.includes('interface ') || content.includes(': React.FC')) {
          fileExt = '.tsx'
        } else if (!content.includes('import React')) {
          fileExt = '.js'
        }
      }
      
      // Handle file content - convert string to Buffer
      if (formData.file) {
        const fileBuffer = Buffer.from(formData.file, 'utf-8')
        const contentType = fileExt === '.html' ? 'text/html' : 
                           fileExt === '.tsx' ? 'text/typescript' :
                           'text/javascript'
        form.append('file', fileBuffer, {
          filename: `${formData.name || 'tool'}${fileExt}`,
          contentType: contentType
        })
      }
      
      // Append other fields
      if (formData.name) form.append('name', formData.name)
      if (formData.description) form.append('description', formData.description)
      if (formData.category) form.append('category', formData.category)
      if (formData.version) form.append('version', formData.version)
      if (formData.author) form.append('author', formData.author)
      
      const response = await fetch(`${BACKEND_URL}/api/tools/upload-frontend`, {
        method: 'POST',
        body: form,
        headers: form.getHeaders()
      })
      
      return await response.json()
    } catch (error: any) {
      console.error('[IPC] tool:upload-frontend error:', error)
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