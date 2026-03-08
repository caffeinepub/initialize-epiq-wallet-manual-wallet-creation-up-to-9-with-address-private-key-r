import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Wallet, MessageSquare, Trophy, Shield, Zap, Users } from 'lucide-react';
import AuthMethodSelector from '../components/AuthMethodSelector';
import { useInternetIdentity } from '../hooks/useInternetIdentity';

export default function LandingPage() {
  const { login, isLoggingIn } = useInternetIdentity();
  const [showAuthSelector, setShowAuthSelector] = useState(false);

  const handleGetStarted = () => {
    setShowAuthSelector(true);
  };

  const handleInternetIdentityLogin = () => {
    login();
  };

  return (
    <div className="container py-12 md:py-24">
      {/* Hero Section */}
      <section className="text-center space-y-8 mb-20">
        <div className="flex justify-center mb-8">
          <img 
            src="/assets/logo_epiq_e.png" 
            alt="EPIQ Life" 
            className="h-40 w-40 object-contain"
          />
        </div>
        <div className="space-y-4">
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
            Welcome to <span className="text-primary">EPIQ Life</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Your gateway to Web3, decentralized finance, and sovereign living. Join a community of pioneers building
            the future.
          </p>
        </div>
        <div className="flex justify-center">
          <img
            src="/assets/generated/hero-web3-purple.dim_800x400.png"
            alt="Web3 Hero"
            className="rounded-2xl shadow-2xl max-w-3xl w-full"
          />
        </div>

        {!showAuthSelector ? (
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button 
              size="lg" 
              onClick={handleGetStarted}
              className="rounded-full px-8 text-lg h-12"
            >
              Get Started
            </Button>
          </div>
        ) : (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom duration-500">
            <h2 className="text-2xl font-semibold">Choose Your Authentication Method</h2>
            <AuthMethodSelector 
              onSelectInternetIdentity={handleInternetIdentityLogin}
              isLoggingIn={isLoggingIn}
            />
          </div>
        )}

        {!showAuthSelector && (
          <p className="text-sm text-muted-foreground">
            Secure authentication with Internet Identity or EPIQ Shield
          </p>
        )}
      </section>

      {/* Features Section */}
      <section className="space-y-12">
        <div className="text-center space-y-4">
          <h2 className="text-3xl md:text-4xl font-bold">Everything You Need</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            EPIQ Life combines powerful Web3 tools with educational resources to help you thrive in the decentralized
            world.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card className="border-2 hover:border-primary transition-colors">
            <CardHeader>
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <Wallet className="h-6 w-6 text-primary" />
              </div>
              <CardTitle>EPIQ Wallet</CardTitle>
              <CardDescription>
                Secure, on-chain wallet for managing your crypto assets and peer-to-peer transfers.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-2 hover:border-primary transition-colors">
            <CardHeader>
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <MessageSquare className="h-6 w-6 text-primary" />
              </div>
              <CardTitle>Secure Messaging</CardTitle>
              <CardDescription>
                Private, encrypted messaging with other community members. Your conversations, your control.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-2 hover:border-primary transition-colors">
            <CardHeader>
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <Trophy className="h-6 w-6 text-primary" />
              </div>
              <CardTitle>EPIQ Quest</CardTitle>
              <CardDescription>
                Gamified learning paths for Web3, AI, trust law, and sovereign living fundamentals.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-2 hover:border-primary transition-colors">
            <CardHeader>
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <Shield className="h-6 w-6 text-primary" />
              </div>
              <CardTitle>Dual Authentication</CardTitle>
              <CardDescription>
                Choose between Internet Identity or EPIQ Shield for secure and flexible authentication.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-2 hover:border-primary transition-colors">
            <CardHeader>
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <Zap className="h-6 w-6 text-primary" />
              </div>
              <CardTitle>Lightning Fast</CardTitle>
              <CardDescription>
                Built on the Internet Computer for instant transactions and seamless user experience.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-2 hover:border-primary transition-colors">
            <CardHeader>
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <CardTitle>Community Driven</CardTitle>
              <CardDescription>
                Join a thriving community of like-minded individuals on the path to sovereignty.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </section>

      {/* CTA Section */}
      <section className="mt-20 text-center space-y-6 py-12 rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5">
        <h2 className="text-3xl md:text-4xl font-bold">Ready to Begin Your Journey?</h2>
        <p className="text-muted-foreground max-w-xl mx-auto">
          Join EPIQ Life today and start your path to Web3 mastery and sovereign living.
        </p>
        {!showAuthSelector && (
          <Button 
            size="lg" 
            onClick={handleGetStarted}
            className="rounded-full px-8 text-lg h-12"
          >
            Join EPIQ Life
          </Button>
        )}
      </section>
    </div>
  );
}
