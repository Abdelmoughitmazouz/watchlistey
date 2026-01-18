import React, { useEffect, useState } from 'react';
import JSZip from 'jszip';
import { GENRES, discoverMedia, slugify, getPopularPeople, searchSpecific } from '../lib/tmdb';
import { Show } from '../types';
import { useSEO } from '../hooks/useSEO';
import { UploadCloudIcon, CalendarIcon } from '../constants';

interface SitemapPageProps {
    onNavigate: (path: string) => void;
}

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
    useSEO('Sitemap Center', 'Generate categorized and chunked sitemaps for optimal indexing.');

    const [stats, setStats] = useState({ movies: 0, tv: 0, people: 0 });
    const [statsLoading, setStatsLoading] = useState(true);
    const [isGenerating, setIsGenerating] = useState(false);
    const [progress, setProgress] = useState(0);
    const [statusMessage, setStatusMessage] = useState('Ready to generate');
    const [counts, setCounts] = useState({ movies: 0, tv: 0, people: 0, networks: 0 });

    useEffect(() => {
        const fetchStats = async () => {
            setStatsLoading(true);
            try {
                const [movies, tv] = await Promise.all([
                    discoverMedia('movie', {}, 1),
                    discoverMedia('tv', {}, 1)
                ]);
                setStats({
                    movies: movies.total_results,
                    tv: tv.total_results,
                    people: 1000000 // TMDB has a lot
                });
            } catch (e) {
                console.error(e);
            } finally {
                setStatsLoading(false);
            }
        };
        fetchStats();
    }, []);

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
    };

    const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

    const generateSitemapXml = (items: Show[], baseUrl: string) => {
        const date = new Date().toISOString().split('T')[0];
        let xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">`;
        
        items.forEach(item => {
            const slug = slugify(item.title);
            if (!slug) return;
            
            let path = '/';
            if (item.media_type === 'movie') path = `/movie/${slug}`;
            else if (item.media_type === 'tv') path = `/tv/${slug}`;
            else if (item.media_type === 'person') path = `/person/${slug}`;
            /* FIX: Removed the direct comparison item.media_type === 'company' because 'company' is not in the media_type union type, 
               which caused a TypeScript error. We now solely rely on (item as any).media_type. */
            else if ((item as any).media_type === 'company') path = `/network/${slug}`;

            let imageTag = '';
            if (item.image_url && !item.image_url.includes('placeholder')) {
                imageTag = `\n    <image:image>\n      <image:loc>${escapeXml(item.image_url)}</image:loc>\n      <image:title>${escapeXml(item.title)}</image:title>\n    </image:image>`;
            }

            xml += `\n  <url>\n    <loc>${baseUrl}${path}</loc>\n    <lastmod>${date}</lastmod>\n    <changefreq>monthly</changefreq>\n    <priority>0.6</priority>${imageTag}\n  </url>`;
        });

        xml += `\n</urlset>`;
        return xml;
    };

    const fetchAllData = async () => {
        setIsGenerating(true);
        setProgress(0);
        setCounts({ movies: 0, tv: 0, people: 0, networks: 0 });
        
        const zip = new JSZip();
        const baseUrl = 'https://www.watchlistey.com';
        const CHUNK_SIZE = 5000;
        const ITEMS_PER_PAGE = 20;

        try {
            // 1. Movies (25,000 items -> 5 files)
            const movieItems: Show[] = [];
            const MOVIE_TOTAL = 25000;
            const MOVIE_PAGES = MOVIE_TOTAL / ITEMS_PER_PAGE;
            
            for (let i = 1; i <= MOVIE_PAGES; i++) {
                setStatusMessage(`Fetching Movies (Page ${i}/${MOVIE_PAGES})...`);
                const data = await discoverMedia('movie', {}, i);
                if (!data.results.length) break;
                movieItems.push(...data.results);
                setCounts(prev => ({ ...prev, movies: movieItems.length }));
                setProgress(Math.round((i / (MOVIE_PAGES * 3)) * 100));
                if (i % 10 === 0) await delay(150); // Be kind to API
            }

            // 2. TV Shows (15,000 items -> 3 files)
            const tvItems: Show[] = [];
            const TV_TOTAL = 15000;
            const TV_PAGES = TV_TOTAL / ITEMS_PER_PAGE;
            
            for (let i = 1; i <= TV_PAGES; i++) {
                setStatusMessage(`Fetching TV Shows (Page ${i}/${TV_PAGES})...`);
                const data = await discoverMedia('tv', {}, i);
                if (!data.results.length) break;
                tvItems.push(...data.results);
                setCounts(prev => ({ ...prev, tv: tvItems.length }));
                setProgress(33 + Math.round((i / (TV_PAGES * 3)) * 100));
                if (i % 10 === 0) await delay(150);
            }

            // 3. People (5,000 items -> 1 file)
            const personItems: Show[] = [];
            const PERSON_PAGES = CHUNK_SIZE / ITEMS_PER_PAGE;
            for (let i = 1; i <= PERSON_PAGES; i++) {
                setStatusMessage(`Fetching Popular People (Page ${i}/${PERSON_PAGES})...`);
                const data = await getPopularPeople(i);
                if (!data.length) break;
                personItems.push(...data);
                setCounts(prev => ({ ...prev, people: personItems.length }));
                setProgress(66 + Math.round((i / (PERSON_PAGES * 3)) * 100));
                if (i % 10 === 0) await delay(150);
            }

            // 4. Networks (5,000 items -> 1 file)
            const networkItems: Show[] = [];
            const NETWORK_PAGES = CHUNK_SIZE / ITEMS_PER_PAGE;
            for (let i = 1; i <= NETWORK_PAGES; i++) {
                setStatusMessage(`Fetching Networks (Page ${i}/${NETWORK_PAGES})...`);
                // Use specific search for companies/networks with broad queries to harvest
                const data = await searchSpecific('a', 'company', i);
                if (!data.results.length) break;
                const mapped = data.results.map(n => ({
                    id: n.id,
                    title: n.name,
                    media_type: 'company' as any,
                    image_url: n.logo_path ? `https://image.tmdb.org/t/p/w200${n.logo_path}` : '',
                    year: 0,
                    description: '',
                    rating: 0,
                    backdrop_url: '',
                    genres: []
                }));
                networkItems.push(...mapped);
                setCounts(prev => ({ ...prev, networks: networkItems.length }));
                if (i % 10 === 0) await delay(150);
            }

            setStatusMessage("Finalizing chunks and generating ZIP...");

            // Helper to chunk and add to zip
            const chunkAndAdd = (arr: Show[], namePrefix: string) => {
                for (let i = 0; i < arr.length; i += CHUNK_SIZE) {
                    const chunk = arr.slice(i, i + CHUNK_SIZE);
                    const fileIndex = (i / CHUNK_SIZE) + 1;
                    const xml = generateSitemapXml(chunk, baseUrl);
                    zip.file(`${namePrefix}-${fileIndex}.xml`, xml);
                }
            };

            chunkAndAdd(movieItems, 'movies');
            chunkAndAdd(tvItems, 'tv-show');
            chunkAndAdd(personItems, 'person');
            chunkAndAdd(networkItems, 'network');

            // Generate ZIP
            const content = await zip.generateAsync({ type: 'blob' });
            const url = URL.createObjectURL(content);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'sitemaps.zip';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            setStatusMessage("Sitemaps bundled and downloaded successfully!");
            setProgress(100);

        } catch (error) {
            console.error(error);
            setStatusMessage("Generation failed. Check console for details.");
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-[#0f0f0f] pb-12 pt-32 transition-colors duration-200">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                
                <div className="mb-8">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Database Health</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        <StatCard label="Movies" count={stats.movies} loading={statsLoading} icon={<MovieIcon />} color="bg-blue-500" />
                        <StatCard label="TV Shows" count={stats.tv} loading={statsLoading} icon={<TvIcon />} color="bg-purple-500" />
                        <StatCard label="People" count={stats.people} loading={statsLoading} icon={<PersonIcon />} color="bg-yellow-500" />
                    </div>
                </div>

                <div className="bg-white dark:bg-[#1e1e1e] rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-8 mb-8">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-6">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Mass Sitemap Generator</h1>
                            <p className="text-gray-500 dark:text-gray-400 max-w-2xl">
                                Automatically creates chunked sitemaps (5,000 URLs per file) as requested.
                                Files included: <strong>movies (1-5), tv-show (1-3), network, and person</strong>.
                            </p>
                        </div>
                        <button 
                            onClick={fetchAllData}
                            disabled={isGenerating}
                            className={`flex items-center justify-center gap-2 px-8 py-4 text-white rounded-lg font-bold shadow-xl transition-all ${isGenerating ? 'bg-gray-400 cursor-not-allowed' : 'bg-brand-primary text-black hover:bg-brand-primary/90'}`}
                        >
                            {isGenerating ? <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin"></div> : <UploadCloudIcon className="w-6 h-6" />}
                            <span>{isGenerating ? 'Generating Bundle...' : 'Download Sitemaps ZIP'}</span>
                        </button>
                    </div>

                    {isGenerating && (
                        <div className="bg-blue-50 dark:bg-blue-900/10 p-6 rounded-lg border border-blue-100 dark:border-blue-900/30">
                            <div className="flex justify-between items-center mb-4">
                                <span className="font-semibold text-blue-800 dark:text-blue-200">{statusMessage}</span>
                                <span className="text-lg font-bold text-blue-700 dark:text-blue-300">{progress}%</span>
                            </div>
                            
                            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-4 mb-6 overflow-hidden">
                                <div className="bg-blue-600 h-full transition-all duration-300" style={{ width: `${progress}%` }}></div>
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs font-bold uppercase tracking-wider">
                                <ProgressBadge label="Movies" count={counts.movies} total={25000} />
                                <ProgressBadge label="TV Shows" count={counts.tv} total={15000} />
                                <ProgressBadge label="People" count={counts.people} total={5000} />
                                <ProgressBadge label="Networks" count={counts.networks} total={5000} />
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

const StatCard = ({ label, count, loading, icon, color }: any) => (
    <div className="bg-white dark:bg-[#1e1e1e] p-6 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm flex items-center gap-4">
        <div className={`p-3 rounded-lg ${color} bg-opacity-10 text-current`}>{icon}</div>
        <div>
            <p className="text-xs uppercase tracking-wide text-gray-500 font-bold mb-1">{label}</p>
            {loading ? <div className="h-8 w-24 bg-gray-100 dark:bg-gray-800 rounded animate-pulse"></div> : <p className="text-2xl font-extrabold">{count.toLocaleString()}</p>}
        </div>
    </div>
);

const ProgressBadge = ({ label, count, total }: any) => (
    <div className="bg-white/50 dark:bg-black/20 p-3 rounded-lg border border-white/10">
        <div className="text-gray-500 mb-1">{label}</div>
        <div className="text-lg text-gray-900 dark:text-white">{count.toLocaleString()} / {total.toLocaleString()}</div>
    </div>
);

export default SitemapPage;