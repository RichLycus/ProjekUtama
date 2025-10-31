/**
 * FileScanner Module
 * Scans www/ folder for projects - File-based, NO DATABASE!
 * 
 * Responsibilities:
 * - Scan www/ folder for projects
 * - Detect project types (HTML, PHP, Node.js, React)
 * - Read .chimera config files
 * - Monitor file changes (auto-refresh project list)
 */

import fs from 'fs/promises'
import fsSync from 'fs'
import path from 'path'
import { watch, FSWatcher } from 'fs'
import { Settings } from './ConfigManager'

export type ProjectType = 'html' | 'php' | 'nodejs' | 'react' | 'unknown'
export type ProjectStatus = 'running' | 'stopped' | 'starting' | 'error'

export interface ProjectConfig {
  server?: 'apache' | 'nginx'
  port?: number
  php_version?: string
  custom_domain?: string
  auto_start?: boolean
}

export interface Project {
  name: string
  path: string
  type: ProjectType
  domain: string
  server: 'apache' | 'nginx'
  port: number
  phpVersion?: string
  status: ProjectStatus
  config?: ProjectConfig
  createdAt?: Date
  lastModified?: Date
}

export class FileScanner {
  private systemPath: string
  private wwwPath: string
  private watcher: FSWatcher | null = null

  constructor(systemPath: string) {
    this.systemPath = systemPath
    this.wwwPath = path.join(systemPath, 'www')
  }

  /**
   * Scan www/ folder and return all projects
   */
  async scanProjects(settings: Settings): Promise<Project[]> {
    try {
      console.log('[FileScanner] Scanning projects in:', this.wwwPath)

      // Ensure www/ folder exists
      if (!fsSync.existsSync(this.wwwPath)) {
        console.log('[FileScanner] www/ folder does not exist, creating...')
        await fs.mkdir(this.wwwPath, { recursive: true })
        return []
      }

      // Read all folders in www/
      const entries = await fs.readdir(this.wwwPath, { withFileTypes: true })
      const folders = entries.filter((entry) => entry.isDirectory())

      console.log(`[FileScanner] Found ${folders.length} folders in www/`)

      // Process each folder as a project
      const projects: Project[] = []

      for (const folder of folders) {
        try {
          const project = await this.getProject(folder.name, settings)
          if (project) {
            projects.push(project)
          }
        } catch (error) {
          console.error(`[FileScanner] Error processing project ${folder.name}:`, error)
        }
      }

      console.log(`[FileScanner] ✅ Scanned ${projects.length} projects`)
      return projects
    } catch (error) {
      console.error('[FileScanner] Error scanning projects:', error)
      throw error
    }
  }

  /**
   * Get single project details
   */
  async getProject(name: string, settings: Settings): Promise<Project | null> {
    try {
      const projectPath = path.join(this.wwwPath, name)

      // Check if folder exists
      if (!fsSync.existsSync(projectPath)) {
        return null
      }

      // Get folder stats
      const stats = await fs.stat(projectPath)
      if (!stats.isDirectory()) {
        return null
      }

      // Read optional .chimera config
      const config = await this.readProjectConfig(projectPath)

      // Detect project type
      const type = await this.detectProjectType(projectPath)

      // Build domain
      const domain = config?.custom_domain || `${name}${settings.domain_extension}`

      // Get server config
      const server = config?.server || settings.default_server
      const port = config?.port || settings[server].default_port
      const phpVersion = config?.php_version || settings.php.active_version

      // Check if project is running (will implement status check later)
      const status = await this.checkProjectStatus(name)

      const project: Project = {
        name,
        path: projectPath,
        type,
        domain,
        server,
        port,
        phpVersion: type === 'php' ? phpVersion : undefined,
        status,
        config,
        createdAt: stats.birthtime,
        lastModified: stats.mtime,
      }

      return project
    } catch (error) {
      console.error(`[FileScanner] Error getting project ${name}:`, error)
      return null
    }
  }

  /**
   * Read .chimera config file (project-specific settings)
   */
  async readProjectConfig(projectPath: string): Promise<ProjectConfig | null> {
    try {
      const configPath = path.join(projectPath, '.chimera')
      
      if (!fsSync.existsSync(configPath)) {
        return null
      }

      const content = await fs.readFile(configPath, 'utf-8')
      const config = JSON.parse(content) as ProjectConfig
      
      return config
    } catch (error) {
      console.warn('[FileScanner] Warning: Could not read .chimera config:', error)
      return null
    }
  }

  /**
   * Write .chimera config file
   */
  async writeProjectConfig(projectPath: string, config: ProjectConfig): Promise<boolean> {
    try {
      const configPath = path.join(projectPath, '.chimera')
      await fs.writeFile(configPath, JSON.stringify(config, null, 2), 'utf-8')
      console.log('[FileScanner] ✅ .chimera config written')
      return true
    } catch (error) {
      console.error('[FileScanner] Error writing .chimera config:', error)
      return false
    }
  }

  /**
   * Detect project type from files
   */
  async detectProjectType(projectPath: string): Promise<ProjectType> {
    try {
      const files = await fs.readdir(projectPath)

      // Check for package.json (Node.js/React)
      if (files.includes('package.json')) {
        const packageJsonPath = path.join(projectPath, 'package.json')
        const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf-8'))
        
        // Check if React project
        if (packageJson.dependencies?.react || packageJson.devDependencies?.react) {
          return 'react'
        }
        
        return 'nodejs'
      }

      // Check for PHP files
      const hasPhp = files.some((file) => file.endsWith('.php'))
      if (hasPhp) {
        return 'php'
      }

      // Check for HTML files
      const hasHtml = files.some((file) => file.endsWith('.html') || file.endsWith('.htm'))
      if (hasHtml) {
        return 'html'
      }

      return 'unknown'
    } catch (error) {
      console.error('[FileScanner] Error detecting project type:', error)
      return 'unknown'
    }
  }

  /**
   * Check if project is running
   * TODO: Implement process checking (Phase 5.3)
   */
  async checkProjectStatus(projectName: string): Promise<ProjectStatus> {
    // Placeholder - will implement in Phase 5.3 with ProcessSupervisor
    return 'stopped'
  }

  /**
   * Watch www/ folder for changes
   */
  async watchProjects(onChange: (projects: Project[], settings: Settings) => void, settings: Settings): Promise<void> {
    if (this.watcher) {
      this.watcher.close()
    }

    console.log('[FileScanner] Starting file watcher for:', this.wwwPath)

    this.watcher = watch(
      this.wwwPath,
      { recursive: false },
      async (eventType, filename) => {
        if (filename) {
          console.log(`[FileScanner] Detected change: ${eventType} - ${filename}`)
          
          // Re-scan projects
          const projects = await this.scanProjects(settings)
          onChange(projects, settings)
        }
      }
    )
  }

  /**
   * Stop watching
   */
  stopWatching(): void {
    if (this.watcher) {
      this.watcher.close()
      this.watcher = null
      console.log('[FileScanner] File watcher stopped')
    }
  }

  /**
   * Create new project folder
   */
  async createProject(name: string): Promise<string> {
    try {
      const projectPath = path.join(this.wwwPath, name)

      // Check if already exists
      if (fsSync.existsSync(projectPath)) {
        throw new Error(`Project ${name} already exists`)
      }

      // Create folder
      await fs.mkdir(projectPath, { recursive: true })
      console.log(`[FileScanner] ✅ Project folder created: ${projectPath}`)

      return projectPath
    } catch (error) {
      console.error('[FileScanner] Error creating project:', error)
      throw error
    }
  }

  /**
   * Delete project folder
   */
  async deleteProject(name: string): Promise<boolean> {
    try {
      const projectPath = path.join(this.wwwPath, name)

      // Check if exists
      if (!fsSync.existsSync(projectPath)) {
        throw new Error(`Project ${name} does not exist`)
      }

      // Delete folder recursively
      await fs.rm(projectPath, { recursive: true, force: true })
      console.log(`[FileScanner] ✅ Project deleted: ${name}`)

      return true
    } catch (error) {
      console.error('[FileScanner] Error deleting project:', error)
      throw error
    }
  }
}
