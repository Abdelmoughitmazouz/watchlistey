import React, { useState, useEffect, useRef } from 'react';
import { Show, SeasonRatingsData } from '../types';
import { EpisodeRatingsGraph } from '../components/EpisodeRatingsGraph';
import {
    fetchSeriesEpisodesRatings
} from '../lib/episodeRatingsService';
import { getShowDetails, searchSpecific, slugify } from '../lib/tmdb';
import { useSEO } from '../hooks/useSEO';
import { SearchIconV2, StarIcon, ChevronLeftIcon, ArrowRightIcon } from '../constants';
import { useTranslation } from 'react-i18next';

interface RatingsGraphPageProps {
    onNavigate: (path: string) => void;
    currentUserId?: string;
    isLoggedIn?: boolean;
    initialShowId?: number;
}

// Curated popular series and anime presets for instant exploration
const POPULAR_PRESETS: { id: number; title: string; year: number; type: 'tv' | 'anime'; poster: string; rating: number }[] = [
    { id: 1396, title: 'Breaking Bad', year: 2008, type: 'tv', poster: 'https://image.tmdb.org/t/p/w300/ztkUQFLlC19CCMYHW9o1zWhJRNq.jpg', rating: 9.5 },
    { id: 1429, title: 'Attack on Titan', year: 2013, type: 'anime', poster: 'https://image.tmdb.org/t/p/w300/hTP1DtLGFamjfu8WqjnuQdP1n4i.jpg', rating: 9.1 },
    { id: 94605, title: 'Arcane', year: 2021, type: 'anime', poster: 'https://image.tmdb.org/t/p/w300/fqldv2t8ztc9aiwn3k6mlX3tvRT.jpg', rating: 9.0 },
    { id: 1399, title: 'Game of Thrones', year: 2011, type: 'tv', poster: 'https://image.tmdb.org/t/p/w300/1XS1oqL89opfnbLl8WnZY1O1uJx.jpg', rating: 8.4 },
    { id: 76331, title: 'Succession', year: 2018, type: 'tv', poster: 'https://image.tmdb.org/t/p/w300/7udZXvC4r8T71L2Nq6z56h3Z5Xv.jpg', rating: 8.9 },
    { id: 209867, title: 'Frieren: Beyond Journey\'s End', year: 2023, type: 'anime', poster: 'https://image.tmdb.org/t/p/w300/dqzenchTd7lp5zht7BdlqM7RBPd.jpg', rating: 9.0 },
    { id: 60059, title: 'Better Call Saul', year: 2015, type: 'tv', poster: 'https://image.tmdb.org/t/p/w300/fC2HDm5t0kHjCGSVNiVQg30mYcC.jpg', rating: 8.9 },
    { id: 46261, title: 'Death Note', year: 2006, type: 'anime', poster: 'https://image.tmdb.org/t/p/w300/iigTJJskR1Pcjjq09KG4k0e0yV4.jpg', rating: 8.6 },
    { id: 87108, title: 'Chernobyl', year: 2019, type: 'tv', poster: 'https://image.tmdb.org/t/p/w300/hlLXt2tOPT6RRnjiUmoxyG1LTFi.jpg', rating: 9.4 },
    { id: 95479, title: 'Jujutsu Kaisen', year: 2020, type: 'anime', poster: 'https://image.tmdb.org/t/p/w300/fHpKWpL8dO5Lp7eZvhH4q163Z1P.jpg', rating: 8.6 },
    { id: 31911, title: 'Fullmetal Alchemist: Brotherhood', year: 2009, type: 'anime', poster: 'https://image.tmdb.org/t/p/w300/5ZFUEOULaVml7pB9SNne2fDYOkS.jpg', rating: 9.1 },
    { id: 1398, title: 'The Sopranos', year: 1999, type: 'tv', poster: 'https://image.tmdb.org/t/p/w300/6nRmhFp5eF6w031F4w159N9N2Z8.jpg', rating: 9.2 }
];

export const RatingsGraphPage: React.FC<RatingsGraphPageProps> = ({
    onNavigate,
    currentUserId,
    isLoggedIn = false,
    initialShowId = 1396 // Default to Breaking Bad
}) => {
    const { t, i18n } = useTranslation();

    // Selected show and state
    const [selectedShow, setSelectedShow] = useState<Show | null>(null);
    const [seasonsData, setSeasonsData] = useState<SeasonRatingsData[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    // Search state
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [isSearchDropdownOpen, setIsSearchDropdownOpen] = useState(false);
    const [filterCategory, setFilterCategory] = useState<'all' | 'tv' | 'anime'>('all');
    const searchDropdownRef = useRef<HTMLDivElement>(null);

    useSEO(
        selectedShow ? `Episode Ratings Graph - ${selectedShow.title} | Watchlistey` : 'Episode Ratings Graph | Watchlistey',
        'Explore TV Series and Anime episode ratings heatmaps and interactive charts with external and Watchlistey community ratings.'
    );

    // Close search dropdown on click outside
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (searchDropdownRef.current && !searchDropdownRef.current.contains(e.target as Node)) {
                setIsSearchDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Load initial show or switch show
    const loadShowRatings = async (showId: number) => {
        setIsLoading(true);
        setError(null);
        try {
            const show = await getShowDetails(showId, 'tv', true, i18n.language);
            if (!show) {
                setError('Failed to find TV Series details.');
                setIsLoading(false);
                return;
            }
            setSelectedShow(show);

            // Fetch all seasons episodes ratings
            if (show.seasons && show.seasons.length > 0) {
                const data = await fetchSeriesEpisodesRatings(show.id, show.seasons, i18n.language, currentUserId);
                setSeasonsData(data);
            } else {
                setSeasonsData([]);
            }
        } catch (err) {
            console.error('Failed to load episode ratings graph:', err);
            setError('Could not load episode ratings for this show.');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadShowRatings(initialShowId);
    }, [initialShowId, i18n.language, currentUserId]);

    // Live Search debounce
    useEffect(() => {
        if (!searchQuery.trim() || searchQuery.length < 2) {
            setSearchResults([]);
            setIsSearchDropdownOpen(false);
            return;
        }

        const timer = setTimeout(async () => {
            setIsSearching(true);
            try {
                const res = await searchSpecific(searchQuery.trim(), 'tv', 1, i18n.language);
                if (res?.results) {
                    setSearchResults(res.results.slice(0, 8));
                    setIsSearchDropdownOpen(true);
                }
            } catch (e) {
                console.error(e);
            } finally {
                setIsSearching(false);
            }
        }, 300);

        return () => clearTimeout(timer);
    }, [searchQuery, i18n.language]);

    // Filter presets
    const filteredPresets = POPULAR_PRESETS.filter(p => {
        if (filterCategory === 'tv') return p.type === 'tv';
        if (filterCategory === 'anime') return p.type === 'anime';
        return true;
    });

    return (
        <div className="min-h-screen bg-white dark:bg-[#0f0f0f] text-gray-900 dark:text-white pt-24 pb-20 transition-colors">
            <div className="max-w-7xl mx-auto px-4 md:px-8 space-y-10">
                {/* Header & Search Hero */}
                <div className="text-center max-w-3xl mx-auto space-y-4">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-primary/10 border border-brand-primary/20 text-brand-primary text-xs font-semibold">
                        <span>New Feature</span>
                        <span aria-hidden="true">·</span>
                        <span>Interactive Episode Ratings</span>
                    </div>

                    <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-gray-900 dark:text-white">
                        Episode Ratings Graph
                    </h1>

                    <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
                        Explore series trajectories, season arcs, and standalone peaks. Compare external ratings side-by-side with Watchlistey community scores.
                    </p>

                    {/* Instant Search Bar */}
                    <div className="relative max-w-xl mx-auto mt-6" ref={searchDropdownRef}>
                        <div className="relative flex items-center">
                            <SearchIconV2 className="absolute left-4 w-5 h-5 text-gray-400 pointer-events-none" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                onFocus={() => {
                                    if (searchResults.length > 0) setIsSearchDropdownOpen(true);
                                }}
                                placeholder="Search any TV Series or Anime (e.g. Breaking Bad, Attack on Titan)..."
                                className="w-full py-3.5 pl-12 pr-10 rounded-2xl bg-gray-100 dark:bg-[#181818] border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-primary transition-all text-sm shadow-sm"
                            />
                            {isSearching && (
                                <div className="absolute right-4 w-4 h-4 border-2 border-brand-primary border-t-transparent rounded-full animate-spin"></div>
                            )}
                        </div>

                        {/* Search Autocomplete Dropdown */}
                        {isSearchDropdownOpen && searchResults.length > 0 && (
                            <div className="absolute left-0 right-0 top-full mt-2 rounded-2xl bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-white/10 shadow-2xl overflow-hidden z-50 text-start animate-fade-in max-h-80 overflow-y-auto">
                                {searchResults.map((item) => (
                                    <button
                                        key={item.id}
                                        onClick={() => {
                                            setSearchQuery('');
                                            setIsSearchDropdownOpen(false);
                                            onNavigate(`/ratings/${slugify(item.name || item.title)}`);
                                        }}
                                        className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors border-b border-gray-100 dark:border-white/5 last:border-none text-start cursor-pointer"
                                    >
                                        <div className="w-10 h-14 flex-shrink-0 rounded-md bg-gray-200 dark:bg-zinc-800 overflow-hidden">
                                            {item.poster_path ? (
                                                <img
                                                    src={`https://image.tmdb.org/t/p/w92${item.poster_path}`}
                                                    alt={item.name}
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : null}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h4 className="text-sm font-bold text-gray-900 dark:text-white truncate">
                                                {item.name}
                                            </h4>
                                            <div className="flex items-center gap-2 text-xs text-gray-500 mt-0.5">
                                                <span>{item.first_air_date ? new Date(item.first_air_date).getFullYear() : 'TV'}</span>
                                                {item.vote_average > 0 && (
                                                    <>
                                                        <span>·</span>
                                                        <span className="text-amber-500 font-semibold">{item.vote_average.toFixed(1)} ★</span>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                        <ArrowRightIcon className="w-4 h-4 text-gray-400 flex-shrink-0" />
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Popular Quick-Select Presets */}
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Quick Presets:</span>
                            <div className="flex items-center gap-1 p-0.5 bg-gray-100 dark:bg-[#1a1a1a] rounded-lg">
                                <button
                                    onClick={() => setFilterCategory('all')}
                                    className={`px-2.5 py-1 text-xs rounded-md font-medium transition-colors ${
                                        filterCategory === 'all'
                                            ? 'bg-white dark:bg-[#252525] text-gray-900 dark:text-white shadow-xs'
                                            : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
                                    }`}
                                >
                                    All
                                </button>
                                <button
                                    onClick={() => setFilterCategory('tv')}
                                    className={`px-2.5 py-1 text-xs rounded-md font-medium transition-colors ${
                                        filterCategory === 'tv'
                                            ? 'bg-white dark:bg-[#252525] text-gray-900 dark:text-white shadow-xs'
                                            : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
                                    }`}
                                >
                                    TV Series
                                </button>
                                <button
                                    onClick={() => setFilterCategory('anime')}
                                    className={`px-2.5 py-1 text-xs rounded-md font-medium transition-colors ${
                                        filterCategory === 'anime'
                                            ? 'bg-white dark:bg-[#252525] text-gray-900 dark:text-white shadow-xs'
                                            : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
                                    }`}
                                >
                                    Anime
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 overflow-x-auto scrollbar-hide pb-2 snap-x">
                        {filteredPresets.map((preset) => {
                            const isCurrent = selectedShow?.id === preset.id;
                            return (
                                <button
                                    key={preset.id}
                                    onClick={() => onNavigate(`/ratings/${slugify(preset.title)}`)}
                                    className={`flex-shrink-0 flex items-center gap-2.5 p-1.5 pe-3 rounded-xl border transition-all text-start snap-start cursor-pointer hover:scale-105 ${
                                        isCurrent
                                            ? 'bg-brand-primary/10 border-brand-primary text-gray-900 dark:text-white ring-1 ring-brand-primary/30'
                                            : 'bg-gray-50 dark:bg-[#161616] border-gray-200 dark:border-white/5 hover:border-gray-300 dark:hover:border-white/20'
                                    }`}
                                >
                                    <img
                                        src={preset.poster}
                                        alt={preset.title}
                                        className="w-8 h-11 object-cover rounded-md flex-shrink-0"
                                    />
                                    <div className="min-w-0">
                                        <span className="text-xs font-bold block truncate max-w-[130px]">{preset.title}</span>
                                        <div className="flex items-center gap-1.5 text-[10px] text-gray-400 mt-0.5">
                                            <span>{preset.year}</span>
                                            <span>·</span>
                                            <span className="text-amber-500 font-semibold">{preset.rating} ★</span>
                                        </div>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Show Details Header Banner */}
                {selectedShow && (
                    <div className="relative rounded-3xl overflow-hidden bg-gray-900 text-white p-6 sm:p-8 border border-white/10 shadow-lg">
                        {selectedShow.backdrop_url && (
                            <img
                                src={selectedShow.backdrop_url}
                                alt={selectedShow.title}
                                className="absolute inset-0 w-full h-full object-cover object-center opacity-25 filter blur-xs"
                            />
                        )}
                        <div className="absolute inset-0 bg-gradient-to-r from-[#0f0f0f] via-[#0f0f0f]/90 to-transparent"></div>

                        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
                            <div className="flex items-center gap-5">
                                <img
                                    src={selectedShow.image_url}
                                    alt={selectedShow.title}
                                    className="w-20 sm:w-24 aspect-[2/3] object-cover rounded-xl shadow-md border border-white/10"
                                />
                                <div className="space-y-1.5">
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs font-bold px-2 py-0.5 rounded bg-brand-primary text-black">
                                            {selectedShow.is_anime ? 'ANIME' : 'TV SERIES'}
                                        </span>
                                        {selectedShow.year > 0 && (
                                            <span className="text-xs text-gray-400">{selectedShow.year}</span>
                                        )}
                                        {selectedShow.status && (
                                            <span className="text-xs text-gray-400">· {selectedShow.status}</span>
                                        )}
                                    </div>

                                    <h2 className="text-2xl sm:text-3xl font-black text-white">
                                        {selectedShow.title}
                                    </h2>

                                    <div className="flex flex-wrap items-center gap-3 text-xs text-gray-300">
                                        <span>{seasonsData.length} Seasons</span>
                                        <span>·</span>
                                        <span>
                                            {seasonsData.reduce((acc, curr) => acc + curr.episodes.length, 0)} Episodes
                                        </span>
                                        {selectedShow.genres && selectedShow.genres.length > 0 && (
                                            <>
                                                <span>·</span>
                                                <span className="text-gray-400">{selectedShow.genres.slice(0, 3).join(', ')}</span>
                                            </>
                                        )}
                                    </div>

                                    <div className="pt-1">
                                        <code className="text-xs font-mono text-brand-primary bg-black/40 px-2 py-0.5 rounded border border-brand-primary/30">
                                            www.watchlistey.com/ratings/{slugify(selectedShow.title)}
                                        </code>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-3 self-stretch sm:self-auto">
                                <button
                                    onClick={() => onNavigate(`/ratings/${slugify(selectedShow.title)}`)}
                                    className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-brand-primary text-black text-xs font-bold transition-all hover:opacity-90 flex items-center justify-center gap-2 shadow-md cursor-pointer"
                                >
                                    <span>Dedicated Ratings Page</span>
                                    <ArrowRightIcon className="w-4 h-4 rtl:rotate-180" />
                                </button>
                                <button
                                    onClick={() => onNavigate(`/tv/${slugify(selectedShow.title)}`)}
                                    className="px-3.5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold backdrop-blur-md transition-colors flex items-center gap-2 border border-white/10 cursor-pointer"
                                >
                                    <span>Series Info</span>
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Main Graph Content */}
                {isLoading ? (
                    <div className="py-24 flex flex-col items-center justify-center gap-3">
                        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-brand-primary"></div>
                        <span className="text-xs text-gray-400">Loading episodes and rating statistics...</span>
                    </div>
                ) : error ? (
                    <div className="text-center py-20 bg-gray-50 dark:bg-[#161616] rounded-2xl border border-gray-200 dark:border-white/5 space-y-3">
                        <p className="text-sm text-red-400">{error}</p>
                        <button
                            onClick={() => loadShowRatings(initialShowId)}
                            className="px-4 py-2 rounded-xl bg-brand-primary text-black font-bold text-xs"
                        >
                            Try Default Show
                        </button>
                    </div>
                ) : selectedShow && seasonsData.length > 0 ? (
                    <EpisodeRatingsGraph
                        showId={selectedShow.id}
                        showTitle={selectedShow.title}
                        seasonsData={seasonsData}
                        onNavigate={onNavigate}
                        currentUserId={currentUserId}
                        isLoggedIn={isLoggedIn}
                    />
                ) : (
                    <div className="text-center py-20 bg-gray-50 dark:bg-[#161616] rounded-2xl border border-gray-200 dark:border-white/5">
                        <p className="text-sm text-gray-400">No episodes found for this show.</p>
                    </div>
                )}
            </div>
        </div>
    );
};
