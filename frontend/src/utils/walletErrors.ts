import { WalletError } from '../backend';
import { WalletOperationError } from '../hooks/useQueries';

/**
 * Normalizes backend WalletError discriminants into safe, user-facing messages.
 * Handles WalletOperationError (typed), WalletError string enum values, and
 * generic Error objects. Never leaks internal implementation details.
 */
export function normalizeWalletError(error: unknown): string {
  // Handle typed WalletOperationError thrown by useQueries mutations
  if (error instanceof WalletOperationError) {
    return mapWalletErrorVariant(error.variant) ?? 'An unexpected error occurred. Please try again.';
  }

  // Handle raw WalletError enum string values (e.g. thrown directly)
  if (typeof error === 'string') {
    const mapped = mapWalletErrorVariant(error as WalletError);
    if (mapped !== null) return mapped;
  }

  // Handle Error objects — inspect message for known patterns
  if (error instanceof Error) {
    const msg = error.message.toLowerCase();

    // Check if the message itself is a WalletError variant string
    const variantFromMessage = mapWalletErrorVariant(error.message as WalletError);
    if (variantFromMessage !== null) return variantFromMessage;

    if (msg.includes('wallet limit') || msg.includes('walletlimitreached')) {
      return 'You have reached the 9-wallet limit. Remove a wallet or use an existing one.';
    }
    if (msg.includes('unauthorized') || msg.includes('unauthorizedaccess')) {
      return 'Authentication required. Please log in and try again.';
    }
    if (msg.includes('randomness') || msg.includes('randomerror')) {
      return 'Unable to generate secure randomness. Please try again in a moment.';
    }
    if (msg.includes('notauthenticated') || msg.includes('not authenticated')) {
      return 'Authentication required to create a wallet. Please log in and try again.';
    }
    if (msg.includes('internal') || msg.includes('internalerror')) {
      return 'An internal error occurred. Please try again later.';
    }
    if (msg.includes('invalid') || msg.includes('invalidrequest')) {
      return 'Invalid request. Please check your input and try again.';
    }
    if (msg.includes('timeout') || msg.includes('timed out')) {
      return 'The request timed out. Please check your connection and try again.';
    }
    if (msg.includes('network') || msg.includes('fetch')) {
      return 'Network error. Please check your connection and try again.';
    }
    if (msg.includes('actor not available')) {
      return 'Backend connection unavailable. Please refresh and try again.';
    }
  }

  // Fallback — never expose raw error details
  return 'An unexpected error occurred. Please try again.';
}

/**
 * Maps a WalletError enum variant to a specific, user-friendly message.
 * Returns null if the variant is not recognized.
 */
function mapWalletErrorVariant(variant: WalletError | string): string | null {
  switch (variant as WalletError) {
    case WalletError.unauthorizedAccess:
      return 'Authentication required. Please log in and try again.';
    case WalletError.walletLimitReached:
      return 'You have reached the 9-wallet limit. Remove a wallet or use an existing one.';
    case WalletError.invalidRequest:
      return 'Invalid request. Please check your input and try again.';
    case WalletError.internalError:
      return 'An internal error occurred. Please try again later.';
    default:
      return null;
  }
}
