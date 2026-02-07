import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Shield, Key } from 'lucide-react';
import FirebaseAuthDialog from './FirebaseAuthDialog';

export type AuthMethod = 'internet-identity' | 'firebase' | null;

interface AuthMethodSelectorProps {
  onSelectInternetIdentity: () => void;
  isLoggingIn: boolean;
}

export default function AuthMethodSelector({ onSelectInternetIdentity, isLoggingIn }: AuthMethodSelectorProps) {
  const [showFirebaseDialog, setShowFirebaseDialog] = useState(false);

  return (
    <>
      <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
        {/* Internet Identity Option */}
        <Card className="border-2 hover:border-primary transition-all duration-300 hover:shadow-lg cursor-pointer group">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="h-20 w-20 rounded-full bg-gradient-to-br from-[#6A5ACD] to-[#EFBF04] flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <Shield className="h-10 w-10 text-white" />
              </div>
            </div>
            <CardTitle className="text-2xl">Internet Identity</CardTitle>
            <CardDescription className="text-base">
              Secure, decentralized authentication powered by the Internet Computer
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="text-[#6A5ACD] mt-0.5">✓</span>
                <span>No passwords to remember</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#6A5ACD] mt-0.5">✓</span>
                <span>Fully decentralized and private</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#6A5ACD] mt-0.5">✓</span>
                <span>Biometric authentication support</span>
              </li>
            </ul>
            <Button 
              onClick={onSelectInternetIdentity}
              disabled={isLoggingIn}
              className="w-full bg-gradient-to-r from-[#6A5ACD] to-[#EFBF04] hover:from-[#6A5ACD]/90 hover:to-[#EFBF04]/90"
              size="lg"
            >
              {isLoggingIn ? 'Connecting...' : 'Continue with Internet Identity'}
            </Button>
          </CardContent>
        </Card>

        {/* EPIQ Shield Firebase Option */}
        <Card className="border-2 hover:border-primary transition-all duration-300 hover:shadow-lg cursor-pointer group">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="h-20 w-20 rounded-full bg-gradient-to-br from-[#EFBF04] to-[#6A5ACD] flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <Key className="h-10 w-10 text-white" />
              </div>
            </div>
            <CardTitle className="text-2xl">EPIQ Shield</CardTitle>
            <CardDescription className="text-base">
              Traditional authentication with your EPIQ ID and password
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="text-[#EFBF04] mt-0.5">✓</span>
                <span>Use your existing EPIQ ID</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#EFBF04] mt-0.5">✓</span>
                <span>Familiar username/password login</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#EFBF04] mt-0.5">✓</span>
                <span>Synced with EPIQ Shield backend</span>
              </li>
            </ul>
            <Button 
              onClick={() => setShowFirebaseDialog(true)}
              variant="outline"
              className="w-full border-2 border-[#EFBF04] hover:bg-[#EFBF04]/10"
              size="lg"
            >
              Continue with EPIQ Shield
            </Button>
          </CardContent>
        </Card>
      </div>

      <FirebaseAuthDialog 
        open={showFirebaseDialog} 
        onOpenChange={setShowFirebaseDialog}
      />
    </>
  );
}
