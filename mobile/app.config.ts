// Dynamic app config. Expo runs this file at build time and reads
// the returned object as the effective `app.json`.
//
// The deploy workflow writes per-env JSON files to
// `mobile/config/{env}.json`. `SMARAN_ENV` (set by the mobile
// build workflow) picks which file to load.
//
// In local dev: `SMARAN_ENV` is unset, we fall back to
// `mobile/config/local.json` which has empty values; the
// sign-in screen detects this and shows a config-missing error.
import type { ExpoConfig } from 'expo/config';

import base from './app.json';

type EnvConfig = {
  envCode: string;
  userPoolId: string;
  userPoolClientId: string;
  hostedUiDomain: string;
  graphqlEndpoint: string;
};

function loadEnv(): EnvConfig {
  const env = process.env.SMARAN_ENV ?? 'local';
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const cfg = require(`./config/${env}.json`) as EnvConfig;
  return cfg;
}

const cfg = loadEnv();
const baseConfig = base as unknown as ExpoConfig;

const config: ExpoConfig = {
  ...baseConfig,
  name: `Smaran (${cfg.envCode})`,
  extra: {
    ...(baseConfig.extra ?? {}),
    envCode: cfg.envCode,
    userPoolId: cfg.userPoolId,
    userPoolClientId: cfg.userPoolClientId,
    hostedUiDomain: cfg.hostedUiDomain,
    graphqlEndpoint: cfg.graphqlEndpoint,
  },
};

export default config;
