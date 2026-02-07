import { useEffect, useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useActor } from '../hooks/useActor';
import { useGetCallerUserProfile } from '../hooks/useQueries';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Loader2, RefreshCw } from 'lucide-react';

type InitializationStage = 'auth' | 'backend' | 'profile' | 'complete';

export default function LaunchInitialization() {
  const navigate = useNavigate();
  const { identity, isInitializing: authInitializing } = useInternetIdentity();
  const { actor, isFetching: actorFetching } = useActor();
  const { 
    data: userProfile, 
    isLoading: profileLoading, 
    isFetched: profileFetched,
    isError: profileError 
  } = useGetCallerUserProfile();

  const [progressStep, setProgressStep] = useState<InitializationStage>('auth');
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [isBackendReady, setIsBackendReady] = useState(false);
  const [isProfileLoaded, setIsProfileLoaded] = useState(false);
  const [isError, setIsError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [retryCount, setRetryCount] = useState(0);
  const [progress, setProgress] = useState(0);
  const [backendTimeout, setBackendTimeout] = useState(false);
  const [profileTimeout, setProfileTimeout] = useState(false);

  const isAuthenticated = !!identity;
  const actorInitialized = !!actor && !actorFetching;

  // Step 1: Authentication (supports both Internet Identity and Firebase)
  useEffect(() => {
    if (authInitializing) {
      setProgressStep('auth');
      setProgress(10);
    } else if (isAuthenticated) {
      console.log('[LaunchInit] Authentication complete');
      setIsAuthReady(true);
      setProgressStep('backend');
      setProgress(33);
    }
  }, [authInitializing, isAuthenticated]);

  // Step 2: Backend Connection with enhanced timeout handling
  useEffect(() => {
    if (!isAuthReady) return;

    if (actorInitialized) {
      console.log('[LaunchInit] Backend actor initialized successfully');
      setIsBackendReady(true);
      setProgressStep('profile');
      setProgress(66);
      setBackendTimeout(false);
      return;
    }

    // 15-second timeout for backend connection
    const timeout = setTimeout(() => {
      if (!actorInitialized) {
        console.warn('[LaunchInit] Backend connection timeout');
        setIsError(true);
        setErrorMessage('Backend connection timeout. Please check your network and try again.');
        setBackendTimeout(true);
      }
    }, 15000);

    return () => clearTimeout(timeout);
  }, [isAuthReady, actorInitialized]);

  // Step 3: Profile Loading with timeout
  useEffect(() => {
    if (!isBackendReady) return;

    if (profileFetched) {
      console.log('[LaunchInit] Profile loaded successfully');
      setIsProfileLoaded(true);
      setProgressStep('complete');
      setProgress(100);
      setProfileTimeout(false);
      return;
    }

    if (profileError) {
      console.error('[LaunchInit] Profile loading error:', profileError);
      setIsError(true);
      setErrorMessage('Failed to load user profile. Please try again.');
      setProfileTimeout(true);
      return;
    }

    // 15-second timeout for profile loading
    const timeout = setTimeout(() => {
      if (!profileFetched && !profileError) {
        console.warn('[LaunchInit] Profile loading timeout');
        setIsError(true);
        setErrorMessage('Profile loading timeout. Please try again.');
        setProfileTimeout(true);
      }
    }, 15000);

    return () => clearTimeout(timeout);
  }, [isBackendReady, profileFetched, profileError]);

  // Redirect to Dashboard when complete
  useEffect(() => {
    if (progressStep === 'complete' && isProfileLoaded) {
      console.log('[LaunchInit] Initialization complete, redirecting to dashboard');
      const redirectTimer = setTimeout(() => {
        navigate({ to: '/dashboard' });
      }, 500);
      return () => clearTimeout(redirectTimer);
    }
  }, [progressStep, isProfileLoaded, navigate]);

  // Handle retry
  const handleRetry = () => {
    console.log('[LaunchInit] Retry initiated');
    setIsError(false);
    setErrorMessage('');
    setRetryCount(prev => prev + 1);
    setIsAuthReady(false);
    setIsBackendReady(false);
    setIsProfileLoaded(false);
    setProgressStep('auth');
    setProgress(0);
    setBackendTimeout(false);
    setProfileTimeout(false);
    
    // Reload the page to reset everything
    window.location.reload();
  };

  // Get stage message
  const getStageMessage = () => {
    if (isError) return errorMessage;
    
    switch (progressStep) {
      case 'auth':
        return 'Step 1: Authenticating user...';
      case 'backend':
        return 'Step 2: Connecting to backend...';
      case 'profile':
        return 'Step 3: Loading profile...';
      case 'complete':
        return 'Initialization complete! Redirecting...';
      default:
        return 'Initializing...';
    }
  };

  return (
    <div className="flex h-screen items-center justify-center bg-gradient-to-br from-[#6A5ACD]/5 via-background to-[#EFBF04]/5">
      <div className="text-center space-y-8 max-w-md px-6">
        {/* Logo */}
        <div className="flex justify-center mb-8 animate-in fade-in duration-500">
          <img 
            src="/assets/logo_epiq_e.png" 
            alt="EPIQ Life" 
            className="h-32 w-32 object-contain drop-shadow-lg"
          />
        </div>

        {isError ? (
          <>
            {/* Error State */}
            <div className="flex justify-center animate-in zoom-in duration-300">
              <img 
                src="/assets/generated/connection-error-purple-gold.dim_200x150.png" 
                alt="Connection Error" 
                className="h-40 w-auto object-contain"
              />
            </div>

            <div className="space-y-3 animate-in slide-in-from-bottom duration-500">
              <h2 className="text-2xl font-bold text-foreground">Connection Error</h2>
              <p className="text-muted-foreground leading-relaxed">
                {errorMessage}
              </p>
              {retryCount > 0 && (
                <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                  <div className="h-1.5 w-1.5 rounded-full bg-[#6A5ACD] animate-pulse" />
                  <span>Retry attempt {retryCount}</span>
                </div>
              )}
            </div>

            {/* Retry Button */}
            <div className="animate-in fade-in duration-700">
              <Button 
                onClick={handleRetry}
                size="lg"
                className="gap-2 bg-gradient-to-r from-[#6A5ACD] to-[#EFBF04] hover:from-[#6A5ACD]/90 hover:to-[#EFBF04]/90 shadow-lg text-white"
              >
                <RefreshCw className="h-4 w-4" />
                Retry Connection
              </Button>
            </div>

            {/* Help Text */}
            <div className="pt-6 space-y-3 text-sm text-muted-foreground animate-in fade-in duration-1000">
              <p className="font-medium">Troubleshooting tips:</p>
              <ul className="list-none space-y-2 text-left bg-muted/30 rounded-lg p-4">
                <li className="flex items-start gap-2">
                  <span className="text-[#6A5ACD] mt-0.5">•</span>
                  <span>Check your internet connection</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#6A5ACD] mt-0.5">•</span>
                  <span>Clear your browser cache and cookies</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#6A5ACD] mt-0.5">•</span>
                  <span>Try using a different browser</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#6A5ACD] mt-0.5">•</span>
                  <span>Wait a few minutes and try again</span>
                </li>
              </ul>
            </div>
          </>
        ) : (
          <>
            {/* Loading State */}
            <div className="flex justify-center animate-in zoom-in duration-500">
              <div className="relative">
                <img 
                  src="/assets/generated/loading-spinner-enhanced-purple-gold.dim_64x64.png" 
                  alt="Loading" 
                  className="h-20 w-20 animate-spin"
                />
              </div>
            </div>

            {/* Loading Message */}
            <div className="space-y-4 animate-in slide-in-from-bottom duration-500">
              <h2 className="text-2xl font-bold text-foreground">{getStageMessage()}</h2>
              <p className="text-muted-foreground">
                Please wait while we set up your EPIQ Life experience
              </p>

              {/* Progress Bar */}
              <div className="space-y-2 pt-2">
                <div className="relative h-5 w-full overflow-hidden rounded-full bg-muted">
                  <div 
                    className="absolute inset-0 h-full bg-gradient-to-r from-[#6A5ACD] to-[#EFBF04] transition-all duration-500"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground">{progress}% complete</p>
              </div>
            </div>

            {/* Stage Indicators */}
            <div className="flex justify-center gap-6 pt-4 animate-in fade-in duration-700">
              <StageIndicator 
                label="Step 1: Auth" 
                active={progressStep === 'auth'} 
                completed={isAuthReady} 
              />
              <StageIndicator 
                label="Step 2: Backend" 
                active={progressStep === 'backend'} 
                completed={isBackendReady} 
              />
              <StageIndicator 
                label="Step 3: Profile" 
                active={progressStep === 'profile'} 
                completed={isProfileLoaded} 
              />
            </div>

            {/* Loading Animation Dots */}
            <div className="flex justify-center gap-2 pt-2">
              <div className="h-2 w-2 rounded-full bg-[#6A5ACD] animate-pulse" style={{ animationDelay: '0ms' }} />
              <div className="h-2 w-2 rounded-full bg-[#EFBF04] animate-pulse" style={{ animationDelay: '150ms' }} />
              <div className="h-2 w-2 rounded-full bg-[#6A5ACD] animate-pulse" style={{ animationDelay: '300ms' }} />
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// Stage indicator component
function StageIndicator({ 
  label, 
  active, 
  completed 
}: { 
  label: string; 
  active: boolean; 
  completed: boolean; 
}) {
  return (
    <div className="flex flex-col items-center gap-2">
      <div className={`
        flex items-center justify-center h-12 w-12 rounded-full border-2 transition-all duration-300
        ${completed 
          ? 'bg-gradient-to-br from-[#6A5ACD] to-[#EFBF04] border-[#6A5ACD] text-white shadow-lg' 
          : active 
            ? 'bg-[#6A5ACD]/10 border-[#6A5ACD] text-[#6A5ACD] animate-pulse' 
            : 'bg-muted border-muted-foreground/20 text-muted-foreground'
        }
      `}>
        {completed ? (
          <CheckCircle2 className="h-6 w-6" />
        ) : active ? (
          <Loader2 className="h-6 w-6 animate-spin" />
        ) : (
          <div className="h-2 w-2 rounded-full bg-current" />
        )}
      </div>
      <span className={`
        text-xs font-medium transition-colors duration-300 text-center
        ${completed || active ? 'text-foreground' : 'text-muted-foreground'}
      `}>
        {label}
      </span>
    </div>
  );
}
