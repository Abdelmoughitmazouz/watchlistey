
import React from 'react';
import { UserActivity } from '../types';
import { Avatar } from './Avatar';
import { HeartIcon, CommentIcon, ShareIcon } from '../constants';
import { slugify } from '../lib/tmdb';

interface ActivityItemProps {
    activity: UserActivity;
    onNavigate: (path: string) => void;
}

const timeAgo = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (seconds < 60) return 'Just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
};

const ActivityItem: React.FC<ActivityItemProps> = ({ activity, onNavigate }) => {
    const { user, action, metadata, content, created_at } = activity;
    
    if (!user) return null;

    const renderActionText = () => {
        const title = metadata.title || 'Unknown Title';
        
        switch (action) {
            case 'added_to_list':
                return (
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                        Added <span className="font-bold text-gray-900 dark:text-white">{title}</span> to their watchlist
                    </p>
                );
            case 'started_watching':
                return (
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                        Started watching <span className="font-bold text-gray-900 dark:text-white">{title}</span>
                    </p>
                );
            case 'progress_updated':
                const range = metadata.episode_range || `episode ${metadata.progress}`;
                return (
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                        Watched <span className="font-bold text-gray-900 dark:text-white">{range}</span> of <span className="font-bold text-gray-900 dark:text-white">{title}</span>
                    </p>
                );
            case 'completed':
                return (
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                        Completed <span className="font-bold text-gray-900 dark:text-white">{title}</span>
                    </p>
                );
            case 'dropped':
                return (
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                        Dropped <span className="font-bold text-gray-900 dark:text-white">{title}</span>
                    </p>
                );
            case 'paused_watching':
                return (
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                        Paused <span className="font-bold text-gray-900 dark:text-white">{title}</span>
                    </p>
                );
            case 'rewatching':
                return (
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                        Started rewatching <span className="font-bold text-gray-900 dark:text-white">{title}</span>
                    </p>
                );
            case 'post':
                return null; 
            default:
                return null;
        }
    };

    const handleMediaClick = () => {
        if (metadata.title) {
            const slug = slugify(metadata.title);
            const prefix = activity.media_type === 'movie' ? '/movie/' : '/tv/';
            onNavigate(`${prefix}${slug}`);
        }
    };

    return (
        <div className="bg-white dark:bg-[#121212] border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden shadow-sm animate-fade-in">
            <div className="p-4 flex gap-4">
                {/* User Avatar */}
                <button onClick={() => onNavigate(`/u/${user.username}`)} className="flex-shrink-0">
                    <Avatar src={user.avatar_url} alt={user.name} size="md" />
                </button>

                <div className="flex-1 min-w-0">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                            <button 
                                onClick={() => onNavigate(`/u/${user.username}`)}
                                className="font-bold text-gray-900 dark:text-white hover:underline truncate"
                            >
                                {user.name}
                            </button>
                            <span className="text-xs text-gray-500 dark:text-gray-500 whitespace-nowrap">
                                • {timeAgo(created_at)}
                            </span>
                        </div>
                    </div>

                    {/* Action Description */}
                    {renderActionText()}

                    {/* Post Content */}
                    {action === 'post' && content && (
                        <p className="text-sm text-gray-700 dark:text-gray-300 mt-2 whitespace-pre-wrap leading-relaxed">
                            {content}
                        </p>
                    )}

                    {/* Media Attachment */}
                    {metadata.title && (
                        <div 
                            onClick={handleMediaClick}
                            className="mt-4 flex gap-3 p-3 bg-gray-50 dark:bg-[#1a1a1a] rounded-lg border border-gray-100 dark:border-gray-800 cursor-pointer hover:bg-gray-100 dark:hover:bg-[#222] transition-colors group"
                        >
                            <div className="w-12 h-18 bg-gray-200 dark:bg-gray-800 rounded overflow-hidden flex-shrink-0">
                                {metadata.image ? (
                                    <img 
                                        src={`https://image.tmdb.org/t/p/w200${metadata.image}`} 
                                        alt={metadata.title} 
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-xs text-gray-400">?</div>
                                )}
                            </div>
                            <div className="flex-1 min-w-0 flex flex-col justify-center">
                                <h4 className="text-sm font-bold text-gray-900 dark:text-white truncate group-hover:text-brand-primary transition-colors">
                                    {metadata.title}
                                </h4>
                                <p className="text-xs text-gray-500 capitalize">{activity.media_type}</p>
                            </div>
                        </div>
                    )}

                    {/* Social Stats */}
                    <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800 flex items-center gap-6">
                        <button className="flex items-center gap-1.5 text-xs font-bold text-gray-500 hover:text-red-500 transition-colors">
                            <HeartIcon className="w-4 h-4" />
                            <span>{activity.likes || 0}</span>
                        </button>
                        <button className="flex items-center gap-1.5 text-xs font-bold text-gray-500 hover:text-blue-500 transition-colors">
                            <CommentIcon className="w-4 h-4" />
                            <span>{activity.replies || 0}</span>
                        </button>
                        <button className="ml-auto text-gray-400 hover:text-gray-600 dark:hover:text-white transition-colors">
                            <ShareIcon className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ActivityItem;
