import path from 'node:path';

const relpaths = (files, workspace) =>
  files.map((file) => path.relative(workspace, file)).join(' ');

// lint-staged runs at the repo root; ESLint must execute inside each workspace
// so it resolves that package's eslint.config.js (and tsconfig paths).
const eslintFix = (workspace, files) => {
  const rel = relpaths(files, workspace);
  if (!rel) {
    return [];
  }

  return [`bash -c 'cd ${workspace} && eslint --fix ${rel}'`];
};

/** @type {import('lint-staged').Configuration} */
export default {
  'mobile/**/*.{ts,tsx,js,jsx,json,md}': (files) => [
    `prettier --write ${files.join(' ')}`,
    ...eslintFix('mobile', files),
  ],
  'infra/**/*.{ts,js,json,md}': (files) => [
    `prettier --write ${files.join(' ')}`,
    ...eslintFix('infra', files),
  ],
  'packages/**/*.{js,json,md}': (files) => [`prettier --write ${files.join(' ')}`],
  '*.{json,md,yaml,yml}': (files) => [`prettier --write ${files.join(' ')}`],
};
