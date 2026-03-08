# Specification

## Summary
**Goal:** Complete the wallet creation flow by ensuring credentials are returned securely exactly once, preventing sensitive data from leaking through `listWallets`, and replacing generic error messages with structured, user-friendly error handling.

**Planned changes:**
- Update `createWallet` backend function to return `address`, `privateKey`, `recoveryPhrase`, and `chain` exactly once on success, without persisting private key or recovery phrase in stable storage.
- Update `listWallets` backend function to return only non-sensitive fields (`address` and `chain`), stripping out `privateKey` and `recoveryPhrase` from its return type.
- Update `createWallet` error handling to return typed error variants (e.g., `#randomnessError`, `#limitReached`, `#notAuthenticated`, `#internalError`) instead of raw trap messages.
- Update frontend `walletErrors.ts` to map every new typed error variant to a specific, user-friendly message.
- Update `EpiqWalletsPanel` component to display the mapped error messages, eliminating the generic "Failed to create wallet" message.

**User-visible outcome:** Users see their wallet credentials (address, private key, recovery phrase) displayed exactly once after creation, and receive clear, specific error messages if wallet creation fails instead of a generic error.
