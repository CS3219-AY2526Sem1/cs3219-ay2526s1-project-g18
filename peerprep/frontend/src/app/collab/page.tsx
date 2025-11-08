"use client";

import React, { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getSocket, initSocket } from "@/app/socket/socket";
import { Check, Clock, X, ChevronRight, Sparkles, MessageCircleMore } from "lucide-react";
import AlertModal, { AlertType } from "./components/AlertModal";
import CollabEditor from "./components/CollabEditor";
import ChatPopup from "./components/ChatPopup";

  // Dummy data for mockup
  const questionDummy = 
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
  };

export default function CollabPage() {
  const router = useRouter();
  const [roomId, setRoomId] = useState<string | null>(null);
  const [chatOpen, setChatOpen] = useState<boolean>(false);
  const [hasUnread, setHasUnread] = useState<boolean>(false);
  const [currentUser, setCurrentUser] = useState<string | null>(null);
  const [user1, setUser1] = useState<string | null>(null);
  const [user2, setUser2] = useState<string | null>(null);
  const [question, setQuestion] = useState<any>(questionDummy);
  const [isAIAssistantOpen, setIsAIAssistantOpen] = useState<boolean>(false);
  const [alertModal, setAlertModal] = useState<{ isOpen: boolean; type: AlertType }>({ 
    isOpen: false, 
    type: "reconnected" 
  });
  const [timeLeft, setTimeLeft] = useState<string>("");
  const [connectionStatus, setConnectionStatus] = useState<string>("Connected at 00:00");
  const [isReconnecting, setIsReconnecting] = useState<boolean>(false);
  const socket = getSocket();

  useEffect(() => {
    initSocket(); // initSocket to only happen once on mount
    const params = new URLSearchParams(window.location.search);
    setRoomId(params.get("roomId"));
    setUser1(params.get("username1"));
    setUser2(params.get("username2"));
    const userStr = sessionStorage.getItem("user");
    const parsed = userStr ? JSON.parse(userStr) : null;
    setCurrentUser(parsed?.username ?? params.get("user"));

    const qnDataStrFetched = params.get("questionDataStr");
    let qnData;
    if (qnDataStrFetched) {
      try {
        const parsed = JSON.parse(decodeURIComponent(qnDataStrFetched));
        // If backend passed an array (e.g. [ { ... } ] ), use the first element
        qnData = Array.isArray(parsed) ? parsed[0] : parsed;
      } catch (err) {
        console.error("Failed to parse questionDataStr:", err, " — falling back to dummy");
        qnData = questionDummy;
      }
    } else {
      qnData = questionDummy;
    }

    console.log("Fetched question data:", qnData);
    setQuestion(qnData);

    setConnectionStatus(`Connected at ${params.get("connectedAtTime") || "00:00"}`);
  
    // Socket event listeners
    if (socket) {
      // Connection events
      // socket.on('connect', () => {
      //   const now = new Date();
      //   const timeString = now.toLocaleTimeString('en-US', { 
      //     hour12: false, 
      //     hour: '2-digit', 
      //     minute: '2-digit' 
      //   });
      //   setConnectionStatus(`Connected at ${timeString}`);
      // });



      // Partner events
      socket.on('partnerDisconnected', () => {
        setAlertModal({ isOpen: true, type: "partner-disconnected" });
      });

      socket.on('partnerLeft', () => {
        setAlertModal({ isOpen: true, type: "partner-left" });
      });

      // Time events
      socket.on('5MinLeft', () => {
        setTimeLeft('5 min left');
      });

      socket.on('1MinLeft', () => {
        setTimeLeft('1 min left');
      });

      socket.on('timeUp', () => {
        setTimeLeft('Time up!');
        router.push('/dashboard');
      });

      // Reconnection events
      socket.on('disconnect', () => {
        setIsReconnecting(true);
          setAlertModal({ isOpen: true, type: "disconnected" });
      });

      socket.on('rejoinRoom', () => {
        setIsReconnecting(false);
        setAlertModal({ isOpen: true, type: "reconnected" });
      });

      // Cleanup listeners on unmount
      return () => {
        socket.off('connect');
        socket.off("sessionStart");
        socket.off('partnerJoined');
        socket.off('partnerDisconnected');
        socket.off('partnerLeft');
        socket.off('partnerFinished');
        socket.off('5MinLeft');
        socket.off('1MinLeft');
        socket.off('timeUp');
        socket.off('disconnect');
        socket.off('rejoinRoom');
      };
    }
  }, [socket, router]);

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

  // Demo function to show different alerts
  const showAlert = (type: AlertType) => {
    setAlertModal({ isOpen: true, type });
  };

  const closeAlert = () => {
    setAlertModal({ isOpen: false, type: alertModal.type });
  };

  useEffect(() => {
    if (!socket) return;
    const handleIncoming = (data: { text: string; sender: string; time: string; senderId?: string }) => {
      if (data.senderId && socket.id && data.senderId === socket.id) return; // skip own
      if (!chatOpen) setHasUnread(true); // mark unread
    };
    socket.on("chatMessage", handleIncoming);
    return () => {
      socket.off("chatMessage", handleIncoming);
    };
  }, [socket, chatOpen]);
  
  useEffect(() => {
    if (chatOpen) setHasUnread(false);
  }, [chatOpen]);  

  return (
    <div className="bg-dark-blue-bg min-h-screen flex flex-col pt-7 px-6">
      <div className="flex items-start justify-between px-10">
        <div className="flex-col w-full">
          <div className="flex justify-between items-center mb-5">
            <div className="flex">
              <span className="font-inter text-logo-purple text-5xl font-bold">Peer</span>
              <span className="font-inter text-logo-green text-5xl font-bold">Prep</span>
            </div>
             <div className="flex gap-4">
            <button 
              className={`border px-4 py-1.5 font-poppins text-xl rounded-lg ${
                isReconnecting 
                  ? 'border-yellow-outline text-yellow-outline' 
                  : 'border-dg-button text-dg-button'
              }`}
            >
              <span>{isReconnecting ? 'Reconnecting...' : connectionStatus}</span>
            </button>
            {timeLeft && (
              <button className={`border px-4 py-1.5 font-poppins text-xl rounded-lg flex items-center gap-2 ${
                timeLeft.includes('1 min') ? 'border-red-outline text-red-outline' :
                timeLeft.includes('5 min') ? 'border-yellow-outline text-yellow-outline' :
                'border-yellow-outline text-yellow-outline'
              }`}>
                <Clock className="w-6 h-6" />
                <span>{timeLeft}</span>
              </button>
            )}
          </div>
          </div>
          <div className="flex w-full justify-between items-center">
          <p className="font-poppins text-text-main text-3xl font-bold">
            Collaborative session with @{currentUser == user1 ? user2 : user1}
          </p>
          <div className="flex gap-4">
            <button 
              className="cursor-pointer bg-dg-button p-3 font-poppins hover:bg-green-button-hover text-xl text-white rounded-lg flex items-center gap-2 hover:text-white"
              onClick={handleFinish}
            >
              <Check className="text-white h-6 w-6"/>
              <span>Finish</span>
            </button>
            <button className="cursor-pointer bg-red-button p-3 font-poppins text-xl text-text-red-button rounded-lg flex items-center gap-2
                hover:bg-red-button-hover hover:text-white"
                    onClick={handleDisconnect}>
              <X className="w-6 h-6" />
              <span>Disconnect</span>
            </button>
          </div>
          </div>
        </div>
      </div>

      <div className="flex mt-10 bg-dark-box relative rounded-4xl h-[calc(95vh-200px)]">
        {/* Question */}
        <div className="w-1/5 px-4 py-6">
          <p className="font-poppins text-text-main text-3xl font-bold ml-4">
            {question?.title ?? "Loading question..."}
          </p>

          <div className="my-4 flex flex-row bg-dark-box px-4 w-fit py-3 rounded-4xl gap-4 items-center">
            <button
              className={
                (question?.difficulty === "EASY"
                  ? "bg-green-button-hover"
                  : question?.difficulty === "MEDIUM"
                    ? "bg-yellow-button-hover"
                    : question?.difficulty === "HARD"
                      ? "bg-red-button-hover"
                      : "bg-gray-300 text-black") +
                " px-4 py-1.5 rounded-xl font-poppins"
              }
            >
              {question?.difficulty ?? "Easy"}
            </button>

            <div className="bg-light-box w-1 h-10 rounded-4xl"></div>

            <h1 className="font-poppins text-logo-purple font-bold">
              {(question?.topics ?? []).join(" ")}
            </h1>
          </div>

          <p className="font-poppins text-lg ml-3">{question?.description ?? "Loading description..."}</p>
        </div>
        {/* Editor */}
        <div className={`bg-black transition-all duration-300 ${isAIAssistantOpen ? 'w-3/5' : 'w-4/5'}`}>
          <CollabEditor
              socket={socket}
              roomId={roomId}
              userName={currentUser ?? user1 ?? "You"}
          />
        </div>
        {!isAIAssistantOpen && <button className="hover:scale-120 cursor-pointer transition duration-300 absolute right-10 top-6" onClick={() => setIsAIAssistantOpen(true)}>
            <Sparkles className="w-6 h-6 text-white" />
        </button>}
        {/* AI assistant */}
        <div className={`transition-all duration-300 flex flex-col ${isAIAssistantOpen ? 'w-1/5' : 'w-0 hidden'}`}>
          <div className="pt-4 pb-4 px-4 bg-light-box rounded-tr-3xl flex items-center gap-2">
            <button
              onClick={() => setIsAIAssistantOpen(!isAIAssistantOpen)}
              className="text-white cursor-pointer hover:text-gray-300 transition-colors"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
            <p className={`text-white flex items-center gap-2 font-poppins text-xl font-bold transition-opacity duration-300`}>
              AI Assistant
              <Sparkles className="text-white w-4 h-4" />
            </p>
          </div>
 
          <div className="text-white flex-1 px-4 py-4 flex flex-col justify-between overflow-hidden">
            <div className="flex flex-col gap-4 flex-shrink-0">
              <div className="bg-dark-box rounded-lg px-4 py-2 cursor-pointer hover:bg-opacity-80 transition-colors">Explain all current code.</div>
              <div className="bg-dark-box rounded-lg px-4 py-2 cursor-pointer hover:bg-opacity-80 transition-colors">Explain my buddy's code</div>
              <div className="bg-dark-box rounded-lg px-4 py-2 cursor-pointer hover:bg-opacity-80 transition-colors">Explain the question</div>
            </div>
            <div className="mt-4 flex-shrink-0">
              <textarea
                className="w-full bg-dark-box text-white px-4 py-2 rounded-lg resize-none h-24 border-none outline-none"
                placeholder="Ask me anything"
              ></textarea>
            </div>
          </div>
        </div>
      </div>
      {/* Floating chat button and popup */}
      {!chatOpen && (
        <div className="fixed bottom-7 right-10 z-40">
          <button
            onClick={() => setChatOpen(true)}
            className="flex items-center gap-2 bg-logo-purple text-white text-lg font-bold px-6 py-3 rounded-2xl shadow-lg hover:bg-[#6235b1] transition-all relative"
            style={{ boxShadow: "0 7px 20px 2px #2823554d" }}
          >
            <span className="text-2xl"><MessageCircleMore className="w-7 h-7"/></span>
            Chat with buddy
            {hasUnread && (
              <span style={{ position: 'absolute', top: -3, right: -3, width: 18, height: 18, background: '#29EAC4', borderRadius: '50%', display: 'block', boxShadow: '0 0 0 2px #2d2d3c' }} />
            )}
          </button>
        </div>
      )}

      <ChatPopup
        open={chatOpen}
        onClose={() => setChatOpen(false)}
        buddyHandle={currentUser == user1 ? user2 ?? "@buddy" : user1 ?? "@buddy"}
        roomId={roomId}
        socket={socket}
        userName={currentUser ?? "You"}
      />
      {/* Alert Modal */}
      <AlertModal
        isOpen={alertModal.isOpen}
        type={alertModal.type}
        onClose={closeAlert}
      />
    </div>
  );
}
