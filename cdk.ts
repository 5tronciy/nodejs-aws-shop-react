import * as cdk from 'aws-cdk-lib';

const app = new cdk.App();

const stack = new cdk.Stack(app, 'AppStack', {
  env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: process.env.CDK_DEFAULT_REGION },
});

const bucket = new cdk.aws_s3.Bucket(stack, 'AppBucket', {
  bucketName: 'rs-bucket-cdk',
});

const originAccessIdentity = new cdk.aws_cloudfront.OriginAccessIdentity(stack, 'AppBucketOAI', {
  comment: bucket.bucketName,
});

bucket.grantRead(originAccessIdentity);

const cloudFront = new cdk.aws_cloudfront.Distribution(stack, 'AppDistribution', {
  defaultBehavior: {
    origin: new cdk.aws_cloudfront_origins.S3Origin(bucket, {
      originAccessIdentity
    }),
    viewerProtocolPolicy: cdk.aws_cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
  },
  defaultRootObject: 'index.html',
  errorResponses: [
    {
      httpStatus: 404,
      responseHttpStatus: 200,
      responsePagePath: '/index.html',
    },
  ],
});

new cdk.aws_s3_deployment.BucketDeployment(stack, 'DeployApp', {
  destinationBucket: bucket,
  sources: [cdk.aws_s3_deployment.Source.asset('./dist')],
  distribution: cloudFront,
  distributionPaths: ['/*'],
});

new cdk.CfnOutput(stack, 'Domain URL', {
  value: cloudFront.distributionDomainName,
});