import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCw } from 'lucide-react';
import { UserActivity } from '../types';
import { getActivities } from '../lib/supabaseClient';
import { aggregateActivities } from '../lib/feedHelpers';
import ActivityItem from './ActivityItem';

interface ActivityFeedProps {
    onNavigate: (path: string) => void;
    userId?: string;
    initialActivities?: UserActivity[];
}

const ActivityFeed: React.FC<ActivityFeedProps> = ({ onNavigate, userId, initialActivities }) => {
    const [activities, setActivities] = useState<UserActivity[]>(initialActivities || []);
    const [loading, setLoading] = useState(!initialActivities);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);

    useEffect(() => {
        if (initialActivities) {
            setActivities(aggregateActivities(initialActivities));
            setLoading(false);
        }
    }, [initialActivities]);

    const loadActivities = useCallback(async (pageNum: number) => {
        if (pageNum === 1 && initialActivities) return;
        setLoading(true);
        try {
            const data = await getActivities(pageNum, userId);
            if (data.length < 20) setHasMore(false);
            
            setActivities(prev => {
                const combined = pageNum === 1 ? data : [...prev, ...data];
                return aggregateActivities(combined);
            });
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }, [userId, initialActivities]);

    useEffect(() => {
        loadActivities(1);
    }, [loadActivities]);

    if (loading && activities.length === 0) {
        return (
            <div className="space-y-6">
                {[1, 2, 3].map(i => (
                    <div key={i} className="bg-white dark:bg-[#111] rounded-3xl p-6 border border-gray-200/50 dark:border-white/5 animate-pulse">
                        <div className="flex gap-4">
                            <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-white/5"></div>
                            <div className="flex-1 space-y-3">
                                <div className="h-4 bg-gray-100 dark:bg-white/5 rounded w-1/4"></div>
                                <div className="h-3 bg-gray-100 dark:bg-white/5 rounded w-full"></div>
                                <div className="h-32 bg-gray-50 dark:bg-white/5 rounded-2xl mt-4"></div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <AnimatePresence mode="popLayout">
                {activities.length > 0 ? (
                    activities.map((activity, idx) => (
                        <motion.div
                            key={activity.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: Math.min(idx * 0.05, 0.5) }}
                        >
                            <ActivityItem 
                                activity={activity} 
                                onNavigate={onNavigate} 
                            />
                        </motion.div>
                    ))
                ) : (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-center py-24 bg-white dark:bg-[#111] rounded-3xl border border-gray-200/50 dark:border-white/5 border-dashed"
                    >
                        <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">No activities yet</p>
                    </motion.div>
                )}
            </AnimatePresence>

            {hasMore && activities.length > 0 && (
                <button 
                    onClick={() => { setPage(p => p + 1); loadActivities(page + 1); }}
                    className="w-full py-6 flex items-center justify-center gap-3 text-xs font-black uppercase tracking-[0.2em] text-gray-400 hover:text-brand-primary transition-all group"
                >
                    {loading ? (
                        <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                        <>
                            <span>Load More</span>
                            <RefreshCw className="w-4 h-4 transition-transform group-hover:rotate-180 duration-500" />
                        </>
                    )}
                </button>
            )}
        </div>
    );
};

export default ActivityFeed;
