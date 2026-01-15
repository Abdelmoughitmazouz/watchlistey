
import React, { useEffect, useState } from 'react';
import { CheckIcon, CloseIcon, InfoIcon } from '../constants';

export interface ToastProps {
    id: string;
    title: string;
    message: string;
    type?: 'success' | 'error' | 'info';
    image?: string;
    duration?: number; // ms, or Infinity
    onClose: (id: string) => void;
    // Styling props managed by Toaster
    style?: React.CSSProperties; 
    visible?: boolean;
    isExpanded?: boolean;
    action?: () => void; // Action to perform when image is clicked
}

export const Toast: React.FC<ToastProps> = ({ 
    id, 
    title, 
    message, 
    type = 'success', 
    image, 
    duration = 4000, 
    onClose, 
    style, 
    visible = true,
    isExpanded = false,
    action
}) => {
    const [isExiting, setIsExiting] = useState(false);

    useEffect(() => {
        if (!duration || duration === Infinity) return;
        const timer = setTimeout(() => {
            handleClose();
        }, duration);
        return () => clearTimeout(timer);
    }, [id, duration]);

    const handleClose = () => {
        setIsExiting(true);
        // Wait for animation to finish before actual removal
        setTimeout(() => onClose(id), 300);
    };

    if (!visible && !isExiting) return null;

    return (
        <div 
            className={`
                absolute bottom-0 right-0 w-80 sm:w-96 
                bg-white dark:bg-[#1e1e1e] 
                border border-gray-200 dark:border-gray-800 
                rounded-xl shadow-2xl p-4 
                flex items-start gap-4 
                transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]
                ${isExiting ? 'opacity-0 translate-y-4 scale-95 pointer-events-none' : 'opacity-100'}
                ${isExpanded ? 'hover:bg-gray-50 dark:hover:bg-[#252525]' : ''}
            `}
            style={{
                ...style,
                // Ensure front toast is clickable, others depend on expansion
                pointerEvents: 'auto' 
            }}
        >
            {/* Image or Icon */}
            <div className="flex-shrink-0">
                {image ? (
                    <div onClick={action} className={action ? "cursor-pointer group" : ""}>
                        <img 
                            src={image} 
                            alt="" 
                            className={`w-16 h-24 object-cover rounded-md shadow-sm border border-gray-100 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 transition-opacity ${action ? 'group-hover:opacity-90' : ''}`} 
                        />
                    </div>
                ) : (
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${type === 'success' ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400' : (type === 'error' ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400' : 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400')}`}>
                        {type === 'success' ? <CheckIcon className="w-5 h-5" /> : (type === 'error' ? <CloseIcon className="w-5 h-5" /> : <InfoIcon className="w-5 h-5" />)}
                    </div>
                )}
            </div>

            <div className="flex-1 min-w-0 pt-1">
                <h4 className="text-sm font-bold text-gray-900 dark:text-white leading-tight mb-1">{title}</h4>
                <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed line-clamp-3">{message}</p>
                {/* Explicit Remove Button for notifications if duration is Infinity */}
                {duration === Infinity && (
                    <button 
                        onClick={(e) => { e.stopPropagation(); handleClose(); }}
                        className="mt-2 text-xs font-semibold text-red-500 hover:text-red-600 hover:underline"
                    >
                        Remove
                    </button>
                )}
            </div>

            <button 
                onClick={(e) => { e.stopPropagation(); handleClose(); }}
                className="flex-shrink-0 p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 bg-transparent hover:bg-gray-100 dark:hover:bg-[#333] rounded-md transition-colors"
                aria-label="Close"
            >
                <CloseIcon className="w-4 h-4" />
            </button>
        </div>
    );
};

export const Toaster: React.FC<{ 
    toasts: Omit<ToastProps, 'onClose' | 'style' | 'visible'>[], 
    removeToast: (id: string) => void,
    expand?: boolean,
    visibleToasts?: number
}> = ({ toasts, removeToast, expand = false, visibleToasts = 3 }) => {
    const [isHovered, setIsHovered] = useState(false);
    const isExpanded = expand || isHovered;

    // Reverse toasts so newest (last in array) is first in the list for stacking logic
    const visibleStack = [...toasts].reverse();

    return (
        <div 
            className="fixed bottom-6 right-6 z-[100] flex flex-col items-end pointer-events-none"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            {/* Anchor point for absolute toasts */}
            <div className="relative w-80 sm:w-96 h-24"> 
                {visibleStack.map((t, index) => {
                    // Don't render if beyond visible limit and not expanding
                    if (index >= visibleToasts && !isExpanded) return null;

                    // Stacking Logic
                    // Collapsed: Stack at bottom (y=0, -15, -30), scaling down
                    // Expanded: Move UP (y=0, -130, -260) to form a list growing upwards (Increased spacing for larger toasts)
                    
                    const collapsedOffset = index * -15;
                    const expandedOffset = index * -130; // Increased to accommodate taller toast (16h image = 4rem = 64px, now 24h = 6rem = 96px + padding)
                    
                    const offset = isExpanded ? expandedOffset : collapsedOffset;
                    const scale = isExpanded ? 1 : 1 - index * 0.05;
                    const opacity = isExpanded ? 1 : 1 - (index * 0.1); 

                    const style: React.CSSProperties = {
                        transform: `translate3d(0, ${offset}px, -${index}px) scale(${scale})`,
                        zIndex: toasts.length - index,
                        opacity: opacity,
                    };

                    return (
                        <Toast 
                            key={t.id}
                            {...t}
                            onClose={removeToast}
                            style={style}
                            visible={true}
                            isExpanded={isExpanded}
                        />
                    );
                })}
            </div>
        </div>
    );
};
