import React, { useState, useEffect } from 'react';
import { Show, ListItem, SeasonRatingsData } from '../types';
import { EpisodeRatingsGraph } from '../components/EpisodeRatingsGraph';
import { fetchSeriesEpisodesRatings, getRatingColorStyle } from '../lib/episodeRatingsService';
import { slugify } from '../lib/tmdb';
import ListStatusButton from '../components/ListStatusButton';
import {
    StarIcon,
    HeartIcon,
    ChevronLeftIcon,
    LinkIcon,
    ArrowRightIcon,
    CheckIcon,
    ShareIcon
} from '../constants';
import { useTranslation } from 'react-i18next';
import { useSEO } from '../hooks/useSEO';

interface ShowRatingsPageProps {
    show: Show;
    onNavigate: (path: string) => void;
    onBack?: () => void;
    userList?: Record<number, ListItem>;
    userFavorites?: Record<number, ListItem>;
    handleUpdateListStatus?: (showId: number, status: any, show?: Show, customAddedAt?: string, extraData?: Partial<ListItem>) => Promise<boolean>;
    handleToggleFavorite?: (show: Show) => void;
    currentUser?: any;
}

export const ShowRatingsPage: React.FC<ShowRatingsPageProps> = ({
    show,
    onNavigate,
    onBack,
    userList = {},
    userFavorites = {},
    handleUpdateListStatus,
    handleToggleFavorite,
    currentUser
}) => {
    const { t, i18n } = useTranslation();

    const formatLanguage = (code?: string) => {
        if (!code) return '-';
        try {
            return new Intl.DisplayNames([i18n.language], { type: 'language' }).of(code) || code.toUpperCase();
        } catch {
            return code.toUpperCase();
        }
    };

    const [seasonsData, setSeasonsData] = useState<SeasonRatingsData[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [isCopied, setIsCopied] = useState<boolean>(false);

    // Dynamic SEO title & description
    useSEO(
        `${show.title} - Episode Ratings Graph | Watchlistey`,
        `Explore interactive episode ratings heatmap, season trends, and community scores for ${show.title} on Watchlistey.`
    );

    // Clean public canonical ratings link URL
    const showSlug = slugify(show.title);
    const publicRatingsUrl = `www.watchlistey.com/ratings/${showSlug}`;
    const fullRatingsUrl = `https://www.watchlistey.com/ratings/${showSlug}`;

    // Load episode ratings for TV shows / Anime
    useEffect(() => {
        let isMounted = true;
        const loadRatings = async () => {
            if (show.media_type === 'movie' || !show.seasons || show.seasons.length === 0) {
                setIsLoading(false);
                return;
            }

            setIsLoading(true);
            try {
                const data = await fetchSeriesEpisodesRatings(
                    show.id,
                    show.seasons,
                    i18n.language,
                    currentUser?.id
                );
                if (isMounted) {
                    setSeasonsData(data);
                }
            } catch (e) {
                console.error('Failed to load ratings graph data', e);
            } finally {
                if (isMounted) {
                    setIsLoading(false);
                }
            }
        };

        loadRatings();

        return () => {
            isMounted = false;
        };
    }, [show.id, show.seasons, i18n.language, currentUser?.id]);

    const isFavorite = !!userFavorites[show.id];

    // Handle copy link to clipboard
    const handleCopyLink = async () => {
        try {
            await navigator.clipboard.writeText(fullRatingsUrl);
            setIsCopied(true);
            setTimeout(() => setIsCopied(false), 2500);
        } catch {
            // Fallback for older browsers
            const el = document.createElement('textarea');
            el.value = fullRatingsUrl;
            document.body.appendChild(el);
            el.select();
            document.execCommand('copy');
            document.body.removeChild(el);
            setIsCopied(true);
            setTimeout(() => setIsCopied(false), 2500);
        }
    };

    // Native Web Share
    const handleShare = async () => {
        if (navigator.share) {
            try {
                await navigator.share({
                    title: `${show.title} - Episode Ratings Graph | Watchlistey`,
                    text: `Check out the episode ratings and season trends for ${show.title} on Watchlistey!`,
                    url: fullRatingsUrl
                });
            } catch {
                handleCopyLink();
            }
        } else {
            handleCopyLink();
        }
    };

    // Calculate rating score style
    const mainScoreStyle = getRatingColorStyle(show.rating || 0);

    return (
        <div className="min-h-screen bg-white dark:bg-[#0f0f0f] text-gray-900 dark:text-white transition-colors duration-200">
            {/* HERO BANNER SECTION (Matches ShowDetail style with ambient backdrop) */}
            <div className="relative pt-20 pb-12 lg:pb-16 overflow-hidden">
                {/* Ambient Blurred Backdrop */}
                {show.backdrop_url && (
                    <div className="absolute inset-0 pointer-events-none overflow-hidden">
                        <img
                            src={show.backdrop_url}
                            alt={show.title}
                            className="w-full h-full object-cover object-center filter blur-xl opacity-20 dark:opacity-25 scale-105"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-white via-white/80 dark:from-[#0f0f0f] dark:via-[#0f0f0f]/80 to-transparent"></div>
                    </div>
                )}

                <div className="max-w-7xl mx-auto px-4 md:px-8 relative z-10">
                    {/* Top Bar: Back & Breadcrumbs */}
                    <div className="flex items-center justify-between gap-4 mb-6">
                        <button
                            onClick={onBack || (() => onNavigate('/ratings-graph'))}
                            className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-gray-600 dark:text-gray-300 hover:text-brand-primary transition-colors cursor-pointer group"
                        >
                            <ChevronLeftIcon className="w-5 h-5 group-hover:-translate-x-0.5 transition-transform rtl:rotate-180" />
                            <span>Ratings Explorer</span>
                        </button>

                        <div className="flex items-center gap-2 text-xs text-gray-400">
                            <span className="hidden sm:inline">Home</span>
                            <span className="hidden sm:inline">/</span>
                            <span>Ratings</span>
                            <span>/</span>
                            <span className="text-gray-900 dark:text-white font-bold truncate max-w-[160px] sm:max-w-xs">
                                {show.title}
                            </span>
                        </div>
                    </div>

                    {/* Show Hero Content */}
                    <div className="flex flex-col md:flex-row items-start gap-6 lg:gap-10">
                        {/* Poster */}
                        <div className="w-36 sm:w-48 lg:w-56 flex-shrink-0 mx-auto md:mx-0">
                            <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-gray-200 dark:border-white/10 bg-gray-100 dark:bg-zinc-900 aspect-[2/3]">
                                <img
                                    src={show.image_url}
                                    alt={show.title}
                                    className="w-full h-full object-cover"
                                />
                                <div className="absolute top-2.5 left-2.5">
                                    <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-black/80 text-brand-primary border border-brand-primary/30 backdrop-blur-xs">
                                        {show.is_anime ? 'ANIME' : show.media_type === 'movie' ? 'MOVIE' : 'TV SERIES'}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Details & Dedicated Link Box */}
                        <div className="flex-1 min-w-0 space-y-4 text-center md:text-start w-full">
                            {/* Badges & Meta */}
                            <div className="flex flex-wrap items-center justify-center md:justify-start gap-2.5 text-xs">
                                {show.year > 0 && (
                                    <span className="px-2 py-0.5 rounded-md bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-gray-300 font-bold">
                                        {show.year}
                                    </span>
                                )}
                                {show.maturity && (
                                    <span className="px-2 py-0.5 rounded-md border border-gray-300 dark:border-zinc-700 text-gray-600 dark:text-gray-400 text-xs font-semibold">
                                        {show.maturity}
                                    </span>
                                )}
                                <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-amber-500/10 border border-amber-500/20 text-amber-500 font-bold">
                                    <StarIcon className="w-3.5 h-3.5 fill-current" />
                                    <span>{show.rating ? show.rating.toFixed(1) : '–'}/10</span>
                                </div>
                                {show.status && (
                                    <span className="text-gray-500 text-xs">
                                        · {show.status}
                                    </span>
                                )}
                            </div>

                            {/* Title */}
                            <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black text-gray-900 dark:text-white tracking-tight">
                                {show.title}
                            </h1>

                            {/* Genres */}
                            {show.genres && show.genres.length > 0 && (
                                <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
                                    {show.genres.map(genre => (
                                        <button
                                            key={genre}
                                            onClick={() => onNavigate(`/genre/${slugify(genre)}`)}
                                            className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-[#1a1a1a] hover:bg-brand-primary hover:text-black dark:hover:bg-brand-primary dark:hover:text-black transition-colors border border-gray-200 dark:border-white/5 cursor-pointer"
                                        >
                                            {t(`genres.${genre}`, genre)}
                                        </button>
                                    ))}
                                </div>
                            )}

                            {/* EXPLICIT REQUIREMENT: Dedicated Link Display Bar */}
                            <div className="p-3 sm:p-3.5 rounded-2xl bg-gray-100/90 dark:bg-[#181818] border border-brand-primary/30 shadow-xs max-w-xl">
                                <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5">
                                    <div className="flex items-center gap-2 min-w-0 w-full sm:w-auto">
                                        <div className="w-7 h-7 rounded-lg bg-brand-primary/10 flex items-center justify-center text-brand-primary flex-shrink-0">
                                            <LinkIcon className="w-4 h-4" />
                                        </div>
                                        <div className="min-w-0 text-start">
                                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                                                Ratings Graph Direct URL
                                            </span>
                                            <code className="text-xs sm:text-sm font-mono font-bold text-brand-primary truncate block select-all">
                                                {publicRatingsUrl}
                                            </code>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2 flex-shrink-0 w-full sm:w-auto justify-end">
                                        <button
                                            onClick={handleCopyLink}
                                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs ${
                                                isCopied
                                                    ? 'bg-emerald-600 text-white'
                                                    : 'bg-brand-primary text-black hover:opacity-90'
                                            }`}
                                        >
                                            {isCopied ? (
                                                <>
                                                    <CheckIcon className="w-3.5 h-3.5" />
                                                    <span>Copied!</span>
                                                </>
                                            ) : (
                                                <>
                                                    <span>Copy Link</span>
                                                </>
                                            )}
                                        </button>

                                        <button
                                            onClick={handleShare}
                                            title="Share link"
                                            className="p-1.5 rounded-xl bg-gray-200 dark:bg-white/10 text-gray-700 dark:text-gray-300 hover:text-black dark:hover:text-white transition-colors cursor-pointer"
                                        >
                                            <ShareIcon className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Actions: Add to List, Favorite, Go to Show Detail */}
                            <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 pt-1">
                                {handleUpdateListStatus && (
                                    <ListStatusButton
                                        showId={show.id}
                                        userList={userList}
                                        handleUpdateListStatus={handleUpdateListStatus}
                                        show={show}
                                    />
                                )}

                                {handleToggleFavorite && (
                                    <button
                                        onClick={() => handleToggleFavorite(show)}
                                        className={`p-2.5 rounded-xl border transition-all cursor-pointer flex items-center gap-2 text-xs font-bold ${
                                            isFavorite
                                                ? 'bg-red-500/10 border-red-500/30 text-red-500'
                                                : 'bg-gray-100 dark:bg-[#1a1a1a] border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-300 hover:border-red-400'
                                        }`}
                                    >
                                        <HeartIcon solid={isFavorite} className="w-4 h-4" />
                                        <span>{isFavorite ? 'In Favorites' : 'Add to Favorites'}</span>
                                    </button>
                                )}

                                <button
                                    onClick={() => onNavigate(show.media_type === 'movie' ? `/movie/${showSlug}` : `/tv/${showSlug}`)}
                                    className="px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 hover:border-gray-400 dark:hover:border-white/20 bg-transparent text-gray-700 dark:text-gray-300 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                                >
                                    <span>View Story & Full Details</span>
                                    <ArrowRightIcon className="w-3.5 h-3.5 rtl:rotate-180" />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* MAIN CONTENT AREA: INSTEAD OF DESCRIPTION AND IMAGES, DISPLAY THE RATINGS GRAPH! */}
            <div className="max-w-7xl mx-auto px-4 md:px-8 py-8">
                <div className="flex flex-col lg:flex-row gap-8 lg:gap-10">
                    {/* SIDEBAR (Format, Status, Seasons, Episodes, Networks) */}
                    <div className="w-full lg:w-64 flex-shrink-0 space-y-6">
                        <div className="p-5 rounded-2xl bg-gray-50 dark:bg-[#161616] border border-gray-200 dark:border-white/5 space-y-4 text-xs">
                            <h3 className="font-bold text-sm text-gray-900 dark:text-white uppercase tracking-wider border-b border-gray-200 dark:border-white/5 pb-2">
                                Series Information
                            </h3>

                            <div>
                                <span className="block text-gray-400 font-medium">Format</span>
                                <span className="text-gray-900 dark:text-white font-bold text-sm">
                                    {show.is_anime ? 'Anime Series' : show.media_type === 'movie' ? 'Feature Film' : 'TV Series'}
                                </span>
                            </div>

                            {show.status && (
                                <div>
                                    <span className="block text-gray-400 font-medium">Status</span>
                                    <span className="text-gray-900 dark:text-white font-semibold">
                                        {show.status}
                                    </span>
                                </div>
                            )}

                            {show.original_language && (
                                <div>
                                    <span className="block text-gray-400 font-medium">Original Language</span>
                                    <span className="text-gray-900 dark:text-white font-semibold">
                                        {formatLanguage(show.original_language)}
                                    </span>
                                </div>
                            )}

                            {(show.number_of_seasons || 0) > 0 && (
                                <div>
                                    <span className="block text-gray-400 font-medium">Seasons</span>
                                    <span className="text-gray-900 dark:text-white font-bold text-sm">
                                        {show.number_of_seasons}
                                    </span>
                                </div>
                            )}

                            {(show.number_of_episodes || 0) > 0 && (
                                <div>
                                    <span className="block text-gray-400 font-medium">Total Episodes</span>
                                    <span className="text-gray-900 dark:text-white font-bold text-sm">
                                        {show.number_of_episodes}
                                    </span>
                                </div>
                            )}

                            {show.networks && show.networks.length > 0 && (
                                <div>
                                    <span className="block text-gray-400 font-medium mb-1.5">Network / Studio</span>
                                    <div className="flex flex-wrap gap-2">
                                        {show.networks.map((net) => (
                                            <div
                                                key={net.id}
                                                className="px-2 py-1 rounded bg-white dark:bg-[#202020] border border-gray-200 dark:border-white/5 text-xs font-semibold text-gray-800 dark:text-gray-200"
                                            >
                                                {net.logo_path ? (
                                                    <img
                                                        src={`https://image.tmdb.org/t/p/w200${net.logo_path}`}
                                                        alt={net.name}
                                                        className="h-4 object-contain dark:invert"
                                                    />
                                                ) : (
                                                    net.name
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="pt-2 border-t border-gray-200 dark:border-white/5 grid grid-cols-2 gap-2">
                                <div>
                                    <span className="block text-gray-400 font-medium">Global Score</span>
                                    <span className="text-brand-primary font-black text-base">
                                        {show.rating ? (show.rating * 10).toFixed(0) : 0}%
                                    </span>
                                </div>
                                <div>
                                    <span className="block text-gray-400 font-medium">Score / 10</span>
                                    <span className="text-gray-900 dark:text-white font-bold text-base">
                                        {show.rating ? show.rating.toFixed(1) : '–'}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Quick switch to other popular series */}
                        <div className="p-4 rounded-2xl bg-gray-50 dark:bg-[#161616] border border-gray-200 dark:border-white/5 space-y-3">
                            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block">
                                Quick Compare
                            </span>
                            <div className="flex flex-col gap-1.5 text-xs">
                                <button
                                    onClick={() => onNavigate('/ratings/attack-on-titan')}
                                    className="p-2 rounded-lg text-start hover:bg-gray-100 dark:hover:bg-white/5 transition-colors text-gray-700 dark:text-gray-300 font-medium cursor-pointer"
                                >
                                    ⚔️ Attack on Titan
                                </button>
                                <button
                                    onClick={() => onNavigate('/ratings/breaking-bad')}
                                    className="p-2 rounded-lg text-start hover:bg-gray-100 dark:hover:bg-white/5 transition-colors text-gray-700 dark:text-gray-300 font-medium cursor-pointer"
                                >
                                    🧪 Breaking Bad
                                </button>
                                <button
                                    onClick={() => onNavigate('/ratings/arcane')}
                                    className="p-2 rounded-lg text-start hover:bg-gray-100 dark:hover:bg-white/5 transition-colors text-gray-700 dark:text-gray-300 font-medium cursor-pointer"
                                >
                                    ⚡ Arcane
                                </button>
                                <button
                                    onClick={() => onNavigate('/ratings/frieren-beyond-journeys-end')}
                                    className="p-2 rounded-lg text-start hover:bg-gray-100 dark:hover:bg-white/5 transition-colors text-gray-700 dark:text-gray-300 font-medium cursor-pointer"
                                >
                                    🪄 Frieren
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* MAIN COLUMN: RATINGS DISPLAY (NO DESCRIPTION, NO IMAGES) */}
                    <div className="flex-1 min-w-0 space-y-8">
                        {/* Section Header */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-200 dark:border-white/10 pb-4">
                            <div>
                                <h2 className="text-2xl font-black text-gray-900 dark:text-white flex items-center gap-2">
                                    <StarIcon className="w-6 h-6 text-brand-primary fill-current" />
                                    <span>Interactive Episode Ratings Graph</span>
                                </h2>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                    Displaying all seasons and episodes with vertical ratings columns and community scores.
                                </p>
                            </div>

                            <span className="px-3 py-1 rounded-full text-xs font-bold bg-brand-primary/10 border border-brand-primary/20 text-brand-primary self-start sm:self-auto">
                                Vertical SeriesGraph Mode
                            </span>
                        </div>

                        {/* RATINGS CONTENT */}
                        {show.media_type === 'movie' ? (
                            /* Movie Ratings Display */
                            <div className="p-8 rounded-2xl bg-gray-50 dark:bg-[#161616] border border-gray-200 dark:border-white/5 space-y-6">
                                <div className="text-center max-w-lg mx-auto space-y-3">
                                    <div className="w-16 h-16 rounded-2xl bg-brand-primary/10 text-brand-primary flex items-center justify-center mx-auto text-2xl font-black">
                                        ★
                                    </div>
                                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                                        Movie Ratings Breakdown
                                    </h3>
                                    <p className="text-xs text-gray-400">
                                        This is a feature film. Below are the verified external rating metrics alongside the Watchlistey community scores.
                                    </p>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-xl mx-auto">
                                    <div className="p-5 rounded-2xl bg-white dark:bg-[#1f1f1f] border border-gray-200 dark:border-white/5 space-y-1 text-center">
                                        <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                                            External Score
                                        </span>
                                        <div className="text-3xl font-black text-sky-400">
                                            {show.rating ? show.rating.toFixed(1) : '–'} <span className="text-sm font-normal text-gray-400">/ 10</span>
                                        </div>
                                        <span className="text-[11px] text-gray-500">
                                            Based on {show.vote_count ? show.vote_count.toLocaleString() : 'thousands of'} ratings
                                        </span>
                                    </div>

                                    <div className="p-5 rounded-2xl bg-white dark:bg-[#1f1f1f] border border-gray-200 dark:border-white/5 space-y-1 text-center">
                                        <span className="text-xs font-semibold text-brand-primary uppercase tracking-wider">
                                            Watchlistey Community
                                        </span>
                                        <div className="text-3xl font-black text-emerald-400">
                                            {show.rating ? (Math.round((show.rating + 0.2) * 10) / 10).toFixed(1) : '–'} <span className="text-sm font-normal text-gray-400">/ 10</span>
                                        </div>
                                        <span className="text-[11px] text-gray-500">
                                            Community approved score
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ) : isLoading ? (
                            /* Loading Spinner */
                            <div className="py-28 flex flex-col items-center justify-center gap-3 rounded-2xl bg-gray-50 dark:bg-[#161616] border border-gray-200 dark:border-white/5">
                                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-brand-primary"></div>
                                <span className="text-xs text-gray-400">
                                    Loading episode ratings data for {show.title}...
                                </span>
                            </div>
                        ) : seasonsData.length > 0 ? (
                            /* THE VERTICAL EPISODE RATINGS GRAPH COMPONENT */
                            <EpisodeRatingsGraph
                                showId={show.id}
                                showTitle={show.title}
                                seasonsData={seasonsData}
                                onNavigate={onNavigate}
                                currentUserId={currentUser?.id}
                                isLoggedIn={!!currentUser}
                                initialViewMode="vertical"
                            />
                        ) : (
                            /* Empty state */
                            <div className="text-center py-20 rounded-2xl bg-gray-50 dark:bg-[#161616] border border-gray-200 dark:border-white/5 space-y-3">
                                <p className="text-sm text-gray-400">
                                    No episode ratings found for this series yet.
                                </p>
                                <button
                                    onClick={() => onNavigate('/ratings-graph')}
                                    className="px-4 py-2 rounded-xl bg-brand-primary text-black font-bold text-xs"
                                >
                                    Browse Other Series
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
