"use client";
import React, { useEffect, useState } from "react"
import { useRouter } from "next/navigation"

export default function AttemptHistoryOverviewPage() {
    // Ensure user is logged in and get userId
    const router = useRouter()
      const[user, setUser] = useState<any>(null)
      const[token,setToken] = useState<string>("")
      const[userName, setUserName] =  useState<string>("")
      const[userId, setUserId] = useState<number | null>(null)
    
     // Make sure user is logged in + get userId and also userName
      useEffect(() => {
            const user = sessionStorage.getItem("user");
            const token = sessionStorage.getItem("token");
            if (!user || !token) {
                router.push("/");
                console.error("You must be logged in to access this page.");
            } else {
                const parsedUser = JSON.parse(user);
                setUser(parsedUser);
                setToken(token);
                if (!parsedUser.id || !parsedUser.username ) {
                    router.push("/");
                    console.error("Invalid user data in session storage:", parsedUser);
                } else {
                    setUserName(parsedUser.username);
                    setUserId(parseInt(parsedUser.id));
                }
            }
        }, [])
        
    }