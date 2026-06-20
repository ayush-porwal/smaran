/// <reference types="node" />
// `SMARAN_ENV` picks config/{env}.json (from pull-config or CI). Unset → local.json (empty → sign-in config error).
import { readFileSync } from 'fs';
import { join } from 'path';
import type { ConfigContext, ExpoConfig } from 'expo/config';

type EnvConfig = {
  envCode: string;
  userPoolId: string;
  userPoolClientId: string;
  hostedUiDomain: string;
  graphqlEndpoint: string;
};

function loadEnv(): EnvConfig {
  const env = process.env.SMARAN_ENV ?? 'local';
  const file = join(process.cwd(), 'config', `${env}.json`);
  return JSON.parse(readFileSync(file, 'utf8')) as EnvConfig;
}

export default ({ config }: ConfigContext): ExpoConfig => {
  const cfg = loadEnv();
  return {
    ...config,
    name: `Smaran (${cfg.envCode})`,
    slug: config.slug ?? 'smaran',
    extra: {
      ...(config.extra ?? {}),
      envCode: cfg.envCode,
      userPoolId: cfg.userPoolId,
      userPoolClientId: cfg.userPoolClientId,
      hostedUiDomain: cfg.hostedUiDomain,
      graphqlEndpoint: cfg.graphqlEndpoint,
    },
  };
};
