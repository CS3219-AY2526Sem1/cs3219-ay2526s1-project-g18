"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { BiSolidRightArrow } from "react-icons/bi"
import { FaX } from "react-icons/fa6";
import { PiSmiley } from "react-icons/pi";
enum STATUS_RESULT {
    VALID,
    FORMAT_ERROR,
    ALREADY_EXISTS
}

export default function SignUpPage() {
    const router = useRouter();
    const [emailStatus, setEmailStatus] = useState(STATUS_RESULT.VALID);
    const [usernameStatus, setUsernameStatus] = useState(STATUS_RESULT.VALID);
    const emailRef = useRef<HTMLInputElement>(null);
    const usernameRef = useRef<HTMLInputElement>(null);

    const isValidStatus = (status: STATUS_RESULT) => status === STATUS_RESULT.VALID;

    const handleClick = () => {
        const resultEmailStatus = STATUS_RESULT.FORMAT_ERROR //CHANGE TO ACTUAL CHECK FOR EMAIL VALIDITY
        setEmailStatus(resultEmailStatus);
        const resultUsernameStatus = STATUS_RESULT.FORMAT_ERROR  //CHANGE TO ACTUAL CHECK FOR USERNAME VALIDITY
        setUsernameStatus(resultUsernameStatus);
        const isCredentialsWrong = !isValidStatus(resultEmailStatus) || !isValidStatus(resultUsernameStatus)
        if (!isCredentialsWrong) {
            router.push("/dashboard");
        }
    }
  return (
    <div className="bg-[#050325] h-screen w-screen flex items-center justify-center">
        <div className="bg-[#2119566E] p-8 space-x-8 rounded-4xl w-[854px] h-[480px] flex flex-row items-center justify-between">
            <div className="flex justify-center items-center w-1/4 ">
                <PiSmiley className="w-40 h-40 bg-[#958AD5] rounded-full"/>
            </div>
            <div className="flex items-start justify-center flex-col space-y-4 w-3/4">
                <p className="font-poppins text-[#958AD5] text-4xl font-medium">Edit account information</p>
                <div className="flex flex-col items-start justify-center w-5/6">
                    {/* Email */}
                    <div className="flex flex-col w-full">
                        <p className="font-poppins text-[#958AD5] text-xl font-medium pl-1 mb-1">Email</p>
                        <input 
                            ref={emailRef}
                            type="text" 
                            className="w-full h-[55px] rounded-2xl p-4 bg-[#FFFFFF6B] focus:border-[#6E5AE2] focus:border-2 focus:outline-none text-[#3F3C4D] placeholder-[#3F3C4D] font-poppins text-xl font-medium" 
                            placeholder="Enter your email" />
                        {emailStatus === STATUS_RESULT.FORMAT_ERROR && (
                        <p className="font-poppins text-[#d36a6a] text-s font-medium mt-1 pl-1">Invalid email format.</p>
                        )}
                        {emailStatus === STATUS_RESULT.ALREADY_EXISTS && (
                        <p className="font-poppins text-[#d36a6a] text-s font-medium mt-1 pl-1">An account with this email has already been registered.</p>
                        )}
                        {emailStatus === STATUS_RESULT.VALID && (
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
                        {usernameStatus === STATUS_RESULT.FORMAT_ERROR && (
                        <p className="font-poppins text-[#d36a6a] text-s font-medium mt-1 pl-1">Username should have 3 to 20 characters and should be alphanumeric.</p>
                        )}
                        {usernameStatus === STATUS_RESULT.ALREADY_EXISTS && (
                        <p className="font-poppins text-[#d36a6a] text-s font-medium mt-1 pl-1">This username has been taken. Please choose a different one.</p>
                        )}
                        {usernameStatus === STATUS_RESULT.VALID && (
                            <div className="h-4"/>
                        )}
                    </div>
                    <div className="w-full flex flex-row justify-between items-center mt-8">
                        <button 
                            className="bg-[#0B6D59] w-[215px] h-[54px] rounded-xl text-white font-poppins text-3xl font-medium hover:border-[#6E5AE2] hover:border-2 hover:bg-[#1c7765]"
                            onClick={handleClick}
                        >
                            <div className="flex flex-row justify-center items-center space-x-2">
                                <span> Confirm </span>
                                <BiSolidRightArrow className="text-white h-6 w-6"/>
                            </div>
                        </button>
                        <Link href="/dashboard">
                            <button 
                                className="bg-[#46102B] w-[215px] h-[58px] rounded-xl text-[#D4A2A2] font-poppins text-3xl font-medium hover:border-[#6E5AE2] hover:border-2 hover:bg-[#570530]"
                            >
                                <div className="flex flex-row justify-center items-center space-x-2">
                                    <FaX className="text-[#D4A2A2] h-6 w-6"/>
                                    <span> Cancel </span>
                                </div>
                            </button>
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    </div>
  )
}
