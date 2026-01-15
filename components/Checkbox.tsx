import React from 'react';
import { CheckboxIcon } from '../constants';

interface CheckboxProps {
    id: string;
    label: React.ReactNode;
    checked: boolean;
    onChange: (checked: boolean) => void;
    name?: string;
}

const Checkbox: React.FC<CheckboxProps> = ({ id, label, checked, onChange, name }) => {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        onChange(e.target.checked);
    };

    return (
        <div className="flex items-start">
            <div className="flex h-5 items-center">
                <input
                    id={id}
                    name={name}
                    type="checkbox"
                    checked={checked}
                    onChange={handleChange}
                    className="peer hidden"
                />
                <label
                    htmlFor={id}
                    className={`flex size-4 cursor-pointer items-center justify-center rounded border-2 border-gray-300 bg-white ring-offset-2 transition-all peer-focus:ring-2 peer-focus:ring-blue-500 ${
                        checked ? 'border-blue-600 bg-blue-600' : ''
                    }`}
                >
                    <CheckboxIcon className={`text-white transition-opacity ${checked ? 'opacity-100' : 'opacity-0'}`} />
                </label>
            </div>
            <div className="ml-3 text-sm">
                <label htmlFor={id} className="font-medium text-gray-700 cursor-pointer">
                    {label}
                </label>
            </div>
        </div>
    );
};

export default Checkbox;
