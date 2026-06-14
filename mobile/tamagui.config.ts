// Re-exports the design-system config. The Tamagui babel plugin looks
// for `tamagui.config.ts` at the project root by default, so this file
// is the babel-side entry point. Runtime code (the TamaguiProvider in
// app/_layout.tsx) imports directly from `src/design-system/tamagui.config.ts`
// to keep the import path consistent with the rest of the app.
export { tamaguiConfig as default, tamaguiConfig } from './src/design-system/tamagui.config';
