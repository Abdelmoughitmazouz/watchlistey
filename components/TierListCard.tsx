
import React from 'react';
import { TierList } from '../types';
import { HeartIcon } from '../constants';
import { Avatar } from './Avatar';

interface TierListCardProps {
    tierList: TierList;
    onClick: () => void;
    onToggleLike?: (e: React.MouseEvent, id: string) => void;
    isLiked?: boolean;
}

const TierListCard: React.FC<TierListCardProps> = ({ tierList, onClick, onToggleLike, isLiked }) => {
    const images = tierList.thumbnail_images?.slice(0, 3) || [];
    const user = tierList.user;

    const timeAgo = (dateStr: string) => {
        const diff = Date.now() - new Date(dateStr).getTime();
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        if (days === 0) return 'Today';
        if (days === 1) return 'Yesterday';
        if (days < 30) return `${days}d ago`;
        return new Date(dateStr).toLocaleDateString();
    };

    return (
        <div 
            onClick={onClick}
            className="group flex flex-col bg-white dark:bg-[#121212] rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden cursor-pointer hover:border-brand-primary/50 dark:hover:border-brand-primary/50 transition-all duration-300 shadow-sm hover:shadow-lg h-full"
        >
            {/* Image Grid */}
            <div className="aspect-video w-full bg-gray-100 dark:bg-[#1a1a1a] relative overflow-hidden grid grid-cols-3 gap-[1px]">
                {images.length > 0 ? (
                    images.map((img, i) => (
                        <div key={i} className="relative h-full w-full overflow-hidden">
                            <img 
                                src={img} 
                                alt="" 
                                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                            />
                            <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors"></div>
                        </div>
                    ))
                ) : (
                    <div className="col-span-3 flex items-center justify-center text-gray-400 dark:text-gray-600 text-sm font-medium">
                        No Preview
                    </div>
                )}
                
                {/* Vibe Badge */}
                {tierList.vibe && (
                    <div className="absolute top-2 right-2 px-2 py-1 bg-black/60 backdrop-blur-md text-white text-[10px] font-bold uppercase tracking-wider rounded-md border border-white/10">
                        {tierList.vibe}
                    </div>
                )}
            </div>

            {/* Content */}
            <div className="p-4 flex flex-col flex-1">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white line-clamp-1 mb-1 group-hover:text-brand-primary transition-colors">
                    {tierList.title}
                </h3>
                
                <div className="mt-auto pt-4 flex items-center justify-between">
                    <div className="flex items-center gap-2 min-w-0">
                        <Avatar src={user?.avatar_url} alt={user?.name} size="sm" className="w-6 h-6 border border-gray-200 dark:border-gray-700" />
                        <div className="flex flex-col min-w-0">
                            <span className="text-xs font-semibold text-gray-900 dark:text-white truncate max-w-[100px]">
                                {user?.name || 'Unknown'}
                            </span>
                            <span className="text-[10px] text-gray-500 dark:text-gray-400">
                                {timeAgo(tierList.created_at)}
                            </span>
                        </div>
                    </div>

                    <button 
                        onClick={(e) => onToggleLike && onToggleLike(e, tierList.id)}
                        className={`flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full transition-colors ${
                            isLiked 
                            ? 'text-red-500 bg-red-50 dark:bg-red-900/10' 
                            : 'text-gray-500 dark:text-gray-400 hover:text-red-500 hover:bg-gray-100 dark:hover:bg-[#252525]'
                        }`}
                    >
                        <HeartIcon className="w-3.5 h-3.5" solid={isLiked} />
                        <span>{tierList.likes_count || 0}</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default TierListCard;
