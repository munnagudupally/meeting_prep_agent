import React from 'react';
import { AlertCircle, Sliders, RefreshCw, Zap } from 'lucide-react';
import { setApiMode, getApiBaseUrl } from '../../services/apiConfig';
import { Button } from './Button';

interface ApiErrorBannerProps {
  error: string | Error;
  onRetry?: () => void;
  onOpenConfig?: () => void;
  className?: string;
}

export const ApiErrorBanner: React.FC<ApiErrorBannerProps> = ({
  error,
  onRetry,
  onOpenConfig,
  className = ''
}) => {
  const errorMessage = error instanceof Error ? error.message : String(error);
  const baseUrl = getApiBaseUrl();

  const handleSwitchToMock = () => {
    setApiMode('mock');
    if (onRetry) {
      onRetry();
    } else {
      window.location.reload();
    }
  };

  return (
    <div
      className={`p-4 rounded-xl bg-rose-950/40 border border-rose-500/40 text-rose-200 text-xs sm:text-sm space-y-3 shadow-lg shadow-rose-950/20 ${className}`}
    >
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-lg bg-rose-500/20 text-rose-400 border border-rose-500/30 shrink-0 mt-0.5">
          <AlertCircle className="w-5 h-5" />
        </div>
        <div className="space-y-1 flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-bold text-white tracking-wide">
              Backend API Request Failed
            </span>
            <span className="px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 font-mono text-[10px]">
              Real API Mode Active
            </span>
          </div>
          <p className="text-xs text-rose-200/90 leading-relaxed font-sans break-words">
            {errorMessage}
          </p>
          <p className="text-[11px] text-rose-300/70 pt-0.5">
            Targeting backend server at <span className="font-mono text-white underline">{baseUrl}</span>
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2.5 pt-1 pl-10">
        <Button
          type="button"
          size="xs"
          variant="gradient"
          leftIcon={<Zap className="w-3.5 h-3.5" />}
          onClick={handleSwitchToMock}
        >
          Switch to Mock Mode
        </Button>

        {onOpenConfig && (
          <Button
            type="button"
            size="xs"
            variant="outline"
            leftIcon={<Sliders className="w-3.5 h-3.5" />}
            onClick={onOpenConfig}
          >
            Configure API Base URL
          </Button>
        )}

        {onRetry && (
          <Button
            type="button"
            size="xs"
            variant="ghost"
            leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
            onClick={onRetry}
          >
            Retry Call
          </Button>
        )}
      </div>
    </div>
  );
};
