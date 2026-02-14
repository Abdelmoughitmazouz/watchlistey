
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSEO } from '../hooks/useSEO';
import ActivityFeed from '../components/ActivityFeed';
import { User, Show } from '../types';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';
import { SearchIconV2, FilterIcon, PlusIcon } from '../constants';

interface FeedPageProps {
    onNavigate: (path: string) => void;
    currentUser?: User;
}

const FeedPage: React.FC<FeedPageProps> = ({ onNavigate, currentUser }) => {
    const { t } = useTranslation();
    const [feedType, setFeedType] = useState<'global' | 'following'>('global');
    const [postText, setPostText] = useState('');
    const [isPosting, setIsPosting] = useState(false);

    useSEO("Activity Feed", "See what everyone is watching on Watchlistey.");

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
            // Reload feed by key change or state lifting would happen here in a real app
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
                            <div className="bg-white dark:bg-[#121212] rounded-2xl border border-gray-200 dark:border-gray-800 p-6 overflow-hidden">
                                <div className="flex flex-col items-center text-center">
                                    <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-brand-primary shadow-lg mb-4">
                                        <img src={currentUser.avatar_url} alt={currentUser.name} className="w-full h-full object-cover" />
                                    </div>
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
                                            <p className="text-[10px] uppercase font-bold text-gray-400">Friends</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="bg-brand-primary/10 rounded-2xl border border-brand-primary/20 p-8 text-center">
                                <h3 className="font-bold text-gray-900 dark:text-white mb-2">Join the Community</h3>
                                <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">Track your progress and share updates with others.</p>
                                <button 
                                    onClick={() => onNavigate('/signup')}
                                    className="w-full py-2.5 bg-brand-primary text-black font-bold rounded-lg hover:bg-brand-primary/90 transition-all"
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
                                {feedType === 'global' && <div className="absolute bottom-0 inset-x-0 h-1 bg-brand-primary rounded-full" />}
                            </button>
                            <button 
                                onClick={() => setFeedType('following')}
                                className={`pb-3 text-sm font-bold transition-all relative ${feedType === 'following' ? 'text-gray-900 dark:text-white' : 'text-gray-500 hover:text-gray-700'}`}
                            >
                                Following
                                {feedType === 'following' && <div className="absolute bottom-0 inset-x-0 h-1 bg-brand-primary rounded-full" />}
                            </button>
                        </div>

                        {/* Status Update Input */}
                        {currentUser && (
                            <form onSubmit={handleCreatePost} className="bg-white dark:bg-[#121212] border border-gray-200 dark:border-gray-800 rounded-xl p-4">
                                <textarea 
                                    value={postText}
                                    onChange={(e) => setPostText(e.target.value)}
                                    placeholder="Share what's on your mind..."
                                    className="w-full bg-transparent border-none focus:ring-0 text-sm text-gray-900 dark:text-white placeholder-gray-500 resize-none min-h-[80px]"
                                />
                                <div className="flex justify-end pt-3 border-t border-gray-50 dark:border-gray-800">
                                    <button 
                                        type="submit"
                                        disabled={!postText.trim() || isPosting}
                                        className="px-6 py-2 bg-brand-primary text-black font-bold rounded-lg text-sm hover:bg-brand-primary/90 transition-all disabled:opacity-50"
                                    >
                                        {isPosting ? 'Posting...' : 'Post Update'}
                                    </button>
                                </div>
                            </form>
                        )}

                        <ActivityFeed onNavigate={onNavigate} />
                    </div>

                    {/* Right Sidebar (Trending/Suggestions) */}
                    <div className="hidden lg:block lg:col-span-3 space-y-6 sticky top-24">
                        <div className="bg-white dark:bg-[#121212] rounded-2xl border border-gray-200 dark:border-gray-800 p-6">
                            <h3 className="font-bold text-gray-900 dark:text-white mb-4 text-sm uppercase tracking-wider">Suggested for you</h3>
                            <div className="space-y-4">
                                {/* Placeholder Suggestions */}
                                {[1, 2, 3].map(i => (
                                    <div key={i} className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800" />
                                        <div className="flex-1 min-w-0">
                                            <div className="h-3 bg-gray-100 dark:bg-gray-800 rounded w-2/3 mb-1" />
                                            <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded w-1/2" />
                                        </div>
                                        <button className="text-brand-primary hover:bg-brand-primary/10 p-1.5 rounded-full">
                                            <PlusIcon className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default FeedPage;
