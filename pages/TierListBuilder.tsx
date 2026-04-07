import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { TierRow, TierBuilderItem, Show, User, TierList } from '../types';
import { CloseIcon, SearchIconV2, SettingsIconV2, MenuIcon, PlusIcon, Logo } from '../constants';
import { searchSpecific, getShowDetails, slugify } from '../lib/tmdb'; // Use updated TMDB functions
import { supabase, isSupabaseConfigured, getTierListByIdOrSlug } from '../lib/supabaseClient';
import CommentsSection from '../components/CommentsSection';
import html2canvas from 'html2canvas';

// --- Custom Thin Icons ---

const IconHeart = ({ className, solid }: { className?: string; solid?: boolean }) => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill={solid ? "currentColor" : "none"} xmlns="http://www.w3.org/2000/svg" className={className}>
        <path 
            d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" 
            stroke="currentColor" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round"
        />
    </svg>
);

const IconComment = ({ className }: { className?: string }) => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
        <path
            d="M21 12C21 16.9706 16.9706 21 12 21C10.8029 21 9.6603 20.7663 8.61549 20.3419C8.41552 20.2607 8.31554 20.2201 8.23472 20.202C8.15566 20.1843 8.09715 20.1778 8.01613 20.1778C7.9333 20.1778 7.84309 20.1928 7.66265 20.2229L4.10476 20.8159C3.73218 20.878 3.54589 20.909 3.41118 20.8512C3.29328 20.8007 3.19933 20.7067 3.14876 20.5888C3.09098 20.4541 3.12203 20.2678 3.18413 19.8952L3.77711 16.3374C3.80718 16.1569 3.82222 16.0667 3.82221 15.9839C3.8222 15.9028 3.81572 15.8443 3.798 15.7653C3.77988 15.6845 3.73927 15.5845 3.65806 15.3845C3.23374 14.3397 3 13.1971 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
    </svg>
);

const IconRemix = ({ className }: { className?: string }) => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
        <path
            d="M2 10C2 10 2.12132 9.15076 5.63604 5.63604C9.15076 2.12132 14.8492 2.12132 18.364 5.63604C19.6092 6.88131 20.4133 8.40072 20.7762 10M2 10V4M2 10H8M22 14C22 14 21.8787 14.8492 18.364 18.364C14.8492 21.8787 9.15076 21.8787 5.63604 18.364C4.39076 17.1187 3.58669 15.5993 3.22383 14M22 14V20M22 14H16"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
    </svg>
);

const IconImageSave = ({ className }: { className?: string }) => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
        <path
            d="M16 5L19 8M19 8L22 5M19 8V2M12.5 3H7.8C6.11984 3 5.27976 3 4.63803 3.32698C4.07354 3.6146 3.6146 4.07354 3.32698 4.63803C3 5.27976 3 6.11984 3 7.8V16.2C3 17.8802 3 18.7202 3.32698 19.362C3.6146 19.9265 4.07354 20.3854 4.63803 20.673C5.27976 21 6.11984 21 7.8 21H17C17.93 21 18.395 21 18.7765 20.8978C19.8117 20.6204 20.6204 19.8117 20.8978 18.7765C21 18.395 21 17.93 21 17M10.5 8.5C10.5 9.60457 9.60457 10.5 8.5 10.5C7.39543 10.5 6.5 9.60457 6.5 8.5C6.5 7.39543 7.39543 6.5 8.5 6.5C9.60457 6.5 10.5 7.39543 10.5 8.5ZM14.99 11.9181L6.53115 19.608C6.05536 20.0406 5.81747 20.2568 5.79643 20.4442C5.77819 20.6066 5.84045 20.7676 5.96319 20.8755C6.10478 21 6.42628 21 7.06929 21H16.456C17.8951 21 18.6147 21 19.1799 20.7582C19.8894 20.4547 20.4547 19.8894 20.7582 19.1799C21 18.6147 21 17.8951 21 16.456C21 15.9717 21 15.7296 20.9471 15.5042C20.8805 15.2208 20.753 14.9554 20.5733 14.7264C20.4303 14.5442 20.2412 14.3929 19.8631 14.0905L17.0658 11.8527C16.6874 11.5499 16.4982 11.3985 16.2898 11.3451C16.1061 11.298 15.9129 11.3041 15.7325 11.3627C15.5279 11.4291 15.3486 11.5921 14.99 11.9181Z"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
    </svg>
);

const CustomTrashIcon = ({ className }: { className?: string }) => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
        <path
            d="M16 6V5.2C16 4.0799 16 3.51984 15.782 3.09202C15.5903 2.71569 15.2843 2.40973 14.908 2.21799C14.4802 2 13.9201 2 12.8 2H11.2C10.0799 2 9.51984 2 9.09202 2.21799C8.71569 2.40973 8.40973 2.71569 8.21799 3.09202C8 3.51984 8 4.0799 8 5.2V6M10 11.5V16.5M14 11.5V16.5M3 6H21M19 6V17.2C19 18.8802 19 19.7202 18.673 20.362C18.3854 20.9265 17.9265 21.3854 17.362 21.673C16.7202 22 15.8802 22 14.2 22H9.8C8.11984 22 7.27976 22 6.63803 21.673C6.07354 21.3854 5.6146 20.9265 5.32698 20.362C5 19.7202 5 18.8802 5 17.2V6"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
    </svg>
);

const CustomEditIcon = ({ className }: { className?: string }) => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
        <path
            d="M11 3.99998H6.8C5.11984 3.99998 4.27976 3.99998 3.63803 4.32696C3.07354 4.61458 2.6146 5.07353 2.32698 5.63801C2 6.27975 2 7.11983 2 8.79998V17.2C2 18.8801 2 19.7202 2.32698 20.362C2.6146 20.9264 3.07354 21.3854 3.63803 21.673C4.27976 22 5.11984 22 6.8 22H15.2C16.8802 22 17.7202 22 18.362 21.673C18.9265 21.3854 19.3854 20.9264 19.673 20.362C20 19.7202 20 18.8801 20 17.2V13M7.99997 16H9.67452C10.1637 16 10.4083 16 10.6385 15.9447C10.8425 15.8957 11.0376 15.8149 11.2166 15.7053C11.4184 15.5816 11.5914 15.4086 11.9373 15.0627L21.5 5.49998C22.3284 4.67156 22.3284 3.32841 21.5 2.49998C20.6716 1.67156 19.3284 1.67155 18.5 2.49998L8.93723 12.0627C8.59133 12.4086 8.41838 12.5816 8.29469 12.7834C8.18504 12.9624 8.10423 13.1574 8.05523 13.3615C7.99997 13.5917 7.99997 13.8363 7.99997 14.3255V16Z"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
    </svg>
);


interface TierListBuilderProps {
    onNavigate: (path: string) => void;
}

const DEFAULT_TIERS: TierRow[] = [
    { id: 'S', label: 'S', color: 'rgb(230, 115, 107)', items: [] },
    { id: 'A', label: 'A', color: 'rgb(239, 156, 84)', items: [] },
    { id: 'B', label: 'B', color: 'rgb(241, 228, 108)', items: [] },
    { id: 'C', label: 'C', color: 'rgb(187, 239, 121)', items: [] },
    { id: 'D', label: 'D', color: 'rgb(114, 217, 224)', items: [] },
    { id: 'E', label: 'E', color: 'rgb(182, 127, 225)', items: [] },
    { id: 'F', label: 'F', color: 'rgb(241, 98, 149)', items: [] },
];

const COLORS = [
    'rgb(230, 115, 107)', 'rgb(239, 156, 84)', 'rgb(241, 228, 108)', 'rgb(187, 239, 121)', 
    'rgb(114, 217, 224)', 'rgb(182, 127, 225)', 'rgb(241, 98, 149)', '#444444'
];

type SearchTab = 'tv' | 'movie' | 'person' | 'company';

const TierListBuilder: React.FC<TierListBuilderProps> = ({ onNavigate }) => {
    const { t } = useTranslation();
    const [tiers, setTiers] = useState<TierRow[]>(DEFAULT_TIERS);
    const [listTitle, setListTitle] = useState('');
    const [listSlug, setListSlug] = useState<string | null>(null);
    const [dbId, setDbId] = useState<string | null>(null);
    const [createdAt, setCreatedAt] = useState<string | null>(null);
    
    // Auth & Owner State
    const urlParam = window.location.pathname.split('/').pop();
    const isNew = urlParam === 'new' || !urlParam;
    
    const [isOwner, setIsOwner] = useState(isNew); 
    const [loadingList, setLoadingList] = useState(!isNew);
    const [listAuthor, setListAuthor] = useState<User | null>(null);
    const [currentUser, setCurrentUser] = useState<User | undefined>(undefined);
    const [likesCount, setLikesCount] = useState(0);
    const [isLiked, setIsLiked] = useState(false);

    // Modes
    const [isEditing, setIsEditing] = useState(false);

    // Editing State
    const [draggedItem, setDraggedItem] = useState<TierBuilderItem | null>(null);
    const [sourceTierId, setSourceTierId] = useState<string | 'pool' | null>(null);
    const [draggedRowIndex, setDraggedRowIndex] = useState<number | null>(null);
    const [isItemDragging, setIsItemDragging] = useState(false);
    const [editingRowId, setEditingRowId] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    
    // Refs for interaction & export
    const tierListRef = useRef<HTMLDivElement>(null);
    const exportRef = useRef<HTMLDivElement>(null);
    
    // Sidebar State
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<TierBuilderItem[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [searchTab, setSearchTab] = useState<SearchTab>('tv'); // Changed from filterMode
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);

    const ITEMS_PER_PAGE = 24;

    // --- INITIALIZATION ---
    useEffect(() => {
        const checkAuthAndFetch = async () => {
            let sessionUser = null;
            if (isSupabaseConfigured) {
                const { data: { user } } = await supabase.auth.getUser();
                if (user) {
                     sessionUser = user;
                     const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
                     setCurrentUser(profile as User);
                }
            }

            if (isNew) {
                // Check for Remix Draft
                const draft = localStorage.getItem('tierlist_remix_draft');
                if (draft) {
                    try {
                        const parsed = JSON.parse(draft);
                        setTiers(parsed.content);
                        setListTitle(parsed.title);
                        localStorage.removeItem('tierlist_remix_draft');
                    } catch (e) { console.error(e); }
                }
                setIsOwner(true);
                setIsEditing(true); // Auto-edit for new lists
                setLoadingList(false);
            } else if (urlParam) {
                try {
                    const data = await getTierListByIdOrSlug(urlParam);
                    if (!data) {
                        console.error('List not found');
                        onNavigate('/lists');
                        return;
                    }

                    // Auto-Correct URL to Slug if loading by ID
                    if (data.slug && urlParam !== data.slug) {
                        window.history.replaceState(null, '', `/lists/${data.slug}`);
                    }

                    setDbId(data.id);
                    setTiers(data.content);
                    setListTitle(data.title);
                    setListSlug(data.slug || null);
                    setLikesCount(data.likes_count || 0);
                    setCreatedAt(data.created_at);
                    
                    const author = data.user;
                    setListAuthor(author || null);

                    if (sessionUser && sessionUser.id === data.user_id) {
                        setIsOwner(true);
                        setIsEditing(false); // Start in view mode for owner
                    } else {
                        setIsOwner(false);
                        setIsEditing(false); // Ensure view mode for visitors
                    }
                } catch (e) {
                    console.error(e);
                } finally {
                    setLoadingList(false);
                }
            }
        };
        checkAuthAndFetch();
    }, [urlParam, isNew]);

    // --- DATA FETCHING (OWNER ONLY) ---
    const usedItemKeys = useMemo(() => {
        const keys = new Set<string>();
        tiers.forEach(tier => tier.items.forEach(item => keys.add(`${item.type}-${item.contentId}`)));
        return keys;
    }, [tiers]);

    useEffect(() => {
        if (!isEditing) return; // Only fetch if in edit mode

        const fetchData = async () => {
            setIsLoading(true);
            try {
                const query = searchQuery.trim();
                
                // Use specific search logic based on tab
                const data = await searchSpecific(query || 'a', searchTab, page);
                
                setSearchResults(data.results.map(item => {
                    let image = '';
                    let title = item.name || item.title;
                    
                    if (searchTab === 'company') { // Network
                        image = item.logo_path ? `https://image.tmdb.org/t/p/w200${item.logo_path}` : 'https://via.placeholder.com/150?text=No+Logo';
                    } else if (searchTab === 'person') {
                        image = item.profile_path ? `https://image.tmdb.org/t/p/w200${item.profile_path}` : 'https://via.placeholder.com/200?text=No+Image';
                    } else {
                        image = item.poster_path ? `https://image.tmdb.org/t/p/w200${item.poster_path}` : 'https://via.placeholder.com/150?text=No+Image';
                    }

                    return {
                        id: `${searchTab}-${item.id}`,
                        contentId: item.id,
                        image: image,
                        title: title,
                        type: searchTab // Assigning 'tv', 'movie', 'person', or 'company' directly
                    };
                }));
                setHasMore(data.results.length > 0);

            } catch (e) { console.error(e); } finally { setIsLoading(false); }
        };

        const timer = setTimeout(fetchData, 400);
        return () => clearTimeout(timer);
    }, [searchTab, searchQuery, page, isEditing]);

    // --- ACTIONS ---
    const handleSave = async () => {
        if (!listTitle.trim()) return alert("Please enter a title.");
        if (!isSupabaseConfigured) return alert("Demo Mode: Save simulated.");
        
        setIsSaving(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return onNavigate('/login');

            const thumbnails: string[] = [];
            for (const tier of tiers) {
                for (const item of tier.items) {
                    if (thumbnails.length < 3 && item.image) thumbnails.push(item.image);
                }
                if (thumbnails.length >= 3) break;
            }

            const baseSlug = slugify(listTitle);
            const slug = isNew || !listSlug ? (baseSlug || `list-${Date.now()}`) : listSlug;

            const payload: any = {
                user_id: user.id, 
                title: listTitle, 
                slug: slug, 
                content: tiers, 
                thumbnail_images: thumbnails, 
                updated_at: new Date().toISOString()
            };

            let savedData = null;

            if (!isNew && dbId) {
                const { data, error } = await supabase.from('tier_lists').update(payload).eq('id', dbId).select().single();
                if (error) throw error;
                savedData = data;
            } else {
                const { data, error } = await supabase.from('tier_lists').insert(payload).select().single();
                if (error) {
                    // Retry with suffix if unique slug conflict
                    if (error.code === '23505') { 
                         const newSlug = `${slug}-${Math.floor(Math.random() * 1000)}`;
                         payload.slug = newSlug;
                         const { data: retryData, error: retryError } = await supabase.from('tier_lists').insert(payload).select().single();
                         if (retryError) throw retryError;
                         savedData = retryData;
                    } else {
                        throw error;
                    }
                } else {
                    savedData = data;
                }
            }
            
            // Redirect to View Mode with Slug URL
            if (savedData) {
                setDbId(savedData.id);
                setListSlug(savedData.slug);
                setIsEditing(false); // Switch to view mode
                onNavigate(`/lists/${savedData.slug || savedData.id}`);
            } else {
                onNavigate('/lists'); // Fallback
            }

        } catch (e: any) {
            alert("Failed to save: " + e.message);
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeleteList = async () => {
        if (!confirm('Are you sure you want to delete this Tier List?')) return;
        if (!isSupabaseConfigured || !dbId) return;
        try {
            await supabase.from('tier_lists').delete().eq('id', dbId);
            onNavigate('/lists');
        } catch (e: any) { alert(e.message); }
    };

    const handleRemix = () => {
        localStorage.setItem('tierlist_remix_draft', JSON.stringify({ title: `Remix of ${listTitle}`, content: tiers }));
        onNavigate('/lists/new');
    };

    const handleDownload = async () => {
        if (!exportRef.current) return;
        setIsSaving(true); // Re-using saving state for loading indication
        try {
            // Wait for potential image rendering in the hidden view
            await new Promise(r => setTimeout(r, 500));
            
            const canvas = await html2canvas(exportRef.current, { 
                useCORS: true, 
                backgroundColor: '#0f0f0f', 
                scale: 2,
                logging: true,
                scrollX: 0,
                scrollY: 0,
                width: 1280, // Force width to match container for consistency
                windowWidth: 1280
            });
            
            const link = document.createElement('a');
            link.download = `${slugify(listTitle || 'tierlist')}.png`;
            link.href = canvas.toDataURL('image/png');
            link.click();
        } catch (e) { 
            console.error(e);
            alert("Failed to generate image."); 
        } finally {
            setIsSaving(false);
        }
    };

    const handleLike = async () => {
        if (isLiked) return;
        setIsLiked(true);
        setLikesCount(p => p + 1);
        if (dbId && isSupabaseConfigured) {
             await supabase.from('tier_lists').update({ likes_count: likesCount + 1 }).eq('id', dbId);
        }
    };

    // --- DRAG & DROP ---
    const handleDragStart = (e: React.DragEvent, item: any, type: 'ITEM' | 'ROW', sourceId?: string) => {
        if (!isEditing) return; // Enforce editing mode for drag
        e.dataTransfer.setData('type', type);
        if (type === 'ITEM') {
            setDraggedItem(item);
            setSourceTierId(sourceId || 'pool');
            setIsItemDragging(true);
        } else {
            setDraggedRowIndex(item); // item is index for row
        }
    };

    const handleDrop = (e: React.DragEvent, targetTierId?: string) => {
        if (!isEditing) return;
        e.preventDefault();
        const type = e.dataTransfer.getData('type');
        
        if (type === 'ROW' && draggedRowIndex !== null && targetTierId) {
             setDraggedRowIndex(null);
             return;
        }

        if (type === 'ITEM' && draggedItem && targetTierId) {
            if (sourceTierId === targetTierId) {
                setDraggedItem(null); setIsItemDragging(false); return;
            }
            setTiers(prev => {
                const newTiers = [...prev];
                // Remove from source if not pool
                if (sourceTierId !== 'pool') {
                    const sIdx = newTiers.findIndex(t => t.id === sourceTierId);
                    if (sIdx > -1) newTiers[sIdx].items = newTiers[sIdx].items.filter(i => i.id !== draggedItem.id);
                } else {
                    // Check duplicate if coming from pool
                    const exists = newTiers.some(t => t.items.some(i => i.contentId === draggedItem.contentId && i.type === draggedItem.type));
                    if (exists) return prev;
                }
                // Add to target
                const tIdx = newTiers.findIndex(t => t.id === targetTierId);
                if (tIdx > -1) newTiers[tIdx].items.push(draggedItem);
                return newTiers;
            });
        }
        setDraggedItem(null); setIsItemDragging(false);
    };

    const handleDragOver = (e: React.DragEvent, targetTierId?: string, targetIndex?: number) => {
        if (!isEditing) return;
        e.preventDefault();
        if (draggedRowIndex !== null && targetIndex !== undefined && draggedRowIndex !== targetIndex) {
             setTiers(prev => {
                 const newTiers = [...prev];
                 const [removed] = newTiers.splice(draggedRowIndex, 1);
                 newTiers.splice(targetIndex, 0, removed);
                 return newTiers;
             });
             setDraggedRowIndex(targetIndex);
        }
    };

    const displayedResults = useMemo(() => {
        let results = searchResults.filter(item => !usedItemKeys.has(`${item.type}-${item.contentId}`));
        // Reapply key filtering logic if needed, but results are already specific to tab
        return results;
    }, [searchResults, usedItemKeys]);
    
    const clientHasMore = hasMore; // Simplified logic since we fetch direct pages

    if (loadingList) return <div className="min-h-screen bg-[#0f0f0f] pt-36 text-white text-center">Loading...</div>;

    const timeAgo = (dateStr: string) => {
        const diff = Date.now() - new Date(dateStr).getTime();
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        if (days === 0) return 'Today';
        if (days === 1) return 'Yesterday';
        if (days < 30) return `${days}d`;
        return new Date(dateStr).toLocaleDateString();
    };

    // Determine displayed user info (Owner if Viewing, Current User if Creating)
    const displayUser = isNew ? currentUser : listAuthor;
    const displayDate = isNew ? new Date().toISOString() : createdAt;

    return (
        <div className="min-h-screen bg-[#0f0f0f] pt-36 pb-12 transition-colors duration-200">
            <div className={`mx-auto px-4 md:px-8 w-full max-w-7xl`}>
                
                {/* UNIFIED HEADER (Layout for ALL Modes) */}
                <div className="flex w-full items-start justify-between mb-4 gap-4 min-h-[60px]">
                    {/* Left: User Info (Only in View Mode) */}
                    {!isEditing ? (
                        <div className="flex items-center gap-3">
                             <a href={`/u/${displayUser?.username || '#'}`} className="flex-shrink-0">
                                <div className="h-12 w-12 rounded-lg border border-white/10 overflow-hidden bg-gray-800">
                                    <img 
                                        src={displayUser?.avatar_url || 'https://via.placeholder.com/62'} 
                                        alt={displayUser?.name || 'User'} 
                                        className="h-full w-full object-cover" 
                                    />
                                </div>
                            </a>
                            <div className="flex flex-col">
                                <div className="text-white text-base font-bold leading-tight">{displayUser?.name || (isNew ? 'You' : 'Unknown')}</div>
                                <div className="text-gray-500 text-xs">{displayDate ? timeAgo(displayDate) : 'Just now'}</div>
                            </div>
                        </div>
                    ) : (
                        <div></div> /* Empty spacer */
                    )}
                    
                    {/* Right: Actions */}
                    <div className="flex items-center gap-6 ml-auto">
                         {!isEditing ? (
                             <>
                                {/* View Mode Icons */}
                                <button 
                                    onClick={handleLike} 
                                    className={`flex flex-col items-center gap-0.5 transition-colors ${isLiked ? 'text-red-500' : 'text-gray-400 hover:text-white'}`}
                                >
                                    <IconHeart className="h-6 w-6" solid={isLiked} />
                                    <div className="text-[10px] font-bold tabular-nums">{likesCount}</div>
                                </button>
                                
                                <div className="flex flex-col items-center gap-0.5 text-gray-400">
                                    <IconComment className="w-6 h-6" />
                                    <span className="text-[10px] font-bold tabular-nums">0</span>
                                </div>

                                <div className="flex flex-col items-center gap-0.5 text-gray-400 hover:text-white cursor-pointer" onClick={handleRemix}>
                                    <IconRemix className="w-6 h-6" />
                                    <span className="text-[10px] font-bold tabular-nums">Remix</span>
                                </div>

                                <div className="flex flex-col items-center gap-0.5 text-gray-400 hover:text-white cursor-pointer" onClick={handleDownload}>
                                    <IconImageSave className="w-6 h-6" />
                                    <span className="text-[10px] font-bold tabular-nums">Save</span>
                                </div>

                                {isOwner && (
                                    <div className="flex flex-col items-center gap-0.5 text-brand-primary hover:text-brand-primary/80 cursor-pointer" onClick={() => setIsEditing(true)}>
                                        <CustomEditIcon className="w-6 h-6" />
                                        <span className="text-[10px] font-bold tabular-nums">Edit</span>
                                    </div>
                                )}
                             </>
                         ) : (
                             <>
                                {/* Edit Mode Buttons */}
                                {!isNew && (
                                    <button onClick={handleDeleteList} className="p-2.5 rounded-lg bg-red-900/20 text-red-500 border border-red-900/50 hover:bg-red-900/40 transition-colors" title="Delete List">
                                        <CustomTrashIcon className="w-5 h-5" />
                                    </button>
                                )}
                                <button onClick={handleSave} disabled={isSaving} className="px-6 py-2.5 bg-brand-primary text-black rounded-lg font-bold text-sm hover:bg-brand-primary/90 transition-colors disabled:opacity-50 flex items-center gap-2">
                                    {isSaving ? 'Saving...' : 'Save List'}
                                </button>
                                {!isNew && (
                                    <button onClick={() => setIsEditing(false)} className="px-4 py-2.5 bg-gray-800 text-white rounded-lg font-bold text-sm hover:bg-gray-700 transition-colors">
                                        Cancel
                                    </button>
                                )}
                             </>
                         )}
                    </div>
                </div>

                {/* TITLE ROW */}
                <div className="mb-8 w-full">
                    {isEditing ? (
                         <input 
                            type="text" 
                            placeholder="Tier List Title..." 
                            value={listTitle}
                            onChange={(e) => setListTitle(e.target.value)}
                            className="bg-transparent text-3xl md:text-5xl font-extrabold text-white placeholder-gray-600 focus:outline-none w-full leading-tight border-b border-transparent focus:border-gray-700 transition-colors pb-1"
                        />
                    ) : (
                        <h1 className="text-white text-3xl md:text-5xl font-extrabold leading-tight break-words w-full">
                            {listTitle}
                        </h1>
                    )}
                </div>

                {/* MAIN CONTENT AREA */}
                <div className="flex flex-col lg:flex-row gap-6 items-start relative">
                    
                    {/* TIER LIST BOARD */}
                    <div className="flex-1 w-full min-w-0">
                        <div 
                            ref={tierListRef} 
                            id="tierlist-interactive"
                            className="flex flex-col gap-2 w-full rounded-2xl bg-[#0f0f0f] p-4" 
                        >
                            {tiers.map((tier, index) => (
                                <div 
                                    key={tier.id} 
                                    className={`flex w-full gap-1 rounded-[16px] p-1 bg-[#1a1a1a] min-h-[100px] relative ${draggedRowIndex === index ? 'opacity-50' : 'opacity-100'}`}
                                    onDragOver={(e) => handleDragOver(e, tier.id, index)}
                                    onDrop={(e) => handleDrop(e, tier.id)}
                                >
                                    {/* Label */}
                                    <div 
                                        className={`group/tier relative flex flex-shrink-0 items-center justify-center rounded-[12px] p-1 text-center font-bold select-none w-[53px] min-h-[80px] md:w-[93px] md:min-h-[146px] aspect-[93/145] ${isEditing ? 'cursor-pointer hover:brightness-110' : ''}`}
                                        style={{ backgroundColor: tier.color, color: '#000', fontSize: '18px' }}
                                        onClick={() => isEditing && setEditingRowId(tier.id)}
                                    >
                                        <div className="break-words leading-[1.1]">{tier.label}</div>
                                        {isEditing && <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 hover:opacity-100 rounded-[12px]"><SettingsIconV2 className="w-5 h-5 text-white" /></div>}
                                    </div>

                                    {/* Items Grid */}
                                    <div className="grid w-full gap-2 grid-cols-[repeat(auto-fill,minmax(53px,1fr))] md:grid-cols-[repeat(auto-fill,minmax(93px,1fr))] content-start">
                                        {tier.items.map((item) => (
                                            <div 
                                                key={`${tier.id}-${item.id}`} 
                                                draggable={isEditing}
                                                onDragStart={(e) => handleDragStart(e, item, 'ITEM', tier.id)}
                                                className={`group/item relative aspect-[93/145] rounded-lg overflow-hidden bg-gray-800 ${isEditing ? 'cursor-grab active:cursor-grabbing' : ''}`}
                                            >
                                                <img 
                                                    src={item.image} 
                                                    alt={item.title} 
                                                    className="w-full h-full object-cover pointer-events-none transition-transform duration-200 scale-100 group-hover/item:scale-110" 
                                                    onError={(e) => { e.currentTarget.src = 'https://via.placeholder.com/150?text=No+Image'; }}
                                                />
                                                
                                                {/* Tooltip on Hover */}
                                                <div className="absolute bottom-0 inset-x-0 bg-black/80 text-white text-[10px] text-center p-1 opacity-0 group-hover/item:opacity-100 transition-all duration-200 translate-y-full group-hover/item:translate-y-0 flex items-center justify-center min-h-[24px]">
                                                    <p className="line-clamp-2 leading-tight w-full">{item.title}</p>
                                                </div>

                                                {isEditing && (
                                                    <button 
                                                        onClick={() => setTiers(prev => prev.map(t => t.id === tier.id ? { ...t, items: t.items.filter(i => i.id !== item.id) } : t))}
                                                        className="absolute top-0 right-0 bg-black/60 text-white p-0.5 rounded-bl opacity-0 group-hover/item:opacity-100 hover:bg-red-600 transition-opacity z-10"
                                                    >
                                                        <CloseIcon className="w-3 h-3" />
                                                    </button>
                                                )}
                                            </div>
                                        ))}
                                    </div>

                                    {/* Row Drag Handle (Owner Only) */}
                                    {isEditing && (
                                        <div 
                                            className="w-6 flex items-center justify-center cursor-grab active:cursor-grabbing hover:bg-[#333] rounded-r-lg absolute -right-6 top-0 bottom-0 h-full opacity-0 hover:opacity-100 md:opacity-100 md:static md:w-6 md:hover:bg-[#333]"
                                            draggable
                                            onDragStart={(e) => handleDragStart(e, index, 'ROW')}
                                            onDragEnd={() => setDraggedRowIndex(null)}
                                        >
                                            <MenuIcon className="w-4 h-4 text-gray-500 rotate-90" />
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                        
                        {isEditing && (
                            <button onClick={() => setTiers(prev => [...prev, { id: `new-${Date.now()}`, label: 'NEW', color: '#444', items: [] }])} className="w-full h-12 mt-4 border-2 border-dashed border-gray-800 rounded-lg flex items-center justify-center text-gray-500 hover:text-white hover:border-gray-600 hover:bg-white/5 transition-colors">
                                <PlusIcon className="w-5 h-5 mr-2" /> ADD ROW
                            </button>
                        )}
                        
                        {!isNew && dbId && !isEditing && (
                            <div className="mt-8 pt-8 border-t border-gray-800">
                                <CommentsSection showId={-1 /* Using negative ID convention or similar for tier lists if needed, but standard CommentsSection expects show_id. Assuming updated backend or handling elsewhere */} onViewUser={(u) => onNavigate(`/u/${u.username}`)} currentUser={currentUser} />
                            </div>
                        )}
                    </div>

                    {/* SIDEBAR (EDITING ONLY) */}
                    {isEditing && (
                        <div className="lg:w-96 w-full flex-shrink-0 bg-[#121212] rounded-xl border border-gray-800 overflow-hidden flex flex-col h-[calc(100vh-10rem)] sticky top-36 shadow-xl">
                             <div className="p-4 border-b border-gray-800 bg-[#151515]">
                                <div className="relative mb-3">
                                    <input 
                                        type="text" 
                                        placeholder={`Search ${searchTab === 'company' ? 'networks' : searchTab}s...`}
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="w-full bg-[#222] border border-gray-700 rounded-lg py-2 pl-9 pr-3 text-sm text-white focus:outline-none focus:border-brand-primary"
                                    />
                                    <SearchIconV2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                    <button 
                                        onClick={() => { setSearchTab('tv'); setPage(1); setSearchQuery(''); }} 
                                        className={`py-1.5 text-[10px] md:text-xs font-bold rounded ${searchTab === 'tv' ? 'bg-white text-black' : 'bg-[#222] text-gray-400'}`}
                                    >
                                        TV Shows
                                    </button>
                                    <button 
                                        onClick={() => { setSearchTab('movie'); setPage(1); setSearchQuery(''); }} 
                                        className={`py-1.5 text-[10px] md:text-xs font-bold rounded ${searchTab === 'movie' ? 'bg-white text-black' : 'bg-[#222] text-gray-400'}`}
                                    >
                                        Movies
                                    </button>
                                    <button 
                                        onClick={() => { setSearchTab('person'); setPage(1); setSearchQuery(''); }} 
                                        className={`py-1.5 text-[10px] md:text-xs font-bold rounded ${searchTab === 'person' ? 'bg-white text-black' : 'bg-[#222] text-gray-400'}`}
                                    >
                                        Person
                                    </button>
                                    <button 
                                        onClick={() => { setSearchTab('company'); setPage(1); setSearchQuery(''); }} 
                                        className={`py-1.5 text-[10px] md:text-xs font-bold rounded ${searchTab === 'company' ? 'bg-white text-black' : 'bg-[#222] text-gray-400'}`}
                                    >
                                        Network
                                    </button>
                                </div>
                             </div>

                             <div className="flex-1 overflow-y-auto p-3 bg-[#0a0a0a] scrollbar-hide">
                                {isLoading ? (
                                    <div className="flex justify-center py-10"><div className="animate-spin h-6 w-6 border-2 border-white rounded-full border-t-transparent"></div></div>
                                ) : (
                                    <>
                                        <div className="grid grid-cols-3 gap-2">
                                            {displayedResults.map(item => (
                                                <div 
                                                    key={item.id}
                                                    draggable
                                                    onDragStart={(e) => handleDragStart(e, item, 'ITEM')}
                                                    className={`aspect-[93/145] bg-gray-800 rounded overflow-hidden relative group cursor-grab active:cursor-grabbing hover:ring-2 hover:ring-white`}
                                                >
                                                    <img 
                                                        src={item.image || 'https://via.placeholder.com/150?text=No+Image'} 
                                                        alt={item.title} 
                                                        className={`w-full h-full object-cover transition-transform duration-200 scale-100 group-hover:scale-110 ${searchTab === 'company' ? 'object-contain p-2 bg-white' : ''}`} 
                                                        onError={(e) => { e.currentTarget.src = 'https://via.placeholder.com/150?text=No+Image'; }}
                                                    />
                                                    <div className="absolute inset-x-0 bottom-0 bg-black/80 p-1 opacity-0 group-hover:opacity-100 flex items-center justify-center text-center transition-all duration-200 translate-y-full group-hover:translate-y-0 pointer-events-none min-h-[24px]">
                                                        <span className="text-[10px] text-white font-bold line-clamp-2 leading-tight">{item.title}</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                        {displayedResults.length === 0 && !isLoading && (
                                            <div className="text-center text-gray-600 text-xs py-10 px-4">
                                                {searchResults.length > 0 ? (
                                                    <p>All items on this page are already in your list.</p>
                                                ) : (
                                                    <p>No items found</p>
                                                )}
                                            </div>
                                        )}
                                    </>
                                )}
                             </div>

                             <div className="p-3 border-t border-gray-800 flex gap-2 bg-[#151515]">
                                 <button disabled={page===1} onClick={() => setPage(p=>p-1)} className="flex-1 py-2 bg-[#222] text-xs font-bold rounded text-gray-300 disabled:opacity-50">Prev</button>
                                 <button disabled={!clientHasMore} onClick={() => setPage(p=>p+1)} className="flex-1 py-2 bg-[#222] text-xs font-bold rounded text-gray-300 disabled:opacity-50">Next</button>
                             </div>
                        </div>
                    )}
                </div>
            </div>
            
            {/* Hidden Export Layer */}
            <div style={{ position: 'absolute', top: '-10000px', left: '-10000px', width: '1280px', zIndex: -1 }}>
                <div ref={exportRef} className="bg-[#0f0f0f] p-8 flex flex-col gap-6 text-white min-h-screen font-sans">
                    <div className="flex items-center justify-between border-b border-gray-800 pb-4">
                         <div>
                            <h1 className="text-4xl font-extrabold tracking-tight text-white mb-1">{listTitle || 'My Tier List'}</h1>
                            <p className="text-gray-500 text-sm font-medium">Created on AnimeLab</p>
                         </div>
                         <div className="opacity-80 scale-125 origin-right"><Logo /></div>
                    </div>
                    <div className="flex flex-col gap-2">
                         {tiers.map(tier => (
                             <div key={tier.id} className="flex w-full gap-2 rounded-xl bg-[#1a1a1a] p-2 min-h-[120px]">
                                  <div 
                                      className="flex-shrink-0 flex items-center justify-center rounded-lg p-2 text-center font-bold w-[100px] text-black break-words text-2xl leading-tight select-none shadow-md"
                                      style={{ backgroundColor: tier.color }}
                                  >
                                      {tier.label}
                                  </div>
                                  <div className="flex flex-wrap gap-2 content-start p-1">
                                      {tier.items.map(item => (
                                          <div key={item.id} className="relative w-[90px] aspect-[93/145] rounded-md overflow-hidden bg-gray-800 flex-shrink-0 shadow-sm border border-white/5">
                                               <img 
                                                   src={item.image} 
                                                   alt="" 
                                                   className="w-full h-full object-cover" 
                                                   crossOrigin="anonymous"
                                               />
                                               <div className="absolute inset-x-0 bottom-0 bg-black/70 p-1">
                                                   <p className="text-[8px] text-center text-gray-200 line-clamp-2 leading-tight font-medium">{item.title}</p>
                                               </div>
                                          </div>
                                      ))}
                                  </div>
                             </div>
                         ))}
                    </div>
                    <div className="mt-auto pt-6 text-center text-gray-600 text-sm font-semibold tracking-wide uppercase">
                        animelab.org
                    </div>
                </div>
            </div>

            {/* Row Edit Modal */}
            {editingRowId && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={() => setEditingRowId(null)}>
                    <div className="bg-[#1e1e1e] rounded-xl p-6 w-full max-w-sm border border-gray-800" onClick={e => e.stopPropagation()}>
                        <h3 className="text-lg font-bold text-white mb-4">Edit Row</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="text-xs text-gray-500 font-bold uppercase">Label</label>
                                <input 
                                    className="w-full bg-[#2a2a2a] border border-gray-700 rounded p-2 text-white mt-1"
                                    value={tiers.find(t => t.id === editingRowId)?.label}
                                    onChange={(e) => setTiers(prev => prev.map(t => t.id === editingRowId ? { ...t, label: e.target.value } : t))}
                                />
                            </div>
                            <div>
                                <label className="text-xs text-gray-500 font-bold uppercase">Color</label>
                                <div className="grid grid-cols-6 gap-2 mt-1">
                                    {COLORS.map(c => (
                                        <button 
                                            key={c} 
                                            style={{ backgroundColor: c }} 
                                            className={`w-8 h-8 rounded-full border-2 ${tiers.find(t => t.id === editingRowId)?.color === c ? 'border-white scale-110' : 'border-transparent'}`}
                                            onClick={() => setTiers(prev => prev.map(t => t.id === editingRowId ? { ...t, color: c } : t))}
                                        />
                                    ))}
                                </div>
                            </div>
                            <div className="flex gap-2 pt-4">
                                <button onClick={() => { setTiers(prev => prev.map(t => t.id === editingRowId ? { ...t, items: [] } : t)); setEditingRowId(null); }} className="flex-1 py-2 bg-gray-700 rounded text-white text-sm font-bold">Clear Items</button>
                                <button onClick={() => { setTiers(prev => prev.filter(t => t.id !== editingRowId)); setEditingRowId(null); }} className="flex-1 py-2 bg-red-900/50 text-red-500 border border-red-900 rounded text-sm font-bold">Delete Row</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TierListBuilder;