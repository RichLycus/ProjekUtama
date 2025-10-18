import { contextBridge, ipcRenderer } from 'electron'

console.log('[Preload] Loading preload script...')

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
  
  // Theme
  saveTheme: (theme: string) => ipcRenderer.send('theme:save', theme),
  getTheme: () => ipcRenderer.invoke('theme:get'),
  
  // Python Tool execution (Phase 2)
  uploadTool: (formData: any) => ipcRenderer.invoke('tool:upload', formData),
  uploadFrontendTool: (formData: any) => ipcRenderer.invoke('tool:upload-frontend', formData),
  listTools: (filters?: any) => ipcRenderer.invoke('tool:list', filters),
  getTool: (toolId: string) => ipcRenderer.invoke('tool:get', toolId),
  executeTool: (toolId: string, params: any) => ipcRenderer.invoke('tool:execute', toolId, params),
  toggleTool: (toolId: string) => ipcRenderer.invoke('tool:toggle', toolId),
  deleteTool: (toolId: string) => ipcRenderer.invoke('tool:delete', toolId),
  validateTool: (toolId: string) => ipcRenderer.invoke('tool:validate', toolId),
  installDeps: (toolId: string) => ipcRenderer.invoke('tool:install-deps', toolId),
  getToolLogs: (toolId: string) => ipcRenderer.invoke('tool:logs', toolId),
  getCategories: () => ipcRenderer.invoke('tool:categories'),
  
  // AI Chat (Phase 3)
  // sendChatMessage: (message: string, context?: any) => ipcRenderer.invoke('ai-chat:send', message, context),
  // onChatResponse: (callback: Function) => ipcRenderer.on('ai-chat:response', (_event, data) => callback(data)),
})

console.log('[Preload] electronAPI exposed to window')

// Type definitions for TypeScript
export interface ElectronAPI {
  ping: () => Promise<string>
  minimizeWindow: () => void
  maximizeWindow: () => void
  closeWindow: () => void
  isMaximized: () => Promise<boolean>
  saveTheme: (theme: string) => void
  getTheme: () => Promise<string>
  // Python Tools (Phase 2)
  uploadTool: (formData: any) => Promise<any>
  uploadFrontendTool: (formData: any) => Promise<any>
  listTools: (filters?: any) => Promise<any>
  getTool: (toolId: string) => Promise<any>
  executeTool: (toolId: string, params: any) => Promise<any>
  toggleTool: (toolId: string) => Promise<any>
  deleteTool: (toolId: string) => Promise<any>
  validateTool: (toolId: string) => Promise<any>
  installDeps: (toolId: string) => Promise<any>
  getToolLogs: (toolId: string) => Promise<any>
  getCategories: () => Promise<any>
  // sendChatMessage: (message: string, context?: any) => Promise<void>
  // onChatResponse: (callback: (data: any) => void) => void
}

declare global {
  interface Window {
    electronAPI: ElectronAPI
  }
}
