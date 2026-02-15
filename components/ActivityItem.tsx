
import React, { useState } from 'react';
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
    
    // Interactivity State
    const [likesCount, setLikesCount] = useState(activity.likes || 0);
    const [isLiked, setIsLiked] = useState(false);
    const [isSharing, setIsSharing] = useState(false);

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
        const titleSpan = <span className="font-bold text-gray-900 dark:text-white group-hover:underline">{title}</span>;
        
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

    const handleMediaClick = () => {
        if (metadata.title) {
            const slug = slugify(metadata.title);
            const prefix = activity.media_type === 'movie' ? '/movie/' : '/tv/';
            onNavigate(`${prefix}${slug}`);
        }
    };

    const handleLikeToggle = () => {
        if (isLiked) {
            setLikesCount(prev => Math.max(0, prev - 1));
        } else {
            setLikesCount(prev => prev + 1);
        }
        setIsLiked(!isLiked);
    };

    const handleShare = () => {
        setIsSharing(true);
        const url = window.location.origin + (activity.media_type === 'movie' ? '/movie/' : '/tv/') + slugify(metadata.title || '');
        navigator.clipboard.writeText(url).then(() => {
            setTimeout(() => setIsSharing(false), 2000);
        });
    };

    return (
        <div className="bg-white dark:bg-[#121212] border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all animate-fade-in group/item">
            <div className="p-5 flex gap-4 items-start">
                {/* User Avatar Section */}
                <button onClick={() => onNavigate(`/u/${user.username}`)} className="flex-shrink-0 -mt-0.5">
                    <div className="relative">
                        <Avatar 
                            src={user.avatar_url} 
                            alt={user.name} 
                            size="md" 
                            className="ring-2 ring-transparent group-hover/item:ring-brand-primary/30 transition-all duration-300" 
                        />
                        <div className={`absolute -bottom-1 -right-1 p-1 rounded-full ${config.bg} text-white ring-2 ring-white dark:ring-[#121212] shadow-sm`}>
                            <StatusIcon className="w-2.5 h-2.5" />
                        </div>
                    </div>
                </button>

                <div className="flex-1 min-w-0">
                    {/* Header: User Info & Time */}
                    <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2">
                            <button 
                                onClick={() => onNavigate(`/u/${user.username}`)}
                                className="font-bold text-gray-900 dark:text-white hover:text-brand-primary transition-colors truncate"
                            >
                                {user.name}
                            </button>
                            <span className="text-xs text-gray-400 dark:text-gray-500 whitespace-nowrap">
                                {timeAgo(created_at)}
                            </span>
                        </div>
                    </div>

                    {/* Action Description Row */}
                    <div className="text-sm text-gray-600 dark:text-gray-400 leading-snug">
                        {renderActionText()}
                    </div>

                    {/* Post Content (Only for manual posts) */}
                    {action === 'post' && content && (
                        <p className="text-[15px] text-gray-800 dark:text-gray-200 mt-2.5 whitespace-pre-wrap leading-relaxed">
                            {content}
                        </p>
                    )}

                    {/* Media Attachment Card - Re-designed per user request */}
                    {metadata.title && (
                        <div 
                            onClick={handleMediaClick}
                            className="mt-4 flex gap-4 p-4 bg-gray-50/50 dark:bg-[#1a1a1a]/50 rounded-xl border border-gray-100 dark:border-gray-800 cursor-pointer hover:bg-gray-100/80 dark:hover:bg-[#222] transition-all group/media"
                        >
                            {/* Card Poster */}
                            <div className="w-16 h-24 bg-gray-200 dark:bg-gray-800 rounded-lg overflow-hidden flex-shrink-0 shadow-sm relative">
                                {metadata.image ? (
                                    <img 
                                        src={`https://image.tmdb.org/t/p/w200${metadata.image}`} 
                                        alt={metadata.title} 
                                        className="w-full h-full object-cover group-hover/media:scale-105 transition-transform duration-500"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-[10px] text-gray-400 font-bold uppercase">No Image</div>
                                )}
                            </div>

                            {/* Card Details */}
                            <div className="flex-1 min-w-0 py-1 flex flex-col justify-between">
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <h4 className="text-base font-extrabold text-gray-900 dark:text-white truncate group-hover/media:text-brand-primary transition-colors">
                                            {metadata.title}
                                        </h4>
                                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-gray-200 dark:bg-gray-800 text-gray-500 dark:text-gray-400 uppercase tracking-tighter">
                                            {activity.media_type || 'media'}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        {/* Dynamic Rating if available */}
                                        {metadata.rating && metadata.rating > 0 && (
                                            <div className="flex items-center gap-1 text-xs font-bold text-yellow-600 dark:text-brand-primary">
                                                <StarIcon className="w-3 h-3" />
                                                <span>{metadata.rating.toFixed(1)}</span>
                                            </div>
                                        )}
                                        {/* Status Badge */}
                                        <div className={`flex items-center gap-1 text-xs font-bold ${config.color}`}>
                                            <StatusIcon className="w-3.5 h-3.5" />
                                            <span>{config.label}</span>
                                        </div>
                                    </div>
                                </div>
                                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-2 group-hover/media:text-gray-500 transition-colors">
                                    Click to view details
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Social Footer - Re-designed per user request */}
                    <div className="mt-5 flex items-center gap-7">
                        {/* Like Button */}
                        <button 
                            onClick={handleLikeToggle}
                            className={`flex items-center gap-2 text-xs font-bold transition-all transform active:scale-90 ${isLiked ? 'text-red-500' : 'text-gray-500 hover:text-red-500'}`}
                        >
                            <div className={`p-1.5 rounded-full transition-colors ${isLiked ? 'bg-red-50 dark:bg-red-900/10' : 'bg-gray-50 dark:bg-[#1a1a1a] group-hover/item:bg-gray-100 dark:group-hover/item:bg-[#252525]'}`}>
                                <HeartIcon className="w-4 h-4" solid={isLiked} />
                            </div>
                            <span className="tabular-nums">{likesCount}</span>
                        </button>

                        {/* Reply Button */}
                        <button 
                            className="flex items-center gap-2 text-xs font-bold text-gray-500 hover:text-blue-500 transition-all transform active:scale-90"
                        >
                            <div className="p-1.5 rounded-full bg-gray-50 dark:bg-[#1a1a1a] group-hover/item:bg-gray-100 dark:group-hover/item:bg-[#252525]">
                                <CommentIcon className="w-4 h-4" />
                            </div>
                            <span className="tabular-nums">{activity.replies || 0}</span>
                        </button>

                        {/* Share Button */}
                        <button 
                            onClick={handleShare}
                            className={`ml-auto p-1.5 rounded-full transition-all flex items-center gap-2 ${isSharing ? 'text-green-500' : 'text-gray-400 hover:text-gray-600 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-[#2a2a2a]'}`}
                            title="Share activity"
                        >
                            {isSharing ? (
                                <span className="text-[10px] font-bold uppercase tracking-tight animate-fade-in">Copied!</span>
                            ) : null}
                            <ShareIcon className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ActivityItem;
