
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    XIcon, HeartIcon, TrashIcon, CalendarIcon, 
    ChevronDownIcon, LockIcon, EyeIcon, EyeOffIcon,
    WatchingIcon, PlanningIcon, CompletedIcon, 
    RewatchingIcon, PausedIcon, DroppedIcon, CheckIcon, PlusIcon
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
    const [status, setStatus] = useState<ListStatus>(listItem?.status || 'Planning');
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

    const handleSave = async () => {
        setIsSaving(true);
        try {
            await onSave({
                status,
                rating: score,
                progress,
                start_date: startDate ? new Date(startDate).toISOString() : undefined,
                finish_date: finishDate ? new Date(finishDate).toISOString() : undefined,
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
        { value: 'Watching', label: t('status.watching'), icon: WatchingIcon },
        { value: 'Planning', label: t('status.planning'), icon: PlanningIcon },
        { value: 'Completed', label: t('status.completed'), icon: CompletedIcon },
        { value: 'Rewatching', label: t('status.rewatching'), icon: RewatchingIcon },
        { value: 'Paused', label: t('status.paused'), icon: PausedIcon },
        { value: 'Dropped', label: t('status.dropped'), icon: DroppedIcon },
    ];

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                <motion.div 
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    className="bg-[#0b1622] text-[#929292] w-full max-w-4xl rounded-xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.5)] flex flex-col max-h-[90vh] border border-white/5"
                >
                    {/* Header with Banner */}
                    <div className="relative h-32 sm:h-40 w-full bg-[#0b1622] flex-shrink-0">
                        {show.backdrop_url && (
                            <img 
                                src={show.backdrop_url} 
                                alt="Banner" 
                                className="w-full h-full object-cover opacity-20"
                            />
                        )}
                        <div className="absolute inset-0 bg-gradient-to-r from-[#0b1622] via-[#0b1622]/60 to-transparent" />
                        
                        <button 
                            onClick={onClose}
                            className="absolute top-4 right-4 p-2 hover:bg-white/10 rounded-full transition-colors z-20"
                        >
                            <XIcon className="w-5 h-5 text-white/40 hover:text-white" />
                        </button>

                        <div className="absolute inset-0 p-6 flex items-center gap-6">
                            <div className="w-16 sm:w-20 aspect-[2/3] rounded shadow-2xl border border-white/5 flex-shrink-0 overflow-hidden">
                                <img src={show.image_url} alt={show.title} className="w-full h-full object-cover" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <h2 className="text-lg sm:text-xl font-bold text-[#edf1f5] truncate leading-tight">{show.title}</h2>
                                <p className="text-xs text-[#929292] mt-1 font-medium uppercase tracking-wider">
                                    {show.media_type === 'tv' ? t('common.tv_show') : t('common.movie')} • {show.year}
                                </p>
                            </div>
                            <div className="flex items-center gap-4">
                                <button 
                                    onClick={onToggleFavorite}
                                    className={`p-2.5 rounded-lg transition-all ${isFavorite ? 'bg-red-500/10 text-red-500' : 'bg-white/5 text-white/40 hover:text-white hover:bg-white/10'}`}
                                >
                                    <HeartIcon className="w-5 h-5" solid={isFavorite} />
                                </button>
                                <button 
                                    onClick={handleSave}
                                    disabled={isSaving}
                                    className="bg-[#3db4f2] hover:bg-[#3db4f2]/90 text-white px-8 py-2.5 rounded-lg font-bold transition-all shadow-lg shadow-[#3db4f2]/20 disabled:opacity-50 text-sm active:scale-95"
                                >
                                    {isSaving ? t('common.saving') : t('common.save')}
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Body */}
                    <div className="flex-1 overflow-y-auto p-8 grid grid-cols-1 md:grid-cols-4 gap-x-10 gap-y-8 bg-[#0b1622]">
                        {/* Main Form Area */}
                        <div className="md:col-span-3 space-y-8">
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
                                {/* Status */}
                                <div className="space-y-3">
                                    <label className="text-xs font-bold text-[#3db4f2] uppercase tracking-widest">{t('common.status')}</label>
                                    <div className="relative group">
                                        <select 
                                            value={status}
                                            onChange={(e) => setStatus(e.target.value as ListStatus)}
                                            className="w-full bg-[#151f2e] border border-transparent rounded-lg py-3 px-4 text-sm text-[#929292] hover:text-[#edf1f5] appearance-none focus:ring-2 focus:ring-[#3db4f2]/50 focus:border-[#3db4f2] outline-none transition-all cursor-pointer"
                                        >
                                            {statusOptions.map(opt => (
                                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                                            ))}
                                        </select>
                                        <ChevronDownIcon className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-[#929292] w-4 h-4 group-hover:text-[#edf1f5] transition-colors" />
                                    </div>
                                </div>

                                {/* Score */}
                                <div className="space-y-3">
                                    <label className="text-xs font-bold text-[#3db4f2] uppercase tracking-widest">{t('common.score')}</label>
                                    <div className="relative">
                                        <input 
                                            type="number"
                                            min="0"
                                            max="10"
                                            step="0.1"
                                            value={score}
                                            onChange={(e) => setScore(parseFloat(e.target.value))}
                                            className="w-full bg-[#151f2e] border border-transparent rounded-lg py-3 px-4 text-sm text-[#929292] focus:text-[#edf1f5] focus:ring-2 focus:ring-[#3db4f2]/50 focus:border-[#3db4f2] outline-none transition-all"
                                        />
                                        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex flex-col gap-0.5">
                                            <button onClick={() => setScore(prev => Math.min(10, prev + 0.5))} className="text-[#929292] hover:text-[#3db4f2] transition-colors"><ChevronDownIcon className="w-3 h-3 rotate-180" /></button>
                                            <button onClick={() => setScore(prev => Math.max(0, prev - 0.5))} className="text-[#929292] hover:text-[#3db4f2] transition-colors"><ChevronDownIcon className="w-3 h-3" /></button>
                                        </div>
                                    </div>
                                </div>

                                {/* Progress */}
                                <div className="space-y-3">
                                    <label className="text-xs font-bold text-[#3db4f2] uppercase tracking-widest">
                                        {show.media_type === 'tv' ? t('common.episodes') : t('common.progress')}
                                    </label>
                                    <div className="relative flex items-center gap-2">
                                        <div className="relative flex-1">
                                            <input 
                                                type="number"
                                                min="0"
                                                max={totalEpisodes}
                                                value={progress}
                                                onChange={(e) => setProgress(parseInt(e.target.value))}
                                                className="w-full bg-[#151f2e] border border-transparent rounded-lg py-3 px-4 text-sm text-[#929292] focus:text-[#edf1f5] focus:ring-2 focus:ring-[#3db4f2]/50 focus:border-[#3db4f2] outline-none transition-all"
                                            />
                                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-[#929292]/50 pointer-events-none">/ {totalEpisodes}</span>
                                        </div>
                                        <div className="flex flex-col gap-1">
                                            <button 
                                                onClick={() => setProgress(prev => Math.min(totalEpisodes, prev + 1))}
                                                className="p-1 bg-[#151f2e] hover:bg-[#1e2a3b] rounded text-[#929292] hover:text-[#3db4f2] transition-all"
                                            >
                                                <PlusIcon className="w-3 h-3" />
                                            </button>
                                            <button 
                                                onClick={() => setProgress(prev => Math.max(0, prev - 1))}
                                                className="p-1 bg-[#151f2e] hover:bg-[#1e2a3b] rounded text-[#929292] hover:text-[#3db4f2] transition-all"
                                            >
                                                <ChevronDownIcon className="w-3 h-3" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
                                {/* Start Date */}
                                <div className="space-y-3">
                                    <label className="text-xs font-bold text-[#3db4f2] uppercase tracking-widest">{t('common.start_date')}</label>
                                    <div className="relative">
                                        <input 
                                            type="date"
                                            value={startDate}
                                            onChange={(e) => setStartDate(e.target.value)}
                                            className="w-full bg-[#151f2e] border border-transparent rounded-lg py-3 px-4 text-sm text-[#929292] focus:text-[#edf1f5] focus:ring-2 focus:ring-[#3db4f2]/50 focus:border-[#3db4f2] outline-none transition-all [color-scheme:dark]"
                                        />
                                    </div>
                                </div>

                                {/* Finish Date */}
                                <div className="space-y-3">
                                    <label className="text-xs font-bold text-[#3db4f2] uppercase tracking-widest">{t('common.finish_date')}</label>
                                    <div className="relative">
                                        <input 
                                            type="date"
                                            value={finishDate}
                                            onChange={(e) => setFinishDate(e.target.value)}
                                            className="w-full bg-[#151f2e] border border-transparent rounded-lg py-3 px-4 text-sm text-[#929292] focus:text-[#edf1f5] focus:ring-2 focus:ring-[#3db4f2]/50 focus:border-[#3db4f2] outline-none transition-all [color-scheme:dark]"
                                        />
                                    </div>
                                </div>

                                {/* Rewatches */}
                                <div className="space-y-3">
                                    <label className="text-xs font-bold text-[#3db4f2] uppercase tracking-widest">{t('common.rewatches')}</label>
                                    <div className="relative flex items-center gap-2">
                                        <input 
                                            type="number"
                                            min="0"
                                            value={rewatchCount}
                                            onChange={(e) => setRewatchCount(parseInt(e.target.value))}
                                            className="flex-1 bg-[#151f2e] border border-transparent rounded-lg py-3 px-4 text-sm text-[#929292] focus:text-[#edf1f5] focus:ring-2 focus:ring-[#3db4f2]/50 focus:border-[#3db4f2] outline-none transition-all"
                                        />
                                        <div className="flex flex-col gap-1">
                                            <button onClick={() => setRewatchCount(prev => prev + 1)} className="p-1 bg-[#151f2e] hover:bg-[#1e2a3b] rounded text-[#929292] hover:text-[#3db4f2] transition-all"><PlusIcon className="w-3 h-3" /></button>
                                            <button onClick={() => setRewatchCount(prev => Math.max(0, prev - 1))} className="p-1 bg-[#151f2e] hover:bg-[#1e2a3b] rounded text-[#929292] hover:text-[#3db4f2] transition-all"><ChevronDownIcon className="w-3 h-3" /></button>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Notes */}
                            <div className="space-y-3">
                                <label className="text-xs font-bold text-[#3db4f2] uppercase tracking-widest">{t('common.notes')}</label>
                                <textarea 
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    rows={5}
                                    className="w-full bg-[#151f2e] border border-transparent rounded-lg py-4 px-5 text-sm text-[#929292] focus:text-[#edf1f5] focus:ring-2 focus:ring-[#3db4f2]/50 focus:border-[#3db4f2] outline-none transition-all resize-none leading-relaxed"
                                    placeholder={t('common.write_notes')}
                                />
                            </div>
                        </div>

                        {/* Sidebar Area */}
                        <div className="space-y-10 flex flex-col">
                            <div className="space-y-5">
                                <h3 className="text-xs font-bold text-[#3db4f2] uppercase tracking-widest">{t('common.custom_lists')}</h3>
                                <div className="space-y-3">
                                    {customLists.length === 0 ? (
                                        <p className="text-xs italic text-[#929292]/60 px-1">{t('common.no_custom_lists')}</p>
                                    ) : (
                                        <div className="flex flex-wrap gap-2">
                                            {customLists.map(list => (
                                                <div key={list} className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#151f2e] border border-[#3db4f2]/20 text-xs text-[#edf1f5] font-medium transition-all hover:border-[#3db4f2]">
                                                    <CheckIcon className="w-3 h-3 text-[#3db4f2]" />
                                                    {list}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                    <button className="w-full py-2 px-4 rounded-lg border border-dashed border-[#3db4f2]/30 text-[#3db4f2] text-xs font-bold hover:bg-[#3db4f2]/5 transition-all flex items-center justify-center gap-2">
                                        <PlusIcon className="w-3 h-3" />
                                        {t('common.add_to_list')}
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-5">
                                <h3 className="text-xs font-bold text-[#3db4f2] uppercase tracking-widest">{t('common.privacy')}</h3>
                                <label className="flex items-center gap-4 cursor-pointer group p-3 rounded-lg hover:bg-[#151f2e] transition-all">
                                    <div className={`w-6 h-6 rounded-lg flex items-center justify-center transition-all border-2 ${isPrivate ? 'bg-[#3db4f2] border-[#3db4f2]' : 'bg-transparent border-[#1e2a3b] group-hover:border-[#3db4f2]/50'}`}>
                                        <input 
                                            type="checkbox"
                                            checked={isPrivate}
                                            onChange={(e) => setIsPrivate(e.target.checked)}
                                            className="hidden"
                                        />
                                        {isPrivate ? (
                                            <CheckIcon className="w-4 h-4 text-white" />
                                        ) : (
                                            <LockIcon className="w-3 h-3 text-[#929292]/30 group-hover:text-[#3db4f2]/50" />
                                        )}
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-sm font-bold text-[#edf1f5] group-hover:text-[#3db4f2] transition-colors">{t('common.private')}</span>
                                        <span className="text-[10px] text-[#929292]">{t('common.private_desc')}</span>
                                    </div>
                                </label>
                            </div>

                            <div className="mt-auto pt-10">
                                <button 
                                    onClick={onDelete}
                                    className="w-full py-3 px-4 rounded-lg bg-red-500/5 text-red-500/60 hover:bg-red-500 hover:text-white font-bold transition-all flex items-center justify-center gap-2 text-xs uppercase tracking-widest active:scale-95"
                                >
                                    <TrashIcon className="w-4 h-4" />
                                    {t('common.delete')}
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
