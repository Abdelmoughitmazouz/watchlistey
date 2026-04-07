
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
  title?: string;
  poster_path?: string;
  backdrop_path?: string;
  vote_average?: number;
  release_date?: string;
}

export interface UserActivity {
  id: string | number;
  user_id: string;
  show_id?: number;
  media_type?: 'movie' | 'tv' | 'person';
  action: 'started_watching' | 'progress_updated' | 'completed' | 'dropped' | 'post' | 'rated' | 'added_to_list' | 'paused_watching' | 'rewatching';
  content?: string;
  metadata: {
    title?: string;
    image?: string;
    progress?: number;
    prev_progress?: number;
    rating?: number;
    episode_range?: string;
    mediaUrl?: string;
    mediaType?: 'image' | 'youtube' | 'link';
    isSpoiler?: boolean;
    carousel_images?: string[];
  };
  likes: number;
  replies: number;
  created_at: string;
  user?: User;
  is_liked?: boolean; // Track if the current user liked it
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
  participants?: User[];
  media_type?: 'movie' | 'tv' | 'person' | 'season' | 'user';
  provider?: 'tmdb' | 'anilist';
  is_anime?: boolean;
  is_manga?: boolean;
  is_staff?: boolean;
  format?: string;
  cast?: CastMember[];
  creators?: string[];
  creator_persons?: { id: number; name: string }[];
  anime_characters?: Character[];
  relations?: Show[];
  seasons?: Season[];
  episodes?: Episode[];
  collection?: Show[];
  collection_name?: string;
  collection_id?: number;
  external_ids?: ExternalIds;
  number_of_episodes?: number;
  number_of_seasons?: number;
  chapters?: number;
  volumes?: number;
  runtime?: number;
  original_language?: string;
  origin_country?: string[];
  production_companies?: Network[];
  networks?: Network[];
  status?: string;
  homepage?: string;
  budget?: number;
  revenue?: number;
  last_air_date?: string;
  next_episode_to_air?: Episode;
  last_episode_to_air?: Episode;
  popularity?: number;
  vote_count?: number;
  original_name?: string;
  parent_show_id?: number;
  parent_show_title?: string;
  season_number?: number;
  is_favorite?: boolean;
  username?: string;
}

export interface User {
  id: string;
  username: string;
  name: string;
  first_name?: string;
  last_name?: string;
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
  id: string | number;
  user: User;
  user_id: string;
  text: string;
  created_at: string;
  likes: number;
  dislikes: number;
  replies?: Comment[];
  parent_id?: string | number | null;
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

export interface TierList {
  id: string;
  user_id: string;
  title: string;
  slug?: string;
  description?: string;
  vibe?: string;
  created_at: string;
  likes_count: number;
  content: TierRow[];
  thumbnail_images?: string[];
  user?: User;
  profiles?: any;
}

export interface TierItem {
  id: string;
  tier_id: string;
  tmdb_id: number;
  media_type: 'movie' | 'tv' | 'anime' | 'manga';
  rank_order: number;
  comment?: string;
  tags?: string[];
  show?: Show;
}
