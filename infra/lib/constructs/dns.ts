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
//
// The ACM cert + alias record for `api.smaran.ayushporwal.com` is
// intentionally NOT created here. AppSync custom domains require
// the cert in `us-east-1` while this stack deploys to
// `eu-central-1`; we'd need a cross-region stack. AppSync custom
// domains are deferred to a follow-up phase — see HANDOFF.md §10.
// Until then, prod uses the default `*.appsync-api.eu-central-1.amazonaws.com`
// endpoint.
import * as cdk from "aws-cdk-lib/core";
import * as route53 from "aws-cdk-lib/aws-route53";
import { Construct } from "constructs";

import { CUSTOM_DOMAIN, EnvCodes, retentionFor } from "../constants";

export interface DnsConstructProps {
  envCode: EnvCodes;
  resourcePrefix: string;
}

export class DnsConstruct extends Construct {
  public readonly hostedZone?: route53.HostedZone;

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
        "Record name: smaran.ayushporwal.com, type: NS, values: <this>.",
    });
    new cdk.CfnOutput(this, "DelegatedZoneId", {
      value: this.hostedZone.hostedZoneId,
      description: "Route53 hosted zone ID for the smaran.ayushporwal.com zone (prod account)",
    });

    if (isRetain) {
      cdk.Tags.of(this.hostedZone).add("retention", "retain");
    }
  }
}
