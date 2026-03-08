import { useState } from 'react';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useGetCallerUserProfile } from '../hooks/useQueries';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { LogOut, Settings } from 'lucide-react';
import { useTheme } from 'next-themes';
import { Moon, Sun } from 'lucide-react';
import ProfileSettingsDialog from './ProfileSettingsDialog';
import AuthMethodSelector from './AuthMethodSelector';

export default function Header() {
  const { identity, clear, login, isLoggingIn } = useInternetIdentity();
  const { data: userProfile } = useGetCallerUserProfile();
  const queryClient = useQueryClient();
  const { theme, setTheme } = useTheme();
  const [showProfileSettings, setShowProfileSettings] = useState(false);
  const [showAuthSelector, setShowAuthSelector] = useState(false);

  const isAuthenticated = !!identity;

  const handleLogout = async () => {
    await clear();
    queryClient.clear();
  };

  const handleLoginClick = () => {
    setShowAuthSelector(true);
  };

  const handleInternetIdentityLogin = () => {
    setShowAuthSelector(false);
    login();
  };

  const displayName = userProfile?.displayName || userProfile?.name || 'User';
  const initials = displayName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <>
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/assets/logo_epiq_e.png" alt="EPIQ Life" className="h-10 w-10" />
            <span className="text-xl font-bold">EPIQ Life</span>
          </div>

          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="rounded-full"
            >
              <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
              <span className="sr-only">Toggle theme</span>
            </Button>

            {isAuthenticated ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-primary text-primary-foreground">{initials}</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">{displayName}</p>
                      <p className="text-xs leading-none text-muted-foreground">{userProfile?.email}</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setShowProfileSettings(true)}>
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Profile Settings</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button onClick={handleLoginClick} disabled={isLoggingIn} className="rounded-full">
                {isLoggingIn ? 'Connecting...' : 'Login'}
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Auth Method Selector Dialog */}
      {showAuthSelector && !isAuthenticated && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-background rounded-lg shadow-lg max-w-5xl w-full p-8 space-y-6 animate-in fade-in slide-in-from-bottom duration-300">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Choose Authentication Method</h2>
              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => setShowAuthSelector(false)}
                className="rounded-full"
              >
                ✕
              </Button>
            </div>
            <AuthMethodSelector 
              onSelectInternetIdentity={handleInternetIdentityLogin}
              isLoggingIn={isLoggingIn}
            />
          </div>
        </div>
      )}

      <ProfileSettingsDialog open={showProfileSettings} onOpenChange={setShowProfileSettings} />
    </>
  );
}
