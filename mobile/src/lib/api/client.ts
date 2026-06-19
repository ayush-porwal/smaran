// The single import path for the data layer. Feature code imports from
// `@/lib/api` and never reaches into a specific implementation.
// Kept as a separate file so the implementation behind it can be
// swapped (e.g. for testing) without touching call sites.
export * from './graphql';
