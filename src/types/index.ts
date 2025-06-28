// User Types
export interface User {
  id: string;
  email: string;
  username: string;
  displayName: string;
  avatar?: string;
  phoneNumber?: string;
  bio?: string;
  snapScore: number;
  bestFriends: string[];
  blockedUsers: string[];
  privacySettings: PrivacySettings;
  followers: number;
  following: number;
  isVerified: boolean;
  avatarEmoji?: string; // Custom emoji for profile picture
  streakEmoji?: string; // Custom emoji for streak display
  createdAt: Date;
  updatedAt: Date;
}

export interface PrivacySettings {
  whoCanContactMe: 'everyone' | 'friends' | 'nobody';
  whoCanSeeMyStory: 'everyone' | 'friends' | 'custom';
  whoCanSeeMyLocation: 'nobody' | 'friends' | 'bestFriends';
  showMeInQuickAdd: boolean;
}

// Friends Types
export interface Friend {
  id: string;
  userId: string;
  friendId: string;
  status: 'pending' | 'accepted' | 'blocked';
  createdAt: Date;
  lastInteraction?: Date;
  snapStreak: number;
  mutualFriends: number;
}

export interface FriendRequest {
  id: string;
  senderId: string;
  receiverId: string;
  status: 'pending' | 'accepted' | 'rejected';
  message?: string;
  createdAt: Date;
}

// Chat/Messaging Types
export interface Chat {
  id: string;
  participants: string[];
  type: 'direct' | 'group';
  name?: string; // For group chats
  avatar?: string; // For group chats
  lastMessage?: Message;
  lastActivity: Date;
  unreadCount: number;
  isTyping: string[]; // User IDs who are typing
  createdAt: Date;
}

export interface Message {
  id: string;
  chatId: string;
  senderId: string;
  type: 'text' | 'image' | 'video' | 'audio' | 'snap' | 'story_reply';
  content: string;
  mediaUrl?: string;
  mediaType?: 'image' | 'video' | 'audio';
  storyPreview?: {
    type: 'image' | 'video';
    mediaUrl: string;
    caption: string;
  };
  isRead: boolean;
  readBy: MessageRead[];
  isTemporary: boolean; // For snaps that disappear
  expiresAt?: Date;
  reactions: MessageReaction[];
  repliedTo?: string; // Message ID being replied to
  createdAt: Date;
  updatedAt: Date;
}

export interface MessageRead {
  userId: string;
  readAt: Date;
}

export interface MessageReaction {
  userId: string;
  emoji: string;
  createdAt: Date;
}

// Story Types
export interface Story {
  id: string;
  userId: string;
  type: 'image' | 'video';
  mediaUrl: string;
  thumbnailUrl?: string;
  caption?: string;
  filters?: string[];
  duration?: number; // For videos (actual duration of this segment)
  originalDuration?: number; // For video segments (original video length)
  segmentStart?: number; // For video segments (start time in seconds)
  segmentEnd?: number; // For video segments (end time in seconds)
  isVideoSegment?: boolean; // True if this is part of a longer video
  segmentIndex?: number; // Which segment this is (0, 1, 2, etc.)
  totalSegments?: number; // Total number of segments for this video
  viewCount: number;
  views: StoryView[];
  isPublic: boolean;
  allowedViewers?: string[]; // For custom privacy
  createdAt: Date;
  expiresAt: Date;
}

export interface StoryView {
  userId: string;
  viewedAt: Date;
  watchTime?: number; // For videos
}

// Snap Types
export interface Snap {
  id: string;
  senderId: string;
  recipientIds: string[];
  type: 'image' | 'video';
  mediaUrl: string;
  caption?: string;
  filters?: string[];
  duration?: number; // For videos
  viewDuration: number; // How long recipients can view
  opens: SnapOpen[];
  screenshots: SnapScreenshot[];
  createdAt: Date;
  expiresAt: Date;
}

export interface SnapOpen {
  userId: string;
  openedAt: Date;
  viewDuration: number;
}

export interface SnapScreenshot {
  userId: string;
  screenshotAt: Date;
}

// Discover/Content Types
export interface DiscoverContent {
  id: string;
  type: 'story' | 'article' | 'video' | 'ad';
  title: string;
  description?: string;
  mediaUrl?: string;
  thumbnailUrl?: string;
  publisherId: string;
  publisherName: string;
  publisherAvatar?: string;
  category: string;
  tags: string[];
  viewCount: number;
  isSponsored: boolean;
  createdAt: Date;
}

// Camera Types
export interface CameraState {
  isRecording: boolean;
  recordedVideo: string | null;
  capturedPhoto: string | null;
  cameraType: 'front' | 'back';
  flashMode: 'on' | 'off' | 'auto';
  filters: CameraFilter[];
  selectedFilter?: string;
}

export interface CameraFilter {
  id: string;
  name: string;
  thumbnailUrl: string;
  filterUrl: string;
}

// Location Types
export interface Location {
  latitude: number;
  longitude: number;
  address?: string;
  city?: string;
  country?: string;
}

// Notification Types
export interface Notification {
  id: string;
  userId: string;
  type: 'friend_request' | 'message' | 'snap' | 'story_view' | 'mention';
  title: string;
  body: string;
  data: any;
  isRead: boolean;
  createdAt: Date;
}

// Navigation Types
export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
  ChatScreen: undefined;
  PhotoEditor: {
    photoUri: string;
    mediaType: 'photo' | 'video';
    storyReply?: {
      storyUserId: string;
      storyId: string;
    };
    videoSessionId?: string; // For AI-powered video management
  };
  ShareScreen: {
    photoUri: string;
    mediaType: 'photo' | 'video';
    caption: string;
    storyReply?: {
      storyUserId: string;
      storyId: string;
    };
  };
  WorkoutSearchScreen: undefined;
  FriendshipMemory: undefined;
  Settings: undefined;
};

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
};

export type MainTabParamList = {
  Chat: undefined;
  Camera: {
    storyReply?: {
      storyUserId: string;
      storyId: string;
    };
  } | undefined;
  Stories: undefined;
  Discover: undefined;
  Profile: undefined;
  PhotoEditor: {
    photoUri: string;
    mediaType: 'photo' | 'video';
    storyReply?: {
      storyUserId: string;
      storyId: string;
    };
    videoSessionId?: string; // For AI-powered video management
  };
  ShareScreen: {
    photoUri: string;
    mediaType: 'photo' | 'video';
    caption: string;
    storyReply?: {
      storyUserId: string;
      storyId: string;
    };
  };
};

export type ChatStackParamList = {
  ChatList: undefined;
  ChatDetail: {
    chatId: string;
    contactName: string;
  };
};

// API Response Types
export interface APIResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface OpenAIResponse {
  choices: {
    message: {
      content: string;
    };
  }[];
}

// Fitness Chat Types
export interface FitnessChatMessage {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
  exercisesExtracted?: string[];
  musclesWorked?: string[];
}

export interface WorkoutSession {
  exercises: string[];
  musclesWorked: string[];
  date: Date;
}

// App Store Types
export interface AppState {
  // User
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  
  // Friends
  friends: Friend[];
  friendRequests: FriendRequest[];
  
  // Chats
  chats: Chat[];
  currentChat: Chat | null;
  messages: { [chatId: string]: Message[] };
  
  // Stories
  stories: Story[];
  myStories: Story[];
  
  // Camera
  cameraState: CameraState;
  
  // Notifications
  notifications: Notification[];
  unreadCount: number;
  
  // Fitness Chat
  fitnessMessages: FitnessChatMessage[];
  currentWorkout: WorkoutSession;
}

// Action Types
export interface AppActions {
  // User actions
  setUser: (user: User | null) => void;
  setAuthenticated: (authenticated: boolean) => void;
  setLoading: (loading: boolean) => void;
  updateUser: (updates: Partial<User>) => void;
  incrementSnapScore: (points?: number) => void;
  loadPersistedUser: () => Promise<void>;
  logoutSession: () => void;
  
  // Friends actions
  setFriends: (friends: Friend[]) => void;
  addFriend: (friend: Friend) => void;
  removeFriend: (friendId: string) => void;
  setFriendRequests: (requests: FriendRequest[]) => void;
  
  // Chat actions
  setChats: (chats: Chat[]) => void;
  setCurrentChat: (chat: Chat | null) => void;
  addMessage: (chatId: string, message: Message) => void;
  markMessageAsRead: (chatId: string, messageId: string, userId: string) => void;
  
  // Story actions
  setStories: (stories: Story[]) => void;
  addStory: (story: Story) => void;
  viewStory: (storyId: string, userId: string) => void;
  
  // Camera actions
  setCameraState: (state: Partial<CameraState>) => void;
  
  // Notification actions
  setNotifications: (notifications: Notification[]) => void;
  markNotificationAsRead: (notificationId: string) => void;
  incrementUnreadCount: () => void;
  resetUnreadCount: () => void;
  
  // Fitness Chat actions
  addFitnessMessage: (message: FitnessChatMessage) => void;
  updateCurrentWorkout: (exercises: string[], muscles: string[]) => void;
  clearFitnessChat: () => void;
} 