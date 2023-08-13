import React from "react";

import type { ChatState } from "@/app/page";

function ChatBaloonPointer({
  status,
  position,
  className,
}: {
  status?: string;
  position?: "right" | "left";
  className?: string;
}) {
  let fillColorClass;
  let positionClass;

  if (status === "success") {
    fillColorClass = "fill-green-500";
  } else if (status === "error") {
    fillColorClass = "fill-red-500";
  } else {
    fillColorClass = "fill-gray-400";
  }

  if (position === "right") {
    positionClass = "-right-[12px]";
  } else {
    positionClass = "-left-[12px] scale-x-[-1]"; /* flip on y axis */
  }

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className={`${fillColorClass} ${positionClass} ${className} absolute bottom-0 w-3 h-3`}
      viewBox="0 0 3 3"
    >
      <path d="m 0 3 L 1 3 L 3 3 C 2 3 0 1 0 0" />
    </svg>
  );
}

export default function ChatHistory({ state }: { state: ChatState }) {
  return (
    <>
      <div className="flex-grow overflow-y-auto p-4 border rounded-md flex flex-col gap-1 ">
        {state.chatHistory.map((e, index) => {
          if (
            index === state.chatHistory.length - 1 &&
            e.role === "assistant"
          ) {
            return (
              <div key={index}>
                <p
                  className={`relative  inline-block py-2 px-4 rounded-2xl rounded-bl-none ${
                    e.status === "success" ? "bg-green-500 " : "bg-gray-400"
                  }`}
                >
                  {state.latestChatResponse}
                  {state.isTypingActive && (
                    <span className="cursor-animation"></span>
                  )}
                  <ChatBaloonPointer status={e.status} position="left" />
                </p>
              </div>
            );
          } else if (e.role === "assistant") {
            return (
              <div key={index}>
                <p className="relative  inline-block py-2 px-4 bg-gray-400 rounded-2xl rounded-bl-none">
                  {e.content && JSON.parse(e.content).message}
                  <ChatBaloonPointer status={e.status} position="left" />
                </p>
              </div>
            );
          } else if (e.role === "user") {
            return (
              <div key={index} className="text-right ">
                <p className="relative inline-block py-2 px-4 bg-gray-400 rounded-2xl rounded-br-none">
                  {e.content && JSON.parse(e.content).message}
                  <ChatBaloonPointer status={e.status} position="right" />
                </p>
              </div>
            );
          }
          return null;
        })}
        {state.isLoading && (
          <p className="relative inline-block py-2 px-4 bg-gray-400 rounded-2xl rounded-bl-none w-12 mt-1">
            <span className="cursor-animation"> </span>
            <ChatBaloonPointer position="left" />
          </p>
        )}
      </div>
    </>
  );
}
