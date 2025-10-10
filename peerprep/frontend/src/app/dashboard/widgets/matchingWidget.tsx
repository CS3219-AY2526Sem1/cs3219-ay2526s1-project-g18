"use client";
import Image from 'next/image';
import React, { useState } from 'react';
// import match-n-save image frm public folder
import matchNCode from "../../../../public/match-n-code.svg"
import DropdownMenu from '../components/dropdownMenu';

const handleTopicSelect = (topic: string) => {
console.log('Selected topic:', topic);
};

const isOpen = false;

export default function MatchingWidget(){
    const [selectedDifficulty, setSelectedDifficulty] = useState<string>('easy');
    const [isDropdownOpen, setDropdownOpenState] = useState(false);
    return(
        <div className="bg-dark-box p-6 pl-9 rounded-2xl">
            <div className="flex items-center space-x-5 mb-4">
                <Image src={matchNCode} alt="Match and Code" className="object-contain w-15"/>
                <span className="font-poppins text-text-main text-5xl font-medium">Match &amp; Code</span>
            </div>
            <div className="bg-dark-box h-1.5 rounded-2xl mb-3"></div>
            <div className="flex flex-col items-center justify-center space-y-8">
                <div className="flex space-x-10 pt-5">
                    <button
                        className={`bg-easy-translucent p-3 rounded-xl font-poppins text-5xl hover:bg-green-button-hover ${
                            selectedDifficulty === 'easy' ? 'ring-4 ring-green-outline' : ''
                        }`}
                        onClick={() => setSelectedDifficulty('easy')}
                    >
                        Easy
                    </button>
                    <button
                        className={`bg-medium-translucent p-3 rounded-xl font-poppins text-5xl hover:bg-yellow-button-hover ${
                            selectedDifficulty === 'medium' ? 'ring-4 ring-yellow-outline' : ''
                        }`}
                        onClick={() => setSelectedDifficulty('medium')}
                    >
                        Medium
                    </button>
                    <button
                        className={`bg-hard-translucent p-3 rounded-xl font-poppins text-5xl hover:bg-red-button-hover ${
                            selectedDifficulty === 'hard' ? 'ring-4 ring-red-outline' : ''
                        }`}
                        onClick={() => setSelectedDifficulty('hard')}
                    >
                        Hard
                    </button>
                </div>
                <DropdownMenu 
                    topics={['Arrays', 'Strings', 'Linked Lists', 'Trees', 'Graphs', 'Dynamic Programming', 'Sorting', 'Searching']}
                    onOpenChange={setDropdownOpenState}
                    placeholder="Select Question Topic"
                    className="w-full"
                />
                <button className="bg-gradient-to-r from-purple-button to-dg-button p-4 w-full rounded-xl text-white font-poppins text-5xl font-medium hover:border-logo-purple hover:border-2 hover:bg-blue-button-hover"style={{ marginTop: isDropdownOpen ? '250px' : '0' }}>
                    Find Match
                </button>
            </div>
        </div>
    )
}