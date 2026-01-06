'use client';

import React, { useState } from 'react';
import { CornerAccents } from '@/components/ui';
import { NFT_BOOST_FACTORS, ERA_BOOST_FACTORS, type BoostFactor } from '../utils/stoinc-calculations';

interface BoostFactorSelectorProps {
  selectedFactors: BoostFactor[];
  onChange: (factors: BoostFactor[]) => void;
  disabled?: boolean;
}

export const BoostFactorSelector: React.FC<BoostFactorSelectorProps> = ({
  selectedFactors,
  onChange,
  disabled = false,
}) => {
  const [activeTab, setActiveTab] = useState<'nft' | 'era'>('nft');

  const toggleFactor = (factor: BoostFactor) => {
    if (disabled) return;
    
    const isSelected = selectedFactors.some(f => f.id === factor.id);
    if (isSelected) {
      onChange(selectedFactors.filter(f => f.id !== factor.id));
    } else {
      onChange([...selectedFactors, factor]);
    }
  };

  const factors = activeTab === 'nft' ? NFT_BOOST_FACTORS : ERA_BOOST_FACTORS;

  return (
    <div className="relative bg-black border border-white/10 p-4 group hover:border-white/20 transition-all duration-300">
      <CornerAccents />
      
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-4">
          <span className="text-white/70 text-sm font-medium">Boost Factors</span>
          <span className="text-emerald-400 text-xs font-mono">
            {selectedFactors.length} selected
          </span>
        </div>
        
        {/* Tabs */}
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setActiveTab('nft')}
            className={`flex-1 py-2 px-3 text-xs font-medium rounded transition-all ${
              activeTab === 'nft'
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                : 'bg-white/5 text-white/60 border border-white/10 hover:bg-white/10'
            }`}
          >
            NFT Boosts
          </button>
          <button
            onClick={() => setActiveTab('era')}
            className={`flex-1 py-2 px-3 text-xs font-medium rounded transition-all ${
              activeTab === 'era'
                ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                : 'bg-white/5 text-white/60 border border-white/10 hover:bg-white/10'
            }`}
          >
            Era Boosts
          </button>
        </div>
        
        {/* Factor List */}
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {factors.map((factor) => {
            const isSelected = selectedFactors.some(f => f.id === factor.id);
            return (
              <button
                key={factor.id}
                onClick={() => toggleFactor(factor)}
                disabled={disabled}
                className={`w-full flex items-center justify-between p-3 rounded border transition-all ${
                  isSelected
                    ? activeTab === 'nft'
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                      : 'bg-purple-500/10 border-purple-500/30 text-purple-400'
                    : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10'
                } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-4 h-4 rounded border-2 flex items-center justify-center ${
                    isSelected
                      ? activeTab === 'nft'
                        ? 'border-emerald-400 bg-emerald-400'
                        : 'border-purple-400 bg-purple-400'
                      : 'border-white/30'
                  }`}>
                    {isSelected && (
                      <svg className="w-3 h-3 text-black" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                  <div className="text-left">
                    <div className="text-sm font-medium">{factor.name}</div>
                    <div className="text-xs text-white/40">{factor.description}</div>
                  </div>
                </div>
                <div className="text-sm font-mono">
                  {factor.multiplier}x
                </div>
              </button>
            );
          })}
        </div>
        
        {/* Selected Summary */}
        {selectedFactors.length > 0 && (
          <div className="mt-4 pt-4 border-t border-white/10">
            <div className="flex flex-wrap gap-2">
              {selectedFactors.map((factor) => (
                <span
                  key={factor.id}
                  className={`px-2 py-1 text-xs rounded ${
                    factor.type === 'nft'
                      ? 'bg-emerald-500/20 text-emerald-400'
                      : 'bg-purple-500/20 text-purple-400'
                  }`}
                >
                  {factor.name} ({factor.multiplier}x)
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
