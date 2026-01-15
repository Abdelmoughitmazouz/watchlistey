import React from 'react';
import { useSEO } from '../hooks/useSEO';
import { useTranslation } from 'react-i18next';

const AboutPage = () => {
    const { t } = useTranslation();
    useSEO(t('footer.links.about'), 'Learn more about MyList, our mission, and the team behind the platform.');

    return (
        <div className="min-h-screen bg-white dark:bg-[#0f0f0f] pt-32 pb-16 transition-colors duration-200">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center max-w-3xl mx-auto mb-16">
                    <h1 className="text-4xl font-extrabold text-gray-900 dark:text-white sm:text-5xl mb-4">
                        We're changing how you discover entertainment.
                    </h1>
                    <p className="text-xl text-gray-500 dark:text-gray-400">
                        MyList is the ultimate platform for movie and TV lovers to track, share, and discover new favorites.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center mb-20">
                    <div className="relative h-96 rounded-2xl overflow-hidden shadow-xl">
                        <img 
                            src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80" 
                            alt="Team working" 
                            className="absolute inset-0 w-full h-full object-cover"
                        />
                    </div>
                    <div className="space-y-6">
                        <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Our Mission</h2>
                        <p className="text-lg text-gray-600 dark:text-gray-300 leading-relaxed">
                            We believe that finding something great to watch shouldn't be a chore. In a world of endless streaming options, MyList serves as your personal curator and social hub.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AboutPage;