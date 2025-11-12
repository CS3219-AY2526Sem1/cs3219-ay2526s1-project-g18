"use client";
import React, { useRef, useEffect, useState } from "react";
import { useChat } from "@ai-sdk/react";


type AiAssistantProps = {
  open: boolean;
  onClose: () => void;
};

export default function AiAssistant ({
  open,
  onClose,
}: AiAssistantProps) {
  const maxLength = 50
  const { messages, status, sendMessage } = useChat();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const submitMessage = async (text: string) => {
    if (!text.trim()) return;
    text = "User prompt: " + text
    const latestCode = "\nCode: " + currentCode
    const question = "\nQuestion: " + currentQuestion
    const message = text + latestCode
    await sendMessage({ text: message });
  };

  const [input, setInput] = useState("");
  const handleSubmit = (e:{ preventDefault: () => void }) => {
    e.preventDefault();
    submitMessage( input );
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
      return `Ask me anything (Max ${maxLength} characters)`
    }
  };


  const buttons = [
    { id: "explain-all", label: "Explain all current code.", text: "Provide a brief explanation of the code." },
    { id: "explain-buddy", label: "Explain my buddy's code", text: "Provide a brief explanation of the code the other person has written" },
    { id: "explain-question", label: "Explain the question", text: "Provide a brief explanation of the question" },
  ];

  return(
      <div className="text-white flex-1 px-4 py-4 flex flex-col justify-between overflow-hidden">
      {/* Buttons */}
      <div className="flex flex-col gap-4 flex-shrink-0">
        {buttons.map(button => (
          <button 
            key={button.id}
            onClick={() => submitMessage(button.text)}
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
                  return <span key={index}>{part.text}</span>;
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
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={status !== "ready"}
          className="flex-1 overflow-y-auto w-full bg-dark-box text-white px-4 py-2 rounded-lg resize-none h-24 border-none outline-none"
          maxLength={maxLength}
          placeholder={getPlaceholderText()}
        ></input>
      </div>
      </form>
  </div>
);
}