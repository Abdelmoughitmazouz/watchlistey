
import React, { useState, useEffect } from 'react';
import { ListItem, Show, ListStatus } from '../types';
import ListStatusButton from './ListStatusButton';
import { slugify } from '../lib/tmdb';

interface HeroSectionProps {
    shows: Show[];
    userList: Record<number, ListItem>;
    userFavorites?: Record<number, ListItem>;
    handleUpdateListStatus: (showId: number, status: ListStatus | null, show?: Show) => void;
    onNavigate?: (path: string) => void;
}

const HeroSection: React.FC<HeroSectionProps> = ({ shows, userList, handleUpdateListStatus, onNavigate }) => {
    const [currentIndex, setCurrentIndex] = useState(0);

    // Auto-rotate carousel
    useEffect(() => {
        if (!shows || shows.length <= 1) return;
        const interval = setInterval(() => {
            setCurrentIndex((prev) => (prev + 1) % shows.length);
        }, 8000);
        return () => clearInterval(interval);
    }, [shows?.length]);
    
    const handleDotClick = (index: number) => {
        setCurrentIndex(index);
    }

    const handleViewInfoClick = (show: Show) => {
        if (show && onNavigate) {
            const slug = slugify(show.title);
            const prefix = show.is_anime ? '/anime/' : show.media_type === 'tv' ? '/tv/' : '/movie/';
            onNavigate(`${prefix}${slug}`);
        }
    };

    if (!shows || shows.length === 0) {
        // Fallback loading skeleton
        return (
            <div className="relative h-[85vh] min-h-[600px] w-full flex items-center bg-black transition-colors duration-200">
                <div className="animate-pulse flex space-x-4 w-full px-16">
                    <div className="flex-1 space-y-4 py-1">
                         <div className="h-4 bg-gray-800 rounded w-3/4"></div>
                         <div className="space-y-2">
                             <div className="h-4 bg-gray-800 rounded"></div>
                             <div className="h-4 bg-gray-800 rounded w-5/6"></div>
                         </div>
                     </div>
                </div>
            </div>
        )
    }

    const currentShow = shows[currentIndex];

    return (
        <div className="relative h-[85vh] min-h-[600px] w-full overflow-hidden group">
            {/* Background Image with Gradient Overlay */}
            <div className="absolute inset-0">
                <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent z-10" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0f0f0f] via-transparent to-transparent z-10" />
                <img 
                    src={currentShow.backdrop_url} 
                    alt={currentShow.title} 
                    className="w-full h-full object-cover transition-opacity duration-700"
                />
            </div>

            {/* Content */}
            <div className="relative z-20 flex flex-col justify-center h-full max-w-7xl mx-auto px-4 md:px-8 pt-16">
                <div className="max-w-3xl space-y-6 animate-fade-in-up">
                    <h1 
                        onClick={() => handleViewInfoClick(currentShow)}
                        className="text-5xl md:text-7xl font-extrabold text-white tracking-tight leading-tight drop-shadow-lg line-clamp-2 cursor-pointer hover:text-brand-primary transition-colors pb-3 pr-1"
                    >
                        {currentShow.title}
                    </h1>
                    
                    <div className="flex items-center space-x-4 text-base md:text-lg text-gray-300 font-medium">
                        <span className="text-green-400 font-bold">{Math.round((currentShow.rating || 0) * 10)}% Match</span>
                        <span>{currentShow.year}</span>
                        {currentShow.maturity && <span className="border border-gray-500 px-1.5 rounded text-xs">{currentShow.maturity}</span>}
                        {currentShow.number_of_seasons ? <span>{currentShow.number_of_seasons} Seasons</span> : (currentShow.runtime ? <span>{Math.floor(currentShow.runtime/60)}h {currentShow.runtime%60}m</span> : null)}
                    </div>

                    <p 
                        onClick={() => handleViewInfoClick(currentShow)}
                        className="text-lg md:text-xl text-gray-200 line-clamp-3 leading-relaxed drop-shadow-md max-w-2xl cursor-pointer hover:text-white transition-colors"
                    >
                        {currentShow.description}
                    </p>

                    <div className="flex items-center gap-4 pt-6">
                         <ListStatusButton 
                            showId={currentShow.id} 
                            userList={userList} 
                            handleUpdateListStatus={handleUpdateListStatus} 
                            show={currentShow} 
                            variant="hero"
                            onClick={() => handleViewInfoClick(currentShow)}
                        />
                    </div>
                </div>
            </div>

            {/* Indicators */}
            {shows.length > 1 && (
                <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-30 flex space-x-3 items-center">
                    {shows.map((_, index) => (
                        <button
                            key={index}
                            onClick={() => handleDotClick(index)}
                            className={`h-2.5 rounded-full transition-all duration-300 shadow-sm ${index === currentIndex ? 'bg-brand-primary w-8' : 'bg-white/50 w-2.5 hover:bg-white hover:scale-125'}`}
                            aria-label={`Go to slide ${index + 1}`}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

export default HeroSection;
