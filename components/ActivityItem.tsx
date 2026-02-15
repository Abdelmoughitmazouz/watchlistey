
import React from 'react';
import { UserActivity } from '../types';
import { Avatar } from './Avatar';
import { 
    HeartIcon, CommentIcon, ShareIcon, WatchingIcon, CompletedIcon, 
    PlanningIcon, PausedIcon, DroppedIcon, RewatchingIcon, StarIcon 
} from '../constants';
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

    const getStatusConfig = () => {
        switch (action) {
            case 'added_to_list':
                return { label: 'Planning', color: 'text-gray-500', icon: PlanningIcon, bg: 'bg-gray-500' };
            case 'started_watching':
                return { label: 'Watching', color: 'text-emerald-500', icon: WatchingIcon, bg: 'bg-emerald-500' };
            case 'progress_updated':
                return { label: 'Progress', color: 'text-emerald-500', icon: WatchingIcon, bg: 'bg-emerald-500' };
            case 'completed':
                return { label: 'Completed', color: 'text-blue-500', icon: CompletedIcon, bg: 'bg-blue-600' };
            case 'dropped':
                return { label: 'Dropped', color: 'text-rose-500', icon: DroppedIcon, bg: 'bg-rose-600' };
            case 'paused_watching':
                return { label: 'Paused', color: 'text-amber-500', icon: PausedIcon, bg: 'bg-amber-500' };
            case 'rewatching':
                return { label: 'Rewatching', color: 'text-indigo-500', icon: RewatchingIcon, bg: 'bg-indigo-600' };
            default:
                return { label: 'Post', color: 'text-blue-400', icon: CommentIcon, bg: 'bg-blue-400' };
        }
    };

    const config = getStatusConfig();
    const StatusIcon = config.icon;

    const renderActionText = () => {
        const title = metadata.title || 'Unknown Title';
        const titleSpan = <span className="font-bold text-gray-900 dark:text-white group-hover:underline">“{title}”</span>;
        
        switch (action) {
            case 'added_to_list':
                return <>Started planning {titleSpan}</>;
            case 'started_watching':
                return <>Started watching {titleSpan}</>;
            case 'progress_updated':
                const range = metadata.episode_range || `episode ${metadata.progress}`;
                return <>Watched <span className="font-bold text-gray-900 dark:text-white">{range}</span> of {titleSpan}</>;
            case 'completed':
                return <>Completed {titleSpan}</>;
            case 'dropped':
                return <>Dropped {titleSpan}</>;
            case 'paused_watching':
                return <>Paused {titleSpan}</>;
            case 'rewatching':
                return <>Started rewatching {titleSpan}</>;
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
        <div className="bg-white dark:bg-[#0c0c0c] border border-gray-200 dark:border-gray-800 rounded-3xl overflow-hidden shadow-sm transition-all animate-fade-in group/item">
            <div className="p-6 flex items-start gap-5">
                {/* User Avatar - Fixed at top left */}
                <button onClick={() => onNavigate(`/u/${user.username}`)} className="flex-shrink-0 mt-1">
                    <div className="relative">
                        <Avatar 
                            src={user.avatar_url} 
                            alt={user.name} 
                            size="md" 
                            className="ring-2 ring-transparent group-hover/item:ring-brand-primary/30 transition-all rounded-full border border-gray-100 dark:border-gray-800" 
                        />
                    </div>
                </button>

                <div className="flex-1 min-w-0">
                    {/* Header Area */}
                    <div className="flex items-center gap-2 mb-0.5">
                        <button 
                            onClick={() => onNavigate(`/u/${user.username}`)}
                            className="text-base font-bold text-gray-900 dark:text-white hover:text-brand-primary transition-colors truncate"
                        >
                            {user.name}
                        </button>
                        <span className="text-sm text-gray-400 dark:text-gray-500 whitespace-nowrap font-medium">
                            {timeAgo(created_at)}
                        </span>
                    </div>

                    {/* Activity Action Line */}
                    <div className="text-[15px] text-gray-500 dark:text-gray-400 leading-tight mb-4">
                        {renderActionText()}
                    </div>

                    {/* Post Content (for manual posts) */}
                    {action === 'post' && content && (
                        <p className="text-[15px] text-gray-800 dark:text-gray-200 mb-4 whitespace-pre-wrap leading-relaxed">
                            {content}
                        </p>
                    )}

                    {/* Media Attachment Card - Closely matching the screenshot */}
                    {metadata.title && (
                        <div className="flex items-center gap-4">
                             {/* Extra optional side avatar from reference */}
                            <div className="hidden sm:block flex-shrink-0">
                                <div className="relative">
                                    <Avatar src={user.avatar_url} size="sm" className="ring-2 ring-white dark:ring-[#0c0c0c] shadow-md" />
                                    <div className={`absolute -bottom-1 -right-1 p-0.5 rounded-full ${config.bg} text-white ring-1 ring-white dark:ring-[#0c0c0c]`}>
                                        <StatusIcon className="w-2 h-2" />
                                    </div>
                                </div>
                            </div>

                            <div 
                                onClick={handleMediaClick}
                                className="flex-1 flex gap-5 p-5 bg-[#0f0f0f] dark:bg-[#0c0c0c] rounded-2xl border border-gray-200 dark:border-gray-800 cursor-pointer hover:bg-gray-100/10 dark:hover:bg-[#111] transition-all group/media relative overflow-hidden"
                            >
                                {/* Poster */}
                                <div className="w-16 sm:w-20 h-24 sm:h-28 bg-gray-200 dark:bg-gray-800 rounded-lg overflow-hidden flex-shrink-0 shadow-xl border border-white/5">
                                    {metadata.image ? (
                                        <img 
                                            src={`https://image.tmdb.org/t/p/w200${metadata.image}`} 
                                            alt={metadata.title} 
                                            className="w-full h-full object-cover group-hover/media:scale-105 transition-transform duration-700"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-[10px] text-gray-500 font-black uppercase text-center p-2">No Poster</div>
                                    )}
                                </div>

                                {/* Media Details */}
                                <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                                    <div className="space-y-1.5">
                                        <div className="flex items-center gap-2">
                                            <h4 className="text-lg sm:text-xl font-extrabold text-gray-900 dark:text-white truncate group-hover/media:text-brand-primary transition-colors">
                                                “{metadata.title}”
                                            </h4>
                                            <span className="text-[10px] font-black px-1.5 py-0.5 rounded bg-gray-200 dark:bg-[#1a1a1a] text-gray-600 dark:text-gray-400 uppercase tracking-tighter">
                                                {activity.media_type === 'movie' ? 'MOVIE' : 'SERIES'}
                                            </span>
                                        </div>
                                        
                                        <div className={`flex items-center gap-1.5 text-sm font-bold ${config.color}`}>
                                            <StatusIcon className="w-4 h-4" />
                                            <span>{config.label}</span>
                                        </div>
                                    </div>

                                    {/* Footer Label */}
                                    <div className="mt-4 flex items-center gap-2">
                                        <p className="text-[10px] font-bold text-gray-500 dark:text-gray-500 tracking-widest uppercase">
                                            Click to view details
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Social Footer */}
                    <div className="mt-6 flex items-center justify-between">
                        <div className="flex items-center gap-6">
                            <button className="flex items-center gap-2 text-xs font-bold text-gray-500 hover:text-red-500 transition-all transform active:scale-90">
                                <HeartIcon className="w-5 h-5" />
                                <span className="tabular-nums">{activity.likes || 0}</span>
                            </button>
                            <button className="flex items-center gap-2 text-xs font-bold text-gray-500 hover:text-blue-500 transition-all transform active:scale-90">
                                <CommentIcon className="w-5 h-5" />
                                <span className="tabular-nums">{activity.replies || 0}</span>
                            </button>
                        </div>
                        
                        <button className="p-2 rounded-full text-gray-400 hover:text-white hover:bg-gray-100 dark:hover:bg-[#1a1a1a] transition-all">
                            <ShareIcon className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ActivityItem;
