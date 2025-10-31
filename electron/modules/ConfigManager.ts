/**
 * ConfigManager Module
 * Manages settings.json (global configuration) - File-based, NO DATABASE!
 * 
 * Responsibilities:
 * - Read/write settings.json
 * - Manage config templates (apache.conf.tpl, nginx.conf.tpl)
 * - Validate configurations
 * - Reset to defaults
 */

import fs from 'fs/promises'
import fsSync from 'fs'
import path from 'path'
import os from 'os'

export interface ApacheConfig {
  default_port: number
  executable_path: string
  config_template: string
  modules_enabled: string[]
}

export interface NginxConfig {
  default_port: number
  executable_path: string
  config_template: string
}

export interface PHPConfig {
  active_version: string
  versions: Record<string, string>
}

export interface MySQLConfig {
  installed: boolean
  port: number
  executable_path: string
  data_path: string
}

export interface Settings {
  version: string
  domain_extension: string
  default_server: 'apache' | 'nginx'
  default_php_version: string
  apache: ApacheConfig
  nginx: NginxConfig
  php: PHPConfig
  mysql: MySQLConfig
  auto_start_services: string[]
  auto_start_on_boot: boolean
}

export interface ValidationResult {
  valid: boolean
  errors: string[]
}

export class ConfigManager {
  private systemPath: string
  private configPath: string
  private settingsFilePath: string

  constructor(systemPath?: string) {
    // Auto-detect system path (portable mode support)
    this.systemPath = systemPath || this.detectSystemPath()
    this.configPath = path.join(this.systemPath, 'config')
    this.settingsFilePath = path.join(this.configPath, 'settings.json')
  }

  /**
   * Detect chimera_system path
   * Priority:
   * 1. Portable mode (same directory as exe)
   * 2. User home directory
   * 3. Create new in user home
   */
  private detectSystemPath(): string {
    // Check if running in Electron app
    const execPath = process.execPath
    
    // Priority 1: Portable mode (next to executable)
    const portablePath = path.join(path.dirname(execPath), 'chimera_system')
    if (fsSync.existsSync(portablePath)) {
      console.log('[ConfigManager] Using portable system path:', portablePath)
      return portablePath
    }

    // Priority 2: User home directory
    const homePath = path.join(os.homedir(), 'ChimeraAI', 'chimera_system')
    if (fsSync.existsSync(homePath)) {
      console.log('[ConfigManager] Using home system path:', homePath)
      return homePath
    }

    // Priority 3: Create in user home (default)
    console.log('[ConfigManager] Creating new system path:', homePath)
    return homePath
  }

  /**
   * Initialize chimera_system folder structure
   */
  async initialize(): Promise<void> {
    console.log('[ConfigManager] Initializing chimera_system at:', this.systemPath)

    // Create folder structure
    const folders = [
      this.systemPath,
      path.join(this.systemPath, 'bin'),
      path.join(this.systemPath, 'bin', 'apache'),
      path.join(this.systemPath, 'bin', 'nginx'),
      path.join(this.systemPath, 'bin', 'php'),
      path.join(this.systemPath, 'bin', 'mysql'),
      path.join(this.systemPath, 'www'),
      path.join(this.systemPath, 'logs'),
      path.join(this.systemPath, 'logs', 'apache'),
      path.join(this.systemPath, 'logs', 'nginx'),
      path.join(this.systemPath, 'logs', 'mysql'),
      path.join(this.systemPath, 'config'),
    ]

    for (const folder of folders) {
      await fs.mkdir(folder, { recursive: true })
    }

    console.log('[ConfigManager] ✅ Folder structure created')

    // Create default settings.json if not exists
    if (!fsSync.existsSync(this.settingsFilePath)) {
      await this.createDefaultSettings()
    }
  }

  /**
   * Create default settings.json
   */
  private async createDefaultSettings(): Promise<void> {
    const defaultSettings: Settings = {
      version: '1.0.0',
      domain_extension: '.test',
      default_server: 'apache',
      default_php_version: '8.2.5',
      apache: {
        default_port: 80,
        executable_path: 'bin/apache/httpd-2.4.58/bin/httpd.exe',
        config_template: 'config/apache.conf.tpl',
        modules_enabled: ['mod_rewrite', 'mod_php'],
      },
      nginx: {
        default_port: 8080,
        executable_path: 'bin/nginx/nginx-1.24.0/nginx.exe',
        config_template: 'config/nginx.conf.tpl',
      },
      php: {
        active_version: '8.2.5',
        versions: {},
      },
      mysql: {
        installed: false,
        port: 3306,
        executable_path: 'bin/mysql/mysql-8.0.30/bin/mysqld.exe',
        data_path: 'data/mysql/',
      },
      auto_start_services: [],
      auto_start_on_boot: false,
    }

    await fs.writeFile(
      this.settingsFilePath,
      JSON.stringify(defaultSettings, null, 2),
      'utf-8'
    )

    console.log('[ConfigManager] ✅ Default settings.json created')
  }

  /**
   * Read global settings
   */
  async readSettings(): Promise<Settings> {
    try {
      const content = await fs.readFile(this.settingsFilePath, 'utf-8')
      const settings = JSON.parse(content) as Settings
      return settings
    } catch (error) {
      console.error('[ConfigManager] Error reading settings:', error)
      throw new Error('Failed to read settings.json')
    }
  }

  /**
   * Write global settings
   */
  async writeSettings(settings: Settings): Promise<boolean> {
    try {
      // Validate before writing
      const validation = await this.validateSettings(settings)
      if (!validation.valid) {
        console.error('[ConfigManager] Invalid settings:', validation.errors)
        throw new Error(`Invalid settings: ${validation.errors.join(', ')}`)
      }

      // Backup current settings
      await this.backupSettings()

      // Write new settings
      await fs.writeFile(
        this.settingsFilePath,
        JSON.stringify(settings, null, 2),
        'utf-8'
      )

      console.log('[ConfigManager] ✅ Settings updated successfully')
      return true
    } catch (error) {
      console.error('[ConfigManager] Error writing settings:', error)
      throw error
    }
  }

  /**
   * Backup settings.json
   */
  private async backupSettings(): Promise<void> {
    try {
      if (fsSync.existsSync(this.settingsFilePath)) {
        const backupPath = this.settingsFilePath + '.backup'
        await fs.copyFile(this.settingsFilePath, backupPath)
        console.log('[ConfigManager] Settings backed up to:', backupPath)
      }
    } catch (error) {
      console.warn('[ConfigManager] Warning: Could not backup settings:', error)
    }
  }

  /**
   * Get config template path
   */
  async getTemplatePath(type: 'apache' | 'nginx'): Promise<string> {
    const templatePath = path.join(this.configPath, `${type}.conf.tpl`)
    return templatePath
  }

  /**
   * Get config template content
   */
  async getTemplate(type: 'apache' | 'nginx'): Promise<string> {
    try {
      const templatePath = await this.getTemplatePath(type)
      const content = await fs.readFile(templatePath, 'utf-8')
      return content
    } catch (error) {
      console.error(`[ConfigManager] Error reading ${type} template:`, error)
      throw new Error(`Failed to read ${type} template`)
    }
  }

  /**
   * Update template
   */
  async updateTemplate(type: 'apache' | 'nginx', content: string): Promise<boolean> {
    try {
      const templatePath = await this.getTemplatePath(type)
      await fs.writeFile(templatePath, content, 'utf-8')
      console.log(`[ConfigManager] ✅ ${type} template updated`)
      return true
    } catch (error) {
      console.error(`[ConfigManager] Error updating ${type} template:`, error)
      return false
    }
  }

  /**
   * Validate settings
   */
  async validateSettings(settings: Settings): Promise<ValidationResult> {
    const errors: string[] = []

    // Validate required fields
    if (!settings.version) errors.push('version is required')
    if (!settings.domain_extension) errors.push('domain_extension is required')
    if (!['apache', 'nginx'].includes(settings.default_server)) {
      errors.push('default_server must be apache or nginx')
    }

    // Validate ports
    if (settings.apache.default_port < 1 || settings.apache.default_port > 65535) {
      errors.push('apache port must be between 1 and 65535')
    }
    if (settings.nginx.default_port < 1 || settings.nginx.default_port > 65535) {
      errors.push('nginx port must be between 1 and 65535')
    }

    return {
      valid: errors.length === 0,
      errors,
    }
  }

  /**
   * Reset to defaults
   */
  async resetSettings(): Promise<Settings> {
    console.log('[ConfigManager] Resetting settings to defaults...')
    await this.createDefaultSettings()
    return await this.readSettings()
  }

  /**
   * Get system path
   */
  getSystemPath(): string {
    return this.systemPath
  }

  /**
   * Get config path
   */
  getConfigPath(): string {
    return this.configPath
  }
}
