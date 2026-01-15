import React from 'react';
import { useSEO } from '../hooks/useSEO';
import { useTranslation } from 'react-i18next';

const ContactPage = () => {
    const { t } = useTranslation();
    useSEO(t('footer.links.contact'), 'Get in touch with the MyList team.');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        alert("Thanks for reaching out!");
    };

    return (
        <div className="min-h-screen bg-white dark:bg-[#0f0f0f] pt-32 pb-16 transition-colors duration-200">
            <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-12">
                    <h1 className="text-4xl font-extrabold text-gray-900 dark:text-white mb-4">{t('footer.links.contact')}</h1>
                </div>

                <div className="bg-gray-50 dark:bg-[#1e1e1e] rounded-2xl p-8 shadow-sm border border-gray-100 dark:border-gray-800">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('auth.email')}</label>
                            <input type="email" className="block w-full rounded-lg border-gray-300 dark:border-gray-700 bg-white dark:bg-[#2a2a2a] shadow-sm p-3" required />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Message</label>
                            <textarea rows={4} className="block w-full rounded-lg border-gray-300 dark:border-gray-700 bg-white dark:bg-[#2a2a2a] shadow-sm p-3" required></textarea>
                        </div>
                        <button type="submit" className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-bold text-black bg-brand-primary hover:bg-brand-primary/90 transition-colors">
                            Send
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default ContactPage;