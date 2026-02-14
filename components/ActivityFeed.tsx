
import React, { useState, useEffect, useCallback } from 'react';
import { UserActivity } from '../types';
import { getActivities } from '../lib/supabaseClient';
import { aggregateActivities } from '../lib/feedHelpers';
import ActivityItem from './ActivityItem';

interface ActivityFeedProps {
    onNavigate: (path: string) => void;
    userId?: string;
}

const ActivityFeed: React.FC<ActivityFeedProps> = ({ onNavigate, userId }) => {
    const [activities, setActivities] = useState<UserActivity[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);

    const loadActivities = useCallback(async (pageNum: number) => {
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
    }, [userId]);

    useEffect(() => {
        loadActivities(1);
    }, [loadActivities]);

    if (loading && activities.length === 0) {
        return (
            <div className="space-y-4">
                {[1, 2, 3].map(i => (
                    <div key={i} className="bg-white dark:bg-[#121212] rounded-xl p-4 border border-gray-200 dark:border-gray-800 animate-pulse">
                        <div className="flex gap-4">
                            <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-800"></div>
                            <div className="flex-1 space-y-2">
                                <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-1/4"></div>
                                <div className="h-3 bg-gray-200 dark:bg-gray-800 rounded w-full"></div>
                                <div className="h-20 bg-gray-100 dark:bg-gray-800/50 rounded-lg mt-4"></div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {activities.length > 0 ? (
                activities.map(activity => (
                    <ActivityItem 
                        key={activity.id} 
                        activity={activity} 
                        onNavigate={onNavigate} 
                    />
                ))
            ) : (
                <div className="text-center py-20 bg-white dark:bg-[#121212] rounded-xl border border-gray-200 dark:border-gray-800 border-dashed">
                    <p className="text-gray-500 dark:text-gray-400">No activities to show yet.</p>
                </div>
            )}

            {hasMore && activities.length > 0 && (
                <button 
                    onClick={() => { setPage(p => p + 1); loadActivities(page + 1); }}
                    className="w-full py-4 text-sm font-bold text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors"
                >
                    {loading ? 'Loading more...' : 'Load more activity'}
                </button>
            )}
        </div>
    );
};

export default ActivityFeed;
