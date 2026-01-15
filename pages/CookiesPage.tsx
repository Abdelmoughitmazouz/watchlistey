
import React from 'react';
import { useSEO } from '../hooks/useSEO';

const CookiesPage = () => {
    useSEO('Cookies Policy', 'Information about how we use cookies.');

    return (
        <div className="min-h-screen bg-white dark:bg-[#0f0f0f] pt-32 pb-16 transition-colors duration-200">
            <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">Cookie Policy</h1>
                <div className="prose dark:prose-invert max-w-none text-gray-600 dark:text-gray-300 leading-relaxed">
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">Last updated: May 20, 2025</p>
                    
                    <p>This Cookie Policy explains how Watchlistey ("we", "us", and "our") uses cookies and similar technologies to recognize you when you visit our website.</p>

                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white mt-8 mb-4">What are cookies?</h3>
                    <p>Cookies are small data files that are placed on your computer or mobile device when you visit a website. Cookies are widely used by website owners in order to make their websites work, or to work more efficiently, as well as to provide reporting information.</p>

                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white mt-8 mb-4">Why do we use cookies?</h3>
                    <p>We use first-party and third-party cookies for several reasons. Some cookies are required for technical reasons in order for our Website to operate, and we refer to these as "essential" or "strictly necessary" cookies. Other cookies also enable us to track and target the interests of our users to enhance the experience on our Online Properties.</p>

                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white mt-8 mb-4">Types of cookies we use</h3>
                    <ul className="list-disc list-inside ml-4 mt-2 space-y-2">
                        <li><strong>Essential cookies:</strong> These are strictly necessary to provide you with services available through our Website and to use some of its features, such as access to secure areas.</li>
                        <li><strong>Performance and functionality cookies:</strong> These are used to enhance the performance and functionality of our Website but are non-essential to their use.</li>
                        <li><strong>Analytics and customization cookies:</strong> These collect information that is used either in aggregate form to help us understand how our Website is being used or how effective our marketing campaigns are.</li>
                    </ul>

                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white mt-8 mb-4">How can I control cookies?</h3>
                    <p>You have the right to decide whether to accept or reject cookies. You can exercise your cookie rights by setting your browser preferences.</p>
                </div>
            </div>
        </div>
    );
};
export default CookiesPage;
