// Global type definitions for Electron IPC

interface ElectronAPI {
  ping: () => Promise<string>
  minimizeWindow: () => void
  maximizeWindow: () => void
  closeWindow: () => void
  isMaximized: () => Promise<boolean>
  saveTheme: (theme: string) => void
  getTheme: () => Promise<string>
  // Tools
  uploadTool: (formData: any) => Promise<any>
  uploadDualTool: (formData: any) => Promise<any>
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
  // Games
  launchGame: (gameData: { gameId: string; gameName: string; gameUrl: string }) => void
}

interface Window {
  electronAPI: ElectronAPI
  electron: {
    send: (channel: string, data?: any) => void
    invoke: (channel: string, data?: any) => Promise<any>
  }
}
