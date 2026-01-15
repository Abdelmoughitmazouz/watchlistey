
import React, { useEffect, useState } from 'react';
import { GENRES, discoverMedia, slugify, getPopularPeople } from '../lib/tmdb';
import { Show } from '../types';
import { useSEO } from '../hooks/useSEO';
import { UploadCloudIcon, CalendarIcon } from '../constants';

interface SitemapPageProps {
    onNavigate: (path: string) => void;
}

// Icons for the dashboard
const MovieIcon = () => (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />
    </svg>
);
const TvIcon = () => (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
);
const PersonIcon = () => (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
);

const SitemapPage: React.FC<SitemapPageProps> = ({ onNavigate }) => {
    useSEO('Sitemap Generator', 'Generate XML sitemaps and view database statistics.');

    // Stats State
    const [stats, setStats] = useState({
        movies: 0,
        tv: 0,
        people: 0
    });
    const [statsLoading, setStatsLoading] = useState(true);

    // Massive Generator State
    const [isGenerating, setIsGenerating] = useState(false);
    const [progress, setProgress] = useState(0);
    const [statusMessage, setStatusMessage] = useState('Ready to generate');
    const [generatedCount, setGeneratedCount] = useState(0);
    const [categoryCounts, setCategoryCounts] = useState({ movies: 0, tv: 0 });

    // Year Generator State
    const [yearStart, setYearStart] = useState(2026); // Default to future
    const [yearEnd, setYearEnd] = useState(2000);     // Default range 2026 -> 2000
    const [isGeneratingYearly, setIsGeneratingYearly] = useState(false);
    const [yearlyProgress, setYearlyProgress] = useState(0);
    const [yearlyStatus, setYearlyStatus] = useState('Ready to generate');
    const [yearlyCount, setYearlyCount] = useState(0);

    useEffect(() => {
        const fetchStats = async () => {
            setStatsLoading(true);
            try {
                // Fetch totals from APIs (Page 1 request includes total_results)
                const [movies, tv] = await Promise.all([
                    discoverMedia('movie', {}, 1),
                    discoverMedia('tv', {}, 1)
                ]);
                setStats({
                    movies: movies.total_results,
                    tv: tv.total_results,
                    people: 0 // Placeholder
                });
            } catch (e) {
                console.error("Failed to load stats", e);
            } finally {
                setStatsLoading(false);
            }
        };
        fetchStats();
    }, []);

    const staticRoutes = [
        { name: 'Home', path: '/' },
        { name: 'Search', path: '/search' },
        { name: 'My List', path: '/my-list' },
        { name: 'Login', path: '/login' },
        { name: 'Register', path: '/signup' },
        { name: 'Settings', path: '/settings' },
        { name: 'About', path: '/about' },
        { name: 'Features', path: '/features' },
        { name: 'Contact', path: '/contact' },
        { name: 'Support', path: '/support' },
        { name: 'Help', path: '/help' },
        { name: 'Terms', path: '/terms' },
        { name: 'Privacy', path: '/privacy' },
        { name: 'Mobile App', path: '/mobile-app' },
    ];

    const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

    const downloadXml = (xml: string, filename: string) => {
        const blob = new Blob([xml], { type: 'text/xml' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    // Helper for XML escaping
    const escapeXml = (unsafe: string) => {
        if (!unsafe) return '';
        return unsafe.replace(/[<>&'"]/g, (c) => {
            switch (c) {
                case '<': return '&lt;';
                case '>': return '&gt;';
                case '&': return '&amp;';
                case '\'': return '&apos;';
                case '"': return '&quot;';
                default: return c;
            }
        });
    }

    const generateMassiveSitemap = async () => {
        setIsGenerating(true);
        setProgress(0);
        setGeneratedCount(0);
        setCategoryCounts({ movies: 0, tv: 0 });
        
        const allShows = new Map<string, Show>();
        
        try {
            // Target: ~10,000 items total
            // 2500 per category => 125 pages * 20 items (Adjusted for just Movie/TV)
            // Let's do 250 pages each to get ~10k
            const TARGET_PAGES = 250; 

            // 1. Fetch Movies
            for (let i = 1; i <= TARGET_PAGES; i++) {
                setStatusMessage(`Fetching Movies (Page ${i}/${TARGET_PAGES})...`);
                const data = await discoverMedia('movie', {}, i);
                data.results.forEach(s => {
                    if (s.id && s.title) allShows.set(`movie-${s.id}`, s);
                });
                
                const currentCount = allShows.size;
                setGeneratedCount(currentCount);
                setCategoryCounts(prev => ({ ...prev, movies: data.results.length + prev.movies }));
                setProgress(Math.round((i / (TARGET_PAGES * 2)) * 100));
                
                await delay(200); // Rate limit protection
            }

            // 2. Fetch TV Shows
            for (let i = 1; i <= TARGET_PAGES; i++) {
                setStatusMessage(`Fetching TV Shows (Page ${i}/${TARGET_PAGES})...`);
                const data = await discoverMedia('tv', {}, i);
                data.results.forEach(s => {
                    if (s.id && s.title) allShows.set(`tv-${s.id}`, s);
                });

                setGeneratedCount(allShows.size);
                setCategoryCounts(prev => ({ ...prev, tv: prev.tv + data.results.length }));
                setProgress(50 + Math.round((i / (TARGET_PAGES * 2)) * 100));
                await delay(200);
            }

            setStatusMessage("Compiling XML file with Image Extensions...");
            
            const baseUrl = 'https://www.watchlistey.com';
            const date = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
            
            // Add Image Namespace
            let xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">`;

            // Static Routes
            staticRoutes.forEach(route => {
                xml += `
  <url>
    <loc>${baseUrl}${route.path}</loc>
    <lastmod>${date}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>`;
            });

            // Genres
            Object.values(GENRES).forEach(genre => {
                xml += `
  <url>
    <loc>${baseUrl}/genre/${slugify(genre)}</loc>
    <lastmod>${date}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`;
            });

            // Dynamic Items
            let validItemsCount = 0;
            allShows.forEach(show => {
                const slug = slugify(show.title);
                if (!slug) return; // Skip invalid slugs

                let prefix = '/movie/';
                if (show.media_type === 'tv') prefix = '/tv/';
                
                const path = `${prefix}${slug}`;
                validItemsCount++;
                
                // Add Image Sitemap Extension tags
                let imageTag = '';
                if (show.image_url && !show.image_url.includes('placeholder')) {
                    imageTag = `
    <image:image>
      <image:loc>${escapeXml(show.image_url)}</image:loc>
      <image:title>${escapeXml(show.title)}</image:title>
    </image:image>`;
                }

                xml += `
  <url>
    <loc>${baseUrl}${path}</loc>
    <lastmod>${date}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>${imageTag}
  </url>`;
            });

            xml += `\n</urlset>`;

            downloadXml(xml, 'sitemap.xml');

            setStatusMessage(`Success! Generated sitemap with ${validItemsCount + staticRoutes.length + Object.values(GENRES).length} URLs and Image Tags.`);
            
        } catch (error) {
            console.error(error);
            setStatusMessage("Error generating sitemap. Please check console and try again.");
        } finally {
            setIsGenerating(false);
        }
    };

    const generateYearlySitemap = async () => {
        setIsGeneratingYearly(true);
        setYearlyProgress(0);
        setYearlyCount(0);
        setYearlyStatus('Checking existing sitemap...');
        
        try {
            // 1. Fetch existing sitemap.xml to avoid duplicates
            const existingUrls = new Set<string>();
            try {
                const res = await fetch('/sitemap.xml');
                if (res.ok) {
                    const text = await res.text();
                    const regex = /<loc>(.*?)<\/loc>/g;
                    let match;
                    while ((match = regex.exec(text)) !== null) {
                        existingUrls.add(match[1].trim());
                    }
                }
            } catch (e) {
                console.warn("Could not fetch existing sitemap.xml", e);
            }

            const baseUrl = 'https://www.watchlistey.com';
            const date = new Date().toISOString().split('T')[0];
            const newUrls = new Map<string, Show>(); // Store full show for image data
            
            const start = yearStart;
            const end = yearEnd;
            const isDescending = start > end;
            const totalYears = Math.abs(end - start) + 1;

            // Limits Per Year
            const MOVIES_PAGES = 50;   // 1000 items/year
            const TV_PAGES = 50;       // 1000 items/year
            
            // One-time People Fetch
            const PEOPLE_PAGES = 100;  // 2000 people

            // Helper to fetch in batches to respect rate limits better
            const fetchInBatches = async (fetchFn: (p: number) => Promise<any>, totalPages: number, statusPrefix: string) => {
                const results = [];
                const BATCH_SIZE = 5; // Parallel requests
                for (let p = 1; p <= totalPages; p += BATCH_SIZE) {
                    const endP = Math.min(p + BATCH_SIZE - 1, totalPages);
                    setYearlyStatus(`${statusPrefix} (Page ${p}-${endP})...`);
                    
                    const batchPromises = [];
                    for (let i = 0; i < BATCH_SIZE && p + i <= totalPages; i++) {
                        batchPromises.push(fetchFn(p + i));
                    }
                    
                    const batchResults = await Promise.all(batchPromises);
                    results.push(...batchResults);
                    
                    // Update progress slightly within year
                    // Rate limit protection
                    await delay(300); 
                }
                return results;
            };

            // 2. Fetch Popular People (Independent of Year, done once)
            const peopleData = await fetchInBatches(
                (p) => getPopularPeople(p),
                PEOPLE_PAGES,
                `Fetching Profiles`
            );
            
            peopleData.forEach(res => {
                 const items = Array.isArray(res) ? res : (res.results || []);
                 items.forEach((person: Show) => {
                     const slug = slugify(person.title);
                     if (!slug) return;
                     const fullUrl = `${baseUrl}/person/${slug}`;
                     if (!existingUrls.has(fullUrl)) {
                         newUrls.set(fullUrl, person);
                     }
                 });
            });
            setYearlyCount(newUrls.size);


            // 3. Iterate Years
            for (let i = 0; i < totalYears; i++) {
                const y = isDescending ? start - i : start + i;
                const yearStr = y.toString();
                
                // 2a. Movies
                const movies = await fetchInBatches(
                    (p) => discoverMedia('movie', { year: yearStr }, p), 
                    MOVIES_PAGES, 
                    `Year ${y}: Movies`
                );

                // 2b. TV
                const tv = await fetchInBatches(
                    (p) => discoverMedia('tv', { year: yearStr }, p), 
                    TV_PAGES, 
                    `Year ${y}: TV Shows`
                );

                // Process all results
                const processItems = (responseArray: any[]) => {
                     responseArray.forEach(res => {
                        const items = Array.isArray(res) ? res : (res.results || []);
                        items.forEach((show: Show) => {
                            const slug = slugify(show.title);
                            if (!slug) return;

                            let prefix = '/movie/';
                            if (show.media_type === 'tv') prefix = '/tv/';

                            const fullUrl = `${baseUrl}${prefix}${slug}`;
                            
                            // Check duplication
                            if (!existingUrls.has(fullUrl)) {
                                newUrls.set(fullUrl, show);
                            }
                        });
                    });
                };

                processItems(movies);
                processItems(tv);

                setYearlyCount(newUrls.size);
                setYearlyProgress(Math.round(((i + 1) / totalYears) * 100));
            }

            if (newUrls.size === 0) {
                setYearlyStatus("No new unique URLs found.");
                setIsGeneratingYearly(false);
                return;
            }

            setYearlyStatus("Compiling new sitemap with Image Tags...");

            // 4. Generate XML
            let xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">`;
            
            newUrls.forEach((show, url) => {
                let imageTag = '';
                if (show.image_url && !show.image_url.includes('placeholder')) {
                    imageTag = `
    <image:image>
      <image:loc>${escapeXml(show.image_url)}</image:loc>
      <image:title>${escapeXml(show.title)}</image:title>
    </image:image>`;
                }

                 xml += `
  <url>
    <loc>${url}</loc>
    <lastmod>${date}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>${imageTag}
  </url>`;
            });
            xml += `\n</urlset>`;

            downloadXml(xml, `sitemap-${yearStart}-${yearEnd}.xml`);
            setYearlyStatus(`Done! Generated ${newUrls.size} new URLs with images.`);

        } catch (e) {
            console.error(e);
            setYearlyStatus("Error generating yearly sitemap.");
        } finally {
            setIsGeneratingYearly(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-[#0f0f0f] pb-12 pt-32 transition-colors duration-200">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                
                {/* 1. Database Stats Dashboard */}
                <div className="mb-8">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Database Statistics</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        <StatCard 
                            label="Movies Indexed" 
                            count={stats.movies} 
                            loading={statsLoading}
                            icon={<MovieIcon />} 
                            color="bg-blue-500"
                        />
                        <StatCard 
                            label="TV Shows Indexed" 
                            count={stats.tv} 
                            loading={statsLoading}
                            icon={<TvIcon />} 
                            color="bg-purple-500"
                        />
                         <StatCard 
                            label="Profiles" 
                            count={stats.people > 0 ? stats.people : '10k+'} 
                            loading={statsLoading}
                            icon={<PersonIcon />} 
                            color="bg-yellow-500"
                        />
                    </div>
                </div>

                {/* 2. Massive Generator Section */}
                <div className="bg-white dark:bg-[#1e1e1e] rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-8 mb-8">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-6">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Sitemap Generator</h1>
                            <p className="text-gray-500 dark:text-gray-400 max-w-2xl">
                                Generate a massive <code className="bg-gray-100 dark:bg-[#2a2a2a] px-1.5 py-0.5 rounded text-sm">sitemap.xml</code> containing ~10,000 of the most popular items to boost your SEO. 
                                Upload the downloaded file to your website's <span className="font-mono text-xs bg-gray-100 dark:bg-[#2a2a2a] px-1 py-0.5 rounded">public/</span> folder.
                            </p>
                        </div>
                        <div className="flex flex-col gap-2 w-full md:w-auto">
                            <button 
                                onClick={generateMassiveSitemap}
                                disabled={isGenerating || isGeneratingYearly}
                                className={`flex items-center justify-center gap-2 px-6 py-3 text-white rounded-lg font-bold shadow-md transition-all ${isGenerating ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 hover:scale-105 active:scale-95'}`}
                            >
                                {isGenerating ? (
                                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                ) : (
                                    <UploadCloudIcon className="w-6 h-6" />
                                )}
                                <span>{isGenerating ? 'Generating...' : 'Generate 10k Sitemap'}</span>
                            </button>
                        </div>
                    </div>

                    {/* Progress Indicator */}
                    {(isGenerating || generatedCount > 0) && !isGeneratingYearly && (
                        <div className="bg-blue-50 dark:bg-blue-900/10 p-6 rounded-lg border border-blue-100 dark:border-blue-900/30 mb-8">
                            <div className="flex justify-between items-center mb-3">
                                <span className="font-semibold text-blue-800 dark:text-blue-200 flex items-center gap-2">
                                    {isGenerating ? <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div> : <div className="w-2 h-2 bg-green-500 rounded-full"></div>}
                                    {statusMessage}
                                </span>
                                <span className="text-lg font-bold text-blue-700 dark:text-blue-300">{generatedCount.toLocaleString()} items</span>
                            </div>
                            
                            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 mb-4 overflow-hidden">
                                <div 
                                    className="bg-blue-600 h-full rounded-full transition-all duration-300 ease-out relative" 
                                    style={{ width: `${progress}%` }}
                                >
                                    <div className="absolute inset-0 bg-white/20 animate-[shimmer_2s_infinite]"></div>
                                </div>
                            </div>

                            {/* Breakdown */}
                            <div className="grid grid-cols-2 md:grid-cols-2 gap-4 text-sm">
                                <div className="bg-white/50 dark:bg-black/20 p-2 rounded">Movies: <span className="font-bold">{categoryCounts.movies}</span></div>
                                <div className="bg-white/50 dark:bg-black/20 p-2 rounded">TV Shows: <span className="font-bold">{categoryCounts.tv}</span></div>
                            </div>
                        </div>
                    )}
                </div>

                {/* 3. Yearly Generator Section */}
                <div className="bg-white dark:bg-[#1e1e1e] rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-8 mb-8">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-6">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Yearly Archive Generator</h1>
                            <p className="text-gray-500 dark:text-gray-400 max-w-2xl">
                                Generate a deep sitemap (~50,000 items) for specific years. Includes Movies, TV, and <strong>Profile Pages</strong>.
                            </p>
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-4 items-end">
                         <div className="w-full sm:w-40">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Start Year</label>
                            <input 
                                type="number" 
                                value={yearStart}
                                onChange={(e) => setYearStart(parseInt(e.target.value))}
                                className="w-full px-4 py-2.5 bg-gray-50 dark:bg-[#2a2a2a] border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none dark:text-white"
                            />
                        </div>
                        <div className="w-full sm:w-40">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">End Year</label>
                            <input 
                                type="number" 
                                value={yearEnd}
                                onChange={(e) => setYearEnd(parseInt(e.target.value))}
                                className="w-full px-4 py-2.5 bg-gray-50 dark:bg-[#2a2a2a] border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none dark:text-white"
                            />
                        </div>
                         <button 
                            onClick={generateYearlySitemap}
                            disabled={isGenerating || isGeneratingYearly}
                            className={`flex items-center justify-center gap-2 px-6 py-3 text-white rounded-lg font-bold shadow-md transition-all h-[46px] ${isGeneratingYearly ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700 hover:scale-105 active:scale-95'}`}
                        >
                            {isGeneratingYearly ? (
                                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            ) : (
                                <CalendarIcon />
                            )}
                            <span>{isGeneratingYearly ? 'Generating...' : 'Generate Deep Archive'}</span>
                        </button>
                    </div>

                    {/* Yearly Progress Indicator */}
                    {(isGeneratingYearly || yearlyCount > 0) && !isGenerating && (
                        <div className="mt-6 bg-green-50 dark:bg-green-900/10 p-6 rounded-lg border border-green-100 dark:border-green-900/30">
                            <div className="flex justify-between items-center mb-3">
                                <span className="font-semibold text-green-800 dark:text-green-200 flex items-center gap-2">
                                    {isGeneratingYearly ? <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div> : <div className="w-2 h-2 bg-green-500 rounded-full"></div>}
                                    {yearlyStatus}
                                </span>
                                <span className="text-lg font-bold text-green-700 dark:text-green-300">{yearlyCount.toLocaleString()} new items</span>
                            </div>
                            
                            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 mb-1 overflow-hidden">
                                <div 
                                    className="bg-green-600 h-full rounded-full transition-all duration-300 ease-out relative" 
                                    style={{ width: `${yearlyProgress}%` }}
                                >
                                    <div className="absolute inset-0 bg-white/20 animate-[shimmer_2s_infinite]"></div>
                                </div>
                            </div>
                        </div>
                    )}

                </div>

                <div className="mt-8 border-t border-gray-200 dark:border-gray-800 pt-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Static Pages Included in Base Generator</h3>
                    <div className="flex flex-wrap gap-2">
                        {staticRoutes.map(route => (
                            <a 
                                key={route.path}
                                href={route.path}
                                onClick={(e) => { e.preventDefault(); onNavigate(route.path); }}
                                className="px-3 py-1.5 bg-gray-100 dark:bg-[#2a2a2a] text-gray-600 dark:text-gray-300 rounded-md text-sm hover:bg-gray-200 dark:hover:bg-[#333] transition-colors"
                            >
                                {route.name}
                            </a>
                        ))}
                    </div>
                </div>

            </div>
        </div>
    );
};

const StatCard = ({ label, count, loading, icon, color }: any) => (
    <div className="bg-white dark:bg-[#1e1e1e] p-6 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
        <div className={`p-3 rounded-lg ${color} bg-opacity-10 text-${color.replace('bg-', '')}`}>
            {/* Clone icon to enforce size/color if needed, or rely on wrapper */}
            <div className={`text-${color.replace('bg-', '')}-600 dark:text-${color.replace('bg-', '')}-400`}>
                {icon}
            </div>
        </div>
        <div>
            <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400 font-semibold mb-1">{label}</p>
            {loading ? (
                <div className="h-8 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
            ) : (
                <p className="text-2xl font-extrabold text-gray-900 dark:text-white">
                    {count > 0 ? count.toLocaleString() : '-'}
                </p>
            )}
        </div>
    </div>
);

export default SitemapPage;
