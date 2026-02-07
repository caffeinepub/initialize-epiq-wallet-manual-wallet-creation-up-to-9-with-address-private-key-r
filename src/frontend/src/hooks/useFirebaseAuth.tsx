import { useState, useCallback } from 'react';
import { useActor } from './useActor';
import type { FirebaseAuthResponse } from '../backend';

export type FirebaseAuthStatus = 'idle' | 'authenticating' | 'syncing' | 'success' | 'error';

export interface UseFirebaseAuthReturn {
  authenticateWithFirebase: (epiqId: string, password: string) => Promise<FirebaseAuthResponse>;
  syncUserData: (epiqId: string, displayName: string, email: string, walletAddress: string, memberType: string) => Promise<void>;
  logoutFirebaseSession: () => Promise<void>;
  checkSessionValidity: () => Promise<boolean>;
  status: FirebaseAuthStatus;
  error: string | null;
  isAuthenticating: boolean;
  isSyncing: boolean;
  isSuccess: boolean;
  isError: boolean;
  clearError: () => void;
}

export function useFirebaseAuth(): UseFirebaseAuthReturn {
  const { actor } = useActor();
  const [status, setStatus] = useState<FirebaseAuthStatus>('idle');
  const [error, setError] = useState<string | null>(null);

  const authenticateWithFirebase = useCallback(async (epiqId: string, password: string): Promise<FirebaseAuthResponse> => {
    if (!actor) {
      const errorMsg = 'Backend actor not available';
      setError(errorMsg);
      setStatus('error');
      throw new Error(errorMsg);
    }

    try {
      setStatus('authenticating');
      setError(null);
      
      console.log('[useFirebaseAuth] Authenticating with Firebase:', epiqId);
      const response = await actor.authenticateWithFirebase(epiqId, password);
      
      console.log('[useFirebaseAuth] Firebase auth response:', response);
      
      if (response.success) {
        // Authentication successful - session is now linked to EPIQ ID with token expiry
        console.log('[useFirebaseAuth] Authentication successful, Principal ID:', response.principalId?.toString());
        console.log('[useFirebaseAuth] Session expires at:', response.sessionExpiresAt ? new Date(Number(response.sessionExpiresAt) / 1_000_000).toISOString() : 'N/A');
        setStatus('success');
        return response;
      } else {
        // Authentication failed - could be invalid credentials, expired token, or replay attempt
        console.error('[useFirebaseAuth] Authentication failed:', response.message);
        setStatus('error');
        setError(response.message);
        return response;
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Firebase authentication failed';
      console.error('[useFirebaseAuth] Error:', errorMsg);
      setStatus('error');
      setError(errorMsg);
      throw err;
    }
  }, [actor]);

  const syncUserData = useCallback(async (
    epiqId: string,
    displayName: string,
    email: string,
    walletAddress: string,
    memberType: string
  ): Promise<void> => {
    if (!actor) {
      const errorMsg = 'Backend actor not available';
      setError(errorMsg);
      throw new Error(errorMsg);
    }

    try {
      setStatus('syncing');
      console.log('[useFirebaseAuth] Syncing user data:', { epiqId, displayName, email });
      await actor.syncFirebaseUserData(epiqId, displayName, email, walletAddress, memberType);
      console.log('[useFirebaseAuth] User data synced successfully');
      setStatus('success');
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to sync user data';
      console.error('[useFirebaseAuth] Sync error:', errorMsg);
      
      // Check if error is due to expired session
      if (errorMsg.includes('expired') || errorMsg.includes('Invalid or expired session')) {
        setError('Your session has expired. Please log in again.');
      } else {
        setError(errorMsg);
      }
      
      setStatus('error');
      throw err;
    }
  }, [actor]);

  const logoutFirebaseSession = useCallback(async (): Promise<void> => {
    if (!actor) {
      console.warn('[useFirebaseAuth] Actor not available for logout');
      return;
    }

    try {
      console.log('[useFirebaseAuth] Logging out Firebase session...');
      await actor.logoutFirebaseSession();
      console.log('[useFirebaseAuth] Firebase session logged out successfully');
      setStatus('idle');
      setError(null);
    } catch (err) {
      console.error('[useFirebaseAuth] Logout error:', err);
      // Don't throw error on logout - just log it
    }
  }, [actor]);

  const checkSessionValidity = useCallback(async (): Promise<boolean> => {
    if (!actor) {
      console.warn('[useFirebaseAuth] Actor not available for session check');
      return false;
    }

    try {
      const isValid = await actor.hasValidFirebaseSession();
      console.log('[useFirebaseAuth] Session validity check:', isValid);
      return isValid;
    } catch (err) {
      console.error('[useFirebaseAuth] Session validity check error:', err);
      return false;
    }
  }, [actor]);

  const clearError = useCallback(() => {
    setError(null);
    setStatus('idle');
  }, []);

  return {
    authenticateWithFirebase,
    syncUserData,
    logoutFirebaseSession,
    checkSessionValidity,
    status,
    error,
    isAuthenticating: status === 'authenticating',
    isSyncing: status === 'syncing',
    isSuccess: status === 'success',
    isError: status === 'error',
    clearError,
  };
}
