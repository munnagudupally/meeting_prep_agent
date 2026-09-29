import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  CalendarPlus,
  ArrowRight,
  Sliders,
  CheckCircle2,
  Zap,
  LogOut
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
import { useAuth } from '../../context/AuthContext';

export const Header: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { currentUser, userProfile, signOut } = useAuth();
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

  const handleSignOut = async () => {
    await signOut();
    navigate('/login', { replace: true });
  };

  const displayName = userProfile?.displayName || currentUser?.displayName || currentUser?.email || 'User';

  return (
    <header className="h-16 border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-md px-4 sm:px-6 flex items-center justify-between z-10 shrink-0 gap-3">
      {/* Left: Interactive App Breadcrumb / Flow Visual Indicator */}
      <div className="flex items-center gap-3 overflow-x-auto py-1">
        <div className="flex items-center gap-2 text-xs">
          <span className="font-semibold text-slate-400 hidden sm:inline">Workspace:</span>
          <div className="flex items-center gap-1.5 text-xs whitespace-nowrap">
            <Link
              to="/dashboard"
              className={location.pathname === '/dashboard' || location.pathname === '/' ? 'text-indigo-400 font-bold' : 'text-slate-400 hover:text-slate-200'}
            >
              Dashboard
            </Link>
            <ArrowRight className="w-3 h-3 text-slate-600" />
            <Link
              to="/meetings"
              className={location.pathname === '/meetings' ? 'text-indigo-400 font-bold' : 'text-slate-400 hover:text-slate-200'}
            >
              Meetings
            </Link>
            <ArrowRight className="w-3 h-3 text-slate-600" />
            <Link
              to="/memories"
              className={location.pathname === '/memories' ? 'text-indigo-400 font-bold' : 'text-slate-400 hover:text-slate-200'}
            >
              Memories
            </Link>
            <ArrowRight className="w-3 h-3 text-slate-600" />
            <Link
              to="/contacts"
              className={location.pathname.startsWith('/contacts') ? 'text-indigo-400 font-bold' : 'text-slate-400 hover:text-slate-200'}
            >
              Contacts
            </Link>
          </div>
        </div>
      </div>

      {/* Right: Quick Actions, Mode Toggle, User Profile & Sign Out */}
      <div className="flex items-center gap-2.5 shrink-0">
        {/* API Mode & Config Trigger */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={toggleModeQuickly}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-medium transition-all cursor-pointer ${
              apiMode === 'real'
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/20'
                : 'bg-amber-500/15 border-amber-500/30 text-amber-300 hover:bg-amber-500/25'
            }`}
            title={`Mode: ${apiMode.toUpperCase()} (${apiBaseUrl}). Click to toggle.`}
          >
            {apiMode === 'real' ? (
              <>
                <Zap className="w-3.5 h-3.5 text-emerald-400" />
                <span className="hidden sm:inline">Real API</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 text-amber-400" />
                <span className="hidden sm:inline">Demo Mode</span>
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

        {/* Schedule Meeting */}
        <Link to="/meetings/new">
          <Button
            size="sm"
            variant="gradient"
            leftIcon={<CalendarPlus className="w-3.5 h-3.5" />}
          >
            <span className="hidden sm:inline">Schedule Meeting</span>
            <span className="sm:hidden">New</span>
          </Button>
        </Link>

        {/* User Profile / Account Link */}
        <Link
          to="/account"
          className="flex items-center gap-2 p-1 pl-2 pr-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 transition-all text-xs text-slate-200 group"
          title={`Signed in as ${displayName}. Click for Account Settings.`}
        >
          {currentUser?.photoURL ? (
            <img
              src={currentUser.photoURL}
              alt={displayName}
              className="w-6 h-6 rounded-full object-cover ring-1 ring-indigo-500/40"
            />
          ) : (
            <div className="w-6 h-6 rounded-full bg-indigo-600/30 border border-indigo-500/40 text-indigo-300 flex items-center justify-center font-bold text-[10px]">
              {displayName[0].toUpperCase()}
            </div>
          )}
          <span className="hidden md:inline font-medium max-w-[100px] truncate group-hover:text-white">
            {displayName}
          </span>
        </Link>

        {/* Sign Out Button */}
        <button
          type="button"
          onClick={handleSignOut}
          className="p-2 rounded-lg bg-slate-800/80 hover:bg-rose-500/20 border border-slate-700/80 hover:border-rose-500/40 text-slate-400 hover:text-rose-300 transition-colors cursor-pointer"
          title="Sign Out"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>

      {/* API Configuration & Diagnostics Modal */}
      <ApiConfigModal
        isOpen={isConfigOpen}
        onClose={() => setIsConfigOpen(false)}
      />
    </header>
  );
};
