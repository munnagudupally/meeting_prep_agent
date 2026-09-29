import React from 'react';

interface CardProps {
  children: React.ReactNode;
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  action?: React.ReactNode;
  icon?: React.ReactNode;
  className?: string;
  bodyClassName?: string;
  onClick?: () => void;
  hoverable?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  title,
  subtitle,
  action,
  icon,
  className = '',
  bodyClassName = '',
  onClick,
  hoverable = false
}) => {
  return (
    <div
      onClick={onClick}
      className={`bg-slate-900/80 backdrop-blur-sm border border-slate-800/80 rounded-xl overflow-hidden transition-all duration-200 ${
        hoverable ? 'hover:border-slate-700 hover:bg-slate-850/90 hover:shadow-lg cursor-pointer' : ''
      } ${className}`}
    >
      {(title || subtitle || action) && (
        <div className="px-5 py-4 border-b border-slate-800/70 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            {icon && (
              <div className="p-2 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 shrink-0">
                {icon}
              </div>
            )}
            <div className="min-w-0">
              {title && (
                <h3 className="text-base font-semibold text-slate-100 truncate flex items-center gap-2">
                  {title}
                </h3>
              )}
              {subtitle && (
                <p className="text-xs text-slate-400 truncate mt-0.5">{subtitle}</p>
              )}
            </div>
          </div>
          {action && <div className="shrink-0 flex items-center gap-2">{action}</div>}
        </div>
      )}
      <div className={`p-5 ${bodyClassName}`}>{children}</div>
    </div>
  );
};
