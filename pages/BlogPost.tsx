
import React, { useEffect } from 'react';
import { BLOG_POSTS } from '../lib/blogData';
import { useSEO } from '../hooks/useSEO';
import { ChevronLeftIcon, ArrowRightIcon, BookmarkIconSolid, ListIcon } from '../constants';
import NotFoundPage from './NotFoundPage';

interface BlogPostProps {
    slug: string;
    onNavigate: (path: string) => void;
    onBack: () => void;
}

const BlogPost: React.FC<BlogPostProps> = ({ slug, onNavigate, onBack }) => {
    const post = BLOG_POSTS.find(p => p.slug === slug);

    useSEO(
        post?.title, 
        post?.metaDescription, 
        post?.coverImage
    );

    useEffect(() => {
        window.scrollTo(0, 0);
    }, [slug]);

    if (!post) {
        return <NotFoundPage onNavigate={onNavigate} />;
    }

    const handleItemClick = (itemSlug: string) => {
        // Ensure slug starts with /
        const path = itemSlug.startsWith('/') ? itemSlug : `/${itemSlug}`;
        onNavigate(path);
    };

    return (
        <div className="min-h-screen bg-white dark:bg-[#0f0f0f] pb-16 pt-24 transition-colors duration-200">
            {/* Schema Injection */}
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(post.schema) }} />

            <article className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header Section */}
                <div className="max-w-4xl mx-auto mb-12 text-center sm:text-left">
                    <button 
                        onClick={() => onNavigate('/blog')} 
                        className="inline-flex items-center text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-brand-primary dark:hover:text-brand-primary mb-8 transition-colors"
                    >
                        <ChevronLeftIcon className="w-4 h-4 mr-1 rtl:rotate-180" /> Back to Blog
                    </button>
                    
                    <h1 className="text-3xl md:text-5xl lg:text-6xl font-extrabold text-gray-900 dark:text-white mb-6 leading-tight tracking-tight">
                        {post.h1}
                    </h1>
                    
                    <div className="flex flex-wrap items-center justify-center sm:justify-start gap-6 text-sm text-gray-600 dark:text-gray-400 border-b border-gray-200 dark:border-gray-800 pb-8">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-brand-primary flex items-center justify-center text-black font-bold text-xs shadow-sm">
                                W
                            </div>
                            <span className="font-medium text-gray-900 dark:text-white">{post.author}</span>
                        </div>
                        <span className="hidden sm:inline">•</span>
                        <time dateTime={post.publishDate}>{new Date(post.publishDate).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}</time>
                        <span className="hidden sm:inline">•</span>
                        <span className="flex items-center gap-1"><ListIcon className="w-4 h-4" /> {post.items.length} Items</span>
                    </div>
                </div>

                {/* Content Layout */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 max-w-7xl mx-auto">
                    
                    {/* Main Article */}
                    <div className="lg:col-span-8">
                        
                        {/* SEO Intro */}
                        <div 
                            className="prose prose-lg dark:prose-invert max-w-none text-gray-700 dark:text-gray-300 mb-16 leading-relaxed"
                            dangerouslySetInnerHTML={{ __html: post.intro }}
                        />

                        {/* List Items */}
                        <div className="space-y-16">
                            {post.items.map((item, index) => (
                                <div key={index} className="flex flex-col gap-6 p-6 sm:p-8 bg-gray-50 dark:bg-[#151515] rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm hover:shadow-md transition-shadow group">
                                    {/* H2 Title for SEO Hierarchy */}
                                    <div className="flex items-baseline gap-3 border-b border-gray-200 dark:border-gray-800 pb-4">
                                        <span className="text-4xl font-black text-gray-300 dark:text-gray-700 select-none tracking-tighter">
                                            #{index + 1}
                                        </span>
                                        <h2 
                                            className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-brand-primary cursor-pointer transition-colors"
                                            onClick={() => handleItemClick(item.slug)}
                                        >
                                            {item.title} <span className="text-lg sm:text-xl font-normal text-gray-500">({item.year})</span>
                                        </h2>
                                    </div>

                                    <div className="flex flex-col sm:flex-row gap-6 sm:gap-8">
                                        <div 
                                            className="w-full sm:w-40 h-60 flex-shrink-0 rounded-xl overflow-hidden cursor-pointer relative shadow-lg bg-gray-200 dark:bg-gray-800"
                                            onClick={() => handleItemClick(item.slug)}
                                        >
                                            <img 
                                                src={item.image} 
                                                alt={item.title} 
                                                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                                loading="lazy"
                                                referrerPolicy="no-referrer"
                                            />
                                        </div>
                                        
                                        <div className="flex-1 flex flex-col justify-between">
                                            <div>
                                                {/* Similarity Angle Badge */}
                                                <div className="mb-4">
                                                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] sm:text-xs font-bold uppercase tracking-wider bg-blue-100 text-blue-800 dark:bg-brand-primary/10 dark:text-brand-primary border border-blue-200 dark:border-brand-primary/20">
                                                        <BookmarkIconSolid className="w-3 h-3" />
                                                        Why it matches: {item.similarityAngle}
                                                    </span>
                                                </div>

                                                <div 
                                                    className="text-gray-700 dark:text-gray-300 text-base sm:text-lg leading-relaxed mb-6"
                                                    dangerouslySetInnerHTML={{ __html: item.description }}
                                                />
                                            </div>

                                            <div className="mt-auto pt-4 border-t border-gray-100 dark:border-gray-800/50">
                                                <button 
                                                    onClick={() => handleItemClick(item.slug)}
                                                    className="inline-flex items-center text-sm font-bold text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-brand-primary transition-colors group/btn"
                                                >
                                                    View Details & Rating 
                                                    <ArrowRightIcon className="w-4 h-4 ml-1 transform group-hover/btn:translate-x-1 transition-transform rtl:rotate-180" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Soft Conversion / Conclusion */}
                        <div className="mt-16 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-purple-900/20 p-8 rounded-2xl border border-blue-100 dark:border-blue-800/50 text-center sm:text-left">
                            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Build Your Ultimate Watchlist</h3>
                            <div 
                                className="prose dark:prose-invert max-w-none text-gray-700 dark:text-gray-300 mb-8"
                                dangerouslySetInnerHTML={{ __html: post.conclusion }}
                            />
                            <button 
                                onClick={() => onNavigate('/signup')}
                                className="w-full sm:w-auto px-8 py-3.5 bg-brand-primary text-black font-bold rounded-xl hover:bg-brand-primary/90 transition-all transform hover:-translate-y-0.5 shadow-lg shadow-brand-primary/20"
                            >
                                Start Tracking Now - Free
                            </button>
                        </div>

                    </div>

                    {/* Sidebar / Internal Linking */}
                    <div className="lg:col-span-4 space-y-8">
                        <div className="sticky top-24">
                            <div className="bg-white dark:bg-[#151515] p-6 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm">
                                <h3 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4 border-l-4 border-brand-primary pl-3">
                                    Related Collections
                                </h3>
                                <ul className="space-y-2">
                                    {post.internalLinks.map((link, i) => (
                                        <li key={i}>
                                            <button 
                                                className="text-sm text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-brand-primary transition-colors text-left w-full hover:bg-gray-50 dark:hover:bg-[#1e1e1e] p-2.5 rounded-lg -ml-2.5 font-medium"
                                                onClick={() => onNavigate(link.url)}
                                            >
                                                {link.text}
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            <div className="mt-8 bg-gray-50 dark:bg-[#1e1e1e] p-6 rounded-xl border border-gray-200 dark:border-gray-800">
                                <h3 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4">
                                    Trending Now
                                </h3>
                                <div className="space-y-4">
                                    {/* Placeholder for trending widget - could be dynamic */}
                                    <div className="flex gap-3 cursor-pointer group" onClick={() => onNavigate('/search?type=movie')}>
                                        <div className="w-16 h-24 bg-gray-200 dark:bg-gray-800 rounded-md overflow-hidden flex-shrink-0">
                                            <img src="https://image.tmdb.org/t/p/w200/q6y0Go1tsGEsmtFryDOJo3dEmqu.jpg" className="w-full h-full object-cover group-hover:scale-105 transition-transform" alt="Shawshank Redemption" referrerPolicy="no-referrer" />
                                        </div>
                                        <div className="min-w-0">
                                            <h4 className="font-bold text-gray-900 dark:text-white text-sm group-hover:text-brand-primary transition-colors line-clamp-2">The Shawshank Redemption</h4>
                                            <p className="text-xs text-gray-500 mt-1">1994 • Drama</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-3 cursor-pointer group" onClick={() => onNavigate('/search?type=tv')}>
                                        <div className="w-16 h-24 bg-gray-200 dark:bg-gray-800 rounded-md overflow-hidden flex-shrink-0">
                                            <img src="https://image.tmdb.org/t/p/w200/ggFHVNu6YYI5L9pCfOacjizRGt.jpg" className="w-full h-full object-cover group-hover:scale-105 transition-transform" alt="Breaking Bad" referrerPolicy="no-referrer" />
                                        </div>
                                        <div className="min-w-0">
                                            <h4 className="font-bold text-gray-900 dark:text-white text-sm group-hover:text-brand-primary transition-colors line-clamp-2">Breaking Bad</h4>
                                            <p className="text-xs text-gray-500 mt-1">2008 • Crime</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                </div>
            </article>
        </div>
    );
};

export default BlogPost;
