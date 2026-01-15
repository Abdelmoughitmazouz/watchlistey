import React, { useState } from 'react';
import { ChevronLeftIcon, ChevronRightIcon } from '../constants';
import { useTranslation } from 'react-i18next';

interface ImageSliderProps {
    images: string[];
    title: string;
}

const ImageSlider: React.FC<ImageSliderProps> = ({ images, title }) => {
    const { t } = useTranslation();
    const [currentIndex, setCurrentIndex] = useState(0);

    const goToPrevious = () => {
        const isFirstSlide = currentIndex === 0;
        const newIndex = isFirstSlide ? images.length - 1 : currentIndex - 1;
        setCurrentIndex(newIndex);
    };

    const goToNext = () => {
        const isLastSlide = currentIndex === images.length - 1;
        const newIndex = isLastSlide ? 0 : currentIndex + 1;
        setCurrentIndex(newIndex);
    };

    const goToSlide = (slideIndex: number) => {
        setCurrentIndex(slideIndex);
    };

    return (
        <div className="mb-12">
            <h2 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white mb-4 text-left">{t('details.image_gallery')}</h2>
            <div className="relative group">
                <div className="aspect-video w-full overflow-hidden rounded-lg shadow-lg bg-gray-100 dark:bg-[#1e1e1e] flex items-center justify-center">
                    <img src={images[currentIndex]} alt={`${title} gallery image ${currentIndex + 1}`} className="w-full h-full object-cover transition-opacity duration-500" />
                </div>
                <button onClick={goToPrevious} className="absolute top-1/2 left-4 -translate-y-1/2 bg-black/40 text-white rounded-full p-2 hover:bg-black/60 transition-colors z-10 opacity-0 group-hover:opacity-100" aria-label="Previous image">
                    <ChevronLeftIcon />
                </button>
                <button onClick={goToNext} className="absolute top-1/2 right-4 -translate-y-1/2 bg-black/40 text-white rounded-full p-2 hover:bg-black/60 transition-colors z-10 opacity-0 group-hover:opacity-100" aria-label="Next image">
                    <ChevronRightIcon />
                </button>
            </div>
            <div className="flex justify-center space-x-2 mt-4 overflow-x-auto scrollbar-hide py-2">
                {images.map((image, index) => (
                    <button 
                        key={index} 
                        onClick={() => goToSlide(index)} 
                        className={`w-20 h-12 flex-shrink-0 rounded-md overflow-hidden border-2 transition-all ${currentIndex === index ? 'border-blue-600 dark:border-brand-primary opacity-100' : 'border-transparent opacity-60 hover:opacity-100'}`}
                    >
                        <img src={image} alt={`Thumbnail ${index + 1}`} className="w-full h-full object-cover" />
                    </button>
                ))}
            </div>
        </div>
    );
};

export default ImageSlider;