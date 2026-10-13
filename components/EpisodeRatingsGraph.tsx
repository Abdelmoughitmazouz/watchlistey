import React, { useState, useMemo } from 'react';
import {
    SeasonRatingsData,
    EpisodeRatingItem,
    SeriesRatingsSummary
} from '../types';
import {
    getRatingColorStyle,
    submitEpisodeRating,
    calculateSeriesSummary
} from '../lib/episodeRatingsService';
import { slugify } from '../lib/tmdb';
import { StarIcon, CalendarIcon } from '../constants';

export type RatingSourceMode = 'external' | 'watchlistey' | 'comparison';
export type GraphViewMode = 'vertical' | 'horizontal' | 'chart';

interface EpisodeRatingsGraphProps {
    showId: number;
    showTitle: string;
    seasonsData: SeasonRatingsData[];
    onNavigate: (path: string) => void;
    currentUserId?: string;
    isLoggedIn?: boolean;
    className?: string;
    initialViewMode?: GraphViewMode;
    hideSummaryBanner?: boolean;
}

export const EpisodeRatingsGraph: React.FC<EpisodeRatingsGraphProps> = ({
    showId,
    showTitle,
    seasonsData,
    onNavigate,
    currentUserId,
    isLoggedIn = false,
    className = '',
    initialViewMode = 'vertical',
    hideSummaryBanner = false
}) => {
    // Mode states - default to 'vertical' as requested
    const [ratingSource, setRatingSource] = useState<RatingSourceMode>('external');
    const [viewMode, setViewMode] = useState<GraphViewMode>(initialViewMode);
    const [selectedSeasonFilter, setSelectedSeasonFilter] = useState<number | 'all'>('all');

    // Tooltip and modal interaction states
    const [hoveredEpisode, setHoveredEpisode] = useState<{
        episode: EpisodeRatingItem;
        x: number;
        y: number;
    } | null>(null);

    const [activeRatingModalEpisode, setActiveRatingModalEpisode] = useState<EpisodeRatingItem | null>(null);
    const [userSelectedScore, setUserSelectedScore] = useState<number>(8);
    const [isSubmittingRating, setIsSubmittingRating] = useState(false);

    // Filter seasons
    const filteredSeasons = useMemo(() => {
        if (selectedSeasonFilter === 'all') return seasonsData;
        return seasonsData.filter(s => s.season_number === selectedSeasonFilter);
    }, [seasonsData, selectedSeasonFilter]);

    // Maximum episode count across all seasons (for vertical or horizontal alignment)
    const maxEpisodeCount = useMemo(() => {
        let max = 0;
        seasonsData.forEach(s => {
            if (s.episodes.length > max) max = s.episodes.length;
        });
        return Math.max(max, 1);
    }, [seasonsData]);

    // Summary statistics
    const summary: SeriesRatingsSummary = useMemo(() => {
        return calculateSeriesSummary(seasonsData, showId, showTitle);
    }, [seasonsData, showId, showTitle]);

    // Helper to get active rating value for an episode based on selected mode
    const getActiveRating = (ep: EpisodeRatingItem): number => {
        if (ratingSource === 'watchlistey') {
            return ep.watchlistey_rating;
        }
        return ep.external_rating;
    };

    const getActiveVotes = (ep: EpisodeRatingItem): number => {
        if (ratingSource === 'watchlistey') {
            return ep.watchlistey_votes;
        }
        return ep.external_votes;
    };

    // Format vote numbers cleanly (e.g. 1.2k)
    const formatVotes = (votes: number): string => {
        if (!votes) return '0';
        if (votes >= 1000000) return `${(votes / 1000000).toFixed(1)}M`;
        if (votes >= 1000) return `${(votes / 1000).toFixed(1)}k`;
        return votes.toLocaleString();
    };

    // Handle Episode click
    const handleEpisodeClick = (ep: EpisodeRatingItem) => {
        const slug = slugify(showTitle);
        onNavigate(`/tv/${slug}/season/${ep.season_number}/episode/${ep.episode_number}`);
    };

    // Handle Quick Rate open
    const handleOpenRateModal = (e: React.MouseEvent, ep: EpisodeRatingItem) => {
        e.stopPropagation();
        setActiveRatingModalEpisode(ep);
        setUserSelectedScore(ep.user_rating || Math.round(ep.external_rating) || 8);
    };

    // Handle submit rating
    const handleSaveRating = async () => {
        if (!activeRatingModalEpisode) return;
        setIsSubmittingRating(true);
        try {
            await submitEpisodeRating(
                showId,
                activeRatingModalEpisode.id,
                activeRatingModalEpisode.season_number,
                activeRatingModalEpisode.episode_number,
                userSelectedScore,
                activeRatingModalEpisode.title,
                currentUserId
            );
            // Update local state directly
            activeRatingModalEpisode.user_rating = userSelectedScore;
            activeRatingModalEpisode.watchlistey_rating = Math.round(
                ((activeRatingModalEpisode.watchlistey_rating * activeRatingModalEpisode.watchlistey_votes + userSelectedScore) /
                (activeRatingModalEpisode.watchlistey_votes + 1)) * 10
            ) / 10;
            activeRatingModalEpisode.watchlistey_votes += 1;
            setActiveRatingModalEpisode(null);
        } catch (e) {
            console.error(e);
        } finally {
            setIsSubmittingRating(false);
        }
    };

    // Linear flattened episodes array for Chart View
    const chartEpisodes = useMemo(() => {
        const list: { episode: EpisodeRatingItem; globalIndex: number }[] = [];
        let idx = 0;
        filteredSeasons.forEach(s => {
            s.episodes.forEach(e => {
                list.push({ episode: e, globalIndex: idx++ });
            });
        });
        return list;
    }, [filteredSeasons]);

    return (
        <div className={`space-y-6 ${className}`}>
            {/* Top Bar: Controls & Segmented Switches */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-4 rounded-2xl bg-gray-50 dark:bg-[#161616] border border-gray-200 dark:border-white/5">
                {/* Rating Source Selector */}
                <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider me-1">Source:</span>
                    <div className="flex items-center gap-1 p-1 bg-gray-200/60 dark:bg-[#202020] rounded-xl">
                        <button
                            onClick={() => setRatingSource('external')}
                            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all cursor-pointer ${
                                ratingSource === 'external'
                                    ? 'bg-white dark:bg-[#2e2e2e] text-gray-900 dark:text-white shadow-xs'
                                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                            }`}
                        >
                            External Ratings
                        </button>
                        <button
                            onClick={() => setRatingSource('watchlistey')}
                            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all cursor-pointer ${
                                ratingSource === 'watchlistey'
                                    ? 'bg-white dark:bg-[#2e2e2e] text-gray-900 dark:text-white shadow-xs'
                                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                            }`}
                        >
                            Watchlistey Community
                        </button>
                        <button
                            onClick={() => setRatingSource('comparison')}
                            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all cursor-pointer ${
                                ratingSource === 'comparison'
                                    ? 'bg-white dark:bg-[#2e2e2e] text-gray-900 dark:text-white shadow-xs'
                                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                            }`}
                        >
                            Side-by-Side Comparison
                        </button>
                    </div>
                </div>

                {/* View Mode & Season Filter */}
                <div className="flex flex-wrap items-center gap-3">
                    <div className="flex items-center gap-1 p-1 bg-gray-200/60 dark:bg-[#202020] rounded-xl">
                        <button
                            onClick={() => setViewMode('vertical')}
                            title="Vertical layout with seasons as columns"
                            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                                viewMode === 'vertical'
                                    ? 'bg-white dark:bg-[#2e2e2e] text-brand-primary shadow-xs font-bold'
                                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                            }`}
                        >
                            <svg className="w-3.5 h-3.5" viewBox="0 0 16 16" fill="currentColor">
                                <rect x="2" y="2" width="3" height="12" rx="1" />
                                <rect x="6.5" y="2" width="3" height="12" rx="1" />
                                <rect x="11" y="2" width="3" height="12" rx="1" />
                            </svg>
                            <span>Vertical Columns</span>
                        </button>
                        <button
                            onClick={() => setViewMode('horizontal')}
                            title="Horizontal matrix with seasons as rows"
                            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                                viewMode === 'horizontal'
                                    ? 'bg-white dark:bg-[#2e2e2e] text-gray-900 dark:text-white shadow-xs font-bold'
                                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                            }`}
                        >
                            <svg className="w-3.5 h-3.5" viewBox="0 0 16 16" fill="currentColor">
                                <rect x="2" y="2" width="12" height="3" rx="1" />
                                <rect x="2" y="6.5" width="12" height="3" rx="1" />
                                <rect x="2" y="11" width="12" height="3" rx="1" />
                            </svg>
                            <span>Horizontal Matrix</span>
                        </button>
                        <button
                            onClick={() => setViewMode('chart')}
                            title="Trajectory trend line chart"
                            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                                viewMode === 'chart'
                                    ? 'bg-white dark:bg-[#2e2e2e] text-gray-900 dark:text-white shadow-xs font-bold'
                                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                            }`}
                        >
                            <svg className="w-3.5 h-3.5" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M2 13l4-5 3 3 5-7" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                            <span>Trend Chart</span>
                        </button>
                    </div>

                    {/* Season Filter Dropdown */}
                    {seasonsData.length > 1 && (
                        <div className="flex items-center gap-2">
                            <select
                                value={selectedSeasonFilter}
                                onChange={(e) => setSelectedSeasonFilter(e.target.value === 'all' ? 'all' : Number(e.target.value))}
                                className="px-3 py-1.5 text-xs font-medium rounded-xl bg-gray-200/60 dark:bg-[#202020] border-none text-gray-900 dark:text-white focus:ring-1 focus:ring-brand-primary cursor-pointer"
                            >
                                <option value="all">All Seasons ({seasonsData.length})</option>
                                {seasonsData.map(s => (
                                    <option key={s.season_number} value={s.season_number}>
                                        Season {s.season_number} ({s.episodes.length} eps)
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}
                </div>
            </div>

            {/* Series Summary Banner */}
            {!hideSummaryBanner && (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 p-4 rounded-2xl bg-gray-50/50 dark:bg-[#141414] border border-gray-200/80 dark:border-white/5">
                    <div className="p-3 rounded-xl bg-white dark:bg-[#1c1c1c] border border-gray-100 dark:border-white/5">
                        <span className="text-[11px] font-medium text-gray-500 uppercase tracking-wider block">Series Average</span>
                        <div className="flex items-baseline gap-2 mt-1">
                            <span className="text-xl font-bold text-gray-900 dark:text-white">
                                {ratingSource === 'watchlistey' ? summary.average_watchlistey_rating : summary.average_external_rating}
                            </span>
                            <span className="text-xs text-gray-400">/ 10</span>
                        </div>
                        <span className="text-[10px] text-gray-500 mt-0.5 block">
                            {ratingSource === 'watchlistey' ? 'Watchlistey Users' : 'Global Aggregate'}
                        </span>
                    </div>

                    <div className="p-3 rounded-xl bg-white dark:bg-[#1c1c1c] border border-gray-100 dark:border-white/5">
                        <span className="text-[11px] font-medium text-gray-500 uppercase tracking-wider block">Total Episodes</span>
                        <div className="flex items-baseline gap-2 mt-1">
                            <span className="text-xl font-bold text-gray-900 dark:text-white">{summary.total_episodes}</span>
                            <span className="text-xs text-gray-400">in {summary.total_seasons} {summary.total_seasons === 1 ? 'Season' : 'Seasons'}</span>
                        </div>
                        <span className="text-[10px] text-gray-500 mt-0.5 block">Fully tracked</span>
                    </div>

                    {summary.highest_rated_episode && (
                        <div 
                            onClick={() => handleEpisodeClick(summary.highest_rated_episode!)}
                            className="p-3 rounded-xl bg-white dark:bg-[#1c1c1c] border border-gray-100 dark:border-white/5 hover:border-brand-primary/40 cursor-pointer transition-colors group"
                        >
                            <div className="flex items-center justify-between">
                                <span className="text-[11px] font-medium text-emerald-500 uppercase tracking-wider">Highest Rated</span>
                                <span className="text-xs font-bold text-emerald-400">
                                    {ratingSource === 'watchlistey' ? summary.highest_rated_episode.watchlistey_rating : summary.highest_rated_episode.external_rating} ★
                                </span>
                            </div>
                            <p className="text-xs font-semibold text-gray-900 dark:text-white mt-1 truncate group-hover:text-brand-primary transition-colors">
                                S{summary.highest_rated_episode.season_number}E{summary.highest_rated_episode.episode_number} · {summary.highest_rated_episode.title}
                            </p>
                            <span className="text-[10px] text-gray-500 mt-0.5 block truncate">Click to open episode</span>
                        </div>
                    )}

                    {summary.lowest_rated_episode && (
                        <div 
                            onClick={() => handleEpisodeClick(summary.lowest_rated_episode!)}
                            className="p-3 rounded-xl bg-white dark:bg-[#1c1c1c] border border-gray-100 dark:border-white/5 hover:border-brand-primary/40 cursor-pointer transition-colors group"
                        >
                            <div className="flex items-center justify-between">
                                <span className="text-[11px] font-medium text-amber-500 uppercase tracking-wider">Lowest Rated</span>
                                <span className="text-xs font-bold text-amber-400">
                                    {ratingSource === 'watchlistey' ? summary.lowest_rated_episode.watchlistey_rating : summary.lowest_rated_episode.external_rating} ★
                                </span>
                            </div>
                            <p className="text-xs font-semibold text-gray-900 dark:text-white mt-1 truncate group-hover:text-brand-primary transition-colors">
                                S{summary.lowest_rated_episode.season_number}E{summary.lowest_rated_episode.episode_number} · {summary.lowest_rated_episode.title}
                            </p>
                            <span className="text-[10px] text-gray-500 mt-0.5 block truncate">Click to open episode</span>
                        </div>
                    )}

                    <div className="p-3 rounded-xl bg-white dark:bg-[#1c1c1c] border border-gray-100 dark:border-white/5">
                        <span className="text-[11px] font-medium text-gray-500 uppercase tracking-wider block">Best Season</span>
                        <div className="flex items-baseline gap-2 mt-1">
                            <span className="text-xl font-bold text-brand-primary">Season {summary.best_season_number}</span>
                        </div>
                        <span className="text-[10px] text-gray-500 mt-0.5 block">Highest average rating</span>
                    </div>
                </div>
            )}

            {/* Color Legend Scale */}
            <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-gray-500 px-2">
                <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[11px] font-medium text-gray-400 me-1">Scale:</span>
                    <div className="flex items-center gap-1">
                        <span className="w-3 h-3 rounded-xs bg-red-700"></span>
                        <span className="text-[11px] text-gray-400">&lt;6.0</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <span className="w-3 h-3 rounded-xs bg-orange-600"></span>
                        <span className="text-[11px] text-gray-400">6.5</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <span className="w-3 h-3 rounded-xs bg-amber-600"></span>
                        <span className="text-[11px] text-gray-400">7.0</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <span className="w-3 h-3 rounded-xs bg-yellow-600"></span>
                        <span className="text-[11px] text-gray-400">7.5</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <span className="w-3 h-3 rounded-xs bg-lime-600"></span>
                        <span className="text-[11px] text-gray-400">8.0</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <span className="w-3 h-3 rounded-xs bg-green-600"></span>
                        <span className="text-[11px] text-gray-400">8.5</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <span className="w-3 h-3 rounded-xs bg-emerald-600"></span>
                        <span className="text-[11px] text-gray-400">9.0</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <span className="w-3 h-3 rounded-xs bg-purple-600"></span>
                        <span className="text-[11px] text-gray-400">9.5+</span>
                    </div>
                </div>

                <div className="text-[11px] text-gray-400">
                    Hover for details · Click to open episode · Quick-rate available
                </div>
            </div>

            {/* VIEW 1: VERTICAL COLUMNS VIEW (DEFAULT - SeriesGraph / AnimeGraphs style) */}
            {viewMode === 'vertical' && (
                <div className="overflow-x-auto pb-4 rounded-2xl border border-gray-200 dark:border-white/5 bg-white dark:bg-[#121212] p-5 shadow-sm">
                    <div className="flex gap-4 min-w-max items-start">
                        {filteredSeasons.map((season) => {
                            const seasonAvg = ratingSource === 'watchlistey'
                                ? season.average_watchlistey_rating
                                : season.average_external_rating;
                            const avgStyle = getRatingColorStyle(seasonAvg);

                            return (
                                <div
                                    key={season.season_number}
                                    className="w-48 sm:w-56 flex-shrink-0 flex flex-col rounded-2xl border border-gray-200 dark:border-white/10 bg-gray-50/70 dark:bg-[#181818] overflow-hidden shadow-xs group/col hover:border-brand-primary/40 transition-colors"
                                >
                                    {/* Column Header: Season Info */}
                                    <div className="p-3.5 border-b border-gray-200 dark:border-white/10 bg-gray-100/80 dark:bg-[#202020] sticky top-0 z-10 backdrop-blur-xs flex items-center justify-between">
                                        <div className="min-w-0">
                                            <h3 className="text-sm font-black text-gray-900 dark:text-white truncate">
                                                {season.name || `Season ${season.season_number}`}
                                            </h3>
                                            <span className="text-[11px] text-gray-500 dark:text-gray-400 block mt-0.5">
                                                {season.episodes.length} episodes
                                            </span>
                                        </div>

                                        <div className="flex flex-col items-end">
                                            <span
                                                className="px-2 py-0.5 rounded-lg text-xs font-black text-white shadow-xs"
                                                style={{ backgroundColor: avgStyle.hex }}
                                                title={`Season average: ${seasonAvg.toFixed(1)}`}
                                            >
                                                {seasonAvg ? seasonAvg.toFixed(1) : '–'} ★
                                            </span>
                                            <span className="text-[9px] text-gray-400 uppercase tracking-wider mt-0.5">Avg</span>
                                        </div>
                                    </div>

                                    {/* Column Body: Episodes Stacked Vertically */}
                                    <div className="p-2 space-y-1.5 overflow-y-auto max-h-[750px] scrollbar-thin">
                                        {season.episodes.map((ep) => {
                                            const activeVal = getActiveRating(ep);
                                            const cellStyle = getRatingColorStyle(activeVal);
                                            const isSideBySide = ratingSource === 'comparison';

                                            const extStyle = getRatingColorStyle(ep.external_rating);
                                            const wlStyle = getRatingColorStyle(ep.watchlistey_rating);

                                            const delta = ep.watchlistey_rating && ep.external_rating
                                                ? Math.round((ep.watchlistey_rating - ep.external_rating) * 10) / 10
                                                : 0;

                                            return (
                                                <div
                                                    key={ep.id}
                                                    onClick={() => handleEpisodeClick(ep)}
                                                    onMouseEnter={(e) => {
                                                        const rect = e.currentTarget.getBoundingClientRect();
                                                        setHoveredEpisode({
                                                            episode: ep,
                                                            x: rect.left + rect.width / 2,
                                                            y: rect.top
                                                        });
                                                    }}
                                                    onMouseLeave={() => setHoveredEpisode(null)}
                                                    className="group/ep relative p-2 rounded-xl bg-white dark:bg-[#121212] border border-gray-200/70 dark:border-white/5 hover:border-brand-primary hover:shadow-md cursor-pointer transition-all flex items-center justify-between gap-2"
                                                >
                                                    {/* Left: Episode number & Title */}
                                                    <div className="min-w-0 flex-1 flex items-center gap-2">
                                                        <span className="w-6 h-6 flex-shrink-0 rounded-md bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-zinc-300 font-mono text-[11px] font-bold flex items-center justify-center">
                                                            {ep.episode_number}
                                                        </span>
                                                        <div className="min-w-0 flex-1">
                                                            <p className="text-xs font-semibold text-gray-800 dark:text-gray-200 truncate group-hover/ep:text-brand-primary transition-colors">
                                                                {ep.title}
                                                            </p>
                                                            {ep.air_date && (
                                                                <span className="text-[10px] text-gray-400 block truncate">
                                                                    {new Date(ep.air_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>

                                                    {/* Right: Rating Box */}
                                                    {!isSideBySide ? (
                                                        <div className="flex items-center gap-1.5 flex-shrink-0">
                                                            <span
                                                                className="px-2 py-1 rounded-lg text-xs font-bold text-white shadow-xs"
                                                                style={{ backgroundColor: cellStyle.hex }}
                                                            >
                                                                {activeVal ? activeVal.toFixed(1) : '–'}
                                                            </span>

                                                            {ep.user_rating && (
                                                                <span
                                                                    className="w-2 h-2 rounded-full bg-amber-400"
                                                                    title={`You rated this ${ep.user_rating}/10`}
                                                                ></span>
                                                            )}
                                                        </div>
                                                    ) : (
                                                        /* Comparison view: both scores side by side */
                                                        <div className="flex flex-col items-end gap-0.5 flex-shrink-0">
                                                            <div className="flex items-center gap-1">
                                                                <span
                                                                    className="px-1.5 py-0.5 rounded text-[10px] font-bold text-white"
                                                                    style={{ backgroundColor: extStyle.hex }}
                                                                    title="External Rating"
                                                                >
                                                                    {ep.external_rating ? ep.external_rating.toFixed(1) : '–'}
                                                                </span>
                                                                <span
                                                                    className="px-1.5 py-0.5 rounded text-[10px] font-bold text-white"
                                                                    style={{ backgroundColor: wlStyle.hex }}
                                                                    title="Watchlistey Community Rating"
                                                                >
                                                                    {ep.watchlistey_rating ? ep.watchlistey_rating.toFixed(1) : '–'}
                                                                </span>
                                                            </div>
                                                            <span className={`text-[9px] font-mono font-bold ${
                                                                delta > 0 ? 'text-emerald-400' : delta < 0 ? 'text-red-400' : 'text-zinc-500'
                                                            }`}>
                                                                {delta > 0 ? `+${delta}` : delta === 0 ? '0.0' : `${delta}`}
                                                            </span>
                                                        </div>
                                                    )}

                                                    {/* Quick Rate hover button */}
                                                    <button
                                                        onClick={(e) => handleOpenRateModal(e, ep)}
                                                        title="Quick rate episode"
                                                        className="opacity-0 group-hover/ep:opacity-100 absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-brand-primary text-black flex items-center justify-center text-[10px] font-bold shadow-md hover:scale-110 transition-all z-10"
                                                    >
                                                        ★
                                                    </button>
                                                </div>
                                            );
                                        })}
                                    </div>

                                    {/* Column Footer */}
                                    <div className="p-2.5 border-t border-gray-200 dark:border-white/10 bg-gray-100/60 dark:bg-[#1a1a1a] flex items-center justify-between text-[11px] text-gray-500">
                                        <span>Season {season.season_number}</span>
                                        <button
                                            onClick={() => onNavigate(`/tv/${slugify(showTitle)}/season/${season.season_number}`)}
                                            className="font-semibold text-brand-primary hover:underline text-[11px]"
                                        >
                                            View Season →
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* VIEW 2: HORIZONTAL MATRIX (Grid) */}
            {viewMode === 'horizontal' && (
                <div className="overflow-x-auto rounded-2xl border border-gray-200 dark:border-white/5 bg-white dark:bg-[#121212] p-4 shadow-sm">
                    <div className="min-w-fit space-y-3">
                        {/* Column Header: Episode numbers */}
                        <div className="flex items-center gap-1.5 pb-2 border-b border-gray-100 dark:border-white/5 text-xs text-gray-400">
                            <div className="w-24 sm:w-28 flex-shrink-0 font-medium ps-1">Season</div>
                            <div className="w-16 flex-shrink-0 text-center font-medium">Avg</div>
                            <div className="flex items-center gap-1.5">
                                {Array.from({ length: maxEpisodeCount }).map((_, i) => (
                                    <div
                                        key={i}
                                        className={`w-9 sm:w-11 text-center font-mono text-[10px] font-medium ${
                                            ratingSource === 'comparison' ? 'w-16 sm:w-20' : ''
                                        }`}
                                    >
                                        E{i + 1}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Seasons Rows */}
                        {filteredSeasons.map((season) => {
                            const seasonAvg = ratingSource === 'watchlistey'
                                ? season.average_watchlistey_rating
                                : season.average_external_rating;
                            const avgStyle = getRatingColorStyle(seasonAvg);

                            return (
                                <div key={season.season_number} className="flex items-center gap-1.5 group/season">
                                    {/* Season Label */}
                                    <div className="w-24 sm:w-28 flex-shrink-0">
                                        <span className="text-xs font-bold text-gray-800 dark:text-gray-200 block truncate">
                                            {season.name}
                                        </span>
                                        <span className="text-[10px] text-gray-400 block">
                                            {season.episodes.length} episodes
                                        </span>
                                    </div>

                                    {/* Season Average Badge */}
                                    <div className="w-16 flex-shrink-0 flex items-center justify-center">
                                        <span
                                            className="px-2 py-0.5 rounded-md text-[11px] font-bold text-white shadow-xs"
                                            style={{ backgroundColor: avgStyle.hex }}
                                        >
                                            {seasonAvg ? seasonAvg.toFixed(1) : '–'}
                                        </span>
                                    </div>

                                    {/* Episode Cells */}
                                    <div className="flex items-center gap-1.5">
                                        {season.episodes.map((ep) => {
                                            const activeVal = getActiveRating(ep);
                                            const cellStyle = getRatingColorStyle(activeVal);
                                            const isSideBySide = ratingSource === 'comparison';

                                            const extStyle = getRatingColorStyle(ep.external_rating);
                                            const wlStyle = getRatingColorStyle(ep.watchlistey_rating);

                                            const delta = ep.watchlistey_rating && ep.external_rating
                                                ? Math.round((ep.watchlistey_rating - ep.external_rating) * 10) / 10
                                                : 0;

                                            return (
                                                <div
                                                    key={ep.id}
                                                    onClick={() => handleEpisodeClick(ep)}
                                                    onMouseEnter={(e) => {
                                                        const rect = e.currentTarget.getBoundingClientRect();
                                                        setHoveredEpisode({
                                                            episode: ep,
                                                            x: rect.left + rect.width / 2,
                                                            y: rect.top
                                                        });
                                                    }}
                                                    onMouseLeave={() => setHoveredEpisode(null)}
                                                    className={`relative cursor-pointer transition-transform hover:scale-110 hover:z-20 rounded-lg overflow-hidden border border-black/10 dark:border-white/10 ${
                                                        isSideBySide ? 'w-16 sm:w-20 h-10' : 'w-9 sm:w-11 h-10'
                                                    }`}
                                                >
                                                    {!isSideBySide ? (
                                                        <div
                                                            className={`w-full h-full flex flex-col items-center justify-center font-bold text-xs text-white ${cellStyle.bgClass}`}
                                                            style={{ backgroundColor: cellStyle.hex }}
                                                        >
                                                            <span>{activeVal ? activeVal.toFixed(1) : '–'}</span>
                                                            {ep.user_rating && (
                                                                <span className="w-1.5 h-1.5 rounded-full bg-white absolute top-1 right-1" title={`Your rating: ${ep.user_rating}`}></span>
                                                            )}
                                                        </div>
                                                    ) : (
                                                        <div className="w-full h-full flex flex-col justify-between p-1 bg-zinc-900 text-[10px]">
                                                            <div className="flex items-center justify-between text-white font-mono leading-none">
                                                                <span className="px-1 py-0.5 rounded text-[9px] font-bold" style={{ backgroundColor: extStyle.hex }}>
                                                                    Ext {ep.external_rating ? ep.external_rating.toFixed(1) : '–'}
                                                                </span>
                                                                <span className="px-1 py-0.5 rounded text-[9px] font-bold" style={{ backgroundColor: wlStyle.hex }}>
                                                                    WL {ep.watchlistey_rating ? ep.watchlistey_rating.toFixed(1) : '–'}
                                                                </span>
                                                            </div>
                                                            <div className="flex items-center justify-between text-[8px] text-zinc-400 mt-0.5">
                                                                <span>E{ep.episode_number}</span>
                                                                <span className={delta > 0 ? 'text-emerald-400' : delta < 0 ? 'text-red-400' : 'text-zinc-500'}>
                                                                    {delta > 0 ? `+${delta}` : delta === 0 ? '0.0' : `${delta}`}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* VIEW 3: TIMELINE / CHART VIEW */}
            {viewMode === 'chart' && (
                <div className="rounded-2xl border border-gray-200 dark:border-white/5 bg-white dark:bg-[#121212] p-6 shadow-sm">
                    <div className="mb-4 flex items-center justify-between text-xs text-gray-500">
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-1.5">
                                <span className="w-2.5 h-2.5 rounded-full bg-sky-400"></span>
                                <span>External Rating Line</span>
                            </div>
                            {(ratingSource === 'watchlistey' || ratingSource === 'comparison') && (
                                <div className="flex items-center gap-1.5">
                                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
                                    <span>Watchlistey Community Line</span>
                                </div>
                            )}
                        </div>
                        <span>Trajectory across {chartEpisodes.length} Episodes</span>
                    </div>

                    {/* Chart Container SVG */}
                    <div className="w-full overflow-x-auto">
                        <div className="min-w-[650px] h-72 relative">
                            {/* Y-Axis Grid Lines: 10, 8, 6, 4 */}
                            {[10, 8, 6, 4].map(val => {
                                const yPercent = ((10 - val) / 7) * 100;
                                return (
                                    <div key={val} className="absolute inset-x-0 border-b border-gray-100 dark:border-white/5 flex items-center" style={{ top: `${yPercent}%` }}>
                                        <span className="text-[10px] font-mono text-gray-400 -translate-y-2.5">{val}.0</span>
                                    </div>
                                );
                            })}

                            {/* Season Visual Separators */}
                            {filteredSeasons.map((season) => {
                                const startEp = chartEpisodes.find(c => c.episode.season_number === season.season_number);
                                if (!startEp) return null;
                                const xPercent = (startEp.globalIndex / Math.max(chartEpisodes.length - 1, 1)) * 100;

                                return (
                                    <div
                                        key={season.season_number}
                                        className="absolute top-0 bottom-0 border-s border-dashed border-gray-300 dark:border-white/10 pointer-events-none ps-1 pt-1"
                                        style={{ left: `${xPercent}%` }}
                                    >
                                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider bg-white dark:bg-[#121212] px-1 rounded">
                                            S{season.season_number}
                                        </span>
                                    </div>
                                );
                            })}

                            {/* Points & Connectors */}
                            <svg className="w-full h-full overflow-visible">
                                {/* SVG Line for External Ratings */}
                                {ratingSource !== 'watchlistey' && (
                                    <polyline
                                        fill="none"
                                        stroke="#38bdf8"
                                        strokeWidth="2.5"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        points={chartEpisodes.map(c => {
                                            const x = (c.globalIndex / Math.max(chartEpisodes.length - 1, 1)) * 100;
                                            const y = Math.max(0, Math.min(100, ((10 - (c.episode.external_rating || 0)) / 7) * 100));
                                            return `${x}%,${y}%`;
                                        }).join(' ')}
                                    />
                                )}

                                {/* SVG Line for Watchlistey Community Ratings */}
                                {(ratingSource === 'watchlistey' || ratingSource === 'comparison') && (
                                    <polyline
                                        fill="none"
                                        stroke="#10b981"
                                        strokeWidth="2.5"
                                        strokeDasharray={ratingSource === 'comparison' ? '4 2' : 'none'}
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        points={chartEpisodes.map(c => {
                                            const x = (c.globalIndex / Math.max(chartEpisodes.length - 1, 1)) * 100;
                                            const y = Math.max(0, Math.min(100, ((10 - (c.episode.watchlistey_rating || 0)) / 7) * 100));
                                            return `${x}%,${y}%`;
                                        }).join(' ')}
                                    />
                                )}
                            </svg>

                            {/* Clickable Overlay Dots */}
                            {chartEpisodes.map((c) => {
                                const xPercent = (c.globalIndex / Math.max(chartEpisodes.length - 1, 1)) * 100;
                                const val = getActiveRating(c.episode);
                                const yPercent = Math.max(0, Math.min(100, ((10 - val) / 7) * 100));
                                const style = getRatingColorStyle(val);

                                return (
                                    <div
                                        key={c.episode.id}
                                        onClick={() => handleEpisodeClick(c.episode)}
                                        onMouseEnter={(e) => {
                                            const rect = e.currentTarget.getBoundingClientRect();
                                            setHoveredEpisode({
                                                episode: c.episode,
                                                x: rect.left + rect.width / 2,
                                                y: rect.top
                                            });
                                        }}
                                        onMouseLeave={() => setHoveredEpisode(null)}
                                        className="absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer group"
                                        style={{ left: `${xPercent}%`, top: `${yPercent}%` }}
                                    >
                                        <div
                                            className="w-3.5 h-3.5 rounded-full border-2 border-white dark:border-[#121212] transition-transform group-hover:scale-150 shadow-sm"
                                            style={{ backgroundColor: style.hex }}
                                        />
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}

            {/* FLOATING HOVER TOOLTIP */}
            {hoveredEpisode && (
                <div
                    className="fixed z-50 pointer-events-none transform -translate-x-1/2 -translate-y-full mb-3"
                    style={{
                        left: `${hoveredEpisode.x}px`,
                        top: `${hoveredEpisode.y - 8}px`
                    }}
                >
                    <div className="w-64 rounded-2xl bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-white/10 shadow-2xl overflow-hidden backdrop-blur-md animate-fade-in text-start">
                        {hoveredEpisode.episode.still_path && (
                            <div className="w-full h-28 relative bg-zinc-900">
                                <img
                                    src={hoveredEpisode.episode.still_path}
                                    alt={hoveredEpisode.episode.title}
                                    className="w-full h-full object-cover"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>
                                <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between text-white text-xs">
                                    <span className="font-mono font-bold bg-black/60 px-1.5 py-0.5 rounded backdrop-blur-xs">
                                        S{hoveredEpisode.episode.season_number} · E{hoveredEpisode.episode.episode_number}
                                    </span>
                                    {hoveredEpisode.episode.runtime > 0 && (
                                        <span className="text-[10px] text-zinc-300">
                                            {hoveredEpisode.episode.runtime} min
                                        </span>
                                    )}
                                </div>
                            </div>
                        )}

                        <div className="p-3 space-y-2">
                            <div>
                                <h4 className="text-sm font-bold text-gray-900 dark:text-white line-clamp-1">
                                    {hoveredEpisode.episode.title}
                                </h4>
                                {hoveredEpisode.episode.air_date && (
                                    <span className="text-[10px] text-gray-400 block mt-0.5">
                                        Aired {new Date(hoveredEpisode.episode.air_date).toLocaleDateString()}
                                    </span>
                                )}
                            </div>

                            {/* Ratings Stats Split */}
                            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-gray-100 dark:border-white/5">
                                <div>
                                    <span className="text-[10px] text-gray-400 uppercase tracking-wider block">External</span>
                                    <div className="flex items-center gap-1.5 mt-0.5">
                                        <span className="text-sm font-bold text-gray-900 dark:text-white">
                                            {hoveredEpisode.episode.external_rating || '–'} ★
                                        </span>
                                        <span className="text-[10px] text-gray-500">
                                            ({formatVotes(hoveredEpisode.episode.external_votes)})
                                        </span>
                                    </div>
                                </div>

                                <div>
                                    <span className="text-[10px] text-brand-primary uppercase tracking-wider block font-semibold">Watchlistey</span>
                                    <div className="flex items-center gap-1.5 mt-0.5">
                                        <span className="text-sm font-bold text-emerald-400">
                                            {hoveredEpisode.episode.watchlistey_rating || '–'} ★
                                        </span>
                                        <span className="text-[10px] text-gray-500">
                                            ({formatVotes(hoveredEpisode.episode.watchlistey_votes)})
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* User Rating Indicator or Prompt */}
                            <div className="pt-2 border-t border-gray-100 dark:border-white/5 flex items-center justify-between text-[11px]">
                                <span className="text-gray-400">Your Rating:</span>
                                {hoveredEpisode.episode.user_rating ? (
                                    <span className="font-bold text-amber-400">
                                        {hoveredEpisode.episode.user_rating} / 10 ★
                                    </span>
                                ) : (
                                    <span className="text-zinc-500 italic">Click to rate</span>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* USER RATING MODAL */}
            {activeRatingModalEpisode && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-fade-in">
                    <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-[#181818] border border-gray-200 dark:border-white/10 p-6 space-y-5 shadow-2xl">
                        <div className="text-center space-y-1">
                            <span className="text-xs font-mono font-bold text-brand-primary">
                                S{activeRatingModalEpisode.season_number} · E{activeRatingModalEpisode.episode_number}
                            </span>
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                                Rate "{activeRatingModalEpisode.title}"
                            </h3>
                            <p className="text-xs text-gray-400">
                                Submitting your score instantly updates the Watchlistey community rating.
                            </p>
                        </div>

                        {/* Interactive Star / Score Selector */}
                        <div className="flex flex-col items-center gap-3">
                            <span className="text-3xl font-extrabold text-brand-primary">
                                {userSelectedScore} <span className="text-sm font-normal text-gray-400">/ 10</span>
                            </span>

                            <input
                                type="range"
                                min="1"
                                max="10"
                                step="1"
                                value={userSelectedScore}
                                onChange={(e) => setUserSelectedScore(Number(e.target.value))}
                                className="w-full accent-brand-primary cursor-pointer"
                            />

                            <div className="flex justify-between w-full text-[10px] font-mono text-gray-400 px-1">
                                <span>1</span>
                                <span>3</span>
                                <span>5</span>
                                <span>7</span>
                                <span>10</span>
                            </div>
                        </div>

                        <div className="flex items-center gap-3 pt-2">
                            <button
                                onClick={() => setActiveRatingModalEpisode(null)}
                                className="flex-1 py-2 px-4 rounded-xl border border-gray-200 dark:border-white/10 text-xs font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5 transition-colors cursor-pointer"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSaveRating}
                                disabled={isSubmittingRating}
                                className="flex-1 py-2 px-4 rounded-xl bg-brand-primary text-black text-xs font-bold hover:opacity-90 transition-opacity disabled:opacity-50 cursor-pointer"
                            >
                                {isSubmittingRating ? 'Saving...' : 'Submit Rating'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
