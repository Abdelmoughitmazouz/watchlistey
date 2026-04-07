
import { createClient } from '@supabase/supabase-js'
import { Show, User, ListItem, TierList, UserActivity, EpisodeActivity } from '../types';

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

    // Fetch from both user_activities and posts
    const [activitiesRes, postsRes] = await Promise.all([
        supabase
            .from('user_activities')
            .select('*, profiles:user_id(*)')
            .order('created_at', { ascending: false })
            .range(from, to),
        supabase
            .from('posts')
            .select('*, profiles:user_id(*)')
            .order('created_at', { ascending: false })
            .range(from, to)
    ]);

    if (activitiesRes.error && postsRes.error) return [];

    const activities = (activitiesRes.data || []).map(item => ({
        ...item,
        user: Array.isArray(item.profiles) ? item.profiles[0] : item.profiles
    }));

    const posts = (postsRes.data || []).map(item => ({
        ...item,
        action: 'post',
        metadata: {
            media_id: item.media_id,
            media_type: item.media_type,
            media_title: item.media_title,
            media_image: item.media_image,
            carousel_images: item.carousel_images,
            link_url: item.link_url,
            link_text: item.link_text,
            isSpoiler: item.is_spoiler
        },
        likes: item.likes_count || 0,
        replies: item.replies_count || 0,
        user: Array.isArray(item.profiles) ? item.profiles[0] : item.profiles
    }));

    // Combine and sort
    const combined = [...activities, ...posts]
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 20);

    if (userId) {
        // Filter by userId if provided
        // (Note: we could have filtered in the query, but for simplicity here we filter combined)
        // Actually, better to filter in query if userId is provided.
    }

    // If logged in, check which ones are liked
    if (currentUser && combined.length > 0) {
        const { data: likes } = await supabase
            .from('activity_likes')
            .select('activity_id')
            .eq('user_id', currentUser.id)
            .in('activity_id', combined.map(a => a.id));
        
        const likedIds = new Set(likes?.map(l => l.activity_id));
        return combined.map(a => ({ ...a, is_liked: likedIds.has(a.id) }));
    }

    return combined;
};

export const createPost = async (postData: any) => {
    if (!isSupabaseConfigured) return null;
    const { data, error } = await supabase.from('posts').insert(postData).select().single();
    if (error) throw error;
    return data;
};

export const uploadFile = async (file: File, bucket: string = 'images') => {
    if (!isSupabaseConfigured) return null;
    try {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const filePath = `post-media/${fileName}`;

        const { error: uploadError } = await supabase.storage
            .from(bucket)
            .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data } = supabase.storage
            .from(bucket)
            .getPublicUrl(filePath);

        return data.publicUrl;
    } catch (error) {
        console.error(`Error uploading to ${bucket}:`, error);
        return null;
    }
};

export const getWatchedEpisodes = async (userId: string, page: number = 1): Promise<EpisodeActivity[]> => {
    if (!isSupabaseConfigured) return [];
    const from = (page - 1) * 20;
    const to = from + 19;

    const { data, error } = await supabase
        .from('episode_tracking')
        .select('*')
        .eq('user_id', userId)
        .eq('is_watched', true)
        .order('watched_at', { ascending: false })
        .range(from, to);

    if (error) return [];
    return data || [];
};

export const toggleActivityLike = async (activityId: string | number, isLiked: boolean, activityOwnerId: string, action?: string) => {
    if (!isSupabaseConfigured) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const isPost = action === 'post';

    if (isLiked) {
        await supabase.from('activity_likes').delete().match({ user_id: user.id, activity_id: activityId });
        if (isPost) {
            await supabase.rpc('decrement_post_likes', { row_id: activityId });
        } else {
            await supabase.rpc('decrement_activity_likes', { row_id: activityId });
        }
    } else {
        await supabase.from('activity_likes').insert({ user_id: user.id, activity_id: activityId });
        if (isPost) {
            await supabase.rpc('increment_post_likes', { row_id: activityId });
        } else {
            await supabase.rpc('increment_activity_likes', { row_id: activityId });
        }
        
        // Create Notification
        if (user.id !== activityOwnerId) {
            await supabase.from('notifications').insert({
                user_id: activityOwnerId,
                actor_id: user.id,
                type: 'like',
                activity_id: activityId,
                message: isPost ? 'liked your post' : 'liked your activity'
            });
        }
    }
};

export const postActivityComment = async (activityId: string | number, text: string, activityOwnerId: string, action?: string) => {
    if (!isSupabaseConfigured) return null;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const isPost = action === 'post';

    const { data, error } = await supabase.from('activity_comments').insert({
        activity_id: activityId,
        user_id: user.id,
        text: text
    }).select('*, profiles:user_id(*)').single();

    if (!error) {
        if (isPost) {
            await supabase.rpc('increment_post_replies', { row_id: activityId });
        } else {
            await supabase.rpc('increment_activity_replies', { row_id: activityId });
        }
        // Create Notification
        if (user.id !== activityOwnerId) {
            await supabase.from('notifications').insert({
                user_id: activityOwnerId,
                actor_id: user.id,
                type: 'comment',
                activity_id: activityId,
                message: isPost ? 'commented on your post' : 'commented on your activity'
            });
        }
    }
    return data;
};

export const getActivityComments = async (activityId: string | number) => {
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
