// Runtime config. Values come from `app.config.ts` -> `expo-constants`
// so they vary per build (sandbox/staging/prod/local).
//
// In CI: the deploy workflow writes `cdk-outputs.json` to
// `mobile/config/{env}.json`. `app.config.ts` reads the right file
// based on `SMARAN_ENV` and exposes the values here.
//
// In local dev: leave the keys empty; the sign-in screen shows a
// "config missing" error and the GraphQL client refuses to start.
import Constants from 'expo-constants';

type EnvConfig = {
  envCode: 'local' | 'sandbox' | 'staging' | 'prod' | 'pr';
  userPoolId: string;
  userPoolClientId: string;
  hostedUiDomain: string;
  graphqlEndpoint: string;
};

const extra = (Constants.expoConfig?.extra ?? {}) as Partial<EnvConfig>;

// Guard: every non-extra field is required at runtime.
function read(): EnvConfig {
  const envCode = (extra.envCode ?? 'local') as EnvConfig['envCode'];
  return {
    envCode,
    userPoolId: extra.userPoolId ?? '',
    userPoolClientId: extra.userPoolClientId ?? '',
    hostedUiDomain: extra.hostedUiDomain ?? '',
    graphqlEndpoint: extra.graphqlEndpoint ?? '',
  };
}

export const config: EnvConfig = read();

export function isConfigured(): boolean {
  return Boolean(
    config.userPoolId && config.userPoolClientId && config.hostedUiDomain,
  );
}
