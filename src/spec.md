# Specification

## Summary
**Goal:** Generate real, MetaMask-importable EVM wallet addresses on wallet creation and refactor backend wallet generation to be chain-pluggable for future multi-chain support, while updating the frontend to consume structured wallet-creation results from the backend.

**Planned changes:**
- Backend: Replace placeholder wallet address generation with real EVM key/address derivation during the user-initiated Create Wallet action; return address, private key, and recovery phrase to the frontend exactly once.
- Backend: Introduce a chain abstraction (e.g., chain enum/type) and store the chain on wallet records, with EVM as the default/initial supported chain; provide a single interface boundary for “derive keys/address for chain X”.
- Backend: Keep existing persisted wallets readable by safely defaulting any newly required fields (e.g., default chain = EVM) if schema/state changes.
- Frontend: Update the EPIQ Wallet create flow to use explicit Create Wallet response fields (address/privateKey/seedPhrase/chain) and stop generating mock credentials or regex-parsing message strings.
- Maintain existing behavior constraints: wallets are created only via explicit Create action, wallet list remains capped at 9 wallets per user, and user-facing text stays in English.

**User-visible outcome:** When a user creates a wallet, they receive a real EVM address (0x + 40 hex) plus the private key and recovery phrase shown in the existing one-time success dialog, and the wallet list displays the backend-generated address (up to 9 wallets).
