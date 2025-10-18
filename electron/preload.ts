import { contextBridge, ipcRenderer } from 'electron'

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // Basic ping test
  ping: () => ipcRenderer.invoke('ping'),
  
  // Window Controls
  minimizeWindow: () => ipcRenderer.send('window:minimize'),
  maximizeWindow: () => ipcRenderer.send('window:maximize'),
  closeWindow: () => ipcRenderer.send('window:close'),
  isMaximized: () => ipcRenderer.invoke('window:isMaximized'),
  
  // Python Tool execution (Phase 2)
  // runPythonTool: (toolId: string, params: any) => ipcRenderer.invoke('python-tool:run', toolId, params),
  // onToolStatus: (callback: Function) => ipcRenderer.on('python-tool:status', (_event, data) => callback(data)),
  
  // AI Chat (Phase 3)
  // sendChatMessage: (message: string, context?: any) => ipcRenderer.invoke('ai-chat:send', message, context),
  // onChatResponse: (callback: Function) => ipcRenderer.on('ai-chat:response', (_event, data) => callback(data)),
})

// Type definitions for TypeScript
export interface ElectronAPI {
  ping: () => Promise<string>
  minimizeWindow: () => void
  maximizeWindow: () => void
  closeWindow: () => void
  isMaximized: () => Promise<boolean>
  // runPythonTool: (toolId: string, params: any) => Promise<any>
  // onToolStatus: (callback: (data: any) => void) => void
  // sendChatMessage: (message: string, context?: any) => Promise<void>
  // onChatResponse: (callback: (data: any) => void) => void
}

declare global {
  interface Window {
    electronAPI: ElectronAPI
  }
}
