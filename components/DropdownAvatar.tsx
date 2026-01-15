import React, { useState, useEffect, useRef } from 'react';
import { UserIconV2, SettingsIconV2, LogOutIcon, ListIcon } from '../constants';
import { Avatar } from './Avatar';
import { User } from '../types';
import { useTranslation } from 'react-i18next';

interface DropdownAvatarProps {
    onLogout: () => void;
    onNavigate: (path: string) => void;
    user: User;
}

const DropdownAvatar: React.FC<DropdownAvatarProps> = ({ onLogout, onNavigate, user }) => {
    const { t } = useTranslation();
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const handleViewProfile = () => {
        onNavigate(`/u/${user.username}`);
        setIsOpen(false);
    };

    const handleViewSettings = () => {
        onNavigate('/settings');
        setIsOpen(false);
    }
    
    const handleViewMyList = () => {
        onNavigate(`/u/${user.username}/my-list`);
        setIsOpen(false);
    };

    const handleLogout = () => {
        onLogout();
        setIsOpen(false);
    }
    
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    return (
        <div ref={dropdownRef} className="relative">
            <button 
                onClick={() => setIsOpen(!isOpen)} 
                className="rounded-full focus:outline-none transition-transform active:scale-95"
            >
                <Avatar src={user.avatar_url} alt={user.name} size="md" />
            </button>
            {isOpen && (
                <div className="absolute end-0 mt-2 w-64 bg-white dark:bg-[#1e1e1e] rounded-lg border border-gray-200 dark:border-gray-800 ring-1 ring-black ring-opacity-5 dark:ring-white/10 origin-top-right rtl:origin-top-left transition-colors duration-200 z-50">
                    <div className="flex flex-col text-gray-900 dark:text-white">
                        <div className="px-4 py-3">
                           <div className="flex items-center space-x-3 rtl:space-x-reverse">
                                <div className="relative">
                                    <Avatar src={user.avatar_url} alt={user.name} size="md" />
                                    <span className="absolute bottom-0 right-0 block rounded-full bg-green-500 ring-2 ring-white dark:ring-[#1e1e1e] h-2.5 w-2.5" />
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-start">{user.name}</p>
                                    <p className="text-sm text-gray-500 dark:text-gray-400 truncate text-start">{user.title}</p>
                                </div>
                           </div>
                        </div>
                        <div className="py-1 border-t border-gray-100 dark:border-gray-800">
                             <button onClick={handleViewProfile} className="w-full text-start flex items-center px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-[#2a2a2a] transition-colors">
                                <UserIconV2 className="w-5 h-5 me-3 text-gray-400"/> {t('nav.profile')}
                            </button>
                             <button onClick={handleViewMyList} className="w-full text-start flex items-center px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-[#2a2a2a] transition-colors">
                                <ListIcon className="w-5 h-5 me-3 text-gray-400"/> {t('nav.mylist')}
                            </button>
                             <button onClick={handleViewSettings} className="w-full text-start flex items-center px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-[#2a2a2a] transition-colors">
                                <SettingsIconV2 className="w-5 h-5 me-3 text-gray-400"/> {t('nav.settings')}
                            </button>
                        </div>
                        
                        <div className="py-1 border-t border-gray-100 dark:border-gray-800">
                            <button onClick={handleLogout} className="w-full text-start flex items-center px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-[#2a2a2a] transition-colors">
                                <LogOutIcon className="w-5 h-5 me-3 text-gray-400"/> {t('nav.logout')}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DropdownAvatar;