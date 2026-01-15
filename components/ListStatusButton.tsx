import React, { useState, useEffect, useRef } from 'react';
import { ListStatus, ListItem, Show } from '../types';
import { AddIcon, CompletedIcon, HeartIcon, TrashIcon, WatchingIcon, PlanningIcon, PausedIcon, DroppedIcon, RewatchingIcon, BookmarkIconSolid } from '../constants';
import { useTranslation } from 'react-i18next';

interface ListStatusButtonProps {
    showId: number;
    userList: Record<number, ListItem>;
    handleUpdateListStatus?: (showId: number, status: ListStatus | null, show?: Show) => void;
    isIconOnly?: boolean;
    fullWidth?: boolean;
    show?: Show;
    badge?: boolean;
    readOnly?: boolean;
    transparent?: boolean;
    align?: 'left' | 'center' | 'right';
    className?: string;
    variant?: 'default' | 'hero';
    onClick?: () => void;
}

const showStatusOptions: ListStatus[] = ['Watching', 'Completed', 'Planning', 'Paused', 'Dropped', 'Rewatching'];
const personStatusOptions: ListStatus[] = ['Favorite'];

const statusIcons: { [key: string]: React.ComponentType<{ className?: string, solid?: boolean }> } = {
    'Watching': WatchingIcon,
    'Completed': CompletedIcon,
    'Planning': PlanningIcon,
    'Paused': PausedIcon,
    'Dropped': DroppedIcon,
    'Rewatching': RewatchingIcon,
    'Favorite': HeartIcon,
};

const ListStatusButton: React.FC<ListStatusButtonProps> = ({ 
    showId, 
    userList, 
    handleUpdateListStatus, 
    isIconOnly = false, 
    fullWidth = false, 
    show, 
    badge = false, 
    readOnly = false,
    transparent = false,
    align = 'center',
    className = '',
    variant = 'default',
    onClick
}) => {
    const { t } = useTranslation();
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const buttonRef = useRef<HTMLButtonElement>(null);

    const currentStatus = userList[showId]?.status;
    const isPerson = show?.media_type === 'person' || userList[showId]?.media_type === 'person';
    const options = isPerson ? personStatusOptions : showStatusOptions;

    // Translation Helper
    const getStatusLabel = (status: string) => {
        if (!status) return "";
        const key = status.toLowerCase().replace(/ /g, '_');
        // Map Planning -> 'planning' (already correct key)
        // Map Plan to Watch -> 'planning' (if legacy data)
        if (key === 'plan_to_watch') return t('status.planning');
        return t(`status.${key}`) || status;
    };

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node) &&
                buttonRef.current && !buttonRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleStatusSelect = (status: ListStatus | null) => {
        if (readOnly || !handleUpdateListStatus) return;
        handleUpdateListStatus(showId, status, show);
        setIsOpen(false);
    };

    const toggleDropdown = (e: React.MouseEvent) => {
        if (onClick) {
            e.preventDefault();
            e.stopPropagation();
            onClick();
            return;
        }
        if (readOnly) return;
        setIsOpen(!isOpen);
    }

    // Distinct Color Palette for Statuses
    const statusStyles: { [key: string]: string } = {
        'Watching': 'bg-green-500 border-green-600 text-white',
        'Completed': 'bg-blue-600 border-blue-700 text-white',
        'Planning': 'bg-gray-500 border-gray-600 text-white',
        'Paused': 'bg-amber-500 border-amber-600 text-white',
        'Dropped': 'bg-red-600 border-red-700 text-white',
        'Rewatching': 'bg-indigo-500 border-indigo-600 text-white',
        'Favorite': 'bg-pink-500 border-pink-600 text-white',
    };
    
    const getStatusClass = (status: ListStatus | undefined) => {
        if (!status) return "bg-brand-primary text-black border-brand-primary hover:bg-brand-primary/90";
        return statusStyles[status] || 'bg-purple-600 border-purple-700 text-white';
    }

    const getStatusIcon = (status: ListStatus | undefined) => {
        if (!status) return isPerson ? HeartIcon : AddIcon;
        return statusIcons[status] || BookmarkIconSolid;
    }

    const CurrentStatusIcon = getStatusIcon(currentStatus);
    const label = currentStatus ? getStatusLabel(currentStatus) : (isPerson ? t('status.favorite') : t('status.add_to_list'));

    const dropdownAlignClasses = {
        left: 'start-0',
        center: 'start-1/2 -translate-x-1/2 rtl:translate-x-1/2',
        right: 'end-0'
    };

    const menuClasses = `absolute top-full mt-2 ${dropdownAlignClasses[align]} w-48 bg-white dark:bg-[#1e1e1e] rounded-lg border border-gray-200 dark:border-gray-700 z-50 py-1 ring-1 ring-black/5 dark:ring-white/10`;
    const menuItemClasses = "w-full text-start flex items-center gap-3 px-3 py-2 text-sm text-gray-900 dark:text-gray-200 hover:bg-brand-primary hover:text-black dark:hover:bg-brand-primary dark:hover:text-black transition-colors";

    if (isIconOnly) {
        // Icon Only Button
        const buttonBaseClasses = "h-9 w-9 flex items-center justify-center rounded-full transition-all";
        
        let buttonColorClasses = "";
        
        if (currentStatus) {
             // Use strict status color
             buttonColorClasses = (statusStyles[currentStatus] || 'bg-purple-600 text-white') + (transparent ? " opacity-90 hover:opacity-100" : "");
        } else {
             // Default Yellow/Black
             buttonColorClasses = transparent 
                ? "bg-black/50 text-brand-primary hover:bg-white hover:text-black backdrop-blur-sm"
                : "bg-brand-primary text-black hover:bg-brand-primary/80";
        }

        return (
            <div className={`relative ${className}`} ref={dropdownRef}>
                 <button 
                    ref={buttonRef} 
                    onClick={toggleDropdown} 
                    disabled={readOnly && !onClick} 
                    className={`${buttonBaseClasses} ${buttonColorClasses} ${(readOnly && !onClick) ? 'cursor-default' : ''}`} 
                    aria-label={label}
                    title={label}
                >
                    <CurrentStatusIcon className={`h-5 w-5`} solid={!!currentStatus && isPerson} />
                </button>
                {isOpen && !readOnly && !onClick && (
                     <div className={menuClasses}>
                        {options.map(status => {
                            const Icon = statusIcons[status] || BookmarkIconSolid;
                            return (
                                <button key={status} onClick={() => handleStatusSelect(status)} className={menuItemClasses}>
                                    <Icon className="w-5 h-5" solid={status === 'Favorite'} />
                                    <span>{getStatusLabel(status)}</span>
                                    {currentStatus === status && <CompletedIcon className="w-5 h-5 ms-auto" />}
                                </button>
                            );
                        })}
                        {currentStatus && (
                            <>
                                <div className="h-px bg-gray-200 dark:bg-gray-700 my-1"></div>
                                <button onClick={() => handleStatusSelect(null)} className="w-full text-start flex items-center gap-3 px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                                    <TrashIcon className="w-5 h-5" />
                                    <span>{currentStatus === 'Favorite' ? t('common.remove') : t('common.remove')}</span>
                                </button>
                            </>
                        )}
                    </div>
                )}
            </div>
        );
    }

    // Badge Style
    if (badge) {
        return (
             <div className={`relative ${className}`} ref={dropdownRef}>
                <button
                    ref={buttonRef}
                    onClick={toggleDropdown}
                    disabled={readOnly && !onClick}
                    className={`px-3 py-1 inline-flex items-center text-xs leading-5 font-semibold rounded-full transition-all border ${(!readOnly || onClick) && 'hover:opacity-80'} ${
                        getStatusClass(currentStatus)
                    } ${(readOnly && !onClick) ? 'cursor-default' : ''}`}
                >
                    {label}
                </button>
                {isOpen && !readOnly && !onClick && (
                    <div className={menuClasses}>
                        {options.map(status => {
                            const Icon = statusIcons[status] || BookmarkIconSolid;
                            return (
                                <button key={status} onClick={() => handleStatusSelect(status)} className={menuItemClasses}>
                                    <Icon className="w-4 h-4" solid={status === 'Favorite'} />
                                    <span>{getStatusLabel(status)}</span>
                                </button>
                            );
                        })}
                        {currentStatus && (
                            <button onClick={() => handleStatusSelect(null)} className="w-full text-start flex items-center gap-3 px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors border-t border-gray-200 dark:border-gray-700 mt-1">
                                <TrashIcon className="w-4 h-4" />
                                <span>{t('common.remove')}</span>
                            </button>
                        )}
                    </div>
                )}
            </div>
        );
    }

    // Default & Hero Style
    const isHero = variant === 'hero';
    
    const sizeClasses = isHero 
        ? "px-8 py-3.5 text-base md:text-lg shadow-lg hover:shadow-brand-primary/20 hover:-translate-y-0.5 active:translate-y-0" 
        : "h-10 px-4 py-2 text-sm";
    
    const statusClasses = getStatusClass(currentStatus);

    return (
        <div className={`relative ${className}`} ref={dropdownRef}>
            <button
                ref={buttonRef}
                onClick={toggleDropdown}
                disabled={readOnly && !onClick}
                className={`${sizeClasses} rounded-lg flex items-center justify-center space-x-2 rtl:space-x-reverse transition-all duration-300 font-bold border ${statusClasses} ${fullWidth ? 'w-full' : ''} ${(readOnly && !onClick) ? 'cursor-default' : ''}`}
            >
                <CurrentStatusIcon className={isHero ? "w-6 h-6" : "w-5 h-5"} solid={!!currentStatus && isPerson} />
                <span>{label}</span>
            </button>
             {isOpen && !readOnly && !onClick && (
                <div className={`absolute top-full mt-2 ${dropdownAlignClasses['center']} w-56 bg-white dark:bg-[#1e1e1e] rounded-lg border border-gray-200 dark:border-gray-700 z-50 py-1 ring-1 ring-black/5 dark:ring-white/10`}>
                    {options.map(status => {
                        const Icon = statusIcons[status] || BookmarkIconSolid;
                        return (
                            <button key={status} onClick={() => handleStatusSelect(status)} className={menuItemClasses}>
                                <Icon className="w-5 h-5" solid={status === 'Favorite'} />
                                <span>{getStatusLabel(status)}</span>
                                {currentStatus === status && <CompletedIcon className="w-5 h-5 ms-auto" />}
                            </button>
                        );
                    })}
                    {currentStatus && (
                        <>
                            <div className="h-px bg-gray-200 dark:bg-gray-700 my-1"></div>
                             <button onClick={() => handleStatusSelect(null)} className="w-full text-start flex items-center gap-3 px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                                <TrashIcon className="w-5 h-5" />
                                <span>{t('common.remove')}</span>
                            </button>
                        </>
                    )}
                </div>
            )}
        </div>
    );
};

export default ListStatusButton;