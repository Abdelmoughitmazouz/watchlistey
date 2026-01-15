
// Strict Blocklist
const BANNED_KEYWORDS = [
    'hentai', 'porn', 'xxx', 'erotic', 'ecchi', 'sex', '18+', 'nsfw', 'adult', 
    'nude', 'uncensored', 'incest', 'rape', 'jav', 'ero', 'sexual'
];

const BANNED_GENRES = [
    'Hentai', 'Erotica', 'Ecchi', 'Adult', 'Yaoi', 'Yuri'
];

/**
 * Checks if a string contains any banned keywords (case-insensitive).
 * Handles string inputs and recurses for objects (e.g. AniList titles).
 */
const hasBannedKeyword = (text: any): boolean => {
    if (!text) return false;
    
    // Handle String
    if (typeof text === 'string') {
        const lower = text.toLowerCase();
        return BANNED_KEYWORDS.some(word => {
            // Strict boundary check for short words to avoid false positives (e.g. "sex" in "Essex")
            if (word.length <= 4) {
                const regex = new RegExp(`\\b${word}\\b`, 'i');
                return regex.test(lower);
            }
            return lower.includes(word);
        });
    }
    
    // Handle Object (e.g. AniList Title: { romaji, english, native })
    if (typeof text === 'object') {
        const values = Object.values(text).filter(v => typeof v === 'string') as string[];
        return values.some(v => hasBannedKeyword(v));
    }

    return false;
};

/**
 * Global Safety Validator
 * Returns TRUE if content is safe.
 * Returns FALSE if content is restricted.
 */
export const isContentSafe = (item: any): boolean => {
    if (!item) return false;

    // 1. Check Explicit Flags (API provided)
    if (item.isAdult === true || item.adult === true || item.is_adult === true) {
        return false;
    }

    // 2. Check Genres (AniList uses strings, TMDB uses IDs which are safe by definition unless mapped, handled elsewhere)
    const genres = item.genres || [];
    if (Array.isArray(genres)) {
        const hasUnsafeGenre = genres.some((g: any) => {
            const name = typeof g === 'string' ? g : g?.name || '';
            return BANNED_GENRES.some(banned => name.toLowerCase() === banned.toLowerCase());
        });
        if (hasUnsafeGenre) return false;
    }

    // 3. Check Titles/Names (Recursive for objects)
    if (hasBannedKeyword(item.title)) return false;
    if (hasBannedKeyword(item.original_name)) return false;
    if (hasBannedKeyword(item.original_title)) return false;
    if (hasBannedKeyword(item.name)) return false;

    // 4. Check Description/Overview
    // We are slightly more lenient on description to avoid false positives in normal synopsis.
    const desc = item.description || item.overview;
    if (desc && typeof desc === 'string') {
        const lowerDesc = desc.toLowerCase();
        if (lowerDesc.includes('hentai') || lowerDesc.includes('erotica') || lowerDesc.includes('jav ')) {
            return false;
        }
    }

    // 5. Check Tags (AniList specific)
    if (item.tags && Array.isArray(item.tags)) {
        const hasUnsafeTag = item.tags.some((t: any) => {
            const name = typeof t === 'string' ? t : t.name || '';
            return BANNED_GENRES.some(banned => name.toLowerCase() === banned.toLowerCase()) || 
                   BANNED_KEYWORDS.includes(name.toLowerCase());
        });
        if (hasUnsafeTag) return false;
    }

    return true;
};
