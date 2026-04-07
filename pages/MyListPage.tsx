import React, { useState, useMemo, useEffect } from 'react';
import { Show, ListStatus, ListItem } from '../types';
import ListStatusButton from '../components/ListStatusButton';
import { StarIcon, GridViewIcon, ListViewIcon, HeartIcon, TrashIcon, SearchIconV2, CloseIcon, CaretDownIcon } from '../constants';
import ShowCard from '../components/ShowCard';
import { slugify, getShowDetails, getPersonDetails, mapTMDBToShow } from '../lib/tmdb';
import { useTranslation } from 'react-i18next';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';

interface MyListPageProps {
    userList: Record<number, ListItem>;
    userCharacters?: Record<number, ListItem>;
    userFavorites?: Record<number, ListItem>;
    shows: Show[];
    onNavigate: (path: string) => void;
    handleUpdateListStatus: (showId: number, status: ListStatus | null, show?: Show, customAddedAt?: string, extraData?: Partial<ListItem>) => void;
    handleToggleFavorite?: (show: Show) => void;
}

const statuses: ListStatus[] = ['Watching', 'Completed', 'Planning', 'Paused', 'Dropped', 'Rewatching'];
const allTabs: (ListStatus | 'All' | 'Characters' | 'Favorites')[] = ['All', 'Favorites', ...statuses, 'Characters'];

type SortOption = 'date_desc' | 'date_asc' | 'name_asc' | 'name_desc';

// Skeleton Card Component
const SkeletonCard: React.FC = () => (
    <div className="relative aspect-[2/3] bg-gray-200 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer" style={{ transform: 'skewX(-20deg)' }}></div>
        <div className="absolute bottom-0 left-0 right-0 p-3">
            <div className="h-3 bg-gray-300 dark:bg-gray-700 rounded w-3/4 mb-2 animate-pulse"></div>
            <div className="h-2 bg-gray-300 dark:bg-gray-700 rounded w-1/2 animate-pulse"></div>
        </div>
    </div>
);

const SkeletonListRow: React.FC = () => (
    <div className="flex flex-col sm:flex-row py-4">
        <div className="flex-shrink-0 h-48 w-32 bg-gray-200 dark:bg-gray-800 rounded-md animate-pulse"></div>
        <div className="ml-0 mt-4 sm:mt-0 sm:ml-6 flex flex-1 flex-col justify-between">
            <div>
                <div className="flex justify-between items-start">
                    <div className="h-5 bg-gray-200 dark:bg-gray-800 rounded w-1/3 mb-2 animate-pulse"></div>
                </div>
                <div className="h-3 bg-gray-200 dark:bg-gray-800 rounded w-1/4 mb-4 animate-pulse"></div>
                <div className="space-y-2">
                    <div className="h-2 bg-gray-200 dark:bg-gray-800 rounded w-full animate-pulse"></div>
                    <div className="h-2 bg-gray-200 dark:bg-gray-800 rounded w-5/6 animate-pulse"></div>
                </div>
            </div>
        </div>
    </div>
);

const MyListPage: React.FC<MyListPageProps> = ({ userList, userCharacters = {}, userFavorites = {}, shows, onNavigate, handleUpdateListStatus, handleToggleFavorite }) => {
    const { t } = useTranslation();
    const [activeTab, setActiveTab] = useState<ListStatus | 'All' | 'Characters' | 'Favorites'>('All');
    const [viewMode, setViewMode] = useState<'list' | 'grid'>(() => {
        return (localStorage.getItem('myList_viewMode') as 'list' | 'grid') || 'list';
    });
    const [searchQuery, setSearchQuery] = useState('');
    const [sortBy, setSortBy] = useState<SortOption>('date_desc');
    const [itemToDelete, setItemToDelete] = useState<Show | null>(null);
    const [hydratedShows, setHydratedShows] = useState<Show[]>([]);

    // Persist view mode changes
    useEffect(() => {
        localStorage.setItem('myList_viewMode', viewMode);
    }, [viewMode]);

    // 1. Build the RAW List of Items (before fetching details)
    const rawListItems = useMemo(() => {
        const safeCharacters = userCharacters || {};
        const safeFavorites = userFavorites || {};
        const safeList = userList || {};

        const showItems = (Object.values(safeList) as ListItem[]).map(i => ({...i, _source: 'list'}));
        const characterItems = (Object.values(safeCharacters) as ListItem[]).map(i => ({...i, _source: 'characters'}));
        const favoriteItems = (Object.values(safeFavorites) as ListItem[]).map(i => ({...i, _source: 'favorites'}));
        
        // Combine everything into a single list for processing
        const allItems = [...characterItems, ...showItems, ...favoriteItems];
        return allItems;
    }, [userList, userCharacters, userFavorites]);

    // Smart Hydration for Missing Items
    useEffect(() => {
        let isMounted = true;
        const hydrate = async () => {
            // Identify items needing hydration (not in props.shows AND not in state.hydratedShows)
            const needed = rawListItems.filter(item => {
                const showId = item.show_id || (item as any).person_id;
                if (!showId) return false;

                const inProps = shows.some(s => s.id === showId);
                const inHydrated = hydratedShows.some(s => s.id === showId);
                return !inProps && !inHydrated;
            });

            if (needed.length === 0) return;

            // Deduplicate requests
            const uniqueNeeded = Array.from(new Set(needed.map(i => {
                const id = i.show_id || (i as any).person_id;
                // Force type if missing and coming from character list
                const type = i.media_type || ((i as any)._source === 'characters' ? 'person' : 'tv');
                const title = i.title || '';
                const status = i.status || 'Planning';
                const added_at = i.added_at;
                return JSON.stringify({ id, type, title, status, added_at });
            })))
            .map((s) => JSON.parse(s as string))
            .filter(item => item.id);

            // Batch limits to prevent API flooding
            const batch = uniqueNeeded.slice(0, 8); 

            const fetched = await Promise.all(batch.map(async ({ id, type, title, status, added_at }) => {
                try {
                    if (type === 'person') {
                        const p = await getPersonDetails(id);
                        return p ? mapTMDBToShow({ ...p, media_type: 'person' }) : null;
                    } else if (type === 'anime' || type === 'tv') {
                        const tmdbShow = await getShowDetails(id, 'tv');
                        return tmdbShow;
                    } else {
                        // Movie
                        let show = await getShowDetails(id, type);
                        return show;
                    }
                } catch (e) { return null; }
            }));

            if (isMounted) {
                const valid = fetched.filter(Boolean) as Show[];
                if (valid.length > 0) {
                    setHydratedShows(prev => {
                        const newItems = valid.filter(v => !prev.some(p => p.id === v.id));
                        return [...prev, ...newItems];
                    });
                }
            }
        };

        const timer = setTimeout(hydrate, 200); // Debounce
        return () => { isMounted = false; clearTimeout(timer); };
    }, [rawListItems, shows, hydratedShows.length]);

    // 2. Filter Raw Items by Tab & Sort
    const displayItems = useMemo(() => {
        let items = [];
        const safeCharacters = userCharacters || {};
        const safeFavorites = userFavorites || {};
        const safeList = userList || {};

        // Tab Filtering
        if (activeTab === 'Characters') {
            items = (Object.values(safeCharacters) as ListItem[]).map(i => ({...i, _source: 'characters'}));
        } else if (activeTab === 'Favorites') {
            const favs = (Object.values(safeFavorites) as ListItem[]).map(i => ({...i, _source: 'favorites'}));
            const legacyFavs = (Object.values(safeList) as ListItem[])
                .filter(i => i.is_favorite && !safeFavorites[i.show_id])
                .map(i => ({...i, _source: 'list_legacy'}));
            items = [...favs, ...legacyFavs];
        } else {
            items = (Object.values(safeList) as ListItem[]).filter(item => item.media_type !== 'person').map(i => ({...i, _source: 'list'}));
            if (activeTab !== 'All') {
                items = items.filter(item => item.status === activeTab);
            }
        }

        // Sort
        items.sort((a, b) => {
            const dateA = new Date(a.added_at || 0).getTime();
            const dateB = new Date(b.added_at || 0).getTime();
            if (sortBy === 'date_asc') return dateA - dateB;
            return dateB - dateA; 
        });

        return items;
    }, [userList, userCharacters, userFavorites, activeTab, sortBy]);

    // 3. Merge with Hydrated Data & Apply Search/Name Sort
    const renderedList = useMemo(() => {
        // Combine props shows and locally hydrated shows
        const availableShows = [...shows, ...hydratedShows];

        let processed = displayItems.map(item => {
            // Find the loaded show details
            const showId = item.show_id || (item as any).person_id;
            const show = availableShows.find(s => {
                if (s.id !== showId) return false;
                const itemType = item.media_type || (item._source === 'characters' ? 'person' : null);
                if (itemType) return s.media_type === itemType;
                return s.media_type !== 'person';
            });

            let showWithFavorite = show;
            if (show && (userFavorites[show.id] || userList[show.id]?.is_favorite)) {
                showWithFavorite = { ...show, is_favorite: true };
            }

            return {
                item,
                show: showWithFavorite,
                isLoading: !show
            };
        });

        // Apply Search
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            processed = processed.filter(({ show }) => {
                if (!show) return false;
                return show.title.toLowerCase().includes(query);
            });
        }

        // Apply Name Sort
        if (sortBy === 'name_asc' || sortBy === 'name_desc') {
            processed.sort((a, b) => {
                if (!a.show || !b.show) return 0;
                if (sortBy === 'name_asc') return a.show.title.localeCompare(b.show.title);
                return b.show.title.localeCompare(a.show.title);
            });
        }

        return processed;
    }, [displayItems, shows, hydratedShows, searchQuery, sortBy, userFavorites, userList]);


    const getShowPath = (show: Show) => {
        const slug = slugify(show.title);
        if (show.media_type === 'person') {
            return `/person/${slug}`;
        }
        const prefix = show.media_type === 'tv' ? '/tv/' : '/movie/';
        return `${prefix}${slug}`;
    }
    
    const requestDelete = (show: Show) => {
        setItemToDelete(show);
    }

    const confirmDelete = () => {
        if (itemToDelete) {
            if (activeTab === 'Favorites') {
                if (handleToggleFavorite) handleToggleFavorite(itemToDelete);
            } else {
                handleUpdateListStatus(itemToDelete.id, null, itemToDelete);
            }
            setItemToDelete(null);
        }
    }

    const ViewSwitcher = () => (
         <div className="hidden sm:flex items-center gap-1 bg-gray-100 dark:bg-[#2a2a2a] p-1 rounded-lg">
            <button
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded-md transition-colors ${viewMode === 'list' ? 'bg-white dark:bg-[#1e1e1e] text-gray-800 dark:text-white shadow-sm' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'}`}
                aria-label="List view"
            >
                <ListViewIcon className="w-5 h-5" />
            </button>
            <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-md transition-colors ${viewMode === 'grid' ? 'bg-white dark:bg-[#1e1e1e] text-gray-800 dark:text-white shadow-sm' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'}`}
                aria-label="Grid view"
            >
                <GridViewIcon className="w-5 h-5" />
            </button>
        </div>
    );

    const getTabCount = (tab: string) => {
        const safeCharacters = userCharacters || {};
        const safeFavorites = userFavorites || {};
        const safeList = userList || {};

        if (tab === 'Characters') return Object.keys(safeCharacters).length;
        if (tab === 'Favorites') {
            const dbFavs = Object.keys(safeFavorites).length;
            const legacyFavs = (Object.values(safeList) as ListItem[]).filter(i => i.is_favorite && !safeFavorites[i.show_id]).length;
            return dbFavs + legacyFavs;
        }
        if (tab === 'All') return (Object.values(safeList) as ListItem[]).filter(i => i.media_type !== 'person').length;
        return (Object.values(safeList) as ListItem[]).filter(i => i.status === tab && i.media_type !== 'person').length;
    };

    return (
        <main className="max-w-7xl mx-auto px-4 md:px-8 pb-8 pt-24 md:pt-28">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">My List</h1>
                <ViewSwitcher />
            </div>

            {/* Tab Navigation */}
            <div className="sm:hidden mb-4">
                <label htmlFor="tabs" className="sr-only">Select a tab</label>
                <select
                    id="tabs"
                    name="tabs"
                    className="block w-full rounded-md border-gray-300 focus:border-blue-500 focus:ring-blue-500 dark:bg-[#1e1e1e] dark:border-gray-700 dark:text-white"
                    onChange={(e) => setActiveTab(e.target.value as any)}
                    value={activeTab}
                >
                    {allTabs.map(tab => (
                        <option key={tab}>{tab}</option>
                    ))}
                </select>
            </div>
            <div className="hidden sm:block">
                 <div className="border-b border-gray-200 dark:border-gray-700">
                    <nav className="-mb-px flex space-x-8 overflow-x-auto" aria-label="Tabs">
                        {allTabs.map(tab => {
                             const count = getTabCount(tab);
                             return (
                                <button
                                    key={tab}
                                    onClick={() => setActiveTab(tab)}
                                    className={`whitespace-nowrap flex items-center gap-2 border-b-2 py-4 px-1 text-sm font-medium transition-colors ${
                                        tab === activeTab
                                            ? 'border-blue-500 text-blue-600 dark:text-brand-primary dark:border-brand-primary'
                                            : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                                    }`}
                                >
                                    {tab === 'Favorites' && <HeartIcon className="w-4 h-4 text-pink-500" solid />}
                                    <span>{t(tab === 'All' ? 'common.view_all' : `status.${tab.toLowerCase().replace(/ /g, '_')}`) || tab}</span>
                                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${ tab === activeTab ? 'bg-blue-100 text-blue-600 dark:bg-brand-primary/20 dark:text-brand-primary' : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'}`}>{count}</span>
                                </button>
                            );
                        })}
                    </nav>
                </div>
            </div>
            
            {/* Filters & Sort Toolbar */}
            <div className="flex flex-col sm:flex-row gap-4 mt-6 items-center justify-between">
                <div className="relative w-full sm:max-w-xs">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <SearchIconV2 className="h-4 w-4 text-gray-400" />
                    </div>
                    <input
                        type="text"
                        className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md leading-5 bg-white dark:bg-[#1e1e1e] text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-brand-primary dark:focus:border-brand-primary sm:text-sm transition-colors"
                        placeholder={activeTab === 'Characters' ? "Search characters..." : "Search shows..."}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    {searchQuery && (
                        <button 
                            onClick={() => setSearchQuery('')}
                            className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                        >
                            <CloseIcon className="h-4 w-4" />
                        </button>
                    )}
                </div>
                
                <div className="flex items-center gap-2 w-full sm:w-auto">
                    <span className="text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap">Sort by:</span>
                    <div className="relative w-full sm:w-48">
                        <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value as SortOption)}
                            className="block w-full pl-3 pr-10 py-2 text-base border border-gray-300 dark:border-gray-700 focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-brand-primary dark:focus:border-brand-primary sm:text-sm rounded-md appearance-none bg-white dark:bg-[#1e1e1e] text-gray-900 dark:text-white cursor-pointer"
                        >
                            <option value="date_desc">{t('search.newest')}</option>
                            <option value="date_asc">{t('search.oldest')}</option>
                            <option value="name_asc">{t('search.name_asc')}</option>
                            <option value="name_desc">{t('search.name_desc')}</option>
                        </select>
                         <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700 dark:text-gray-300">
                            <CaretDownIcon className="h-4 w-4" />
                        </div>
                    </div>
                </div>
            </div>

            <div className="mt-6">
                {renderedList.length > 0 ? (
                    viewMode === 'list' ? (
                        <ul role="list" className="divide-y divide-gray-200 dark:divide-gray-800 border-t border-gray-200 dark:border-gray-800">
                            {renderedList.map(({ item, show, isLoading }) => {
                                if (isLoading || !show) {
                                    return <li key={`skeleton-${item.show_id}`}><SkeletonListRow /></li>
                                }
                                return (
                                <li key={`${show.media_type}-${show.id}`} className="flex flex-col sm:flex-row py-4 animate-fade-in">
                                    <div className="flex-shrink-0">
                                        <img className="h-48 w-32 rounded-md object-cover cursor-pointer shadow-sm" src={show.image_url} alt={show.title} onClick={() => onNavigate(getShowPath(show))} />
                                    </div>
                                    <div className="ml-0 mt-4 sm:mt-0 sm:ml-6 flex flex-1 flex-col justify-between">
                                        <div>
                                            <div className="flex justify-between items-start">
                                                <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                                                    <a onClick={() => onNavigate(getShowPath(show))} className="cursor-pointer hover:underline">{show.title}</a>
                                                </h3>
                                                 <div className="flex-shrink-0 ml-4 flex flex-col gap-2 items-end">
                                                    {show.media_type === 'person' ? (
                                                        <button 
                                                            onClick={() => requestDelete(show)} 
                                                            className="px-3 py-1 inline-flex items-center gap-1 text-xs leading-5 font-semibold rounded-full bg-white dark:bg-[#1e1e1e] ring-1 ring-gray-300 dark:ring-gray-700 text-gray-600 dark:text-gray-300 hover:bg-red-50 dark:hover:bg-red-900/20 hover:ring-red-200 hover:text-red-600 transition-colors"
                                                            title="Remove from favorites"
                                                        >
                                                            <TrashIcon className="w-3 h-3" /> Remove
                                                        </button>
                                                    ) : (
                                                        <>
                                                            {/* Show Status Button unless we are in Favorites tab */}
                                                            {activeTab !== 'Favorites' && (
                                                                <ListStatusButton showId={show.id} userList={userList} handleUpdateListStatus={handleUpdateListStatus} show={show} badge />
                                                            )}
                                                            
                                                            {handleToggleFavorite && (
                                                                <button 
                                                                    onClick={() => activeTab === 'Favorites' ? requestDelete(show) : handleToggleFavorite(show)}
                                                                    className={`p-1 rounded-full ${show.is_favorite ? 'text-red-500 hover:bg-red-50 dark:bg-red-900/20' : 'text-gray-300 hover:text-red-500'}`}
                                                                    title={show.is_favorite ? (activeTab === 'Favorites' ? "Remove from Favorites" : "Unfavorite") : "Favorite"}
                                                                >
                                                                    {activeTab === 'Favorites' ? <TrashIcon className="w-5 h-5 text-red-500" /> : <HeartIcon solid={show.is_favorite} className="w-5 h-5" />}
                                                                </button>
                                                            )}
                                                        </>
                                                    )}
                                                 </div>
                                            </div>
                                            <div className="mt-1 flex items-center space-x-3 text-sm text-gray-500 dark:text-gray-400">
                                                {show.media_type === 'person' ? (
                                                    <span className="italic text-gray-500 dark:text-gray-400">{show.description}</span>
                                                ) : (
                                                    <>
                                                        <span>{show.year}</span>
                                                        <span className="text-gray-300 dark:text-gray-600">|</span>
                                                        <div className="flex items-center">
                                                            <StarIcon />
                                                            <span className="ml-1">{show.rating?.toFixed(1) || '0'}</span>
                                                        </div>
                                                        {show.maturity && <><span className="text-gray-300 dark:text-gray-600">|</span><span>{show.maturity}</span></>}
                                                    </>
                                                )}
                                            </div>
                                            {show.media_type !== 'person' && (
                                                <p className="mt-2 text-sm text-gray-600 dark:text-gray-300 line-clamp-3">{show.description}</p>
                                            )}
                                             <div className="mt-2 text-xs text-gray-400 dark:text-gray-500">
                                                Added {new Date(item.added_at).toLocaleDateString()}
                                            </div>
                                        </div>
                                    </div>
                                </li>
                            )})}
                        </ul>
                    ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                            {renderedList.map(({ item, show, isLoading }) => {
                                if (isLoading || !show) {
                                    return <SkeletonCard key={`skeleton-${item.show_id}`} />
                                }
                                return (
                                <div key={`${show.media_type}-${show.id}`} className="relative group animate-fade-in">
                                    <ShowCard 
                                        show={show} 
                                        onShowClick={() => onNavigate(getShowPath(show))} 
                                        userList={userList} 
                                        userCharacters={userCharacters} 
                                        userFavorites={userFavorites}
                                        handleUpdateListStatus={handleUpdateListStatus}
                                        handleToggleFavorite={handleToggleFavorite}
                                    />
                                    <button 
                                        onClick={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            requestDelete(show);
                                        }}
                                        className="absolute top-2 right-2 bg-white dark:bg-[#2a2a2a] p-1.5 rounded-full shadow-sm opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-50 dark:hover:bg-red-900/20 text-gray-400 hover:text-red-500 z-10"
                                        title="Remove"
                                    >
                                        <TrashIcon className="w-4 h-4" />
                                    </button>
                                </div>
                            )})}
                        </div>
                    )
                ) : (
                    <div className="text-center py-16">
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white">No items found</h3>
                        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                            {searchQuery ? "Try adjusting your search or filters." : `You haven't added any items to "${activeTab}" yet.`}
                        </p>
                    </div>
                )}
            </div>

            {/* Delete Confirmation Modal */}
            {itemToDelete && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white dark:bg-[#1e1e1e] rounded-lg shadow-xl max-w-sm w-full p-6 animate-fade-in border border-gray-200 dark:border-gray-700">
                        <div className="flex items-center justify-center w-12 h-12 mx-auto bg-red-100 dark:bg-red-900/20 rounded-full mb-4">
                            <TrashIcon className="w-6 h-6 text-red-600" />
                        </div>
                        <h3 className="text-lg font-bold text-center text-gray-900 dark:text-white mb-2">Remove {itemToDelete.media_type === 'person' ? 'Character' : 'Item'}?</h3>
                        <p className="text-sm text-center text-gray-500 dark:text-gray-400 mb-6">
                            Are you sure you want to remove <span className="font-semibold text-gray-800 dark:text-gray-200">{itemToDelete.title}</span> from your list? This action cannot be undone.
                        </p>
                        <div className="flex gap-3">
                            <button 
                                onClick={() => setItemToDelete(null)}
                                className="flex-1 px-4 py-2 text-sm font-semibold text-gray-700 dark:text-gray-200 bg-white dark:bg-[#2a2a2a] border border-gray-300 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-[#333]"
                            >
                                Cancel
                            </button>
                            <button 
                                onClick={confirmDelete}
                                className="flex-1 px-4 py-2 text-sm font-semibold text-white bg-red-600 rounded-lg hover:bg-red-700 shadow-sm"
                            >
                                Remove
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </main>
    );
};

export default MyListPage;