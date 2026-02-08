import { useState } from 'react';
import { useListWallets, useCreateWallet } from '../hooks/useQueries';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Wallet, Plus, Copy, CheckCircle, AlertCircle, Loader2, ShieldAlert } from 'lucide-react';
import { toast } from 'sonner';
import { isValidEvmAddress } from '../utils/evmAddress';
import type { Chain } from '../backend';

export default function EpiqWalletsPanel() {
  const { data: wallets = [], isLoading, error, refetch } = useListWallets();
  const createWallet = useCreateWallet();
  
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [newWalletData, setNewWalletData] = useState<{
    address: string;
    privateKey: string;
    seedPhrase: string;
    chain: Chain;
  } | null>(null);
  const [hasAcknowledged, setHasAcknowledged] = useState(false);

  const handleCreateWallet = async () => {
    try {
      const result = await createWallet.mutateAsync(null);
      
      // Validate the address format
      if (!isValidEvmAddress(result.address)) {
        console.error('Invalid EVM address format received:', result.address);
        toast.error('Invalid wallet address format received from backend');
        return;
      }
      
      // Extract credentials from backend response
      const address = result.address;
      const privateKey = result.privateKey ?? '';
      const seedPhrase = result.recoveryPhrase ?? '';
      const chain = result.chain;
      
      setNewWalletData({
        address,
        privateKey,
        seedPhrase,
        chain,
      });
      
      setShowCreateDialog(false);
      setShowSuccessDialog(true);
      setHasAcknowledged(false);
    } catch (error: any) {
      console.error('Error creating wallet:', error);
      
      let errorMessage = 'Failed to create wallet. Please try again.';
      
      if (error?.message?.includes('maximum allowed wallets')) {
        errorMessage = 'Wallet limit reached (9). You cannot create more wallets.';
      } else if (error?.message?.includes('Unauthorized')) {
        errorMessage = 'Please log in again to create a wallet.';
      } else if (error?.message?.includes('timed out')) {
        errorMessage = 'Backend is still starting—try again in a moment.';
      }
      
      toast.error(errorMessage);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard`);
  };

  const handleDismissSuccess = () => {
    if (!hasAcknowledged) {
      toast.error('Please confirm you have stored your credentials before continuing');
      return;
    }
    setShowSuccessDialog(false);
    setNewWalletData(null);
    setHasAcknowledged(false);
    refetch();
  };

  const formatDate = (timestamp: bigint) => {
    const date = new Date(Number(timestamp) / 1000000);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  const getChainBadge = (chain: Chain) => {
    const chainLabels: Record<Chain, string> = {
      evm: 'EVM',
      btc: 'Bitcoin',
      icp: 'ICP',
      custom: 'Custom',
    };
    return chainLabels[chain] || 'Unknown';
  };

  if (isLoading) {
    return (
      <Card className="border-2 border-primary/20">
        <CardContent className="py-12">
          <div className="text-center space-y-4">
            <Loader2 className="h-12 w-12 mx-auto text-primary animate-spin" />
            <div>
              <h3 className="text-lg font-semibold">Loading EPIQ Wallets</h3>
              <p className="text-sm text-muted-foreground">Fetching your wallet information...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive" className="border-destructive/50 bg-destructive/10">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription className="flex items-center justify-between">
          <div>
            <p className="font-semibold">Failed to load EPIQ wallets</p>
            <p className="text-sm mt-1">
              {error instanceof Error ? error.message : 'An unknown error occurred'}
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            className="ml-4 bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 text-white border-0"
          >
            Retry
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <>
      <Card className="border-2 border-primary/20">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Wallet className="h-5 w-5 text-primary" />
                EPIQ Wallets
              </CardTitle>
              <CardDescription>
                Manage your EPIQ wallet addresses ({wallets.length}/9)
              </CardDescription>
            </div>
            {wallets.length < 9 && (
              <Button
                onClick={() => setShowCreateDialog(true)}
                className="bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Wallet
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {wallets.length === 0 ? (
            <div className="text-center py-12 space-y-4">
              <div className="flex justify-center">
                <div className="rounded-full bg-primary/10 p-6">
                  <Wallet className="h-12 w-12 text-primary" />
                </div>
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-2">No EPIQ Wallets Yet</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Create your first EPIQ wallet to start managing your digital assets securely.
                </p>
                <Button
                  onClick={() => setShowCreateDialog(true)}
                  className="bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create Your First Wallet
                </Button>
              </div>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Wallet ID</TableHead>
                    <TableHead>Chain</TableHead>
                    <TableHead>Public Address</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {wallets.map((wallet) => (
                    <TableRow key={Number(wallet.walletId)}>
                      <TableCell>
                        <Badge variant="outline" className="font-mono">
                          #{Number(wallet.walletId)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="font-medium">
                          {getChainBadge(wallet.chain)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <code className="text-xs bg-muted px-2 py-1 rounded">
                            {wallet.publicAddress}
                          </code>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyToClipboard(wallet.publicAddress, 'Address')}
                            className="h-6 w-6 p-0"
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDate(wallet.createdAt)}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Active
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Wallet Confirmation Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShieldAlert className="h-5 w-5 text-primary" />
              Create New EPIQ Wallet
            </DialogTitle>
            <DialogDescription className="space-y-3 pt-2">
              <p>You are about to create a new EPIQ wallet.</p>
              <Alert className="border-amber-500 bg-amber-50">
                <AlertCircle className="h-4 w-4 text-amber-600" />
                <AlertDescription className="text-amber-800 text-sm">
                  <strong>Important:</strong> After creation, you will see your private key and recovery phrase <strong>only once</strong>. 
                  Make sure to store them safely before continuing.
                </AlertDescription>
              </Alert>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setShowCreateDialog(false)}
              disabled={createWallet.isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateWallet}
              disabled={createWallet.isPending}
              className="bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90"
            >
              {createWallet.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Wallet
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Success Dialog with Credentials */}
      <Dialog open={showSuccessDialog} onOpenChange={(open) => !open && handleDismissSuccess()}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-green-600">
              <CheckCircle className="h-6 w-6" />
              Wallet Created Successfully
            </DialogTitle>
            <DialogDescription>
              <Alert variant="destructive" className="mt-4 border-red-500 bg-red-50">
                <ShieldAlert className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-800">
                  <strong>⚠️ CRITICAL: Save these credentials now!</strong>
                  <br />
                  This is the <strong>only time</strong> you will see your private key and recovery phrase. 
                  If you lose them, you will permanently lose access to this wallet.
                </AlertDescription>
              </Alert>
            </DialogDescription>
          </DialogHeader>

          {newWalletData && (
            <div className="space-y-4 py-4">
              {/* Chain Badge */}
              <div className="flex items-center gap-2">
                <label className="text-sm font-semibold text-foreground">Chain:</label>
                <Badge variant="secondary" className="font-medium">
                  {getChainBadge(newWalletData.chain)}
                </Badge>
              </div>

              {/* Public Address */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-foreground">Public Address</label>
                <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                  <code className="flex-1 text-xs break-all">{newWalletData.address}</code>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(newWalletData.address, 'Address')}
                    className="shrink-0"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Private Key */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-red-600">Private Key (Keep Secret!)</label>
                <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <code className="flex-1 text-xs break-all text-red-900">{newWalletData.privateKey}</code>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(newWalletData.privateKey, 'Private Key')}
                    className="shrink-0 hover:bg-red-100"
                  >
                    <Copy className="h-4 w-4 text-red-600" />
                  </Button>
                </div>
              </div>

              {/* Seed Phrase */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-red-600">Recovery Phrase (Keep Secret!)</label>
                <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <code className="flex-1 text-xs break-all text-red-900">{newWalletData.seedPhrase}</code>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(newWalletData.seedPhrase, 'Recovery Phrase')}
                    className="shrink-0 hover:bg-red-100"
                  >
                    <Copy className="h-4 w-4 text-red-600" />
                  </Button>
                </div>
              </div>

              {/* Acknowledgment */}
              <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                <Checkbox
                  id="acknowledge"
                  checked={hasAcknowledged}
                  onCheckedChange={(checked) => setHasAcknowledged(checked === true)}
                  className="mt-1"
                />
                <label
                  htmlFor="acknowledge"
                  className="text-sm text-amber-900 cursor-pointer leading-relaxed"
                >
                  <strong>I confirm that I have securely stored my private key and recovery phrase.</strong>
                  <br />
                  I understand that I will not be able to retrieve them again, and losing them means permanent loss of access to this wallet.
                </label>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              onClick={handleDismissSuccess}
              disabled={!hasAcknowledged}
              className="w-full bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90"
            >
              I Have Saved My Credentials
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
