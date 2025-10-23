import { app, BrowserWindow, ipcMain } from 'electron'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import Store from 'electron-store'
import { spawn, ChildProcess } from 'node:child_process'
import fs from 'node:fs'

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
let backendProcess: ChildProcess | null = null

// Check if backend is already running
async function checkBackendHealth(): Promise<boolean> {
  try {
    const response = await fetch('http://localhost:8001/health')
    return response.ok
  } catch {
    return false
  }
}

// Start Python Backend Server
async function startBackend() {
  try {
    console.log('[Backend] Checking if backend is already running...')
    
    // Check if backend already running (e.g., started by launcher)
    const isRunning = await checkBackendHealth()
    if (isRunning) {
      console.log('[Backend] ✅ Backend already running, skipping startup')
      return
    }
    
    console.log('[Backend] Backend not running, starting it now...')
    
    // Determine if running in development or production
    const isDev = process.env.NODE_ENV !== 'production'
    
    if (isDev) {
      // Development mode: Use Python source files
      console.log('[Backend] Running in DEVELOPMENT mode (Python source)')
      
      const backendDir = path.join(process.env.APP_ROOT || '', 'backend')
      console.log('[Backend] Backend directory:', backendDir)
      
      if (!fs.existsSync(backendDir)) {
        console.error('[Backend] Backend directory not found:', backendDir)
        return
      }
      
      const pythonCmd = process.platform === 'win32' ? 'python' : 'python3'
      
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
    } else {
      // Production mode: Use PyInstaller executable
      console.log('[Backend] Running in PRODUCTION mode (bundled executable)')
      
      const backendExecutable = path.join(
        process.resourcesPath,
        'backend-dist',
        'chimera-backend',
        'chimera-backend'
      )
      
      console.log('[Backend] Executable path:', backendExecutable)
      
      if (!fs.existsSync(backendExecutable)) {
        console.error('[Backend] Backend executable not found:', backendExecutable)
        console.error('[Backend] App cannot start without backend!')
        return
      }
      
      // Make sure executable has proper permissions
      try {
        fs.chmodSync(backendExecutable, 0o755)
      } catch (e) {
        console.warn('[Backend] Could not chmod executable:', e)
      }
      
      backendProcess = spawn(backendExecutable, [], {
        env: { ...process.env },
        stdio: 'pipe'
      })
    }
    
    if (backendProcess.stdout) {
      backendProcess.stdout.on('data', (data) => {
        console.log('[Backend]', data.toString().trim())
      })
    }
    
    if (backendProcess.stderr) {
      backendProcess.stderr.on('data', (data) => {
        console.error('[Backend Error]', data.toString().trim())
      })
    }
    
    backendProcess.on('error', (error) => {
      console.error('[Backend] Failed to start:', error)
    })
    
    backendProcess.on('exit', (code) => {
      console.log('[Backend] Process exited with code', code)
      backendProcess = null
    })
    
    // Wait for backend to start
    console.log('[Backend] Waiting for backend to be ready...')
    const maxRetries = 30
    for (let i = 0; i < maxRetries; i++) {
      await new Promise(resolve => setTimeout(resolve, 1000))
      const ready = await checkBackendHealth()
      if (ready) {
        console.log('[Backend] ✅ Backend is ready!')
        return
      }
      console.log(`[Backend] Retry ${i + 1}/${maxRetries}...`)
    }
    
    console.warn('[Backend] Backend did not respond in time, but continuing...')
    
  } catch (error) {
    console.error('[Backend] Error starting backend:', error)
    // Don't throw - continue anyway
  }
}

// Stop backend server
function stopBackend() {
  if (backendProcess) {
    console.log('[Backend] Stopping backend server...')
    backendProcess.kill()
    backendProcess = null
  }
}

function createGameWindow(gameData: { gameId: string; gameName: string; gameUrl: string }) {
  console.log('[Main] Creating game window for:', gameData.gameName)
  
  // Minimize main window
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.minimize()
    console.log('[Main] Main window minimized')
  }
  
  // Create game window
  const gameWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    title: gameData.gameName,
    backgroundColor: '#000000',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
  })
  
  // Load game URL
  gameWindow.loadURL(gameData.gameUrl)
  
  // Restore main window when game window closes
  gameWindow.on('closed', () => {
    console.log('[Main] Game window closed, restoring main window')
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.restore()
      mainWindow.focus()
    }
  })
  
  console.log('[Main] Game window created successfully')
}

function createWindow() {
  // Determine icon path
  const isDev = VITE_DEV_SERVER_URL !== undefined
  const iconPath = isDev
    ? path.join(process.env.APP_ROOT || '', 'build', 'icon.png')
    : path.join(process.resourcesPath, 'icon.png')
  
  console.log('[Main] Icon path:', iconPath)
  console.log('[Main] Icon exists:', fs.existsSync(iconPath))
  
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    frame: false, // Frameless window - custom title bar
    backgroundColor: '#1e1e2f',
    icon: iconPath,
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

app.whenReady().then(async () => {
  // Start backend server first
  await startBackend()
  
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
  stopBackend()
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
  
  // NEW: Dual file upload handler (backend + frontend)
  ipcMain.handle('tool:upload-dual', async (_event, formData) => {
    try {
      const fetch = (await import('node-fetch')).default
      const FormData = (await import('form-data')).default
      
      const form = new FormData()
      
      // Backend file
      if (formData.backend_file) {
        const backendBuffer = Buffer.from(formData.backend_file, 'utf-8')
        form.append('backend_file', backendBuffer, {
          filename: formData.backend_filename || `${formData.name || 'tool'}.py`,
          contentType: 'text/x-python'
        })
      }
      
      // Frontend file
      if (formData.frontend_file) {
        const frontendBuffer = Buffer.from(formData.frontend_file, 'utf-8')
        const frontendFilename = formData.frontend_filename || `${formData.name || 'tool'}.jsx`
        const ext = frontendFilename.substring(frontendFilename.lastIndexOf('.'))
        const contentType = ext === '.html' ? 'text/html' : 
                           ext === '.tsx' ? 'text/typescript' :
                           'text/javascript'
        form.append('frontend_file', frontendBuffer, {
          filename: frontendFilename,
          contentType: contentType
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
      console.error('[IPC] tool:upload-dual error:', error)
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
  
  // Games handlers
  ipcMain.on('game:launch', (_event, gameData) => {
    console.log('[Main] Launching game:', gameData.gameName)
    createGameWindow(gameData)
  })
}

// IPC Handlers will be added here in future phases
// python-tool:run
// ai-chat:send
// etc.