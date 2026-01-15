import React from 'react';

// FIX: Made children optional to resolve multiple "Property 'children' is missing" errors across the application.
const FormField = ({ label, description, children, required = false }: { label: string, description?: string, children?: React.ReactNode, required?: boolean }) => (
    <div className="grid grid-cols-1 gap-5 md:grid-cols-[minmax(200px,280px)_1fr] md:gap-8">
        <div>
            <h3 className="text-md font-semibold text-gray-700 flex items-center">
                {label} {required && <span className="text-red-500 ml-0.5">*</span>}
            </h3>
            {description && <p className="text-sm text-gray-500">{description}</p>}
        </div>
        <div className="w-full max-w-lg">
            {children}
        </div>
    </div>
);

export default FormField;