/**
 * Test Phase 5.1: File-Based Foundation
 * Tests ConfigManager and FileScanner modules
 */

import { ConfigManager } from '../electron/modules/ConfigManager'
import { FileScanner } from '../electron/modules/FileScanner'
import fs from 'fs/promises'
import fsSync from 'fs'
import path from 'path'
import os from 'os'

async function testConfigManager() {
  console.log('\n=== Testing ConfigManager ===\n')
  
  try {
    // Use temp directory for testing
    const testPath = path.join(os.tmpdir(), 'chimera_test_' + Date.now())
    console.log('Test path:', testPath)
    
    const configManager = new ConfigManager(testPath)
    
    // Test 1: Initialize system
    console.log('Test 1: Initialize chimera_system...')
    await configManager.initialize()
    console.log('✅ Initialization successful')
    
    // Test 2: Read default settings
    console.log('\nTest 2: Read default settings...')
    const settings = await configManager.readSettings()
    console.log('✅ Settings read successfully')
    console.log('Domain extension:', settings.domain_extension)
    console.log('Default server:', settings.default_server)
    console.log('Apache port:', settings.apache.default_port)
    
    // Test 3: Update settings
    console.log('\nTest 3: Update settings...')
    settings.domain_extension = '.websiteku'
    settings.apache.default_port = 8080
    await configManager.writeSettings(settings)
    console.log('✅ Settings updated successfully')
    
    // Test 4: Verify changes
    console.log('\nTest 4: Verify changes...')
    const updatedSettings = await configManager.readSettings()
    console.log('Domain extension:', updatedSettings.domain_extension)
    console.log('Apache port:', updatedSettings.apache.default_port)
    
    if (updatedSettings.domain_extension === '.websiteku' && updatedSettings.apache.default_port === 8080) {
      console.log('✅ Settings persisted correctly')
    } else {
      console.log('❌ Settings not persisted')
    }
    
    // Test 5: Folder structure
    console.log('\nTest 5: Verify folder structure...')
    const folders = [
      'bin',
      'bin/apache',
      'bin/nginx',
      'bin/php',
      'bin/mysql',
      'www',
      'logs',
      'logs/apache',
      'logs/nginx',
      'config'
    ]
    
    for (const folder of folders) {
      const folderPath = path.join(testPath, folder)
      if (fsSync.existsSync(folderPath)) {
        console.log(`✅ ${folder}/ exists`)
      } else {
        console.log(`❌ ${folder}/ missing`)
      }
    }
    
    // Test 6: Config file exists
    console.log('\nTest 6: Verify config files...')
    const settingsPath = path.join(testPath, 'config', 'settings.json')
    if (fsSync.existsSync(settingsPath)) {
      console.log('✅ settings.json exists')
    } else {
      console.log('❌ settings.json missing')
    }
    
    // Cleanup
    console.log('\nCleaning up test files...')
    await fs.rm(testPath, { recursive: true, force: true })
    console.log('✅ Cleanup complete')
    
  } catch (error) {
    console.error('❌ Test failed:', error)
  }
}

async function testFileScanner() {
  console.log('\n=== Testing FileScanner ===\n')
  
  try {
    // Use temp directory for testing
    const testPath = path.join(os.tmpdir(), 'chimera_test_' + Date.now())
    console.log('Test path:', testPath)
    
    const configManager = new ConfigManager(testPath)
    await configManager.initialize()
    
    const fileScanner = new FileScanner(testPath)
    const settings = await configManager.readSettings()
    
    // Test 1: Scan empty www/ folder
    console.log('Test 1: Scan empty www/ folder...')
    let projects = await fileScanner.scanProjects(settings)
    console.log('✅ Scan successful')
    console.log('Projects found:', projects.length)
    
    if (projects.length === 0) {
      console.log('✅ Empty scan works correctly')
    }
    
    // Test 2: Create test projects
    console.log('\nTest 2: Create test projects...')
    
    // Create HTML project
    const htmlProject = path.join(testPath, 'www', 'test-html')
    await fs.mkdir(htmlProject, { recursive: true })
    await fs.writeFile(path.join(htmlProject, 'index.html'), '<h1>Test HTML</h1>')
    console.log('✅ Created test-html project')
    
    // Create PHP project
    const phpProject = path.join(testPath, 'www', 'test-php')
    await fs.mkdir(phpProject, { recursive: true })
    await fs.writeFile(path.join(phpProject, 'index.php'), '<?php echo "Test PHP"; ?>')
    console.log('✅ Created test-php project')
    
    // Create Node.js project
    const nodeProject = path.join(testPath, 'www', 'test-node')
    await fs.mkdir(nodeProject, { recursive: true })
    await fs.writeFile(
      path.join(nodeProject, 'package.json'),
      JSON.stringify({ name: 'test-node', version: '1.0.0' })
    )
    console.log('✅ Created test-node project')
    
    // Test 3: Scan with projects
    console.log('\nTest 3: Scan with projects...')
    projects = await fileScanner.scanProjects(settings)
    console.log('✅ Scan successful')
    console.log('Projects found:', projects.length)
    
    if (projects.length === 3) {
      console.log('✅ All projects detected')
    } else {
      console.log('❌ Expected 3 projects, found', projects.length)
    }
    
    // Test 4: Verify project details
    console.log('\nTest 4: Verify project details...')
    for (const project of projects) {
      console.log(`\nProject: ${project.name}`)
      console.log(`  Type: ${project.type}`)
      console.log(`  Domain: ${project.domain}`)
      console.log(`  Server: ${project.server}`)
      console.log(`  Port: ${project.port}`)
      console.log(`  Status: ${project.status}`)
    }
    
    // Test 5: Project config (.chimera file)
    console.log('\nTest 5: Test .chimera config...')
    const configProject = path.join(testPath, 'www', 'test-config')
    await fs.mkdir(configProject, { recursive: true })
    await fs.writeFile(path.join(configProject, 'index.html'), '<h1>Config Test</h1>')
    
    const projectConfig = {
      server: 'nginx' as const,
      port: 8080,
      php_version: '8.1.10',
      custom_domain: 'mysite.local'
    }
    
    await fileScanner.writeProjectConfig(configProject, projectConfig)
    console.log('✅ .chimera config written')
    
    // Read config back
    const readConfig = await fileScanner.readProjectConfig(configProject)
    console.log('✅ .chimera config read')
    console.log('Config:', readConfig)
    
    if (readConfig && readConfig.server === 'nginx' && readConfig.custom_domain === 'mysite.local') {
      console.log('✅ Config persisted correctly')
    } else {
      console.log('❌ Config not persisted correctly')
    }
    
    // Test 6: Get single project
    console.log('\nTest 6: Get single project...')
    const singleProject = await fileScanner.getProject('test-html', settings)
    if (singleProject) {
      console.log('✅ Single project retrieved')
      console.log('Project name:', singleProject.name)
      console.log('Project type:', singleProject.type)
    } else {
      console.log('❌ Failed to retrieve project')
    }
    
    // Test 7: Delete project
    console.log('\nTest 7: Delete project...')
    await fileScanner.deleteProject('test-html')
    console.log('✅ Project deleted')
    
    projects = await fileScanner.scanProjects(settings)
    if (projects.length === 3) {
      console.log('✅ Project count updated correctly')
    } else {
      console.log(`Expected 3 projects, found ${projects.length}`)
    }
    
    // Cleanup
    console.log('\nCleaning up test files...')
    await fs.rm(testPath, { recursive: true, force: true })
    console.log('✅ Cleanup complete')
    
  } catch (error) {
    console.error('❌ Test failed:', error)
  }
}

// Run tests
async function runTests() {
  console.log('\n🧪 Phase 5.1: File-Based Foundation Tests\n')
  console.log('=' .repeat(60))
  
  await testConfigManager()
  await testFileScanner()
  
  console.log('\n' + '='.repeat(60))
  console.log('\n✅ All tests completed!\n')
}

// Execute
runTests().catch(console.error)
