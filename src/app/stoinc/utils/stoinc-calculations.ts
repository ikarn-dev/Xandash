/**
 * STOINC Calculation Utilities
 * Core calculation logic for storage credits and STOINC estimation
 */

export interface StoincInputs {
  pNodeCount: number;
  storageSpacePerNode: number; // in GB
  performanceScore: number; // 0-1
  xandStake: number;
  boostFactors: BoostFactor[];
}

export interface BoostFactor {
  id: string;
  name: string;
  multiplier: number;
  type: 'nft' | 'era';
  description: string;
}

export interface StoincResults {
  storageCredits: number;
  boostedCredits: number;
  geometricMeanBoost: number;
  estimatedStoinc: number;
}

export interface NetworkParameters {
  totalNetworkFees: number;
  pNodeShare: number;
  totalBoostedCredits: number;
}

export const DEFAULT_NETWORK_PARAMS: NetworkParameters = {
  totalNetworkFees: 1000,
  pNodeShare: 0.94,
  totalBoostedCredits: 1000000,
};

// Predefined boost factors
export const NFT_BOOST_FACTORS: BoostFactor[] = [
  { id: 'xeno', name: 'XENO NFT', multiplier: 1.1, type: 'nft', description: '10% boost' },
  { id: 'titan', name: 'Titan NFT', multiplier: 11, type: 'nft', description: '1,000% boost' },
  { id: 'genesis', name: 'Genesis NFT', multiplier: 1.5, type: 'nft', description: '50% boost' },
  { id: 'pioneer', name: 'Pioneer NFT', multiplier: 1.25, type: 'nft', description: '25% boost' },
];

export const ERA_BOOST_FACTORS: BoostFactor[] = [
  { id: 'deepsouth', name: 'DeepSouth Era', multiplier: 16, type: 'era', description: '1,500% boost' },
  { id: 'south', name: 'South Era', multiplier: 10, type: 'era', description: '900% boost' },
  { id: 'equator', name: 'Equator Era', multiplier: 5, type: 'era', description: '400% boost' },
  { id: 'north', name: 'North Era', multiplier: 2, type: 'era', description: '100% boost' },
];

/**
 * Calculate storage credits based on inputs
 */
export function calculateStorageCredits(inputs: StoincInputs): number {
  try {
    const { pNodeCount, storageSpacePerNode, performanceScore, xandStake } = inputs;
    
    if (pNodeCount <= 0 || storageSpacePerNode <= 0) {
      return 0;
    }
    
    const totalStorage = pNodeCount * storageSpacePerNode;
    const performanceMultiplier = Math.max(0.1, Math.min(1, performanceScore));
    const stakeBonus = Math.log10(Math.max(1, xandStake) + 1) * 0.1;
    
    const storageCredits = totalStorage * performanceMultiplier * (1 + stakeBonus);
    
    if (!isFinite(storageCredits) || isNaN(storageCredits)) {
      throw new Error('Storage credits calculation resulted in invalid number');
    }
    
    return storageCredits;
  } catch (error) {
    console.error('Error calculating storage credits:', error);
    throw error;
  }
}

/**
 * Calculate geometric mean of boost factors
 */
export function calculateGeometricMean(boostFactors: BoostFactor[]): number {
  try {
    if (boostFactors.length === 0) {
      return 1;
    }
    
    const validMultipliers = boostFactors
      .map(f => f.multiplier)
      .filter(m => m > 0 && isFinite(m));
    
    if (validMultipliers.length === 0) {
      return 1;
    }
    
    const logSum = validMultipliers.reduce((sum, m) => sum + Math.log(m), 0);
    const geometricMean = Math.exp(logSum / validMultipliers.length);
    
    if (!isFinite(geometricMean) || isNaN(geometricMean)) {
      throw new Error('Geometric mean calculation resulted in invalid number');
    }
    
    return geometricMean;
  } catch (error) {
    console.error('Error calculating geometric mean:', error);
    throw error;
  }
}

/**
 * Calculate boosted credits
 */
export function calculateBoostedCredits(storageCredits: number, boostFactors: BoostFactor[]): number {
  const geometricMean = calculateGeometricMean(boostFactors);
  return storageCredits * geometricMean;
}

/**
 * Estimate STOINC earnings
 */
export function estimateStoinc(boostedCredits: number, networkParams: NetworkParameters = DEFAULT_NETWORK_PARAMS): number {
  if (boostedCredits === 0 || networkParams.totalBoostedCredits === 0) {
    return 0;
  }
  
  const shareOfNetwork = boostedCredits / networkParams.totalBoostedCredits;
  return shareOfNetwork * networkParams.totalNetworkFees * networkParams.pNodeShare;
}

/**
 * Calculate complete STOINC results
 */
export function calculateStoinc(inputs: StoincInputs, networkParams: NetworkParameters = DEFAULT_NETWORK_PARAMS): StoincResults {
  try {
    if (networkParams.totalBoostedCredits <= 0) {
      throw new Error('Total boosted credits must be positive');
    }
    if (networkParams.pNodeShare < 0 || networkParams.pNodeShare > 1) {
      throw new Error('pNode share must be between 0 and 1');
    }
    
    const storageCredits = calculateStorageCredits(inputs);
    const geometricMeanBoost = calculateGeometricMean(inputs.boostFactors);
    const boostedCredits = storageCredits * geometricMeanBoost;
    const estimatedStoincValue = estimateStoinc(boostedCredits, networkParams);
    
    const results: StoincResults = {
      storageCredits,
      boostedCredits,
      geometricMeanBoost,
      estimatedStoinc: estimatedStoincValue,
    };
    
    Object.values(results).forEach((value, index) => {
      if (!isFinite(value) || isNaN(value)) {
        throw new Error(`Invalid calculation result at index ${index}`);
      }
    });
    
    return results;
  } catch (error) {
    console.error('Error in STOINC calculation:', error);
    throw error;
  }
}

// Formatting utilities
export const formatNumber = (num: number, decimals: number = 2): string => {
  if (num >= 1e9) return (num / 1e9).toFixed(decimals) + 'B';
  if (num >= 1e6) return (num / 1e6).toFixed(decimals) + 'M';
  if (num >= 1e3) return (num / 1e3).toFixed(decimals) + 'K';
  return num.toFixed(decimals);
};

export const formatPercent = (percent: number): string => {
  return ((percent - 1) * 100).toFixed(1) + '%';
};
