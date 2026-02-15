
import React from 'react';
import { UserActivity } from '../types';
import { Avatar } from './Avatar';
import { 
    HeartIcon, CommentIcon, ShareIcon, WatchingIcon, CompletedIcon, 
    PlanningIcon, PausedIcon, DroppedIcon, RewatchingIcon, StarIcon,
    ChevronRightIcon
} from '../constants';
import { slugify } from '../lib/tmdb';

interface ActivityItemProps {
    activity: UserActivity;
    onNavigate: (path: string) => void;
}

// Simple clock icon for the "Planning" status in the card
const ClockIcon = ({ className }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className || "w-4 h-4"}>
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
    </svg>
);

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

    const renderActionText = () => {
        const title = metadata.title || 'Unknown Title';
        const titleSpan = <span className="font-bold text-gray-900 dark:text-white group-hover:underline">"{title}"</span>;
        
        switch (action) {
            case 'added_to_list':
                return <>Added {titleSpan} to their watchlist</>;
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
            case 'post':
                return null;
            default:
                return null;
        }
    };

    const handleMediaClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (metadata.title) {
            const slug = slugify(metadata.title);
            const prefix = activity.media_type === 'movie' ? '/movie/' : '/tv/';
            onNavigate(`${prefix}${slug}`);
        }
    };

    return (
        <div className="bg-white dark:bg-[#121212] border border-gray-100 dark:border-gray-800 rounded-[28px] overflow-hidden shadow-sm hover:shadow-md transition-all animate-fade-in group/item mb-6">
            <div className="p-6 flex flex-col gap-5">
                {/* Header: User Info - Full Width to fill space */}
                <div className="flex items-center gap-4">
                    <button onClick={() => onNavigate(`/u/${user.username}`)} className="flex-shrink-0 relative">
                        <Avatar src={user.avatar_url} alt={user.name} size="md" className="ring-2 ring-transparent group-hover/item:ring-brand-primary/30 transition-all border border-gray-100 dark:border-gray-800" />
                        <div className={`absolute -bottom-1 -right-1 p-1 rounded-full ${config.bg} text-white ring-2 ring-white dark:ring-[#121212] shadow-sm`}>
                            <div className="size-2.5 flex items-center justify-center">
                                <ClockIcon className="size-2.5" />
                            </div>
                        </div>
                    </button>
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                            <button 
                                onClick={() => onNavigate(`/u/${user.username}`)}
                                className="font-bold text-lg text-gray-900 dark:text-white hover:text-brand-primary transition-colors truncate"
                            >
                                {user.name}
                            </button>
                            <span className="text-xs text-gray-400 dark:text-gray-500 whitespace-nowrap mt-0.5">
                                {timeAgo(created_at)}
                            </span>
                        </div>
                        {/* Action Text - Directly below name in the header area if concise, or part of content */}
                        <div className="text-[15px] text-gray-500 dark:text-gray-400 font-medium">
                            {renderActionText()}
                        </div>
                    </div>
                </div>

                {/* Body Content */}
                <div className="space-y-4">
                    {/* Post Content */}
                    {action === 'post' && content && (
                        <p className="text-[16px] text-gray-800 dark:text-gray-200 whitespace-pre-wrap leading-relaxed px-1">
                            {content}
                        </p>
                    )}

                    {/* Media Attachment Card - Styled like the image */}
                    {metadata.title && (
                        <div 
                            onClick={handleMediaClick}
                            className="flex gap-6 p-6 bg-gray-50/40 dark:bg-[#1a1a1a]/40 rounded-[20px] border border-gray-100/50 dark:border-gray-800/50 cursor-pointer hover:bg-gray-50/80 dark:hover:bg-[#1e1e1e] transition-all group/media relative"
                        >
                            <div className="w-[85px] h-[120px] bg-gray-200 dark:bg-gray-800 rounded-xl overflow-hidden flex-shrink-0 shadow-md ring-1 ring-black/5">
                                {metadata.image ? (
                                    <img 
                                        src={`https://image.tmdb.org/t/p/w300${metadata.image}`} 
                                        alt={metadata.title} 
                                        className="w-full h-full object-cover group-hover/media:scale-105 transition-transform duration-700"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-[10px] text-gray-400 font-bold uppercase">No Poster</div>
                                )}
                            </div>
                            
                            <div className="flex-1 min-w-0 py-1 flex flex-col">
                                <div className="flex items-center gap-2 mb-2">
                                    <h4 className="text-xl font-bold text-gray-900 dark:text-white truncate group-hover/media:text-brand-primary transition-colors">
                                        "{metadata.title}"
                                    </h4>
                                    <span className="text-[10px] font-black px-1.5 py-0.5 rounded bg-gray-200 dark:bg-gray-800 text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                        {activity.media_type === 'movie' ? 'MOVIE' : 'TV'}
                                    </span>
                                </div>

                                <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 mb-auto">
                                    <ClockIcon className="w-4 h-4" />
                                    <span className="text-sm font-semibold">{config.label}</span>
                                </div>

                                <div className="mt-4 flex items-center gap-1.5 text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-[0.05em]">
                                    <span>CLICK TO VIEW DETAILS</span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Social Footer - Fills space horizontally */}
                <div className="flex items-center justify-between mt-2 px-1">
                    <div className="flex items-center gap-8">
                        <button className="flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-red-500 transition-all group/stat">
                            <div className="p-2 rounded-full bg-gray-100 dark:bg-[#1a1a1a] group-hover/stat:bg-red-50 dark:group-hover/stat:bg-red-900/20 transition-colors">
                                <HeartIcon className="w-5 h-5" />
                            </div>
                            <span className="tabular-nums">{activity.likes || 0}</span>
                        </button>
                        <button className="flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-blue-500 transition-all group/stat">
                            <div className="p-2 rounded-full bg-gray-100 dark:bg-[#1a1a1a] group-hover/stat:bg-blue-50 dark:group-hover/stat:bg-blue-900/20 transition-colors">
                                <CommentIcon className="w-5 h-5" />
                            </div>
                            <span className="tabular-nums">{activity.replies || 0}</span>
                        </button>
                    </div>
                    
                    <button className="p-2 rounded-full text-gray-400 hover:text-gray-600 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-[#2a2a2a] transition-all">
                        <ShareIcon className="w-5 h-5" />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ActivityItem;
