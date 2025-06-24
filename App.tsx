import React, { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text, View, ActivityIndicator, StyleSheet, TouchableOpacity, ScrollView, Alert, TextInput } from 'react-native';
import { useAppStore } from './src/store/useAppStore';
import { RootStackParamList } from './src/types';
import CameraScreen from './src/screens/main/CameraScreen';
import ChatScreen from './src/screens/main/ChatScreen';
import StoriesScreen from './src/screens/main/StoriesScreen';
import ChatDetailScreen from './src/screens/main/ChatDetailScreen';
import PhotoEditorScreen from './src/screens/main/PhotoEditorScreen';
import ShareScreen from './src/screens/main/ShareScreen';

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

const DemoDiscoverScreen = () => {
  const [searchQuery, setSearchQuery] = useState('');
  
  // Mock discover content
  const mockContent = [
    {
      id: '1',
      title: 'Top 10 Workout Tips',
      category: 'Fitness',
      creator: 'FitGuru',
      emoji: '💪',
      views: '1.2M',
    },
    {
      id: '2',
      title: 'Healthy Recipe Ideas',
      category: 'Food',
      creator: 'ChefMaster',
      emoji: '🥗',
      views: '850K',
    },
    {
      id: '3',
      title: 'Travel Photography',
      category: 'Travel',
      creator: 'Wanderlust',
      emoji: '📸',
      views: '2.1M',
    },
    {
      id: '4',
      title: 'Tech News Daily',
      category: 'Technology',
      creator: 'TechReporter',
      emoji: '📱',
      views: '500K',
    },
    {
      id: '5',
      title: 'Morning Meditation',
      category: 'Wellness',
      creator: 'ZenMaster',
      emoji: '🧘',
      views: '650K',
    },
    {
      id: '6',
      title: 'DIY Home Projects',
      category: 'Lifestyle',
      creator: 'HomeCrafter',
      emoji: '🏠',
      views: '920K',
    },
  ];

  // Filter content based on search query
  const filteredContent = mockContent.filter(item =>
    item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.creator.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <Text style={styles.title}>Discover</Text>
      </View>
      
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search content, creators, topics..."
          placeholderTextColor="#9E9E9E"
          value={searchQuery}
          onChangeText={setSearchQuery}
          autoCapitalize="none"
          autoCorrect={false}
        />
        <Text style={styles.searchIcon}>🔍</Text>
      </View>
      
      <ScrollView style={styles.content}>
        {filteredContent.length > 0 ? (
          filteredContent.map((item) => (
            <TouchableOpacity key={item.id} style={styles.contentCard}>
              <View style={styles.contentLeft}>
                <Text style={styles.contentEmoji}>{item.emoji}</Text>
                <View style={styles.contentInfo}>
                  <Text style={styles.contentTitle}>{item.title}</Text>
                  <Text style={styles.contentCreator}>by {item.creator}</Text>
                  <View style={styles.contentMeta}>
                    <Text style={styles.contentCategory}>{item.category}</Text>
                    <Text style={styles.contentViews}>{item.views} views</Text>
                  </View>
                </View>
              </View>
              <TouchableOpacity style={styles.viewButton}>
                <Text style={styles.viewButtonText}>View</Text>
              </TouchableOpacity>
            </TouchableOpacity>
          ))
        ) : (
          <View style={styles.noResults}>
            <Text style={styles.noResultsText}>No content found</Text>
            <Text style={styles.noResultsSubtext}>Try searching for something else</Text>
          </View>
        )}
        
        {searchQuery === '' && (
          <View style={styles.suggestions}>
            <Text style={styles.suggestionsTitle}>Popular Topics</Text>
            <View style={styles.topicTags}>
              {['Fitness', 'Food', 'Travel', 'Technology', 'Wellness', 'Lifestyle'].map((topic) => (
                <TouchableOpacity 
                  key={topic} 
                  style={styles.topicTag}
                  onPress={() => setSearchQuery(topic)}
                >
                  <Text style={styles.topicTagText}>{topic}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const DemoProfileScreen = () => {
  const { user, setUser, setAuthenticated } = useAppStore();
  
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
            setUser(null);
            setAuthenticated(false);
          }
        }
      ]
    );
  };
  
  return (
    <View style={styles.screen}>
      <View style={[styles.header, styles.profileHeader]}>
        <Text style={styles.title}>Profile</Text>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutText}>Log out</Text>
        </TouchableOpacity>
      </View>
      <ScrollView style={styles.content}>
        <View style={styles.profileInfo}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {user?.displayName?.charAt(0)?.toUpperCase() || '💪'}
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
          
          <View style={styles.demoCard}>
            <Text style={styles.cardTitle}>✅ Demo Mode Active</Text>
            <Text style={styles.cardText}>• Chat with friends</Text>
            <Text style={styles.cardText}>• Share stories</Text>
            <Text style={styles.cardText}>• Send snaps</Text>
            <Text style={styles.cardText}>• Discover content</Text>
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
        backgroundColor: '#161618',
        borderTopColor: '#424242',
        paddingBottom: 8,
        paddingTop: 8,
        height: 80,
      },
      tabBarActiveTintColor: '#FFDD3A',
      tabBarInactiveTintColor: '#9E9E9E',
    }}
  >
    <Tab.Screen name="Chat" component={ChatStackNavigator} />
    <Tab.Screen name="Stories" component={StoriesScreen} />
    <Tab.Screen name="Camera" component={CameraScreen} />
    <Tab.Screen name="Discover" component={DemoDiscoverScreen} />
    <Tab.Screen name="Profile" component={DemoProfileScreen} />
  </Tab.Navigator>
);

const MainStack = createStackNavigator();

const DemoMainNavigator = () => (
  <MainStack.Navigator screenOptions={{ headerShown: false }}>
    <MainStack.Screen name="Tabs" component={DemoTabNavigator} />
    <MainStack.Screen 
      name="PhotoEditor" 
      component={PhotoEditorScreen}
      options={{
        presentation: 'modal',
        gestureEnabled: true,
      }}
    />
    <MainStack.Screen 
      name="ShareScreen" 
      component={ShareScreen}
      options={{
        presentation: 'modal',
        gestureEnabled: true,
      }}
    />
  </MainStack.Navigator>
);

const DemoAuthNavigator = () => (
  <View style={styles.screen}>
    <Text style={styles.title}>Auth Navigator (Demo)</Text>
  </View>
);

const Stack = createStackNavigator<RootStackParamList>();

export default function App() {
  const { isAuthenticated, setAuthenticated, setUser, isLoading, setLoading } = useAppStore();

  useEffect(() => {
    if (DEMO_MODE) {
      // Demo mode - show authentication screens first, then handle auth in AuthNavigator
      console.log('🚀 Running in DEMO MODE - Authentication screens enabled');
      setAuthenticated(false); // Start unauthenticated to show login screens
      setLoading(false);
      return;
    }

    // Real Firebase auth would go here (disabled in current demo mode)
    console.log('Firebase auth disabled - please enable by setting DEMO_MODE = false and configuring Firebase');
    setLoading(false);
    setUser(null);
    setAuthenticated(false);
  }, [setAuthenticated, setUser, setLoading]);

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
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#161618',
    borderBottomWidth: 1,
    borderBottomColor: '#424242',
  },
  searchInput: {
    flex: 1,
    backgroundColor: '#0D0D0F',
    borderRadius: 25,
    paddingHorizontal: 20,
    paddingVertical: 12,
    color: '#FFFFFF',
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#424242',
  },
  searchIcon: {
    position: 'absolute',
    right: 35,
    fontSize: 18,
    color: '#9E9E9E',
  },
  contentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    marginHorizontal: 20,
    marginVertical: 8,
    backgroundColor: '#161618',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#424242',
  },
  contentLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  contentEmoji: {
    fontSize: 24,
    marginRight: 15,
  },
  contentInfo: {
    flex: 1,
  },
  contentTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  contentCreator: {
    fontSize: 14,
    color: '#FFDD3A',
    marginBottom: 4,
  },
  contentMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  contentCategory: {
    fontSize: 12,
    color: '#9E9E9E',
    backgroundColor: '#424242',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  contentViews: {
    fontSize: 12,
    color: '#9E9E9E',
  },
  viewButton: {
    backgroundColor: '#FFDD3A',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  viewButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#0D0D0F',
  },
  noResults: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 100,
  },
  noResultsText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 10,
  },
  noResultsSubtext: {
    fontSize: 14,
    color: '#9E9E9E',
  },
  suggestions: {
    padding: 20,
  },
  suggestionsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 15,
  },
  topicTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  topicTag: {
    backgroundColor: '#424242',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#606060',
  },
  topicTagText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#FFFFFF',
  },
});
