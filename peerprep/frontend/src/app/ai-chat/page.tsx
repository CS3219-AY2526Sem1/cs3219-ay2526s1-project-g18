'use client';

import { useState, useRef, useEffect } from 'react';
import { useChat } from '@ai-sdk/react';

export default function AIChatPage() {
  const { messages, status, sendMessage } = useChat();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const [input, setInput] = useState('');
  const handleSubmit = (e: { preventDefault: () => void; }) => {
    e.preventDefault();
    sendMessage({ text: input });
    setInput('');
  };
  
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 shadow-sm">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-bold text-gray-900">PeerPrep AI Assistant</h1>
          <p className="text-sm text-gray-600 mt-1">
            Get help with coding interview preparation, explanations, and examples
          </p>
        </div>
      </div>

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto px-6 py-4">
        <div className="max-w-4xl mx-auto space-y-6">
          {messages.length === 0 && (
            <div className="text-center py-12">
              <div className="bg-white rounded-lg p-8 shadow-sm border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Welcome to PeerPrep AI! 👋
                </h3>
                <p className="text-gray-600 mb-4">
                  I'm here to help you prepare for coding interviews. Ask me about:
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-gray-700">
                  <div className="bg-blue-50 p-3 rounded">🧩 Algorithm explanations</div>
                  <div className="bg-green-50 p-3 rounded">💻 Code examples</div>
                  <div className="bg-purple-50 p-3 rounded">📊 Data structures</div>
                  <div className="bg-orange-50 p-3 rounded">🎯 Problem-solving tips</div>
                </div>
              </div>
            </div>
          )}

          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-3xl rounded-lg px-4 py-3 ${
                  message.role === 'user'
                    ? 'bg-blue-500 text-white'
                    : 'bg-white border border-gray-200 text-gray-800 shadow-sm'
                }`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-semibold opacity-75">
                    {message.role === 'user' ? 'You' : 'PeerPrep AI'}
                  </span>
                </div>
                {message.parts.map((part, index) => {
                  switch (part.type) {
                    case 'text':
                      return <span key={index}>{part.text}</span>;

                    // other cases can handle images, tool calls, etc
                  }
                })}
              </div>
            </div>
          ))}

          {status != "ready" && (
            <div className="flex justify-start">
              <div className="bg-white border border-gray-200 rounded-lg px-4 py-3 shadow-sm">
                <div className="flex items-center gap-2">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                  <span className="text-sm text-gray-500">PeerPrep AI is thinking...</span>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Form */}
      <div className="bg-white border-t border-gray-200 px-6 py-4 shadow-lg">
        <div className="max-w-4xl mx-auto">
          <form onSubmit={handleSubmit} className="flex gap-4">
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Ask me anything about coding interviews..."
              disabled={status !== 'ready'}
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black disabled:opacity-50 disabled:cursor-not-allowed"
            />
            <button
              type="submit"
              disabled={status !== 'ready'}
              className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {status !== 'ready' ? 'Sending...' : 'Send'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}