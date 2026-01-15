
import React from 'react';
import { Logo } from '../constants';

interface AuthLayoutProps {
    title: string;
    subtitle?: string;
    children: React.ReactNode;
}

// Curated list of high-quality posters for the collage
const posters = [
    "https://image.tmdb.org/t/p/w500/1pdfLvkbY9ohJlCjQH2CZjjYVvJ.jpg", // Dune 2
    "https://image.tmdb.org/t/p/w500/8Gxv8gSFCU0XGDykEGv7zR1n2ua.jpg", // Oppenheimer
    "https://image.tmdb.org/t/p/w500/8Vt6mWEReuy4Of61Lnj5Xj704m8.jpg", // Spider-Man ATV
    "https://image.tmdb.org/t/p/w500/ggFHVNu6YYI5L9pCfOacjizRGt.jpg", // Breaking Bad
    "https://image.tmdb.org/t/p/w500/cMD9Ygz11xJwh1BuQQrD06yFLwe.jpg", // One Piece
    "https://image.tmdb.org/t/p/w500/fqldf2t8ztc9aiwnqbsrRm58009.jpg", // Arcane
    "https://image.tmdb.org/t/p/w500/74xTEgt7R36Fpooo50r9T25onhq.jpg", // The Batman
    "https://image.tmdb.org/t/p/w500/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg", // Interstellar
    "https://image.tmdb.org/t/p/w500/39wmItIWsg5sZMyRUKGnSxQbWtZ.jpg", // Spirited Away
    "https://image.tmdb.org/t/p/w500/u3bZgnGQ9T01sWNhyHYRnIiXQQo.jpg", // GOT
    "https://image.tmdb.org/t/p/w500/q6y0Go1tsGEsmtFryDOJo3dEmqu.jpg", // Shawshank
    "https://image.tmdb.org/t/p/w500/pB8BM7pdSp6B6Ih7QZ4DrQ3PmJK.jpg", // Fight Club
];

const AuthLayout: React.FC<AuthLayoutProps> = ({ title, subtitle, children }) => {
    return (
        <div className="min-h-screen bg-white dark:bg-[#0f0f0f] flex flex-row transition-colors duration-200">
            
            {/* Left Side: Media Gallery (Hidden on Mobile) */}
            <div className="hidden lg:flex lg:w-1/2 relative bg-[#050505] overflow-hidden flex-col justify-end">
                
                {/* Background Collage */}
                <div className="absolute inset-0 grid grid-cols-3 gap-4 p-4 opacity-40 transform scale-105">
                    {posters.map((src, i) => (
                        <div key={i} className="relative aspect-[2/3] rounded-lg overflow-hidden">
                            <img 
                                src={src} 
                                alt="" 
                                className="absolute inset-0 w-full h-full object-cover" 
                                loading="lazy"
                            />
                        </div>
                    ))}
                </div>

                {/* Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-[#050505]/60 to-transparent z-10"></div>

                {/* Content Overlay */}
                <div className="relative z-20 p-12 pb-16">
                    <div className="mb-6">
                        <div className="h-1 w-12 bg-brand-primary rounded-full mb-6"></div>
                        <blockquote className="text-2xl font-medium text-white leading-relaxed">
                            "The ultimate platform for tracking everything I watch. It's like Letterboxd and Trakt had a baby, but better."
                        </blockquote>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="flex -space-x-3">
                            <img className="w-10 h-10 rounded-full border-2 border-[#050505]" src="https://randomuser.me/api/portraits/women/44.jpg" alt="User" />
                            <img className="w-10 h-10 rounded-full border-2 border-[#050505]" src="https://randomuser.me/api/portraits/men/32.jpg" alt="User" />
                            <img className="w-10 h-10 rounded-full border-2 border-[#050505]" src="https://randomuser.me/api/portraits/women/68.jpg" alt="User" />
                        </div>
                        <div className="text-sm text-gray-400 font-medium">
                            Join 10,000+ users
                        </div>
                    </div>
                </div>
            </div>

            {/* Right Side: Form */}
            <div className="flex-1 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-20 xl:px-24">
                <div className="mx-auto w-full max-w-sm lg:w-96">
                    <div className="mb-8">
                        <Logo />
                    </div>
                    <div>
                        <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
                            {title}
                        </h2>
                        {subtitle && (
                            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                                {subtitle}
                            </p>
                        )}
                    </div>

                    <div className="mt-8">
                        {children}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AuthLayout;
