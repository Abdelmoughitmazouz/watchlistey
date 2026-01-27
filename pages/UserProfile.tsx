import React, { useState, useEffect } from 'react';
import { User, Show, ListStatus, ListItem } from '../types';
import { PlusIcon, VerifiedBadgeIcon, XIcon, FacebookIconV2, InstagramIcon, YouTubeIcon, SettingsIconV2 } from '../constants';
import UserShowList from '../components/UserShowList';
import { Avatar } from '../components/Avatar';
import { useTranslation } from 'react-i18next';
import { getShowDetails, getPersonDetails, mapTMDBToShow } from '../lib/tmdb';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';

const PrivateLockIcon = ({ className }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className || "w-6 h-6"}>
        <path d="M12 14.5V16.5M7 10.0288C7.47142 10 8.05259 10 8.8 10H15.2C15.9474 10 16.5286 10 17 10.0288M7 10.0288C6.41168 10.0647 5.99429 10.1455 5.63803 10.327C5.07354 10.6146 4.6146 11.0735 4.32698 11.638C3.85195 12.5706 3.85195 14.0791 3.85195 17.0961V17.3776C3.85195 20.3946 3.85195 21.9031 4.32698 22.8356C4.6146 23.4001 5.07354 23.859 5.63803 24.1466C6.57061 24.6217 8.07906 24.6217 11.0961 24.6217H12.9039C15.9209 24Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
);

interface UserProfileProps {
    user: User;
    activeTab?: string;
    onBack: () => void;
    onNavigate: (path: string) => void;
    shows: Show[];
    currentUser?: User;
    handleUpdateListStatus?: (showId: number, status: ListStatus | null, show?: Show) => void;
    handleToggleFavorite?: (show: Show) => void;
}

const UserProfile: React.FC<UserProfileProps> = ({ 
    user, 
    activeTab = 'All', 
    onBack, 
    onNavigate, 
    shows, 
    currentUser, 
    handleUpdateListStatus, 
    handleToggleFavorite 
}) => {
    const { t } = useTranslation();
    const isOwnProfile = currentUser?.id === user.id;

    // Handle Privacy
    const isPrivate = user.list_privacy === 'private' && !isOwnProfile;
    
    // Social Links
    const socialLinks = [
        { icon: XIcon, url: user.x ? `https://x.com/${user.x}` : null },
        { icon: InstagramIcon, url: user.instagram ? `https://instagram.com/${user.instagram}` : null },
        { icon: YouTubeIcon, url: user.youtube ? `https://youtube.com/@${user.youtube}` : null },
        { icon: FacebookIconV2, url: user.facebook ? `https://facebook.com/${user.facebook}` : null },
    ].filter(link => link.url);

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-[#0f0f0f] pb-12 transition-colors duration-200">
            {/* Cover Image */}
            <div className="h-64 md:h-80 lg:h-[400px] w-full bg-gray-200 dark:bg-[#1a1a1a] relative">
                {user.cover_url && (
                    <img src={user.cover_url} alt="Cover" className="w-full h-full object-cover" />
                )}
                {isOwnProfile && (
                    <button 
                        onClick={() => onNavigate('/settings/profile')}
                        className="absolute top-4 right-4 bg-black/50 hover:bg-black/70 text-white p-2.5 rounded-full backdrop-blur-md transition-colors z-20"
                        title={t('nav.settings')}
                    >
                        <SettingsIconV2 className="w-5 h-5" />
                    </button>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent"></div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Profile Information Card */}
                <div className="relative -mt-24 sm:-mt-32 mb-10 bg-white dark:bg-[#121212] rounded-[32px] p-6 md:p-10 shadow-2xl border border-gray-200/50 dark:border-gray-800/50">
                    <div className="flex flex-col md:flex-row items-center md:items-end gap-6 md:gap-10">
                        {/* Avatar */}
                        <div className="relative -mt-16 md:-mt-28">
                            <div className="h-36 w-36 md:h-48 md:w-48 rounded-full ring-8 ring-white dark:ring-[#121212] bg-white dark:bg-[#1e1e1e] overflow-hidden shadow-2xl">
                                <Avatar src={user.avatar_url} alt={user.name} size="lg" className="w-full h-full" />
                            </div>
                            {user.is_verified && (
                                <VerifiedBadgeIcon className="absolute bottom-3 right-3 w-10 h-10 text-blue-500 bg-white dark:bg-[#121212] rounded-full border-4 border-white dark:border-[#121212]" />
                            )}
                        </div>

                        {/* User Basic Info */}
                        <div className="flex-1 text-center md:text-left min-w-0">
                            <h1 className="text-4xl md:text-5xl font-black text-gray-900 dark:text-white tracking-tight leading-tight">
                                {user.name}
                            </h1>
                            <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mt-2">
                                <p className="text-gray-500 dark:text-gray-400 font-bold text-lg md:text-xl">@{user.username}</p>
                                <span className="inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-gray-100 dark:bg-[#252525] text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700">
                                    {user.title || 'Member'}
                                </span>
                            </div>
                        </div>

                        {/* Social Actions */}
                        <div className="flex gap-2.5 self-center md:self-end mb-1">
                            {socialLinks.map((link, i) => (
                                <a 
                                    key={i} 
                                    href={link.url!} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="p-3 bg-gray-50 dark:bg-[#1e1e1e] text-gray-500 dark:text-gray-400 rounded-2xl hover:bg-gray-100 dark:hover:bg-[#2a2a2a] hover:text-blue-600 dark:hover:text-brand-primary transition-all border border-gray-100 dark:border-gray-800 shadow-sm"
                                >
                                    <link.icon className="w-5 h-5" />
                                </a>
                            ))}
                        </div>
                    </div>

                    {/* Bio Section */}
                    {user.bio && (
                        <div className="mt-10 pt-8 border-t border-gray-100 dark:border-gray-800 animate-fade-in">
                            <h2 className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em] mb-4">Biography</h2>
                            <p className="text-gray-700 dark:text-gray-300 text-lg md:text-xl leading-relaxed whitespace-pre-line max-w-4xl">
                                {user.bio}
                            </p>
                        </div>
                    )}
                </div>

                {/* Main Content Area */}
                {isPrivate ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center bg-white dark:bg-[#121212] rounded-[32px] border border-dashed border-gray-200 dark:border-gray-800">
                        <div className="bg-gray-100 dark:bg-[#1e1e1e] p-8 rounded-full mb-6">
                            <PrivateLockIcon className="w-16 h-16 text-gray-400" />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">This account is private</h2>
                        <p className="text-gray-500 dark:text-gray-400 max-w-xs mx-auto text-lg">Follow this user to see their watchlists and activity.</p>
                    </div>
                ) : (
                    <div className="min-h-[600px]">
                        <UserShowList 
                            userList={user.list || {}}
                            userCharacters={user.characters}
                            userFavorites={user.favorites}
                            shows={shows}
                            onNavigate={onNavigate}
                            handleUpdateListStatus={isOwnProfile ? handleUpdateListStatus : undefined}
                            handleToggleFavorite={isOwnProfile ? handleToggleFavorite : undefined}
                            layout="sidebar"
                            defaultTab={activeTab === 'All' ? 'All' : activeTab}
                        />
                    </div>
                )}
            </div>
        </div>
    );
};

export default UserProfile;