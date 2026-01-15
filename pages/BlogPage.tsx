
import React from 'react';
import { BLOG_POSTS } from '../lib/blogData';
import { useSEO } from '../hooks/useSEO';
import { useTranslation } from 'react-i18next';

interface BlogPageProps {
    onNavigate: (path: string) => void;
}

const BlogPage: React.FC<BlogPageProps> = ({ onNavigate }) => {
    const { t } = useTranslation();
    useSEO('Blog - Discovery & Collections', 'Curated lists, recommendations, and deep dives into movies, TV shows, and anime.');

    const handlePostClick = (slug: string) => {
        onNavigate(`/blog/${slug}`);
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-[#0f0f0f] pb-12 pt-24 transition-colors duration-200">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center max-w-3xl mx-auto mb-16">
                    <h1 className="text-4xl font-extrabold text-gray-900 dark:text-white sm:text-5xl mb-4">
                        The Watchlistey Blog
                    </h1>
                    <p className="text-xl text-gray-500 dark:text-gray-400">
                        Curated collections, hidden gems, and recommendations for the discerning viewer.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {BLOG_POSTS.map((post) => (
                        <article 
                            key={post.id} 
                            className="bg-white dark:bg-[#1e1e1e] rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all border border-gray-200 dark:border-gray-800 cursor-pointer group"
                            onClick={() => handlePostClick(post.slug)}
                        >
                            <div className="aspect-video w-full overflow-hidden bg-gray-200 dark:bg-gray-800">
                                <img 
                                    src={post.coverImage} 
                                    alt={post.title} 
                                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                    referrerPolicy="no-referrer"
                                    loading="lazy"
                                />
                            </div>
                            <div className="p-6">
                                <div className="text-xs font-semibold tracking-wide text-blue-600 dark:text-brand-primary uppercase mb-2">
                                    Collection
                                </div>
                                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-3 line-clamp-2 group-hover:text-blue-600 dark:group-hover:text-brand-primary transition-colors">
                                    {post.h1}
                                </h2>
                                <p className="text-gray-600 dark:text-gray-400 text-sm line-clamp-3 mb-4">
                                    {post.metaDescription}
                                </p>
                                <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-500">
                                    <span>{post.author}</span>
                                    <span>{new Date(post.publishDate).toLocaleDateString()}</span>
                                </div>
                            </div>
                        </article>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default BlogPage;
