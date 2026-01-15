import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Show, ListStatus, ListItem } from '../types';
import ShowCard from './ShowCard';
import { ChevronLeftIcon, ChevronRightIcon } from '../constants';

interface ContentCarouselProps {
    title: string;
    shows: Show[];
    onShowClick: (show: Show) => void;
    userList: Record<number, ListItem>;
    userFavorites?: Record<number, ListItem>;
    userCharacters?: Record<number, ListItem>;
    handleUpdateListStatus: (showId: number, status: ListStatus | null, show?: Show) => void;
    handleToggleFavorite?: (show: Show) => void;
}

const ContentCarousel: React.FC<ContentCarouselProps> = ({ title, shows, onShowClick, userList, userFavorites, userCharacters, handleUpdateListStatus, handleToggleFavorite }) => {
    const scrollRef = useRef<HTMLDivElement>(null);
    const [canScrollPrev, setCanScrollPrev] = useState(false);
    const [canScrollNext, setCanScrollNext] = useState(true);

    const checkScrollability = useCallback(() => {
        if (scrollRef.current) {
            const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
            const isRTL = document.dir === 'rtl';
            
            // RTL Logic:
            // Chrome/Firefox modern: scrollLeft is negative or starts at 0 and goes negative (leftwards)
            // Or starts at max (rightmost) and goes to 0? No, usually starts 0 or max depending on browser.
            // Safest way: Check if scrollWidth > clientWidth. Then rely on Math.abs for position.
            
            const maxScroll = scrollWidth - clientWidth;
            if (maxScroll <= 0) {
                setCanScrollPrev(false);
                setCanScrollNext(false);
                return;
            }

            if (isRTL) {
                 // In RTL, scrollLeft is often negative (Chrome) or starts at max (IE).
                 // We normalize by using absolute value logic or specific browser checks if needed.
                 // Simple approach: Check if we are at "start" (visually right) or "end" (visually left).
                 // Assuming standard negative scroll for Chrome RTL: 0 is rightmost, -max is leftmost.
                 const sl = Math.abs(scrollLeft);
                 setCanScrollPrev(sl > 1); // Can scroll right (technically 'prev' in RTL context means right)
                 setCanScrollNext(sl < maxScroll - 1); // Can scroll left
            } else {
                 setCanScrollPrev(scrollLeft > 0);
                 setCanScrollNext(scrollLeft < maxScroll - 1);
            }
        }
    }, []);

    useEffect(() => {
        const scrollElement = scrollRef.current;
        if (!scrollElement) return;

        const timer = setTimeout(() => {
            checkScrollability();
        }, 150);

        scrollElement.addEventListener('scroll', checkScrollability, { passive: true });
        const resizeObserver = new ResizeObserver(checkScrollability);
        resizeObserver.observe(scrollElement);

        return () => {
            clearTimeout(timer);
            scrollElement.removeEventListener('scroll', checkScrollability);
            resizeObserver.disconnect();
        };
    }, [checkScrollability, shows]);

    const scroll = (direction: 'prev' | 'next') => {
        if (scrollRef.current) {
            const { clientWidth } = scrollRef.current;
            const scrollAmount = clientWidth * 0.9;
            const isRTL = document.dir === 'rtl';
            
            // LTR: Prev = Left (-), Next = Right (+)
            // RTL: Prev = Right (+), Next = Left (-)
            
            let amount = 0;
            
            if (isRTL) {
                amount = direction === 'prev' ? scrollAmount : -scrollAmount;
            } else {
                amount = direction === 'prev' ? -scrollAmount : scrollAmount;
            }

            scrollRef.current.scrollBy({ left: amount, behavior: 'smooth' });
        }
    };

    return (
        <section className="group relative">
            <h2 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white mb-4 text-start">{title}</h2>
            <div className="relative">
                <div ref={scrollRef} className="flex items-start overflow-x-auto scrollbar-hide pb-4 -mx-2">
                    {shows.map(show => (
                         <div key={show.id} className="w-1/2 sm:w-1/3 md:w-1/4 lg:w-1/5 xl:w-1/6 flex-shrink-0 px-2">
                            <ShowCard 
                                show={show} 
                                onShowClick={onShowClick} 
                                userList={userList} 
                                userFavorites={userFavorites}
                                userCharacters={userCharacters}
                                handleUpdateListStatus={handleUpdateListStatus} 
                                handleToggleFavorite={handleToggleFavorite}
                            />
                        </div>
                    ))}
                </div>
                
                {canScrollPrev && (
                    <>
                        <div className="absolute top-0 bottom-4 start-0 -left-2 rtl:-right-2 w-12 bg-gradient-to-r from-white to-transparent dark:from-[#0f0f0f] dark:to-transparent pointer-events-none z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rtl:bg-gradient-to-l" />
                        <button
                            onClick={() => scroll('prev')}
                            className="absolute top-1/2 -translate-y-1/2 -left-2 rtl:left-auto rtl:-right-2 w-12 h-1/2 flex items-center justify-center text-gray-900 dark:text-white opacity-0 group-hover:opacity-100 transition-all duration-300 z-20"
                            aria-label="Previous"
                        >
                            <ChevronLeftIcon className="w-10 h-10 hover:scale-110 transition-transform drop-shadow-md rtl:rotate-180" />
                        </button>
                    </>
                )}
                
                {canScrollNext && (
                    <>
                        <div className="absolute top-0 bottom-4 end-0 -right-2 rtl:-left-2 w-12 bg-gradient-to-l from-white to-transparent dark:from-[#0f0f0f] dark:to-transparent pointer-events-none z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rtl:bg-gradient-to-r" />
                        <button
                            onClick={() => scroll('next')}
                            className="absolute top-1/2 -translate-y-1/2 -right-2 rtl:right-auto rtl:-left-2 w-12 h-1/2 flex items-center justify-center text-gray-900 dark:text-white opacity-0 group-hover:opacity-100 transition-all duration-300 z-20"
                            aria-label="Next"
                        >
                            <ChevronRightIcon className="w-10 h-10 hover:scale-110 transition-transform drop-shadow-md rtl:rotate-180" />
                        </button>
                    </>
                )}
            </div>
        </section>
    );
};

export default ContentCarousel;