
import React, { useEffect, useState } from 'react';
import { ChevronLeftIcon, ChevronRightIcon, StarIcon, CalendarIcon, UserPlaceholderIcon, PlayCircleIcon, ArrowRightIcon } from '../constants';
import { getEpisodeDetails, getShowIdFromSlug, getShowDetails, slugify } from '../lib/tmdb';
import { useSEO } from '../hooks/useSEO';
import ListStatusButton from '../components/ListStatusButton';
import EpisodeActions from '../components/EpisodeActions'; // Import the new component
import { ListItem, ListStatus, Show } from '../types';
import EpisodeCountdown from '../components/EpisodeCountdown';
import { supabase } from '../lib/supabaseClient'; // Need auth check
import { useTranslation } from 'react-i18next';

interface EpisodePageProps {
    showSlug: string;
    seasonNumber: string;
    episodeNumber: string;
    onBack: () => void;
    onNavigate: (path: string) => void;
    userList: Record<number, ListItem>;
    handleUpdateListStatus: (showId: number, status: ListStatus | null, show?: Show) => void;
}

const EpisodePage: React.FC<EpisodePageProps> = ({
    showSlug,
    seasonNumber,
    episodeNumber,
    onBack,
    onNavigate,
    userList,
    handleUpdateListStatus
}) => {
    const { i18n } = useTranslation();
    const [episode, setEpisode] = useState<any>(null);
    const [show, setShow] = useState<Show | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [currentUser, setCurrentUser] = useState<any>(null);

    const sNum = parseInt(seasonNumber);
    const eNum = parseInt(episodeNumber);

    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            try {
                // Check auth status for EpisodeActions
                const { data: { user } } = await supabase.auth.getUser();
                setCurrentUser(user);

                const showId = await getShowIdFromSlug(showSlug, 'tv', i18n.language);
                if (!showId) throw new Error("Show not found");

                // Parallel fetch for episode and show details (for backdrop)
                const [epData, showData] = await Promise.all([
                    getEpisodeDetails(showId, sNum, eNum, i18n.language),
                    getShowDetails(showId, 'tv', false, i18n.language)
                ]);

                if (epData) {
                    setEpisode(epData);
                } else {
                    setError("Episode not found");
                }

                if (showData) {
                    setShow(showData);
                }
            } catch (err) {
                setError("Failed to load content");
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, [showSlug, sNum, eNum, i18n.language]);

    useSEO(
        episode ? `${episode.name} - ${show?.title || showSlug}` : 'Episode Details',
        episode?.overview
    );

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-white dark:bg-[#0f0f0f]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-brand-primary"></div>
            </div>
        );
    }

    if (error || !episode) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-white dark:bg-[#0f0f0f] gap-4">
                <p className="text-red-500 font-medium">{error || "Content not found"}</p>
                <button onClick={onBack} className="text-blue-500 hover:underline">Go Back</button>
            </div>
        );
    }

    // Navigation Logic
    const handleNavigateEpisode = (offset: number) => {
        const nextEpisode = eNum + offset;
        if (nextEpisode < 1) return; 
        onNavigate(`/tv/${showSlug}/season/${sNum}/episode/${nextEpisode}`);
    };

    const handleSeriesClick = () => {
        if (show) onNavigate(`/tv/${slugify(show.title)}`);
    }

    const handleSeasonClick = () => {
        if (show) onNavigate(`/tv/${slugify(show.title)}/season/${sNum}`);
    }

    const directors = episode.crew?.filter((c: any) => c.job === 'Director') || [];
    const writers = episode.crew?.filter((c: any) => c.job === 'Writer' || c.job === 'Screenplay' || c.job === 'Story') || [];

    // Format Runtime
    const runtime = episode.runtime ? `${episode.runtime}m` : (show?.runtime ? `${show.runtime}m` : 'N/A');
    
    // Format Date
    const airDate = episode.air_date ? new Date(episode.air_date).toLocaleDateString(undefined, { 
        weekday: 'short', 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
    }) : 'TBA';

    return (
        <div className="min-h-screen bg-white dark:bg-[#0f0f0f] transition-colors duration-200 font-sans pb-12">
            
            {/* 1. HERO SECTION: Show Backdrop with Episode Overlay */}
            <div className="relative h-[50vh] min-h-[400px] w-full overflow-hidden group">
                <div className="absolute inset-0 bg-gray-900">
                    {/* Prioritize Show Backdrop for quality, fallback to episode still if needed, but usually series backdrop is better */}
                    <img 
                        src={show?.backdrop_url || `https://image.tmdb.org/t/p/original${episode.still_path}`} 
                        alt={show?.title} 
                        className="w-full h-full object-cover opacity-50 transition-transform duration-1000 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0f0f0f] via-[#0f0f0f]/40 to-transparent"></div>
                    <div className="absolute inset-0 bg-gradient-to-r from-[#0f0f0f]/80 via-transparent to-transparent"></div>
                </div>

                <div className="absolute inset-0 flex flex-col justify-end px-4 md:px-8 pb-12 max-w-7xl mx-auto">
                    {/* Breadcrumbs */}
                    <div className="flex items-center flex-wrap gap-2 text-sm md:text-base font-medium text-gray-300 mb-4 animate-fade-in">
                        <button onClick={handleSeriesClick} className="hover:text-brand-primary transition-colors hover:underline">
                            {show?.title}
                        </button>
                        <ChevronRightIcon className="w-3 h-3 text-gray-500 rtl:rotate-180" />
                        <button onClick={handleSeasonClick} className="hover:text-brand-primary transition-colors hover:underline">
                            Season {sNum}
                        </button>
                        <ChevronRightIcon className="w-3 h-3 text-gray-500 rtl:rotate-180" />
                        <span className="text-white font-bold">Episode {eNum}</span>
                    </div>

                    <h1 className="text-3xl md:text-5xl lg:text-6xl font-extrabold text-white mb-4 leading-tight drop-shadow-xl animate-fade-in-up text-start">
                        {episode.name}
                    </h1>

                    <div className="flex flex-wrap items-center gap-4 text-sm md:text-base font-medium text-gray-200 animate-fade-in-up delay-100">
                        <span className="bg-white/10 backdrop-blur-md px-3 py-1 rounded-lg border border-white/10 text-white font-mono">
                            S{sNum} E{eNum}
                        </span>
                        <div className="flex items-center gap-2">
                            <CalendarIcon className="w-5 h-5 text-gray-400" />
                            <span>{airDate}</span>
                        </div>
                        {episode.runtime && (
                            <div className="flex items-center gap-2">
                                <PlayCircleIcon className="w-5 h-5 text-gray-400" />
                                <span>{runtime}</span>
                            </div>
                        )}
                        {episode.vote_average > 0 && (
                            <div className="flex items-center gap-1 text-yellow-500 bg-black/40 px-2 py-1 rounded-full border border-white/5">
                                <StarIcon className="w-4 h-4" />
                                <span className="text-white font-bold">{episode.vote_average.toFixed(1)}</span>
                            </div>
                        )}
                        <EpisodeCountdown airDate={episode.air_date} className="text-brand-primary text-base" />
                    </div>
                </div>
            </div>

            {/* 2. MAIN CONTENT GRID */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                
                {/* NEW: Episode Tracking Actions */}
                {show && (
                    <div className="mb-12">
                        <EpisodeActions 
                            showId={show.id}
                            seasonNumber={sNum}
                            episodeNumber={eNum}
                            isLoggedIn={!!currentUser}
                            onNavigate={onNavigate}
                            totalEpisodes={show.number_of_episodes}
                            showTitle={show.title}
                            showImage={show.image_url}
                        />
                    </div>
                )}

                <div className="flex flex-col lg:flex-row gap-12">
                    
                    {/* LEFT COLUMN: Actions & Image */}
                    <div className="w-full lg:w-1/3 flex-shrink-0 space-y-8">
                        
                        {/* Episode Still Card */}
                        <div className="rounded-xl overflow-hidden shadow-2xl bg-gray-200 dark:bg-gray-800 aspect-video relative border border-gray-200 dark:border-gray-800 group">
                            {episode.still_path ? (
                                <img
                                    src={`https://image.tmdb.org/t/p/w500${episode.still_path}`}
                                    alt={episode.name}
                                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-gray-400">
                                    <span className="text-sm">No Preview Available</span>
                                </div>
                            )}
                        </div>

                        {/* Series Status Action */}
                        <div className="bg-white dark:bg-[#1e1e1e] p-6 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-xs uppercase tracking-wider font-bold text-gray-500 dark:text-gray-400">
                                    Series Status
                                </h3>
                            </div>
                            {show && (
                                <ListStatusButton 
                                    showId={show.id} 
                                    userList={userList} 
                                    handleUpdateListStatus={handleUpdateListStatus} 
                                    fullWidth 
                                    show={show} 
                                />
                            )}
                        </div>

                        {/* Navigation Buttons (Previous/Next Episode) */}
                        <div className="grid grid-cols-2 gap-4">
                            <button 
                                onClick={() => handleNavigateEpisode(-1)}
                                className="flex flex-col items-center justify-center p-4 bg-white dark:bg-[#1e1e1e] border border-gray-200 dark:border-gray-800 rounded-xl hover:border-brand-primary dark:hover:border-brand-primary transition-colors group"
                            >
                                <span className="text-xs text-gray-500 dark:text-gray-400 mb-1 group-hover:text-brand-primary">Previous</span>
                                <ChevronLeftIcon className="w-5 h-5 text-gray-900 dark:text-white rtl:rotate-180" />
                            </button>
                            <button 
                                onClick={() => handleNavigateEpisode(1)}
                                className="flex flex-col items-center justify-center p-4 bg-white dark:bg-[#1e1e1e] border border-gray-200 dark:border-gray-800 rounded-xl hover:border-brand-primary dark:hover:border-brand-primary transition-colors group"
                            >
                                <span className="text-xs text-gray-500 dark:text-gray-400 mb-1 group-hover:text-brand-primary">Next</span>
                                <ChevronRightIcon className="w-5 h-5 text-gray-900 dark:text-white rtl:rotate-180" />
                            </button>
                        </div>

                    </div>

                    {/* RIGHT COLUMN: Details & Overview */}
                    <div className="flex-1 min-w-0">
                        <div className="bg-white dark:bg-[#1e1e1e] rounded-2xl p-8 border border-gray-200 dark:border-gray-800 mb-8">
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Overview</h2>
                            <p className="text-gray-600 dark:text-gray-300 leading-relaxed text-lg mb-8">
                                {episode.overview || "No overview available for this episode."}
                            </p>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 border-t border-gray-200 dark:border-gray-800 pt-8">
                                {directors.length > 0 && (
                                    <div>
                                        <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-2">Director</h3>
                                        <div className="flex flex-wrap gap-2">
                                            {directors.map((d: any) => (
                                                <span key={d.id} className="text-gray-600 dark:text-gray-400">{d.name}</span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                {writers.length > 0 && (
                                    <div>
                                        <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-2">Writer</h3>
                                        <div className="flex flex-wrap gap-2">
                                            {writers.map((w: any) => (
                                                <span key={w.id} className="text-gray-600 dark:text-gray-400">{w.name}</span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Guest Stars */}
                        {episode.guest_stars && episode.guest_stars.length > 0 && (
                            <div>
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Guest Stars</h3>
                                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                                    {episode.guest_stars.slice(0, 8).map((star: any) => (
                                        <div key={star.id} className="flex items-center gap-3 bg-white dark:bg-[#1e1e1e] p-3 rounded-lg border border-gray-200 dark:border-gray-800">
                                            {star.profile_path ? (
                                                <img 
                                                    src={`https://image.tmdb.org/t/p/w200${star.profile_path}`} 
                                                    alt={star.name} 
                                                    className="w-10 h-10 rounded-full object-cover"
                                                />
                                            ) : (
                                                <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                                                    <UserPlaceholderIcon className="w-5 h-5 text-gray-400" />
                                                </div>
                                            )}
                                            <div className="min-w-0">
                                                <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{star.name}</p>
                                                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{star.character}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EpisodePage;
