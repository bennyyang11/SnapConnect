import { create } from 'zustand';
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
  Notification 
} from '../types';

interface AppStore extends AppState, AppActions {}

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

  // User Actions
  setUser: (user: User | null) => 
    set({ user }),
  
  setAuthenticated: (authenticated: boolean) => 
    set({ isAuthenticated: authenticated }),
  
  setLoading: (loading: boolean) => 
    set({ isLoading: loading }),
  
  updateUser: (updates: Partial<User>) => 
    set((state) => ({
      user: state.user ? { ...state.user, ...updates } : null
    })),

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
      return {
        messages: {
          ...state.messages,
          [chatId]: [...currentMessages, message]
        }
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
      const updatedStories = state.stories.map(story => {
        if (story.id === storyId) {
          const existingView = story.views.find(v => v.userId === userId);
          if (!existingView) {
            return {
              ...story,
              viewCount: story.viewCount + 1,
              views: [...story.views, { userId, viewedAt: new Date() }]
            };
          }
        }
        return story;
      });
      
      return { stories: updatedStories };
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
})); 