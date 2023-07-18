import { aws_apigateway } from 'aws-cdk-lib';

import { Construct } from 'constructs';

import { ApiConstructProps } from '../app-stack';

export class ApiConstruct extends Construct {
  public readonly api: aws_apigateway.RestApi;

  constructor(scope: Construct, id: string, props: ApiConstructProps) {
    super(scope, id);

    const { apiHandler } = props;

    this.api = new aws_apigateway.RestApi(this, 'rest');

    this.api.root.addProxy({
      anyMethod: true,
      defaultIntegration: new aws_apigateway.LambdaIntegration(apiHandler),
    });
  }
}
