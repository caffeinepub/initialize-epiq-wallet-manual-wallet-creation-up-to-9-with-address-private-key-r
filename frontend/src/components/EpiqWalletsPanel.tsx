import React, { useState } from 'react';
import { Wallet, Plus, Eye, EyeOff, Copy, CheckCircle, AlertCircle, Loader2, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { useCreateWallet, useGetWalletAddresses, useAddWalletAddress } from '../hooks/useQueries';
import { normalizeWalletError } from '../utils/walletErrors';
import { isValidEvmAddress, normalizeEvmAddress } from '../utils/evmAddress';

const MAX_WALLETS = 9;

interface WalletCredentials {
  address: string;
  privateKey: string;
  recoveryPhrase: string;
}

export default function EpiqWalletsPanel() {
  const [showCredentials, setShowCredentials] = useState(false);
  const [credentials, setCredentials] = useState<WalletCredentials | null>(null);
  const [showPrivateKey, setShowPrivateKey] = useState(false);
  const [showRecoveryPhrase, setShowRecoveryPhrase] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Fetch stored wallet addresses from backend
  const {
    data: walletAddresses = [],
    isLoading: addressesLoading,
    isError: addressesError,
    refetch: refetchAddresses,
  } = useGetWalletAddresses();

  const createWalletMutation = useCreateWallet();
  const addWalletAddressMutation = useAddWalletAddress();

  const isAtLimit = walletAddresses.length >= MAX_WALLETS;
  const isCreating = createWalletMutation.isPending || addWalletAddressMutation.isPending;

  const handleCreateWallet = async () => {
    // Clear any previous error before attempting
    setErrorMessage(null);

    try {
      // Step 1: Request wallet creation from backend.
      // On success, backend returns { address, privateKey, recoveryPhrase, chain } exactly once.
      // Private key and recovery phrase are NOT stored in any stable backend variable.
      const result = await createWalletMutation.mutateAsync(null);

      // Step 2: Validate the derived address
      const rawAddress = result.address;
      const normalized = normalizeEvmAddress(rawAddress);
      if (!isValidEvmAddress(normalized)) {
        setErrorMessage('Generated address is invalid. Please try again.');
        return;
      }

      // Step 3: Store ONLY the address on-chain (never private key or mnemonic)
      await addWalletAddressMutation.mutateAsync(normalized);

      // Step 4: Show one-time credentials to user — these will never be shown again
      setCredentials({
        address: normalized,
        privateKey: result.privateKey,
        recoveryPhrase: result.recoveryPhrase,
      });
      setShowCredentials(true);
    } catch (err) {
      // Map the structured backend error variant to a user-friendly message.
      // normalizeWalletError handles WalletOperationError, WalletError strings,
      // and generic Error objects — never falls back to "Failed to create wallet".
      setErrorMessage(normalizeWalletError(err));
    }
  };

  const handleCopy = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    } catch {
      // Clipboard not available
    }
  };

  const handleCloseCredentials = () => {
    setShowCredentials(false);
    setCredentials(null);
    setShowPrivateKey(false);
    setShowRecoveryPhrase(false);
    refetchAddresses();
  };

  const handleRetry = () => {
    setErrorMessage(null);
    handleCreateWallet();
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Wallet className="h-5 w-5 text-primary" />
          <h3 className="font-semibold text-foreground">EPIQ Wallets</h3>
          <Badge variant="outline" className="text-xs">
            {addressesLoading ? '…' : walletAddresses.length}/{MAX_WALLETS}
          </Badge>
        </div>
        <Button
          size="sm"
          onClick={handleCreateWallet}
          disabled={isAtLimit || isCreating || addressesLoading}
          className="gap-1.5"
        >
          {isCreating ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Plus className="h-3.5 w-3.5" />
          )}
          {isCreating ? 'Creating…' : 'New Wallet'}
        </Button>
      </div>

      {/* Limit warning */}
      {isAtLimit && (
        <Alert className="border-amber-500/40 bg-amber-500/10">
          <AlertCircle className="h-4 w-4 text-amber-500" />
          <AlertDescription className="text-amber-700 dark:text-amber-400 text-sm">
            Maximum of {MAX_WALLETS} wallets reached. Cannot add more wallets.
          </AlertDescription>
        </Alert>
      )}

      {/* Error message — shown when wallet creation fails */}
      {errorMessage && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between gap-2">
            <span>{errorMessage}</span>
            {/* Only show retry for transient errors, not limit-reached */}
            {!isAtLimit && (
              <button
                onClick={handleRetry}
                disabled={isCreating}
                className="shrink-0 text-xs underline underline-offset-2 hover:no-underline disabled:opacity-50"
              >
                Try again
              </button>
            )}
          </AlertDescription>
        </Alert>
      )}

      {/* Wallet address list */}
      <div className="space-y-2">
        {addressesLoading ? (
          <>
            <Skeleton className="h-12 w-full rounded-lg" />
            <Skeleton className="h-12 w-full rounded-lg" />
          </>
        ) : addressesError ? (
          <div className="flex flex-col items-center gap-2 py-6 text-center">
            <AlertCircle className="h-8 w-8 text-destructive" />
            <p className="text-sm text-muted-foreground">Failed to load wallet addresses.</p>
            <Button variant="outline" size="sm" onClick={() => refetchAddresses()}>
              Retry
            </Button>
          </div>
        ) : walletAddresses.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-8 text-center">
            <div className="rounded-full bg-primary/10 p-3">
              <Wallet className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">No wallets yet</p>
              <p className="text-xs text-muted-foreground mt-1">
                Create your first EPIQ wallet to get started.
              </p>
            </div>
          </div>
        ) : (
          walletAddresses.map((address, index) => (
            <WalletAddressRow
              key={address}
              index={index + 1}
              address={address}
              onCopy={handleCopy}
              copiedField={copiedField}
            />
          ))
        )}
      </div>

      {/* One-time credentials dialog */}
      <Dialog open={showCredentials} onOpenChange={(open) => { if (!open) handleCloseCredentials(); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-primary">
              <Shield className="h-5 w-5" />
              Wallet Created Successfully
            </DialogTitle>
            <DialogDescription>
              Save these credentials now — they will <strong>never be shown again</strong>.
            </DialogDescription>
          </DialogHeader>

          {credentials && (
            <div className="space-y-4">
              {/* Security warning */}
              <Alert className="border-amber-500/40 bg-amber-500/10">
                <AlertCircle className="h-4 w-4 text-amber-500" />
                <AlertDescription className="text-amber-700 dark:text-amber-400 text-xs">
                  Your private key and recovery phrase are shown only once and are <strong>not stored</strong> on the blockchain. Store them securely offline.
                </AlertDescription>
              </Alert>

              {/* Address */}
              <CredentialField
                label="Wallet Address"
                value={credentials.address}
                visible={true}
                onToggle={() => {}}
                canToggle={false}
                onCopy={() => handleCopy(credentials.address, 'address')}
                copied={copiedField === 'address'}
              />

              {/* Private Key */}
              <CredentialField
                label="Private Key"
                value={credentials.privateKey}
                visible={showPrivateKey}
                onToggle={() => setShowPrivateKey((v) => !v)}
                canToggle={true}
                onCopy={() => handleCopy(credentials.privateKey, 'privateKey')}
                copied={copiedField === 'privateKey'}
              />

              {/* Recovery Phrase */}
              <CredentialField
                label="Recovery Phrase"
                value={credentials.recoveryPhrase}
                visible={showRecoveryPhrase}
                onToggle={() => setShowRecoveryPhrase((v) => !v)}
                canToggle={true}
                onCopy={() => handleCopy(credentials.recoveryPhrase, 'recoveryPhrase')}
                copied={copiedField === 'recoveryPhrase'}
              />

              <Button className="w-full" onClick={handleCloseCredentials}>
                I've saved my credentials
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

interface WalletAddressRowProps {
  index: number;
  address: string;
  onCopy: (text: string, field: string) => void;
  copiedField: string | null;
}

function WalletAddressRow({ index, address, onCopy, copiedField }: WalletAddressRowProps) {
  const fieldKey = `addr-${address}`;
  const isCopied = copiedField === fieldKey;

  return (
    <div className="flex items-center gap-3 rounded-lg border border-border bg-card px-3 py-2.5">
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
        {index}
      </div>
      <span className="flex-1 truncate font-mono text-xs text-foreground" title={address}>
        {address}
      </span>
      <button
        onClick={() => onCopy(address, fieldKey)}
        className="shrink-0 rounded p-1 text-muted-foreground transition-colors hover:text-foreground"
        title="Copy address"
      >
        {isCopied ? (
          <CheckCircle className="h-3.5 w-3.5 text-green-500" />
        ) : (
          <Copy className="h-3.5 w-3.5" />
        )}
      </button>
    </div>
  );
}

interface CredentialFieldProps {
  label: string;
  value: string;
  visible: boolean;
  onToggle: () => void;
  canToggle: boolean;
  onCopy: () => void;
  copied: boolean;
}

function CredentialField({ label, value, visible, onToggle, canToggle, onCopy, copied }: CredentialFieldProps) {
  const displayValue = visible || !canToggle ? value : '•'.repeat(Math.min(value.length, 40));

  return (
    <div className="space-y-1">
      <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
        {label}
      </label>
      <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/40 px-3 py-2">
        <span className="flex-1 break-all font-mono text-xs text-foreground">
          {displayValue}
        </span>
        <div className="flex shrink-0 items-center gap-1">
          {canToggle && (
            <button
              onClick={onToggle}
              className="rounded p-1 text-muted-foreground transition-colors hover:text-foreground"
              title={visible ? 'Hide' : 'Show'}
            >
              {visible ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
            </button>
          )}
          <button
            onClick={onCopy}
            className="rounded p-1 text-muted-foreground transition-colors hover:text-foreground"
            title="Copy"
          >
            {copied ? (
              <CheckCircle className="h-3.5 w-3.5 text-green-500" />
            ) : (
              <Copy className="h-3.5 w-3.5" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
