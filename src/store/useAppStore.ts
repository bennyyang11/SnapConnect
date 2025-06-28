import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { 
  User, 
  AppState, 
  AppActions,
  Friend,
  FriendRequest,
  Chat,
  Message,
  Story,
  CameraState,
  Notification,
  FitnessChatMessage,
  WorkoutSession
} from '../types';

interface AppStore extends AppState, AppActions {}

// AsyncStorage keys
const USER_DATA_KEY = '@snapconnect_user_data';

// Helper functions for persistence
const saveUserData = async (user: User | null) => {
  try {
    if (user) {
      console.log('💾 SAVE: Attempting to save user data with Snap Score:', user.snapScore, 'User ID:', user.id);
      await AsyncStorage.setItem(USER_DATA_KEY, JSON.stringify(user));
      
      // Verify it was saved by reading it back
      const verification = await AsyncStorage.getItem(USER_DATA_KEY);
      if (verification) {
        const parsed = JSON.parse(verification);
        console.log('✅ SAVE: Verified saved data - Snap Score:', parsed.snapScore);
      } else {
        console.log('❌ SAVE: Verification failed - no data found after save');
      }
    } else {
      console.log('💾 SAVE: Removing user data from AsyncStorage');
      await AsyncStorage.removeItem(USER_DATA_KEY);
    }
  } catch (error) {
    console.error('❌ SAVE: Failed to save user data:', error);
  }
};

const loadUserData = async (): Promise<User | null> => {
  try {
    console.log('📖 LOAD: Attempting to load user data from AsyncStorage...');
    const userData = await AsyncStorage.getItem(USER_DATA_KEY);
    if (userData) {
      console.log('📖 LOAD: Found data in AsyncStorage, parsing...');
      const parsedUser = JSON.parse(userData);
      console.log('📖 LOAD: Parsed user data - Snap Score:', parsedUser.snapScore, 'User ID:', parsedUser.id);
      // Convert date strings back to Date objects
      const result = {
        ...parsedUser,
        createdAt: new Date(parsedUser.createdAt),
        updatedAt: new Date(parsedUser.updatedAt),
      };
      console.log('✅ LOAD: Successfully loaded user with Snap Score:', result.snapScore);
      return result;
    } else {
      console.log('📖 LOAD: No user data found in AsyncStorage');
      return null;
    }
  } catch (error) {
    console.error('❌ LOAD: Failed to load user data:', error);
    return null;
  }
};

export const useAppStore = create<AppStore>((set, get) => ({
  // Initial State
  user: null,
  isAuthenticated: false,
  isLoading: false,
  
  // Friends
  friends: [],
  friendRequests: [],
  
  // Chats
  chats: [],
  currentChat: null,
  messages: {},
  
  // Stories
  stories: [],
  myStories: [],
  
  // Camera
  cameraState: {
    isRecording: false,
    recordedVideo: null,
    capturedPhoto: null,
    cameraType: 'back',
    flashMode: 'off',
    filters: [],
    selectedFilter: undefined,
  },
  
  // Notifications
  notifications: [],
  unreadCount: 0,
  
  // Fitness Chat
  fitnessMessages: [
    {
      id: '1',
      text: "Hey! I'm your AI fitness coach. Tell me about your workout today and I'll help you optimize your training! 💪",
      isUser: false,
      timestamp: new Date(),
    }
  ],
  currentWorkout: {
    exercises: [],
    musclesWorked: [],
    date: new Date(),
  },

  // User Actions
  setUser: (user: User | null) => {
    if (user) {
      console.log('👤 setUser called with Snap Score:', user.snapScore, 'User ID:', user.id);
    } else {
      console.log('👤 setUser called with null user');
    }
    set({ user });
    saveUserData(user); // Persist to AsyncStorage
  },
  
  setAuthenticated: (authenticated: boolean) => 
    set({ isAuthenticated: authenticated }),
  
  setLoading: (loading: boolean) => 
    set({ isLoading: loading }),
  
  updateUser: (updates: Partial<User>) => {
    const currentUser = get().user;
    if (currentUser) {
      const newUser: User = { ...currentUser, ...updates, updatedAt: new Date() };
      set({ user: newUser });
      saveUserData(newUser); // Persist to AsyncStorage
    }
  },

  incrementSnapScore: (points: number = 1) => {
    const currentUser = get().user;
    if (currentUser) {
      const newUser = { ...currentUser, snapScore: currentUser.snapScore + points, updatedAt: new Date() };
      console.log(`📊 incrementSnapScore: ${currentUser.snapScore} → ${newUser.snapScore} (+${points}) for user ${currentUser.id}`);
      set({ user: newUser });
      saveUserData(newUser); // Persist to AsyncStorage
      console.log('💾 incrementSnapScore: Data saved to AsyncStorage');
    } else {
      console.log('❌ incrementSnapScore: No current user found');
    }
  },

  // Load persisted user data
  loadPersistedUser: async () => {
    try {
      const persistedUser = await loadUserData();
      if (persistedUser) {
        console.log('✅ loadPersistedUser: Found saved user with Snap Score:', persistedUser.snapScore);
        set({ user: persistedUser });
        console.log('✅ Loaded persisted user data, Snap Score:', persistedUser.snapScore);
      } else {
        console.log('ℹ️ loadPersistedUser: No saved user data found');
      }
    } catch (error) {
      console.error('❌ Failed to load persisted user:', error);
    }
  },

  // Logout without clearing persisted data
  logoutSession: () => {
    const currentUser = get().user;
    console.log('🚪 LOGOUT: Starting logout process...');
    console.log('🚪 LOGOUT: Current user Snap Score:', currentUser?.snapScore, 'User ID:', currentUser?.id);
    console.log('🚪 LOGOUT: Setting user to null but NOT clearing AsyncStorage');
    set({ user: null, isAuthenticated: false });
    // Don't call saveUserData here - this preserves the data for next login
    console.log('✅ LOGOUT: Logout complete, AsyncStorage data preserved');
  },

  // Friends Actions
  setFriends: (friends: Friend[]) => 
    set({ friends }),
  
  addFriend: (friend: Friend) => 
    set((state) => ({
      friends: [...state.friends, friend]
    })),
  
  removeFriend: (friendId: string) => 
    set((state) => ({
      friends: state.friends.filter(f => f.id !== friendId)
    })),
  
  setFriendRequests: (requests: FriendRequest[]) => 
    set({ friendRequests: requests }),

  // Chat Actions
  setChats: (chats: Chat[]) => 
    set({ chats }),
  
  setCurrentChat: (chat: Chat | null) => 
    set({ currentChat: chat }),
  
  addMessage: (chatId: string, message: Message) => 
    set((state) => {
      const currentMessages = state.messages[chatId] || [];
      
      // 📊 Increment snap score for receiving snaps
      let newUser = state.user;
      if (message.isTemporary && message.senderId !== state.user?.id && state.user) {
        // This is a snap received from someone else
        newUser = { ...state.user, snapScore: state.user.snapScore + 1, updatedAt: new Date() };
        // Persist the updated score
        saveUserData(newUser);
      }
      
      return {
        messages: {
          ...state.messages,
          [chatId]: [...currentMessages, message]
        },
        user: newUser
      };
    }),
  
  markMessageAsRead: (chatId: string, messageId: string, userId: string) => 
    set((state) => {
      const chatMessages = state.messages[chatId] || [];
      const updatedMessages = chatMessages.map(msg => {
        if (msg.id === messageId) {
          const readBy = msg.readBy.filter(r => r.userId !== userId);
          readBy.push({ userId, readAt: new Date() });
          return { ...msg, isRead: true, readBy };
        }
        return msg;
      });
      
      return {
        messages: {
          ...state.messages,
          [chatId]: updatedMessages
        }
      };
    }),

  // Story Actions
  setStories: (stories: Story[]) => 
    set({ stories }),
  
  addStory: (story: Story) => 
    set((state) => ({
      stories: [...state.stories, story],
      myStories: story.userId === state.user?.id 
        ? [...state.myStories, story] 
        : state.myStories
    })),
  
  viewStory: (storyId: string, userId: string) => 
    set((state) => {
      let shouldIncrementSnapScore = false;
      const updatedStories = state.stories.map(story => {
        if (story.id === storyId) {
          const existingView = story.views.find(v => v.userId === userId);
          if (!existingView) {
            // Check if this is the user's own story being viewed by someone else
            if (story.userId === state.user?.id && userId !== state.user?.id) {
              shouldIncrementSnapScore = true;
            }
            return {
              ...story,
              viewCount: story.viewCount + 1,
              views: [...story.views, { userId, viewedAt: new Date() }]
            };
          }
        }
        return story;
      });
      
      // Increment snap score if someone viewed current user's story
      const newUser = shouldIncrementSnapScore && state.user 
        ? { ...state.user, snapScore: state.user.snapScore + 1, updatedAt: new Date() }
        : state.user;
      
      // Persist the updated score if it changed
      if (shouldIncrementSnapScore && newUser) {
        saveUserData(newUser);
      }
      
      return { 
        stories: updatedStories,
        user: newUser
      };
    }),

  // Camera Actions
  setCameraState: (state: Partial<CameraState>) => 
    set((currentState) => ({
      cameraState: { ...currentState.cameraState, ...state }
    })),

  // Notification Actions
  setNotifications: (notifications: Notification[]) => 
    set({ notifications }),
  
  markNotificationAsRead: (notificationId: string) => 
    set((state) => ({
      notifications: state.notifications.map(n => 
        n.id === notificationId ? { ...n, isRead: true } : n
      )
    })),
  
  incrementUnreadCount: () => 
    set((state) => ({ unreadCount: state.unreadCount + 1 })),
  
  resetUnreadCount: () => 
    set({ unreadCount: 0 }),

  // Fitness Chat Actions
  addFitnessMessage: (message: FitnessChatMessage) => 
    set((state) => ({
      fitnessMessages: [...state.fitnessMessages, message]
    })),
  
  updateCurrentWorkout: (exercises: string[], muscles: string[]) => 
    set((state) => ({
      currentWorkout: {
        ...state.currentWorkout,
        exercises: [...new Set([...state.currentWorkout.exercises, ...exercises])],
        musclesWorked: [...new Set([...state.currentWorkout.musclesWorked, ...muscles])],
      }
    })),
  
  clearFitnessChat: () => 
    set({
      fitnessMessages: [
        {
          id: Date.now().toString(),
          text: "Fresh workout started! What are you training today? 🔥",
          isUser: false,
          timestamp: new Date(),
        }
      ],
      currentWorkout: {
        exercises: [],
        musclesWorked: [],
        date: new Date(),
      }
    }),
})); 