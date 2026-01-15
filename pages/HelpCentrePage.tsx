
import React from 'react';
import { useSEO } from '../hooks/useSEO';
import { ChevronDownIcon } from '../constants';

const FaqItem = ({ question, answer }: { question: string, answer: string }) => (
    <div className="border-b border-gray-200 dark:border-gray-800 py-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{question}</h3>
        <p className="text-gray-600 dark:text-gray-400 leading-relaxed">{answer}</p>
    </div>
);

const HelpCentrePage = () => {
    useSEO('Help Centre', 'Frequently asked questions and guides.');

    return (
        <div className="min-h-screen bg-white dark:bg-[#0f0f0f] pt-32 pb-16 transition-colors duration-200">
            <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-12">
                    <span className="text-blue-600 dark:text-brand-primary font-semibold tracking-wider uppercase text-sm">FAQ</span>
                    <h1 className="text-4xl font-extrabold text-gray-900 dark:text-white mt-2 mb-4">Help Centre</h1>
                    <p className="text-xl text-gray-500 dark:text-gray-400">
                        Answers to the most common questions about MyList.
                    </p>
                </div>

                <div className="space-y-2">
                    <FaqItem 
                        question="Is MyList free to use?"
                        answer="Yes! MyList is completely free to use for tracking your movies and TV shows. We may offer a Pro plan in the future with advanced features, but the core experience will always be free."
                    />
                    <FaqItem 
                        question="How do I import my data from other services?"
                        answer="You can import your lists from CSV, Excel, or JSON files via the Settings page. We support generic formats and are working on direct integrations with other platforms."
                    />
                    <FaqItem 
                        question="Can I make my profile private?"
                        answer="Absolutely. You can control the visibility of your lists in Settings > My Details. You can choose between Public, Followers Only, or Private."
                    />
                    <FaqItem 
                        question="Where does the movie data come from?"
                        answer="We use The Movie Database (TMDB) API for all our movie, TV show, and person data. It provides accurate and up-to-date information for millions of titles."
                    />
                    <FaqItem 
                        question="How do I report a bug or suggest a feature?"
                        answer="We love feedback! Please use the Contact page to send us a message, or reach out to us on our social media channels."
                    />
                </div>
            </div>
        </div>
    );
};

export default HelpCentrePage;
