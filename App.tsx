import React, { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer, useNavigation } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text, View, ActivityIndicator, StyleSheet, TouchableOpacity, ScrollView, Alert, TextInput, Platform } from 'react-native';
import { useAppStore } from './src/store/useAppStore';
import { RootStackParamList } from './src/types';
import CameraScreen from './src/screens/main/CameraScreen';
import ChatScreen from './src/screens/main/ChatScreen';
import StoriesScreen from './src/screens/main/StoriesScreen';
import ChatDetailScreen from './src/screens/main/ChatDetailScreen';
import PhotoEditorScreen from './src/screens/main/PhotoEditorScreen';
import ShareScreen from './src/screens/main/ShareScreen';
import WorkoutSearchScreen from './src/screens/main/WorkoutSearchScreen';
import FitnessScreen from './src/screens/fitness/FitnessScreen';
import FitnessChatScreen from './src/screens/fitness/ChatScreen';
import DiscoverScreen from './src/screens/main/DiscoverScreen';
import ArticleDetailScreen from './src/screens/main/ArticleDetailScreen';
import FriendshipMemoryScreen from './src/screens/main/FriendshipMemoryScreen';
import SettingsScreen from './src/screens/main/SettingsScreen';

// Real navigation components
import AuthNavigator from './src/navigation/AuthNavigator';
import MainNavigator from './src/navigation/MainNavigator';

// Demo mode flag - set to true to test authentication screens without Firebase
const DEMO_MODE = true;

// Conditional Firebase import - only import when not in demo mode
let auth: any = null;
let onAuthStateChanged: any = null;

// Firebase imports completely disabled in demo mode to prevent initialization errors

// Demo Navigation Components (Firebase-free)
const Tab = createBottomTabNavigator();
const ChatStack = createStackNavigator();

const ChatStackNavigator = () => (
  <ChatStack.Navigator screenOptions={{ headerShown: false }}>
    <ChatStack.Screen name="ChatList" component={ChatScreen} />
    <ChatStack.Screen name="ChatDetail" component={ChatDetailScreen} />
  </ChatStack.Navigator>
);

// DemoDiscoverScreen removed - now using AI-powered DiscoverScreen

const DemoProfileScreen = () => {
  const navigation = useNavigation<any>();
  const { user, logoutSession } = useAppStore();
  
  const handleLogout = async () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Sign Out', 
          style: 'destructive',
          onPress: () => {
            // Use logoutSession to preserve data in storage
            logoutSession();
          }
        }
      ]
    );
  };
  
  return (
    <View style={styles.screen}>
      <View style={[styles.header, styles.profileHeader]}>
        <Text style={styles.title}>Profile</Text>
        <View style={styles.headerButtons}>
          <TouchableOpacity 
            style={styles.settingsButton} 
            onPress={() => navigation.navigate('Settings' as any)}
          >
            <Text style={styles.settingsButtonText}>⚙️</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Text style={styles.logoutText}>Log out</Text>
          </TouchableOpacity>
        </View>
      </View>
      <ScrollView style={styles.content}>
        <View style={styles.profileInfo}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {user?.avatarEmoji || user?.displayName?.charAt(0)?.toUpperCase() || '💪'}
            </Text>
          </View>
          <Text style={styles.displayName}>{user?.displayName || 'Snap User'}</Text>
          <Text style={styles.email}>{user?.email}</Text>
          
          <Text style={styles.bio}>
            {user?.bio || 'Living my best life! 📸✨'}
          </Text>
          
          <View style={styles.stats}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{user?.snapScore || 0}</Text>
              <Text style={styles.statLabel}>Snap Score</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{user?.followers || 0}</Text>
              <Text style={styles.statLabel}>Followers</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{user?.following || 0}</Text>
              <Text style={styles.statLabel}>Following</Text>
            </View>
          </View>

          {user?.isVerified && (
            <View style={styles.verifiedBadge}>
              <Text style={styles.verifiedText}>✓ Verified Account</Text>
            </View>
          )}

          {/* AI & Activity Stats */}
          <View style={styles.aiStatsContainer}>
            <View style={styles.aiStatCard}>
              <Text style={styles.aiStatIcon}>🤖</Text>
              <Text style={styles.aiStatNumber}>47</Text>
              <Text style={styles.aiStatLabel}>AI Filters Used</Text>
            </View>
            <View style={styles.aiStatCard}>
              <Text style={styles.aiStatIcon}>🎯</Text>
              <Text style={styles.aiStatNumber}>12</Text>
              <Text style={styles.aiStatLabel}>Friend Memories</Text>
            </View>
            <View style={styles.aiStatCard}>
              <Text style={styles.aiStatIcon}>💪</Text>
              <Text style={styles.aiStatNumber}>8</Text>
              <Text style={styles.aiStatLabel}>Workouts Tracked</Text>
            </View>
          </View>

          {/* Recent Activity */}
          <View style={styles.activitySection}>
            <Text style={styles.sectionTitle}>📊 Recent Activity</Text>
            <View style={styles.activityItem}>
              <Text style={styles.activityIcon}>🎨</Text>
              <View style={styles.activityContent}>
                <Text style={styles.activityText}>Used Rainbow Sparkles AI filter</Text>
                <Text style={styles.activityTime}>2 hours ago</Text>
              </View>
            </View>
            
            <View style={styles.activityItem}>
              <Text style={styles.activityIcon}>👥</Text>
              <View style={styles.activityContent}>
                <Text style={styles.activityText}>Sent snap to Alex</Text>
                <Text style={styles.activitySubtext}>+1 Snap Score</Text>
                <Text style={styles.activityTime}>5 hours ago</Text>
              </View>
            </View>
            
            <View style={styles.activityItem}>
              <Text style={styles.activityIcon}>📖</Text>
              <View style={styles.activityContent}>
                <Text style={styles.activityText}>Story: 3 views</Text>
                <Text style={styles.activitySubtext}>+3 Snap Score</Text>
                <Text style={styles.activityTime}>6 hours ago</Text>
              </View>
            </View>
            
            <View style={[styles.activityItem, styles.activityItemLast]}>
              <Text style={styles.activityIcon}>🏋️</Text>
              <View style={styles.activityContent}>
                <Text style={styles.activityText}>Logged chest workout to AI</Text>
                <Text style={styles.activityTime}>1 day ago</Text>
              </View>
            </View>
          </View>

          {/* Streaks & Achievements */}
          <View style={styles.achievementsSection}>
            <Text style={styles.sectionTitle}>🔥 Streaks & Achievements</Text>
            <View style={styles.streakContainer}>
              <View style={styles.streakItem}>
                <Text style={styles.streakEmoji}>{user?.streakEmoji || '🔥'}</Text>
                <Text style={styles.streakNumber}>7</Text>
                <Text style={styles.streakLabel}>Day Streak</Text>
              </View>
              <View style={styles.streakItem}>
                <Text style={styles.streakEmoji}>⚡</Text>
                <Text style={styles.streakNumber}>23</Text>
                <Text style={styles.streakLabel}>Best Streak</Text>
              </View>
            </View>
            
            <View style={styles.badgeContainer}>
              <View style={styles.badge}>
                <Text style={styles.badgeIcon}>🎨</Text>
                <Text style={styles.badgeText}>AI Artist</Text>
              </View>
              <View style={styles.badge}>
                <Text style={styles.badgeIcon}>👥</Text>
                <Text style={styles.badgeText}>Social Butterfly</Text>
              </View>
              <View style={styles.badge}>
                <Text style={styles.badgeIcon}>💪</Text>
                <Text style={styles.badgeText}>Fitness Guru</Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const DemoTabNavigator = () => (
  <Tab.Navigator
    screenOptions={{
      headerShown: false,
      tabBarStyle: {
        backgroundColor: '#0D0D0F',
        borderTopWidth: 1,
        borderTopColor: 'rgba(255, 255, 255, 0.1)',
        paddingBottom: Platform.OS === 'ios' ? 12 : 16,
        paddingTop: 6,
        paddingHorizontal: 2,
        height: Platform.OS === 'ios' ? 85 : 90,
        elevation: 0,
        shadowOpacity: 0,
      },
      tabBarActiveTintColor: '#FFDD3A',
      tabBarInactiveTintColor: '#666666',
      tabBarLabelStyle: {
        fontSize: 10,
        fontWeight: '600',
        marginTop: 2,
        marginBottom: 4,
        letterSpacing: 0.1,
        textAlign: 'center',
      },
      tabBarIconStyle: {
        marginBottom: 1,
        marginTop: 4,
      },
      tabBarItemStyle: {
        paddingVertical: 3,
        paddingHorizontal: 2,
        height: Platform.OS === 'ios' ? 65 : 70,
        justifyContent: 'space-between',
        alignItems: 'center',
        flexDirection: 'column',
      },
    }}
  >
    <Tab.Screen 
      name="Chat" 
      component={ChatStackNavigator}
      options={{
        tabBarIcon: ({ color, focused }) => (
          <View style={[styles.tabIcon, focused && styles.tabIconActive]}>
            <Text style={{ fontSize: 18, color: focused ? '#FFDD3A' : '#666666' }}>💬</Text>
          </View>
        ),
        tabBarLabel: 'Chat',
      }}
    />
    <Tab.Screen 
      name="Stories" 
      component={StoriesScreen}
      options={{
        tabBarIcon: ({ color, focused }) => (
          <View style={[styles.tabIcon, focused && styles.tabIconActive]}>
            <Text style={{ fontSize: 18, color: focused ? '#FFDD3A' : '#666666' }}>📱</Text>
          </View>
        ),
        tabBarLabel: 'Stories',
      }}
    />
    <Tab.Screen 
      name="Camera" 
      component={CameraScreen}
      options={{
        tabBarIcon: ({ color, focused }) => (
          <View style={[styles.cameraTabIcon, focused && styles.cameraTabIconActive]}>
            <Text style={{ fontSize: 20, color: focused ? '#000000' : '#FFFFFF' }}>📸</Text>
          </View>
        ),
        tabBarLabel: 'Camera',
      }}
    />
    <Tab.Screen 
      name="Fitness" 
      component={FitnessScreen}
      options={{
        tabBarIcon: ({ color, focused }) => (
          <View style={[styles.tabIcon, focused && styles.tabIconActive]}>
            <Text style={{ fontSize: 18, color: focused ? '#FFDD3A' : '#666666' }}>💪</Text>
          </View>
        ),
        tabBarLabel: 'Fitness',
      }}
    />
    <Tab.Screen 
      name="Discover" 
      component={DiscoverScreen}
      options={{
        tabBarIcon: ({ color, focused }) => (
          <View style={[styles.tabIcon, focused && styles.tabIconActive]}>
            <Text style={{ fontSize: 18, color: focused ? '#FFDD3A' : '#666666' }}>🔍</Text>
          </View>
        ),
        tabBarLabel: 'Discover',
      }}
    />
    <Tab.Screen 
      name="Profile" 
      component={DemoProfileScreen}
      options={{
        tabBarIcon: ({ color, focused }) => (
          <View style={[styles.tabIcon, focused && styles.tabIconActive]}>
            <Text style={{ fontSize: 18, color: focused ? '#FFDD3A' : '#666666' }}>👤</Text>
          </View>
        ),
        tabBarLabel: 'Profile',
      }}
    />
  </Tab.Navigator>
);

const MainStack = createStackNavigator();

const DemoMainNavigator = () => (
  <MainStack.Navigator screenOptions={{ headerShown: false }}>
    <MainStack.Screen name="Tabs" component={DemoTabNavigator} />
    <MainStack.Screen name="ChatScreen" component={FitnessChatScreen} />
    <MainStack.Screen name="PhotoEditor" component={PhotoEditorScreen} />
    <MainStack.Screen name="ShareScreen" component={ShareScreen} />
    <MainStack.Screen name="WorkoutSearchScreen" component={WorkoutSearchScreen} />
    <MainStack.Screen name="ArticleDetail" component={ArticleDetailScreen} />
    <MainStack.Screen name="FriendshipMemory" component={FriendshipMemoryScreen} />
    <MainStack.Screen name="Settings" component={SettingsScreen} />
  </MainStack.Navigator>
);

const DemoAuthNavigator = () => (
  <View style={styles.screen}>
    <Text style={styles.title}>Auth Navigator (Demo)</Text>
  </View>
);

const Stack = createStackNavigator<RootStackParamList>();

export default function App() {
  const { isAuthenticated, setAuthenticated, setUser, isLoading, setLoading, loadPersistedUser } = useAppStore();

  useEffect(() => {
    const initializeApp = async () => {
      if (DEMO_MODE) {
        // Demo mode - show authentication screens first, then handle auth in AuthNavigator
        console.log('🚀 App: Running in DEMO MODE - Authentication screens enabled');
        
        // Try to load persisted user data
        console.log('🔄 App: Loading persisted user data...');
        await loadPersistedUser();
        const currentUser = useAppStore.getState().user;
        if (currentUser) {
          console.log('✅ App: Found persisted user with Snap Score:', currentUser.snapScore);
        } else {
          console.log('ℹ️ App: No persisted user found');
        }
        
        setAuthenticated(false); // Start unauthenticated to show login screens
        setLoading(false);
        return;
      }

      // Real Firebase auth would go here (disabled in current demo mode)
      console.log('Firebase auth disabled - please enable by setting DEMO_MODE = false and configuring Firebase');
      setLoading(false);
      setUser(null);
      setAuthenticated(false);
    };

    initializeApp();
  }, [setAuthenticated, setUser, setLoading, loadPersistedUser]);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FFDD3A" />
        <Text style={styles.loadingText}>
          {DEMO_MODE ? 'Loading SnapConnect Demo...' : 'Loading SnapConnect...'}
        </Text>
        {!DEMO_MODE && (
          <Text style={styles.loadingSubtext}>
            Setting up your account...
          </Text>
        )}
      </View>
    );
  }

  return (
    <NavigationContainer>
      <StatusBar style="light" backgroundColor="#0D0D0F" />
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!isAuthenticated ? (
          <Stack.Screen 
            name="Auth" 
            component={AuthNavigator} 
          />
        ) : (
          <Stack.Screen 
            name="Main" 
            component={DEMO_MODE ? DemoMainNavigator : MainNavigator} 
          />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0D0D0F',
  },
  loadingText: {
    color: '#FFFFFF',
    marginTop: 16,
    fontSize: 18,
  },
  loadingSubtext: {
    color: '#9E9E9E',
    marginTop: 8,
    fontSize: 14,
  },
  screen: {
    flex: 1,
    backgroundColor: '#0D0D0F',
  },
  header: {
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#424242',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  subtitle: {
    fontSize: 14,
    color: '#FFDD3A',
    marginTop: 4,
  },
  content: {
    flex: 1,
  },
  placeholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    marginTop: 100,
  },
  placeholderText: {
    fontSize: 18,
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 10,
  },
  subText: {
    fontSize: 14,
    color: '#9E9E9E',
    textAlign: 'center',
  },

  demoCard: {
    backgroundColor: '#161618',
    borderRadius: 12,
    padding: 20,
    margin: 16,
    borderWidth: 1,
    borderColor: '#424242',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFDD3A',
    marginBottom: 12,
  },
  cardText: {
    fontSize: 14,
    color: '#FFFFFF',
    marginBottom: 8,
  },
  demoButton: {
    backgroundColor: '#FFDD3A',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonText: {
    color: '#0D0D0F',
    fontSize: 16,
    fontWeight: 'bold',
  },
  profileInfo: {
    alignItems: 'center',
    padding: 30,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FFDD3A',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 15,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#0D0D0F',
  },
  displayName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 5,
  },
  email: {
    fontSize: 16,
    color: '#9E9E9E',
    marginBottom: 20,
  },
  stats: {
    flexDirection: 'row',
    gap: 40,
    marginBottom: 20,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  statLabel: {
    fontSize: 14,
    color: '#9E9E9E',
  },
  profileHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#424242',
  },
  logoutButton: {
    backgroundColor: '#161618',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#424242',
  },
  logoutText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FF4444',
  },
  bio: {
    fontSize: 16,
    color: '#9E9E9E',
    marginBottom: 20,
  },
  verifiedBadge: {
    backgroundColor: '#FFDD3A',
    borderRadius: 8,
    padding: 8,
    marginTop: 10,
  },
  verifiedText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#0D0D0F',
  },
  // Professional Tab Styles
  tabIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  tabIconActive: {
    backgroundColor: 'rgba(255, 221, 58, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255, 221, 58, 0.4)',
  },
  cameraTabIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  cameraTabIconActive: {
    backgroundColor: '#FFDD3A',
    borderWidth: 1.5,
    borderColor: '#FFDD3A',
    transform: [{ scale: 1.05 }],
  },
  // AI Profile Features
  aiStatsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 25,
    paddingHorizontal: 10,
  },
  aiStatCard: {
    backgroundColor: '#161618',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: '#424242',
  },
  aiStatIcon: {
    fontSize: 20,
    marginBottom: 5,
  },
  aiStatNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFDD3A',
    marginBottom: 2,
  },
  aiStatLabel: {
    fontSize: 10,
    color: '#9E9E9E',
    textAlign: 'center',
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  activitySection: {
    backgroundColor: '#161618',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#424242',
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  activityIcon: {
    fontSize: 18,
    marginRight: 14,
    width: 28,
    textAlign: 'center',
    marginTop: 2,
  },
  activityContent: {
    flex: 1,
    paddingRight: 8,
  },
  activityText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 18,
    marginBottom: 2,
  },
  activitySubtext: {
    color: '#FFDD3A',
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 4,
  },
  activityTime: {
    color: '#9E9E9E',
    fontSize: 11,
    fontWeight: '500',
  },
  activityItemLast: {
    borderBottomWidth: 0,
    marginBottom: 0,
    paddingBottom: 0,
  },
  achievementsSection: {
    backgroundColor: '#161618',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#424242',
  },
  streakContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  streakItem: {
    alignItems: 'center',
    backgroundColor: '#0D0D0F',
    borderRadius: 10,
    padding: 12,
    minWidth: 80,
  },
  streakEmoji: {
    fontSize: 24,
    marginBottom: 4,
  },
  streakNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFDD3A',
    marginBottom: 2,
  },
  streakLabel: {
    fontSize: 10,
    color: '#9E9E9E',
    fontWeight: '600',
  },
  badgeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  badge: {
    backgroundColor: '#0D0D0F',
    borderRadius: 8,
    padding: 8,
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 2,
  },
  badgeIcon: {
    fontSize: 16,
    marginBottom: 2,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '600',
  },
  // Header buttons
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  settingsButton: {
    backgroundColor: '#161618',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#424242',
  },
  settingsButtonText: {
    fontSize: 16,
  },
  // Old demo discover styles removed - using AI-powered DiscoverScreen
});
