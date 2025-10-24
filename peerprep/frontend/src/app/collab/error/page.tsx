'use client'

import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import { FaArrowLeft } from "react-icons/fa6"

// Dummy user details to be replaced with session storage retrieval later
const dummyUser = JSON.stringify({
    id: 1,
    username: "coolguy123"
})
const token = "dummyToken" 


export default function CollabErrorPage() {
  const router = useRouter()
  const[user, setUser] = useState<any>(null)
  const[token,setToken] = useState<string>("")
  const[userName, setUserName] =  useState<string>("")

  const timeout = false; // Placeholder for timeout logic

  useEffect(() => {
    //const user = sessionStorage.getItem("user");
    //const token = sessionStorage.getItem("token");
    // if (!user || !token) {
    //     router.push("/");
    //     console.error("You must be logged in to access this page.");
    // } else {
      
    const parsedUser = JSON.parse(dummyUser);
    setUser(parsedUser);
    setToken(token);
    if (!parsedUser.id || !parsedUser.username ) {
      router.push("/");
      console.error("Invalid user data in session storage:", parsedUser);
    } else {
      setUserName(parsedUser.username);
    }
    // }
  }, [])

  return (
    <div className="bg-dark-blue-bg h-screen w-screen flex items-center justify-center">
      <div className="bg-dark-box p-8 rounded-4xl w-[650px]">
        <div className="flex items-center justify-center flex-col space-y-10 w-full">
          <p className="font-poppins text-text-main text-4xl font-semibold ml-4">Session Disconnected :(</p>
          <p className="font-poppins text-text-main text-lg text-center px-10">Oops, a connection error occurred and you were disconnected from the session. We apologize for the inconvenience.</p>
          <button 
            className="bg-black/50 px-4 py-2 rounded-xl text-text-main font-poppins text-xl font-medium border-2 border-transparent hover:border-purple-outline"
          >
            <div className="flex flex-row justify-center items-center space-x-2">
                <FaArrowLeft className="h-6 w-6 mr-2"/>
                <span>Back to dashboard</span>
            </div>
        </button>
        </div>
      </div>
    </div>
  )
}