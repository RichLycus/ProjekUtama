import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Plus, Save, AlertCircle, CheckCircle, Minimize2, Maximize2, LayoutList, LayoutGrid } from 'lucide-react';
import { BACKEND_URL } from '../lib/backend';
import AgentConfigForm from '../components/rag-studio/editor/AgentConfigForm';
import StepCard from '../components/rag-studio/editor/StepCard';

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
  const [compactView, setCompactView] = useState(false);
  const [editorFullscreen, setEditorFullscreen] = useState(false);
  
  const stepsListRef = useRef<HTMLDivElement>(null);
  const selectedStepRef = useRef<HTMLDivElement>(null);

  // Load flow config
  useEffect(() => {
    if (mode) {
      loadFlowConfig();
      loadAvailableAgents();
    }
  }, [mode]);

  // Auto-scroll to selected step
  useEffect(() => {
    if (selectedStepRef.current && stepsListRef.current) {
      selectedStepRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest'
      });
    }
  }, [selectedStepIndex]);

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
      <div className="flex-1 flex overflow-hidden flex-col lg:flex-row">
        {/* Steps List */}
        <div 
          ref={stepsListRef}
          className={`${
            editorFullscreen 
              ? 'hidden' 
              : compactView 
                ? 'w-full lg:w-1/3' 
                : 'w-full lg:w-1/2'
          } border-r bg-white overflow-y-auto transition-all duration-300`}
        >
          <div className="p-4 lg:p-6 sticky top-0 bg-white border-b z-10">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <h2 className="text-lg font-semibold text-gray-800">
                  Flow Steps ({config.steps.length})
                </h2>
                
                {/* View Mode Toggle */}
                <button
                  onClick={() => setCompactView(!compactView)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition"
                  title={compactView ? 'Expand view' : 'Compact view'}
                >
                  {compactView ? <Maximize2 size={16} /> : <Minimize2 size={16} />}
                </button>
              </div>
              
              <button
                onClick={addStep}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all duration-200 shadow-sm hover:shadow-md text-sm font-medium"
              >
                <Plus size={16} />
                Add Step
              </button>
            </div>

            {/* Progress Indicator */}
            <div className="flex items-center gap-2 text-xs text-gray-600">
              <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-500"
                  style={{ 
                    width: `${(config.steps.length / Math.max(config.steps.length, 5)) * 100}%` 
                  }}
                ></div>
              </div>
              <span className="font-medium whitespace-nowrap">
                {config.steps.length} {config.steps.length === 1 ? 'step' : 'steps'}
              </span>
            </div>
          </div>

          <div className="p-4 lg:p-6 space-y-4">
            {config.steps.map((step, index) => (
              <div 
                key={step.id}
                ref={selectedStepIndex === index ? selectedStepRef : null}
                className="animate-fadeIn"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <StepCard
                  step={step}
                  index={index}
                  isSelected={selectedStepIndex === index}
                  isFirst={index === 0}
                  isLast={index === config.steps.length - 1}
                  onSelect={() => setSelectedStepIndex(index)}
                  onMoveUp={() => moveStep(index, 'up')}
                  onMoveDown={() => moveStep(index, 'down')}
                  onDelete={() => deleteStep(index)}
                />
              </div>
            ))}

            {config.steps.length === 0 && (
              <div className="text-center py-12">
                <div className="text-4xl mb-4">📝</div>
                <p className="text-gray-500 mb-4">No steps yet</p>
                <button
                  onClick={addStep}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
                >
                  Add First Step
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Step Editor */}
        <div className={`${
          editorFullscreen 
            ? 'w-full' 
            : compactView 
              ? 'w-full lg:w-2/3' 
              : 'w-full lg:w-1/2'
        } overflow-y-auto transition-all duration-300 bg-gray-50`}>
          {selectedStep ? (
            <div className="p-4 lg:p-6 animate-fadeIn">
              {/* Editor Header */}
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-200">
                <div>
                  <h2 className="text-xl font-bold text-gray-800">
                    Edit Step #{selectedStepIndex! + 1}
                  </h2>
                  <p className="text-sm text-gray-600 mt-1">
                    Configure {selectedStep.agent} settings
                  </p>
                </div>
                
                <button
                  onClick={() => setEditorFullscreen(!editorFullscreen)}
                  className="p-2 hover:bg-gray-200 rounded-lg transition"
                  title={editorFullscreen ? 'Exit fullscreen' : 'Fullscreen editor'}
                >
                  {editorFullscreen ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
                </button>
              </div>
              
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
                  
                  {/* Use modern AgentConfigForm component */}
                  <AgentConfigForm
                    agentType={selectedStep.agent}
                    config={selectedStep.config}
                    onChange={(key, value) => updateStepConfig(selectedStepIndex!, key, value)}
                  />
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
              <div className="text-center animate-fadeIn">
                <div className="text-6xl mb-4">👈</div>
                <p className="text-xl font-medium mb-2">Select a step to edit</p>
                <p className="text-sm text-gray-500">
                  Click on any step from the list to configure its settings
                </p>
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
