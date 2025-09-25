"use client";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { BiSolidRightArrow } from "react-icons/bi"

export interface AccountDetailErrors {
    email?: string;
    username?: string;
    password?: string;
    confirmPassword?: string;
}

export default function SignUpPage() {
    const router = useRouter();
    const [errors, setErrors] = useState<AccountDetailErrors>();

    //refs for input fields
    const emailRef = useRef<HTMLInputElement>(null);
    const usernameRef = useRef<HTMLInputElement>(null);
    const passwordRef = useRef<HTMLInputElement>(null);
    const confirmPasswordRef = useRef<HTMLInputElement>(null);

    async function handleSignUp() {
        const email = emailRef.current?.value || "";
        const username = usernameRef.current?.value || "";
        const password = passwordRef.current?.value || "";
        const confirmPassword = confirmPasswordRef.current?.value || "";

        // API CALL TO BACKEND TO TRY TO SIGN UP
        try {
            const response = await fetch('http://localhost:3001/api/signup', { // REPLACE WITH ACTUAL BACKEND URL
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, username, password, confirmPassword }),
            });

            const data = await response.json();

            if (response.ok) {
                const { accessToken, id, username, email, isAdmin, createdAt } = data.data;
                // store user info in session storage so it can be used in other components
                sessionStorage.setItem("token", accessToken);
                sessionStorage.setItem("user", JSON.stringify({ id, username, email, isAdmin, createdAt }));
                router.push("/dashboard");            
            } else if (response.status === 400) {
                setErrors(data.errors);
            } else {
                const error = await response.json();
                console.error(error.message);
            }
        } catch (error) {
            console.error("Unexpected error during sign up:", error);
        }
    }

  return (
    <div className="bg-[#050325] h-screen w-screen flex items-center justify-center">
      <div className="bg-[#2119566E] p-8 rounded-4xl w-[650px] h-[697px] flex flex-col items-start justify-between">
        <div className="flex items-center justify-center flex-col space-y-3">
          <div className="flex flex-row">
            <span className="font-inter text-[#6E5AE2] text-6xl font-bold">Peer</span>
            <span className="font-inter text-[#5ae2c6] text-6xl font-bold">Prep</span>
          </div>
          <p className="font-poppins text-[#958AD5] text-4xl font-medium ml-4 mb-3">Create account</p>
        </div>
        <div className="flex flex-col items-start justify-center w-5/6 ml-4">

          {/* Email */}
          <div className="flex flex-col w-full">
            <p className="font-poppins text-[#958AD5] text-xl font-medium pl-1 mb-1">Email</p>
            <input 
                ref={emailRef}
                type="text" 
                className="w-full h-[55px] rounded-2xl p-4 bg-[#FFFFFF6B] focus:border-[#6E5AE2] focus:border-2 focus:outline-none text-[#3F3C4D] placeholder-[#3F3C4D] font-poppins text-xl font-medium" 
                placeholder="Enter your email" />
            {errors?.email && (
            <p className="font-poppins text-[#d36a6a] text-xs font-medium mt-1 pl-1">{errors.email}</p>
            )}
            {!errors?.email && (
                <div className="h-4"/>
            )}
          </div>

          {/* Username */}
          <div className="flex flex-col w-full">
            <p className="font-poppins text-[#958AD5] text-xl font-medium mb-1 pl-1">Username</p>
            <input 
                ref={usernameRef}
                type="text" 
                className="w-full h-[55px] rounded-2xl p-4 bg-[#FFFFFF6B] focus:border-[#6E5AE2] focus:border-2 focus:outline-none text-[#3F3C4D] placeholder-[#3F3C4D] font-poppins text-xl font-medium" 
                placeholder="Enter a username" />
            {errors?.username && (
            <p className="font-poppins text-[#d36a6a] text-xs font-medium mt-1 pl-1">{errors.username}</p>
            )}
            {!errors?.username && (
                <div className="h-4"/>
            )}
          </div>

          {/* Password */}
          <div className="flex flex-col w-full">
            <p className="font-poppins text-[#958AD5] text-xl font-medium mb-1 pl-1">Password</p>
            <input 
                ref={passwordRef}
                type="password" 
                className="w-full h-[55px] rounded-2xl p-4 bg-[#FFFFFF6B] focus:border-[#6E5AE2] focus:border-2 focus:outline-none text-[#3F3C4D] placeholder-[#3F3C4D] font-poppins text-xl font-medium" 
                placeholder="Enter a password" />
            {errors?.password && (
            <p className="font-poppins text-[#d36a6a] text-xs font-medium mt-1 pl-1">{errors.password}</p>
            )}
            {!errors?.password && (
                <div className="h-4"/>
            )}
          </div>

          {/* Confirm Password */}
          <div className="flex flex-col w-full">
            <p className="font-poppins text-[#958AD5] text-xl font-medium mb-1 pl-1">Confirm Password</p>
            <input 
                ref={confirmPasswordRef}
                type="password" 
                className="w-full h-[55px] rounded-2xl p-4 bg-[#FFFFFF6B] focus:border-[#6E5AE2] focus:border-2 focus:outline-none text-[#3F3C4D] placeholder-[#3F3C4D] font-poppins text-xl font-medium" 
                placeholder="Confirm your password" />
            {errors?.confirmPassword && (
            <p className="font-poppins text-[#d36a6a] text-xs font-medium mt-1 pl-1">{errors.confirmPassword}</p>
            )}
            {!errors?.confirmPassword && (
                <div className="h-4"/>
            )}
          </div>
        </div>
        {/* ADD VALIDATION OF EMAIL, USERNAME BEFORE ALLOWING SIGN UP */}
        <div className="flex justify-end w-full">
        <button 
          className="bg-linear-to-r from-[#7316D7] to-[#0B6D59] w-[215px] h-[58px] rounded-xl text-white font-poppins text-3xl font-medium hover:border-[#6E5AE2] hover:border-2 mr-4"
          onClick={handleSignUp}>
          <div className="flex flex-row justify-center items-center space-x-2">
            <span> Sign up </span>
            <BiSolidRightArrow className="text-white h-6 w-6"/>
          </div>
        </button>
        </div>
      </div>
    </div>
  )
}
