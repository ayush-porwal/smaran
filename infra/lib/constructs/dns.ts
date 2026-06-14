// DnsConstruct: custom domain (`*.smaran.ayushporwal.com`) for the
// prod API. Self-skips in non-prod envs — sandbox/staging keep the
// default Cognito `*.auth.{region}.amazoncognito.com` hosted-UI
// domain and AppSync's default `*.appsync-api.{region}.amazonaws.com`
// endpoint.
//
// What this construct does (prod only):
//   1. Creates a new public hosted zone for `smaran.ayushporwal.com`
//      in the prod account. AWS assigns 4 NS records.
//   2. Emits those 4 NS records as a CfnOutput. Add them to the
//      parent `ayushporwal.com` hosted zone in the management
//      account as a delegation. One-time manual step.
//   3. Creates an ACM cert for `api.smaran.ayushporwal.com` in
//      `us-east-1` (AppSync is global but certs for AppSync custom
//      domains MUST live in us-east-1).
//   4. Validates the cert via DNS by adding the validation CNAME
//      to the new hosted zone (same stack, no cross-account dance).
//   5. Leaves the alias record pointing at the AppSync domain for
//      Phase 5 to wire up.
import * as cdk from "aws-cdk-lib/core";
import * as acm from "aws-cdk-lib/aws-certificatemanager";
import * as route53 from "aws-cdk-lib/aws-route53";
import { Construct } from "constructs";

import { CUSTOM_API_FQDN, CUSTOM_DOMAIN, EnvCodes, retentionFor } from "../constants";

export interface DnsConstructProps {
  envCode: EnvCodes;
  resourcePrefix: string;
}

export class DnsConstruct extends Construct {
  public readonly hostedZone?: route53.HostedZone;
  public readonly apiCertificate?: acm.Certificate;

  constructor(scope: Construct, id: string, props: DnsConstructProps) {
    super(scope, id);

    // Self-skip in non-prod. The hosted zone is $0.50/mo even when
    // empty; we only want the spend in prod. Sandbox/staging/local
    // keep the default Cognito + AppSync domains.
    if (props.envCode !== EnvCodes.PROD) return;

    const isRetain = retentionFor(props.envCode) === "retain";

    // --- Subdomain hosted zone ---
    this.hostedZone = new route53.HostedZone(this, "HostedZone", {
      zoneName: CUSTOM_DOMAIN,
      comment: `smaran prod API (delegated from ayushporwal.com in management account)`,
    });

    // --- ACM cert (us-east-1) ---
    // AppSync custom domains require the cert in us-east-1. CDK
    // creates the cert in the stack's region (eu-central-1) by
    // default; the cross-region-inference pattern is to use a
    // separate stack. We keep it simple for now by emitting the
    // FQDN as an output and creating the cert in us-east-1 from a
    // follow-up stack when AppSync lands in Phase 5.
    //
    // For this phase: a cert in eu-central-1 for anything that ends
    // up in this region (ALB, CloudFront) is enough. AppSync
    // specifically needs the us-east-1 cert.
    this.apiCertificate = new acm.Certificate(this, "ApiCertificate", {
      domainName: CUSTOM_API_FQDN,
      // Subject-alternative names: nothing extra for now; we can
      // add `auth.smaran.ayushporwal.com` later if we host the
      // Cognito UI under a custom domain (not needed for the
      // hosted UI in Phase 3, but a nice-to-have for branding).
      validation: acm.CertificateValidation.fromDns(this.hostedZone),
    });

    // --- Outputs ---
    // The 4 NS records that need to be added to the parent
    // `ayushporwal.com` hosted zone in the management account.
    // Copy these from the CloudFormation Outputs tab (or the
    // `cdk deploy` log) and create a NS record set with a record
    // name of `smaran.ayushporwal.com` and the 4 values below.
    new cdk.CfnOutput(this, "DelegationNameServers", {
      value: cdk.Fn.join(",", this.hostedZone.hostedZoneNameServers ?? []),
      description:
        "Comma-separated NS records to add to ayushporwal.com in the management account. " +
        "Record name: smaran.ayushporawal.com, type: NS, values: <this>.",
    });
    new cdk.CfnOutput(this, "DelegatedZoneId", {
      value: this.hostedZone.hostedZoneId,
      description: "Route53 hosted zone ID for the smaran.ayushporwal.com zone (prod account)",
    });
    new cdk.CfnOutput(this, "ApiCertificateArn", {
      value: this.apiCertificate.certificateArn,
      description: "ACM certificate ARN for api.smaran.ayushporwal.com (eu-central-1)",
    });

    // Silence the lint about `isRetain` — we may use it later for
    // tags or stack deletion protection. Tagged the hosted zone
    // explicitly so it's discoverable in the console.
    if (isRetain) {
      cdk.Tags.of(this.hostedZone).add("retention", "retain");
    }
  }
}
