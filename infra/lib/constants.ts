// Shared constants used across stacks, constructs, and bin/.
//
// Conventions:
//   - Account IDs are 12-digit AWS account IDs (no dashes).
//   - Region: eu-central-1 (Frankfurt) for all envs. Change here if
//     you need a different region; downstream stacks and the GitHub
//     OIDC role trust policy both read this.
//   - EnvCodes are also used as the suffix for stack names
//     (`smaran-{envCode}-{region}`).

export enum Accounts {
  /** AWS account where every PR's ephemeral sandbox stack lives. */
  SANDBOX = "219602461448",
  /** AWS account where the staging stack lives. */
  STAGING = "139316820779",
  /** AWS account where the prod stack lives. */
  PROD = "916657620124",
  /** AWS account where shared CI/CD infra lives (GitHub OIDC role). */
  INFRA = "126606499529",
  /** LocalStack dummy account for local dev. */
  LOCAL = "000000000000",
}

export enum EnvCodes {
  LOCAL = "local",
  SANDBOX = "sandbox",
  STAGING = "staging",
  PROD = "prod",
}

export enum Regions {
  /** eu-central-1 (Frankfurt). All envs deploy here. */
  PRIMARY = "eu-central-1",
}

/**
 * Whether resources in this env should be destroyed or retained on
 * stack delete. Sandbox and staging are throwaway environments — every
 * resource gets `removalPolicy: DESTROY` so a stack delete is a real
 * delete (no orphaned data, no surprise bills). Prod retains data on
 * delete so an accidental `cdk destroy` doesn't take user data with
 * it; the protection here is meant to be the LAST line of defence,
 * the FIRST line is GitHub `environment` protection rules + manual
 * approval for the prod deploy job.
 */
export const RETAIN_BY_ENV: Record<EnvCodes, boolean> = {
  [EnvCodes.LOCAL]: false,
  [EnvCodes.SANDBOX]: false,
  [EnvCodes.STAGING]: false,
  [EnvCodes.PROD]: true,
};

/** Convenience: the retention policy to use for a given env. */
export function retentionFor(envCode: EnvCodes): "destroy" | "retain" {
  return RETAIN_BY_ENV[envCode] ? "retain" : "destroy";
}

/**
 * Per-env resource name prefix. Sandbox stacks also prepend the PR
 * number (e.g. `pr1234-smaran-sandbox`) so concurrent PRs don't
 * collide. See bin/app.ts for the PR prefix logic.
 */
export const STACK_NAME_PREFIX_BY_ENV: Record<EnvCodes, string> = {
  [EnvCodes.LOCAL]: "smaran-local",
  [EnvCodes.SANDBOX]: "smaran-sandbox",
  [EnvCodes.STAGING]: "smaran-staging",
  [EnvCodes.PROD]: "smaran-production",
};

/**
 * Cognito user pool domain prefix per env. Cognito requires the
 * prefix to be globally unique within the region, so we suffix with
 * a short env tag.
 */
export const COGNITO_DOMAIN_PREFIX_BY_ENV: Record<EnvCodes, string> = {
  [EnvCodes.LOCAL]: "smaran-local",
  [EnvCodes.SANDBOX]: "smaran-sandbox",
  [EnvCodes.STAGING]: "smaran-staging",
  [EnvCodes.PROD]: "smaran-prod",
};

/**
 * OAuth callback URLs. The mobile app uses an Expo-scheme URL
 * (`smaran://...`) for the deep link after hosted-UI sign-in; web
 * uses the standard origin. Each env gets its own set so a misrouted
 * callback can't accidentally land in the wrong env.
 */
export type OAuthCallbackConfig = {
  /** Where the Cognito hosted UI redirects after a successful sign-in. */
  callbackUrls: string[];
  /** Where the hosted UI redirects on sign-out. */
  signOutUrls: string[];
};

export const OAUTH_CALLBACKS_BY_ENV: Record<EnvCodes, OAuthCallbackConfig> = {
  [EnvCodes.LOCAL]: {
    callbackUrls: ["smaran://callback", "http://localhost:8081/auth/callback"],
    signOutUrls: ["smaran://signout", "http://localhost:8081/auth/signout"],
  },
  [EnvCodes.SANDBOX]: {
    callbackUrls: ["smaran://callback"],
    signOutUrls: ["smaran://signout"],
  },
  [EnvCodes.STAGING]: {
    callbackUrls: ["smaran://callback"],
    signOutUrls: ["smaran://signout"],
  },
  [EnvCodes.PROD]: {
    callbackUrls: ["smaran://callback"],
    signOutUrls: ["smaran://signout"],
  },
};

/**
 * Secrets Manager secret name holding the Google OAuth client
 * credentials, namespaced per env (`smaran/{env}/google-oauth`). Each
 * env's account holds its own secret because the Google Cloud Console
 * OAuth client differs per env (different redirect URIs).
 *
 * Secret payload (JSON):
 *   { "clientId": "...", "clientSecret": "..." }
 */
export function googleOAuthSecretName(envCode: EnvCodes): string {
  return `smaran/${envCode}/google-oauth`;
}

/**
 * Custom domain for the prod API. The `smaran.ayushporwal.com`
 * subdomain is delegated from the parent `ayushporwal.com` hosted
 * zone (which lives in the management account) into the prod
 * account. The CDK construct in `lib/constructs/dns.ts` creates a
 * new public hosted zone for the subdomain in the prod account;
 * a one-time manual step adds the delegation NS records to the
 * parent zone in the management account.
 *
 * Subdomain records managed in this stack:
 *   - api.smaran.ayushporwal.com  →  AppSync domain (Phase 5)
 *
 * Sandbox and staging keep the default `*.auth.{region}.amazoncognito.com`
 * Cognito hosted-UI domain — no custom DNS needed there.
 */
export const CUSTOM_DOMAIN = "smaran.ayushporwal.com";
export const CUSTOM_API_SUBDOMAIN = "api";
export const CUSTOM_API_FQDN = `${CUSTOM_API_SUBDOMAIN}.${CUSTOM_DOMAIN}`;
