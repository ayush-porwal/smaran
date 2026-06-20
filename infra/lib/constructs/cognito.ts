import * as cdk from "aws-cdk-lib/core";
import * as cognito from "aws-cdk-lib/aws-cognito";
import * as secretsmanager from "aws-cdk-lib/aws-secretsmanager";
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
   * `smaran/{env}/google-oauth` in Secrets Manager — JSON `{ clientId, clientSecret }`.
   * Created manually per env; CDK references it via a dynamic reference so plaintext
   * never enters the template. Google redirect URIs must include this env's hosted UI domain.
   */
  googleOAuthSecret: secretsmanager.ISecret;
}

export class CognitoConstruct extends Construct {
  public readonly userPool: cognito.UserPool;
  public readonly userPoolClient: cognito.UserPoolClient;
  public readonly userPoolDomain: cognito.UserPoolDomain;

  constructor(scope: Construct, id: string, props: CognitoConstructProps) {
    super(scope, id);

    const { envCode, resourcePrefix, googleOAuthSecret } = props;
    const retention = retentionFor(envCode);
    const callbacks = OAUTH_CALLBACKS_BY_ENV[envCode];

    this.userPool = new cognito.UserPool(this, "UserPool", {
      userPoolName: `${resourcePrefix}-user-pool`,
      signInAliases: { email: true },
      selfSignUpEnabled: false,
      // Google already verified the email; autoVerify still needed so
      // the pool doesn't send a "verify your email" message.
      autoVerify: { email: true },
      standardAttributes: {
        email: { required: true, mutable: true },
        fullname: { required: false, mutable: true },
        profilePicture: { required: false, mutable: true },
      },
      mfa: cognito.Mfa.OFF,
      accountRecovery: cognito.AccountRecovery.EMAIL_ONLY,
      removalPolicy:
        retention === "retain"
          ? cdk.RemovalPolicy.RETAIN
          : cdk.RemovalPolicy.DESTROY,
      // Cognito user pools don't support autoDeleteObjects (that's an
      // S3 thing), so removalPolicy is the only retention knob.
      deletionProtection: envCode === EnvCodes.PROD,
      email: cognito.UserPoolEmail.withCognito(),
      advancedSecurityMode: cognito.AdvancedSecurityMode.OFF,
    });

    // `attributeMapping`: Google `sub` auto-maps to Cognito `username`
    // so two Google accounts sharing an email don't collide.
    //
    // `UserPoolIdentityProviderGoogleProps.clientId` is typed as
    // `string` (the CFN schema only accepts a literal string for
    // ProviderDetails.ClientID), but the underlying token is a
    // `SecretValue` and the `@aws-cdk/core:checkSecretUsage` flag
    // would block `SecretValue.resolve()` from producing the dynamic
    // reference. `.unsafeUnwrap()` strips the SecretValue wrapper
    // while preserving the underlying token — the template still
    // contains `{{resolve:secretsmanager:...}}`, never plaintext.
    const google = new cognito.UserPoolIdentityProviderGoogle(this, "Google", {
      userPool: this.userPool,
      clientId: googleOAuthSecret
        .secretValueFromJson("clientId")
        .unsafeUnwrap(),
      clientSecretValue: googleOAuthSecret.secretValueFromJson("clientSecret"),
      scopes: ["openid", "email", "profile"],
      attributeMapping: {
        email: { attributeName: "email" },
        givenName: { attributeName: "given_name" },
        familyName: { attributeName: "family_name" },
        fullname: { attributeName: "name" },
        profilePicture: { attributeName: "picture" },
      },
    });

    // Domain prefix must be globally unique within the region. Parallel
    // PR sandboxes that collide fail fast — bump the PR prefix and retry.
    this.userPoolDomain = this.userPool.addDomain("Domain", {
      cognitoDomain: {
        domainPrefix: COGNITO_DOMAIN_PREFIX_BY_ENV[envCode],
      },
    });

    this.userPoolClient = this.userPool.addClient("WebClient", {
      userPoolClientName: `${resourcePrefix}-web-client`,
      // Public client: authorization-code flow with PKCE (no secret).
      generateSecret: false,
      preventUserExistenceErrors: true,
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
      idTokenValidity: cdk.Duration.hours(1),
      accessTokenValidity: cdk.Duration.hours(1),
      refreshTokenValidity: cdk.Duration.days(30),
      enableTokenRevocation: true,
      supportedIdentityProviders: [
        cognito.UserPoolClientIdentityProvider.GOOGLE,
      ],
    });

    // Deterministic deploy order on a fresh stack.
    this.userPoolClient.node.addDependency(google);
  }

  public hostedUiUrl(): string {
    return `https://${this.userPoolDomain.domainName}.auth.${Regions.PRIMARY}.amazoncognito.com`;
  }
}
