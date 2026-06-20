/**
 * Prod-only: public hosted zone for `smaran.ayushporwal.com`. Emits NS
 * records for one-time delegation from the parent `ayushporwal.com` zone
 * in the management account. Non-prod keeps default Cognito/AppSync domains.
 *
 * AppSync custom domain (ACM cert in us-east-1) is deferred — this stack
 * deploys to eu-central-1 and would need a cross-region stack.
 */
import * as cdk from 'aws-cdk-lib/core';
import * as route53 from 'aws-cdk-lib/aws-route53';
import { Construct } from 'constructs';

import { CUSTOM_DOMAIN, EnvCodes, retentionFor } from '../constants';

export interface DnsConstructProps {
  envCode: EnvCodes;
  resourcePrefix: string;
}

export class DnsConstruct extends Construct {
  public readonly hostedZone?: route53.HostedZone;

  constructor(scope: Construct, id: string, props: DnsConstructProps) {
    super(scope, id);

    if (props.envCode !== EnvCodes.PROD) return;

    const isRetain = retentionFor(props.envCode) === 'retain';

    this.hostedZone = new route53.HostedZone(this, 'HostedZone', {
      zoneName: CUSTOM_DOMAIN,
      comment: `smaran prod API (delegated from ayushporwal.com in management account)`,
    });

    new cdk.CfnOutput(this, 'DelegationNameServers', {
      value: cdk.Fn.join(',', this.hostedZone.hostedZoneNameServers ?? []),
      description:
        'Comma-separated NS records to add to ayushporwal.com in the management account. ' +
        'Record name: smaran.ayushporwal.com, type: NS, values: <this>.',
    });
    new cdk.CfnOutput(this, 'DelegatedZoneId', {
      value: this.hostedZone.hostedZoneId,
      description: 'Route53 hosted zone ID for the smaran.ayushporwal.com zone (prod account)',
    });

    if (isRetain) {
      cdk.Tags.of(this.hostedZone).add('retention', 'retain');
    }
  }
}
