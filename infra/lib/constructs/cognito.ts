// CognitoConstruct: user pool + hosted UI + Google OAuth identity
// provider + OAuth2.0 client. The mobile app opens the hosted UI in
// a browser, the user signs in with Google, the hosted UI redirects
// back to the app with an authorization code, and the app exchanges
// the code for tokens (handled in the mobile client, not here).
//
// Sign-in is Google-only. Self sign-up is disabled. Account recovery
// is email-based (Google already verified the email, so the
// verification message would just be noise).
import * as cdk from "aws-cdk-lib/core";
import * as cognito from "aws-cdk-lib/aws-cognito";
import { Construct } from "constructs";

import {
  COGNITO_DOMAIN_PREFIX_BY_ENV,
  EnvCodes,
  OAUTH_CALLBACKS_BY_ENV,
  Regions,
  retentionFor,
} from "../constants";

export interface CognitoConstructProps {
  envCode: EnvCodes;
  resourcePrefix: string;
  /**
   * Google OAuth 2.0 client ID. Create this in Google Cloud Console
   * (APIs & Services → Credentials → OAuth 2.0 Client IDs → Web
   * application). Pass via `CDK_CONTEXT_GOOGLE_CLIENT_ID` env var or
   * `-c googleClientId=...` flag. Required.
   *
   * Authorised redirect URIs in Google must include the hosted UI
   * domain returned by `hostedUiDomain`, e.g.
   *   https://smaran-sandbox.auth.eu-central-1.amazoncognito.com/oauth2/idpresponse
   */
  googleClientId: string;
  /** Google OAuth 2.0 client secret. Same source as `googleClientId`. */
  googleClientSecret: string;
}

export class CognitoConstruct extends Construct {
  public readonly userPool: cognito.UserPool;
  public readonly userPoolClient: cognito.UserPoolClient;
  public readonly userPoolDomain: cognito.UserPoolDomain;

  constructor(scope: Construct, id: string, props: CognitoConstructProps) {
    super(scope, id);

    const { envCode, resourcePrefix, googleClientId, googleClientSecret } = props;
    const retention = retentionFor(envCode);
    const callbacks = OAUTH_CALLBACKS_BY_ENV[envCode];

    // --- User Pool ---
    this.userPool = new cognito.UserPool(this, "UserPool", {
      userPoolName: `${resourcePrefix}-user-pool`,
      signInAliases: { email: true },
      // Google-only: no username/password. Self sign-up routes users
      // through the hosted UI flow which always lands on a Google IdP.
      selfSignUpEnabled: false,
      // Google already verified the email; skip the verification
      // message. Auto-verified attributes still need to be declared
      // so the pool doesn't send a "verify your email" email.
      autoVerify: { email: true },
      // Standard attributes to surface from the Google token. `email`
      // is required; `name` and `picture` are nice-to-haves for the
      // profile screen.
      standardAttributes: {
        email: { required: true, mutable: true },
        fullname: { required: false, mutable: true },
        profilePicture: { required: false, mutable: true },
      },
      mfa: cognito.Mfa.OFF,
      // No SMS; we're Google-only. accountRecovery falls back to
      // email-only.
      accountRecovery: cognito.AccountRecovery.EMAIL_ONLY,
      // Keep the pool around on stack delete in prod, wipe in
      // sandbox/staging.
      removalPolicy:
        retention === "retain" ? cdk.RemovalPolicy.RETAIN : cdk.RemovalPolicy.DESTROY,
      // Auto-delete on destroy only when retention is DESTROY.
      // Cognito user pools don't support autoDeleteObjects (that's
      // an S3 thing), so the removal policy is the only knob.
      deletionProtection: envCode === EnvCodes.PROD,
      // Standard email configuration. Cognito sends a "from" address
      // using a Cognito-managed identity. For prod you'll likely
      // want to swap this for SES (added in a later phase).
      email: cognito.UserPoolEmail.withCognito(),
      advancedSecurityMode: cognito.AdvancedSecurityMode.OFF,
    });

    // --- Google Identity Provider ---
    // The `attributeMapping` shape maps Google claims → Cognito
    // attributes. `sub` auto-maps to `username` (Cognito's
    // internal user handle) so two different Google accounts
    // sharing an email don't collide.
    const google = new cognito.UserPoolIdentityProviderGoogle(this, "Google", {
      userPool: this.userPool,
      clientId: googleClientId,
      clientSecretValue: cdk.SecretValue.unsafePlainText(googleClientSecret),
      scopes: ["openid", "email", "profile"],
      attributeMapping: {
        email: { attributeName: "email" },
        givenName: { attributeName: "given_name" },
        familyName: { attributeName: "family_name" },
        fullname: { attributeName: "name" },
        profilePicture: { attributeName: "picture" },
      },
    });

    // --- Hosted UI Domain ---
    // Cognito domain prefix must be globally unique within the
    // region. We pin a per-env prefix; if a parallel PR sandbox
    // collides, the PR deploy fails fast (which is the right
    // signal — bump the PR prefix and retry).
    this.userPoolDomain = this.userPool.addDomain("Domain", {
      cognitoDomain: {
        domainPrefix: COGNITO_DOMAIN_PREFIX_BY_ENV[envCode],
      },
    });

    // --- User Pool Client (the OAuth2.0 client the mobile app uses) ---
    this.userPoolClient = this.userPool.addClient("WebClient", {
      userPoolClientName: `${resourcePrefix}-web-client`,
      // No client secret — the mobile app is a public client
      // (authorization-code flow with PKCE). The hosted UI
      // validates the redirect URI matches one of `callbackUrls`.
      generateSecret: false,
      preventUserExistenceErrors: true,
      // SRP flow for SDKs that use it; authorization_code is the
      // primary flow for the hosted UI redirect.
      authFlows: {
        userSrp: true,
        userPassword: false,
      },
      oAuth: {
        flows: {
          authorizationCodeGrant: true,
          implicitCodeGrant: false,
        },
        scopes: [
          cognito.OAuthScope.OPENID,
          cognito.OAuthScope.EMAIL,
          cognito.OAuthScope.PROFILE,
        ],
        callbackUrls: callbacks.callbackUrls,
        logoutUrls: callbacks.signOutUrls,
      },
      // Token validity. Refresh tokens last 30 days so the mobile
      // app doesn't have to re-prompt the user too often.
      idTokenValidity: cdk.Duration.hours(1),
      accessTokenValidity: cdk.Duration.hours(1),
      refreshTokenValidity: cdk.Duration.days(30),
      enableTokenRevocation: true,
      supportedIdentityProviders: [cognito.UserPoolClientIdentityProvider.GOOGLE],
    });

    // Make the Google IdP a dependency of the client so the order
    // is deterministic on a fresh deploy.
    this.userPoolClient.node.addDependency(google);
  }

  /** The full hosted UI URL the mobile app opens in the browser. */
  public hostedUiUrl(): string {
    return `https://${this.userPoolDomain.domainName}.auth.${Regions.PRIMARY}.amazoncognito.com`;
  }
}
