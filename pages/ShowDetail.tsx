import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Show, User, ListStatus, ListItem, CastMember, Episode, AppNotification, Subscription } from '../types';
import { ChevronLeftIcon, ChevronRightIcon, HeartIcon, StarIcon, ArrowRightIcon, XIcon, FacebookIconV2, InstagramIcon, LinkIcon, UserPlaceholderIcon, CaretDownIcon, CalendarIcon, SettingsIconV2 } from '../constants';
import ContentCarousel from '../components/ContentCarousel';
import PromoVideo from '../components/PromoVideo';
import ImageSlider from '../components/ImageSlider';
import CommentsSection from '../components/CommentsSection';
import AIAnalysis from '../components/AIAnalysis'; // Import new component
import { Avatar } from '../components/Avatar';
import ListStatusButton from '../components/ListStatusButton';
import ShowEditorModal from '../components/ShowEditorModal';
import { getGenreId, slugify, getRecommendations, getShowDetails, getSeasonDetails } from '../lib/tmdb';
import { useSEO } from '../hooks/useSEO';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';
import EpisodeCountdown from '../components/EpisodeCountdown';
import NextEpisodeCard from '../components/NextEpisodeCard';
import { useTranslation } from 'react-i18next';

interface ShowDetailProps {
    show: Show;
    allShows: Show[];
    onBack: () => void;
    onNavigate: (path: string) => void;
    onUpdateShow: (show: Show) => void;
    userList: Record<number, ListItem>;
    userFavorites?: Record<number, ListItem>;
    userCharacters?: Record<number, ListItem>;
    handleUpdateListStatus: (showId: number, status: ListStatus | null, show?: Show, customAddedAt?: string, extraData?: Partial<ListItem>) => void;
    currentUser?: User;
    handleToggleFavorite?: (show: Show) => void;
    onRegisterNotification?: (showId: number) => void;
    notifications?: AppNotification[];
    subscriptions?: Subscription[];
}

const ShowDetail: React.FC<ShowDetailProps> = ({ show: initialShow, allShows, onBack, onNavigate, onUpdateShow, userList, userFavorites, userCharacters = {}, handleUpdateListStatus, currentUser, handleToggleFavorite, onRegisterNotification, notifications, subscriptions = [] }) => {
    const { t, i18n } = useTranslation();
    const [show, setShow] = useState(initialShow);
    const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
    const [selectedSeason, setSelectedSeason] = useState<number | null>(null);
    const [seasonEpisodes, setSeasonEpisodes] = useState<Episode[]>([]);
    const [loadingEpisodes, setLoadingEpisodes] = useState(false);
    const [isEditorOpen, setIsEditorOpen] = useState(false);

    useEffect(() => {
        setShow(initialShow);
        setIsDescriptionExpanded(false);
        if (initialShow.media_type === 'tv' && !initialShow.is_manga) {
             if (initialShow.seasons && initialShow.seasons.length > 0) {
                 const firstSeason = initialShow.seasons.find(s => s.season_number === 1) || initialShow.seasons[0];
                 setSelectedSeason(firstSeason.season_number);
             }
        }
    }, [initialShow]);

    useEffect(() => {
        const fetchEpisodes = async () => {
            if (selectedSeason === null || !show.id || show.media_type !== 'tv') return;
            setLoadingEpisodes(true);
            try {
                const seasonData = await getSeasonDetails(show.id, selectedSeason, i18n.language);
                if (seasonData && seasonData.episodes) {
                    setSeasonEpisodes(seasonData.episodes);
                }
            } catch (e) {
                console.error("Failed to fetch episodes", e);
            } finally {
                setLoadingEpisodes(false);
            }
        };
        fetchEpisodes();
    }, [selectedSeason, show.id, show.media_type, i18n.language]);

    const isFavorite = userFavorites ? !!userFavorites[show.id] : !!userList[show.id]?.is_favorite;
    const isSubscribed = subscriptions.some(sub => sub.show_id === show.id);

    const [dbFavCount, setDbFavCount] = useState<number>(0);
    const [initialFavState, setInitialFavState] = useState<boolean>(false);
    const [watchedCount, setWatchedCount] = useState<number>(0);

    useEffect(() => {
        let isMounted = true;
        const fetchRealCount = async () => {
            if (!show.id) return;
            if (isSupabaseConfigured) {
                const { count, error } = await supabase
                    .from('favorites')
                    .select('*', { count: 'exact', head: true })
                    .eq('show_id', show.id);
                if (isMounted && !error && count !== null) {
                    setDbFavCount(count);
                    setInitialFavState(isFavorite); 
                }

                // Fetch watched episodes count
                if (currentUser && show.media_type === 'tv') {
                    const { count: wCount, error: wError } = await supabase
                        .from('episode_tracking')
                        .select('*', { count: 'exact', head: true })
                        .eq('user_id', currentUser.id)
                        .eq('show_id', show.id)
                        .eq('is_watched', true);
                    if (isMounted && !wError && wCount !== null) {
                        setWatchedCount(wCount);
                    }
                }
            } else {
                if (isMounted) setDbFavCount(show.vote_count || 0);
            }
        };
        fetchRealCount();
        return () => { isMounted = false; };
    }, [show.id, currentUser?.id]); 

    const realFavoritesCount = Math.max(0, dbFavCount + (isFavorite ? 1 : 0) - (initialFavState ? 1 : 0));

    const [isHydrating, setIsHydrating] = useState(false);
    const hydratedIdRef = useRef<number | null>(null);

    useEffect(() => {
        const fetchFullDetails = async () => {
            if (hydratedIdRef.current === show.id || isHydrating) return;
            const isMissing = (arr?: any[]) => !arr || arr.length === 0;
            let needsHydration = false;
            if ((show.media_type === 'movie' || show.media_type === 'tv') && isMissing(show.cast)) {
                needsHydration = true;
            }
            if (!needsHydration) {
                hydratedIdRef.current = show.id;
                return;
            }
            setIsHydrating(true);
            let fullShow: Show | null = null;
            try {
                if (show.media_type === 'movie' || show.media_type === 'tv') {
                    fullShow = await getShowDetails(show.id, show.media_type, true, i18n.language);
                }
            } catch (e) {
                console.error("Hydration failed", e);
            }
            if (fullShow) {
                setShow(prev => ({ ...prev, ...fullShow }));
                onUpdateShow(fullShow);
            }
            hydratedIdRef.current = show.id;
            setIsHydrating(false);
        };
        fetchFullDetails();
    }, [show.id, show.media_type, show.provider, i18n.language]);

    let seoTitle = '';
    if (show.media_type === 'season') {
        seoTitle = `${t('hero.seasons')} ${show.season_number} - ${show.parent_show_title} | Watchlistey`;
    } else if (show.is_anime) {
        seoTitle = `${show.title} Anime – Episodes, Reviews & Watchlist`;
    } else {
        seoTitle = `${show.title} (${show.year}) – Rating, Cast, Plot & Watchlist`;
    }

    const creatorName = show.creators?.[0] || show.creator_persons?.[0]?.name || (show.networks?.[0]?.name);
    const mainCastNames = show.cast?.slice(0, 3).map(c => c.name).join(', ');
    
    let seoDesc = '';
    if (show.description) {
        const base = `Discover ${show.title} (${show.year}).`;
        const middle = creatorName ? ` Created by ${creatorName}.` : '';
        const castText = mainCastNames ? ` Featuring ${mainCastNames}.` : '';
        const end = ` Add to your watchlist, see rating (${show.rating?.toFixed(1)}/10), and find similar ${show.genres?.[0] || ''} titles on Watchlistey.`;
        seoDesc = `${base}${middle}${castText}${end}`.substring(0, 160).trim();
    } else {
        seoDesc = `Track ${show.title} on Watchlistey. Build your ultimate watchlist, rate content, and discover new favorites.`;
    }
    
    useSEO(seoTitle, seoDesc, show.image_url, show.title, true);

    const schemaType = show.media_type === 'tv' ? "TVSeries" : (show.is_anime ? "TVSeries" : "Movie");
    const hasReviews = show.vote_count && show.vote_count > 0;

    const schemaData = {
        "@context": "https://schema.org",
        "@type": schemaType,
        "name": show.title,
        "description": show.description,
        "datePublished": show.year ? `${show.year}-01-01` : undefined,
        "image": show.image_url,
        "genre": show.genres,
        ...(hasReviews ? {
            "aggregateRating": {
                "@type": "AggregateRating",
                "ratingValue": show.rating?.toFixed(1),
                "bestRating": "10",
                "worstRating": "1",
                "ratingCount": show.vote_count
            }
        } : {}),
        "creator": show.creator_persons?.map(p => ({
            "@type": "Person",
            "name": p.name
        })),
        "actor": show.cast?.slice(0, 5).map(actor => ({
            "@type": "Person",
            "name": actor.name
        })),
        "breadcrumb": {
            "@type": "BreadcrumbList",
            "itemListElement": [
                { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://watchlistey.com" },
                { "@type": "ListItem", "position": 2, "name": show.media_type === 'tv' ? 'TV Shows' : 'Movies', "item": `https://watchlistey.com/search?type=${show.media_type}` },
                { "@type": "ListItem", "position": 3, "name": show.title }
            ]
        }
    };

    const [recommendations, setRecommendations] = useState<Show[]>([]);

    useEffect(() => {
        const fetchRecommendations = async () => {
            if (show.media_type === 'movie' || show.media_type === 'tv') {
                try {
                    const recs = await getRecommendations(show.id, show.media_type, i18n.language);
                    setRecommendations(recs);
                } catch (e) {
                    console.error("Failed to fetch recommendations", e);
                }
            }
        };
        fetchRecommendations();
    }, [show.id, show.media_type, i18n.language]);

    const moreLikeThis = (show as any).recommendations || (recommendations.length > 0 ? recommendations : allShows.filter(s => s.id !== show.id && (s.genres?.some(g => show.genres?.includes(g)) || s.year === show.year)).slice(0, 12));

    const generateSeoParagraph = () => {
        if (!show.description) return null;
        const genreText = show.genres?.join(', ') || 'various';
        const studioText = show.production_companies?.[0]?.name || show.networks?.[0]?.name || 'acclaimed studios';
        const similarTitles = moreLikeThis.slice(0, 2).map(s => s.title).join(' and ');
        return (
            <div className="mt-12 bg-gray-50 dark:bg-[#151515] p-6 rounded-xl border border-gray-100 dark:border-gray-800">
                <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-3">About {show.title}</h2>
                <div className="prose dark:prose-invert max-w-none text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                    <p>
                        <strong>{show.title}</strong> is a {show.year} {show.is_anime ? 'Anime' : (show.media_type === 'tv' ? 'TV Series' : 'Movie')} categorized under {genreText}. 
                        Produced by {studioText}, this title has garnered attention for its engaging narrative and compelling characters. 
                        {show.description.length > 100 ? `The story follows ${show.description.substring(0, 100).replace(/\.$/, '')}...` : show.description}
                    </p>
                    <p className="mt-4">
                        With a user rating of <strong>{show.rating?.toFixed(1)}/10</strong>, it stands out as a noteworthy entry in the {show.genres?.[0] || 'entertainment'} genre. 
                        Fans of {similarTitles ? `titles like ${similarTitles}` : 'similar stories'} will likely find this to be a perfect addition to their watchlist.
                    </p>
                </div>
            </div>
        );
    };

    const handleViewUser = (user: User) => {
        onNavigate(`/u/${user.username}`);
    }

    const handleGenreClick = (genreName: string) => {
        const query = encodeURIComponent(genreName);
        onNavigate(`/search?genres=${query}`);
    };

    const handleFormatClick = () => {
        if (show.media_type) onNavigate(`/search?type=${show.media_type}`);
    };

    const handleStatusClick = () => {
        if (show.status) onNavigate(`/search?status=${encodeURIComponent(show.status)}`);
    };

    const handleLanguageClick = () => {
        if (show.original_language) onNavigate(`/search?language=${show.original_language}`);
    };

    const handleEpisodesClick = () => {
        onNavigate('/search?type=tv');
    };

    const handleViewFullCast = () => {
        const slug = slugify(show.title);
        // Remove anime path handling
        let prefix = show.media_type === 'tv' ? '/tv/' : '/movie/';
        onNavigate(`${prefix}${slug}/cast`);
    };

    const formatRuntime = (minutes?: number) => {
        if (!minutes) return 'N/A';
        const h = Math.floor(minutes / 60);
        const m = minutes % 60;
        if (h > 0) return `${h}h ${m}m`;
        return `${m}m`;
    };

    const formatLanguage = (code?: string) => {
        if (!code) return '-';
        try {
            return new Intl.DisplayNames([i18n.language], { type: 'language' }).of(code) || code.toUpperCase();
        } catch {
            return code.toUpperCase();
        }
    };

    const getFormat = () => {
        if (show.format) return show.format;
        if (show.media_type === 'movie') return t('nav.movies');
        if (show.is_anime) {
            if (show.number_of_episodes === 1) return t('nav.movies');
            if (show.number_of_episodes && show.number_of_episodes <= 6) return 'OVA/ONA';
            return 'TV';
        }
        if (show.media_type === 'tv') return t('nav.tv');
        return 'Unknown';
    };

    const VISIBLE_CAST_LIMIT = 14;
    const visibleCast = show.cast?.slice(0, VISIBLE_CAST_LIMIT);
    const castScrollRef = useRef<HTMLDivElement>(null);
    const [canScrollCastPrev, setCanScrollCastPrev] = useState(false);
    const [canScrollCastNext, setCanScrollCastNext] = useState(true);

    const checkCastScroll = () => {
        if (castScrollRef.current) {
            const { scrollLeft, scrollWidth, clientWidth } = castScrollRef.current;
            const isScrollable = scrollWidth > clientWidth;
            setCanScrollCastPrev(isScrollable && Math.abs(scrollLeft) > 0);
            setCanScrollCastNext(isScrollable && Math.abs(scrollLeft) < scrollWidth - clientWidth - 1);
        }
    };

    useEffect(() => {
        const el = castScrollRef.current;
        if (el) {
            el.addEventListener('scroll', checkCastScroll);
            checkCastScroll(); 
            window.addEventListener('resize', checkCastScroll);
            return () => {
                el.removeEventListener('scroll', checkCastScroll);
                window.removeEventListener('resize', checkCastScroll);
            }
        }
    }, [show.cast]);

    const scrollCast = (direction: 'prev' | 'next') => {
        if (castScrollRef.current) {
            const { clientWidth } = castScrollRef.current;
            const scrollAmount = clientWidth * 0.8;
            const isRTL = document.dir === 'rtl';
            let left = direction === 'next' ? scrollAmount : -scrollAmount;
            if (isRTL) left = -left;
            castScrollRef.current.scrollBy({ left: left, behavior: 'smooth' });
        }
    };

    const seasonShows = show.seasons?.map(season => ({
        id: season.id,
        title: season.name,
        image_url: season.poster_path ? `https://image.tmdb.org/t/p/w500${season.poster_path}` : show.image_url,
        backdrop_url: show.backdrop_url,
        description: season.overview,
        rating: show.rating, 
        year: season.air_date ? new Date(season.air_date).getFullYear() : show.year,
        media_type: 'season',
        parent_show_id: show.media_type === 'season' ? show.parent_show_id : show.id, 
        parent_show_title: show.media_type === 'season' ? show.parent_show_title : show.title,
        season_number: season.season_number,
        is_anime: show.is_anime
    } as Show)) || [];

    const isSeasonPage = show.media_type === 'season';

    const handleBackToParent = () => {
        if (show.parent_show_id) {
             const slug = slugify(show.parent_show_title || 'show');
             onNavigate(`/tv/${slug}`);
        } else {
            onBack();
        }
    };
    
    const currentSeasonNumber = show.season_number || 0;
    const sortedSeasons = show.seasons ? [...show.seasons].sort((a,b) => a.season_number - b.season_number) : [];
    const currentIndex = sortedSeasons.findIndex(s => s.season_number === currentSeasonNumber);
    const prevSeason = currentIndex > 0 ? sortedSeasons[currentIndex - 1] : null;
    const nextSeason = currentIndex !== -1 && currentIndex < sortedSeasons.length - 1 ? sortedSeasons[currentIndex + 1] : null;

    const navigateToSeason = (seasonNum: number) => {
        if (show.parent_show_id) {
            const slug = slugify(show.parent_show_title || 'show');
            onNavigate(`/tv/${slug}/season/${seasonNum}`);
        }
    }

    const handleToggleCastFavorite = (e: React.MouseEvent, member: CastMember) => {
        e.preventDefault();
        e.stopPropagation();
        if (handleUpdateListStatus) {
            const isCastFavorite = userCharacters[member.id]?.status === 'Favorite';
            const personShow: Show = {
                id: member.id,
                title: member.name,
                media_type: 'person',
                is_staff: show.is_anime,
                image_url: member.profile_path || '',
                backdrop_url: '',
                rating: 0,
                year: 0,
                description: `Played ${member.character}`
            };
            handleUpdateListStatus(member.id, isCastFavorite ? null : 'Favorite', personShow);
        }
    };

    const networkLabel = show.is_anime ? t('details.studios') : t('details.networks');
    const productionData = show.is_anime ? show.networks : show.production_companies;

    const DESCRIPTION_LIMIT = 300;
    const description = show.description || '';
    const shouldTruncate = description.length > DESCRIPTION_LIMIT;
    const displayedDescription = isDescriptionExpanded || !shouldTruncate ? description : description.slice(0, DESCRIPTION_LIMIT).trim() + '...';

    const handleEpisodeClick = (episode: Episode) => {
        const slug = slugify(isSeasonPage ? show.parent_show_title || show.title : show.title);
        const seasonNum = isSeasonPage ? show.season_number : selectedSeason;
        onNavigate(`/tv/${slug}/season/${seasonNum}/episode/${episode.episode_number}`);
    };

    return (
        <div className="bg-white dark:bg-[#0f0f0f] text-gray-900 dark:text-white transition-colors duration-200">
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaData) }} />

            <div className="relative h-[50vh] min-h-[400px] md:h-[65vh] lg:h-[75vh]">
                <img src={show.backdrop_url} alt={`${show.title} backdrop`} className="absolute inset-0 w-full h-full object-cover object-top" />
                <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent dark:from-[#0f0f0f]"></div>
                <button
                    onClick={isSeasonPage ? handleBackToParent : onBack}
                    className="absolute top-24 start-4 md:start-8 z-20 bg-white/50 dark:bg-black/30 text-gray-900 dark:text-white rounded-full p-2 hover:bg-white/70 dark:hover:bg-black/50 transition-colors flex items-center gap-2 pe-4 backdrop-blur-sm rtl:flex-row-reverse"
                    aria-label="Go back"
                >
                    <ChevronLeftIcon className="rtl:rotate-180" />
                    {isSeasonPage && <span className="text-sm font-medium">{t('common.back')}</span>}
                </button>
            </div>

            <div className="max-w-7xl mx-auto px-4 md:px-8 pb-16">
                <div className="relative z-10 -mt-24 md:-mt-48 flex flex-col md:flex-row gap-8 lg:gap-12 items-start">
                    <div className="w-48 md:w-64 lg:w-72 flex-shrink-0 flex flex-col gap-4">
                        <div className="aspect-[2/3] rounded-lg overflow-hidden ring-1 ring-black/10 dark:ring-white/10">
                            <img src={show.image_url} alt={show.title} className="w-full h-full object-cover" />
                        </div>
                        <div className="flex items-center space-x-2 rtl:space-x-reverse">
                            <div className="flex-grow">
                                <ListStatusButton showId={show.id} userList={userList} handleUpdateListStatus={handleUpdateListStatus} fullWidth show={show} />
                            </div>
                            {currentUser && (
                                <button 
                                    onClick={() => setIsEditorOpen(true)}
                                    className="h-10 w-10 flex-shrink-0 flex items-center justify-center rounded-lg border bg-gray-100 dark:bg-[#1e1e1e] border-gray-300 dark:border-gray-700 text-gray-700 dark:text-white hover:bg-gray-200 dark:hover:bg-[#2a2a2a] transition-all shadow-sm"
                                    title="Edit Watch Status"
                                >
                                    <SettingsIconV2 className="h-5 w-5" />
                                </button>
                            )}
                            {handleToggleFavorite && (
                                <button 
                                    onClick={() => handleToggleFavorite(show)}
                                    className={`h-10 w-10 flex-shrink-0 flex items-center justify-center rounded-lg border transition-all shadow-sm ${
                                        isFavorite 
                                        ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-500' 
                                        : 'bg-gray-100 dark:bg-[#1e1e1e] border-gray-300 dark:border-gray-700 text-gray-700 dark:text-white hover:bg-gray-200 dark:hover:bg-[#2a2a2a]'
                                    }`} 
                                    aria-label={isFavorite ? t('status.favorite') : "Favorite"}
                                    title={isFavorite ? t('status.favorite') : "Favorite"}
                                >
                                    <HeartIcon solid={isFavorite} className="h-5 w-5" />
                                </button>
                            )}
                        </div>
                    </div>
                    
                    <div className="flex-1 min-w-0">
                       <div className="p-6 rounded-lg bg-white/80 dark:bg-[#0f0f0f]/80 backdrop-blur-sm">
                           <div className="flex justify-between items-start">
                               <div>
                                    <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white">
                                        {isSeasonPage ? (
                                            <>
                                                <span className="text-2xl block text-gray-500 dark:text-gray-400 font-medium mb-1">{show.parent_show_title}</span>
                                                {show.title}
                                            </>
                                        ) : (
                                            <>
                                                {show.title} 
                                                {show.year && <span className="text-3xl text-gray-500 dark:text-gray-400 font-medium ml-3">({show.year})</span>}
                                            </>
                                        )}
                                    </h1>
                                </div>
                               {isSeasonPage && (
                                   <div className="flex items-center gap-2 ms-4">
                                       <button 
                                            onClick={() => prevSeason && navigateToSeason(prevSeason.season_number)}
                                            disabled={!prevSeason}
                                            className="p-2 rounded-full bg-gray-100 dark:bg-white/10 text-gray-900 dark:text-white disabled:opacity-30 disabled:cursor-not-allowed hover:bg-gray-200 dark:hover:bg-white/20 transition-colors"
                                            title="Previous Season"
                                       >
                                            <ChevronLeftIcon className="w-5 h-5 rtl:rotate-180" />
                                       </button>
                                       <button 
                                            onClick={() => nextSeason && navigateToSeason(nextSeason.season_number)}
                                            disabled={!nextSeason}
                                            className="p-2 rounded-full bg-gray-100 dark:bg-white/10 text-gray-900 dark:text-white disabled:opacity-30 disabled:cursor-not-allowed hover:bg-gray-200 dark:hover:bg-white/20 transition-colors"
                                            title="Next Season"
                                       >
                                            <ChevronRightIcon className="w-5 h-5 rtl:rotate-180" />
                                       </button>
                                   </div>
                               )}
                           </div>
                            <div className="flex items-center space-x-4 rtl:space-x-reverse text-md text-gray-500 dark:text-gray-400 my-3">
                                <span>{show.year}</span>
                                {show.maturity && <span className="ring-1 ring-gray-400 dark:ring-gray-600 px-1.5 text-xs rounded">{show.maturity}</span>}
                                {show.format && <span className="bg-brand-primary text-black px-1.5 text-xs font-bold rounded">{show.format}</span>}
                                <div className="flex items-center text-yellow-500 dark:text-brand-primary">
                                    <StarIcon className="text-yellow-500 dark:text-brand-primary" />
                                    <span className="ms-1 font-semibold">{show.rating ? show.rating.toFixed(1) : '0'}/10</span>
                                </div>
                            </div>
                            <div className="mb-6 max-w-2xl">
                                <p className="text-gray-700 dark:text-gray-300 text-base md:text-lg whitespace-pre-line">
                                    {displayedDescription}
                                </p>
                                {shouldTruncate && (
                                    <button 
                                        onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
                                        className="text-blue-600 dark:text-brand-primary font-semibold text-sm hover:underline mt-2 focus:outline-none"
                                    >
                                        {isDescriptionExpanded ? t('common.read_less') : t('common.read_more')}
                                    </button>
                                )}
                            </div>
                            <div className="flex flex-wrap items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-6">
                                <span className="font-semibold text-gray-700 dark:text-gray-300">{t('common.genres')}:</span>
                                {show.genres?.map(genre => (
                                    <button 
                                        key={genre} 
                                        onClick={() => handleGenreClick(genre)}
                                        className="bg-gray-100 dark:bg-[#1e1e1e] hover:bg-blue-600 dark:hover:bg-brand-primary hover:text-white dark:hover:text-[#121212] transition-colors text-gray-700 dark:text-gray-300 px-2 py-0.5 rounded-full cursor-pointer ring-1 ring-gray-300 dark:ring-gray-700 hover:ring-transparent"
                                    >
                                        {t(`genres.${genre}`, genre)}
                                    </button>
                                ))}
                            </div>
                            {show.participants && show.participants.length > 0 && (
                                <div className="flex flex-col gap-3 text-sm text-gray-500 dark:text-gray-400 mb-6">
                                    <span className="font-semibold text-gray-700 dark:text-gray-300">{t('details.friends_watching')}:</span>
                                    <div className="flex items-center gap-2">
                                        <div className="flex -space-x-2 rtl:space-x-reverse">
                                            {show.participants.slice(0, 10).map(participant => (
                                                <button key={participant.name} onClick={() => handleViewUser(participant)} className="hover:z-10 transition-transform hover:scale-110">
                                                    <Avatar src={participant.avatar_url} alt={participant.name} size="sm" className="ring-2 ring-white dark:ring-[#0f0f0f]" />
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}
                            {show.next_episode_to_air && (
                                <NextEpisodeCard 
                                    episode={show.next_episode_to_air} 
                                    className="mt-4" 
                                    onNotify={onRegisterNotification}
                                    notifications={notifications}
                                    isLoggedIn={!!currentUser}
                                    onNavigate={onNavigate}
                                    showImage={show.image_url}
                                    showTitle={show.title}
                                    showId={show.id}
                                    isSubscribed={isSubscribed}
                                    isAnime={show.is_anime}
                                />
                            )}

                            {/* AI Insights Section */}
                            {!isSeasonPage && show.media_type !== 'season' && (
                                <div className="mt-8">
                                    <AIAnalysis show={show} />
                                </div>
                            )}
                       </div>
                    </div>
                </div>

                <div className="mt-12 flex flex-col lg:flex-row gap-8 lg:gap-12">
                    <div className="w-full lg:w-72 flex-shrink-0 space-y-8">
                        <div className="bg-transparent p-0 rounded-xl sticky top-24">
                            <div className="flex gap-4 mb-8">
                                {show.external_ids?.facebook_id && (
                                    <a href={`https://facebook.com/${show.external_ids.facebook_id}`} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-[#1877F2] transition-colors"><FacebookIconV2 className="w-6 h-6" /></a>
                                )}
                                {show.external_ids?.instagram_id && (
                                    <a href={`https://instagram.com/${show.external_ids.instagram_id}`} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-[#E4405F] transition-colors"><InstagramIcon className="w-6 h-6" /></a>
                                )}
                                {show.external_ids?.twitter_id && (
                                    <a href={`https://twitter.com/${show.external_ids.twitter_id}`} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-black dark:hover:text-white transition-colors"><XIcon className="w-5 h-5" /></a>
                                )}
                                {show.homepage && (
                                    <a href={show.homepage} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-blue-600 dark:hover:text-brand-primary transition-colors" title="Website">
                                        <LinkIcon className="w-6 h-6" />
                                    </a>
                                )}
                            </div>
                            <div className="space-y-4 text-sm">
                                <div>
                                    <span className="block text-gray-500 dark:text-gray-400 font-medium">{t('details.format')}</span>
                                    <button onClick={handleFormatClick} className="text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-brand-primary transition-colors text-start">
                                        {getFormat()}
                                    </button>
                                </div>
                                {show.status && (
                                    <div>
                                        <span className="block text-gray-500 dark:text-gray-400 font-medium">{t('common.status')}</span>
                                        <button onClick={handleStatusClick} className="text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-brand-primary transition-colors text-start">
                                            {show.status}
                                        </button>
                                    </div>
                                )}
                                {show.original_language && (
                                    <div>
                                        <span className="block text-gray-500 dark:text-gray-400 font-medium">{t('details.original_language')}</span>
                                        <button onClick={handleLanguageClick} className="text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-brand-primary transition-colors text-start">
                                            {formatLanguage(show.original_language)}
                                        </button>
                                    </div>
                                )}
                                {(show.number_of_seasons || 0) > 0 && (
                                    <div>
                                        <span className="block text-gray-500 dark:text-gray-400 font-medium">{t('hero.seasons')}</span>
                                        <span className="text-gray-900 dark:text-white">{show.number_of_seasons}</span>
                                    </div>
                                )}
                                {(show.number_of_episodes || 0) > 0 && (
                                    <div>
                                        <span className="block text-gray-500 dark:text-gray-400 font-medium">{t('details.episodes')}</span>
                                        <div className="flex items-center gap-2">
                                            <button onClick={handleEpisodesClick} className="text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-brand-primary transition-colors text-start">
                                                {show.number_of_episodes}
                                            </button>
                                            {currentUser && show.media_type === 'tv' && (
                                                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-brand-primary/10 text-brand-primary border border-brand-primary/20">
                                                    {watchedCount} {t('common.watched', 'Watched')}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                )}
                                {(show.runtime || 0) > 0 && !show.is_manga && (
                                    <div>
                                        <span className="block text-gray-500 dark:text-gray-400 font-medium">{t('details.runtime')}</span>
                                        <span className="text-gray-900 dark:text-white">{formatRuntime(show.runtime)}</span>
                                    </div>
                                )}
                                {show.networks && show.networks.length > 0 && (
                                    <div>
                                        <span className="block text-gray-500 dark:text-gray-400 font-medium">{networkLabel}</span>
                                        <div className="flex flex-wrap gap-2 mt-1">
                                            {show.networks.map((network) => (
                                                <button 
                                                    key={network.id}
                                                    onClick={() => onNavigate(`/network/${slugify(network.name)}`)}
                                                    className="inline-flex items-center bg-transparent hover:bg-gray-100 dark:hover:bg-white/10 rounded transition-colors"
                                                >
                                                    {network.logo_path ? (
                                                        <img src={`https://image.tmdb.org/t/p/w200${network.logo_path}`} alt={network.name} className="h-6 w-auto object-contain" title={network.name} />
                                                    ) : (
                                                        <span className="text-xs font-medium text-gray-700 dark:text-gray-300 px-1">{network.name}</span>
                                                    )}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                <div className="flex gap-6">
                                    <div>
                                        <span className="block text-gray-500 dark:text-gray-400 font-medium">{t('details.average')}</span>
                                        <span className="text-gray-900 dark:text-white font-bold">{(show.rating || 0) * 10}%</span>
                                    </div>
                                    <div>
                                        <span className="block text-gray-500 dark:text-gray-400 font-medium">{t('details.mean')}</span>
                                        <span className="text-gray-900 dark:text-white font-bold">{show.rating || 0}</span>
                                    </div>
                                </div>
                                <div className="flex gap-6">
                                    <div>
                                        <span className="block text-gray-500 dark:text-gray-400 font-medium">{t('details.popularity')}</span>
                                        <span className="text-gray-900 dark:text-white">{Math.round(show.popularity || 0)}</span>
                                    </div>
                                    <div>
                                        <span className="block text-gray-500 dark:text-gray-400 font-medium">{t('details.favorites')}</span>
                                        <span className="text-gray-900 dark:text-white">{realFavoritesCount.toLocaleString()}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex-1 min-w-0 space-y-12">
                        {show.cast && show.cast.length > 0 && (
                            <section>
                                <div className="flex justify-between items-center mb-4">
                                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{show.is_anime ? t('details.voice_actors') : t('details.cast')}</h2>
                                    <button 
                                        onClick={handleViewFullCast}
                                        className="text-sm font-semibold text-blue-600 dark:text-brand-primary hover:underline flex items-center gap-1"
                                    >
                                        {t('common.view_all')} <ArrowRightIcon className="w-4 h-4 rtl:rotate-180" />
                                    </button>
                                </div>
                                <div className="relative group">
                                    {canScrollCastPrev && (
                                        <button 
                                            onClick={() => scrollCast('prev')} 
                                            className="absolute start-0 top-1/2 -translate-y-1/2 z-10 p-2 bg-white/80 dark:bg-black/50 rounded-full shadow-md hover:bg-white dark:hover:bg-black/80 text-gray-800 dark:text-white transition-all"
                                        >
                                            <ChevronLeftIcon className="w-6 h-6 rtl:rotate-180" />
                                        </button>
                                    )}
                                    {canScrollCastNext && (
                                        <button 
                                            onClick={() => scrollCast('next')} 
                                            className="absolute end-0 top-1/2 -translate-y-1/2 z-10 p-2 bg-white/80 dark:bg-black/50 rounded-full shadow-md hover:bg-white dark:hover:bg-black/80 text-gray-800 dark:text-white transition-all"
                                        >
                                            <ChevronRightIcon className="w-5 h-5 rtl:rotate-180" />
                                        </button>
                                    )}
                                    <div ref={castScrollRef} className="flex gap-4 overflow-x-auto scrollbar-hide pb-4 snap-x">
                                        {visibleCast?.map((member) => {
                                            const isCastFavorite = userCharacters[member.id]?.status === 'Favorite';
                                            const personUrl = `/person/${slugify(member.name)}`;
                                            return (
                                            <a key={member.id} href={personUrl} className="flex-shrink-0 w-32 snap-start cursor-pointer group/actor relative block" onClick={(e) => { if (!e.metaKey && !e.ctrlKey && e.button === 0) { e.preventDefault(); onNavigate(personUrl); } }} title={`${member.name} as ${member.character}`}>
                                                <div className="w-full aspect-[2/3] rounded-lg overflow-hidden bg-gray-200 dark:bg-gray-800 mb-2 relative">
                                                    {member.profile_path ? <img src={member.profile_path} alt={member.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" loading="lazy" /> : <div className="w-full h-full flex items-center justify-center"><UserPlaceholderIcon className="w-10 h-10 text-gray-400" /></div>}
                                                    {handleUpdateListStatus && (
                                                        <button onClick={(e) => handleToggleCastFavorite(e, member)} className={`absolute top-1 right-1 p-1.5 rounded-full backdrop-blur-sm transition-all duration-200 shadow-sm ${isCastFavorite ? 'bg-white/80 text-red-500 opacity-100' : 'bg-black/30 text-white opacity-0 group-hover:opacity-100 hover:bg-white/80 hover:text-red-500'}`} title={isCastFavorite ? "Remove from favorites" : "Add to favorites"}>
                                                            <HeartIcon solid={isCastFavorite} className="w-4 h-4" />
                                                        </button>
                                                    )}
                                                </div>
                                                <h3 className="font-bold text-gray-900 dark:text-white text-sm truncate group-hover/actor:text-blue-600 dark:group-hover/actor:text-brand-primary">{member.name}</h3>
                                                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{member.character}</p>
                                            </a>
                                        )})}
                                        <div className="flex-shrink-0 w-32 snap-start">
                                            <button onClick={handleViewFullCast} className="flex flex-col items-center justify-center w-full aspect-[2/3] rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:border-blue-500 hover:text-blue-600 dark:hover:border-brand-primary dark:hover:text-brand-primary transition-colors">
                                                <span className="font-bold text-sm">{t('common.view_all')}</span>
                                                <ArrowRightIcon className="w-4 h-4 mt-1 rtl:rotate-180" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </section>
                        )}

                        {generateSeoParagraph()}

                        {show.media_type === 'tv' && !show.is_manga && !isSeasonPage && (
                            <div className="mb-12 animate-fade-in">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{t('details.episodes')}</h2>
                                    {show.seasons && show.seasons.length > 0 && (
                                        <div className="relative">
                                            <select value={selectedSeason || ''} onChange={(e) => setSelectedSeason(parseInt(e.target.value))} className="appearance-none bg-gray-100 dark:bg-[#1e1e1e] border border-gray-200 dark:border-gray-800 text-gray-900 dark:text-white py-2 ps-4 pe-10 rounded-lg font-medium focus:outline-none focus:ring-2 focus:ring-brand-primary cursor-pointer">
                                                {show.seasons.map(season => (
                                                    <option key={season.id} value={season.season_number}>Season {season.season_number}</option>
                                                ))}
                                            </select>
                                            <CaretDownIcon className="absolute end-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none text-gray-500" />
                                        </div>
                                    )}
                                </div>
                                {loadingEpisodes ? <div className="py-12 flex justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-primary"></div></div> : (
                                    <div className="space-y-4">
                                        {seasonEpisodes.length > 0 ? (
                                            seasonEpisodes.map(episode => (
                                                <div key={episode.id} className="group flex flex-col md:flex-row gap-4 items-start p-4 rounded-xl bg-gray-50 dark:bg-[#181818] border border-gray-200 dark:border-gray-800 transition-colors hover:border-brand-primary/50 dark:hover:border-brand-primary/30 cursor-pointer" onClick={() => handleEpisodeClick(episode)}>
                                                    <div className="flex-shrink-0 w-full md:w-48 aspect-video rounded-lg overflow-hidden bg-gray-200 dark:bg-gray-800 relative">
                                                        {episode.still_path ? <img src={episode.still_path.startsWith('http') ? episode.still_path : `https://image.tmdb.org/t/p/w500${episode.still_path}`} alt={episode.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" loading="lazy" /> : <div className="w-full h-full flex items-center justify-center text-gray-400"><span className="text-xs">No Image</span></div>}
                                                        <div className="absolute top-1 right-1"><div className="bg-black/70 backdrop-blur-md text-white text-[10px] font-bold px-1.5 py-0.5 rounded"><EpisodeCountdown airDate={episode.air_date} /></div></div>
                                                        <div className="absolute bottom-1 right-1 bg-black/60 px-1.5 py-0.5 rounded text-[10px] text-white font-medium">{episode.runtime ? `${episode.runtime}m` : 'N/A'}</div>
                                                    </div>
                                                    <div className="flex-1 min-w-0 w-full">
                                                        <div className="flex justify-between items-start gap-2 mb-1">
                                                            <div><h3 className="text-lg font-bold text-gray-900 dark:text-white line-clamp-1 group-hover:text-brand-primary transition-colors"><span className="text-gray-500 dark:text-gray-500 me-2 font-mono text-sm">E{episode.episode_number}</span>{episode.name}</h3><div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400 mt-1"><span>{episode.air_date ? new Date(episode.air_date).toLocaleDateString() : 'TBA'}</span>{episode.vote_average > 0 && <div className="flex items-center gap-1 text-yellow-500"><StarIcon className="w-3 h-3" /><span>{episode.vote_average.toFixed(1)}</span></div>}</div></div>
                                                            <div className="flex-shrink-0" onClick={(e) => e.stopPropagation()}><ListStatusButton showId={episode.id} userList={userList} handleUpdateListStatus={handleUpdateListStatus} isIconOnly show={{ ...show, id: episode.id, title: episode.name, media_type: 'tv', image_url: episode.still_path ? `https://image.tmdb.org/t/p/w500${episode.still_path}` : '', year: episode.air_date ? new Date(episode.air_date).getFullYear() : 0 }} transparent align="right" /></div>
                                                        </div>
                                                        <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2 leading-relaxed">{episode.overview || "No overview available for this episode."}</p>
                                                    </div>
                                                </div>
                                            ))
                                        ) : <div className="text-center py-12 bg-gray-50 dark:bg-[#1e1e1e] rounded-lg border border-dashed border-gray-200 dark:border-gray-800"><p className="text-gray-500 dark:text-gray-400">No episodes found for this season.</p></div>}
                                    </div>
                                )}
                            </div>
                        )}

                        {show.relations && show.relations.length > 0 && <ContentCarousel title={show.is_anime ? `${t('hero.seasons')} & ${t('details.related_media')}` : t('details.related_media')} shows={show.relations} onShowClick={(s) => { const slug = slugify(s.title); let prefix = s.media_type === 'tv' ? '/tv/' : '/movie/'; onNavigate(`${prefix}${slug}`); }} userList={userList} userFavorites={userFavorites} handleUpdateListStatus={handleUpdateListStatus} handleToggleFavorite={handleToggleFavorite} />}
                        {!isSeasonPage && !show.is_manga && seasonShows.length > 0 && <div className="mt-8"><ContentCarousel title={t('hero.seasons')} shows={seasonShows} onShowClick={(s) => onNavigate(`/tv/${slugify(show.title)}/season/${s.season_number}`)} userList={userList} userFavorites={userFavorites} handleUpdateListStatus={handleUpdateListStatus} handleToggleFavorite={handleToggleFavorite} /></div>}
                        {show.promo_video_url && <PromoVideo videoUrl={show.promo_video_url} title={show.title} />}
                        {show.gallery_urls && show.gallery_urls.length > 0 && <ImageSlider images={show.gallery_urls} title={show.title} />}
                    </div>
                </div>

                {moreLikeThis.length > 0 && <div className="mt-16"><ContentCarousel title={t('details.more_like_this')} shows={moreLikeThis} onShowClick={(s) => { const slug = slugify(s.title); let prefix = s.media_type === 'tv' ? '/tv/' : '/movie/'; onNavigate(`${prefix}${slug}`); }} userList={userList} userFavorites={userFavorites} handleUpdateListStatus={handleUpdateListStatus} handleToggleFavorite={handleToggleFavorite} /></div>}

                <div className="mt-16 w-full">
                    <CommentsSection showId={show.id} onViewUser={handleViewUser} currentUser={currentUser} />
                </div>
            </div>
            {isEditorOpen && (
                <ShowEditorModal 
                    isOpen={isEditorOpen}
                    onClose={() => setIsEditorOpen(false)}
                    show={show}
                    listItem={userList[show.id]}
                    onSave={async (data) => {
                        await handleUpdateListStatus(show.id, data.status || 'Planning', show, undefined, data);
                    }}
                    onDelete={async () => {
                        await handleUpdateListStatus(show.id, null, show);
                        setIsEditorOpen(false);
                    }}
                    isFavorite={isFavorite}
                    onToggleFavorite={() => handleToggleFavorite?.(show)}
                />
            )}
        </div>
    );
};

export default ShowDetail;