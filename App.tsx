import React, { useState, useEffect, useCallback, useRef } from 'react';
import Header from './components/Header';
import Footer from './components/Footer';
import HeroSection from './components/HeroSection';
import ContentCarousel from './components/ContentCarousel';
import PromoSection from './components/PromoSection';
import { Show, User, ListItem, ListStatus, AppNotification } from './types';
import { getTrendingMovies, getTrendingTV, getTopRatedMovies, getActionMovies, getComedyMovies, getSciFiMovies, getShowDetails, slugify, getShowIdFromSlug } from './lib/tmdb';
import { supabase, isSupabaseConfigured, getProfileByUsername, getProfileById } from './lib/supabaseClient';
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
import AdSense from './components/AdSense';
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
            if (isSupabaseConfigured) {
                const { data: { session } } = await supabase.auth.getSession();
                if (session) {
                    const fullProfile = await getProfileById(session.user.id);
                    if (fullProfile) setUser(fullProfile);
                    else {
                        const { data: profile } = await supabase.from('profiles').select('*').eq('id', session.user.id).single();
                        if (profile) setUser({ ...profile, list: {}, favorites: {}, characters: {} });
                    }
                }
            }
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

    const handleUpdateListStatus = async (showId: number, status: ListStatus | null, show?: Show, customAddedAt?: string) => {
        if (!user) return false;
        let dbMediaType = show?.media_type || 'tv';
        setUser(prev => {
            if (!prev) return undefined;
            const newList = { ...prev.list };
            const newChars = { ...prev.characters };
            const timestamp = customAddedAt || new Date().toISOString();
            if (dbMediaType === 'person') {
                if (status === null) delete newChars[showId];
                else newChars[showId] = { id: Date.now(), show_id: showId, person_id: showId, user_id: prev.id, status: status, added_at: timestamp, media_type: 'person', title: show?.title, poster_path: show?.image_url?.replace('https://image.tmdb.org/t/p/w500', ''), is_favorite: true } as any;
                return { ...prev, characters: newChars };
            } else {
                if (status === null) delete newList[showId];
                else newList[showId] = { id: Date.now(), show_id: showId, user_id: prev.id, status: status, added_at: timestamp, media_type: dbMediaType, title: show?.title, poster_path: show?.image_url?.replace('https://image.tmdb.org/t/p/w500', ''), is_favorite: newList[showId]?.is_favorite };
                return { ...prev, list: newList };
            }
        });
        if (!isSupabaseConfigured) return true;
        try {
            if (status === null) {
                 if (dbMediaType === 'person') await supabase.from('characters').delete().match({ user_id: user.id, person_id: showId });
                 else await supabase.from('list_items').delete().match({ user_id: user.id, show_id: showId, media_type: dbMediaType });
            } else {
                 if (dbMediaType === 'person') await supabase.from('characters').upsert({ user_id: user.id, person_id: showId, name: show?.title, profile_path: show?.image_url?.replace('https://image.tmdb.org/t/p/w500', ''), added_at: customAddedAt });
                 else {
                     const payload: any = { user_id: user.id, show_id: showId, status: status, media_type: dbMediaType, updated_at: new Date().toISOString() };
                     if (customAddedAt) payload.added_at = customAddedAt;
                     if (show) { payload.title = show.title; payload.poster_path = show.image_url?.replace('https://image.tmdb.org/t/p/w500', ''); payload.vote_average = show.rating; payload.release_date = show.year ? `${show.year}-01-01` : null; }
                     await supabase.from('list_items').upsert(payload, { onConflict: 'user_id, show_id, media_type' });
                 }
            }
            return true;
        } catch (e) { return false; }
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
        if (selectedShow && (currentRoute.type && currentRoute.slug)) return <ShowDetail show={selectedShow} allShows={[...movies, ...tvShows]} onBack={() => handleNavigate('/')} onNavigate={handleNavigate} onUpdateShow={setSelectedShow} userList={user?.list || {}} userFavorites={user?.favorites} userCharacters={user?.characters} handleUpdateListStatus={handleUpdateListStatus} handleToggleFavorite={handleToggleFavorite} currentUser={user} notifications={notifications} />;
        if (isContentNotFound) return <NotFoundPage onNavigate={handleNavigate} />;
        return <div className="min-h-screen flex items-center justify-center pt-20"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-primary"></div></div>;
    };

    return (
        <div className="min-h-screen bg-white dark:bg-[#0f0f0f] text-gray-900 dark:text-white transition-colors duration-200">
            {!['login', 'signup', 'forgot-password'].includes(currentRoute.rest) && (
                <Header onNavigate={handleNavigate} isLoggedIn={!!user} onLogin={() => handleNavigate('/login')} onLogout={() => setUser(undefined)} user={user} isDark={isDark} toggleTheme={() => setIsDark(!isDark)} hasHero={hasHero} notifications={notifications} />
            )}
            {renderContent()}

            {/* Global Ad Placement Unit: Auto-relaxed above Footer */}
            {!['login', 'signup', 'forgot-password'].includes(currentRoute.rest) && !isBuilderRoute && (
                <div className="max-w-7xl mx-auto px-4 md:px-8">
                    <AdSense slot="3812795414" format="autorelaxed" />
                </div>
            )}

            {!['login', 'signup', 'forgot-password', 'my-list', 'settings'].includes(currentRoute.rest) && !currentRoute.rest.startsWith('search') && !isBuilderRoute && <Footer onNavigate={handleNavigate} />}
        </div>
    );
};

export default App;