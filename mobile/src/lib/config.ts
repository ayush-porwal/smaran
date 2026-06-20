// CI deploy writes mobile/config/{env}.json; local dev leaves keys empty (sign-in shows config missing).
import Constants from 'expo-constants';

type EnvConfig = {
  envCode: 'local' | 'sandbox' | 'staging' | 'prod' | 'pr';
  userPoolId: string;
  userPoolClientId: string;
  hostedUiDomain: string;
  graphqlEndpoint: string;
};

const extra = (Constants.expoConfig?.extra ?? {}) as Partial<EnvConfig>;

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
  return Boolean(config.userPoolId && config.userPoolClientId && config.hostedUiDomain);
}
