import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Sparkles,
  CalendarPlus,
  ArrowRight,
  Sliders,
  CheckCircle2,
  Zap
} from 'lucide-react';
import { Button } from '../common/Button';
import {
  getApiMode,
  getApiBaseUrl,
  setApiMode,
  subscribeApiConfig,
  type ApiMode
} from '../../services/apiConfig';
import { ApiConfigModal } from '../common/ApiConfigModal';

export const Header: React.FC = () => {
  const location = useLocation();
  const [apiMode, setLocalApiMode] = useState<ApiMode>(getApiMode());
  const [apiBaseUrl, setLocalApiBaseUrl] = useState<string>(getApiBaseUrl());
  const [isConfigOpen, setIsConfigOpen] = useState(false);

  useEffect(() => {
    const unsubscribe = subscribeApiConfig(() => {
      setLocalApiMode(getApiMode());
      setLocalApiBaseUrl(getApiBaseUrl());
    });
    return unsubscribe;
  }, []);

  const toggleModeQuickly = () => {
    const nextMode = apiMode === 'mock' ? 'real' : 'mock';
    setApiMode(nextMode);
  };

  return (
    <header className="h-16 border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-md px-4 sm:px-6 flex items-center justify-between z-10 shrink-0 gap-3">
      {/* Left: Demo Flow Visual Indicator */}
      <div className="flex items-center gap-3 overflow-x-auto py-1">
        <div className="flex items-center gap-2 text-xs">
          <span className="font-semibold text-slate-400 hidden sm:inline">Flow:</span>
          <div className="flex items-center gap-1.5 text-xs whitespace-nowrap">
            <span className={location.pathname === '/' ? 'text-indigo-400 font-bold' : 'text-slate-400'}>
              Dashboard
            </span>
            <ArrowRight className="w-3 h-3 text-slate-600" />
            <span className={location.pathname.startsWith('/contacts') ? 'text-indigo-400 font-bold' : 'text-slate-400'}>
              Contacts
            </span>
            <ArrowRight className="w-3 h-3 text-slate-600" />
            <span className={location.pathname === '/meetings' ? 'text-indigo-400 font-bold' : 'text-slate-400'}>
              History
            </span>
            <ArrowRight className="w-3 h-3 text-slate-600" />
            <span className={location.pathname === '/meetings/new' ? 'text-indigo-400 font-bold' : 'text-slate-400'}>
              Create
            </span>
            <ArrowRight className="w-3 h-3 text-slate-600" />
            <span className={location.pathname.includes('/brief') ? 'text-indigo-400 font-bold' : 'text-slate-400'}>
              Brief
            </span>
            <ArrowRight className="w-3 h-3 text-slate-600" />
            <span className={location.pathname.includes('/post-meeting') ? 'text-indigo-400 font-bold' : 'text-slate-400'}>
              Post-Meeting
            </span>
          </div>
        </div>
      </div>

      {/* Right: Quick Actions & Status */}
      <div className="flex items-center gap-2.5 shrink-0">
        {/* API Mode & Config Trigger */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={toggleModeQuickly}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-medium transition-all cursor-pointer ${
              apiMode === 'real'
                ? 'bg-amber-500/15 border-amber-500/30 text-amber-300 hover:bg-amber-500/25'
                : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/20'
            }`}
            title={`Mode: ${apiMode.toUpperCase()} (${apiBaseUrl}). Click to toggle.`}
          >
            {apiMode === 'real' ? (
              <>
                <Zap className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                <span className="hidden sm:inline">Real API</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span className="hidden sm:inline">Mock Mode</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={() => setIsConfigOpen(true)}
            className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-750 border border-slate-700/80 text-slate-300 hover:text-white transition-colors cursor-pointer"
            title="Configure API Base URL & Run Endpoint Diagnostics"
          >
            <Sliders className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Quick Launch Brief */}
        <Link to="/meetings/meeting-6/brief" className="hidden md:inline-block">
          <Button
            size="sm"
            variant="gradient"
            leftIcon={<Sparkles className="w-3.5 h-3.5" />}
          >
            Launch Brief
          </Button>
        </Link>

        {/* Schedule Meeting */}
        <Link to="/meetings/new">
          <Button
            size="sm"
            variant="secondary"
            leftIcon={<CalendarPlus className="w-3.5 h-3.5" />}
          >
            <span className="hidden sm:inline">New Meeting</span>
            <span className="sm:hidden">New</span>
          </Button>
        </Link>
      </div>

      {/* API Configuration & Diagnostics Modal */}
      <ApiConfigModal
        isOpen={isConfigOpen}
        onClose={() => setIsConfigOpen(false)}
      />
    </header>
  );
};
