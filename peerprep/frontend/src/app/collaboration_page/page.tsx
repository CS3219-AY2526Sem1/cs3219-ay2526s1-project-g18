"use client";

import React, { useEffect, useState } from "react";
// Adjust this import path to wherever you export your socket instance
import { getSocket, initSocket } from "@/app/socket/socket";

export default function CollabPage() {
  const [roomId, setRoomId] = useState<string | null>(null);
  const [user1, setUser1] = useState<string | null>(null);
  const [user2, setUser2] = useState<string | null>(null);
  const socket = getSocket();


  // read query params from URL (works in any browser-based React app)
  useEffect(() => {
    initSocket(); // keep this initSocket in the useEffect to only happen once on mount. it is very important.
    const params = new URLSearchParams(window.location.search); //IDK WHAT THIS DOES
    setRoomId(params.get("roomId"));
    setUser1(params.get("username1"));
    setUser2(params.get("username2"));
  }, []);

  const handleDisconnect = () => {
    //PLEASE CHANGE THIS TO USE THE NEXT.JS ROUTER INSTEAD
    if (!roomId) return (window.location.href = "/");  


    try {
      socket?.disconnect();
    } catch (e) {
      console.warn("socket disconnect error", e);
    }
    // navigate away (change location as you like) 
    //PLEASE CHANGE THIS TO USE THE NEXT.JS ROUTER INSTEAD
    window.location.href = "/dashboard";
  };

  const handleFinish = () => {
    if (roomId) {
      // inform server that the session finished
      socket?.emit("finishSession", { roomId });
    }

    // simple client-side feedback — change as needed
    //PLEASE CHANGE THIS TO USE THE NEXT.JS ROUTER INSTEAD
    window.location.href = "/dashboard";
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-lg p-8 rounded-2xl shadow-md bg-white">
        <header className="mb-6">
          <h1 className="text-2xl font-semibold">Collaboration Room</h1>
          <p className="text-sm text-gray-500 mt-1">Room: {roomId ?? "—"}</p>
        </header>

        <section className="mb-6">
          <h2 className="text-lg font-medium mb-3">Participants</h2>
          <div className="flex gap-3">
            <div className="flex-1 p-4 rounded-xl border border-gray-200">
              <p className="text-xs text-gray-400">User 1</p>
              <p className="mt-1 font-medium">{user1 ?? "(not provided)"}</p>
            </div>

            <div className="flex-1 p-4 rounded-xl border border-gray-200">
              <p className="text-xs text-gray-400">User 2</p>
              <p className="mt-1 font-medium">{user2 ?? "(not provided)"}</p>
            </div>
          </div>
        </section>

        <section className="flex items-center justify-between">
          <button
            onClick={handleDisconnect}
            className="px-4 py-2 rounded-xl border border-red-400 text-red-600 hover:bg-red-50"
          >
            Disconnect
          </button>

          <button
            onClick={handleFinish}
            className="px-4 py-2 rounded-xl bg-blue-600 text-white hover:brightness-95"
          >
            Finish
          </button>
        </section>
      </div>
    </main>
  );
}
