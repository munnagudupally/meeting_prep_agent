import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut as fbSignOut,
  onAuthStateChanged,
  type User as FirebaseUser
} from 'firebase/auth';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyA1B2C3D4E5F6G7H8I9J0K1L2M3N4O5P6Q',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'meeting-prep-agent-6b26d.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'meeting-prep-agent-6b26d',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'meeting-prep-agent-6b26d.appspot.com',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '111635887404226794047',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:111635887404226794047:web:meetingprepagent'
};

// Singleton initialization of Firebase App
export const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Firebase Auth client instance
export const auth = getAuth(app);

// Google Auth Provider
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

export { signInWithPopup, fbSignOut as signOut, onAuthStateChanged };
export type { FirebaseUser };
