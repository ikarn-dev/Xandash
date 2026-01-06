/**
 * STOINC Input Validation Utilities
 */

import type { StoincInputs } from './stoinc-calculations';

export interface ValidationErrors {
  pNodeCount?: string;
  storageSpacePerNode?: string;
  performanceScore?: string;
  xandStake?: string;
}

export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

/**
 * Validate pNode count - must be positive integer
 */
export function validatePNodeCount(count: number): ValidationResult {
  if (!Number.isInteger(count)) {
    return { isValid: false, error: 'pNode count must be a whole number' };
  }
  if (count < 0) {
    return { isValid: false, error: 'pNode count cannot be negative' };
  }
  if (count > 10000) {
    return { isValid: false, error: 'pNode count seems unrealistically high' };
  }
  return { isValid: true };
}

/**
 * Validate storage space - must be positive number
 */
export function validateStorageSpace(space: number): ValidationResult {
  if (isNaN(space) || !isFinite(space)) {
    return { isValid: false, error: 'Storage space must be a valid number' };
  }
  if (space < 0) {
    return { isValid: false, error: 'Storage space cannot be negative' };
  }
  if (space > 1000000) {
    return { isValid: false, error: 'Storage space seems unrealistically high (max 1PB)' };
  }
  return { isValid: true };
}

/**
 * Validate performance score - must be between 0 and 1 inclusive
 */
export function validatePerformanceScore(score: number): ValidationResult {
  if (isNaN(score) || !isFinite(score)) {
    return { isValid: false, error: 'Performance score must be a valid number' };
  }
  if (score < 0 || score > 1) {
    return { isValid: false, error: 'Performance score must be between 0 and 1' };
  }
  return { isValid: true };
}

/**
 * Validate XAND stake - must be non-negative number
 */
export function validateXandStake(stake: number): ValidationResult {
  if (isNaN(stake) || !isFinite(stake)) {
    return { isValid: false, error: 'XAND stake must be a valid number' };
  }
  if (stake < 0) {
    return { isValid: false, error: 'XAND stake cannot be negative' };
  }
  return { isValid: true };
}

/**
 * Validate all inputs and return validation errors
 */
export function validateInputs(inputs: StoincInputs): ValidationErrors {
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
export function areInputsValid(errors: ValidationErrors): boolean {
  return Object.keys(errors).length === 0;
}
