import { useState, useEffect } from 'react';
import { useGetUserTransactions, useCreateTransaction, useGetCallerUserProfile } from '../hooks/useQueries';
import { useActor } from '../hooks/useActor';
import { useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Wallet, Send, Copy, AlertCircle, Loader2, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import EpiqWalletsPanel from './EpiqWalletsPanel';
import { normalizeEvmAddress, isValidEvmAddress } from '../utils/evmAddress';
import { Principal } from '@icp-sdk/core/principal';

export default function WalletTab() {
  const { actor, isFetching: actorFetching } = useActor();
  const { data: profile, isLoading: profileLoading, error: profileError, refetch: refetchProfile } = useGetCallerUserProfile();
  const { data: transactions = [], isLoading: transactionsLoading, error: transactionsError, refetch: refetchTransactions } = useGetUserTransactions();
  const createTransaction = useCreateTransaction();
  const queryClient = useQueryClient();

  const [sendDialogOpen, setSendDialogOpen] = useState(false);
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState('ICP');

  const [ethBalance, setEthBalance] = useState<string | null>(null);
  const [btcBalance, setBtcBalance] = useState<string | null>(null);
  const [icpBalance, setIcpBalance] = useState<string | null>(null);

  const [loadingBalances, setLoadingBalances] = useState(false);
  const [balanceError, setBalanceError] = useState<string | null>(null);

  const backendReady = !!actor && !actorFetching;

  useEffect(() => {
    if (backendReady && profile) {
      fetchBalances();
    }
  }, [backendReady, profile]);

  const fetchBalances = async () => {
    if (!actor || !profile) return;

    setLoadingBalances(true);
    setBalanceError(null);

    try {
      if (profile.ethWalletAddress) {
        const ethBal = await actor.getEthBalance(profile.ethWalletAddress);
        setEthBalance(ethBal);
      }
      if (profile.btcWalletAddress) {
        const btcBal = await actor.getBtcBalance(profile.btcWalletAddress);
        setBtcBalance(btcBal);
      }
      if (profile.icpWalletAddress) {
        const icpBal = await actor.getIcpBalance(profile.icpWalletAddress);
        setIcpBalance(icpBal);
      }
    } catch (error) {
      console.error('Error fetching balances:', error);
      setBalanceError('Failed to fetch balances');
    } finally {
      setLoadingBalances(false);
    }
  };

  const handleSendCrypto = async () => {
    if (!recipient || !amount) {
      toast.error('Please fill in all fields');
      return;
    }

    try {
      // Convert recipient string to Principal
      const recipientPrincipal = Principal.fromText(recipient);
      
      await createTransaction.mutateAsync({
        to: recipientPrincipal,
        amount: BigInt(amount),
        currency,
      });

      toast.success('Transaction created successfully');
      setSendDialogOpen(false);
      setRecipient('');
      setAmount('');
      queryClient.invalidateQueries({ queryKey: ['userTransactions'] });
    } catch (error) {
      console.error('Error creating transaction:', error);
      toast.error('Failed to create transaction. Please check the recipient address.');
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard`);
  };

  const formatDate = (timestamp: bigint) => {
    const date = new Date(Number(timestamp) / 1000000);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  const handleRetry = () => {
    if (profileError) {
      refetchProfile();
    }
    if (transactionsError) {
      refetchTransactions();
    }
  };

  // Normalize and validate ETH address for display
  const getDisplayEthAddress = () => {
    if (!profile?.ethWalletAddress) return { address: '', isValid: false, isEmpty: true };
    
    const normalized = normalizeEvmAddress(profile.ethWalletAddress);
    if (!isValidEvmAddress(normalized)) {
      return { address: '', isValid: false, isEmpty: false };
    }
    return { address: normalized, isValid: true, isEmpty: false };
  };

  if (actorFetching || profileLoading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="py-12">
            <div className="text-center space-y-4">
              <Loader2 className="h-12 w-12 mx-auto text-primary animate-spin" />
              <div>
                <h3 className="text-lg font-semibold">Loading Wallet</h3>
                <p className="text-sm text-muted-foreground">Connecting to backend...</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!actor || profileError) {
    return (
      <div className="space-y-6">
        <Alert variant="destructive" className="border-destructive/50 bg-destructive/10">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <div>
              <p className="font-semibold">Failed to load wallet data</p>
              <p className="text-sm mt-1">
                {!actor ? 'Backend connection failed' : 'Failed to load profile'}
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRetry}
              className="ml-4 bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 text-white border-0"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const { address: ethAddress, isValid: ethAddressValid, isEmpty: ethAddressEmpty } = getDisplayEthAddress();

  return (
    <div className="space-y-6">
      {/* Wallet Balances */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-2 border-primary/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Ethereum Balance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loadingBalances ? (
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              ) : balanceError ? (
                <span className="text-sm text-destructive">Error</span>
              ) : (
                ethBalance || '0 ETH'
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 border-primary/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Bitcoin Balance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loadingBalances ? (
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              ) : balanceError ? (
                <span className="text-sm text-destructive">Error</span>
              ) : (
                btcBalance || '0 BTC'
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 border-primary/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">ICP Balance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loadingBalances ? (
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              ) : balanceError ? (
                <span className="text-sm text-destructive">Error</span>
              ) : (
                icpBalance || '0 ICP'
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* EPIQ Wallets Panel */}
      <EpiqWalletsPanel />

      {/* Wallet Addresses */}
      <Card className="border-2 border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5 text-primary" />
            Your Wallet Addresses
          </CardTitle>
          <CardDescription>Copy your wallet addresses to receive crypto</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Ethereum Address */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Ethereum Address</Label>
            {ethAddressEmpty ? (
              <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                <span className="text-sm text-muted-foreground">No ETH address set</span>
              </div>
            ) : ethAddressValid ? (
              <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                <code className="flex-1 text-xs break-all">{ethAddress}</code>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard(ethAddress, 'ETH Address')}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <Alert variant="destructive" className="border-destructive/50 bg-destructive/10">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold">Invalid ETH address format</p>
                    <p className="text-sm mt-1">The address stored in your profile is not a valid EVM address.</p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRetry}
                    className="ml-4 bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 text-white border-0"
                  >
                    Retry
                  </Button>
                </AlertDescription>
              </Alert>
            )}
          </div>

          {/* Bitcoin Address */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Bitcoin Address</Label>
            <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
              <code className="flex-1 text-xs break-all">
                {profile?.btcWalletAddress || 'No BTC address set'}
              </code>
              {profile?.btcWalletAddress && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard(profile.btcWalletAddress, 'BTC Address')}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>

          {/* ICP Address */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">ICP Address</Label>
            <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
              <code className="flex-1 text-xs break-all">
                {profile?.icpWalletAddress || 'No ICP address set'}
              </code>
              {profile?.icpWalletAddress && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard(profile.icpWalletAddress, 'ICP Address')}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Transaction History */}
      <Card className="border-2 border-primary/20">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Transaction History</CardTitle>
              <CardDescription>View your recent transactions</CardDescription>
            </div>
            <Dialog open={sendDialogOpen} onOpenChange={setSendDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90">
                  <Send className="h-4 w-4 mr-2" />
                  Send Crypto
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Send Cryptocurrency</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="recipient">Recipient Principal ID</Label>
                    <Input
                      id="recipient"
                      placeholder="Enter recipient principal ID"
                      value={recipient}
                      onChange={(e) => setRecipient(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="amount">Amount</Label>
                    <Input
                      id="amount"
                      type="number"
                      placeholder="0.00"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="currency">Currency</Label>
                    <select
                      id="currency"
                      className="w-full p-2 border rounded-md"
                      value={currency}
                      onChange={(e) => setCurrency(e.target.value)}
                    >
                      <option value="ICP">ICP</option>
                      <option value="ETH">ETH</option>
                      <option value="BTC">BTC</option>
                    </select>
                  </div>
                  <Button
                    onClick={handleSendCrypto}
                    disabled={createTransaction.isPending}
                    className="w-full bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90"
                  >
                    {createTransaction.isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4 mr-2" />
                        Send
                      </>
                    )}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {transactionsLoading ? (
            <div className="text-center py-8">
              <Loader2 className="h-8 w-8 mx-auto text-primary animate-spin" />
              <p className="text-sm text-muted-foreground mt-2">Loading transactions...</p>
            </div>
          ) : transactionsError ? (
            <Alert variant="destructive" className="border-destructive/50 bg-destructive/10">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="flex items-center justify-between">
                <div>
                  <p className="font-semibold">Failed to load transactions</p>
                  <p className="text-sm mt-1">Unable to fetch transaction history</p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRetry}
                  className="ml-4 bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 text-white border-0"
                >
                  Retry
                </Button>
              </AlertDescription>
            </Alert>
          ) : transactions.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No transactions yet</p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.map((tx) => (
                    <TableRow key={Number(tx.id)}>
                      <TableCell className="text-sm">{formatDate(tx.timestamp)}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{tx.currency}</Badge>
                      </TableCell>
                      <TableCell className="font-medium">{tx.amount.toString()}</TableCell>
                      <TableCell>
                        <Badge
                          variant={tx.status === 'completed' ? 'default' : 'secondary'}
                          className={
                            tx.status === 'completed'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }
                        >
                          {tx.status}
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
    </div>
  );
}
