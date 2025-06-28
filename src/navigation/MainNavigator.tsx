import React from 'react';
import { Platform } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MainTabParamList } from '../types';

// Import screens (we'll create these next)
import CameraScreen from '../screens/main/CameraScreen';
import ChatScreen from '../screens/main/ChatScreen';
import StoriesScreen from '../screens/main/StoriesScreen';
import DiscoverScreen from '../screens/main/DiscoverScreen';
import ProfileScreen from '../screens/main/ProfileScreen';

const Tab = createBottomTabNavigator<MainTabParamList>();

export default function MainNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#161618',
          borderTopColor: '#424242',
          borderTopWidth: 1,
          paddingBottom: Platform.OS === 'ios' ? 12 : 16,
          paddingTop: 6,
          paddingHorizontal: 2,
          height: Platform.OS === 'ios' ? 85 : 90,
          elevation: 0,
          shadowOpacity: 0,
        },
        tabBarActiveTintColor: '#FFDD3A',
        tabBarInactiveTintColor: '#9E9E9E',
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
        component={ChatScreen}
        options={{
          tabBarLabel: 'Chat',
        }}
      />
      <Tab.Screen 
        name="Stories" 
        component={StoriesScreen}
        options={{
          tabBarLabel: 'Stories',
        }}
      />
      <Tab.Screen 
        name="Camera" 
        component={CameraScreen}
        options={{
          tabBarLabel: 'Camera',
        }}
      />
      <Tab.Screen 
        name="Discover" 
        component={DiscoverScreen}
        options={{
          tabBarLabel: 'Discover',
        }}
      />
      <Tab.Screen 
        name="Profile" 
        component={ProfileScreen}
        options={{
          tabBarLabel: 'Profile',
        }}
      />
    </Tab.Navigator>
  );
} 