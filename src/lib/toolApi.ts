/**
 * ToolAPI - Smart API Client for ChimeraAI Tools
 * 
 * Features:
 * - Auto-discovery of tool endpoints via metadata
 * - UUID-based routing (primary)
 * - Slug-based routing (alternative)
 * - Automatic error handling
 * - TypeScript type safety
 * 
 * Usage:
 * ```typescript
 * const api = new ToolAPI(toolId)
 * await api.init()
 * const result = await api.post('/endpoint', { data })
 * ```
 */

interface ToolEndpoint {
  path: string
  methods: string[]
  name: string
  description: string
}

interface ToolMetadata {
  tool_id: string
  name: string
  slug: string | null
  slug_aliases: string[]
  category: string
  version: string
  author: string
  description: string
  tool_type: 'single' | 'dual'
  status: string
  base_url: string
  endpoints: ToolEndpoint[]
  created_at: string
  updated_at: string
}

interface ToolInfo {
  tool_id: string
  name: string
  slug: string
  category: string
  redirect_url: string
  meta_url: string
}

export class ToolAPI {
  private toolId: string
  private meta: ToolMetadata | null = null
  private baseUrl: string = ''
  
  /**
   * Initialize ToolAPI with tool ID (UUID)
   */
  constructor(toolId: string) {
    this.toolId = toolId
    this.baseUrl = `/api/tools/${toolId}`
  }
  
  /**
   * Fetch tool metadata (auto-discovery)
   */
  async init(): Promise<ToolMetadata> {
    if (this.meta) {
      return this.meta
    }
    
    try {
      const response = await fetch(`${this.baseUrl}/meta`)
      
      if (!response.ok) {
        throw new Error(`Failed to fetch metadata: ${response.status}`)
      }
      
      this.meta = await response.json()
      this.baseUrl = this.meta!.base_url
      
      console.log(`✅ ToolAPI initialized: ${this.meta!.name} (${this.meta!.slug})`)
      
      return this.meta!
    } catch (error) {
      console.error('❌ Failed to initialize ToolAPI:', error)
      throw error
    }
  }
  
  /**
   * Get tool metadata (cached after init)
   */
  getMetadata(): ToolMetadata | null {
    return this.meta
  }
  
  /**
   * Check if endpoint exists
   */
  hasEndpoint(path: string, method: string = 'POST'): boolean {
    if (!this.meta) return false
    
    return this.meta.endpoints.some(
      ep => ep.path === path && ep.methods.includes(method.toUpperCase())
    )
  }
  
  /**
   * Generic API call
   */
  async call(
    endpoint: string, 
    method: string = 'POST', 
    data?: any,
    options?: RequestInit
  ): Promise<any> {
    // Ensure initialized
    if (!this.meta) {
      await this.init()
    }
    
    const url = `${this.baseUrl}${endpoint}`
    
    const fetchOptions: RequestInit = {
      method: method.toUpperCase(),
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers
      },
      ...options
    }
    
    // Add body for POST/PUT/PATCH
    if (data && ['POST', 'PUT', 'PATCH'].includes(method.toUpperCase())) {
      fetchOptions.body = JSON.stringify(data)
    }
    
    try {
      const response = await fetch(url, fetchOptions)
      
      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: response.statusText }))
        throw new Error(error.error || error.message || `HTTP ${response.status}`)
      }
      
      return await response.json()
    } catch (error) {
      console.error(`❌ API call failed: ${method} ${endpoint}`, error)
      throw error
    }
  }
  
  /**
   * Convenience: GET request
   */
  async get(endpoint: string, options?: RequestInit): Promise<any> {
    return this.call(endpoint, 'GET', undefined, options)
  }
  
  /**
   * Convenience: POST request
   */
  async post(endpoint: string, data: any, options?: RequestInit): Promise<any> {
    return this.call(endpoint, 'POST', data, options)
  }
  
  /**
   * Convenience: PUT request
   */
  async put(endpoint: string, data: any, options?: RequestInit): Promise<any> {
    return this.call(endpoint, 'PUT', data, options)
  }
  
  /**
   * Convenience: DELETE request
   */
  async delete(endpoint: string, options?: RequestInit): Promise<any> {
    return this.call(endpoint, 'DELETE', undefined, options)
  }
  
  /**
   * Execute tool with data
   */
  async execute(data: any): Promise<any> {
    return this.post('/execute', data)
  }
  
  /**
   * Validate tool
   */
  async validate(): Promise<any> {
    return this.post('/validate', {})
  }
  
  /**
   * Get tool logs
   */
  async getLogs(limit: number = 50): Promise<any> {
    return this.get(`/logs?limit=${limit}`)
  }
  
  /**
   * Static method: Create ToolAPI from slug
   */
  static async fromSlug(category: string, slug: string): Promise<ToolAPI> {
    try {
      const response = await fetch(`/api/tools/by-slug/${category}/${slug}`)
      
      if (!response.ok) {
        throw new Error(`Tool not found: ${category}/${slug}`)
      }
      
      const info: ToolInfo = await response.json()
      const api = new ToolAPI(info.tool_id)
      await api.init()
      
      console.log(`✅ ToolAPI created from slug: ${category}/${slug} → ${info.tool_id}`)
      
      return api
    } catch (error) {
      console.error(`❌ Failed to create ToolAPI from slug: ${category}/${slug}`, error)
      throw error
    }
  }
  
  /**
   * Static method: Resolve slug to tool (any category)
   */
  static async resolve(slug: string): Promise<ToolAPI> {
    try {
      const response = await fetch(`/api/tools/resolve/${slug}`)
      
      if (!response.ok) {
        throw new Error(`Tool not found: ${slug}`)
      }
      
      const info: ToolInfo = await response.json()
      const api = new ToolAPI(info.tool_id)
      await api.init()
      
      console.log(`✅ ToolAPI resolved: ${slug} → ${info.tool_id}`)
      
      return api
    } catch (error) {
      console.error(`❌ Failed to resolve slug: ${slug}`, error)
      throw error
    }
  }
}

export default ToolAPI
