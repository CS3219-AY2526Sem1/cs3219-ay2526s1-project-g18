"use client";
import React, { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import {CircleCheck, Unplug, Timer} from "lucide-react"
// completion statuses   OUT_OF_TIME, SOLVED, DISCONNECTED

// props: completionStatus, dateString, questionTitle, otheUserName
interface AttemptItemProps {
    completionStatus: string;
    dateString: string;
    questionTitle: string;
    otherUserName: string;

}

export default function AttemptItem(props: AttemptItemProps) {
    return (
        // placeholder for now, unstyled
        <div className="flex flex-row">
            {props.completionStatus === "SOLVED" && <CircleCheck className="text-logo-green w-6 h-6 mr-4"/>}
            {props.completionStatus === "OUT_OF_TIME" && <Timer className="text-yellow-500 w-6 h-6 mr-4"/>}
            {props.completionStatus === "DISCONNECTED" && <Unplug className="text-red-500 w-6 h-6 mr-4"/>}
        </div>
    )
}
