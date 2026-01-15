

import React from 'react';
import { useSEO } from '../hooks/useSEO';

const CommunityPage = () => {
    useSEO('Community', 'Join the Watchlistey community.');

    return (
        <div className="min-h-screen bg-white dark:bg-[#0f0f0f] pt-32 pb-16 transition-colors duration-200">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-16">
                    <h1 className="text-4xl font-extrabold text-gray-900 dark:text-white mb-6">Community</h1>
                    <p className="text-xl text-gray-500 dark:text-gray-400 max-w-2xl mx-auto">
                        Join thousands of movie lovers. Discuss, recommend, and discover together.
                    </p>
                </div>

                <div className="max-w-lg mx-auto mb-16">
                    <div className="group bg-[#5865F2]/10 border border-[#5865F2]/20 dark:bg-[#5865F2]/10 dark:border-[#5865F2]/20 p-10 rounded-3xl flex flex-col items-center cursor-pointer hover:bg-[#5865F2]/20 transition-all hover:scale-[1.02] shadow-lg">
                        <div className="w-20 h-20 bg-[#5865F2] text-white rounded-full flex items-center justify-center mb-6 shadow-xl">
                            <svg className="w-10 h-10" viewBox="0 0 127 96" fill="currentColor"><path d="M107.7,8.07A105.15,105.15,0,0,0,81.47,0a72.06,72.06,0,0,0-3.36,6.83A97.68,97.68,0,0,0,49,6.83,72.37,72.37,0,0,0,45.64,0,105.89,105.89,0,0,0,19.39,8.09C2.79,32.65-1.71,56.6.54,80.21h0A105.73,105.73,0,0,0,32.71,96.36,77.11,77.11,0,0,0,39.6,85.25a68.42,68.42,0,0,1-10.85-5.18c.91-.66,1.8-1.34,2.66-2a75.57,75.57,0,0,0,64.32,0c.87.71,1.76,1.39,2.66-2a68.68,68.68,0,0,1-10.87,5.19,77,77,0,0,0,6.89,11.1A105.89,105.89,0,0,0,126.6,80.22c.63-23.28-1.24-47.53-18.9-72.15ZM42.45,65.69C36.18,65.69,31,60,31,53s5-12.74,11.43-12.74S54,46,53.89,53,48.84,65.69,42.45,65.69Zm42.24,0C78.41,65.69,73.25,60,73.25,53s5-12.74,11.44-12.74S96.23,46,96.12,53,91.08,65.69,84.69,65.69Z"/></svg>
                        </div>
                        <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Join our Discord</h3>
                        <p className="text-gray-600 dark:text-gray-300 mb-6 text-center">
                            Chat with other members, give feedback directly to the developers, and participate in movie nights.
                        </p>
                        <a 
                            href="https://discord.gg/WQ6hXPrvdd" 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="px-8 py-3 bg-[#5865F2] hover:bg-[#4752c4] text-white font-bold rounded-xl transition-colors shadow-md"
                        >
                            Join Server
                        </a>
                    </div>
                </div>

                <div className="border-t border-gray-200 dark:border-gray-800 pt-16">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-8 text-center">Community Guidelines</h2>
                    <div className="space-y-6 text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
                        <div className="flex gap-4">
                            <span className="font-bold text-brand-primary text-xl">01</span>
                            <p><strong>Be Respectful.</strong> We're all here because we love entertainment. Disagreements are fine, but keep it civil.</p>
                        </div>
                        <div className="flex gap-4">
                            <span className="font-bold text-brand-primary text-xl">02</span>
                            <p><strong>No Spoilers.</strong> Always use spoiler tags when discussing plot twists. Don't ruin the experience for others.</p>
                        </div>
                        <div className="flex gap-4">
                            <span className="font-bold text-brand-primary text-xl">03</span>
                            <p><strong>Stay On Topic.</strong> Keep discussions relevant to movies, TV shows, anime, and the platform.</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
export default CommunityPage;