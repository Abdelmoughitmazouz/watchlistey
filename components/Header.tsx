import React, { useState, useEffect, useRef } from 'react';
import {
    Logo, MenuIcon, CloseIcon, SearchIconV2, SunIcon, MoonIcon, BellIcon
} from '../constants';
import DropdownAvatar from './DropdownAvatar';
import SearchBar from './SearchBar';
import LanguageSelector from './LanguageSelector';
import { User, AppNotification } from '../types';
import { useTranslation } from 'react-i18next';

interface HeaderProps {
    onNavigate: (path: string) => void;
    isLoggedIn: boolean;
    onLogin: () => void;
    onLogout: () => void;
    user?: User;
    hasHero?: boolean;
    isDark?: boolean;
    toggleTheme: () => void;
    notifications?: AppNotification[];
    markNotificationAsRead?: (id: string) => void;
}

const NavItem = ({ 
    children, 
    textColorClass,
    onClick
}: React.PropsWithChildren<{ textColorClass: string, onClick?: () => void }>) => (
    <button 
        onClick={onClick}
        className={`flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-md font-semibold transition-colors outline-none focus-visible:ring-2 focus-visible:ring-brand-primary ${textColorClass}`}
    >
        {children}
    </button>
);

const Header: React.FC<HeaderProps> = ({ onNavigate, isLoggedIn, onLogin, onLogout, user, hasHero = true, isDark = false, toggleTheme, notifications = [], markNotificationAsRead }) => {
    const { t, i18n } = useTranslation();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [isScrolled, setIsScrolled] = useState(false);
    const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
    
    const searchContainerRef = useRef<HTMLDivElement>(null);
    const notificationRef = useRef<HTMLDivElement>(null);

    // Scroll detection for Chameleon Effect
    useEffect(() => {
        const handleScroll = () => {
            if (window.scrollY > 10) {
                setIsScrolled(true);
            } else {
                setIsScrolled(false);
            }
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);
    
    // Close search on Escape key
    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                setIsSearchOpen(false);
                setIsNotificationsOpen(false);
            }
        };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, []);

    // Click outside to close search and notifications
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
                setIsSearchOpen(false);
            }
            if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
                setIsNotificationsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isSearchOpen, isNotificationsOpen]);

    useEffect(() => {
        if (isMobileMenuOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'auto';
        }
        return () => { document.body.style.overflow = 'auto'; };
    }, [isMobileMenuOpen]);

    // Calculate dynamic text colors based on hero/scroll state
    const isTransparentHero = hasHero && !isScrolled;

    const navTextColorClass = isTransparentHero 
        ? "text-white hover:text-brand-primary" 
        : "text-gray-900 dark:text-white hover:text-black dark:hover:text-brand-primary";

    const secondaryTextColorClass = isTransparentHero
        ? "text-white hover:text-brand-primary"
        : "text-gray-700 dark:text-white hover:text-black dark:hover:text-brand-primary";

    const handleNavClick = (path: string) => {
        onNavigate(path);
        setIsMobileMenuOpen(false);
    };

    const hasUnread = notifications.some(n => !n.isRead);

    const handleNotificationClick = (notification: AppNotification) => {
        if (markNotificationAsRead && !notification.isRead) {
            markNotificationAsRead(notification.id);
        }
        if (notification.link) {
            onNavigate(notification.link);
            setIsNotificationsOpen(false);
        }
    };

    const changeLanguage = (lng: string) => {
        i18n.changeLanguage(lng);
    };

    return (
        <>
            <div className="fixed top-0 left-0 right-0 z-50 flex flex-col">
                {/* Migration Notice Banner */}
                <div className="bg-brand-primary text-black text-center py-2 px-4 text-sm font-bold relative z-[60]">
                    Anime and Manga have been moved to <a href="https://www.animelab.org" target="_blank" rel="noopener noreferrer" className="underline hover:text-white transition-colors">animelab.org</a>
                </div>

                <header 
                    className={`w-full transition-colors duration-300 ${
                        isScrolled 
                        ? 'bg-white/95 dark:bg-[#0f0f0f]/95 backdrop-blur-md shadow-sm' 
                        : (hasHero ? 'bg-gradient-to-b from-[#0f0f0f]/80 to-transparent' : 'bg-white dark:bg-[#0f0f0f]')
                    }`}
                >
                    <div className="flex size-full max-w-7xl mx-auto items-center pe-3 ps-4 md:px-8 h-18 md:h-20">
                        <div className="flex w-full justify-between gap-4 items-center">
                            <div className="flex flex-1 items-center gap-5">
                                <button onClick={() => { onNavigate('/'); setIsMobileMenuOpen(false); }} aria-label="Go to homepage">
                                    <div className={isTransparentHero ? "dark" : ""}>
                                        <Logo isDark={isDark} />
                                    </div>
                                </button>

                                {/* Desktop Navigation */}
                                <nav className="hidden md:flex items-center gap-1">
                                    <NavItem textColorClass={navTextColorClass} onClick={() => onNavigate('/search')}>{t('nav.browse')}</NavItem>
                                    <NavItem textColorClass={navTextColorClass} onClick={() => onNavigate('/search?type=tv')}>{t('nav.tv')}</NavItem>
                                    <NavItem textColorClass={navTextColorClass} onClick={() => onNavigate('/search?type=movie')}>{t('nav.movies')}</NavItem>
                                    <NavItem textColorClass={navTextColorClass} onClick={() => onNavigate('/lists')}>{t('nav.lists')}</NavItem>
                                    <NavItem textColorClass={navTextColorClass} onClick={() => onNavigate('/blog')}>{t('nav.blog')}</NavItem>
                                </nav>
                            </div>

                            <div className="flex items-center gap-2">
                                 
                                 {/* Search Icon Trigger */}
                                <button 
                                    onClick={() => setIsSearchOpen(true)}
                                    className={`p-2 transition-colors ${secondaryTextColorClass}`}
                                    aria-label="Open search"
                                >
                                    <SearchIconV2 className="w-6 h-6 rtl:flip" />
                                </button>

                                {/* Language Selector (Hidden on Mobile) */}
                                <div className="hidden md:block">
                                    <LanguageSelector textColorClass={secondaryTextColorClass} />
                                </div>

                                {/* Notifications Icon - Only show when logged in */}
                                {isLoggedIn && (
                                    <div className="relative" ref={notificationRef}>
                                        <button 
                                            onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                                            className={`p-2 transition-colors relative ${secondaryTextColorClass}`}
                                            aria-label="Notifications"
                                        >
                                            <BellIcon className="w-6 h-6" />
                                            {hasUnread && (
                                                <span className="absolute top-2 right-2 h-2.5 w-2.5 rounded-full bg-red-500 border-2 border-white dark:border-[#0f0f0f]"></span>
                                            )}
                                        </button>

                                        {/* Notification Dropdown */}
                                        {isNotificationsOpen && (
                                            <div className="absolute right-0 mt-2 w-80 md:w-96 bg-white dark:bg-[#1e1e1e] rounded-xl border border-gray-200 dark:border-gray-800 shadow-2xl overflow-hidden ring-1 ring-black ring-opacity-5 z-50 origin-top-right animate-in fade-in zoom-in-95 duration-200 rtl:left-0 rtl:right-auto rtl:origin-top-left">
                                                <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-gray-50/50 dark:bg-[#252525]">
                                                    <h3 className="font-semibold text-gray-900 dark:text-white text-sm">Notifications</h3>
                                                </div>
                                                <div className="max-h-[400px] overflow-y-auto">
                                                    {notifications.length > 0 ? (
                                                        notifications.map((notif) => (
                                                            <div 
                                                                key={notif.id}
                                                                onClick={() => handleNotificationClick(notif)}
                                                                className={`group flex items-start gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-[#2a2a2a] cursor-pointer border-b border-gray-100 dark:border-gray-800 last:border-0 transition-all ${!notif.isRead ? 'bg-blue-50/30 dark:bg-blue-900/10' : ''}`}
                                                            >
                                                                <div className="flex-shrink-0 w-12 h-16 bg-gray-200 dark:bg-gray-700 rounded-md overflow-hidden shadow-sm relative">
                                                                    {notif.image ? (
                                                                        <img src={notif.image} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                                                                    ) : (
                                                                        <div className="w-full h-full flex items-center justify-center text-xs text-gray-400">N/A</div>
                                                                    )}
                                                                    {!notif.isRead && (
                                                                        <div className="absolute top-0 right-0 w-2.5 h-2.5 bg-blue-500 rounded-full border border-white dark:border-[#1e1e1e]"></div>
                                                                    )}
                                                                </div>
                                                                <div className="flex-1 min-w-0 pt-0.5">
                                                                    <p className={`text-sm mb-0.5 leading-tight ${!notif.isRead ? 'font-bold text-gray-900 dark:text-white' : 'font-medium text-gray-700 dark:text-gray-300'}`}>
                                                                        {notif.title}
                                                                    </p>
                                                                    <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 leading-relaxed">
                                                                        {notif.message}
                                                                    </p>
                                                                    <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-1.5">
                                                                        {new Date(notif.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        ))
                                                    ) : (
                                                        <div className="px-4 py-12 text-center">
                                                            <div className="mx-auto w-12 h-12 bg-gray-100 dark:bg-[#2a2a2a] rounded-full flex items-center justify-center mb-3">
                                                                <BellIcon className="w-6 h-6 text-gray-400" />
                                                            </div>
                                                            <p className="text-sm text-gray-500 dark:text-gray-400">No new notifications</p>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Theme Toggle */}
                                <button 
                                    onClick={toggleTheme}
                                    className={`p-2 transition-colors ${secondaryTextColorClass}`}
                                    aria-label="Toggle theme"
                                >
                                    {isDark ? <SunIcon className="w-6 h-6" /> : <MoonIcon className="w-6 h-6" />}
                                </button>

                                <div className="hidden md:flex items-center gap-3">
                                    {isLoggedIn && user ? (
                                       <DropdownAvatar onLogout={onLogout} onNavigate={onNavigate} user={user} />
                                    ) : (
                                       <>
                                        <button 
                                            onClick={() => onNavigate('/login')} 
                                            className={`rounded-lg px-4 py-2 text-md font-semibold transition-colors ${secondaryTextColorClass}`}
                                        >
                                            {t('nav.login')}
                                        </button>
                                        <button onClick={() => onNavigate('/signup')} className="rounded-lg px-4 py-2 text-md font-bold bg-brand-primary text-black hover:bg-brand-primary/90 border border-transparent">
                                            {t('nav.register')}
                                        </button>
                                       </>
                                    )}
                                </div>
                            </div>

                            {/* Mobile Controls */}
                            <div className="flex items-center gap-2 md:hidden">
                                <button onClick={() => { setIsMobileMenuOpen(!isMobileMenuOpen); }} className={`group cursor-pointer rounded-lg p-2 lg:hidden ${navTextColorClass}`} aria-label="Toggle navigation menu">
                                    {isMobileMenuOpen ? <CloseIcon /> : <MenuIcon />}
                                </button>
                            </div>
                        </div>
                    </div>
                </header>
            </div>

            {/* Mobile Menu */}
             {isMobileMenuOpen && (
                 <div className="lg:hidden fixed inset-0 top-[108px] bg-white dark:bg-[#0f0f0f] z-40 overflow-y-auto transition-colors duration-200">
                     <div className="container mx-auto px-4 py-6 flex flex-col h-full">
                         <nav className="flex flex-col space-y-2 text-lg font-medium text-gray-900 dark:text-white">
                             <button onClick={() => handleNavClick('/')} className="text-start py-2.5 px-3 rounded-md hover:bg-gray-100 dark:hover:bg-white/10 hover:text-black dark:hover:text-brand-primary transition-colors">{t('nav.home')}</button>
                             <button onClick={() => handleNavClick('/search')} className="text-start py-2.5 px-3 rounded-md hover:bg-gray-100 dark:hover:bg-white/10 hover:text-black dark:hover:text-brand-primary transition-colors">{t('nav.browse')}</button>
                             <button onClick={() => handleNavClick('/search?type=tv')} className="text-start py-2.5 px-3 rounded-md hover:bg-gray-100 dark:hover:bg-white/10 hover:text-black dark:hover:text-brand-primary transition-colors">{t('nav.tv')}</button>
                             <button onClick={() => handleNavClick('/search?type=movie')} className="text-start py-2.5 px-3 rounded-md hover:bg-gray-100 dark:hover:bg-white/10 hover:text-black dark:hover:text-brand-primary transition-colors">{t('nav.movies')}</button>
                             <button onClick={() => handleNavClick('/lists')} className="text-start py-2.5 px-3 rounded-md hover:bg-gray-100 dark:hover:bg-white/10 hover:text-black dark:hover:text-brand-primary transition-colors">{t('nav.lists')}</button>
                             <button onClick={() => handleNavClick('/blog')} className="text-start py-2.5 px-3 rounded-md hover:bg-gray-100 dark:hover:bg-white/10 hover:text-black dark:hover:text-brand-primary transition-colors">{t('nav.blog')}</button>
                         </nav>
                         
                         {/* Mobile Language Switcher */}
                         <div className="mt-4 px-3">
                            <label className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-2 block">Language</label>
                            <div className="flex flex-wrap gap-2">
                                {['en', 'es', 'fr', 'de', 'ru', 'ja', 'zh', 'ar'].map(lang => (
                                    <button 
                                        key={lang}
                                        onClick={() => changeLanguage(lang)}
                                        className={`px-3 py-1.5 rounded-md text-sm border ${i18n.language === lang ? 'bg-brand-primary border-brand-primary text-black' : 'border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300'}`}
                                    >
                                        {lang.toUpperCase()}
                                    </button>
                                ))}
                            </div>
                         </div>

                         <div className="mt-auto pt-6 border-t border-gray-200 dark:border-gray-800 flex flex-col space-y-3">
                            {isLoggedIn ? (
                                <button onClick={() => { onLogout(); setIsMobileMenuOpen(false); }} className="w-full rounded-lg px-4 py-2.5 text-md font-semibold bg-gray-100 dark:bg-[#1e1e1e] text-gray-900 dark:text-white ring-1 ring-inset ring-gray-300 dark:ring-gray-700 hover:bg-gray-200 dark:hover:bg-[#2a2a2a]">{t('nav.logout')}</button>
                            ) : (
                                <>
                                    <button onClick={() => { onNavigate('/signup'); setIsMobileMenuOpen(false); }} className="w-full rounded-lg px-4 py-2.5 text-md font-bold bg-brand-primary text-black hover:bg-brand-primary/90">{t('nav.register')}</button>
                                    <button onClick={() => { onNavigate('/login'); setIsMobileMenuOpen(false); }} className="w-full rounded-lg px-4 py-2.5 text-md font-semibold bg-gray-100 dark:bg-[#1e1e1e] text-gray-900 dark:text-white ring-1 ring-inset ring-gray-300 dark:ring-gray-700 hover:bg-gray-200 dark:hover:bg-[#2a2a2a]">{t('nav.login')}</button>
                                </>
                            )}
                         </div>
                     </div>
                 </div>
             )}

            {/* Search Overlay */}
            {isSearchOpen && (
                <div className="fixed inset-0 z-[60] flex items-start justify-center pt-24 sm:pt-32 px-4">
                    {/* Backdrop */}
                    <div 
                        className="absolute inset-0 bg-black/80 backdrop-blur-sm transition-opacity" 
                        onClick={() => setIsSearchOpen(false)}
                    />
                    
                    {/* Search Bar Container - Spotlight Style */}
                    <div 
                        ref={searchContainerRef} 
                        className="relative w-full max-w-4xl bg-white dark:bg-[#1e1e1e] rounded-lg ring-1 ring-black/5 dark:ring-white/10 animate-in fade-in zoom-in-95 slide-in-from-top-4 duration-200 overflow-hidden"
                    >
                         <SearchBar 
                            onNavigate={onNavigate} 
                            isDark={isDark} 
                            autoFocus 
                            className="w-full"
                            onClose={() => setIsSearchOpen(false)}
                        />
                    </div>
                </div>
            )}
        </>
    );
};

export default Header;