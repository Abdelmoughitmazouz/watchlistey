import React, { useEffect } from 'react';

interface AdSenseProps {
    slot: string;
    format?: 'auto' | 'fluid' | 'autorelaxed';
    layoutKey?: string;
    className?: string;
    responsive?: string;
}

const AdSense: React.FC<AdSenseProps> = ({ 
    slot, 
    format = 'auto', 
    layoutKey, 
    className = "", 
    responsive = "true" 
}) => {
    useEffect(() => {
        try {
            // @ts-ignore
            (window.adsbygoogle = window.adsbygoogle || []).push({});
        } catch (err) {
            console.error('AdSense error:', err);
        }
    }, [slot]);

    return (
        <div className={`my-8 mx-auto w-full flex flex-col items-center justify-center group ${className}`}>
            <div className="w-full border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-xl p-1 relative min-h-[100px] flex items-center justify-center transition-colors hover:border-gray-300 dark:hover:border-gray-700">
                <span className="absolute -top-2.5 left-4 bg-white dark:bg-[#0f0f0f] px-2 text-[9px] font-bold text-gray-400 dark:text-gray-600 uppercase tracking-[0.2em] select-none">
                    Ads
                </span>
                <ins
                    className="adsbygoogle"
                    style={{ display: 'block', width: '100%' }}
                    data-ad-client="ca-pub-6541630084958043"
                    data-ad-slot={slot}
                    data-ad-format={format}
                    data-ad-layout-key={layoutKey}
                    data-full-width-responsive={responsive}
                />
            </div>
        </div>
    );
};

export default AdSense;