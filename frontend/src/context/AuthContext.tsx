import React, { createContext, useContext, useEffect, useState, useTransition, useCallback } from 'react';
import {
  auth,
  googleProvider,
  signInWithPopup,
  signOut as fbSignOut,
  onAuthStateChanged,
  type FirebaseUser
} from '../config/firebase';
import type { UserProfile, UserPreferences } from '../types';
import { getApiBaseUrl } from '../services/apiConfig';

interface AuthContextType {
  currentUser: FirebaseUser | null;
  userProfile: UserProfile | null;
  loading: boolean;
  authError: string | null;
  signInWithGoogle: () => Promise<UserProfile>;
  devSignIn: (testUser?: { uid: string; email: string; displayName: string }) => Promise<UserProfile>;
  signOut: () => Promise<void>;
  getIdToken: (forceRefresh?: boolean) => Promise<string | null>;
  refreshProfile: () => Promise<UserProfile | null>;
  updateDisplayName: (displayName: string) => Promise<UserProfile>;
  updateUserPreferences: (preferences: Partial<UserPreferences>) => Promise<UserPreferences>;
  clearAuthError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const DEV_AUTH_STORAGE_KEY = 'meeting_prep_dev_auth_token';
const DEV_USER_STORAGE_KEY = 'meeting_prep_dev_user';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  // Helper to get raw active token
  const getIdToken = useCallback(async (forceRefresh = false): Promise<string | null> => {
    // 1. Check if Firebase user exists
    if (auth.currentUser) {
      return await auth.currentUser.getIdToken(forceRefresh);
    }
    // 2. Check if dev test token stored
    if (typeof localStorage !== 'undefined') {
      const devToken = localStorage.getItem(DEV_AUTH_STORAGE_KEY);
      if (devToken) return devToken;
    }
    return null;
  }, []);

  // Sync user with backend API
  const syncUserWithBackend = async (
    token: string,
    userData: { displayName?: string | null; photoURL?: string | null; email?: string | null }
  ): Promise<UserProfile> => {
    const baseUrl = getApiBaseUrl().replace(/\/$/, '');
    const response = await fetch(`${baseUrl}/api/users/sync`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        displayName: userData.displayName || '',
        photoURL: userData.photoURL || ''
      })
    });

    if (!response.ok) {
      let errorMsg = `User synchronization failed (HTTP ${response.status})`;
      try {
        const errorData = await response.json();
        errorMsg = errorData.error || errorData.message || errorMsg;
      } catch {
        // use default message
      }
      throw new Error(errorMsg);
    }

    const json = await response.json();
    return (json.data || json.user) as UserProfile;
  };

  // Fetch current user profile from GET /api/users/me
  const refreshProfile = useCallback(async (): Promise<UserProfile | null> => {
    try {
      const token = await getIdToken();
      if (!token) {
        setUserProfile(null);
        return null;
      }

      const baseUrl = getApiBaseUrl().replace(/\/$/, '');
      const response = await fetch(`${baseUrl}/api/users/me`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        }
      });

      if (response.ok) {
        const json = await response.json();
        const profile = (json.data || json.user) as UserProfile;
        setUserProfile(profile);
        return profile;
      }
    } catch (e) {
      console.warn('Failed to refresh user profile', e);
    }
    return null;
  }, [getIdToken]);

  // Subscribe to Firebase Auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      setAuthError(null);
      if (fbUser) {
        setCurrentUser(fbUser);
        try {
          const token = await fbUser.getIdToken();
          const synced = await syncUserWithBackend(token, {
            displayName: fbUser.displayName,
            photoURL: fbUser.photoURL,
            email: fbUser.email
          });
          setUserProfile(synced);
        } catch (err: unknown) {
          console.error('Failed to sync Firebase user with backend:', err);
          setAuthError(err instanceof Error ? err.message : 'Backend user sync failed');
        }
      } else {
        // Check for dev stored user
        const devToken = localStorage.getItem(DEV_AUTH_STORAGE_KEY);
        const devUserJson = localStorage.getItem(DEV_USER_STORAGE_KEY);
        if (devToken && devUserJson) {
          try {
            const parsedUser = JSON.parse(devUserJson);
            setCurrentUser(parsedUser as unknown as FirebaseUser);
            const profile = await syncUserWithBackend(devToken, {
              displayName: parsedUser.displayName,
              email: parsedUser.email,
              photoURL: parsedUser.photoURL
            });
            setUserProfile(profile);
          } catch (e) {
            console.warn('Failed to restore dev session', e);
            localStorage.removeItem(DEV_AUTH_STORAGE_KEY);
            localStorage.removeItem(DEV_USER_STORAGE_KEY);
            setCurrentUser(null);
            setUserProfile(null);
          }
        } else {
          setCurrentUser(null);
          setUserProfile(null);
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Sign In with Google via Firebase Client SDK
  const signInWithGoogle = async (): Promise<UserProfile> => {
    setAuthError(null);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      setCurrentUser(user);

      const token = await user.getIdToken();
      const profile = await syncUserWithBackend(token, {
        displayName: user.displayName,
        photoURL: user.photoURL,
        email: user.email
      });

      setUserProfile(profile);
      return profile;
    } catch (err: unknown) {
      console.error('Google Sign-In Error:', err);
      const message = err instanceof Error ? err.message : 'Google authentication failed';
      setAuthError(message);
      throw err;
    }
  };

  // Developer Test Sign In (Simulates verified token for testing and offline environments)
  const devSignIn = async (testUser = {
    uid: 'dev_user_' + Date.now().toString(36),
    email: 'alex.rivera@example.com',
    displayName: 'Alex Rivera'
  }): Promise<UserProfile> => {
    setAuthError(null);
    try {
      const token = 'test-token:' + btoa(JSON.stringify(testUser));
      localStorage.setItem(DEV_AUTH_STORAGE_KEY, token);
      localStorage.setItem(DEV_USER_STORAGE_KEY, JSON.stringify(testUser));

      const fakeFbUser = {
        uid: testUser.uid,
        email: testUser.email,
        displayName: testUser.displayName,
        photoURL: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        getIdToken: async () => token
      } as unknown as FirebaseUser;

      setCurrentUser(fakeFbUser);
      const profile = await syncUserWithBackend(token, {
        displayName: testUser.displayName,
        email: testUser.email,
        photoURL: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
      });

      setUserProfile(profile);
      return profile;
    } catch (err: unknown) {
      console.error('Dev Sign-In Error:', err);
      const message = err instanceof Error ? err.message : 'Dev sign-in failed';
      setAuthError(message);
      throw err;
    }
  };

  // Sign out
  const signOut = async (): Promise<void> => {
    try {
      if (auth.currentUser) {
        await fbSignOut(auth);
      }
    } finally {
      localStorage.removeItem(DEV_AUTH_STORAGE_KEY);
      localStorage.removeItem(DEV_USER_STORAGE_KEY);
      startTransition(() => {
        setCurrentUser(null);
        setUserProfile(null);
        setAuthError(null);
      });
    }
  };

  // Update profile display name (PUT /api/users/me)
  const updateDisplayName = async (displayName: string): Promise<UserProfile> => {
    const token = await getIdToken();
    if (!token) throw new Error('Not authenticated');

    const baseUrl = getApiBaseUrl().replace(/\/$/, '');
    const response = await fetch(`${baseUrl}/api/users/me`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ displayName })
    });

    if (!response.ok) {
      const errJson = await response.json().catch(() => ({}));
      throw new Error(errJson.error || 'Failed to update profile display name');
    }

    const json = await response.json();
    const updated = (json.data || json.user) as UserProfile;
    setUserProfile(updated);
    return updated;
  };

  // Update preferences (PUT /api/users/preferences)
  const updateUserPreferences = async (preferences: Partial<UserPreferences>): Promise<UserPreferences> => {
    const token = await getIdToken();
    if (!token) throw new Error('Not authenticated');

    const baseUrl = getApiBaseUrl().replace(/\/$/, '');
    const response = await fetch(`${baseUrl}/api/users/preferences`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(preferences)
    });

    if (!response.ok) {
      const errJson = await response.json().catch(() => ({}));
      throw new Error(errJson.error || 'Failed to update preferences');
    }

    const json = await response.json();
    const updatedPrefs = json.data as UserPreferences;
    setUserProfile((prev) => (prev ? { ...prev, preferences: updatedPrefs } : prev));
    return updatedPrefs;
  };

  const clearAuthError = () => setAuthError(null);

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        userProfile,
        loading,
        authError,
        signInWithGoogle,
        devSignIn,
        signOut,
        getIdToken,
        refreshProfile,
        updateDisplayName,
        updateUserPreferences,
        clearAuthError
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
