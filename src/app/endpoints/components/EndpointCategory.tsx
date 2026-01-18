'use client';

import { EndpointCategory as EndpointCategoryType, TestResult } from './types';
import { EndpointCard } from './EndpointCard';

interface EndpointCategoryProps {
  category: EndpointCategoryType;
  testResults: Record<string, TestResult>;
  individualTesting: Record<string, boolean>;
  globalTesting: boolean;
  cooldowns: Record<string, number>;
  expandedResults: Record<string, boolean>;
  copyingStates: Record<string, boolean>;
  getCooldownRemaining: (method: string) => number;
  onTestMethod: (method: string, endpoint: string) => void;
  onCopyResult: (method: string, result: TestResult) => void;
  onToggleExpand: (method: string) => void;
  onClearResult: (method: string) => void;
}

export const EndpointCategorySection = ({
  category,
  testResults,
  individualTesting,
  globalTesting,
  expandedResults,
  copyingStates,
  getCooldownRemaining,
  onTestMethod,
  onCopyResult,
  onToggleExpand,
  onClearResult
}: EndpointCategoryProps) => {
  return (
    <div className="relative bg-black border border-white/10 p-4 sm:p-6 group hover:border-white/20 transition-all duration-300">
      {/* Corner accents */}
      <div className="absolute top-0 left-0 w-4 h-4 z-20">
        <div className="absolute top-0 left-0 w-2 h-px bg-white/20 group-hover:bg-white/40 transition-all duration-300" />
        <div className="absolute top-0 left-0 w-px h-2 bg-white/20 group-hover:bg-white/40 transition-all duration-300" />
      </div>
      <div className="absolute top-0 right-0 w-4 h-4 z-20">
        <div className="absolute top-0 right-0 w-2 h-px bg-white/20 group-hover:bg-white/40 transition-all duration-300" />
        <div className="absolute top-0 right-0 w-px h-2 bg-white/20 group-hover:bg-white/40 transition-all duration-300" />
      </div>
      <div className="absolute bottom-0 left-0 w-4 h-4 z-20">
        <div className="absolute bottom-0 left-0 w-2 h-px bg-white/20 group-hover:bg-white/40 transition-all duration-300" />
        <div className="absolute bottom-0 left-0 w-px h-2 bg-white/20 group-hover:bg-white/40 transition-all duration-300" />
      </div>
      <div className="absolute bottom-0 right-0 w-4 h-4 z-20">
        <div className="absolute bottom-0 right-0 w-2 h-px bg-white/20 group-hover:bg-white/40 transition-all duration-300" />
        <div className="absolute bottom-0 right-0 w-px h-2 bg-white/20 group-hover:bg-white/40 transition-all duration-300" />
      </div>

      {/* Category Header */}
      <div className="flex items-center space-x-3 mb-4 relative z-10">
        <div className="text-white/60">{category.icon}</div>
        <div>
          <h3 className="text-white font-semibold text-sm sm:text-base">{category.category}</h3>
          <p className="text-white/40 text-xs sm:text-sm">{category.description}</p>
        </div>
      </div>

      {/* Methods Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 sm:gap-3 relative z-10 items-start">
        {category.methods.map((method) => {
          const result = testResults[method.name];
          
          return (
            <div key={method.name} className="h-full">
              <EndpointCard
                method={method}
                result={result}
                isTesting={individualTesting[method.name] || false}
                isGlobalTesting={globalTesting}
                cooldownTime={getCooldownRemaining(method.name)}
                isExpanded={expandedResults[method.name] || false}
                isCopying={copyingStates[method.name] || false}
                onTest={() => onTestMethod(method.name, method.endpoint)}
                onCopy={() => result && onCopyResult(method.name, result)}
                onToggleExpand={() => onToggleExpand(method.name)}
                onClear={() => onClearResult(method.name)}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
};
