import { create } from 'zustand'

export interface Tool {
  _id: string
  name: string
  description: string
  category: string
  tool_type?: 'backend' | 'frontend'
  version: string
  author: string
  script_path: string
  dependencies: string[]
  status: 'active' | 'disabled'
  last_validated: string
  created_at: string
  updated_at: string
}

export interface ToolLog {
  _id: string
  tool_id: string
  action: string
  status: string
  message: string
  trace: string
  timestamp: string
}

interface ToolsStore {
  tools: Tool[]
  loading: boolean
  error: string | null
  searchQuery: string
  selectedCategory: string
  selectedStatus: string
  sortBy: 'name' | 'date' | 'category'
  viewMode: 'grid' | 'list'
  
  setSearchQuery: (query: string) => void
  setSelectedCategory: (category: string) => void
  setSelectedStatus: (status: string) => void
  setSortBy: (sort: 'name' | 'date' | 'category') => void
  setViewMode: (mode: 'grid' | 'list') => void
  fetchTools: () => Promise<void>
  uploadTool: (formData: any) => Promise<any>
  executeToolHandling: (toolId: string, params?: any) => Promise<any>
  toggleTool: (toolId: string) => Promise<void>
  deleteTool: (toolId: string) => Promise<void>
  validateTool: (toolId: string) => Promise<void>
  installDeps: (toolId: string) => Promise<void>
  getFilteredTools: () => Tool[]
}

export const useToolsStore = create<ToolsStore>((set, get) => ({
  tools: [],
  loading: false,
  error: null,
  searchQuery: '',
  selectedCategory: 'all',
  selectedStatus: 'all',
  sortBy: 'name',
  viewMode: 'grid',
  
  setSearchQuery: (query) => set({ searchQuery: query }),
  setSelectedCategory: (category) => set({ selectedCategory: category }),
  setSelectedStatus: (status) => set({ selectedStatus: status }),
  setSortBy: (sort) => set({ sortBy: sort }),
  setViewMode: (mode) => set({ viewMode: mode }),
  
  fetchTools: async () => {
    set({ loading: true, error: null })
    try {
      if (window.electronAPI) {
        const response = await window.electronAPI.listTools()
        set({ tools: response.tools || [], loading: false })
      }
    } catch (error: any) {
      set({ error: error.message, loading: false })
    }
  },
  
  uploadTool: async (formData: any) => {
    try {
      if (window.electronAPI) {
        const result = await window.electronAPI.uploadTool(formData)
        if (result.success) {
          await get().fetchTools()
        }
        return result
      }
    } catch (error: any) {
      throw new Error(error.message)
    }
  },
  
  executeToolHandling: async (toolId: string, params: any = {}) => {
    try {
      if (window.electronAPI) {
        const result = await window.electronAPI.executeTool(toolId, params)
        return result
      }
    } catch (error: any) {
      throw new Error(error.message)
    }
  },
  
  toggleTool: async (toolId: string) => {
    try {
      if (window.electronAPI) {
        await window.electronAPI.toggleTool(toolId)
        await get().fetchTools()
      }
    } catch (error: any) {
      set({ error: error.message })
    }
  },
  
  deleteTool: async (toolId: string) => {
    try {
      if (window.electronAPI) {
        await window.electronAPI.deleteTool(toolId)
        await get().fetchTools()
      }
    } catch (error: any) {
      set({ error: error.message })
    }
  },
  
  validateTool: async (toolId: string) => {
    try {
      if (window.electronAPI) {
        await window.electronAPI.validateTool(toolId)
        await get().fetchTools()
      }
    } catch (error: any) {
      set({ error: error.message })
    }
  },
  
  installDeps: async (toolId: string) => {
    try {
      if (window.electronAPI) {
        await window.electronAPI.installDeps(toolId)
        await get().fetchTools()
      }
    } catch (error: any) {
      set({ error: error.message })
    }
  },
  
  getFilteredTools: () => {
    const { tools, searchQuery, selectedCategory, selectedStatus, sortBy } = get()
    
    let filtered = tools.filter(tool => {
      const matchesSearch = tool.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           tool.description.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesCategory = selectedCategory === 'all' || tool.category === selectedCategory
      const matchesStatus = selectedStatus === 'all' || tool.status === selectedStatus
      
      return matchesSearch && matchesCategory && matchesStatus
    })
    
    // Sort
    filtered.sort((a, b) => {
      if (sortBy === 'name') {
        return a.name.localeCompare(b.name)
      } else if (sortBy === 'date') {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      } else {
        return a.category.localeCompare(b.category)
      }
    })
    
    return filtered
  },
}))
