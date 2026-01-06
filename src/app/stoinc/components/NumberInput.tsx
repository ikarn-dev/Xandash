'use client';

import React from 'react';
import { CornerAccents } from '@/components/ui';

interface NumberInputProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
  icon?: React.ReactNode;
  error?: string;
  helpText?: string;
}

export const NumberInput: React.FC<NumberInputProps> = ({
  label,
  value,
  onChange,
  min = 0,
  max,
  step = 1,
  unit,
  icon,
  error,
  helpText,
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = parseFloat(e.target.value);
    if (!isNaN(newValue)) {
      onChange(newValue);
    }
  };

  const handleIncrement = () => {
    const newValue = value + step;
    if (max === undefined || newValue <= max) {
      onChange(newValue);
    }
  };

  const handleDecrement = () => {
    const newValue = value - step;
    if (newValue >= min) {
      onChange(newValue);
    }
  };

  return (
    <div className="relative bg-black border border-white/10 p-4 group hover:border-white/20 transition-all duration-300">
      <CornerAccents />
      
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-3">
          <label className="text-white/70 text-sm font-medium flex items-center gap-2">
            {icon}
            {label}
          </label>
          {unit && <span className="text-white/40 text-xs">{unit}</span>}
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={handleDecrement}
            className="w-8 h-8 flex items-center justify-center bg-white/5 hover:bg-white/10 border border-white/10 rounded text-white/60 hover:text-white transition-all"
            disabled={value <= min}
          >
            -
          </button>
          
          <input
            type="number"
            value={value}
            onChange={handleChange}
            min={min}
            max={max}
            step={step}
            className={`flex-1 bg-black/50 border ${error ? 'border-red-500/50' : 'border-white/20'} rounded px-3 py-2 text-white font-mono text-center focus:outline-none focus:border-emerald-500/50 transition-colors [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none`}
          />
          
          <button
            onClick={handleIncrement}
            className="w-8 h-8 flex items-center justify-center bg-white/5 hover:bg-white/10 border border-white/10 rounded text-white/60 hover:text-white transition-all"
            disabled={max !== undefined && value >= max}
          >
            +
          </button>
        </div>
        
        {error && (
          <p className="text-red-400 text-xs mt-2">{error}</p>
        )}
        
        {helpText && !error && (
          <p className="text-white/40 text-xs mt-2">{helpText}</p>
        )}
      </div>
    </div>
  );
};
