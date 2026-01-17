import React, { useEffect, useState, useRef } from 'react';

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
    const [adStatus, setAdStatus] = useState<'loading' | 'filled' | 'unfilled'>('loading');
    const [isLocalhost, setIsLocalhost] = useState(false);
    const insRef = useRef<HTMLModElement>(null);

    useEffect(() => {
        const localhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
        setIsLocalhost(localhost);

        // Initialize AdSense
        const timer = setTimeout(() => {
            try {
                // @ts-ignore
                (window.adsbygoogle = window.adsbygoogle || []).push({});
            } catch (err) {
                console.error('AdSense push error:', err);
            }
        }, 100);

        // Monitor the <ins> tag for changes. AdSense adds 'data-ad-status="filled"' when an ad shows.
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === 'attributes' && mutation.attributeName === 'data-ad-status') {
                    const status = insRef.current?.getAttribute('data-ad-status') as any;
                    if (status) setAdStatus(status);
                }
            });
        });

        if (insRef.current) {
            observer.observe(insRef.current, { attributes: true });
        }

        return () => {
            clearTimeout(timer);
            observer.disconnect();
        };
    }, [slot]);

    // Hide everything but the ad content if the ad is filled
    const isFilled = adStatus === 'filled';
    const showPlaceholder = !isFilled || isLocalhost;

    return (
        <div className={`my-6 mx-auto w-full flex flex-col items-center justify-center transition-all duration-500 ${className}`}>
            <div 
                className={`w-full relative transition-all duration-500 ${
                    showPlaceholder 
                    ? 'border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-2xl p-1 min-h-[120px]' 
                    : 'border-transparent p-0 min-h-0'
                } flex flex-col items-center justify-center overflow-hidden`}
            >
                {/* "ads" Label - Only visible if ad hasn't loaded yet */}
                {showPlaceholder && (
                    <span className="absolute -top-3 left-6 bg-white dark:bg-[#0f0f0f] px-3 text-[10px] font-bold text-gray-400 dark:text-gray-500 lowercase tracking-widest select-none z-10">
                        ads
                    </span>
                )}

                {/* Localhost / Blocked Background Text */}
                {showPlaceholder && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none opacity-30 select-none">
                        <div className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-300 dark:text-gray-600">
                            {isLocalhost ? 'Preview' : 'Advertisement'}
                        </div>
                    </div>
                )}

                <ins
                    ref={insRef}
                    className="adsbygoogle"
                    style={{ 
                        display: 'block', 
                        width: '100%', 
                        minHeight: isFilled ? 'auto' : '90px',
                        borderRadius: '12px',
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