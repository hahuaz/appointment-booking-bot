import * as cdk from 'aws-cdk-lib';
import { aws_iam, aws_lambda_nodejs } from 'aws-cdk-lib';

import { Construct } from 'constructs';

import { LambdaConstruct } from './constructs/lambda';
import { StorageConstruct } from './constructs/storage';
import { ApiConstruct } from './constructs/api';

export type LambdaConstructProps = any;
export type StorageConstructProps = any;
export type ApiConstructProps = {
  apiHandler: aws_lambda_nodejs.NodejsFunction;
};
export default class AppStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const { siteBucket } = new StorageConstruct(
      this,
      'storage',
      {} as StorageConstructProps
    );

    const { exampleLambda, apiHandler } = new LambdaConstruct(
      this,
      `lambda`,
      {} as LambdaConstructProps
    );

    new ApiConstruct(this, 'api', {
      apiHandler,
    } as ApiConstructProps);
  }
}
