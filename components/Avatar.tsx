
import React from 'react';
import { UserPlusIcon } from '../constants';

interface AvatarProps {
  size?: 'sm' | 'md' | 'lg';
  alt?: string;
  src?: string;
  className?: string;
  placeholder?: React.ReactNode;
  status?: 'online' | 'offline';
}

export const Avatar: React.FC<AvatarProps> = ({ size = 'md', alt = '', src, className, placeholder, status }) => {
  const sizeClasses = {
    sm: 'size-8',
    md: 'size-10',
    lg: 'size-12',
  };

  const placeholderSizeClasses = {
      sm: 'text-xs',
      md: 'text-sm',
      lg: 'text-base',
  }

  return (
    <div title={alt} className={`relative inline-block rounded-full overflow-hidden ${sizeClasses[size]} ${className}`}>
      {src ? (
        <img src={src} alt={alt} className="w-full h-full object-cover rounded-full" />
      ) : (
        <div className={`w-full h-full rounded-full bg-gray-100 flex items-center justify-center text-gray-500 font-semibold ${placeholderSizeClasses[size]}`}>
          {placeholder || alt.charAt(0).toUpperCase()}
        </div>
      )}
       {status === 'online' && (
           <span className={`absolute bottom-0 right-0 block rounded-full bg-green-500 ring-2 ring-white ${size === 'sm' ? 'h-2 w-2' : 'h-2.5 w-2.5'}`} />
       )}
    </div>
  );
};

interface AvatarAddButtonProps {
  size?: 'sm' | 'md' | 'lg';
  onClick?: () => void;
}

export const AvatarAddButton: React.FC<AvatarAddButtonProps> = ({ size = 'md', onClick }) => {
    const sizeClasses = {
        sm: 'size-8',
        md: 'size-10',
        lg: 'size-12',
    };

    const iconSizeClasses = {
        sm: 'size-4',
        md: 'size-5',
        lg: 'size-6',
    }

    return (
        <button
            onClick={onClick}
            type="button"
            className={`flex-shrink-0 flex items-center justify-center rounded-full bg-white border-2 border-dashed border-gray-300 text-gray-400 hover:border-gray-400 hover:text-gray-500 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${sizeClasses[size]}`}
            aria-label="Add participant"
        >
            <UserPlusIcon className={iconSizeClasses[size]} />
        </button>
    );
}