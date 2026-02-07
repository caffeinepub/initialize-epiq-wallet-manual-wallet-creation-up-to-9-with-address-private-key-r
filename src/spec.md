# Specification

## Summary
**Goal:** Initialize manual EPIQ Wallet creation and management in EPIQ Life, allowing authenticated users to create and manage up to 9 wallets, with secure generation and one-time display of sensitive credentials.

**Planned changes:**
- Add backend wallet storage scoped per caller Principal, persisting up to 9 wallets per user with wallet index/id, optional label, createdAt, public address, and listing metadata.
- Implement backend user-initiated wallet creation that securely generates and returns a new wallet’s public address, private key, and recovery seed phrase (mnemonic), enforcing authentication and non-deterministic randomness.
- Enforce strict “manual only” wallet creation (no auto-provisioning during enrollment, login, profile creation, or Firebase sync paths).
- Add/extend frontend wallet area UI to list wallets (empty state included) and provide a Create Wallet flow that shows address/private key/seed phrase exactly once with warnings, copy-to-clipboard, and a required acknowledgment before closing.
- Add React Query hooks/mutations for listing and creating wallets, including cache invalidation/refetch so newly created wallets appear immediately, with user-friendly error handling (limit reached, permission, backend unavailable).
- Add a minimal, read-only in-app Phase 1 Testing Plan page/section listing Phase 1 tests for dual authentication, session transitions, user sync, and duplicate prevention (to be run after wallet functionality is confirmed).

**User-visible outcome:** Users can view an empty or populated wallet list, manually create up to 9 wallets, and (only once) see/copy the generated address, private key, and recovery phrase after creation; afterward only public wallet metadata remains visible, and a read-only Phase 1 testing checklist is available in-app.
