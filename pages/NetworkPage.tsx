import React, { useEffect, useState, useMemo, useRef, useCallback } from 'react';
import { Show, ListItem, ListStatus } from '../types';
import { ChevronLeftIcon, LinkIcon, PlusIcon } from '../constants';
import { getShowsByNetwork, getNetworkDetails, slugify, getNetworkIdFromSlug } from '../lib/tmdb';
import ShowCard from '../components/ShowCard';
import { useSEO } from '../hooks/useSEO';
import NotFoundPage from './NotFoundPage';
import { useTranslation } from 'react-i18next';

interface NetworkPageProps {
    networkId: string; // Can be ID or slug
    onNavigate: (path: string) => void;
    onBack: () => void;
    userList: Record<number, ListItem>;
    userFavorites?: Record<number, ListItem>;
    userCharacters?: Record<number, ListItem>;
    handleUpdateListStatus: (showId: number, status: ListStatus | null, show?: Show) => void;
    handleToggleFavorite?: (show: Show) => void;
}

const NetworkPage: React.FC<NetworkPageProps> = ({ networkId, onNavigate, onBack, userList, userFavorites, userCharacters, handleUpdateListStatus, handleToggleFavorite }) => {
    const { i18n } = useTranslation();
    const [shows, setShows] = useState<Show[]>([]);
    const [network, setNetwork] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [loadingMore, setLoadingMore] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const [notFound, setNotFound] = useState(false);

    // --- SEO ---
    const seoTitle = network ? `${network.name}` : 'Network';
    const seoDesc = network ? `Watch TV shows and anime produced by ${network.name}. ${network.headquarters ? `Based in ${network.headquarters}.` : ''}` : undefined;
    useSEO(seoTitle, seoDesc);
    // -----------

    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            setNotFound(false);
            setPage(1);
            setHasMore(true);
            setShows([]);
            setNetwork(null);
            
            try {
                let networkData = null;
                let targetId: string | null = null;

                // STRATEGY 1: Check if input is purely numeric (Direct ID)
                if (/^\d+$/.test(networkId)) {
                    targetId = networkId;
                }
                
                // STRATEGY 2: Check for Legacy ID-Slug format (e.g. "213-netflix")
                if (!targetId) {
                    const idMatch = networkId.match(/^(\d+)-/);
                    if (idMatch) {
                        targetId = idMatch[1];
                    }
                }

                // If we identified a direct or legacy numeric ID, try fetching details directly
                if (targetId) {
                    try {
                        networkData = await getNetworkDetails(targetId);
                    } catch (e) {
                        console.warn(`Failed to fetch network by ID: ${targetId}, falling back to slug search.`);
                    }
                }

                // STRATEGY 3: If no data yet (or invalid ID), treat input as Slug and search
                if (!networkData) {
                    const resolvedId = await getNetworkIdFromSlug(networkId);
                    if (resolvedId) {
                         networkData = await getNetworkDetails(resolvedId.toString());
                    }
                }

                if (networkData) {
                     setNetwork(networkData);
                     // Fetch shows for that network ID
                     const showsData = await getShowsByNetwork(networkData.id.toString(), 1, i18n.language);
                     setShows(showsData);
                     if (showsData.length < 20) setHasMore(false);
                } else {
                    setNotFound(true);
                }
            } catch (error) {
                console.error("Failed to load network data", error);
                setNotFound(true);
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, [networkId, i18n.language]);

    const handleLoadMore = useCallback(async () => {
        if (loadingMore || !hasMore || !network || loading) return;
        setLoadingMore(true);
        const nextPage = page + 1;
        
        try {
            const newShows = await getShowsByNetwork(network.id.toString(), nextPage, i18n.language);
            
            if (newShows.length === 0) {
                setHasMore(false);
            } else {
                setShows(prev => [...prev, ...newShows]);
                setPage(nextPage);
                if (newShows.length < 20) setHasMore(false);
            }

        } catch (error) {
            console.error("Failed to load more shows", error);
            setHasMore(false);
        } finally {
            setLoadingMore(false);
        }
    }, [page, hasMore, network, loading, loadingMore, i18n.language]);

    // Infinite Scroll Observer
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
        onNavigate(`${prefix}${slug}`);
    };

    // Group shows by Year
    const groupedShows = useMemo(() => {
        const groups: Record<number, Show[]> = {};
        const unknownYear: Show[] = [];

        shows.forEach(show => {
            if (show.year && show.year > 0) {
                if (!groups[show.year]) groups[show.year] = [];
                groups[show.year].push(show);
            } else {
                unknownYear.push(show);
            }
        });

        // Sort years descending
        const sortedYears = Object.keys(groups).map(Number).sort((a, b) => b - a);
        
        return {
            sortedYears,
            groups,
            unknownYear
        };
    }, [shows]);

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center bg-white dark:bg-[#0f0f0f]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-brand-primary"></div>
            </div>
        );
    }

    if (notFound || !network) {
        return <NotFoundPage onNavigate={onNavigate} />;
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-[#0f0f0f] pb-12 pt-18 md:pt-20 transition-colors duration-200">
             <div className="bg-white dark:bg-[#1e1e1e] shadow-sm border-b border-gray-200 dark:border-gray-800 sticky top-18 md:top-20 z-20 transition-colors duration-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center gap-4">
                    <button onClick={onBack} className="p-2 hover:bg-gray-100 dark:hover:bg-[#2a2a2a] rounded-full text-gray-600 dark:text-gray-300">
                        <ChevronLeftIcon />
                    </button>
                    <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                        {network.name}
                    </h1>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="flex flex-col md:flex-row md:items-start gap-8 lg:gap-12">
                    {/* Sidebar / Info */}
                    <div className="w-full md:w-1/3 lg:w-1/4 flex-shrink-0">
                         <div className="sticky top-32">
                            {/* Card container */}
                             <div className="mb-6 flex items-center justify-center relative">
                                 {network.logo_path ? (
                                     <img 
                                        src={`https://image.tmdb.org/t/p/h632${network.logo_path}`} 
                                        alt={network.name} 
                                        className="w-full h-auto object-contain max-h-48 dark:invert-0"
                                        style={{ filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.1))' }}
                                     />
                                 ) : (
                                     <div className="text-3xl font-bold text-gray-300 dark:text-gray-600 text-center select-none border-2 border-dashed border-gray-300 dark:border-gray-700 p-8 rounded-lg w-full">{network.name}</div>
                                 )}
                             </div>
                             
                             <div className="space-y-4 text-gray-900 dark:text-white">
                                <div>
                                    <h3 className="text-lg font-semibold border-b border-gray-200 dark:border-gray-700 pb-2 mb-3">Network Info</h3>
                                </div>
                                
                                <div>
                                    <span className="block text-sm font-medium text-gray-500 dark:text-gray-400">Name</span>
                                    <span className="block font-medium">{network.name}</span>
                                </div>

                                {network.headquarters && (
                                    <div>
                                        <span className="block text-sm font-medium text-gray-500 dark:text-gray-400">Headquarters</span>
                                        <span className="block">{network.headquarters}</span>
                                    </div>
                                )}

                                 {network.origin_country && (
                                    <div>
                                        <span className="block text-sm font-medium text-gray-500 dark:text-gray-400">Country</span>
                                        <span className="block">
                                            {new Intl.DisplayNames(['en'], { type: 'region' }).of(network.origin_country) || network.origin_country}
                                        </span>
                                    </div>
                                )}

                                {network.homepage && (
                                    <div>
                                        <span className="block text-sm font-medium text-gray-500 dark:text-gray-400">Website</span>
                                        <a href={network.homepage} target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-brand-primary hover:underline break-all flex items-center gap-1 mt-1">
                                            <LinkIcon className="w-4 h-4 flex-shrink-0" /> Visit Homepage
                                        </a>
                                    </div>
                                )}
                            </div>
                         </div>
                    </div>

                    {/* Main Content: Timeline */}
                    <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-3xl font-bold text-gray-900 dark:text-white hidden md:block">{network.name} Productions</h2>
                             <span className="text-sm text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-[#1e1e1e] px-2 py-1 rounded-md">{shows.length} Shown</span>
                        </div>

                        {shows.length > 0 ? (
                            <div className="relative border-l-2 border-gray-200 dark:border-gray-800 ml-3 md:ml-4 space-y-12 pb-4">
                                {groupedShows.sortedYears.map((year) => (
                                    <div key={year} className="relative pl-8 md:pl-12">
                                        {/* Timeline Dot */}
                                        <span className="absolute -left-[9px] top-1.5 h-4 w-4 rounded-full bg-blue-600 dark:bg-brand-primary ring-4 ring-white dark:ring-[#0f0f0f]" />
                                        
                                        <div className="flex flex-col gap-4">
                                            <h4 className="text-2xl font-bold text-gray-900 dark:text-white leading-none opacity-40">{year}</h4>
                                            
                                            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                                                {groupedShows.groups[year].map(show => (
                                                    <ShowCard 
                                                        key={`${show.id}-${show.id}`} 
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
                                        </div>
                                    </div>
                                ))}

                                {/* Unknown Year Group */}
                                {groupedShows.unknownYear.length > 0 && (
                                        <div className="relative pl-8 md:pl-12">
                                        {/* Timeline Dot */}
                                        <span className="absolute -left-[9px] top-1.5 h-4 w-4 rounded-full bg-gray-300 dark:bg-gray-600 ring-4 ring-white dark:ring-[#0f0f0f]" />
                                        
                                        <div className="flex flex-col gap-4">
                                            <h4 className="text-2xl font-bold text-gray-500 dark:text-gray-400 leading-none opacity-40">Unknown</h4>
                                            
                                            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                                                {groupedShows.unknownYear.map(show => (
                                                    <ShowCard 
                                                        key={`${show.id}-${show.id}`} 
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
                                        </div>
                                    </div>
                                )}
                                
                                {hasMore && (
                                     <div 
                                        ref={lastElementRef}
                                        className="flex justify-center pt-8 pl-8 md:pl-12"
                                    >
                                        {loadingMore && (
                                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-600 dark:border-gray-400"></div>
                                        )}
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="text-center py-20 bg-white dark:bg-[#1e1e1e] rounded-lg border border-gray-200 dark:border-gray-800">
                                <p className="text-gray-500 dark:text-gray-400">No shows found.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default NetworkPage;