import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User,
  Sliders,
  Save,
  LogOut,
  CheckCircle2,
  AlertCircle,
  Sparkles
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { PageContainer } from '../components/layout/PageContainer';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import type { UserPreferences } from '../types';

export const AccountPage: React.FC = () => {
  const { currentUser, userProfile, updateDisplayName, updateUserPreferences, signOut } = useAuth();
  const navigate = useNavigate();

  // Profile Form States
  const [displayName, setDisplayName] = useState(userProfile?.displayName || currentUser?.displayName || '');
  const [briefingStyle, setBriefingStyle] = useState<UserPreferences['briefingStyle']>(
    userProfile?.preferences?.briefingStyle || 'concise'
  );
  const [defaultDuration, setDefaultDuration] = useState<number>(
    userProfile?.preferences?.defaultMeetingDuration || 30
  );
  const [emailNotifications, setEmailNotifications] = useState<boolean>(
    userProfile?.preferences?.emailNotifications ?? true
  );

  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPrefs, setSavingPrefs] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (userProfile) {
      setDisplayName(userProfile.displayName || currentUser?.displayName || '');
      if (userProfile.preferences) {
        setBriefingStyle(userProfile.preferences.briefingStyle || 'concise');
        setDefaultDuration(userProfile.preferences.defaultMeetingDuration || 30);
        setEmailNotifications(userProfile.preferences.emailNotifications ?? true);
      }
    }
  }, [userProfile, currentUser]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSavingProfile(true);
      setErrorMessage(null);
      setSuccessMessage(null);
      if (!displayName.trim()) {
        throw new Error('Display name cannot be empty');
      }
      await updateDisplayName(displayName.trim());
      setSuccessMessage('Profile name updated successfully.');
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Failed to update profile name');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleSavePreferences = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSavingPrefs(true);
      setErrorMessage(null);
      setSuccessMessage(null);
      await updateUserPreferences({
        briefingStyle,
        defaultMeetingDuration: Number(defaultDuration),
        emailNotifications
      });
      setSuccessMessage('Preferences saved successfully.');
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Failed to save preferences');
    } finally {
      setSavingPrefs(false);
    }
  };

  const handleSignOut = async () => {
    if (window.confirm('Are you sure you want to sign out?')) {
      await signOut();
      navigate('/login', { replace: true });
    }
  };

  return (
    <PageContainer>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 text-xs font-semibold mb-1">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Identity & Preferences</span>
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Account Settings</h1>
            <p className="text-sm text-slate-400">
              Manage your Firebase authenticated profile, briefing generation style, and meeting defaults.
            </p>
          </div>

          <Button
            variant="danger"
            size="sm"
            onClick={handleSignOut}
            leftIcon={<LogOut className="w-4 h-4" />}
          >
            Sign Out
          </Button>
        </div>

        {/* Status Alerts */}
        {successMessage && (
          <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-sm flex items-center gap-3 animate-fadeIn">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {errorMessage && (
          <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm flex items-center gap-3 animate-fadeIn">
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Left Column: User Identity Card */}
          <div className="md:col-span-1 space-y-6">
            <Card className="p-6 text-center space-y-4">
              <div className="relative inline-block">
                {currentUser?.photoURL ? (
                  <img
                    src={currentUser.photoURL}
                    alt={displayName || 'User'}
                    className="w-24 h-24 rounded-2xl mx-auto object-cover ring-4 ring-indigo-500/20 shadow-xl"
                  />
                ) : (
                  <div className="w-24 h-24 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 text-indigo-300 mx-auto flex items-center justify-center text-3xl font-bold">
                    {(displayName || currentUser?.email || 'U')[0].toUpperCase()}
                  </div>
                )}
                <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 ring-2 ring-slate-900 flex items-center justify-center text-[10px] text-white">
                  ✓
                </span>
              </div>

              <div>
                <h3 className="text-base font-bold text-white truncate">
                  {displayName || 'Meeting Prep User'}
                </h3>
                <p className="text-xs text-slate-400 truncate mt-0.5">
                  {currentUser?.email || userProfile?.email || 'Authenticated User'}
                </p>
              </div>

              <div className="pt-3 border-t border-slate-800/80 text-left space-y-2 text-xs text-slate-400">
                <div className="flex items-center justify-between">
                  <span>Auth Provider</span>
                  <Badge variant="indigo">Google Firebase</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span>User ID</span>
                  <span className="font-mono text-[10px] text-slate-400 truncate max-w-[120px]" title={currentUser?.uid || ''}>
                    {currentUser?.uid?.slice(0, 10)}...
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Firestore Sync</span>
                  <span className="text-emerald-400 font-medium">Synchronized</span>
                </div>
              </div>
            </Card>
          </div>

          {/* Right Column: Forms */}
          <div className="md:col-span-2 space-y-6">
            {/* Display Name Section */}
            <Card className="p-6 space-y-4">
              <div className="flex items-center gap-2.5 pb-2 border-b border-slate-800/80">
                <User className="w-4 h-4 text-indigo-400" />
                <h2 className="text-sm font-bold text-white">Application Profile</h2>
              </div>

              <form onSubmit={handleSaveProfile} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Display Name
                  </label>
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Enter your full name"
                    className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl px-3.5 py-2.5 text-sm text-slate-200 placeholder-slate-600 focus:outline-none transition-colors"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    Your custom application name will be preserved and not automatically overwritten.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Email Address
                  </label>
                  <input
                    type="email"
                    disabled
                    value={currentUser?.email || userProfile?.email || ''}
                    className="w-full bg-slate-950/50 border border-slate-800/60 rounded-xl px-3.5 py-2.5 text-sm text-slate-400 cursor-not-allowed"
                  />
                </div>

                <div className="flex justify-end pt-2">
                  <Button
                    type="submit"
                    variant="primary"
                    size="sm"
                    disabled={savingProfile}
                    leftIcon={<Save className="w-4 h-4" />}
                  >
                    {savingProfile ? 'Saving Name...' : 'Save Profile'}
                  </Button>
                </div>
              </form>
            </Card>

            {/* AI Prep Preferences Section */}
            <Card className="p-6 space-y-4">
              <div className="flex items-center gap-2.5 pb-2 border-b border-slate-800/80">
                <Sliders className="w-4 h-4 text-indigo-400" />
                <h2 className="text-sm font-bold text-white">Intelligence & Briefing Preferences</h2>
              </div>

              <form onSubmit={handleSavePreferences} className="space-y-4">
                {/* Briefing Style */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    AI Briefing Style
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { id: 'concise', label: 'Concise', desc: 'Fast executive summaries & bullets' },
                      { id: 'detailed', label: 'Detailed', desc: 'Deep background & risk analysis' },
                      { id: 'bullet-points', label: 'Bullet Points', desc: 'Strictly structured action points' }
                    ].map((style) => (
                      <button
                        key={style.id}
                        type="button"
                        onClick={() => setBriefingStyle(style.id as UserPreferences['briefingStyle'])}
                        className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                          briefingStyle === style.id
                            ? 'bg-indigo-600/15 border-indigo-500 text-white shadow-sm shadow-indigo-950'
                            : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                        }`}
                      >
                        <p className={`text-xs font-bold ${briefingStyle === style.id ? 'text-indigo-300' : 'text-slate-300'}`}>
                          {style.label}
                        </p>
                        <p className="text-[10px] text-slate-400 mt-0.5 leading-tight">{style.desc}</p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Default Duration */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Default Meeting Duration (Minutes)
                    </label>
                    <select
                      value={defaultDuration}
                      onChange={(e) => setDefaultDuration(Number(e.target.value))}
                      className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl px-3.5 py-2.5 text-sm text-slate-200 focus:outline-none transition-colors"
                    >
                      <option value={15}>15 Minutes (Quick Sync)</option>
                      <option value={30}>30 Minutes (Standard)</option>
                      <option value={45}>45 Minutes (Deep Dive)</option>
                      <option value={60}>60 Minutes (Strategic Review)</option>
                    </select>
                  </div>

                  {/* Email Notifications */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Prep Brief Notifications
                    </label>
                    <div className="flex items-center gap-3 pt-2">
                      <input
                        type="checkbox"
                        id="emailNotif"
                        checked={emailNotifications}
                        onChange={(e) => setEmailNotifications(e.target.checked)}
                        className="w-4 h-4 rounded border-slate-700 text-indigo-600 focus:ring-indigo-500 bg-slate-900 cursor-pointer"
                      />
                      <label htmlFor="emailNotif" className="text-xs text-slate-300 cursor-pointer">
                        Email me generated briefs before meetings
                      </label>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end pt-3">
                  <Button
                    type="submit"
                    variant="gradient"
                    size="sm"
                    disabled={savingPrefs}
                    leftIcon={<Save className="w-4 h-4" />}
                  >
                    {savingPrefs ? 'Updating Preferences...' : 'Save Preferences'}
                  </Button>
                </div>
              </form>
            </Card>
          </div>
        </div>
      </div>
    </PageContainer>
  );
};
