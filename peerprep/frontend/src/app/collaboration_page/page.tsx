"use client";

import React, { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import ChatPopup from './ChatPopup';
import { getSocket, initSocket } from "@/app/socket/socket";

const CollabEditor = dynamic(() => import("./CollabEditor"), { ssr: false });

export default function CollabPage() {
  const [roomId, setRoomId] = useState<string | null>(null);
  const [user1, setUser1] = useState<string | null>(null);
  const [user2, setUser2] = useState<string | null>(null);
  const [chatOpen, setChatOpen] = useState(false);
  const [socket, setSocket] = useState<any>(null);
  const [joinState, setJoinState] = useState<string>("idle");
  const [myName, setMyName] = useState<string | null>(null);

  // New: Disconnect/reconnect state
  const [disconnected, setDisconnected] = useState(false);
  const [unableToReconnect, setUnableToReconnect] = useState(false);
  const disconnectTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const s = initSocket();
    if (s) setSocket(s);
    const params = new URLSearchParams(window.location.search);
    setRoomId(params.get("roomId"));
    setUser1(params.get("username1"));
    setUser2(params.get("username2"));
    const userStr = sessionStorage.getItem("user");
    const parsed = userStr ? JSON.parse(userStr) : null;
    setMyName(parsed?.username ?? params.get("user"));
  }, []);

  useEffect(() => {
    if (!socket || !roomId) return;
    const userStr = sessionStorage.getItem("user");
    const parsed = userStr ? JSON.parse(userStr) : null;
    const resolvedUserId = parsed?.id;
    const username = myName ?? parsed?.username ?? "Anonymous";
    if (!resolvedUserId) {
      const fallback = () => {
        socket.emit('forceJoinRoom', { roomId, username });
        setJoinState('forceJoinRoom emitted');
      };
      if (socket.connected) fallback(); else socket.once('connect', fallback);
      return;
    }
    const join = () => {
      socket.emit("joinRoom", { roomId, userId: resolvedUserId, username });
      setJoinState("joinRoom emitted");
    };
    if (socket.connected) {
      join();
    } else {
      socket.once("connect", () => { join(); setJoinState("joinRoom emitted (post-connect)"); });
    }
    socket.on("error", (e: Error | any) => setJoinState(`error: ${e?.message || e}`));
    socket.on("roomFull", () => setJoinState('roomFull'));
    return () => {
      socket.off("error");
      socket.off("roomFull");
    }
  }, [socket, roomId, myName]);

  const buddyName = myName
    ? (myName === user1 ? user2 : myName === user2 ? user1 : user2)
    : (user2 ?? "Buddy");

  useEffect(() => {
    if (!socket) return;

    const handleDisconnect = () => {
      setDisconnected(true);
      setUnableToReconnect(false);

      disconnectTimerRef.current = setTimeout(() => {
        setUnableToReconnect(true);
        setTimeout(() => {
          window.location.href = '/dashboard';
        }, 1800);
      }, 2 * 60 * 1000);
    };

    const handleRejoinRoom = () => {
      setDisconnected(false);
      setUnableToReconnect(false);
      if (disconnectTimerRef.current) clearTimeout(disconnectTimerRef.current);
    };

    socket.on("disconnect", handleDisconnect);
    socket.on("rejoinRoom", handleRejoinRoom);

    return () => {
      socket.off("disconnect", handleDisconnect);
      socket.off("rejoinRoom", handleRejoinRoom);
      if (disconnectTimerRef.current) clearTimeout(disconnectTimerRef.current);
    };
  }, [socket]);

  const handleDisconnect = () => {
    if (!roomId) return (window.location.href = "/");
    try {
      socket?.disconnect();
    } catch (e) {}
    window.location.href = "/dashboard";
  };

  const handleFinish = () => {
    if (roomId) {
      socket?.emit("finishSession", { roomId });
    }
    window.location.href = "/dashboard";
  };

  return (
    <>
      {/* --- Main Page UI --- */}
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
          <div className="mb-8">
            <CollabEditor
              socket={socket}
              roomId={roomId}
              userName={myName ?? user1 ?? "You"}
            />
          </div>
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
      {/* Floating chat button and popup */}
      <div className="fixed bottom-7 right-10 z-40">
        <button
          onClick={() => setChatOpen(true)}
          className="flex items-center gap-2 bg-[#6838ad] text-white text-lg font-bold px-6 py-3 rounded-2xl shadow-lg hover:bg-[#6235b1] transition-all"
          style={{ boxShadow: "0 7px 20px 2px #2823554d" }}
        >
          <span className="text-2xl">💬</span>
          Chat with buddy
        </button>
      </div>
      <ChatPopup
        open={chatOpen}
        onClose={() => setChatOpen(false)}
        buddyHandle={buddyName ?? "@buddy"}
        roomId={roomId}
        socket={socket}
        userName={myName ?? user1 ?? "You"}
      />

      {/* --- Disconnect and unable-to-reconnect notifications --- */}
      {disconnected && !unableToReconnect && (
        <div className="fixed top-0 left-0 w-screen h-screen flex items-center justify-center z-50 bg-black/45">
          <div className="rounded-2xl py-8 px-16 bg-[#903948] text-white text-center text-3xl font-bold drop-shadow-xl flex flex-col items-center gap-6 scale-100">
            <div className="text-6xl mb-2">📶</div>
            Disconnected from session<br />
            <span className="text-xl font-normal block mt-2">
              Trying to reconnect…<br />
              <span className="opacity-60 text-base font-light">
                Please double-check your internet connection
              </span>
            </span>
          </div>
        </div>
      )}
      {unableToReconnect && (
        <div className="fixed top-0 left-0 w-screen h-screen flex items-center justify-center z-50 bg-black/70">
          <div className="rounded-2xl py-8 px-16 bg-[#af4454] text-white text-center text-3xl font-bold drop-shadow-xl flex flex-col items-center gap-6 scale-100">
            <div className="text-6xl mb-2">🕑</div>
            Unable to rejoin room<br />
            <span className="text-xl font-normal block mt-2">
              Redirecting you to the dashboard…
            </span>
          </div>
        </div>
      )}
    </>
  );
}
