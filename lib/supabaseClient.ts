
import { createClient } from '@supabase/supabase-js'
import { Show, User, ListItem, TierList, UserActivity } from '../types';

// Helper to get env vars in Vite or standard environments
const getEnvVar = (key: string) => {
  // Check import.meta.env (Standard Vite)
  if (typeof import.meta !== 'undefined' && (import.meta as any).env && (import.meta as any).env[key]) {
    return (import.meta as any).env[key];
  }
  // Check process.env (Legacy/Compat)
  if (typeof process !== 'undefined' && process.env && process.env[key]) {
    return process.env[key];
  }
  return undefined;
};

// Default/Fallback credentials
const PROJECT_URL = 'https://bbbybiavrccxiwapjkjv.supabase.co';
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJiYnliaWF2cmNjeGl3YXBqa2p2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM2MTg4NzUsImV4cCI6MjA3OTE5NDg3NX0.qkBtCec6ojkHLH56xCHLgpwVhRCe2mrK4va_ZFxXXVg';

const supabaseUrl = (
  getEnvVar('VITE_SUPABASE_URL') || 
  getEnvVar('NEXT_PUBLIC_SUPABASE_URL') || 
  PROJECT_URL
).trim();

const supabaseAnonKey = (
  getEnvVar('VITE_SUPABASE_ANON_KEY') || 
  getEnvVar('NEXT_PUBLIC_SUPABASE_ANON_KEY') || 
  ANON_KEY
).trim();

export const isSupabaseConfigured = !!supabaseUrl && supabaseUrl.includes('supabase.co') && !!supabaseAnonKey;

export const supabase = createClient(supabaseUrl || 'https://placeholder.supabase.co', supabaseAnonKey || 'placeholder');

/**
 * Fetch activities for the feed
 */
export const getActivities = async (page: number = 1, userId?: string): Promise<UserActivity[]> => {
    if (!isSupabaseConfigured) return [];

    const from = (page - 1) * 20;
    const to = from + 19;

    let query = supabase
        .from('user_activities')
        .select('*, profiles:user_id(*)')
        .order('created_at', { ascending: false })
        .range(from, to);

    if (userId) {
        query = query.eq('user_id', userId);
    }

    const { data, error } = await query;

    if (error) {
        console.error("Error fetching activities:", error);
        return [];
    }

    return data.map(item => ({
        ...item,
        user: Array.isArray(item.profiles) ? item.profiles[0] : item.profiles
    }));
};

/**
 * Search for users in the profiles table.
 * Returns a list of Show objects for consistency with the UI.
 */
export const searchUsers = async (query: string, page: number = 1): Promise<{ results: Show[], total_results: number }> => {
    if (!isSupabaseConfigured) return { results: [], total_results: 0 };

    const from = (page - 1) * 20;
    const to = from + 19;

    let dbQuery = supabase
        .from('profiles')
        .select('id, name, username, avatar_url, bio, is_verified', { count: 'exact' });

    if (query.trim()) {
        dbQuery = dbQuery.or(`username.ilike.%${query}%,name.ilike.%${query}%`);
    }

    const { data, count, error } = await dbQuery
        .range(from, to)
        .order('is_verified', { ascending: false }) // Verified users first
        .order('name', { ascending: true });

    if (error) {
        console.error("Error searching users:", error);
        return { results: [], total_results: 0 };
    }

    const results: Show[] = data?.map(profile => ({
        id: stringToNumber(profile.id), // Hash UUID to number for UI key compatibility
        title: profile.name || profile.username,
        description: profile.bio || `@${profile.username}`,
        image_url: profile.avatar_url || 'https://via.placeholder.com/150',
        backdrop_url: '',
        media_type: 'user',
        username: profile.username,
        rating: 0,
        year: 0,
        genres: [],
        participants: []
    })) || [];

    return { results, total_results: count || 0 };
};

export const getProfileById = async (userId: string): Promise<User | null> => {
    if (!isSupabaseConfigured) return null;

    try {
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single();

        if (error || !data) return null;

        // Fetch user related data
        const { data: listData } = await supabase.from('list_items').select('*').eq('user_id', userId);
        const { data: favData } = await supabase.from('favorites').select('*').eq('user_id', userId);
        const { data: charData } = await supabase.from('characters').select('*').eq('user_id', userId);

        const list: Record<number, ListItem> = {};
        listData?.forEach((item: any) => list[item.show_id] = item);

        const favorites: Record<number, ListItem> = {};
        favData?.forEach((item: any) => favorites[item.show_id] = item);

        const characters: Record<number, ListItem> = {};
        // Robust Mapping for Characters to act like ListItems
        charData?.forEach((item: any) => {
            characters[item.person_id] = { 
                ...item, 
                id: item.id, // DB primary key
                show_id: item.person_id, // Polyfill for ListItem compatibility
                media_type: 'person',
                // Map person specific fields to ListItem standard
                title: item.name, 
                poster_path: item.profile_path,
                status: 'Favorite', // Treat characters as Favorites for status logic
                added_at: item.added_at
            };
        });

        return {
            ...data,
            list,
            favorites,
            characters
        };
    } catch (e) {
        console.error("Error fetching profile by ID:", e);
        return null;
    }
};

export const getProfileByUsername = async (username: string): Promise<User | null> => {
    if (!isSupabaseConfigured) return null;

    try {
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('username', username)
            .single();

        if (error || !data) return null;

        // Fetch user related data
        const { data: listData } = await supabase.from('list_items').select('*').eq('user_id', data.id);
        const { data: favData } = await supabase.from('favorites').select('*').eq('user_id', data.id);
        const { data: charData } = await supabase.from('characters').select('*').eq('user_id', data.id);

        const list: Record<number, ListItem> = {};
        listData?.forEach((item: any) => list[item.show_id] = item);

        const favorites: Record<number, ListItem> = {};
        favData?.forEach((item: any) => favorites[item.show_id] = item);

        const characters: Record<number, ListItem> = {};
        // Robust Mapping for Characters
        charData?.forEach((item: any) => {
            characters[item.person_id] = { 
                ...item, 
                id: item.id,
                show_id: item.person_id, // Polyfill
                media_type: 'person',
                title: item.name, 
                poster_path: item.profile_path,
                status: 'Favorite',
                added_at: item.added_at
            };
        });

        return {
            ...data,
            list,
            favorites,
            characters
        };
    } catch (e) {
        console.error("Error fetching profile:", e);
        return null;
    }
};

export const getTierListByIdOrSlug = async (idOrSlug: string): Promise<TierList | null> => {
    if (!isSupabaseConfigured) return null;

    // Check if input is a valid UUID
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idOrSlug);
    
    try {
        let query = supabase.from('tier_lists').select('*, profiles:user_id(*)');
        
        if (isUUID) {
            query = query.eq('id', idOrSlug);
        } else {
            query = query.eq('slug', idOrSlug);
        }
        
        const { data, error } = await query.single();
        
        if (error || !data) return null;
        
        return {
            ...data,
            user: Array.isArray(data.profiles) ? data.profiles[0] : data.profiles
        };
    } catch (e) {
        console.error("Error fetching tier list:", e);
        return null;
    }
};

// Helper to convert UUID string to a number (simple hash) for list keys where number is expected
function stringToNumber(str: string): number {
    let hash = 0;
    if (str.length === 0) return hash;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash);
}

/**
 * SQL SCHEMA FOR INDEPENDENT DATABASE
 * We removed the automated feed trigger to allow the frontend to manually post activities.
 */
export const SUPABASE_SCHEMA_SQL = `
-- 1. Profiles Table
CREATE TABLE IF NOT EXISTS profiles (
    id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
    user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
    username TEXT UNIQUE,
    name TEXT,
    first_name TEXT,
    last_name TEXT,
    avatar_url TEXT,
    cover_url TEXT,
    bio TEXT,
    title TEXT,
    country TEXT,
    x TEXT,
    instagram TEXT,
    youtube TEXT,
    facebook TEXT,
    linkedin TEXT,
    list_privacy TEXT DEFAULT 'public',
    is_verified BOOLEAN DEFAULT FALSE,
    theme TEXT DEFAULT 'light',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone." ON profiles;
CREATE POLICY "Public profiles are viewable by everyone." ON profiles FOR SELECT USING ( true );

DROP POLICY IF EXISTS "Users can insert their own profile." ON profiles;
CREATE POLICY "Users can insert their own profile." ON profiles FOR INSERT WITH CHECK ( auth.uid() = id );

DROP POLICY IF EXISTS "Users can update own profile." ON profiles;
CREATE POLICY "Users can update own profile." ON profiles FOR UPDATE USING ( auth.uid() = id );

-- 2. List Items Table
CREATE TABLE IF NOT EXISTS list_items (
    id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
    show_id BIGINT NOT NULL,
    media_type TEXT NOT NULL, 
    status TEXT NOT NULL, 
    progress INTEGER DEFAULT 0,
    score NUMERIC DEFAULT 0,
    title TEXT,
    poster_path TEXT,
    backdrop_path TEXT,
    vote_average NUMERIC,
    release_date TEXT,
    added_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, show_id, media_type)
);

-- 3. Activity Table (The Master Feed)
CREATE TABLE IF NOT EXISTS user_activities (
    id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    show_id BIGINT,
    media_type TEXT, 
    action TEXT NOT NULL, 
    content TEXT, 
    metadata JSONB DEFAULT '{}'::jsonb, 
    likes INTEGER DEFAULT 0,
    replies INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Favorites Table
CREATE TABLE IF NOT EXISTS favorites (
    id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
    show_id BIGINT NOT NULL,
    media_type TEXT NOT NULL,
    title TEXT,
    poster_path TEXT,
    backdrop_path TEXT,
    vote_average NUMERIC,
    release_date TEXT,
    added_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, show_id, media_type)
);

-- 5. Characters Table
CREATE TABLE IF NOT EXISTS characters (
    id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
    person_id BIGINT NOT NULL,
    name TEXT,
    profile_path TEXT,
    added_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, person_id)
);

-- 6. Ratings Table
CREATE TABLE IF NOT EXISTS ratings (
    id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
    show_id BIGINT NOT NULL,
    media_type TEXT NOT NULL,
    rating NUMERIC NOT NULL, 
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, show_id, media_type)
);

-- 7. Comments Table
CREATE TABLE IF NOT EXISTS comments (
    id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    show_id BIGINT NOT NULL,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    parent_id BIGINT REFERENCES comments(id) ON DELETE CASCADE,
    text TEXT NOT NULL,
    likes INTEGER DEFAULT 0,
    dislikes INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_list_items_user_id ON list_items(user_id);
CREATE INDEX IF NOT EXISTS idx_list_items_status ON list_items(status);
CREATE INDEX IF NOT EXISTS idx_favorites_user_id ON favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_characters_user_id ON characters(user_id);
CREATE INDEX IF NOT EXISTS idx_ratings_user_id ON ratings(user_id);
CREATE INDEX IF NOT EXISTS idx_comments_show_id ON comments(show_id);
CREATE INDEX IF NOT EXISTS idx_activities_user_id ON user_activities(user_id);

-- Enable RLS
ALTER TABLE list_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public lists viewable" ON list_items;
CREATE POLICY "Public lists viewable" ON list_items FOR SELECT USING (true); 
DROP POLICY IF EXISTS "User manage list" ON list_items;
CREATE POLICY "User manage list" ON list_items FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

ALTER TABLE user_activities ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public activities viewable" ON user_activities;
CREATE POLICY "Public activities viewable" ON user_activities FOR SELECT USING (true);
DROP POLICY IF EXISTS "User post activity" ON user_activities;
CREATE POLICY "User post activity" ON user_activities FOR INSERT WITH CHECK (auth.uid() = user_id);

ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public favorites viewable" ON favorites;
CREATE POLICY "Public favorites viewable" ON favorites FOR SELECT USING (true);
DROP POLICY IF EXISTS "User manage favorites" ON favorites;
CREATE POLICY "User manage favorites" ON favorites FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

ALTER TABLE characters ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public characters viewable" ON characters;
CREATE POLICY "Public characters viewable" ON characters FOR SELECT USING (true);
DROP POLICY IF EXISTS "User manage characters" ON characters;
CREATE POLICY "User manage characters" ON characters FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

ALTER TABLE ratings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public ratings viewable" ON ratings;
CREATE POLICY "Public ratings viewable" ON ratings FOR SELECT USING (true);
DROP POLICY IF EXISTS "User manage ratings" ON ratings;
CREATE POLICY "User manage ratings" ON ratings FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public comments viewable" ON comments;
CREATE POLICY "Public comments viewable" ON comments FOR SELECT USING (true);
DROP POLICY IF EXISTS "Authenticated users can comment" ON comments;
CREATE POLICY "Authenticated users can comment" ON comments FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can update own comments" ON comments;
CREATE POLICY "Users can update own comments" ON comments FOR UPDATE USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can delete own comments" ON comments;
CREATE POLICY "Users can delete own comments" ON comments FOR DELETE USING (auth.uid() = user_id);

-- 8. Tier Lists Table
CREATE TABLE IF NOT EXISTS tier_lists (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    slug TEXT UNIQUE,
    description TEXT,
    category TEXT, 
    content JSONB NOT NULL, 
    thumbnail_images TEXT[] DEFAULT '{}',
    likes_count INTEGER DEFAULT 0,
    vibe TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE tier_lists ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public tier lists viewable" ON tier_lists;
CREATE POLICY "Public tier lists viewable" ON tier_lists FOR SELECT USING (true);
DROP POLICY IF EXISTS "Users can insert own tier lists" ON tier_lists;
CREATE POLICY "Users can insert own tier lists" ON tier_lists FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can update own tier lists" ON tier_lists;
CREATE POLICY "Users can update own tier lists" ON tier_lists FOR UPDATE USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can delete own tier lists" ON tier_lists;
CREATE POLICY "Users can delete own tier lists" ON tier_lists FOR DELETE USING (auth.uid() = user_id);
`;
