import serverlessExpress from '@vendia/serverless-express';
import express from 'express';

import { Configuration, OpenAIApi } from 'openai';

import {
  APIGatewayProxyEventV2,
  // APIGatewayProxyResultV2,
  Context,
} from 'aws-lambda';

const { OPENAI_KEY, JWT_TOKEN, OPENAI_ORGANIZATION } = process.env;
if (!OPENAI_KEY || !JWT_TOKEN || !OPENAI_ORGANIZATION) {
  throw new Error('Missing environment variables');
}
const OPENAI_MODEL = 'gpt-3.5-turbo';

const configuration = new Configuration({
  apiKey: OPENAI_KEY,
  organization: OPENAI_ORGANIZATION,
});
const openai = new OpenAIApi(configuration);

const app = express();

app.use(async (req, res, next) => {
  console.log(req.method, req.url, req.headers, JSON.stringify(req.body || {}));
  next();
});

app.use(async (req, res, next) => {
  // if jwt bearer token is invalid drop the request
  const jwt = req?.headers?.authorization?.split(' ')[1];
  if (!(jwt === JWT_TOKEN)) {
    console.log('unauthorized');
    return res
      .status(401)
      .set({
        'access-control-allow-origin': '*',
        'Cache-Control': 'no-store',
      })
      .json({ message: 'unauthorized' });
  } else {
    next();
  }
});

// Middleware to parse JSON in the request body
app.use(express.json());
app.post('/interpret', async (req, res) => {
  const userInput = req.body.appointmentText;

  const chatCompletion = await openai.createChatCompletion({
    model: OPENAI_MODEL,
    temperature: 0.9,
    messages: [
      {
        role: 'system',
        content: `You are AppointmentBot, an automated service for scheduling appointments.
        Work with both relative and absolute time and date such as "bugün", "yarın", "bu Cuma", "30
        Temmuz" etc. from a message.
        You will be given single input and expected to return single output right away.
        Given a input such as {
          today:  2023-07-29T18:00
          userInput : "Yarin oglen 2'de musait misiniz?"
        } return JSON similar to the following:
        { intent: "new_appointment", datetimeStr: "2023-07-30T14:00" }
        If user's intent is not creating appointment, return
        { intent: "other" }
        `,
      },
      {
        role: 'user',
        content: JSON.stringify({
          today: new Date().toISOString(),
          userInput,
        }),
      },
    ],
  });

  const content = JSON.parse(
    chatCompletion?.data?.choices[0].message?.content as string
  );
  console.log(content);

  if (content?.intent != 'new_appointment') {
    return res
      .status(200)
      .set({
        'access-control-allow-origin': '*',
        'Cache-Control': 'no-store',
      })
      .send({ message: 'your intent is not about creating appointment' });
  } else {
    return res
      .set({
        'access-control-allow-origin': '*',
        'Cache-Control': 'no-store',
      })
      .json({ content });
  }
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
