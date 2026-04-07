import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Heart, 
    MessageCircle, 
    Share2, 
    Eye, 
    CheckCircle2, 
    Clock, 
    PauseCircle, 
    XCircle, 
    RotateCcw, 
    Star, 
    Plus,
    MoreHorizontal,
    ExternalLink,
    Camera,
    RefreshCw
} from 'lucide-react';
import { toPng } from 'html-to-image';
import { UserActivity } from '../types';
import { Avatar } from './Avatar';
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
    const [isSpoilerRevealed, setIsSpoilerRevealed] = useState(false);
    const [comments, setComments] = useState<any[]>([]);
    const [commentText, setCommentText] = useState('');
    const [isPosting, setIsPosting] = useState(false);
    const [loadingComments, setLoadingComments] = useState(false);
    const [isCapturing, setIsCapturing] = useState(false);
    const screenshotRef = useRef<HTMLDivElement>(null);

    if (!user) return null;

    const getStatusConfig = () => {
        switch (action) {
            case 'added_to_list': return { label: 'Planning', color: 'text-gray-500', icon: Clock, bg: 'bg-gray-500' };
            case 'started_watching': return { label: 'Watching', color: 'text-emerald-500', icon: Eye, bg: 'bg-emerald-500' };
            case 'progress_updated': return { label: 'Progress', color: 'text-emerald-500', icon: Eye, bg: 'bg-emerald-500' };
            case 'completed': return { label: 'Completed', color: 'text-blue-500', icon: CheckCircle2, bg: 'bg-blue-600' };
            case 'dropped': return { label: 'Dropped', color: 'text-rose-500', icon: XCircle, bg: 'bg-rose-600' };
            case 'paused_watching': return { label: 'Paused', color: 'text-amber-500', icon: PauseCircle, bg: 'bg-amber-500' };
            case 'rewatching': return { label: 'Rewatching', color: 'text-indigo-500', icon: RotateCcw, bg: 'bg-indigo-600' };
            default: return { label: 'Post', color: 'text-blue-400', icon: MessageCircle, bg: 'bg-blue-400' };
        }
    };

    const config = getStatusConfig();
    const StatusIcon = config.icon;

    const handleLike = async () => {
        const newLiked = !liked;
        setLiked(newLiked);
        setLikesCount(prev => newLiked ? prev + 1 : prev - 1);
        await toggleActivityLike(activity.id, liked, user.id, action);
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
        const data = await postActivityComment(activity.id, commentText.trim(), user.id, action);
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

    const handleScreenshot = async () => {
        if (!screenshotRef.current) return;
        setIsCapturing(true);
        try {
            // Wait a bit for images to load if needed
            await new Promise(resolve => setTimeout(resolve, 100));
            
            const dataUrl = await toPng(screenshotRef.current, {
                quality: 1.0,
                pixelRatio: 2,
                width: 1080,
                height: screenshotRef.current.offsetHeight,
                style: {
                    transform: 'scale(1)',
                    transformOrigin: 'top left'
                }
            });
            
            const link = document.createElement('a');
            link.download = `watchlistey-${user.username}-${activity.id}.png`;
            link.href = dataUrl;
            link.click();
        } catch (err) {
            console.error('Failed to capture screenshot', err);
        } finally {
            setIsCapturing(false);
        }
    };

    const renderScreenshotActionText = () => {
        const title = metadata.title || 'Unknown Title';
        const titleSpan = <span className="font-extrabold text-white">{title}</span>;
        switch (action) {
            case 'added_to_list': return <>Added {titleSpan} to their watchlist</>;
            case 'started_watching': return <>Started watching {titleSpan}</>;
            case 'progress_updated':
                const range = metadata.episode_range || `episode ${metadata.progress}`;
                return <>Watched <span className="font-bold text-white">{range}</span> of {titleSpan}</>;
            case 'completed': return <>Completed {titleSpan}</>;
            case 'dropped': return <>Dropped {titleSpan}</>;
            case 'paused_watching': return <>Paused {titleSpan}</>;
            case 'rewatching': return <>Started rewatching {titleSpan}</>;
            default: return null;
        }
    };

    const renderActionText = () => {
        const title = metadata.title || 'Unknown Title';
        const titleSpan = <button onClick={handleMediaClick} className="font-extrabold text-gray-900 dark:text-white hover:text-brand-primary transition-colors text-start decoration-brand-primary/30 underline-offset-4 hover:underline">{title}</button>;
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
        <motion.div 
            layout
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-[#111] border border-gray-200/50 dark:border-white/5 rounded-3xl overflow-hidden shadow-[0_4px_20px_rgb(0,0,0,0.02)] dark:shadow-none hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-all group/item"
        >
            <div className="p-5 sm:p-6">
                <div className="flex gap-4 items-start mb-5">
                    <button onClick={() => onNavigate(`/u/${user.username}`)} className="flex-shrink-0 relative">
                        <Avatar src={user.avatar_url} alt={user.name} size="md" className="ring-2 ring-transparent group-hover/item:ring-brand-primary/30 transition-all" />
                        <div className={`absolute -bottom-1 -right-1 p-1 rounded-full ${config.bg} text-white ring-2 ring-white dark:ring-[#111] shadow-sm`}>
                            <StatusIcon className="w-2.5 h-2.5" />
                        </div>
                    </button>

                    <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 min-w-0">
                                <button onClick={() => onNavigate(`/u/${user.username}`)} className="font-bold text-sm text-gray-900 dark:text-white hover:text-brand-primary transition-colors truncate">{user.name}</button>
                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest whitespace-nowrap">{timeAgo(created_at)}</span>
                            </div>
                            <button className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-white transition-all">
                                <MoreHorizontal className="w-4 h-4" />
                            </button>
                        </div>
                        <div className="text-[13px] text-gray-500 dark:text-gray-400 leading-relaxed mt-0.5">{renderActionText()}</div>
                    </div>
                </div>

                <div className="space-y-5">
                    {action === 'post' && content && (
                        <div className="relative">
                            <div 
                                className={`prose prose-sm sm:prose-base dark:prose-invert max-w-none ${metadata.isSpoiler && !isSpoilerRevealed ? 'blur-md select-none' : ''}`}
                                dangerouslySetInnerHTML={{ __html: content }}
                            />
                            {metadata.isSpoiler && !isSpoilerRevealed && (
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <button 
                                        onClick={() => setIsSpoilerRevealed(true)}
                                        className="px-4 py-2 bg-black/80 text-white text-xs font-bold uppercase tracking-widest rounded-full hover:bg-black transition-colors backdrop-blur-sm"
                                    >
                                        Reveal Spoiler
                                    </button>
                                </div>
                            )}
                        </div>
                    )}

                    {action === 'post' && (metadata.mediaUrl || metadata.carousel_images) && (
                        <div className="mt-3 rounded-2xl overflow-hidden border border-gray-200/50 dark:border-white/5 bg-gray-50 dark:bg-white/5 relative">
                            <div className={metadata.isSpoiler && !isSpoilerRevealed ? 'blur-xl select-none' : ''}>
                                {metadata.carousel_images && Array.isArray(metadata.carousel_images) ? (
                                    <div className="flex gap-2 overflow-x-auto scrollbar-hide snap-x snap-mandatory">
                                        {metadata.carousel_images.map((url: string, index: number) => (
                                            <div key={index} className="flex-shrink-0 w-full snap-center relative">
                                                <img 
                                                    src={url} 
                                                    alt={`Post attachment ${index + 1}`} 
                                                    className="w-full max-h-[500px] object-contain"
                                                    referrerPolicy="no-referrer"
                                                />
                                                {metadata.carousel_images.length > 1 && (
                                                    <div className="absolute bottom-4 right-4 px-2.5 py-1 bg-black/50 text-white text-[10px] font-bold rounded-full backdrop-blur-sm">
                                                        {index + 1} / {metadata.carousel_images.length}
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                ) : metadata.mediaType === 'image' ? (
                                    <img 
                                        src={metadata.mediaUrl} 
                                        alt="Post attachment" 
                                        className="w-full max-h-[500px] object-contain"
                                        referrerPolicy="no-referrer"
                                    />
                                ) : metadata.mediaType === 'youtube' ? (
                                    <div className="aspect-video w-full">
                                        <iframe
                                            src={metadata.mediaUrl.includes('youtube.com/watch?v=') ? metadata.mediaUrl.replace('watch?v=', 'embed/').split('&')[0] : metadata.mediaUrl.includes('youtu.be/') ? metadata.mediaUrl.replace('youtu.be/', 'youtube.com/embed/').split('?')[0] : metadata.mediaUrl}
                                            title="YouTube video player"
                                            className="w-full h-full"
                                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                            allowFullScreen
                                        ></iframe>
                                    </div>
                                ) : metadata.mediaType === 'link' ? (
                                    <a 
                                        href={metadata.mediaUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-3 p-4 hover:bg-gray-100 dark:hover:bg-white/10 transition-all group"
                                    >
                                        <div className="w-12 h-12 rounded-xl bg-brand-primary/10 text-brand-primary flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                                            <ExternalLink className="w-5 h-5" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{metadata.mediaUrl}</p>
                                            <p className="text-xs text-gray-500 truncate">Click to open link</p>
                                        </div>
                                    </a>
                                ) : null}
                            </div>
                            {metadata.isSpoiler && !isSpoilerRevealed && (
                                <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                                    <button 
                                        onClick={() => setIsSpoilerRevealed(true)}
                                        className="px-4 py-2 bg-black/80 text-white text-xs font-bold uppercase tracking-widest rounded-full hover:bg-black transition-colors backdrop-blur-sm"
                                    >
                                        Reveal Media
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                    
                    {metadata.title && (
                        <motion.div 
                            whileHover={{ scale: 1.01 }}
                            whileTap={{ scale: 0.99 }}
                            onClick={handleMediaClick} 
                            className="flex gap-4 p-4 bg-gray-50 dark:bg-white/5 rounded-2xl border border-gray-100 dark:border-white/5 cursor-pointer hover:bg-gray-100 dark:hover:bg-white/10 transition-all group/media relative overflow-hidden"
                        >
                            <div className="w-16 sm:w-20 h-24 sm:h-28 bg-gray-200 dark:bg-gray-800 rounded-xl overflow-hidden flex-shrink-0 shadow-sm">
                                {metadata.image ? (
                                    <img 
                                        src={`https://image.tmdb.org/t/p/w200${metadata.image}`} 
                                        alt={metadata.title} 
                                        className="w-full h-full object-cover group-hover/media:scale-110 transition-transform duration-700" 
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-[10px] text-gray-400 font-bold uppercase">No Image</div>
                                )}
                            </div>
                            <div className="flex-1 min-w-0 py-1 flex flex-col justify-between">
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <h4 className="text-base font-black text-gray-900 dark:text-white truncate group-hover/media:text-brand-primary transition-colors tracking-tight">{metadata.title}</h4>
                                        <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-brand-primary/10 text-brand-primary uppercase tracking-widest">{activity.media_type === 'tv' ? 'Series' : 'Movie'}</span>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        {metadata.rating && metadata.rating > 0 && (
                                            <div className="flex items-center gap-1 text-xs font-bold text-brand-primary">
                                                <Star className="w-3 h-3 fill-brand-primary" />
                                                <span>{metadata.rating.toFixed(1)}</span>
                                            </div>
                                        )}
                                        <div className={`flex items-center gap-1 text-xs font-bold ${config.color}`}>
                                            <StatusIcon className="w-3 h-3" />
                                            <span>{config.label}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-1 text-[10px] font-black text-gray-400 uppercase tracking-widest group-hover/media:text-brand-primary transition-colors">
                                    <span>View Details</span>
                                    <ExternalLink className="w-2.5 h-2.5" />
                                </div>
                            </div>
                        </motion.div>
                    )}

                    <div className="flex items-center justify-between pt-2">
                        <div className="flex items-center gap-6">
                            <button 
                                onClick={handleLike} 
                                className={`flex items-center gap-2 text-xs font-bold transition-all group/social ${liked ? 'text-rose-500' : 'text-gray-400 hover:text-rose-500'}`}
                            >
                                <div className={`p-2 rounded-xl transition-all ${liked ? 'bg-rose-500/10' : 'group-hover/social:bg-rose-500/10'}`}>
                                    <Heart className={`w-4 h-4 ${liked ? 'fill-rose-500' : ''}`} />
                                </div>
                                <span className="tabular-nums">{likesCount}</span>
                            </button>
                            <button 
                                onClick={toggleComments} 
                                className={`flex items-center gap-2 text-xs font-bold transition-all group/social ${showComments ? 'text-blue-500' : 'text-gray-400 hover:text-blue-500'}`}
                            >
                                <div className={`p-2 rounded-xl transition-all ${showComments ? 'bg-blue-500/10' : 'group-hover/social:bg-blue-500/10'}`}>
                                    <MessageCircle className="w-4 h-4" />
                                </div>
                                <span className="tabular-nums">{activity.replies || 0}</span>
                            </button>
                        </div>
                        <div className="flex items-center gap-2">
                            <button 
                                onClick={handleScreenshot}
                                disabled={isCapturing}
                                className="p-2 rounded-xl text-gray-400 hover:text-brand-primary hover:bg-brand-primary/10 transition-all"
                                title="Export for Instagram"
                            >
                                {isCapturing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
                            </button>
                            <button className="p-2 rounded-xl text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/5 transition-all">
                                <Share2 className="w-4 h-4" />
                            </button>
                        </div>
                    </div>

                    <AnimatePresence>
                        {showComments && (
                            <motion.div 
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="overflow-hidden"
                            >
                                <div className="pt-6 mt-2 border-t border-gray-100 dark:border-white/5 space-y-5">
                                    {loadingComments ? (
                                        <div className="flex justify-center py-6">
                                            <RefreshCw className="w-5 h-5 text-brand-primary animate-spin" />
                                        </div>
                                    ) : (
                                        <>
                                            <div className="space-y-5">
                                                {comments.map((comment, idx) => (
                                                    <div key={comment.id || idx} className="flex gap-3 items-start group/comment">
                                                        <Avatar src={comment.profiles?.avatar_url} size="sm" className="flex-shrink-0" />
                                                        <div className="flex-1">
                                                            <div className="flex items-center gap-2 mb-1">
                                                                <span className="text-xs font-bold text-gray-900 dark:text-white">{comment.profiles?.name}</span>
                                                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">{timeAgo(comment.created_at)}</span>
                                                            </div>
                                                            <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{comment.text}</p>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                            <form onSubmit={handlePostComment} className="flex gap-3 items-center pt-2">
                                                <div className="flex-1 relative">
                                                    <input 
                                                        type="text"
                                                        value={commentText}
                                                        onChange={(e) => setCommentText(e.target.value)}
                                                        placeholder="Write a comment..."
                                                        className="w-full bg-gray-50 dark:bg-white/5 border-none rounded-2xl px-5 py-2.5 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-brand-primary/20 transition-all"
                                                    />
                                                </div>
                                                <button 
                                                    type="submit"
                                                    disabled={!commentText.trim() || isPosting}
                                                    className="p-2.5 bg-brand-primary text-black rounded-xl hover:scale-105 active:scale-95 disabled:opacity-50 transition-all shadow-lg shadow-brand-primary/20"
                                                >
                                                    <Plus className="w-4 h-4" />
                                                </button>
                                            </form>
                                        </>
                                    )}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            {/* Hidden Screenshot Container */}
            <div className="fixed -left-[9999px] top-0 pointer-events-none">
                <div 
                    ref={screenshotRef} 
                    className="w-[1080px] min-h-[1080px] bg-gradient-to-br from-[#1a1a1a] to-[#0a0a0a] flex flex-col items-center p-16"
                >
                    <div className="flex-1 w-full flex flex-col justify-center">
                        <div className="w-full bg-[#111] border border-white/10 rounded-[40px] p-12 shadow-2xl mb-16">
                        {/* Header */}
                        <div className="flex gap-6 items-start mb-8">
                            <div className="w-20 h-20 rounded-full overflow-hidden ring-4 ring-brand-primary/30 flex-shrink-0">
                                <img crossOrigin="anonymous" src={user.avatar_url || "https://i.pravatar.cc/150"} alt={user.name} className="w-full h-full object-cover" />
                            </div>
                            <div className="flex-1 min-w-0 pt-2">
                                <div className="flex items-center gap-3 mb-1">
                                    <span className="font-bold text-3xl text-white truncate">{user.name}</span>
                                    <span className="text-xl font-bold text-gray-400 uppercase tracking-widest">{timeAgo(created_at)}</span>
                                </div>
                                <div className="text-2xl text-gray-400 leading-relaxed">{renderScreenshotActionText()}</div>
                            </div>
                        </div>

                        {/* Content */}
                        <div className="space-y-8">
                            {action === 'post' && content && (
                                <p className="text-3xl text-gray-200 whitespace-pre-wrap leading-relaxed font-medium">
                                    {content}
                                </p>
                            )}
                            
                            {metadata.title && (
                                <div className="flex gap-8 p-6 bg-white/5 rounded-3xl border border-white/5">
                                    <div className="w-32 h-48 bg-gray-800 rounded-2xl overflow-hidden flex-shrink-0 shadow-lg">
                                        {metadata.image ? (
                                            <img crossOrigin="anonymous" src={`https://image.tmdb.org/t/p/w500${metadata.image}`} alt={metadata.title} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-sm text-gray-400 font-bold uppercase">No Image</div>
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0 py-2 flex flex-col justify-center">
                                        <div className="flex items-center gap-3 mb-3">
                                            <h4 className="text-3xl font-black text-white truncate tracking-tight">{metadata.title}</h4>
                                            <span className="text-sm font-black px-3 py-1 rounded-full bg-brand-primary/10 text-brand-primary uppercase tracking-widest">{activity.media_type === 'tv' ? 'Series' : 'Movie'}</span>
                                        </div>
                                        <div className="flex items-center gap-6">
                                            {metadata.rating && metadata.rating > 0 && (
                                                <div className="flex items-center gap-2 text-xl font-bold text-brand-primary">
                                                    <Star className="w-6 h-6 fill-brand-primary" />
                                                    <span>{metadata.rating.toFixed(1)}</span>
                                                </div>
                                            )}
                                            <div className={`flex items-center gap-2 text-xl font-bold ${config.color}`}>
                                                <StatusIcon className="w-6 h-6" />
                                                <span>{config.label}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Interactions */}
                        <div className="flex items-center justify-between pt-8 mt-8 border-t border-white/10">
                            <div className="flex items-center gap-8">
                                <div className={`flex items-center gap-3 text-2xl font-bold ${liked ? 'text-rose-500' : 'text-gray-400'}`}>
                                    <div className={`p-3 rounded-2xl ${liked ? 'bg-rose-500/10' : 'bg-white/5'}`}>
                                        <Heart className={`w-8 h-8 ${liked ? 'fill-rose-500' : ''}`} />
                                    </div>
                                    <span className="tabular-nums">{likesCount}</span>
                                </div>
                                <div className="flex items-center gap-3 text-2xl font-bold text-gray-400">
                                    <div className="p-3 rounded-2xl bg-white/5">
                                        <MessageCircle className="w-8 h-8" />
                                    </div>
                                    <span className="tabular-nums">{activity.replies || 0}</span>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="p-3 rounded-2xl text-gray-400 bg-white/5">
                                    <Share2 className="w-8 h-8" />
                                </div>
                            </div>
                        </div>
                    </div>
                    </div>

                    {/* Logo at bottom */}
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 flex-shrink-0">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 240" className="w-full h-full">
                              <rect width="240" height="240" rx="34" fill="#0d0d0d" />
                              <g transform="translate(3, -1)">
                                <circle cx="51" cy="92" r="20" fill="#fbc500" />
                                <path
                                  d="M 185.87 83.57 A 71.13 71.13 0 0 1 54.49 128.53"
                                  fill="none"
                                  stroke="#ffffff"
                                  strokeWidth="22"
                                  strokeLinecap="round"
                                />
                              </g>
                            </svg>
                        </div>
                        <span className="text-white font-bold text-4xl tracking-widest uppercase">Watchlistey</span>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

export default ActivityItem;
