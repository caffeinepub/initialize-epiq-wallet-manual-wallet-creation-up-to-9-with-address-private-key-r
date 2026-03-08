import { Button } from '@/components/ui/button';
import { AlertCircle, RefreshCw, CheckCircle2, Loader2 } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

interface LoadingScreenProps {
  message: string;
  error?: boolean;
  onRetry?: () => void;
  retryCount?: number;
  maxRetries?: number;
  progress?: number;
  stage?: 'auth' | 'backend' | 'profile' | 'ready';
}

export default function LoadingScreen({ 
  message, 
  error = false, 
  onRetry, 
  retryCount = 0,
  maxRetries = 3,
  progress = 0,
  stage = 'auth'
}: LoadingScreenProps) {
  const isMaxRetriesReached = retryCount >= maxRetries;

  return (
    <div className="flex h-screen items-center justify-center bg-gradient-to-br from-background via-background to-primary/5">
      <div className="text-center space-y-8 max-w-md px-6">
        {/* Logo */}
        <div className="flex justify-center mb-8 animate-in fade-in duration-500">
          <img 
            src="/assets/logo_epiq_e.png" 
            alt="EPIQ Life" 
            className="h-32 w-32 object-contain drop-shadow-lg"
          />
        </div>

        {error ? (
          <>
            {/* Error Icon */}
            <div className="flex justify-center animate-in zoom-in duration-300">
              <div className="rounded-full bg-gradient-to-br from-destructive/20 to-destructive/10 p-6 shadow-lg">
                <AlertCircle className="h-16 w-16 text-destructive" />
              </div>
            </div>

            {/* Error Message */}
            <div className="space-y-3 animate-in slide-in-from-bottom duration-500">
              <h2 className="text-2xl font-bold text-foreground">{message}</h2>
              <p className="text-muted-foreground leading-relaxed">
                {isMaxRetriesReached 
                  ? "We've tried multiple times but couldn't establish a connection. Please reload the page to try again."
                  : "We're having trouble connecting to the backend. This might be due to network issues or temporary service unavailability."
                }
              </p>
              {retryCount > 0 && !isMaxRetriesReached && (
                <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                  <div className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                  <span>Retry attempt {retryCount} of {maxRetries}</span>
                </div>
              )}
            </div>

            {/* Retry Button */}
            {onRetry && (
              <div className="animate-in fade-in duration-700">
                <Button 
                  onClick={onRetry}
                  size="lg"
                  className="gap-2 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg"
                >
                  <RefreshCw className="h-4 w-4" />
                  {isMaxRetriesReached ? 'Reload Page' : 'Retry Connection'}
                </Button>
              </div>
            )}

            {/* Help Text */}
            <div className="pt-6 space-y-3 text-sm text-muted-foreground animate-in fade-in duration-1000">
              <p className="font-medium">Troubleshooting tips:</p>
              <ul className="list-none space-y-2 text-left bg-muted/30 rounded-lg p-4">
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-0.5">•</span>
                  <span>Check your internet connection</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-0.5">•</span>
                  <span>Clear your browser cache and cookies</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-0.5">•</span>
                  <span>Try using a different browser</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-0.5">•</span>
                  <span>Wait a few minutes and try again</span>
                </li>
              </ul>
            </div>
          </>
        ) : (
          <>
            {/* Loading Spinner with enhanced animation */}
            <div className="flex justify-center animate-in zoom-in duration-500">
              <div className="relative">
                <div className="h-20 w-20 animate-spin rounded-full border-4 border-primary/20 border-t-primary shadow-lg" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary/20 to-secondary/20 animate-pulse" />
                </div>
              </div>
            </div>

            {/* Loading Message */}
            <div className="space-y-4 animate-in slide-in-from-bottom duration-500">
              <h2 className="text-2xl font-bold text-foreground">{message}</h2>
              <p className="text-muted-foreground">
                Please wait while we set up your experience
              </p>

              {/* Progress Bar */}
              {progress > 0 && (
                <div className="space-y-2 pt-2">
                  <Progress value={progress} className="h-2" />
                  <p className="text-xs text-muted-foreground">{progress}% complete</p>
                </div>
              )}
            </div>

            {/* Stage Indicators */}
            <div className="flex justify-center gap-4 pt-4 animate-in fade-in duration-700">
              <StageIndicator 
                label="Auth" 
                active={stage === 'auth'} 
                completed={stage !== 'auth'} 
              />
              <StageIndicator 
                label="Backend" 
                active={stage === 'backend'} 
                completed={stage === 'profile' || stage === 'ready'} 
              />
              <StageIndicator 
                label="Profile" 
                active={stage === 'profile'} 
                completed={stage === 'ready'} 
              />
            </div>

            {/* Loading Progress Dots */}
            <div className="flex justify-center gap-2 pt-2">
              <div className="h-2 w-2 rounded-full bg-primary animate-pulse" style={{ animationDelay: '0ms' }} />
              <div className="h-2 w-2 rounded-full bg-primary animate-pulse" style={{ animationDelay: '150ms' }} />
              <div className="h-2 w-2 rounded-full bg-primary animate-pulse" style={{ animationDelay: '300ms' }} />
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
        flex items-center justify-center h-10 w-10 rounded-full border-2 transition-all duration-300
        ${completed 
          ? 'bg-primary border-primary text-primary-foreground' 
          : active 
            ? 'bg-primary/10 border-primary text-primary animate-pulse' 
            : 'bg-muted border-muted-foreground/20 text-muted-foreground'
        }
      `}>
        {completed ? (
          <CheckCircle2 className="h-5 w-5" />
        ) : active ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : (
          <div className="h-2 w-2 rounded-full bg-current" />
        )}
      </div>
      <span className={`
        text-xs font-medium transition-colors duration-300
        ${completed || active ? 'text-foreground' : 'text-muted-foreground'}
      `}>
        {label}
      </span>
    </div>
  );
}
