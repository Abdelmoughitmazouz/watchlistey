import React, { useState, useEffect } from 'react';
import { User, Show, ListStatus, ListItem } from '../types';
import { PlusIcon, VerifiedBadgeIcon, XIcon, FacebookIconV2, InstagramIcon, YouTubeIcon, SettingsIconV2 } from '../constants';
import UserShowList from '../components/UserShowList';
import { Avatar } from '../components/Avatar';
import AdSense from '../components/AdSense';
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
        <div className="min-h-screen bg-white dark:bg-[#0f0f0f] pb-12 transition-colors duration-200">
            {/* Cover Image */}
            <div className="h-48 md:h-64 w-full bg-gray-200 dark:bg-[#1a1a1a] relative">
                {user.cover_url && (
                    <img src={user.cover_url} alt="Cover" className="w-full h-full object-cover" />
                )}
                {isOwnProfile && (
                    <button 
                        onClick={() => onNavigate('/settings/profile')}
                        className="absolute top-4 right-4 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full backdrop-blur-sm transition-colors"
                        title={t('nav.settings')}
                    >
                        <SettingsIconV2 className="w-5 h-5" />
                    </button>
                )}
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="relative -mt-16 sm:-mt-20 mb-6 flex flex-col sm:flex-row items-center sm:items-end gap-4 sm:gap-6">
                    {/* Avatar */}
                    <div className="relative">
                        <div className="h-32 w-32 sm:h-40 sm:w-40 rounded-full ring-4 ring-white dark:ring-[#0f0f0f] bg-white dark:bg-[#1e1e1e] overflow-hidden">
                            <Avatar src={user.avatar_url} alt={user.name} size="lg" className="w-full h-full" />
                        </div>
                        {user.is_verified && (
                            <VerifiedBadgeIcon className="absolute bottom-2 right-2 w-8 h-8 text-blue-500 bg-white dark:bg-[#0f0f0f] rounded-full border-2 border-white dark:border-[#0f0f0f]" />
                        )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 text-center sm:text-left mb-2">
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center justify-center sm:justify-start gap-2">
                            {user.name}
                        </h1>
                        <p className="text-gray-500 dark:text-gray-400 font-medium">@{user.username}</p>
                        {user.title && <p className="text-gray-600 dark:text-gray-300 text-sm mt-1">{user.title}</p>}
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 mb-4 sm:mb-2">
                        {socialLinks.map((link, i) => (
                            <a 
                                key={i} 
                                href={link.url!} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="p-2 bg-gray-100 dark:bg-[#1e1e1e] text-gray-600 dark:text-gray-400 rounded-full hover:bg-gray-200 dark:hover:bg-[#333] transition-colors"
                            >
                                <link.icon className="w-5 h-5" />
                            </a>
                        ))}
                    </div>
                </div>

                {/* Bio */}
                {user.bio && (
                    <div className="mb-8 max-w-3xl">
                        <p className="text-gray-700 dark:text-gray-300 whitespace-pre-line">{user.bio}</p>
                    </div>
                )}

                <hr className="border-gray-200 dark:border-gray-800 mb-8" />

                {/* Content */}
                {isPrivate ? (
                    <div className="flex flex-col items-center justify-center py-16 text-center">
                        <div className="bg-gray-100 dark:bg-[#1e1e1e] p-6 rounded-full mb-4">
                            <PrivateLockIcon className="w-12 h-12 text-gray-400" />
                        </div>
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">This account is private</h2>
                        <p className="text-gray-500 dark:text-gray-400">Follow this user to see their lists.</p>
                    </div>
                ) : (
                    <div className="min-h-[400px]">
                        {/* Custom Layout for Profile to include Sidebar Ad */}
                        <div className="flex flex-col lg:flex-row gap-8">
                             <div className="flex-1 min-w-0">
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
                             {/* Optional Sidebar Ad Column for Desktop */}
                             {!isOwnProfile && (
                                <div className="hidden xl:block w-72 flex-shrink-0">
                                    <div className="sticky top-24">
                                        <AdSense slot="5904887585" format="fluid" className="mt-0" />
                                    </div>
                                </div>
                             )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default UserProfile;