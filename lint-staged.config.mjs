import path from 'node:path';

const shellQuote = (value) => `'${String(value).replace(/'/g, `'\\''`)}'`;

const eslintFix = (workspace, files) => {
  const rel = files.map((file) => path.relative(workspace, file));
  if (rel.length === 0) {
    return [];
  }

  const quoted = rel.map(shellQuote).join(' ');
  return [`bash -c "cd ${shellQuote(workspace)} && eslint --fix ${quoted}"`];
};

const prettierWrite = (files) => {
  if (files.length === 0) {
    return [];
  }

  return [`prettier --write ${files.map(shellQuote).join(' ')}`];
};

/** @type {import('lint-staged').Configuration} */
export default {
  'mobile/**/*.{ts,tsx,js,jsx}': (files) => [
    ...prettierWrite(files),
    ...eslintFix('mobile', files),
  ],
  'mobile/**/*.{json,md}': prettierWrite,
  'infra/**/*.{ts,js}': (files) => [...prettierWrite(files), ...eslintFix('infra', files)],
  'infra/**/*.{json,md}': prettierWrite,
  'packages/**/*.{js,json,md}': prettierWrite,
  '*.{json,md,yaml,yml}': prettierWrite,
};
