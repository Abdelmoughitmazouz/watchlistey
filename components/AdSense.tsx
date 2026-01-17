import React, { useEffect, useState } from 'react';

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
    const [isLoaded, setIsLoaded] = useState(false);
    const [isLocalhost, setIsLocalhost] = useState(false);

    useEffect(() => {
        setIsLocalhost(
            window.location.hostname === 'localhost' || 
            window.location.hostname === '127.0.0.1'
        );

        const timer = setTimeout(() => {
            try {
                // @ts-ignore
                const adsbygoogle = window.adsbygoogle || [];
                adsbygoogle.push({});
                setIsLoaded(true);
            } catch (err) {
                console.error('AdSense initialization error:', err);
            }
        }, 100);

        return () => clearTimeout(timer);
    }, [slot]); // Re-run if slot changes

    return (
        <div className={`my-10 mx-auto w-full flex flex-col items-center justify-center group ${className}`}>
            {/* The "Dotted Square" Container */}
            <div className="w-full border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-2xl p-1 relative min-h-[120px] flex flex-col items-center justify-center transition-all duration-300 hover:border-gray-300 dark:hover:border-gray-700">
                
                {/* "ads" Label */}
                <span className="absolute -top-3 left-6 bg-white dark:bg-[#0f0f0f] px-3 text-[10px] font-bold text-gray-400 dark:text-gray-500 lowercase tracking-widest select-none">
                    ads
                </span>

                {/* Localhost / Blocked Placeholder */}
                {(!isLoaded || isLocalhost) && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none opacity-40">
                        <div className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-300 dark:text-gray-600">
                            {isLocalhost ? 'Local Preview Mode' : 'Advertisement'}
                        </div>
                    </div>
                )}

                <ins
                    className="adsbygoogle"
                    style={{ 
                        display: 'block', 
                        width: '100%', 
                        minHeight: '90px',
                        borderRadius: '12px',
                        overflow: 'hidden'
                    }}
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