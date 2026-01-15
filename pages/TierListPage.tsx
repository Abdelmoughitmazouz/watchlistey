import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { PlusIcon } from '../constants';
import { useSEO } from '../hooks/useSEO';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';
import { TierList } from '../types';
import TierListCard from '../components/TierListCard';

interface TierListsPageProps {
    onNavigate: (path: string) => void;
}

const TierListsPage: React.FC<TierListsPageProps> = ({ onNavigate }) => {
    const { t } = useTranslation();
    useSEO("Tier Lists", "Create and explore anime and manga tier lists.");
    const [lists, setLists] = useState<TierList[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchLists = async () => {
            if (!isSupabaseConfigured) {
                setLoading(false);
                return;
            }

            try {
                // Fetch using 'profiles!user_id' hint to force join against profiles table
                const { data, error } = await supabase
                    .from('tier_lists')
                    .select('*, profiles:user_id(*)')
                    .order('created_at', { ascending: false });

                if (!error && data) {
                    const mappedData = data.map((item: any) => ({
                         ...item,
                         user: Array.isArray(item.profiles) ? item.profiles[0] : item.profiles
                    }));
                    setLists(mappedData);
                } else {
                    console.error("Error fetching lists:", error);
                }
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };

        fetchLists();
    }, []);

    const toggleLike = async (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        e.preventDefault();
        // Optimistic update
        setLists(prev => prev.map(l => l.id === id ? { ...l, likes_count: (l.likes_count || 0) + 1 } : l));
        
        if (isSupabaseConfigured) {
             // In a real app, you would insert into a 'likes' table and increment count properly
             const list = lists.find(l => l.id === id);
             if (list) {
                 await supabase.from('tier_lists').update({ likes_count: (list.likes_count || 0) + 1 }).eq('id', id);
             }
        }
    }

    return (
        <div className="min-h-screen bg-white dark:bg-[#0f0f0f] pt-36 pb-12 transition-colors duration-200">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center mb-12">
                    <h1 className="text-4xl font-extrabold text-gray-900 dark:text-white tracking-tight">Tier Lists</h1>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {/* Create New Card */}
                    <button 
                        onClick={() => onNavigate('/lists/new')}
                        className="group relative flex h-full min-h-[320px] w-full flex-col overflow-hidden rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#121212] hover:border-brand-primary/50 dark:hover:border-brand-primary/50 transition-all duration-300 shadow-sm hover:shadow-lg hover:shadow-brand-primary/5"
                    >
                        <div className="relative w-full h-full flex-1 bg-gradient-to-b from-gray-50 to-white dark:from-[#1a1a1a] dark:to-[#121212] overflow-hidden">
                            
                            {/* Content */}
                            <div className="absolute inset-0 flex flex-col items-center justify-center z-20 pb-16 transition-transform duration-300 group-hover:-translate-y-2">
                                <div className="mb-4 rounded-full bg-white dark:bg-[#252525] p-4 shadow-sm border border-gray-100 dark:border-gray-700 group-hover:scale-110 group-hover:shadow-md group-hover:border-brand-primary/30 transition-all duration-300">
                                    <PlusIcon className="h-8 w-8 text-gray-900 dark:text-white group-hover:text-brand-primary transition-colors" />
                                </div>
                                <h2 className="text-xl font-bold text-gray-900 dark:text-white group-hover:text-brand-primary transition-colors">Create a tier list</h2>
                            </div>

                            {/* Cards Graphic */}
                            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full flex justify-center translate-y-[35%] z-10 opacity-60 grayscale-[0.5] group-hover:grayscale-0 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500 ease-out origin-bottom">
                                <div className="relative flex items-end justify-center">
                                    {/* S Card */}
                                    <div className="w-20 h-28 rounded-lg shadow-xl border border-white/20 flex items-center justify-center -mr-8 origin-bottom-right" 
                                        style={{ backgroundColor: 'rgb(172, 86, 80)', transform: 'translateY(12px) rotate(-30deg)', zIndex: 0 }}>
                                        <span className="font-black text-black/70 text-xl">S</span>
                                    </div>
                                    {/* A Card */}
                                    <div className="w-20 h-28 rounded-lg shadow-xl border border-white/20 flex items-center justify-center -mr-8 origin-bottom-right" 
                                        style={{ backgroundColor: 'rgb(196, 128, 70)', transform: 'translateY(-10px) rotate(-10deg)', zIndex: 1 }}>
                                        <span className="font-black text-black/70 text-xl">A</span>
                                    </div>
                                    {/* B Card */}
                                    <div className="w-20 h-28 rounded-lg shadow-xl border border-white/20 flex items-center justify-center -mr-8 origin-bottom-left" 
                                        style={{ backgroundColor: 'rgb(189, 179, 85)', transform: 'translateY(-10px) rotate(10deg)', zIndex: 2 }}>
                                        <span className="font-black text-black/70 text-xl">B</span>
                                    </div>
                                    {/* C Card */}
                                    <div className="w-20 h-28 rounded-lg shadow-xl border border-white/20 flex items-center justify-center origin-bottom-left" 
                                        style={{ backgroundColor: 'rgb(136, 173, 88)', transform: 'translateY(12px) rotate(30deg)', zIndex: 3 }}>
                                        <span className="font-black text-black/70 text-xl">C</span>
                                    </div>
                                </div>
                            </div>

                            {/* Gradient Fade for Bottom */}
                            <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-white dark:from-[#121212] via-white/50 dark:via-[#121212]/50 to-transparent pointer-events-none z-30"></div>
                        </div>
                    </button>
                    
                    {loading ? (
                         Array.from({ length: 3 }).map((_, i) => (
                             <div key={i} className="h-[320px] bg-gray-200 dark:bg-[#121212] rounded-xl animate-pulse"></div>
                         ))
                    ) : (
                        lists.map(list => (
                            <TierListCard 
                                key={list.id} 
                                tierList={list} 
                                onClick={() => onNavigate(`/lists/${list.slug || list.id}`)}
                                onToggleLike={toggleLike}
                                isLiked={false} 
                            />
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

export default TierListsPage;