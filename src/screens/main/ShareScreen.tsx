import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  SafeAreaView,
  Alert,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Video, ResizeMode } from 'expo-av';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useAppStore } from '../../store/useAppStore';
import { MainTabParamList, Friend, Story, Message, Chat } from '../../types';
import WorkoutMemoryService from '../../services/workoutMemoryService';
import FriendshipMemoryService from '../../services/friendshipMemoryService';
import * as FileSystem from 'expo-file-system';
import { captureRef } from 'react-native-view-shot';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';

const { width, height } = Dimensions.get('window');

type ShareScreenNavigationProp = StackNavigationProp<MainTabParamList, 'ShareScreen'>;
type ShareScreenRouteProp = RouteProp<MainTabParamList, 'ShareScreen'>;

interface FriendItemProps {
  friend: Friend;
  isSelected: boolean;
  onToggle: (friendId: string) => void;
}

const FriendItem: React.FC<FriendItemProps> = ({ friend, isSelected, onToggle }) => {
  // Demo friend data
  const friendData = {
    john_doe: { name: 'John Doe', avatar: '🧑‍💼' },
    sarah_wilson: { name: 'Sarah Wilson', avatar: '👩‍🎨' },
    mike_johnson: { name: 'Mike Johnson', avatar: '👨‍🏫' },
    emma_davis: { name: 'Emma Davis', avatar: '👩‍💻' },
    alex_brown: { name: 'Alex Brown', avatar: '🧑‍🎤' },
  };

  const displayData = friendData[friend.friendId as keyof typeof friendData] || 
    { name: friend.friendId, avatar: '👤' };

  return (
    <TouchableOpacity
      style={[styles.friendItem, isSelected && styles.friendItemSelected]}
      onPress={() => onToggle(friend.friendId)}
    >
      <View style={styles.friendAvatar}>
        <Text style={styles.friendAvatarText}>{displayData.avatar}</Text>
      </View>
      <Text style={[styles.friendName, isSelected && styles.friendNameSelected]}>
        {displayData.name}
      </Text>
      {isSelected && (
        <View style={styles.selectedIndicator}>
          <Text style={styles.selectedText}>✓</Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

export default function ShareScreen() {
  const navigation = useNavigation<ShareScreenNavigationProp>();
  const route = useRoute<ShareScreenRouteProp>();
  const { photoUri, mediaType, caption, storyReply, appliedFilter, aiOverlays } = route.params;

  const { user, friends, addStory, chats, addMessage, setChats, incrementSnapScore } = useAppStore();
  const [selectedFriends, setSelectedFriends] = useState<string[]>([]);
  const [imageError, setImageError] = useState(false);
  const [videoError, setVideoError] = useState(false);
  const [compositedImageUri, setCompositedImageUri] = useState<string | null>(null);
  const [filteredImageUri, setFilteredImageUri] = useState<string | null>(null);
  const [isCompositing, setIsCompositing] = useState(false);
  const [isPosting, setIsPosting] = useState(false);
  const compositingViewRef = useRef<View>(null);

  // Check if this is a test/invalid URI
  const isTestUri = photoUri?.startsWith('test://') || !photoUri;
  const actualUri = photoUri;
  
  // Get specific test URI type for better messaging
  const getTestUriType = () => {
    if (photoUri === 'test://video-recorded-successfully') return 'recorded-successfully';
    if (photoUri === 'test://video-error') return 'error';
    if (photoUri?.startsWith('test://')) return 'generic';
    return null;
  };
  
  const testUriType = getTestUriType();

  // Filter styling helper
  const getFilterStyle = (filter: any) => {
    switch (filter.id) {
      case 'noir_shadows':
        return {
          backgroundColor: 'rgba(128,128,128,0.5)', // Gray overlay for B&W effect
          opacity: 0.7,
        };
      case 'vintage':
        return {
          backgroundColor: 'rgba(255,220,150,0.3)', // Sepia-like overlay
          opacity: 0.6,
        };
      case 'dramatic':
        return {
          backgroundColor: 'rgba(0,0,0,0.25)', // Dark overlay for contrast
          opacity: 0.5,
        };
      default:
        return {};
    }
  };

  // Story reply helper functions
  const findOrCreateChat = (otherUserId: string): string => {
    // Find existing chat with this user
    const existingChat = chats.find(chat => 
      chat.participants.includes(user?.id || 'demo-user') && 
      chat.participants.includes(otherUserId) &&
      chat.type === 'direct'
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

  const sendStoryReply = async () => {
    if (!storyReply) return;
    
    try {
      const chatId = findOrCreateChat(storyReply.storyUserId);
      
      // Use composite image for photos if available
      const finalMediaUrl = mediaType === 'photo' && compositedImageUri 
        ? compositedImageUri 
        : photoUri;

      const replyMessage: Message = {
        id: `${chatId}_${Date.now()}_story_snap_reply`,
        chatId,
        senderId: user?.id || 'demo-user',
        type: mediaType === 'photo' ? 'image' : 'video',
        content: caption.trim() || `📸 Replied to your story with a ${mediaType}`,
        mediaUrl: finalMediaUrl,
        isRead: false,
        readBy: [],
        isTemporary: true,
        expiresAt: new Date(Date.now() + 10 * 1000), // 10 seconds
        reactions: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      addMessage(chatId, replyMessage);
      
      // 📊 Increment snap score for sending story reply (+1)
      incrementSnapScore(1);
      
      Alert.alert(
        '📤 Story Reply Sent!',
        `Your ${mediaType} reply was sent to ${storyReply.storyUserId}! 📊 +1 Snap Score!`,
        [{ text: 'OK', onPress: () => {
          navigation.goBack();
          navigation.goBack();
        }}]
      );
      
    } catch (error) {
      console.error('Error sending story reply:', error);
      Alert.alert('Error', 'Failed to send story reply. Please try again.');
    }
  };

    // Composite image with filters and AI overlays using view capture
  const createCompositeImage = async () => {
    if (mediaType !== 'photo') {
      console.log('🚫 Skipping compositing - not a photo');
      return;
    }

    setIsCompositing(true);
    
    try {
      console.log('🖼️ Starting composite image creation...');
      console.log('🎨 Filter to apply:', appliedFilter?.name);
      console.log('🤖 Overlays to composite:', aiOverlays?.length || 0);
      
      // First, prepare base image (resize for consistency)
      console.log('🔧 Preparing base image...');
      const result = await manipulateAsync(photoUri, [{ resize: { width: 1024 } }], {
        compress: 0.8,
        format: SaveFormat.JPEG,
      });
      
      const baseImageUri = result.uri;
      setFilteredImageUri(baseImageUri);
      console.log('✅ Base image prepared:', baseImageUri);
      
      // Wait a moment for state to update
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Check if we need compositing (filters or overlays)
      const hasFilter = appliedFilter;
      const hasOverlays = aiOverlays && aiOverlays.length > 0;
      
      if (hasFilter || hasOverlays) {
        console.log('🖼️ Compositing needed - capturing view...');
        
        // Wait for view to render with the base image
        await new Promise(resolve => setTimeout(resolve, 800));
        
        if (compositingViewRef.current) {
          try {
            console.log('📸 Capturing composite view...');
            const capturedUri = await captureRef(compositingViewRef.current, {
              format: 'jpg',
              quality: 0.9,
              width: 1024,
              height: 1024,
            });
            
            console.log('✅ Successfully captured composite:', capturedUri);
            setCompositedImageUri(capturedUri);
          } catch (captureError) {
            console.error('❌ View capture failed:', captureError);
            console.log('⚠️ Using base image as fallback');
            setCompositedImageUri(baseImageUri);
          }
        } else {
          console.log('⚠️ Compositing view ref not available');
          setCompositedImageUri(baseImageUri);
        }
      } else {
        console.log('✅ No compositing needed, using base image');
        setCompositedImageUri(baseImageUri);
      }
      
    } catch (error) {
      console.error('❌ Error in composite creation:', error);
      setCompositedImageUri(photoUri);
    } finally {
      setIsCompositing(false);
    }
  };

  // Create composite image when component loads
  useEffect(() => {
    // Delay compositing to ensure views are rendered
    const timer = setTimeout(() => {
      createCompositeImage();
    }, 300);
    return () => clearTimeout(timer);
  }, [appliedFilter, aiOverlays, photoUri, mediaType]);

  // If this is a story reply, show story reply UI instead of normal sharing options

  const toggleFriendSelection = (friendId: string) => {
    setSelectedFriends(prev => 
      prev.includes(friendId) 
        ? prev.filter(id => id !== friendId)
        : [...prev, friendId]
    );
  };

  const addToStory = async () => {
    if (isPosting) {
      console.log('🚫 Already posting to story, preventing duplicate...');
      return;
    }

    setIsPosting(true);
    
    try {
      // Wait for composite image if it's being created
      if (isCompositing) {
        console.log('⏳ Waiting for composite image creation...');
        await new Promise(resolve => {
          const checkComposite = () => {
            if (!isCompositing) {
              resolve(undefined);
            } else {
              setTimeout(checkComposite, 100);
            }
          };
          checkComposite();
        });
      }

      // Determine final media URL based on what's available
      let finalMediaUrl = photoUri; // Default fallback
      
      if (mediaType === 'photo') {
        if (compositedImageUri) {
          // Use composite image if available (filter + stickers)
          finalMediaUrl = compositedImageUri;
          console.log('✅ Using composite image (filter + stickers)');
        } else if (filteredImageUri) {
          // Use filtered image if no stickers but filter applied
          finalMediaUrl = filteredImageUri;
          console.log('✅ Using filtered image (filter only)');
        } else {
          // Use original image
          finalMediaUrl = photoUri;
          console.log('✅ Using original image (no edits)');
        }
      } else {
        finalMediaUrl = isTestUri ? actualUri : photoUri;
      }

      console.log('📸 Adding to story with media URL:', finalMediaUrl);
      console.log('🎨 Applied filter:', appliedFilter?.name);
      console.log('🤖 AI overlays count:', aiOverlays?.length || 0);

      const newStory: Story = {
        id: `story_${Date.now()}`,
        userId: user?.id || 'demo-user',
        type: mediaType === 'photo' ? 'image' : 'video',
        mediaUrl: finalMediaUrl,
        caption: caption.trim() || undefined,
        duration: mediaType === 'video' ? 5 : undefined,
        viewCount: 0,
        views: [],
        isPublic: true,
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
      };

      addStory(newStory);

      // 📊 Increment snap score for posting story (+1)
      incrementSnapScore(1);

      const isWorkout = caption.trim() && WorkoutMemoryService.isWorkoutContent(caption.trim());
      const successMessage = isTestUri && mediaType === 'video' 
        ? testUriType === 'recorded-successfully'
          ? 'Your video was recorded successfully and has been added to your story! 📊 +1 Snap Score!'
          : testUriType === 'error'
          ? 'There was an error with video recording, but it has been added to your story. 📊 +1 Snap Score!'
          : 'Your video recording has been added to your story! 📊 +1 Snap Score!'
        : isWorkout 
          ? '🏋️ Workout added to your story and saved to SnapSearch AI! You can now search for this workout later. 📊 +1 Snap Score!'
          : 'Your story is now live and visible to your friends for 24 hours. 📊 +1 Snap Score!';
        
      Alert.alert(
        isWorkout ? '🏋️ Workout Story Posted!' : '✨ Added to Your Story!',
        successMessage,
        [{ text: 'OK', onPress: () => {
          // Go back to camera/main screen
          navigation.goBack();
          navigation.goBack();
        }}]
      );
    } catch (error) {
      console.error('❌ Error adding to story:', error);
      Alert.alert('Error', 'Failed to add to story. Please try again.');
    } finally {
      setIsPosting(false);
    }
  };

  const sendToSelectedFriends = async () => {
    if (selectedFriends.length === 0) {
      Alert.alert('No Friends Selected', 'Please select at least one friend to send to.');
      return;
    }

    try {
      // 🏋️ Check if this is workout content and store in SnapSearch AI
      const captionText = caption.trim();
      if (captionText && WorkoutMemoryService.isWorkoutContent(captionText)) {
        console.log('🏋️ Workout content detected in snap, storing in SnapSearch AI...');
        
        try {
          const workoutEntry = await WorkoutMemoryService.storeWorkoutMemory(
            user?.id || 'demo-user',
            photoUri,
            mediaType as 'photo' | 'video',
            captionText
          );

          if (workoutEntry) {
            const workoutInfo = WorkoutMemoryService.extractWorkoutInfo(captionText);
            console.log('✅ Workout snap stored successfully:', {
              muscleGroups: workoutInfo.muscleGroups,
              exercises: workoutInfo.exercises,
              workoutTypes: workoutInfo.detectedWorkouts
            });
          }
        } catch (error) {
          console.error('❌ Error storing workout memory:', error);
        }
      }

      // 🤖 Track friendship memories for all selected friends
      for (const friendId of selectedFriends) {
        try {
          const snapMetadata = {
            caption: caption.trim() || `${mediaType === 'photo' ? '📸 Photo' : '📹 Video'} snap`,
            imageUri: mediaType === 'photo' ? photoUri : undefined,
            videoUri: mediaType === 'video' ? photoUri : undefined,
            filterUsed: 'none', // No filter info available in share screen
            mood: 'happy', // Default mood, could be enhanced with AI analysis
            tags: ['snap', mediaType, 'shared'],
          };

          console.log('🤖 Tracking friendship snap for friend:', friendId);
          console.log('📝 Snap caption:', snapMetadata.caption);
          console.log('👤 Sender ID:', user?.id || 'demo-user');
          console.log('📦 Full snap metadata:', snapMetadata);

          await FriendshipMemoryService.trackFriendshipSnap(
            user?.id || 'demo-user',
            friendId,
            snapMetadata
          );

          console.log(`✅ Friendship memory tracked for ${friendId}`);
        } catch (error) {
          console.error(`❌ Failed to track friendship memory for ${friendId}:`, error);
        }
      }

      // Send to each selected friend
      for (const friendId of selectedFriends) {
        // Find or create chat
        let chatId = '';
        const existingChat = chats.find(chat => 
          chat.participants.includes(friendId) && 
          chat.participants.includes(user?.id || 'demo-user') &&
          chat.type === 'direct'
        );

        if (existingChat) {
          chatId = existingChat.id;
        } else {
          // Create new chat ID
          chatId = friendId === 'john_doe' ? '1' : '2';
        }

        // Use composite image for photos if available
        const finalMediaUrl = mediaType === 'photo' && compositedImageUri 
          ? compositedImageUri 
          : isTestUri ? actualUri : photoUri;

        // Create message
        const snapMessage: Message = {
          id: `${chatId}_${Date.now()}_snap`,
          chatId,
          senderId: user?.id || 'demo-user',
          type: mediaType === 'photo' ? 'image' : 'video',
          content: caption.trim() || `${mediaType === 'photo' ? 'Photo' : 'Video'} snap`,
          mediaUrl: finalMediaUrl,
          isRead: false,
          readBy: [],
          isTemporary: true,
          expiresAt: new Date(Date.now() + 10 * 1000), // 10 seconds
          reactions: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        addMessage(chatId, snapMessage);
      }

      // 📊 Increment snap score for sending snaps (+1 per friend)
      incrementSnapScore(selectedFriends.length);

      const friendCount = selectedFriends.length;
      const friendText = friendCount === 1 ? 'friend' : 'friends';
      const isWorkout = captionText && WorkoutMemoryService.isWorkoutContent(captionText);
      
      const successMessage = isTestUri && mediaType === 'video'
        ? testUriType === 'recorded-successfully'
          ? `Your video was recorded successfully and sent to ${friendCount} ${friendText}! 🤖 Friendship memories tracked by AI. 📊 +${friendCount} Snap Score!`
          : testUriType === 'error'
          ? `There was an error with video recording, but it was sent to ${friendCount} ${friendText}. 🤖 Friendship memories tracked by AI. 📊 +${friendCount} Snap Score!`
          : `Your video recording was sent to ${friendCount} ${friendText}! 🤖 Friendship memories tracked by AI. 📊 +${friendCount} Snap Score!`
        : isWorkout
          ? `🏋️ Your workout ${mediaType} was sent to ${friendCount} ${friendText} and saved to SnapSearch AI! 🤖 Friendship memories tracked. 📊 +${friendCount} Snap Score!`
          : `Your ${mediaType} was sent to ${friendCount} ${friendText}. 🤖 Friendship memories tracked by AI! 📊 +${friendCount} Snap Score!`;
      
      Alert.alert(
        isWorkout ? '🏋️ Workout Snap Sent!' : '📤 Snap Sent!',
        successMessage,
        [{ text: 'OK', onPress: () => {
          // Go back to camera/main screen
          navigation.goBack();
          navigation.goBack();
        }}]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to send snap. Please try again.');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Hidden compositing view for AI overlays - only renders when there are overlays */}
      <View 
        ref={compositingViewRef}
        style={styles.hiddenCompositingView}
        pointerEvents="none"
      >
        {mediaType === 'photo' && filteredImageUri && (
          <View style={styles.compositingContainer}>
            {/* Base image container with filter effects */}
            <View style={styles.compositingImageContainer}>
              <Image 
                source={{ uri: filteredImageUri }} 
                style={styles.compositingBaseImage} 
                resizeMode="cover"
              />
              
                             {/* Filter overlay effects */}
               {appliedFilter && (
                 <View style={[
                   styles.filterOverlay,
                   getFilterStyle(appliedFilter)
                 ]} />
               )}
            </View>
            
            {/* AI overlays positioned correctly */}
            {aiOverlays && aiOverlays.map((overlay) => (
              <Image
                key={overlay.id}
                source={{ uri: overlay.imageUri }}
                style={[
                  styles.compositingOverlaySticker,
                  {
                    left: (overlay.x / width) * 1024, // Scale to composite size
                    top: (overlay.y / height) * 1024,
                    transform: [{ scale: overlay.scale }],
                  },
                ]}
                resizeMode="contain"
              />
            ))}
          </View>
        )}
      </View>

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Share</Text>
        <View style={styles.headerRight} />
      </View>

      {/* Media Preview - Small */}
      <View style={styles.mediaPreview}>
        {isCompositing && (
          <View style={styles.compositingOverlay}>
            <Text style={styles.compositingText}>Applying edits...</Text>
          </View>
        )}
        
        {mediaType === 'video' ? (
          // Video Preview
          isTestUri || videoError || !actualUri ? (
            <View style={styles.placeholderContainer}>
              <Text style={styles.placeholderIcon}>🎥</Text>
              <Text style={styles.placeholderText}>Video</Text>
            </View>
          ) : (
            <Video
              source={{ uri: actualUri }}
              style={styles.videoThumbnail}
              useNativeControls={false}
              resizeMode={ResizeMode.COVER}
              shouldPlay={false}
              onError={() => setVideoError(true)}
            />
          )
        ) : (
          // Photo Preview with composite image
          <View style={styles.photoContainer}>
            {imageError ? (
              <View style={styles.placeholderContainer}>
                <Text style={styles.placeholderIcon}>📸</Text>
                <Text style={styles.placeholderText}>Photo</Text>
              </View>
            ) : (
              <Image 
                source={{ uri: compositedImageUri || filteredImageUri || photoUri }} 
                style={styles.photoThumbnail} 
                resizeMode="cover"
                onError={() => setImageError(true)}
              />
            )}
            
            {/* Show AI overlays on top of photo */}
            {aiOverlays && aiOverlays.length > 0 && aiOverlays.map((overlay) => (
              <Image
                key={overlay.id}
                source={{ uri: overlay.imageUri }}
                style={[
                  styles.overlaySticker,
                  {
                    left: overlay.x * 0.3, // Scale down for preview
                    top: overlay.y * 0.3,
                    transform: [{ scale: overlay.scale * 0.3 }],
                  },
                ]}
                resizeMode="contain"
              />
            ))}
            
            {/* Show filter indicator */}
            {appliedFilter && (
              <View style={styles.filterIndicator}>
                <Text style={styles.filterText}>{appliedFilter.name}</Text>
              </View>
            )}
          </View>
        )}
        
        {/* Caption Display */}
        {caption.trim() && (
          <View style={styles.captionDisplay}>
            <Text style={styles.captionText}>{caption}</Text>
          </View>
        )}
      </View>

      {storyReply ? (
        // Story Reply UI
        <>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>💬 Story Reply</Text>
            <View style={styles.storyReplyInfo}>
              <Text style={styles.storyReplyText}>
                Replying to <Text style={styles.storyReplyUser}>{storyReply.storyUserId}'s</Text> story
              </Text>
              <Text style={styles.storyReplySubtext}>
                This {mediaType} will be sent as a private reply and will disappear in 10 seconds
              </Text>
            </View>
          </View>

          {/* Send Story Reply Button */}
          <KeyboardAvoidingView 
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.sendContainer}
          >
            <TouchableOpacity
              style={[styles.sendButton, styles.sendButtonActive]}
              onPress={sendStoryReply}
            >
              <Text style={styles.sendButtonText}>
                Send Story Reply
              </Text>
            </TouchableOpacity>
          </KeyboardAvoidingView>
        </>
      ) : (
        // Normal Sharing UI
        <>
          {/* Your Story Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>📖 Your Story</Text>
            <TouchableOpacity 
              style={[styles.storyOption, (isCompositing || isPosting) && styles.storyOptionDisabled]} 
              onPress={addToStory}
              disabled={isCompositing || isPosting}
            >
              <View style={styles.storyIconContainer}>
                <Text style={styles.storyIcon}>
                  {isCompositing ? '⏳' : isPosting ? '📤' : '➕'}
                </Text>
              </View>
              <View style={styles.storyInfo}>
                <Text style={styles.storyTitle}>
                  {isCompositing ? 'Creating Composite...' : isPosting ? 'Posting to Story...' : 'Add to My Story'}
                </Text>
                <Text style={styles.storySubtitle}>Share with all friends • 24h</Text>
              </View>
              <Text style={styles.storyArrow}>→</Text>
            </TouchableOpacity>
          </View>

          {/* Friends Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>👥 Send to Friends</Text>
            <ScrollView style={styles.friendsList} showsVerticalScrollIndicator={false}>
              {friends.map((friend) => (
                <FriendItem
                  key={friend.id}
                  friend={friend}
                  isSelected={selectedFriends.includes(friend.friendId)}
                  onToggle={toggleFriendSelection}
                />
              ))}
              {friends.length === 0 && (
                <View style={styles.noFriendsContainer}>
                  <Text style={styles.noFriendsText}>No friends added yet</Text>
                  <Text style={styles.noFriendsSubtext}>Add friends to send snaps!</Text>
                </View>
              )}
            </ScrollView>
          </View>

          {/* Send Button */}
          <KeyboardAvoidingView 
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.sendContainer}
          >
            <TouchableOpacity
              style={[
                styles.sendButton,
                selectedFriends.length > 0 ? styles.sendButtonActive : styles.sendButtonInactive
              ]}
              onPress={sendToSelectedFriends}
              disabled={selectedFriends.length === 0}
            >
              <Text style={styles.sendButtonText}>
                {selectedFriends.length === 0 
                  ? 'Select Friends to Send' 
                  : `Send to ${selectedFriends.length} Friend${selectedFriends.length > 1 ? 's' : ''}`
                }
              </Text>
            </TouchableOpacity>
          </KeyboardAvoidingView>
        </>
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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#161618',
    borderBottomWidth: 1,
    borderBottomColor: '#424242',
  },
  backButton: {
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  headerRight: {
    width: 30,
  },
  mediaPreview: {
    height: 150,
    backgroundColor: '#000000',
    position: 'relative',
    marginHorizontal: 20,
    marginVertical: 15,
    borderRadius: 12,
    overflow: 'hidden',
  },
  photoThumbnail: {
    width: '100%',
    height: '100%',
  },
  videoThumbnail: {
    width: '100%',
    height: '100%',
  },
  placeholderContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1a1a1a',
  },
  placeholderIcon: {
    fontSize: 40,
    marginBottom: 8,
  },
  placeholderText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  captionDisplay: {
    position: 'absolute',
    bottom: 10,
    left: 10,
    right: 10,
  },
  captionText: {
    color: '#FFFFFF',
    fontSize: 14,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    textAlign: 'center',
  },
  section: {
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  sectionTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  storyOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#161618',
    padding: 15,
    borderRadius: 12,
  },
  storyOptionDisabled: {
    opacity: 0.6,
    backgroundColor: '#424242',
  },
  storyIconContainer: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    backgroundColor: '#FFDD3A',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 15,
  },
  storyIcon: {
    fontSize: 20,
    color: '#0D0D0F',
  },
  storyInfo: {
    flex: 1,
  },
  storyTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  storySubtitle: {
    color: '#9E9E9E',
    fontSize: 14,
    marginTop: 2,
  },
  storyArrow: {
    color: '#9E9E9E',
    fontSize: 18,
  },
  friendsList: {
    maxHeight: 200,
  },
  friendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#161618',
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
  },
  friendItemSelected: {
    backgroundColor: '#FFDD3A20',
    borderWidth: 1,
    borderColor: '#FFDD3A',
  },
  friendAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#424242',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  friendAvatarText: {
    fontSize: 20,
  },
  friendName: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
  },
  friendNameSelected: {
    color: '#FFDD3A',
  },
  selectedIndicator: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FFDD3A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedText: {
    color: '#0D0D0F',
    fontSize: 14,
    fontWeight: 'bold',
  },
  noFriendsContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  noFriendsText: {
    color: '#9E9E9E',
    fontSize: 16,
    fontWeight: '500',
  },
  noFriendsSubtext: {
    color: '#9E9E9E',
    fontSize: 14,
    marginTop: 4,
  },
  sendContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    paddingTop: 10,
  },
  sendButton: {
    paddingVertical: 16,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonActive: {
    backgroundColor: '#FFDD3A',
  },
  sendButtonInactive: {
    backgroundColor: '#424242',
  },
  sendButtonText: {
    color: '#0D0D0F',
    fontSize: 16,
    fontWeight: 'bold',
  },
  storyReplyInfo: {
    backgroundColor: '#161618',
    padding: 15,
    borderRadius: 12,
  },
  storyReplyText: {
    color: '#FFFFFF',
    fontSize: 16,
    marginBottom: 8,
  },
  storyReplyUser: {
    color: '#FFDD3A',
    fontWeight: 'bold',
  },
  storyReplySubtext: {
    color: '#9E9E9E',
    fontSize: 14,
    lineHeight: 20,
  },
  compositingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  compositingText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  photoContainer: {
    width: '100%',
    height: '100%',
    position: 'relative',
  },
  overlaySticker: {
    position: 'absolute',
    width: 30,
    height: 30,
  },
  filterIndicator: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  filterText: {
    color: '#FFDD3A',
    fontSize: 12,
    fontWeight: '600',
  },
  hiddenCompositingView: {
    position: 'absolute',
    left: -2000, // Hide off-screen
    top: 0,
    width: 1024,
    height: 1024,
  },
  compositingContainer: {
    width: 1024,
    height: 1024,
    position: 'relative',
  },
  compositingBaseImage: {
    width: 1024,
    height: 1024,
  },
  compositingOverlaySticker: {
    position: 'absolute',
    width: 100,
    height: 100,
  },
  compositingImageContainer: {
    width: 1024,
    height: 1024,
    position: 'relative',
  },
  filterOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: 1024,
    height: 1024,
  },
}); 