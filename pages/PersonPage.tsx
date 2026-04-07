
import React, { useEffect, useState, useMemo } from 'react';
import { getPersonDetails, getPersonCredits, slugify, getShowIdFromSlug } from '../lib/tmdb';
import { Show, ListItem } from '../types';
import ShowCard from '../components/ShowCard';
import { ChevronLeftIcon, HeartIcon, UserPlaceholderIcon } from '../constants';
import { useSEO } from '../hooks/useSEO';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';
import NotFoundPage from './NotFoundPage';
import { useTranslation } from 'react-i18next';

interface PersonPageProps {
    personId: string; // Can be ID or slug
    onNavigate: (path: string) => void;
    onBack: () => void;
    userList: Record<number, ListItem>;
    userFavorites?: Record<number, ListItem>;
    userCharacters?: Record<number, ListItem>;
    handleUpdateListStatus: (showId: number, status: any, show?: any) => void;
    handleToggleFavorite?: (show: Show) => void;
}

const PersonPage: React.FC<PersonPageProps> = ({ personId, onNavigate, onBack, userList, userFavorites, userCharacters = {}, handleUpdateListStatus, handleToggleFavorite }) => {
    const { t, i18n } = useTranslation();
    const [person, setPerson] = useState<any>(null);
    const [credits, setCredits] = useState<{ cast: Show[], crew: Show[] }>({ cast: [], crew: [] });
    const [loading, setLoading] = useState(true);
    const [likesCount, setLikesCount] = useState(0);
    const [notFound, setNotFound] = useState(false);

    // --- SEO ---
    useSEO(
        person ? `${person.name}` : 'Person', 
        person ? `Learn more about ${person.name}. ${person.known_for_department || 'Actor'}. ${person.biography ? person.biography.substring(0, 100) : ''}` : undefined,
        person?.profile_path ? (person.profile_path.startsWith('http') ? person.profile_path : `https://image.tmdb.org/t/p/w500${person.profile_path}`) : undefined,
        person?.name
    );

    const schemaData = person ? {
        "@context": "https://schema.org",
        "@type": "Person",
        "name": person.name,
        "image": person.profile_path ? (person.profile_path.startsWith('http') ? person.profile_path : `https://image.tmdb.org/t/p/w500${person.profile_path}`) : undefined,
        "description": person.biography,
        "birthDate": person.birthday,
        "jobTitle": person.known_for_department
    } : null;

    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            setNotFound(false);
            try {
                let idToFetch: number | null = parseInt(personId);
                
                if (isNaN(idToFetch)) {
                    const tmdbId = await getShowIdFromSlug(personId, 'person', i18n.language);
                    if (tmdbId) {
                        idToFetch = tmdbId;
                    }
                }

                if (idToFetch) {
                    const personData = await getPersonDetails(idToFetch, i18n.language);
                    
                    if (personData) {
                        const creditsData = await getPersonCredits(idToFetch, i18n.language);
                        setPerson(personData);
                        setCredits(creditsData);
                        
                        // Load likes
                        if (isSupabaseConfigured) {
                            const { count } = await supabase
                                .from('characters')
                                .select('*', { count: 'exact', head: true })
                                .eq('person_id', idToFetch);
                            setLikesCount(count || 0);
                        } else {
                            setLikesCount(((idToFetch % 1000) * 12 + 45));
                        }
                    } else {
                        setNotFound(true);
                    }
                } else {
                    setNotFound(true);
                }
            } catch (error) {
                console.error("Failed to fetch person data", error);
                setNotFound(true);
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, [personId, i18n.language]);

    const handleShowClick = (show: Show) => {
        const slug = slugify(show.title);
        const prefix = show.is_anime ? '/anime/' : show.media_type === 'tv' ? '/tv/' : '/movie/';
        onNavigate(`${prefix}${slug}`);
    };

    const isFavorite = person && userCharacters[person.id]?.status === 'Favorite';

    const handleToggleFavoritePerson = () => {
        if (!person) return;
        
        const newStatus = isFavorite ? null : 'Favorite';
        const personShowObj: Show = {
            id: person.id,
            title: person.name,
            description: person.known_for_department ? `Known for ${person.known_for_department}` : '',
            image_url: person.profile_path ? (person.profile_path.startsWith('http') ? person.profile_path : `https://image.tmdb.org/t/p/w500${person.profile_path}`) : 'https://via.placeholder.com/400x600?text=No+Image',
            backdrop_url: '', 
            rating: person.popularity || 0,
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

    const groupCreditsByYear = (list: Show[]) => {
        const groups: Record<number, Show[]> = {};
        const unknownYear: Show[] = [];

        list.forEach(show => {
            if (show.year && show.year > 0) {
                if (!groups[show.year]) groups[show.year] = [];
                groups[show.year].push(show);
            } else {
                unknownYear.push(show);
            }
        });

        const sortedYears = Object.keys(groups).map(Number).sort((a, b) => b - a);
        
        return { sortedYears, groups, unknownYear };
    };

    const groupedCast = useMemo(() => groupCreditsByYear(credits.cast), [credits.cast]);

    const getKnownFor = () => {
        const dept = person.known_for_department;
        if (dept === 'Acting') return t('person.department_acting');
        if (dept === 'Voice Acting') return t('person.department_voice_acting');
        return dept;
    }

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center bg-white dark:bg-[#0f0f0f]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-primary"></div>
            </div>
        );
    }

    if (notFound || !person) {
        return <NotFoundPage onNavigate={onNavigate} />;
    }

    const renderProfileImage = () => {
        if (person.profile_path) {
            const src = person.profile_path.startsWith('http') 
                ? person.profile_path 
                : `https://image.tmdb.org/t/p/h632${person.profile_path}`;
            
            return (
                <img 
                    src={src} 
                    alt={person.name} 
                    className="w-full h-auto object-cover"
                    loading="eager"
                />
            );
        }
        return (
            <div className="w-full aspect-[2/3] bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                <UserPlaceholderIcon className="w-24 h-24 text-gray-400 dark:text-gray-500" />
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-[#0f0f0f] pb-12 pt-18 md:pt-20 transition-colors duration-200">
            {schemaData && (
                <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaData) }} />
            )}

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="flex flex-col md:flex-row gap-8 lg:gap-12">
                    
                    <div className="w-full md:w-1/3 lg:w-1/4 flex-shrink-0">
                        <div className="sticky top-24 max-h-[calc(100vh-8rem)] overflow-y-auto pr-2 scrollbar-hide">
                            <div className="md:hidden mb-4">
                                <button onClick={onBack} className="flex items-center gap-1 text-gray-600 dark:text-gray-300 font-medium rtl:flex-row-reverse">
                                    <ChevronLeftIcon className="w-5 h-5 rtl:rotate-180" /> {t('common.back')}
                                </button>
                            </div>

                            <div className="rounded-lg overflow-hidden shadow-lg bg-white dark:bg-[#1e1e1e] mb-6">
                                {renderProfileImage()}
                            </div>
                            <div className="space-y-4 text-gray-900 dark:text-white pb-4 text-start">
                                <div>
                                    <h3 className="text-lg font-semibold border-b border-gray-200 dark:border-gray-700 pb-2 mb-3">{t('person.personal_info')}</h3>
                                </div>
                                <div>
                                    <span className="block text-sm font-medium text-gray-500 dark:text-gray-400">
                                        {t('person.tmdb_id')}
                                    </span>
                                    <span className="block font-medium">#{person.id}</span>
                                </div>
                                <div>
                                    <span className="block text-sm font-medium text-gray-500 dark:text-gray-400">{t('person.known_for')}</span>
                                    <span className="block font-medium">{getKnownFor()}</span>
                                </div>
                                {person.gender !== undefined && person.gender !== 0 && (
                                    <div>
                                        <span className="block text-sm font-medium text-gray-500 dark:text-gray-400">{t('person.gender')}</span>
                                        <span className="block">{person.gender === 1 ? t('person.gender_female') : person.gender === 2 ? t('person.gender_male') : '-'}</span>
                                    </div>
                                )}
                                {person.birthday && (
                                    <div>
                                        <span className="block text-sm font-medium text-gray-500 dark:text-gray-400">
                                            {t('person.birthday')}
                                        </span>
                                        <span className="block">{person.birthday}</span>
                                    </div>
                                )}
                                {person.place_of_birth && (
                                    <div>
                                        <span className="block text-sm font-medium text-gray-500 dark:text-gray-400">
                                            {t('person.place_of_birth')}
                                        </span>
                                        <span className="block">{person.place_of_birth}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="flex-1 min-w-0">
                        <div className="mb-8 border-b border-gray-200 dark:border-gray-800 pb-6">
                            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                                <div>
                                    <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 dark:text-white tracking-tight mb-2 text-start">
                                        {person.name}
                                    </h1>
                                    <p className="text-lg text-gray-500 dark:text-gray-400 font-medium text-start">
                                        {getKnownFor()}
                                    </p>
                                </div>
                                
                                <div className="flex items-center gap-4 bg-gray-50 dark:bg-[#1e1e1e] p-2 pr-6 rounded-full border border-gray-200 dark:border-gray-800 self-start sm:self-auto">
                                    <button 
                                        onClick={handleToggleFavoritePerson}
                                        className={`p-3 rounded-full transition-all duration-300 shadow-sm ${
                                            isFavorite 
                                            ? 'bg-red-500 text-white hover:bg-red-600 transform scale-105' 
                                            : 'bg-white dark:bg-black text-gray-400 hover:text-red-500 border border-gray-200 dark:border-gray-700'
                                        }`}
                                        title={isFavorite ? t('common.remove') : t('status.favorite')}
                                    >
                                        <HeartIcon solid={isFavorite} className="w-6 h-6" />
                                    </button>
                                    <div className="flex flex-col">
                                        <span className={`text-xl font-bold leading-none ${isFavorite ? 'text-gray-900 dark:text-white' : 'text-gray-600 dark:text-gray-400'}`}>
                                            {likesCount.toLocaleString()}
                                        </span>
                                        <span className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold">
                                            {t('details.favorites')}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        {person.biography && (
                            <div className="mb-10 text-start">
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">{t('person.biography')}</h3>
                                <div className="prose dark:prose-invert max-w-none text-gray-700 dark:text-gray-300 whitespace-pre-line leading-relaxed text-md">
                                    {person.biography}
                                </div>
                            </div>
                        )}

                        <div className="space-y-16">
                            {credits.cast.length > 0 && (
                                <div>
                                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-8 flex items-center gap-2 text-start">
                                        {t('person.acting_history')}
                                        <span className="text-sm font-normal text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-[#1e1e1e] px-2 py-0.5 rounded-full">
                                            {credits.cast.length}
                                        </span>
                                    </h3>
                                    
                                    <div className="relative border-s-2 border-gray-200 dark:border-gray-800 ml-3 md:ml-4 rtl:ml-0 rtl:mr-3 rtl:md:mr-4 space-y-12 pb-4">
                                        {groupedCast.sortedYears.map((year) => (
                                            <div key={year} className="relative pl-8 md:pl-12 rtl:pl-0 rtl:pr-8 rtl:md:pr-12">
                                                <span className="absolute -left-[9px] rtl:left-auto rtl:-right-[9px] top-1.5 h-4 w-4 rounded-full bg-brand-primary ring-4 ring-white dark:ring-[#0f0f0f]" />
                                                <div className="flex flex-col gap-4">
                                                    <h4 className="text-2xl font-bold text-gray-900 dark:text-white leading-none opacity-40 text-start">{year}</h4>
                                                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                                                        {groupedCast.groups[year].map(show => (
                                                            <ShowCard 
                                                                key={`cast-${show.id}-${show.media_type}`}
                                                                show={show} 
                                                                onShowClick={() => handleShowClick(show)} 
                                                                userList={userList} 
                                                                userFavorites={userFavorites}
                                                                handleUpdateListStatus={handleUpdateListStatus} 
                                                                handleToggleFavorite={handleToggleFavorite}
                                                            />
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                        {groupedCast.unknownYear.length > 0 && (
                                             <div className="relative pl-8 md:pl-12 rtl:pl-0 rtl:pr-8 rtl:md:pr-12">
                                                <span className="absolute -left-[9px] rtl:left-auto rtl:-right-[9px] top-1.5 h-4 w-4 rounded-full bg-gray-300 dark:bg-gray-600 ring-4 ring-white dark:ring-[#0f0f0f]" />
                                                <div className="flex flex-col gap-4">
                                                    <h4 className="text-2xl font-bold text-gray-500 dark:text-gray-400 leading-none opacity-40 text-start">Unknown</h4>
                                                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                                                        {groupedCast.unknownYear.map(show => (
                                                            <ShowCard 
                                                                key={`cast-${show.id}-${show.media_type}`}
                                                                show={show} 
                                                                onShowClick={() => handleShowClick(show)} 
                                                                userList={userList} 
                                                                userFavorites={userFavorites}
                                                                handleUpdateListStatus={handleUpdateListStatus} 
                                                                handleToggleFavorite={handleToggleFavorite}
                                                            />
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        )}
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

export default PersonPage;
