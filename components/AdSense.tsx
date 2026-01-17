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
        <div className={`overflow-hidden my-6 mx-auto w-full flex justify-center ${className}`}>
            <ins
                className="adsbygoogle"
                style={{ display: 'block' }}
                data-ad-client="ca-pub-6541630084958043"
                data-ad-slot={slot}
                data-ad-format={format}
                data-ad-layout-key={layoutKey}
                data-full-width-responsive={responsive}
            />
        </div>
    );
};

export default AdSense;