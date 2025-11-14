"use client";
import React from "react"
import { useRouter } from "next/navigation"
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import AiFeedback from "./components/AiFeedback";

const ATTEMPT_HISTORY_API_URL = process.env.ATTEMPT_HISTORY_API_URL || "http://localhost:3004/attempts/";


export default function AttemptHistory() {
    const router = useRouter();
    const codeAttempt = `Please store the code attempt string and pass to my AiFeedback component.`;
    //const question = `Please store the question string and pass to my AiFeedback component.`;
    // store attemptId from query param in a state
    const [storedAttemptId, setStoredAttemptId] = useState<any>(null);
    const [attemptDetails, setAttemptDetails] = useState<any>(null);
    const [question, setQuestion] = useState<any>(null);
    const [otherUserName, setOtherUserName] = useState<string>("");
    const [codeAttemptString, setCodeAttemptString] = useState<string>("");
    const [userName, setUserName] =  useState<string>("")
    const [questionDetails, setQuestionDetails] = useState<any>(null);
    

    const searchParams = useSearchParams();
    const attemptId = searchParams.get("attemptId") || "";
         // Make sure user is logged in + get userId and also userName


    async function fetchAttemptDetails(attemptId: string) {
        const url = `${ATTEMPT_HISTORY_API_URL}attempt/${attemptId}`;
        try {
            const response = await fetch(url, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                },
            });
            if (!response.ok) {
                console.log("Failed to fetch attempt details data:", response.statusText);
                return;
            }
            const data = await response.json();
            console.log("Attempt details data:", data);
            setAttemptDetails(data);
            } catch (error) {
                console.error("Error fetching attempt details data:", error);
            }
        }
        
        // helper functions
        //1. take in ISO date string and convert to more readable format
        // e.g. "2023-06-15T12:34:56Z" -> "6/15/2023, 12:34:56 PM"
        function formatDateString(isoString: string): string {
            const date = new Date(isoString);
            return date.toLocaleString();
        }

        //2. extract question data frm attempt details
        function extractQuestionData(questionData: any){
                // if it's a string, try parse
                let dataObj = questionData;
                if (typeof dataObj === "string") {
                    try { dataObj = JSON.parse(dataObj); } catch (e) { /* leave it */ }
                }
                setQuestion(dataObj || "Unknown Question");
        }
        function getOtherUserName(attemptDetails: any) {
            if (!attemptDetails || !attemptDetails.userNames) return;
            try {
                let names = attemptDetails.userNames;
                if (typeof names === 'string') {
                    try { names = JSON.parse(names); } catch (e) { names = [names]; }
                }
                if (!Array.isArray(names)) names = [String(names)];
                const other = names.find((n: string) => n !== userName) || names[0];
                setOtherUserName(other || '');
            } catch (err) {
                console.error('Error extracting other user name', err);
            }
        }

        // Ensure user is logged in and capture username
        useEffect(() => {
            const user = sessionStorage.getItem("user");
            const token = sessionStorage.getItem("token");
            if (!user || !token) {
                router.push("/");
                console.error("You must be logged in to access this page.");
                return;
            }
            try {
                const parsedUser = JSON.parse(user);
                if (!parsedUser.id || !parsedUser.username) {
                    router.push("/");
                    console.error("Invalid user data in session storage:", parsedUser);
                    return;
                }
                setUserName(parsedUser.username);
            } catch (e) {
                console.error('Failed to parse user from sessionStorage', e);
                router.push('/');
            }
        }, [router]);

        // Fetch attempt details when attemptId changes
        useEffect(() => {
            setStoredAttemptId(attemptId);
            if (attemptId) {
                fetchAttemptDetails(attemptId);
            }
        }, [attemptId]);

        // Process attemptDetails when fetched
        useEffect(() => {
            if (!attemptDetails) return;
            extractQuestionData(attemptDetails.qnData);
            getOtherUserName(attemptDetails);
            if (attemptDetails.sharedCode) setCodeAttemptString(attemptDetails.sharedCode);
            setQuestionDetails(attemptDetails.questionData || null);
        }, [attemptDetails]);
 
    // formtat in a proper sting

    
    return (
    <div className="bg-dark-blue-bg w-full h-screen flex flex-col items-center">
        <div className="flex items-start w-full justify-between m-5 p-5">
            <div className="flex-col m-5 mb-0">
                <div className="flex items-start mb-5">
                    <span className="font-poppins text-white text-5xl font-bold">
                        Question Attempt on {formatDateString(attemptDetails?.connectedAtTime || "")}
                    </span>
                </div>
                <p className="font-poppins text-text-main text-4xl font-bold">
                    Attempt with {otherUserName}
                </p>
            </div>
            <div className="flex items-end">
                <button
                    className="bg-black-box text-white p-4 rounded-3xl font-poppins text-2xl hover:bg-darkest-box"
                    onClick={() => { router.push('/attemptHistoryOverview') }}
                >
                    Back to Attempts
                </button>
            </div>
        </div>

        <div className="flex flex-row gap-10 h-full w-full p-6">
            
            {/* Left: question + code (2/3 width) */}
            <div className="flex flex-col w-2/3 h-full gap-6">
            <p className="font-poppins text-2xl">Question details</p>
                {/* Question area - take top half of left column */}
                <div className="rounded-4xl bg-light-box flex flex-col w-full h-1/2 p-10 overflow-y-auto">
                    <p className="font-poppins text-text-main text-3xl font-bold ml-4">
                        {question?.title ?? "Loading question..."}
                    </p>

                    <div className="my-4 flex flex-row bg-black-box px-4 w-fit py-3 rounded-4xl gap-4 items-center">
                        <button
                            className={
                                (question?.difficulty === "EASY"
                                    ? "bg-green-button-hover"
                                    : question?.difficulty === "MEDIUM"
                                        ? "bg-yellow-button-hover"
                                        : question?.difficulty === "HARD"
                                            ? "bg-red-button-hover"
                                            : "bg-gray-300 text-black") +
                                " px-4 py-1.5 rounded-xl font-poppins"
                            }
                        >
                            {question?.difficulty ?? "Easy"}
                        </button>

                        <div className="bg-light-box w-1 h-10 rounded-4xl"></div>

                        <h1 className="font-poppins text-logo-purple font-bold">
                            {(question?.topics ?? []).join(" ")}
                        </h1>
                    </div>

                    <p className="font-poppins text-lg ml-3">{question?.description ?? "Loading description..."}</p>
                </div>

                {/* Shared code area - take bottom half of left column */}
                <div className="flex flex-col w-full h-1/2 gap-4">
                    <p className="font-poppins text-2xl">Shared Code</p>
                    <div className="bg-darkest-box flex flex-col h-full w-full p-6 overflow-y-auto rounded-2xl">
                        <pre className="whitespace-pre-wrap font-mono text-sm">{codeAttemptString}</pre>
                    </div>
                </div>
            </div>


            {/* Right: AI feedback (1/3 width) */}
            <div className="w-1/3 h-full">
                <div className="h-full rounded-4xl p-4 overflow-y-auto">
                    <AiFeedback codeAttempt={codeAttemptString} question={question?.description ?? "Loading description..."} />
                </div>
            </div>
        </div>
    </div>
    );
}

