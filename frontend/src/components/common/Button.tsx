import React from 'react';
import { Loader2 } from 'lucide-react';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'gradient';
export type ButtonSize = 'xs' | 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  leftIcon,
  rightIcon,
  className = '',
  disabled,
  ...props
}) => {
  const sizeStyles: Record<ButtonSize, string> = {
    xs: 'px-2.5 py-1 text-xs rounded-md gap-1.5',
    sm: 'px-3 py-1.5 text-xs font-medium rounded-lg gap-2',
    md: 'px-4 py-2 text-sm font-medium rounded-lg gap-2',
    lg: 'px-5 py-2.5 text-base font-semibold rounded-xl gap-2.5'
  };

  const variantStyles: Record<ButtonVariant, string> = {
    primary:
      'bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm shadow-indigo-950/50 border border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/40',
    secondary:
      'bg-slate-800 hover:bg-slate-750 hover:bg-slate-700 text-slate-200 border border-slate-700 focus:ring-2 focus:ring-slate-600/40',
    outline:
      'bg-transparent hover:bg-slate-800/60 text-slate-300 border border-slate-700 hover:border-slate-600 focus:ring-2 focus:ring-slate-700',
    ghost:
      'bg-transparent hover:bg-slate-800 text-slate-400 hover:text-slate-200 focus:ring-2 focus:ring-slate-700',
    danger:
      'bg-rose-600 hover:bg-rose-500 text-white shadow-sm shadow-rose-950/50 border border-rose-500/40 focus:ring-2 focus:ring-rose-500/40',
    gradient:
      'bg-gradient-to-r from-indigo-600 via-indigo-500 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white shadow-md shadow-indigo-950/50 border border-indigo-400/30 focus:ring-2 focus:ring-indigo-500/40'
  };

  return (
    <button
      disabled={disabled || isLoading}
      className={`inline-flex items-center justify-center font-medium transition-all duration-150 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed select-none active:scale-[0.98] ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
      {...props}
    >
      {isLoading ? (
        <Loader2 className="w-4 h-4 animate-spin shrink-0" />
      ) : (
        leftIcon && <span className="shrink-0">{leftIcon}</span>
      )}
      {children}
      {!isLoading && rightIcon && <span className="shrink-0">{rightIcon}</span>}
    </button>
  );
};
