import React from 'react';
import { useSEO } from '../hooks/useSEO';
import { useTranslation } from 'react-i18next';

const MobileAppPage = () => {
    const { t } = useTranslation();
    useSEO(t('footer.links.mobile'), 'Download the Watchlistey mobile app.');

    return (
        <div className="min-h-screen bg-white dark:bg-[#0f0f0f] pt-32 pb-16 transition-colors duration-200">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center gap-12">
                <div className="flex-1 text-center md:text-start">
                    <div className="inline-block bg-brand-primary/10 text-brand-primary dark:text-yellow-400 font-bold px-4 py-1.5 rounded-full text-sm mb-6 border border-brand-primary/20">
                        {t('common.tba')}
                    </div>
                    <h1 className="text-4xl md:text-6xl font-extrabold text-gray-900 dark:text-white mb-6 tracking-tight">
                        Your Watchlist,<br/>
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-primary to-yellow-200">in your pocket.</span>
                    </h1>
                    <p className="text-xl text-gray-500 dark:text-gray-400 mb-8 leading-relaxed max-w-xl">
                        We are building the ultimate mobile experience.
                    </p>
                </div>
            </div>
        </div>
    );
};
export default MobileAppPage;