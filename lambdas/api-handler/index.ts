import type { ChatCompletionRequestMessage } from "openai";

import serverlessExpress from "@vendia/serverless-express";
import express from "express";

import { Configuration, OpenAIApi } from "openai";

import {
  APIGatewayProxyEventV2,
  // APIGatewayProxyResultV2,
  Context,
} from "aws-lambda";

const { OPENAI_KEY, HOME_IP } = process.env;
if (!OPENAI_KEY || !HOME_IP) {
  throw new Error("Missing environment variables");
}
const OPENAI_MODEL = "gpt-3.5-turbo";

const configuration = new Configuration({
  apiKey: OPENAI_KEY,
});
const openai = new OpenAIApi(configuration);

const app = express();

app.use(async (req, res, next) => {
  console.log(req.method, req.url, req.headers, JSON.stringify(req.body || {}));
  next();
});

app.use(async (req, res, next) => {
  // if request is outside of home ip drop it
  const ips = req?.headers?.["x-forwarded-for"] as string;
  const isHomeIp = ips
    .split(",")
    .map((ip) => ip.trim())
    .includes(HOME_IP);

  if (!isHomeIp) {
    console.log("unauthorized");
    return res
      .status(401)
      .set({
        "access-control-allow-origin": "*",
        "Cache-Control": "no-store",
      })
      .json({ message: "unauthorized" });
  } else {
    next();
  }
});

// Middleware to parse JSON in the request body
app.use(express.json());

const systemMessage: ChatCompletionRequestMessage = {
  role: "system",
  content: `
  You are an appointment scheduling bot designed to help users schedule appointments.
  Your main purpose is to return following JSON value after obtaining required information by the end of conversation:
  
  {
    "event": "new_appointment",
    "startTimeUnix": "${Math.round(Date.now() / 1000)}", 
    "appointmentReason": "Hair cut"
  }
  

  IMPORTANT: 
  1. Do not ask for confirmation after obtaining all the required values, "startTimeUnix" and "appointmentReason".
  2. When you obtained all the required information, only output the JSON value without any additional text.
  3. The "startTimeUnix" format should be in the Unix timestamp seconds format.
  4. Introduce yourself in first response. 

  EXAMPLE CONVERSATION:
  [
    {
      role: 'user',
      content: '{"currentUnixTimestamp":1691935054,"message":"hey there"}'
    },
    {
      role: 'assistant',
      content: '{"message": "Hello! I am an appointment scheduling bot. How can I assist you today?"}'
    },
    {
      role: 'user',
      content: '{"currentUnixTimestamp":1691935069,"message":"I want to set an appointment to get my nails done"}'
    },
    {
      role: 'assistant',
      content: '{"message": "Sure! I can help you with that. When would you like to schedule your appointment?"}'
    },
    {
      role: 'user',
      content: '{"currentUnixTimestamp":1691935091,"message":"tomorrow at 3 pm"}'
    },
    {
      role: 'assistant',
      content: '{"message": "Great! Tomorrow at 3 pm works. What is the reason for your appointment?"}'
    },
    {
      role: 'user',
      content: '{"currentUnixTimestamp":1691935101,"message":"like I said, to get my nails done"}'
    },
    {
      role: 'assistant',
      content: '{"event": "new_appointment", "startTimeUnix": "1692025200", "appointmentReason": "Get nails done"}'
    }
  ]
  `,
};
app.post("/interpret", async (req, res) => {
  const chatHistory: ChatCompletionRequestMessage[] = req.body.chatHistory;

  const chatCompletion = await openai.createChatCompletion({
    model: OPENAI_MODEL,
    max_tokens: 400,
    temperature: 0.3,
    messages: [systemMessage, ...chatHistory],
  });

  const gptAnswer = chatCompletion.data.choices[0].message;

  if (!gptAnswer?.content) {
    res
      .set({
        "access-control-allow-origin": "*",
        "Cache-Control": "no-store",
      })
      .json({
        errorMessage:
          "Our language model is not able to understand your question. Start new conversation.",
      });
  }

  // if event is produced save appointment and return 201
  if (JSON.parse(gptAnswer!.content!).event) {
    // TODO save appointment
    console.log("event produced", JSON.parse(gptAnswer!.content!));
    return res
      .set({
        "access-control-allow-origin": "*",
        "Cache-Control": "no-store",
      })
      .status(201)
      .send();
  }

  const newChatHistory = [...chatHistory, gptAnswer];
  console.log("newChatHistory", newChatHistory);

  return res
    .set({
      "access-control-allow-origin": "*",
      "Cache-Control": "no-store",
    })
    .json({ chatHistory: newChatHistory });
});

let expressInstance: any;
async function setup(event: APIGatewayProxyEventV2, context: Context) {
  console.log("Creating new express instance");
  expressInstance = serverlessExpress({ app });
  return expressInstance(event, context);
}

export function handler(event: APIGatewayProxyEventV2, context: Context) {
  if (expressInstance) return expressInstance(event, context);
  return setup(event, context);
}
