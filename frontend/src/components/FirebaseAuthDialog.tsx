import { useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useFirebaseAuth } from '../hooks/useFirebaseAuth';
import { useQueryClient } from '@tanstack/react-query';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, CheckCircle2, AlertCircle, Shield, Clock } from 'lucide-react';

interface FirebaseAuthDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type AuthStep = 'credentials' | 'verifying' | 'syncing' | 'success' | 'error';

export default function FirebaseAuthDialog({ open, onOpenChange }: FirebaseAuthDialogProps) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { authenticateWithFirebase, syncUserData, isAuthenticating, isSyncing, error: authError } = useFirebaseAuth();
  
  const [step, setStep] = useState<AuthStep>('credentials');
  const [epiqId, setEpiqId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [authResponse, setAuthResponse] = useState<any>(null);
  const [sessionExpiresAt, setSessionExpiresAt] = useState<Date | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!epiqId.trim() || !password.trim()) {
      setError('Please enter both EPIQ ID and password');
      return;
    }

    try {
      setStep('verifying');
      setError(null);

      console.log('[FirebaseAuthDialog] Authenticating with EPIQ ID:', epiqId);
      const response = await authenticateWithFirebase(epiqId, password);
      setAuthResponse(response);

      if (response.success) {
        console.log('[FirebaseAuthDialog] Authentication successful');
        
        // Store session expiry time
        if (response.sessionExpiresAt) {
          const expiryDate = new Date(Number(response.sessionExpiresAt) / 1_000_000);
          setSessionExpiresAt(expiryDate);
          console.log('[FirebaseAuthDialog] Session expires at:', expiryDate.toISOString());
        }
        
        // Check if we need to sync user data (for new users or profile updates)
        if (response.displayName && response.email && response.walletAddress && response.memberType) {
          console.log('[FirebaseAuthDialog] Syncing user profile data...');
          setStep('syncing');
          
          try {
            await syncUserData(
              response.epiqId!,
              response.displayName,
              response.email,
              response.walletAddress,
              response.memberType
            );
            console.log('[FirebaseAuthDialog] Profile data synced successfully');
          } catch (syncError) {
            console.error('[FirebaseAuthDialog] Profile sync error:', syncError);
            
            // Check if sync failed due to expired session
            if (syncError instanceof Error && syncError.message.includes('expired')) {
              setStep('error');
              setError('Session expired during sync. Please try logging in again.');
              return;
            }
            // Continue even if sync fails for other reasons - user is authenticated
          }
        }

        setStep('success');
        
        // Clear query cache and redirect after a short delay
        setTimeout(() => {
          queryClient.clear();
          onOpenChange(false);
          navigate({ to: '/launch' });
        }, 1500);
      } else {
        setStep('error');
        
        // Provide specific error messages for security events
        if (response.message.includes('replay')) {
          setError('Security alert: Replay attempt detected. Please try logging in again.');
        } else if (response.message.includes('expired')) {
          setError('Your session has expired. Please log in again.');
        } else if (response.message.includes('imported')) {
          setError('Imported users must log in via Internet Identity after import.');
        } else {
          setError(response.message || 'Authentication failed');
        }
      }
    } catch (err) {
      console.error('[FirebaseAuthDialog] Authentication error:', err);
      setStep('error');
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    }
  };

  const handleClose = () => {
    if (!isAuthenticating && !isSyncing && step !== 'verifying' && step !== 'syncing') {
      setStep('credentials');
      setEpiqId('');
      setPassword('');
      setError(null);
      setAuthResponse(null);
      setSessionExpiresAt(null);
      onOpenChange(false);
    }
  };

  const handleRetry = () => {
    setStep('credentials');
    setError(null);
    setAuthResponse(null);
    setSessionExpiresAt(null);
  };

  const isProcessing = isAuthenticating || isSyncing || step === 'verifying' || step === 'syncing';

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex justify-center mb-4">
            <div className="h-24 w-24 rounded-full bg-gradient-to-br from-[#6A5ACD] to-[#EFBF04] flex items-center justify-center shadow-lg">
              <Shield className="h-12 w-12 text-white" />
            </div>
          </div>
          <DialogTitle className="text-center text-2xl">
            {step === 'credentials' && 'Sign in with EPIQ Shield'}
            {step === 'verifying' && 'Verifying Credentials'}
            {step === 'syncing' && 'Syncing Profile'}
            {step === 'success' && 'Authentication Successful'}
            {step === 'error' && 'Authentication Failed'}
          </DialogTitle>
          <DialogDescription className="text-center">
            {step === 'credentials' && 'Enter your EPIQ Shield credentials to continue'}
            {step === 'verifying' && 'Verifying your credentials with Firebase...'}
            {step === 'syncing' && 'Synchronizing your profile data...'}
            {step === 'success' && 'Welcome back! Redirecting to your dashboard...'}
            {step === 'error' && 'There was a problem signing you in'}
          </DialogDescription>
        </DialogHeader>

        {step === 'credentials' && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="epiqId">EPIQ ID (Email)</Label>
              <Input
                id="epiqId"
                type="text"
                placeholder="Enter your EPIQ ID"
                value={epiqId}
                onChange={(e) => setEpiqId(e.target.value)}
                disabled={isProcessing}
                className="border-2 focus:border-[#6A5ACD]"
                autoComplete="username"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isProcessing}
                className="border-2 focus:border-[#6A5ACD]"
                autoComplete="current-password"
              />
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="pt-2 space-y-3">
              <div className="bg-muted/50 rounded-lg p-3 text-sm text-muted-foreground">
                <p className="flex items-start gap-2">
                  <Shield className="h-4 w-4 text-[#6A5ACD] mt-0.5 flex-shrink-0" />
                  <span>Secure per-session authentication with token validation</span>
                </p>
                <p className="flex items-start gap-2 mt-2">
                  <Clock className="h-4 w-4 text-[#EFBF04] mt-0.5 flex-shrink-0" />
                  <span>Sessions expire after 1 hour for your security</span>
                </p>
              </div>

              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleClose}
                  disabled={isProcessing}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isProcessing}
                  className="flex-1 bg-gradient-to-r from-[#6A5ACD] to-[#EFBF04] hover:from-[#6A5ACD]/90 hover:to-[#EFBF04]/90"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Signing in...
                    </>
                  ) : (
                    'Sign In'
                  )}
                </Button>
              </div>
            </div>
          </form>
        )}

        {(step === 'verifying' || step === 'syncing') && (
          <div className="flex flex-col items-center justify-center py-8 space-y-4">
            <div className="relative">
              <div className="h-20 w-20 rounded-full bg-gradient-to-br from-[#6A5ACD] to-[#EFBF04] flex items-center justify-center animate-pulse">
                <Shield className="h-10 w-10 text-white" />
              </div>
              <div className="absolute inset-0 rounded-full border-4 border-[#6A5ACD] border-t-transparent animate-spin" />
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>
                {step === 'verifying' && 'Verifying credentials with Firebase...'}
                {step === 'syncing' && 'Synchronizing profile data...'}
              </span>
            </div>
            <div className="flex gap-2">
              <div className="h-2 w-2 rounded-full bg-[#6A5ACD] animate-pulse" style={{ animationDelay: '0ms' }} />
              <div className="h-2 w-2 rounded-full bg-[#EFBF04] animate-pulse" style={{ animationDelay: '150ms' }} />
              <div className="h-2 w-2 rounded-full bg-[#6A5ACD] animate-pulse" style={{ animationDelay: '300ms' }} />
            </div>
          </div>
        )}

        {step === 'success' && (
          <div className="flex flex-col items-center justify-center py-8 space-y-4">
            <div className="h-20 w-20 rounded-full bg-gradient-to-br from-[#6A5ACD] to-[#EFBF04] flex items-center justify-center shadow-lg">
              <CheckCircle2 className="h-10 w-10 text-white" />
            </div>
            <div className="text-center space-y-2">
              <p className="font-medium text-foreground">
                Authentication Successful
              </p>
              <p className="text-sm text-muted-foreground">
                Your EPIQ Shield account has been verified
              </p>
              {sessionExpiresAt && (
                <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground bg-muted/50 rounded px-3 py-2 mt-2">
                  <Clock className="h-3 w-3 text-[#EFBF04]" />
                  <span>Session expires: {sessionExpiresAt.toLocaleTimeString()}</span>
                </div>
              )}
              {authResponse?.principalId && (
                <p className="text-xs text-muted-foreground font-mono bg-muted/50 rounded px-2 py-1 mt-2">
                  Session linked to Principal ID
                </p>
              )}
            </div>
            <div className="flex gap-2">
              <div className="h-2 w-2 rounded-full bg-[#6A5ACD] animate-pulse" />
              <div className="h-2 w-2 rounded-full bg-[#EFBF04] animate-pulse" />
              <div className="h-2 w-2 rounded-full bg-[#6A5ACD] animate-pulse" />
            </div>
          </div>
        )}

        {step === 'error' && (
          <div className="space-y-4">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error || authError || 'Authentication failed'}</AlertDescription>
            </Alert>

            <div className="bg-muted/50 rounded-lg p-3 text-sm text-muted-foreground space-y-2">
              <p className="font-medium">Common issues:</p>
              <ul className="space-y-1">
                <li className="flex items-start gap-2">
                  <span className="text-[#6A5ACD] mt-0.5">•</span>
                  <span>Check your EPIQ ID (email) and password</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#6A5ACD] mt-0.5">•</span>
                  <span>Ensure your Firebase account is active</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#6A5ACD] mt-0.5">•</span>
                  <span>Session may have expired - try logging in again</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#6A5ACD] mt-0.5">•</span>
                  <span>Verify your network connection</span>
                </li>
              </ul>
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={handleClose}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleRetry}
                className="flex-1 bg-gradient-to-r from-[#6A5ACD] to-[#EFBF04] hover:from-[#6A5ACD]/90 hover:to-[#EFBF04]/90"
              >
                Try Again
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
