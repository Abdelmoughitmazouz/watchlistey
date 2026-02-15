import React from 'react';
import { UserActivity } from '../types';
import { Avatar } from './Avatar';
import { 
    HeartIcon, CommentIcon, ShareIcon, WatchingIcon, CompletedIcon, 
    PlanningIcon, PausedIcon, DroppedIcon, RewatchingIcon, EyeIcon
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
                return { label: 'Watching', color: 'text-emerald-500', icon: WatchingIcon, bg: 'bg-emerald-500' };
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
        const titleSpan = <span className="font-bold text-gray-100 group-hover:underline">{title}</span>;
        
        switch (action) {
            case 'added_to_list':
                return <>Added {titleSpan} to watchlist</>;
            case 'started_watching':
                return <>Started watching {titleSpan}</>;
            case 'progress_updated':
                const range = metadata.episode_range || `episode ${metadata.progress}`;
                return <>Watched <span className="font-bold text-white">{range}</span> of {titleSpan}</>;
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
        <div className="bg-[#0f0f0f] border border-gray-800/60 rounded-[32px] overflow-hidden shadow-lg transition-all animate-fade-in group/item mb-4">
            <div className="p-6">
                {/* Header: Avatar, Name, Time */}
                <div className="flex items-start gap-4 mb-4">
                    <button onClick={() => onNavigate(`/u/${user.username}`)} className="flex-shrink-0">
                        <Avatar src={user.avatar_url} alt={user.name} size="md" className="ring-1 ring-white/10" />
                    </button>
                    <div className="flex flex-col min-w-0 pt-0.5">
                        <div className="flex items-center gap-2">
                            <button 
                                onClick={() => onNavigate(`/u/${user.username}`)}
                                className="font-bold text-white hover:text-brand-primary transition-colors truncate text-base"
                            >
                                {user.name}
                            </button>
                            <span className="text-xs text-gray-500 font-medium">
                                {timeAgo(created_at)}
                            </span>
                        </div>
                        <div className="text-[15px] text-gray-400 mt-0.5 leading-snug">
                            {renderActionText()}
                        </div>
                    </div>
                </div>

                {/* Post Content (for manual text posts) */}
                {action === 'post' && content && (
                    <p className="text-[15px] text-gray-200 mb-4 px-1 whitespace-pre-wrap leading-relaxed">
                        {content}
                    </p>
                )}

                {/* Nested Media Card (Mockup Style) */}
                {metadata.title && (
                    <div className="relative flex gap-4">
                        <div 
                            onClick={handleMediaClick}
                            className="flex-1 flex gap-5 p-5 bg-[#050505] rounded-[24px] border border-gray-800/80 cursor-pointer hover:border-gray-700 transition-all group/media"
                        >
                            {/* Media Poster */}
                            <div className="w-20 h-28 bg-gray-900 rounded-xl overflow-hidden flex-shrink-0 shadow-md">
                                {metadata.image ? (
                                    <img 
                                        src={`https://image.tmdb.org/t/p/w200${metadata.image}`} 
                                        alt={metadata.title} 
                                        className="w-full h-full object-cover group-hover/media:scale-105 transition-transform duration-700"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-[10px] text-gray-600 font-bold uppercase p-2 text-center">No Image</div>
                                )}
                            </div>

                            {/* Media Info */}
                            <div className="flex-1 min-w-0 py-1 flex flex-col justify-center">
                                <div className="flex items-center gap-2 mb-2 flex-wrap">
                                    <h4 className="text-xl font-bold text-white truncate group-hover/media:text-brand-primary transition-colors">
                                        {metadata.title}
                                    </h4>
                                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-gray-800 text-gray-400 uppercase tracking-widest">
                                        {activity.media_type === 'movie' ? 'Movie' : 'Series'}
                                    </span>
                                </div>
                                
                                <div className="flex items-center gap-2 text-emerald-500 font-bold text-sm">
                                    <EyeIcon className="w-4 h-4" />
                                    <span>{config.label}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Social Footer */}
                <div className="mt-6 flex items-center justify-between border-t border-gray-800/40 pt-4 px-1">
                    <div className="flex items-center gap-6">
                        <button className="flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-red-500 transition-all group/btn">
                            <HeartIcon className="w-5 h-5 group-hover/btn:scale-110 transition-transform" />
                            <span>{activity.likes || 0}</span>
                        </button>
                        <button className="flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-blue-500 transition-all group/btn">
                            <CommentIcon className="w-5 h-5 group-hover/btn:scale-110 transition-transform" />
                            <span>{activity.replies || 0}</span>
                        </button>
                    </div>
                    <button className="p-1.5 text-gray-500 hover:text-white transition-colors">
                        <ShareIcon className="w-5 h-5" />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ActivityItem;