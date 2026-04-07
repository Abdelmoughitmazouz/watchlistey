
import React, { useState, useMemo, useEffect } from 'react';
import { Show, ListStatus, ListItem } from '../types';
import { 
    GridViewIcon, ListViewIcon, HeartIcon, FilterIcon, SearchIconV2, CaretDownIcon,
    ListIcon, WatchingIcon, CompletedIcon, PlanningIcon, PausedIcon, DroppedIcon, RewatchingIcon,
    StarIcon, CloseIcon 
} from '../constants';
import ShowCard from './ShowCard';
import ListStatusButton from './ListStatusButton';
import { slugify } from '../lib/tmdb';
import { useTranslation } from 'react-i18next';

interface UserShowListProps {
    userList: Record<number, ListItem>;
    userCharacters?: Record<number, ListItem>;
    userFavorites?: Record<number, ListItem>;
    viewerList?: Record<number, ListItem>;
    viewerCharacters?: Record<number, ListItem>;
    viewerFavorites?: Record<number, ListItem>;
    shows: Show[];
    onNavigate: (path: string, state?: Show) => void;
    handleUpdateListStatus?: (showId: number, status: ListStatus | null, show?: Show, customAddedAt?: string, extraData?: Partial<ListItem>) => void;
    handleToggleFavorite?: (show: Show) => void;
    layout?: 'horizontal' | 'sidebar'; // Support sidebar layout
    defaultTab?: string;
    hideTabs?: boolean;
    limit?: number;
}

// Sidebar Configuration
const sidebarItems = [
    { id: 'All', icon: ListIcon, labelKey: 'common.view_all' },
    { id: 'Watching', icon: WatchingIcon, labelKey: 'status.watching' },
    { id: 'Completed', icon: CompletedIcon, labelKey: 'status.completed' },
    { id: 'Planning', icon: PlanningIcon, labelKey: 'status.planning' },
    { id: 'Paused', icon: PausedIcon, labelKey: 'status.paused' },
    { id: 'Dropped', icon: DroppedIcon, labelKey: 'status.dropped' },
    { id: 'Rewatching', icon: RewatchingIcon, labelKey: 'status.rewatching' },
    // Favorites is separated
    { id: 'Favorites', icon: HeartIcon, labelKey: 'status.favorite', separate: true },
];

const UserShowList: React.FC<UserShowListProps> = ({ 
    userList, 
    userCharacters = {},
    userFavorites = {},
    viewerList,
    viewerCharacters,
    viewerFavorites,
    shows, 
    onNavigate, 
    handleUpdateListStatus,
    handleToggleFavorite,
    layout = 'horizontal',
    defaultTab = 'All',
    hideTabs = false,
    limit
}) => {
    const { t } = useTranslation();
    const [activeTab, setActiveTab] = useState<ListStatus | 'All' | 'Characters' | 'Favorites'>(defaultTab as any);
    const [viewMode, setViewMode] = useState<'list' | 'grid'>('grid');
    const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [sortBy, setSortBy] = useState<'date_desc' | 'date_asc' | 'name_asc' | 'name_desc'>('date_desc');

    useEffect(() => {
        setActiveTab(defaultTab as any);
    }, [defaultTab]);

    const listItems = useMemo(() => {
        // Combine all lists
        const showsList = (Object.values(userList || {}) as ListItem[]).map(i => ({...i, _source: 'list'}));
        const charactersList = (Object.values(userCharacters || {}) as ListItem[]).map(i => ({...i, _source: 'characters'}));
        const favoritesList = (Object.values(userFavorites || {}) as ListItem[]).map(i => ({...i, _source: 'favorites'}));
        
        const items = [...showsList, ...charactersList, ...favoritesList];
        
        return items.map(item => {
            // STRICT MATCHING - Prefer loaded shows, fallback to ListItem data
            // Use person_id for characters if show_id is missing
            const targetId = item.show_id || (item as any).person_id;
            
            const loadedShow = shows.find(s => {
                if (s.id !== targetId) return false;
                // Force media_type check if available in item, otherwise infer from source
                const itemType = item.media_type || (item._source === 'characters' ? 'person' : null);
                
                if (itemType) return s.media_type === itemType;
                
                if (item._source === 'list') return s.media_type !== 'person';
                return true;
            });

            // Handle Poster Path Logic (Absolute for AniList vs Relative for TMDB)
            let imageUrl = 'https://via.placeholder.com/500x750?text=No+Image';
            if (item.poster_path) {
                if (item.poster_path.startsWith('http')) {
                    imageUrl = item.poster_path;
                } else {
                    imageUrl = `https://image.tmdb.org/t/p/w500${item.poster_path}`;
                }
            }

            // Construct Show object if not found in loaded array
            // Robust fallback: Ensure ID and Media Type are present
            const show: Show = loadedShow || {
                id: targetId,
                title: item.title || 'Unknown Title',
                image_url: imageUrl,
                backdrop_url: item.backdrop_path ? `https://image.tmdb.org/t/p/w1280${item.backdrop_path}` : '',
                media_type: (item.media_type || (item._source === 'characters' ? 'person' : 'tv')) as any, 
                rating: item.vote_average || 0,
                year: item.release_date ? new Date(item.release_date).getFullYear() : 0,
                description: '', // ListItem doesn't have description usually
                genres: [],
                participants: []
            };
            
            // Check favorite status based on userFavorites
            const isFav = !!userFavorites[targetId] || !!userList[targetId]?.is_favorite;

            // Include database ID for stable keys
            return { ...show, status: item.status, added_at: item.added_at, is_favorite: isFav, _source: item._source, _dbId: item.id };
        });
    }, [userList, userCharacters, userFavorites, shows]);

    const filteredShows = useMemo(() => {
        let results = [];

        if (activeTab === 'Characters') {
            const seen = new Set();
            results = listItems.filter(item => {
                if (item.media_type === 'person') {
                    if (seen.has(item.id)) return false;
                    seen.add(item.id);
                    return true;
                }
                return false;
            });
        } else if (activeTab === 'Favorites') {
             const seen = new Set();
             results = listItems.filter(item => {
                 if (item.media_type === 'person') return false; 
                 if (item._source === 'favorites' || item.is_favorite) {
                     if (seen.has(item.id)) return false;
                     seen.add(item.id);
                     return true;
                 }
                 return false;
             });
        } else {
            // "All" and Status tabs refer to the Watchlist (userList) only
            const showsOnly = listItems.filter(item => item.media_type !== 'person' && item._source === 'list');
            
            if (activeTab === 'All') {
                const seen = new Set();
                results = showsOnly.filter(item => {
                    // Robust deduplication: Use ID if valid (greater than 0), otherwise use DB ID if available to prevent collapsing 0-ID items
                    const uniqueKey = item.id > 0 ? item.id : item._dbId;
                    if (uniqueKey && seen.has(uniqueKey)) return false;
                    if (uniqueKey) seen.add(uniqueKey);
                    return true;
                });
            } else {
                results = showsOnly.filter(show => show.status === activeTab);
            }
        }

        // 1. Apply Search
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            results = results.filter(show => show.title.toLowerCase().includes(query));
        }

        // 2. Apply Sort
        results.sort((a, b) => {
            if (sortBy === 'name_asc') return a.title.localeCompare(b.title);
            if (sortBy === 'name_desc') return b.title.localeCompare(a.title);
            const dateA = new Date(a.added_at || 0).getTime();
            const dateB = new Date(b.added_at || 0).getTime();
            if (sortBy === 'date_asc') return dateA - dateB;
            return dateB - dateA; // Default date_desc
        });

        if (limit && limit > 0) {
            return results.slice(0, limit);
        }
        return results;
    }, [listItems, activeTab, limit, searchQuery, sortBy]);

    const getShowPath = (show: Show) => {
        const slug = slugify(show.title);
        if (show.media_type === 'person') {
            return `/person/${slug}`;
        }
        const prefix = show.is_anime ? '/anime/' : show.media_type === 'tv' ? '/tv/' : '/movie/';
        return `${prefix}${slug}`;
    }

    const ViewSwitcher = () => (
         <div className="flex items-center gap-1 bg-gray-100 dark:bg-[#2a2a2a] p-1 rounded-lg">
            <button
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded-md transition-colors ${viewMode === 'list' ? 'bg-white dark:bg-[#1e1e1e] text-gray-800 dark:text-white shadow-sm' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
                aria-label="List view"
            >
                <ListViewIcon className="w-5 h-5" />
            </button>
            <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-md transition-colors ${viewMode === 'grid' ? 'bg-white dark:bg-[#1e1e1e] text-gray-800 dark:text-white shadow-sm' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
                aria-label="Grid view"
            >
                <GridViewIcon className="w-5 h-5" />
            </button>
        </div>
    );

    // Determine which list to use for status checks (buttons)
    const viewerStatusList = viewerList || userList;
    const viewerFavList = viewerFavorites || userFavorites;
    const viewerCharList = viewerCharacters || userCharacters;

    // Calculate counts
    const getTabCount = (tab: string) => {
        if (tab === 'Characters') return Object.keys(userCharacters).length;
        if (tab === 'Favorites') {
            const dbFavs = Object.keys(userFavorites).length;
            const legacyFavs = (Object.values(userList) as ListItem[]).filter(i => i.is_favorite && !userFavorites[i.show_id]).length;
            return dbFavs + legacyFavs;
        }
        if (tab === 'All') return (Object.values(userList) as ListItem[]).filter(i => i.media_type !== 'person').length;
        return (Object.values(userList) as ListItem[]).filter(i => i.status === tab && i.media_type !== 'person').length;
    }

    // --- Render Content Logic ---
    const renderGrid = () => (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {filteredShows.map(show => (
                <ShowCard 
                    key={`${show._dbId || show.id}-${show.media_type}`} 
                    show={show} 
                    onShowClick={(s) => onNavigate(getShowPath(s), s)} 
                    userList={viewerStatusList}
                    userFavorites={viewerFavList}
                    userCharacters={viewerCharList} // FIX: Pass characters list so hearts show correctly
                    handleUpdateListStatus={handleUpdateListStatus}
                    handleToggleFavorite={handleToggleFavorite}
                />
            ))}
        </div>
    );

    const renderList = () => (
        <ul role="list" className="divide-y divide-gray-200 dark:divide-gray-800">
            {filteredShows.map((show) => {
                const isViewerFavorite = viewerFavList 
                    ? (!!viewerFavList[show.id] || !!viewerStatusList[show.id]?.is_favorite) 
                    : show.is_favorite;
                
                return (
                <li key={`${show._dbId || show.id}-${show.media_type}`} className="flex py-4">
                    <div className="flex-shrink-0">
                        <img className="h-32 w-24 rounded-md object-cover cursor-pointer" src={show.image_url} alt={show.title} onClick={() => onNavigate(getShowPath(show), show)} />
                    </div>
                    <div className="ms-4 flex flex-1 flex-col justify-between">
                        <div>
                            <div className="flex justify-between items-start">
                                <h3 className="text-base font-medium text-gray-900 dark:text-white">
                                    <a onClick={() => onNavigate(getShowPath(show), show)} className="cursor-pointer hover:underline">{show.title}</a>
                                </h3>
                                <div className="flex-shrink-0 ms-4 flex flex-col items-end gap-2">
                                    {show.media_type !== 'person' ? (
                                        <>
                                            <ListStatusButton 
                                                showId={show.id} 
                                                userList={viewerStatusList} 
                                                handleUpdateListStatus={handleUpdateListStatus} 
                                                show={show} 
                                                badge 
                                                readOnly={!handleUpdateListStatus}
                                            />
                                            {isViewerFavorite && (
                                                <HeartIcon solid className="w-4 h-4 text-pink-500" />
                                            )}
                                        </>
                                    ) : (
                                        handleUpdateListStatus ? (
                                            viewerCharList[show.id]?.status === 'Favorite' ? (
                                                <button 
                                                    onClick={() => handleUpdateListStatus(show.id, null, show)} 
                                                    className="px-3 py-1 inline-flex items-center gap-1 text-xs leading-5 font-semibold rounded-full bg-white dark:bg-[#1e1e1e] ring-1 ring-gray-300 dark:ring-gray-700 text-gray-600 dark:text-gray-300 hover:bg-red-50 dark:hover:bg-red-900/20 hover:ring-red-200 hover:text-red-600 transition-colors"
                                                >
                                                    <HeartIcon solid={true} className="w-3 h-3 text-red-500" /> {t('common.remove')}
                                                </button>
                                            ) : (
                                                <button 
                                                    onClick={() => handleUpdateListStatus(show.id, 'Favorite', show)} 
                                                    className="px-3 py-1 inline-flex items-center gap-1 text-xs leading-5 font-semibold rounded-full bg-pink-50 dark:bg-pink-900/20 text-pink-600 dark:text-pink-300 hover:bg-pink-100 dark:hover:bg-pink-900/40 transition-colors"
                                                >
                                                    <HeartIcon className="w-3 h-3" /> {t('status.favorite')}
                                                </button>
                                            )
                                        ) : (
                                            <span className="px-3 py-1 inline-flex items-center text-xs leading-5 font-semibold rounded-full bg-pink-100 dark:bg-pink-900/20 text-pink-800 dark:text-pink-300">
                                                {t('status.favorite')}
                                            </span>
                                        )
                                    )}
                                </div>
                            </div>
                            <div className="mt-1 flex items-center space-x-3 rtl:space-x-reverse text-sm text-gray-500 dark:text-gray-400">
                                    {show.media_type === 'person' ? (
                                    <span>{show.description}</span>
                                    ) : (
                                    <>
                                        <span>{show.year}</span>
                                        <span className="text-gray-300 dark:text-gray-600">|</span>
                                        <div className="flex items-center">
                                            <StarIcon className="text-yellow-500 dark:text-brand-primary w-3 h-3" />
                                            <span className="ms-1">{show.rating.toFixed(1)}</span>
                                        </div>
                                    </>
                                    )}
                            </div>
                            {show.media_type !== 'person' && (
                                <p className="mt-2 text-sm text-gray-600 dark:text-gray-300 line-clamp-2">{show.description}</p>
                            )}
                        </div>
                    </div>
                </li>
            )})}
        </ul>
    );

    // Render Controls logic
    const renderControls = () => {
        if (limit) return null; // Hide controls in Overview/limited mode

        return (
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <div className="relative w-full sm:max-w-xs">
                    <div className="absolute inset-y-0 start-0 ps-3 flex items-center pointer-events-none">
                        <SearchIconV2 className="h-4 w-4 text-gray-400" />
                    </div>
                    <input
                        type="text"
                        className="block w-full ps-10 pe-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md leading-5 bg-white dark:bg-[#1e1e1e] text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-brand-primary dark:focus:border-brand-primary sm:text-sm transition-colors"
                        placeholder={t('nav.search_placeholder')}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    {searchQuery && (
                        <button 
                            onClick={() => setSearchQuery('')}
                            className="absolute inset-y-0 end-0 pe-3 flex items-center text-gray-400 hover:text-gray-600"
                        >
                            <CloseIcon className="h-4 w-4" />
                        </button>
                    )}
                </div>
                
                <div className="flex items-center gap-2 w-full sm:w-auto ms-auto">
                    <span className="text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap hidden md:block">{t('search.sort_by')}:</span>
                    <div className="relative w-full sm:w-48">
                        <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value as any)}
                            className="block w-full ps-3 pe-10 py-2 text-base border border-gray-300 dark:border-gray-700 focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-brand-primary dark:focus:border-brand-primary sm:text-sm rounded-md appearance-none bg-white dark:bg-[#1e1e1e] text-gray-900 dark:text-white cursor-pointer"
                        >
                            <option value="date_desc">{t('search.newest')}</option>
                            <option value="date_asc">{t('search.oldest')}</option>
                            <option value="name_asc">{t('search.name_asc')}</option>
                            <option value="name_desc">{t('search.name_desc')}</option>
                        </select>
                         <div className="pointer-events-none absolute inset-y-0 end-0 flex items-center px-2 text-gray-700 dark:text-gray-300">
                            <CaretDownIcon className="h-4 w-4" />
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    // Sidebar Layout Navigation
    const renderSidebarNav = () => (
        <nav className="space-y-1" aria-label="Sidebar">
            {sidebarItems.map((item) => {
                const count = getTabCount(item.id);
                const isActive = activeTab === item.id;
                const Icon = item.icon;
                
                return (
                    <React.Fragment key={item.id}>
                        {item.separate && <div className="my-2 border-t border-gray-200 dark:border-gray-800" />}
                        <button
                            onClick={() => { setActiveTab(item.id as any); setIsMobileFilterOpen(false); }}
                            className={`w-full flex items-center justify-between px-3 py-2.5 text-sm font-medium rounded-lg transition-colors ${
                                isActive
                                    ? 'bg-blue-50 dark:bg-brand-primary/10 text-blue-700 dark:text-brand-primary'
                                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-[#2a2a2a] hover:text-gray-900 dark:hover:text-white'
                            }`}
                        >
                            <div className="flex items-center truncate">
                                <Icon className={`me-3 flex-shrink-0 h-5 w-5 ${isActive ? 'text-blue-600 dark:text-brand-primary' : 'text-gray-400 dark:text-gray-500'}`} solid={item.id === 'Favorites'} />
                                <span className="truncate">{t(item.labelKey)}</span>
                            </div>
                            {count > 0 && (
                                <span className={`ms-3 inline-block py-0.5 px-2 text-xs font-bold rounded-md ${
                                    isActive 
                                    ? 'bg-blue-100 dark:bg-brand-primary/20 text-blue-700 dark:text-brand-primary' 
                                    : 'bg-gray-100 dark:bg-[#2a2a2a] text-gray-500 dark:text-gray-500'
                                }`}>
                                    {count}
                                </span>
                            )}
                        </button>
                    </React.Fragment>
                );
            })}
        </nav>
    );

    if (layout === 'sidebar') {
        return (
            <div className="flex flex-col lg:flex-row gap-8 relative">
                {/* Mobile Filter Toggle */}
                <div className="lg:hidden mb-4">
                    <button 
                        onClick={() => setIsMobileFilterOpen(!isMobileFilterOpen)}
                        className="w-full flex items-center justify-between px-4 py-2 bg-white dark:bg-[#1e1e1e] border border-gray-300 dark:border-gray-700 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-200"
                    >
                        <span className="flex items-center gap-2"><FilterIcon className="w-4 h-4" /> {t('search.filters')}</span>
                        <span className="bg-gray-100 dark:bg-[#2a2a2a] px-2 py-0.5 rounded-full text-xs">{getTabCount(activeTab)}</span>
                    </button>
                    {isMobileFilterOpen && (
                        <div className="mt-2 p-2 bg-white dark:bg-[#1e1e1e] border border-gray-200 dark:border-gray-800 rounded-lg shadow-lg">
                            {renderSidebarNav()}
                        </div>
                    )}
                </div>

                {/* Desktop Sidebar */}
                <div className="hidden lg:block w-64 flex-shrink-0">
                    <div className="sticky top-24 max-h-[calc(100vh-7rem)] overflow-y-auto pe-2 scrollbar-hide">
                        {renderSidebarNav()}
                    </div>
                </div>

                {/* Main Content */}
                <div className="flex-1 min-w-0 pb-16">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white hidden lg:block">
                            {sidebarItems.find(i => i.id === activeTab) ? t(sidebarItems.find(i => i.id === activeTab)!.labelKey) : activeTab}
                        </h2>
                        <div className="ms-auto">
                            <ViewSwitcher />
                        </div>
                    </div>
                    
                    {renderControls()}

                    {filteredShows.length > 0 ? (
                        viewMode === 'list' ? renderList() : renderGrid()
                    ) : (
                        <div className="text-center py-16 bg-gray-50 dark:bg-[#1e1e1e] rounded-lg border border-dashed border-gray-300 dark:border-gray-700">
                            <h3 className="text-lg font-medium text-gray-900 dark:text-white">{t('search.no_results')}</h3>
                            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                                This user hasn't added any items to this list yet.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    // Horizontal Layout
    return (
        <div className="mt-0">
            {/* Horizontal tabs logic omitted for brevity as sidebar is main usage now, but same t() logic applies if needed */}
            {renderControls()}

            <div className="mt-4">
                {filteredShows.length > 0 ? (
                    viewMode === 'list' ? renderList() : renderGrid()
                ) : (
                    <div className="text-center py-16">
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white">{t('search.no_results')}</h3>
                        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">This user hasn't added any items to this list yet.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default UserShowList;
