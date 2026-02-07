import { useState } from 'react';
import { useSaveCallerUserProfile } from '../hooks/useQueries';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const MEMBER_TYPES = [
  'Sovereign Individual',
  'Trust Creator',
  'Web3 Pioneer',
  'AI Enthusiast',
  'Privacy Advocate',
  'Community Builder',
];

export default function ProfileSetupModal() {
  const [name, setName] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [memberType, setMemberType] = useState('');
  const { mutate: saveProfile, isPending } = useSaveCallerUserProfile();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !memberType) return;

    saveProfile({
      name,
      displayName: displayName || name,
      email,
      memberType,
      icpWalletAddress: '',
      ethWalletAddress: '',
      btcWalletAddress: '',
      importedFromFirebase: false,
    });
  };

  return (
    <Dialog open={true}>
      <DialogContent className="sm:max-w-[500px]" onInteractOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="text-2xl">Welcome to EPIQ Life</DialogTitle>
          <DialogDescription>
            Let's set up your profile to get started on your Web3 journey.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6 pt-4">
          <div className="space-y-2">
            <Label htmlFor="name">Full Name</Label>
            <Input
              id="name"
              placeholder="Enter your full name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="displayName">Display Name</Label>
            <Input
              id="displayName"
              placeholder="Enter your display name (optional)"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              maxLength={50}
            />
            <p className="text-xs text-muted-foreground">
              This is how others will see you. Leave blank to use your full name.
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="your.email@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="memberType">Member Type</Label>
            <Select value={memberType} onValueChange={setMemberType} required>
              <SelectTrigger id="memberType">
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
          </div>
          <Button type="submit" className="w-full" disabled={isPending || !name || !email || !memberType}>
            {isPending ? 'Creating Profile...' : 'Continue'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
