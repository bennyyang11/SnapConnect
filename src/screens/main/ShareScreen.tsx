import React, { useState, useEffect } from 'react';
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
  const { photoUri, mediaType, caption, storyReply } = route.params;

  const { user, friends, addStory, chats, addMessage, setChats } = useAppStore();
  const [selectedFriends, setSelectedFriends] = useState<string[]>([]);
  const [imageError, setImageError] = useState(false);
  const [videoError, setVideoError] = useState(false);

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
      
      const replyMessage: Message = {
        id: `${chatId}_${Date.now()}_story_snap_reply`,
        chatId,
        senderId: user?.id || 'demo-user',
        type: mediaType === 'photo' ? 'image' : 'video',
        content: caption.trim() || `📸 Replied to your story with a ${mediaType}`,
        mediaUrl: photoUri, // Use the actual photo/video URI
        isRead: false,
        readBy: [],
        isTemporary: true,
        expiresAt: new Date(Date.now() + 10 * 1000), // 10 seconds
        reactions: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      addMessage(chatId, replyMessage);
      
      Alert.alert(
        '📤 Story Reply Sent!',
        `Your ${mediaType} reply was sent to ${storyReply.storyUserId}!`,
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

  // If this is a story reply, show story reply UI instead of normal sharing options

  const toggleFriendSelection = (friendId: string) => {
    setSelectedFriends(prev => 
      prev.includes(friendId) 
        ? prev.filter(id => id !== friendId)
        : [...prev, friendId]
    );
  };

  const addToStory = async () => {
    try {
      const newStory: Story = {
        id: `story_${Date.now()}`,
        userId: user?.id || 'demo-user',
        type: mediaType === 'photo' ? 'image' : 'video',
        mediaUrl: isTestUri ? actualUri : photoUri,
        caption: caption.trim() || undefined,
        duration: mediaType === 'video' ? 5 : undefined,
        viewCount: 0,
        views: [],
        isPublic: true,
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
      };

      addStory(newStory);
      
      const successMessage = isTestUri && mediaType === 'video' 
        ? testUriType === 'recorded-successfully'
          ? 'Your video was recorded successfully and has been added to your story!'
          : testUriType === 'error'
          ? 'There was an error with video recording, but it has been added to your story.'
          : 'Your video recording has been added to your story!'
        : 'Your story is now live and visible to your friends for 24 hours.';
        
      Alert.alert(
        '✨ Added to Your Story!',
        successMessage,
        [{ text: 'OK', onPress: () => {
          // Go back to camera/main screen
          navigation.goBack();
          navigation.goBack();
        }}]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to add to story. Please try again.');
    }
  };

  const sendToSelectedFriends = async () => {
    if (selectedFriends.length === 0) {
      Alert.alert('No Friends Selected', 'Please select at least one friend to send to.');
      return;
    }

    try {
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

        // Create message
        const snapMessage: Message = {
          id: `${chatId}_${Date.now()}_snap`,
          chatId,
          senderId: user?.id || 'demo-user',
          type: mediaType === 'photo' ? 'image' : 'video',
          content: caption.trim() || `${mediaType === 'photo' ? 'Photo' : 'Video'} snap`,
          mediaUrl: isTestUri ? actualUri : photoUri,
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

      const friendCount = selectedFriends.length;
      const friendText = friendCount === 1 ? 'friend' : 'friends';
      const successMessage = isTestUri && mediaType === 'video'
        ? testUriType === 'recorded-successfully'
          ? `Your video was recorded successfully and sent to ${friendCount} ${friendText}!`
          : testUriType === 'error'
          ? `There was an error with video recording, but it was sent to ${friendCount} ${friendText}.`
          : `Your video recording was sent to ${friendCount} ${friendText}!`
        : `Your ${mediaType} was sent to ${friendCount} ${friendText}.`;
      
      Alert.alert(
        '📤 Snap Sent!',
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
          // Photo Preview
          imageError ? (
            <View style={styles.placeholderContainer}>
              <Text style={styles.placeholderIcon}>📸</Text>
              <Text style={styles.placeholderText}>Photo</Text>
            </View>
          ) : (
            <Image 
              source={{ uri: photoUri }} 
              style={styles.photoThumbnail} 
              resizeMode="cover"
              onError={() => setImageError(true)}
            />
          )
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
            <TouchableOpacity style={styles.storyOption} onPress={addToStory}>
              <View style={styles.storyIconContainer}>
                <Text style={styles.storyIcon}>➕</Text>
              </View>
              <View style={styles.storyInfo}>
                <Text style={styles.storyTitle}>Add to My Story</Text>
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
}); 