// Firebase Configuration and Authentication Services
// Supports both demo mode and real Firebase authentication

import { Platform } from 'react-native';
import { User } from '../types';

// Demo mode flag - matches App.tsx
const DEMO_MODE = true; // Keep demo mode for auth
const ENABLE_STORAGE = true; // But enable Firebase Storage for video uploads

// Firebase services
let auth: any = null;
let db: any = null;
let storage: any = null;

// Initialize Firebase Storage separately (for video uploads)
if (ENABLE_STORAGE) {
  try {
    const { initializeApp } = require('firebase/app');
    const { getStorage } = require('firebase/storage');

    // Firebase config using environment variables
    const firebaseConfig = {
      apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || "your-api-key",
      authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || "your-project.firebaseapp.com",
      projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || "your-project-id",
      storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || "your-project.appspot.com",
      messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "123456789",
      appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID || "your-app-id"
    };

    // Initialize Firebase app for Storage only
    const app = initializeApp(firebaseConfig);
    storage = getStorage(app);
    console.log('🔥 Firebase Storage initialized successfully');
  } catch (error) {
    console.error('❌ Firebase Storage initialization failed:', error);
    storage = null;
  }
}

// Legacy Firebase initialization for auth/db (demo mode)
if (!DEMO_MODE) {
  // Real Firebase imports (only when demo mode is disabled)
  const { initializeApp } = require('firebase/app');
  const { getAuth } = require('firebase/auth');
  const { getFirestore } = require('firebase/firestore');

  // Firebase config using environment variables
  const firebaseConfig = {
    apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || "your-api-key",
    authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || "your-project.firebaseapp.com",
    projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || "your-project-id",
    storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || "your-project.appspot.com",
    messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "123456789",
    appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID || "your-app-id"
  };

  // Initialize Firebase (excluding storage - handled above)
  const legacyApp = initializeApp(firebaseConfig, 'legacy');
  auth = getAuth(legacyApp);
  db = getFirestore(legacyApp);
}

// Export Firebase services (will be null in demo mode)
export { auth, db, storage };

// Demo authentication functions
export const signInWithGoogle = async (): Promise<User> => {
  if (DEMO_MODE) {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    return {
      id: 'google_user_' + Date.now(),
      email: 'google.user@gmail.com',
      username: 'GoogleUser',
      displayName: 'Google User',
      bio: 'Signed in with Google! 🚀',
      snapScore: 2500,
      bestFriends: ['demo_friend1', 'demo_friend2'],
      blockedUsers: [],
      privacySettings: {
        whoCanContactMe: 'friends',
        whoCanSeeMyStory: 'friends',
        whoCanSeeMyLocation: 'nobody',
        showMeInQuickAdd: true,
      },
      followers: 425,
      following: 380,
      isVerified: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      avatar: 'https://lh3.googleusercontent.com/a/default-user=s96-c',
    };
  }

  // Real Firebase Google Sign-In would go here
  // This requires:
  // 1. Firebase project configuration
  // 2. Google OAuth client ID setup
  // 3. @react-native-google-signin/google-signin configuration
  
  throw new Error('Real Google Sign-In not implemented yet. Please use demo mode.');
};

export const signInWithApple = async (): Promise<User> => {
  if (DEMO_MODE) {
    // Check if iOS (Apple Sign-In is iOS only)
    if (Platform.OS !== 'ios') {
      throw new Error('Apple Sign-In is only available on iOS devices');
    }

    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    return {
      id: 'apple_user_' + Date.now(),
      email: 'apple.user@privaterelay.appleid.com',
      username: 'AppleUser',
      displayName: 'Apple User',
      bio: 'Signed in with Apple! 🍎',
      snapScore: 3200,
      bestFriends: ['demo_friend1', 'demo_friend3'],
      blockedUsers: [],
      privacySettings: {
        whoCanContactMe: 'friends',
        whoCanSeeMyStory: 'friends',
        whoCanSeeMyLocation: 'nobody',
        showMeInQuickAdd: true,
      },
      followers: 680,
      following: 520,
      isVerified: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      avatar: undefined, // Apple often doesn't provide profile photos
    };
  }

  // Real Firebase Apple Sign-In would go here
  // This requires:
  // 1. Firebase project configuration
  // 2. Apple Developer account setup
  // 3. expo-apple-authentication configuration
  
  throw new Error('Real Apple Sign-In not implemented yet. Please use demo mode.');
};

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

  // Real Firebase email/password sign-in would go here
  throw new Error('Real Email/Password Sign-In not implemented yet. Please use demo mode.');
};

// Google Sign-In configuration (for real implementation)
export const googleSignInConfig = {
  webClientId: 'your-web-client-id.apps.googleusercontent.com',
  offlineAccess: true,
  hostedDomain: '',
  forceCodeForRefreshToken: true,
};

// Export demo mode status
export const isDemoMode = DEMO_MODE;

// Export default (null in demo mode, Firebase app in real mode)
export default null; 