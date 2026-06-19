#!/usr/bin/env node
// Materialises mobile/config/{out}.json from a deployed CDK stack's
// CloudFormation outputs. Used in two places:
//
//   - CI (build-apk workflow): writes config/{env}.json before the EAS
//     build, so the backend wiring is fetched live rather than persisted
//     by the deploy chain.
//   - Local dev: point local.json at a deployed sandbox so `expo start`
//     talks to a real backend (Google sign-in, AppSync). The per-PR
//     sandbox is ephemeral, so re-run this whenever it redeploys.
//
// Requires AWS credentials for the target account on the PATH (the same
// creds you use for `cdk deploy`).
//
// Usage:
//   node scripts/pull-config.mjs --stack <name> [--env <code>] \
//     [--out <file>] [--region <region>]
//
// Example (local → current PR sandbox):
//   node scripts/pull-config.mjs \
//     --stack pr4-smaran-sandbox-eu-central-1 --env sandbox --out local.json

import { execFileSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const CONFIG_DIR = resolve(HERE, '..', 'config');

function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i += 2) {
    const key = argv[i]?.replace(/^--/, '');
    if (!key) continue;
    args[key] = argv[i + 1];
  }
  return args;
}

const args = parseArgs(process.argv.slice(2));
const stack = args.stack;
const envCode = args.env ?? 'sandbox';
const region = args.region ?? 'eu-central-1';
const out = args.out ?? `${envCode}.json`;

if (!stack) {
  console.error('error: --stack <name> is required');
  process.exit(1);
}

// CFN output key → mobile config field.
const KEY_MAP = {
  UserPoolId: 'userPoolId',
  UserPoolClientId: 'userPoolClientId',
  HostedUiDomain: 'hostedUiDomain',
  GraphQLEndpoint: 'graphqlEndpoint',
};

let raw;
try {
  raw = execFileSync(
    'aws',
    [
      'cloudformation',
      'describe-stacks',
      '--stack-name',
      stack,
      '--region',
      region,
      '--query',
      'Stacks[0].Outputs',
      '--output',
      'json',
    ],
    { encoding: 'utf8' },
  );
} catch (err) {
  console.error(`error: failed to read outputs for stack "${stack}"`);
  console.error(err.stderr?.toString() ?? err.message);
  process.exit(1);
}

const outputs = JSON.parse(raw) ?? [];
const byKey = Object.fromEntries(outputs.map((o) => [o.OutputKey, o.OutputValue]));

const cfg = { envCode };
const missing = [];
for (const [outputKey, field] of Object.entries(KEY_MAP)) {
  if (byKey[outputKey] == null) missing.push(outputKey);
  cfg[field] = byKey[outputKey] ?? '';
}

if (missing.length) {
  console.error(`error: stack "${stack}" is missing outputs: ${missing.join(', ')}`);
  process.exit(1);
}

mkdirSync(CONFIG_DIR, { recursive: true });
const target = resolve(CONFIG_DIR, out);
writeFileSync(target, `${JSON.stringify(cfg, null, 2)}\n`);
console.log(`wrote config/${out}`, cfg);
