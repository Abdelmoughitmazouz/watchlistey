
import React from 'react';
import { useSEO } from '../hooks/useSEO';
import { MailIcon } from '../constants';

const SupportPage = () => {
    useSEO('Support', 'Get help with your account and MyList features.');

    return (
        <div className="min-h-screen bg-white dark:bg-[#0f0f0f] pt-32 pb-16 transition-colors duration-200">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-16">
                    <h1 className="text-4xl font-extrabold text-gray-900 dark:text-white mb-4">Support Team</h1>
                    <p className="text-xl text-gray-500 dark:text-gray-400">
                        We're here to help you get the most out of MyList.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
                    <div className="bg-blue-50 dark:bg-blue-900/10 p-8 rounded-2xl border border-blue-100 dark:border-blue-900/30">
                        <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Account Access</h3>
                        <p className="text-gray-600 dark:text-gray-300 mb-6">
                            Trouble logging in? Need to reset your password or update your email?
                        </p>
                        <a href="/forgot-password" className="text-blue-600 dark:text-brand-primary font-semibold hover:underline">Reset Password →</a>
                    </div>
                    <div className="bg-green-50 dark:bg-green-900/10 p-8 rounded-2xl border border-green-100 dark:border-green-900/30">
                        <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Billing & Plans</h3>
                        <p className="text-gray-600 dark:text-gray-300 mb-6">
                            Questions about your subscription? Want to upgrade to MyList Pro?
                        </p>
                        <a href="#" className="text-green-600 dark:text-green-400 font-semibold hover:underline">Manage Subscription →</a>
                    </div>
                </div>

                <div className="bg-gray-50 dark:bg-[#1e1e1e] rounded-2xl p-8 flex flex-col md:flex-row items-center justify-between gap-6">
                    <div>
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Still need help?</h3>
                        <p className="text-gray-600 dark:text-gray-400">Our support team is available Mon-Fri, 9am-5pm.</p>
                    </div>
                    <a href="/contact" className="flex items-center gap-2 px-6 py-3 bg-gray-900 dark:bg-white text-white dark:text-black rounded-lg font-semibold hover:opacity-90 transition-opacity">
                        <MailIcon className="w-5 h-5" /> Contact Support
                    </a>
                </div>
            </div>
        </div>
    );
};

export default SupportPage;
