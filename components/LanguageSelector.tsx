
import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { GlobeIcon, CheckIcon } from '../constants';
import { getLocalizedPath } from '../lib/routeUtils';

// Flags (Unchanged)
const FlagDE = ({ className }: { className?: string }) => (<svg width="24" height="24" fill="none" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className={className}><g clipPath="url(#DE_svg__a)"><path d="M.746 16.175C2.442 20.745 6.84 24 12 24c5.16 0 9.558-3.257 11.253-7.826L12 15.132.746 16.175Z" fill="#FFDA44" /><path d="M12 0C6.84 0 2.442 3.258.746 7.828L12 8.87l11.253-1.043C21.558 3.257 17.16 0 12 0Z" fill="#000" /><path d="M.746 7.826A11.974 11.974 0 0 0 0 12c0 1.467.264 2.873.746 4.174h22.508c.482-1.3.746-2.707.746-4.174 0-1.468-.264-2.874-.746-4.174H.746Z" fill="#D80027" /></g><defs><clipPath id="DE_svg__a"><path fill="#fff" d="M0 0h24v24H0z" /></clipPath></defs></svg>);
const FlagUS = ({ className }: { className?: string }) => (<svg width="24" height="24" fill="none" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className={className}><g clipPath="url(#US_svg__a)"><path d="M12 24c6.627 0 12-5.373 12-12S18.627 0 12 0 0 5.373 0 12s5.373 12 12 12Z" fill="#F0F0F0" /><path d="M11.477 12H24a12.01 12.01 0 0 0-.413-3.13H11.478V12Zm0-6.262h10.761a12.064 12.064 0 0 0-2.769-3.13h-7.992v3.13ZM12 24c2.824 0 5.42-.976 7.47-2.609H4.53A11.948 11.948 0 0 0 12 24ZM1.761 18.26h20.477a11.93 11.93 0 0 0 1.348-3.13H.413c.3 1.116.758 2.167 1.348 3.13Z" fill="#D80027" /><path d="M5.559 1.874h1.093l-1.017.739.389 1.196-1.018-.74-1.017.74.336-1.033c-.896.746-1.68 1.62-2.328 2.594h.35l-.647.47c-.1.168-.197.34-.29.513l.31.951-.578-.419C1 7.19.868 7.5.75 7.817l.34 1.048h1.258l-1.017.74.389 1.195-1.017-.739-.61.443C.033 10.994 0 11.494 0 12h12V0C9.63 0 7.42.688 5.559 1.874Zm.465 8.926-1.018-.739-1.017.739.389-1.196-1.017-.739h1.257l.388-1.195.389 1.195h1.257l-1.017.74.389 1.195Zm-.389-4.691.389 1.195-1.018-.739-1.017.74.389-1.196-1.017-.74h1.257l.388-1.195.389 1.196h1.257l-1.017.739Zm4.693 4.691-1.017-.739-1.017.739.388-1.196-1.017-.739h1.257l.389-1.195.388 1.195h1.258l-1.018.74.389 1.195Zm-.389-4.691.389 1.195-1.017-.739-1.017.74.388-1.196-1.017-.74h1.257l.389-1.195.388 1.196h1.258l-1.018.739Zm0-3.496.389 1.196-1.017-.74-1.017.74.388-1.196-1.017-.739h1.257L9.311.678l.388 1.196h1.258l-1.018.739Z" fill="#0052B4" /></g><defs><clipPath id="US_svg__a"><path fill="#fff" d="M0 0h24v24H0z" /></clipPath></defs></svg>);
const FlagSA = ({ className }: { className?: string }) => (<svg width="24" height="24" fill="none" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className={className}><g clipPath="url(#SA_svg__a)"><path d="M12 24c6.627 0 12-5.373 12-12S18.627 0 12 0 0 5.373 0 12s5.373 12 12 12Z" fill="#6DA544" /><path d="M6.783 14.348c0 .864.701 1.565 1.565 1.565h4.696c0 .72.584 1.304 1.304 1.304h1.566c.72 0 1.304-.584 1.304-1.304v-1.565H6.783Zm10.564-7.565v3.652c0 .576-.468 1.044-1.043 1.044v1.565a2.612 2.612 0 0 0 2.608-2.609V6.783h-1.565ZM6.13 10.435c0 .575-.468 1.043-1.043 1.043v1.566a2.612 2.612 0 0 0 2.609-2.609V6.783H6.13v3.652Z" fill="#F0F0F0" /><path d="M16.565 6.783H15v3.652h1.565V6.783ZM12.652 8.87a.261.261 0 0 1-.521 0V6.783h-1.566V8.87a.261.261 0 0 1-.521 0V6.783H8.479V8.87c0 1.007.819 1.826 1.826 1.826.387 0 .747-.122 1.043-.329a1.816 1.816 0 0 0 1.274.314c-.11.457-.522.798-1.013.798v1.565a2.612 2.612 0 0 0 2.609-2.609V6.783h-1.566V8.87Z" fill="#F0F0F0" /><path d="M10.826 11.478H8.48v1.565h2.347v-1.565Z" fill="#F0F0F0" /></g><defs><clipPath id="SA_svg__a"><path fill="#fff" d="M0 0h24v24H0z" /></clipPath></defs></svg>);
const FlagJP = ({ className }: { className?: string }) => (<svg width="24" height="24" fill="none" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className={className}><g clipPath="url(#JP_svg__a)"><path d="M12 24c6.627 0 12-5.373 12-12S18.627 0 12 0 0 5.373 0 12s5.373 12 12 12Z" fill="#F0F0F0" /><path d="M12 17.218a5.217 5.217 0 1 0 0-10.435 5.217 5.217 0 0 0 0 10.435Z" fill="#D80027" /></g><defs><clipPath id="JP_svg__a"><path fill="#fff" d="M0 0h24v24H0z" /></clipPath></defs></svg>);
const FlagFR = ({ className }: { className?: string }) => (<svg width="24" height="24" fill="none" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className={className}><g clipPath="url(#FR_svg__a)"><path d="M12 24c6.627 0 12-5.373 12-12S18.627 0 12 0 0 5.373 0 12s5.373 12 12 12Z" fill="#F0F0F0" /><path d="M24 12c0-5.16-3.257-9.558-7.826-11.254v22.508C20.744 21.558 24 17.159 24 12Z" fill="#D80027" /><path d="M0 12c0 5.16 3.257 9.559 7.826 11.254V.747C3.256 2.443 0 6.841 0 12.001Z" fill="#0052B4" /></g><defs><clipPath id="FR_svg__a"><path fill="#fff" d="M0 0h24v24H0z" /></clipPath></defs></svg>);
const FlagCN = ({ className }: { className?: string }) => (<svg width="24" height="24" fill="none" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className={className}><g clipPath="url(#CN_svg__a)"><path d="M12 24c6.627 0 12-5.373 12-12S18.627 0 12 0 0 5.373 0 12s5.373 12 12 12Z" fill="#D80027" /><path d="m6.567 7.301 1.036 3.188h3.352l-2.71 1.973 1.036 3.188-2.714-1.969-2.714 1.969 1.04-3.188L2.18 10.49h3.35L6.567 7.3Zm7.659 11.284-.792-.975-1.172.454.68-1.054-.793-.98 1.215.323.684-1.054.066 1.256 1.218.323-1.176.45.07 1.257Zm1.576-2.86.375-1.2-1.027-.726 1.257-.019.37-1.2.408 1.19 1.256-.013-1.008.75.403 1.19-1.026-.726-1.008.754Zm2.124-6.918-.553 1.13.9.876-1.243-.178-.553 1.125-.215-1.238-1.247-.178 1.115-.586-.215-1.242.9.877 1.11-.586ZM14.26 5.385l-.095 1.252 1.168.473-1.224.3-.089 1.256-.66-1.068-1.224.3.81-.961-.665-1.064 1.167.473.811-.961Z" fill="#FFDA44" /></g><defs><clipPath id="CN_svg__a"><path fill="#fff" d="M0 0h24v24H0z" /></clipPath></defs></svg>);
const FlagRU = ({ className }: { className?: string }) => (<svg width="24" height="24" fill="none" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className={className}><g clipPath="url(#RU_svg__a)"><path d="M12 24c6.627 0 12-5.373 12-12S18.627 0 12 0 0 5.373 0 12s5.373 12 12 12Z" fill="#F0F0F0" /><path d="M23.254 16.173c.482-1.3.746-2.706.746-4.173 0-1.468-.264-2.874-.746-4.174H.746A11.974 11.974 0 0 0 0 11.999c0 1.468.264 2.874.746 4.174L12 17.217l11.254-1.044Z" fill="#0052B4" /><path d="M12 24c5.16 0 9.559-3.257 11.254-7.827H.747C2.443 20.743 6.841 24 12.001 24Z" fill="#D80027" /></g><defs><clipPath id="RU_svg__a"><path fill="#fff" d="M0 0h24v24H0z" /></clipPath></defs></svg>);
const FlagES = ({ className }: { className?: string }) => (<svg width="24" height="24" fill="none" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className={className}><g clipPath="url(#ES_svg__a)"><path d="M0 12c0 1.467.264 2.873.746 4.173L12 17.217l11.254-1.044c.482-1.3.746-2.706.746-4.174 0-1.468-.264-2.874-.746-4.174L12 6.782.746 7.825A11.974 11.974 0 0 0 0 12Z" fill="#FFDA44" /><path d="M23.255 7.826C21.56 3.256 17.161 0 12.002 0 6.842 0 2.444 3.256.748 7.826h22.507ZM.747 16.174C2.443 20.744 6.841 24 12.001 24c5.16 0 9.558-3.256 11.253-7.826H.747Z" fill="#D80027" /></g><defs><clipPath id="ES_svg__a"><path fill="#fff" d="M0 0h24v24H0z" /></clipPath></defs></svg>);

interface LanguageOption {
    code: string;
    label: string;
    Icon: React.FC<{ className?: string }>;
}

const languages: LanguageOption[] = [
    { code: 'en', label: 'English', Icon: FlagUS },
    { code: 'es', label: 'Español', Icon: FlagES },
    { code: 'fr', label: 'Français', Icon: FlagFR },
    { code: 'de', label: 'Deutsch', Icon: FlagDE },
    { code: 'ru', label: 'Русский', Icon: FlagRU },
    { code: 'ja', label: '日本語', Icon: FlagJP },
    { code: 'zh', label: '中文', Icon: FlagCN },
    { code: 'ar', label: 'العربية', Icon: FlagSA },
];

interface LanguageSelectorProps {
    textColorClass: string;
}

const LanguageSelector: React.FC<LanguageSelectorProps> = ({ textColorClass }) => {
    const { i18n } = useTranslation();
    const [isOpen, setIsOpen] = useState(false);
    const modalRef = useRef<HTMLDivElement>(null);

    const changeLanguage = (lng: string) => {
        // Construct the new URL with the selected language
        // This is a full page reload or pushState to the localized URL
        const currentPath = window.location.pathname;
        const newPath = getLocalizedPath(currentPath, lng);
        
        // Update URL and reload/navigate
        window.history.pushState(null, '', newPath);
        // Force a popstate event so App.tsx detects the change
        window.dispatchEvent(new PopStateEvent('popstate'));
        
        setIsOpen(false);
    };

    // ... (rest of useEffects for click outside and body scroll remain the same)
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen]);

    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'auto';
        }
        return () => { document.body.style.overflow = 'auto'; };
    }, [isOpen]);

    return (
        <>
            <button 
                onClick={() => setIsOpen(true)}
                className={`p-2 transition-colors ${textColorClass}`}
                aria-label="Change Language"
                title="Change Language"
            >
                <GlobeIcon className="w-6 h-6" />
            </button>

            {isOpen && createPortal(
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div 
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity animate-in fade-in duration-200" 
                        aria-hidden="true" 
                    />
                    
                    <div 
                        ref={modalRef}
                        className="relative bg-white dark:bg-[#1e1e1e] rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200"
                    >
                        <div className="p-6">
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6 text-center">
                                Select Language
                            </h2>
                            
                            <div className="grid grid-cols-2 gap-3">
                                {languages.map((lang) => {
                                    const isSelected = i18n.language === lang.code;
                                    return (
                                        <button
                                            key={lang.code}
                                            onClick={() => changeLanguage(lang.code)}
                                            className={`flex items-center gap-3 p-3 rounded-xl transition-all duration-200 border ${
                                                isSelected 
                                                ? 'bg-brand-primary/10 border-brand-primary ring-1 ring-brand-primary' 
                                                : 'bg-gray-50 dark:bg-[#252525] border-transparent hover:bg-gray-100 dark:hover:bg-[#303030]'
                                            }`}
                                        >
                                            <div className="flex-shrink-0 w-8 h-8 rounded-full overflow-hidden shadow-sm">
                                                <lang.Icon className="w-full h-full object-cover" />
                                            </div>
                                            <div className="flex-1 text-left">
                                                <span className={`block text-sm font-semibold ${isSelected ? 'text-gray-900 dark:text-white' : 'text-gray-700 dark:text-gray-300'}`}>
                                                    {lang.label}
                                                </span>
                                            </div>
                                            {isSelected && (
                                                <div className="flex-shrink-0 text-brand-primary">
                                                    <CheckIcon className="w-5 h-5" />
                                                </div>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                        
                        <div className="bg-gray-50 dark:bg-[#252525] px-6 py-4 flex justify-end">
                            <button
                                onClick={() => setIsOpen(false)}
                                className="px-4 py-2 text-sm font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-[#333] rounded-lg transition-colors"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </>
    );
};

export default LanguageSelector;
