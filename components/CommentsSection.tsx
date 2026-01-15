import React, { useState, useEffect, useCallback } from 'react';
import { Comment, User } from '../types';
import { ThumbUpIcon, ThumbDownIcon, ReplyIcon, TrashIcon } from '../constants';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';
import { useTranslation } from 'react-i18next';

type Interaction = 'like' | 'dislike' | null;
type InteractionAction = 'like' | 'dislike' | 'unlike' | 'undislike';

interface CommentItemProps {
    comment: Comment;
    onReply: (parentId: number, text: string) => void;
    onInteract: (commentId: number, interaction: InteractionAction) => void;
    onDelete: (commentId: number) => void;
    onViewUser: (user: User) => void;
    currentUser?: User;
    isChild?: boolean;
};

const timeAgo = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (seconds < 60) return 'Just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
};

const CommentItem: React.FC<CommentItemProps> = ({ comment, onReply, onInteract, onDelete, onViewUser, currentUser, isChild = false }) => {
    const { t } = useTranslation();
    const [isReplying, setIsReplying] = useState(false);
    const [replyText, setReplyText] = useState('');
    const [interaction, setInteraction] = useState<Interaction>(null);

    const handleReplySubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (replyText.trim()) {
            onReply(comment.id, replyText);
            setReplyText('');
            setIsReplying(false);
        }
    };
    
    const handleInteraction = (type: 'like' | 'dislike') => {
        const newInteraction = interaction === type ? null : type;
        if (interaction) {
            onInteract(comment.id, interaction === 'like' ? 'unlike' : 'undislike');
        }
        if (newInteraction) {
            onInteract(comment.id, newInteraction);
        }
        setInteraction(newInteraction);
    }

    const isAuthor = currentUser && (currentUser.id === comment.user_id);
    const authorName = comment.user?.name || 'Unknown User';
    const authorAvatar = comment.user?.avatar_url || 'https://via.placeholder.com/150?text=?';

    return (
        <div className="flex items-start space-x-4 rtl:space-x-reverse">
            <img 
                src={authorAvatar} 
                alt={authorName} 
                className={`${isChild ? 'w-8 h-8' : 'w-11 h-11'} rounded-full object-cover flex-shrink-0 cursor-pointer border border-gray-200 dark:border-gray-700`}
                onClick={() => comment.user && onViewUser(comment.user)}
            />
            <div className="flex-1 min-w-0">
                <div className="bg-gray-50 dark:bg-[#1e1e1e] border border-gray-200 dark:border-gray-800 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                            <button onClick={() => comment.user && onViewUser(comment.user)} className="font-semibold text-gray-900 dark:text-white hover:underline text-sm">
                                {authorName}
                            </button>
                            <span className="text-xs text-gray-400">• {timeAgo(comment.created_at)}</span>
                        </div>
                        {isAuthor && (
                            <button onClick={() => onDelete(comment.id)} className="text-gray-400 hover:text-red-500 transition-colors" title={t('common.remove')}>
                                <TrashIcon className="w-3.5 h-3.5" />
                            </button>
                        )}
                    </div>
                    <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed whitespace-pre-wrap break-words text-start">{comment.text}</p>
                </div>
                
                <div className="flex items-center space-x-4 rtl:space-x-reverse mt-2 text-xs text-gray-500 dark:text-gray-400">
                    <button onClick={() => handleInteraction('like')} className={`flex items-center space-x-1 rtl:space-x-reverse hover:text-black dark:hover:text-white transition-colors ${interaction === 'like' ? 'text-blue-600 dark:text-brand-primary font-semibold' : ''}`}>
                        <ThumbUpIcon className="w-3.5 h-3.5" solid={interaction === 'like'} />
                        <span>{comment.likes}</span>
                    </button>
                    <button onClick={() => handleInteraction('dislike')} className={`flex items-center space-x-1 rtl:space-x-reverse hover:text-black dark:hover:text-white transition-colors ${interaction === 'dislike' ? 'text-red-600 dark:text-red-400 font-semibold' : ''}`}>
                        <ThumbDownIcon className="w-3.5 h-3.5" solid={interaction === 'dislike'} />
                        <span>{comment.dislikes}</span>
                    </button>
                    {currentUser && !isChild && (
                        <button onClick={() => setIsReplying(!isReplying)} className="flex items-center space-x-1 rtl:space-x-reverse hover:text-gray-800 dark:hover:text-gray-200 font-medium transition-colors">
                            <ReplyIcon className="w-3.5 h-3.5" />
                            <span>{t('comments.reply')}</span>
                        </button>
                    )}
                </div>

                {isReplying && currentUser && (
                    <div className="flex items-start space-x-3 rtl:space-x-reverse mt-3 animate-fade-in">
                         <img src={currentUser.avatar_url} alt={currentUser.name} className="w-8 h-8 rounded-full object-cover border border-gray-200 dark:border-gray-700" />
                        <form onSubmit={handleReplySubmit} className="flex-1">
                             <textarea
                                value={replyText}
                                onChange={(e) => setReplyText(e.target.value)}
                                placeholder={`${t('comments.reply')}...`}
                                className="w-full p-2 text-sm text-gray-900 dark:text-white bg-white dark:bg-[#1e1e1e] border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-brand-primary outline-none transition resize-none"
                                rows={2}
                                autoFocus
                            />
                            <div className="flex justify-end items-center space-x-2 rtl:space-x-reverse mt-2">
                                <button 
                                    type="button" 
                                    onClick={() => setIsReplying(false)} 
                                    className="px-3 py-1.5 text-xs font-semibold text-gray-700 dark:text-gray-200 bg-white dark:bg-[#1e1e1e] rounded-md hover:bg-gray-100 dark:hover:bg-[#2a2a2a] ring-1 ring-inset ring-gray-300 dark:ring-gray-700"
                                >
                                    {t('common.cancel')}
                                </button>
                                <button 
                                    type="submit" 
                                    disabled={!replyText.trim()} 
                                    className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                                        replyText.trim() 
                                        ? 'bg-brand-primary text-black hover:bg-brand-primary/90' 
                                        : 'bg-gray-200 dark:bg-gray-800 text-gray-500 cursor-not-allowed'
                                    }`}
                                >
                                    {t('comments.reply')}
                                </button>
                            </div>
                        </form>
                    </div>
                )}
                
                {comment.replies && comment.replies.length > 0 && (
                    <div className="mt-4 pl-6 rtl:pl-0 rtl:pr-6 relative">
                         <div className="absolute left-0 rtl:left-auto rtl:right-0 top-0 bottom-0 w-0.5 bg-gray-200 dark:bg-gray-800 rounded-full"></div>
                        <div className="space-y-4">
                            {comment.replies.map(reply => (
                                <CommentItem 
                                    key={reply.id} 
                                    comment={reply} 
                                    onReply={onReply} 
                                    onInteract={onInteract} 
                                    onDelete={onDelete}
                                    onViewUser={onViewUser} 
                                    currentUser={currentUser} 
                                    isChild
                                />
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

interface CommentsSectionProps {
    showId: number;
    onViewUser: (user: User) => void;
    currentUser?: User;
}

const CommentsSection: React.FC<CommentsSectionProps> = ({ showId, onViewUser, currentUser }) => {
    const { t } = useTranslation();
    const [comments, setComments] = useState<Comment[]>([]);
    const [newComment, setNewComment] = useState('');
    const [loading, setLoading] = useState(true);
    const [isPosting, setIsPosting] = useState(false);

    const fetchComments = useCallback(async () => {
        if (!isSupabaseConfigured) {
            setComments([]);
            setLoading(false);
            return;
        }

        try {
            const { data, error } = await supabase
                .from('comments')
                .select(`
                    id,
                    user_id,
                    text,
                    created_at,
                    parent_id,
                    likes,
                    dislikes,
                    profiles!user_id (
                        id,
                        name,
                        username,
                        avatar_url,
                        is_verified,
                        title
                    )
                `)
                .eq('show_id', Number(showId))
                .order('created_at', { ascending: true });

            if (error) throw error;

            const commentMap = new Map<number, Comment>();
            const rootComments: Comment[] = [];

            if (data) {
                data.forEach((row: any) => {
                    const userProfile = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles;
                    
                    const comment: Comment = {
                        id: row.id,
                        user: userProfile, 
                        user_id: row.user_id,
                        text: row.text,
                        created_at: row.created_at,
                        likes: row.likes || 0,
                        dislikes: row.dislikes || 0,
                        replies: [],
                        parent_id: row.parent_id
                    };
                    commentMap.set(row.id, comment);
                });

                data.forEach((row: any) => {
                    const comment = commentMap.get(row.id);
                    if (comment) {
                        if (comment.parent_id) {
                            const parent = commentMap.get(comment.parent_id);
                            if (parent) {
                                parent.replies = [...(parent.replies || []), comment];
                            } else {
                                rootComments.push(comment);
                            }
                        } else {
                            rootComments.push(comment); 
                        }
                    }
                });
                
                rootComments.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
            }

            setComments(rootComments);

        } catch (err) {
            console.error("Error fetching comments:", err);
        } finally {
            setLoading(false);
        }
    }, [showId]);

    useEffect(() => {
        fetchComments();
    }, [fetchComments]);

    const updateCommentState = (list: Comment[], targetId: number, updateFn: (comment: Comment) => Comment): Comment[] => {
        return list.map(comment => {
            if (comment.id === targetId) {
                return updateFn(comment);
            }
            if (comment.replies && comment.replies.length > 0) {
                return { ...comment, replies: updateCommentState(comment.replies, targetId, updateFn) };
            }
            return comment;
        });
    };

    const handleInteraction = async (commentId: number, interaction: InteractionAction) => {
        const updater = (comment: Comment): Comment => {
            switch (interaction) {
                case 'like': return { ...comment, likes: comment.likes + 1 };
                case 'dislike': return { ...comment, dislikes: comment.dislikes + 1 };
                case 'unlike': return { ...comment, likes: Math.max(0, comment.likes - 1) };
                case 'undislike': return { ...comment, dislikes: Math.max(0, comment.dislikes - 1) };
                default: return comment;
            }
        };
        setComments(prev => updateCommentState(prev, commentId, updater));

        if (!isSupabaseConfigured) return;

        try {
            const { data: current } = await supabase.from('comments').select('likes, dislikes').eq('id', commentId).single();
            if (current) {
                let newLikes = current.likes;
                let newDislikes = current.dislikes;
                if (interaction === 'like') newLikes++;
                if (interaction === 'unlike') newLikes--;
                if (interaction === 'dislike') newDislikes++;
                if (interaction === 'undislike') newDislikes--;
                await supabase.from('comments').update({ likes: Math.max(0, newLikes), dislikes: Math.max(0, newDislikes) }).eq('id', commentId);
            }
        } catch (err) {
            console.error("Error updating interaction:", err);
        }
    };

    const handleAddReply = async (parentId: number, text: string) => {
        if (!currentUser || !isSupabaseConfigured) return;
        try {
            const { data, error } = await supabase.from('comments').insert({ show_id: showId, user_id: currentUser.id, parent_id: parentId, text: text }).select().single();
            if (error) throw error;
            const newReply: Comment = { ...data, user: currentUser, replies: [] };
            const updater = (comment: Comment): Comment => ({ ...comment, replies: [...(comment.replies || []), newReply] });
            setComments(prev => updateCommentState(prev, parentId, updater));
        } catch (err) {
            alert("Failed to post reply.");
        }
    };

    const handlePostComment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newComment.trim() || !currentUser) return;
        if (!isSupabaseConfigured) return;

        setIsPosting(true);
        try {
            const { data, error } = await supabase.from('comments').insert({ show_id: showId, user_id: currentUser.id, text: newComment }).select().single();
            if (error) throw error;
            const newCommentObject: Comment = { ...data, user: currentUser, replies: [] };
            setComments([newCommentObject, ...comments]);
            setNewComment('');
        } catch (err) {
            alert("Failed to post comment.");
        } finally {
            setIsPosting(false);
        }
    };
    
    const handleDeleteComment = async (commentId: number) => {
        if (!window.confirm("Are you sure you want to delete this comment?")) return;
        const removeRecursive = (list: Comment[]): Comment[] => {
            return list.filter(c => c.id !== commentId).map(c => ({ ...c, replies: c.replies ? removeRecursive(c.replies) : [] }));
        };
        setComments(prev => removeRecursive(prev));
        if (isSupabaseConfigured) await supabase.from('comments').delete().eq('id', commentId);
    };

    return (
        <section className="animate-fade-in">
            <h2 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white mb-6 text-start flex items-center gap-2">
                {t('comments.title')} 
                <span className="text-sm font-normal text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-[#1e1e1e] px-2 py-0.5 rounded-full">
                    {comments.reduce((acc, c) => acc + 1 + (c.replies?.length || 0), 0)}
                </span>
            </h2>
            
            {currentUser ? (
                <div className="flex items-start space-x-4 rtl:space-x-reverse mb-8">
                    <img src={currentUser.avatar_url} alt={currentUser.name} className="w-11 h-11 rounded-full object-cover ring-2 ring-gray-100 dark:ring-gray-800 border border-gray-200 dark:border-gray-700" />
                    <form onSubmit={handlePostComment} className="flex-1">
                        <textarea
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            placeholder={t('comments.placeholder')}
                            className="w-full p-3 text-md text-gray-900 dark:text-white bg-white dark:bg-[#1e1e1e] border border-gray-300 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-brand-primary focus:border-brand-primary outline-none transition resize-none shadow-sm"
                            rows={3}
                        />
                        <div className="flex justify-end mt-3">
                            <button 
                                type="submit"
                                disabled={!newComment.trim() || isPosting}
                                className={`px-6 py-2.5 text-sm font-bold rounded-lg transition-all transform active:scale-95 ${
                                    newComment.trim() && !isPosting
                                    ? 'bg-brand-primary text-black hover:bg-brand-primary/90 shadow-md hover:shadow-lg' 
                                    : 'bg-gray-200 dark:bg-gray-800 text-gray-500 cursor-not-allowed'
                                }`}
                            >
                                {isPosting ? t('comments.posting') : t('comments.post')}
                            </button>
                        </div>
                    </form>
                </div>
            ) : (
                <div className="bg-gray-50 dark:bg-[#1e1e1e] rounded-xl p-6 text-center mb-8 border border-gray-200 dark:border-gray-800 border-dashed">
                    <p className="text-gray-600 dark:text-gray-300 mb-2">{t('comments.join')}</p>
                    <button onClick={() => window.location.href = '/login'} className="text-blue-600 dark:text-brand-primary font-bold hover:underline">{t('comments.login_to_comment')}</button>
                </div>
            )}

            {loading ? (
                 <div className="space-y-6">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="flex space-x-4 rtl:space-x-reverse animate-pulse">
                            <div className="w-10 h-10 bg-gray-200 dark:bg-gray-800 rounded-full"></div>
                            <div className="flex-1 space-y-3">
                                <div className="h-12 bg-gray-200 dark:bg-gray-800 rounded w-full"></div>
                            </div>
                        </div>
                    ))}
                 </div>
            ) : comments.length > 0 ? (
                <div className="space-y-6">
                    {comments.map((comment) => (
                        <CommentItem 
                            key={comment.id} 
                            comment={comment} 
                            onReply={handleAddReply} 
                            onInteract={handleInteraction} 
                            onDelete={handleDeleteComment}
                            onViewUser={onViewUser} 
                            currentUser={currentUser} 
                        />
                    ))}
                </div>
            ) : (
                <div className="text-center py-12 border border-dashed border-gray-200 dark:border-gray-800 rounded-xl">
                    <h3 className="text-gray-900 dark:text-white font-medium text-lg mb-1">{t('comments.no_comments')}</h3>
                </div>
            )}
        </section>
    );
};

export default CommentsSection;