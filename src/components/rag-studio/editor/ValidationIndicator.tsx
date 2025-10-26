import React from 'react';
import { CheckCircle, AlertTriangle, XCircle, Circle } from 'lucide-react';

export type ValidationStatus = 'ready' | 'warning' | 'error' | 'incomplete';

interface ValidationIndicatorProps {
  status: ValidationStatus;
  message?: string;
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export default function ValidationIndicator({ 
  status, 
  message, 
  showLabel = true,
  size = 'md'
}: ValidationIndicatorProps) {
  const config = {
    ready: {
      icon: CheckCircle,
      label: 'Ready',
      bgColor: 'bg-green-50',
      textColor: 'text-green-700',
      borderColor: 'border-green-200',
      iconColor: 'text-green-600',
      dotColor: 'bg-green-500'
    },
    warning: {
      icon: AlertTriangle,
      label: 'Warning',
      bgColor: 'bg-yellow-50',
      textColor: 'text-yellow-700',
      borderColor: 'border-yellow-200',
      iconColor: 'text-yellow-600',
      dotColor: 'bg-yellow-500'
    },
    error: {
      icon: XCircle,
      label: 'Error',
      bgColor: 'bg-red-50',
      textColor: 'text-red-700',
      borderColor: 'border-red-200',
      iconColor: 'text-red-600',
      dotColor: 'bg-red-500'
    },
    incomplete: {
      icon: Circle,
      label: 'Incomplete',
      bgColor: 'bg-gray-50',
      textColor: 'text-gray-700',
      borderColor: 'border-gray-200',
      iconColor: 'text-gray-500',
      dotColor: 'bg-gray-400'
    }
  };

  const current = config[status];
  const Icon = current.icon;

  const sizeClasses = {
    sm: {
      icon: 14,
      dot: 'w-1.5 h-1.5',
      text: 'text-xs',
      padding: 'px-2 py-0.5',
      gap: 'gap-1'
    },
    md: {
      icon: 16,
      dot: 'w-2 h-2',
      text: 'text-xs',
      padding: 'px-2 py-1',
      gap: 'gap-1.5'
    },
    lg: {
      icon: 18,
      dot: 'w-2.5 h-2.5',
      text: 'text-sm',
      padding: 'px-3 py-1.5',
      gap: 'gap-2'
    }
  };

  const sizing = sizeClasses[size];

  if (!showLabel) {
    // Dot indicator only
    return (
      <div className="relative group">
        <div className={`${sizing.dot} ${current.dotColor} rounded-full animate-pulse`}></div>
        {message && (
          <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
            {message}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="relative group">
      <div className={`inline-flex items-center ${sizing.gap} ${sizing.padding} ${current.bgColor} ${current.borderColor} border rounded-full transition-all duration-200 hover:shadow-sm`}>
        <Icon size={sizing.icon} className={current.iconColor} />
        <span className={`${sizing.text} ${current.textColor} font-medium`}>
          {current.label}
        </span>
      </div>
      {message && (
        <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 shadow-lg">
          {message}
          <div className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
        </div>
      )}
    </div>
  );
}

// Helper function to determine validation status
export function getValidationStatus(
  config: Record<string, any>,
  requiredFields: string[],
  critical: boolean
): { status: ValidationStatus; message: string; completeness: string } {
  const configuredFields = Object.keys(config).filter(key => {
    const value = config[key];
    return value !== null && value !== undefined && value !== '';
  });

  const requiredConfigured = requiredFields.filter(field => 
    configuredFields.includes(field)
  );

  const completeness = `${requiredConfigured.length}/${requiredFields.length}`;

  // No required fields = ready
  if (requiredFields.length === 0) {
    return {
      status: 'ready',
      message: 'No configuration required',
      completeness: '0/0'
    };
  }

  // All required fields configured = ready
  if (requiredConfigured.length === requiredFields.length) {
    return {
      status: 'ready',
      message: 'All required fields configured',
      completeness
    };
  }

  // Some required fields missing
  if (requiredConfigured.length > 0) {
    if (critical) {
      return {
        status: 'warning',
        message: 'Some required fields missing (critical step)',
        completeness
      };
    }
    return {
      status: 'warning',
      message: 'Some required fields missing',
      completeness
    };
  }

  // No fields configured
  if (critical) {
    return {
      status: 'error',
      message: 'Critical step requires configuration',
      completeness
    };
  }

  return {
    status: 'incomplete',
    message: 'Configuration incomplete',
    completeness
  };
}
