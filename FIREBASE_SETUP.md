# Firebase & Google Authentication Setup Guide

## 🔥 Firebase Configuration

Since you've already set up Google and Apple authentication in Firebase, you now need to configure the environment variables for your app.

### Step 1: Get Firebase Configuration

1. Go to your [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Go to **Project Settings** (gear icon)
4. Scroll down to **Your apps** section
5. If you don't have a Web app, click **Add app** and select **Web**
6. Copy the configuration values

### Step 2: Get Google Web Client ID

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your Firebase project
3. Go to **APIs & Services** → **Credentials**
4. Look for **OAuth 2.0 Client IDs**
5. Copy the **Web client (auto created by Google Service)** client ID

### Step 3: Create Environment File

Create a `.env` file in your `SnapConnect` directory with the following variables:

```env
# Firebase Configuration
EXPO_PUBLIC_FIREBASE_API_KEY=your-actual-api-key
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=your-actual-project-id
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-actual-sender-id
EXPO_PUBLIC_FIREBASE_APP_ID=your-actual-app-id

# Google Sign-In Configuration
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=your-actual-web-client-id.apps.googleusercontent.com
```

### Step 4: Enable Authentication Methods

Make sure in your Firebase Console:

1. **Authentication** → **Sign-in method**
2. **Google** is enabled
3. **Apple** is enabled (iOS only)
4. **Email/Password** is enabled

## 🍎 Apple Sign-In Additional Setup

For Apple Sign-In to work:

1. **iOS Bundle ID**: Make sure your `app.json` bundle identifier matches your Apple Developer account
2. **Apple Developer Account**: Ensure Sign In with Apple is enabled for your app
3. **Firebase Apple Config**: In Firebase Console → Authentication → Sign-in method → Apple, make sure it's configured

## 🔧 Testing

Once configured:

1. Restart your Expo development server
2. Test Google Sign-In (Android/iOS)
3. Test Apple Sign-In (iOS only)
4. Test Email/Password Sign-In

## 🚨 Important Notes

- **Demo Mode**: I've disabled demo mode in your Firebase service
- **Real Authentication**: Now uses actual Firebase authentication
- **OAuth Flow**: Users will see the real Google/Apple sign-in prompts
- **User Consent**: Users must explicitly approve sign-in (no more automatic sign-in)

## 📱 What Changed

- **Before**: Clicking Google/Apple buttons immediately signed you in with demo data
- **After**: Clicking Google/Apple buttons will:
  1. Open the respective OAuth flow
  2. Ask for user permission
  3. Only sign in after user approval
  4. Create real Firebase user accounts

This gives you the proper authentication flow you requested! 