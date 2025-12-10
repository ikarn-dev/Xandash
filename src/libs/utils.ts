// General utility functions
// Add utility functions here as they are created

/**
 * Utility function to format class names
 */
export const formatClassName = (className?: string): string => {
  return className ? className.trim() : '';
};

/**
 * Utility function to generate unique IDs
 */
export const generateId = (): string => {
  return Math.random().toString(36).substr(2, 9);
};

/**
 * Utility function to debounce function calls
 */
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};