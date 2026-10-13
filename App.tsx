
import React, { useState, useEffect, useCallback, useRef } from 'react';
import Header from './components/Header';
import Footer from './components/Footer';
import HeroSection from './components/HeroSection';
import ContentCarousel from './components/ContentCarousel';
import PromoSection from './components/PromoSection';
import { Show, User, ListItem, ListStatus, AppNotification } from './types';
import { getTrendingMovies, getTrendingTV, getTopRatedMovies, getActionMovies, getComedyMovies, getSciFiMovies, getShowDetails, slugify, getShowIdFromSlug, getEpisodeDetails, getSeasonDetails } from './lib/tmdb';
import { supabase, isSupabaseConfigured, getProfileByUsername, getProfileById, ensureProfileExists } from './lib/supabaseClient';
import { parsePath, getLocalizedPath, DEFAULT_LANGUAGE } from './lib/routeUtils';
import Login from './pages/Login';
import SignUp from './pages/SignUp';
import ForgotPassword from './pages/ForgotPassword';
import UserProfile from './pages/UserProfile';
import Settings from './pages/Settings';
import MyListPage from './pages/MyListPage';
import SearchPage from './pages/SearchPage';
import GenrePage from './pages/GenrePage';
import PersonPage from './pages/PersonPage';
import NotFoundPage from './pages/NotFoundPage';
import CastPage from './pages/CastPage';
import StaffPage from './pages/StaffPage';
import NetworkPage from './pages/NetworkPage';
import EpisodePage from './pages/EpisodePage';
import AboutPage from './pages/AboutPage';
import ContactPage from './pages/ContactPage';
import TermsPage from './pages/TermsPage';
import PrivacyPolicyPage from './pages/PrivacyPolicyPage';
import CookiesPage from './pages/CookiesPage';
import CommunityPage from './pages/CommunityPage';
import MobileAppPage from './pages/MobileAppPage';
import PartnersPage from './pages/PartnersPage';
import HelpCentrePage from './pages/HelpCentrePage';
import SupportPage from './pages/SupportPage';
import FeaturesPage from './pages/FeaturesPage';
import SitemapPage from './pages/SitemapPage';
import ShowDetail from './pages/ShowDetail';
import BlogPage from './pages/BlogPage';
import BlogPost from './pages/BlogPost';
import TMDBDemo from './pages/TMDBDemo';
import TierListsPage from './pages/TierListPage';
import TierListBuilder from './pages/TierListBuilder';
import FeedPage from './pages/FeedPage';
import { useTranslation } from 'react-i18next';
import { currentUser as demoUser } from './constants';

const App = () => {
    const { t, i18n } = useTranslation();
    const [user, setUser] = useState<User | undefined>(undefined);
    const [viewedProfile, setViewedProfile] = useState<User | undefined>(undefined);
    const [pathname, setPathname] = useState(window.location.pathname);
    const [shows, setShows] = useState<Show[]>([]);
    const prevLanguageRef = useRef(i18n.language);
    const [movies, setMovies] = useState<Show[]>([]);
    const [tvShows, setTvShows] = useState<Show[]>([]);
    const [actionMovies, setActionMovies] = useState<Show[]>([]);
    const [comedyMovies, setComedyMovies] = useState<Show[]>([]);
    const [sciFiMovies, setSciFiMovies] = useState<Show[]>([]);
    const [selectedShow, setSelectedShow] = useState<Show | null>(null);
    const [extraShows, setExtraShows] = useState<Map<string, Show>>(new Map());
    const [isContentNotFound, setIsContentNotFound] = useState(false);
    const [notifications, setNotifications] = useState<AppNotification[]>([]);

    useEffect(() => {
        const dir = i18n.dir(i18n.language);
        document.documentElement.dir = dir;
        document.documentElement.lang = i18n.language;
    }, [i18n.language]);

    const handleNavigate = (path: string, state?: Show) => {
        const localizedPath = getLocalizedPath(path, i18n.language);
        window.history.pushState(state, '', localizedPath);
        setPathname(localizedPath);
        window.scrollTo(0, 0);
        if (state) setSelectedShow(state);
    };

    useEffect(() => {
        const onPopState = () => setPathname(window.location.pathname);
        window.addEventListener('popstate', onPopState);
        return () => window.removeEventListener('popstate', onPopState);
    }, []);

    useEffect(() => {
        const init = async () => {
            try {
                const [trendingMovies, trendingTV, topMovies, action, comedy, scifi] = await Promise.all([
                    getTrendingMovies('week', 1, i18n.language),
                    getTrendingTV('week', 1, i18n.language),
                    getTopRatedMovies(1, i18n.language),
                    getActionMovies(1, i18n.language),
                    getComedyMovies(1, i18n.language),
                    getSciFiMovies(1, i18n.language)
                ]);
                setMovies(trendingMovies);
                setTvShows(trendingTV);
                setActionMovies(action);
                setComedyMovies(comedy);
                setSciFiMovies(scifi);
                setShows([...trendingMovies.slice(0, 5), ...trendingTV.slice(0, 5)]);
            } catch (error) {
                console.error("Failed to load home content", error);
            }
        };
        init();
    }, [i18n.language]);

    useEffect(() => {
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            if (session) {
                const fullProfile = await ensureProfileExists(session.user);
                if (fullProfile) setUser(fullProfile);
            } else {
                setUser(undefined);
            }
        });

        return () => {
            subscription.unsubscribe();
        };
    }, []);

    useEffect(() => {
        const resolveContent = async () => {
            const route = parsePath(pathname);
            if (route.lang !== i18n.language) i18n.changeLanguage(route.lang);
            if (route.type && route.slug && ['movie', 'tv'].includes(route.type)) {
                const type = route.type as 'movie' | 'tv';
                const slug = route.slug;
                let show: Show | null = null;
                try {
                    const languageChanged = prevLanguageRef.current !== route.lang;
                    if (!languageChanged && window.history.state && (window.history.state as Show).id) show = window.history.state as Show;
                    if (!show) {
                        const id = await getShowIdFromSlug(slug, type, route.lang);
                        if (id) show = await getShowDetails(id, type, true, route.lang);
                    }
                    if (show) {
                        const newSlug = slugify(show.title);
                        setExtraShows(prev => new Map(prev).set(`${show!.media_type}-${show!.id}`, show!));
                        setSelectedShow(show);
                        const internalPath = `/${type}/${newSlug}`;
                        const newPath = getLocalizedPath(internalPath, route.lang);
                        if (newPath !== pathname) {
                            window.history.replaceState(null, '', newPath);
                            setPathname(newPath);
                        }
                        setIsContentNotFound(false);
                    } else setIsContentNotFound(true);
                } catch (e) {
                    console.error(e);
                    setIsContentNotFound(true);
                }
            } else if (route.rest.startsWith('u/')) {
                const username = route.rest.split('u/')[1].split('/')[0];
                if (username) {
                    if (user && user.username === username) setViewedProfile(user);
                    else {
                        const profile = await getProfileByUsername(username);
                        if (profile) setViewedProfile(profile);
                        else if (!isSupabaseConfigured) setViewedProfile({ ...demoUser, username: username, name: username });
                        else setViewedProfile(undefined);
                    }
                }
                setIsContentNotFound(false);
            } else setIsContentNotFound(false);
            prevLanguageRef.current = route.lang;
        };
        resolveContent();
    }, [pathname, i18n.language, user]);

    const [isDark, setIsDark] = useState(true);
    useEffect(() => {
        if (isDark) document.documentElement.classList.add('dark');
        else document.documentElement.classList.remove('dark');
    }, [isDark]);

    const handleToggleEpisode = async (showId: number, seasonNumber: number, episodeNumber: number, isWatched: boolean) => {
        if (!user || !isSupabaseConfigured) return false;

        try {
            if (isWatched) {
                const { error } = await supabase
                    .from('episode_tracking')
                    .upsert({
                        user_id: user.id,
                        show_id: showId,
                        season_number: seasonNumber,
                        episode_number: episodeNumber,
                        is_watched: true,
                        watched_at: new Date().toISOString()
                    }, { onConflict: 'user_id, show_id, season_number, episode_number' });
                if (error) throw error;
            } else {
                const { error } = await supabase
                    .from('episode_tracking')
                    .delete()
                    .match({
                        user_id: user.id,
                        show_id: showId,
                        season_number: seasonNumber,
                        episode_number: episodeNumber
                    });
                if (error) throw error;
            }
            
            // Re-fetch progress to update the main list if needed
            // (Optional, but helps keep things in sync)
            return true;
        } catch (e) {
            console.error("Episode toggle failed", e);
            return false;
        }
    };

    const handleUpdateListStatus = async (showId: number, status: ListStatus | null, show?: Show, customAddedAt?: string, extraData?: Partial<ListItem>) => {
        if (!user) return false;
        
        // 1. Determine media type correctly
        let dbMediaType = show?.media_type || extraData?.media_type;
        
        // Try to find it from existing list if still missing
        if (!dbMediaType && user.list?.[showId]) {
            dbMediaType = user.list[showId].media_type;
        }

        // Check favorites too
        if (!dbMediaType && user.favorites?.[showId]) {
            dbMediaType = user.favorites[showId].media_type;
        }
        
        // Final fallback: Check show title patterns if show object is available
        if (!dbMediaType && show) {
            // In our system, 'Show' is a mapped type where TMDB 'name' or 'title' becomes 'title'
            // We use 'tv' as safe fallback if media_type is completely missing
            dbMediaType = show.media_type || 'tv';
        }

        // Absolute fallback based on ID range (rough estimate but better than nothing)
        if (!dbMediaType) {
            dbMediaType = 'tv';
        }

        const timestamp = customAddedAt || new Date().toISOString();

        // Update local user state for immediate response
        setUser(prev => {
            if (!prev) return undefined;
            const newList = { ...prev.list };
            const newChars = { ...prev.characters };
            
            if (dbMediaType === 'person') {
                if (status === null) delete newChars[showId];
                else newChars[showId] = { id: Date.now(), show_id: showId, person_id: showId, user_id: prev.id, status: status, added_at: timestamp, media_type: 'person', title: show?.title, poster_path: show?.image_url?.replace('https://image.tmdb.org/t/p/w500', ''), is_favorite: true } as any;
                return { ...prev, characters: newChars };
            } else {
                if (status === null) delete newList[showId];
                else {
                    const existing = (newList[showId] || {}) as Partial<ListItem>;
                    newList[showId] = { 
                        ...existing,
                        id: existing.id || Date.now(), 
                        show_id: showId, 
                        user_id: prev.id, 
                        status: status, 
                        added_at: existing.added_at || timestamp, 
                        media_type: (dbMediaType as any), 
                        title: show?.title || existing.title, 
                        poster_path: show?.image_url?.replace('https://image.tmdb.org/t/p/w500', '') || existing.poster_path, 
                        is_favorite: existing.is_favorite,
                        ...extraData
                    } as ListItem;
                }
                return { ...prev, list: newList };
            }
        });

        if (!isSupabaseConfigured) return true;

        try {
            if (status === null) {
                 if (dbMediaType === 'person') await supabase.from('characters').delete().match({ user_id: user.id, person_id: showId });
                 else await supabase.from('list_items').delete().match({ user_id: user.id, show_id: showId, media_type: dbMediaType });
            } else {
                 if (dbMediaType === 'person') {
                     await supabase.from('characters').upsert({ user_id: user.id, person_id: showId, name: show?.title, profile_path: show?.image_url?.replace('https://image.tmdb.org/t/p/w500', ''), added_at: timestamp });
                 } else {
                     const payload: any = { 
                        user_id: user.id, 
                        show_id: Number(showId), 
                        status: status, 
                        media_type: dbMediaType, 
                        added_at: timestamp, // Always provide it to satisfy potential DB constraints
                        updated_at: new Date().toISOString(),
                        ...extraData
                     };
                     
                     if (show) { 
                         payload.title = show.title; 
                         payload.poster_path = show.image_url?.replace('https://image.tmdb.org/t/p/w500', ''); 
                         payload.backdrop_path = show.backdrop_url?.replace('https://image.tmdb.org/t/p/w1280', '');
                         payload.vote_average = show.rating; 
                         payload.release_date = show.year ? `${show.year}-01-01` : null; 
                     }
                     
                     // 1. Update List
                     // We try multiple conflict targets to be compatible with different possible DB constraints
                     let { error: upsertError } = await supabase.from('list_items').upsert(payload, { onConflict: 'user_id, show_id' });
                     
                     if (upsertError) {
                        // Fallback retry with media_type in conflict target
                        const { error: retryError } = await supabase.from('list_items').upsert(payload, { onConflict: 'user_id, show_id, media_type' });
                        if (retryError) {
                            console.error("Supabase upsert failed:", retryError);
                            throw retryError;
                        }
                     }
                    // 2. Explicitly POST TO FEED (as requested)
                    const actionMap: Record<string, string> = {
                        'Watching': 'started_watching',
                        'Completed': 'completed',
                        'Plan to Watch': 'added_to_list',
                        'Planning': 'added_to_list',
                        'Paused': 'paused_watching',
                        'Dropped': 'dropped',
                        'Rewatching': 'rewatching'
                    };

                    const prevProgress = user.list?.[showId]?.progress || 0;
                    const newProgress = extraData?.progress;
                    const today = new Date().toISOString();
                    
                    const baseMetadata: any = {
                        title: show?.title,
                        image: show?.image_url?.replace('https://image.tmdb.org/t/p/w500', ''),
                        backdrop: show?.backdrop_url?.replace('https://image.tmdb.org/t/p/original', '')?.replace('https://image.tmdb.org/t/p/w1280', ''),
                        mediaType: dbMediaType
                    };

                    const activitiesToInsert: any[] = [];

                    if (dbMediaType === 'tv' && newProgress !== undefined && newProgress > prevProgress) {
                        // Handle TV Episode progress (Individual activities)
                        try {
                            let fullShow = show;
                            if (!fullShow?.seasons || fullShow.seasons.length === 0) {
                                fullShow = await getShowDetails(showId, 'tv') || show;
                            }

                            if (fullShow?.seasons && fullShow.seasons.length > 0) {
                                const trackingRows = [];
                                const seasonCache = new Map<number, any>();

                                for (let i = prevProgress + 1; i <= newProgress; i++) {
                                    // Map flat progress 'i' to season/episode
                                    let currentProgress = 0;
                                    let targetSeason = 1;
                                    let targetEpisode = i;
                                    
                                    for (const s of fullShow.seasons) {
                                        if (s.season_number === 0) continue;
                                        if (i <= currentProgress + s.episode_count) {
                                            targetSeason = s.season_number;
                                            targetEpisode = i - currentProgress;
                                            break;
                                        }
                                        currentProgress += s.episode_count;
                                    }

                                    // Add to tracking
                                    trackingRows.push({
                                        user_id: user.id,
                                        show_id: showId,
                                        season_number: targetSeason,
                                        episode_number: targetEpisode,
                                        is_watched: true,
                                        watched_at: today
                                    });

                                    // Prepare activity for this episode
                                    if (!seasonCache.has(targetSeason)) {
                                        const sDetails = await getSeasonDetails(showId, targetSeason);
                                        seasonCache.set(targetSeason, sDetails);
                                    }
                                    const seasonData = seasonCache.get(targetSeason);
                                    const epDetails = seasonData?.episodes?.find((e: any) => e.episode_number === targetEpisode);

                                    activitiesToInsert.push({
                                        user_id: user.id,
                                        show_id: showId,
                                        media_type: dbMediaType,
                                        action: 'progress_updated',
                                        metadata: {
                                            ...baseMetadata,
                                            progress: i,
                                            episode_title: epDetails?.name,
                                            episode_image: epDetails?.still_path,
                                            season_number: targetSeason,
                                            episode_number: targetEpisode
                                        }
                                    });
                                }

                                // Upsert tracking
                                if (trackingRows.length > 0) {
                                    await supabase.from('episode_tracking').upsert(trackingRows, { 
                                        onConflict: 'user_id, show_id, season_number, episode_number' 
                                    });
                                }
                            }
                        } catch (e) {
                            console.error("Error processing episode activities:", e);
                        }
                    }

                    // Handle Status-based activities (Completed, Planning, etc.)
                    const statusAction = actionMap[status];
                    if (status === 'Completed') {
                        // Always add completed activity if status is Completed
                        activitiesToInsert.push({
                            user_id: user.id,
                            show_id: showId,
                            media_type: dbMediaType,
                            action: 'completed',
                            metadata: baseMetadata
                        });
                    } else if (activitiesToInsert.length === 0 && statusAction) {
                        // Only add status action if no episode activities were added 
                        // (e.g. just moved to Planning, or moved to Watching without progress change)
                        activitiesToInsert.push({
                            user_id: user.id,
                            show_id: showId,
                            media_type: dbMediaType,
                            action: statusAction,
                            metadata: baseMetadata
                        });
                    }

                    if (activitiesToInsert.length > 0 && show) {
                        await supabase.from('user_activities').insert(activitiesToInsert);
                    }
                 }
            }
            return true;
        } catch (e) { 
            console.error("List update failed", e);
            return false; 
        }
    };

    const handleToggleFavorite = async (show: Show) => {
        if (!user) return;
        let dbMediaType = show.media_type || 'tv';
        const isFav = !!user.favorites?.[show.id];
        setUser(prev => {
            if (!prev) return undefined;
            const newFavs = { ...prev.favorites };
            if (isFav) delete newFavs[show.id];
            else newFavs[show.id] = { id: Date.now(), show_id: show.id, user_id: prev.id, status: 'Favorite', added_at: new Date().toISOString(), media_type: dbMediaType, title: show.title, poster_path: show.image_url?.replace('https://image.tmdb.org/t/p/w500', ''), is_favorite: true };
            const newList = { ...prev.list };
            if (newList[show.id]) newList[show.id] = { ...newList[show.id], is_favorite: !isFav };
            return { ...prev, favorites: newFavs, list: newList };
        });
        if (!isSupabaseConfigured) return;
        try {
            if (isFav) await supabase.from('favorites').delete().match({ user_id: user.id, show_id: show.id });
            else {
                const payload: any = { user_id: user.id, show_id: show.id, media_type: dbMediaType, title: show.title, poster_path: show.image_url?.replace('https://image.tmdb.org/t/p/w500', ''), vote_average: show.rating, release_date: show.year ? `${show.year}-01-01` : null, added_at: new Date().toISOString() };
                await supabase.from('favorites').upsert(payload);
            }
        } catch (e) { console.error(e); }
    };

    const currentRoute = parsePath(pathname);
    const isShowDetail = !!(currentRoute.type && currentRoute.slug && ['movie','tv'].includes(currentRoute.type));
    const isEpisodePage = /\/season\/[^/]+\/episode\/[^/]+$/.test(pathname);
    const isHome = !currentRoute.rest;
    const hasHero = isHome || isShowDetail || isEpisodePage;
    const isBuilderRoute = currentRoute.rest === 'lists/new' || (currentRoute.rest.startsWith('lists/') && currentRoute.rest.split('/').length >= 2);

    const renderContent = () => {
        if (isHome) {
            return (
                <div className="pb-16">
                    <HeroSection shows={shows} userList={user?.list || {}} handleUpdateListStatus={handleUpdateListStatus} onNavigate={handleNavigate} />
                    <div className="max-w-7xl mx-auto px-4 md:px-8 space-y-12 mt-8">
                        <ContentCarousel title={t('nav.movies')} shows={movies} onShowClick={(s) => handleNavigate(`/movie/${slugify(s.title)}`, s)} userList={user?.list || {}} handleUpdateListStatus={handleUpdateListStatus} />
                        
                        <ContentCarousel title={t('nav.tv')} shows={tvShows} onShowClick={(s) => handleNavigate(`/tv/${slugify(s.title)}`, s)} userList={user?.list || {}} handleUpdateListStatus={handleUpdateListStatus} />
                        <PromoSection userList={user?.list || {}} handleUpdateListStatus={handleUpdateListStatus} shows={movies} onNavigate={handleNavigate} />
                        <ContentCarousel title={t('genres.Action')} shows={actionMovies} onShowClick={(s) => handleNavigate(`/movie/${slugify(s.title)}`, s)} userList={user?.list || {}} handleUpdateListStatus={handleUpdateListStatus} />
                        <ContentCarousel title={t('genres.Comedy')} shows={comedyMovies} onShowClick={(s) => handleNavigate(`/movie/${slugify(s.title)}`, s)} userList={user?.list || {}} handleUpdateListStatus={handleUpdateListStatus} />
                        <ContentCarousel title={t('genres.Sci-Fi')} shows={sciFiMovies} onShowClick={(s) => handleNavigate(`/movie/${slugify(s.title)}`, s)} userList={user?.list || {}} handleUpdateListStatus={handleUpdateListStatus} />
                    </div>
                </div>
            );
        }
        const path = currentRoute.rest;
        if (path === 'login') return <Login onLogin={() => handleNavigate('/')} onNavigate={handleNavigate} />;
        if (path === 'signup') return <SignUp onNavigate={handleNavigate} />;
        if (path === 'forgot-password') return <ForgotPassword onNavigate={handleNavigate} />;
        if (path === 'feed') return <FeedPage onNavigate={handleNavigate} currentUser={user} />;
        if (path.startsWith('settings')) {
            const parts = path.split('/');
            const tab = parts[1] || 'details';
            return <Settings user={user || demoUser} onUpdateUser={setUser} onNavigate={handleNavigate} handleUpdateListStatus={handleUpdateListStatus} initialTab={tab} />;
        }
        if (path.startsWith('search')) return <SearchPage onNavigate={handleNavigate} onBack={() => handleNavigate('/')} userList={user?.list || {}} userFavorites={user?.favorites} userCharacters={user?.characters} handleUpdateListStatus={handleUpdateListStatus} handleToggleFavorite={handleToggleFavorite} />;
        if (path === 'my-list') return <MyListPage userList={user?.list || {}} userFavorites={user?.favorites} userCharacters={user?.characters} shows={[]} onNavigate={handleNavigate} handleUpdateListStatus={handleUpdateListStatus} handleToggleFavorite={handleToggleFavorite} />;
        if (path === 'lists') return <TierListsPage onNavigate={handleNavigate} />;
        if (path === 'lists/new' || path.startsWith('lists/')) return <TierListBuilder onNavigate={handleNavigate} />;
        if (path === 'about') return <AboutPage />;
        if (path === 'contact') return <ContactPage />;
        if (path === 'terms') return <TermsPage />;
        if (path === 'privacy') return <PrivacyPolicyPage />;
        if (path === 'cookies') return <CookiesPage />;
        if (path === 'community') return <CommunityPage />;
        if (path === 'mobile-app') return <MobileAppPage />;
        if (path === 'partners') return <PartnersPage />;
        if (path === 'help') return <HelpCentrePage />;
        if (path === 'support') return <SupportPage />;
        if (path === 'features') return <FeaturesPage />;
        if (path === 'sitemap') return <SitemapPage onNavigate={handleNavigate} />;
        if (path === 'tmdb-demo') return <TMDBDemo onNavigate={handleNavigate} />;
        if (path === 'blog') return <BlogPage onNavigate={handleNavigate} />;
        if (path.startsWith('blog/')) return <BlogPost slug={path.replace('blog/', '')} onNavigate={handleNavigate} onBack={() => handleNavigate('/blog')} />;
        if (path.startsWith('u/')) {
             const parts = path.split('/');
             const activeTab = parts[2]; 
             if (!viewedProfile && isSupabaseConfigured) return <div className="min-h-screen flex items-center justify-center pt-20"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-primary"></div></div>;
             return <UserProfile user={viewedProfile || demoUser} activeTab={activeTab} onBack={() => handleNavigate('/')} onNavigate={handleNavigate} shows={[]} currentUser={user} handleUpdateListStatus={handleUpdateListStatus} handleToggleFavorite={handleToggleFavorite} />;
        }
        if (currentRoute.type === 'person' && currentRoute.slug) return <PersonPage personId={currentRoute.slug} onNavigate={handleNavigate} onBack={() => window.history.back()} userList={user?.list || {}} userFavorites={user?.favorites} userCharacters={user?.characters} handleUpdateListStatus={handleUpdateListStatus} handleToggleFavorite={handleToggleFavorite} />;
        if (currentRoute.type === 'genre' && currentRoute.slug) return <GenrePage genreId={currentRoute.slug} onNavigate={handleNavigate} onBack={() => window.history.back()} userList={user?.list || {}} userFavorites={user?.favorites} handleUpdateListStatus={handleUpdateListStatus} handleToggleFavorite={handleToggleFavorite} />;
        if (currentRoute.type === 'network' && currentRoute.slug) return <NetworkPage networkId={currentRoute.slug} onNavigate={handleNavigate} onBack={() => window.history.back()} userList={user?.list || {}} userFavorites={user?.favorites} userCharacters={user?.characters} handleUpdateListStatus={handleUpdateListStatus} handleToggleFavorite={handleToggleFavorite} />;
        const episodeMatch = path.match(/^tv\/([^/]+)\/season\/([^/]+)\/episode\/([^/]+)$/);
        if (episodeMatch) return <EpisodePage showSlug={episodeMatch[1]} seasonNumber={episodeMatch[2]} episodeNumber={episodeMatch[3]} onBack={() => window.history.back()} onNavigate={handleNavigate} userList={user?.list || {}} handleUpdateListStatus={handleUpdateListStatus} />;
        if (path.endsWith('/cast')) { if (selectedShow) return <CastPage show={selectedShow} onBack={() => window.history.back()} onNavigate={handleNavigate} userCharacters={user?.characters} handleUpdateListStatus={handleUpdateListStatus} />; }
        if (selectedShow && (currentRoute.type && currentRoute.slug)) return <ShowDetail show={selectedShow} allShows={[...movies, ...tvShows]} onBack={() => handleNavigate('/')} onNavigate={handleNavigate} onUpdateShow={setSelectedShow} userList={user?.list || {}} userFavorites={user?.favorites} userCharacters={user?.characters} handleUpdateListStatus={handleUpdateListStatus} handleToggleFavorite={handleToggleFavorite} currentUser={user} notifications={notifications} handleToggleEpisode={handleToggleEpisode} />;
        if (isContentNotFound) return <NotFoundPage onNavigate={handleNavigate} />;
        return <div className="min-h-screen flex items-center justify-center pt-20"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-primary"></div></div>;
    };

    return (
        <div className="min-h-screen bg-white dark:bg-[#0f0f0f] text-gray-900 dark:text-white transition-colors duration-200">
            {!['login', 'signup', 'forgot-password'].includes(currentRoute.rest) && (
                <Header onNavigate={handleNavigate} isLoggedIn={!!user} onLogin={() => handleNavigate('/login')} onLogout={() => setUser(undefined)} user={user} isDark={isDark} toggleTheme={() => setIsDark(!isDark)} hasHero={hasHero} notifications={notifications} />
            )}
            {renderContent()}

            {!['login', 'signup', 'forgot-password', 'my-list', 'settings'].includes(currentRoute.rest) && !currentRoute.rest.startsWith('search') && !isBuilderRoute && <Footer onNavigate={handleNavigate} />}
        </div>
    );
};

export default App;
