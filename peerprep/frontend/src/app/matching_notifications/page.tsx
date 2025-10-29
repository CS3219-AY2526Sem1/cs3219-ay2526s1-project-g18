// Main matching page (displayed when matching service is first invoked)
// start matching service
"use client"
import { useState, useEffect, useRef} from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { X } from "lucide-react";

const default_topic = "Arrays";
const default_difficulty = "Easy";
const dummy_userId = 999;
const MATCHING_API_BASE = "http://localhost:3002";

const difficultyInInt = (difficulty: any): string => {
    if (!difficulty) return "0";
    switch (difficulty.toLowerCase()) {
        case "easy":
            return "0";
        case "medium":
            return "1";
        case "hard":
            return "2";
        default:
            return "0";
    }
};

export default function MatchingNotificationsPage() {
    const[userId, setUserId] = useState<number |null>(null);
    const[user, setUser] = useState<any>(null)
    const searchParams = useSearchParams();
    const topic = searchParams?.get("topic") ?? default_topic;
    const difficulty = String(searchParams?.get("difficulty")) ?? default_difficulty;
    const hasJoinedQueue = useRef(false);


    const router = useRouter();
    //Make sure user is logged in + get userId
      useEffect(() => {
            const user = sessionStorage.getItem("user");
            const token = sessionStorage.getItem("token");
            if (!user || !token) {
                router.push("/");
                console.error("You must be logged in to access this page.");
            } else {
              
                const parsedUser = JSON.parse(user);
                setUser(parsedUser);
                if (!parsedUser.id || !parsedUser.username ) {
                    router.push("/");
                    console.error("Invalid user data in session storage:", parsedUser);
                } else {
                    setUserId(parseInt(parsedUser.id));
                }
            }
        }, [])
    // Start matching service call here using userId
    async function joinMatchQueue(userId: string | number, topic: string, difficulty: string) {
        const body = { id: String(userId), topic, difficulty: difficultyInInt(difficulty) };
        try{
            const response = await fetch(`${MATCHING_API_BASE}/requests`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
            });

            // server returns plain text on success
            if (!response.ok) {
                const txt = await response.text().catch(() => "");
                throw new Error(txt || `Failed to join queue (${response.status})`);
            }
            hasJoinedQueue.current = true;

            const text = await response.text().catch(() => "");
            console.log("Server response (text):", text);
            
        } catch (error) {
            console.error("Error joining match queue:", error);
            throw error;
        }
    }

    // End matching service call here using userId
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
            router.push('/dashboard'); // only navigate after success
        } catch (error) {
            console.error("Error leaving match queue:", error);
            // show UI feedback if you want (toast/modal)
        }
    }

    // Do it once userId is set (uses dummy for now until containerized and auth works)
    useEffect(() => {

        if (userId && topic && difficulty && !hasJoinedQueue.current) {
            joinMatchQueue(userId, topic, difficulty).catch((error) => {
                console.error('Error joining queue:', error);
                hasJoinedQueue.current = false; // reset so we can try again
            });
        }
    }, [userId, topic, difficulty]);
    return (
        <div className="bg-dark-blue-bg h-screen w-screen flex flex-col justify-center items-center pt-7 pl-12 pr-12">
            <div className="bg-darkest-box w-5xl rounded-3xl flex flex-col justify-center items-center p-6 gap-4">
                <div className="flex flex-row">
                    <span className="font-inter text-logo-purple text-8xl font-bold ">Peer</span>
                    <span className="font-inter text-logo-green text-8xl font-bold ">Prep</span>
                </div>
                <p className="font-poppins text-text-main text-3xl font-medium">
                    Finding you a match...</p>
                {/* Loading spinner: from https://flowbite.com/docs/components/spinner/ */} 
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
                onClick={() => {leaveMatchQueue(userId)}}>
                    <X className="w-8 h-8" />
                    <span>Disconnect</span>
                </button>
            </div>
        </div>
    );

}