
import React from 'react';
import { useTranslation } from 'react-i18next';

interface PromoVideoProps {
    videoUrl: string;
    title: string;
}

const PromoVideo: React.FC<PromoVideoProps> = ({ videoUrl, title }) => {
    const { t } = useTranslation();
    return (
        <div className="mb-12">
            <h2 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white mb-4 text-left">{t('details.promotional_video')}</h2>
            <div className="aspect-video w-full overflow-hidden rounded-lg shadow-lg bg-black">
                <iframe
                    className="w-full h-full"
                    src={videoUrl}
                    title={`Promotional video for ${title}`}
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                ></iframe>
            </div>
        </div>
    );
};

export default PromoVideo;
