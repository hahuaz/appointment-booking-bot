"use client";

import type { ChatCompletionRequestMessage } from "openai";

interface ChatCompletionRequestMessageCustom
  extends ChatCompletionRequestMessage {
  status?: "error" | "success";
}

export interface ChatState {
  errorMessage: string;
  chatHistory: ChatCompletionRequestMessageCustom[];
  isTypingActive: boolean;
  isLoading: boolean;
  latestChatResponse: string;
  prompt: string;
  isAppointmentBooked: boolean;
}

import { useEffect } from "react";
import { useImmer } from "use-immer";

import ChatHistory from "@/components/ChatHistory";

export default function Home() {
  const API_ENDPOINT =
    "https://43evbb35fh.execute-api.us-west-2.amazonaws.com/prod";
  const [state, setState] = useImmer<ChatState>({
    errorMessage: "",
    chatHistory: [],
    latestChatResponse: "",
    isTypingActive: false,
    isLoading: false,
    prompt: "",
    isAppointmentBooked: false,
  });

  useEffect(() => {
    if (
      state.chatHistory.length <= 0 ||
      state.chatHistory[state.chatHistory.length - 1].role !== "user"
    )
      return;
    getChatCompletion();
  }, [state.chatHistory]);

  const getChatCompletion = async () => {
    setState((draft) => {
      draft.isLoading = true;
    });
    const response = await fetch(`${API_ENDPOINT}/interpret`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        chatHistory: state.chatHistory,
      }),
    });
    if (response.status === 200) {
      const { chatHistory, errorMessage } = await response.json();

      if (errorMessage) {
        return setState((draft) => {
          draft.errorMessage = errorMessage;
          draft.isLoading = false;
        });
      }
      setState((draft) => {
        draft.chatHistory = chatHistory;
        draft.isLoading = false;
        // start type effect
        draft.isTypingActive = true;
      });

      let i = 0;
      const latestChatResponse = JSON.parse(
        chatHistory[chatHistory.length - 1].content
      ).message;

      const intervalId = setInterval(() => {
        setState((draft) => {
          draft.latestChatResponse = latestChatResponse.slice(0, i);
        });
        i++;

        if (i > latestChatResponse.length) {
          clearInterval(intervalId);
          setState((draft) => {
            draft.isTypingActive = false;
          });
        }
      }, 20);
    } else if (response.status === 201) {
      const customMessage: ChatCompletionRequestMessageCustom = {
        status: "success",
        role: "assistant",
        content: JSON.stringify({
          message: "Your appointment is booked successfully! Thank you!",
        }),
      };

      setState((draft) => {
        draft.chatHistory.push(customMessage);
        draft.isAppointmentBooked = true;
        draft.isLoading = false;
        // start type effect
        draft.isTypingActive = true;
      });

      let i = 0;
      const latestChatResponse = JSON.parse(customMessage.content!).message;

      const intervalId = setInterval(() => {
        setState((draft) => {
          draft.latestChatResponse = latestChatResponse.slice(0, i);
        });
        i++;

        if (i > latestChatResponse.length) {
          clearInterval(intervalId);
          setState((draft) => {
            draft.isTypingActive = false;
          });
        }
      }, 20);
    } else {
      setState((draft) => {
        draft.errorMessage = "Something went wrong. Check console!";
      });
      console.error(response);
      const data = await response.json();
      console.log(data);
    }
  };

  const submitNewPrompt = () => {
    if (state.isAppointmentBooked) return;
    setState((draft) => {
      draft.chatHistory.push({
        role: "user",
        content: JSON.stringify({
          currentUnixTimestamp: Math.round(Date.now() / 1000),
          message: state.prompt,
        }),
      });
      draft.prompt = "";
      draft.errorMessage = "";
    });
  };

  return (
    <main className="py-6 px-12 max-w-screen-2xl flex min-h-screen flex-col gap-3">
      <h1 className="font-semibold text-xl">Appointment Booking Bot:</h1>
      {state.errorMessage && (
        <div className="bg-red-500 text-white px-4 py-2 rounded-md mb-4">
          {state.errorMessage}
        </div>
      )}

      <ChatHistory state={state} />

      <div className="flex gap-3">
        <input
          type="text"
          name="new-prompt"
          id="new-prompt"
          value={state.prompt}
          placeholder="Enter your prompt..."
          onChange={(e) =>
            setState((draft) => {
              draft.prompt = e.target.value;
            })
          }
          disabled={state.isAppointmentBooked}
          onKeyDown={(e) => {
            if (e.key === "Enter" && state.prompt) {
              submitNewPrompt();
            }
          }}
          className="w-full px-4 py-2 text-gray-700 bg-white border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
        />
        <button
          onClick={submitNewPrompt}
          className={`px-4 py-2 text-white rounded-md  ${
            state.isAppointmentBooked
              ? "bg-gray-500"
              : "bg-blue-500 hover:bg-blue-600"
          }`}
          disabled={!state.prompt || state.isAppointmentBooked}
        >
          Submit
        </button>
      </div>
    </main>
  );
}
