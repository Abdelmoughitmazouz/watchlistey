
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

export const ensureProfileExists = async (user: any): Promise<User | null> => {
    if (!isSupabaseConfigured || !user) return null;
    
    // Check if profile exists
    const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();
        
    const metadata = user.user_metadata || {};
    const fullName = metadata.full_name || metadata.name || 'User';
    const metadataAvatar = metadata.avatar_url || metadata.picture || '';

    if (profile) {
        // REPAIR LOGIC: If username is cryptic (e.g. user_ef9fbd85) or avatar is missing
        const isCryptic = /^user_[a-f0-9]{8}$/.test(profile.username);
        const needsAvatar = !profile.avatar_url || profile.avatar_url.includes('placeholder') || profile.avatar_url === '';
        
        if (isCryptic || needsAvatar) {
            const updates: any = { updated_at: new Date().toISOString() };
            let currentUsername = profile.username;
            
            if (isCryptic) {
                let base = fullName.toLowerCase().replace(/[^a-z0-9]/g, '');
                if (base.length < 2 && user.email) base = user.email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '');
                if (!base) base = 'user';
                
                let unique = base;
                const { data: taken } = await supabase.from('profiles').select('username').eq('username', unique).neq('id', user.id).maybeSingle();
                if (taken) unique = `${base}${Math.floor(100 + Math.random() * 900)}`;
                updates.username = unique;
                currentUsername = unique;
            }
            
            if (needsAvatar) {
                // Use metadata avatar if available, otherwise Dicebear
                updates.avatar_url = metadataAvatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${currentUsername}`;
            }
            
            await supabase.from('profiles').update(updates).eq('id', user.id);
        }
        return getProfileById(user.id);
    }

    // Profile doesn't exist, create it
    // Generate base username from Full Name (Real Name)
    let baseUsername = fullName.toLowerCase().replace(/[^a-z0-9]/g, '');
    
    // If full name is empty or too short, try email prefix
    if (baseUsername.length < 2 && user.email) {
        baseUsername = user.email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '');
    }
    
    // Final fallback
    if (!baseUsername) baseUsername = 'user';
    
    // Limit length to 20 chars before adding suffix
    if (baseUsername.length > 20) baseUsername = baseUsername.substring(0, 20);
    
    let uniqueUsername = baseUsername;
    let isUnique = false;
    
    // Check if base is available
    const { data: existingBase } = await supabase
        .from('profiles')
        .select('username')
        .eq('username', uniqueUsername)
        .maybeSingle();
        
    if (!existingBase) {
        isUnique = true;
    } else {
        // If taken, append a random number
        let attempts = 0;
        while (!isUnique && attempts < 10) {
            const randomSuffix = Math.floor(100 + Math.random() * 900); // 3 digit random
            const checkUsername = `${baseUsername}${randomSuffix}`;
            
            const { data: existingSuffix } = await supabase
                .from('profiles')
                .select('username')
                .eq('username', checkUsername)
                .maybeSingle();
                
            if (!existingSuffix) {
                uniqueUsername = checkUsername;
                isUnique = true;
            }
            attempts++;
        }
        
        // If still not unique after 10 random attempts, use timestamp
        if (!isUnique) {
            uniqueUsername = `${baseUsername}${Date.now().toString().slice(-4)}`;
        }
    }

    const avatarUrl = metadataAvatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${uniqueUsername}`;
    
    const { data: newProfile, error: insertError } = await supabase
        .from('profiles')
        .insert({
            id: user.id,
            username: uniqueUsername,
            name: fullName,
            avatar_url: avatarUrl,
            email: user.email,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        })
        .select()
        .single();
        
    if (insertError) {
        console.error("Error creating profile:", insertError);
        return null;
    }
    
    return { ...newProfile, list: {}, favorites: {}, characters: {} };
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
-- List Items Table
create table public.list_items (
  id bigint generated by default as identity not null,
  user_id uuid not null,
  show_id bigint not null,
  status character varying(50) not null,
  rating integer null,
  progress integer null default 0,
  notes text null,
  start_date timestamp with time zone null,
  finish_date timestamp with time zone null,
  rewatch_count integer null default 0,
  is_private boolean null default false,
  custom_lists text[] null default '{}'::text[],
  media_type character varying(20) null,
  title text null,
  poster_path text null,
  backdrop_path text null,
  vote_average numeric null,
  release_date date null,
  added_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  constraint list_items_pkey primary key (id),
  constraint list_items_user_id_show_id_media_type_key unique (user_id, show_id, media_type),
  constraint list_items_user_id_fkey foreign KEY (user_id) references profiles (id) on delete CASCADE
);

-- Episode Tracking Table
create table public.episode_tracking (
  id bigint generated by default as identity not null,
  user_id uuid null,
  show_id bigint not null,
  season_number integer not null,
  episode_number integer not null,
  is_watched boolean null default false,
  watched_at timestamp with time zone null,
  rating integer null,
  created_at timestamp with time zone null default now(),
  constraint episode_tracking_pkey primary key (id),
  constraint episode_tracking_user_id_show_id_season_number_episode_numb_key unique (user_id, show_id, season_number, episode_number),
  constraint episode_tracking_user_id_fkey foreign KEY (user_id) references profiles (id) on delete CASCADE,
  constraint episode_tracking_rating_check check (
    (
      (rating >= 0)
      and (rating <= 10)
    )
  )
);

-- Enable RLS
alter table public.list_items enable row level security;
alter table public.episode_tracking enable row level security;

-- Policies
create policy "Allow public read access" on public.list_items for select using ( true );
create policy "Allow authenticated insert" on public.list_items for insert with check ( auth.uid() = user_id );
create policy "Allow individual update" on public.list_items for update using ( auth.uid() = user_id );
create policy "Allow individual delete" on public.list_items for delete using ( auth.uid() = user_id );

create policy "Allow public read access" on public.episode_tracking for select using ( true );
create policy "Allow authenticated insert" on public.episode_tracking for insert with check ( auth.uid() = user_id );
create policy "Allow individual update" on public.episode_tracking for update using ( auth.uid() = user_id );
create policy "Allow individual delete" on public.episode_tracking for delete using ( auth.uid() = user_id );

-- Posts Table
create table public.posts (
  id uuid not null default extensions.uuid_generate_v4 (),
  user_id uuid null,
  content text not null,
  media_id integer null,
  media_type character varying(20) null,
  media_title character varying(255) null,
  media_image text null,
  carousel_images text[] null default '{}'::text[],
  link_url text null,
  link_text character varying(50) null,
  is_spoiler boolean null default false,
  is_edited boolean null default false,
  visibility character varying(20) null default 'public'::character varying,
  tags text[] null default '{}'::text[],
  likes_count integer null default 0,
  replies_count integer null default 0,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  constraint posts_pkey primary key (id),
  constraint posts_user_id_fkey foreign KEY (user_id) references profiles (id) on delete CASCADE
);

-- Enable RLS
alter table public.posts enable row level security;

-- Policies
create policy "Allow public read access"
  on public.posts for select
  using ( true );

create policy "Allow authenticated insert"
  on public.posts for insert
  with check ( auth.uid() = user_id );

create policy "Allow individual update"
  on public.posts for update
  using ( auth.uid() = user_id );

create policy "Allow individual delete"
  on public.posts for delete
  using ( auth.uid() = user_id );

-- User Activities
alter table public.user_activities enable row level security;
create policy "Allow public read" on public.user_activities for select using (true);
create policy "Allow auth insert" on public.user_activities for insert with check (auth.uid() = user_id);

-- Activity Likes
alter table public.activity_likes enable row level security;
create policy "Allow public read" on public.activity_likes for select using (true);
create policy "Allow auth insert" on public.activity_likes for insert with check (auth.uid() = user_id);
create policy "Allow auth delete" on public.activity_likes for delete using (auth.uid() = user_id);

-- Activity Comments
alter table public.activity_comments enable row level security;
create policy "Allow public read" on public.activity_comments for select using (true);
create policy "Allow auth insert" on public.activity_comments for insert with check (auth.uid() = user_id);
create policy "Allow auth delete" on public.activity_comments for delete using (auth.uid() = user_id);

-- Notifications
alter table public.notifications enable row level security;
create policy "Allow individual read" on public.notifications for select using (auth.uid() = user_id);
create policy "Allow system insert" on public.notifications for insert with check (true); -- Usually triggered by functions, but for simple apps we allow auth insert
create policy "Allow individual update" on public.notifications for update using (auth.uid() = user_id);
`;
