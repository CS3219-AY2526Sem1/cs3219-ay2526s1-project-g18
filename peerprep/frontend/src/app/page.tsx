"use client";
import Link from "next/link"
import { useRef, useState } from "react";
import { BiSolidRightArrow } from "react-icons/bi"
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [isError, setIsError] = useState(false);
  const usernameOrEmailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);


  async function handleLogIn() {
    const usernameOrEmail = usernameOrEmailRef.current?.value || "";
    const password = passwordRef.current?.value || "";

    // API CALL TO BACKEND TO LOG IN
    try {
      const response = await fetch('http://localhost:5000/api/login', { // REPLACE WITH ACTUAL BACKEND URL
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ usernameOrEmail, password }),
      });

      if (response.ok) {
        const data = await response.json();
        const { accessToken, id, username, email, isAdmin, createdAt } = data.data;
        // store user info in session storage so it can be used in other components
        sessionStorage.setItem("token", accessToken);
        sessionStorage.setItem("user", JSON.stringify({ id, username, email, isAdmin, createdAt }));
        router.push("/dashboard");

      } else if (response.status === 401) {
        // wrong credentials
        setIsError(true);
        
      } else {
        const error = await response.json();
        console.error(error.message);
      }
    } catch (error) {
      console.error("Unexpected error during log in:", error);
    }
  }

  return (
    <div 
      className="bg-[#050325] h-screen w-screen flex items-center justify-center"
    >
      <div className="bg-[#2119566E] p-16 rounded-4xl w-[650px] h-[632px] flex flex-col items-center justify-between">
        <div className="flex items-center justify-center flex-col space-y-4">
          <div className="flex flex-row">
            <span className="font-inter text-[#6E5AE2] text-8xl font-bold ">Peer</span>
            <span className="font-inter text-[#5ae2c6] text-8xl font-bold ">Prep</span>
          </div>
          <p className="font-poppins text-[#FFFFFF87] text-xl font-medium">Ace that interview. Together.</p>
        </div>
        <div className="flex flex-col items-start justify-center w-4/5">
          <p className="font-poppins text-[#958AD5] text-xl font-medium m-1 pl-1">Email/Username</p>
          <input 
            ref={usernameOrEmailRef}
            type="text" 
            className="w-full h-[55px] rounded-2xl p-4 mb-3 bg-[#FFFFFF6B] focus:border-[#6E5AE2] focus:border-2 focus:outline-none text-[#3F3C4D] placeholder-[#3F3C4D] font-poppins text-xl font-medium" 
            placeholder="Enter email or username" />
          <p className="font-poppins text-[#958AD5] text-xl font-medium m-1 pl-1">Password</p>
          <input 
            ref={passwordRef}
            type="password" 
            className="w-full h-[55px] rounded-2xl p-4 bg-[#FFFFFF6B] focus:border-[#6E5AE2] focus:border-2 focus:outline-none text-[#3F3C4D] placeholder-[#3F3C4D] font-poppins text-xl font-medium" 
            placeholder="Enter password" />
        </div>
        {isError && (
          <p className="font-poppins text-[#d36a6a] text-xl font-medium m-1 pl-1">Invalid email/username or password</p>
        )}
        <div className="w-full flex flex-row justify-between items-center">
          <button 
            className="bg-[#2F0B6D] w-[215px] h-[58px] rounded-xl text-white font-poppins text-3xl font-medium hover:border-[#6E5AE2] hover:border-2 hover:bg-[#330b78]"
            onClick={handleLogIn}
          >Log in</button>
          <Link href="/signup">
            <button 
              className="bg-linear-to-r from-[#7316D7] to-[#0B6D59] w-[215px] h-[58px] rounded-xl text-white font-poppins text-3xl font-medium hover:border-[#6E5AE2] hover:border-2"
            >
              <div className="flex flex-row justify-center items-center space-x-2">
                <span> Sign up </span>
                <BiSolidRightArrow className="text-white h-6 w-6"/>
              </div>
            </button>
          </Link>
        </div>
      </div>
    </div>
  )
}
