
import React, { useState, useCallback, useRef } from 'react';
import { UploadCloudIcon, XCircleIcon } from '../constants';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';

interface ImageDropzoneProps {
    onFileChange: (urls: string[]) => void;
    initialImages?: string[];
    multiple?: boolean;
    className?: string;
    isBackground?: boolean;
    onUploadStatusChange?: (isUploading: boolean) => void;
}

const ImageDropzone: React.FC<ImageDropzoneProps> = ({
    onFileChange,
    initialImages = [],
    multiple = false,
    className = '',
    isBackground = false,
    onUploadStatusChange
}) => {
    const [isDragging, setIsDragging] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const updateUploadStatus = (status: boolean) => {
        setIsUploading(status);
        if (onUploadStatusChange) {
            onUploadStatusChange(status);
        }
    };

    const processFiles = async (validFiles: File[]) => {
        if (validFiles.length === 0) return;

        updateUploadStatus(true);

        try {
            if (isSupabaseConfigured) {
                const uploadedUrls: string[] = [];

                for (const file of validFiles) {
                    // Sanitize filename and add timestamp for uniqueness
                    const fileExt = file.name.split('.').pop();
                    const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
                    
                    // Upload to Supabase 'images' bucket
                    const { error: uploadError } = await supabase.storage
                        .from('images')
                        .upload(fileName, file);

                    if (uploadError) {
                        console.error('Error uploading image:', uploadError);
                        continue;
                    }

                    // Get Public URL
                    const { data } = supabase.storage
                        .from('images')
                        .getPublicUrl(fileName);
                    
                    if (data.publicUrl) {
                        uploadedUrls.push(data.publicUrl);
                    }
                }

                if (uploadedUrls.length > 0) {
                    if (multiple) {
                        onFileChange([...initialImages, ...uploadedUrls]);
                    } else {
                        onFileChange([uploadedUrls[0]]);
                    }
                }

            } else {
                // Fallback: Base64 (Demo Mode)
                const urls: string[] = [];
                let filesProcessed = 0;

                const handleReaderLoad = (url: string) => {
                    urls.push(url);
                    filesProcessed++;
                    if (filesProcessed === validFiles.length) {
                        if (multiple) {
                            onFileChange([...initialImages, ...urls]);
                        } else {
                            onFileChange([url]);
                        }
                    }
                };

                validFiles.forEach(file => {
                    const reader = new FileReader();
                    reader.onload = (e) => handleReaderLoad(e.target?.result as string);
                    reader.readAsDataURL(file);
                });
            }
        } catch (err) {
            console.error("Unexpected error processing files:", err);
        } finally {
            updateUploadStatus(false);
        }
    };

    const handleFiles = useCallback((files: FileList) => {
        const fileArray = Array.from(files);
        const validFiles = fileArray.filter(file => file.type.startsWith('image/'));
        processFiles(validFiles);
    }, [multiple, onFileChange, initialImages]);

    const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    };

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            handleFiles(e.dataTransfer.files);
            e.dataTransfer.clearData();
        }
    };

    const handleClick = () => {
        if (!isUploading) {
            fileInputRef.current?.click();
        }
    };
    
    const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            handleFiles(e.target.files);
        }
    };

    const handleRemoveImage = (index: number) => {
        const newImages = [...initialImages];
        newImages.splice(index, 1);
        onFileChange(newImages);
    };
    
    const dropzoneContent = (
         <div className={`flex flex-col items-center justify-center p-4 text-center ${isBackground ? 'text-white drop-shadow-md' : 'text-gray-500'}`}>
            {isUploading ? (
                <div className="flex flex-col items-center">
                    <svg className="animate-spin h-8 w-8 text-blue-500 mb-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <p className="text-sm font-semibold">Uploading...</p>
                </div>
            ) : (
                <>
                    <UploadCloudIcon className="w-10 h-10 mb-2 opacity-70" />
                    <p className="font-semibold"><span className="text-blue-500 hover:underline">Click to upload</span> or drag and drop</p>
                    <p className="text-xs opacity-70">SVG, PNG, JPG or GIF</p>
                </>
            )}
        </div>
    );
    
    if (multiple) {
        return (
            <div>
                <div
                    onDragEnter={handleDragEnter}
                    onDragLeave={handleDragLeave}
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                    onClick={handleClick}
                    className={`relative w-full border-2 border-dashed rounded-lg cursor-pointer transition-colors duration-200 
                        ${isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300 bg-white hover:border-gray-400'}
                        ${className} ${isUploading ? 'cursor-not-allowed opacity-70' : ''}`}
                >
                    {dropzoneContent}
                </div>
                <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept="image/*"
                    className="hidden"
                    onChange={handleFileInputChange}
                    disabled={isUploading}
                />
                {initialImages.length > 0 && (
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-4 mt-4">
                        {initialImages.map((url, index) => (
                            <div key={index} className="relative aspect-square group">
                                <img src={url} alt={`Preview ${index}`} className="w-full h-full object-cover rounded-lg shadow-md" />
                                <button
                                    onClick={() => handleRemoveImage(index)}
                                    className="absolute -top-2 -right-2 bg-white rounded-full text-red-500 hover:text-red-700 opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                                    aria-label="Remove image"
                                >
                                    <XCircleIcon className="w-6 h-6" />
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        );
    }

    return (
        <div
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onClick={handleClick}
            className={`relative overflow-hidden cursor-pointer group transition-all duration-300 ${className} ${isUploading ? 'cursor-wait' : ''}`}
        >
            <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileInputChange}
                disabled={isUploading}
            />
            {initialImages[0] ? (
                 <>
                    <img src={initialImages[0]} alt="Preview" className={`w-full h-full object-cover ${isBackground ? 'object-top' : ''} transition-transform duration-300 group-hover:scale-105 ${isDragging || isUploading ? 'opacity-30' : ''}`} />
                    <div className={`absolute inset-0 bg-black/50 flex items-center justify-center transition-opacity duration-300 ${isUploading || isDragging ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                         {dropzoneContent}
                    </div>
                </>
            ) : (
                <div className={`w-full h-full border-2 border-dashed rounded-lg flex items-center justify-center transition-colors
                    ${isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300 bg-gray-50 hover:border-gray-400'}`}>
                    {dropzoneContent}
                </div>
            )}
            
            {isDragging && !initialImages[0] && (
                <div className="absolute inset-0 bg-blue-50 border-2 border-dashed border-blue-500 rounded-lg flex items-center justify-center">
                    {dropzoneContent}
                </div>
            )}
        </div>
    );
};

export default ImageDropzone;
