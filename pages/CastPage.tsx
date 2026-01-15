
import React from 'react';
import { Show, ListItem, ListStatus } from '../types';
import { ChevronLeftIcon, UserPlaceholderIcon, HeartIcon } from '../constants';
import { useSEO } from '../hooks/useSEO';
import { slugify } from '../lib/tmdb';

interface CastPageProps {
    show: Show;
    onBack: () => void;
    onNavigate: (path: string) => void;
    userCharacters?: Record<number, ListItem>;
    handleUpdateListStatus?: (showId: number, status: ListStatus | null, show?: Show) => void;
}

const CastPage: React.FC<CastPageProps> = ({ show, onBack, onNavigate, userCharacters = {}, handleUpdateListStatus }) => {

    // --- SEO ---
    useSEO(`${show.title} - Full Cast & Crew`, `Meet the cast and crew of ${show.title}.`);
    // -----------

    const handleToggleCastFavorite = (e: React.MouseEvent, member: any) => {
        e.preventDefault();
        e.stopPropagation();
        if (handleUpdateListStatus) {
            // Check favorite status in userCharacters
            const isCastFavorite = userCharacters[member.id]?.status === 'Favorite';
            
            // Construct person show object
            const personShow: Show = {
                id: member.id,
                title: member.name,
                media_type: 'person',
                is_staff: show.is_anime, // Mark as staff if anime
                image_url: member.profile_path || '',
                backdrop_url: '',
                rating: 0,
                year: 0,
                description: `Played ${member.character}`
            };
            
            // Toggle: If favorite (true), send null to delete. If not, send 'Favorite'.
            handleUpdateListStatus(member.id, isCastFavorite ? null : 'Favorite', personShow);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-[#0f0f0f] pb-12 pt-18 md:pt-20 transition-colors duration-200">
             {/* Header/Nav */}
            <div className="bg-white dark:bg-[#1e1e1e] shadow-sm border-b border-gray-200 dark:border-gray-800 sticky top-18 md:top-20 z-20 transition-colors duration-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center gap-4">
                    <button onClick={onBack} className="p-2 hover:bg-gray-100 dark:hover:bg-[#2a2a2a] rounded-full text-gray-600 dark:text-gray-300">
                        <ChevronLeftIcon />
                    </button>
                    <h1 className="text-xl font-bold text-gray-900 dark:text-white truncate">
                        <span className="font-normal text-gray-500 dark:text-gray-400">Cast of</span> {show.title}
                    </h1>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="flex flex-col md:flex-row gap-8">
                    {/* Sidebar / Show Info */}
                    <div className="w-full md:w-1/3 lg:w-1/4 flex-shrink-0">
                         <div className="rounded-lg overflow-hidden shadow-lg bg-white dark:bg-[#1e1e1e] sticky top-24">
                            <img 
                                src={show.image_url} 
                                alt={show.title} 
                                className="w-full h-auto object-cover cursor-pointer"
                                onClick={onBack}
                            />
                            <div className="p-4">
                                <h2 className="text-lg font-bold text-gray-900 dark:text-white hover:underline cursor-pointer" onClick={onBack}>{show.title}</h2>
                                <p className="text-sm text-gray-500 dark:text-gray-400">{show.year}</p>
                                <button onClick={onBack} className="text-sm text-blue-600 dark:text-brand-primary font-semibold mt-3 hover:underline">
                                    ← Back to main page
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Main Content: Full Cast Grid */}
                    <div className="flex-1 min-w-0">
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Full Cast & Crew</h2>
                        
                        {show.cast && show.cast.length > 0 ? (
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-x-4 gap-y-6">
                                {show.cast.map(member => {
                                     const isFavorite = userCharacters[member.id]?.status === 'Favorite';
                                     const personUrl = `/person/${slugify(member.name)}`;

                                     return (
                                     <a 
                                        key={member.id} 
                                        href={personUrl}
                                        className="group cursor-pointer flex flex-col relative"
                                        onClick={(e) => {
                                            if (!e.metaKey && !e.ctrlKey && e.button === 0) {
                                                e.preventDefault();
                                                onNavigate(personUrl);
                                            }
                                        }}
                                        title={`View ${member.name}`}
                                    >
                                        <div className="w-full aspect-[2/3] rounded-lg overflow-hidden shadow-sm mb-2 bg-gray-100 dark:bg-gray-800 relative">
                                            {member.profile_path ? (
                                                <img 
                                                    src={member.profile_path} 
                                                    alt={member.name} 
                                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                                    loading="lazy"
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center bg-gray-200 dark:bg-gray-700">
                                                    <UserPlaceholderIcon className="w-12 h-12 text-gray-400 dark:text-gray-500" />
                                                </div>
                                            )}
                                            
                                            {/* Heart Icon Overlay */}
                                            {handleUpdateListStatus && (
                                                <button 
                                                    onClick={(e) => handleToggleCastFavorite(e, member)}
                                                    className={`absolute top-1 right-1 z-20 p-1.5 rounded-full backdrop-blur-sm transition-all duration-200 shadow-sm
                                                        ${isFavorite 
                                                            ? 'bg-white/80 text-red-500 opacity-100' 
                                                            : 'bg-black/30 text-white opacity-0 group-hover:opacity-100 hover:bg-white/80 hover:text-red-500'
                                                        }`}
                                                    title={isFavorite ? "Remove from favorites" : "Add to favorites"}
                                                >
                                                    <HeartIcon solid={isFavorite} className="w-4 h-4" />
                                                </button>
                                            )}
                                        </div>
                                        <h3 className="font-bold text-gray-900 dark:text-white text-sm truncate group-hover:text-blue-600 dark:group-hover:text-brand-primary transition-colors">{member.name}</h3>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{member.character}</p>
                                    </a>
                                )})}
                            </div>
                        ) : (
                             <div className="text-center py-20 bg-white dark:bg-[#1e1e1e] rounded-lg border border-gray-200 dark:border-gray-800">
                                <p className="text-gray-500 dark:text-gray-400">No cast information available.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CastPage;
