// The single import path for the data layer. Feature code imports from
// `@/lib/api` (or `@/lib/api/client`) and never from `./mock` directly.
// Today this re-exports the mock implementation; tomorrow it re-exports
// the GraphQL implementation. Either way, call sites stay the same.
export * from './mock';
