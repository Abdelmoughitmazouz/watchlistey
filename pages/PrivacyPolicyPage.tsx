
import React from 'react';
import { useSEO } from '../hooks/useSEO';

const PrivacyPolicyPage = () => {
    useSEO('Privacy Policy', 'Read our Privacy Policy to understand how we collect and use your data.');

    return (
        <div className="min-h-screen bg-white dark:bg-[#0f0f0f] pt-32 pb-16 transition-colors duration-200">
            <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">Privacy Policy</h1>
                <div className="prose dark:prose-invert max-w-none text-gray-600 dark:text-gray-300 leading-relaxed">
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">Last updated: May 20, 2025</p>

                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white mt-8 mb-4">1. Information We Collect</h3>
                    <p>We collect information you provide directly to us, such as when you create an account, update your profile, or communicate with us. This may include your name, email address, and profile picture. We also collect data about your usage of the Service, such as the movies and shows you track.</p>

                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white mt-8 mb-4">2. How We Use Your Information</h3>
                    <p>We use the information we collect to provide, maintain, and improve our services, to develop new ones, and to protect Watchlistey and our users. Specifically, we use your information to:</p>
                    <ul className="list-disc list-inside ml-4 mt-2 space-y-1">
                        <li>Create and maintain your account</li>
                        <li>Process your watchlist updates</li>
                        <li>Send you technical notices and support messages</li>
                        <li>Communicate with you about news and updates</li>
                    </ul>

                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white mt-8 mb-4">3. Information Sharing</h3>
                    <p>We do not share your personal information with companies, organizations, or individuals outside of Watchlistey except in the following cases: with your consent, for legal reasons, or for external processing by trusted partners (e.g., database hosting).</p>

                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white mt-8 mb-4">4. Data Security</h3>
                    <p>We use reasonable security measures to protect your personal information. However, no method of transmission over the Internet or method of electronic storage is 100% secure.</p>

                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white mt-8 mb-4">5. Cookies</h3>
                    <p>We use cookies and similar technologies to collect information about your activity, browser, and device. You can instruct your browser to refuse all cookies or to indicate when a cookie is being sent.</p>

                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white mt-8 mb-4">6. Changes to this Policy</h3>
                    <p>We may change this privacy policy from time to time. We will post any privacy policy changes on this page and, if the changes are significant, we will provide a more prominent notice.</p>
                </div>
            </div>
        </div>
    );
};

export default PrivacyPolicyPage;
