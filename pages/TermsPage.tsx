
import React from 'react';
import { useSEO } from '../hooks/useSEO';

const TermsPage = () => {
    useSEO('Terms of Service', 'Read our Terms of Service regarding your use of Watchlistey.');

    return (
        <div className="min-h-screen bg-white dark:bg-[#0f0f0f] pt-32 pb-16 transition-colors duration-200">
            <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">Terms of Service</h1>
                <div className="prose dark:prose-invert max-w-none text-gray-600 dark:text-gray-300 leading-relaxed">
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">Last updated: May 20, 2025</p>
                    
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white mt-8 mb-4">1. Acceptance of Terms</h3>
                    <p>By accessing and using Watchlistey ("the Service"), you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by these terms, please do not use this Service.</p>

                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white mt-8 mb-4">2. Description of Service</h3>
                    <p>Watchlistey provides users with tools to track movies and TV shows, create lists, and view information provided by third-party APIs (such as TMDB). The Service is provided "as is" and is subject to change or termination at any time.</p>

                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white mt-8 mb-4">3. User Accounts</h3>
                    <p>You are responsible for maintaining the confidentiality of your password and account and are fully responsible for all activities that occur under your password or account. You agree to notify us immediately of any unauthorized use of your account.</p>

                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white mt-8 mb-4">4. User Content</h3>
                    <p>You retain all rights to any data, text, graphics, or other materials you submit, post or display on or through the Service ("User Content"). By submitting User Content, you grant us a worldwide, non-exclusive, royalty-free license to use, copy, reproduce, process, adapt, modify, publish, transmit, display and distribute such content.</p>

                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white mt-8 mb-4">5. Third-Party Services</h3>
                    <p>Our Service uses data from The Movie Database (TMDB). By using our Service, you also acknowledge and agree to be bound by TMDB's terms of use.</p>

                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white mt-8 mb-4">6. Termination</h3>
                    <p>We may terminate or suspend access to our Service immediately, without prior notice or liability, for any reason whatsoever, including without limitation if you breach the Terms.</p>
                </div>
            </div>
        </div>
    );
};

export default TermsPage;
