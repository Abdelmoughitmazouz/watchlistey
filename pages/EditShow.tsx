
import React, { useState, useRef, useEffect } from 'react';
import { Show, User } from '../types';
// FIX: Imported allUsers from constants to resolve module not found error.
import { allUsers } from '../constants';
import { StarIcon } from '../constants';
import ImageDropzone from '../components/ImageDropzone';

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


interface EditShowProps {
    show: Show;
    onSave: (show: Show) => void;
    onCancel: () => void;
}

const EditShow: React.FC<EditShowProps> = ({ show, onSave, onCancel }) => {
    const [formData, setFormData] = useState<Show>({
        ...show,
        genres: show.genres || [],
        participants: show.participants || [],
        gallery_urls: show.gallery_urls || [],
    });
    
    const descriptionRef = useRef<HTMLTextAreaElement>(null);
    useAutosizeTextArea(descriptionRef, formData.description);

    const participantsRef = useRef<HTMLTextAreaElement>(null);
    useAutosizeTextArea(participantsRef, formData.participants?.map(p => p.name).join(', ') || '');


    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };
    
    const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: parseFloat(value) || 0 }));
    }

    const handleGenreChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { value } = e.target;
        const genres = value.split(',').map(g => g.trim()).filter(Boolean);
        setFormData(prev => ({ ...prev, genres }));
    }

    const handleParticipantsChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const names = e.target.value.split(',').map(name => name.trim()).filter(Boolean);
        const participants = names.map(name => 
            allUsers.find(user => user.name.toLowerCase() === name.toLowerCase())
        ).filter((user): user is User => user !== undefined);
        setFormData({ ...formData, participants });
    };

    // Handle Production Companies (now Network[])
    const handleProductionCompaniesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const names = e.target.value.split(',').map(name => name.trim()).filter(Boolean);
        const companies = names.map((name, index) => ({
            id: index, // Temp ID
            name: name
        }));
        setFormData(prev => ({ ...prev, production_companies: companies }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData);
    };

    const inputStyles = "bg-white/80 focus:bg-white ring-1 ring-transparent focus:ring-blue-600 focus:shadow-md rounded-md transition-all duration-200 outline-none";

    return (
        <form onSubmit={handleSubmit}>
            {/* Sticky Header for Actions */}
            <div className="sticky top-0 z-30 bg-white/80 backdrop-blur-sm shadow-md">
                <div className="max-w-7xl mx-auto px-4 md:px-8 py-3 flex justify-between items-center">
                    <h2 className="text-lg font-semibold text-gray-800">Editing: <span className="font-bold">{formData.title}</span></h2>
                    <div className="flex items-center gap-3">
                        <button type="button" onClick={onCancel} className="rounded-lg px-4 py-2 text-sm font-semibold bg-white text-gray-700 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50">Cancel</button>
                        <button type="submit" className="rounded-lg px-4 py-2 text-sm font-semibold bg-blue-600 text-white shadow-sm hover:bg-blue-700">Save Changes</button>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="relative h-[50vh] min-h-[400px] md:h-[65vh] lg:h-[75vh]">
                <ImageDropzone
                    onFileChange={(urls) => setFormData(prev => ({...prev, backdrop_url: urls[0]}))}
                    initialImages={[formData.backdrop_url]}
                    className="absolute inset-0 w-full h-full"
                    isBackground
                />
            </div>

            <div className="max-w-7xl mx-auto px-4 md:px-8 pb-16">
                <div className="relative z-10 -mt-24 md:-mt-48 flex flex-col md:flex-row gap-8 items-start">
                    <div className="w-48 md:w-64 lg:w-72 flex-shrink-0 relative">
                        <ImageDropzone 
                           onFileChange={(urls) => setFormData(prev => ({...prev, image_url: urls[0]}))}
                           initialImages={[formData.image_url]}
                           className="w-full h-auto aspect-[2/3] rounded-lg shadow-2xl"
                        />
                    </div>

                    <div className="pt-4 md:pt-28 w-full">
                        <input
                            type="text"
                            name="title"
                            value={formData.title}
                            onChange={handleChange}
                            className={`text-4xl md:text-5xl font-bold text-gray-900 w-full bg-transparent focus:bg-white/80 focus:ring-2 focus:ring-blue-500 rounded-lg p-2 -ml-2 transition`}
                        />
                        <div className="flex items-center space-x-4 text-md text-gray-500 my-3">
                            <input type="number" name="year" value={formData.year} onChange={handleNumberChange} className={`w-20 p-1 bg-transparent ${inputStyles}`} />
                            <input type="text" name="maturity" value={formData.maturity || ''} onChange={handleChange} placeholder="e.g. TV-MA" className={`w-24 p-1 bg-transparent ${inputStyles}`} />
                            <div className="flex items-center">
                                <StarIcon />
                                <input type="number" name="rating" step="0.1" min="0" max="10" value={formData.rating} onChange={handleNumberChange} className={`w-16 ml-1 p-1 font-semibold bg-transparent ${inputStyles}`} />
                                <span className="ml-0.5">/10</span>
                            </div>
                        </div>

                         <textarea
                            ref={descriptionRef}
                            name="description"
                            value={formData.description}
                            onChange={handleChange}
                            className={`text-gray-700 text-base md:text-lg mb-6 max-w-2xl w-full bg-transparent p-2 -ml-2 resize-none overflow-hidden focus:bg-white/80 focus:ring-2 focus:ring-blue-500 rounded-lg transition`}
                        />
                        
                        <div className="flex flex-wrap items-center gap-2 text-sm text-gray-600 mb-6">
                            <span className="font-semibold text-gray-800">Genres:</span>
                            <input 
                                type="text"
                                name="genres"
                                value={formData.genres?.join(', ') || ''}
                                onChange={handleGenreChange}
                                placeholder="Comma-separated genres"
                                className={`flex-grow p-1 bg-transparent ${inputStyles}`}
                            />
                        </div>

                        <div className="flex flex-wrap items-center gap-2 text-sm text-gray-600 mb-6">
                            <span className="font-semibold text-gray-800">Production Companies:</span>
                            <input 
                                type="text"
                                name="production_companies"
                                value={formData.production_companies?.map(c => c.name).join(', ') || ''}
                                onChange={handleProductionCompaniesChange}
                                placeholder="Comma-separated companies"
                                className={`flex-grow p-1 bg-transparent ${inputStyles}`}
                            />
                        </div>

                        <div className="flex flex-col gap-2 text-sm text-gray-600 mb-6">
                           <span className="font-semibold text-gray-800">Participants:</span>
                           <textarea
                                ref={participantsRef}
                                name="participants"
                                value={formData.participants?.map(p => p.name).join(', ') || ''}
                                onChange={handleParticipantsChange}
                                placeholder="Comma-separated names of participants"
                                className={`w-full p-2 -ml-2 bg-transparent resize-none overflow-hidden focus:bg-white/80 focus:ring-2 focus:ring-blue-500 rounded-lg transition`}
                            />
                        </div>
                    </div>
                </div>

                 <div className="mt-16 space-y-8 border-t border-gray-200 pt-8">
                     <div>
                        <label className="text-xl md:text-2xl font-bold text-gray-900 mb-4 text-left">Promotional Video URL</label>
                        <p className="text-sm text-gray-500 mb-2">e.g., YouTube embed URL</p>
                        <input
                            type="text"
                            name="promo_video_url"
                            value={formData.promo_video_url || ''}
                            onChange={handleChange}
                            placeholder="https://www.youtube.com/embed/..."
                            className={`w-full max-w-2xl p-2 mt-1 ${inputStyles}`}
                        />
                    </div>
                    <div>
                        <h3 className="text-xl md:text-2xl font-bold text-gray-900 mb-4 text-left">Image Gallery</h3>
                         <ImageDropzone
                            onFileChange={(urls) => setFormData(prev => ({...prev, gallery_urls: urls}))}
                            initialImages={formData.gallery_urls}
                            multiple
                            className="w-full"
                        />
                    </div>
                </div>

            </div>
        </form>
    );
};

export default EditShow;
