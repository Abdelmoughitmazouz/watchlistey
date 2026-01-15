
import React, { useState, useEffect, useRef } from 'react';
import { SearchIconV2, ChevronRightIcon, CloseIcon, UserPlaceholderIcon } from '../constants';
import { searchMulti, slugify } from '../lib/tmdb';
import { Show } from '../types';

interface SearchBarProps {
    onNavigate: (path: string) => void;
    isDark?: boolean;
    autoFocus?: boolean;
    className?: string;
    onClose?: () => void;
}

const SearchBar: React.FC<SearchBarProps> = ({ onNavigate, isDark, autoFocus, className, onClose }) => {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<Show[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const searchRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // Auto focus on mount if requested
    useEffect(() => {
        if (autoFocus && inputRef.current) {
            inputRef.current.focus();
        }
    }, [autoFocus]);

    // Debounce logic for dropdown
    useEffect(() => {
        const timer = setTimeout(async () => {
            if (query.trim().length > 1) {
                setIsLoading(true);
                try {
                    const tmdbData = await searchMulti(query);
                    setResults(tmdbData.results.slice(0, 8)); // Limit results
                    setIsOpen(true);
                } catch (error) {
                    console.error("Search error", error);
                } finally {
                    setIsLoading(false);
                }
            } else {
                setResults([]);
                setIsOpen(false);
            }
        }, 400); // 400ms debounce

        return () => clearTimeout(timer);
    }, [query]);

    // Click outside to close dropdown
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleResultClick = (item: Show) => {
        setIsOpen(false);
        setQuery('');
        if (onClose) onClose();

        const slug = slugify(item.title);
        
        if (item.media_type === 'person') {
            onNavigate(`/person/${slug}`);
        } else {
            let prefix = item.media_type === 'tv' ? '/tv/' : '/movie/';
            // For Anime detected via TMDB genres, route to anime URL if desired, or standard TV
            // Keeping consistent with existing logic where possible, but if is_anime comes from TMDB (via genres), handle it.
            if (item.is_anime) prefix = '/anime/';
            
            onNavigate(`${prefix}${slug}`);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            setIsOpen(false);
            if (onClose) onClose();
            if (query.trim()) {
                onNavigate(`/search?q=${encodeURIComponent(query)}`);
            }
        }
        if (e.key === 'Escape') {
             setIsOpen(false);
             if (onClose) onClose();
        }
    };

    // Styling adapted for overlay mode vs inline mode
    // If className is provided, we assume overlay mode mostly
    const baseInputStyles = "block w-full pl-12 py-4 border-none rounded-none leading-5 focus:outline-none transition-colors duration-200 text-lg font-medium";
    
    const inputStyles = className 
        ? "bg-transparent text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 pr-20" 
        : (isDark
            ? 'bg-[#2a2a2a] text-white placeholder:text-white/70 focus:bg-[#333] focus:ring-white/30 rounded-md py-2 text-base pl-10 pr-4'
            : 'bg-gray-100 text-gray-900 placeholder:text-gray-500 focus:bg-white focus:ring-gray-300 rounded-md py-2 text-base pl-10 pr-4');

    const iconColor = className ? 'text-gray-400 dark:text-gray-500' : (isDark ? 'text-white/70' : 'text-gray-400');
    const spinnerColor = className ? 'border-gray-500 dark:border-gray-400' : (isDark ? 'border-white' : 'border-gray-600');

    const iconPosition = className ? 'left-4 top-1/2 -translate-y-1/2' : 'left-3 top-1/2 -translate-y-1/2';
    const iconSize = className ? 'h-5 w-5' : 'h-4 w-4';

    return (
        <div ref={searchRef} className={`relative w-full ${className || 'max-w-md mx-auto lg:mx-0'}`}>
            <div className="relative flex items-center">
                <div className={`absolute ${iconPosition} flex items-center pointer-events-none`}>
                    <SearchIconV2 className={`${iconSize} ${iconColor}`} />
                </div>
                <input
                    ref={inputRef}
                    type="text"
                    className={`${baseInputStyles} ${inputStyles}`}
                    placeholder="Search movies, TV, anime..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={handleKeyDown}
                    onFocus={() => query.length > 1 && setIsOpen(true)}
                />
                
                <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
                    {isLoading && (
                        <div className={`animate-spin rounded-full h-4 w-4 border-b-2 ${spinnerColor}`}></div>
                    )}
                    {onClose && (
                        <button 
                            onClick={onClose}
                            className="hidden sm:inline-block text-xs font-bold text-gray-400 dark:text-gray-500 border border-gray-200 dark:border-gray-700 rounded-md px-2 py-1 select-none hover:text-gray-600 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600 transition-colors bg-white/50 dark:bg-black/20 backdrop-blur-sm"
                        >
                            ESC
                        </button>
                    )}
                    {onClose && (
                        <button 
                            onClick={onClose}
                            className="sm:hidden p-2 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 bg-white/50 dark:bg-black/20 backdrop-blur-sm rounded-full"
                        >
                            <CloseIcon className="w-5 h-5" />
                        </button>
                    )}
                </div>
            </div>

            {/* STATIC RESULTS (Expands container) */}
            {isOpen && results.length > 0 && (
                <div className="w-full mt-0 border-t border-gray-100 dark:border-gray-800">
                    <ul className="py-0">
                        {results.map((item) => (
                            <li key={`${item.media_type}-${item.id}`}>
                                <button
                                    onClick={() => handleResultClick(item)}
                                    className="w-full px-6 py-3 flex items-center hover:bg-gray-50 dark:hover:bg-[#2a2a2a] transition-colors text-left group border-b border-gray-50 dark:border-gray-800 last:border-0"
                                >
                                    <div className="flex-shrink-0 h-10 w-8 bg-gray-200 dark:bg-gray-700 rounded-md overflow-hidden shadow-sm ring-1 ring-black/5 dark:ring-white/10">
                                        {item.image_url && !item.image_url.includes('placeholder') ? (
                                            <img src={item.image_url} alt={item.title} className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300" />
                                        ) : (
                                            <div className="h-full w-full flex items-center justify-center bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500">
                                                {item.media_type === 'person' ? <UserPlaceholderIcon className="w-5 h-5" /> : <span className="text-xs">?</span>}
                                            </div>
                                        )}
                                    </div>
                                    <div className="ml-4 min-w-0 flex-1">
                                        <div className="flex items-center gap-2">
                                            <p className="text-base font-medium text-gray-900 dark:text-white truncate group-hover:text-black dark:group-hover:text-white">{item.title}</p>
                                            {item.original_name && item.original_name !== item.title && (
                                                <span className="text-xs text-gray-500 dark:text-gray-400 hidden sm:inline truncate">({item.original_name})</span>
                                            )}
                                        </div>
                                        <div className="flex items-center text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                            <span className="capitalize font-medium">{item.media_type === 'person' ? 'Person' : item.media_type === 'tv' ? 'TV Series' : (item.is_anime ? 'Anime' : 'Movie')}</span>
                                            {item.year > 0 && <span className="mx-1.5">•</span>}
                                            {item.year > 0 && <span>{item.year}</span>}
                                            {item.rating > 0 && item.media_type !== 'person' && (
                                                 <>
                                                    <span className="mx-1.5">•</span>
                                                    <span className="text-yellow-600 dark:text-brand-primary font-medium">★ {item.rating.toFixed(1)}</span>
                                                 </>
                                            )}
                                        </div>
                                    </div>
                                    <div className="ml-2 text-gray-300 dark:text-gray-600 group-hover:text-black dark:group-hover:text-white">
                                        <ChevronRightIcon className="w-4 h-4" />
                                    </div>
                                </button>
                            </li>
                        ))}
                    </ul>
                    <div className="bg-gray-50/50 dark:bg-[#1e1e1e] px-6 py-2 text-xs text-gray-500 dark:text-gray-400 flex justify-between items-center border-t border-gray-100 dark:border-gray-800">
                         <span>Press <kbd className="font-sans font-semibold border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#2a2a2a] rounded px-1 py-0.5 mx-0.5">Enter</kbd> to see all results</span>
                         <span className="font-medium">{results.length} suggestions</span>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SearchBar;
