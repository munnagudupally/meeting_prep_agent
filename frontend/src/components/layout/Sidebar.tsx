import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Calendar,
  CalendarPlus,
  Sparkles,
  Clock,
  CheckSquare,
  FileCheck2,
  BrainCircuit,
  RotateCcw,
  ExternalLink
} from 'lucide-react';
import { apiService } from '../../services/apiService';

interface SidebarProps {
  onResetData?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ onResetData }) => {
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

  const navItems = [
    {
      to: '/',
      label: 'Dashboard',
      icon: LayoutDashboard,
      badge: null
    },
    {
      to: '/contacts',
      label: 'Contacts',
      icon: Users,
      badge: '3'
    },
    {
      to: '/meetings',
      label: 'Meeting History',
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
      to: '/meetings/meeting-6/brief',
      label: 'Meeting Brief',
      icon: Sparkles,
      badge: 'Core AI',
      highlight: true
    },
    {
      to: '/timeline',
      label: 'Memory Timeline',
      icon: Clock,
      badge: null
    },
    {
      to: '/commitments',
      label: 'Commitments',
      icon: CheckSquare,
      badge: '3 Open'
    },
    {
      to: '/meetings/meeting-6/post-meeting',
      label: 'Post-Meeting Input',
      icon: FileCheck2,
      badge: null
    }
  ];

  return (
    <aside className="w-64 bg-slate-900/95 border-r border-slate-800/80 flex flex-col h-full select-none shrink-0">
      {/* Brand Header */}
      <div className="h-16 px-5 flex items-center justify-between border-b border-slate-800/80 bg-slate-950/40">
        <NavLink to="/" className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-violet-500 p-0.5 shadow-lg shadow-indigo-950/60 flex items-center justify-center">
            <BrainCircuit className="w-5 h-5 text-white" />
          </div>
          <div>
            <span className="font-bold text-slate-100 text-sm tracking-tight flex items-center gap-1.5">
              Hindsight
              <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                Agent
              </span>
            </span>
            <p className="text-[10px] text-slate-400 font-mono tracking-tight">Meeting Intelligence</p>
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
              end={item.to === '/'}
              className={({ isActive }) =>
                `flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all group ${
                  isActive
                    ? item.highlight
                      ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-900/50'
                      : 'bg-slate-800 text-indigo-400 font-semibold border border-slate-700/60'
                    : item.highlight
                    ? 'text-indigo-300 hover:bg-indigo-950/40 hover:text-indigo-200 border border-indigo-900/40'
                    : 'text-slate-300 hover:bg-slate-800/70 hover:text-slate-100'
                }`
              }
            >
              <div className="flex items-center gap-2.5">
                <Icon
                  className={`w-4 h-4 shrink-0 transition-transform group-hover:scale-105 ${
                    item.highlight ? 'text-indigo-400 group-hover:text-indigo-300' : 'text-slate-400 group-hover:text-slate-200'
                  }`}
                />
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded font-mono font-medium ${
                    item.highlight
                      ? 'bg-indigo-400/25 text-indigo-100 border border-indigo-300/30'
                      : 'bg-slate-800 text-slate-300 border border-slate-700'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </NavLink>
          );
        })}

        {/* Demo Quick Target Focus */}
        <div className="pt-5 pb-2">
          <div className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
            Primary Demo Contact
          </div>
          <NavLink
            to="/contacts/contact-rahul-sharma"
            className={({ isActive }) =>
              `flex items-center gap-3 p-2.5 rounded-xl border transition-all ${
                isActive
                  ? 'bg-slate-800/90 border-indigo-500/50 shadow-md'
                  : 'bg-slate-900/50 border-slate-800/80 hover:border-slate-700 hover:bg-slate-850'
              }`
            }
          >
            <img
              src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80"
              alt="Rahul Sharma"
              className="w-8 h-8 rounded-full object-cover ring-2 ring-indigo-500/40"
            />
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-200 truncate">Rahul Sharma</span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              </div>
              <span className="text-[11px] text-slate-400 block truncate">Acme Technologies</span>
            </div>
            <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
          </NavLink>
        </div>
      </div>

      {/* Bottom Footer Actions */}
      <div className="p-3 border-t border-slate-800/80 bg-slate-950/40 space-y-2">
        <button
          onClick={handleReset}
          disabled={resetting}
          className="w-full flex items-center justify-center gap-2 py-1.5 px-2.5 rounded-lg text-xs font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 transition-all cursor-pointer"
          title="Reset mock contacts and meetings back to initial state"
        >
          <RotateCcw className={`w-3.5 h-3.5 ${resetting ? 'animate-spin text-indigo-400' : ''}`} />
          <span>Reset Demo Data</span>
        </button>

        <div className="px-1 text-[10px] text-slate-400 text-center font-mono">
          Hackathon Edition • Frontend Only
        </div>
      </div>
    </aside>
  );
};
