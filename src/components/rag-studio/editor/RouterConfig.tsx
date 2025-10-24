import { GitBranch, Plus, Trash2, Code } from 'lucide-react'
import { useState } from 'react'

interface Condition {
  id: string
  type: 'keyword' | 'semantic' | 'custom'
  field: string
  operator: string
  value: string
}

interface RouterConfigProps {
  config: {
    conditions?: Condition[]
    default_route?: string
    description?: string
  }
  onChange: (config: any) => void
}

const CONDITION_TYPES = [
  { value: 'keyword', label: 'Keyword Match', description: 'Match specific keywords' },
  { value: 'semantic', label: 'Semantic Match', description: 'Match meaning/intent' },
  { value: 'custom', label: 'Custom Logic', description: 'Custom expression' }
]

const OPERATORS = [
  { value: 'contains', label: 'Contains' },
  { value: 'equals', label: 'Equals' },
  { value: 'starts_with', label: 'Starts With' },
  { value: 'ends_with', label: 'Ends With' },
  { value: 'regex', label: 'Regex Match' }
]

export default function RouterConfig({ config, onChange }: RouterConfigProps) {
  const [showJsonEditor, setShowJsonEditor] = useState(false)
  const [jsonText, setJsonText] = useState(JSON.stringify(config, null, 2))
  
  const conditions = config.conditions || []
  const defaultRoute = config.default_route || 'default'
  const description = config.description || 'Router decision node'

  const handleAddCondition = () => {
    const newCondition: Condition = {
      id: `cond_${Date.now()}`,
      type: 'keyword',
      field: 'user_input',
      operator: 'contains',
      value: ''
    }
    onChange({
      ...config,
      conditions: [...conditions, newCondition]
    })
  }

  const handleRemoveCondition = (id: string) => {
    onChange({
      ...config,
      conditions: conditions.filter((c: Condition) => c.id !== id)
    })
  }

  const handleConditionChange = (id: string, field: keyof Condition, value: any) => {
    onChange({
      ...config,
      conditions: conditions.map((c: Condition) => 
        c.id === id ? { ...c, [field]: value } : c
      )
    })
  }

  const handleDefaultRouteChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange({ ...config, default_route: e.target.value })
  }

  const handleDescriptionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange({ ...config, description: e.target.value })
  }

  const handleJsonSave = () => {
    try {
      const parsed = JSON.parse(jsonText)
      onChange(parsed)
      setShowJsonEditor(false)
    } catch (error) {
      alert('Invalid JSON format')
    }
  }

  if (showJsonEditor) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
            <Code className="w-4 h-4 text-purple-600 dark:text-purple-400" />
            JSON Editor
          </label>
          <button
            onClick={() => setShowJsonEditor(false)}
            className="text-xs text-primary hover:underline"
          >
            ← Back to Visual Editor
          </button>
        </div>
        
        <textarea
          value={jsonText}
          onChange={(e) => setJsonText(e.target.value)}
          rows={16}
          className="
            w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600
            bg-white dark:bg-dark-surface
            text-gray-900 dark:text-white font-mono text-sm
            focus:ring-2 focus:ring-primary focus:border-transparent
            transition-colors resize-none
          "
        />
        
        <button
          onClick={handleJsonSave}
          className="
            w-full px-4 py-2 rounded-lg
            bg-primary hover:bg-secondary text-white
            transition-colors font-medium
          "
        >
          Apply JSON Changes
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header with JSON toggle */}
      <div className="flex items-center justify-between">
        <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
          <GitBranch className="w-4 h-4 text-purple-600 dark:text-purple-400" />
          Routing Conditions
        </label>
        <button
          onClick={() => {
            setJsonText(JSON.stringify(config, null, 2))
            setShowJsonEditor(true)
          }}
          className="text-xs text-primary hover:underline flex items-center gap-1"
        >
          <Code className="w-3 h-3" />
          JSON Editor
        </button>
      </div>

      {/* Conditions List */}
      <div className="space-y-3">
        {conditions.map((condition: Condition, index: number) => (
          <div
            key={condition.id}
            className="p-4 bg-gray-50 dark:bg-dark-surface rounded-lg border border-gray-200 dark:border-gray-700 space-y-3"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                Condition {index + 1}
              </span>
              <button
                onClick={() => handleRemoveCondition(condition.id)}
                className="p-1 hover:bg-red-100 dark:hover:bg-red-900/20 rounded text-red-600 dark:text-red-400"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>

            {/* Type */}
            <select
              value={condition.type}
              onChange={(e) => handleConditionChange(condition.id, 'type', e.target.value)}
              className="
                w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600
                bg-white dark:bg-dark-surface text-sm
                text-gray-900 dark:text-white
                focus:ring-2 focus:ring-primary focus:border-transparent
              "
            >
              {CONDITION_TYPES.map(type => (
                <option key={type.value} value={type.value}>
                  {type.label} - {type.description}
                </option>
              ))}
            </select>

            {/* Field */}
            <input
              type="text"
              value={condition.field}
              onChange={(e) => handleConditionChange(condition.id, 'field', e.target.value)}
              placeholder="Field name (e.g. user_input, intent)"
              className="
                w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600
                bg-white dark:bg-dark-surface text-sm
                text-gray-900 dark:text-white
                focus:ring-2 focus:ring-primary focus:border-transparent
              "
            />

            {/* Operator */}
            <select
              value={condition.operator}
              onChange={(e) => handleConditionChange(condition.id, 'operator', e.target.value)}
              className="
                w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600
                bg-white dark:bg-dark-surface text-sm
                text-gray-900 dark:text-white
                focus:ring-2 focus:ring-primary focus:border-transparent
              "
            >
              {OPERATORS.map(op => (
                <option key={op.value} value={op.value}>
                  {op.label}
                </option>
              ))}
            </select>

            {/* Value */}
            <input
              type="text"
              value={condition.value}
              onChange={(e) => handleConditionChange(condition.id, 'value', e.target.value)}
              placeholder="Value to match"
              className="
                w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600
                bg-white dark:bg-dark-surface text-sm
                text-gray-900 dark:text-white
                focus:ring-2 focus:ring-primary focus:border-transparent
              "
            />
          </div>
        ))}

        {/* Add Condition Button */}
        <button
          onClick={handleAddCondition}
          className="
            w-full px-4 py-2 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600
            hover:border-primary hover:bg-primary/5
            text-gray-600 dark:text-gray-400 hover:text-primary
            transition-colors font-medium text-sm
            flex items-center justify-center gap-2
          "
        >
          <Plus className="w-4 h-4" />
          Add Condition
        </button>
      </div>

      {/* Default Route */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Default Route
        </label>
        <input
          type="text"
          value={defaultRoute}
          onChange={handleDefaultRouteChange}
          className="
            w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600
            bg-white dark:bg-dark-surface
            text-gray-900 dark:text-white
            focus:ring-2 focus:ring-primary focus:border-transparent
            transition-colors
          "
          placeholder="default"
        />
        <p className="text-xs text-purple-600 dark:text-purple-400 mt-1">
          Route to use when no conditions match
        </p>
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Description
        </label>
        <input
          type="text"
          value={description}
          onChange={handleDescriptionChange}
          className="
            w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600
            bg-white dark:bg-dark-surface
            text-gray-900 dark:text-white
            focus:ring-2 focus:ring-primary focus:border-transparent
            transition-colors
          "
          placeholder="Enter node description"
        />
        <p className="text-xs text-purple-600 dark:text-purple-400 mt-1">
          Optional: Describe what this router does
        </p>
      </div>
    </div>
  )
}
