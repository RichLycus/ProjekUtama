# Phase 5: Local Server Management System ✨

**Status:** 📋 Planning Complete - Ready for Implementation (Revised Architecture)  
**Started:** January 26, 2025  
**Revised:** January 26, 2025 (Based on Fundamental Feedback)  
**Platform:** Desktop (Electron) - Cross-platform (Windows Priority)

---

## 🔔 CRITICAL ARCHITECTURE REVISION

**Based on user feedback, the architecture has been COMPLETELY REVISED to match Laragon philosophy:**

### ❌ What Was REMOVED (Original Plan):
- ~~SQLite database for system management~~ → **FILE-BASED ONLY**
- ~~Database tables (projects, server_configs, domains, logs)~~ → **SCAN FOLDERS & FILES**
- ~~Bundled binaries in app.asar~~ → **DOWNLOAD ON-DEMAND**
- ~~Static server versions~~ → **MULTIPLE VERSIONS SUPPORT**

### ✅ What Was ADDED (Revised Plan):
- **File-Based System:**
  - Scan `www/` folder → auto-detect projects (no database!)
  - Single `settings.json` → all configuration
  - Read logs directly from Apache/Nginx files
- **Modular Service Manager:**
  - Services NOT bundled with app
  - Download Apache/Nginx/PHP/MySQL on-demand (like Laragon)
  - Support multiple versions (PHP 8.1 + 8.2 simultaneously)
  - Isolated `chimera_system/bin/` folder
  - Portable mode (move folder anywhere)
- **Version Management:**
  - Per-service version switching
  - Per-project version override (.chimera file)
  - Global + local configuration

**This is the TRUE Laragon approach - modular, flexible, portable!**

---

## 🎯 Vision & Goals

Mengubah ChimeraAI dari AI assistant menjadi **all-in-one development environment** dengan built-in local server management seperti Laragon/XAMPP, tapi **lebih modern dan intelligent**.

### Core Objectives:

1. **Replace Portfolio Page** → Server Management Dashboard
2. **Manage Apache & Nginx services (on-demand)** → Download & run web servers
3. **Manage www/ Projects** → Create, start, stop, delete apps
4. **Local Domain Management** → Auto-edit hosts file (`.test`, `.websiteku`)
5. **Port Selection** → Apache (80) or Nginx (8080)
6. **Template System** → Blank HTML/PHP, later Node.js/React
7. **Cross-Platform** → Windows first, then Mac/Linux

---

## 🏗️ Architecture Overview

**Philosophy: Laragon-Style Modular Service Management**

```
ChimeraAI Desktop App (Electron)
│
├─ Electron Main Process
│  ├─ ServiceManager (download, install, manage services)
│  ├─ ProcessSupervisor (start/stop servers)
│  ├─ HostsFileEditor (requires Admin/sudo)
│  ├─ PortManager (check availability)
│  └─ ConfigManager (read/write settings.json)
│
├─ Frontend (React)
│  ├─ ServerManagementPage (main dashboard)
│  ├─ ServiceLibrary (download Apache/Nginx/PHP/MySQL)
│  ├─ ProjectsList (auto-detect from www/)
│  ├─ ServiceStatusPanel (running services)
│  └─ VersionSwitcher (PHP 8.1 ↔ 8.2)
│
└─ File System (NO DATABASE!)
    │
    └─ chimera_system/          # Isolated from OS
       │
       ├─ bin/                  # Service binaries (downloaded on-demand)
       │  ├─ apache/
       │  │  └─ httpd-2.4.58/  # Multiple versions support
       │  ├─ nginx/
       │  │  └─ nginx-1.24.0/
       │  ├─ php/
       │  │  ├─ php-8.1.10/    # User can switch versions
       │  │  └─ php-8.2.5/
       │  └─ mysql/
       │     └─ mysql-8.0.30/
       │
       ├─ www/                  # Projects folder (scan = list projects)
       │  ├─ nourivex/          # Each folder = 1 project
       │  │  ├─ index.html
       │  │  └─ .chimera        # Optional: project-specific config
       │  └─ blog/
       │
       ├─ logs/                 # Server logs (read directly)
       │  ├─ apache/
       │  │  ├─ access.log
       │  │  └─ error.log
       │  └─ nginx/
       │     ├─ access.log
       │     └─ error.log
       │
       └─ config/
          ├─ settings.json      # Global config (domain ext, ports)
          ├─ apache.conf.tpl    # Config templates
          └─ nginx.conf.tpl
```

**Key Differences from Original Plan:**
- ❌ **NO SQLite database** for system management
- ✅ **File-based:** Scan `www/` for projects, read `settings.json` for config
- ✅ **Modular Services:** Download binaries on-demand (not bundled)
- ✅ **Multiple Versions:** Support PHP 8.1 + 8.2 simultaneously
- ✅ **Isolated:** All services in `chimera_system/bin/`, not OS-level

---

## 📂 File-Based System (NO Database!)

### 1. Global Configuration File
**File:** `chimera_system/config/settings.json`

**Structure:**
```json
{
  "version": "1.0.0",
  "domain_extension": ".test",        // or .websiteku
  "default_server": "apache",         // apache or nginx
  "default_php_version": "8.2.5",
  "apache": {
    "default_port": 80,
    "executable_path": "bin/apache/httpd-2.4.58/bin/httpd.exe",
    "config_template": "config/apache.conf.tpl",
    "modules_enabled": ["mod_rewrite", "mod_php"]
  },
  "nginx": {
    "default_port": 8080,
    "executable_path": "bin/nginx/nginx-1.24.0/nginx.exe",
    "config_template": "config/nginx.conf.tpl"
  },
  "php": {
    "active_version": "8.2.5",
    "versions": {
      "8.1.10": "bin/php/php-8.1.10/php-cgi.exe",
      "8.2.5": "bin/php/php-8.2.5/php-cgi.exe"
    }
  },
  "mysql": {
    "installed": true,
    "port": 3306,
    "executable_path": "bin/mysql/mysql-8.0.30/bin/mysqld.exe",
    "data_path": "data/mysql/"
  },
  "auto_start_services": ["apache", "mysql"],
  "auto_start_on_boot": false
}
```

**Usage:**
- Read on app startup
- Write when user changes settings
- **Source of truth** for all configurations
- NO database queries needed!

---

### 2. Project Detection (Scan www/)
**No Database Table! Just scan the file system.**

**Logic:**
```typescript
// Pseudo-code
function getProjects(): Project[] {
  const wwwPath = path.join(systemPath, 'www')
  const folders = fs.readdirSync(wwwPath)
  
  return folders.map(folder => {
    const projectPath = path.join(wwwPath, folder)
    const projectConfig = readProjectConfig(projectPath) // .chimera file
    
    return {
      name: folder,
      path: projectPath,
      domain: `${folder}.${globalConfig.domain_extension}`,
      server: projectConfig?.server || globalConfig.default_server,
      port: projectConfig?.port || getDefaultPort(),
      status: checkIfRunning(folder) // Check process list
    }
  })
}
```

**Example www/ Structure:**
```
www/
├─ nourivex/
│  ├─ index.html
│  └─ .chimera           # Optional project config
├─ blog/
│  ├─ index.php
│  └─ .chimera
└─ api/
   └─ server.js
```

**Optional `.chimera` file** (per-project override):
```json
{
  "server": "nginx",
  "port": 8080,
  "php_version": "8.1.10",
  "custom_domain": "myblog.local"
}
```

---

### 3. Service Registry (Detect Installed Services)
**No Database! Scan `bin/` folder.**

**Logic:**
```typescript
function getInstalledServices(): ServiceRegistry {
  const binPath = path.join(systemPath, 'bin')
  
  return {
    apache: detectVersions(path.join(binPath, 'apache')),
    nginx: detectVersions(path.join(binPath, 'nginx')),
    php: detectVersions(path.join(binPath, 'php')),
    mysql: detectVersions(path.join(binPath, 'mysql'))
  }
}

function detectVersions(servicePath: string): ServiceVersion[] {
  if (!fs.existsSync(servicePath)) return []
  
  const folders = fs.readdirSync(servicePath)
  return folders.map(folder => ({
    name: folder,           // e.g., "php-8.2.5"
    version: parseVersion(folder),
    path: path.join(servicePath, folder),
    executable: findExecutable(path.join(servicePath, folder))
  }))
}
```

**Result Example:**
```json
{
  "apache": [
    { "name": "httpd-2.4.58", "version": "2.4.58", "path": "bin/apache/httpd-2.4.58/" }
  ],
  "php": [
    { "name": "php-8.1.10", "version": "8.1.10", "path": "bin/php/php-8.1.10/" },
    { "name": "php-8.2.5", "version": "8.2.5", "path": "bin/php/php-8.2.5/" }
  ],
  "nginx": [],
  "mysql": [
    { "name": "mysql-8.0.30", "version": "8.0.30", "path": "bin/mysql/mysql-8.0.30/" }
  ]
}
```

---

### 4. Hosts File Management
**No Database! Direct file editing.**

**Strategy:**
```typescript
// Add domain to hosts file
function addDomain(projectName: string): Promise<boolean> {
  const domain = `${projectName}.${globalConfig.domain_extension}`
  const entry = `127.0.0.1  ${domain}`
  
  // Read hosts file
  const hostsPath = getHostsFilePath() // OS-specific
  const content = fs.readFileSync(hostsPath, 'utf-8')
  
  // Check if already exists
  if (content.includes(domain)) return true
  
  // Append entry
  const newContent = content + `\n${entry}  # ChimeraAI`
  
  // Request Admin permission
  await requestAdminPermission()
  
  // Write (with backup)
  await backupHostsFile()
  fs.writeFileSync(hostsPath, newContent)
  
  return true
}
```

---

### 5. Server Logs (Read Directly from Files)
**No Database! Read Apache/Nginx log files.**

**Logic:**
```typescript
function getServerLogs(project: string, type: 'access' | 'error'): LogEntry[] {
  const logPath = path.join(systemPath, 'logs', globalConfig.default_server, `${type}.log`)
  
  if (!fs.existsSync(logPath)) return []
  
  const content = fs.readFileSync(logPath, 'utf-8')
  const lines = content.split('\n').slice(-100) // Last 100 lines
  
  return lines
    .filter(line => line.includes(project)) // Filter by project
    .map(parseLo gLine) // Parse into structured data
}
```

**No storage needed** - always read fresh from log files!

---

## 📦 Modular Service Management (Download On-Demand)

### Philosophy: Laragon-Style Modular System

**User Flow:**
```
User: "I need PHP 8.2"
↓
UI: Shows "Service Library"
↓
User: Clicks "Download PHP 8.2.5"
↓
Backend: Downloads from php.net (or mirror)
↓
Backend: Extracts to bin/php/php-8.2.5/
↓
UI: "PHP 8.2.5 installed! ✅"
↓
User: Can now switch between PHP 8.1 and 8.2 on-the-fly
```

---

### Service Library (Available Services)

**File:** `chimera_system/config/service_library.json` (shipped with app)

```json
{
  "services": {
    "apache": {
      "name": "Apache HTTP Server",
      "description": "Most popular web server",
      "icon": "apache.png",
      "versions": [
        {
          "version": "2.4.58",
          "release_date": "2023-10-19",
          "download_urls": {
            "win64": "https://www.apachelounge.com/download/VS17/binaries/httpd-2.4.58-win64-VS17.zip",
            "mac": "https://...",
            "linux": "https://..."
          },
          "size_mb": 15,
          "checksum": "sha256:abc123..."
        }
      ]
    },
    "nginx": {
      "name": "Nginx",
      "description": "High-performance web server",
      "versions": [
        {
          "version": "1.24.0",
          "download_urls": {
            "win64": "https://nginx.org/download/nginx-1.24.0.zip"
          },
          "size_mb": 1
        }
      ]
    },
    "php": {
      "name": "PHP",
      "description": "Server-side scripting language",
      "versions": [
        {
          "version": "8.1.10",
          "download_urls": {
            "win64": "https://windows.php.net/downloads/releases/php-8.1.10-Win32-vs16-x64.zip"
          },
          "size_mb": 25
        },
        {
          "version": "8.2.5",
          "download_urls": {
            "win64": "https://windows.php.net/downloads/releases/php-8.2.5-Win32-vs16-x64.zip"
          },
          "size_mb": 27
        }
      ]
    },
    "mysql": {
      "name": "MySQL Database",
      "description": "Popular relational database",
      "versions": [
        {
          "version": "8.0.30",
          "download_urls": {
            "win64": "https://dev.mysql.com/get/Downloads/MySQL-8.0/mysql-8.0.30-winx64.zip"
          },
          "size_mb": 200
        }
      ]
    }
  }
}
```

---

### Service Download & Installation Flow

**1. Download Manager**
```typescript
class ServiceDownloader {
  async downloadService(
    service: string,   // 'php'
    version: string    // '8.2.5'
  ): Promise<boolean> {
    const serviceInfo = getServiceInfo(service, version)
    const downloadUrl = serviceInfo.download_urls[platform]
    const zipPath = path.join(tmpPath, `${service}-${version}.zip`)
    
    // Download with progress
    await downloadFile(downloadUrl, zipPath, (progress) => {
      sendProgressToUI(progress) // 0-100%
    })
    
    // Verify checksum
    if (!verifyChecksum(zipPath, serviceInfo.checksum)) {
      throw new Error('Checksum mismatch!')
    }
    
    // Extract to bin/
    const extractPath = path.join(systemPath, 'bin', service, `${service}-${version}`)
    await extractZip(zipPath, extractPath)
    
    // Cleanup temp file
    fs.unlinkSync(zipPath)
    
    // Update settings.json
    await registerService(service, version, extractPath)
    
    return true
  }
}
```

**2. Version Switcher (PHP Example)**
```typescript
async function switchPHPVersion(version: string): Promise<boolean> {
  const phpPath = path.join(systemPath, 'bin', 'php', `php-${version}`)
  
  if (!fs.existsSync(phpPath)) {
    throw new Error(`PHP ${version} not installed!`)
  }
  
  // Update settings.json
  const config = readSettings()
  config.php.active_version = version
  writeSettings(config)
  
  // Restart Apache/Nginx to apply
  await restartWebServer()
  
  return true
}
```

---

### Service Status Detection

**No Database! Check running processes.**

```typescript
function getServiceStatus(service: string): ServiceStatus {
  const config = readSettings()
  const executablePath = config[service].executable_path
  
  // Check if process is running
  const isRunning = checkProcess(executablePath)
  
  if (!isRunning) {
    return { status: 'stopped', pid: null, uptime: null }
  }
  
  // Get process details
  const process = getProcessDetails(executablePath)
  
  return {
    status: 'running',
    pid: process.pid,
    port: config[service].default_port,
    uptime: process.uptime
  }
}
```

---

## 🔌 Backend API Endpoints (File-Based Operations)

### Service Management

```
POST   /api/server-manager/services/download         # Download service (Apache/Nginx/PHP/MySQL)
GET    /api/server-manager/services/library          # Get available services catalog
GET    /api/server-manager/services/installed        # Scan bin/ folder for installed services
DELETE /api/server-manager/services/{name}/{version} # Remove service version
POST   /api/server-manager/services/switch-version   # Switch active version (e.g., PHP 8.1 → 8.2)
```

### Server Control

```
POST   /api/server-manager/start                     # Start server (Apache/Nginx)
POST   /api/server-manager/stop                      # Stop server
POST   /api/server-manager/restart                   # Restart server
GET    /api/server-manager/status                    # Get running services status (check processes)
GET    /api/server-manager/ports/check               # Check port availability
```

### Project Management (Scan www/)

```
GET    /api/server-manager/projects                  # Scan www/ folder → list projects
GET    /api/server-manager/projects/{name}           # Get project details (read .chimera file)
POST   /api/server-manager/projects/create           # Create new project folder
DELETE /api/server-manager/projects/{name}           # Delete project folder
PUT    /api/server-manager/projects/{name}/config    # Update .chimera config file
POST   /api/server-manager/projects/{name}/start     # Generate config + start server for project
POST   /api/server-manager/projects/{name}/stop      # Stop project server
```

### Domain Management (Hosts File Operations)

```
GET    /api/server-manager/domains                   # Read hosts file → list ChimeraAI domains
POST   /api/server-manager/domains/add               # Add domain to hosts file (requires Admin)
DELETE /api/server-manager/domains/{domain}          # Remove domain from hosts file
PUT    /api/server-manager/domains/extension         # Change global extension (.test → .websiteku)
POST   /api/server-manager/domains/sync              # Re-sync hosts file with www/ projects
```

### Configuration Management (settings.json)

```
GET    /api/server-manager/config                    # Read settings.json
PUT    /api/server-manager/config                    # Update settings.json
GET    /api/server-manager/config/templates          # Get config templates (apache.conf.tpl, nginx.conf.tpl)
```

### Logs (Read from Files)

```
GET    /api/server-manager/logs/apache               # Read logs/apache/access.log + error.log
GET    /api/server-manager/logs/nginx                # Read logs/nginx/access.log + error.log
GET    /api/server-manager/logs/mysql                # Read logs/mysql/error.log
POST   /api/server-manager/logs/clear                # Clear log files (truncate)
```

---

## 🎨 Frontend Components

### 1. ServerManagementPage (Main Dashboard)
**File:** `src/pages/ServerManagementPage.tsx`

**Replace:** `src/pages/PortfolioPage.tsx`

**Layout:**
```
┌──────────────────────────────────────────────────────────────┐
│  Server Management            [+ Add Service] [+ Create App] │
├──────────────────────────────────────────────────────────────┤
│  ┌────────────────┐  ┌───────────────────────────────────┐  │
│  │ Active Services│  │ Quick Actions                     │  │
│  │ ──────────────│  │ ─────────────────────────────────│  │
│  │ Apache  ●      │  │ [Start All] [Stop All] [Restart] │  │
│  │ v2.4.58        │  │                                   │  │
│  │ Port 80        │  │ Domain Extension: .test           │  │
│  │                │  │ [Change to .websiteku] [Custom]   │  │
│  │ MySQL   ●      │  │                                   │  │
│  │ v8.0.30        │  │ PHP Version: 8.2.5 [Switch]       │  │
│  │ Port 3306      │  │ [8.1.10] [8.2.5] [+ Download]     │  │
│  │                │  │                                   │  │
│  │ Nginx   ○      │  │                                   │  │
│  │ Not running    │  │                                   │  │
│  └────────────────┘  └───────────────────────────────────┘  │
├──────────────────────────────────────────────────────────────┤
│  Projects (Auto-detected from www/)         [Grid] [List]   │
│  ──────────────────────────────────────────────────────────  │
│                                                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ 🌐 nourivex  │  │ 🌐 blog      │  │ 🌐 api       │      │
│  │ ────────────│  │ ────────────│  │ ────────────│      │
│  │ ● Running    │  │ ○ Stopped    │  │ ● Running    │      │
│  │ nourivex.test│  │ blog.test    │  │ api.test     │      │
│  │ Apache:80    │  │ Nginx:8080   │  │ Nginx:8080   │      │
│  │ PHP 8.2.5    │  │ PHP 8.1.10   │  │ Node.js      │      │
│  │              │  │              │  │              │      │
│  │ [Stop]       │  │ [Start]      │  │ [Stop]       │      │
│  │ [Config]     │  │ [Config]     │  │ [Config]     │      │
│  │ [Delete]     │  │ [Delete]     │  │ [Delete]     │      │
│  │ [Browse →]   │  │ [Browse →]   │  │ [Browse →]   │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└──────────────────────────────────────────────────────────────┘
```

**Features:**
- Real-time service status (scan processes, not database!)
- Auto-detect projects from `www/` folder
- PHP version switcher
- Domain extension switcher
- Service manager access

---

### 2. ServiceLibrary Component
**File:** `src/components/server-manager/ServiceLibrary.tsx`

**Modular Service Download UI:**
```
┌───────────────────────────────────────────────────────┐
│  Service Library                            [Close]   │
├───────────────────────────────────────────────────────┤
│  [All] [Web Servers] [Languages] [Databases]         │
│                                                       │
│  ┌─────────────────┐  ┌─────────────────┐           │
│  │ 🟦 Apache       │  │ 🟩 Nginx        │           │
│  │ HTTP Server     │  │ High Performance│           │
│  │                 │  │                 │           │
│  │ Available:      │  │ Available:      │           │
│  │ • 2.4.58 (15MB)│  │ • 1.24.0 (1MB) │           │
│  │   [Download]    │  │   [Download]    │           │
│  │                 │  │                 │           │
│  │ Installed: ✅   │  │ Installed: ❌   │           │
│  │ • 2.4.58        │  │ None            │           │
│  └─────────────────┘  └─────────────────┘           │
│                                                       │
│  ┌─────────────────┐  ┌─────────────────┐           │
│  │ 🟣 PHP          │  │ 🟠 MySQL        │           │
│  │ Language        │  │ Database        │           │
│  │                 │  │                 │           │
│  │ Available:      │  │ Available:      │           │
│  │ • 8.1.10 (25MB)│  │ • 8.0.30 (200MB)│           │
│  │   [Download]    │  │   [Download]    │           │
│  │ • 8.2.5 (27MB) │  │                 │           │
│  │   [Download]    │  │ Installed: ✅   │           │
│  │                 │  │ • 8.0.30        │           │
│  │ Installed: ✅   │  └─────────────────┘           │
│  │ • 8.2.5         │                                 │
│  └─────────────────┘                                 │
└───────────────────────────────────────────────────────┘
```

**Features:**
- Browse available services from `service_library.json`
- Download binaries from official sources
- Show download progress (0-100%)
- Auto-detect installed services (scan `bin/` folder)
- Support multiple versions (PHP 8.1 + 8.2 simultaneously)

---

### 3. VersionSwitcher Component
**File:** `src/components/server-manager/VersionSwitcher.tsx`

**PHP Version Switcher Example:**
```
┌──────────────────────────────────────┐
│  PHP Version                         │
├──────────────────────────────────────┤
│  Active: 8.2.5 ✅                    │
│                                      │
│  Available Versions:                 │
│  ○ PHP 8.1.10                        │
│     [Switch] [Remove]                │
│                                      │
│  ◉ PHP 8.2.5 (Active)                │
│     [Config] [Remove]                │
│                                      │
│  [+ Download More Versions]          │
│                                      │
│  ⚠️ Switching will restart Apache    │
│                         [Cancel] [OK]│
└──────────────────────────────────────┘
```

**Features:**
- List all installed versions (scan `bin/php/`)
- Switch active version (update `settings.json` + restart server)
- Remove unused versions
- Download new versions link

---

### 2. CreateAppWizard
**File:** `src/components/server-manager/CreateAppWizard.tsx`

**Modal Wizard with Steps:**

**Step 1: Project Info**
```
┌─────────────────────────────────────┐
│  Create New App                     │
├─────────────────────────────────────┤
│  Project Name:                      │
│  [nourivex______________]           │
│                                     │
│  Display Name (optional):          │
│  [Nourivex Application__]          │
│                                     │
│  Description (optional):           │
│  [My personal project...___]       │
│                                     │
│              [Cancel]  [Next →]    │
└─────────────────────────────────────┘
```

**Step 2: Template Selection**
```
┌─────────────────────────────────────┐
│  Choose Template                    │
├─────────────────────────────────────┤
│  ○ Blank HTML                       │
│     Empty HTML/CSS/JS project      │
│                                     │
│  ○ PHP App (with Apache)           │
│     Basic PHP setup with index.php │
│                                     │
│  ○ Node.js API (Coming Soon)       │
│     Express.js boilerplate         │
│                                     │
│  ○ React SPA (Coming Soon)         │
│     Create React App template      │
│                                     │
│           [← Back]  [Next →]       │
└─────────────────────────────────────┘
```

**Step 3: Server Configuration**
```
┌─────────────────────────────────────┐
│  Server Settings                    │
├─────────────────────────────────────┤
│  Server Type:                       │
│  ◉ Apache (Port 80)                │
│  ○ Nginx (Port 8080)               │
│                                     │
│  Domain:                            │
│  [nourivex].test                    │
│               ↑ extension           │
│                                     │
│  Custom Port (optional):           │
│  [80__] (default for Apache)       │
│                                     │
│  ☑ Auto-start on app launch        │
│  ☑ Open browser after creation     │
│                                     │
│      [← Back]  [Create Project]    │
└─────────────────────────────────────┘
```

---

### 3. ServerStatusPanel
**File:** `src/components/server-manager/ServerStatusPanel.tsx`

**Real-time Status Card:**
```
┌────────────────────────────────┐
│  Apache Server                 │
│  ──────────────────────────── │
│  Status:  ● Running            │
│  Port:    80                   │
│  PID:     12345                │
│  Uptime:  2h 34m               │
│                                │
│  [Stop Server]  [Restart]      │
│  [View Logs]                   │
└────────────────────────────────┘
```

**Indicators:**
- ● Green: Running
- ○ Gray: Stopped
- ⚠️ Yellow: Starting/Stopping
- ❌ Red: Error

---

### 4. DomainConfigPanel
**File:** `src/components/server-manager/DomainConfigPanel.tsx`

**Hosts File Management:**
```
┌───────────────────────────────────────┐
│  Domain Configuration                 │
├───────────────────────────────────────┤
│  Current Extension: .test             │
│  [Switch to .websiteku] [Custom...]   │
│                                       │
│  Active Domains:                      │
│  ────────────────────────────────── │
│  127.0.0.1  nourivex.test        [✓] │
│  127.0.0.1  blog.test            [✓] │
│  127.0.0.1  api.test             [✓] │
│                                       │
│  Requires Admin/sudo permission       │
│                                       │
│  [Refresh Hosts]  [Edit Manually]     │
└───────────────────────────────────────┘
```

**Features:**
- Toggle domains on/off (without deleting project)
- Bulk domain extension change
- Manual hosts file editor (for advanced users)
- Auto-detect permission issues
- Sync button (reload hosts file)

---

### 5. ProjectCard
**File:** `src/components/server-manager/ProjectCard.tsx`

**Individual Project Display:**
```
┌──────────────────────────────┐
│  🌐 nourivex                 │
│  ────────────────────────── │
│  Status:    ● Running        │
│  Domain:    nourivex.test    │
│  Server:    Apache (Port 80) │
│  Type:      HTML/PHP         │
│                              │
│  [Stop]  [Restart]           │
│  [Edit]  [Browse]  [Delete]  │
│                              │
│  Last Started: 2h ago        │
└──────────────────────────────┘
```

---

### 6. ServerLogsViewer
**File:** `src/components/server-manager/ServerLogsViewer.tsx`

**Log Display Modal:**
```
┌────────────────────────────────────────────┐
│  Server Logs - Apache                      │
├────────────────────────────────────────────┤
│  [Access Logs]  [Error Logs]  [System]    │
│                                            │
│  [2025-01-26 10:32:15] GET / 200          │
│  [2025-01-26 10:32:16] GET /style.css 200 │
│  [2025-01-26 10:32:18] GET /script.js 404 │
│  [2025-01-26 10:32:20] POST /api 200      │
│                                            │
│  Auto-refresh: ☑ On  [Clear Logs]         │
│                              [Close]       │
└────────────────────────────────────────────┘
```

---

## 🔧 Electron Main Process Modules

### 1. ServiceManager Module
**File:** `electron/modules/ServiceManager.ts`

**Responsibilities:**
- Manage services in `chimera_system/bin/` folder
- Start/stop Apache/Nginx/MySQL processes
- Monitor service health (check if process running)
- Generate dynamic configs per project
- Handle server crashes and auto-restart

**Key Methods:**
```typescript
class ServiceManager {
  // Start service with custom config
  async startService(
    service: 'apache' | 'nginx' | 'mysql',
    config: ServiceConfig
  ): Promise<boolean>
  
  // Stop service gracefully
  async stopService(service: string): Promise<boolean>
  
  // Restart service
  async restartService(service: string): Promise<boolean>
  
  // Get service status (scan processes, not database!)
  async getServiceStatus(service: string): Promise<ServiceStatus>
  
  // Generate Apache config for project
  async generateApacheConfig(project: Project): Promise<string>
  
  // Generate Nginx config for project
  async generateNginxConfig(project: Project): Promise<string>
  
  // Get all running services
  async getRunningServices(): Promise<ServiceStatus[]>
}
```

---

### 2. ServiceDownloader Module (NEW!)
**File:** `electron/modules/ServiceDownloader.ts`

**Responsibilities:**
- Download service binaries on-demand (like Laragon)
- Extract to `chimera_system/bin/`
- Verify checksums for security
- Show download progress to UI
- Support multiple versions (PHP 8.1 + 8.2)

**Key Methods:**
```typescript
class ServiceDownloader {
  // Download service from official source
  async downloadService(
    service: string,      // 'php'
    version: string,      // '8.2.5'
    onProgress: (percent: number) => void
  ): Promise<boolean>
  
  // Get available services catalog
  async getServiceLibrary(): Promise<ServiceLibrary>
  
  // Detect installed services (scan bin/ folder)
  async getInstalledServices(): Promise<InstalledServices>
  
  // Remove service version
  async removeService(service: string, version: string): Promise<boolean>
  
  // Verify download integrity
  async verifyChecksum(filePath: string, expectedHash: string): Promise<boolean>
  
  // Extract zip to destination
  async extractArchive(zipPath: string, destination: string): Promise<boolean>
}
```

**Download Flow:**
```typescript
// Example: Download PHP 8.2.5
const downloader = new ServiceDownloader()

await downloader.downloadService('php', '8.2.5', (progress) => {
  console.log(`Downloading: ${progress}%`)
  sendToUI({ type: 'download_progress', value: progress })
})

// Result:
// chimera_system/bin/php/php-8.2.5/ created with all files
```

---

### 3. FileScanner Module (NEW!)
**File:** `electron/modules/FileScanner.ts`

**Responsibilities:**
- Scan `www/` folder for projects (no database!)
- Detect project types (HTML, PHP, Node.js, React)
- Read `.chimera` config files
- Monitor file changes (auto-refresh project list)

**Key Methods:**
```typescript
class FileScanner {
  // Scan www/ folder and return projects
  async scanProjects(): Promise<Project[]>
  
  // Get single project details
  async getProject(name: string): Promise<Project>
  
  // Read .chimera config file
  async readProjectConfig(projectPath: string): Promise<ProjectConfig | null>
  
  // Write .chimera config file
  async writeProjectConfig(projectPath: string, config: ProjectConfig): Promise<boolean>
  
  // Watch www/ folder for changes
  async watchProjects(onChange: (projects: Project[]) => void): void
  
  // Detect project type from files
  detectProjectType(projectPath: string): ProjectType // html, php, nodejs, react
}
```

**Scan Logic:**
```typescript
async scanProjects(): Promise<Project[]> {
  const wwwPath = path.join(systemPath, 'www')
  const folders = await fs.readdir(wwwPath)
  
  const projects = []
  
  for (const folder of folders) {
    const projectPath = path.join(wwwPath, folder)
    const stat = await fs.stat(projectPath)
    
    if (!stat.isDirectory()) continue
    
    // Read optional .chimera config
    const config = await this.readProjectConfig(projectPath)
    
    // Detect project type
    const type = this.detectProjectType(projectPath)
    
    // Get server config from settings.json
    const settings = readSettings()
    
    projects.push({
      name: folder,
      path: projectPath,
      type: type,
      domain: config?.custom_domain || `${folder}.${settings.domain_extension}`,
      server: config?.server || settings.default_server,
      port: config?.port || settings[config?.server || settings.default_server].default_port,
      phpVersion: config?.php_version || settings.php.active_version,
      status: await this.checkProjectStatus(folder) // Check if running
    })
  }
  
  return projects
}
```

---

### 4. ConfigManager Module (NEW!)
**File:** `electron/modules/ConfigManager.ts`

**Responsibilities:**
- Read/write `settings.json` (global config)
- Manage config templates (apache.conf.tpl, nginx.conf.tpl)
- Validate configurations
- NO DATABASE! File-based only.

**Key Methods:**
```typescript
class ConfigManager {
  // Read global settings
  async readSettings(): Promise<Settings>
  
  // Write global settings
  async writeSettings(settings: Settings): Promise<boolean>
  
  // Get config template
  async getTemplate(type: 'apache' | 'nginx'): Promise<string>
  
  // Update template
  async updateTemplate(type: string, content: string): Promise<boolean>
  
  // Validate settings
  async validateSettings(settings: Settings): Promise<ValidationResult>
  
  // Reset to defaults
  async resetSettings(): Promise<Settings>
}
```

---

### 5. HostsFileEditor Module (Unchanged from Original)
**File:** `electron/modules/HostsFileEditor.ts`

**Responsibilities:**
- Detect hosts file location (OS-specific)
- Request Admin/sudo privileges
- Safely edit hosts file (backup before changes)
- Add/remove domain entries
- Validate entries before writing

**Key Methods:**
```typescript
class HostsFileEditor {
  async requestAdminPermission(): Promise<boolean>
  async addDomain(domain: string, ip: string = '127.0.0.1'): Promise<boolean>
  async removeDomain(domain: string): Promise<boolean>
  async listDomains(): Promise<HostEntry[]>
  async syncHostsFile(): Promise<void>
  async backupHostsFile(): Promise<string>
  async restoreHostsFile(backupPath: string): Promise<boolean>
}
```

---

### 6. ProcessSupervisor Module (Unchanged)
**File:** `electron/modules/ProcessSupervisor.ts`

**Responsibilities:**
- Track all running server processes (PID, port, status)
- Monitor process health (check if alive)
- Kill zombie processes on app exit
- Auto-restart servers if they crash (configurable)
- Resource monitoring (CPU, memory usage)

**Key Methods:**
```typescript
class ProcessSupervisor {
  async spawnProcess(command: string, args: string[]): Promise<ChildProcess>
  async killProcess(pid: number): Promise<boolean>
  async getProcessStatus(pid: number): Promise<ProcessStatus>
  async killAllServers(): Promise<void>
  async onAppExit(): Promise<void> // Cleanup handler
}
```

---

### 7. PortManager Module (Unchanged)
**File:** `electron/modules/PortManager.ts`

**Responsibilities:**
- Check if port is available (not in use)
- Suggest alternative ports if occupied
- Detect port conflicts

**Key Methods:**
```typescript
class PortManager {
  async isPortAvailable(port: number): Promise<boolean>
  async findAvailablePort(startPort: number = 8000): Promise<number>
  async getPortInfo(port: number): Promise<PortInfo>
}
```

---

## 📦 Modular Service Management (Laragon-Style)

### Philosophy: Download On-Demand, Not Bundled

**Traditional Approach (WRONG for our case):**
```
❌ Bundle Apache/Nginx/PHP binaries inside app.asar
❌ Increases app download size (40-200MB)
❌ Cannot update services without re-downloading app
❌ User stuck with pre-packaged versions
❌ No version switching capability
```

**Laragon Approach (OUR APPROACH):**
```
✅ App ships with ONLY the service manager (~5MB)
✅ User downloads services on-demand (Apache, PHP, MySQL, etc.)
✅ Services stored in isolated chimera_system/bin/ folder
✅ Support multiple versions (PHP 8.1 + 8.2 simultaneously)
✅ User can update/remove services independently
✅ Portable - can move chimera_system/ folder anywhere
```

---

### Directory Structure (After Service Downloads)

**Initial State (Fresh Install):**
```
ChimeraAI-win32-x64/
├── ChimeraAI.exe                    # Main Electron app (~50MB)
├── resources/
│   ├── app.asar                     # Frontend + Backend code
│   └── service_library.json         # Catalog of available services
└── chimera_system/                  # Created on first run
    ├── config/
    │   ├── settings.json            # User settings (empty initially)
    │   ├── apache.conf.tpl          # Config templates (shipped)
    │   └── nginx.conf.tpl
    ├── www/                         # Empty (user creates projects)
    ├── logs/                        # Empty (created when servers run)
    └── bin/                         # Empty (services downloaded here)
```

**After User Downloads Services:**
```
chimera_system/
├── bin/
│   ├── apache/
│   │   └── httpd-2.4.58/           # Downloaded & extracted
│   │       ├── bin/
│   │       │   └── httpd.exe
│   │       ├── conf/
│   │       │   └── httpd.conf
│   │       └── modules/
│   │           └── mod_*.so
│   │
│   ├── nginx/
│   │   └── nginx-1.24.0/           # Downloaded & extracted
│   │       ├── nginx.exe
│   │       └── conf/
│   │
│   ├── php/
│   │   ├── php-8.1.10/             # Downloaded (version 1)
│   │   │   ├── php.exe
│   │   │   ├── php-cgi.exe
│   │   │   └── php.ini
│   │   └── php-8.2.5/              # Downloaded (version 2)
│   │       ├── php.exe
│   │       ├── php-cgi.exe
│   │       └── php.ini
│   │
│   └── mysql/
│       └── mysql-8.0.30/           # Downloaded (optional)
│           ├── bin/
│           │   └── mysqld.exe
│           └── data/               # Database files
│
├── www/
│   └── nourivex/                   # User created project
│
└── logs/
    ├── apache/
    │   ├── access.log
    │   └── error.log
    └── mysql/
        └── error.log
```

---

### Service Download Flow

**User Story: Installing Apache**

```
1. User opens ChimeraAI → Server Management page
2. User clicks "Add Service" button
3. ServiceLibrary modal opens
4. User clicks "Download Apache 2.4.58"
5. Backend starts download:
   - URL: https://www.apachelounge.com/download/.../httpd-2.4.58-win64-VS17.zip
   - Size: 15MB
   - Progress: 0% → 100% (shown in UI)
6. Backend extracts zip to:
   - chimera_system/bin/apache/httpd-2.4.58/
7. Backend updates settings.json:
   {
     "apache": {
       "installed": true,
       "active_version": "2.4.58",
       "executable_path": "bin/apache/httpd-2.4.58/bin/httpd.exe"
     }
   }
8. UI shows "✅ Apache 2.4.58 installed successfully!"
9. User can now start Apache server
```

---

### Service Version Management

**Example: Multiple PHP Versions**

**User Workflow:**
```
1. User downloads PHP 8.1.10 (for older project)
2. User downloads PHP 8.2.5 (for new project)
3. Both versions coexist in bin/php/
4. Global active version: 8.2.5 (in settings.json)
5. Project "blog" can override: use 8.1.10 (in .chimera file)
6. User can switch global version via UI → restarts Apache
```

**File Structure:**
```
bin/php/
├── php-8.1.10/
│   ├── php.exe
│   └── php.ini
└── php-8.2.5/
    ├── php.exe
    └── php.ini
```

**settings.json:**
```json
{
  "php": {
    "active_version": "8.2.5",
    "versions": {
      "8.1.10": "bin/php/php-8.1.10/php-cgi.exe",
      "8.2.5": "bin/php/php-8.2.5/php-cgi.exe"
    }
  }
}
```

**Project Override (.chimera file in www/blog/):**
```json
{
  "php_version": "8.1.10",
  "server": "apache",
  "port": 80
}
```

---

### Service Update Strategy

**Updating Apache (example):**
```
1. New version released: Apache 2.4.60
2. ServiceLibrary automatically shows "Update Available"
3. User clicks "Update"
4. Backend:
   - Downloads new version zip
   - Extracts to bin/apache/httpd-2.4.60/
   - Updates settings.json active_version
   - KEEPS old version (2.4.58) for rollback
5. User can switch back to 2.4.58 if needed
6. User can manually delete old versions via UI
```

---

### Service Removal

**Removing PHP 8.1.10:**
```
1. User goes to Service Manager
2. User clicks "PHP 8.1.10" → "Remove"
3. UI checks: "Are you sure? Project 'blog' uses this version!"
4. User confirms
5. Backend:
   - Deletes bin/php/php-8.1.10/ folder
   - Updates settings.json (removes entry)
   - Projects using this version fallback to active version
6. Disk space freed!
```

---

### Portable Mode

**Key Feature: Move chimera_system/ anywhere!**

```
Scenario: User wants to run ChimeraAI from USB drive

1. Copy entire chimera_system/ folder to USB
2. Launch ChimeraAI from USB
3. App detects chimera_system/ in current directory
4. All services work! (Apache, PHP, MySQL)
5. Projects accessible on any PC
```

**Path Resolution Logic:**
```typescript
function getSystemPath(): string {
  // Priority 1: Portable mode (same directory as exe)
  const portablePath = path.join(process.execPath, '../chimera_system')
  if (fs.existsSync(portablePath)) return portablePath
  
  // Priority 2: User home directory
  const homePath = path.join(os.homedir(), 'ChimeraAI/chimera_system')
  if (fs.existsSync(homePath)) return homePath
  
  // Priority 3: Create new in user home
  fs.mkdirSync(homePath, { recursive: true })
  return homePath
}
```

---

### Service Binary Sources

**Official Download URLs:**

| Service | Version | URL | Size | License |
|---------|---------|-----|------|---------|
| **Apache** | 2.4.58 | [ApacheLounge](https://www.apachelounge.com/download/) | 15MB | Apache 2.0 |
| **Nginx** | 1.24.0 | [nginx.org](https://nginx.org/download/) | 1MB | BSD-like |
| **PHP** | 8.1.10 | [windows.php.net](https://windows.php.net/download/) | 25MB | PHP License |
| **PHP** | 8.2.5 | [windows.php.net](https://windows.php.net/download/) | 27MB | PHP License |
| **MySQL** | 8.0.30 | [dev.mysql.com](https://dev.mysql.com/downloads/mysql/) | 200MB | GPL |
| **MariaDB** | 10.11 | [mariadb.org](https://mariadb.org/download/) | 150MB | GPL |

**Checksum Verification:**
- All downloads verified with SHA256 checksum
- Prevents corrupted/tampered binaries
- Service library includes checksums for each version

---

### Electron Builder Config (Updated)

**File:** `electron-builder.json`

**NO BINARIES BUNDLED! Only ship service manager.**

```json
{
  "appId": "com.chimera.ai",
  "productName": "ChimeraAI",
  "extraResources": [
    {
      "from": "resources/service_library.json",
      "to": "service_library.json"
    },
    {
      "from": "resources/config_templates",
      "to": "config_templates",
      "filter": ["*.tpl", "*.template"]
    }
  ],
  "files": [
    "!**/bin/**",              // Exclude pre-bundled binaries
    "!**/servers/**",          // Exclude server folders
    "!**/chimera_system/**"    // Exclude system folder
  ],
  "win": {
    "target": "nsis",
    "requestedExecutionLevel": "requireAdministrator"
  },
  "nsis": {
    "oneClick": false,
    "allowToChangeInstallationDirectory": true
  }
}
```

**Result:**
- ChimeraAI installer: ~50MB (without services)
- User downloads services as needed (10-200MB per service)
- Faster initial download for users
- Flexibility to add/remove services anytime

---

## 🚀 Implementation Phases (Revised for File-Based System)

### Phase 5.1: File-Based Foundation (Week 1)

**NO DATABASE! Build file-based system.**

**Tasks:**
1. Create `chimera_system/` folder structure
2. Implement `ConfigManager` module (read/write settings.json)
3. Implement `FileScanner` module (scan www/ for projects)
4. Create config templates (apache.conf.tpl, nginx.conf.tpl)
5. Test file operations (read/write/scan)

**Deliverables:**
- ✅ chimera_system/ folder created
- ✅ settings.json working
- ✅ www/ scanning functional
- ✅ Config templates ready

**Files to Create:**
- `electron/modules/ConfigManager.ts`
- `electron/modules/FileScanner.ts`
- `resources/config_templates/apache.conf.tpl`
- `resources/config_templates/nginx.conf.tpl`
- `resources/service_library.json`

**Test:**
```bash
# Create sample project
mkdir chimera_system/www/nourivex
echo "<h1>Hello</h1>" > chimera_system/www/nourivex/index.html

# Scan projects
node test-scan.js
# Expected: [{name: 'nourivex', path: '...', domain: 'nourivex.test', ...}]
```

---

### Phase 5.2: Service Download System (Week 1-2)

**Tasks:**
1. Implement `ServiceDownloader` module
2. Create Service Library UI component
3. Download Apache/Nginx binaries on-demand
4. Extract to `chimera_system/bin/`
5. Verify checksums for security
6. Show download progress in UI
7. Register services in settings.json

**Deliverables:**
- ✅ ServiceDownloader working
- ✅ Apache downloadable & extractable
- ✅ Nginx downloadable & extractable
- ✅ Download progress UI functional
- ✅ Checksum verification working

**Files to Create:**
- `electron/modules/ServiceDownloader.ts`
- `src/components/server-manager/ServiceLibrary.tsx`
- `src/components/server-manager/DownloadProgress.tsx`

**Test:**
```typescript
// Download Apache
const downloader = new ServiceDownloader()
await downloader.downloadService('apache', '2.4.58')

// Verify extraction
const exists = fs.existsSync('chimera_system/bin/apache/httpd-2.4.58/bin/httpd.exe')
console.log(exists) // true
```

---

### Phase 5.3: Electron Service Manager (Week 2)

**Tasks:**
1. Implement `ServiceManager` module
2. Start/stop Apache/Nginx processes
3. Generate dynamic configs per project
4. Monitor service health (process checking)
5. Handle server crashes and recovery

**Deliverables:**
- ✅ Apache starts from downloaded binary
- ✅ Nginx starts from downloaded binary
- ✅ Dynamic configs generated correctly
- ✅ Process monitoring working
- ✅ Servers accessible on localhost

**Files to Create:**
- `electron/modules/ServiceManager.ts`
- `electron/modules/ProcessSupervisor.ts`
- `electron/modules/PortManager.ts`

**Test:**
```typescript
// Start Apache for project
const manager = new ServiceManager()
await manager.startService('apache', {
  projectPath: 'chimera_system/www/nourivex',
  port: 80,
  domain: 'nourivex.test'
})

// Check status
const status = await manager.getServiceStatus('apache')
console.log(status) // { running: true, pid: 12345, port: 80 }

// Browse http://localhost → see "Hello"
```

---

### Phase 5.4: Frontend UI Components (Week 2-3)

**Tasks:**
1. Replace PortfolioPage → ServerManagementPage
2. Create ProjectsList component (auto-detect from www/)
3. Create ServiceStatusPanel component
4. Create VersionSwitcher component (PHP versions)
5. Integrate with backend API
6. Real-time status updates

**Deliverables:**
- ✅ Server Management UI complete
- ✅ Projects auto-detected from www/
- ✅ Service controls working (start/stop)
- ✅ Version switching functional
- ✅ Real-time status updates

**Files to Create:**
- `src/pages/ServerManagementPage.tsx` (replace Portfolio)
- `src/components/server-manager/ProjectsList.tsx`
- `src/components/server-manager/ServiceStatusPanel.tsx`
- `src/components/server-manager/VersionSwitcher.tsx`
- `src/components/server-manager/ProjectCard.tsx`
- `src/store/serverManagerStore.ts` (Zustand store)

**Route Update:**
- Update `src/App.tsx`:
  ```typescript
  <Route path="/server-manager" element={<ServerManagementPage />} />
  ```

---

### Phase 5.5: Hosts File Integration (Week 3)

**Tasks:**
1. Implement `HostsFileEditor` module
2. Request Admin/sudo permissions
3. Add domains to hosts file automatically
4. Create DomainConfigPanel UI
5. Test domain resolution

**Deliverables:**
- ✅ Hosts file editing working
- ✅ Admin permission flow tested
- ✅ Domains added automatically
- ✅ Projects accessible via custom domains
- ✅ Domain switcher working (.test ↔ .websiteku)

**Files to Create:**
- `electron/modules/HostsFileEditor.ts`
- `src/components/server-manager/DomainConfigPanel.tsx`

**Dependencies:**
```json
{
  "sudo-prompt": "^9.2.1"  // Admin/sudo access
}
```

**Test:**
```bash
# Create project
mkdir chimera_system/www/nourivex

# Start Apache → auto-add domain
# Check hosts file:
cat C:\Windows\System32\drivers\etc\hosts
# Expected: 127.0.0.1  nourivex.test  # ChimeraAI

# Browse http://nourivex.test → works!
```

---

### Phase 5.6: PHP Version Management (Week 3)

**Tasks:**
1. Support multiple PHP versions (8.1 + 8.2)
2. Download PHP binaries on-demand
3. Implement version switcher UI
4. Per-project PHP version override (.chimera file)
5. Global PHP version setting

**Deliverables:**
- ✅ PHP 8.1 downloadable
- ✅ PHP 8.2 downloadable
- ✅ Both versions coexist
- ✅ Version switcher working
- ✅ Per-project override working

**Files to Create:**
- `src/components/server-manager/PHPVersionSwitcher.tsx`

**Test:**
```bash
# Download PHP 8.1 and 8.2
# Global active: 8.2

# Create www/blog/.chimera:
{
  "php_version": "8.1.10"
}

# Start blog → uses PHP 8.1
# Start nourivex → uses PHP 8.2 (global)
# Both running simultaneously!
```

---

### Phase 5.7: App Templates & Wizard (Week 3-4)

**Tasks:**
1. Create "Blank HTML" template
2. Create "PHP App" template
3. Implement CreateAppWizard component
4. Copy template files to www/
5. Auto-configure .chimera file
6. Add "Open in Browser" button

**Deliverables:**
- ✅ Blank HTML template working
- ✅ PHP template working
- ✅ App creation wizard complete
- ✅ Projects created in www/
- ✅ Domain added to hosts automatically

**Files to Create:**
- `resources/templates/blank-html/index.html`
- `resources/templates/blank-html/style.css`
- `resources/templates/blank-html/script.js`
- `resources/templates/php-app/index.php`
- `resources/templates/php-app/.htaccess`
- `src/components/server-manager/CreateAppWizard.tsx`

**Blank HTML Template:**
```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{project_name}}</title>
    <link rel="stylesheet" href="style.css">
</head>
<body>
    <div class="container">
        <h1>Welcome to {{project_name}}!</h1>
        <p>Your project is ready. Start coding!</p>
    </div>
    <script src="script.js"></script>
</body>
</html>
```

---

### Phase 5.8: Testing & Debugging (Week 4)

**Tasks:**
1. End-to-end testing (create → start → browse → stop → delete)
2. Test port conflicts
3. Test Admin permission flow
4. Test server crashes and recovery
5. Test multiple projects simultaneously
6. Test version switching
7. Test portable mode (move chimera_system/)

**Test Scenarios:**
- ✅ Create app "nourivex" → Start Apache → Browse nourivex.test → Works!
- ✅ Port 80 occupied → Show error → Suggest alternative port
- ✅ Hosts file locked → Request Admin → Retry → Success
- ✅ Server crash → Auto-restart (if enabled) → Log error
- ✅ Create 3 projects → Start all → All accessible via custom domains
- ✅ Stop one project → Others still running
- ✅ Delete project → Server stopped → Domain removed from hosts
- ✅ Download PHP 8.1 + 8.2 → Switch versions → Works!
- ✅ Move chimera_system/ to USB → Launch ChimeraAI → All works!

**Deliverables:**
- ✅ All test scenarios passing
- ✅ Known bugs documented
- ✅ Error handling comprehensive

---

### Phase 5.9: MySQL/Database Service (Week 4-5)

**Tasks:**
1. Add MySQL to Service Library
2. Download MySQL 8.0 on-demand
3. Start/stop MySQL service
4. Create database management UI
5. Add phpMyAdmin (optional)

**Deliverables:**
- ✅ MySQL downloadable
- ✅ MySQL service startable
- ✅ Database accessible on port 3306
- ✅ Basic DB management UI

**Files to Create:**
- `src/components/server-manager/DatabaseManager.tsx`

---

### Phase 5.10: Polish & Documentation (Week 5)

**Tasks:**
1. Add loading states & animations
2. Add error notifications (toast)
3. Add confirmation dialogs
4. Write user documentation
5. Write developer documentation
6. Create video demo (optional)

**Deliverables:**
- ✅ UI polished and responsive
- ✅ User guide complete
- ✅ Phase 5 documentation updated

**Files to Update:**
- `docs/phase/phase_5.md` (this file - mark complete)
- `docs/USER_GUIDE_SERVER_MANAGER.md` (new user guide)
- `README.md` (update with Phase 5 status)

---

## 🎯 Success Criteria (Revised for File-Based System)

Phase 5 considered **COMPLETE** when:

### Core Features:
- [x] Planning document created (this file) ✅
- [ ] **File-Based System:**
  - [ ] chimera_system/ folder structure created
  - [ ] settings.json working (read/write)
  - [ ] www/ scanning functional (auto-detect projects)
  - [ ] Config templates working (apache.conf.tpl, nginx.conf.tpl)
- [ ] **Service Download:**
  - [ ] ServiceLibrary UI showing available services
  - [ ] User can download Apache 2.4.58
  - [ ] User can download Nginx 1.24.0
  - [ ] User can download PHP 8.1 and 8.2
  - [ ] Download progress shown in UI (0-100%)
  - [ ] Checksums verified successfully
  - [ ] Services extracted to bin/ folder
- [ ] **Service Management:**
  - [ ] Apache starts from downloaded binary
  - [ ] Nginx starts from downloaded binary
  - [ ] Dynamic configs generated per project
  - [ ] Server status detected (check processes, not database)
  - [ ] Server stop/restart working
- [ ] **Project Management:**
  - [ ] User can create new blank app via wizard
  - [ ] Project folder created in www/
  - [ ] Template files copied correctly
  - [ ] Project auto-detected in project list
- [ ] **Domain Management:**
  - [ ] Hosts file automatically edited (with Admin permission)
  - [ ] Project accessible via custom domain (e.g., nourivex.test)
  - [ ] Domain extension switcher working (.test ↔ .websiteku)
- [ ] **Version Management:**
  - [ ] PHP 8.1 and 8.2 coexist
  - [ ] User can switch global PHP version
  - [ ] Per-project PHP version override (.chimera file)
  - [ ] Version switcher UI working
- [ ] **Logs:**
  - [ ] Read Apache logs directly from files
  - [ ] Read Nginx logs directly from files
  - [ ] Logs viewer UI functional

### Technical:
- [ ] NO DATABASE used for system management ✅
- [ ] File-based operations stable (no data loss)
- [ ] IPC communication between renderer and main process
- [ ] Process cleanup on app exit (no zombie servers)
- [ ] Portable mode working (move chimera_system/ anywhere)

### UX:
- [ ] UI responsive and intuitive
- [ ] Loading states for all async operations
- [ ] Error handling with user-friendly messages
- [ ] Confirmation dialogs for destructive actions
- [ ] Download progress clear
- [ ] Service status indicators accurate

### Platform:
- [ ] Working on Windows 10/11 (priority) ✅
- [ ] Admin/UAC flow tested
- [ ] No security warnings or antivirus false positives

---

## ⚠️ Known Challenges & Solutions (Revised)

### Challenge 1: Admin Permission for Hosts File
**Problem:** Editing hosts file requires Admin/sudo privileges.

**Solution:**
- Use `sudo-prompt` package for UAC/sudo dialog
- Set `requestedExecutionLevel: requireAdministrator` in Electron Builder (optional)
- Alternative: Request permission only when needed (better UX)
- Show clear message: "Admin access needed to configure domains"
- Backup hosts file before every edit
- Graceful fallback: Manual instructions if permission denied

---

### Challenge 2: Service Download Reliability
**Problem:** Downloads can fail (network issues, corrupted files).

**Solution:**
- Implement retry mechanism (3 attempts)
- Verify checksums (SHA256) after download
- Show clear error messages: "Download failed. Retry?"
- Pause/Resume support for large files (MySQL 200MB)
- Fallback mirrors if official source down
- Cache downloaded files for future installs

---

### Challenge 3: Port Conflicts
**Problem:** User may already have Apache/IIS/Nginx on port 80.

**Solution:**
- Check port availability before starting
- Show error: "Port 80 is already in use by another application"
- Suggest alternative ports (8080, 8000, 3000)
- Allow custom port selection in wizard
- Implement "Force kill process on port" feature (advanced users)
- Detect common conflicting services (IIS, XAMPP, Laragon)

---

### Challenge 4: Multiple PHP Versions (Complex!)
**Problem:** Apache needs to load correct PHP version per project.

**Solution:**
- Use FastCGI (php-cgi.exe) instead of mod_php
- Dynamic Apache config generation per project:
  ```apache
  Action application/x-httpd-php "C:/chimera_system/bin/php/php-8.2.5/php-cgi.exe"
  ```
- Override per project via .chimera file
- Restart Apache when switching global PHP version
- Test thoroughly - this is tricky on Windows!

---

### Challenge 5: Portable Mode Path Resolution
**Problem:** Absolute paths break when moving chimera_system/.

**Solution:**
- ALWAYS use relative paths in configs
- Detect chimera_system/ location dynamically at runtime
- Support env variable: `CHIMERA_SYSTEM_PATH`
- Allow user to set custom system path in settings
- Test portable mode extensively

---

### Challenge 6: Service Binary Compatibility
**Problem:** Different OS/architectures require different binaries.

**Solution:**
- Phase 5: Windows x64 only (90% of users)
- Phase 5.11: Mac Intel & Apple Silicon
- Phase 5.12: Linux (AppImage/DEB/RPM)
- Use `process.platform` and `process.arch` to detect OS
- Service library includes platform-specific download URLs

---

### Challenge 7: Large App Size (With All Services)
**Problem:** Apache + Nginx + PHP + MySQL = 250MB+.

**Solution:**
- ✅ Don't bundle! Download on-demand (Laragon approach)
- User downloads only what they need
- MySQL optional (only if user wants database)
- ChimeraAI installer: ~50MB (without services)
- User bandwidth: Download services as needed (transparent)

---

### Challenge 8: Config File Corruption
**Problem:** User edits settings.json manually and breaks it.

**Solution:**
- Validate JSON before writing
- Create backup before every write
- Show error: "Config file corrupted. Restored from backup."
- Provide "Reset to Defaults" button
- Use JSON schema validation (ajv package)

---

### Challenge 9: Server Crashes
**Problem:** Apache/Nginx crashes during operation.

**Solution:**
- Implement auto-restart (configurable)
- Log crash details to `logs/system.log`
- Show notification: "Apache crashed and restarted"
- Detect crash loops (restart 3x in 1 min → stop)
- Provide "View Crash Log" button

---

### Challenge 10: No Database = How to Track Running Services?
**Problem:** Without database, how to know which services are running?

**Solution:**
- ✅ Check running processes! (ps-node package)
- Read PID files (Apache/Nginx create .pid files)
- Query processes by executable path
- Cache status in memory (Electron main process state)
- Refresh status every 5 seconds

```typescript
async function isServiceRunning(service: string): Promise<boolean> {
  const settings = readSettings()
  const exePath = settings[service].executable_path
  
  // Method 1: Check process list
  const processes = await ps.lookup({ command: exePath })
  return processes.length > 0
  
  // Method 2: Check PID file (if exists)
  const pidFile = path.join(systemPath, 'bin', service, `${service}.pid`)
  if (fs.existsSync(pidFile)) {
    const pid = parseInt(fs.readFileSync(pidFile, 'utf-8'))
    return await processExists(pid)
  }
  
  return false
}
```

---

## 🔄 Future Enhancements (Post-Phase 5)

### Phase 5.11: Node.js & React Templates
- Template: Express.js API boilerplate
- Template: React SPA with Vite
- Auto-detect package.json and run `yarn install`
- Auto-run `yarn start` or `yarn run dev`
- Support for custom npm/yarn scripts
- PM2 integration for Node.js process management

### Phase 5.12: MySQL & Database Services (as downloadable services!)
- Add MySQL 8.0 to Service Library (download on-demand)
- Add MariaDB 10.11 to Service Library
- Add PostgreSQL 14+ to Service Library
- Start/stop database services like Apache/Nginx
- phpMyAdmin auto-install option
- Database connection manager UI
- **NOTE:** These are SERVICES, not backend databases!

### Phase 5.13: Redis & Memcached
- Add Redis to Service Library
- Add Memcached to Service Library
- Cache monitoring UI
- Integration with PHP projects

### Phase 5.14: Visual Config Editor
- GUI for editing Apache/Nginx configs
- SSL certificate generator (self-signed)
- Virtual hosts manager
- Rewrite rules editor
- Performance tuning wizard

### Phase 5.15: Project Templates Marketplace
- Import templates from GitHub
- Share custom templates
- Community template library
- One-click project setup from template URL
- Template categories (CMS, E-commerce, API)

### Phase 5.16: Docker Integration (Optional)
- Optional: Use Docker instead of native servers
- Docker Compose support
- Container management UI
- Image builder
- Hybrid mode: Native + Docker

### Phase 5.17: Deployment Tools
- FTP/SFTP deployment
- Git deployment (push to production)
- One-click deploy to VPS
- Integration with Vercel/Netlify
- Deployment history & rollback

### Phase 5.18: Mac & Linux Support
- Download Mac Intel binaries (Apache, Nginx, PHP)
- Download Mac Apple Silicon binaries (ARM64)
- Linux AppImage support
- Linux package managers (apt, yum)
- Cross-platform testing suite

---

## 📚 Dependencies to Install

### Backend (Python):
```txt
# NO NEW BACKEND DEPENDENCIES!
# No database, no SQLite, just file operations
# Continue using existing FastAPI for API endpoints
```

### Electron (Node.js):
```json
{
  "dependencies": {
    "sudo-prompt": "^9.2.1",      // Admin/sudo access for hosts file
    "portfinder": "^1.0.32",      // Check port availability
    "ps-node": "^0.1.6",          // Process management (check running services)
    "shelljs": "^0.8.5",          // Shell commands (mkdir, cp, rm, etc.)
    "extract-zip": "^2.0.1",      // Extract downloaded service zips
    "node-fetch": "^3.3.0",       // Download service binaries
    "crypto": "built-in"          // Checksum verification (SHA256)
  },
  "devDependencies": {
    "electron-builder": "^24.0.0" // Build Electron app (no binaries bundled!)
  }
}
```

### Frontend (React):
```json
{
  "dependencies": {
    "lucide-react": "^0.x.x",     // Already installed, use Server icon
    "zustand": "^4.x.x"           // State management (serverManagerStore)
    // No new frontend dependencies
  }
}
```

**Note:** Most dependencies already exist in ChimeraAI. Only add `extract-zip` and `node-fetch` if not already present.

---

## 🎨 UI Design Specs

### Color Scheme:
- **Running Status**: Green (#10B981)
- **Stopped Status**: Gray (#6B7280)
- **Error Status**: Red (#EF4444)
- **Starting Status**: Yellow (#F59E0B)

### Icons (Lucide React):
```typescript
import { 
  Server,          // Main server icon
  Play,            // Start server
  Square,          // Stop server
  RotateCw,        // Restart server
  Plus,            // Create new app
  Trash2,          // Delete project
  ExternalLink,    // Open in browser
  Settings,        // Server settings
  Terminal,        // View logs
  Globe,           // Domain config
  Folder,          // Project files
  AlertCircle,     // Error indicator
  CheckCircle,     // Success indicator
  Code             // Edit code
} from 'lucide-react'
```

### Typography:
- **Page Title**: 32px, Bold, font-display
- **Card Title**: 18px, Semibold
- **Status Text**: 14px, Medium
- **Domain Text**: 16px, Mono font (Courier New)
- **Button Text**: 14px, Medium

### Spacing:
- Card padding: 24px
- Grid gap: 20px
- Button height: 40px
- Input height: 44px

---

## 📝 User Documentation Outline

**File:** `docs/USER_GUIDE_SERVER_MANAGER.md`

### Table of Contents:
1. **Introduction** - What is Server Manager?
2. **Getting Started** - First-time setup
3. **Creating Your First App** - Step-by-step wizard
4. **Starting & Stopping Servers** - Server controls
5. **Accessing Your App** - Using custom domains
6. **Managing Multiple Projects** - Bulk operations
7. **Troubleshooting** - Common issues & solutions
8. **Advanced Features** - Custom configs, manual editing
9. **FAQ** - Frequently asked questions

---

## 🔗 Related Documentation

- **Phase 0:** Foundation & Architecture (Electron setup)
- **Phase 1:** UI Enhancement (Design system)
- **Phase 2:** Tools System (Database & API patterns)
- **Phase 4:** Tool Editor (File management reference)
- **Golden Rules:** Project conventions

---

## 📊 Progress Tracking

| Sub-Phase | Status | Backend | Frontend | Electron | Testing |
|-----------|--------|---------|----------|----------|---------|
| 5.1: Database | 📋 Planned | 0% | - | - | - |
| 5.2: Electron Modules | 📋 Planned | - | - | 0% | - |
| 5.3: Frontend UI | 📋 Planned | - | 0% | - | - |
| 5.4: Apache/Nginx | 📋 Planned | - | - | 0% | - |
| 5.5: Templates | 📋 Planned | 0% | 0% | 0% | - |
| 5.6: Testing | 📋 Planned | - | - | - | 0% |
| 5.7: Polish | 📋 Planned | - | 0% | - | - |

**Overall Progress:** 0% (Planning Phase Complete) 📝

---

## 🎯 Next Actions

### Immediate (User Approval Needed):
1. ✅ Review this Phase 5 plan
2. ⏳ Confirm approach (Full Implementation with bundled servers)
3. ⏳ Approve priority: Windows first, cross-platform later
4. ⏳ Confirm scope: HTML/PHP templates first, Node.js/React later

### After Approval:
1. Start Phase 5.1 (File-Based Foundation)
2. Implement ConfigManager & FileScanner modules
3. Test file operations (scan www/, read/write settings.json)
4. Proceed to Phase 5.2 (Service Download System)

---

## 🏆 Why This Matters

**ChimeraAI will become:**
- ✅ **All-in-one dev tool** - AI + Code + Servers
- ✅ **Laragon alternative** - But with AI assistance!
- ✅ **Beginner-friendly** - Wizard-driven setup
- ✅ **Power-user capable** - Manual config editing
- ✅ **Cross-platform** - One tool, any OS
- ✅ **Unique value** - No other AI tool has local server management

**Market differentiation:**
- VS Code: Code editor only
- Laragon: Servers only (no AI)
- ChatGPT Desktop: AI only (no dev tools)
- **ChimeraAI:** AI + Code + Servers + Tools = Complete platform!

---

**Document Created:** January 26, 2025  
**Status:** 📋 Planning Complete, Ready for User Approval  
**Next Action:** Get user confirmation → Start Phase 5.1 (Database)  
**Estimated Completion:** 4 weeks (full implementation)

---

## 💬 User Confirmation Checklist

Before implementation, confirm:
- [x] Overall architecture approach approved ✅
- [x] File-based system structure approved ✅
- [x] UI/UX mockups approved ✅
- [x] Implementation phases order approved ✅
- [x] Success criteria clear ✅
- [x] Timeline realistic (5 weeks) ✅
- [x] Ready to proceed with Phase 5.1 ✅

---

**Note:** Ini adalah **Full Implementation** plan dengan actual Apache/Nginx bundling. Jika ada perubahan scope atau prioritas, dokumen ini akan di-update sebelum mulai coding.
