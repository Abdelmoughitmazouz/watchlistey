
import React, { useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';
import { EyeIcon, StarIcon, CalendarIcon, CheckIcon } from '../constants';
import { EpisodeActivity } from '../types';

interface EpisodeActionsProps {
    showId: number;
    seasonNumber: number;
    episodeNumber: number;
    isLoggedIn: boolean;
    onNavigate?: (path: string) => void;
    totalEpisodes?: number;
    showTitle?: string;
    showImage?: string;
}

const EpisodeActions: React.FC<EpisodeActionsProps> = ({ 
    showId, 
    seasonNumber, 
    episodeNumber,
    isLoggedIn,
    onNavigate,
    totalEpisodes,
    showTitle,
    showImage
}) => {
    const [activity, setActivity] = useState<EpisodeActivity | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isUpdating, setIsUpdating] = useState(false);
    const [showDatePicker, setShowDatePicker] = useState(false);

    useEffect(() => {
        const fetchActivity = async () => {
            if (!isLoggedIn || !isSupabaseConfigured) return;
            
            setIsLoading(true);
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) return;

                const { data, error } = await supabase
                    .from('episode_tracking')
                    .select('*')
                    .match({
                        user_id: user.id,
                        show_id: showId,
                        season_number: seasonNumber,
                        episode_number: episodeNumber
                    })
                    .maybeSingle();

                if (!error && data) {
                    setActivity(data);
                } else {
                    setActivity({
                        user_id: user.id,
                        show_id: showId,
                        season_number: seasonNumber,
                        episode_number: episodeNumber,
                        is_watched: false,
                        watched_at: null,
                        rating: null
                    });
                }
            } catch (e) {
                console.error("Error fetching episode activity", e);
            } finally {
                setIsLoading(false);
            }
        };

        fetchActivity();
    }, [showId, seasonNumber, episodeNumber, isLoggedIn]);

    const handleUpdate = async (updates: Partial<EpisodeActivity>) => {
        if (!isLoggedIn) {
            if (onNavigate) onNavigate('/login');
            return;
        }
        if (!activity || !isSupabaseConfigured) return;

        setIsUpdating(true);
        const newActivity = { ...activity, ...updates };
        
        try {
            // Optimistic Update
            setActivity(newActivity as EpisodeActivity);

            const { error } = await supabase
                .from('episode_tracking')
                .upsert(newActivity, { onConflict: 'user_id, show_id, season_number, episode_number' });

            if (error) throw error;

            // If marked as watched, post to feed
            if (updates.is_watched === true) {
                // Fetch current watched count for progress
                const { count: watchedCount } = await supabase
                    .from('episode_tracking')
                    .select('*', { count: 'exact', head: true })
                    .eq('user_id', activity.user_id)
                    .eq('show_id', showId)
                    .eq('is_watched', true);

                await supabase.from('user_activities').insert({
                    user_id: activity.user_id,
                    show_id: showId,
                    media_type: 'tv',
                    action: 'progress_updated',
                    metadata: {
                        title: showTitle || 'Show',
                        image: showImage?.replace('https://image.tmdb.org/t/p/w500', ''),
                        progress: watchedCount || episodeNumber,
                        total_episodes: totalEpisodes,
                        season: seasonNumber,
                        episode: episodeNumber
                    }
                });
            }
        } catch (e) {
            console.error("Error updating episode", e);
        } finally {
            setIsUpdating(false);
        }
    };

    const toggleWatched = () => {
        const isNowWatched = !activity?.is_watched;
        const now = new Date().toISOString();
        
        handleUpdate({
            is_watched: isNowWatched,
            watched_at: isNowWatched ? (activity?.watched_at || now) : null
        });
        
        if (isNowWatched) setShowDatePicker(true);
        else setShowDatePicker(false);
    };

    const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        handleUpdate({ watched_at: new Date(e.target.value).toISOString() });
    };

    const handleRating = (rating: number) => {
        handleUpdate({ rating: rating === activity?.rating ? null : rating });
    };

    if (!isLoggedIn && !isSupabaseConfigured) return null;

    return (
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 bg-white/5 p-4 rounded-xl border border-white/10 backdrop-blur-sm animate-fade-in">
            {/* Watched Toggle */}
            <div className="flex items-center gap-3">
                <button
                    onClick={toggleWatched}
                    disabled={isLoading}
                    className={`flex items-center justify-center w-12 h-12 rounded-full border-2 transition-all duration-300 ${
                        activity?.is_watched 
                        ? 'bg-brand-primary border-brand-primary text-black shadow-[0_0_15px_rgba(251,197,0,0.4)]' 
                        : 'bg-transparent border-gray-500 text-gray-400 hover:border-gray-300 hover:text-white'
                    }`}
                    title={activity?.is_watched ? "Mark as unwatched" : "Mark as watched"}
                >
                    {activity?.is_watched ? <CheckIcon className="w-6 h-6" /> : <EyeIcon className="w-6 h-6" />}
                </button>
                <div className="flex flex-col">
                    <span className={`text-sm font-bold ${activity?.is_watched ? 'text-brand-primary' : 'text-gray-400'}`}>
                        {activity?.is_watched ? "WATCHED" : "UNWATCHED"}
                    </span>
                    {activity?.is_watched && (
                        <div className="flex items-center gap-1 text-xs text-gray-500 hover:text-white transition-colors cursor-pointer relative group">
                            <CalendarIcon className="w-3 h-3" />
                            <span>
                                {activity.watched_at 
                                    ? new Date(activity.watched_at).toLocaleDateString() 
                                    : 'Set Date'}
                            </span>
                            {/* Date Picker Input */}
                            <input 
                                type="date" 
                                className="absolute inset-0 opacity-0 cursor-pointer"
                                value={activity.watched_at ? activity.watched_at.split('T')[0] : ''}
                                onChange={handleDateChange}
                            />
                        </div>
                    )}
                </div>
            </div>

            {/* Separator */}
            <div className="hidden sm:block h-8 w-px bg-white/10 mx-2"></div>

            {/* Rating */}
            <div className="flex flex-col gap-1 w-full sm:w-auto">
                <span className="text-[10px] uppercase tracking-wider font-bold text-gray-500">Your Rating</span>
                <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((star) => (
                        <button
                            key={star}
                            onClick={() => handleRating(star)}
                            className="group relative focus:outline-none"
                        >
                            <StarIcon 
                                className={`w-5 h-5 transition-colors ${
                                    (activity?.rating || 0) >= star 
                                    ? 'text-brand-primary' 
                                    : 'text-gray-700 hover:text-brand-primary/50'
                                }`} 
                            />
                        </button>
                    ))}
                    <span className="ml-2 text-sm font-bold text-white w-6 text-center">
                        {activity?.rating || '-'}
                    </span>
                </div>
            </div>
        </div>
    );
};

export default EpisodeActions;
