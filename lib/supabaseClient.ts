
import { createClient } from '@supabase/supabase-js'
import { Show, User, ListItem, TierList, UserActivity } from '../types';

// Helper to get env vars in Vite or standard environments
const getEnvVar = (key: string) => {
  if (typeof import.meta !== 'undefined' && (import.meta as any).env && (import.meta as any).env[key]) {
    return (import.meta as any).env[key];
  }
  if (typeof process !== 'undefined' && process.env && process.env[key]) {
    return process.env[key];
  }
  return undefined;
};

const PROJECT_URL = 'https://bbbybiavrccxiwapjkjv.supabase.co';
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJiYnliaWF2cmNjeGl3YXBqa2p2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM2MTg4NzUsImV4cCI6MjA3OTE5NDg3NX0.qkBtCec6ojkHLH56xCHLgpwVhRCe2mrK4va_ZFxXXVg';

const supabaseUrl = (getEnvVar('VITE_SUPABASE_URL') || getEnvVar('NEXT_PUBLIC_SUPABASE_URL') || PROJECT_URL).trim();
const supabaseAnonKey = (getEnvVar('VITE_SUPABASE_ANON_KEY') || getEnvVar('NEXT_PUBLIC_SUPABASE_ANON_KEY') || ANON_KEY).trim();

export const isSupabaseConfigured = !!supabaseUrl && supabaseUrl.includes('supabase.co') && !!supabaseAnonKey;
export const supabase = createClient(supabaseUrl || 'https://placeholder.supabase.co', supabaseAnonKey || 'placeholder');

export const getActivities = async (page: number = 1, userId?: string): Promise<UserActivity[]> => {
    if (!isSupabaseConfigured) return [];
    const from = (page - 1) * 20;
    const to = from + 19;
    const { data: { user: currentUser } } = await supabase.auth.getUser();

    let query = supabase
        .from('user_activities')
        .select('*, profiles:user_id(*)')
        .order('created_at', { ascending: false })
        .range(from, to);

    if (userId) query = query.eq('user_id', userId);
    const { data, error } = await query;
    if (error) return [];

    const activities = data.map(item => ({
        ...item,
        user: Array.isArray(item.profiles) ? item.profiles[0] : item.profiles
    }));

    // If logged in, check which ones are liked
    if (currentUser) {
        const { data: likes } = await supabase
            .from('activity_likes')
            .select('activity_id')
            .eq('user_id', currentUser.id)
            .in('activity_id', activities.map(a => a.id));
        
        const likedIds = new Set(likes?.map(l => l.activity_id));
        return activities.map(a => ({ ...a, is_liked: likedIds.has(a.id) }));
    }

    return activities;
};

export const toggleActivityLike = async (activityId: number, isLiked: boolean, activityOwnerId: string) => {
    if (!isSupabaseConfigured) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    if (isLiked) {
        await supabase.from('activity_likes').delete().match({ user_id: user.id, activity_id: activityId });
        await supabase.rpc('decrement_activity_likes', { row_id: activityId });
    } else {
        await supabase.from('activity_likes').insert({ user_id: user.id, activity_id: activityId });
        await supabase.rpc('increment_activity_likes', { row_id: activityId });
        
        // Create Notification
        if (user.id !== activityOwnerId) {
            await supabase.from('notifications').insert({
                user_id: activityOwnerId,
                actor_id: user.id,
                type: 'like',
                activity_id: activityId,
                message: 'liked your activity'
            });
        }
    }
};

export const postActivityComment = async (activityId: number, text: string, activityOwnerId: string) => {
    if (!isSupabaseConfigured) return null;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase.from('activity_comments').insert({
        activity_id: activityId,
        user_id: user.id,
        text: text
    }).select('*, profiles:user_id(*)').single();

    if (!error) {
        await supabase.rpc('increment_activity_replies', { row_id: activityId });
        // Create Notification
        if (user.id !== activityOwnerId) {
            await supabase.from('notifications').insert({
                user_id: activityOwnerId,
                actor_id: user.id,
                type: 'comment',
                activity_id: activityId,
                message: 'commented on your activity'
            });
        }
    }
    return data;
};

export const getActivityComments = async (activityId: number) => {
    if (!isSupabaseConfigured) return [];
    const { data, error } = await supabase
        .from('activity_comments')
        .select('*, profiles:user_id(*)')
        .eq('activity_id', activityId)
        .order('created_at', { ascending: true });
    return data || [];
};

export const searchUsers = async (query: string, page: number = 1): Promise<{ results: Show[], total_results: number }> => {
    if (!isSupabaseConfigured) return { results: [], total_results: 0 };
    const from = (page - 1) * 20;
    const to = from + 19;
    let dbQuery = supabase.from('profiles').select('id, name, username, avatar_url, bio, is_verified', { count: 'exact' });
    if (query.trim()) dbQuery = dbQuery.or(`username.ilike.%${query}%,name.ilike.%${query}%`);
    const { data, count, error } = await dbQuery.range(from, to).order('is_verified', { ascending: false }).order('name', { ascending: true });
    if (error) return { results: [], total_results: 0 };
    const results: Show[] = data?.map(profile => ({ id: stringToNumber(profile.id), title: profile.name || profile.username, description: profile.bio || `@${profile.username}`, image_url: profile.avatar_url || 'https://via.placeholder.com/150', backdrop_url: '', media_type: 'user', username: profile.username, rating: 0, year: 0, genres: [], participants: [] })) || [];
    return { results, total_results: count || 0 };
};

export const getProfileById = async (userId: string): Promise<User | null> => {
    if (!isSupabaseConfigured) return null;
    const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).single();
    if (error || !data) return null;
    const { data: listData } = await supabase.from('list_items').select('*').eq('user_id', userId);
    const { data: favData } = await supabase.from('favorites').select('*').eq('user_id', userId);
    const { data: charData } = await supabase.from('characters').select('*').eq('user_id', userId);
    const list: Record<number, ListItem> = {};
    listData?.forEach((item: any) => list[item.show_id] = item);
    const favorites: Record<number, ListItem> = {};
    favData?.forEach((item: any) => favorites[item.show_id] = item);
    const characters: Record<number, ListItem> = {};
    charData?.forEach((item: any) => { characters[item.person_id] = { ...item, id: item.id, show_id: item.person_id, media_type: 'person', title: item.name, poster_path: item.profile_path, status: 'Favorite', added_at: item.added_at }; });
    return { ...data, list, favorites, characters };
};

export const getProfileByUsername = async (username: string): Promise<User | null> => {
    if (!isSupabaseConfigured) return null;
    const { data, error } = await supabase.from('profiles').select('*').eq('username', username).single();
    if (error || !data) return null;
    const { data: listData } = await supabase.from('list_items').select('*').eq('user_id', data.id);
    const { data: favData } = await supabase.from('favorites').select('*').eq('user_id', data.id);
    const { data: charData } = await supabase.from('characters').select('*').eq('user_id', data.id);
    const list: Record<number, ListItem> = {};
    listData?.forEach((item: any) => list[item.show_id] = item);
    const favorites: Record<number, ListItem> = {};
    favData?.forEach((item: any) => favorites[item.show_id] = item);
    const characters: Record<number, ListItem> = {};
    charData?.forEach((item: any) => { characters[item.person_id] = { ...item, id: item.id, show_id: item.person_id, media_type: 'person', title: item.name, poster_path: item.profile_path, status: 'Favorite', added_at: item.added_at }; });
    return { ...data, list, favorites, characters };
};

export const getTierListByIdOrSlug = async (idOrSlug: string): Promise<TierList | null> => {
    if (!isSupabaseConfigured) return null;
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idOrSlug);
    let query = supabase.from('tier_lists').select('*, profiles:user_id(*)');
    if (isUUID) query = query.eq('id', idOrSlug); else query = query.eq('slug', idOrSlug);
    const { data, error } = await query.single();
    if (error || !data) return null;
    return { ...data, user: Array.isArray(data.profiles) ? data.profiles[0] : data.profiles };
};

function stringToNumber(str: string): number {
    let hash = 0;
    if (str.length === 0) return hash;
    for (let i = 0; i < str.length; i++) { hash = ((hash << 5) - hash) + str.charCodeAt(i); hash = hash & hash; }
    return Math.abs(hash);
}

export const SUPABASE_SCHEMA_SQL = `
-- [Previous SQL Schema]
`;
