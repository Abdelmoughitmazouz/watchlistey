import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Search, 
    Filter, 
    Plus, 
    ArrowRight, 
    Star, 
    TrendingUp, 
    Users, 
    MessageSquare,
    Send,
    RefreshCw,
    LayoutGrid,
    UserPlus,
    Image as ImageIcon,
    FileVideo,
    ListTodo,
    Smile,
    CalendarClock,
    MapPin
} from 'lucide-react';
import { useSEO } from '../hooks/useSEO';
import ActivityFeed from '../components/ActivityFeed';
import { User } from '../types';
import { supabase, isSupabaseConfigured, getActivities, createPost, uploadFile } from '../lib/supabaseClient';
import { Avatar } from '../components/Avatar';
import RichTextEditor from '../components/RichTextEditor';
import { Toast, Toaster, ToastProps } from '../components/Toast';

interface FeedPageProps {
    onNavigate: (path: string) => void;
    currentUser?: User;
}

const FeedPage: React.FC<FeedPageProps> = ({ onNavigate, currentUser }) => {
    const { t } = useTranslation();
    const [feedType, setFeedType] = useState<'global' | 'following'>('global');
    const [postText, setPostText] = useState('');
    const [postImages, setPostImages] = useState<string[]>([]);
    const [isPosting, setIsPosting] = useState(false);
    const [isSpoiler, setIsSpoiler] = useState(false);
    const [suggestedUsers, setSuggestedUsers] = useState<Partial<User>[]>([]);
    const [loadingSuggestions, setLoadingSuggestions] = useState(true);
    const [feedItems, setFeedItems] = useState<any[]>([]);
    const [toasts, setToasts] = useState<Omit<ToastProps, 'onClose' | 'style' | 'visible'>[]>([]);

    const addToast = (title: string, message: string, type: 'success' | 'error' | 'info' = 'success') => {
        const id = Math.random().toString(36).substring(2, 9);
        setToasts(prev => [...prev, { id, title, message, type }]);
    };

    const removeToast = (id: string) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    };

    useSEO("Activity Feed", "See what everyone is watching on Watchlistey.");

    useEffect(() => {
        const fetchInitialData = async () => {
            setLoadingSuggestions(true);
            try {
                if (isSupabaseConfigured) {
                    const [suggestionsRes, activitiesRes] = await Promise.all([
                        supabase
                            .from('profiles')
                            .select('id, name, username, avatar_url, title')
                            .neq('id', currentUser?.id || '')
                            .limit(5),
                        getActivities()
                    ]);
                    
                    if (!suggestionsRes.error && suggestionsRes.data) {
                        setSuggestedUsers(suggestionsRes.data);
                    }
                    setFeedItems(activitiesRes);
                } else {
                    setSuggestedUsers([
                        { id: '1', name: 'Alex Rivera', username: 'arivera', avatar_url: 'https://i.pravatar.cc/150?u=1', title: 'Cinephile' },
                        { id: '2', name: 'Sarah Chen', username: 'schen', avatar_url: 'https://i.pravatar.cc/150?u=2', title: 'Anime Expert' },
                        { id: '3', name: 'Jordan Smyth', username: 'jsmyth', avatar_url: 'https://i.pravatar.cc/150?u=3', title: 'TV Critic' },
                    ]);
                }
            } catch (e) {
                console.error(e);
            } finally {
                setLoadingSuggestions(false);
            }
        };

        fetchInitialData();
    }, [currentUser?.id]);

    const handleCreatePost = async (e: React.FormEvent) => {
        e.preventDefault();
        const hasContent = postText.trim().length > 0 || postImages.length > 0;
        if (!hasContent || isPosting || !currentUser) return;

        setIsPosting(true);
        try {
            if (isSupabaseConfigured) {
                await createPost({
                    user_id: currentUser.id,
                    content: postText,
                    is_spoiler: isSpoiler,
                    carousel_images: postImages.length > 0 ? postImages : null
                });
                
                addToast("Success", "Your post has been published!", "success");
                setPostText('');
                setPostImages([]);
                setIsSpoiler(false);
                // Refresh feed
                const activities = await getActivities();
                setFeedItems(activities);
            }
        } catch (error: any) {
            console.error('Error creating post:', error);
            const message = error.message || "Failed to create post. Please check your connection.";
            addToast("Error", message, "error");
        } finally {
            setIsPosting(false);
        }
    };

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1
            }
        }
    };

    const itemVariants = {
        hidden: { y: 20, opacity: 0 },
        visible: {
            y: 0,
            opacity: 1,
            transition: {
                type: 'spring' as const,
                stiffness: 100
            }
        }
    };

    return (
        <div className="min-h-screen bg-[#f8f9fa] dark:bg-[#0a0a0a] pt-24 md:pt-28 pb-12 transition-colors duration-300">
            <div className="max-w-7xl mx-auto px-4 md:px-8">
                <motion.div 
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                    className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start"
                >
                    
                    {/* Left Sidebar */}
                    <motion.div variants={itemVariants} className="hidden lg:block lg:col-span-3 sticky top-24">
                        {currentUser ? (
                            <div className="bg-white dark:bg-[#111] rounded-3xl border border-gray-200/50 dark:border-white/5 p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-none overflow-hidden group">
                                <div className="flex flex-col items-center text-center">
                                    <button 
                                        onClick={() => onNavigate(`/u/${currentUser.username}`)}
                                        className="relative mb-4"
                                    >
                                        <div className="w-24 h-24 rounded-full overflow-hidden ring-4 ring-brand-primary/10 group-hover:ring-brand-primary/30 transition-all duration-500">
                                            <Avatar src={currentUser.avatar_url} alt={currentUser.name} size="lg" className="w-full h-full object-cover" />
                                        </div>
                                        <div className="absolute -bottom-1 -right-1 bg-brand-primary p-1.5 rounded-full shadow-lg border-2 border-white dark:border-[#111]">
                                            <Star className="w-3 h-3 text-black fill-black" />
                                        </div>
                                    </button>
                                    <h2 className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">{currentUser.name}</h2>
                                    <p className="text-sm text-gray-500 dark:text-gray-400 font-medium mb-6">@{currentUser.username}</p>
                                    
                                    <div className="grid grid-cols-3 gap-2 w-full border-t border-gray-100 dark:border-white/5 pt-6">
                                        <div className="flex flex-col items-center">
                                            <span className="text-lg font-bold text-gray-900 dark:text-white">{Object.keys(currentUser.list || {}).length}</span>
                                            <span className="text-[10px] uppercase tracking-widest font-bold text-gray-400">Shows</span>
                                        </div>
                                        <div className="flex flex-col items-center">
                                            <span className="text-lg font-bold text-gray-900 dark:text-white">{Object.keys(currentUser.favorites || {}).length}</span>
                                            <span className="text-[10px] uppercase tracking-widest font-bold text-gray-400">Favs</span>
                                        </div>
                                        <div className="flex flex-col items-center">
                                            <span className="text-lg font-bold text-gray-900 dark:text-white">0</span>
                                            <span className="text-[10px] uppercase tracking-widest font-bold text-gray-400">Fans</span>
                                        </div>
                                    </div>
                                    
                                    <button 
                                        onClick={() => onNavigate(`/u/${currentUser.username}`)}
                                        className="w-full mt-6 py-3 bg-gray-50 dark:bg-white/5 text-gray-900 dark:text-white text-xs font-bold rounded-2xl hover:bg-gray-100 dark:hover:bg-white/10 transition-all border border-gray-200/50 dark:border-white/5"
                                    >
                                        View Profile
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="bg-brand-primary rounded-3xl p-8 text-center shadow-xl shadow-brand-primary/20 relative overflow-hidden">
                                <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-32 h-32 bg-white/20 rounded-full blur-2xl" />
                                <h3 className="font-black text-black text-xl mb-2 relative z-10">Join the Club</h3>
                                <p className="text-sm text-black/70 mb-6 relative z-10 font-medium">Track your progress and share updates with the community.</p>
                                <button 
                                    onClick={() => onNavigate('/signup')}
                                    className="w-full py-3.5 bg-black text-white font-bold rounded-2xl hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg relative z-10"
                                >
                                    Get Started
                                </button>
                            </div>
                        )}

                        <div className="mt-8 space-y-2">
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-4 mb-2">Navigation</p>
                            <button onClick={() => onNavigate('/')} className="w-full flex items-center gap-3 px-4 py-3 text-sm font-bold text-gray-600 dark:text-gray-400 hover:text-brand-primary dark:hover:text-brand-primary hover:bg-white dark:hover:bg-white/5 rounded-2xl transition-all group">
                                <LayoutGrid className="w-4 h-4 transition-transform group-hover:scale-110" />
                                Discovery
                            </button>
                            <button onClick={() => onNavigate('/community')} className="w-full flex items-center gap-3 px-4 py-3 text-sm font-bold text-gray-600 dark:text-gray-400 hover:text-brand-primary dark:hover:text-brand-primary hover:bg-white dark:hover:bg-white/5 rounded-2xl transition-all group">
                                <Users className="w-4 h-4 transition-transform group-hover:scale-110" />
                                Community
                            </button>
                            <button onClick={() => onNavigate('/lists')} className="w-full flex items-center gap-3 px-4 py-3 text-sm font-bold text-gray-600 dark:text-gray-400 hover:text-brand-primary dark:hover:text-brand-primary hover:bg-white dark:hover:bg-white/5 rounded-2xl transition-all group">
                                <Star className="w-4 h-4 transition-transform group-hover:scale-110" />
                                Tier Lists
                            </button>
                        </div>
                    </motion.div>

                    {/* Main Feed */}
                    <div className="lg:col-span-6 space-y-8">
                        {/* Feed Toggles */}
                        <motion.div variants={itemVariants} className="flex items-center justify-between">
                            <div className="flex items-center gap-1 bg-white dark:bg-[#111] p-1.5 rounded-2xl border border-gray-200/50 dark:border-white/5 shadow-sm">
                                <button 
                                    onClick={() => setFeedType('global')}
                                    className={`px-6 py-2 text-xs font-bold rounded-xl transition-all ${feedType === 'global' ? 'bg-brand-primary text-black shadow-md shadow-brand-primary/20' : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'}`}
                                >
                                    Global
                                </button>
                                <button 
                                    onClick={() => setFeedType('following')}
                                    className={`px-6 py-2 text-xs font-bold rounded-xl transition-all ${feedType === 'following' ? 'bg-brand-primary text-black shadow-md shadow-brand-primary/20' : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'}`}
                                >
                                    Following
                                </button>
                            </div>
                            <button className="p-2.5 bg-white dark:bg-[#111] rounded-xl border border-gray-200/50 dark:border-white/5 text-gray-500 hover:text-brand-primary transition-all shadow-sm">
                                <Filter className="w-4 h-4" />
                            </button>
                        </motion.div>

                        {/* Post Input */}
                        {currentUser && (
                            <motion.div variants={itemVariants}>
                                <form onSubmit={handleCreatePost} className="bg-white dark:bg-[#111] rounded-3xl border border-gray-200/50 dark:border-white/5 p-4 sm:p-5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-none transition-all overflow-hidden">
                                    <div className="flex gap-4">
                                        <Avatar src={currentUser.avatar_url} size="md" className="flex-shrink-0" />
                                        <div className="flex-1 min-w-0">
                                            <RichTextEditor 
                                                content={postText}
                                                onChange={setPostText}
                                                images={postImages}
                                                onImagesChange={setPostImages}
                                                placeholder="What's happening?"
                                                isSpoiler={isSpoiler}
                                                setIsSpoiler={setIsSpoiler}
                                            >
                                                <div className="flex items-center gap-2 pr-2">
                                                    <button 
                                                        type="submit"
                                                        disabled={!(postText.trim().length > 0 || postImages.length > 0) || isPosting}
                                                        className="flex items-center gap-2 px-6 py-2 bg-brand-primary text-black font-bold rounded-full text-sm hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:scale-100 disabled:cursor-not-allowed shadow-lg shadow-brand-primary/20"
                                                    >
                                                        {isPosting ? <RefreshCw className="w-4 h-4 animate-spin" /> : null}
                                                        Post
                                                    </button>
                                                </div>
                                            </RichTextEditor>
                                        </div>
                                    </div>
                                </form>
                            </motion.div>
                        )}

                        <motion.div variants={itemVariants}>
                            <ActivityFeed onNavigate={onNavigate} initialActivities={feedItems} />
                        </motion.div>
                    </div>

                    {/* Right Sidebar */}
                    <motion.div variants={itemVariants} className="hidden lg:block lg:col-span-3 space-y-8 sticky top-24">
                        
                        {/* Suggested Users */}
                        <div className="bg-white dark:bg-[#111] rounded-3xl border border-gray-200/50 dark:border-white/5 p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-none">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="font-black text-gray-900 dark:text-white text-[10px] uppercase tracking-[0.2em]">Suggested</h3>
                                <button className="p-1.5 text-gray-400 hover:text-brand-primary transition-all">
                                    <RefreshCw className="w-3.5 h-3.5" />
                                </button>
                            </div>
                            
                            <div className="space-y-6">
                                <AnimatePresence mode="popLayout">
                                    {loadingSuggestions ? (
                                        <motion.div 
                                            key="loading"
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            exit={{ opacity: 0 }}
                                            className="space-y-6"
                                        >
                                            {[1, 2, 3].map(i => (
                                                <div key={i} className="flex items-center gap-3 animate-pulse">
                                                    <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-white/5" />
                                                    <div className="flex-1">
                                                        <div className="h-3 bg-gray-100 dark:bg-white/5 rounded w-2/3 mb-2" />
                                                        <div className="h-2 bg-gray-100 dark:bg-white/5 rounded w-1/2" />
                                                    </div>
                                                </div>
                                            ))}
                                        </motion.div>
                                    ) : (
                                        <motion.div 
                                            key="suggestions"
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            exit={{ opacity: 0 }}
                                            className="space-y-6"
                                        >
                                            {suggestedUsers.map((user, idx) => (
                                                <motion.div 
                                                    key={user.id} 
                                                    initial={{ opacity: 0, x: 20 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    transition={{ delay: idx * 0.1 }}
                                                    className="flex items-center justify-between group"
                                                >
                                                    <button 
                                                        onClick={() => onNavigate(`/u/${user.username}`)}
                                                        className="flex items-center gap-3 min-w-0"
                                                    >
                                                        <Avatar src={user.avatar_url} alt={user.name} size="sm" className="ring-2 ring-transparent group-hover:ring-brand-primary/30 transition-all" />
                                                        <div className="flex flex-col text-left min-w-0">
                                                            <span className="text-sm font-bold text-gray-900 dark:text-white truncate group-hover:text-brand-primary transition-colors">{user.name}</span>
                                                            <span className="text-[11px] text-gray-500 dark:text-gray-400 truncate font-medium">@{user.username}</span>
                                                        </div>
                                                    </button>
                                                    <button className="p-2 bg-gray-50 dark:bg-white/5 rounded-xl text-gray-400 hover:text-brand-primary hover:bg-brand-primary/10 transition-all">
                                                        <UserPlus className="w-4 h-4" />
                                                    </button>
                                                </motion.div>
                                            ))}
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                            
                            <button 
                                onClick={() => onNavigate('/search?type=user')}
                                className="w-full mt-8 py-3 text-[11px] font-black uppercase tracking-widest text-gray-400 hover:text-brand-primary transition-all border-t border-gray-100 dark:border-white/5"
                            >
                                Find more
                            </button>
                        </div>

                        {/* Trending */}
                        <div className="bg-white dark:bg-[#111] rounded-3xl border border-gray-200/50 dark:border-white/5 p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-none">
                            <div className="flex items-center gap-2 mb-6">
                                <TrendingUp className="w-4 h-4 text-brand-primary" />
                                <h3 className="font-black text-gray-900 dark:text-white text-[10px] uppercase tracking-[0.2em]">Trending</h3>
                            </div>
                            
                            <div className="space-y-4">
                                <div className="p-4 bg-gray-50 dark:bg-white/5 rounded-2xl border border-transparent hover:border-brand-primary/20 cursor-pointer transition-all group">
                                    <p className="text-xs font-bold text-brand-primary mb-1">#Thriller</p>
                                    <p className="text-sm font-bold text-gray-900 dark:text-white leading-snug group-hover:text-brand-primary transition-colors">Top 50 Mind-Bending Thrillers</p>
                                    <div className="flex items-center gap-3 mt-3">
                                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">2.4k Likes</span>
                                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">12 Comments</span>
                                    </div>
                                </div>
                                <div className="p-4 bg-gray-50 dark:bg-white/5 rounded-2xl border border-transparent hover:border-brand-primary/20 cursor-pointer transition-all group">
                                    <p className="text-xs font-bold text-emerald-500 mb-1">#Anime</p>
                                    <p className="text-sm font-bold text-gray-900 dark:text-white leading-snug group-hover:text-brand-primary transition-colors">Best Anime of 2025</p>
                                    <div className="flex items-center gap-3 mt-3">
                                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">1.8k Likes</span>
                                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">8 Comments</span>
                                    </div>
                                </div>
                            </div>
                            
                            <button 
                                onClick={() => onNavigate('/lists')}
                                className="w-full mt-4 flex items-center justify-center gap-2 text-[11px] font-black uppercase tracking-widest text-brand-primary hover:underline group"
                            >
                                Browse all
                                <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
                            </button>
                        </div>
                    </motion.div>

                </motion.div>
            </div>
            <Toaster toasts={toasts} removeToast={removeToast} />
        </div>
    );
};

export default FeedPage;
