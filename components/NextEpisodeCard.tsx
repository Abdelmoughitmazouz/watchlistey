
import React, { useState, useEffect } from 'react';
import { Episode, AppNotification } from '../types';
import { BellIcon, CalendarIcon } from '../constants';

interface NextEpisodeCardProps {
    episode: Episode;
    className?: string;
    notifications?: AppNotification[];
    onNotify?: (showId: number) => void; 
    isSubscribed?: boolean;
    isLoggedIn?: boolean;
    onNavigate?: (path: string) => void;
    showImage?: string;
    showTitle?: string;
    showId?: number;
    isAnime?: boolean;
}

const NextEpisodeCard: React.FC<NextEpisodeCardProps> = ({ 
    episode, 
    className = '', 
    onNotify, 
    isSubscribed = false, 
    isLoggedIn, 
    onNavigate, 
    showId,
    isAnime = false
}) => {
    const [timeLeft, setTimeLeft] = useState({
        days: 0,
        hours: 0,
        minutes: 0,
        seconds: 0,
        isPast: false
    });

    useEffect(() => {
        if (!episode.air_date) return;

        const calculateTime = () => {
            const now = new Date().getTime();
            let targetDate = new Date(episode.air_date);
            
            // LOGIC FIX: Default to 8 PM local time for "Release Date" strings without time.
            // This prevents "Released" status appearing 12-20 hours early for TV shows.
            if (episode.air_date.length === 10) { 
                 targetDate = new Date(`${episode.air_date}T20:00:00`);
            }
            
            const difference = targetDate.getTime() - now;

            if (difference > 0) {
                const days = Math.floor(difference / (1000 * 60 * 60 * 24));
                const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
                const seconds = Math.floor((difference % (1000 * 60)) / 1000);

                setTimeLeft({ days, hours, minutes, seconds, isPast: false });
            } else {
                setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0, isPast: true });
            }
        };

        calculateTime();
        const interval = setInterval(calculateTime, 1000);

        return () => clearInterval(interval);
    }, [episode.air_date]);

    const handleNotifyClick = () => {
        if (!isLoggedIn && onNavigate) {
            onNavigate('/signup');
            return;
        }

        if (onNotify && showId) {
            onNotify(showId);
        }
    };

    if (!episode.air_date) return null;

    const formattedDate = new Date(episode.air_date).toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    // Formatting Logic
    let episodeDisplay = '';
    if (isAnime) {
        episodeDisplay = `EP ${episode.episode_number}`;
    } else {
        episodeDisplay = `S${episode.season_number} E${episode.episode_number}`;
    }

    return (
        <div className={`bg-white dark:bg-[#121212] rounded-xl p-6 border border-gray-200 dark:border-gray-800 ${className}`}>
            <div className="flex justify-between items-start mb-6">
                <div>
                    <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5">Next Episode</h3>
                    <div className="flex items-center gap-3">
                        <span className="text-xl md:text-2xl font-extrabold text-brand-primary">
                            {episodeDisplay}
                        </span>
                        <div className="h-6 w-px bg-gray-200 dark:bg-gray-700"></div>
                        <span className="text-lg md:text-xl font-bold text-gray-900 dark:text-white truncate max-w-[180px] sm:max-w-xs">
                            {episode.name}
                        </span>
                    </div>
                </div>
                <button 
                    onClick={handleNotifyClick}
                    className={`p-2.5 rounded-full transition-all duration-200 border ${
                        isSubscribed 
                        ? 'bg-brand-primary border-brand-primary text-black' 
                        : 'bg-gray-100 dark:bg-[#1e1e1e] border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:border-gray-400 dark:hover:border-gray-500'
                    }`}
                    title={isSubscribed ? "Turn off notifications" : "Notify me"}
                >
                    <BellIcon className={`w-5 h-5 ${isSubscribed ? 'fill-current' : ''}`} />
                </button>
            </div>

            <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300 mb-6 font-medium bg-gray-100 dark:bg-[#1e1e1e] w-fit px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-800/50">
                <CalendarIcon className="w-4 h-4 text-gray-500" />
                <span className="text-sm">{formattedDate}</span>
            </div>

            <div className="grid grid-cols-4 gap-3">
                {[
                    { label: 'DAYS', value: timeLeft.days },
                    { label: 'HRS', value: timeLeft.hours },
                    { label: 'MINS', value: timeLeft.minutes },
                    { label: 'SECS', value: timeLeft.seconds }
                ].map((item) => (
                    <div key={item.label} className="bg-gray-100 dark:bg-[#1e1e1e] rounded-lg py-3 px-2 text-center border border-gray-200 dark:border-gray-800/50">
                        <div className="text-2xl sm:text-3xl font-extrabold text-brand-primary tabular-nums leading-none mb-1">
                            {timeLeft.isPast && item.label === 'DAYS' && item.value === 0 ? '-' : item.value}
                        </div>
                        <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                            {item.label}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default NextEpisodeCard;
