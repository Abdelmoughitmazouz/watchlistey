
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    XIcon, HeartIcon, TrashIcon, CalendarIcon, 
    ChevronDownIcon, LockIcon, EyeIcon, EyeOffIcon,
    WatchingIcon, PlanningIcon, CompletedIcon, 
    RewatchingIcon, PausedIcon, DroppedIcon, CheckIcon
} from '../constants';
import { Show, ListItem, ListStatus } from '../types';
import { useTranslation } from 'react-i18next';

interface ShowEditorModalProps {
    isOpen: boolean;
    onClose: () => void;
    show: Show;
    listItem?: ListItem;
    onSave: (data: Partial<ListItem>) => Promise<void>;
    onDelete: () => Promise<void>;
    isFavorite: boolean;
    onToggleFavorite: () => void;
}

const ShowEditorModal: React.FC<ShowEditorModalProps> = ({
    isOpen,
    onClose,
    show,
    listItem,
    onSave,
    onDelete,
    isFavorite,
    onToggleFavorite
}) => {
    const { t } = useTranslation();
    const [status, setStatus] = useState<ListStatus>(listItem?.status || '');
    const [score, setScore] = useState<number>(listItem?.rating || 0);
    const [progress, setProgress] = useState<number>(listItem?.progress || 0);
    const [startDate, setStartDate] = useState<string>(listItem?.start_date?.split('T')[0] || '');
    const [finishDate, setFinishDate] = useState<string>(listItem?.finish_date?.split('T')[0] || '');
    const [rewatchCount, setRewatchCount] = useState<number>(listItem?.rewatch_count || 0);
    const [notes, setNotes] = useState<string>(listItem?.notes || '');
    const [isPrivate, setIsPrivate] = useState<boolean>(listItem?.is_private || false);
    const [customLists, setCustomLists] = useState<string[]>(listItem?.custom_lists || []);
    const [isSaving, setIsSaving] = useState(false);

    const totalEpisodes = show.media_type === 'tv' ? (show.number_of_episodes || 0) : 1;

    // Reactive logic for status and dates
    useEffect(() => {
        if (!isOpen) return;

        const today = new Date().toISOString().split('T')[0];

        // 1. Auto-Watching: If score or progress is set, and status is Planning/Unspecified
        if ((score > 0 || progress > 0) && (status === 'Planning' || status === 'Plan to Watch' || status === '')) {
            setStatus('Watching');
            if (!startDate) setStartDate(today);
        }

        // 2. Auto-Completion: If progress reaches max (and max is > 0)
        if (totalEpisodes > 0 && progress === totalEpisodes && status !== 'Completed' && status !== '') {
            setStatus('Completed');
            if (!finishDate) setFinishDate(today);
        }
        
        // 3. Auto-Start Date: If status is Watching and no start date
        if (status === 'Watching' && !startDate) {
            setStartDate(today);
        }
    }, [score, progress, status, totalEpisodes, isOpen]);

    const handleSave = async () => {
        setIsSaving(true);
        try {
            let finalStatus = status;
            let finalStartDate = startDate;
            let finalFinishDate = finishDate;

            const today = new Date().toISOString().split('T')[0];

            // Apply auto-logic one last time before saving
            if ((score > 0 || progress > 0) && (finalStatus === 'Planning' || finalStatus === 'Plan to Watch' || finalStatus === '')) {
                finalStatus = 'Watching';
                if (!finalStartDate) finalStartDate = today;
            }

            if (totalEpisodes > 0 && progress === totalEpisodes && finalStatus !== 'Completed' && finalStatus !== '') {
                finalStatus = 'Completed';
                if (!finalFinishDate) finalFinishDate = today;
            }

            if (finalStatus === 'Watching' && !finalStartDate) {
                finalStartDate = today;
            }

            await onSave({
                status: finalStatus || 'Planning',
                rating: score,
                progress,
                start_date: finalStartDate ? new Date(finalStartDate).toISOString() : undefined,
                finish_date: finalFinishDate ? new Date(finalFinishDate).toISOString() : undefined,
                rewatch_count: rewatchCount,
                notes,
                is_private: isPrivate,
                custom_lists: customLists
            });
            onClose();
        } catch (error) {
            console.error("Failed to save list item", error);
        } finally {
            setIsSaving(false);
        }
    };

    const statusOptions: { value: ListStatus; label: string; icon: any }[] = [
        { value: 'Watching', label: 'Watching', icon: WatchingIcon },
        { value: 'Planning', label: 'Planning', icon: PlanningIcon },
        { value: 'Completed', label: 'Completed', icon: CompletedIcon },
        { value: 'Rewatching', label: 'Rewatching', icon: RewatchingIcon },
        { value: 'Paused', label: 'Paused', icon: PausedIcon },
        { value: 'Dropped', label: 'Dropped', icon: DroppedIcon },
    ];

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                <motion.div 
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    className="bg-[#0b1622] text-[#929292] w-full max-w-4xl rounded-lg overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
                >
                    {/* Header with Banner */}
                    <div className="relative h-32 sm:h-40 w-full bg-gray-800 flex-shrink-0">
                        {show.backdrop_url && (
                            <img 
                                src={show.backdrop_url} 
                                alt="Banner" 
                                className="w-full h-full object-cover opacity-30"
                            />
                        )}
                        <div className="absolute inset-0 bg-gradient-to-r from-[#0b1622] via-[#0b1622]/80 to-transparent" />
                        
                        <button 
                            onClick={onClose}
                            className="absolute top-4 right-4 p-2 hover:bg-white/10 rounded-full transition-colors z-20"
                        >
                            <XIcon className="w-5 h-5 text-white/50 hover:text-white" />
                        </button>

                        <div className="absolute inset-0 p-6 flex items-center gap-6">
                            <div className="w-16 sm:w-20 aspect-[2/3] rounded shadow-lg border border-white/10 flex-shrink-0">
                                <img src={show.image_url} alt={show.title} className="w-full h-full object-cover" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <h2 className="text-lg sm:text-xl font-bold text-white truncate">{show.title}</h2>
                            </div>
                            <div className="flex items-center gap-3">
                                <button 
                                    onClick={onToggleFavorite}
                                    className={`p-2 transition-all ${isFavorite ? 'text-red-500' : 'text-white/50 hover:text-white'}`}
                                >
                                    <HeartIcon className="w-6 h-6" solid={isFavorite} />
                                </button>
                                <button 
                                    onClick={handleSave}
                                    disabled={isSaving}
                                    className="bg-[#3db4f2] hover:bg-[#3db4f2]/90 text-white px-6 py-2 rounded font-bold transition-colors disabled:opacity-50 text-sm"
                                >
                                    {isSaving ? 'Saving...' : 'Save'}
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Body */}
                    <div className="flex-1 overflow-y-auto p-8 grid grid-cols-1 md:grid-cols-4 gap-x-8 gap-y-6">
                        {/* Main Form Area */}
                        <div className="md:col-span-3 space-y-6">
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                                {/* Status */}
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-[#3db4f2]/80 uppercase tracking-wider">Status</label>
                                    <div className="relative">
                                        <select 
                                            value={status}
                                            onChange={(e) => setStatus(e.target.value as ListStatus)}
                                            className="w-full bg-[#151f2e] border-none rounded py-2.5 px-4 text-sm text-white appearance-none focus:ring-1 focus:ring-[#3db4f2] outline-none"
                                        >
                                            <option value="" disabled>Status (unspecified)</option>
                                            {statusOptions.map(opt => (
                                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                                            ))}
                                        </select>
                                        <ChevronDownIcon className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500 w-4 h-4" />
                                    </div>
                                </div>

                                {/* Score */}
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-[#3db4f2]/80 uppercase tracking-wider">Score</label>
                                    <div className="relative">
                                        <input 
                                            type="number"
                                            min="0"
                                            max="10"
                                            step="0.1"
                                            value={score}
                                            onChange={(e) => setScore(parseFloat(e.target.value))}
                                            className="w-full bg-[#151f2e] border-none rounded py-2.5 px-4 text-sm text-white focus:ring-1 focus:ring-[#3db4f2] outline-none"
                                        />
                                    </div>
                                </div>

                                {/* Progress */}
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-[#3db4f2]/80 uppercase tracking-wider">
                                        {show.media_type === 'tv' ? 'Episode Progress' : 'Watch Status'}
                                    </label>
                                    <div className="relative">
                                        <input 
                                            type="number"
                                            min="0"
                                            max={totalEpisodes}
                                            value={progress}
                                            onChange={(e) => setProgress(parseInt(e.target.value))}
                                            className="w-full bg-[#151f2e] border-none rounded py-2.5 px-4 text-sm text-white focus:ring-1 focus:ring-[#3db4f2] outline-none"
                                        />
                                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-500 pointer-events-none">/ {totalEpisodes}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                                {/* Start Date */}
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-[#3db4f2]/80 uppercase tracking-wider">Start Date</label>
                                    <input 
                                        type="date"
                                        value={startDate}
                                        onChange={(e) => setStartDate(e.target.value)}
                                        className="w-full bg-[#151f2e] border-none rounded py-2.5 px-4 text-sm text-white focus:ring-1 focus:ring-[#3db4f2] outline-none [color-scheme:dark]"
                                    />
                                </div>

                                {/* Finish Date */}
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-[#3db4f2]/80 uppercase tracking-wider">Finish Date</label>
                                    <input 
                                        type="date"
                                        value={finishDate}
                                        onChange={(e) => setFinishDate(e.target.value)}
                                        className="w-full bg-[#151f2e] border-none rounded py-2.5 px-4 text-sm text-white focus:ring-1 focus:ring-[#3db4f2] outline-none [color-scheme:dark]"
                                    />
                                </div>

                                {/* Rewatches */}
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-[#3db4f2]/80 uppercase tracking-wider">Total Rewatches</label>
                                    <input 
                                        type="number"
                                        min="0"
                                        value={rewatchCount}
                                        onChange={(e) => setRewatchCount(parseInt(e.target.value))}
                                        className="w-full bg-[#151f2e] border-none rounded py-2.5 px-4 text-sm text-white focus:ring-1 focus:ring-[#3db4f2] outline-none"
                                    />
                                </div>
                            </div>

                            {/* Notes */}
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-[#3db4f2]/80 uppercase tracking-wider">Notes</label>
                                <textarea 
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    rows={4}
                                    className="w-full bg-[#151f2e] border-none rounded py-3 px-4 text-sm text-white focus:ring-1 focus:ring-[#3db4f2] outline-none resize-none"
                                    placeholder="Write your personal notes here..."
                                />
                            </div>
                        </div>

                        {/* Sidebar Area */}
                        <div className="space-y-8 flex flex-col">
                            <div className="space-y-4">
                                <h3 className="text-xs font-bold text-[#3db4f2]/80 uppercase tracking-wider">Custom Lists</h3>
                                <div className="border-t border-white/5 pt-4">
                                    {customLists.length === 0 ? (
                                        <p className="text-sm italic text-gray-500">No custom lists created</p>
                                    ) : (
                                        <div className="space-y-2">
                                            {customLists.map(list => (
                                                <div key={list} className="flex items-center gap-2 text-sm text-white">
                                                    <div className="w-4 h-4 rounded bg-[#3db4f2] flex items-center justify-center">
                                                        <CheckIcon className="w-3 h-3 text-white" />
                                                    </div>
                                                    {list}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="space-y-4">
                                <label className="flex items-center gap-3 cursor-pointer group">
                                    <div className={`w-5 h-5 rounded flex items-center justify-center transition-colors ${isPrivate ? 'bg-[#3db4f2]' : 'bg-[#151f2e] group-hover:bg-[#1e2a3b]'}`}>
                                        <input 
                                            type="checkbox"
                                            checked={isPrivate}
                                            onChange={(e) => setIsPrivate(e.target.checked)}
                                            className="hidden"
                                        />
                                        {isPrivate && <CheckIcon className="w-4 h-4 text-white" />}
                                    </div>
                                    <span className="text-sm font-bold text-white/80 group-hover:text-white transition-colors">Private</span>
                                </label>
                            </div>

                            <div className="mt-auto pt-8">
                                <button 
                                    onClick={onDelete}
                                    className="w-full py-2.5 px-4 rounded bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white font-bold transition-all flex items-center justify-center gap-2 text-sm"
                                >
                                    <TrashIcon className="w-4 h-4" />
                                    Delete
                                </button>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export default ShowEditorModal;
