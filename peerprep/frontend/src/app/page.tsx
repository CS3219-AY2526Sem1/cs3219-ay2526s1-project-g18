"use client";
import Link from "next/link"
import { useRef, useState } from "react";
import { BiSolidRightArrow } from "react-icons/bi"
import { useRouter } from "next/navigation";
import { initSocket } from "./socket/socket";

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
      const response = await fetch('http://localhost:3001/api/login', { // REPLACE WITH ACTUAL BACKEND URL
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
        initSocket();
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
      className="bg-dark-blue-bg h-screen w-screen flex items-center justify-center"
    >
      <div className="bg-dark-box p-16 rounded-4xl w-[650px] h-[632px] flex flex-col items-center justify-between">
        <div className="flex items-center justify-center flex-col space-y-4">
          <div className="flex flex-row">
            <span className="font-inter text-logo-purple text-8xl font-bold ">Peer</span>
            <span className="font-inter text-logo-green text-8xl font-bold ">Prep</span>
          </div>
          <p className="font-poppins text-text-grey text-xl font-medium">Ace that interview. Together.</p>
        </div>
        <div className="flex flex-col items-start justify-center w-4/5">
          <p className="font-poppins text-text-main text-xl font-medium m-1 pl-1">Email/Username</p>
          <input 
            ref={usernameOrEmailRef}
            type="text" 
            className="w-full h-[55px] rounded-2xl p-4 mb-3 bg-text-area focus:border-purple-outline focus:border-2 focus:outline-none text-text-field placeholder-text-field font-poppins text-xl font-medium" 
            placeholder="Enter email or username" />
          <p className="font-poppins text-text-main text-xl font-medium m-1 pl-1">Password</p>
          <input 
            ref={passwordRef}
            type="password" 
            className="w-full h-[55px] rounded-2xl p-4 bg-text-area focus:border-purple-outline focus:border-2 focus:outline-none text-text-field placeholder-text-field font-poppins text-xl font-medium" 
            placeholder="Enter password" />
        </div>
        {isError && (
          <p className="font-poppins text-text-error text-xl font-medium m-1 pl-1">Invalid email/username or password</p>
        )}
        <div className="w-full flex flex-row justify-between items-center">
          <button 
            className="bg-blue-button w-[215px] h-[58px] rounded-xl text-white font-poppins text-3xl font-medium hover:border-logo-purple hover:border-2 hover:bg-blue-button-hover"
            onClick={handleLogIn}
          >Log in</button>
          <Link href="/signup">
            <button 
              className="bg-linear-to-r from-purple-button to-dg-button w-[215px] h-[58px] rounded-xl text-white font-poppins text-3xl font-medium hover:border-logo-purple hover:border-2"
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
