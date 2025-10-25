import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { ArrowLeft, Play, Loader2, AlertCircle, User, Users } from 'lucide-react'
import { 
  testWorkflow, 
  TestWorkflowResponse, 
  getPersonas, 
  getUserCharacters,
  Persona,
  UserCharacter 
} from '@/lib/rag-studio-api'
import ExecutionFlow from './ExecutionFlow'
import toast from 'react-hot-toast'

interface TestPanelProps {
  workflowId: string
  stopAtNode: string | null
  onBack: () => void
}

export default function TestPanel({ workflowId, stopAtNode, onBack }: TestPanelProps) {
  const [testInput, setTestInput] = useState('')
  const [isRunning, setIsRunning] = useState(false)
  const [result, setResult] = useState<TestWorkflowResponse | null>(null)
  
  // Persona Manager Integration (Phase 6.6.3c)
  const [personas, setPersonas] = useState<Persona[]>([])
  const [characters, setCharacters] = useState<UserCharacter[]>([])
  const [selectedPersonaId, setSelectedPersonaId] = useState<string>('')
  const [selectedCharacterId, setSelectedCharacterId] = useState<string>('')
  const [loadingPersonas, setLoadingPersonas] = useState(true)
  
  // Load personas and characters on mount
  useEffect(() => {
    loadPersonasAndCharacters()
  }, [])
  
  const loadPersonasAndCharacters = async () => {
    try {
      setLoadingPersonas(true)
      
      // Load personas
      const personasResult = await getPersonas()
      if (personasResult.success && personasResult.personas) {
        setPersonas(personasResult.personas)
        
        // Auto-select default persona
        const defaultPersona = personasResult.personas.find(p => p.is_default)
        if (defaultPersona) {
          setSelectedPersonaId(defaultPersona.id)
        }
      }
      
      // Load characters
      const charactersResult = await getUserCharacters()
      if (charactersResult.success && charactersResult.characters) {
        setCharacters(charactersResult.characters)
      }
    } catch (error) {
      console.error('Failed to load personas/characters:', error)
    } finally {
      setLoadingPersonas(false)
    }
  }
  
  const handleRunTest = async () => {
    if (!testInput.trim()) {
      toast.error('Please enter test input')
      return
    }
    
    setIsRunning(true)
    setResult(null)
    
    try {
      const response = await testWorkflow({
        workflow_id: workflowId,
        test_input: testInput,
        stop_at_node: stopAtNode === 'all' ? null : stopAtNode,
        persona_id: selectedPersonaId || null,  // Pass persona for enhanced context
        character_id: selectedCharacterId || null,  // Pass character for relationship context
        conversation_id: null  // TODO: Support conversation continuation
      })
      
      setResult(response)
      
      if (response.success) {
        toast.success('Test completed successfully!')
      } else {
        toast.error('Test execution failed')
      }
    } catch (error) {
      toast.error('Test failed: ' + (error instanceof Error ? error.message : 'Unknown error'))
    } finally {
      setIsRunning(false)
    }
  }
  
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && e.ctrlKey && !isRunning) {
      handleRunTest()
    }
  }
  
  return (
    <div className="h-full flex flex-col bg-white dark:bg-dark-surface">
      {/* Header */}
      <div className="flex items-center gap-4 p-6 border-b border-gray-200 dark:border-dark-border">
        <button
          onClick={onBack}
          className="p-2 hover:bg-gray-100 dark:hover:bg-dark-surface-hover rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Testing Workflow
          </h2>
          <p className="text-sm text-secondary mt-1">
            {stopAtNode === 'all' 
              ? 'Complete workflow execution'
              : 'Partial execution (stop at selected node)'
            }
          </p>
        </div>
      </div>
      
      {/* Content */}
      <div className="flex-1 overflow-auto custom-scrollbar p-6">
        {/* Persona & Character Selection (Phase 6.6.3c) */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 glass rounded-xl p-4"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Persona Selector */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium mb-2 text-gray-900 dark:text-white">
                <User className="w-4 h-4" />
                AI Persona:
              </label>
              <select
                value={selectedPersonaId}
                onChange={(e) => setSelectedPersonaId(e.target.value)}
                disabled={loadingPersonas || isRunning}
                className="w-full p-2 rounded-lg border border-gray-300 dark:border-dark-border bg-white dark:bg-dark-surface-hover text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent disabled:opacity-50"
              >
                <option value="">Default Persona</option>
                {personas.map(persona => (
                  <option key={persona.id} value={persona.id}>
                    {persona.name} {persona.is_default ? '(Default)' : ''}
                  </option>
                ))}
              </select>
            </div>
            
            {/* Character Selector (Optional) */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium mb-2 text-gray-900 dark:text-white">
                <Users className="w-4 h-4" />
                User Character (Optional):
              </label>
              <select
                value={selectedCharacterId}
                onChange={(e) => setSelectedCharacterId(e.target.value)}
                disabled={loadingPersonas || isRunning}
                className="w-full p-2 rounded-lg border border-gray-300 dark:border-dark-border bg-white dark:bg-dark-surface-hover text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent disabled:opacity-50"
              >
                <option value="">None (Generic)</option>
                {characters.map(character => (
                  <option key={character.id} value={character.id}>
                    {character.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          
          {loadingPersonas && (
            <p className="text-xs text-secondary mt-2">Loading personas & characters...</p>
          )}
          
          {selectedPersonaId && selectedCharacterId && (
            <p className="text-xs text-green-600 dark:text-green-400 mt-2">
              ✅ Persona with relationship context will be applied
            </p>
          )}
        </motion.div>
        
        {/* Input Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-6 glass rounded-xl p-6"
        >
          <label className="block text-sm font-medium mb-3 text-gray-900 dark:text-white">
            Test Input:
          </label>
          <textarea
            value={testInput}
            onChange={(e) => setTestInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type your test message here...\n\nTip: Press Ctrl+Enter to run test"
            className="w-full p-4 rounded-lg border border-gray-300 dark:border-dark-border bg-white dark:bg-dark-surface-hover text-gray-900 dark:text-white min-h-[120px] resize-y focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            disabled={isRunning}
          />
          
          <div className="flex items-center justify-between mt-4">
            <p className="text-xs text-secondary">
              {testInput.length} characters
            </p>
            
            <button
              onClick={handleRunTest}
              disabled={isRunning || !testInput.trim()}
              className="flex items-center gap-2 px-6 py-3 bg-primary hover:bg-secondary text-white rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md"
            >
              {isRunning ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Running Test...
                </>
              ) : (
                <>
                  <Play className="w-5 h-5" />
                  Run Test
                </>
              )}
            </button>
          </div>
        </motion.div>
        
        {/* Results Section */}
        {result && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <ExecutionFlow result={result} />
          </motion.div>
        )}
        
        {/* Error State */}
        {result && !result.success && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6 p-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl"
          >
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-red-800 dark:text-red-300 mb-1">Test Execution Failed</h4>
                <p className="text-sm text-red-700 dark:text-red-400">
                  {result.error_message || 'Unknown error occurred'}
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  )
}
