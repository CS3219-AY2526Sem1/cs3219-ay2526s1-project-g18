import React from "react";
import { PiSmiley } from "react-icons/pi";
import { LogOut } from "lucide-react";
import { SquarePen } from "lucide-react";
import { useRouter } from "next/navigation";

type UserWidgetProps = {
    userName: string;
};

export default function UserWidget({ userName }: UserWidgetProps) {
    const router = useRouter();
    return(
        
        <div className="bg-blue-button p-6 rounded-2xl  flex flex-row justify-start items-center space-y-2">
            <PiSmiley className="w-25 h-25 bg-text-main rounded-full"/>
            <div className="flex flex-col pl-4 gap-1">
                <p className="font-poppins text-2xl">{userName}</p>
                <div className="flex flex-row gap-2 items-center">
                
                    <div className="flex flex-row gap-5">
                        
                        <button className="flex flex-row gap-1 bg-dark-blue-bg p-3 rounded-xl font-poppins text-lg text-text-main hover:bg-dark-blue-hover"
                        onClick={() => {router.push('/dashboard/editAccount')}}
                        >
                            <SquarePen />
                            <p>Edit</p>
                            </button>
                        <button className="flex flex-row gap-1 bg-red-button p-3 rounded-xl font-poppins text-lg text-text-red-button
                        hover:bg-red-button-hover"
                        onClick={() => {sessionStorage.clear(); router.push('/')}}>
                            <LogOut />
                        <span>Logout</span></button>
                    </div>
                </div>
            </div>
        </div>
    );
}