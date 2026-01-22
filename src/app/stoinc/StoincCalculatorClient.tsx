'use client';

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';

// Custom SVG Icons
const CalculatorIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="4" y="2" width="16" height="20" rx="2" />
    <line x1="8" y1="6" x2="16" y2="6" />
    <line x1="8" y1="10" x2="16" y2="10" />
    <line x1="8" y1="14" x2="16" y2="14" />
    <line x1="8" y1="18" x2="12" y2="18" />
  </svg>
);

const StorageIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <ellipse cx="12" cy="5" rx="9" ry="3" />
    <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" />
    <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
  </svg>
);

const TrendUpIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
    <polyline points="17 6 23 6 23 12" />
  </svg>
);

const ChartIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M3 3v18h18" />
    <path d="M18 17V9M13 17V5M8 17v-3" />
  </svg>
);

const InfoIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="16" x2="12" y2="12" />
    <line x1="12" y1="8" x2="12.01" y2="8" />
  </svg>
);

const DollarIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10" />
    <path d="M12 6v12M15 9.5c-.5-1-1.5-1.5-3-1.5-2 0-3 1-3 2.5s1 2 3 2.5c2 .5 3 1.5 3 2.5s-1 2.5-3 2.5c-1.5 0-2.5-.5-3-1.5" />
  </svg>
);

// Custom icons for earning factors
const PNodeIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
    <line x1="8" y1="21" x2="16" y2="21" />
    <line x1="12" y1="17" x2="12" y2="21" />
    <circle cx="7" cy="9" r="1.5" fill="currentColor" />
    <circle cx="12" cy="9" r="1.5" fill="currentColor" />
    <circle cx="17" cy="9" r="1.5" fill="currentColor" />
    <path d="M7 9v3M12 9v3M17 9v3" />
  </svg>
);

const StorageBoxIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
    <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
    <line x1="12" y1="22.08" x2="12" y2="12" />
    <line x1="12" y1="12" x2="12" y2="12.01" />
  </svg>
);

const PerformanceIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
    <circle cx="12" cy="12" r="3" />
    <path d="M12 9v3l2 2" />
  </svg>
);

const StakeIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10" />
    <path d="M12 6v6l4 2" />
    <circle cx="12" cy="12" r="2" fill="currentColor" />
    <path d="M8.5 8.5L6 6M15.5 8.5L18 6M8.5 15.5L6 18M15.5 15.5L18 18" />
  </svg>
);

// Corner Accent Component for consistent styling
const CornerAccents = ({ color = "white" }: { color?: string }) => {
  const colorClass = color === "emerald" ? "group-hover:bg-emerald-400 group-hover:shadow-[0_0_8px_rgba(16,185,129,0.6)]" : "group-hover:bg-white group-hover:shadow-[0_0_8px_rgba(255,255,255,0.6)]";
  return (
    <>
      <div className="absolute top-0 left-0 w-4 h-4">
        <div className={`absolute top-0 left-0 w-2 h-px bg-white/20 ${colorClass} transition-all duration-300`}></div>
        <div className={`absolute top-0 left-0 w-px h-2 bg-white/20 ${colorClass} transition-all duration-300`}></div>
      </div>
      <div className="absolute top-0 right-0 w-4 h-4">
        <div className={`absolute top-0 right-0 w-2 h-px bg-white/20 ${colorClass} transition-all duration-300`}></div>
        <div className={`absolute top-0 right-0 w-px h-2 bg-white/20 ${colorClass} transition-all duration-300`}></div>
      </div>
      <div className="absolute bottom-0 left-0 w-4 h-4">
        <div className={`absolute bottom-0 left-0 w-2 h-px bg-white/20 ${colorClass} transition-all duration-300`}></div>
        <div className={`absolute bottom-0 left-0 w-px h-2 bg-white/20 ${colorClass} transition-all duration-300`}></div>
      </div>
      <div className="absolute bottom-0 right-0 w-4 h-4">
        <div className={`absolute bottom-0 right-0 w-2 h-px bg-white/20 ${colorClass} transition-all duration-300`}></div>
        <div className={`absolute bottom-0 right-0 w-px h-2 bg-white/20 ${colorClass} transition-all duration-300`}></div>
      </div>
    </>
  );
};

// Core interfaces for STOINC calculation
interface StoincInputs {
  pNodeCount: number;
  storageSpacePerNode: number; // in GB
  performanceScore: number; // 0-1
  xandStake: number;
  boostFactors: BoostFactor[];
}

interface BoostFactor {
  id: string;
  name: string;
  multiplier: number;
  type: 'nft' | 'era';
  description: string;
}

interface StoincResults {
  storageCredits: number;
  boostedCredits: number;
  geometricMeanBoost: number;
  estimatedStoinc: number;
  breakdown: CalculationBreakdown;
}

interface CalculationBreakdown {
  baseCalculation: {
    pNodes: number;
    storageSpace: number;
    performance: number;
    stake: number;
    result: number;
  };
  boostCalculation: {
    factors: BoostFactor[];
    geometricMean: number;
    boostedResult: number;
  };
  stoincEstimation: {
    totalNetworkFees: number;
    pNodeShare: number;
    userShare: number;
    estimatedEarnings: number;
  };
}

// Predefined boost factors
const NFT_BOOST_FACTORS: BoostFactor[] = [
  { id: 'xeno', name: 'XENO NFT', multiplier: 1.1, type: 'nft', description: '10% boost' },
  { id: 'titan', name: 'Titan NFT', multiplier: 11, type: 'nft', description: '1,000% boost' },
  { id: 'dragon', name: 'Dragon NFT', multiplier: 4, type: 'nft', description: '300% boost' },
  { id: 'coyote', name: 'Coyote NFT', multiplier: 2.5, type: 'nft', description: '150% boost' },
  { id: 'rabbit', name: 'Rabbit NFT', multiplier: 1.5, type: 'nft', description: '50% boost' },
  { id: 'cricket', name: 'Cricket NFT', multiplier: 1.1, type: 'nft', description: '10% boost' }
];

const ERA_BOOST_FACTORS: BoostFactor[] = [
  { id: 'deepsouth', name: 'DeepSouth Era', multiplier: 16, type: 'era', description: '1,500% boost' },
  { id: 'south', name: 'South Era', multiplier: 10, type: 'era', description: '900% boost' },
  { id: 'main', name: 'Main Era', multiplier: 7, type: 'era', description: '600% boost' },
  { id: 'coal', name: 'Coal Era', multiplier: 3.5, type: 'era', description: '250% boost' },
  { id: 'central', name: 'Central Era', multiplier: 2, type: 'era', description: '100% boost' },
  { id: 'north', name: 'North Era', multiplier: 1.25, type: 'era', description: '25% boost' }
];

// Network parameters for STOINC estimation
interface NetworkParameters {
  totalNetworkFees: number; // Example value for calculation (in SOL)
  pNodeShare: number; // 0.94 (94%)
  totalBoostedCredits: number; // Estimated network total
}

const DEFAULT_NETWORK_PARAMS: NetworkParameters = {
  totalNetworkFees: 1000, // Example: 1000 SOL per epoch
  pNodeShare: 0.94, // 94% goes to pNode operators
  totalBoostedCredits: 1000000 // Example total network boosted credits
};

// Core calculation functions

/**
 * Calculate storage credits using the formula: pNodes × storageSpace × performanceScore × stake
 * @throws {Error} If inputs are invalid or calculation fails
 */
function calculateStorageCredits(inputs: StoincInputs): number {
  try {
    const { pNodeCount, storageSpacePerNode, performanceScore, xandStake } = inputs;

    // Validate inputs
    if (!Number.isFinite(pNodeCount) || !Number.isFinite(storageSpacePerNode) ||
      !Number.isFinite(performanceScore) || !Number.isFinite(xandStake)) {
      throw new Error('All input values must be valid numbers');
    }

    // If any factor is zero, return zero (as per requirements)
    if (pNodeCount === 0 || storageSpacePerNode === 0 || performanceScore === 0 || xandStake === 0) {
      return 0;
    }

    const result = pNodeCount * storageSpacePerNode * performanceScore * xandStake;

    if (!Number.isFinite(result)) {
      throw new Error('Calculation resulted in invalid number');
    }

    return result;
  } catch (error) {
    throw new Error(`Storage credits calculation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Calculate geometric mean of boost factors: (product of all boost factors)^(1/count)
 * @throws {Error} If calculation fails or results in invalid number
 */
function calculateGeometricMean(boostFactors: BoostFactor[]): number {
  try {
    if (boostFactors.length === 0) {
      return 1; // No boost factors means no boost (multiplier of 1)
    }

    // Validate all multipliers are positive numbers
    for (const factor of boostFactors) {
      if (!Number.isFinite(factor.multiplier) || factor.multiplier <= 0) {
        throw new Error(`Invalid boost factor multiplier: ${factor.multiplier}`);
      }
    }

    // Calculate product of all multipliers
    const product = boostFactors.reduce((acc, factor) => acc * factor.multiplier, 1);

    if (!Number.isFinite(product) || product <= 0) {
      throw new Error('Product of boost factors is invalid');
    }

    // Return geometric mean: product^(1/count)
    const result = Math.pow(product, 1 / boostFactors.length);

    if (!Number.isFinite(result)) {
      throw new Error('Geometric mean calculation resulted in invalid number');
    }

    return result;
  } catch (error) {
    throw new Error(`Geometric mean calculation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Calculate boosted credits: storageCredits × geometricMean(boostFactors)
 */
function calculateBoostedCredits(storageCredits: number, boostFactors: BoostFactor[]): number {
  const geometricMean = calculateGeometricMean(boostFactors);
  return storageCredits * geometricMean;
}

/**
 * Estimate STOINC earnings: (boostedCredits / totalBoostedCredits) × totalFees × pNodeShare
 */
function estimateStoinc(boostedCredits: number, networkParams: NetworkParameters = DEFAULT_NETWORK_PARAMS): number {
  if (boostedCredits === 0 || networkParams.totalBoostedCredits === 0) {
    return 0;
  }

  const userShare = boostedCredits / networkParams.totalBoostedCredits;
  return userShare * networkParams.totalNetworkFees * networkParams.pNodeShare;
}

/**
 * Perform complete STOINC calculation with breakdown
 * @throws {Error} If any calculation step fails
 */
function calculateStoinc(inputs: StoincInputs, networkParams: NetworkParameters = DEFAULT_NETWORK_PARAMS): StoincResults {
  try {
    // Validate network parameters
    if (!networkParams.totalNetworkFees || !networkParams.pNodeShare || !networkParams.totalBoostedCredits) {
      throw new Error('Invalid network parameters provided');
    }

    // Calculate storage credits
    const storageCredits = calculateStorageCredits(inputs);

    // Calculate boosted credits
    const boostedCredits = calculateBoostedCredits(storageCredits, inputs.boostFactors);
    const geometricMeanBoost = calculateGeometricMean(inputs.boostFactors);

    // Estimate STOINC earnings
    const estimatedStoinc = estimateStoinc(boostedCredits, networkParams);

    // Create detailed breakdown
    const breakdown: CalculationBreakdown = {
      baseCalculation: {
        pNodes: inputs.pNodeCount,
        storageSpace: inputs.storageSpacePerNode,
        performance: inputs.performanceScore,
        stake: inputs.xandStake,
        result: storageCredits
      },
      boostCalculation: {
        factors: inputs.boostFactors,
        geometricMean: geometricMeanBoost,
        boostedResult: boostedCredits
      },
      stoincEstimation: {
        totalNetworkFees: networkParams.totalNetworkFees,
        pNodeShare: networkParams.pNodeShare,
        userShare: boostedCredits / networkParams.totalBoostedCredits,
        estimatedEarnings: estimatedStoinc
      }
    };

    return {
      storageCredits,
      boostedCredits,
      geometricMeanBoost,
      estimatedStoinc,
      breakdown
    };
  } catch (error) {
    throw new Error(`STOINC calculation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Utility functions for formatting
const formatNumber = (num: number, decimals: number = 2): string => {
  if (num >= 1e9) return (num / 1e9).toFixed(decimals) + 'B';
  if (num >= 1e6) return (num / 1e6).toFixed(decimals) + 'M';
  if (num >= 1e3) return (num / 1e3).toFixed(decimals) + 'K';
  return num.toFixed(decimals);
};

const formatPercent = (percent: number): string => {
  return ((percent - 1) * 100).toFixed(1) + '%';
};

interface ValidationErrors {
  pNodeCount?: string;
  storageSpacePerNode?: string;
  performanceScore?: string;
  xandStake?: string;
}

interface ValidationResult {
  isValid: boolean;
  error?: string;
}

// Input validation functions

/**
 * Validate pNode count - must be positive integer
 */
function validatePNodeCount(count: number): ValidationResult {
  if (!Number.isInteger(count)) {
    return { isValid: false, error: 'pNode count must be a whole number' };
  }
  if (count <= 0) {
    return { isValid: false, error: 'pNode count must be greater than 0' };
  }
  if (count > 1000) {
    return { isValid: false, error: 'pNode count cannot exceed 1000' };
  }
  return { isValid: true };
}

/**
 * Validate storage space - must be positive number
 */
function validateStorageSpace(space: number): ValidationResult {
  if (isNaN(space) || !isFinite(space)) {
    return { isValid: false, error: 'Storage space must be a valid number' };
  }
  if (space <= 0) {
    return { isValid: false, error: 'Storage space must be greater than 0 GB' };
  }
  if (space > 100000) {
    return { isValid: false, error: 'Storage space cannot exceed 100,000 GB' };
  }
  return { isValid: true };
}

/**
 * Validate performance score - must be between 0 and 1 inclusive
 */
function validatePerformanceScore(score: number): ValidationResult {
  if (isNaN(score) || !isFinite(score)) {
    return { isValid: false, error: 'Performance score must be a valid number' };
  }
  if (score < 0) {
    return { isValid: false, error: 'Performance score cannot be negative' };
  }
  if (score > 1) {
    return { isValid: false, error: 'Performance score cannot exceed 1.0' };
  }
  return { isValid: true };
}

/**
 * Validate XAND stake - must be non-negative number
 */
function validateXandStake(stake: number): ValidationResult {
  if (isNaN(stake) || !isFinite(stake)) {
    return { isValid: false, error: 'XAND stake must be a valid number' };
  }
  if (stake < 0) {
    return { isValid: false, error: 'XAND stake cannot be negative' };
  }
  if (stake > 1000000000) {
    return { isValid: false, error: 'XAND stake cannot exceed 1 billion' };
  }
  return { isValid: true };
}

/**
 * Validate all inputs and return validation errors
 */
function validateInputs(inputs: StoincInputs): ValidationErrors {
  const errors: ValidationErrors = {};

  const pNodeValidation = validatePNodeCount(inputs.pNodeCount);
  if (!pNodeValidation.isValid) {
    errors.pNodeCount = pNodeValidation.error;
  }

  const storageValidation = validateStorageSpace(inputs.storageSpacePerNode);
  if (!storageValidation.isValid) {
    errors.storageSpacePerNode = storageValidation.error;
  }

  const performanceValidation = validatePerformanceScore(inputs.performanceScore);
  if (!performanceValidation.isValid) {
    errors.performanceScore = performanceValidation.error;
  }

  const stakeValidation = validateXandStake(inputs.xandStake);
  if (!stakeValidation.isValid) {
    errors.xandStake = stakeValidation.error;
  }

  return errors;
}

/**
 * Check if inputs are valid (no validation errors)
 */
function areInputsValid(errors: ValidationErrors): boolean {
  return Object.keys(errors).length === 0;
}

// NumberInput Component
interface NumberInputProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  error?: string;
  unit?: string;
  placeholder?: string;
  min?: number;
  max?: number;
  step?: number;
  decimals?: number;
}

const NumberInput: React.FC<NumberInputProps> = ({
  label,
  value,
  onChange,
  error,
  unit,
  placeholder,
  min,
  max,
  step = 1,
  decimals = 0
}) => {
  const [inputValue, setInputValue] = useState(value.toString());
  const [isFocused, setIsFocused] = useState(false);

  // Update input value when prop changes
  useEffect(() => {
    setInputValue(value.toString());
  }, [value]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);

    // Parse and validate the number
    const numValue = parseFloat(newValue);
    if (!isNaN(numValue) && isFinite(numValue)) {
      onChange(numValue);
    }
  };

  const handleBlur = () => {
    setIsFocused(false);
    // Format the value on blur
    const numValue = parseFloat(inputValue);
    if (!isNaN(numValue) && isFinite(numValue)) {
      setInputValue(numValue.toFixed(decimals));
    }
  };

  return (
    <div className="space-y-2">
      <label className="block text-white/70 text-sm font-medium">
        {label}
        {unit && <span className="text-white/40 ml-1">({unit})</span>}
      </label>
      <div className="relative">
        <input
          type="number"
          value={inputValue}
          onChange={handleInputChange}
          onFocus={() => setIsFocused(true)}
          onBlur={handleBlur}
          placeholder={placeholder}
          min={min}
          max={max}
          step={step}
          className={`w-full px-3 py-2 bg-white/5 border rounded-lg text-white placeholder-white/40 transition-colors focus:outline-none focus:ring-2 ${error
              ? 'border-red-500/50 focus:border-red-500 focus:ring-red-500/20'
              : 'border-white/10 focus:border-emerald-500/50 focus:ring-emerald-500/20'
            }`}
        />
        {unit && !isFocused && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/40 text-sm pointer-events-none">
            {unit}
          </div>
        )}
      </div>
      {error && (
        <div className="text-red-400 text-xs flex items-center gap-1">
          <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          {error}
        </div>
      )}
    </div>
  );
};

// BoostFactorSelector Component
interface BoostFactorSelectorProps {
  selectedFactors: BoostFactor[];
  onChange: (factors: BoostFactor[]) => void;
  pNodeCount: number;
}

const BoostFactorSelector: React.FC<BoostFactorSelectorProps> = ({
  selectedFactors,
  onChange,
  pNodeCount
}) => {
  const [activeTab, setActiveTab] = useState<'nft' | 'era'>('nft');

  const handleFactorToggle = (factor: BoostFactor) => {
    const isSelected = selectedFactors.some(f => f.id === factor.id);

    if (isSelected) {
      // Remove the factor
      onChange(selectedFactors.filter(f => f.id !== factor.id));
    } else {
      // Add the factor (limit to pNode count)
      if (selectedFactors.length < pNodeCount) {
        onChange([...selectedFactors, factor]);
      } else {
        toast.error(`You can only select up to ${pNodeCount} boost factor${pNodeCount !== 1 ? 's' : ''} (one per pNode)`);
      }
    }
  };

  const renderFactorCard = (factor: BoostFactor) => {
    const isSelected = selectedFactors.some(f => f.id === factor.id);
    const boostPercentage = ((factor.multiplier - 1) * 100).toFixed(1);

    return (
      <div
        key={factor.id}
        onClick={() => handleFactorToggle(factor)}
        className={`relative p-4 rounded-lg border cursor-pointer transition-all duration-300 group ${isSelected
            ? 'border-emerald-500/50 bg-gradient-to-br from-emerald-500/20 to-emerald-500/5 shadow-lg shadow-emerald-500/10'
            : 'border-white/10 bg-gradient-to-br from-white/5 to-transparent hover:border-emerald-500/30 hover:from-emerald-500/10 hover:to-transparent'
          }`}
      >
        {/* Corner accents for selected state */}
        {isSelected && (
          <>
            <div className="absolute top-0 left-0 w-3 h-3">
              <div className="absolute top-0 left-0 w-2 h-px bg-emerald-400"></div>
              <div className="absolute top-0 left-0 w-px h-2 bg-emerald-400"></div>
            </div>
            <div className="absolute top-0 right-0 w-3 h-3">
              <div className="absolute top-0 right-0 w-2 h-px bg-emerald-400"></div>
              <div className="absolute top-0 right-0 w-px h-2 bg-emerald-400"></div>
            </div>
            <div className="absolute bottom-0 left-0 w-3 h-3">
              <div className="absolute bottom-0 left-0 w-2 h-px bg-emerald-400"></div>
              <div className="absolute bottom-0 left-0 w-px h-2 bg-emerald-400"></div>
            </div>
            <div className="absolute bottom-0 right-0 w-3 h-3">
              <div className="absolute bottom-0 right-0 w-2 h-px bg-emerald-400"></div>
              <div className="absolute bottom-0 right-0 w-px h-2 bg-emerald-400"></div>
            </div>
          </>
        )}

        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <h4 className={`font-medium text-sm mb-1 transition-colors ${isSelected ? 'text-emerald-400' : 'text-white group-hover:text-emerald-400'
              }`}>
              {factor.name}
            </h4>
            <div className="text-white/40 text-xs">
              {factor.description}
            </div>
          </div>
          <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 ml-2 transition-all ${isSelected
              ? 'border-emerald-500 bg-emerald-500 scale-110'
              : 'border-white/30 group-hover:border-emerald-500/50'
            }`}>
            {isSelected && (
              <svg className="w-3 h-3 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className={`font-mono text-xl font-bold transition-colors ${isSelected ? 'text-emerald-400' : 'text-white/70 group-hover:text-emerald-400'
            }`}>
            {factor.multiplier}x
          </div>
          <div className={`px-2 py-1 rounded-md text-xs font-medium transition-colors ${isSelected
              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
              : 'bg-white/5 text-white/60 border border-white/10 group-hover:bg-emerald-500/10 group-hover:text-emerald-400 group-hover:border-emerald-500/20'
            }`}>
            +{boostPercentage}%
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-5">
      {/* Header with stats */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-white font-semibold text-lg">Boost Factors</h3>
          <p className="text-white/50 text-sm mt-0.5">
            Select up to {pNodeCount} boost factor{pNodeCount !== 1 ? 's' : ''} (one per pNode)
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className={`px-3 py-1.5 border rounded-lg ${selectedFactors.length >= pNodeCount
              ? 'bg-emerald-500/20 border-emerald-500/30'
              : 'bg-white/5 border-white/10'
            }`}>
            <div className={`text-xs font-medium ${selectedFactors.length >= pNodeCount ? 'text-emerald-400' : 'text-white/70'
              }`}>
              {selectedFactors.length}/{pNodeCount} Selected
            </div>
          </div>
          {selectedFactors.length > 1 && (
            <div className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg">
              <div className="text-white/70 text-xs font-mono">
                {calculateGeometricMean(selectedFactors).toFixed(3)}x Total
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="relative flex space-x-2 bg-black/50 border border-white/10 rounded-lg p-1.5">
        <button
          onClick={() => setActiveTab('nft')}
          className={`relative flex-1 px-4 py-2.5 rounded-md text-sm font-medium transition-all duration-300 ${activeTab === 'nft'
              ? 'bg-gradient-to-r from-emerald-500/20 to-emerald-500/10 text-emerald-400 shadow-lg shadow-emerald-500/10'
              : 'text-white/60 hover:text-white hover:bg-white/5'
            }`}
        >
          <div className="flex items-center justify-center gap-2">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="7" height="7" />
              <rect x="14" y="3" width="7" height="7" />
              <rect x="14" y="14" width="7" height="7" />
              <rect x="3" y="14" width="7" height="7" />
            </svg>
            <span>NFT Boosts</span>
          </div>
          {activeTab === 'nft' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-400"></div>
          )}
        </button>
        <button
          onClick={() => setActiveTab('era')}
          className={`relative flex-1 px-4 py-2.5 rounded-md text-sm font-medium transition-all duration-300 ${activeTab === 'era'
              ? 'bg-gradient-to-r from-emerald-500/20 to-emerald-500/10 text-emerald-400 shadow-lg shadow-emerald-500/10'
              : 'text-white/60 hover:text-white hover:bg-white/5'
            }`}
        >
          <div className="flex items-center justify-center gap-2">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
            <span>Purchase Era Boosts</span>
          </div>
          {activeTab === 'era' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-400"></div>
          )}
        </button>
      </div>

      {/* Boost Factor Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {(activeTab === 'nft' ? NFT_BOOST_FACTORS : ERA_BOOST_FACTORS).map(renderFactorCard)}
      </div>

      {/* Selected Factors Summary */}
      {selectedFactors.length > 0 && (
        <div className="relative bg-gradient-to-br from-emerald-500/10 to-transparent border border-emerald-500/30 rounded-lg p-5 overflow-hidden">
          {/* Background pattern */}
          <div className="absolute inset-0 opacity-5">
            <div className="absolute inset-0" style={{
              backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(16, 185, 129, 0.3) 1px, transparent 0)',
              backgroundSize: '24px 24px'
            }}></div>
          </div>

          <div className="relative">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                <span className="text-white/70 text-sm font-mono">// ACTIVE BOOSTS</span>
              </div>
              <button
                onClick={() => onChange([])}
                className="text-xs text-white/50 hover:text-red-400 transition-colors flex items-center gap-1"
              >
                <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
                Clear All
              </button>
            </div>

            <div className="flex flex-wrap gap-2 mb-4">
              {selectedFactors.map((factor) => (
                <div
                  key={factor.id}
                  className="group flex items-center gap-2 px-3 py-2 bg-black/50 border border-emerald-500/30 rounded-lg hover:border-emerald-500/50 transition-all"
                >
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></div>
                    <span className="text-white text-sm">{factor.name}</span>
                  </div>
                  <div className="flex items-center gap-2 pl-2 border-l border-white/10">
                    <span className="font-mono text-emerald-400 text-sm font-medium">{factor.multiplier}x</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleFactorToggle(factor);
                      }}
                      className="opacity-0 group-hover:opacity-100 hover:text-red-400 text-white/50 transition-all"
                    >
                      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="18" y1="6" x2="6" y2="18" />
                        <line x1="6" y1="6" x2="18" y2="18" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {selectedFactors.length > 1 && (
              <div className="flex items-center justify-between p-3 bg-black/30 border border-white/10 rounded-lg">
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                    <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
                    <line x1="12" y1="22.08" x2="12" y2="12" />
                  </svg>
                  <span className="text-white/70 text-sm">Combined Geometric Mean:</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-emerald-400 text-lg font-bold">
                    {calculateGeometricMean(selectedFactors).toFixed(3)}x
                  </span>
                  <span className="text-emerald-400/70 text-xs">
                    (+{((calculateGeometricMean(selectedFactors) - 1) * 100).toFixed(1)}%)
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// ResultCard Component
interface ResultCardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon: React.ReactNode;
  color?: 'emerald' | 'cyan' | 'purple' | 'blue';
  trend?: {
    value: string;
    isPositive: boolean;
  };
}

const ResultCard: React.FC<ResultCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  color = 'emerald',
  trend
}) => {
  const colorClasses = {
    emerald: 'hover:border-emerald-500/30 text-emerald-400',
    cyan: 'hover:border-cyan-500/30 text-cyan-400',
    purple: 'hover:border-purple-500/30 text-purple-400',
    blue: 'hover:border-blue-500/30 text-blue-400'
  };

  return (
    <div className={`relative bg-black border border-white/10 p-4 group transition-all duration-300 overflow-hidden ${colorClasses[color].split(' ')[0]}`}>
      <CornerAccents />
      <div className="flex items-center gap-2 mb-3">
        <div className={colorClasses[color].split(' ')[1]}>{icon}</div>
        <span className="text-white/60 text-xs font-mono">{title}</span>
      </div>
      <div className="space-y-1">
        <div className={`text-xl font-bold font-mono ${colorClasses[color].split(' ')[1]}`}>
          {value}
        </div>
        {subtitle && (
          <div className="text-white/40 text-xs">{subtitle}</div>
        )}
        {trend && (
          <div className={`flex items-center gap-1 text-xs ${trend.isPositive ? 'text-emerald-400' : 'text-red-400'}`}>
            {trend.isPositive ? (
              <TrendUpIcon className="w-3 h-3" />
            ) : (
              <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="23 18 13.5 8.5 8.5 13.5 1 6" />
                <polyline points="17 18 23 18 23 12" />
              </svg>
            )}
            <span>{trend.value}</span>
          </div>
        )}
      </div>
    </div>
  );
};

// FormulaBreakdown Component
interface FormulaBreakdownProps {
  results: StoincResults;
  inputs: StoincInputs;
}

const FormulaBreakdown: React.FC<FormulaBreakdownProps> = ({ results, inputs }) => {
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  const copyFormula = (formula: string) => {
    navigator.clipboard.writeText(formula);
    toast.success('Formula copied to clipboard');
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <InfoIcon className="w-4 h-4 text-cyan-400" />
        <span className="text-white/60 text-sm font-mono">// CALCULATION BREAKDOWN</span>
      </div>

      {/* Base Formula */}
      <div className="bg-white/5 rounded-lg overflow-hidden">
        <button
          onClick={() => toggleSection('base')}
          className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-white/5 transition-colors"
        >
          <div>
            <div className="text-white font-medium text-sm">Base Storage Credits Formula</div>
            <div className="text-white/40 text-xs">pNodes × storageSpace × performanceScore × stake</div>
          </div>
          <svg
            className={`w-4 h-4 text-white/40 transition-transform ${expandedSection === 'base' ? 'rotate-180' : ''}`}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>

        {expandedSection === 'base' && (
          <div className="px-4 pb-4 border-t border-white/10">
            <div className="space-y-3 mt-3">
              <div className="bg-black/50 rounded p-3 font-mono text-sm">
                <div className="text-emerald-400 mb-2">storageCredits = pNodes × storageSpace × performanceScore × stake</div>
                <div className="text-white/70">
                  storageCredits = {inputs.pNodeCount} × {inputs.storageSpacePerNode} × {inputs.performanceScore} × {inputs.xandStake}
                </div>
                <div className="text-emerald-400 mt-2">
                  storageCredits = {formatNumber(results.storageCredits)}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-white/40">pNodes:</span>
                  <span className="text-white ml-2">{inputs.pNodeCount}</span>
                </div>
                <div>
                  <span className="text-white/40">Storage Space:</span>
                  <span className="text-white ml-2">{inputs.storageSpacePerNode} GB</span>
                </div>
                <div>
                  <span className="text-white/40">Performance:</span>
                  <span className="text-white ml-2">{inputs.performanceScore}</span>
                </div>
                <div>
                  <span className="text-white/40">XAND Stake:</span>
                  <span className="text-white ml-2">{formatNumber(inputs.xandStake)}</span>
                </div>
              </div>
              <button
                onClick={() => copyFormula(`storageCredits = ${inputs.pNodeCount} × ${inputs.storageSpacePerNode} × ${inputs.performanceScore} × ${inputs.xandStake} = ${formatNumber(results.storageCredits)}`)}
                className="text-cyan-400 text-xs hover:text-cyan-300 transition-colors"
              >
                📋 Copy Formula
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Boost Formula */}
      {results.geometricMeanBoost > 1 && (
        <div className="bg-white/5 rounded-lg overflow-hidden">
          <button
            onClick={() => toggleSection('boost')}
            className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-white/5 transition-colors"
          >
            <div>
              <div className="text-white font-medium text-sm">Boost Factor Calculation</div>
              <div className="text-white/40 text-xs">Geometric mean of selected boost factors</div>
            </div>
            <svg
              className={`w-4 h-4 text-white/40 transition-transform ${expandedSection === 'boost' ? 'rotate-180' : ''}`}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>

          {expandedSection === 'boost' && (
            <div className="px-4 pb-4 border-t border-white/10">
              <div className="space-y-3 mt-3">
                <div className="bg-black/50 rounded p-3 font-mono text-sm">
                  <div className="text-emerald-400 mb-2">
                    geometricMean = (∏ boostFactors)^(1/n)
                  </div>
                  <div className="text-white/70">
                    geometricMean = ({inputs.boostFactors.map(f => f.multiplier).join(' × ')})^(1/{inputs.boostFactors.length})
                  </div>
                  <div className="text-emerald-400 mt-2">
                    geometricMean = {results.geometricMeanBoost.toFixed(3)}
                  </div>
                  <div className="text-white/70 mt-2">
                    boostedCredits = {formatNumber(results.storageCredits)} × {results.geometricMeanBoost.toFixed(3)} = {formatNumber(results.boostedCredits)}
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="text-white/60 text-xs font-medium">Selected Boost Factors:</div>
                  {inputs.boostFactors.map((factor, index) => (
                    <div key={factor.id} className="flex justify-between text-xs">
                      <span className="text-white/40">{factor.name}:</span>
                      <span className="text-emerald-400">{factor.multiplier}x</span>
                    </div>
                  ))}
                </div>
                <button
                  onClick={() => copyFormula(`boostedCredits = ${formatNumber(results.storageCredits)} × ${results.geometricMeanBoost.toFixed(3)} = ${formatNumber(results.boostedCredits)}`)}
                  className="text-cyan-400 text-xs hover:text-cyan-300 transition-colors"
                >
                  📋 Copy Formula
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* STOINC Estimation */}
      <div className="bg-white/5 rounded-lg overflow-hidden">
        <button
          onClick={() => toggleSection('stoinc')}
          className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-white/5 transition-colors"
        >
          <div>
            <div className="text-white font-medium text-sm">STOINC Estimation Formula</div>
            <div className="text-white/40 text-xs">(boostedCredits / totalBoostedCredits) × totalFees × pNodeShare</div>
          </div>
          <svg
            className={`w-4 h-4 text-white/40 transition-transform ${expandedSection === 'stoinc' ? 'rotate-180' : ''}`}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>

        {expandedSection === 'stoinc' && (
          <div className="px-4 pb-4 border-t border-white/10">
            <div className="space-y-3 mt-3">
              <div className="bg-black/50 rounded p-3 font-mono text-sm">
                <div className="text-emerald-400 mb-2">
                  STOINC = (boostedCredits / totalBoostedCredits) × totalFees × pNodeShare
                </div>
                <div className="text-white/70">
                  STOINC = ({formatNumber(results.boostedCredits)} / {formatNumber(results.breakdown.stoincEstimation.totalNetworkFees * 1000)}) × {results.breakdown.stoincEstimation.totalNetworkFees} × {results.breakdown.stoincEstimation.pNodeShare}
                </div>
                <div className="text-emerald-400 mt-2">
                  STOINC = {results.estimatedStoinc.toFixed(6)} SOL per epoch
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-white/40">Your Share:</span>
                  <span className="text-white ml-2">{(results.breakdown.stoincEstimation.userShare * 100).toFixed(4)}%</span>
                </div>
                <div>
                  <span className="text-white/40">pNode Share:</span>
                  <span className="text-white ml-2">{(results.breakdown.stoincEstimation.pNodeShare * 100)}%</span>
                </div>
                <div>
                  <span className="text-white/40">Network Fees:</span>
                  <span className="text-white ml-2">{results.breakdown.stoincEstimation.totalNetworkFees} SOL</span>
                </div>
                <div>
                  <span className="text-white/40">Epoch Duration:</span>
                  <span className="text-white ml-2">~2 days</span>
                </div>
              </div>
              <button
                onClick={() => copyFormula(`STOINC = ${results.estimatedStoinc.toFixed(6)} SOL per epoch`)}
                className="text-cyan-400 text-xs hover:text-cyan-300 transition-colors"
              >
                📋 Copy Result
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export function StoincCalculatorClient() {
  const [inputs, setInputs] = useState<StoincInputs>({
    pNodeCount: 1,
    storageSpacePerNode: 100,
    performanceScore: 1.0,
    xandStake: 1000,
    boostFactors: []
  });

  const [results, setResults] = useState<StoincResults | null>(null);
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [isCalculating, setIsCalculating] = useState(false);

  // Calculate STOINC when inputs change
  const performCalculation = useCallback(() => {
    // Validate inputs first
    const validationErrors = validateInputs(inputs);
    setErrors(validationErrors);

    // Only calculate if inputs are valid
    if (!areInputsValid(validationErrors)) {
      setResults(null);
      return;
    }

    setIsCalculating(true);
    try {
      const calculationResults = calculateStoinc(inputs);
      setResults(calculationResults);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown calculation error';
      toast.error(`Failed to calculate STOINC: ${errorMessage}`);
      setResults(null);
    } finally {
      setIsCalculating(false);
    }
  }, [inputs]);

  // Perform calculation when inputs change
  useEffect(() => {
    performCalculation();
  }, [performCalculation]);

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <div className="relative bg-black border border-white/10 p-4 sm:p-6 group hover:border-white/20 transition-all duration-300 overflow-hidden">
        <CornerAccents color="emerald" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="w-10 h-10 sm:w-14 sm:h-14 bg-emerald-500/20 border border-emerald-500/30 rounded-full flex items-center justify-center flex-shrink-0">
              <CalculatorIcon className="w-5 h-5 sm:w-7 sm:h-7 text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-bold text-white">STOINC Calculator</h1>
                <span className="px-2 py-0.5 bg-emerald-500/20 border border-emerald-500/30 rounded text-emerald-400 text-[10px] sm:text-xs">Storage Income</span>
              </div>
              <p className="text-white/60 text-xs sm:text-sm mt-1">Calculate your potential earnings from running pNodes</p>
            </div>
          </div>

          <div className="flex flex-col items-start md:items-end gap-1">
            <div className="flex items-center gap-2 text-emerald-400">
              <TrendUpIcon className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="text-xs sm:text-sm font-mono">Real-time Calculation</span>
            </div>
            <span className="text-white/40 text-[10px] sm:text-xs">Updated every epoch (~2 days)</span>
          </div>
        </div>
      </div>

      {/* About STOINC Section */}
      <div className="relative bg-black border border-white/10 overflow-hidden group hover:border-white/20 transition-all duration-300">
        <CornerAccents />

        {/* Background pattern */}
        <div className="absolute inset-0 opacity-[0.02]">
          <div className="absolute inset-0" style={{
            backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(255, 255, 255, 0.15) 1px, transparent 0)',
            backgroundSize: '32px 32px'
          }}></div>
        </div>

        <div className="relative p-4 sm:p-6 lg:p-8">
          {/* Header */}
          <div className="flex items-start gap-3 mb-6">
            <div className="w-10 h-10 bg-emerald-500/20 border border-emerald-500/30 rounded-lg flex items-center justify-center flex-shrink-0">
              <InfoIcon className="w-5 h-5 text-emerald-400" />
            </div>
            <div className="flex-1">
              <h2 className="text-white font-semibold text-lg sm:text-xl mb-1">About STOINC</h2>
              <p className="text-white/50 text-xs sm:text-sm font-mono">// Storage Income Protocol</p>
            </div>
          </div>

          {/* Main content */}
          <div className="space-y-6">
            {/* Description cards */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* What is STOINC */}
              <div className="bg-white/5 border border-white/10 rounded-lg p-4 hover:border-emerald-500/30 transition-colors">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-400"></div>
                  <h3 className="text-white font-medium text-sm">What is STOINC?</h3>
                </div>
                <p className="text-white/70 text-sm leading-relaxed">
                  <span className="text-emerald-400 font-semibold">STOINC (Storage Income)</span> is the revenue you earn by running pNodes,
                  funded by fees from sedApps (storage-enabled dApps). Your earnings depend on four key factors:
                  number of pNodes, storage space provided, performance score, and XAND staked.
                </p>
              </div>

              {/* How it works */}
              <div className="bg-white/5 border border-white/10 rounded-lg p-4 hover:border-emerald-500/30 transition-colors">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-cyan-400"></div>
                  <h3 className="text-white font-medium text-sm">How Boost Factors Work</h3>
                </div>
                <p className="text-white/70 text-sm leading-relaxed">
                  Boost factors from NFTs or early pNode purchases can significantly increase your earnings through
                  geometric mean calculation. The formula ensures fair distribution based on your contribution to the network.
                </p>
              </div>
            </div>

            {/* Revenue distribution */}
            <div className="bg-gradient-to-br from-white/5 to-transparent border border-white/10 rounded-lg p-4 sm:p-5">
              <div className="flex items-center gap-2 mb-4">
                <svg className="w-4 h-4 text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                </svg>
                <h3 className="text-white font-medium text-sm">Revenue Distribution</h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* pNode Operators */}
                <div className="relative bg-black/50 border border-emerald-500/30 rounded-lg p-4 overflow-hidden group/card hover:border-emerald-500/50 transition-colors">
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 to-emerald-400"></div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                      <span className="text-white/60 text-xs">pNode Operators</span>
                    </div>
                  </div>
                  <div className="text-2xl sm:text-3xl font-bold text-emerald-400 font-mono mb-1">94%</div>
                  <p className="text-white/40 text-xs">Primary revenue share</p>
                </div>

                {/* XAND DAO */}
                <div className="relative bg-black/50 border border-blue-500/30 rounded-lg p-4 overflow-hidden group/card hover:border-blue-500/50 transition-colors">
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-blue-400"></div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                      <span className="text-white/60 text-xs">XAND DAO</span>
                    </div>
                  </div>
                  <div className="text-2xl sm:text-3xl font-bold text-blue-400 font-mono mb-1">3%</div>
                  <p className="text-white/40 text-xs">Governance & development</p>
                </div>

                {/* Preferred Investors */}
                <div className="relative bg-black/50 border border-purple-500/30 rounded-lg p-4 overflow-hidden group/card hover:border-purple-500/50 transition-colors">
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 to-purple-400"></div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-purple-500"></div>
                      <span className="text-white/60 text-xs">Preferred Investors</span>
                    </div>
                  </div>
                  <div className="text-2xl sm:text-3xl font-bold text-purple-400 font-mono mb-1">3%</div>
                  <p className="text-white/40 text-xs">Early supporter rewards</p>
                </div>
              </div>
            </div>

            {/* Key factors */}
            <div className="bg-white/5 border border-white/10 rounded-lg p-4 sm:p-5">
              <div className="flex items-center gap-2 mb-4">
                <svg className="w-4 h-4 text-cyan-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                </svg>
                <h3 className="text-white font-medium text-sm">Earning Factors</h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <div className="flex items-start gap-3 p-3 bg-black/30 border border-white/10 rounded-lg hover:border-emerald-500/30 hover:bg-emerald-500/5 transition-all group/factor">
                  <div className="w-8 h-8 bg-emerald-500/20 border border-emerald-500/30 rounded flex items-center justify-center flex-shrink-0 group-hover/factor:bg-emerald-500/30 transition-colors">
                    <PNodeIcon className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div>
                    <div className="text-white text-sm font-medium mb-0.5 group-hover/factor:text-emerald-400 transition-colors">pNodes</div>
                    <div className="text-white/50 text-xs">Number of nodes</div>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 bg-black/30 border border-white/10 rounded-lg hover:border-cyan-500/30 hover:bg-cyan-500/5 transition-all group/factor">
                  <div className="w-8 h-8 bg-cyan-500/20 border border-cyan-500/30 rounded flex items-center justify-center flex-shrink-0 group-hover/factor:bg-cyan-500/30 transition-colors">
                    <StorageBoxIcon className="w-4 h-4 text-cyan-400" />
                  </div>
                  <div>
                    <div className="text-white text-sm font-medium mb-0.5 group-hover/factor:text-cyan-400 transition-colors">Storage</div>
                    <div className="text-white/50 text-xs">Space provided</div>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 bg-black/30 border border-white/10 rounded-lg hover:border-blue-500/30 hover:bg-blue-500/5 transition-all group/factor">
                  <div className="w-8 h-8 bg-blue-500/20 border border-blue-500/30 rounded flex items-center justify-center flex-shrink-0 group-hover/factor:bg-blue-500/30 transition-colors">
                    <PerformanceIcon className="w-4 h-4 text-blue-400" />
                  </div>
                  <div>
                    <div className="text-white text-sm font-medium mb-0.5 group-hover/factor:text-blue-400 transition-colors">Performance</div>
                    <div className="text-white/50 text-xs">Reliability score</div>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 bg-black/30 border border-white/10 rounded-lg hover:border-purple-500/30 hover:bg-purple-500/5 transition-all group/factor">
                  <div className="w-8 h-8 bg-purple-500/20 border border-purple-500/30 rounded flex items-center justify-center flex-shrink-0 group-hover/factor:bg-purple-500/30 transition-colors">
                    <StakeIcon className="w-4 h-4 text-purple-400" />
                  </div>
                  <div>
                    <div className="text-white text-sm font-medium mb-0.5 group-hover/factor:text-purple-400 transition-colors">XAND Stake</div>
                    <div className="text-white/50 text-xs">Tokens staked</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Input Section */}
      <div className="relative bg-black border border-white/10 p-6 group hover:border-white/20 transition-all duration-300 overflow-hidden">
        <CornerAccents />
        <div className="flex items-center gap-2 mb-6">
          <StorageIcon className="w-4 h-4 text-cyan-400" />
          <span className="text-white/60 text-sm font-mono">// CALCULATOR INPUTS</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <NumberInput
            label="Number of pNodes"
            value={inputs.pNodeCount}
            onChange={(value) => setInputs(prev => ({ ...prev, pNodeCount: value }))}
            error={errors.pNodeCount}
            placeholder="1"
            min={1}
            max={1000}
            step={1}
            decimals={0}
          />

          <NumberInput
            label="Storage Space per pNode"
            value={inputs.storageSpacePerNode}
            onChange={(value) => setInputs(prev => ({ ...prev, storageSpacePerNode: value }))}
            error={errors.storageSpacePerNode}
            unit="GB"
            placeholder="100"
            min={1}
            max={100000}
            step={1}
            decimals={0}
          />

          <NumberInput
            label="Performance Score"
            value={inputs.performanceScore}
            onChange={(value) => setInputs(prev => ({ ...prev, performanceScore: value }))}
            error={errors.performanceScore}
            placeholder="1.0"
            min={0}
            max={1}
            step={0.01}
            decimals={2}
          />

          <NumberInput
            label="XAND Stake"
            value={inputs.xandStake}
            onChange={(value) => setInputs(prev => ({ ...prev, xandStake: value }))}
            error={errors.xandStake}
            unit="XAND"
            placeholder="1000"
            min={0}
            max={1000000000}
            step={1}
            decimals={0}
          />
        </div>

        {/* Input Help Text */}
        <div className="mt-6 p-4 bg-white/5 rounded-lg">
          <div className="text-white/60 text-sm font-mono mb-2">// INPUT GUIDELINES</div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-white/50">
            <div>
              <strong className="text-white/70">pNodes:</strong> Number of storage nodes you own (1-1000)
            </div>
            <div>
              <strong className="text-white/70">Storage:</strong> GB of storage per pNode (1-100,000)
            </div>
            <div>
              <strong className="text-white/70">Performance:</strong> Network reliability score (0.0-1.0)
            </div>
            <div>
              <strong className="text-white/70">Stake:</strong> Amount of XAND tokens staked (0+)
            </div>
          </div>
        </div>
      </div>

      {/* Boost Factor Selection */}
      <div className="relative bg-black border border-white/10 p-6 group hover:border-white/20 transition-all duration-300 overflow-hidden">
        <CornerAccents />
        <div className="flex items-center gap-2 mb-6">
          <TrendUpIcon className="w-4 h-4 text-emerald-400" />
          <span className="text-white/60 text-sm font-mono">// BOOST FACTORS</span>
        </div>

        <BoostFactorSelector
          selectedFactors={inputs.boostFactors}
          onChange={(factors) => setInputs(prev => ({ ...prev, boostFactors: factors }))}
          pNodeCount={inputs.pNodeCount}
        />
      </div>

      {/* Results Section */}
      <div className="relative bg-black border border-white/10 p-6 group hover:border-white/20 transition-all duration-300 overflow-hidden">
        <CornerAccents />
        <div className="flex items-center gap-2 mb-4">
          <DollarIcon className="w-4 h-4 text-emerald-400" />
          <span className="text-white/60 text-sm font-mono">// STOINC RESULTS</span>
        </div>

        {results ? (
          <div className="space-y-6">
            {/* Key Results Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <ResultCard
                title="STORAGE CREDITS"
                value={formatNumber(results.storageCredits)}
                subtitle="Base calculation result"
                icon={<StorageIcon className="w-4 h-4" />}
                color="cyan"
              />

              <ResultCard
                title="BOOSTED CREDITS"
                value={formatNumber(results.boostedCredits)}
                subtitle={results.geometricMeanBoost > 1 ? `${formatPercent(results.geometricMeanBoost)} boost applied` : 'No boost factors'}
                icon={<TrendUpIcon className="w-4 h-4" />}
                color="emerald"
                trend={results.geometricMeanBoost > 1 ? {
                  value: `${formatPercent(results.geometricMeanBoost)} boost`,
                  isPositive: true
                } : undefined}
              />

              <ResultCard
                title="ESTIMATED STOINC"
                value={`${results.estimatedStoinc.toFixed(6)} SOL`}
                subtitle="per epoch (~2 days)"
                icon={<DollarIcon className="w-4 h-4" />}
                color="emerald"
              />
            </div>

            {/* Additional Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <ResultCard
                title="NETWORK SHARE"
                value={`${(results.breakdown.stoincEstimation.userShare * 100).toFixed(4)}%`}
                subtitle="of total network boosted credits"
                icon={<ChartIcon className="w-4 h-4" />}
                color="purple"
              />

              <ResultCard
                title="MONTHLY ESTIMATE"
                value={`${(results.estimatedStoinc * 15).toFixed(4)} SOL`}
                subtitle="~15 epochs per month"
                icon={<DollarIcon className="w-4 h-4" />}
                color="blue"
              />
            </div>

            {/* Formula Breakdown */}
            <FormulaBreakdown results={results} inputs={inputs} />

            {/* Formula Breakdown */}
            <div className="bg-white/5 rounded-lg p-4">
              <div className="text-white/60 text-sm font-mono mb-3">// CALCULATION BREAKDOWN</div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-white/60">Base Formula:</span>
                  <span className="text-white font-mono">
                    {inputs.pNodeCount} × {inputs.storageSpacePerNode} × {inputs.performanceScore} × {inputs.xandStake} = {formatNumber(results.storageCredits)}
                  </span>
                </div>
                {results.geometricMeanBoost > 1 && (
                  <div className="flex justify-between">
                    <span className="text-white/60">Boost Factor:</span>
                    <span className="text-emerald-400 font-mono">
                      ×{results.geometricMeanBoost.toFixed(3)} = {formatNumber(results.boostedCredits)}
                    </span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-white/60">Network Share:</span>
                  <span className="text-white font-mono">
                    {(results.breakdown.stoincEstimation.userShare * 100).toFixed(4)}% of network
                  </span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-white/40">
            <TrendUpIcon className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>{isCalculating ? 'Calculating...' : 'Enter your pNode details to see results'}</p>
          </div>
        )}
      </div>
    </div>
  );
}