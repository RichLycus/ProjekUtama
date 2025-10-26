import React, { useEffect, useState } from 'react';
import { AlertCircle, Info } from 'lucide-react';
import { getAgentConfigSchema, getOllamaModels, type AgentConfigSchema, type OllamaModel } from '@/lib/rag-studio-api';

interface AgentConfigFormProps {
  agentType: string;
  config: Record<string, any>;
  onChange: (key: string, value: any) => void;
}

export default function AgentConfigForm({ agentType, config, onChange }: AgentConfigFormProps) {
  const [schema, setSchema] = useState<AgentConfigSchema | null>(null);
  const [ollamaModels, setOllamaModels] = useState<OllamaModel[]>([]);
  const [ollamaStatus, setOllamaStatus] = useState<string>('');
  const [ollamaMessage, setOllamaMessage] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSchema();
    if (agentType === 'llm_agent') {
      loadOllamaModels();
    }
  }, [agentType]);

  const loadSchema = async () => {
    const result = await getAgentConfigSchema();
    if (result.success && result.schema) {
      setSchema(result.schema);
    }
    setLoading(false);
  };

  const loadOllamaModels = async () => {
    const result = await getOllamaModels();
    if (result.models) {
      setOllamaModels(result.models);
      setOllamaStatus(result.status || '');
      setOllamaMessage(result.message || '');
    }
  };

  if (loading) {
    return (
      <div className="text-sm text-gray-500 bg-white p-4 rounded-lg border border-gray-200">
        Loading configuration...
      </div>
    );
  }

  if (!schema || !schema.agents[agentType]) {
    return (
      <div className="text-sm text-gray-500 bg-white p-4 rounded-lg border border-gray-200">
        No configuration schema available for this agent
      </div>
    );
  }

  const agentSchema = schema.agents[agentType];
  const configSchema = agentSchema.config_schema;

  const renderField = (fieldKey: string, fieldDef: any) => {
    const value = config[fieldKey] ?? fieldDef.default;
    const type = fieldDef.type;

    // Boolean checkbox
    if (type === 'boolean') {
      return (
        <div key={fieldKey} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
          <input
            type="checkbox"
            id={fieldKey}
            checked={value}
            onChange={(e) => onChange(fieldKey, e.target.checked)}
            className="mt-1 w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
          />
          <div className="flex-1">
            <label htmlFor={fieldKey} className="block text-sm font-medium text-gray-700 cursor-pointer">
              {fieldDef.label}
            </label>
            {fieldDef.description && (
              <p className="text-xs text-gray-500 mt-1">{fieldDef.description}</p>
            )}
          </div>
        </div>
      );
    }

    // Number input
    if (type === 'number') {
      return (
        <div key={fieldKey} className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            {fieldDef.label}
            {fieldDef.description && (
              <span className="ml-2 text-xs text-gray-500">({fieldDef.description})</span>
            )}
          </label>
          <input
            type="number"
            value={value}
            onChange={(e) => onChange(fieldKey, parseFloat(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            min={fieldDef.min}
            max={fieldDef.max}
            step={fieldDef.step || 1}
          />
          {fieldDef.min !== undefined && fieldDef.max !== undefined && (
            <div className="flex justify-between text-xs text-gray-500">
              <span>Min: {fieldDef.min}</span>
              <span>Max: {fieldDef.max}</span>
            </div>
          )}
        </div>
      );
    }

    // Slider input
    if (type === 'slider') {
      return (
        <div key={fieldKey} className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            {fieldDef.label}
            <span className="ml-2 text-sm font-mono text-blue-600">{value}</span>
          </label>
          {fieldDef.description && (
            <p className="text-xs text-gray-500">{fieldDef.description}</p>
          )}
          <input
            type="range"
            value={value}
            onChange={(e) => onChange(fieldKey, parseFloat(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
            min={fieldDef.min}
            max={fieldDef.max}
            step={fieldDef.step || 0.1}
          />
          <div className="flex justify-between text-xs text-gray-500">
            <span>{fieldDef.min}</span>
            <span>{fieldDef.max}</span>
          </div>
        </div>
      );
    }

    // Dropdown (select)
    if (type === 'dropdown') {
      // Special handling for LLM model dropdown
      if (fieldKey === 'model' && agentType === 'llm_agent') {
        return (
          <div key={fieldKey} className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              {fieldDef.label}
              {fieldDef.description && (
                <span className="ml-2 text-xs text-gray-500">({fieldDef.description})</span>
              )}
            </label>
            
            {/* Ollama status message */}
            {ollamaStatus === 'fallback' && ollamaMessage && (
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start gap-2 text-sm">
                <AlertCircle className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                <div className="text-yellow-800">
                  <p className="font-medium">Peringatan</p>
                  <p className="text-xs mt-1">{ollamaMessage}</p>
                </div>
              </div>
            )}

            <select
              value={value}
              onChange={(e) => onChange(fieldKey, e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              {ollamaModels.length > 0 ? (
                ollamaModels.map((model) => (
                  <option key={model.name} value={model.name}>
                    {model.name}
                    {model.status === 'not_verified' && ' (belum terverifikasi)'}
                  </option>
                ))
              ) : (
                fieldDef.options?.map((option: string) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))
              )}
            </select>

            {ollamaStatus === 'available' && (
              <div className="flex items-center gap-2 text-xs text-green-600">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>Ollama connected - {ollamaModels.length} models available</span>
              </div>
            )}
          </div>
        );
      }

      // Regular dropdown
      return (
        <div key={fieldKey} className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            {fieldDef.label}
            {fieldDef.description && (
              <span className="ml-2 text-xs text-gray-500">({fieldDef.description})</span>
            )}
          </label>
          <select
            value={value}
            onChange={(e) => onChange(fieldKey, e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          >
            {fieldDef.options?.map((option: string) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>
      );
    }

    // Multiselect (checkboxes)
    if (type === 'multiselect') {
      const selectedValues = Array.isArray(value) ? value : fieldDef.default || [];
      
      return (
        <div key={fieldKey} className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            {fieldDef.label}
            {fieldDef.description && (
              <span className="ml-2 text-xs text-gray-500">({fieldDef.description})</span>
            )}
          </label>
          <div className="space-y-2 p-3 bg-gray-50 rounded-lg">
            {fieldDef.options?.map((option: string) => {
              const isSelected = selectedValues.includes(option);
              return (
                <div key={option} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id={`${fieldKey}-${option}`}
                    checked={isSelected}
                    onChange={(e) => {
                      const newValues = e.target.checked
                        ? [...selectedValues, option]
                        : selectedValues.filter((v: string) => v !== option);
                      onChange(fieldKey, newValues);
                    }}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                  />
                  <label htmlFor={`${fieldKey}-${option}`} className="text-sm text-gray-700 cursor-pointer">
                    {option}
                  </label>
                </div>
              );
            })}
          </div>
        </div>
      );
    }

    // Fallback: text input
    return (
      <div key={fieldKey} className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          {fieldDef.label}
          {fieldDef.description && (
            <span className="ml-2 text-xs text-gray-500">({fieldDef.description})</span>
          )}
        </label>
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(fieldKey, e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Agent Header */}
      <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-100">
        <span className="text-2xl">{agentSchema.icon}</span>
        <div>
          <h4 className="text-sm font-semibold text-gray-900">{agentSchema.name}</h4>
          <p className="text-xs text-gray-600">{agentSchema.description}</p>
        </div>
      </div>

      {/* Config Fields */}
      <div className="space-y-4 bg-white p-4 rounded-lg border border-gray-200">
        {Object.entries(configSchema).map(([fieldKey, fieldDef]: [string, any]) => 
          renderField(fieldKey, fieldDef)
        )}
      </div>

      {/* Info Note */}
      <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-start gap-2 text-sm">
        <Info className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
        <div className="text-blue-800">
          <p className="text-xs">
            Perubahan akan disimpan ke flow config JSON. Pastikan konfigurasi sudah benar sebelum save.
          </p>
        </div>
      </div>
    </div>
  );
}
