
import React from 'react';
import { useSEO } from '../hooks/useSEO';

const PartnersPage = () => {
    useSEO('Partners', 'Partner with Watchlistey.');

    return (
        <div className="min-h-screen bg-white dark:bg-[#0f0f0f] pt-32 pb-16 transition-colors duration-200">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-16">
                    <h1 className="text-4xl font-extrabold text-gray-900 dark:text-white mb-6">Our Partners</h1>
                    <p className="text-xl text-gray-500 dark:text-gray-400 max-w-2xl mx-auto">
                        We collaborate with industry leaders to provide the best data and experience for our users.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-20">
                    <div className="bg-gray-50 dark:bg-[#1e1e1e] p-8 rounded-2xl flex flex-col items-center text-center">
                        <img src="https://www.themoviedb.org/assets/2/v4/logos/v2/blue_square_2-d537fb228cf3ded904ef09b136fe3fec72548ebc1fea3fbbd1ad9e36364db38b.svg" alt="TMDB" className="h-20 mb-6" />
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">The Movie Database</h3>
                        <p className="text-gray-600 dark:text-gray-400 mb-6">
                            Our primary source for movie, TV show, and people data. TMDB provides the comprehensive metadata that powers Watchlistey.
                        </p>
                        <a href="https://www.themoviedb.org/" target="_blank" rel="noopener noreferrer" className="text-brand-primary font-semibold hover:underline">Visit TMDB</a>
                    </div>
                    <div className="bg-gray-50 dark:bg-[#1e1e1e] p-8 rounded-2xl flex flex-col items-center text-center">
                        <div className="h-20 w-20 bg-brand-primary/10 dark:bg-brand-primary/10 rounded-full flex items-center justify-center mb-6 text-3xl">📺</div>
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Streaming Data</h3>
                        <p className="text-gray-600 dark:text-gray-400 mb-6">
                            We integrate with various streaming availability providers to help you find where to watch your favorite content.
                        </p>
                        <span className="text-gray-400">Coming Soon</span>
                    </div>
                </div>

                <div className="bg-brand-primary/10 rounded-3xl p-12 text-center">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Become a Partner</h2>
                    <p className="text-gray-600 dark:text-gray-300 mb-8 max-w-xl mx-auto">
                        Are you a streaming service, data provider, or media outlet? We'd love to work together to improve content discovery.
                    </p>
                    <a href="/contact" className="inline-block px-8 py-3 bg-brand-primary text-black font-bold rounded-lg hover:bg-brand-primary/90 transition-colors">
                        Get in Touch
                    </a>
                </div>
            </div>
        </div>
    );
};
export default PartnersPage;
