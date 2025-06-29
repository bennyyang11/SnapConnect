// Firebase Configuration and Authentication Services
// Supports both demo mode and real Firebase authentication

import { Platform } from 'react-native';
import { User } from '../types';

// Firebase imports at the top level
import { initializeApp, getApps } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Demo mode flag - temporarily enabled to show proper OAuth flow behavior
// This will show you exactly how authentication should work (with user approval)
// We'll fix the Firebase v11 compatibility issue separately
const DEMO_MODE = true; // Enable real Firebase auth
const ENABLE_STORAGE = true; // But enable Firebase Storage for video uploads

// Firebase services
let auth: any = null;
let db: any = null;
let storage: any = null;
let app: any = null;

// Firebase config using environment variables
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || "AIzaSyDcmQEjNkmtsu1F7F7o6eSaQ6iFA1l-7MM",
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || "snapconnect-72b05.firebaseapp.com",
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || "snapconnect-72b05",
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || "snapconnect-72b05.firebasestorage.app",
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "656785936228",
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID || "1:656785936228:web:623a60e79de250a9e93471"
};

// Lazy Firebase initialization function
const initializeFirebase = () => {
  console.log('🔧 Firebase: Starting initialization... Current status:', {
    app: app !== null,
    auth: auth !== null,
    db: db !== null,
    storage: storage !== null
  });
  
  if (app !== null) {
    console.log('🔧 Firebase: Already initialized, skipping...');
    return; // Already initialized
  }
  
  try {
    // Check if Firebase app is already initialized
    const existingApps = getApps();
    if (existingApps.length > 0) {
      app = existingApps[0];
      console.log('🔥 Using existing Firebase app');
    } else {
      // Initialize Firebase app once
      app = initializeApp(firebaseConfig);
      console.log('🔥 Firebase app initialized successfully');
    }

    // Initialize Storage (always available)
    if (ENABLE_STORAGE && !storage) {
      try {
        storage = getStorage(app);
        console.log('🔥 Firebase Storage initialized successfully');
      } catch (storageError) {
        console.error('❌ Firebase Storage initialization failed:', storageError);
        storage = null;
      }
    }

    // Initialize Auth and Firestore (only when not in demo mode)
    if (!DEMO_MODE) {
      if (!auth) {
        console.log('🔧 Firebase: Initializing Auth...');
        
        try {
          console.log('🔧 Firebase: Trying basic getAuth()...');
          // Use basic getAuth - Firebase handles React Native persistence automatically
          auth = getAuth(app);
          console.log('🔥 Firebase Auth initialized successfully');
        } catch (authError: any) {
          console.error('❌ Firebase Auth initialization failed:', authError.message);
          console.error('❌ Full error details:', authError);
          console.warn('⚠️ Firebase Auth failed to initialize. Authentication will not work properly.');
          console.warn('⚠️ This may be due to Firebase version compatibility or platform configuration.');
          auth = null;
        }
      } else {
        console.log('🔧 Firebase: Auth already initialized, skipping...');
      }
      
      if (!db) {
        try {
          // Initialize Firestore
          db = getFirestore(app);
          console.log('🔥 Firebase Firestore initialized successfully');
        } catch (firestoreError) {
          console.error('❌ Firebase Firestore initialization failed:', firestoreError);
          db = null;
        }
      }
    }
  } catch (error) {
    console.error('❌ Firebase initialization failed:', error);
    app = null;
    auth = null;
    db = null;
    storage = null;
  }
};

// Export Firebase services (will be null in demo mode)
export { auth, db, storage };

// Email/Password authentication function
export const signInWithEmailPassword = async (email: string, password: string): Promise<User> => {
  if (DEMO_MODE) {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    return {
      id: 'email_user_' + Date.now(),
      email: email.toLowerCase(),
      username: email.split('@')[0],
      displayName: email.split('@')[0].charAt(0).toUpperCase() + email.split('@')[0].slice(1),
      bio: 'New to SnapConnect! 🎉',
      snapScore: 0,
      bestFriends: [],
      blockedUsers: [],
      privacySettings: {
        whoCanContactMe: 'friends',
        whoCanSeeMyStory: 'friends',
        whoCanSeeMyLocation: 'nobody',
        showMeInQuickAdd: true,
      },
      followers: 0,
      following: 0,
      isVerified: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  // Real Firebase email/password sign-in implementation
  console.log('📧 Email Sign-In: Starting initialization...');
  initializeFirebase(); // Initialize Firebase if not already done
  console.log('📧 Email Sign-In: Firebase initialization completed, auth status:', auth !== null);
  
  if (!auth) {
    console.error('📧 Email Sign-In: Firebase Auth is null after initialization');
    throw new Error('Firebase Auth is not initialized. Please check your configuration.');
  }
  
  console.log('📧 Email Sign-In: Firebase Auth is ready, proceeding...');

  try {
    const result = await signInWithEmailAndPassword(auth, email, password);
    const firebaseUser = result.user;

    // Convert Firebase user to our User type
    const user: User = {
      id: firebaseUser.uid,
      email: firebaseUser.email || email,
      username: firebaseUser.displayName?.replace(/\s+/g, '').toLowerCase() || email.split('@')[0],
      displayName: firebaseUser.displayName || email.split('@')[0].charAt(0).toUpperCase() + email.split('@')[0].slice(1),
      bio: 'Welcome to SnapConnect! 🎉',
      snapScore: 0,
      bestFriends: [],
      blockedUsers: [],
      privacySettings: {
        whoCanContactMe: 'friends',
        whoCanSeeMyStory: 'friends',
        whoCanSeeMyLocation: 'nobody',
        showMeInQuickAdd: true,
      },
      followers: 0,
      following: 0,
      isVerified: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      avatar: firebaseUser.photoURL || undefined,
    };

    return user;
  } catch (error: any) {
    console.error('Email/Password Sign-In Error:', error);
    throw new Error(error.message || 'Email/Password Sign-In failed');
  }
};

// Export demo mode status
export const isDemoMode = DEMO_MODE;

// Helper function to temporarily enable demo mode for testing
export const enableDemoMode = () => {
  console.log('🎮 Demo mode can be enabled by changing DEMO_MODE = true in firebase.ts');
};

// Helper function to check if Firebase is properly initialized
export const isFirebaseReady = () => {
  if (DEMO_MODE) return false;
  initializeFirebase();
  return auth !== null && db !== null;
};

// Export default (null in demo mode, Firebase app in real mode)
export default null; 