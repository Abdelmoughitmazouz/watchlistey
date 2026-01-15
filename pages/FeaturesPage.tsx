import React from 'react';
import { useSEO } from '../hooks/useSEO';
import { ListIcon, HeartIcon, StarIcon, UserIconV2, SearchIconV2, FilterIcon } from '../constants';
import { useTranslation } from 'react-i18next';

const FeatureCard = ({ icon: Icon, title, description }: { icon: any, title: string, description: string }) => (
    <div className="bg-gray-50 dark:bg-[#1e1e1e] p-8 rounded-xl border border-gray-100 dark:border-gray-800 hover:shadow-md transition-shadow">
        <div className="w-12 h-12 bg-white dark:bg-[#2a2a2a] rounded-lg flex items-center justify-center mb-6 shadow-sm">
            <Icon className="w-6 h-6 text-blue-600 dark:text-brand-primary" />
        </div>
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">{title}</h3>
        <p className="text-gray-600 dark:text-gray-400 leading-relaxed">{description}</p>
    </div>
);

const FeaturesPage = () => {
    const { t } = useTranslation();
    useSEO(t('footer.links.features'), 'Discover the powerful features of MyList.');

    return (
        <div className="min-h-screen bg-white dark:bg-[#0f0f0f] pt-32 pb-16 transition-colors duration-200">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center max-w-3xl mx-auto mb-16">
                    <h1 className="text-4xl font-extrabold text-gray-900 dark:text-white sm:text-5xl mb-4">
                        Everything you need to manage your watchlists.
                    </h1>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    <FeatureCard 
                        icon={ListIcon}
                        title="Smart Lists"
                        description="Create unlimited lists to organize your movies and shows."
                    />
                    <FeatureCard 
                        icon={HeartIcon}
                        title="Favorites"
                        description="Highlight your all-time favorites."
                    />
                    <FeatureCard 
                        icon={SearchIconV2}
                        title="Advanced Search"
                        description="Find exactly what you're looking for with powerful search filters."
                    />
                </div>
            </div>
        </div>
    );
};

export default FeaturesPage;