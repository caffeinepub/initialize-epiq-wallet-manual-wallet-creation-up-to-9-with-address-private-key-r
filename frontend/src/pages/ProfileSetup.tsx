import { useState } from 'react';
import { useSaveCallerUserProfile } from '../hooks/useQueries';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CheckCircle2, User, Mail, UserCircle, Briefcase } from 'lucide-react';

const MEMBER_TYPES = [
  'Sovereign Individual',
  'Trust Creator',
  'Web3 Pioneer',
  'AI Enthusiast',
  'Privacy Advocate',
  'Community Builder',
];

export default function ProfileSetup() {
  const [name, setName] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [memberType, setMemberType] = useState('');
  const [icpWalletAddress, setIcpWalletAddress] = useState('');
  const { mutate: saveProfile, isPending } = useSaveCallerUserProfile();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !memberType) return;

    saveProfile({
      name,
      displayName: displayName || name,
      email,
      memberType,
      icpWalletAddress: icpWalletAddress || '',
      ethWalletAddress: '',
      btcWalletAddress: '',
      importedFromFirebase: false,
    });
  };

  const isFormValid = name && email && memberType;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-secondary/5 p-4">
      <div className="w-full max-w-2xl space-y-6 animate-in fade-in slide-in-from-bottom duration-500">
        {/* Logo and Welcome Header */}
        <div className="text-center space-y-4">
          <div className="flex justify-center mb-4">
            <img 
              src="/assets/logo_epiq_e.png" 
              alt="EPIQ Life" 
              className="h-24 w-24 object-contain drop-shadow-lg"
            />
          </div>
          <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
            Welcome to EPIQ Life
          </h1>
          <p className="text-muted-foreground text-lg">
            Let's set up your profile to get started on your Web3 journey
          </p>
        </div>

        {/* Profile Setup Form Card */}
        <Card className="border-primary/20 shadow-xl">
          <CardHeader className="space-y-1 pb-6">
            <CardTitle className="text-2xl flex items-center gap-2">
              <UserCircle className="h-6 w-6 text-primary" />
              Create Your Profile
            </CardTitle>
            <CardDescription>
              Complete your profile information to access all EPIQ Life features
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Full Name */}
              <div className="space-y-2">
                <Label htmlFor="name" className="flex items-center gap-2">
                  <User className="h-4 w-4 text-primary" />
                  Full Name *
                </Label>
                <Input
                  id="name"
                  placeholder="Enter your full name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="h-11"
                />
                <p className="text-xs text-muted-foreground">
                  Your legal or registered name
                </p>
              </div>

              {/* Display Name */}
              <div className="space-y-2">
                <Label htmlFor="displayName" className="flex items-center gap-2">
                  <UserCircle className="h-4 w-4 text-primary" />
                  Display Name
                </Label>
                <Input
                  id="displayName"
                  placeholder="Enter your display name (optional)"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  maxLength={50}
                  className="h-11"
                />
                <p className="text-xs text-muted-foreground">
                  This is how others will see you. Leave blank to use your full name.
                </p>
              </div>

              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email" className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-primary" />
                  Email Address *
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your.email@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="h-11"
                />
                <p className="text-xs text-muted-foreground">
                  We'll use this to send you important updates
                </p>
              </div>

              {/* Member Type */}
              <div className="space-y-2">
                <Label htmlFor="memberType" className="flex items-center gap-2">
                  <Briefcase className="h-4 w-4 text-primary" />
                  Member Type *
                </Label>
                <Select value={memberType} onValueChange={setMemberType} required>
                  <SelectTrigger id="memberType" className="h-11">
                    <SelectValue placeholder="Select your path" />
                  </SelectTrigger>
                  <SelectContent>
                    {MEMBER_TYPES.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Choose the category that best describes your interest
                </p>
              </div>

              {/* ICP Wallet Address (Optional) */}
              <div className="space-y-2">
                <Label htmlFor="icpWallet" className="flex items-center gap-2">
                  <img 
                    src="/assets/generated/wallet-icon.dim_64x64.png" 
                    alt="Wallet" 
                    className="h-4 w-4"
                  />
                  ICP Wallet Address (Optional)
                </Label>
                <Input
                  id="icpWallet"
                  placeholder="Enter your ICP wallet address"
                  value={icpWalletAddress}
                  onChange={(e) => setIcpWalletAddress(e.target.value)}
                  className="h-11 font-mono text-sm"
                />
                <p className="text-xs text-muted-foreground">
                  You can add this later in your profile settings
                </p>
              </div>

              {/* Submit Button */}
              <div className="pt-4">
                <Button 
                  type="submit" 
                  className="w-full h-12 text-base bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg"
                  disabled={isPending || !isFormValid}
                >
                  {isPending ? (
                    <>
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent mr-2" />
                      Creating Profile...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="h-5 w-5 mr-2" />
                      Continue to Dashboard
                    </>
                  )}
                </Button>
              </div>

              {/* Required Fields Note */}
              <p className="text-xs text-center text-muted-foreground pt-2">
                * Required fields
              </p>
            </form>
          </CardContent>
        </Card>

        {/* Benefits Preview */}
        <div className="grid gap-4 md:grid-cols-3 pt-4">
          <Card className="border-primary/10 bg-primary/5">
            <CardContent className="pt-6 text-center space-y-2">
              <div className="flex justify-center">
                <img 
                  src="/assets/generated/quest-badge-purple-transparent.dim_64x64.png" 
                  alt="Quest" 
                  className="h-12 w-12"
                />
              </div>
              <h3 className="font-semibold">Learn & Earn</h3>
              <p className="text-xs text-muted-foreground">
                Complete quests and earn EPC rewards
              </p>
            </CardContent>
          </Card>

          <Card className="border-primary/10 bg-primary/5">
            <CardContent className="pt-6 text-center space-y-2">
              <div className="flex justify-center">
                <img 
                  src="/assets/generated/wallet-icon.dim_64x64.png" 
                  alt="Wallet" 
                  className="h-12 w-12"
                />
              </div>
              <h3 className="font-semibold">Multi-Chain Wallet</h3>
              <p className="text-xs text-muted-foreground">
                Manage ICP, ETH, and BTC in one place
              </p>
            </CardContent>
          </Card>

          <Card className="border-primary/10 bg-primary/5">
            <CardContent className="pt-6 text-center space-y-2">
              <div className="flex justify-center">
                <img 
                  src="/assets/generated/message-icon.dim_64x64.png" 
                  alt="Community" 
                  className="h-12 w-12"
                />
              </div>
              <h3 className="font-semibold">Community</h3>
              <p className="text-xs text-muted-foreground">
                Connect with Web3 pioneers
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
