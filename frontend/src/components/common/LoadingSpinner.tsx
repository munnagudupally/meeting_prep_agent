import React from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingSpinnerProps {
  message?: string;
  size?: 'sm' | 'md' | 'lg';
  fullHeight?: boolean;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  message = 'Loading...',
  size = 'md',
  fullHeight = false
}) => {
  const sizeMap = {
    sm: 'w-4 h-4',
    md: 'w-7 h-7',
    lg: 'w-10 h-10'
  };

  return (
    <div
      className={`flex flex-col items-center justify-center gap-3 text-slate-400 ${
        fullHeight ? 'min-h-[340px] h-full' : 'py-12'
      }`}
    >
      <Loader2 className={`${sizeMap[size]} animate-spin text-indigo-400`} />
      {message && <p className="text-sm font-medium text-slate-400 animate-pulse">{message}</p>}
    </div>
  );
};
