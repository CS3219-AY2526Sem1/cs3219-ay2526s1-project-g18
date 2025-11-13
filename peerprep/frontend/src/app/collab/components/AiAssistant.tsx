//AI Assistance Disclosure:
//Tool: Gemini (model: 2.5 Flash), date: 2025-11-13
//Scope: Generated handleKeyDown function.

//Author review: I validated correctness used it as is.

"use client";
import React, { useRef, useEffect, useState } from "react";
import { useChat } from "@ai-sdk/react";

type AiAssistantProps = {
  open: boolean;
  onClose: () => void;
  question: string
};

const MAX_INPUT_LENGTH = 150
const MAX_PROMPT_ALLOWANCE = 3

export default function AiAssistant ({
  open,
  onClose,
  question
}: AiAssistantProps) {

  const { messages, status, sendMessage} = useChat();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const submitMessage = async (text: string, isUserPrompt: boolean) => {
    if (!text.trim()) return;
    const contextData = {
      questionContext: question || "No question provided.",
      codeContext: currentCode || "No code provided."
    }

    if (isUserPrompt && userPromptCount >= MAX_PROMPT_ALLOWANCE) {
      alert(`You have reached the maximum limit of ${MAX_PROMPT_ALLOWANCE} custom prompts.`);
      return;
    }

    await sendMessage({ text: text, metadata: contextData });
    if (isUserPrompt) {
      setUserPromptCount(count => count + 1);
    }
  };

  const [input, setInput] = useState("");
  const [userPromptCount, setUserPromptCount] = useState(0);

  const handleSubmit = (e:{ preventDefault: () => void }) => {
    e.preventDefault();
    submitMessage(input, true);
    setInput("");
  };  

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const getPlaceholderText = () => {
    if (status !== "ready") {
      return "Please wait..."
    } else {
      const promptsLeft = MAX_PROMPT_ALLOWANCE - userPromptCount;
      if (promptsLeft > 0) {
        return `Ask me anything! (You have ${promptsLeft} prompts left. Max ${MAX_INPUT_LENGTH} characters)`
      } else {
        return "You have no prompts left. You can still use the two buttons above."
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (status === "ready") {
        submitMessage(input, true);
        setInput("");
      }
    }
  };


  const buttons = [
    { id: "explain-all", label: "Explain all current code", text: "Provide a brief explanation of the code." },
    { id: "explain-question", label: "Explain the question", text: "Provide a brief explanation of the question." },
  ];

  return(
      <div className="text-white flex-1 px-4 py-4 flex flex-col justify-between overflow-hidden">
      {/* Buttons */}
      <div className="flex flex-col gap-4 flex-shrink-0">
        {buttons.map(button => (
          <button 
            key={button.id}
            onClick={() => submitMessage(button.text, false)}
            disabled={status !== "ready"}
            className="bg-dark-box rounded-lg px-4 py-2 cursor-pointer hover:bg-opacity-80 transition-colors"
          >
          {button.label} 
          </button>
        ))}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {messages.map((message) => {
          const isUser = message.role === "user";
          return (
            <div
              key={message.id}
              className={`max-w-[80%] px-3 py-2 rounded-lg break-words ${
                isUser ? "bg-blue-600 ml-auto text-white" : "bg-[#111118] text-white"
              }`}
            >
            {message.parts.map((part, index) => {
              switch (part.type) {
                case "text":
                  return <span key={index} className="whitespace-pre-wrap">{part.text}</span>;
              }
            })}
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input bar */}
      <form onSubmit={handleSubmit}>
      <div className="mt-4 flex-shrink-0">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={status !== "ready" || userPromptCount >= MAX_PROMPT_ALLOWANCE}
          onKeyDown={handleKeyDown}
          className="overflow-y-auto w-full bg-dark-box text-white px-4 py-2 rounded-lg resize-none h-24 border-none outline-none"
          maxLength={MAX_INPUT_LENGTH}
          placeholder={getPlaceholderText()}
        ></textarea>
      </div>
      </form>
  </div>
);
}