"use client";
import { AccountDetailErrors } from "@/app/signup/page";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { BiSolidRightArrow } from "react-icons/bi"
import { FaX } from "react-icons/fa6";
import { PiSmiley } from "react-icons/pi";

export default function EditAccountPage() {
    const router = useRouter();
    const [user, setUser] = useState<any>(null);
    const [token, setToken] = useState("");
    const [errors, setErrors] = useState<AccountDetailErrors>();
    const [email, setEmail] = useState("");
    const [username, setUsername] = useState("");

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
            if (!parsedUser.id || !parsedUser.username || !parsedUser.email) {
                router.push("/");
                console.error("Invalid user data in session storage:", parsedUser);
            } else {
                setEmail(parsedUser.email);
                setUsername(parsedUser.username);
            }
        }
    }, [])
    async function handleEditAccount() {
        // API CALL TO BACKEND TO TRY TO SIGN UP
        try {
            const response = await fetch(`http://localhost:5000/api/edit-account/${user.id}`, { // REPLACE WITH ACTUAL BACKEND URL
                method: 'PATCH',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ email, username }),
            });

            const data = await response.json();

            if (response.ok) {
                sessionStorage.setItem("user", JSON.stringify({ ...user, username, email }));
                router.push("/dashboard");
            } else if (response.status === 400) {
                setErrors(data.errors);
            } else {
                const error = await response.json();
                console.error(error.message);
            }
        } catch (error) {
            console.error("Unexpected error while saving:", error);
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
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            type="text" 
                            className="w-full h-[55px] rounded-2xl p-4 bg-[#FFFFFF6B] focus:border-[#6E5AE2] focus:border-2 focus:outline-none text-[#3F3C4D] font-poppins text-xl font-medium" 
                        />
                        {errors?.email && (
                        <p className="font-poppins text-[#d36a6a] text-s font-medium mt-1 pl-1">{errors.email}</p>
                        )}
                        {!errors?.email && (
                            <div className="h-4"/>
                        )}
                    </div>

                    {/* Username */}
                    <div className="flex flex-col w-full">
                        <p className="font-poppins text-[#958AD5] text-xl font-medium mb-1 pl-1">Username</p>
                        <input 
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            type="text" 
                            className="w-full h-[55px] rounded-2xl p-4 bg-[#FFFFFF6B] focus:border-[#6E5AE2] focus:border-2 focus:outline-none text-[#3F3C4D] font-poppins text-xl font-medium" 
                        />
                        {errors?.username && (
                        <p className="font-poppins text-[#d36a6a] text-s font-medium mt-1 pl-1">{errors.username}</p>
                        )}
                        {!errors?.username && (
                        <div className="h-4"/>
                        )}
                    </div>
                    <div className="w-full flex flex-row justify-between items-center mt-8">
                        <button 
                            className="bg-[#0B6D59] w-[215px] h-[54px] rounded-xl text-white font-poppins text-3xl font-medium hover:border-[#6E5AE2] hover:border-2 hover:bg-[#1c7765]"
                            onClick={handleEditAccount}
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
