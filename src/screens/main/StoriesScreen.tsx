import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  SafeAreaView,
  Image,
  Dimensions,
  PanResponder,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Video, ResizeMode } from 'expo-av';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import { useAppStore } from '../../store/useAppStore';
import { Story, Message, Chat, MainTabParamList } from '../../types';

const { width } = Dimensions.get('window');

// Utility function to split long videos into story segments
const splitVideoIntoSegments = (story: Omit<Story, 'id'>, maxSegmentDuration: number = 15): Story[] => {
  if (story.type !== 'video' || !story.duration || story.duration <= maxSegmentDuration) {
    // If not a video or duration is within limits, return as is
    return [{
      ...story,
      id: story.userId + '_' + Date.now()
    } as Story];
  }

  const segments: Story[] = [];
  const totalDuration = story.duration;
  let currentStart = 0;
  let segmentIndex = 0;

  while (currentStart < totalDuration) {
    const remainingDuration = totalDuration - currentStart;
    const segmentDuration = Math.min(maxSegmentDuration, remainingDuration);
    const segmentEnd = currentStart + segmentDuration;

    const segment: Story = {
      ...story,
      id: `${story.userId}_${Date.now()}_segment_${segmentIndex}`,
      duration: segmentDuration,
      originalDuration: totalDuration,
      segmentStart: currentStart,
      segmentEnd: segmentEnd,
      isVideoSegment: true,
      segmentIndex: segmentIndex,
      totalSegments: Math.ceil(totalDuration / maxSegmentDuration),
      caption: segmentIndex === 0 ? story.caption : undefined, // Only show caption on first segment
    };

    segments.push(segment);
    currentStart = segmentEnd;
    segmentIndex++;
  }

  return segments;
};

interface StoryItemProps {
  story: Story;
  onPress: () => void;
  isMyStory?: boolean;
}

const StoryItem: React.FC<StoryItemProps> = ({ story, onPress, isMyStory = false }) => {
  const hasViewed = story.views.some(v => v.userId === 'demo-user'); // In real app, use actual user ID
  
  const getPreviewImage = () => {
    switch (story.userId) {
      case 'john_doe':
        return 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=200&h=200&fit=crop&crop=center';
      case 'sarah_wilson':
        return 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&h=200&fit=crop&crop=face';
      case 'demo-user':
        return 'https://images.unsplash.com/photo-1494790108755-2616c9aa44fb?w=200&h=200&fit=crop&crop=face';
      default:
        return 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&h=200&fit=crop&crop=face';
    }
  };
  
  return (
    <TouchableOpacity style={styles.storyItem} onPress={onPress}>
      <View style={[
        styles.storyRing,
        hasViewed && !isMyStory && styles.viewedStoryRing,
        isMyStory && styles.myStoryRing
      ]}>
        <View style={styles.storyPreview}>
          <Image 
            source={{ uri: getPreviewImage() }} 
            style={styles.storyPreviewImage}
            resizeMode="cover"
          />

        </View>
      </View>
      <Text style={styles.storyUsername} numberOfLines={1}>
        {isMyStory ? 'Your Story' : story.userId}
      </Text>
      {isMyStory && (
        <Text style={styles.storyViewCount}>
          {story.viewCount} views
        </Text>
      )}
    </TouchableOpacity>
  );
};

interface StoryViewerProps {
  story: Story;
  onClose: () => void;
  onNext?: () => void;
  onPrevious?: () => void;
  onSendReply: (storyUserId: string, replyText: string) => void;
  onSendSnap: (storyUserId: string, snapType: 'photo' | 'video') => void;
  onOpenCamera: (storyUserId: string, storyId: string) => void;
}

const StoryViewer: React.FC<StoryViewerProps> = ({ story, onClose, onNext, onPrevious, onSendReply, onSendSnap, onOpenCamera }) => {
  const [progress, setProgress] = useState(0);
  const [isReplyMode, setIsReplyMode] = useState(false);
  const [replyText, setReplyText] = useState('');
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  
  // Reset progress when story changes
  useEffect(() => {
    setProgress(0);
  }, [story.id]);
  
  useEffect(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    
    // Determine story duration: use actual duration for videos, 5 seconds for images
    const storyDuration = story.type === 'video' && story.duration 
      ? story.duration 
      : 5; // 5 seconds for images or videos without duration
    
    // Calculate progress increment based on actual duration
    const progressIncrement = 100 / (storyDuration * 10); // 10 updates per second
    
    timerRef.current = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          if (timerRef.current) {
            clearInterval(timerRef.current);
          }
          return 100;
        }
        return prev + progressIncrement;
      });
    }, 100); // Update every 100ms

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [story.id, story.duration, story.type]);

  // Handle auto-advance when progress reaches 100%
  useEffect(() => {
    if (progress >= 100) {
      // Use setTimeout to defer the call to the next tick
      const timeout = setTimeout(() => {
        onNext?.();
      }, 0);
      
      return () => clearTimeout(timeout);
    }
  }, [progress, onNext]);

  // Pan responder for swipe down gesture
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        return Math.abs(gestureState.dy) > Math.abs(gestureState.dx) && Math.abs(gestureState.dy) > 10;
      },
      onPanResponderMove: (evt, gestureState) => {
        // Optional: Add visual feedback for swipe down
      },
      onPanResponderRelease: (evt, gestureState) => {
        // If swiped down more than 100 pixels, close the story
        if (gestureState.dy > 100) {
          onClose();
        }
      },
    })
  ).current;

  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    
    if (hours < 1) return 'now';
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  const getStoryContent = () => {
    // Check if this is a user's actual photo/video (not a test URI)
    const isActualMedia = story.mediaUrl && 
      !story.mediaUrl.startsWith('test://') && 
      !story.mediaUrl.startsWith('demo-');
    
    if (isActualMedia) {
      // Use the actual photo/video from the user
      return {
        type: story.type,
        uri: story.mediaUrl,
        description: story.caption || 'User story'
      };
    }
    
    // Fall back to demo content for demo stories or test URIs
    switch (story.userId) {
      case 'john_doe':
        return {
          type: 'image',
          uri: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=800&fit=crop&crop=center',
          description: 'Beautiful sunset at the beach'
        };
      case 'sarah_wilson':
        return {
          type: 'video',
          uri: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
          description: 'Amazing bird documentary footage'
        };
      default:
        return {
          type: story.type,
          uri: story.type === 'video' 
            ? 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4'
            : 'https://images.unsplash.com/photo-1494790108755-2616c9aa44fb?w=400&h=800&fit=crop&crop=face',
          description: 'User story'
        };
    }
  };

  const storyContent = getStoryContent();

  const getUserAvatar = () => {
    switch (story.userId) {
      case 'john_doe':
        return 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face';
      case 'sarah_wilson':
        return 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=face';
      case 'demo-user':
        return 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop&crop=face';
      default:
        return 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face';
    }
  };

  const sendReply = () => {
    if (!replyText.trim()) return;
    
    onSendReply(story.userId, replyText.trim());
    
    Alert.alert(
      '✅ Reply Sent!',
      `Your message was sent to ${story.userId} about their story!`,
      [{ text: 'OK', onPress: () => {
        setReplyText('');
        setIsReplyMode(false);
      }}]
    );
  };

  const openCamera = () => {
    // Call the parent function to handle navigation
    onOpenCamera(story.userId, story.id);
  };

  return (
    <View style={styles.storyViewer} {...panResponder.panHandlers}>
      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        {story.isVideoSegment && story.totalSegments && story.totalSegments > 1 ? (
          // Multiple segments - show segment indicators
          <View style={styles.segmentProgressContainer}>
            {Array.from({ length: story.totalSegments }, (_, index) => (
              <View key={index} style={styles.segmentProgressBar}>
                <View 
                  style={[
                    styles.segmentProgressFill, 
                    { 
                      width: index < (story.segmentIndex || 0) 
                        ? '100%' 
                        : index === (story.segmentIndex || 0) 
                        ? `${progress}%` 
                        : '0%' 
                    }
                  ]} 
                />
              </View>
            ))}
          </View>
        ) : (
          // Single story - normal progress bar
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${progress}%` }]} />
          </View>
        )}
      </View>

      {/* Story Content */}
      <View style={styles.storyContent}>
        <View style={styles.storyMediaContainer}>
          {story.type === 'video' ? (
            <Video
              source={{ uri: storyContent.uri }}
              style={styles.storyVideo}
              shouldPlay={true}
              isLooping={false}
              isMuted={false}
              resizeMode={ResizeMode.COVER}
              positionMillis={story.segmentStart ? story.segmentStart * 1000 : 0}
              onPlaybackStatusUpdate={(status) => {
                // For video segments, pause when reaching segment end
                if (story.isVideoSegment && story.segmentEnd && status.isLoaded && status.positionMillis) {
                  if (status.positionMillis >= story.segmentEnd * 1000) {
                    // Video segment ended, let the timer handle the transition
                  }
                }
              }}
            />
          ) : (
            <Image 
              source={{ uri: storyContent.uri }} 
              style={styles.storyImage}
              resizeMode="cover"
            />
          )}
        </View>
        
        {story.caption && (
          <View style={styles.captionContainer}>
            <Text style={styles.caption}>{story.caption}</Text>
          </View>
        )}
      </View>

      {/* Header - Positioned on top of content */}
      <View style={styles.storyHeader}>
        <View style={styles.storyUserInfo}>
          <View style={styles.storyUserAvatar}>
            <Image 
              source={{ uri: getUserAvatar() }} 
              style={styles.storyUserAvatarImage}
              resizeMode="cover"
            />
          </View>
          <View>
            <Text style={styles.storyUserName}>{story.userId}</Text>
            <View style={styles.storyTimeContainer}>
              <Text style={styles.storyTime}>{formatTime(story.createdAt)}</Text>
              {story.isVideoSegment && story.totalSegments && story.totalSegments > 1 && (
                <Text style={styles.segmentInfo}>
                  • Part {(story.segmentIndex || 0) + 1} of {story.totalSegments}
                </Text>
              )}
            </View>
          </View>
        </View>
        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
          <Text style={styles.closeText}>✕</Text>
        </TouchableOpacity>
      </View>

      {/* Navigation */}
      <View style={styles.storyNavigation}>
        <TouchableOpacity style={styles.navButton} onPress={onPrevious}>
          <Text style={styles.navText}>◀</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navButton} onPress={onNext}>
          <Text style={styles.navText}>▶</Text>
        </TouchableOpacity>
      </View>

      {/* Bottom Actions - Grouped on bottom right */}
      <View style={styles.storyActions}>
        <View style={styles.actionButtonsGroup}>
          <TouchableOpacity style={styles.actionButton} onPress={() => setIsReplyMode(true)}>
            <Text style={styles.actionIcon}>💬</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} onPress={openCamera}>
            <Text style={styles.actionIcon}>📷</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Reply Mode UI */}
      {isReplyMode && (
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.replyContainer}
        >
          <View style={styles.replyInputContainer}>
            <TouchableOpacity 
              style={styles.replyCloseButton} 
              onPress={() => {
                setIsReplyMode(false);
                setReplyText('');
              }}
            >
              <Text style={styles.replyCloseText}>✕</Text>
            </TouchableOpacity>
            
            <View style={styles.replyInputRow}>
              <TextInput
                style={styles.replyInput}
                placeholder={`Reply to ${story.userId}'s story...`}
                placeholderTextColor="#9E9E9E"
                value={replyText}
                onChangeText={setReplyText}
                multiline
                maxLength={200}
                autoFocus
              />
              
              <TouchableOpacity 
                style={[
                  styles.replySendButton, 
                  replyText.trim() ? styles.replySendButtonActive : styles.replySendButtonInactive
                ]}
                onPress={sendReply}
                disabled={!replyText.trim()}
              >
                <Text style={styles.replySendText}>Send</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      )}
    </View>
  );
};

export default function StoriesScreen() {
  const navigation = useNavigation<NavigationProp<MainTabParamList>>();
  const { user, stories, myStories, setStories, viewStory, addMessage, chats, setChats } = useAppStore();
  const [selectedStory, setSelectedStory] = useState<Story | null>(null);
  const [currentStoryIndex, setCurrentStoryIndex] = useState(0);

  const getDemoContentForUser = (userId: string) => {
    switch (userId) {
      case 'john_doe':
        return {
          type: 'image',
          uri: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=800&fit=crop&crop=center',
          description: 'Beautiful sunset at the beach'
        };
      case 'sarah_wilson':
        return {
          type: 'video',
          uri: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
          description: 'Amazing bird documentary footage'
        };
      default:
        return {
          type: 'image',
          uri: 'https://images.unsplash.com/photo-1494790108755-2616c9aa44fb?w=400&h=800&fit=crop&crop=face',
          description: 'Story content'
        };
    }
  };

  const findOrCreateChat = (otherUserId: string): string => {
    // Find existing chat with this user
    const existingChat = chats.find(chat => 
      chat.participants.includes(user?.id || 'demo-user') && 
      chat.participants.includes(otherUserId)
    );
    
    if (existingChat) {
      return existingChat.id;
    }
    
    // Create new chat ID based on user mapping
    const userIdToChatId: { [key: string]: string } = {
      'john_doe': '1',
      'sarah_wilson': '2',
      'demo-user': '3'
    };
    
    const chatId = userIdToChatId[otherUserId] || Date.now().toString();
    
    // Create new chat if it doesn't exist
    const newChat: Chat = {
      id: chatId,
      participants: [user?.id || 'demo-user', otherUserId],
      type: 'direct',
      lastMessage: undefined,
      lastActivity: new Date(),
      unreadCount: 0,
      isTyping: [],
      createdAt: new Date(),
    };
    
    // Add chat to the list if it's not already there
    const chatExists = chats.some(chat => chat.id === chatId);
    if (!chatExists) {
      setChats([...chats, newChat]);
    }
    
    return chatId;
  };

  const updateChatLastMessage = (chatId: string, message: Message) => {
    const updatedChats = chats.map(chat => {
      if (chat.id === chatId) {
        return {
          ...chat,
          lastMessage: message,
          lastActivity: new Date(),
          unreadCount: chat.unreadCount + 1
        };
      }
      return chat;
    });
    setChats(updatedChats);
  };

  const handleSendReply = (storyUserId: string, replyText: string) => {
    const chatId = findOrCreateChat(storyUserId);
    
    // Get story content for preview
    const storyContent = getDemoContentForUser(storyUserId);
    
    const replyMessage: Message = {
      id: `${chatId}_${Date.now()}_story_reply`,
      chatId,
      senderId: user?.id || 'demo-user',
      type: 'story_reply',
      content: replyText,
      storyPreview: {
        type: storyContent.type as 'image' | 'video',
        mediaUrl: storyContent.uri,
        caption: selectedStory?.caption || ''
      },
      isRead: false,
      readBy: [],
      isTemporary: false,
      reactions: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    // Add message to chat
    addMessage(chatId, replyMessage);
    updateChatLastMessage(chatId, replyMessage);
  };

  const handleSendSnap = (storyUserId: string, snapType: 'photo' | 'video') => {
    const chatId = findOrCreateChat(storyUserId);
    
    // Get story content for preview
    const storyContent = getDemoContentForUser(storyUserId);
    
    const snapMessage: Message = {
      id: `${chatId}_${Date.now()}_story_snap`,
      chatId,
      senderId: user?.id || 'demo-user',
      type: 'story_reply',
      content: `📸 Sent a ${snapType} snap`,
      storyPreview: {
        type: storyContent.type as 'image' | 'video',
        mediaUrl: storyContent.uri,
        caption: selectedStory?.caption || ''
      },
      isRead: false,
      readBy: [],
      isTemporary: true,
      expiresAt: new Date(Date.now() + 10 * 1000), // 10 seconds
      reactions: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    // Add message to chat
    addMessage(chatId, snapMessage);
    updateChatLastMessage(chatId, snapMessage);
  };
  
  const handleOpenCamera = (storyUserId: string, storyId: string) => {
    navigation.navigate('Camera', {
      storyReply: {
        storyUserId,
        storyId,
      }
    });
  };

  useEffect(() => {
    // Initialize with demo stories only once when app loads
    const hasJohnDoeStory = stories.some(story => story.userId === 'john_doe');
    const hasSarahWilsonStory = stories.some(story => story.userId === 'sarah_wilson');
    const hasDemoUserStory = stories.some(story => story.userId === 'demo-user' && story.mediaUrl === 'demo-image-2');
    
    if (!hasJohnDoeStory || !hasSarahWilsonStory || !hasDemoUserStory) {
      const rawDemoStories = [
        {
          userId: 'john_doe',
          type: 'image' as const,
          mediaUrl: 'demo-image-1',
          caption: 'Perfect sunset at Malibu Beach! 🌅✨ Nature never fails to amaze me',
          viewCount: 23,
          views: [
            { userId: 'friend1', viewedAt: new Date(Date.now() - 1000 * 60 * 30) },
            { userId: 'friend2', viewedAt: new Date(Date.now() - 1000 * 60 * 15) }
          ],
          isPublic: true,
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2),
          expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 22),
        },
        {
          userId: 'sarah_wilson',
          type: 'video' as const,
          mediaUrl: 'demo-video-1',
          caption: 'Just watched the most amazing bird documentary! 🐦✨ These creatures are absolutely incredible - nature is so beautiful!',
          duration: 28, // 28 seconds - will be split into 15s + 13s segments
          viewCount: 45,
          views: [
            { userId: 'demo-user', viewedAt: new Date(Date.now() - 1000 * 60 * 45) }
          ],
          isPublic: true,
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 4),
          expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 20),
        },
        {
          userId: 'demo-user',
          type: 'image' as const,
          mediaUrl: 'demo-image-2',
          caption: 'My first story on SnapConnect! 🎉 Excited to connect with everyone here',
          viewCount: 12,
          views: [
            { userId: 'john_doe', viewedAt: new Date(Date.now() - 1000 * 60 * 20) },
            { userId: 'sarah_wilson', viewedAt: new Date(Date.now() - 1000 * 60 * 10) }
          ],
          isPublic: true,
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 1),
          expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 23),
        }
      ];

      // Process stories and split long videos into segments
      const processedStories: Story[] = [];
      
      rawDemoStories.forEach(storyData => {
        // Only add if not already present
        let storyExists = false;
        if (storyData.userId === 'demo-user') {
          storyExists = stories.some(s => s.userId === storyData.userId && s.mediaUrl === 'demo-image-2');
        } else {
          storyExists = stories.some(s => s.userId === storyData.userId);
        }
        
        if (!storyExists) {
          const segments = splitVideoIntoSegments(storyData);
          processedStories.push(...segments);
        }
      });

      // Add demo stories to existing stories instead of replacing
      if (processedStories.length > 0) {
        setStories([...stories, ...processedStories]);
      }
    }
  }, [stories, setStories]);

  const openStory = (story: Story, displayIndex: number) => {
    // Find the actual index in stories array
    const actualIndex = stories.findIndex(s => s.id === story.id);
    setSelectedStory(story);
    setCurrentStoryIndex(actualIndex);
    
    // Mark as viewed
    if (story.userId !== user?.id) {
      viewStory(story.id, user?.id || 'demo-user');
    }
  };

  const closeStory = () => {
    setSelectedStory(null);
    setCurrentStoryIndex(0);
  };

  const nextStory = () => {
    if (currentStoryIndex < stories.length - 1) {
      const nextIndex = currentStoryIndex + 1;
      setCurrentStoryIndex(nextIndex);
      setSelectedStory(stories[nextIndex]);
      
      // Mark as viewed
      if (stories[nextIndex].userId !== user?.id) {
        viewStory(stories[nextIndex].id, user?.id || 'demo-user');
      }
    } else {
      closeStory();
    }
  };

  const previousStory = () => {
    if (currentStoryIndex > 0) {
      const prevIndex = currentStoryIndex - 1;
      setCurrentStoryIndex(prevIndex);
      setSelectedStory(stories[prevIndex]);
    }
  };

  const addStory = () => {
    Alert.alert(
      '📖 Add to Story',
      'Create a new story to share with your friends!',
      [
        { text: 'Take Photo', onPress: () => console.log('Take photo for story') },
        { text: 'Take Video', onPress: () => console.log('Take video for story') },
        { text: 'Choose from Gallery', onPress: () => console.log('Choose from gallery') },
        { text: 'Cancel', style: 'cancel' }
      ]
    );
  };

  // Get unique stories per user (show only first segment for display)
  const getUniqueStoriesByUser = (allStories: Story[]) => {
    const userStoryMap = new Map<string, Story>();
    allStories.forEach(story => {
      if (!userStoryMap.has(story.userId)) {
        userStoryMap.set(story.userId, story);
      }
    });
    return Array.from(userStoryMap.values());
  };

  const uniqueStories = getUniqueStoriesByUser(stories);
  const myStoryData = uniqueStories.filter(s => s.userId === user?.id);
  const otherStories = uniqueStories.filter(s => s.userId !== user?.id);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Stories</Text>
        <TouchableOpacity style={styles.addStoryButton} onPress={addStory}>
          <Text style={styles.addStoryText}>+ Add Story</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {/* My Stories Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>My Stories</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.storiesRow}>
            {myStoryData.length > 0 ? (
              myStoryData.map((story, index) => (
                <StoryItem
                  key={story.id}
                  story={story}
                  onPress={() => openStory(story, index)}
                  isMyStory={true}
                />
              ))
            ) : (
              <TouchableOpacity style={styles.addStoryItem} onPress={addStory}>
                <View style={styles.addStoryRing}>
                  <Text style={styles.addStoryIcon}>+</Text>
                </View>
                <Text style={styles.addStoryLabel}>Add Story</Text>
              </TouchableOpacity>
            )}
          </ScrollView>
        </View>

        {/* Friends Stories Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Friends</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.storiesRow}>
            {otherStories.length > 0 ? (
              otherStories.map((story, index) => (
                <StoryItem
                  key={story.id}
                  story={story}
                  onPress={() => openStory(story, index)}
                />
              ))
            ) : (
              <View style={styles.emptyStories}>
                <Text style={styles.emptyText}>No stories yet</Text>
                <Text style={styles.emptySubtext}>Your friends' stories will appear here</Text>
              </View>
            )}
          </ScrollView>
        </View>

        {/* Recent Activity */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Activity</Text>
          <View style={styles.activityContainer}>
            <Text style={styles.activityText}>
              📸 john_doe viewed your story "My first story on SnapConnect!"
            </Text>
            <Text style={styles.activityTime}>2 hours ago</Text>
          </View>
          <View style={styles.activityContainer}>
            <Text style={styles.activityText}>
              🐦 sarah_wilson replied to your story: "That bird documentary looks amazing! 🌿"
            </Text>
            <Text style={styles.activityTime}>4 hours ago</Text>
          </View>
          <View style={styles.activityContainer}>
            <Text style={styles.activityText}>
              🔥 john_doe started a 3-day snap streak with you!
            </Text>
            <Text style={styles.activityTime}>5 hours ago</Text>
          </View>
        </View>
      </ScrollView>

      {/* Story Viewer Modal */}
      {selectedStory && (
        <View style={styles.storyViewerModal}>
          <StoryViewer
            story={selectedStory}
            onClose={closeStory}
            onNext={nextStory}
            onPrevious={previousStory}
            onSendReply={handleSendReply}
            onSendSnap={handleSendSnap}
            onOpenCamera={handleOpenCamera}
          />
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0D0D0F',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 15,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  addStoryButton: {
    backgroundColor: '#FFDD3A',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
  },
  addStoryText: {
    color: '#0D0D0F',
    fontSize: 14,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    paddingHorizontal: 20,
  },
  storiesRow: {
    paddingLeft: 20,
  },
  storyItem: {
    alignItems: 'center',
    marginRight: 15,
    width: 80,
  },
  storyRing: {
    width: 70,
    height: 70,
    borderRadius: 35,
    borderWidth: 3,
    borderColor: '#FFDD3A',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 5,
  },
  viewedStoryRing: {
    borderColor: '#424242',
  },
  myStoryRing: {
    borderColor: '#4CAF50',
  },
  storyPreview: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#161618',
    alignItems: 'center',
    justifyContent: 'center',
  },
  storyPreviewImage: {
    width: '100%',
    height: '100%',
    borderRadius: 30,
  },
  storyTypeIndicator: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 2,
    borderRadius: 10,
  },
  storyTypeIcon: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  segmentIndicator: {
    position: 'absolute',
    bottom: -15,
    right: -2,
    backgroundColor: '#FFDD3A',
    borderRadius: 8,
    paddingHorizontal: 4,
    paddingVertical: 1,
    minWidth: 20,
    alignItems: 'center',
  },
  segmentText: {
    fontSize: 8,
    fontWeight: 'bold',
    color: '#0D0D0F',
  },
  storyUsername: {
    color: '#FFFFFF',
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 2,
  },
  storyViewCount: {
    color: '#9E9E9E',
    fontSize: 10,
    textAlign: 'center',
  },
  addStoryItem: {
    alignItems: 'center',
    marginRight: 15,
    width: 80,
  },
  addStoryRing: {
    width: 70,
    height: 70,
    borderRadius: 35,
    borderWidth: 3,
    borderColor: '#9E9E9E',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 5,
  },
  addStoryIcon: {
    fontSize: 30,
    color: '#9E9E9E',
  },
  addStoryLabel: {
    color: '#9E9E9E',
    fontSize: 12,
    textAlign: 'center',
  },
  emptyStories: {
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  emptySubtext: {
    color: '#9E9E9E',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 5,
  },
  activityContainer: {
    backgroundColor: '#161618',
    paddingHorizontal: 20,
    paddingVertical: 15,
    marginHorizontal: 20,
    marginBottom: 10,
    borderRadius: 12,
  },
  activityText: {
    color: '#FFFFFF',
    fontSize: 14,
    marginBottom: 5,
  },
  activityTime: {
    color: '#9E9E9E',
    fontSize: 12,
  },
  storyViewerModal: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#000000',
    zIndex: 1000,
  },
  storyViewer: {
    flex: 1,
    backgroundColor: '#000000',
  },
  progressContainer: {
    paddingHorizontal: 20,
    paddingTop: 50,
  },
  progressBar: {
    height: 3,
    backgroundColor: '#424242',
    borderRadius: 1.5,
  },
  progressFill: {
    height: 3,
    backgroundColor: '#FFFFFF',
    borderRadius: 1.5,
  },
  segmentProgressContainer: {
    flexDirection: 'row',
    gap: 5,
  },
  segmentProgressBar: {
    flex: 1,
    height: 3,
    backgroundColor: '#424242',
    borderRadius: 1.5,
  },
  segmentProgressFill: {
    height: 3,
    backgroundColor: '#FFFFFF',
    borderRadius: 1.5,
  },
  storyHeader: {
    position: 'absolute',
    top: 60,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    zIndex: 10,
    backgroundColor: 'rgba(0,0,0,0.3)',
    paddingVertical: 10,
  },
  storyUserInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  storyUserAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFDD3A',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  storyUserAvatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 20,
  },
  storyUserName: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  storyTimeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  storyTime: {
    color: '#FFFFFF',
    fontSize: 12,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  segmentInfo: {
    color: '#FFDD3A',
    fontSize: 11,
    fontWeight: 'bold',
    marginLeft: 5,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  closeButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  storyContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  storyMediaContainer: {
    position: 'relative',
    width: '100%',
    height: '100%',
  },
  storyImage: {
    width: '100%',
    height: '100%',
  },
  storyVideo: {
    width: '100%',
    height: '100%',
  },
  captionContainer: {
    position: 'absolute',
    bottom: 100,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  caption: {
    color: '#FFFFFF',
    fontSize: 16,
    textAlign: 'center',
  },
  storyNavigation: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
  },
  navButton: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  navText: {
    color: 'transparent',
  },
  storyActions: {
    position: 'absolute',
    bottom: 40,
    right: 20,
    zIndex: 10,
  },
  actionButtonsGroup: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 25,
    padding: 5,
  },
  actionButton: {
    backgroundColor: 'transparent',
    padding: 10,
    marginHorizontal: 5,
  },
  actionIcon: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  replyContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.9)',
    zIndex: 20,
  },
  replyInputContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  replyCloseButton: {
    position: 'absolute',
    top: 15,
    right: 15,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 21,
  },
  replyCloseText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  replyInputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginTop: 20,
    gap: 10,
  },
  replyInput: {
    flex: 1,
    backgroundColor: '#161618',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#424242',
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: '#FFFFFF',
    fontSize: 16,
    maxHeight: 100,
    minHeight: 44,
  },
  replySendButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 20,
    minWidth: 70,
    alignItems: 'center',
    justifyContent: 'center',
  },
  replySendButtonActive: {
    backgroundColor: '#FFDD3A',
  },
  replySendButtonInactive: {
    backgroundColor: '#424242',
  },
  replySendText: {
    color: '#0D0D0F',
    fontSize: 16,
    fontWeight: 'bold',
  },
}); 