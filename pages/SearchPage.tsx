import React, { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import { Show, ListItem, ListStatus } from '../types';
import { SearchIconV2, CaretDownIcon, FilterIcon, CloseIcon } from '../constants';
import { searchMulti, slugify, discoverMedia, getPopularPeople } from '../lib/tmdb';
import { searchUsers } from '../lib/supabaseClient';
import ShowCard from '../components/ShowCard';
import FilterSidebar from '../components/FilterSidebar';
import AdSense from '../components/AdSense';
import { useTranslation } from 'react-i18next';

interface SearchPageProps {
    onNavigate: (path: string, state?: Show) => void;
    onBack: () => void;
    userList: Record<number, ListItem>;
    userFavorites?: Record<number, ListItem>;
    userCharacters?: Record<number, ListItem>;
    handleUpdateListStatus: (showId: number, status: ListStatus | null, show?: Show) => void;
    handleToggleFavorite?: (show: Show) => void;
}

const SearchPage: React.FC<SearchPageProps> = ({ onNavigate, onBack, userList, userFavorites, userCharacters, handleUpdateListStatus, handleToggleFavorite }) => {
    const { t } = useTranslation();
    const getInitialParams = () => {
        const params = new URLSearchParams(window.location.search);
        return {
            q: params.get('q') || '',
            type: (params.get('type') || 'all') as 'all' | 'movie' | 'tv' | 'person' | 'user',
            genres: params.get('genres') ? params.get('genres')!.split(',') : [],
            year: params.get('year') || '',
            rating: parseInt(params.get('rating') || '0'),
            status: params.get('status') || '',
            seasonCount: params.get('seasonCount') || '',
            language: params.get('language') || '',
            minEpisodes: params.get('minEpisodes') || ''
        };
    };

    const initial = getInitialParams();
    const [query, setQuery] = useState(initial.q);
    const [results, setResults] = useState<Show[]>([]);
    const [totalResults, setTotalResults] = useState(0);
    const [loading, setLoading] = useState(false);
    const [loadingMore, setLoadingMore] = useState(false);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [selectedType, setSelectedType] = useState(initial.type);
    const [selectedGenres, setSelectedGenres] = useState<string[]>(initial.genres);
    const [minRating, setMinRating] = useState(initial.rating);
    const [year, setYear] = useState(initial.year);
    const [status, setStatus] = useState(initial.status);
    const [seasonCount, setSeasonCount] = useState(initial.seasonCount);
    const [language, setLanguage] = useState(initial.language);
    const [minEpisodes, setMinEpisodes] = useState(initial.minEpisodes);
    const [sortBy, setSortBy] = useState('relevance');
    const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);

    useEffect(() => {
        const params = new URLSearchParams();
        if (query) params.set('q', query);
        if (selectedType !== 'all') params.set('type', selectedType);
        if (selectedGenres.length > 0) params.set('genres', selectedGenres.join(','));
        if (year) params.set('year', year);
        if (minRating > 0) params.set('rating', minRating.toString());
        if (status) params.set('status', status);
        if (seasonCount) params.set('seasonCount', seasonCount);
        if (language) params.set('language', language);
        if (minEpisodes) params.set('minEpisodes', minEpisodes);
        const newUrl = `${window.location.pathname}?${params.toString()}`;
        if (newUrl !== window.location.pathname + window.location.search) {
            window.history.replaceState({}, '', newUrl);
        }
    }, [query, selectedType, selectedGenres, year, minRating, status, seasonCount, language, minEpisodes]);

    useEffect(() => {
        const handlePopState = () => {
            const p = getInitialParams();
            setQuery(p.q);
            setSelectedType(p.type);
            setSelectedGenres(p.genres);
            setYear(p.year);
            setMinRating(p.rating);
            setStatus(p.status);
            setSeasonCount(p.seasonCount);
            setLanguage(p.language);
            setMinEpisodes(p.minEpisodes);
        };
        window.addEventListener('popstate', handlePopState);
        return () => window.removeEventListener('popstate', handlePopState);
    }, []);

    useEffect(() => {
        const fetchInitialData = async () => {
            setLoading(true);
            setPage(1);
            setHasMore(true);
            setResults([]); 
            setTotalResults(0);
            try {
                let newResults: Show[] = [];
                let total = 0;
                if (selectedType === 'user') {
                    const data = await searchUsers(query, 1);
                    newResults = data.results;
                    total = data.total_results;
                    setHasMore(newResults.length === 20);
                } else if (selectedType === 'all') {
                    if (query.trim()) {
                        const tmdbData = await searchMulti(query, 1);
                        newResults = tmdbData.results;
                        total = tmdbData.total_results;
                        setHasMore(tmdbData.results.length > 0);
                    } else {
                        const tmdbData = await discoverMedia('all', { genres: selectedGenres, minRating, year, isAnime: false, language }, 1);
                        newResults = tmdbData.results;
                        total = tmdbData.total_results; 
                        setHasMore(true);
                    }
                } else if (selectedType === 'person') {
                    if (query.trim()) {
                        const data = await searchMulti(query, 1);
                        newResults = data.results.filter(i => i.media_type === 'person');
                        total = data.total_results;
                    } else {
                        const people = await getPopularPeople(1);
                        newResults = people;
                        total = 10000;
                    }
                    if (newResults.length < 20) setHasMore(false);
                } else {
                    if (query.trim()) {
                        const data = await searchMulti(query, 1);
                        newResults = data.results.filter(i => i.media_type === selectedType);
                        total = data.total_results;
                    } else {
                        const data = await discoverMedia(selectedType, { genres: selectedGenres, minRating, year, isAnime: false, language }, 1);
                        newResults = data.results;
                        total = data.total_results;
                    }
                    if (newResults.length < 20) setHasMore(false);
                }
                setResults(newResults);
                setTotalResults(total);
            } catch (error) {
                console.error("Failed to fetch data", error);
                setHasMore(false);
            } finally {
                setLoading(false);
            }
        };
        const timeoutId = setTimeout(fetchInitialData, 500);
        return () => clearTimeout(timeoutId);
    }, [query, selectedType, selectedGenres, minRating, year, status, language]); 

    const handleLoadMore = useCallback(async () => {
        if (loadingMore || !hasMore || loading) return;
        setLoadingMore(true);
        const nextPage = page + 1;
        try {
            let newResults: Show[] = [];
            if (selectedType === 'user') {
                const data = await searchUsers(query, nextPage);
                newResults = data.results;
                setHasMore(newResults.length === 20);
            } else if (selectedType === 'all') {
                if (query.trim()) {
                    const tmdbData = await searchMulti(query, nextPage);
                    newResults = tmdbData.results;
                    if (tmdbData.results.length === 0) setHasMore(false);
                } else {
                    const tmdbData = await discoverMedia('all', { genres: selectedGenres, minRating, year, isAnime: false, language }, nextPage);
                    newResults = tmdbData.results;
                    if (tmdbData.results.length === 0) setHasMore(false);
                }
            } else if (selectedType === 'person') {
                if (query.trim()) {
                    const data = await searchMulti(query, nextPage);
                    newResults = data.results.filter(i => i.media_type === 'person');
                } else {
                    const people = await getPopularPeople(nextPage);
                    newResults = people;
                }
                if (newResults.length < 20) setHasMore(false);
            } else {
                if (query.trim()) {
                    const data = await searchMulti(query, nextPage);
                    newResults = data.results.filter(i => i.media_type === selectedType);
                } else {
                    const data = await discoverMedia(selectedType, { genres: selectedGenres, minRating, year, isAnime: false, language }, nextPage);
                    newResults = data.results;
                }
                if (newResults.length < 20) setHasMore(false);
            }
            if (newResults.length > 0) {
                setResults(prev => {
                    const existingIds = new Set(prev.map(i => i.id));
                    const uniqueNew = newResults.filter(i => !existingIds.has(i.id));
                    return [...prev, ...uniqueNew];
                });
                setPage(nextPage);
            } else {
                setHasMore(false);
            }
        } catch (error) {
            console.error("Failed to load more", error);
            setHasMore(false);
        } finally {
            setLoadingMore(false);
        }
    }, [query, selectedType, selectedGenres, minRating, year, status, language, page, hasMore, loadingMore, loading]);

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
        if (show.media_type === 'user' && show.username) {
            onNavigate(`/u/${show.username}`);
            return;
        }
        const slug = slugify(show.title);
        if (show.media_type === 'person') {
            onNavigate(`/person/${slug}`, show);
        } else {
            const prefix = show.media_type === 'tv' ? '/tv/' : '/movie/';
            if (show.is_anime) onNavigate(`/anime/${slug}`, show);
            else onNavigate(`${prefix}${slug}`, show);
        }
    };

    const toggleGenre = (genre: string) => {
        if (selectedGenres.includes(genre)) {
            setSelectedGenres(prev => prev.filter(g => g !== genre));
        } else {
            setSelectedGenres(prev => [...prev, genre]);
        }
    };

    const clearFilters = () => {
        setSelectedType('all');
        setSelectedGenres([]);
        setMinRating(0);
        setYear('');
        setStatus('');
        setSeasonCount('');
        setLanguage('');
        setMinEpisodes('');
        setSortBy('relevance');
        setQuery('');
        setResults([]); 
        setTotalResults(0);
    };

    const activeFiltersCount = (selectedType !== 'all' ? 1 : 0) 
        + selectedGenres.length 
        + (minRating > 0 ? 1 : 0) 
        + (year ? 1 : 0)
        + (status ? 1 : 0)
        + (seasonCount ? 1 : 0)
        + (language ? 1 : 0)
        + (minEpisodes ? 1 : 0);

    const filteredResults = useMemo(() => {
        let filtered = [...results];
        if (selectedType !== 'user' && selectedType !== 'person') {
             if (query.trim()) {
                if (selectedType !== 'all') {
                    filtered = filtered.filter(show => show.media_type === selectedType);
                }
                if (selectedGenres.length > 0) {
                    filtered = filtered.filter(show => 
                        show.genres?.some(g => selectedGenres.includes(g))
                    );
                }
                if (minRating > 0) {
                    filtered = filtered.filter(show => (show.rating || 0) >= minRating);
                }
                if (year.trim()) {
                     filtered = filtered.filter(show => show.year?.toString() === year.trim());
                }
                if (language) {
                    filtered = filtered.filter(show => show.original_language === language);
                }
            }
            if (status) {
                filtered = filtered.filter(show => !show.status || show.status === status);
            }
            if (seasonCount) {
                 const minSeasons = parseInt(seasonCount);
                 filtered = filtered.filter(show => {
                     if (show.media_type !== 'tv') return true;
                     if (!show.number_of_seasons) return true;
                     return show.number_of_seasons >= minSeasons;
                 });
            }
        }
        return filtered.sort((a, b) => {
            if (sortBy === 'rating') return (b.rating || 0) - (a.rating || 0);
            if (sortBy === 'newest') return (b.year || 0) - (a.year || 0);
            if (sortBy === 'oldest') return (a.year || 0) - (b.year || 0);
            if (sortBy === 'name_asc') return a.title.localeCompare(b.title);
            if (sortBy === 'name_desc') return b.title.localeCompare(a.title);
            return 0;
        });
    }, [results, query, selectedType, selectedGenres, minRating, year, status, seasonCount, language, minEpisodes, sortBy]);

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-[#0f0f0f] pb-12 pt-18 md:pt-20 transition-colors duration-200">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="flex flex-col lg:flex-row gap-8">
                    
                    <FilterSidebar 
                        selectedType={selectedType as any}
                        onTypeChange={(t) => setSelectedType(t as any)}
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
                        language={language}
                        onLanguageChange={setLanguage}
                        minEpisodes={minEpisodes}
                        onMinEpisodesChange={setMinEpisodes}
                        isOpen={isMobileFiltersOpen}
                        activeFiltersCount={activeFiltersCount}
                        onClearFilters={clearFilters}
                        searchQuery={query}
                        onSearchChange={(val) => setQuery(val)}
                    />

                    <div className="flex-1 min-w-0">
                        <div className="lg:hidden mb-4 flex justify-end">
                             <button 
                                onClick={() => setIsMobileFiltersOpen(!isMobileFiltersOpen)}
                                className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-[#1e1e1e] border border-gray-300 dark:border-gray-700 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-200"
                             >
                                <FilterIcon className="w-5 h-5" />
                                {t('search.filters')} {activeFiltersCount > 0 && `(${activeFiltersCount})`}
                            </button>
                        </div>

                        {/* Ad Placement: Top of results Unit */}
                        <AdSense slot="5904887585" className="mb-8" />

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
                                        className="appearance-none ps-3 pe-8 py-1.5 bg-white dark:bg-[#1e1e1e] border border-gray-300 dark:border-gray-700 rounded-md text-sm font-medium text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-brand-primary transition-shadow cursor-pointer"
                                    >
                                        <option value="relevance">{t('search.relevance')}</option>
                                        <option value="newest">{t('search.newest')}</option>
                                        <option value="oldest">{t('search.oldest')}</option>
                                        <option value="rating">{t('search.rating')}</option>
                                        <option value="name_asc">{t('search.name_asc')}</option>
                                        <option value="name_desc">{t('search.name_desc')}</option>
                                    </select>
                                    <CaretDownIcon className="absolute end-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
                                </div>
                            </div>
                        </div>

                        {loading && results.length === 0 ? (
                             <div className="flex flex-col items-center justify-center py-20">
                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-[#fdfa84]"></div>
                                <p className="mt-4 text-gray-500 dark:text-gray-400">{t('common.loading')}</p>
                            </div>
                        ) : filteredResults.length > 0 ? (
                            <>
                                <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                    {filteredResults.map(show => (
                                        <ShowCard 
                                            key={`${show.media_type}-${show.id}-${Math.random()}`} 
                                            show={show} 
                                            onShowClick={handleShowClick} 
                                            userList={userList}
                                            userFavorites={userFavorites}
                                            userCharacters={userCharacters} 
                                            handleUpdateListStatus={handleUpdateListStatus}
                                            handleToggleFavorite={handleToggleFavorite}
                                        />
                                    ))}
                                </div>
                                {hasMore && (
                                    <div ref={lastElementRef} className="flex justify-center py-8">
                                        {loadingMore ? (
                                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-600 dark:border-gray-400"></div>
                                        ) : (
                                            <button onClick={handleLoadMore} className="px-6 py-2 bg-white dark:bg-[#1e1e1e] border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-[#2a2a2a] transition-colors font-medium">
                                                Load More
                                            </button>
                                        )}
                                    </div>
                                )}
                            </>
                        ) : (
                            <div className="text-center py-20 bg-white dark:bg-[#1e1e1e] rounded-lg border border-gray-200 dark:border-gray-800 border-dashed">
                                <SearchIconV2 className="w-16 h-16 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
                                <h3 className="text-lg font-medium text-gray-900 dark:text-white">{t('search.no_results')}</h3>
                                {activeFiltersCount > 0 && (
                                    <button onClick={clearFilters} className="mt-4 px-4 py-2 bg-gray-100 dark:bg-[#2a2a2a] text-gray-700 dark:text-gray-200 rounded-md text-sm font-medium hover:bg-gray-200 dark:hover:bg-[#333] transition-colors">{t('search.clear_all')}</button>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SearchPage;