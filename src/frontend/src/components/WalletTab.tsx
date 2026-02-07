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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowUpRight, ArrowDownLeft, Send, Wallet, Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { SiBitcoin } from 'react-icons/si';
import { Principal } from '@icp-sdk/core/principal';
import EpiqWalletsPanel from './EpiqWalletsPanel';

export default function WalletTab() {
  const { actor, isFetching: actorFetching } = useActor();
  const queryClient = useQueryClient();
  const { data: transactions = [], isLoading: transactionsLoading, error: transactionsError, refetch: refetchTransactions } = useGetUserTransactions();
  const { data: userProfile, isLoading: profileLoading, error: profileError, refetch: refetchProfile } = useGetCallerUserProfile();
  const { mutate: createTransaction, isPending } = useCreateTransaction();
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState<'ICP' | 'ETH' | 'BTC'>('ICP');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const [retryAttempts, setRetryAttempts] = useState(0);

  const isBackendReady = !!actor && !actorFetching;

  // Auto-retry when backend becomes ready
  useEffect(() => {
    if (isBackendReady && (profileError || transactionsError)) {
      const timer = setTimeout(() => {
        if (profileError) refetchProfile();
        if (transactionsError) refetchTransactions();
        setRetryAttempts((prev) => prev + 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [isBackendReady, profileError, transactionsError, refetchProfile, refetchTransactions]);

  // Invalidate queries when backend is ready
  useEffect(() => {
    if (isBackendReady && retryAttempts === 0) {
      queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
      queryClient.invalidateQueries({ queryKey: ['userTransactions'] });
    }
  }, [isBackendReady, queryClient, retryAttempts]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!recipient || !amount) return;

    const recipientPrincipal = Principal.fromText(recipient);
    createTransaction(
      { to: recipientPrincipal, amount: BigInt(Math.floor(parseFloat(amount) * 100000000)), currency },
      {
        onSuccess: () => {
          setRecipient('');
          setAmount('');
          setIsDialogOpen(false);
        },
      }
    );
  };

  const formatDate = (timestamp: bigint) => {
    const date = new Date(Number(timestamp) / 1000000);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  const formatAmount = (amount: bigint) => {
    return (Number(amount) / 100000000).toFixed(8);
  };

  const getCurrencyIcon = (curr: string) => {
    switch (curr) {
      case 'BTC':
        return <SiBitcoin className="h-5 w-5 text-orange-500" />;
      case 'ETH':
        return <img src="/assets/generated/ethereum-icon-transparent.dim_64x64.png" alt="ETH" className="h-5 w-5" />;
      case 'ICP':
        return <Wallet className="h-5 w-5 text-primary" />;
      default:
        return <Wallet className="h-5 w-5" />;
    }
  };

  const filteredTransactions = activeTab === 'all' 
    ? transactions 
    : transactions.filter(tx => tx.currency === activeTab.toUpperCase());

  const balances = {
    ICP: '1,000.00',
    ETH: '0.5000',
    BTC: '0.0250',
  };

  const handleRetry = () => {
    setRetryAttempts(0);
    refetchProfile();
    refetchTransactions();
  };

  // Backend initialization check
  if (!isBackendReady) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="max-w-md w-full border-2 border-primary/20">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <div className="flex justify-center">
                <div className="relative">
                  <Wallet className="h-12 w-12 text-primary animate-pulse" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Loader2 className="h-6 w-6 text-secondary animate-spin" />
                  </div>
                </div>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-primary">Connecting to Wallet</h3>
                <p className="text-sm text-muted-foreground mt-2">
                  Establishing secure connection to multi-chain wallet...
                </p>
              </div>
              <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                <span>Initializing blockchain connections</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Profile loading state
  if (profileLoading) {
    return (
      <div className="space-y-6">
        <Card className="border-2 border-primary/20">
          <CardContent className="py-12">
            <div className="text-center space-y-4">
              <Loader2 className="h-12 w-12 mx-auto text-primary animate-spin" />
              <div>
                <h3 className="text-lg font-semibold">Loading Wallet</h3>
                <p className="text-sm text-muted-foreground">Fetching your wallet information...</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Profile error state
  if (profileError) {
    return (
      <div className="space-y-6">
        <Alert variant="destructive" className="border-destructive/50 bg-destructive/10">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <div>
              <p className="font-semibold">Failed to load wallet profile</p>
              <p className="text-sm mt-1">
                {profileError instanceof Error ? profileError.message : 'An unknown error occurred'}
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

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-xl border-2 border-primary/20 bg-gradient-to-br from-primary/5 via-background to-primary/10 p-6">
        <img 
          src="/assets/generated/multi-chain-wallet-banner-purple.dim_800x300.png" 
          alt="Multi-chain wallet" 
          className="absolute inset-0 w-full h-full object-cover opacity-10"
        />
        <div className="relative z-10">
          <h2 className="text-2xl font-bold mb-4">Multi-Chain Wallet</h2>
          <div className="grid gap-4 md:grid-cols-3">
            <Card className="border-primary/30 bg-background/80 backdrop-blur">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardDescription>ICP Balance</CardDescription>
                  <Wallet className="h-5 w-5 text-primary" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{balances.ICP}</div>
                <p className="text-xs text-muted-foreground mt-1">Internet Computer</p>
              </CardContent>
            </Card>

            <Card className="border-primary/30 bg-background/80 backdrop-blur">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardDescription>ETH Balance</CardDescription>
                  <img src="/assets/generated/ethereum-icon-transparent.dim_64x64.png" alt="ETH" className="h-5 w-5" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{balances.ETH}</div>
                <p className="text-xs text-muted-foreground mt-1">Ethereum</p>
              </CardContent>
            </Card>

            <Card className="border-primary/30 bg-background/80 backdrop-blur">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardDescription>BTC Balance</CardDescription>
                  <SiBitcoin className="h-5 w-5 text-orange-500" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{balances.BTC}</div>
                <p className="text-xs text-muted-foreground mt-1">Bitcoin</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* EPIQ Wallets Section */}
      <EpiqWalletsPanel />

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="border-2">
          <CardHeader>
            <CardTitle>Send Crypto</CardTitle>
            <CardDescription>Transfer to another EPIQ Life user</CardDescription>
          </CardHeader>
          <CardContent>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button className="w-full">
                  <Send className="mr-2 h-4 w-4" />
                  Send Crypto
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Send Crypto</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSend} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="currency">Cryptocurrency</Label>
                    <Select value={currency} onValueChange={(val) => setCurrency(val as 'ICP' | 'ETH' | 'BTC')}>
                      <SelectTrigger id="currency">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ICP">
                          <div className="flex items-center gap-2">
                            <Wallet className="h-4 w-4 text-primary" />
                            <span>ICP - Internet Computer</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="ETH">
                          <div className="flex items-center gap-2">
                            <img src="/assets/generated/ethereum-icon-transparent.dim_64x64.png" alt="ETH" className="h-4 w-4" />
                            <span>ETH - Ethereum</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="BTC">
                          <div className="flex items-center gap-2">
                            <SiBitcoin className="h-4 w-4 text-orange-500" />
                            <span>BTC - Bitcoin</span>
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="recipient">Recipient Principal ID</Label>
                    <Input
                      id="recipient"
                      placeholder="Enter principal ID"
                      value={recipient}
                      onChange={(e) => setRecipient(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="amount">Amount ({currency})</Label>
                    <Input
                      id="amount"
                      type="number"
                      placeholder="0.00000000"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      required
                      min="0"
                      step="0.00000001"
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={isPending}>
                    {isPending ? 'Sending...' : `Send ${currency}`}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>

        <Card className="border-2">
          <CardHeader>
            <CardTitle>Wallet Addresses</CardTitle>
            <CardDescription>Your multi-chain wallet addresses</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Wallet className="h-4 w-4 text-primary" />
                <span>ICP Address</span>
              </div>
              <p className="font-mono text-xs text-muted-foreground break-all">
                {userProfile?.icpWalletAddress || 'Not set'}
              </p>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium">
                <img src="/assets/generated/ethereum-icon-transparent.dim_64x64.png" alt="ETH" className="h-4 w-4" />
                <span>ETH Address</span>
              </div>
              <p className="font-mono text-xs text-muted-foreground break-all">
                {userProfile?.ethWalletAddress || 'Not set'}
              </p>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium">
                <SiBitcoin className="h-4 w-4 text-orange-500" />
                <span>BTC Address</span>
              </div>
              <p className="font-mono text-xs text-muted-foreground break-all">
                {userProfile?.btcWalletAddress || 'Not set'}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Transaction History</CardTitle>
          <CardDescription>Your multi-chain transaction history</CardDescription>
        </CardHeader>
        <CardContent>
          {transactionsError ? (
            <Alert variant="destructive" className="border-destructive/50 bg-destructive/10">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="flex items-center justify-between">
                <div>
                  <p className="font-semibold">Failed to load transactions</p>
                  <p className="text-sm mt-1">
                    {transactionsError instanceof Error ? transactionsError.message : 'An unknown error occurred'}
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
          ) : (
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="icp">ICP</TabsTrigger>
                <TabsTrigger value="eth">ETH</TabsTrigger>
                <TabsTrigger value="btc">BTC</TabsTrigger>
              </TabsList>
              <TabsContent value={activeTab} className="mt-4">
                {transactionsLoading ? (
                  <div className="text-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">Loading transactions...</p>
                  </div>
                ) : filteredTransactions.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No {activeTab === 'all' ? '' : activeTab.toUpperCase()} transactions yet
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Type</TableHead>
                        <TableHead>Currency</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredTransactions.map((tx) => (
                        <TableRow key={Number(tx.id)}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {tx.from.toString() === tx.to.toString() ? (
                                <ArrowUpRight className="h-4 w-4 text-red-500" />
                              ) : (
                                <ArrowDownLeft className="h-4 w-4 text-green-500" />
                              )}
                              <span className="text-sm">
                                {tx.from.toString() === tx.to.toString() ? 'Sent' : 'Received'}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {getCurrencyIcon(tx.currency)}
                              <span>{tx.currency}</span>
                            </div>
                          </TableCell>
                          <TableCell className="font-mono">{formatAmount(tx.amount)}</TableCell>
                          <TableCell>
                            <Badge
                              variant={tx.status === 'completed' ? 'default' : 'secondary'}
                              className={tx.status === 'completed' ? 'bg-green-500' : ''}
                            >
                              {tx.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {formatDate(tx.timestamp)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </TabsContent>
            </Tabs>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
