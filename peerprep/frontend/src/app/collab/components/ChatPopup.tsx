"use client";
import React, { useRef, useEffect, useState } from "react";
import { Send } from "lucide-react";

type Message = {
  sender: "me" | "buddy";
  text: string;
  time: string;
};

type ChatPopupProps = {
  open: boolean;
  onClose: () => void;
  buddyHandle: string;
  roomId: string | null;
  socket?: any;
  userName: string;
};

export default function ChatPopup({
  open,
  onClose,
  buddyHandle,
  roomId,
  socket,
  userName,
}: ChatPopupProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [current, setCurrent] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // SCROLL TO BOTTOM
  useEffect(() => {
    if (open && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [open, messages]);

  // RECEIVE CHAT EVENTS
  useEffect(() => {
    if (!socket) return;
    const handleIncoming = (data: { text: string; sender: string; time: string; senderId?: string }) => {
      // Avoid showing my sent message twice (since I append it on send)
      if (data.senderId && socket && data.senderId === socket.id) return;
      setMessages((prev) => [
        ...prev,
        { sender: "buddy", text: data.text, time: data.time },
      ]);
    };
    socket.on("chatMessage", handleIncoming);
    return () => {
      socket.off("chatMessage", handleIncoming);
    };
  }, [socket, userName]);

  if (!open) return null;

  return (
    <div
      className="fixed bottom-28 right-10 z-50"
      style={{
        width: "370px",
        background: "#e8ddfb",
        borderRadius: "1.25rem", // rounded-2xl
        overflow: "hidden",
        boxShadow: "0px 7px 32px 2px #2823554d",
      }}
    >
      <div>
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4" style={{ background: "#6838ad" }}>
          <div className="flex items-center gap-2">
            <span className="text-2xl">💬</span>
            <div>
              <div className="font-bold text-white text-xl">Code buddy chat</div>
              <div className="text-xs text-[#eedaff]">{`with ${buddyHandle}`}</div>
            </div>
          </div>
          <button onClick={onClose}
            className="text-[#eedaff] text-3xl px-2 hover:text-white"
            aria-label="Close chat"
            style={{ lineHeight: "1" }}
          >✕</button>
        </div>
        {/* Messages area */}
        <div
          className="px-5 py-6"
          style={{
            minHeight: "180px",
            maxHeight: "250px",
            background: "#e8ddfb",
            overflowY: "auto"
          }}
        >
          <div>
            {messages.map((msg, idx) => (
              <div key={idx} className={`mb-4 ${msg.sender === "me" ? "text-right" : "text-left"}`}>
                <div className={`inline-block px-4 py-2 rounded-xl ${msg.sender === "me"
                  ? "bg-white text-[#6838ad]"
                  : "bg-[#f3eeff] text-[#6838ad]"}`}>
                  {msg.text}
                </div>
                <div className="text-xs text-[#8680a3] mt-1">
                  {msg.sender === "me" ? userName : buddyHandle} {msg.time}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef}></div>
          </div>
        </div>
        {/* Input row */}
        <form
          className="flex items-center gap-2 p-5"
          style={{ background: "#e8ddfb" }}
          onSubmit={e => {
            e.preventDefault();
            if (current.trim() === "" || !socket || !roomId) return;
            const time = new Date().toTimeString().slice(0, 5);
            socket.emit("chatMessage", {
              roomId,
              text: current,
              sender: userName,
              time,
              senderId: socket.id,
            });
            setMessages(prev => [
              ...prev,
              { sender: "me", text: current, time },
            ]);
            setCurrent("");
          }}
        >
          <input
            className="flex-1 px-4 py-3 rounded-xl outline-none bg-white border-0 text-[#855ec9] placeholder-[#b7aadb] text-base"
            placeholder="Type a message"
            value={current}
            onChange={e => setCurrent(e.target.value)}
            autoFocus
            style={{ border: "none" }}
          />
          <button
            className="bg-[#a892d1] text-white p-4 rounded-full hover:bg-[#836fb2] flex items-center justify-center"
            type="submit"
            aria-label="Send"
          >
            <Send size={28} strokeWidth={2.4} />
          </button>
        </form>
      </div>
    </div>
  );
}
