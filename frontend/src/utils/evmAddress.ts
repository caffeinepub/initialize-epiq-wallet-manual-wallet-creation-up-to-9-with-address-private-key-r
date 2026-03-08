/**
 * Validates and normalizes EVM address strings
 */

/**
 * Validates if a string is a valid EVM address (0x + 40 hex characters)
 */
export function isValidEvmAddress(address: string): boolean {
  if (!address) return false;
  
  // Check format: 0x followed by 40 hexadecimal characters
  const evmAddressRegex = /^0x[0-9a-fA-F]{40}$/;
  return evmAddressRegex.test(address);
}

/**
 * Normalizes an EVM address to lowercase with 0x prefix
 */
export function normalizeEvmAddress(address: string): string {
  if (!address) return '';
  
  // Ensure 0x prefix
  const withPrefix = address.startsWith('0x') ? address : `0x${address}`;
  
  // Convert to lowercase for consistency
  return withPrefix.toLowerCase();
}

/**
 * Validates and normalizes an EVM address, throwing an error if invalid
 */
export function validateAndNormalizeEvmAddress(address: string): string {
  const normalized = normalizeEvmAddress(address);
  
  if (!isValidEvmAddress(normalized)) {
    throw new Error('Invalid EVM address format. Expected 0x followed by 40 hexadecimal characters.');
  }
  
  return normalized;
}

/**
 * Truncates an EVM address for display (e.g., 0x1234...5678)
 */
export function truncateEvmAddress(address: string, startChars: number = 6, endChars: number = 4): string {
  if (!address || address.length < startChars + endChars) {
    return address;
  }
  
  return `${address.slice(0, startChars)}...${address.slice(-endChars)}`;
}
