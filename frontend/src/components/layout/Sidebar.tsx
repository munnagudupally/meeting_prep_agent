import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Calendar,
  CalendarPlus,
  Clock,
  CheckSquare,
  BrainCircuit,
  RotateCcw,
  User,
  LogOut
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { apiService } from '../../services/apiService';

interface SidebarProps {
  onResetData?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ onResetData }) => {
  const { currentUser, userProfile, signOut } = useAuth();
  const navigate = useNavigate();
  const [resetting, setResetting] = React.useState(false);

  const handleReset = async () => {
    if (window.confirm('Reset demo contacts, meetings, and commitments back to original baseline?')) {
      setResetting(true);
      await apiService.resetDemoData();
      setResetting(false);
      if (onResetData) onResetData();
      window.location.reload();
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/login', { replace: true });
  };

  const displayName = userProfile?.displayName || currentUser?.displayName || currentUser?.email || 'User';

  const navItems = [
    {
      to: '/dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
      badge: null
    },
    {
      to: '/meetings',
      label: 'Meetings',
      icon: Calendar,
      badge: null
    },
    {
      to: '/meetings/new',
      label: 'Schedule Meeting',
      icon: CalendarPlus,
      badge: null
    },
    {
      to: '/memories',
      label: 'Memory Timeline',
      icon: Clock,
      badge: 'Hindsight'
    },
    {
      to: '/contacts',
      label: 'Contacts',
      icon: Users,
      badge: null
    },
    {
      to: '/commitments',
      label: 'Commitments',
      icon: CheckSquare,
      badge: null
    },
    {
      to: '/account',
      label: 'Account & Settings',
      icon: User,
      badge: null
    }
  ];

  return (
    <aside className="w-64 bg-slate-900/95 border-r border-slate-800/80 flex flex-col h-full select-none shrink-0">
      {/* Brand Header */}
      <div className="h-16 px-5 flex items-center justify-between border-b border-slate-800/80 bg-slate-950/40">
        <NavLink to="/dashboard" className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-violet-500 p-0.5 shadow-lg shadow-indigo-950/60 flex items-center justify-center">
            <BrainCircuit className="w-5 h-5 text-white" />
          </div>
          <div>
            <span className="font-bold text-slate-100 text-sm tracking-tight flex items-center gap-1.5">
              Meeting Prep
              <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                Agent
              </span>
            </span>
            <p className="text-[10px] text-slate-400 font-mono tracking-tight">Hindsight Intelligence</p>
          </div>
        </NavLink>
      </div>

      {/* Primary Navigation */}
      <div className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <div className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
          Navigation
        </div>

        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all group ${
                  isActive
                    ? 'bg-slate-800 text-indigo-400 font-semibold border border-slate-700/60 shadow-sm'
                    : 'text-slate-300 hover:bg-slate-800/70 hover:text-slate-100'
                }`
              }
            >
              <div className="flex items-center gap-2.5">
                <Icon className="w-4 h-4 shrink-0 transition-transform group-hover:scale-105 text-slate-400 group-hover:text-indigo-400" />
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span className="text-[10px] px-1.5 py-0.5 rounded font-mono font-medium bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  {item.badge}
                </span>
              )}
            </NavLink>
          );
        })}
      </div>

      {/* Bottom User Card & Actions */}
      <div className="p-3 border-t border-slate-800/80 bg-slate-950/40 space-y-2">
        {/* User preview */}
        <NavLink
          to="/account"
          className="flex items-center gap-2.5 p-2 rounded-xl bg-slate-900/60 hover:bg-slate-800/80 border border-slate-800 hover:border-slate-700 transition-all text-xs"
        >
          {currentUser?.photoURL ? (
            <img
              src={currentUser.photoURL}
              alt={displayName}
              className="w-7 h-7 rounded-lg object-cover ring-1 ring-indigo-500/40"
            />
          ) : (
            <div className="w-7 h-7 rounded-lg bg-indigo-600/30 border border-indigo-500/40 text-indigo-300 flex items-center justify-center font-bold text-xs">
              {displayName[0].toUpperCase()}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-slate-200 truncate">{displayName}</p>
            <p className="text-[10px] text-slate-400 truncate">{currentUser?.email || 'Authenticated'}</p>
          </div>
        </NavLink>

        <div className="flex items-center gap-1.5">
          <button
            onClick={handleReset}
            disabled={resetting}
            className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-[11px] font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 transition-all cursor-pointer"
            title="Reset demo contacts and meetings back to initial state"
          >
            <RotateCcw className={`w-3 h-3 ${resetting ? 'animate-spin text-indigo-400' : ''}`} />
            <span>Reset Demo</span>
          </button>

          <button
            onClick={handleSignOut}
            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-300 hover:bg-rose-500/10 border border-slate-800 hover:border-rose-500/30 transition-all cursor-pointer"
            title="Sign Out"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </aside>
  );
};
