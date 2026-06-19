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
  // Dynamic path + Expo's config must be synchronous, so neither a static
  // `import` nor async `import()` works here — require is the only option.
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const cfg = require(`./config/${env}.json`) as EnvConfig;
  return cfg;
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
