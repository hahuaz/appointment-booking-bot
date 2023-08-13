import * as path from "path";
import * as cdk from "aws-cdk-lib";
import { aws_lambda } from "aws-cdk-lib";
import { Construct } from "constructs";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";

import { LambdaConstructProps } from "../app-stack";

export class LambdaConstruct extends Construct {
  public readonly exampleLambda: NodejsFunction;
  public readonly apiHandler: NodejsFunction;

  constructor(scope: Construct, id: string, props: LambdaConstructProps) {
    super(scope, id);

    // const { } = props;

    const { OPENAI_KEY, HOME_IP } = process.env;
    if (!OPENAI_KEY || !HOME_IP) {
      throw new Error("Missing environment variables");
    }

    this.apiHandler = new NodejsFunction(this, "apiHandler", {
      runtime: aws_lambda.Runtime.NODEJS_18_X,
      entry: path.join(__dirname, `/../../lambdas/api-handler/index.ts`),
      handler: "handler",
      reservedConcurrentExecutions: 10,
      timeout: cdk.Duration.seconds(15),
      bundling: {
        minify: false,
        commandHooks: {
          beforeBundling(inputDir: string, outputDir: string): string[] {
            return [];
          },
          afterBundling(inputDir: string, outputDir: string): string[] {
            return [`echo ${inputDir}, ${outputDir}`];
          },
          beforeInstall() {
            return [];
          },
        },
        forceDockerBundling: true,
      },
      environment: {
        OPENAI_KEY,
        HOME_IP,
      },
    });

    this.exampleLambda = new NodejsFunction(this, "exampleLambda", {
      memorySize: 128,
      timeout: cdk.Duration.seconds(5),
      runtime: aws_lambda.Runtime.NODEJS_18_X,
      handler: "handler",
      entry: path.join(__dirname, `/../../lambdas/example-lambda/index.ts`),
      bundling: {
        minify: false,
        forceDockerBundling: true, // force docker bundling for sharp
      },
    });
  }
}
