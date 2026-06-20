// Unblocks type-check for Expo template CSS modules until template files are removed.
declare module '*.module.css' {
  const classes: { readonly [key: string]: string };
  export default classes;
}

declare module '@/global.css';
