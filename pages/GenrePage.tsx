
import React, { useEffect, useState, useMemo, useRef, useCallback } from 'react';
import { Show, ListItem, ListStatus } from '../types';
import { ChevronLeftIcon, CaretDownIcon, FilterIcon } from '../constants';
import { getGenreName, slugify, discoverMedia } from '../lib/tmdb';
import ShowCard from '../components/ShowCard';
import FilterSidebar from '../components/FilterSidebar';
import { useSEO } from '../hooks/useSEO';
import { useTranslation } from 'react-i18next';

interface GenrePageProps {
    genreId: string;
    onNavigate: (path: string, state?: Show) => void;
    onBack: () => void;
    userList: Record<number, ListItem>;
    userFavorites?: Record<number, ListItem>;
    handleUpdateListStatus: (showId: number, status: ListStatus | null, show?: Show) => void;
    handleToggleFavorite?: (show: Show) => void;
}

const GenrePage: React.FC<GenrePageProps> = ({ genreId, onNavigate, onBack, userList, userFavorites, handleUpdateListStatus, handleToggleFavorite }) => {
    const { t, i18n } = useTranslation();
    const [shows, setShows] = useState<Show[]>([]);
    const [totalResults, setTotalResults] = useState(0);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    
    // Resolve Name if slug
    const isNumeric = /^\d+$/.test(genreId);
    const genreNameRaw = isNumeric 
        ? getGenreName(parseInt(genreId)) 
        : genreId.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');

    const genreName = t(`genres.${genreNameRaw}`, genreNameRaw);

    // --- SEO ---
    useSEO(
        `${genreName} Movies`, 
        `Browse popular and top rated ${genreName} movies. Find new favorites and create your watchlist.`
    );
    // -----------

    // Filter States
    const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
    const [minRating, setMinRating] = useState(0);
    const [year, setYear] = useState('');
    const [status, setStatus] = useState('');
    const [seasonCount, setSeasonCount] = useState('');
    const [sortBy, setSortBy] = useState('relevance'); // Note: API sort is limited, client side sort is done on current batch
    const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);

    // Reset page when filters change
    useEffect(() => {
        setPage(1);
        setShows([]);
        setHasMore(true);
    }, [genreId, selectedGenres, minRating, year, status, seasonCount]);

    // Primary Fetcher
    const fetchShows = useCallback(async (pageToFetch: number) => {
        try {
            // Combine the main genre with selected filters
            // If "selectedGenres" has items, add them. 
            // Note: Use raw English name for API request
            const allGenres = [genreNameRaw, ...selectedGenres];
            
            const data = await discoverMedia('movie', {
                genres: allGenres,
                minRating: minRating,
                year: year,
                language: i18n.language
                // TMDB API doesn't support status/seasonCount easily for movies in discover without complex logic,
                // so we rely on what we can filter or just basic discover
            }, pageToFetch);
            
            return data;
        } catch (error) {
            console.error("Failed to fetch genre shows", error);
            return { results: [], total_results: 0 };
        }
    }, [genreNameRaw, selectedGenres, minRating, year, i18n.language]);

    // Initial Load
    useEffect(() => {
        const loadInitial = async () => {
            setLoading(true);
            const data = await fetchShows(1);
            setShows(data.results);
            setTotalResults(data.total_results);
            if (data.results.length < 20) setHasMore(false);
            setLoading(false);
        };
        loadInitial();
    }, [fetchShows]);

    // Infinite Scroll Load
    const handleLoadMore = useCallback(async () => {
        if (loadingMore || !hasMore || loading) return;
        setLoadingMore(true);
        const nextPage = page + 1;
        const data = await fetchShows(nextPage);
        
        if (data.results.length === 0) {
            setHasMore(false);
        } else {
            setShows(prev => {
                const existingIds = new Set(prev.map(s => s.id));
                const uniqueNew = data.results.filter(s => !existingIds.has(s.id));
                return [...prev, ...uniqueNew];
            });
            setPage(nextPage);
            if (data.results.length < 20) setHasMore(false);
        }
        setLoadingMore(false);
    }, [loadingMore, hasMore, loading, page, fetchShows]);

    // Observer
    const observer = useRef<IntersectionObserver | null>(null);
    const lastElementRef = useCallback((node: HTMLDivElement) => {
        if (loading || loadingMore) return;
        if (observer.current) observer.current.disconnect();
        
        observer.current = new IntersectionObserver(entries => {
            if (entries[0].isIntersecting && hasMore) {
                handleLoadMore();
            }
        });
        
        if (node) observer.current.observe(node);
    }, [loading, loadingMore, hasMore, handleLoadMore]);


    const handleShowClick = (show: Show) => {
        const slug = slugify(show.title);
        const prefix = show.is_anime ? '/anime/' : show.media_type === 'tv' ? '/tv/' : '/movie/';
        // Use Clean URL
        onNavigate(`${prefix}${slug}`, show);
    };

    const toggleGenre = (genre: string) => {
        if (selectedGenres.includes(genre)) {
            setSelectedGenres(prev => prev.filter(g => g !== genre));
        } else {
            setSelectedGenres(prev => [...prev, genre]);
        }
    };

    const clearFilters = () => {
        setSelectedGenres([]);
        setMinRating(0);
        setYear('');
        setStatus('');
        setSeasonCount('');
        setSortBy('relevance');
    };

    const activeFiltersCount = selectedGenres.length + (minRating > 0 ? 1 : 0) + (year ? 1 : 0) + (status ? 1 : 0) + (seasonCount ? 1 : 0);

    // Client-Side Post-Processing (Sort/Filter for things API missed)
    const filteredResults = useMemo(() => {
        let filtered = [...shows];

        // API handles Genres/Rating/Year mostly, but let's enforce strict consistency or additional filters
        
        // 4. Status (Client side only as API support varies)
        if (status) {
            filtered = filtered.filter(show => !show.status || show.status === status);
        }

        // 5. Season Count (Client side)
        if (seasonCount) {
             const minSeasons = parseInt(seasonCount);
             filtered = filtered.filter(show => {
                 if (show.media_type !== 'tv') return true; 
                 if (!show.number_of_seasons) return true; 
                 return show.number_of_seasons >= minSeasons;
             });
        }

        // 6. Sort (Client Side on loaded buffer)
        return filtered.sort((a, b) => {
            if (sortBy === 'rating') return (b.rating || 0) - (a.rating || 0);
            if (sortBy === 'newest') return (b.year || 0) - (a.year || 0);
            if (sortBy === 'oldest') return (a.year || 0) - (b.year || 0);
            if (sortBy === 'name_asc') return a.title.localeCompare(b.title);
            if (sortBy === 'name_desc') return b.title.localeCompare(a.title);
            return 0;
        });
    }, [shows, status, seasonCount, sortBy]);


    if (loading && shows.length === 0) {
        return (
            <div className="flex h-screen items-center justify-center bg-white dark:bg-[#0f0f0f]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-primary"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-[#0f0f0f] pb-12 pt-18 md:pt-20 transition-colors duration-200">
             <div className="bg-white dark:bg-[#1e1e1e] shadow-sm border-b border-gray-200 dark:border-gray-800 sticky top-18 md:top-20 z-20 transition-colors duration-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center gap-4">
                    <button onClick={onBack} className="p-2 hover:bg-gray-100 dark:hover:bg-[#2a2a2a] rounded-full text-gray-600 dark:text-gray-300">
                        <ChevronLeftIcon />
                    </button>
                    <div className="flex-1">
                        <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                            {genreName} <span className="font-normal text-gray-500 dark:text-gray-400">Movies</span>
                        </h1>
                    </div>
                     <button 
                        onClick={() => setIsMobileFiltersOpen(!isMobileFiltersOpen)}
                        className="lg:hidden p-2 text-gray-600 dark:text-gray-300 relative bg-transparent hover:bg-gray-100 dark:hover:bg-[#2a2a2a] rounded-full"
                    >
                        <FilterIcon className="w-6 h-6" />
                        {activeFiltersCount > 0 && (
                            <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-brand-primary rounded-full border-2 border-white dark:border-[#1e1e1e]"></span>
                        )}
                    </button>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                 <div className="flex flex-col lg:flex-row gap-8">
                    
                    {/* Filter Sidebar */}
                    <FilterSidebar 
                        selectedGenres={selectedGenres}
                        onGenreToggle={toggleGenre}
                        minRating={minRating}
                        onMinRatingChange={setMinRating}
                        year={year}
                        onYearChange={setYear}
                        status={status}
                        onStatusChange={setStatus}
                        seasonCount={seasonCount}
                        onSeasonCountChange={setSeasonCount}
                        isOpen={isMobileFiltersOpen}
                        activeFiltersCount={activeFiltersCount}
                        onClearFilters={clearFilters}
                    />

                    {/* Main Content */}
                    <div className="flex-1 min-w-0">
                         {/* Sort Bar */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                {t('search.found_results', { count: totalResults > 0 ? totalResults : filteredResults.length })}
                            </p>
                            
                            <div className="flex items-center gap-2">
                                <span className="text-sm text-gray-500 dark:text-gray-400">{t('search.sort_by')}:</span>
                                <div className="relative">
                                    <select
                                        value={sortBy}
                                        onChange={(e) => setSortBy(e.target.value)}
                                        className="appearance-none pl-3 pr-8 py-1.5 bg-white dark:bg-[#1e1e1e] border border-gray-300 dark:border-gray-700 rounded-md text-sm font-medium text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-primary transition-shadow cursor-pointer"
                                    >
                                        <option value="relevance">{t('search.relevance')}</option>
                                        <option value="newest">{t('search.newest')}</option>
                                        <option value="oldest">{t('search.oldest')}</option>
                                        <option value="rating">{t('search.rating')}</option>
                                        <option value="name_asc">{t('search.name_asc')}</option>
                                        <option value="name_desc">{t('search.name_desc')}</option>
                                    </select>
                                    <CaretDownIcon className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
                                </div>
                            </div>
                        </div>

                        {filteredResults.length > 0 ? (
                            <>
                                <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                    {filteredResults.map(show => (
                                        <ShowCard 
                                            key={`${show.id}-${Math.random()}`} 
                                            show={show} 
                                            onShowClick={handleShowClick} 
                                            userList={userList} 
                                            userFavorites={userFavorites}
                                            handleUpdateListStatus={handleUpdateListStatus} 
                                            handleToggleFavorite={handleToggleFavorite}
                                        />
                                    ))}
                                </div>
                                {hasMore && (
                                    <div ref={lastElementRef} className="flex justify-center py-8">
                                        {loadingMore && (
                                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-primary"></div>
                                        )}
                                    </div>
                                )}
                            </>
                        ) : (
                             <div className="text-center py-20 bg-white dark:bg-[#1e1e1e] rounded-lg border border-gray-200 dark:border-gray-800 border-dashed">
                                <p className="text-gray-500 dark:text-gray-400">{t('search.no_results')}</p>
                                {activeFiltersCount > 0 && (
                                    <button 
                                        onClick={clearFilters}
                                        className="mt-4 px-4 py-2 bg-gray-100 dark:bg-[#2a2a2a] text-gray-700 dark:text-gray-200 rounded-md text-sm font-medium hover:bg-gray-200 dark:hover:bg-[#333] transition-colors"
                                    >
                                        {t('search.clear_all')}
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default GenrePage;
