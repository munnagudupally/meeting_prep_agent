import React, { useState } from 'react';
import { useNavigate, useLocation, Navigate } from 'react-router-dom';
import { BrainCircuit, Sparkles, ShieldCheck, AlertCircle, Zap } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const LoginPage: React.FC = () => {
  const { currentUser, loading: authLoading, signInWithGoogle, devSignIn, authError, clearAuthError } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [signingIn, setSigningIn] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Target path redirect after login
  const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/dashboard';

  // If already authenticated and not loading, redirect to dashboard
  if (!authLoading && currentUser) {
    return <Navigate to={from} replace />;
  }

  const handleGoogleSignIn = async () => {
    try {
      setSigningIn(true);
      setErrorMsg(null);
      clearAuthError();
      await signInWithGoogle();
      navigate(from, { replace: true });
    } catch (err: unknown) {
      console.error('Login error:', err);
      const msg = err instanceof Error ? err.message : 'Failed to sign in with Google. Please try again.';
      setErrorMsg(msg);
    } finally {
      setSigningIn(false);
    }
  };

  const handleDevSignIn = async () => {
    try {
      setSigningIn(true);
      setErrorMsg(null);
      clearAuthError();
      await devSignIn();
      navigate(from, { replace: true });
    } catch (err: unknown) {
      console.error('Dev login error:', err);
      const msg = err instanceof Error ? err.message : 'Dev sign-in failed.';
      setErrorMsg(msg);
    } finally {
      setSigningIn(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center px-4 py-12 relative overflow-hidden">
      {/* Ambient background glow effects */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] bg-indigo-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-[350px] h-[350px] bg-violet-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative z-10 space-y-8">
        {/* Brand Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-violet-500 p-0.5 shadow-xl shadow-indigo-950/80 mb-2">
            <div className="w-full h-full bg-slate-950/40 rounded-[14px] flex items-center justify-center">
              <BrainCircuit className="w-8 h-8 text-white" />
            </div>
          </div>
          <div>
            <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center justify-center gap-2">
              Meeting Prep Agent
            </h1>
            <div className="inline-flex items-center gap-1.5 mt-1 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <Sparkles className="w-3 h-3" />
              <span>Hindsight Autonomous Intelligence</span>
            </div>
          </div>
          <p className="text-sm text-slate-400 max-w-sm mx-auto">
            Cross-meeting memory synthesis, stakeholder intelligence briefs, and automated prep for high-stakes meetings.
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-slate-900/80 border border-slate-800 backdrop-blur-xl rounded-2xl p-6 sm:p-8 shadow-2xl shadow-slate-950/60 space-y-6">
          <div className="space-y-1 text-center">
            <h2 className="text-lg font-bold text-slate-100">Welcome back</h2>
            <p className="text-xs text-slate-400">Sign in with your Google account to access your workspace</p>
          </div>

          {/* Error Banner */}
          {(errorMsg || authError) && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-semibold text-rose-200">Authentication Error</p>
                <p className="mt-0.5 opacity-90">{errorMsg || authError}</p>
              </div>
            </div>
          )}

          {/* Google Sign-In Action */}
          <div className="space-y-3">
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={signingIn || authLoading}
              className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl bg-white hover:bg-slate-100 active:bg-slate-200 text-slate-900 font-semibold text-sm transition-all duration-150 shadow-lg shadow-black/20 hover:shadow-xl cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {signingIn ? (
                <div className="w-5 h-5 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />
              ) : (
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
              )}
              <span>{signingIn ? 'Authenticating with Google...' : 'Sign In with Google'}</span>
            </button>

            {/* Quick Test / Demo Sign In for automated and testing environments */}
            <button
              type="button"
              onClick={handleDevSignIn}
              disabled={signingIn || authLoading}
              className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-slate-800/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/80 text-xs font-medium transition-colors cursor-pointer"
            >
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span>Quick Test Access (Dev Auth)</span>
            </button>
          </div>

          {/* Security details */}
          <div className="pt-2 border-t border-slate-800/80 flex items-center justify-center gap-2 text-[11px] text-slate-400">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Secured via Firebase Authentication & Firestore</span>
          </div>
        </div>

        {/* Footer info */}
        <p className="text-center text-xs text-slate-400">
          Meeting Prep Agent • Integrated with Google Cloud Firestore
        </p>
      </div>
    </div>
  );
};
