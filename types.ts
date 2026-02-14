
export interface ListItem {
  id: number;
  show_id: number;
  user_id: string;
  status: ListStatus;
  rating?: number;
  progress?: number;
  notes?: string;
  added_at: string;
  media_type?: 'movie' | 'tv' | 'person' | 'season' | 'user';
  is_favorite?: boolean;
  
  // Denormalized Data for Instant Loading
  title?: string;
  poster_path?: string;
  backdrop_path?: string;
  vote_average?: number;
  release_date?: string;
}

export interface UserActivity {
  id: number;
  user_id: string;
  show_id?: number;
  media_type?: 'movie' | 'tv' | 'person';
  action: 'started_watching' | 'progress_updated' | 'completed' | 'dropped' | 'post' | 'rated';
  content?: string;
  metadata: {
    title?: string;
    image?: string;
    progress?: number;
    prev_progress?: number;
    rating?: number;
    episode_range?: string; // For aggregated items
  };
  likes: number;
  replies: number;
  created_at: string;
  user?: User; // Joined profile
}

export interface EpisodeActivity {
  id?: number;
  user_id: string;
  show_id: number;
  season_number: number;
  episode_number: number;
  is_watched: boolean;
  watched_at: string | null;
  rating: number | null;
}

export interface CastMember {
  id: number;
  name: string;
  character: string;
  profile_path: string | null;
}

export interface Character {
  id: number;
  name: string;
  image_url: string;
}

export interface Season {
  id: number;
  name: string;
  overview: string;
  poster_path: string | null;
  season_number: number;
  episode_count: number;
  air_date: string;
}

export interface Episode {
  id: number;
  name: string;
  overview: string;
  still_path: string | null;
  vote_average: number;
  air_date: string;
  episode_number: number;
  season_number: number;
  runtime?: number;
}

export interface ExternalIds {
  facebook_id?: string | null;
  instagram_id?: string | null;
  twitter_id?: string | null;
  imdb_id?: string | null;
}

export interface Network {
    id: number;
    name: string;
    logo_path?: string;
    origin_country?: string;
}

export interface Show {
  id: number;
  title: string;
  image_url: string;
  backdrop_url: string;
  description: string;
  maturity?: string;
  genres?: string[];
  rating: number;
  year: number;
  promo_video_url?: string;
  gallery_urls?: string[];
  participants?: User[]; // App users watching this
  media_type?: 'movie' | 'tv' | 'person' | 'season' | 'user';
  provider?: 'tmdb' | 'anilist'; // Source of the data
  is_anime?: boolean;
  is_manga?: boolean;
  is_staff?: boolean; // New flag for AniList Staff
  format?: string; // e.g. TV, OVA, MOVIE, SPECIAL
  
  // New fields for TMDB details
  cast?: CastMember[];
  creators?: string[]; // Directors for movies, Creators for TV
  creator_persons?: { id: number; name: string }[];
  
  // Anime Specific
  anime_characters?: Character[];
  relations?: Show[];

  // New fields for Seasons and Collections
  seasons?: Season[];
  episodes?: Episode[];
  collection?: Show[];
  collection_name?: string;
  collection_id?: number;
  // Extended Details
  external_ids?: ExternalIds;
  number_of_episodes?: number;
  number_of_seasons?: number;
  chapters?: number;
  volumes?: number;
  runtime?: number; // minutes
  original_language?: string;
  origin_country?: string[];
  production_companies?: Network[];
  networks?: Network[];
  status?: string;
  homepage?: string;
  budget?: number;
  revenue?: number;
  // Additional fields for Sidebar
  last_air_date?: string;
  next_episode_to_air?: Episode; // New field for countdown
  last_episode_to_air?: Episode; // New field for checking recently aired finale
  popularity?: number;
  vote_count?: number;
  original_name?: string;
  
  // Fields for Season type
  parent_show_id?: number;
  parent_show_title?: string;
  season_number?: number;
  // UI State
  is_favorite?: boolean;
  
  // For User Search
  username?: string;
}

export interface User {
  id: string; // maps to Supabase auth user id
  username: string;
  name: string; // Display Name (Public)
  first_name?: string; // Real First Name (Private-ish)
  last_name?: string; // Real Last Name (Private-ish)
  email: string;
  country?: string;
  avatar_url: string;
  cover_url: string;
  title: string;
  bio: string;
  created_at?: string;
  is_verified?: boolean;
  company?: string;
  x?: string;
  instagram?: string;
  youtube?: string;
  discord?: string;
  facebook?: string;
  linkedin?: string;
  list?: Record<number, ListItem>;
  characters?: Record<number, ListItem>;
  favorites?: Record<number, ListItem>;
  list_privacy?: 'public' | 'followers' | 'private';
}

export interface Comment {
  id: number;
  user: User; // Joined profile data
  user_id: string;
  text: string;
  created_at: string;
  likes: number;
  dislikes: number;
  replies?: Comment[];
  parent_id?: number | null;
}

export type ListStatus = 'Watching' | 'Completed' | 'Plan to Watch' | 'Paused' | 'Dropped' | 'Rewatching' | 'Favorite' | string;

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  isRead: boolean;
  image?: string;
  link?: string;
}

export interface Subscription {
  id: string;
  user_id: string;
  show_id: number;
  created_at: string;
}

// Tier List Builder UI Types
export interface TierBuilderItem {
  id: string;
  contentId: number;
  image: string;
  title: string;
  type: 'show' | 'character' | 'movie' | 'tv' | 'person' | 'company';
}

export interface TierRow {
  id: string;
  label: string;
  color: string;
  items: TierBuilderItem[];
}

// Tier List Interfaces (DB)
export interface TierList {
  id: string;
  user_id: string;
  title: string;
  slug?: string;
  description?: string;
  vibe?: string; // e.g., "Nostalgia", "Critical", "Just Vibes"
  created_at: string;
  likes_count: number;
  content: TierRow[]; // Replaces tiers: Tier[] to match JSONB structure
  thumbnail_images?: string[];
  user?: User; // Creator
  profiles?: any; // For legacy/raw access if needed
}

export interface TierItem {
  id: string;
  tier_id: string;
  tmdb_id: number;
  media_type: 'movie' | 'tv' | 'anime' | 'manga';
  rank_order: number;
  comment?: string; // "Opinion Layer"
  tags?: string[]; // e.g. ["Overrated", "Classic"]
  // Hydrated data
  show?: Show;
}
