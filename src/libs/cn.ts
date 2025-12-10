// Class name utility functions
// This will be implemented when shadcn/ui is configured

/**
 * Placeholder for cn utility function
 * Will be implemented with clsx and tailwind-merge in task 4
 */
export const cn = (...classes: (string | undefined)[]): string => {
  return classes.filter(Boolean).join(' ');
};