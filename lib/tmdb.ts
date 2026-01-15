
import { Show, CastMember, Season } from '../types';
import { supabase, isSupabaseConfigured } from './supabaseClient';
import { isContentSafe } from './contentSafety';
import { Logger } from './logger';

// 1. API Configuration
const API_KEY = 'b33b3ba9f90d1b1f9092bb361c8a5e1e';
const BASE_URL = 'https://api.themoviedb.org/3';
const IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/w500';
const BACKDROP_BASE_URL = 'https://image.tmdb.org/t/p/w1280';

const memoryCache = new Map<string, any>();

export const slugify = (text: string): string => {
    if (!text) return '';
    return text
        .toString()
        .toLowerCase()
        .trim()
        .replace(/\s+/g, '-')
        .replace(/&/g, '-and-')
        // Allow Unicode letters (\p{L}) and numbers (\p{N}) to support Arabic, Japanese, etc.
        .replace(/[^\p{L}\p{N}\-]+/gu, '') 
        .replace(/\-\-+/g, '-');
};

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const GENRES: Record<number, string> = {
  28: "Action", 12: "Adventure", 16: "Animation", 35: "Comedy", 80: "Crime",
  99: "Documentary", 18: "Drama", 10751: "Family", 14: "Fantasy", 36: "History",
  27: "Horror", 10402: "Music", 9648: "Mystery", 10749: "Romance", 878: "Sci-Fi",
  10770: "TV Movie", 53: "Thriller", 10752: "War", 37: "Western",
  10759: "Action & Adventure", 10762: "Kids", 10763: "News", 10764: "Reality",
  10765: "Sci-Fi & Fantasy", 10766: "Soap", 10767: "Talk", 10768: "War & Politics"
};

export const getGenreId = (name: string): number | undefined => {
    if (!name) return undefined;
    let id = Object.keys(GENRES).find(key => GENRES[parseInt(key)].toLowerCase() === name.toLowerCase()) as unknown as number;
    if (!id) {
        id = Object.keys(GENRES).find(key => slugify(GENRES[parseInt(key)]) === slugify(name)) as unknown as number;
    }
    return id;
}

export const getGenreName = (id: number): string => GENRES[id] || 'Unknown';

const fetchTMDB = async (endpoint: string, params: Record<string, string> = {}, retries = 3) => {
    if (!API_KEY) {
        Logger.warn('TMDB API Key is missing');
        return null;
    }
    
    // Default language to en-US if not provided
    const language = params.language || 'en-US';
    
    // IMAGE & VIDEO LANGUAGE STRATEGY
    // If requesting a specific language (e.g., 'es-ES'), we want images/videos in that language.
    // If not available, fallback to 'en' (English), then 'null'.
    const langCode = language.split('-')[0]; // Extract 'es' from 'es-ES'
    const includeImageLanguage = `${language},${langCode},en,null`;
    const includeVideoLanguage = `${language},${langCode},en,null`;

    const finalParams = { 
        api_key: API_KEY, 
        include_adult: 'false', 
        language: language,
        include_image_language: includeImageLanguage,
        include_video_language: includeVideoLanguage,
        ...params 
    };

    const queryParams = new URLSearchParams(finalParams);
    
    // Cache key must include the language!
    const cacheKeyParams = new URLSearchParams(finalParams); 
    cacheKeyParams.sort(); 
    const cacheKey = `${endpoint}?${cacheKeyParams.toString()}`;

    if (memoryCache.has(cacheKey)) {
        return memoryCache.get(cacheKey);
    }

    let currentAttempt = 0;
    
    while (currentAttempt < retries) {
        try {
            const url = `${BASE_URL}${endpoint}?${queryParams.toString()}`;
            const response = await fetch(url, {
                headers: { 'Accept': 'application/json' }
            });
            
            if (!response.ok) {
                if (response.status === 429) {
                    const retryAfter = response.headers.get('Retry-After');
                    const waitTime = retryAfter ? parseInt(retryAfter, 10) * 1000 : 1000 * Math.pow(2, currentAttempt);
                    await delay(waitTime);
                    currentAttempt++;
                    continue;
                }
                if (response.status === 404) return null;
                if (response.status >= 500) throw new Error(`Server Error ${response.status}`);
                return null;
            }
            
            const data = await response.json();
            memoryCache.set(cacheKey, data);
            
            return data;

        } catch (error: any) {
            currentAttempt++;
            const isNetworkError = error.message === 'Failed to fetch' || error.name === 'TypeError';
            if (currentAttempt >= retries) return null;
            const waitTime = (isNetworkError ? 2000 : 1000) * Math.pow(2, currentAttempt - 1);
            await delay(waitTime);
        }
    }
    return null;
};

export const mapTMDBToShow = (item: any): Show => {
    if (!isContentSafe(item)) {
        return { id: -1, title: 'Restricted', image_url: '', backdrop_url: '', media_type: 'tv', rating: 0, year: 0, description: '', genres: [] };
    }

    if (item.media_type === 'person') {
        return {
            id: item.id,
            title: item.name, 
            description: `Known for ${item.known_for_department}`,
            image_url: item.profile_path ? `${IMAGE_BASE_URL}${item.profile_path}` : 'https://via.placeholder.com/400x600?text=No+Image',
            backdrop_url: '', 
            rating: item.popularity || 0,
            year: 0,
            media_type: 'person',
            genres: [],
            participants: [],
            gallery_urls: [],
            cast: [],
            creators: [],
            provider: 'tmdb'
        };
    }

    if (item.media_type === 'season') {
        const seasonCast = item.credits?.cast?.map((c: any) => ({
             id: c.id,
             name: c.name,
             character: c.character,
             profile_path: c.profile_path ? `${IMAGE_BASE_URL}${c.profile_path}` : null
        })) || [];
        let galleryUrls = item.images?.posters?.map((img: any) => `${IMAGE_BASE_URL}${img.file_path}`).slice(0, 10);
        return {
            id: item.id,
            title: item.name || 'Season',
            description: item.overview || '',
            image_url: item.poster_path ? `${IMAGE_BASE_URL}${item.poster_path}` : 'https://via.placeholder.com/400x600?text=No+Poster',
            backdrop_url: '',
            rating: item.vote_average || 0,
            year: item.air_date ? new Date(item.air_date).getFullYear() : 0,
            media_type: 'season',
            genres: [],
            participants: [],
            episodes: item.episodes?.map((e: any) => ({
                id: e.id,
                name: e.name,
                overview: e.overview,
                still_path: e.still_path ? `${IMAGE_BASE_URL}${e.still_path}` : null,
                vote_average: e.vote_average,
                air_date: e.air_date,
                episode_number: e.episode_number,
                season_number: e.season_number,
                runtime: e.runtime
            })) || [],
            season_number: item.season_number,
            cast: seasonCast,
            gallery_urls: galleryUrls,
            external_ids: item.external_ids,
            provider: 'tmdb'
        };
    }

    const title = item.title || item.name || 'Untitled';
    const date = item.release_date || item.first_air_date;
    const year = date ? new Date(date).getFullYear() : new Date().getFullYear();

    const isAnimation = item.genre_ids?.includes(16) || item.genres?.some((g: any) => g.id === 16);
    const isJapanese = item.original_language === 'ja' || item.origin_country?.includes('JP');
    const isAnime = !!(isAnimation && isJapanese);

    // If genres are provided as objects (from detailed fetch), use them. Otherwise map IDs.
    let genreNames: string[] = [];
    if (item.genres) {
        genreNames = item.genres.map((g: any) => g.name);
    } else if (item.genre_ids) {
        genreNames = item.genre_ids.map((id: number) => GENRES[id]).filter(Boolean);
    }

    if (isAnime) {
        genreNames = genreNames.map((g: string) => g === 'Animation' ? 'Anime' : g);
        if (!genreNames.includes('Anime') && isAnimation) {
             genreNames.unshift('Anime');
        }
    }

    let mediaType: 'movie' | 'tv' = item.media_type;
    if (!mediaType) {
        mediaType = item.title ? 'movie' : 'tv';
    }

    const sourceCastList = item.aggregate_credits?.cast || item.credits?.cast;
    const cast: CastMember[] | undefined = sourceCastList?.map((c: any) => {
        let character = c.character;
        // Fallback for aggregate credits which use 'roles' and might not have character at top level
        if (!character && c.roles && c.roles.length > 0) {
            character = c.roles[0].character; // Use first role
        }
        
        return {
            id: c.id,
            name: c.name,
            character: character || 'Unknown',
            profile_path: c.profile_path ? `${IMAGE_BASE_URL}${c.profile_path}` : null
        };
    });

    let galleryUrls: string[] | undefined = undefined;
    if (item.images?.backdrops) {
        galleryUrls = item.images.backdrops.slice(0, 10).map((img: any) => `${BACKDROP_BASE_URL}${img.file_path}`);
    }

    const videos = item.videos?.results || [];
    // Prioritize Trailer, then Teaser
    const trailer = videos.find((v: any) => v.site === 'YouTube' && v.type === 'Trailer') 
                 || videos.find((v: any) => v.site === 'YouTube' && v.type === 'Teaser');
                 
    const promoVideoUrl = trailer ? `https://www.youtube.com/embed/${trailer.key}` : undefined;

    return {
        id: item.id,
        title: title,
        description: item.overview || '',
        image_url: item.poster_path ? `${IMAGE_BASE_URL}${item.poster_path}` : 'https://via.placeholder.com/400x600?text=No+Poster',
        backdrop_url: item.backdrop_path ? `${BACKDROP_BASE_URL}${item.backdrop_path}` : 'https://via.placeholder.com/1280x720?text=No+Backdrop',
        rating: item.vote_average || 0,
        year: year,
        maturity: item.adult ? '18+' : 'PG-13',
        genres: genreNames.slice(0, 3),
        participants: [],
        cast: cast,
        promo_video_url: promoVideoUrl,
        gallery_urls: galleryUrls,
        media_type: mediaType,
        is_anime: isAnime,
        seasons: item.seasons,
        number_of_episodes: item.number_of_episodes,
        number_of_seasons: item.number_of_seasons,
        runtime: item.runtime || (item.episode_run_time?.[0] || 0),
        original_language: item.original_language,
        status: item.status,
        homepage: item.homepage,
        budget: item.budget,
        revenue: item.revenue,
        popularity: item.popularity,
        vote_count: item.vote_count,
        original_name: item.original_name || item.original_title,
        production_companies: item.production_companies,
        networks: item.networks,
        next_episode_to_air: item.next_episode_to_air,
        last_episode_to_air: item.last_episode_to_air,
        external_ids: item.external_ids,
        provider: 'tmdb'
    };
};

export const getShowIdFromSlug = async (slug: string, type: 'movie' | 'tv' | 'person', language: string = 'en-US'): Promise<number | null> => {
    const legacyIdMatch = slug.match(/^(\d+)-/);
    let cleanSlug = slug;
    if (legacyIdMatch) cleanSlug = slug.replace(/^(\d+)-/, '');
    
    try {
        const endpoint = type === 'person' ? '/search/person' : (type === 'movie' ? '/search/movie' : '/search/tv');
        // Search matches logic universal, no language needed for ID resolution usually, but keeping English for max match
        const data = await fetchTMDB(endpoint, { query: cleanSlug.replace(/-/g, ' '), language });
        
        if (data?.results?.length) {
            return data.results[0].id;
        }
        if (legacyIdMatch) return parseInt(legacyIdMatch[1]);
        return null;
    } catch (e) {
        if (legacyIdMatch) return parseInt(legacyIdMatch[1]);
        return null;
    }
};

export const getShowDetails = async (id: number, type: 'movie' | 'tv', fetchCollection: boolean = false, language: string = 'en-US'): Promise<Show | null> => {
    if (!id || isNaN(id)) return null;

    try {
        const appendToResponse = type === 'tv' 
            ? 'aggregate_credits,credits,videos,images,external_ids' 
            : 'credits,videos,images,external_ids';

        const data = await fetchTMDB(`/${type}/${id}`, { 
            append_to_response: appendToResponse, 
            language 
        });
        if (!data) return null;

        if (!isContentSafe(data)) return null;

        // Enhanced Logic for missing translations (Overview AND Cast Characters)
        if (language !== 'en-US') {
             const castList = data.aggregate_credits?.cast || data.credits?.cast || [];
             // Check if any cast member has missing character name (or empty roles for aggregate)
             const needsCastFallback = castList.some((c: any) => {
                 // For standard credits
                 if ('character' in c && !c.character) return true;
                 // For aggregate credits (TV)
                 if (c.roles && Array.isArray(c.roles)) {
                     // If roles array exists but contains entries without character name
                     return c.roles.some((r: any) => !r.character);
                 }
                 // If using aggregate but no roles defined (unlikely but safe to check)
                 return false;
             });

             const needsOverview = !data.overview || data.overview.trim() === '';

             if (needsOverview || needsCastFallback) {
                 try {
                     const enData = await fetchTMDB(`/${type}/${id}`, { append_to_response: appendToResponse, language: 'en-US' });
                     
                     if (enData) {
                         // Fallback Overview
                         if (needsOverview && enData.overview) {
                             data.overview = enData.overview;
                         }
                         
                         // Fallback Cast Characters
                         if (needsCastFallback) {
                             const enCast = enData.aggregate_credits?.cast || enData.credits?.cast || [];
                             const enCastMap = new Map(enCast.map((c: any) => [c.id, c]));
                             
                             const localCast = data.aggregate_credits?.cast || data.credits?.cast || [];
                             localCast.forEach((c: any) => {
                                 const enC: any = enCastMap.get(c.id);
                                 if (enC) {
                                     // Standard character field
                                     if (!c.character && enC.character) c.character = enC.character;
                                     
                                     // Aggregate roles
                                     if (c.roles && enC.roles) {
                                         c.roles.forEach((r: any, i: number) => {
                                             if (!r.character && enC.roles && enC.roles[i]?.character) {
                                                 r.character = enC.roles[i].character;
                                             }
                                         });
                                         // If local roles empty but english has them
                                         if (c.roles.length === 0 && enC.roles.length > 0) {
                                             c.roles = enC.roles;
                                         }
                                     } else if (!c.roles && enC.roles) {
                                         c.roles = enC.roles;
                                     }
                                 }
                             });
                         }
                     }
                 } catch (fallbackError) {
                     Logger.warn('Failed to fetch fallback English data', fallbackError);
                 }
             }
        }

        const show = mapTMDBToShow({ ...data, media_type: type });
        
        if (type === 'movie' && data.belongs_to_collection && fetchCollection) {
             const collectionId = data.belongs_to_collection.id;
             const collectionData = await fetchTMDB(`/collection/${collectionId}`, { language });
             if (collectionData && collectionData.parts) {
                 show.collection_name = collectionData.name;
                 show.collection = collectionData.parts
                    .filter((part: any) => part.id !== show.id && part.poster_path)
                    .filter((part: any) => isContentSafe(part))
                    .map((part: any) => mapTMDBToShow({ ...part, media_type: 'movie' }))
                    .sort((a: Show, b: Show) => (a.year || 0) - (b.year || 0));
             }
        }
        return show;
    } catch (e) {
        return null;
    }
};

export const getSeasonDetails = async (tvId: number, seasonNumber: number, language: string = 'en-US'): Promise<Show | null> => {
    const endpoint = `/tv/${tvId}/season/${seasonNumber}`;
    const data = await fetchTMDB(endpoint, { language });
    if (!data) return null;
    return mapTMDBToShow({ ...data, media_type: 'season', id: data._id || data.id }); 
};

export const getEpisodeDetails = async (tvId: number, seasonNumber: number, episodeNumber: number, language: string = 'en-US') => {
    const endpoint = `/tv/${tvId}/season/${seasonNumber}/episode/${episodeNumber}`;
    const data = await fetchTMDB(endpoint, { append_to_response: 'images,credits,videos', language });
    return data;
};

export const discoverMedia = async (
    type: 'movie' | 'tv' | 'all', 
    filters: { genres?: string[], minRating?: number, year?: string, isAnime?: boolean, language?: string },
    page: number = 1
): Promise<{ results: Show[], total_results: number }> => {
    
    const params: Record<string, string> = {
        sort_by: 'popularity.desc',
        'vote_count.gte': '50',
        page: page.toString(),
        include_adult: 'false'
    };
    
    // Explicitly pass language to discover
    if (filters.language) params.language = filters.language;

    let genreIds: string[] = [];
    if (filters.genres && filters.genres.length > 0) {
        const lookupGenres = filters.genres.filter(g => g !== 'Anime');
        const mappedIds = lookupGenres.map(name => getGenreId(name)?.toString()).filter(Boolean) as string[];
        genreIds = [...genreIds, ...mappedIds];
        genreIds = Array.from(new Set(genreIds));
    }

    if (genreIds.length > 0) params.with_genres = genreIds.join(',');
    if (filters.minRating) params['vote_average.gte'] = filters.minRating.toString();
    if (filters.year) {
        if (type === 'movie' || type === 'all') params.primary_release_year = filters.year;
        if (type === 'tv' || type === 'all') params.first_air_date_year = filters.year;
    }

    let results: any[] = [];
    let totalResults = 0;

    try {
        if (type === 'movie' || type === 'all') {
            const data = await fetchTMDB('/discover/movie', params);
            if (data?.results) {
                results = [...results, ...data.results.map((item: any) => ({...item, media_type: 'movie'}))];
                totalResults += data.total_results || 0;
            }
        }
        if (type === 'tv' || type === 'all') {
            const data = await fetchTMDB('/discover/tv', params);
            if (data?.results) {
                results = [...results, ...data.results.map((item: any) => ({...item, media_type: 'tv'}))];
                totalResults += data.total_results || 0;
            }
        }
    } catch (e) {
        Logger.error("Discover API Error", e);
    }

    let finalResults = results
        .filter((item: any) => isContentSafe(item)) 
        .map(mapTMDBToShow)
        .filter((show: Show) => show.id !== -1)
        .sort((a, b) => b.popularity - a.popularity);

    return { results: finalResults, total_results: totalResults };
};

// Specialized Search for specific endpoints
export const searchSpecific = async (query: string, type: 'tv' | 'movie' | 'person' | 'company', page: number = 1, language: string = 'en-US'): Promise<{ results: any[], total_results: number }> => {
    const endpoint = `/search/${type}`;
    const data = await fetchTMDB(endpoint, { query, page: page.toString(), language });
    if (!data?.results) return { results: [], total_results: 0 };
    return { results: data.results, total_results: data.total_results || 0 };
}

export const searchMulti = async (query: string, page: number = 1, language: string = 'en-US'): Promise<{ results: Show[], total_results: number }> => {
    const data = await fetchTMDB('/search/multi', { query, page: page.toString(), language });
    if (!data?.results) return { results: [], total_results: 0 };

    const results = data.results
        .filter((item: any) => (item.media_type === 'movie' || item.media_type === 'tv' || item.media_type === 'person') && isContentSafe(item))
        .map(mapTMDBToShow)
        .filter((show: Show) => show.id !== -1);

    return { results, total_results: data.total_results || 0 };
};

export const getPersonDetails = async (personId: number, language: string = 'en-US') => {
    const data = await fetchTMDB(`/person/${personId}`, { language });
    if (data && isContentSafe(data)) {
        return data;
    }
    return null;
};

export const getPersonCredits = async (personId: number, language: string = 'en-US'): Promise<{ cast: Show[], crew: Show[] }> => {
    const data = await fetchTMDB(`/person/${personId}/combined_credits`, { language });
    if (!data) return { cast: [], crew: [] };

    const uniqueCast = new Map<string, any>();
    const uniqueCrew = new Map<string, any>();

    if (data.cast) {
        data.cast.forEach((credit: any) => {
            if (!isContentSafe(credit)) return; 
            const mediaType = credit.media_type;
            const key = `${mediaType || 'unknown'}_${credit.id}`;
            if (!uniqueCast.has(key)) uniqueCast.set(key, credit);
        });
    }

    if (data.crew) {
        data.crew.forEach((credit: any) => {
            if (!isContentSafe(credit)) return; 
            const mediaType = credit.media_type;
            if (mediaType !== 'movie' && mediaType !== 'tv') return;
            if (['Director', 'Writer', 'Screenplay', 'Creator', 'Executive Producer'].includes(credit.job)) {
                const key = `${mediaType}_${credit.id}`;
                if (!uniqueCrew.has(key)) uniqueCrew.set(key, credit);
            }
        });
    }

    const cast = Array.from(uniqueCast.values()).sort((a,b) => b.popularity - a.popularity).map(mapTMDBToShow);
    const crew = Array.from(uniqueCrew.values()).sort((a,b) => b.popularity - a.popularity).map(mapTMDBToShow);

    return { cast, crew };
};

export const getRecommendations = async (id: number, type: 'movie' | 'tv', language: string = 'en-US') => {
    const data = await fetchTMDB(`/${type}/${id}/recommendations`, { language });
    return data?.results 
        ? data.results.filter((item: any) => isContentSafe(item)).map(mapTMDBToShow).filter((s: Show) => s.id !== -1) // Removed !s.is_anime
        : [];
};

export const getShowsByNetwork = async (networkId: string, page: number = 1, language: string = 'en-US') => {
    const data = await fetchTMDB('/discover/tv', { with_networks: networkId, page: page.toString(), sort_by: 'popularity.desc', language });
    return data?.results 
        ? data.results.filter((item: any) => isContentSafe(item)).map(mapTMDBToShow).filter((s: Show) => s.id !== -1) // Removed !s.is_anime
        : [];
};

export const getNetworkDetails = async (networkId: string) => {
    return await fetchTMDB(`/network/${networkId}`);
}

export const getNetworkIdFromSlug = async (slug: string, language: string = 'en-US'): Promise<number | null> => {
    if (!slug) return null;
    const cleanName = slug.replace(/-/g, ' ');
    const data = await fetchTMDB('/search/company', { query: cleanName, language });
    if (data?.results?.length) {
        return data.results[0].id;
    }
    return null;
}

export const getPopularPeople = async (page: number = 1, language: string = 'en-US') => { 
    const data = await fetchTMDB('/person/popular', { page: page.toString(), language }); 
    return (data?.results?.filter((i: any) => isContentSafe(i)).map((i: any) => ({ ...i, media_type: 'person' })).map(mapTMDBToShow) || []).filter((s: Show) => s.id !== -1); 
};

export const getTrendingMovies = async (timeWindow: 'day' | 'week' = 'week', page: number = 1, language: string = 'en-US') => { 
    const data = await fetchTMDB(`/trending/movie/${timeWindow}`, { page: page.toString(), language }); 
    return (data?.results?.filter((i: any) => isContentSafe(i)).map(mapTMDBToShow) || []).filter((s: Show) => s.id !== -1); // Removed !s.is_anime
};
export const getTrendingTV = async (timeWindow: 'day' | 'week' = 'week', page: number = 1, language: string = 'en-US') => { 
    const data = await fetchTMDB(`/trending/tv/${timeWindow}`, { page: page.toString(), language }); 
    return (data?.results?.filter((i: any) => isContentSafe(i)).map(mapTMDBToShow) || []).filter((s: Show) => s.id !== -1); // Removed !s.is_anime
};
export const getTopRatedMovies = async (page: number = 1, language: string = 'en-US') => { 
    const data = await fetchTMDB('/movie/top_rated', { page: page.toString(), language }); 
    return (data?.results?.filter((i: any) => isContentSafe(i)).map(mapTMDBToShow) || []).filter((s: Show) => s.id !== -1); // Removed !s.is_anime
};
export const getActionMovies = async (page: number = 1, language: string = 'en-US') => { 
    const data = await fetchTMDB('/discover/movie', { with_genres: '28', page: page.toString(), language }); 
    return (data?.results?.filter((i: any) => isContentSafe(i)).map(mapTMDBToShow) || []).filter((s: Show) => s.id !== -1); // Removed !s.is_anime
};
export const getComedyMovies = async (page: number = 1, language: string = 'en-US') => { 
    const data = await fetchTMDB('/discover/movie', { with_genres: '35', page: page.toString(), language }); 
    return (data?.results?.filter((i: any) => isContentSafe(i)).map(mapTMDBToShow) || []).filter((s: Show) => s.id !== -1); // Removed !s.is_anime
};
export const getSciFiMovies = async (page: number = 1, language: string = 'en-US') => { 
    const data = await fetchTMDB('/discover/movie', { with_genres: '878', page: page.toString(), language }); 
    return (data?.results?.filter((i: any) => isContentSafe(i)).map(mapTMDBToShow) || []).filter((s: Show) => s.id !== -1); // Removed !s.is_anime
};

export const getShowsWithDetails = async (endpoint: string, params: Record<string, string> = {}, language: string = 'en-US'): Promise<Show[]> => {
    const data = await fetchTMDB(endpoint, { ...params, language });
    if (!data?.results) return [];

    const initialShows = data.results
        .filter((item: any) => isContentSafe(item))
        .map((item: any) => {
             // Infer media_type if not present, based on endpoint
             let mediaType = item.media_type;
             if (!mediaType) {
                 if (endpoint.includes('movie')) mediaType = 'movie';
                 else if (endpoint.includes('tv')) mediaType = 'tv';
                 else mediaType = 'movie';
             }
             return { ...item, media_type: mediaType };
        })
        .map(mapTMDBToShow)
        .filter((s: Show) => s.id !== -1); // Removed !s.is_anime

    // Fetch full details for each item to hydrate cast, images etc.
    const detailedShows = await Promise.all(initialShows.map(async (show: Show) => {
        if (show.media_type === 'movie' || show.media_type === 'tv') {
             const detailed = await getShowDetails(show.id, show.media_type, false, language);
             return detailed || show;
        }
        return show;
    }));

    return detailedShows;
};
