
import { createClient } from '@supabase/supabase-js'
import { Show, User, ListItem, TierList } from '../types';

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
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idOrSlug);
    
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
 * Run this in your Supabase SQL Editor to enable local caching and optimized lists.
 */
export const SUPABASE_SCHEMA_SQL = `
-- 1. Profiles Table (UI Info Only)
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
-- Fix: Use DROP POLICY IF EXISTS to avoid errors on re-run
DROP POLICY IF EXISTS "Public profiles are viewable by everyone." ON profiles;
CREATE POLICY "Public profiles are viewable by everyone." ON profiles FOR SELECT USING ( true );

DROP POLICY IF EXISTS "Users can insert their own profile." ON profiles;
CREATE POLICY "Users can insert their own profile." ON profiles FOR INSERT WITH CHECK ( auth.uid() = id );

DROP POLICY IF EXISTS "Users can update own profile." ON profiles;
CREATE POLICY "Users can update own profile." ON profiles FOR UPDATE USING ( auth.uid() = id );

-- Trigger to create profile on signup (CRITICAL FOR COMMENTS)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, user_id, email, name, username, avatar_url)
  VALUES (
    new.id, 
    new.id, 
    new.email, 
    COALESCE(new.raw_user_meta_data->>'name', 'New User'), 
    COALESCE(new.raw_user_meta_data->>'username', 'user_' || substr(md5(random()::text), 1, 8)),
    'https://via.placeholder.com/150'
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 2. List Items Table (Watchlist - Watching, Completed, etc.)
CREATE TABLE IF NOT EXISTS list_items (
    id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
    show_id BIGINT NOT NULL,
    media_type TEXT NOT NULL, -- 'movie', 'tv'
    status TEXT NOT NULL, -- 'Watching', 'Completed', 'Plan to Watch', etc.
    
    -- Denormalized Data for Instant Loading
    title TEXT,
    poster_path TEXT,
    backdrop_path TEXT,
    vote_average NUMERIC,
    release_date TEXT,
    
    added_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(user_id, show_id, media_type)
);

-- 3. Favorites Table (Separate from Watchlist)
CREATE TABLE IF NOT EXISTS favorites (
    id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
    show_id BIGINT NOT NULL,
    media_type TEXT NOT NULL, -- 'movie', 'tv'
    
    -- Denormalized Data
    title TEXT,
    poster_path TEXT,
    backdrop_path TEXT,
    vote_average NUMERIC,
    release_date TEXT,
    
    added_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, show_id, media_type)
);

-- 4. Characters Table (Favorite People)
CREATE TABLE IF NOT EXISTS characters (
    id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
    person_id BIGINT NOT NULL,
    name TEXT,
    profile_path TEXT,
    
    added_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, person_id)
);

-- 5. Ratings Table
CREATE TABLE IF NOT EXISTS ratings (
    id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
    show_id BIGINT NOT NULL,
    media_type TEXT NOT NULL,
    rating NUMERIC NOT NULL, -- 0 to 10
    
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, show_id, media_type)
);

-- 6. Comments Table
CREATE TABLE IF NOT EXISTS comments (
    id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    show_id BIGINT NOT NULL,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL, -- Reference profiles for easier joining
    parent_id BIGINT REFERENCES comments(id) ON DELETE CASCADE,
    text TEXT NOT NULL,
    likes INTEGER DEFAULT 0,
    dislikes INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for Performance
CREATE INDEX IF NOT EXISTS idx_list_items_user_id ON list_items(user_id);
CREATE INDEX IF NOT EXISTS idx_list_items_status ON list_items(status);
CREATE INDEX IF NOT EXISTS idx_favorites_user_id ON favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_characters_user_id ON characters(user_id);
CREATE INDEX IF NOT EXISTS idx_ratings_user_id ON ratings(user_id);
CREATE INDEX IF NOT EXISTS idx_comments_show_id ON comments(show_id);
CREATE INDEX IF NOT EXISTS idx_comments_parent_id ON comments(parent_id);

-- Enable RLS
ALTER TABLE list_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public lists viewable" ON list_items;
CREATE POLICY "Public lists viewable" ON list_items FOR SELECT USING (true); 
DROP POLICY IF EXISTS "User manage list" ON list_items;
CREATE POLICY "User manage list" ON list_items FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

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

-- 7. Notifications Table (The INBOX for alerts)
CREATE TABLE IF NOT EXISTS notifications (
  id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT,
  url TEXT,
  image TEXT,
  seen BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Notifications RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own notifications" ON notifications;
CREATE POLICY "Users can view their own notifications" ON notifications FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own notifications" ON notifications;
CREATE POLICY "Users can insert their own notifications" ON notifications FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own notifications" ON notifications;
CREATE POLICY "Users can update their own notifications" ON notifications FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own notifications" ON notifications;
CREATE POLICY "Users can delete their own notifications" ON notifications FOR DELETE USING (auth.uid() = user_id);

-- 8. Subscriptions Table (Active Tracked Shows)
CREATE TABLE IF NOT EXISTS subscriptions (
  id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  show_id BIGINT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, show_id)
);

ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own subscriptions" ON subscriptions;
CREATE POLICY "Users can view their own subscriptions" ON subscriptions FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own subscriptions" ON subscriptions;
CREATE POLICY "Users can insert their own subscriptions" ON subscriptions FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own subscriptions" ON subscriptions;
CREATE POLICY "Users can delete their own subscriptions" ON subscriptions FOR DELETE USING (auth.uid() = user_id);

-- 9. Episode Tracking Table (Granular tracking)
CREATE TABLE IF NOT EXISTS episode_tracking (
  id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  show_id BIGINT NOT NULL,
  season_number INTEGER NOT NULL,
  episode_number INTEGER NOT NULL,
  is_watched BOOLEAN DEFAULT FALSE,
  watched_at TIMESTAMPTZ,
  rating INTEGER CHECK (rating >= 0 AND rating <= 10),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, show_id, season_number, episode_number)
);

ALTER TABLE episode_tracking ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own episode tracking" ON episode_tracking;
CREATE POLICY "Users can view their own episode tracking" ON episode_tracking FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own episode tracking" ON episode_tracking;
CREATE POLICY "Users can insert their own episode tracking" ON episode_tracking FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own episode tracking" ON episode_tracking;
CREATE POLICY "Users can update their own episode tracking" ON episode_tracking FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own episode tracking" ON episode_tracking;
CREATE POLICY "Users can delete their own episode tracking" ON episode_tracking FOR DELETE USING (auth.uid() = user_id);

-- 10. Tier Lists Table (Interactive Builder)
-- Supports Movies, TV, Characters, and Networks via JSONB content
CREATE TABLE IF NOT EXISTS tier_lists (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    slug TEXT UNIQUE,
    description TEXT,
    category TEXT, -- e.g. 'General', 'Anime', 'Movies'
    content JSONB NOT NULL, -- Stores rows, colors, and items (with type: movie|tv|person|company)
    thumbnail_images TEXT[] DEFAULT '{}',
    likes_count INTEGER DEFAULT 0,
    vibe TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS for Tier Lists
ALTER TABLE tier_lists ENABLE ROW LEVEL SECURITY;

-- Everyone can view lists
DROP POLICY IF EXISTS "Public tier lists viewable" ON tier_lists;
CREATE POLICY "Public tier lists viewable" ON tier_lists 
    FOR SELECT USING (true);

-- Authenticated users can create lists
DROP POLICY IF EXISTS "Users can insert own tier lists" ON tier_lists;
CREATE POLICY "Users can insert own tier lists" ON tier_lists 
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Owners can update their lists
DROP POLICY IF EXISTS "Users can update own tier lists" ON tier_lists;
CREATE POLICY "Users can update own tier lists" ON tier_lists 
    FOR UPDATE USING (auth.uid() = user_id);

-- Owners can delete their lists
DROP POLICY IF EXISTS "Users can delete own tier lists" ON tier_lists;
CREATE POLICY "Users can delete own tier lists" ON tier_lists 
    FOR DELETE USING (auth.uid() = user_id);
`;