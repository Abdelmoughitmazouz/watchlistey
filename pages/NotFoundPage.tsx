
import React, { useState } from 'react';
import { ChevronLeftIcon, SearchIconV2, ArrowRightIcon } from '../constants';
import { useSEO } from '../hooks/useSEO';

interface NotFoundPageProps {
    onNavigate: (path: string) => void;
}

const GhostIllustration = ({ className }: { className?: string }) => (
    <svg 
        viewBox="0 0 24 24" 
        fill="none" 
        stroke="currentColor" 
        strokeWidth="1.5" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
        className={className}
    >
        <path d="M9 10h.01" strokeWidth="3" />
        <path d="M15 10h.01" strokeWidth="3" />
        <path d="M12 2a8 8 0 0 0-8 8v12l3-3 2.5 2.5L12 19l2.5 2.5L17 19l3 3V10a8 8 0 0 0-8-8z" />
    </svg>
);

const NotFoundPage: React.FC<NotFoundPageProps> = ({ onNavigate }) => {
    useSEO('Page Not Found', 'Sorry, the page you are looking for does not exist.');
    const [searchQuery, setSearchQuery] = useState('');

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            onNavigate(`/search?q=${encodeURIComponent(searchQuery)}`);
        }
    };

    return (
        <div className="min-h-screen bg-white dark:bg-[#0f0f0f] flex flex-col items-center justify-center px-4 text-center transition-colors duration-200 pt-20 pb-12 relative overflow-hidden">
            {/* Background Decoration */}
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center overflow-hidden">
                 <span className="text-[12rem] sm:text-[20rem] md:text-[30rem] font-bold text-gray-100 dark:text-[#1a1a1a] select-none transform -translate-y-12 rotate-12 blur-sm">404</span>
            </div>

            <div className="relative z-10 flex flex-col items-center max-w-lg mx-auto animate-fade-in-up">
                <div className="bg-gray-100 dark:bg-[#1e1e1e] p-6 rounded-full mb-8 ring-1 ring-gray-200 dark:ring-gray-800 shadow-lg">
                    <GhostIllustration className="w-16 h-16 sm:w-20 sm:h-20 text-gray-400 dark:text-gray-500" />
                </div>
                
                <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 dark:text-white mb-4 tracking-tight">
                    Page not found
                </h1>
                
                <p className="text-lg text-gray-500 dark:text-gray-400 mb-10 leading-relaxed max-w-md">
                    Sorry, we couldn't find the page you're looking for. It might have been moved, deleted, or the URL might be incorrect.
                </p>

                {/* Search Bar on 404 */}
                <form onSubmit={handleSearch} className="w-full max-w-md mb-10">
                    <div className="relative">
                        <input 
                            type="text" 
                            placeholder="Try searching for a movie or show..." 
                            className="w-full pl-12 pr-4 py-3.5 bg-white dark:bg-[#1e1e1e] border border-gray-300 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/50 focus:border-brand-primary transition-all"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                        <SearchIconV2 className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <button 
                            type="submit"
                            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-gray-100 dark:bg-[#2a2a2a] rounded-lg hover:bg-gray-200 dark:hover:bg-[#333] transition-colors text-gray-600 dark:text-gray-300"
                        >
                            <ArrowRightIcon className="w-4 h-4" />
                        </button>
                    </div>
                </form>
                
                <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
                    <button 
                        onClick={() => onNavigate('/')}
                        className="px-8 py-3.5 bg-brand-primary text-black font-bold rounded-xl hover:bg-brand-primary/90 transition-all hover:-translate-y-1 shadow-lg shadow-brand-primary/20 flex items-center justify-center gap-2"
                    >
                        <ChevronLeftIcon className="w-5 h-5" />
                        Go back home
                    </button>
                    <button 
                        onClick={() => onNavigate('/contact')}
                        className="px-8 py-3.5 bg-white dark:bg-[#1e1e1e] text-gray-700 dark:text-gray-200 font-bold rounded-xl border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-[#2a2a2a] transition-all hover:-translate-y-1 flex items-center justify-center gap-2"
                    >
                        Contact Support
                    </button>
                </div>
            </div>
        </div>
    );
};

export default NotFoundPage;
