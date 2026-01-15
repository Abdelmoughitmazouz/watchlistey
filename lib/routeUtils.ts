
import { i18n } from 'i18next';

export const SUPPORTED_LANGUAGES = ['en', 'es', 'fr', 'de', 'ru', 'ja', 'zh', 'ar'];
export const DEFAULT_LANGUAGE = 'en';

export const PATH_TRANSLATIONS: Record<string, Record<string, string>> = {
    en: { movie: 'movie', tv: 'tv', person: 'person', genre: 'genre', network: 'network' },
    es: { movie: 'pelicula', tv: 'series', person: 'persona', genre: 'categoria', network: 'red' },
    fr: { movie: 'film', tv: 'series', person: 'personne', genre: 'categorie', network: 'reseau' },
    de: { movie: 'film', tv: 'serien', person: 'person', genre: 'kategorie', network: 'netzwerk' },
    ru: { movie: 'фильмы', tv: 'сериалы', person: 'персона', genre: 'категория', network: 'сеть' },
    ja: { movie: '映画', tv: 'テレビ', person: '人物', genre: 'ジャンル', network: 'ネットワーク' },
    zh: { movie: '电影', tv: '电视剧', person: '人物', genre: '类型', network: '网络' },
    ar: { movie: 'أفلام', tv: 'مسلسلات', person: 'شخصية', genre: 'تصنيف', network: 'شبكة' },
};

export const REVERSE_PATH_TRANSLATIONS: Record<string, Record<string, string>> = {};

Object.keys(PATH_TRANSLATIONS).forEach(lang => {
    REVERSE_PATH_TRANSLATIONS[lang] = {};
    Object.entries(PATH_TRANSLATIONS[lang]).forEach(([internal, localized]) => {
        REVERSE_PATH_TRANSLATIONS[lang][localized] = internal;
    });
});

export interface ParsedRoute {
    lang: string;
    type?: 'movie' | 'tv' | 'person' | 'user' | 'genre' | 'network';
    slug?: string;
    rest: string;
    isLocalized: boolean;
}

export const parsePath = (pathname: string): ParsedRoute => {
    const decodedPath = decodeURIComponent(pathname);
    const parts = decodedPath.split('/').filter(Boolean);
    
    const potentialLang = parts[0];
    const isLang = SUPPORTED_LANGUAGES.includes(potentialLang);
    
    const lang = isLang ? potentialLang : DEFAULT_LANGUAGE;
    const offset = isLang ? 1 : 0;
    
    const segment = parts[offset];
    const slug = parts[offset + 1];
    
    let type: any = undefined;
    
    if (segment) {
        if (REVERSE_PATH_TRANSLATIONS[lang] && REVERSE_PATH_TRANSLATIONS[lang][segment]) {
            type = REVERSE_PATH_TRANSLATIONS[lang][segment];
        } else if (['movie', 'tv', 'person', 'genre', 'network', 'u'].includes(segment)) {
            type = segment === 'u' ? 'user' : segment;
        } else if (segment === 'user') {
             type = 'user';
        }
    }

    return {
        lang,
        type,
        slug: type ? slug : undefined,
        rest: parts.slice(offset).join('/'),
        isLocalized: isLang
    };
};

export const getLocalizedPath = (path: string, targetLang: string): string => {
    if (path.startsWith('http')) return path;
    
    // Parse the current path to understand its structure (Type + Slug)
    const { type, slug, rest } = parsePath(path);
    let newPath = '';

    if (type && slug) {
        // We have a recognized type, so we translate the type segment
        const parts = rest.split('/');
        
        // Handle sub-routes (like /season/1/episode/5)
        // parts[0] is segment, parts[1] is slug. extras are parts[2+]
        const extras = parts.slice(2).join('/');

        if (type === 'user') {
            newPath = `u/${slug}`;
        } else {
            // Lookup the localized name for 'movie', 'person', 'genre', etc.
            const localizedSegment = PATH_TRANSLATIONS[targetLang]?.[type] || type;
            newPath = `${localizedSegment}/${slug}`;
        }
        
        if (extras) {
            newPath += `/${extras}`;
        }
    } else {
        // No recognized structural type, preserve the path as is (e.g. 'settings', 'login')
        newPath = rest;
    }

    // Prefix with language code if not default language
    if (targetLang !== DEFAULT_LANGUAGE) {
        return newPath ? `/${targetLang}/${newPath}` : `/${targetLang}`;
    }

    return newPath ? `/${newPath}` : '/';
};
