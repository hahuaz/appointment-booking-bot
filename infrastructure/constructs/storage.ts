import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { aws_s3 } from 'aws-cdk-lib';

import { StorageConstructProps } from '../app-stack';

export class StorageConstruct extends Construct {
  public readonly siteBucket: aws_s3.Bucket;

  constructor(scope: Construct, id: string, props: StorageConstructProps) {
    super(scope, id);

    // const {  } = props;
    // const BRANCH = this.node.tryGetContext('BRANCH');
    // const { APP_REGION } =
    //   this.node.tryGetContext(BRANCH);

    // BUCKETS
    this.siteBucket = new aws_s3.Bucket(this, 'siteBucket', {
      publicReadAccess: true,
      blockPublicAccess: aws_s3.BlockPublicAccess.BLOCK_ACLS,
      accessControl: aws_s3.BucketAccessControl.BUCKET_OWNER_FULL_CONTROL,
      websiteIndexDocument: 'index.html',
      autoDeleteObjects: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    new cdk.CfnOutput(this, 'bucketWebsiteUrl', {
      value: this.siteBucket.bucketWebsiteUrl,
      description: 'bucketWebsiteUrl',
    });
    new cdk.CfnOutput(this, 's3UrlForObject', {
      value: this.siteBucket.s3UrlForObject(),
      description: 's3UrlForObject',
    });
  }
}
