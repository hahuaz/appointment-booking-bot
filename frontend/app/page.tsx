"use client";

import type { ChatCompletionRequestMessage } from "openai";

import { useEffect } from "react";
import { useImmer } from "use-immer";

export default function Home() {
  const API_ENDPOINT =
    "https://43evbb35fh.execute-api.us-west-2.amazonaws.com/prod";
  const [state, setState] = useImmer<{
    errorMessage: string;
    chatHistory: ChatCompletionRequestMessage[];
    newPrompt: string;
  }>({
    errorMessage: "",
    chatHistory: [],
    newPrompt: "",
  });

  useEffect(() => {
    if (
      state.chatHistory.length <= 0 ||
      state.chatHistory[state.chatHistory.length - 1].role !== "user"
    )
      return;
    getChatCompletion();
    // return () => {};
  }, [state.chatHistory]);

  const getChatCompletion = async () => {
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
        });
      }
      setState((draft) => {
        draft.chatHistory = chatHistory;
      });
    } else {
      setState((draft) => {
        draft.errorMessage = "Something went wrong. Check console!";
      });
      console.error(response);
      const data = await response.json();
      console.log(data);
    }
  };

  const handleNewPrompt = () => {
    setState((draft) => {
      draft.chatHistory.push({
        role: "user",
        content: JSON.stringify({
          currentUnixTimestamp: Math.round(Date.now() / 1000),
          userPrompt: state.newPrompt,
        }),
      });
      draft.newPrompt = "";
      draft.errorMessage = "";
    });
  };

  return (
    <main className="p-24 max-w-screen-2xl">
      {state.errorMessage && (
        <div className="bg-red-500 text-white px-4 py-2 rounded-md mb-4">
          {state.errorMessage}
        </div>
      )}
      <div className="grid grid-cols-2  gap-5">
        <div>
          <pre>{JSON.stringify(state.chatHistory, null, 2)}</pre>

          <input
            type="text"
            name="new-prompt"
            id="new-prompt"
            value={state.newPrompt}
            onChange={(e) =>
              setState((draft) => {
                draft.newPrompt = e.target.value;
              })
            }
            onKeyDown={(e) => {
              if (e.key === "Enter" && !state.newPrompt) {
                handleNewPrompt();
              }
            }}
            className="w-full px-4 py-2 text-gray-700 bg-white border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
          />
          <button
            onClick={handleNewPrompt}
            className="px-4 py-2 text-white bg-blue-500 rounded-md hover:bg-blue-600"
            disabled={!state.newPrompt}
          >
            Submit
          </button>
        </div>
      </div>
    </main>
  );
}
