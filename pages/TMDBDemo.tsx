
import React, { useEffect, useState } from 'react';
import { getShowsWithDetails, getTrendingTV, slugify } from '../lib/tmdb';
import { Show, ListItem } from '../types';
import ShowCard from '../components/ShowCard';

// Mock props for reusing ShowCard
const mockUserList: Record<number, ListItem> = {};
const mockHandleUpdateListStatus = () => {};

const TMDBDemo: React.FC<{ onNavigate: (path: string) => void }> = ({ onNavigate }) => {
    const [movies, setMovies] = useState<Show[]>([]);
    const [tvShows, setTvShows] = useState<Show[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadData = async () => {
            try {
                setLoading(true);
                // Fetch Trending Movies WITH FULL DETAILS (Cast, Gallery, etc.)
                // This uses the new N+1 fetch pattern to ensure full cast list is available
                const movieData = await getShowsWithDetails('/trending/movie/week');
                
                // Standard fetch for TV (basic info only until clicked)
                const tvData = await getTrendingTV('week');
                
                setMovies(movieData);
                setTvShows(tvData);
            } catch (error) {
                console.error("Failed to fetch TMDB data", error);
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, []);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-primary mx-auto mb-4"></div>
                    <p className="text-gray-500">Fetching lists and hydrating full details...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-gray-50 min-h-screen py-12">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-12">
                    <h1 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">TMDB API Integration Demo</h1>
                    <p className="mt-4 text-lg text-gray-500">
                        Demonstrating <code>getShowsWithDetails</code> to fetch full cast lists upfront.
                    </p>
                    <button 
                        onClick={() => onNavigate('/')}
                        className="mt-6 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-black bg-brand-primary hover:bg-brand-primary/90"
                    >
                        Back to Home
                    </button>
                </div>

                {/* Movies Section */}
                <section className="mb-16">
                    <div className="flex items-baseline gap-3 mb-6">
                        <h2 className="text-2xl font-bold text-gray-900">Trending Movies</h2>
                        <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded-full">Full Details Loaded</span>
                    </div>
                    <p className="mb-6 text-sm text-gray-600">
                        These items have their full cast list loaded immediately. Click any item to confirm.
                    </p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
                        {movies.slice(0, 10).map(show => (
                            <ShowCard 
                                key={show.id} 
                                show={show} 
                                userList={mockUserList} // Placeholder
                                handleUpdateListStatus={mockHandleUpdateListStatus} // Placeholder
                                onShowClick={() => {
                                    console.log("Full details for", show.title, show);
                                    const slug = slugify(show.title);
                                    const prefix = show.media_type === 'tv' ? '/tv/' : '/movie/';
                                    onNavigate(`${prefix}${slug}`); 
                                }}
                            />
                        ))}
                    </div>
                </section>

                {/* TV Shows Section */}
                <section>
                    <h2 className="text-2xl font-bold text-gray-900 mb-6">Trending TV Shows (Standard)</h2>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
                        {tvShows.slice(0, 10).map(show => (
                            <ShowCard 
                                key={show.id} 
                                show={show} 
                                userList={mockUserList} // Placeholder
                                handleUpdateListStatus={mockHandleUpdateListStatus} // Placeholder
                            />
                        ))}
                    </div>
                </section>
            </div>
        </div>
    );
};

export default TMDBDemo;
