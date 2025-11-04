"use client";
import React, { useRef, useEffect, useState } from "react";

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
  const [dbgCounts, setDbgCounts] = useState<{ sent: number; recv: number }>({ sent: 0, recv: 0 });

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
      console.log('[dbg] chatMessage incoming', data);
      if (data.senderId && socket && data.senderId === socket.id) return;
      setMessages((prev) => [
        ...prev,
        { sender: "buddy", text: data.text, time: data.time },
      ]);
      setDbgCounts((c) => ({ ...c, recv: c.recv + 1 }));
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
      style={{ width: "370px", boxShadow: "0px 7px 32px 2px #2823554d" }}
    >
      <div className="rounded-2xl bg-[#6838ad]">
        <div className="flex items-center justify-between px-5 py-3 rounded-t-2xl bg-[#6838ad]">
          <div className="flex items-center gap-2">
            <div className="text-2xl">💬</div>
            <div>
              <div className="font-bold text-white text-lg">Code buddy chat</div>
              <div className="text-xs text-[#eedaff]">{`with ${buddyHandle}`}</div>
            </div>
          </div>
          <button onClick={onClose}
            className="text-[#eedaff] text-2xl px-1 hover:text-white"
            aria-label="Close chat"
          >✕</button>
        </div>
        <div className="bg-[#dbcefa] px-5 py-4 min-h-[220px] max-h-[260px] overflow-y-auto rounded-b-lg">
          <div>
            {messages.map((msg, idx) => (
              <div key={idx} className={`mb-2 ${msg.sender === "me" ? "text-right" : "text-left"}`}>
                <div className={`inline-block px-3 py-2 rounded-lg ${msg.sender === "me" ? "bg-[#9266de] text-white" : "bg-[#f4f1ff] text-[#6838ad]"}`}>
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
        <form
          className="flex p-4 bg-[#dbcefa] rounded-b-2xl"
          onSubmit={e => {
            e.preventDefault();
            if (current.trim() === "" || !socket || !roomId) return;
            const time = new Date().toTimeString().slice(0, 5);
            console.log('[dbg] chatMessage emit', { roomId, text: current, sender: userName, time, senderId: socket.id });
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
            setDbgCounts((c) => ({ ...c, sent: c.sent + 1 }));
            setCurrent("");
          }}
        >
          <input
            className="flex-1 px-4 py-2 rounded-xl outline-none bg-white border-0 text-[#6838ad] placeholder-[#b7aadb] text-sm"
            placeholder="Type a message"
            value={current}
            onChange={e => setCurrent(e.target.value)}
            autoFocus
          />
          <button className="ml-2 bg-[#9266de] text-white p-2 rounded-full hover:bg-[#6235b1]" type="submit" aria-label="Send">
            <svg width="24" height="24" fill="none" className="inline" aria-hidden="true"><path d="M3 20v-6l9-4 9 4v6" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><path d="M16.2 8L12 3.5 7.8 8" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </button>
        </form>
      </div>
    </div>
  );
}
