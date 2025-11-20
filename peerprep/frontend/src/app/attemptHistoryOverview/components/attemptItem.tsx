"use client";
import React, { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import {CircleCheck, Unplug, Timer} from "lucide-react"
// completion statuses   OUT_OF_TIME, SOLVED, DISCONNECTED

// props: completionStatus, dateString, questionTitle, otheUserName
interface AttemptItemProps {
    attemptId: string;
    completionStatus: string;
    dateString: string;
    questionTitle: string;
    otherUserName: string;

}

export default function AttemptItem(props: AttemptItemProps) {
    const router = useRouter();
    return (
        <div className="flex items-center bg-dark-box rounded-2xl p-4">
            <div className="flex items-center">
                {props.completionStatus === "SOLVED" && <CircleCheck className="text-logo-green w-15 h-15 mr-4"/>}
                {props.completionStatus === "OUT_OF_TIME" && <Timer className="text-yellow-500 w-15 h-15 mr-4"/>}
                {props.completionStatus === "DISCONNECTED" && <Unplug className="text-red-500 w-15 h-15 mr-4"/>}
                <div className="flex flex-col font-poppins text-white gap-2 ">
                    <div className="text-3xl">
                        <p>{props.completionStatus === "SOLVED" ? "Solved" : "Attempted"} "{props.questionTitle}" with {props.otherUserName}</p>
                    </div>
                    <div className="font-poppins text-text-dark-purple text-2xl">
                        {props.dateString}
                    </div>
                </div>
            </div>
            <button
                className="ml-auto bg-black-box text-white p-4 rounded-3xl font-poppins text-2xl hover:bg-darkest-box"
                onClick={() => { router.push(`/attemptHistoryOverview/attemptHistory?attemptId=${props.attemptId}`); }}
            >
                View Details
            </button>
        </div>
    )
}
