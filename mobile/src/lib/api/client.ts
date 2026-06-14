// The single import path for the data layer. Feature code imports from
// `@/lib/api` and never reaches into a specific implementation.
// Today this re-exports the AppSync GraphQL implementation; the
// mock lives in `./mock.ts` (deleted in Phase 8) for historical
// reference only.
export * from './graphql';
