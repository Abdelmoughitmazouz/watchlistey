import React from 'react';
import { Show, ListStatus, ListItem } from '../types';
import { HeartIcon, UserPlaceholderIcon, FaceSmileIcon, FaceNeutralIcon, FaceFrownIcon } from '../constants';
import ListStatusButton from './ListStatusButton';
import { slugify } from '../lib/tmdb';
import { useTranslation } from 'react-i18next';
import { getLocalizedPath } from '../lib/routeUtils';

interface ShowCardProps {
    show: Show;
    onShowClick?: (show: Show) => void;
    userList: Record<number, ListItem>;
    userFavorites?: Record<number, ListItem>;
    userCharacters?: Record<number, ListItem>;
    handleUpdateListStatus?: (showId: number, status: ListStatus | null, show?: Show) => void;
    handleToggleFavorite?: (show: Show) => void;
}

const ShowCard: React.FC<ShowCardProps> = ({ show, onShowClick, userList, userFavorites, userCharacters, handleUpdateListStatus, handleToggleFavorite }) => {
    const { t, i18n } = useTranslation();
    
    const getNavigationPath = () => {
        // Handle User Navigation
        if (show.media_type === 'user' && show.username) {
            return `/${i18n.language}/u/${show.username}`;
        }

        // GENERATE SEO FRIENDLY SLUG
        let slug = slugify(show.title);
        let internalPath = '';
        
        if (show.media_type === 'person') {
            internalPath = `/person/${slug}`;
        } else if (show.media_type === 'season' && show.parent_show_title && show.season_number !== undefined) {
            const parentSlug = slugify(show.parent_show_title);
            // Seasons don't have a direct top-level localized route usually, handled via TV path
            // For simplicity, let's treat season links as extensions of the show link
            internalPath = `/tv/${parentSlug}/season/${show.season_number}`;
        } else {
            // Revert all anime/manga back to their TMDB source types (tv or movie)
            let type = show.media_type === 'tv' ? 'tv' : 'movie';
            internalPath = `/${type}/${slug}`;
        }
        
        return getLocalizedPath(internalPath, i18n.language);
    };

    const handleLinkClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
        // Allow default behavior for new tabs (cmd/ctrl click)
        if (e.metaKey || e.ctrlKey || e.button === 1) {
            return;
        }

        e.preventDefault();
        
        if (onShowClick) {
            onShowClick(show);
        }
    };

    const isPerson = show.media_type === 'person';
    const isUser = show.media_type === 'user';
    const isPersonOrUser = isPerson || isUser;
    
    // Calculate favorite status
    const isFavorite = isPerson 
        ? (userCharacters ? userCharacters[show.id]?.status === 'Favorite' : userList[show.id]?.status === 'Favorite')
        : (userFavorites ? (!!userFavorites[show.id] || !!userList[show.id]?.is_favorite) : userList[show.id]?.is_favorite);
    
    // Check if the image is a placeholder or marked as 'No Image'
    const isPlaceholder = !show.image_url || show.image_url.includes('placeholder') || show.image_url.includes('No+Image');

    const handleHeartClick = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        
        if (isUser) return; // No actions for users yet

        if (isPerson) {
            if (handleUpdateListStatus) {
                handleUpdateListStatus(show.id, isFavorite ? null : 'Favorite', show);
            }
        } else {
            if (handleToggleFavorite) {
                handleToggleFavorite(show);
            }
        }
    };

    // Determine Rating Icon and Color
    const rating = show.rating || 0;
    let MatchIcon = FaceNeutralIcon;
    let matchColorClass = "text-orange-500 bg-white/90";

    if (rating >= 7) {
        MatchIcon = FaceSmileIcon;
        matchColorClass = "text-green-500 bg-white/90";
    } else if (rating < 5) {
        MatchIcon = FaceFrownIcon;
        matchColorClass = "text-red-500 bg-white/90";
    }

    const navPath = getNavigationPath();

    // Translate genres for display
    const translatedGenres = show.genres?.slice(0, 2).map(g => t(`genres.${g}`, g)).join(' • ');

    return (
        <div className="group block relative aspect-[2/3] bg-gray-900 rounded-lg transition-transform duration-300">
            {/* Main SEO Link Wrapper - Wraps the image for Google Indexing */}
            <a 
                href={navPath}
                onClick={handleLinkClick}
                className="block w-full h-full rounded-lg overflow-hidden relative z-10"
                title={`View details for ${show.title}`}
            >
                {!isPlaceholder ? (
                    <img 
                        src={show.image_url} 
                        alt={isPersonOrUser ? `${show.title} - Profile` : `${show.title} (${show.year}) Poster`}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" 
                        loading="lazy" 
                        decoding="async"
                    />
                ) : (
                    <div className={`w-full h-full flex items-center justify-center ${isPersonOrUser ? 'bg-gray-200' : 'bg-gray-800'}`}>
                        {isPersonOrUser ? (
                            <UserPlaceholderIcon className="w-16 h-16 text-gray-400" />
                        ) : (
                            <span className="text-gray-500 text-sm">No Image</span>
                        )}
                    </div>
                )}
            </a>

            {/* Top Right Actions - z-20 to be above link so they are clickable */}
            <div className="absolute top-2 right-2 z-20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col gap-2">
                 <div className="flex flex-col gap-2">
                    {isPerson ? (
                         handleUpdateListStatus && (
                            <button 
                                onClick={handleHeartClick}
                                className={`h-9 w-9 flex items-center justify-center rounded-full backdrop-blur-sm transition-all ${isFavorite ? 'bg-red-500 text-white hover:bg-red-600' : 'bg-black/50 text-white hover:bg-white hover:text-red-500'}`} 
                                aria-label={isFavorite ? "Remove from Favorites" : "Add to Favorites"}
                                title={isFavorite ? "Remove from Favorites" : "Add to Favorites"}
                            >
                                <HeartIcon solid={isFavorite} className="h-5 w-5" />
                            </button>
                         )
                    ) : isUser ? (
                        /* No actions for users yet */
                        null
                    ) : (
                        <>
                            {handleUpdateListStatus && 
                                <ListStatusButton 
                                    showId={show.id} 
                                    userList={userList} 
                                    handleUpdateListStatus={handleUpdateListStatus} 
                                    isIconOnly 
                                    show={show} 
                                    transparent 
                                    align="right" 
                                />
                            }
                            {handleToggleFavorite && (
                                <button 
                                    onClick={handleHeartClick}
                                    className={`h-9 w-9 flex items-center justify-center rounded-full backdrop-blur-sm transition-all ${isFavorite ? 'bg-red-500 text-white hover:bg-red-600' : 'bg-black/50 text-white hover:bg-white hover:text-red-500'}`}
                                    aria-label={isFavorite ? "Unfavorite" : "Favorite"}
                                >
                                    <HeartIcon solid={isFavorite} className="h-5 w-5" />
                                </button>
                            )}
                            {/* Rating Face Icon */}
                            <div className={`h-9 w-9 flex items-center justify-center rounded-full backdrop-blur-sm shadow-sm ${matchColorClass}`} title={`${Math.round(rating * 10)}% Match`}>
                                <MatchIcon className="h-6 w-6" />
                            </div>
                        </>
                    )}
                 </div>
            </div>

            {/* Bottom Text Overlay - Clickable via the main link, visual via this div */}
            <a 
                href={navPath}
                onClick={handleLinkClick}
                className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black via-black/60 to-transparent pt-12 pb-3 px-3 flex flex-col justify-end text-left opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10 rounded-b-lg no-underline"
            >
                <h3 className="text-white text-sm font-bold truncate">{show.title}</h3>
                <div className="flex items-center justify-start space-x-2 text-xs text-gray-300 my-1">
                    {!isPersonOrUser && (
                        <>
                            <span>{show.year}</span>
                            {show.maturity && (
                                <>
                                    <span>•</span>
                                    <span className="border border-gray-500 px-1 rounded-[2px] text-[10px] leading-tight">{show.maturity}</span>
                                </>
                            )}
                        </>
                    )}
                </div>
                <p className="text-[11px] text-gray-400 line-clamp-2 leading-tight">
                    {isPersonOrUser ? show.description : translatedGenres}
                </p>
            </a>
        </div>
    );
};

export default ShowCard;