'use client';

import { Play, CheckCircle, XCircle, Loader, Copy, Trash2, Clock } from 'lucide-react';
import { EndpointMethod, TestResult } from './types';

interface EndpointCardProps {
  method: EndpointMethod;
  result?: TestResult;
  isTesting: boolean;
  isGlobalTesting: boolean;
  cooldownTime: number;
  isExpanded: boolean;
  isCopying: boolean;
  onTest: () => void;
  onCopy: () => void;
  onToggleExpand: () => void;
  onClear: () => void;
}

export const EndpointCard = ({
  method,
  result,
  isTesting,
  isGlobalTesting,
  cooldownTime,
  isExpanded,
  isCopying,
  onTest,
  onCopy,
  onToggleExpand,
  onClear
}: EndpointCardProps) => {
  const onCooldown = cooldownTime > 0;

  return (
    <div 
      className={`relative bg-white/5 border rounded-lg overflow-hidden transition-all duration-300 ${
        result?.success ? 'border-green-500/30' : 
        result && !result.success ? 'border-red-500/30' : 
        'border-white/10 hover:border-white/20'
      }`}
    >
      <div className="p-3 sm:p-4">
        {/* Method Header */}
        <div className="flex items-center justify-between mb-2">
          <span className="text-white font-medium text-xs sm:text-sm">{method.name}</span>
          
          {/* Test Button or Cooldown */}
          {onCooldown ? (
            <div className="flex items-center space-x-1.5 px-2 py-1 bg-white/5 rounded text-white/40 text-[10px] sm:text-xs">
              <Clock className="w-3 h-3" />
              <span>{cooldownTime}s</span>
            </div>
          ) : (
            <button
              onClick={onTest}
              disabled={isTesting || isGlobalTesting}
              className="flex items-center space-x-1 px-2 py-1 bg-white/10 border border-white/20 rounded text-white text-[10px] sm:text-xs hover:bg-white/20 hover:border-white/30 transition-all disabled:opacity-50"
            >
              {isTesting ? (
                <Loader className="w-3 h-3 animate-spin" />
              ) : (
                <Play className="w-3 h-3" />
              )}
              <span>Test</span>
            </button>
          )}
        </div>

        {/* Description */}
        <p className="text-white/50 text-[10px] sm:text-xs mb-1">{method.description}</p>

        {/* Result Status */}
        {result && (
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/10">
            <div className="flex items-center space-x-2">
              {result.success ? (
                <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 text-green-400" />
              ) : (
                <XCircle className="w-3 h-3 sm:w-4 sm:h-4 text-red-400" />
              )}
              <span className={`text-[10px] sm:text-xs ${result.success ? 'text-green-400' : 'text-red-400'}`}>
                {result.success ? 'Success' : 'Failed'}
              </span>
              <span className="text-white/40 text-[10px] sm:text-xs">
                {result.responseTime}ms
              </span>
            </div>
            
            <div className="flex items-center space-x-1">
              <button
                onClick={onCopy}
                className="p-1 sm:p-1.5 hover:bg-white/10 rounded transition-colors"
                title="Copy result"
              >
                <Copy className={`w-3 h-3 ${isCopying ? 'text-green-400' : 'text-white/40 hover:text-white'}`} />
              </button>
              <button
                onClick={onToggleExpand}
                className="p-1 sm:p-1.5 hover:bg-white/10 rounded transition-colors text-white/40 hover:text-white"
                title={isExpanded ? 'Collapse' : 'Expand'}
              >
                <svg 
                  className={`w-3 h-3 transition-transform ${isExpanded ? 'rotate-180' : ''}`} 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              <button
                onClick={onClear}
                className="p-1 sm:p-1.5 hover:bg-white/10 rounded transition-colors text-white/40 hover:text-red-400"
                title="Clear result"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Expanded Result */}
      {result && isExpanded && (
        <div className="border-t border-white/10 bg-black/30 p-2 sm:p-3 max-h-48 sm:max-h-64 overflow-auto scrollbar-hide">
          {result.error && (
            <div className="mb-2 p-2 bg-red-500/10 border border-red-500/20 rounded text-red-400 text-[10px] sm:text-xs">
              {result.error}
            </div>
          )}
          <pre className="text-white/60 text-[8px] sm:text-[10px] font-mono whitespace-pre-wrap break-all">
            {JSON.stringify(result.rawResponse || result, null, 2)}
          </pre>
        </div>
      )}

      {/* Cooldown Progress Bar */}
      {onCooldown && (
        <div className="h-0.5 bg-white/5">
          <div 
            className="h-full bg-white/20 transition-all duration-1000"
            style={{ width: `${(cooldownTime / 60) * 100}%` }}
          />
        </div>
      )}
    </div>
  );
};
