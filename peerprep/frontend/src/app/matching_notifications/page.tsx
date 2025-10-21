// Main matching page (displayed when matching service is first invoked)
// start matching service
"use client"
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function MatchingNotificationsPage() {
    const[userId, setUserId] = useState<number | null>(null)
    const[user, setUser] = useState<any>(null)
    const searchParams = useSearchParams();
    const topic = searchParams?.get("topic") ?? null;
    const difficulty = searchParams?.get("difficulty") ?? null;


    const router = useRouter();
    // Make sure user is logged in + get userId and also 
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
    async function requestMatch(topic: string, difficulty: string) {
        const response = await fetch('http://localhost:3002/requests', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId, topic, difficulty })
        });

        if (!response.ok) throw new Error('Failed to join queue');
        const data = await response.json();
        console.log('Response:', data);
        return data;
    }
    // Do it once userId is set
    useEffect(() => {
        if (userId && topic && difficulty) {
            requestMatch(topic, difficulty).catch((error) => {
                console.error('Error requesting match:', error);
            });
        }
    }, [userId, topic, difficulty]);
    return (
        <div>
            {}
            <h1 className="font-poppins text-4xl font-bold text-center mt-20">
                {"Topic: " + (topic ?? "N/A") + ", Difficulty: " + (difficulty ?? "N/A")}
                ...</h1>
        </div>
    );

}