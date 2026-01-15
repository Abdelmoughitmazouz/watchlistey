
import React from 'react';

interface VerticalTimelineFilterProps {
    years: number[];
    selectedYear: number | null;
    onSelectYear: (year: number | null) => void;
    title?: string;
}

const VerticalTimelineFilter: React.FC<VerticalTimelineFilterProps> = ({ years, selectedYear, onSelectYear, title = "Filter by Year" }) => {
    if (years.length === 0) return null;

    return (
        <div className="hidden md:flex flex-col w-24 flex-shrink-0 mr-6 sticky top-24 h-[calc(100vh-8rem)] overflow-y-auto pr-2 scrollbar-hide">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4">{title}</h3>
            
            <div className="relative flex flex-col pb-4">
                {/* Vertical Line */}
                <div className="absolute left-[7px] top-2 bottom-0 w-0.5 bg-gray-200"></div>

                {/* All Option */}
                <div 
                    className="relative z-10 mb-6 pl-6 cursor-pointer group" 
                    onClick={() => onSelectYear(null)}
                >
                    <div className={`absolute left-0 top-1 w-4 h-4 rounded-full border-2 transition-colors duration-200 box-border ${selectedYear === null ? 'bg-blue-600 border-blue-600' : 'bg-white border-gray-300 group-hover:border-blue-400'}`}></div>
                    <span className={`text-sm font-medium transition-colors duration-200 ${selectedYear === null ? 'text-blue-600 font-bold' : 'text-gray-600 group-hover:text-gray-900'}`}>
                        All
                    </span>
                </div>

                {/* Years */}
                {years.map((year) => (
                    <div 
                        key={year} 
                        className="relative z-10 mb-6 pl-6 cursor-pointer group" 
                        onClick={() => onSelectYear(year === selectedYear ? null : year)}
                    >
                        <div className={`absolute left-0 top-1 w-4 h-4 rounded-full border-2 transition-colors duration-200 box-border ${selectedYear === year ? 'bg-blue-600 border-blue-600' : 'bg-white border-gray-300 group-hover:border-blue-400'}`}></div>
                        <span className={`text-sm font-medium transition-colors duration-200 ${selectedYear === year ? 'text-blue-600 font-bold' : 'text-gray-600 group-hover:text-gray-900'}`}>
                            {year}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default VerticalTimelineFilter;
