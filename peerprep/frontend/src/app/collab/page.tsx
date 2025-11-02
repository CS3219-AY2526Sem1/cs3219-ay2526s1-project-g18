"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getSocket, initSocket } from "@/app/socket/socket";
import { Check, Clock, X } from "lucide-react";

export default function CollabPage() {
  const router = useRouter();
  const [roomId, setRoomId] = useState<string | null>(null);
  const [user1, setUser1] = useState<string | null>(null);
  const [user2, setUser2] = useState<string | null>(null);
  const socket = getSocket();

  // Dummy data for mockup
  const question = 
  {
    "id": 1,
    "title": "LRU Cache",
    "createdAt": "2025-09-25T08:56:23.722Z",
    "description": "Design a data structure that follows the constraints of a Least Recently Used (LRU) cache.",
    "difficulty": "EASY",
    "topics": [
    "LINKED_LISTS",
    "HASHING"
    ],
    "published": true
  }


  useEffect(() => {
    initSocket(); // initSocket to only happen once on mount
    const params = new URLSearchParams(window.location.search);
    setRoomId(params.get("roomId"));
    setUser1(params.get("username1"));
    setUser2(params.get("username2"));
  }, []);

  const handleDisconnect = () => {
    if (!roomId) return (router.push("/"));

    try {
      socket?.disconnect();
    } catch (e) {
      console.warn("socket disconnect error", e);
    }
    // navigate away (change location as you like)
    router.push("/dashboard");
  };

  const handleFinish = () => {
    if (roomId) {
      // inform server that the session finished
      socket?.emit("finishSession", { roomId });
    }

    // simple client-side feedback — change as needed
    router.push("/dashboard");
  };

  return (
    <div className="bg-dark-blue-bg h-screen w-screen flex flex-col pt-7 px-6">
      <div className="flex items-start justify-between px-10">
        <div className="flex-col w-full">
          <div className="flex justify-between items-center mb-5">
            <div className="flex">
              <span className="font-inter text-logo-purple text-5xl font-bold">Peer</span>
              <span className="font-inter text-logo-green text-5xl font-bold">Prep</span>
            </div>
             <div className="flex gap-4">
            <button 
              className="border border-dg-button px-4 py-1.5 font-poppins text-xl text-dg-button rounded-lg"
            >
              <span>Connected at 23:45</span>
            </button>
            <button className="border border-red-button px-4 py-1.5 font-poppins text-xl text-text-red-button rounded-lg flex items-center gap-2">
              <Clock className="w-6 h-6" />
              <span>5 min left</span>
            </button>
          </div>
          </div>
          <div className="flex w-full justify-between items-center">
          <p className="font-poppins text-text-main text-3xl font-bold">
            Collaborative session with @{user2}
          </p>
          <div className="flex gap-4">
            <button 
              className="bg-dg-button p-3 font-poppins hover:bg-green-button-hover text-xl text-white rounded-lg flex items-center gap-2 hover:text-white"
              onClick={handleFinish}
            >
              <Check className="text-white h-6 w-6"/>
              <span>Finish</span>
            </button>
            <button className="bg-red-button p-3 font-poppins text-xl text-text-red-button rounded-lg flex items-center gap-2
                hover:bg-red-button-hover hover:text-white"
                    onClick={handleDisconnect}>
              <X className="w-6 h-6" />
              <span>Disconnect</span>
            </button>
          </div>
          </div>
        </div>
      </div>

      <div className="flex mt-10 bg-darkest-box rounded-4xl py-6 px-8 gap-10 h-full">
        {/* Question */}
        <div className="w-1/5">
          <p className="font-poppins text-text-main text-3xl font-bold">{question.title}</p>
           <div className="my-4 flex flex-row bg-dark-box px-4 w-fit py-3 rounded-4xl gap-4 items-center">
              <button
                className={
                  (question.difficulty === "EASY"
                    ? "bg-green-button-hover"
                    : question.difficulty === "MEDIUM"
                      ? "bg-yellow-button-hover"
                      : question.difficulty === "HARD"
                        ? "bg-red-button-hover"
                        : "bg-gray-300 text-black") +
                  " px-4 py-2 rounded-xl font-poppins text-lg"
                }
              >
                {question.difficulty ?? "Easy"}
              </button>
              <div className="bg-light-box w-1 h-10 rounded-4xl"></div>
              <h1 className="font-poppins text-logo-purple font-bold text-lg">
                {question.topics.join(" ")}</h1>
            </div>
          <p>{question.description}</p>
        </div>
        {/* Editor */}
        <div className="bg-black w-3/5 -mt-6">
          <p className="text-white">Code Editor Placeholder</p>
        </div>
        {/* AI assistant */}
        <div className="w-1/5">
          <p className="text-white">AI Assistant Placeholder</p>
        </div>

      </div>
    </div>
    // <main className="min-h-screen flex items-center justify-center bg-gray-50">
    //   <div className="w-full max-w-lg p-8 rounded-2xl shadow-md bg-white">
    //     <header className="mb-6">
    //       <h1 className="text-2xl font-semibold">Collaboration Room</h1>
    //       <p className="text-sm text-gray-500 mt-1">Room: {roomId ?? "—"}</p>
    //     </header>

    //     <section className="mb-6">
    //       <h2 className="text-lg font-medium mb-3">Participants</h2>
    //       <div className="flex gap-3">
    //         <div className="flex-1 p-4 rounded-xl border border-gray-200">
    //           <p className="text-xs text-gray-400">User 1</p>
    //           <p className="mt-1 font-medium">{user1 ?? "(not provided)"}</p>
    //         </div>

    //         <div className="flex-1 p-4 rounded-xl border border-gray-200">
    //           <p className="text-xs text-gray-400">User 2</p>
    //           <p className="mt-1 font-medium">{user2 ?? "(not provided)"}</p>
    //         </div>
    //       </div>
    //     </section>

    //     <section className="flex items-center justify-between">
    //       <button
    //         onClick={handleDisconnect}
    //         className="px-4 py-2 rounded-xl border border-red-400 text-red-600 hover:bg-red-50"
    //       >
    //         Disconnect
    //       </button>

    //       <button
    //         onClick={handleFinish}
    //         className="px-4 py-2 rounded-xl bg-blue-600 text-white hover:brightness-95"
    //       >
    //         Finish
    //       </button>
    //     </section>
    //   </div>
    // </main>
  );
}
