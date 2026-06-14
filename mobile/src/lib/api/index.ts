// Public surface for the data layer. Re-exports types and the client.
export * from './types';
export * from './client';
export { useCurrentUser } from './useCurrentUser';
export { useStoreVersion } from './useStoreVersion';
// Re-exporting the store is a Phase 0 concession so the mock sign-in
// screen can enumerate seeded users. Real auth won't need this.
export { store } from './mock-store';
