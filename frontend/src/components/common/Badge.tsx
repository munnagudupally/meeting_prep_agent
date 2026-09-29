import React from 'react';

export type BadgeVariant =
  | 'default'
  | 'primary'
  | 'success'
  | 'warning'
  | 'danger'
  | 'info'
  | 'purple'
  | 'outline'
  | 'emerald'
  | 'rose'
  | 'amber'
  | 'indigo'
  | 'slate';

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  size?: 'sm' | 'md' | 'xs';
  className?: string;
  icon?: React.ReactNode;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'default',
  size = 'md',
  className = '',
  icon
}) => {
  const sizeClasses = {
    xs: 'px-1.5 py-0.5 text-[10px]',
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-xs font-medium'
  };

  const variantClasses: Record<BadgeVariant, string> = {
    default: 'bg-slate-800 text-slate-300 border border-slate-700/60',
    primary: 'bg-indigo-500/15 text-indigo-300 border border-indigo-500/30',
    success: 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30',
    warning: 'bg-amber-500/15 text-amber-300 border border-amber-500/30',
    danger: 'bg-rose-500/15 text-rose-300 border border-rose-500/30',
    info: 'bg-sky-500/15 text-sky-300 border border-sky-500/30',
    purple: 'bg-purple-500/15 text-purple-300 border border-purple-500/30',
    outline: 'bg-transparent text-slate-400 border border-slate-700',
    emerald: 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30',
    rose: 'bg-rose-500/15 text-rose-300 border border-rose-500/30',
    amber: 'bg-amber-500/15 text-amber-300 border border-amber-500/30',
    indigo: 'bg-indigo-500/15 text-indigo-300 border border-indigo-500/30',
    slate: 'bg-slate-800 text-slate-300 border border-slate-700/60'
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full transition-colors ${sizeClasses[size]} ${variantClasses[variant]} ${className}`}
    >
      {icon && <span className="shrink-0">{icon}</span>}
      {children}
    </span>
  );
};
