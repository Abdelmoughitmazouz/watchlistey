
import React, { useState, useEffect } from 'react';
import { PlayIconSolid } from '../constants';
import { ListStatus, ListItem, Show } from '../types';
import ListStatusButton from './ListStatusButton';
import { slugify } from '../lib/tmdb';

interface PromoSectionProps {
    userList: Record<number, ListItem>;
    handleUpdateListStatus: (showId: number, status: ListStatus | null, show?: Show) => void;
    shows: Show[];
    onNavigate: (path: string) => void;
}

const PromoSection: React.FC<PromoSectionProps> = ({ userList, handleUpdateListStatus, shows, onNavigate }) => {
  const [show, setShow] = useState<Show | null>(null);

  useEffect(() => {
    if (shows && shows.length > 0) {
        // Filter for high quality images
        const candidates = shows.filter(s => s.backdrop_url && !s.backdrop_url.includes('placeholder'));
        if (candidates.length > 0) {
            const randomIndex = Math.floor(Math.random() * candidates.length);
            setShow(candidates[randomIndex]);
        } else if (shows.length > 0) {
            // Fallback to any show if no good backdrops
            const randomIndex = Math.floor(Math.random() * shows.length);
            setShow(shows[randomIndex]);
        }
    }
  }, [shows]);

  if (!show) return null;

  const handleViewInfoClick = () => {
      const slug = slugify(show.title);
      const prefix = show.is_anime ? '/anime/' : show.media_type === 'tv' ? '/tv/' : '/movie/';
      onNavigate(`${prefix}${slug}`);
  };

  return (
    <div className="relative h-96 w-full">
      <div className="relative h-full w-full rounded-2xl overflow-hidden bg-gray-900 group">
        {/* Background Image */}
        <div 
          onClick={handleViewInfoClick}
          className="absolute inset-0 bg-cover bg-top bg-no-repeat transition-transform duration-1000 group-hover:scale-105 cursor-pointer" 
          style={{ backgroundImage: `url('${show.backdrop_url}')` }}
        >
            {/* Gradient Overlay for text readability */}
            <div className="absolute inset-0 bg-gradient-to-r from-[#0f0f0f]/90 via-[#0f0f0f]/60 to-transparent"></div>
        </div>

        {/* Content */}
        <div className="relative z-10 flex items-center h-full px-8 md:px-12">
          <div className="max-w-xl space-y-6">
            <div className="flex items-center space-x-3 text-sm text-gray-300">
              {show.maturity && <span className="bg-white/20 text-white px-2 py-0.5 rounded text-xs font-bold backdrop-blur-md border border-white/10">{show.maturity}</span>}
              <span className="font-medium">{show.year}</span>
              <span className="font-medium capitalize">{show.media_type === 'tv' ? 'Series' : 'Movie'}</span>
              <span className="text-brand-primary font-bold ml-2">★ {show.rating.toFixed(1)}</span>
            </div>
            
            <h2 
                onClick={handleViewInfoClick}
                className="text-4xl md:text-5xl font-extrabold tracking-tight text-white leading-tight line-clamp-2 cursor-pointer hover:text-brand-primary transition-colors"
            >
                {show.title.toUpperCase()}
            </h2>
            
            <p className="text-gray-200 font-medium leading-relaxed line-clamp-3 text-lg">
                {show.description}
            </p>
            
            <div className="flex items-center gap-4 pt-4">
              <ListStatusButton 
                showId={show.id} 
                userList={userList} 
                handleUpdateListStatus={handleUpdateListStatus} 
                show={show} 
                variant="hero"
                onClick={handleViewInfoClick}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PromoSection;
