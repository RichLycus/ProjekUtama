import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2, ChevronUp, ChevronDown, Save, AlertCircle, CheckCircle } from 'lucide-react';
import { BACKEND_URL } from '../lib/backend';

interface FlowStep {
  id: string;
  agent: string;
  description: string;
  config: Record<string, any>;
  condition: Record<string, any> | null;
  timeout: number;
  critical: boolean;
}

interface FlowConfig {
  flow_id: string;
  name: string;
  description: string;
  version: string;
  metadata: Record<string, any>;
  profile: Record<string, any>;
  config: Record<string, any>;
  steps: FlowStep[];
  error_handling: Record<string, any>;
  optimization: Record<string, any>;
}

interface Agent {
  id: string;
  name: string;
  description: string;
  params: string[];
}

export default function FlowConfigEditorPage() {
  const navigate = useNavigate();
  const { mode } = useParams<{ mode: 'flash' | 'pro' }>();
  
  const [config, setConfig] = useState<FlowConfig | null>(null);
  const [availableAgents, setAvailableAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [selectedStepIndex, setSelectedStepIndex] = useState<number | null>(null);

  // Load flow config
  useEffect(() => {
    if (mode) {
      loadFlowConfig();
      loadAvailableAgents();
    }
  }, [mode]);

  const loadFlowConfig = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${BACKEND_URL}/api/rag-studio/flow-configs/${mode}`);
      const data = await response.json();
      
      if (data.success) {
        setConfig(data.config);
      } else {
        setError('Failed to load flow config');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadAvailableAgents = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/rag-studio/available-agents`);
      const data = await response.json();
      
      if (data.success) {
        setAvailableAgents(data.agents);
      }
    } catch (err: any) {
      console.error('Failed to load agents:', err);
    }
  };

  const handleSave = async () => {
    if (!config) return;

    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      const response = await fetch(`${BACKEND_URL}/api/rag-studio/flow-configs/${mode}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: config.name,
          description: config.description,
          steps: config.steps,
          config: config.config,
          error_handling: config.error_handling,
          optimization: config.optimization
        })
      });

      const data = await response.json();

      if (data.success) {
        setSuccess('Flow config saved successfully!');
        setTimeout(() => {
          setSuccess(null);
        }, 3000);
      } else {
        setError('Failed to save flow config');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleBack = () => {
    navigate('/rag-studio');
  };

  const addStep = () => {
    if (!config) return;

    const newStep: FlowStep = {
      id: `step_${config.steps.length + 1}_new`,
      agent: 'preprocessor',
      description: 'New step',
      config: {},
      condition: null,
      timeout: 5,
      critical: false
    };

    setConfig({
      ...config,
      steps: [...config.steps, newStep]
    });
  };

  const deleteStep = (index: number) => {
    if (!config) return;

    const newSteps = config.steps.filter((_, i) => i !== index);
    setConfig({
      ...config,
      steps: newSteps
    });

    if (selectedStepIndex === index) {
      setSelectedStepIndex(null);
    }
  };

  const moveStep = (index: number, direction: 'up' | 'down') => {
    if (!config) return;

    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= config.steps.length) return;

    const newSteps = [...config.steps];
    [newSteps[index], newSteps[newIndex]] = [newSteps[newIndex], newSteps[index]];

    setConfig({
      ...config,
      steps: newSteps
    });

    if (selectedStepIndex === index) {
      setSelectedStepIndex(newIndex);
    }
  };

  const updateStep = (index: number, updates: Partial<FlowStep>) => {
    if (!config) return;

    const newSteps = [...config.steps];
    newSteps[index] = { ...newSteps[index], ...updates };

    setConfig({
      ...config,
      steps: newSteps
    });
  };

  const updateStepConfig = (index: number, key: string, value: any) => {
    if (!config) return;

    const newSteps = [...config.steps];
    newSteps[index] = {
      ...newSteps[index],
      config: {
        ...newSteps[index].config,
        [key]: value
      }
    };

    setConfig({
      ...config,
      steps: newSteps
    });
  };

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading flow config...</p>
        </div>
      </div>
    );
  }

  if (!config) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-gray-600 mb-4">No config available</p>
          <button
            onClick={handleBack}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            Back to RAG Studio
          </button>
        </div>
      </div>
    );
  }

  const selectedStep = selectedStepIndex !== null ? config.steps[selectedStepIndex] : null;

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Fixed Header - Will not scroll with content */}
      <div className="sticky top-0 z-50 flex-shrink-0 bg-white border-b shadow-sm">
        <div className="px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={handleBack}
              className="flex items-center gap-2 px-4 py-2 hover:bg-gray-100 rounded-lg transition"
            >
              <ArrowLeft size={20} />
              <span>Back</span>
            </button>
            
            <div className="h-8 w-px bg-gray-300"></div>
            
            <div>
              <h1 className="text-2xl font-bold text-gray-800">
                {mode === 'flash' ? '⚡ Flash' : '🚀 Pro'} Flow Editor
              </h1>
              <p className="text-sm text-gray-600 mt-1">{config.description}</p>
            </div>
          </div>

          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save size={18} />
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>

        {/* Alerts */}
        {error && (
          <div className="px-6 pb-4">
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700">
              <AlertCircle size={20} />
              <span>{error}</span>
            </div>
          </div>
        )}
        
        {success && (
          <div className="px-6 pb-4">
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2 text-green-700">
              <CheckCircle size={20} />
              <span>{success}</span>
            </div>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Steps List */}
        <div className="w-1/2 border-r bg-white overflow-y-auto p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-800">Flow Steps ({config.steps.length})</h2>
            <button
              onClick={addStep}
              className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition text-sm"
            >
              <Plus size={16} />
              Add Step
            </button>
          </div>

          <div className="space-y-2">
            {config.steps.map((step, index) => (
              <div
                key={step.id}
                className={`border rounded-lg p-4 cursor-pointer transition ${
                  selectedStepIndex === index
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300 bg-white'
                }`}
                onClick={() => setSelectedStepIndex(index)}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-mono text-gray-500">#{index + 1}</span>
                      <span className="font-medium text-gray-900">{step.agent}</span>
                      {step.critical && (
                        <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs rounded">
                          Critical
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600">{step.description}</p>
                  </div>
                  
                  <div className="flex items-center gap-1 ml-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        moveStep(index, 'up');
                      }}
                      disabled={index === 0}
                      className="p-1 hover:bg-gray-100 rounded disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      <ChevronUp size={16} />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        moveStep(index, 'down');
                      }}
                      disabled={index === config.steps.length - 1}
                      className="p-1 hover:bg-gray-100 rounded disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      <ChevronDown size={16} />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm('Delete this step?')) {
                          deleteStep(index);
                        }
                      }}
                      className="p-1 hover:bg-red-50 text-red-600 rounded"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-xs text-gray-500">
                  <span>Timeout: {step.timeout}s</span>
                  {Object.keys(step.config).length > 0 && (
                    <span>{Object.keys(step.config).length} config(s)</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Step Editor */}
        <div className="w-1/2 overflow-y-auto p-6 bg-gray-50">
          {selectedStep ? (
            <div>
              <h2 className="text-lg font-semibold text-gray-800 mb-6">Edit Step #{selectedStepIndex! + 1}</h2>
              
              <div className="space-y-6">
                {/* Agent Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Agent Type
                  </label>
                  <select
                    value={selectedStep.agent}
                    onChange={(e) => updateStep(selectedStepIndex!, { agent: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  >
                    {availableAgents.map(agent => (
                      <option key={agent.id} value={agent.id}>
                        {agent.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <input
                    type="text"
                    value={selectedStep.description}
                    onChange={(e) => updateStep(selectedStepIndex!, { description: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Timeout */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Timeout (seconds)
                  </label>
                  <input
                    type="number"
                    value={selectedStep.timeout}
                    onChange={(e) => updateStep(selectedStepIndex!, { timeout: parseInt(e.target.value) })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    min="1"
                    max="60"
                  />
                </div>

                {/* Critical */}
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="critical"
                    checked={selectedStep.critical}
                    onChange={(e) => updateStep(selectedStepIndex!, { critical: e.target.checked })}
                    className="w-5 h-5 text-blue-600 rounded"
                  />
                  <label htmlFor="critical" className="text-sm font-medium text-gray-700">
                    Critical (fail flow if error)
                  </label>
                </div>

                {/* Agent Config */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Agent Configuration
                  </label>
                  
                  {/* LLM Agent Config */}
                  {selectedStep.agent === 'llm_agent' && (
                    <div className="space-y-4 bg-white p-4 rounded-lg border border-gray-200">
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">Model</label>
                        <input
                          type="text"
                          value={selectedStep.config.model || 'gemma2:2b'}
                          onChange={(e) => updateStepConfig(selectedStepIndex!, 'model', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                          placeholder="gemma2:2b"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">Temperature</label>
                        <input
                          type="number"
                          value={selectedStep.config.temperature || 0.7}
                          onChange={(e) => updateStepConfig(selectedStepIndex!, 'temperature', parseFloat(e.target.value))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                          step="0.1"
                          min="0"
                          max="2"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">Max Tokens</label>
                        <input
                          type="number"
                          value={selectedStep.config.max_tokens || 2000}
                          onChange={(e) => updateStepConfig(selectedStepIndex!, 'max_tokens', parseInt(e.target.value))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                          min="100"
                          max="8000"
                        />
                      </div>
                    </div>
                  )}

                  {/* Persona Agent Config */}
                  {selectedStep.agent === 'persona' && (
                    <div className="space-y-4 bg-white p-4 rounded-lg border border-gray-200">
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">Persona</label>
                        <input
                          type="text"
                          value={selectedStep.config.persona || 'lycus'}
                          onChange={(e) => updateStepConfig(selectedStepIndex!, 'persona', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">Format</label>
                        <select
                          value={selectedStep.config.format || 'text'}
                          onChange={(e) => updateStepConfig(selectedStepIndex!, 'format', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                        >
                          <option value="text">Text</option>
                          <option value="markdown">Markdown</option>
                          <option value="json">JSON</option>
                        </select>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id="include_metadata"
                          checked={selectedStep.config.include_metadata || false}
                          onChange={(e) => updateStepConfig(selectedStepIndex!, 'include_metadata', e.target.checked)}
                          className="w-4 h-4 text-blue-600"
                        />
                        <label htmlFor="include_metadata" className="text-xs text-gray-600">
                          Include Metadata
                        </label>
                      </div>
                    </div>
                  )}

                  {/* Preprocessor Config */}
                  {selectedStep.agent === 'preprocessor' && (
                    <div className="space-y-4 bg-white p-4 rounded-lg border border-gray-200">
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id="normalize_whitespace"
                          checked={selectedStep.config.normalize_whitespace !== false}
                          onChange={(e) => updateStepConfig(selectedStepIndex!, 'normalize_whitespace', e.target.checked)}
                          className="w-4 h-4 text-blue-600"
                        />
                        <label htmlFor="normalize_whitespace" className="text-xs text-gray-600">
                          Normalize Whitespace
                        </label>
                      </div>
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">Max Length</label>
                        <input
                          type="number"
                          value={selectedStep.config.max_length || 1000}
                          onChange={(e) => updateStepConfig(selectedStepIndex!, 'max_length', parseInt(e.target.value))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                          min="100"
                          max="10000"
                        />
                      </div>
                    </div>
                  )}

                  {/* Generic config for other agents */}
                  {!['llm_agent', 'persona', 'preprocessor'].includes(selectedStep.agent) && (
                    <div className="text-sm text-gray-500 bg-white p-4 rounded-lg border border-gray-200">
                      No specific configuration needed for this agent
                    </div>
                  )}
                </div>

                {/* Raw JSON View */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Raw Config (JSON)
                  </label>
                  <pre className="bg-gray-900 text-gray-100 border border-gray-700 rounded-lg p-4 text-xs overflow-x-auto">
                    {JSON.stringify(selectedStep.config, null, 2)}
                  </pre>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500">
              <div className="text-center">
                <div className="text-4xl mb-4">👈</div>
                <p className="text-lg">Select a step to edit</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="bg-white border-t px-6 py-4 flex items-center justify-between">
        <div className="text-sm text-gray-600">
          {config.steps.length} steps • Last updated: {config.metadata.updated_at}
        </div>
      </div>
    </div>
  );
}
