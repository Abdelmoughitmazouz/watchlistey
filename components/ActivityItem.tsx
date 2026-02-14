import React from 'react';
import { UserActivity } from '../types';
import { Avatar } from './Avatar';
import { 
    HeartIcon, CommentIcon, ShareIcon, WatchingIcon, CompletedIcon, 
    PlanningIcon, PausedIcon, DroppedIcon, RewatchingIcon, StarIcon,
    EyeIcon
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
        const titleSpan = <span className="font-bold text-gray-900 dark:text-white">“{title}”</span>;
        
        switch (action) {
            case 'added_to_list':
                return <>Added {titleSpan} to list</>;
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

    return (
        <div className="bg-white dark:bg-[#0c0c0d] border border-gray-200 dark:border-gray-800 rounded-[24px] overflow-hidden shadow-sm hover:shadow-md transition-all animate-fade-in group/item">
            <div className="p-6 flex gap-4 items-start">
                {/* User Avatar - At the top */}
                <button onClick={() => onNavigate(`/u/${user.username}`)} className="flex-shrink-0 mt-1">
                    <Avatar src={user.avatar_url} alt={user.name} size="md" className="ring-2 ring-transparent group-hover/item:ring-brand-primary/20 transition-all" />
                </button>

                <div className="flex-1 min-w-0">
                    {/* Header: Name + Time */}
                    <div className="flex items-center gap-2 mb-1">
                        <button 
                            onClick={() => onNavigate(`/u/${user.username}`)}
                            className="font-extrabold text-gray-900 dark:text-white hover:text-brand-primary transition-colors text-base"
                        >
                            {user.name}
                        </button>
                        <span className="text-xs text-gray-400 dark:text-gray-500 font-medium">
                            {timeAgo(created_at)}
                        </span>
                    </div>

                    {/* Action Text line */}
                    <div className="text-[15px] text-gray-500 dark:text-gray-400 leading-tight mb-4">
                        {renderActionText()}
                    </div>

                    {/* Post Content (for manual posts) */}
                    {action === 'post' && content && (
                        <p className="text-[15px] text-gray-800 dark:text-gray-200 mb-4 whitespace-pre-wrap leading-relaxed">
                            {content}
                        </p>
                    )}

                    {/* Media Attachment Card - Styled like the screenshot */}
                    {metadata.title && (
                        <div 
                            onClick={handleMediaClick}
                            className="flex gap-5 p-5 bg-gray-50/30 dark:bg-[#121214] rounded-[20px] border border-gray-100 dark:border-gray-800/60 cursor-pointer hover:border-brand-primary/30 dark:hover:border-brand-primary/20 transition-all group/media"
                        >
                            {/* Small Poster */}
                            <div className="w-[72px] h-[108px] bg-gray-200 dark:bg-gray-800 rounded-lg overflow-hidden flex-shrink-0 shadow-lg border border-white/5">
                                {metadata.image ? (
                                    <img 
                                        src={`https://image.tmdb.org/t/p/w200${metadata.image}`} 
                                        alt={metadata.title} 
                                        className="w-full h-full object-cover group-hover/media:scale-110 transition-transform duration-700"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-[10px] text-gray-400 font-bold uppercase">N/A</div>
                                )}
                            </div>

                            {/* Details Column */}
                            <div className="flex-1 min-w-0 flex flex-col justify-between py-1">
                                <div>
                                    <div className="flex items-center gap-2 mb-2">
                                        <h4 className="text-xl font-black text-gray-900 dark:text-white truncate">
                                            “{metadata.title}”
                                        </h4>
                                        <span className="text-[10px] font-black px-2 py-0.5 rounded bg-gray-200 dark:bg-[#25262b] text-gray-500 dark:text-gray-400 uppercase tracking-widest">
                                            {activity.media_type === 'movie' ? 'MOVIE' : 'TV'}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className={`flex items-center gap-1.5 text-sm font-bold ${config.color}`}>
                                            <EyeIcon className="w-4 h-4" />
                                            <span>{config.label}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="text-[10px] text-gray-400 dark:text-gray-500 font-black tracking-widest uppercase">
                                    CLICK TO VIEW DETAILS
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Social Footer */}
                    <div className="mt-6 flex items-center gap-8">
                        <button className="flex items-center gap-2 text-sm font-bold text-gray-400 hover:text-red-500 transition-colors">
                            <HeartIcon className="w-5 h-5" />
                            <span className="tabular-nums">{activity.likes || 0}</span>
                        </button>
                        <button className="flex items-center gap-2 text-sm font-bold text-gray-400 hover:text-blue-500 transition-colors">
                            <CommentIcon className="w-5 h-5" />
                            <span className="tabular-nums">{activity.replies || 0}</span>
                        </button>
                        <button className="ml-auto p-1 text-gray-400 hover:text-white transition-colors">
                            <ShareIcon className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ActivityItem;