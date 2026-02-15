
import React, { useState, useEffect } from 'react';
import { UserActivity } from '../types';
import { Avatar } from './Avatar';
import { 
    HeartIcon, CommentIcon, ShareIcon, WatchingIcon, CompletedIcon, 
    PlanningIcon, PausedIcon, DroppedIcon, RewatchingIcon, StarIcon, PlusIcon
} from '../constants';
import { slugify } from '../lib/tmdb';
import { toggleActivityLike, postActivityComment, getActivityComments } from '../lib/supabaseClient';

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
    
    const [liked, setLiked] = useState(activity.is_liked || false);
    const [likesCount, setLikesCount] = useState(activity.likes || 0);
    const [showComments, setShowComments] = useState(false);
    const [comments, setComments] = useState<any[]>([]);
    const [commentText, setCommentText] = useState('');
    const [isPosting, setIsPosting] = useState(false);
    const [loadingComments, setLoadingComments] = useState(false);

    if (!user) return null;

    const getStatusConfig = () => {
        switch (action) {
            case 'added_to_list': return { label: 'Planning', color: 'text-gray-500', icon: PlanningIcon, bg: 'bg-gray-500' };
            case 'started_watching': return { label: 'Watching', color: 'text-emerald-500', icon: WatchingIcon, bg: 'bg-emerald-500' };
            case 'progress_updated': return { label: 'Progress', color: 'text-emerald-500', icon: WatchingIcon, bg: 'bg-emerald-500' };
            case 'completed': return { label: 'Completed', color: 'text-blue-500', icon: CompletedIcon, bg: 'bg-blue-600' };
            case 'dropped': return { label: 'Dropped', color: 'text-rose-500', icon: DroppedIcon, bg: 'bg-rose-600' };
            case 'paused_watching': return { label: 'Paused', color: 'text-amber-500', icon: PausedIcon, bg: 'bg-amber-500' };
            case 'rewatching': return { label: 'Rewatching', color: 'text-indigo-500', icon: RewatchingIcon, bg: 'bg-indigo-600' };
            default: return { label: 'Post', color: 'text-blue-400', icon: CommentIcon, bg: 'bg-blue-400' };
        }
    };

    const config = getStatusConfig();
    const StatusIcon = config.icon;

    const handleLike = async () => {
        const newLiked = !liked;
        setLiked(newLiked);
        setLikesCount(prev => newLiked ? prev + 1 : prev - 1);
        await toggleActivityLike(activity.id, liked, user.id);
    };

    const toggleComments = async () => {
        if (!showComments && comments.length === 0) {
            setLoadingComments(true);
            const data = await getActivityComments(activity.id);
            setComments(data);
            setLoadingComments(false);
        }
        setShowComments(!showComments);
    };

    const handlePostComment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!commentText.trim() || isPosting) return;

        setIsPosting(true);
        const data = await postActivityComment(activity.id, commentText.trim(), user.id);
        if (data) {
            setComments(prev => [...prev, data]);
            setCommentText('');
            activity.replies = (activity.replies || 0) + 1;
        }
        setIsPosting(false);
    };

    const handleMediaClick = () => {
        if (metadata.title) {
            const slug = slugify(metadata.title);
            const prefix = activity.media_type === 'movie' ? '/movie/' : '/tv/';
            onNavigate(`${prefix}${slug}`);
        }
    };

    const renderActionText = () => {
        const title = metadata.title || 'Unknown Title';
        const titleSpan = <button onClick={handleMediaClick} className="font-bold text-gray-900 dark:text-white hover:text-brand-primary transition-colors text-start">{title}</button>;
        switch (action) {
            case 'added_to_list': return <>Added {titleSpan} to their watchlist</>;
            case 'started_watching': return <>Started watching {titleSpan}</>;
            case 'progress_updated':
                const range = metadata.episode_range || `episode ${metadata.progress}`;
                return <>Watched <span className="font-bold text-gray-900 dark:text-white">{range}</span> of {titleSpan}</>;
            case 'completed': return <>Completed {titleSpan}</>;
            case 'dropped': return <>Dropped {titleSpan}</>;
            case 'paused_watching': return <>Paused {titleSpan}</>;
            case 'rewatching': return <>Started rewatching {titleSpan}</>;
            default: return null;
        }
    };

    return (
        <div className="bg-white dark:bg-[#121212] border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all animate-fade-in group/item">
            <div className="p-4 sm:p-5">
                <div className="flex gap-3 sm:gap-4 items-start mb-4">
                    <button onClick={() => onNavigate(`/u/${user.username}`)} className="flex-shrink-0">
                        <div className="relative">
                            <Avatar src={user.avatar_url} alt={user.name} size="md" className="ring-2 ring-transparent group-hover/item:ring-brand-primary/30 transition-all" />
                            <div className={`absolute -bottom-1 -right-1 p-0.5 sm:p-1 rounded-full ${config.bg} text-white ring-2 ring-white dark:ring-[#121212] shadow-sm`}>
                                <StatusIcon className="w-2.5 h-2.5" />
                            </div>
                        </div>
                    </button>

                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                            <button onClick={() => onNavigate(`/u/${user.username}`)} className="font-bold text-[15px] text-gray-900 dark:text-white hover:text-brand-primary transition-colors truncate">{user.name}</button>
                            <span className="text-[11px] text-gray-400 dark:text-gray-500 whitespace-nowrap">{timeAgo(created_at)}</span>
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400 leading-snug">{renderActionText()}</div>
                    </div>
                </div>

                <div className="space-y-4">
                    {action === 'post' && content && <p className="text-[15px] text-gray-800 dark:text-gray-200 whitespace-pre-wrap leading-relaxed">{content}</p>}
                    {metadata.title && (
                        <div onClick={handleMediaClick} className="flex gap-4 p-3 sm:p-4 bg-gray-50/50 dark:bg-[#1a1a1a]/50 rounded-xl border border-gray-100 dark:border-gray-800 cursor-pointer hover:bg-gray-100/80 dark:hover:bg-[#222] transition-all group/media">
                            <div className="w-14 sm:w-16 h-20 sm:h-24 bg-gray-200 dark:bg-gray-800 rounded-lg overflow-hidden flex-shrink-0 shadow-sm relative">
                                {metadata.image ? <img src={`https://image.tmdb.org/t/p/w200${metadata.image}`} alt={metadata.title} className="w-full h-full object-cover group-hover:media:scale-105 transition-transform duration-500" /> : <div className="w-full h-full flex items-center justify-center text-[10px] text-gray-400 font-bold uppercase">No Image</div>}
                            </div>
                            <div className="flex-1 min-w-0 py-0.5 flex flex-col justify-between">
                                <div>
                                    <div className="flex items-center gap-2 mb-0.5">
                                        <h4 className="text-base font-extrabold text-gray-900 dark:text-white truncate group-hover/media:text-brand-primary transition-colors">{metadata.title}</h4>
                                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-gray-200 dark:bg-gray-800 text-gray-500 dark:text-gray-400 uppercase tracking-tighter">{activity.media_type === 'tv' ? 'Series' : 'Movie'}</span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        {metadata.rating && metadata.rating > 0 && <div className="flex items-center gap-1 text-xs font-bold text-yellow-600 dark:text-brand-primary"><StarIcon className="w-3 h-3" /><span>{metadata.rating.toFixed(1)}</span></div>}
                                        <div className={`flex items-center gap-1 text-xs font-bold ${config.color}`}><StatusIcon className="w-3 h-3" /><span>{config.label}</span></div>
                                    </div>
                                </div>
                                <p className="text-[9px] text-gray-400 font-bold tracking-wide uppercase">Click to view details</p>
                            </div>
                        </div>
                    )}

                    <div className="flex items-center justify-between pt-1">
                        <div className="flex items-center gap-5 sm:gap-6">
                            <button onClick={handleLike} className={`flex items-center gap-1.5 text-xs font-bold transition-all transform active:scale-90 group/social ${liked ? 'text-red-500' : 'text-gray-500 hover:text-red-500'}`}>
                                <HeartIcon className={`w-5 h-5 ${liked ? 'fill-red-500' : 'group-hover/social:fill-red-500/10'}`} solid={liked} />
                                <span className="tabular-nums">{likesCount}</span>
                            </button>
                            <button onClick={toggleComments} className={`flex items-center gap-1.5 text-xs font-bold transition-all transform active:scale-90 group/social ${showComments ? 'text-blue-500' : 'text-gray-500 hover:text-blue-500'}`}>
                                <CommentIcon className="w-5 h-5 group-hover/social:fill-blue-500/10" />
                                <span className="tabular-nums">{activity.replies || 0}</span>
                            </button>
                        </div>
                        <button className="p-1.5 rounded-full text-gray-400 hover:text-gray-600 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-[#2a2a2a] transition-all">
                            <ShareIcon className="w-5 h-5" />
                        </button>
                    </div>

                    {showComments && (
                        <div className="pt-4 mt-2 border-t border-gray-100 dark:border-gray-800 space-y-4 animate-fade-in">
                            {loadingComments ? (
                                <div className="flex justify-center py-4"><div className="animate-spin h-5 w-5 border-2 border-brand-primary rounded-full border-t-transparent"></div></div>
                            ) : (
                                <>
                                    {comments.map((comment, idx) => (
                                        <div key={comment.id || idx} className="flex gap-3 items-start">
                                            <Avatar src={comment.profiles?.avatar_url} size="sm" className="flex-shrink-0" />
                                            <div className="flex-1 bg-gray-50 dark:bg-[#1a1a1a] rounded-xl p-3">
                                                <div className="flex justify-between items-center mb-1">
                                                    <span className="text-xs font-bold text-gray-900 dark:text-white">{comment.profiles?.name}</span>
                                                    <span className="text-[10px] text-gray-400">{timeAgo(comment.created_at)}</span>
                                                </div>
                                                <p className="text-sm text-gray-700 dark:text-gray-300">{comment.text}</p>
                                            </div>
                                        </div>
                                    ))}
                                    <form onSubmit={handlePostComment} className="flex gap-3 items-center">
                                        <div className="flex-1 relative">
                                            <input 
                                                type="text"
                                                value={commentText}
                                                onChange={(e) => setCommentText(e.target.value)}
                                                placeholder="Write a comment..."
                                                className="w-full bg-gray-50 dark:bg-[#1a1a1a] border-none rounded-full px-4 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:ring-1 focus:ring-brand-primary"
                                            />
                                        </div>
                                        <button 
                                            type="submit"
                                            disabled={!commentText.trim() || isPosting}
                                            className="p-2 bg-brand-primary text-black rounded-full hover:bg-brand-primary/90 disabled:opacity-50 transition-all"
                                        >
                                            <PlusIcon className="w-4 h-4" />
                                        </button>
                                    </form>
                                </>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ActivityItem;
