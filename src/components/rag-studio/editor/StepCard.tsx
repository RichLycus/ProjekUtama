import React, { useState } from 'react';
import { ChevronUp, ChevronDown, ChevronRight, Trash2, GripVertical } from 'lucide-react';
import ValidationIndicator, { getValidationStatus, type ValidationStatus } from './ValidationIndicator';

interface FlowStep {
  id: string;
  agent: string;
  description: string;
  config: Record<string, any>;
  condition: Record<string, any> | null;
  timeout: number;
  critical: boolean;
}

interface StepCardProps {
  step: FlowStep;
  index: number;
  isSelected: boolean;
  isFirst: boolean;
  isLast: boolean;
  onSelect: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onDelete: () => void;
}

// Agent type colors and icons
const AGENT_STYLES: Record<string, { color: string; bgColor: string; borderColor: string; icon: string }> = {
  preprocessor: {
    color: 'text-blue-700',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    icon: '🔄'
  },
  llm_agent: {
    color: 'text-purple-700',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-200',
    icon: '🤖'
  },
  persona: {
    color: 'text-pink-700',
    bgColor: 'bg-pink-50',
    borderColor: 'border-pink-200',
    icon: '👤'
  },
  formatter: {
    color: 'text-green-700',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200',
    icon: '✨'
  },
  rag: {
    color: 'text-indigo-700',
    bgColor: 'bg-indigo-50',
    borderColor: 'border-indigo-200',
    icon: '📚'
  },
  cache_lookup: {
    color: 'text-orange-700',
    bgColor: 'bg-orange-50',
    borderColor: 'border-orange-200',
    icon: '💾'
  },
  cache_store: {
    color: 'text-orange-700',
    bgColor: 'bg-orange-50',
    borderColor: 'border-orange-200',
    icon: '💿'
  },
  router: {
    color: 'text-cyan-700',
    bgColor: 'bg-cyan-50',
    borderColor: 'border-cyan-200',
    icon: '🔀'
  },
  execution: {
    color: 'text-gray-700',
    bgColor: 'bg-gray-50',
    borderColor: 'border-gray-200',
    icon: '⚡'
  }
};

// Required fields per agent type (for validation)
const AGENT_REQUIRED_FIELDS: Record<string, string[]> = {
  llm_agent: ['model', 'temperature'],
  preprocessor: ['normalize_whitespace'],
  formatter: ['output_format'],
  rag: ['collections', 'min_score'],
  cache_lookup: [],
  cache_store: [],
  persona: ['persona_name'],
  router: ['mode'],
  execution: []
};

export default function StepCard({
  step,
  index,
  isSelected,
  isFirst,
  isLast,
  onSelect,
  onMoveUp,
  onMoveDown,
  onDelete
}: StepCardProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const agentStyle = AGENT_STYLES[step.agent] || AGENT_STYLES.execution;
  const requiredFields = AGENT_REQUIRED_FIELDS[step.agent] || [];
  
  const validation = getValidationStatus(step.config, requiredFields, step.critical);

  return (
    <div
      className={`group relative border rounded-lg transition-all duration-300 ${
        isSelected
          ? `${agentStyle.borderColor} border-2 bg-gradient-to-br from-white to-${agentStyle.bgColor} shadow-md scale-[1.02]`
          : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'
      }`}
    >
      {/* Step Number Badge */}
      <div className={`absolute -left-3 -top-3 w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm shadow-md transition-all duration-300 ${
        isSelected 
          ? `${agentStyle.bgColor} ${agentStyle.color} ring-2 ring-white scale-110`
          : 'bg-gray-100 text-gray-600'
      }`}>
        {index + 1}
      </div>

      {/* Main Content */}
      <div
        className="p-4 cursor-pointer"
        onClick={onSelect}
      >
        <div className="flex items-start justify-between mb-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1.5">
              {/* Agent Icon & Type */}
              <div className={`flex items-center gap-1.5 px-2 py-1 rounded-lg ${agentStyle.bgColor} ${agentStyle.borderColor} border`}>
                <span className="text-base">{agentStyle.icon}</span>
                <span className={`text-xs font-semibold ${agentStyle.color} uppercase tracking-wide`}>
                  {step.agent.replace('_', ' ')}
                </span>
              </div>

              {/* Critical Badge */}
              {step.critical && (
                <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs font-medium rounded border border-red-200 animate-pulse">
                  Critical
                </span>
              )}

              {/* Validation Status */}
              <ValidationIndicator
                status={validation.status}
                message={validation.message}
                size="sm"
              />
            </div>

            {/* Description */}
            <p className="text-sm text-gray-900 font-medium truncate">{step.description}</p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-1 ml-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onMoveUp();
              }}
              disabled={isFirst}
              className="p-1.5 hover:bg-gray-100 rounded transition disabled:opacity-30 disabled:cursor-not-allowed"
              title="Move up"
            >
              <ChevronUp size={16} className="text-gray-600" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onMoveDown();
              }}
              disabled={isLast}
              className="p-1.5 hover:bg-gray-100 rounded transition disabled:opacity-30 disabled:cursor-not-allowed"
              title="Move down"
            >
              <ChevronDown size={16} className="text-gray-600" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (confirm('Delete this step?')) {
                  onDelete();
                }
              }}
              className="p-1.5 hover:bg-red-50 text-red-600 rounded transition"
              title="Delete"
            >
              <Trash2 size={16} />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsExpanded(!isExpanded);
              }}
              className="p-1.5 hover:bg-gray-100 rounded transition"
              title={isExpanded ? 'Collapse' : 'Expand'}
            >
              <ChevronRight size={16} className={`text-gray-600 transition-transform duration-300 ${isExpanded ? 'rotate-90' : ''}`} />
            </button>
          </div>
        </div>

        {/* Expanded Details */}
        <div
          className={`overflow-hidden transition-all duration-300 ease-in-out ${
            isExpanded ? 'max-h-32 opacity-100 mt-3' : 'max-h-0 opacity-0'
          }`}
        >
          <div className="flex items-center gap-4 text-xs text-gray-600 pb-3 border-b border-gray-100">
            <div className="flex items-center gap-1.5">
              <span className="font-medium">Timeout:</span>
              <span className="px-2 py-0.5 bg-gray-100 rounded font-mono">{step.timeout}s</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="font-medium">Config:</span>
              <span className="px-2 py-0.5 bg-gray-100 rounded font-mono">{validation.completeness}</span>
            </div>
            {Object.keys(step.config).length > 0 && (
              <div className="flex items-center gap-1.5">
                <span className="font-medium">Fields:</span>
                <span className="px-2 py-0.5 bg-gray-100 rounded font-mono">{Object.keys(step.config).length}</span>
              </div>
            )}
          </div>

          {/* Config Preview */}
          {Object.keys(step.config).length > 0 && (
            <div className="mt-2 text-xs">
              <div className="flex flex-wrap gap-1.5">
                {Object.keys(step.config).slice(0, 3).map((key) => (
                  <span
                    key={key}
                    className="px-2 py-1 bg-gray-50 text-gray-700 rounded border border-gray-200 font-mono"
                  >
                    {key}
                  </span>
                ))}
                {Object.keys(step.config).length > 3 && (
                  <span className="px-2 py-1 text-gray-500 font-medium">
                    +{Object.keys(step.config).length - 3} more
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Connection Arrow (if not last) */}
      {!isLast && (
        <div className="absolute left-1/2 -translate-x-1/2 -bottom-4 z-10">
          <div className={`w-0.5 h-4 transition-colors duration-300 ${
            isSelected ? agentStyle.bgColor.replace('50', '300') : 'bg-gray-300'
          }`}></div>
          <div className={`absolute left-1/2 -translate-x-1/2 -bottom-1 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent transition-colors duration-300 ${
            isSelected ? agentStyle.borderColor : 'border-t-gray-300'
          }`}></div>
        </div>
      )}
    </div>
  );
}
