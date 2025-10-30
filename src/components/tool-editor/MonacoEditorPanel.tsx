import { useEffect, useRef } from 'react'
import Editor, { Monaco } from '@monaco-editor/react'
import * as monaco from 'monaco-editor'
import { useThemeStore } from '@/store/themeStore'

interface MonacoEditorPanelProps {
  code: string
  onChange: (value: string) => void
  language?: string
  theme?: 'vs-dark' | 'light'
  readOnly?: boolean
}

export default function MonacoEditorPanel({
  code,
  onChange,
  language = 'typescript',
  theme: customTheme,
  readOnly = false
}: MonacoEditorPanelProps) {
  const editorRef = useRef<any>(null)
  const { actualTheme } = useThemeStore()
  
  const editorTheme = customTheme || (actualTheme === 'dark' ? 'vs-dark' : 'light')
  
  const handleEditorDidMount = (editor: any, monaco: Monaco) => {
    editorRef.current = editor
    
    // Define custom light theme with better contrast
    monaco.editor.defineTheme('chimera-light', {
      base: 'vs',
      inherit: true,
      rules: [
        { token: 'comment', foreground: '6a737d', fontStyle: 'italic' },
        { token: 'keyword', foreground: 'd73a49', fontStyle: 'bold' },
        { token: 'string', foreground: '032f62' },
        { token: 'number', foreground: '005cc5' },
        { token: 'type', foreground: '6f42c1' },
        { token: 'function', foreground: '6f42c1' },
      ],
      colors: {
        'editor.background': '#ffffff',
        'editor.foreground': '#24292e',
        'editor.lineHighlightBackground': '#f6f8fa',
        'editorLineNumber.foreground': '#babbbc',
        'editorLineNumber.activeForeground': '#24292e',
        'editor.selectionBackground': '#0366d625',
        'editor.inactiveSelectionBackground': '#0366d615',
        'editorCursor.foreground': '#24292e',
        'scrollbarSlider.background': '#959da533',
        'scrollbarSlider.hoverBackground': '#959da544',
        'scrollbarSlider.activeBackground': '#959da588',
      }
    })
    
    // Define custom dark theme
    monaco.editor.defineTheme('chimera-dark', {
      base: 'vs-dark',
      inherit: true,
      rules: [
        { token: 'comment', foreground: '6a9955', fontStyle: 'italic' },
        { token: 'keyword', foreground: 'c586c0', fontStyle: 'bold' },
        { token: 'string', foreground: 'ce9178' },
        { token: 'number', foreground: 'b5cea8' },
        { token: 'type', foreground: '4ec9b0' },
        { token: 'function', foreground: 'dcdcaa' },
      ],
      colors: {
        'editor.background': '#1e1e1e',
        'editor.foreground': '#d4d4d4',
        'editor.lineHighlightBackground': '#2a2a2a',
        'editorLineNumber.foreground': '#858585',
        'editorLineNumber.activeForeground': '#c6c6c6',
        'editor.selectionBackground': '#264f78',
        'editor.inactiveSelectionBackground': '#3a3d41',
        'editorCursor.foreground': '#aeafad',
        'scrollbarSlider.background': '#79797966',
        'scrollbarSlider.hoverBackground': '#79797988',
        'scrollbarSlider.activeBackground': '#bfbfbfaa',
      }
    })
    
    // Set the custom theme
    monaco.editor.setTheme(actualTheme === 'dark' ? 'chimera-dark' : 'chimera-light')
    
    // Configure TypeScript/TSX settings
    monaco.languages.typescript.typescriptDefaults.setCompilerOptions({
      jsx: monaco.languages.typescript.JsxEmit.React,
      target: monaco.languages.typescript.ScriptTarget.ES2020,
      allowNonTsExtensions: true,
      moduleResolution: monaco.languages.typescript.ModuleResolutionKind.NodeJs,
      module: monaco.languages.typescript.ModuleKind.ESNext,
      noEmit: true,
      esModuleInterop: true,
      allowSyntheticDefaultImports: true
    })
    
    // Set diagnostics options (linting)
    monaco.languages.typescript.typescriptDefaults.setDiagnosticsOptions({
      noSemanticValidation: false,
      noSyntaxValidation: false
    })
  }
  
  // Update theme when actualTheme changes
  useEffect(() => {
    if (editorRef.current) {
      const monaco = (window as any).monaco
      if (monaco) {
        monaco.editor.setTheme(actualTheme === 'dark' ? 'chimera-dark' : 'chimera-light')
      }
    }
  }, [actualTheme])
  
  const handleEditorChange = (value: string | undefined) => {
    if (value !== undefined) {
      onChange(value)
    }
  }
  
  return (
    <div className="flex-1 rounded-lg overflow-hidden border-2 shadow-sm" style={{
      borderColor: actualTheme === 'dark' ? '#374151' : '#e5e7eb',
      boxShadow: actualTheme === 'dark' 
        ? '0 1px 3px 0 rgba(0, 0, 0, 0.3)'
        : '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
    }}>
      <Editor
        height="100%"
        language={language}
        value={code}
        theme={actualTheme === 'dark' ? 'chimera-dark' : 'chimera-light'}
        onChange={handleEditorChange}
        onMount={handleEditorDidMount}
        options={{
          minimap: { enabled: true },
          fontSize: 14,
          fontFamily: '"Fira Code", "Cascadia Code", "JetBrains Mono", Consolas, "Courier New", monospace',
          fontLigatures: true,
          lineNumbers: 'on',
          roundedSelection: true,
          scrollBeyondLastLine: false,
          readOnly: readOnly,
          automaticLayout: true,
          tabSize: 2,
          wordWrap: 'on',
          formatOnPaste: true,
          formatOnType: true,
          suggestOnTriggerCharacters: true,
          acceptSuggestionOnEnter: 'on',
          quickSuggestions: true,
          folding: true,
          foldingStrategy: 'indentation',
          showFoldingControls: 'always',
          cursorBlinking: 'smooth',
          cursorSmoothCaretAnimation: 'on',
          smoothScrolling: true,
          padding: { top: 16, bottom: 16 },
          renderLineHighlight: 'all',
          renderWhitespace: 'selection',
          renderIndentGuides: true,
          scrollbar: {
            vertical: 'visible',
            horizontal: 'visible',
            useShadows: false,
            verticalScrollbarSize: 12,
            horizontalScrollbarSize: 12,
            arrowSize: 0
          }
        }}
        loading={
          <div className="flex items-center justify-center h-full bg-white dark:bg-dark-surface">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
              <p className="text-sm text-secondary">Loading Monaco Editor...</p>
            </div>
          </div>
        }
      />
    </div>
  )
}
