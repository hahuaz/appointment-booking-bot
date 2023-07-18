import serverlessExpress from '@vendia/serverless-express';
import express from 'express';

import {
  APIGatewayProxyEventV2,
  // APIGatewayProxyResultV2,
  Context,
} from 'aws-lambda';

const { OPENAI_KEY } = process.env;
if (!OPENAI_KEY) {
  throw new Error('Missing environment variables');
}

const app = express();

app.use(async (req, res, next) => {
  console.log(req.method, req.url, req.headers, JSON.stringify(req.body || {}));
  next();
});

app.get('/test', async (req, res) => {
  res.send('Hello World!');
});

let expressInstance: any;
async function setup(event: APIGatewayProxyEventV2, context: Context) {
  console.log('Creating new express instance');
  expressInstance = serverlessExpress({ app });
  return expressInstance(event, context);
}

export function handler(event: APIGatewayProxyEventV2, context: Context) {
  if (expressInstance) return expressInstance(event, context);
  return setup(event, context);
}
