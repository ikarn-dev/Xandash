// General utility functions

/**
 * Format storage bytes to human readable format (auto-selects GB/TB based on size)
 * @param bytes - Storage in bytes
 * @param decimals - Number of decimal places (default: 2)
 * @returns Formatted string like "500.50 GB" or "1.50 TB"
 */
export function formatStorage(bytes: number, decimals: number = 2): string {
  if (!bytes || bytes === 0) return '0 GB';
  
  const tb = bytes / (1024 ** 4);
  const gb = bytes / (1024 ** 3);
  
  if (tb >= 1) {
    return `${tb.toFixed(decimals)} TB`;
  }
  return `${gb.toFixed(decimals)} GB`;
}

/**
 * Format storage bytes to compact format (no space, for tables)
 * @param bytes - Storage in bytes
 * @param decimals - Number of decimal places (default: 2)
 * @returns Formatted string like "500.50GB" or "1.50TB"
 */
export function formatStorageCompact(bytes: number, decimals: number = 2): string {
  if (!bytes || bytes === 0) return '0GB';
  
  const tb = bytes / (1024 ** 4);
  const gb = bytes / (1024 ** 3);
  
  if (tb >= 1) {
    return `${tb.toFixed(decimals)}TB`;
  }
  return `${gb.toFixed(decimals)}GB`;
}