import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
    SearchIconV2, MailIcon, CaretDownIcon, VerifiedBadgeIcon, BoldIcon, ItalicIcon,
    UnderlineIcon, XIcon, InstagramIcon, YouTubeIcon, FacebookIconV2, CheckIcon, CheckboxIcon,
    UploadCloudIcon, TrashIcon, PlusIcon, ListIcon, FilterIcon, LockIcon, UserCircleIcon, IdCardIcon
} from '../constants';
import FormField from '../components/FormField';
import { User, ListStatus, Show, ListItem } from '../types';
import ImageDropzone from '../components/ImageDropzone';
import { searchMulti, discoverMedia } from '../lib/tmdb';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';
import { isContentSafe } from '../lib/contentSafety';
import { useTranslation } from 'react-i18next';
import { COUNTRIES } from '../lib/countries';

// Notification Component
const Notification = ({ message, onClose }: { message: string, onClose: () => void }) => {
    useEffect(() => {
        const timer = setTimeout(onClose, 3000);
        return () => clearTimeout(timer);
    }, [onClose]);

    return (
        <div className="fixed bottom-6 right-6 z-50 animate-fade-in-up">
            <div className="bg-[#121212] dark:bg-white text-white dark:text-gray-900 px-4 py-3 rounded-lg flex items-center gap-3 shadow-lg">
                <div className="bg-green-500 rounded-full p-0.5">
                    <CheckIcon className="w-3 h-3 text-white" />
                </div>
                <span className="font-medium text-sm">{message}</span>
            </div>
        </div>
    );
};

// Helper to auto-resize textarea
const useAutosizeTextArea = (
  textAreaRef: React.RefObject<HTMLTextAreaElement>,
  value: string
) => {
  useEffect(() => {
    if (textAreaRef.current) {
      textAreaRef.current.style.height = "0px";
      const scrollHeight = textAreaRef.current.scrollHeight;
      textAreaRef.current.style.height = scrollHeight + "px";
    }
  }, [textAreaRef, value]);
};

interface SettingsProps {
    initialTab?: string;
    user: User;
    onUpdateUser: (updatedUser: User) => void;
    onNavigate: (path: string) => void;
    handleUpdateListStatus?: (showId: number, status: ListStatus | null, show?: Show, customAddedAt?: string) => Promise<boolean> | void;
    handleClearData?: (target: 'favorites' | 'characters' | string) => Promise<void>;
    handleRenameList?: (oldStatus: string, newStatus: string) => void;
}

const inputClasses = "w-full bg-white dark:bg-[#1e1e1e] text-md text-gray-900 dark:text-white ring-1 ring-inset ring-gray-300 dark:ring-gray-700 placeholder:text-gray-400 dark:placeholder-text-gray-500 focus:ring-2 focus:ring-inset focus:ring-black dark:focus:ring-white rounded-lg outline-none shadow-sm transition-colors";

interface SectionProps {
    user: User;
    onUpdateUser: (updatedUser: User) => void;
    onSuccess: (msg: string) => void;
}

const MyDetailsSettings = ({ user, onUpdateUser, onSuccess }: SectionProps) => {
    const { t } = useTranslation();
    const getInitialState = (u: User) => ({
        first_name: u.first_name || (u.name ? u.name.split(' ')[0] : ''),
        last_name: u.last_name || (u.name ? u.name.split(' ').slice(1).join(' ') : ''),
        email: u.email || '',
        country: u.country || 'United Kingdom',
        list_privacy: u.list_privacy || 'public' as 'public' | 'followers' | 'private',
    });

    const [formData, setFormData] = useState(getInitialState(user));
    
    // Reset form when user prop changes (e.g. initial load)
    useEffect(() => {
        setFormData(getInitialState(user));
    }, [user]);

    const isDirty = useMemo(() => {
        const initialState = getInitialState(user);
        return JSON.stringify(formData) !== JSON.stringify(initialState);
    }, [formData, user]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const updatedUser: User = {
            ...user,
            first_name: formData.first_name,
            last_name: formData.last_name,
            email: formData.email,
            country: formData.country,
            list_privacy: formData.list_privacy,
        };
        onUpdateUser(updatedUser);
        onSuccess(t('settings.save_success'));
    };
    
    const selectedCountry = COUNTRIES.find(c => c.name === formData.country);

    return (
         <form onSubmit={handleSubmit} className="flex min-w-0 flex-1 flex-col gap-6 lg:gap-8">
            <div className="w-full flex flex-col gap-5 pt-0">
                <div className="flex flex-col justify-between gap-4 lg:flex-row">
                    <div className="flex flex-col gap-0.5 lg:gap-1">
                        <h1 className="text-xl font-semibold text-gray-900 dark:text-white lg:text-3xl">{t('settings.tabs.details')}</h1>
                        <p className="text-md text-gray-500 dark:text-gray-400">{t('settings.details_desc')}</p>
                    </div>
                    <div className="flex items-start gap-3">
                        <button 
                            type="button" 
                            onClick={() => setFormData(getInitialState(user))}
                            disabled={!isDirty}
                            className="rounded-lg px-3.5 py-2.5 text-sm font-semibold bg-white dark:bg-[#1e1e1e] text-gray-900 dark:text-white shadow-sm ring-1 ring-inset ring-gray-300 dark:ring-gray-700 hover:bg-gray-50 dark:hover:bg-[#2a2a2a] disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {t('common.cancel')}
                        </button>
                        <button 
                            type="submit" 
                            disabled={!isDirty}
                            className={`rounded-lg px-3.5 py-2.5 text-sm font-semibold shadow-sm transition-colors ${isDirty ? 'bg-brand-primary text-black hover:bg-brand-primary/90' : 'bg-gray-200 dark:bg-gray-800 text-gray-500 cursor-not-allowed'}`}
                        >
                            {t('common.save')}
                        </button>
                    </div>
                </div>
            </div>
            <hr className="h-px w-full border-none bg-gray-200 dark:bg-gray-800" />
            <div className="flex flex-col gap-5">
                <FormField label={t('settings.real_name')} description={t('settings.real_name_desc')} required>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                         <input
                            type="text" name="first_name" value={formData.first_name} onChange={handleChange}
                            placeholder={t('auth.first_name')}
                            className={`${inputClasses} px-3.5 py-2.5`}
                         />
                         <input
                            type="text" name="last_name" value={formData.last_name} onChange={handleChange}
                            placeholder={t('auth.last_name')}
                            className={`${inputClasses} px-3.5 py-2.5`}
                         />
                    </div>
                </FormField>
                <hr className="h-px w-full border-none bg-gray-200 dark:bg-gray-800" />
                 <FormField label={t('auth.email')} required>
                    <div className="relative w-full">
                        <MailIcon className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 size-5 text-gray-400" />
                        <input type="email" name="email" value={formData.email} onChange={handleChange} className={`${inputClasses} py-2.5 pl-10 pr-4`} />
                    </div>
                 </FormField>
                <hr className="h-px w-full border-none bg-gray-200 dark:bg-gray-800" />
                 <FormField label={t('settings.country')}>
                    <div className="relative w-full">
                         <select name="country" value={formData.country} onChange={handleChange} className={`${inputClasses} appearance-none py-2.5 pl-10 pr-8`}>
                            {COUNTRIES.map(country => (
                                <option key={country.code} value={country.name}>{country.name}</option>
                            ))}
                        </select>
                        <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 flex items-center justify-center w-5 h-5 text-lg">
                            {selectedCountry ? selectedCountry.emoji : '🌍'}
                        </div>
                        <CaretDownIcon className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500" />
                    </div>
                 </FormField>
                 <hr className="h-px w-full border-none bg-gray-200 dark:bg-gray-800" />
                 <FormField label={t('settings.list_privacy')} description={t('settings.list_privacy_desc')}>
                    <div className="flex flex-col gap-3">
                        {['public', 'followers', 'private'].map((option) => (
                             <label key={option} className="flex items-center gap-3 cursor-pointer">
                                <input
                                    type="radio"
                                    name="list_privacy"
                                    value={option}
                                    checked={formData.list_privacy === option}
                                    onChange={handleChange}
                                    className="h-4 w-4 text-black border-gray-300 focus:ring-black dark:bg-[#1e1e1e] dark:border-gray-600 accent-black dark:accent-brand-primary"
                                />
                                <div className="flex flex-col">
                                    <span className="text-sm font-medium text-gray-900 dark:text-white capitalize">{t(`settings.privacy_${option}`)}</span>
                                </div>
                            </label>
                        ))}
                    </div>
                </FormField>
            </div>
         </form>
    );
}

const ProfileSettings = ({ user, onUpdateUser, onSuccess }: SectionProps) => {
    const { t } = useTranslation();
    const getInitialState = (u: User) => ({
        ...u,
        name: u.name || '',
        username: u.username || '',
        x: u.x || '',
        instagram: u.instagram || '',
        youtube: u.youtube || '',
        facebook: u.facebook || '',
        title: u.title || '',
        bio: u.bio || '',
        avatar_url: u.avatar_url || '',
        cover_url: u.cover_url || '',
    });

    const [formData, setFormData] = useState(getInitialState(user));
    const [isUploading, setIsUploading] = useState(false);
    const [isChecking, setIsChecking] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        setFormData(getInitialState(user));
    }, [user]);
    
    const bioRef = useRef<HTMLTextAreaElement>(null);
    useAutosizeTextArea(bioRef, formData.bio);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        const newValue = name === 'username' ? value.replace(/\s/g, '') : value;
        setFormData(prev => ({ ...prev, [name]: newValue }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        const newUsername = formData.username.trim();
        
        if (newUsername.length < 3) {
            setError("Username must be at least 3 characters.");
            return;
        }

        if (newUsername !== user.username && isSupabaseConfigured) {
            setIsChecking(true);
            try {
                const { data } = await supabase
                    .from('profiles')
                    .select('username')
                    .ilike('username', newUsername)
                    .neq('id', user.id)
                    .maybeSingle();

                if (data) {
                    setError("This username is already taken. Please choose another one.");
                    setIsChecking(false);
                    return;
                }
            } catch (err) {
                console.error("Error checking username availability:", err);
            } finally {
                setIsChecking(false);
            }
        }

        onUpdateUser(formData);
        onSuccess(t('settings.save_success'));
    };
    
    const socialProfiles = [
        { name: 'x', prefix: 'x.com/', icon: XIcon, placeholder: 'untitledui' },
        { name: 'instagram', prefix: 'instagram.com/', icon: InstagramIcon, placeholder: 'untitledui' },
        { name: 'youtube', prefix: 'youtube.com/@', icon: YouTubeIcon, placeholder: 'untitledui' },
        { name: 'facebook', prefix: 'facebook.com/', icon: FacebookIconV2, placeholder: 'untitledui' },
    ];

    const isDirty = useMemo(() => {
        const initialState = getInitialState(user);
        return JSON.stringify(formData) !== JSON.stringify(initialState);
    }, [formData, user]);

    return (
        <form onSubmit={handleSubmit} className="flex min-w-0 flex-1 flex-col gap-6 lg:gap-8">
            <div className="w-full flex flex-col gap-5 pt-0">
                {error && (
                    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-200 px-4 py-3 rounded-lg text-sm font-medium">
                        {error}
                    </div>
                )}
                <div className="flex flex-col justify-between gap-4 lg:flex-row">
                    <div className="flex flex-col gap-0.5 lg:gap-1">
                        <h1 className="text-xl font-semibold text-gray-900 dark:text-white lg:text-3xl">{t('settings.tabs.profile')}</h1>
                        <p className="text-md text-gray-500 dark:text-gray-400">{t('settings.profile_desc')}</p>
                    </div>
                    <div className="flex items-start gap-3">
                        <button 
                            type="button" 
                            onClick={() => { setFormData(getInitialState(user)); setError(null); }}
                            disabled={!isDirty}
                            className="rounded-lg px-3.5 py-2.5 text-sm font-semibold bg-white dark:bg-[#1e1e1e] text-gray-900 dark:text-white shadow-sm ring-1 ring-inset ring-gray-300 dark:ring-gray-700 hover:bg-gray-50 dark:hover:bg-[#2a2a2a] disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {t('common.cancel')}
                        </button>
                        <button 
                            type="submit" 
                            disabled={isUploading || isChecking || !isDirty}
                            className={`rounded-lg px-3.5 py-2.5 text-sm font-semibold shadow-sm transition-colors ${isDirty ? 'bg-brand-primary text-black hover:bg-brand-primary/90' : 'bg-gray-200 dark:bg-gray-800 text-gray-500 cursor-not-allowed'}`}
                        >
                            {isUploading ? t('common.loading') : (isChecking ? t('common.loading') : t('common.save'))}
                        </button>
                    </div>
                </div>
            </div>
            <hr className="h-px w-full border-none bg-gray-200 dark:bg-gray-800" />
            <div className="flex flex-col gap-5">
                <FormField label={t('settings.profile_photos')}>
                    <div className="flex flex-col gap-4">
                        <div className="h-40 w-full rounded-lg relative ring-1 ring-black/5 dark:ring-white/10">
                            <ImageDropzone
                                onFileChange={(urls) => setFormData(prev => ({...prev, cover_url: urls[0]}))}
                                initialImages={[formData.cover_url]}
                                className="w-full h-full object-cover rounded-lg"
                                isBackground
                                onUploadStatusChange={setIsUploading}
                            />
                        </div>
                        <div className="relative w-24 h-24 rounded-full -mt-16 ml-6 ring-4 ring-white dark:ring-[#121212]">
                            <ImageDropzone
                                onFileChange={(urls) => setFormData(prev => ({...prev, avatar_url: urls[0]}))}
                                initialImages={[formData.avatar_url]}
                                className="w-full h-full rounded-full"
                                onUploadStatusChange={setIsUploading}
                            />
                            {formData.is_verified && <VerifiedBadgeIcon className="absolute -bottom-1 -right-1 size-8 text-brand-primary" />}
                        </div>
                    </div>
                </FormField>
                <hr className="h-px w-full border-none bg-gray-200 dark:bg-gray-800"/>
                <FormField label={t('settings.display_name')} description={t('settings.display_name_desc')} required>
                    <input 
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        className={`${inputClasses} px-3.5 py-2.5`}
                    />
                </FormField>
                <hr className="h-px w-full border-none bg-gray-200 dark:bg-gray-800"/>
                <FormField label={t('auth.username')} description={t('settings.username_desc')} required>
                    <input 
                        type="text"
                        name="username"
                        value={formData.username}
                        onChange={handleChange}
                        className={`${inputClasses} px-3.5 py-2.5`}
                    />
                </FormField>
                <hr className="h-px w-full border-none bg-gray-200 dark:bg-gray-800"/>
                <FormField label={t('settings.bio')} description={t('settings.bio_desc')} required>
                    <div className="flex w-full flex-col gap-2">
                        <div className="flex w-max flex-wrap gap-0.5 rounded-lg bg-white dark:bg-[#1e1e1e] p-1 shadow-sm ring-1 ring-inset ring-gray-300 dark:ring-gray-700">
                             <button type="button" className="flex size-8 items-center justify-center rounded-md text-gray-500 hover:bg-gray-100 dark:hover:bg-[#2a2a2a] hover:text-gray-700 dark:hover:text-gray-200"><BoldIcon/></button>
                             <button type="button" className="flex size-8 items-center justify-center rounded-md text-gray-500 hover:bg-gray-100 dark:hover:bg-[#2a2a2a] hover:text-gray-700 dark:hover:text-gray-200"><ItalicIcon/></button>
                             <button type="button" className="flex size-8 items-center justify-center rounded-md text-gray-500 hover:bg-gray-100 dark:hover:bg-[#2a2a2a] hover:text-gray-700 dark:hover:text-gray-200"><UnderlineIcon/></button>
                        </div>
                        <div className="flex flex-col gap-1.5">
                            <textarea
                                ref={bioRef}
                                name="bio"
                                value={formData.bio}
                                onChange={handleChange}
                                maxLength={150}
                                rows={5}
                                className={`${inputClasses} p-4 resize-y overflow-auto`}
                            ></textarea>
                            <span className="text-sm text-gray-500">{150 - formData.bio.length} characters left</span>
                        </div>
                    </div>
                </FormField>
                <hr className="h-px w-full border-none bg-gray-200 dark:bg-gray-800" />
                <FormField label={t('settings.social_profiles')}>
                    <div className="flex flex-col gap-4">
                        {socialProfiles.map(profile => (
                            <div key={profile.name} className="flex w-full rounded-lg shadow-sm">
                                <span className="flex items-center gap-2 rounded-l-lg border border-r-0 border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-[#2a2a2a] px-3 text-md text-gray-500 dark:text-gray-400">
                                    <profile.icon className="w-5 h-5 text-gray-400" />
                                    {profile.prefix}
                                </span>
                                <input
                                    type="text"
                                    name={profile.name}
                                    value={formData[profile.name as keyof typeof formData] as string || ''}
                                    onChange={handleChange}
                                    placeholder={profile.placeholder}
                                    className="relative -ml-px w-full rounded-r-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#1e1e1e] text-md text-gray-900 dark:text-white placeholder:text-gray-400 py-2.5 px-3.5 outline-none focus:z-10 focus:ring-2 focus:ring-inset focus:ring-black dark:focus:ring-white"
                                />
                            </div>
                        ))}
                    </div>
                </FormField>
            </div>
        </form>
    );
};

const PasswordSettings = ({ onSuccess }: { onSuccess: (msg: string) => void }) => {
    const { t } = useTranslation();
    const [passwords, setPasswords] = useState({
        current: '',
        new: '',
        confirm: ''
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setPasswords({ ...passwords, [e.target.name]: e.target.value });
    };

    const isDirty = passwords.current.length > 0 || passwords.new.length > 0 || passwords.confirm.length > 0;
    const isValid = passwords.current.length > 0 && passwords.new.length >= 8 && passwords.new === passwords.confirm;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (passwords.new !== passwords.confirm) {
            alert("New passwords do not match.");
            return;
        }
        if (passwords.new.length < 8) {
            alert("New password must be at least 8 characters long.");
            return;
        }
        // In a real app, you would make an API call here.
        onSuccess("Password updated successfully!");
        setPasswords({ current: '', new: '', confirm: '' });
    };

    return (
        <form onSubmit={handleSubmit} className="flex min-w-0 flex-1 flex-col gap-6 lg:gap-8">
            <div className="w-full flex flex-col gap-5 pt-0">
                <div className="flex flex-col justify-between gap-4 lg:flex-row">
                    <div className="flex flex-col gap-0.5 lg:gap-1">
                        <h1 className="text-xl font-semibold text-gray-900 dark:text-white lg:text-3xl">{t('settings.tabs.password')}</h1>
                        <p className="text-md text-gray-500 dark:text-gray-400">{t('settings.password_desc')}</p>
                    </div>
                    <div className="flex items-start gap-3">
                        <button 
                            type="button" 
                            onClick={() => setPasswords({ current: '', new: '', confirm: '' })}
                            disabled={!isDirty}
                            className="rounded-lg px-3.5 py-2.5 text-sm font-semibold bg-white dark:bg-[#1e1e1e] text-gray-700 dark:text-gray-200 shadow-sm ring-1 ring-inset ring-gray-300 dark:ring-gray-700 hover:bg-gray-50 dark:hover:bg-[#2a2a2a] disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {t('common.cancel')}
                        </button>
                        <button 
                            type="submit" 
                            disabled={!isValid}
                            className={`rounded-lg px-3.5 py-2.5 text-sm font-semibold shadow-sm transition-colors ${isValid ? 'bg-brand-primary text-black hover:bg-brand-primary/90' : 'bg-gray-200 dark:bg-gray-800 text-gray-500 cursor-not-allowed'}`}
                        >
                            {t('common.save')}
                        </button>
                    </div>
                </div>
            </div>
            <hr className="h-px w-full border-none bg-gray-200 dark:bg-gray-800" />
            <div className="flex flex-col gap-5">
                <FormField label={t('settings.current_password')} required>
                    <input
                        type="password" name="current" value={passwords.current} onChange={handleChange}
                        className={`${inputClasses} px-3.5 py-2.5`}
                    />
                </FormField>
                <hr className="h-px w-full border-none bg-gray-200 dark:bg-gray-800" />
                <FormField label={t('settings.new_password')} description={t('settings.new_password_desc')}>
                    <input
                        type="password" name="new" value={passwords.new} onChange={handleChange}
                        className={`${inputClasses} px-3.5 py-2.5`}
                    />
                </FormField>
                <hr className="h-px w-full border-none bg-gray-200 dark:bg-gray-800" />
                <FormField label={t('settings.confirm_password')} required>
                    <input
                        type="password" name="confirm" value={passwords.confirm} onChange={handleChange}
                        className={`${inputClasses} px-3.5 py-2.5`}
                    />
                </FormField>
            </div>
        </form>
    );
};

const Settings: React.FC<SettingsProps> = ({ initialTab = 'details', user, onUpdateUser, onNavigate }) => {
    const { t } = useTranslation();
    const [activeTab, setActiveTab] = useState(initialTab);
    const [notification, setNotification] = useState<string | null>(null);

    useEffect(() => {
        setActiveTab(initialTab);
    }, [initialTab]);

    const handleTabChange = (tab: string) => {
        setActiveTab(tab);
        onNavigate(`/settings/${tab}`);
    };

    const tabs = [
        { id: 'details', label: t('settings.tabs.details'), icon: UserCircleIcon },
        { id: 'profile', label: t('settings.tabs.profile'), icon: IdCardIcon },
        { id: 'password', label: t('settings.tabs.password'), icon: LockIcon },
    ];

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-[#0f0f0f] pt-32 md:pt-40 pb-12 transition-colors duration-200">
            {notification && <Notification message={notification} onClose={() => setNotification(null)} />}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="lg:grid lg:grid-cols-12 lg:gap-x-5">
                    <aside className="py-6 px-2 sm:px-6 lg:col-span-3 lg:py-0 lg:px-0">
                        <nav className="space-y-1">
                            {tabs.map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => handleTabChange(tab.id)}
                                    className={`
                                        group flex items-center px-3 py-2 text-sm font-medium rounded-md w-full transition-colors
                                        ${activeTab === tab.id
                                            ? 'bg-gray-200 dark:bg-[#1e1e1e] text-gray-900 dark:text-white'
                                            : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-[#1e1e1e] hover:text-gray-900 dark:hover:text-white'
                                        }
                                    `}
                                >
                                    <tab.icon
                                        className={`
                                            flex-shrink-0 -ml-1 mr-3 h-6 w-6
                                            ${activeTab === tab.id
                                                ? 'text-gray-900 dark:text-brand-primary'
                                                : 'text-gray-400 group-hover:text-gray-500 dark:group-hover:text-gray-300'
                                            }
                                        `}
                                    />
                                    <span className="truncate">{tab.label}</span>
                                </button>
                            ))}
                        </nav>
                    </aside>

                    <div className="space-y-6 sm:px-6 lg:col-span-9 lg:px-0">
                        <div className="shadow sm:rounded-md sm:overflow-hidden bg-white dark:bg-[#151515] p-6 border border-gray-200 dark:border-gray-800">
                            {activeTab === 'details' && <MyDetailsSettings user={user} onUpdateUser={onUpdateUser} onSuccess={setNotification} />}
                            {activeTab === 'profile' && <ProfileSettings user={user} onUpdateUser={onUpdateUser} onSuccess={setNotification} />}
                            {activeTab === 'password' && <PasswordSettings onSuccess={setNotification} />}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Settings;