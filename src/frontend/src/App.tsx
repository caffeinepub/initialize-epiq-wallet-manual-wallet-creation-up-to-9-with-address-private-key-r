import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { InternetIdentityProvider } from './hooks/useInternetIdentity';
import { ThemeProvider } from 'next-themes';
import { Toaster } from '@/components/ui/sonner';
import Header from './components/Header';
import Footer from './components/Footer';
import LandingPage from './pages/LandingPage';
import Dashboard from './pages/Dashboard';
import ProfileSetup from './pages/ProfileSetup';
import LaunchInitialization from './pages/LaunchInitialization';
import { useActor } from './hooks/useActor';
import { useInternetIdentity } from './hooks/useInternetIdentity';
import { useGetCallerUserProfile } from './hooks/useQueries';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 3,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 5000),
    },
  },
});

function AppContent() {
  const { identity, isInitializing: authInitializing } = useInternetIdentity();
  const { actor, isFetching: actorFetching } = useActor();
  const { 
    data: userProfile, 
    isFetched: profileFetched,
  } = useGetCallerUserProfile();

  const isAuthenticated = !!identity;
  const actorInitialized = !!actor && !actorFetching;

  // Show landing page for unauthenticated users
  if (!authInitializing && !isAuthenticated) {
    return (
      <>
        <Header />
        <main className="min-h-[calc(100vh-8rem)]">
          <LandingPage />
        </main>
        <Footer />
      </>
    );
  }

  // Show initialization screen while authenticating or initializing backend
  if (authInitializing || (isAuthenticated && !actorInitialized) || (actorInitialized && !profileFetched)) {
    return <LaunchInitialization />;
  }

  // Authenticated and ready - check if profile setup is needed
  const showProfileSetup = profileFetched && userProfile === null;

  return (
    <>
      {!showProfileSetup && <Header />}
      <main className={showProfileSetup ? '' : 'min-h-[calc(100vh-8rem)]'}>
        {showProfileSetup ? <ProfileSetup /> : <Dashboard />}
      </main>
      {!showProfileSetup && <Footer />}
    </>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <InternetIdentityProvider>
          <AppContent />
          <Toaster />
        </InternetIdentityProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
