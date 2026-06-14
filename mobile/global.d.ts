// Ambient declarations for the Expo default template's web-only files.
// The template ships CSS modules and a global stylesheet that don't ship
// .d.ts files; the src/ tree is being replaced with our Tamagui design
// system, so these declarations just unblock the type-check until the
// template files get deleted.
declare module '*.module.css' {
  const classes: { readonly [key: string]: string };
  export default classes;
}

declare module '@/global.css';
