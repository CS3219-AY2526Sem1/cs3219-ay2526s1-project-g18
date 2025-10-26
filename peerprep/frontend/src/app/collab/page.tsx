'use client'

import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import Loader from "../components/Loader"
import { FaX, FaArrowLeft } from "react-icons/fa6"

// Dummy user details to be replaced with session storage retrieval later
const dummyUser = JSON.stringify({
    id: 1,
    username: "coolguy123"
})
const token = "dummyToken" 


export default function CollabPage() {
  const router = useRouter()
  const[user, setUser] = useState<any>(null)
  const[token,setToken] = useState<string>("")
  const[userName, setUserName] =  useState<string>("")

  const timeout = true; // Placeholder for timeout logic

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
        {!timeout && <div className="h-[697px] flex flex-col items-start justify-between">
          <div className="flex items-center justify-center flex-col space-y-3 w-full">
            <div className="flex flex-row">
              <span className="font-inter text-logo-purple text-6xl font-bold">Peer</span>
              <span className="font-inter text-logo-green text-6xl font-bold">Prep</span>
            </div>
            <p className="font-poppins text-text-main text-4xl font-medium ml-4 my-3">Finding you a match...</p>
          </div>
          <div className="mx-auto">
            <Loader />
          </div>

          <div className="flex w-full justify-center items-center flex-col space-y-6">
            <p className="font-poppins text-text-main/50 text-lg">Compiling your perfect coding buddy...</p>
            <div className="rounded-full flex items-center bg-logo-purple/10 py-4 px-8 gap-4 text-xl">
              <p className="font-bold font-poppins text-white bg-emerald-700/60 px-6 py-2 rounded">Easy</p>
              <div className="w-1 h-8 bg-logo-purple/50 my-1"></div>
              <p className="font-poppins font-bold text-logo-purple">Dynamic Programming</p>
            </div>
            <button 
              className="bg-red-button px-4 py-2 rounded-xl text-text-red-button font-poppins text-xl font-medium hover:border-purple-outline hover:border-2 hover:bg-red-button-hover"
            >
              <div className="flex flex-row justify-center items-center space-x-2">
                  <FaX className="text-text-red-button h-6 w-6 mr-2"/>
                  <span>Disconnect</span>
              </div>
          </button>
          </div>
        </div>}
        {timeout &&
          <div className="flex items-center justify-center flex-col space-y-10 w-full">
            <p className="font-poppins text-text-main text-4xl font-medium ml-4">Error: Buddy Not Found</p>
            <p className="font-poppins text-text-main text-lg text-center px-10">We couldn't find a match for you at this time. Please try again later.</p>
            <button 
              className="bg-black/50 px-4 py-2 rounded-xl text-text-main font-poppins text-xl font-medium border-2 border-transparent hover:border-purple-outline"
            >
              <div className="flex flex-row justify-center items-center space-x-2">
                  <FaArrowLeft className="h-6 w-6 mr-2"/>
                  <span>Back to dashboard</span>
              </div>
          </button>
          </div>
        }
      </div>
    </div>
  )
}