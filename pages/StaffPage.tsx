
import React, { useEffect, useState, useMemo } from 'react';
import { getPersonDetails, getPersonCredits, slugify, getShowIdFromSlug } from '../lib/tmdb';
import { Show, ListItem } from '../types';
import ShowCard from '../components/ShowCard';
import { ChevronLeftIcon, HeartIcon, UserPlaceholderIcon } from '../constants';
import { useSEO } from '../hooks/useSEO';
import { useTranslation } from 'react-i18next';

interface StaffPageProps {
    staffId: string; // Can be ID or slug
    onNavigate: (path: string) => void;
    onBack: () => void;
    userList: Record<number, ListItem>;
    userFavorites?: Record<number, ListItem>;
    userCharacters?: Record<number, ListItem>;
    handleUpdateListStatus: (showId: number, status: any, show?: any) => void;
}

const StaffPage: React.FC<StaffPageProps> = ({ staffId, onNavigate, onBack, userList, userFavorites, userCharacters = {}, handleUpdateListStatus }) => {
    const { t, i18n } = useTranslation();
    const [person, setPerson] = useState<any>(null);
    const [credits, setCredits] = useState<Show[]>([]);
    const [loading, setLoading] = useState(true);
    const [likesCount, setLikesCount] = useState(0);

    // --- SEO ---
    useSEO(
        person ? `${person.name}` : 'Staff', 
        person ? `Learn more about ${person.name}. ${person.known_for_department}.` : undefined,
        person?.profile_path ? `https://image.tmdb.org/t/p/w500${person.profile_path}` : undefined,
        person?.name
    );
    // -----------

    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            try {
                let idToFetch: number | null = parseInt(staffId);
                
                if (isNaN(idToFetch)) {
                    idToFetch = await getShowIdFromSlug(staffId, 'person');
                }
                
                if (idToFetch) {
                    const personData = await getPersonDetails(idToFetch, i18n.language);
                    if (personData) {
                        setPerson(personData);
                        setLikesCount(Math.round(personData.popularity || 0));
                        const creditsData = await getPersonCredits(idToFetch, i18n.language);
                        // Combine cast and crew for general staff view
                        const combined = [...creditsData.cast, ...creditsData.crew].sort((a,b) => b.popularity - a.popularity);
                        // Deduplicate by ID
                        const unique = combined.filter((v,i,a) => a.findIndex(t => t.id === v.id) === i);
                        setCredits(unique);
                    }
                }
            } catch (error) {
                console.error("Failed to fetch staff data", error);
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, [staffId, i18n.language]);

    const handleShowClick = (show: Show) => {
        const slug = slugify(show.title);
        const prefix = show.is_anime ? '/anime/' : show.media_type === 'tv' ? '/tv/' : '/movie/';
        onNavigate(`${prefix}${slug}`);
    };

    const isFavorite = person && userCharacters[person.id]?.status === 'Favorite';

    const handleToggleFavorite = () => {
        if (!person) return;
        
        const newStatus = isFavorite ? null : 'Favorite';
        const personShowObj: Show = {
            id: person.id,
            title: person.name,
            description: person.known_for_department,
            image_url: person.profile_path ? `https://image.tmdb.org/t/p/w500${person.profile_path}` : '',
            backdrop_url: '', 
            rating: 0,
            year: 0,
            media_type: 'person',
            genres: [],
            participants: [],
            gallery_urls: []
        };

        handleUpdateListStatus(person.id, newStatus, personShowObj);
        
        if (newStatus === 'Favorite') {
            setLikesCount(prev => prev + 1);
        } else {
            setLikesCount(prev => Math.max(0, prev - 1));
        }
    };

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center bg-white dark:bg-[#0f0f0f]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-brand-primary"></div>
            </div>
        );
    }

    if (!person) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-[#0f0f0f] flex flex-col pt-20">
                <div className="flex-1 flex items-center justify-center p-10">
                    <p className="text-gray-500 dark:text-gray-400 text-lg">Staff member not found.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-[#0f0f0f] pb-12 pt-18 md:pt-20 transition-colors duration-200">
            
            {/* Main Content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="flex flex-col md:flex-row gap-8 lg:gap-12">
                    
                    {/* Left Column: Sidebar / Info */}
                    <div className="w-full md:w-1/3 lg:w-1/4 flex-shrink-0">
                        <div className="sticky top-24 max-h-[calc(100vh-8rem)] overflow-y-auto pr-2 scrollbar-hide">
                            <div className="md:hidden mb-4">
                                <button onClick={onBack} className="flex items-center gap-1 text-gray-600 dark:text-gray-300 font-medium">
                                    <ChevronLeftIcon className="w-5 h-5" /> Back
                                </button>
                            </div>

                            <div className="rounded-lg overflow-hidden shadow-lg bg-white dark:bg-[#1e1e1e] mb-6">
                                {person.profile_path ? (
                                    <img 
                                        src={`https://image.tmdb.org/t/p/h632${person.profile_path}`} 
                                        alt={person.name} 
                                        className="w-full h-auto object-cover"
                                    />
                                ) : (
                                    <div className="w-full aspect-[2/3] bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                                        <UserPlaceholderIcon className="w-24 h-24 text-gray-400 dark:text-gray-500" />
                                    </div>
                                )}
                            </div>
                            <div className="space-y-4 text-gray-900 dark:text-white pb-4">
                                <div>
                                    <h3 className="text-lg font-semibold border-b border-gray-200 dark:border-gray-700 pb-2 mb-3">Personal Info</h3>
                                </div>
                                <div>
                                    <span className="block text-sm font-medium text-gray-500 dark:text-gray-400">Name</span>
                                    <span className="block font-medium">{person.name}</span>
                                </div>
                                <div>
                                    <span className="block text-sm font-medium text-gray-500 dark:text-gray-400">Known For</span>
                                    <span className="block font-medium">{person.known_for_department}</span>
                                </div>
                                {person.birthday && (
                                    <div>
                                        <span className="block text-sm font-medium text-gray-500 dark:text-gray-400">Birthday</span>
                                        <span className="block">{person.birthday}</span>
                                    </div>
                                )}
                                {person.place_of_birth && (
                                    <div>
                                        <span className="block text-sm font-medium text-gray-500 dark:text-gray-400">Place of Birth</span>
                                        <span className="block">{person.place_of_birth}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Main Content */}
                    <div className="flex-1 min-w-0">
                        
                        <div className="mb-8 border-b border-gray-200 dark:border-gray-800 pb-6">
                            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                                <div>
                                    <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 dark:text-white tracking-tight mb-2">
                                        {person.name}
                                    </h1>
                                    <p className="text-lg text-gray-500 dark:text-gray-400 font-medium">
                                        {person.known_for_department}
                                    </p>
                                </div>
                                
                                <div className="flex items-center gap-4 bg-gray-50 dark:bg-[#1e1e1e] p-2 pr-6 rounded-full border border-gray-200 dark:border-gray-800">
                                    <button 
                                        onClick={handleToggleFavorite}
                                        className={`p-3 rounded-full transition-all duration-300 shadow-sm ${
                                            isFavorite 
                                            ? 'bg-red-500 text-white hover:bg-red-600 transform scale-105' 
                                            : 'bg-white dark:bg-black text-gray-400 hover:text-red-500 border border-gray-200 dark:border-gray-700'
                                        }`}
                                    >
                                        <HeartIcon solid={isFavorite} className="w-6 h-6" />
                                    </button>
                                    <div className="flex flex-col">
                                        <span className={`text-xl font-bold leading-none ${isFavorite ? 'text-gray-900 dark:text-white' : 'text-gray-600 dark:text-gray-400'}`}>
                                            {likesCount}
                                        </span>
                                        <span className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold">
                                            Favorites
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        {person.biography && (
                            <div className="mb-10">
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">Biography</h3>
                                <div className="prose dark:prose-invert max-w-none text-gray-700 dark:text-gray-300 whitespace-pre-line leading-relaxed text-md">
                                    {person.biography}
                                </div>
                            </div>
                        )}

                        <div className="space-y-16">
                            {credits.length > 0 && (
                                <div>
                                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-8 flex items-center gap-2">
                                        Known For
                                        <span className="text-sm font-normal text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-[#1e1e1e] px-2 py-0.5 rounded-full">
                                            {credits.length} items
                                        </span>
                                    </h3>
                                    
                                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                                        {credits.map((show: Show) => (
                                            <ShowCard 
                                                key={`role-${show.id}-${show.media_type}`}
                                                show={show} 
                                                onShowClick={handleShowClick} 
                                                userList={userList} 
                                                userFavorites={userFavorites}
                                                handleUpdateListStatus={handleUpdateListStatus} 
                                            />
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default StaffPage;
