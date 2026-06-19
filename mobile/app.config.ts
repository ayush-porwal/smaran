/// <reference types="node" />
// Dynamic app config. Expo evaluates this at build time and merges the
// static app.json — passed in as `config` — with per-env values.
//
// The build workflow / `npm run config:pull` writes per-env JSON to
// `mobile/config/{env}.json`. `SMARAN_ENV` (set by the eas.json build
// profile) picks which file to load.
//
// In local dev: `SMARAN_ENV` is unset, we fall back to
// `mobile/config/local.json` which has empty values; the sign-in
// screen detects this and shows a config-missing error.
import { readFileSync } from "fs";
import { join } from "path";
import type { ConfigContext, ExpoConfig } from "expo/config";

type EnvConfig = {
  envCode: string;
  userPoolId: string;
  userPoolClientId: string;
  hostedUiDomain: string;
  graphqlEndpoint: string;
};

function loadEnv(): EnvConfig {
  const env = process.env.SMARAN_ENV ?? "local";
  const file = join(process.cwd(), "config", `${env}.json`);
  return JSON.parse(readFileSync(file, "utf8")) as EnvConfig;
}

export default ({ config }: ConfigContext): ExpoConfig => {
  const cfg = loadEnv();
  return {
    ...config,
    name: `Smaran (${cfg.envCode})`,
    slug: config.slug ?? "smaran",
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
