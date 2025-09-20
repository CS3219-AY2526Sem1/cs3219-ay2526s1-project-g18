"use client";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { BiSolidRightArrow } from "react-icons/bi"

enum STATUS_RESULT {
    VALID,
    FORMAT_ERROR,
    ALREADY_EXISTS
}

export default function SignUpPage() {
    const router = useRouter();
    const [emailStatus, setEmailStatus] = useState(STATUS_RESULT.VALID);
    const [usernameStatus, setUsernameStatus] = useState(STATUS_RESULT.VALID);
    const [isPasswordInvalid, setIsPasswordInvalid] = useState(false);
    const [isPasswordConfirmationInvalid, setIsPasswordConfirmationInvalid] = useState(false);
    const emailRef = useRef<HTMLInputElement>(null);
    const usernameRef = useRef<HTMLInputElement>(null);
    const passwordRef = useRef<HTMLInputElement>(null);
    const confirmPasswordRef = useRef<HTMLInputElement>(null);

    const isValidStatus = (status: STATUS_RESULT) => status === STATUS_RESULT.VALID;
    const checkPasswordValid = (password: HTMLInputElement | null) => {
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{8,}$/;
        if (!password) return false;
        return passwordRegex.test(password.value);
    }
    const checkPasswordMatch = (password: HTMLInputElement | null, confirmPassword: HTMLInputElement | null) => {
        return password?.value === confirmPassword?.value;
    }


    const handleClick = () => {
      const resultEmailStatus = STATUS_RESULT.VALID //CHANGE TO ACTUAL CHECK FOR EMAIL VALIDITY
      setEmailStatus(resultEmailStatus);
      const resultUsernameStatus = STATUS_RESULT.VALID  //CHANGE TO ACTUAL CHECK FOR USERNAME VALIDITY
      setUsernameStatus(resultUsernameStatus);
      const resultIsPasswordValid = checkPasswordValid(passwordRef.current)
      setIsPasswordInvalid(!resultIsPasswordValid);      
      const resultIsPasswordConfirmationValid = checkPasswordMatch(passwordRef.current, confirmPasswordRef.current) 
      setIsPasswordConfirmationInvalid(!resultIsPasswordConfirmationValid);
      const isCredentialsWrong = !isValidStatus(resultEmailStatus) || !isValidStatus(resultUsernameStatus) || !resultIsPasswordValid || !resultIsPasswordConfirmationValid
      if (!isCredentialsWrong) {
        router.push("/dashboard");
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
            {emailStatus === STATUS_RESULT.FORMAT_ERROR && (
            <p className="font-poppins text-[#d36a6a] text-xs font-medium mt-1 pl-1">Invalid email format.</p>
            )}
            {emailStatus === STATUS_RESULT.ALREADY_EXISTS && (
            <p className="font-poppins text-[#d36a6a] text-xs font-medium mt-1 pl-1">An account with this email has already been registered.</p>
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
            <p className="font-poppins text-[#d36a6a] text-xs font-medium mt-1 pl-1">Username should have 3 to 20 characters and should be alphanumeric.</p>
            )}
            {usernameStatus === STATUS_RESULT.ALREADY_EXISTS && (
            <p className="font-poppins text-[#d36a6a] text-xs font-medium mt-1 pl-1">This username has been taken. Please choose a different one.</p>
            )}
            {usernameStatus === STATUS_RESULT.VALID && (
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
            {isPasswordInvalid && (
            <p className="font-poppins text-[#d36a6a] text-xs font-medium mt-1 pl-1">Password requires at least 8 characters with uppercase, lowercase, and numeric digits.</p>
            )}
            {!isPasswordInvalid && (
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
            {isPasswordConfirmationInvalid && (
            <p className="font-poppins text-[#d36a6a] text-xs font-medium mt-1 pl-1">Password does not match.</p>
            )}
            {!isPasswordConfirmationInvalid && (
                <div className="h-4"/>
            )}
          </div>
        </div>
        {/* ADD VALIDATION OF EMAIL, USERNAME BEFORE ALLOWING SIGN UP */}
        <div className="flex justify-end w-full">
        <button 
          className="bg-linear-to-r from-[#7316D7] to-[#0B6D59] w-[215px] h-[58px] rounded-xl text-white font-poppins text-3xl font-medium hover:border-[#6E5AE2] hover:border-2 mr-4"
          onClick={handleClick}>
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
