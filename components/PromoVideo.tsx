
import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

interface PromoVideoProps {
    videoUrl: string;
    title: string;
}

const PromoVideo: React.FC<PromoVideoProps> = ({ videoUrl, title }) => {
    const { t } = useTranslation();

    // Enhanced URL logic to satisfy YouTube security requirements (Error 153)
    const enhancedVideoUrl = useMemo(() => {
        if (!videoUrl || !videoUrl.includes('youtube.com/embed/')) return videoUrl;
        
        try {
            const url = new URL(videoUrl);
            const origin = typeof window !== 'undefined' ? window.location.origin : '';
            
            // Critical parameters for YouTube security and JS API
            url.searchParams.set('origin', origin);
            url.searchParams.set('widget_referrer', origin);
            url.searchParams.set('enablejsapi', '1');
            url.searchParams.set('rel', '0'); // Show only related videos from the same channel
            
            return url.toString();
        } catch (e) {
            console.error("Error formatting video URL", e);
            return videoUrl;
        }
    }, [videoUrl]);

    return (
        <div className="mb-12 animate-fade-in">
            <h2 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white mb-4 text-left">
                {t('details.promotional_video')}
            </h2>
            <div className="aspect-video w-full overflow-hidden rounded-xl shadow-2xl bg-black border border-gray-200 dark:border-gray-800">
                <iframe
                    className="w-full h-full"
                    src={enhancedVideoUrl}
                    title={`Promotional video for ${title}`}
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    referrerPolicy="strict-origin-when-cross-origin"
                    allowFullScreen
                ></iframe>
            </div>
        </div>
    );
};

export default PromoVideo;