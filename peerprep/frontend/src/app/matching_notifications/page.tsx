// Main matching page (displayed when matching service is first invoked)
// start matching service
"use client"
import React from "react";
import { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getSocket } from "@/app/socket/socket";
import { useNavigationGuard } from "next-navigation-guard";
import { X, ArrowUpLeft } from "lucide-react";

// Event types from matching service (must match server-side values)
const MATCH_EVENT = "match";
const TIMEOUT_EVENT = "timeout";
const ERROR_EVENT = "error";
const CLOSE_EVENT = "close";
const JOIN_GENERAL_QUEUE_EVENT = "general";
const JOIN_NO_DIFFICULTY_QUEUE_EVENT = "nodifficulty";

const default_topic = "Arrays";
const default_difficulty = "Easy";
const MATCHING_API_BASE = "http://localhost:3002";
const socket = getSocket();

const difficultyInInt = (difficulty: any): string => {
  if (!difficulty) return "0";
  switch (String(difficulty).toLowerCase()) {
    case "easy": return "0";
    case "medium": return "1";
    case "hard": return "2";
    default: return "0";
  }
};

function isoToLocalHHMM(isoString: string): string {
  const d = new Date(isoString);
  if (isNaN(d.getTime())) return ''; // guard for invalid input
  // 24-hour format
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
}

export default function MatchingNotificationsPage() {
  const [userId, setUserId] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const searchParams = useSearchParams();
  const topic = searchParams?.get("topic") ?? default_topic;
  const difficulty = searchParams?.get("difficulty") ?? default_difficulty;

  // Refs to track navigation/queue state
  const isDisconnectButtonClicked = useRef(false);
  const hasJoinedQueue = useRef(false);

  // States for notifications
  const [matchingState, setMatchingState] = useState<'initial' | 'no_difficulty' | 'general' | 'matched' | 'timeout' | 'error'>('initial');
  const [matchData, setMatchData] = useState<any>(null);
  const [errorData, setErrorData] = useState<any>(null);
  const eventSourceRef = useRef<EventSource | null>(null);

  const router = useRouter();

  // Helper: parse event.data safely
  const safeParse = (data: string | null) => {
    if (!data) return null;
    try { return JSON.parse(data); } catch { return data; }
  };

  // Login check & get userId from sessionStorage
  useEffect(() => {
    const userStr = sessionStorage.getItem("user");
    const token = sessionStorage.getItem("token");
    if (!userStr || !token) {
      router.push("/");
      console.error("You must be logged in to access this page.");
      return;
    }
    try {
      const parsedUser = JSON.parse(userStr);
      setUser(parsedUser);
      setUserId(parsedUser.id);
    } catch (err) {
      console.error("Failed to parse user from sessionStorage", err);
      router.push("/");
    }
  }, [router]);

  // join queue POST
  async function joinMatchQueue(userId: string | number, topic: string, difficulty: string) {
    if (!userId) throw new Error("no userId provided to joinMatchQueue");
    const body = { id: String(userId), topic, difficulty: difficultyInInt(difficulty) };
    try {
      const response = await fetch(`${MATCHING_API_BASE}/requests`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!response.ok) {
        const txt = await response.text().catch(() => "");
        throw new Error(txt || `Failed to join queue (${response.status})`);
      }
      hasJoinedQueue.current = true;
      const text = await response.text().catch(() => "");
      console.log("Server response (join):", text);
    } catch (error) {
      console.error("Error joining match queue:", error);
      hasJoinedQueue.current = false;
      throw error;
    }
  }

  // leave queue DELETE
  async function leaveMatchQueue(userId: string | number | null) {
    if (!userId) {
      console.error("No userId provided to leaveMatchQueue");
      return;
    }
    const body = { id: String(userId) };
    try {
      const response = await fetch(`${MATCHING_API_BASE}/requests`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!response.ok) {
        const txt = await response.text().catch(() => "");
        throw new Error(txt || `Failed to leave queue (${response.status})`);
      }
      const text = await response.text().catch(() => "");
      console.log("Left queue (server text):", text);
      hasJoinedQueue.current = false;
    } catch (error) {
      console.error("Error leaving match queue:", error);
      // keep hasJoinedQueue unchanged (server might have already removed user)
    }
  }

  // Disconnect button — ensure we await server cleanup before navigation
  const onDisconnectButton = async () => {
    try {
      isDisconnectButtonClicked.current = true;
      await leaveMatchQueue(userId).then(() => { socket?.disconnect(); });
      // close local SSE if open
      try { eventSourceRef.current?.close(); } catch {}
      eventSourceRef.current = null;
      router.push("/dashboard");
    } catch (err) {
      console.error("Error while leaving queue on disconnect:", err);
    } 
  };

  // this is called when the matching service has already popped the user from the queue after no match was found
  const exitPageNoDisconnect = () => {
    // close local SSE if open
    isDisconnectButtonClicked.current = true; // override the navigation guard
    try { eventSourceRef.current?.close(); } catch {}
    eventSourceRef.current = null;
    socket?.disconnect();
    router.push("/dashboard");
  };


  // Navigation guard: prevents leaving while in queue unless confirmed
  useNavigationGuard({
    enabled: () => hasJoinedQueue.current,
    confirm: async () => {
      const ok = window.confirm("Confirm leave page? You may take longer to get a match");
      if (!ok) return false;
      if (!isDisconnectButtonClicked.current) {
        await leaveMatchQueue(userId).then(() => { socket?.disconnect(); });
      }
      return true;
    },
  });

  // SSE setup: open connection first, then join queue on open (prevents race)
  useEffect(() => {
    if (!userId) return;

    // Close any existing connection
    if (eventSourceRef.current) {
      try { eventSourceRef.current.close(); } catch {}
      eventSourceRef.current = null;
    }

    const base = (process.env.NEXT_PUBLIC_MATCHING_SERVICE_URL || MATCHING_API_BASE).replace(/\/+$/, '');
    const url = `${base}/notifications?userId=${encodeURIComponent(userId)}`;
    console.log("Opening SSE to:", url);

    const es = new EventSource(url);
    eventSourceRef.current = es;

    es.onopen = async () => {
      console.log("SSE connection established (client)");
      // join queue after SSE is open so the server can immediately notify us
      if (!hasJoinedQueue.current) {
        await joinMatchQueue(userId, topic, difficulty)
        .then(() => {
            console.log('Successfully joined match queue');
            socket?.connect();
        })
        .catch((error) => {
            console.error("Failed to join queue after SSE open:", error);
        });
      }
    };

    const onMatch = (event: MessageEvent) => {
      console.log("Match event received:", event.data);
      const data = safeParse(event.data);
      setMatchData(data);
      setMatchingState('matched');
      // close connection
      try { eventSourceRef.current?.close(); } catch {}
      eventSourceRef.current = null;
      hasJoinedQueue.current = false; // server likely removed user from queue
    };

    const onTimeout = (event: MessageEvent) => {
      console.log("Timeout event received:", event.data);
      setMatchingState('timeout');
      try { eventSourceRef.current?.close(); } catch {}
      eventSourceRef.current = null;
      hasJoinedQueue.current = false;
    };

    const onNoDifficulty = (event: MessageEvent) => {
      console.log("Joined no difficulty queue");
      setMatchingState('no_difficulty');
      // keep SSE open — server will notify later
    };

    const onGeneral = (event: MessageEvent) => {
      console.log("Joined general queue");
      setMatchingState('general');
      // keep SSE open
    };

    const onErrorEvent = (event: MessageEvent) => {
      console.log("Error event payload:", event.data);
      const data = safeParse(event.data);
      setErrorData(data);
      setMatchingState('error');
      try { eventSourceRef.current?.close(); } catch {}
      eventSourceRef.current = null;
      hasJoinedQueue.current = false;
    };

    const onCloseEvent = () => {
      console.log("SSE connection closed by server");
      try { eventSourceRef.current?.close(); } catch {}
      eventSourceRef.current = null;
      hasJoinedQueue.current = false;
    };

    // Attach listeners
    es.addEventListener(MATCH_EVENT, onMatch as EventListener);
    es.addEventListener(TIMEOUT_EVENT, onTimeout as EventListener);
    es.addEventListener(JOIN_NO_DIFFICULTY_QUEUE_EVENT, onNoDifficulty as EventListener);
    es.addEventListener(JOIN_GENERAL_QUEUE_EVENT, onGeneral as EventListener);
    es.addEventListener(ERROR_EVENT, onErrorEvent as EventListener);
    es.addEventListener(CLOSE_EVENT, onCloseEvent as EventListener);

    // Generic message (server-side "connected" message)
    const onMessage = (ev: MessageEvent) => {
      try {
        const payload = safeParse(ev.data);
        if (payload?.type === 'connected') {
          console.log('SSE server says connected (payload):', payload);
        }
      } catch (err) { /* ignore */ }
    };
    es.addEventListener('message', onMessage as EventListener);

    // Rely on EventSource's automatic reconnects on network failure; log errors
    es.onerror = (err) => {
      console.error("EventSource error:", err);
    };

    // Cleanup when component unmounts or userId changes
    return () => {
      try {
        es.removeEventListener(MATCH_EVENT, onMatch as EventListener);
        es.removeEventListener(TIMEOUT_EVENT, onTimeout as EventListener);
        es.removeEventListener(JOIN_NO_DIFFICULTY_QUEUE_EVENT, onNoDifficulty as EventListener);
        es.removeEventListener(JOIN_GENERAL_QUEUE_EVENT, onGeneral as EventListener);
        es.removeEventListener(ERROR_EVENT, onErrorEvent as EventListener);
        es.removeEventListener(CLOSE_EVENT, onCloseEvent as EventListener);
        es.removeEventListener('message', onMessage as EventListener);
      } catch (err) { /* ignore */ }
      try { es.close(); } catch {}
      if (eventSourceRef.current === es) eventSourceRef.current = null;
      hasJoinedQueue.current = false;
    };
  }, [userId, topic, difficulty]); // re-open if topic/difficulty changes

    socket?.on("sessionStart", (data: { roomId: string, username1: string, username2: string, connectedAtTime: string}) => {
        //delay for 5 seconds and then push to /collaboration_page
        console.log("Session starting in room:", data.roomId);
        const connectedTime = isoToLocalHHMM(data.connectedAtTime);
        console.log("Time connected:", data.connectedAtTime);
        setTimeout(() => {
            router.push(`/collab?roomId=${data.roomId}&username1=${data.username1 ?? ""}&username2=${data.username2 ?? ""}&connectedAtTime=${connectedTime ?? ""}`);
        }, 5000);
    });


  // ---------- UI (unchanged) ----------
  return (
    <>
      {matchingState === 'initial' && (
        // YOUR EXISTING INITIAL UI CODE HERE - KEEP IT EXACTLY AS IS
        <div className="bg-dark-blue-bg h-screen w-screen flex flex-col justify-center items-center pt-7 pl-12 pr-12">
          <div className="bg-darkest-box w-5xl rounded-3xl flex flex-col justify-center items-center p-6 gap-4">
            <div className="flex flex-row">
              <span className="font-inter text-logo-purple text-8xl font-bold ">Peer</span>
              <span className="font-inter text-logo-green text-8xl font-bold ">Prep</span>
            </div>
            <p className="font-poppins text-text-main text-3xl font-medium">
              Finding you a match...</p>
            <div role="status">
              <svg aria-hidden="true" className="mt-8 mb-8 w-40 text-gray-200 animate-spin dark:text-blue-button fill-logo-purple" viewBox="0 0 100 101" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z" fill="currentColor"/>
                <path d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z" fill="currentFill"/>
              </svg>
              <span className="sr-only">Loading...</span>
            </div>
            <p className="font-poppins text-2xl text-text-dark-purple">Compiling your perfect coding buddy...</p>
            <div className="flex flex-row bg-dark-box p-4 pl-10 pr-10 rounded-4xl gap-8 items-center">
              <button
                className={
                  (difficulty === "Easy"
                    ? "bg-easy-translucent hover:bg-green-button-hover "
                    : difficulty === "Medium"
                      ? "bg-medium-translucent hover:bg-yellow-button-hover"
                      : difficulty === "Hard"
                        ? "bg-hard-translucent hover:bg-red-button-hover"
                        : "bg-gray-300 text-black") +
                  " p-3 rounded-xl font-poppins text-3xl"
                }
              >
                {difficulty ?? "Easy"}
              </button>
              <div className="bg-light-box w-2 h-20 rounded-4xl"></div>
              <h1 className="font-poppins text-logo-purple text-3xl  font-bold  ">
                {topic}</h1>
            </div>
            <button className="bg-red-button p-3 font-poppins text-2xl text-text-red-button rounded-lg mt-5 flex items-center gap-2
                hover:bg-red-button-hover hover:text-white"
                    onClick={() => { onDisconnectButton(); }}>
              <X className="w-8 h-8" />
              <span>Disconnect</span>
            </button>
          </div>
        </div>
      )}
      {matchingState === 'no_difficulty' && (
        <div className="bg-dark-blue-bg h-screen w-screen flex flex-col justify-center items-center pt-7 pl-12 pr-12">
          <div className="bg-darkest-box w-5xl rounded-3xl flex flex-col justify-center items-center p-6 gap-4">
            <div className="flex flex-row">
              <span className="font-inter text-logo-purple text-8xl font-bold ">Peer</span>
              <span className="font-inter text-logo-green text-8xl font-bold ">Prep</span>
            </div>
            <p className="font-poppins text-text-main text-2xl font-medium ml-4 mr-4">
              No one online chose the same difficulty. Finding same topic...</p>
            <div role="status">
              <svg aria-hidden="true" className="mt-8 mb-8 w-40 text-gray-200 animate-spin dark:text-blue-button fill-logo-purple" viewBox="0 0 100 101" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z" fill="currentColor"/>
                <path d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z" fill="currentFill"/>
              </svg>
              <span className="sr-only">Loading...</span>
            </div>
            <p className="font-poppins text-2xl text-text-dark-purple">Finding best next match...</p>
            <div className="flex flex-row bg-dark-box p-4 pl-10 pr-10 rounded-4xl gap-8 items-center">
              <h1 className="font-poppins text-logo-purple text-3xl  font-bold  ">
                {topic}</h1>
            </div>
            <button className="bg-red-button p-3 font-poppins text-2xl text-text-red-button rounded-lg mt-5 flex items-center gap-2
                hover:bg-red-button-hover hover:text-white"
                    onClick={() => { onDisconnectButton(); }}>
              <X className="w-8 h-8" />
              <span>Disconnect</span>
            </button>
          </div>
        </div>
      )}
      {matchingState === 'general' && (
        <div className="bg-dark-blue-bg h-screen w-screen flex flex-col justify-center items-center pt-7 pl-12 pr-12">
          <div className="bg-darkest-box w-5xl rounded-3xl flex flex-col justify-center items-center p-6 gap-4">
            <div className="flex flex-row">
              <span className="font-inter text-logo-purple text-8xl font-bold ">Peer</span>
              <span className="font-inter text-logo-green text-8xl font-bold ">Prep</span>
            </div>
            <p className="font-poppins text-text-main text-2xl font-medium m-3">
             No one online chose the same topic. Let's find you a random partner...</p>
            <div role="status">
              <svg aria-hidden="true" className="mt-8 mb-8 w-40 text-gray-200 animate-spin dark:text-blue-button fill-logo-purple" viewBox="0 0 100 101" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z" fill="currentColor"/>
                <path d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z" fill="currentFill"/>
              </svg>
              <span className="sr-only">Loading...</span>
            </div>
            <p className="font-poppins text-2xl text-text-dark-purple">Finding random code buddy...</p>
            <button className="bg-red-button p-3 font-poppins text-2xl text-text-red-button rounded-lg mt-5 flex items-center gap-2
                hover:bg-red-button-hover hover:text-white"
                    onClick={() => { onDisconnectButton(); }}>
              <X className="w-8 h-8" />
              <span>Disconnect</span>
            </button>
          </div>
        </div>
      )}
      {matchingState === 'matched' && (
        <div className="bg-dark-blue-bg h-screen w-screen flex flex-col justify-center items-center pt-7 pl-12 pr-12">
          <div className="bg-darkest-box w-5xl rounded-3xl flex flex-col justify-center items-center p-6 gap-4">
            <div className="flex flex-row">
              <span className="font-inter text-logo-purple text-8xl font-bold ">Peer</span>
              <span className="font-inter text-logo-green text-8xl font-bold ">Prep</span>
            </div>
            <p className="font-poppins text-text-main text-3xl font-medium">
              Code buddy found!</p>
            <p className="font-poppins text-2xl text-text-dark-purple">Just a few seconds as we spin up your collaborative editor...</p>
            <div className="flex flex-row bg-dark-box p-4 pl-10 pr-10 rounded-4xl gap-8 items-center">
              <button
                className={
                  (difficulty === "Easy"
                    ? "bg-easy-translucent hover:bg-green-button-hover "
                    : difficulty === "Medium"
                      ? "bg-medium-translucent hover:bg-yellow-button-hover"
                      : difficulty === "Hard"
                        ? "bg-hard-translucent hover:bg-red-button-hover"
                        : "bg-gray-300 text-black") +
                  " p-3 rounded-xl font-poppins text-3xl"
                }
              >
                {difficulty ?? "Easy"}
              </button>
              <div className="bg-light-box w-2 h-20 rounded-4xl"></div>
              <h1 className="font-poppins text-logo-purple text-3xl  font-bold  ">
                {topic}</h1>
            </div>
          </div>
        </div>
      )}
      {matchingState === 'timeout' && (
        <div className="bg-dark-blue-bg h-screen w-screen flex flex-col justify-center items-center pt-7 pl-12 pr-12">
          <div className="bg-darkest-box w-5xl rounded-3xl flex flex-col justify-center items-center p-6 gap-4">
            <div className="flex flex-row">
              <span className="font-inter text-logo-purple text-6xl font-bold pt-5 ">Error: BuddyNotFound</span>
            </div>
            <p className="font-poppins text-text-main text-4xl text-center font-medium m-3">
             Sorry, we are unable to find you a match at the moment. Please try again later. :&#91;.</p>

            <p className="font-poppins text-2xl text-text-dark-purple"></p>
            <button className="bg-black-box p-5 font-poppins text-4xl text-text-main rounded-lg mt-5 flex items-center gap-2
                hover:bg-blue-button-hover hover:text-white"
                    onClick={() => { exitPageNoDisconnect(); }}>
              <ArrowUpLeft className="w-8 h-8"/>
              <span>Exit to dashboard</span>
            </button>
          </div>
        </div>
      )}
      {matchingState === 'error' && (
        <div className="flex items-center justify-center min-h-screen">
          <div className="p-8 bg-white rounded shadow">
            Error: {String(errorData ?? 'Unknown')}. <button onClick={() => onDisconnectButton()} className="ml-4 text-red-600">Disconnect</button>
          </div>
        </div>
      )}
    </>
  );
}
