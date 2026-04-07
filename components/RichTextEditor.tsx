import React, { useCallback, useRef, useState } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import Youtube from '@tiptap/extension-youtube';
import Placeholder from '@tiptap/extension-placeholder';
import TextAlign from '@tiptap/extension-text-align';
import { supabase, uploadFile } from '../lib/supabaseClient';

interface RichTextEditorProps {
    content: string;
    onChange: (content: string) => void;
    images: string[];
    onImagesChange: (images: string[]) => void;
    placeholder?: string;
    isSpoiler: boolean;
    setIsSpoiler: (isSpoiler: boolean) => void;
    children?: React.ReactNode;
}

const RichTextEditor: React.FC<RichTextEditorProps> = ({ content, onChange, images, onImagesChange, placeholder, isSpoiler, setIsSpoiler, children }) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const videoInputRef = useRef<HTMLInputElement>(null);

    const editor = useEditor({
        extensions: [
            StarterKit,
            Underline,
            Link.configure({
                openOnClick: false,
                HTMLAttributes: {
                    class: 'text-brand-primary underline cursor-pointer',
                },
            }),
            Image.configure({
                HTMLAttributes: {
                    class: 'rounded-xl max-h-[500px] object-contain my-4',
                },
            }),
            Youtube.configure({
                HTMLAttributes: {
                    class: 'w-full aspect-video rounded-xl my-4',
                },
            }),
            TextAlign.configure({
                types: ['heading', 'paragraph'],
            }),
            Placeholder.configure({
                placeholder: placeholder || "What's happening?",
                emptyEditorClass: 'cursor-text before:content-[attr(data-placeholder)] before:text-gray-400 before:absolute before:pointer-events-none',
            }),
        ],
        content,
        onUpdate: ({ editor }) => {
            onChange(editor.getHTML());
        },
        editorProps: {
            attributes: {
                class: 'prose prose-sm sm:prose-base dark:prose-invert max-w-none focus:outline-none min-h-[40px] py-2 prose-p:my-0',
            },
        },
    });

    const [isUploading, setIsUploading] = useState(false);

    // Sync content prop with editor (useful for resetting)
    React.useEffect(() => {
        if (editor && content !== editor.getHTML()) {
            // Only update if the content is actually different to avoid cursor jumps
            // Special case for empty content
            if (content === '' && editor.getHTML() !== '<p></p>') {
                editor.commands.setContent('');
            } else if (content !== '' && content !== editor.getHTML()) {
                editor.commands.setContent(content);
            }
        }
    }, [content, editor]);

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0 || !editor) return;

        setIsUploading(true);
        try {
            const newImages: string[] = [];
            for (let i = 0; i < files.length; i++) {
                const url = await uploadFile(files[i], 'images');
                if (url) newImages.push(url);
            }
            onImagesChange([...images, ...newImages]);
        } catch (error) {
            console.error('Error uploading images:', error);
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };

    const removeImage = (index: number) => {
        const newImages = [...images];
        newImages.splice(index, 1);
        onImagesChange(newImages);
    };

    const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !editor) return;

        const url = await uploadFile(file, 'videos');
        if (url) {
            editor.chain().focus().insertContent(`<video src="${url}" controls class="w-full rounded-xl my-4"></video>`).run();
        }
        
        if (videoInputRef.current) {
            videoInputRef.current.value = '';
        }
    };

    const addYoutubeVideo = useCallback(() => {
        const url = prompt('Enter YouTube URL');
        if (url && editor) {
            editor.commands.setYoutubeVideo({
                src: url,
                width: 640,
                height: 480,
            });
        }
    }, [editor]);

    const setLink = useCallback(() => {
        const previousUrl = editor?.getAttributes('link').href;
        const url = window.prompt('URL', previousUrl);

        if (url === null) {
            return;
        }

        if (url === '') {
            editor?.chain().focus().extendMarkRange('link').unsetLink().run();
            return;
        }

        editor?.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
    }, [editor]);

    if (!editor) {
        return null;
    }

    return (
        <div className="w-full overflow-hidden bg-transparent">
            <EditorContent editor={editor} />
            
            {/* Image Preview / Carousel */}
            {images.length > 0 && (
                <div className="mt-2 mb-2">
                    <div className={`flex gap-2 overflow-x-auto scrollbar-hide pb-2 ${images.length > 1 ? 'snap-x snap-mandatory' : ''}`}>
                        {images.map((url, index) => (
                            <div 
                                key={index} 
                                className={`relative flex-shrink-0 group ${images.length > 1 ? 'w-[85%] sm:w-[70%] snap-center' : 'w-full'}`}
                            >
                                <img 
                                    src={url} 
                                    alt={`Upload ${index + 1}`} 
                                    className="w-full h-48 sm:h-64 object-cover rounded-2xl border border-gray-100 dark:border-white/5"
                                    referrerPolicy="no-referrer"
                                />
                                <button
                                    type="button"
                                    onClick={() => removeImage(index)}
                                    className="absolute top-2 right-2 p-1.5 bg-black/50 hover:bg-black/70 text-white rounded-full backdrop-blur-sm transition-all opacity-0 group-hover:opacity-100"
                                >
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                    </svg>
                                </button>
                                {images.length > 1 && (
                                    <div className="absolute bottom-2 right-2 px-2 py-1 bg-black/50 text-white text-[10px] font-bold rounded-lg backdrop-blur-sm">
                                        {index + 1} / {images.length}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <div className="flex items-center justify-between border-t border-gray-100 dark:border-white/5 mt-1">
                <div className="flex items-center gap-0 py-1 px-0.5 overflow-x-auto scrollbar-hide">
                <button
                    type="button"
                    onClick={() => editor.chain().focus().toggleBold().run()}
                    className={`p-1 rounded-full transition-all flex-shrink-0 ${editor.isActive('bold') ? 'bg-yellow-500/20 text-yellow-500' : 'text-yellow-500 hover:bg-yellow-500/10'}`}
                    title="Bold"
                >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M6 12H14C16.2091 12 18 10.2091 18 8C18 5.79086 16.2091 4 14 4H6V12ZM6 12H15C17.2091 12 19 13.7909 19 16C19 18.2091 17.2091 20 15 20H6V12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                </button>
                <button
                    type="button"
                    onClick={() => editor.chain().focus().toggleStrike().run()}
                    className={`p-1 rounded-full transition-all flex-shrink-0 ${editor.isActive('strike') ? 'bg-yellow-500/20 text-yellow-500' : 'text-yellow-500 hover:bg-yellow-500/10'}`}
                    title="Strikethrough"
                >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M6 16C6 18.2091 7.79086 20 10 20H14C16.2091 20 18 18.2091 18 16C18 13.7909 16.2091 12 14 12M18 8C18 5.79086 16.2091 4 14 4H10C7.79086 4 6 5.79086 6 8M3 12H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                </button>
                <button
                    type="button"
                    onClick={() => editor.chain().focus().toggleUnderline().run()}
                    className={`p-1 rounded-full transition-all flex-shrink-0 ${editor.isActive('underline') ? 'bg-yellow-500/20 text-yellow-500' : 'text-yellow-500 hover:bg-yellow-500/10'}`}
                    title="Underline"
                >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M18 4V11C18 14.3137 15.3137 17 12 17C8.68629 17 6 14.3137 6 11V4M4 21H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                </button>
                <button
                    type="button"
                    onClick={() => editor.chain().focus().toggleItalic().run()}
                    className={`p-1 rounded-full transition-all flex-shrink-0 ${editor.isActive('italic') ? 'bg-yellow-500/20 text-yellow-500' : 'text-yellow-500 hover:bg-yellow-500/10'}`}
                    title="Italic"
                >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M19 4H10M14 20H5M15 4L9 20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                </button>

                <div className="w-px h-3.5 bg-gray-100 dark:bg-white/5 mx-0.5 flex-shrink-0" />

                <button
                    type="button"
                    onClick={() => editor.chain().focus().setTextAlign('justify').run()}
                    className={`p-1 rounded-full transition-all flex-shrink-0 ${editor.isActive({ textAlign: 'justify' }) ? 'bg-yellow-500/20 text-yellow-500' : 'text-yellow-500 hover:bg-yellow-500/10'}`}
                    title="Align Justify"
                >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M21 10H3M21 18H3M21 6H3M21 14H3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                </button>
                <button
                    type="button"
                    onClick={() => editor.chain().focus().setTextAlign('left').run()}
                    className={`p-1 rounded-full transition-all flex-shrink-0 ${editor.isActive({ textAlign: 'left' }) ? 'bg-yellow-500/20 text-yellow-500' : 'text-yellow-500 hover:bg-yellow-500/10'}`}
                    title="Align Left"
                >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M16 10H3M20 6H3M20 14H3M16 18H3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                </button>
                <button
                    type="button"
                    onClick={() => editor.chain().focus().setTextAlign('right').run()}
                    className={`p-1 rounded-full transition-all flex-shrink-0 ${editor.isActive({ textAlign: 'right' }) ? 'bg-yellow-500/20 text-yellow-500' : 'text-yellow-500 hover:bg-yellow-500/10'}`}
                    title="Align Right"
                >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M21 10H8M21 6H4M21 14H4M21 18H8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                </button>
                <button
                    type="button"
                    onClick={() => editor.chain().focus().setTextAlign('center').run()}
                    className={`p-1 rounded-full transition-all flex-shrink-0 ${editor.isActive({ textAlign: 'center' }) ? 'bg-yellow-500/20 text-yellow-500' : 'text-yellow-500 hover:bg-yellow-500/10'}`}
                    title="Align Center"
                >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M18 10H6M21 6H3M21 14H3M18 18H6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                </button>

                <div className="w-px h-3.5 bg-gray-100 dark:bg-white/5 mx-0.5 flex-shrink-0" />

                <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                    className="p-1 rounded-full transition-all flex-shrink-0 text-yellow-500 hover:bg-yellow-500/10 disabled:opacity-50"
                    title="Upload Images"
                >
                    {isUploading ? (
                        <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M12 2V6M12 18V22M6 12H2M22 12H18M19.07 4.93L16.24 7.76M7.76 16.24L4.93 19.07M19.07 19.07L16.24 16.24M7.76 7.76L4.93 4.93" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                    ) : (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M16.2 21H6.93137C6.32555 21 6.02265 21 5.88238 20.8802C5.76068 20.7763 5.69609 20.6203 5.70865 20.4608C5.72312 20.2769 5.93731 20.0627 6.36569 19.6343L14.8686 11.1314C15.2646 10.7354 15.4627 10.5373 15.691 10.4632C15.8918 10.3979 16.1082 10.3979 16.309 10.4632C16.5373 10.5373 16.7354 10.7354 17.1314 11.1314L21 15V16.2M16.2 21C17.8802 21 18.7202 21 19.362 20.673C19.9265 20.3854 20.3854 19.9265 20.673 19.362C21 18.7202 21 17.8802 21 16.2M16.2 21H7.8C6.11984 21 5.27976 21 4.63803 20.673C4.07354 20.3854 3.6146 19.9265 3.32698 19.362C3 18.7202 3 17.8802 3 16.2V7.8C3 6.11984 3 5.27976 3.32698 4.63803C3.6146 4.07354 4.07354 3.6146 4.63803 3.32698C5.27976 3 6.11984 3 7.8 3H16.2C17.8802 3 18.7202 3 19.362 3.32698C19.9265 3.6146 20.3854 4.07354 20.673 4.63803C21 5.27976 21 6.11984 21 7.8V16.2M10.5 8.5C10.5 9.60457 9.60457 10.5 8.5 10.5C7.39543 10.5 6.5 9.60457 6.5 8.5C6.5 7.39543 7.39543 6.5 8.5 6.5C9.60457 6.5 10.5 7.39543 10.5 8.5Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                    )}
                </button>

                <button
                    type="button"
                    onClick={() => videoInputRef.current?.click()}
                    className="p-1 rounded-full transition-all flex-shrink-0 text-yellow-500 hover:bg-yellow-500/10"
                    title="Upload Video"
                >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M22 8.93137C22 8.32555 22 8.02265 21.8802 7.88238C21.7763 7.76068 21.6203 7.69609 21.4608 7.70865C21.2769 7.72312 21.0627 7.93731 20.6343 8.36569L17 12L20.6343 15.6343C21.0627 16.0627 21.2769 16.2769 21.4608 16.2914C21.6203 16.3039 21.7763 16.2393 21.8802 16.1176C22 15.9774 22 15.6744 22 15.0686V8.93137Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M2 9.8C2 8.11984 2 7.27976 2.32698 6.63803C2.6146 6.07354 3.07354 5.6146 3.63803 5.32698C4.27976 5 5.11984 5 6.8 5H12.2C13.8802 5 14.7202 5 15.362 5.32698C15.9265 5.6146 16.3854 6.07354 16.673 6.63803C17 7.27976 17 8.11984 17 9.8V14.2C17 15.8802 17 16.7202 16.673 17.362C16.3854 17.9265 15.9265 18.3854 15.362 18.673C14.7202 19 13.8802 19 12.2 19H6.8C5.11984 19 4.27976 19 3.63803 18.673C3.07354 18.3854 2.6146 17.9265 2.32698 17.362C2 16.7202 2 15.8802 2 14.2V9.8Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                </button>
                <button
                    type="button"
                    onClick={addYoutubeVideo}
                    className="p-1 rounded-full transition-all flex-shrink-0 text-yellow-500 hover:bg-yellow-500/10"
                    title="YouTube"
                >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M21.5813 7.19989C21.4733 6.76846 21.2534 6.37318 20.9438 6.05395C20.6341 5.73473 20.2457 5.50287 19.8178 5.3818C18.2542 5 12 5 12 5C12 5 5.74578 5 4.18222 5.41816C3.75429 5.53923 3.36588 5.77109 3.05623 6.09031C2.74659 6.40954 2.52666 6.80482 2.41868 7.23625C2.13253 8.82303 1.99255 10.4327 2.00052 12.0451C1.99032 13.6696 2.1303 15.2916 2.41868 16.8903C2.53773 17.3083 2.76258 17.6886 3.0715 17.9943C3.38043 18.3 3.76299 18.5209 4.18222 18.6357C5.74578 19.0538 12 19.0538 12 19.0538C12 19.0538 18.2542 19.0538 19.8178 18.6357C20.2457 18.5146 20.6341 18.2827 20.9438 17.9635C21.2534 17.6443 21.4733 17.249 21.5813 16.8176C21.8653 15.2427 22.0052 13.6453 21.9995 12.0451C22.0097 10.4206 21.8697 8.79862 21.5813 7.19989Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M9.75 9.46533C9.75 8.98805 9.75 8.74941 9.84974 8.61618C9.93666 8.50008 10.0697 8.42744 10.2144 8.4171C10.3804 8.40525 10.5811 8.53429 10.9826 8.79239L14.9254 11.3271C15.2738 11.551 15.448 11.663 15.5082 11.8054C15.5607 11.9298 15.5607 12.0702 15.5082 12.1946C15.448 12.337 15.2738 12.449 14.9254 12.6729L10.9826 15.2076C10.5811 15.4657 10.3804 15.5948 10.2144 15.5829C10.0697 15.5726 9.93666 15.4999 9.84974 15.3838C9.75 15.2506 9.75 15.012 9.75 14.5347V9.46533Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                </button>
                <button
                    type="button"
                    onClick={setLink}
                    className={`p-1 rounded-full transition-all flex-shrink-0 ${editor.isActive('link') ? 'bg-yellow-500/20 text-yellow-500' : 'text-yellow-500 hover:bg-yellow-500/10'}`}
                    title="Link"
                >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M9 17H7C4.23858 17 2 14.7614 2 12C2 9.23858 4.23858 7 7 7H9M15 17H17C19.7614 17 22 14.7614 22 12C22 9.23858 19.7614 7 17 7H15M7 12L17 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                </button>
                <button
                    type="button"
                    onClick={() => setIsSpoiler(!isSpoiler)}
                    className={`p-1 rounded-full transition-all flex-shrink-0 ${isSpoiler ? 'bg-red-500/20 text-red-500' : 'text-yellow-500 hover:bg-yellow-500/10'}`}
                    title="Mark as Spoiler"
                >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M10.7429 5.09232C11.1494 5.03223 11.5686 5 12.0004 5C17.1054 5 20.4553 9.50484 21.5807 11.2868C21.7169 11.5025 21.785 11.6103 21.8231 11.7767C21.8518 11.9016 21.8517 12.0987 21.8231 12.2236C21.7849 12.3899 21.7164 12.4985 21.5792 12.7156C21.2793 13.1901 20.8222 13.8571 20.2165 14.5805M6.72432 6.71504C4.56225 8.1817 3.09445 10.2194 2.42111 11.2853C2.28428 11.5019 2.21587 11.6102 2.17774 11.7765C2.1491 11.9014 2.14909 12.0984 2.17771 12.2234C2.21583 12.3897 2.28393 12.4975 2.42013 12.7132C3.54554 14.4952 6.89541 19 12.0004 19C14.0588 19 15.8319 18.2676 17.2888 17.2766M3.00042 3L21.0004 21M9.8791 9.87868C9.3362 10.4216 9.00042 11.1716 9.00042 12C9.00042 13.6569 10.3436 15 12.0004 15C12.8288 15 13.5788 14.6642 14.1217 14.1213" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                </button>
                <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleImageUpload} 
                    accept="image/*" 
                    multiple
                    className="hidden" 
                />
                    <input 
                        type="file" 
                        ref={videoInputRef} 
                        onChange={handleVideoUpload} 
                        accept="video/*" 
                        className="hidden" 
                    />
                </div>
                {children}
            </div>
        </div>
    );
};

export default RichTextEditor;
