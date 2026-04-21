import React, { useState, useEffect } from 'react';
import { getWatchedEpisodes } from '../lib/supabaseClient';
import { getSeasonDetails, getShowDetails, slugify } from '../lib/tmdb';
import { EpisodeActivity, Show, Episode } from '../types';
import { useTranslation } from 'react-i18next';
import { PlayCircleIcon } from '../constants';

interface UserEpisodeListProps {
    userId: string;
    onNavigate: (path: string) => void;
}

interface EnrichedEpisode extends Episode {
    showTitle: string;
    showImage: string;
    showSlug: string;
    watched_at: string | null;
}

const UserEpisodeList: React.FC<UserEpisodeListProps> = ({ userId, onNavigate }) => {
    const { t, i18n } = useTranslation();
    const [episodes, setEpisodes] = useState<EnrichedEpisode[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            try {
                const acts = await getWatchedEpisodes(userId);
                
                // 1. Get Unique Shows
                const uniqueShowIds = Array.from(new Set(acts.map(a => a.show_id)));
                const showPromises = uniqueShowIds.map(id => getShowDetails(id, 'tv', false, i18n.language));
                const shows = (await Promise.all(showPromises)).filter(Boolean) as Show[];
                const showMap = new Map(shows.map(s => [s.id, s]));

                // 2. Get Unique Seasons
                const uniqueSeasons = new Set<string>();
                acts.forEach(a => uniqueSeasons.add(`${a.show_id}-${a.season_number}`));
                
                const seasonPromises = Array.from(uniqueSeasons).map(key => {
                    const [sid, snum] = key.split('-');
                    return getSeasonDetails(parseInt(sid), parseInt(snum), i18n.language);
                });
                
                const seasons = (await Promise.all(seasonPromises)).filter(Boolean) as Show[];
                // Map: "showId-seasonNum" -> Season Object (which is type Show but has episodes)
                const seasonMap = new Map<string, Show>();
                seasons.forEach(s => {
                    // Note: getSeasonDetails returns a Show object where id is usually season ID, 
                    // but we need to map it back to showId-seasonNum. 
                    // However, the returned object doesn't strictly have show_id.
                    // We can rely on the fact that we requested it. 
                    // Actually, getSeasonDetails implementation in lib/tmdb.ts returns a mapped object.
                    // It might be hard to link back if we don't know which request it came from.
                    // Let's refactor to map request to response.
                });

                // Better approach for seasons:
                const seasonDataMap = new Map<string, Show>();
                await Promise.all(Array.from(uniqueSeasons).map(async (key) => {
                    const [sid, snum] = key.split('-');
                    const s = await getSeasonDetails(parseInt(sid), parseInt(snum), i18n.language);
                    if (s) seasonDataMap.set(key, s);
                }));

                const loadedEpisodes: EnrichedEpisode[] = [];

                acts.forEach(act => {
                    const show = showMap.get(act.show_id);
                    const season = seasonDataMap.get(`${act.show_id}-${act.season_number}`);
                    
                    if (show && season && season.episodes) {
                        const ep = season.episodes.find(e => e.episode_number === act.episode_number);
                        if (ep) {
                            loadedEpisodes.push({
                                ...ep,
                                showTitle: show.title,
                                showImage: show.image_url,
                                showSlug: slugify(show.title),
                                watched_at: act.watched_at
                            });
                        }
                    }
                });

                // Sort by watched_at desc
                loadedEpisodes.sort((a, b) => {
                    const dateA = a.watched_at ? new Date(a.watched_at).getTime() : 0;
                    const dateB = b.watched_at ? new Date(b.watched_at).getTime() : 0;
                    return dateB - dateA;
                });

                setEpisodes(loadedEpisodes);
            } catch (e) {
                console.error("Failed to load episodes", e);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [userId, i18n.language]);

    if (loading) {
        return (
            <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-white"></div>
            </div>
        );
    }

    if (episodes.length === 0) {
        return (
            <div className="text-center py-16 bg-gray-50 dark:bg-[#1e1e1e] rounded-lg border border-dashed border-gray-300 dark:border-gray-700">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">No episodes watched yet</h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    Mark episodes as watched to see them here.
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Completed Episodes</h2>
            <div className="grid grid-cols-1 gap-4">
                {episodes.map((ep, idx) => (
                    <div 
                        key={`${ep.id}-${idx}`} 
                        className="flex items-center gap-4 p-4 bg-white dark:bg-[#1e1e1e] rounded-xl border border-gray-200 dark:border-gray-800 hover:border-brand-primary dark:hover:border-brand-primary transition-colors cursor-pointer group"
                        onClick={() => onNavigate(`/tv/${ep.showSlug}/Season_${ep.season_number}/episode/${ep.episode_number}`)}
                    >
                        {/* Image */}
                        <div className="relative w-32 h-20 flex-shrink-0 rounded-lg overflow-hidden bg-gray-200 dark:bg-gray-800">
                            <img 
                                src={ep.still_path || ep.showImage} 
                                alt={ep.name} 
                                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" 
                            />
                            <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity">
                                <PlayCircleIcon className="w-8 h-8 text-white drop-shadow-lg" />
                            </div>
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                            <h3 className="text-base font-bold text-gray-900 dark:text-white truncate group-hover:text-brand-primary transition-colors">
                                {ep.showTitle}
                            </h3>
                            <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                                <span className="font-mono bg-gray-100 dark:bg-[#2a2a2a] px-1.5 py-0.5 rounded text-xs">
                                    S{ep.season_number} E{ep.episode_number}
                                </span>
                                <span className="truncate">{ep.name}</span>
                            </div>
                            {ep.watched_at && (
                                <p className="text-xs text-gray-400 mt-1">
                                    Watched on {new Date(ep.watched_at).toLocaleDateString()}
                                </p>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default UserEpisodeList;
