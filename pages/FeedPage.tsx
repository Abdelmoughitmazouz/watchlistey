
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useSEO } from '../hooks/useSEO';
import ActivityFeed from '../components/ActivityFeed';
import { User, Show } from '../types';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';
import { SearchIconV2, FilterIcon, PlusIcon, ArrowRightIcon, StarIcon } from '../constants';
import { Avatar } from '../components/Avatar';

interface FeedPageProps {
    onNavigate: (path: string) => void;
    currentUser?: User;
}

const FeedPage: React.FC<FeedPageProps> = ({ onNavigate, currentUser }) => {
    const { t } = useTranslation();
    const [feedType, setFeedType] = useState<'global' | 'following'>('global');
    const [postText, setPostText] = useState('');
    const [isPosting, setIsPosting] = useState(false);
    const [suggestedUsers, setSuggestedUsers] = useState<Partial<User>[]>([]);
    const [loadingSuggestions, setLoadingSuggestions] = useState(true);

    useSEO("Activity Feed", "See what everyone is watching on Watchlistey.");

    useEffect(() => {
        const fetchSuggestions = async () => {
            setLoadingSuggestions(true);
            try {
                if (isSupabaseConfigured) {
                    const { data, error } = await supabase
                        .from('profiles')
                        .select('id, name, username, avatar_url, title')
                        .neq('id', currentUser?.id || '')
                        .limit(5);
                    
                    if (!error && data) {
                        setSuggestedUsers(data);
                    }
                } else {
                    // Mock data for demo mode
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

        fetchSuggestions();
    }, [currentUser?.id]);

    const handleCreatePost = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!postText.trim() || !currentUser) return;

        setIsPosting(true);
        try {
            if (isSupabaseConfigured) {
                const { error } = await supabase.from('user_activities').insert({
                    user_id: currentUser.id,
                    action: 'post',
                    content: postText.trim(),
                    metadata: {}
                });
                if (error) throw error;
            }
            setPostText('');
            window.location.reload(); 
        } catch (e) {
            console.error(e);
            alert("Failed to post.");
        } finally {
            setIsPosting(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-[#0f0f0f] pt-24 md:pt-28 pb-12 transition-colors duration-200">
            <div className="max-w-7xl mx-auto px-4 md:px-8">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                    
                    {/* Left Sidebar (User Stats/Navigation) */}
                    <div className="hidden lg:block lg:col-span-3 sticky top-24">
                        {currentUser ? (
                            <div className="bg-white dark:bg-[#121212] rounded-2xl border border-gray-200 dark:border-gray-800 p-6 overflow-hidden shadow-sm">
                                <div className="flex flex-col items-center text-center">
                                    <button 
                                        onClick={() => onNavigate(`/u/${currentUser.username}`)}
                                        className="relative group mb-4"
                                    >
                                        <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-brand-primary shadow-lg transition-transform group-hover:scale-105">
                                            <Avatar src={currentUser.avatar_url} alt={currentUser.name} size="lg" className="w-full h-full" />
                                        </div>
                                    </button>
                                    <h2 className="text-lg font-bold text-gray-900 dark:text-white truncate w-full">{currentUser.name}</h2>
                                    <p className="text-sm text-gray-500 mb-6">@{currentUser.username}</p>
                                    
                                    <div className="grid grid-cols-3 gap-4 w-full border-t border-gray-100 dark:border-gray-800 pt-6">
                                        <div className="text-center">
                                            <p className="text-lg font-bold text-gray-900 dark:text-white">{Object.keys(currentUser.list || {}).length}</p>
                                            <p className="text-[10px] uppercase font-bold text-gray-400">Shows</p>
                                        </div>
                                        <div className="text-center">
                                            <p className="text-lg font-bold text-gray-900 dark:text-white">{Object.keys(currentUser.favorites || {}).length}</p>
                                            <p className="text-[10px] uppercase font-bold text-gray-400">Favs</p>
                                        </div>
                                        <div className="text-center">
                                            <p className="text-lg font-bold text-gray-900 dark:text-white">0</p>
                                            <p className="text-[10px] uppercase font-bold text-gray-400">Following</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="bg-brand-primary/10 rounded-2xl border border-brand-primary/20 p-8 text-center shadow-sm">
                                <h3 className="font-bold text-gray-900 dark:text-white mb-2">Join the Community</h3>
                                <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">Track your progress and share updates with others.</p>
                                <button 
                                    onClick={() => onNavigate('/signup')}
                                    className="w-full py-2.5 bg-brand-primary text-black font-bold rounded-lg hover:bg-brand-primary/90 transition-all shadow-md shadow-brand-primary/10"
                                >
                                    Sign Up Free
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Main Feed */}
                    <div className="lg:col-span-6 space-y-6">
                        {/* Feed Toggles */}
                        <div className="flex items-center gap-6 border-b border-gray-200 dark:border-gray-800 pb-1">
                            <button 
                                onClick={() => setFeedType('global')}
                                className={`pb-3 text-sm font-bold transition-all relative ${feedType === 'global' ? 'text-gray-900 dark:text-white' : 'text-gray-500 hover:text-gray-700'}`}
                            >
                                Global
                                {feedType === 'global' && <div className="absolute bottom-0 inset-x-0 h-1 bg-brand-primary rounded-full animate-grow-x" />}
                            </button>
                            <button 
                                onClick={() => setFeedType('following')}
                                className={`pb-3 text-sm font-bold transition-all relative ${feedType === 'following' ? 'text-gray-900 dark:text-white' : 'text-gray-500 hover:text-gray-700'}`}
                            >
                                Following
                                {feedType === 'following' && <div className="absolute bottom-0 inset-x-0 h-1 bg-brand-primary rounded-full animate-grow-x" />}
                            </button>
                        </div>

                        {/* Status Update Input */}
                        {currentUser && (
                            <form onSubmit={handleCreatePost} className="bg-white dark:bg-[#121212] border border-gray-200 dark:border-gray-800 rounded-2xl p-5 shadow-sm">
                                <textarea 
                                    value={postText}
                                    onChange={(e) => setPostText(e.target.value)}
                                    placeholder="Share what's on your mind..."
                                    className="w-full bg-transparent border-none focus:ring-0 text-[15px] text-gray-900 dark:text-white placeholder-gray-500 resize-none min-h-[80px]"
                                />
                                <div className="flex justify-end pt-4 border-t border-gray-50 dark:border-gray-800">
                                    <button 
                                        type="submit"
                                        disabled={!postText.trim() || isPosting}
                                        className="px-6 py-2 bg-brand-primary text-black font-bold rounded-lg text-sm hover:bg-brand-primary/90 transition-all disabled:opacity-50 shadow-sm"
                                    >
                                        {isPosting ? 'Posting...' : 'Post Update'}
                                    </button>
                                </div>
                            </form>
                        )}

                        <ActivityFeed onNavigate={onNavigate} />
                    </div>

                    {/* Right Sidebar (Suggestions & Trending) */}
                    <div className="hidden lg:block lg:col-span-3 space-y-6 sticky top-24">
                        
                        {/* Suggested Users Section */}
                        <div className="bg-white dark:bg-[#121212] rounded-2xl border border-gray-200 dark:border-gray-800 p-6 shadow-sm">
                            <div className="flex items-center justify-between mb-5">
                                <h3 className="font-extrabold text-gray-900 dark:text-white text-xs uppercase tracking-widest">Suggested for you</h3>
                                <button className="text-[11px] font-bold text-brand-primary hover:underline">Refresh</button>
                            </div>
                            
                            <div className="space-y-5">
                                {loadingSuggestions ? (
                                    [1, 2, 3].map(i => (
                                        <div key={i} className="flex items-center gap-3 animate-pulse">
                                            <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800" />
                                            <div className="flex-1 min-w-0">
                                                <div className="h-3 bg-gray-100 dark:bg-gray-800 rounded w-2/3 mb-1" />
                                                <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded w-1/2" />
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    suggestedUsers.map(user => (
                                        <div key={user.id} className="flex items-center justify-between group">
                                            <button 
                                                onClick={() => onNavigate(`/u/${user.username}`)}
                                                className="flex items-center gap-3 min-w-0"
                                            >
                                                <Avatar src={user.avatar_url} alt={user.name} size="sm" className="ring-1 ring-gray-100 dark:ring-gray-800 group-hover:ring-brand-primary/30 transition-all" />
                                                <div className="flex flex-col text-left min-w-0">
                                                    <span className="text-sm font-bold text-gray-900 dark:text-white truncate group-hover:text-brand-primary transition-colors">{user.name}</span>
                                                    <span className="text-[11px] text-gray-500 truncate">@{user.username}</span>
                                                </div>
                                            </button>
                                            <button 
                                                className="p-2 rounded-lg text-gray-400 hover:text-brand-primary hover:bg-brand-primary/5 transition-all"
                                                title="Follow user"
                                            >
                                                <PlusIcon className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ))
                                )}
                            </div>
                            
                            <button 
                                onClick={() => onNavigate('/search?type=user')}
                                className="w-full mt-6 py-2.5 text-xs font-bold text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-[#1a1a1a] rounded-xl hover:bg-gray-100 dark:hover:bg-[#222] transition-all border border-transparent hover:border-gray-200 dark:hover:border-gray-700"
                            >
                                Find more users
                            </button>
                        </div>

                        {/* Extra Section: Trending Lists */}
                        <div className="bg-white dark:bg-[#121212] rounded-2xl border border-gray-200 dark:border-gray-800 p-6 shadow-sm">
                            <h3 className="font-extrabold text-gray-900 dark:text-white text-xs uppercase tracking-widest mb-5">Trending Content</h3>
                            <div className="space-y-4">
                                <div className="p-3 bg-gray-50 dark:bg-[#1a1a1a] rounded-xl border border-gray-100 dark:border-gray-800 cursor-pointer hover:border-brand-primary/30 transition-all group">
                                    <div className="flex items-center gap-1 text-[10px] font-bold text-brand-primary uppercase tracking-tighter mb-1">
                                        <StarIcon className="w-3 h-3" />
                                        <span>Popular List</span>
                                    </div>
                                    <p className="text-sm font-bold text-gray-900 dark:text-white leading-snug group-hover:text-brand-primary transition-colors">Top 50 Mind-Bending Thrillers</p>
                                    <p className="text-[11px] text-gray-500 mt-1">2.4k Likes • 12 comments</p>
                                </div>
                                <div className="p-3 bg-gray-50 dark:bg-[#1a1a1a] rounded-xl border border-gray-100 dark:border-gray-800 cursor-pointer hover:border-brand-primary/30 transition-all group">
                                    <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-500 uppercase tracking-tighter mb-1">
                                        <span>Featured</span>
                                    </div>
                                    <p className="text-sm font-bold text-gray-900 dark:text-white leading-snug group-hover:text-brand-primary transition-colors">Best Anime of 2025</p>
                                    <p className="text-[11px] text-gray-500 mt-1">1.8k Likes • 8 comments</p>
                                </div>
                            </div>
                            <button 
                                onClick={() => onNavigate('/lists')}
                                className="w-full mt-4 flex items-center justify-center gap-2 text-xs font-bold text-brand-primary hover:underline group"
                            >
                                Browse all lists
                                <ArrowRightIcon className="w-3 h-3 transition-transform group-hover:translate-x-1" />
                            </button>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default FeedPage;
