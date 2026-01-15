
import React from 'react';
import { GENRES } from '../lib/tmdb';
import { StarIcon, FilterIcon, SearchIconV2 } from '../constants';
import { useTranslation } from 'react-i18next';

// Manually add "Anime" to the genre list for filtering if needed, but remove from main types
const GENRE_LIST = ['Anime', ...Array.from(new Set(Object.values(GENRES))).filter(g => g !== 'Anime').sort()];

interface FilterSidebarProps {
    selectedType?: 'all' | 'movie' | 'tv' | 'person' | 'user';
    onTypeChange?: (type: 'all' | 'movie' | 'tv' | 'person' | 'user') => void;
    selectedGenres: string[];
    onGenreToggle: (genre: string) => void;
    minRating: number;
    onMinRatingChange: (rating: number) => void;
    year: string;
    onYearChange: (year: string) => void;
    status: string;
    onStatusChange: (status: string) => void;
    seasonCount: string;
    onSeasonCountChange: (count: string) => void;
    
    // New Props
    language?: string;
    onLanguageChange?: (lang: string) => void;
    minEpisodes?: string;
    onMinEpisodesChange?: (count: string) => void;

    isOpen: boolean;
    activeFiltersCount: number;
    onClearFilters: () => void;
    searchQuery?: string;
    onSearchChange?: (query: string) => void;
}

const FilterSidebar: React.FC<FilterSidebarProps> = ({
    selectedType = 'all',
    onTypeChange,
    selectedGenres,
    onGenreToggle,
    minRating,
    onMinRatingChange,
    year,
    onYearChange,
    status,
    onStatusChange,
    seasonCount,
    onSeasonCountChange,
    language = '',
    onLanguageChange,
    minEpisodes = '',
    onMinEpisodesChange,
    isOpen,
    activeFiltersCount,
    onClearFilters,
    searchQuery,
    onSearchChange,
}) => {
    const { t } = useTranslation();

    return (
        <aside className={`lg:w-64 flex-shrink-0 ${isOpen ? 'block' : 'hidden lg:block'}`}>
            <div className="sticky top-24 max-h-[calc(100vh-8rem)] overflow-y-auto scrollbar-hide transition-colors duration-200 pe-2">
                <div className="flex items-center justify-between mb-6 px-1">
                    <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2 text-lg">
                         <FilterIcon className="w-5 h-5" /> {t('search.filters')}
                    </h3>
                    {activeFiltersCount > 0 && (
                        <button 
                            onClick={onClearFilters}
                            className="text-xs font-semibold text-blue-600 dark:text-brand-primary hover:underline"
                        >
                            {t('search.clear_all')}
                        </button>
                    )}
                </div>

                {/* Search Input */}
                {onSearchChange && (
                    <div className="mb-8">
                        <div className="relative">
                            <input
                                type="text"
                                placeholder={t('nav.search_placeholder')}
                                value={searchQuery}
                                onChange={(e) => onSearchChange(e.target.value)}
                                className="w-full ps-10 pe-4 py-2.5 bg-white dark:bg-white/5 border border-gray-300 dark:border-white/10 rounded-lg text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-brand-primary focus:border-transparent transition-all"
                            />
                            <SearchIconV2 className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 rtl:flip" />
                        </div>
                    </div>
                )}
                
                {/* Type Filter */}
                {onTypeChange && (
                    <div className="mb-8">
                        <h4 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4">{t('search.media_type')}</h4>
                        <div className="space-y-3">
                            {[
                                { id: 'all', label: t('common.view_all') },
                                { id: 'movie', label: t('nav.movies') },
                                { id: 'tv', label: t('nav.tv') },
                                { id: 'person', label: t('search.people') },
                                { id: 'user', label: t('search.users') }
                            ].map((type) => (
                                <label key={type.id} className="flex items-center gap-3 cursor-pointer group">
                                    <div className={`w-4 h-4 rounded-full border flex items-center justify-center transition-colors ${selectedType === type.id ? 'border-blue-500 border-4 dark:border-brand-primary' : 'border-gray-400 dark:border-gray-600 group-hover:border-blue-400 dark:group-hover:border-brand-primary'}`}>
                                    </div>
                                    <input 
                                        type="radio" 
                                        name="mediaType" 
                                        className="hidden" 
                                        checked={selectedType === type.id}
                                        onChange={() => onTypeChange(type.id as any)}
                                    />
                                    <span className={`text-sm ${selectedType === type.id ? 'font-bold text-gray-900 dark:text-white' : 'text-gray-600 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-gray-200'}`}>
                                        {type.label}
                                    </span>
                                </label>
                            ))}
                        </div>
                    </div>
                )}

                {/* Rest of filters - using logical layout */}
                {/* Genres Filter (Hidden for Person/User) */}
                {selectedType !== 'person' && selectedType !== 'user' && (
                    <div className="mb-8">
                        <h4 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4">{t('common.genres')}</h4>
                        <div className="flex flex-wrap gap-2">
                            {GENRE_LIST.map(genre => {
                                const isActive = selectedGenres.includes(genre);
                                return (
                                    <button
                                        key={genre}
                                        onClick={() => onGenreToggle(genre)}
                                        className={`px-3 py-1.5 text-xs rounded-full border transition-all font-medium flex items-center gap-1 ${
                                            isActive 
                                            ? 'bg-blue-600 border-blue-600 text-white dark:bg-brand-primary dark:border-brand-primary dark:text-black' 
                                            : 'bg-transparent border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-gray-400 dark:hover:border-gray-500'
                                        }`}
                                    >
                                        {t(`genres.${genre}`, genre)}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Rating Filter (Hidden for Person/User) */}
                {selectedType !== 'person' && selectedType !== 'user' && (
                    <div className="mb-8">
                            <div className="flex items-center justify-between mb-4">
                            <h4 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t('search.min_rating')}</h4>
                            <span className="text-xs font-bold text-gray-900 dark:text-white flex items-center bg-gray-100 dark:bg-[#2a2a2a] px-2 py-1 rounded">
                                <StarIcon className="w-3 h-3 text-yellow-500 me-1" /> {minRating > 0 ? minRating : 'Any'}
                            </span>
                        </div>
                        <input 
                            type="range" 
                            min="0" 
                            max="10" 
                            step="1" 
                            value={minRating}
                            onChange={(e) => onMinRatingChange(parseInt(e.target.value))}
                            className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-600 dark:accent-brand-primary rtl:direction-ltr"
                        />
                        <div className="flex justify-between mt-2 text-[10px] font-medium text-gray-400 rtl:flex-row-reverse">
                            <span>0</span>
                            <span>5</span>
                            <span>10</span>
                        </div>
                    </div>
                )}

            </div>
        </aside>
    );
};

export default FilterSidebar;
