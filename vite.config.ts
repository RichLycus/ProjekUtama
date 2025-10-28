import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import electron from 'vite-plugin-electron'
import renderer from 'vite-plugin-electron-renderer'
import path from 'path'
import { copyFileSync, mkdirSync, existsSync } from 'fs'
import { execSync } from 'child_process'

export default defineConfig({
  plugins: [
    react(),
    // Custom plugin to build Electron files with proper formats BEFORE vite-plugin-electron
    {
      name: 'build-electron-scripts',
      enforce: 'pre',
      buildStart() {
        console.log('[Custom Plugin] Building Electron scripts...')
        try {
          // Build preload with CommonJS (CRITICAL!)
          execSync(
            './node_modules/.bin/tsc electron/preload.ts --outDir dist-electron --module commonjs --target ES2020 --moduleResolution node --esModuleInterop --skipLibCheck --resolveJsonModule --allowSyntheticDefaultImports --noEmitOnError false',
            { cwd: __dirname, stdio: 'ignore' }
          )
          console.log('[Custom Plugin] ✅ preload.js built as CommonJS')
          
          // Build main with ES2020 modules
          execSync(
            './node_modules/.bin/tsc electron/main.ts --outDir dist-electron --module ES2020 --target ES2020 --moduleResolution node --esModuleInterop --skipLibCheck --resolveJsonModule --allowSyntheticDefaultImports --noEmitOnError false',
            { cwd: __dirname, stdio: 'ignore' }
          )
          console.log('[Custom Plugin] ✅ main.js built as ES2020')
        } catch (e) {
          console.warn('[Custom Plugin] TypeScript errors (ignored):', (e as any).message)
        }
      }
    },
    electron([
      {
        entry: 'electron/main.ts',
        vite: {
          build: {
            outDir: 'dist-electron',
            rollupOptions: {
              external: ['electron'],
            },
          },
        },
      },
    ]),
    renderer(),
    // Custom plugin to copy logo to dist
    {
      name: 'copy-logo',
      closeBundle() {
        const distDir = path.resolve(__dirname, 'dist')
        const logoSrc = path.resolve(__dirname, 'public/logo-128.png')
        const logoDest = path.resolve(distDir, 'logo-128.png')
        
        if (existsSync(logoSrc) && existsSync(distDir)) {
          try {
            copyFileSync(logoSrc, logoDest)
            console.log('✅ Logo copied to dist/')
          } catch (e) {
            console.error('Failed to copy logo:', e)
          }
        }
      }
    }
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@electron': path.resolve(__dirname, './electron'),
    },
  },
  server: {
    port: 5173,
    fs: {
      // Allow frontend_tools but exclude other backend files
      strict: false,  // ← Changed to false for universal paths!
      allow: [
        path.resolve(__dirname, '.'),  // ← Allow entire project root
        path.resolve(__dirname, 'src'),
        path.resolve(__dirname, 'public'),
        path.resolve(__dirname, 'electron'),
        path.resolve(__dirname, 'node_modules'),
        path.resolve(__dirname, 'backend'),  // ← Allow backend for frontend_tools access
      ]
    },
    watch: {
      // Watch frontend_tools and tools/*/frontend for changes, ignore other backend files
      ignored: [
        '**/backend/!(frontend_tools|tools)/**',  // Allow frontend_tools & tools
        '**/backend/tools/**/!(frontend)/**',  // Only allow tools/*/frontend
        '**/backend/tools/**/frontend/**/*.py',  // Ignore Python files in tools/frontend
        '**/backend/frontend_tools/**/*.py',  // Ignore Python files in frontend_tools
        '**/dist-electron/**', 
        '**/build/**', 
        '**/tests/**', 
        '**/release/**', 
        '**/docs/**', 
        '**/.git/**'
      ]
    }
  },
  build: {
    rollupOptions: {
      output: {
        assetFileNames: (assetInfo) => {
          // Keep logo files in root of dist
          if (assetInfo.name === 'logo-128.png') {
            return 'logo-128.png'
          }
          return 'assets/[name]-[hash][extname]'
        }
      }
    }
  }
})