import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  Alert,
  Image,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useAppStore } from '../../store/useAppStore';
import { Message, ChatStackParamList } from '../../types';

type ChatDetailScreenNavigationProp = StackNavigationProp<ChatStackParamList, 'ChatDetail'>;
type ChatDetailScreenRouteProp = RouteProp<ChatStackParamList, 'ChatDetail'>;

interface MessageBubbleProps {
  message: Message;
  isOwn: boolean;
  showTime?: boolean;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ message, isOwn, showTime }) => {
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <View style={[styles.messageContainer, isOwn ? styles.ownMessage : styles.otherMessage]}>
      <View style={[styles.messageBubble, isOwn ? styles.ownBubble : styles.otherBubble]}>
        {message.type === 'snap' && (
          <View style={styles.snapContainer}>
            <Text style={styles.snapEmoji}>📸</Text>
            <Text style={[styles.snapText, isOwn ? styles.ownText : styles.otherText]}>
              Snap
            </Text>
          </View>
        )}
        
        {message.type === 'text' && (
          <Text style={[styles.messageText, isOwn ? styles.ownText : styles.otherText]}>
            {message.content}
          </Text>
        )}
        
        {message.type === 'image' && (
          <View style={styles.imageContainer}>
            {message.mediaUrl ? (
              <Image 
                source={{ uri: message.mediaUrl }} 
                style={styles.messageImage}
                resizeMode="cover"
              />
            ) : (
              <View style={styles.snapContainer}>
                <Text style={styles.snapEmoji}>🖼️</Text>
                <Text style={[styles.snapText, isOwn ? styles.ownText : styles.otherText]}>
                  Photo
                </Text>
              </View>
            )}
            {message.content && message.content !== 'Photo snap' && (
              <Text style={[styles.messageText, isOwn ? styles.ownText : styles.otherText, styles.captionText]}>
                {message.content}
              </Text>
            )}
          </View>
        )}
        
        {message.type === 'video' && (
          <View style={styles.videoContainer}>
            {message.mediaUrl ? (
              <View style={styles.videoWrapper}>
                <Image 
                  source={{ uri: message.mediaUrl }} 
                  style={styles.messageVideo}
                  resizeMode="cover"
                />
                <View style={styles.videoPlayOverlay}>
                  <Text style={styles.videoPlayIcon}>▶️</Text>
                </View>
              </View>
            ) : (
              <View style={styles.snapContainer}>
                <Text style={styles.snapEmoji}>🎥</Text>
                <Text style={[styles.snapText, isOwn ? styles.ownText : styles.otherText]}>
                  Video
                </Text>
              </View>
            )}
            {message.content && message.content !== 'Video snap' && (
              <Text style={[styles.messageText, isOwn ? styles.ownText : styles.otherText, styles.captionText]}>
                {message.content}
              </Text>
            )}
          </View>
        )}

        {message.type === 'story_reply' && (
          <View style={styles.storyReplyContainer}>
            {message.storyPreview && (
              <View style={styles.storyPreview}>
                <Image 
                  source={{ uri: message.storyPreview.mediaUrl }} 
                  style={styles.storyPreviewImage}
                  resizeMode="cover"
                />
                {message.storyPreview.type === 'video' && (
                  <View style={styles.videoOverlay}>
                    <Text style={styles.videoIcon}>▶️</Text>
                  </View>
                )}
                {message.storyPreview.caption && (
                  <View style={styles.storyCaptionPreview}>
                    <Text style={styles.storyCaptionText} numberOfLines={1}>
                      {message.storyPreview.caption}
                    </Text>
                  </View>
                )}
              </View>
            )}
            <Text style={[styles.storyReplyText, isOwn ? styles.ownText : styles.otherText]}>
              {message.content}
            </Text>
          </View>
        )}
      </View>
      
      {showTime && (
        <Text style={styles.messageTime}>
          {formatTime(message.createdAt)}
        </Text>
      )}
    </View>
  );
};

export default function ChatDetailScreen() {
  const navigation = useNavigation<ChatDetailScreenNavigationProp>();
  const route = useRoute<ChatDetailScreenRouteProp>();
  const { chatId, contactName } = route.params;
  
  const { user, messages, addMessage } = useAppStore();
  const [messageText, setMessageText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);
  
  // Get messages for this chat
  const chatMessages = messages[chatId] || [];

  useEffect(() => {
    // Initialize with some demo messages if empty
    if (chatMessages.length === 0) {
      const demoMessages: Message[] = [
        {
          id: `${chatId}_1`,
          chatId,
          senderId: chatId === '1' ? 'john_doe' : 'sarah_wilson',
          type: 'text',
          content: chatId === '1' ? 'Hey! How was your day?' : 'Thanks for the workout tips! 💪',
          isRead: true,
          readBy: [],
          isTemporary: false,
          reactions: [],
          createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
          updatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
        },
        {
          id: `${chatId}_2`,
          chatId,
          senderId: user?.id || 'demo-user',
          type: 'text',
          content: chatId === '1' ? 'It was great! Just got back from the gym 💪' : 'No problem! Let me know how it goes',
          isRead: true,
          readBy: [],
          isTemporary: false,
          reactions: [],
          createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000),
          updatedAt: new Date(Date.now() - 1 * 60 * 60 * 1000),
        }
      ];
      
      demoMessages.forEach(msg => addMessage(chatId, msg));
    }
  }, [chatId, chatMessages.length, user?.id, addMessage]);

  useEffect(() => {
    // Auto-scroll to bottom when new messages arrive
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, [chatMessages.length]);

  const sendMessage = () => {
    if (!messageText.trim()) return;

    const newMessage: Message = {
      id: `${chatId}_${Date.now()}`,
      chatId,
      senderId: user?.id || 'demo-user',
      type: 'text',
      content: messageText.trim(),
      isRead: false,
      readBy: [],
      isTemporary: false,
      reactions: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    addMessage(chatId, newMessage);
    setMessageText('');

    // Simulate other person typing and responding (for demo)
    setTimeout(() => {
      setIsTyping(true);
      setTimeout(() => {
        setIsTyping(false);
        const responses = [
          "That's awesome! 😊",
          "Sounds good to me!",
          "I totally agree 👍",
          "Nice! Keep it up 🔥",
          "Haha that's funny 😂",
          "Let's do it!"
        ];
        
        const response: Message = {
          id: `${chatId}_${Date.now()}_response`,
          chatId,
          senderId: chatId === '1' ? 'john_doe' : 'sarah_wilson',
          type: 'text',
          content: responses[Math.floor(Math.random() * responses.length)],
          isRead: false,
          readBy: [],
          isTemporary: false,
          reactions: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        
        addMessage(chatId, response);
      }, 2000);
    }, 500);
  };

  const sendSnap = () => {
    Alert.alert(
      '📸 Send Snap',
      'Choose snap type:',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: '📸 Photo', 
          onPress: () => {
            const snapMessage: Message = {
              id: `${chatId}_${Date.now()}_snap`,
              chatId,
              senderId: user?.id || 'demo-user',
              type: 'image',
              content: 'Photo snap',
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
        },
        { 
          text: '🎥 Video', 
          onPress: () => {
            const snapMessage: Message = {
              id: `${chatId}_${Date.now()}_snap`,
              chatId,
              senderId: user?.id || 'demo-user',
              type: 'video',
              content: 'Video snap',
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
        }
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        
        <View style={styles.headerInfo}>
          <Text style={styles.contactName}>{contactName}</Text>
          {isTyping && <Text style={styles.typingText}>typing...</Text>}
        </View>
        
        <TouchableOpacity style={styles.snapHeaderButton} onPress={sendSnap}>
          <Text style={styles.snapHeaderText}>📸</Text>
        </TouchableOpacity>
      </View>

      {/* Messages */}
      <ScrollView 
        ref={scrollViewRef}
        style={styles.messagesContainer}
        contentContainerStyle={styles.messagesContent}
        showsVerticalScrollIndicator={false}
      >
        {chatMessages.map((message, index) => {
          const isOwn = message.senderId === user?.id;
          const showTime = index === chatMessages.length - 1 || 
            (index < chatMessages.length - 1 && 
             chatMessages[index + 1].createdAt.getTime() - message.createdAt.getTime() > 5 * 60 * 1000);
          
          return (
            <MessageBubble
              key={message.id}
              message={message}
              isOwn={isOwn}
              showTime={showTime}
            />
          );
        })}
      </ScrollView>

      {/* Message Input */}
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.inputContainer}
      >
        <View style={styles.inputRow}>
          <TouchableOpacity style={styles.snapButton} onPress={sendSnap}>
            <Text style={styles.snapButtonText}>📸</Text>
          </TouchableOpacity>
          
          <TextInput
            style={styles.textInput}
            placeholder="Type a message..."
            placeholderTextColor="#9E9E9E"
            value={messageText}
            onChangeText={setMessageText}
            multiline
            maxLength={500}
          />
          
          <TouchableOpacity 
            style={[styles.sendButton, messageText.trim() ? styles.sendButtonActive : styles.sendButtonInactive]}
            onPress={sendMessage}
            disabled={!messageText.trim()}
          >
            <Text style={styles.sendButtonText}>Send</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
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
    borderBottomWidth: 1,
    borderBottomColor: '#424242',
    backgroundColor: '#161618',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  backButton: {
    paddingVertical: 5,
  },
  backText: {
    color: '#FFDD3A',
    fontSize: 16,
    fontWeight: '500',
  },
  headerInfo: {
    flex: 1,
    alignItems: 'center',
  },
  contactName: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  typingText: {
    color: '#9E9E9E',
    fontSize: 12,
    fontStyle: 'italic',
  },
  snapHeaderButton: {
    backgroundColor: '#FFDD3A',
    width: 35,
    height: 35,
    borderRadius: 17.5,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  snapHeaderText: {
    fontSize: 18,
  },
  messagesContainer: {
    flex: 1,
    backgroundColor: '#0D0D0F',
  },
  messagesContent: {
    paddingVertical: 20,
    paddingHorizontal: 15,
  },
  messageContainer: {
    marginVertical: 4,
    maxWidth: '80%',
  },
  ownMessage: {
    alignSelf: 'flex-end',
    alignItems: 'flex-end',
  },
  otherMessage: {
    alignSelf: 'flex-start',
    alignItems: 'flex-start',
  },
  messageBubble: {
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    maxWidth: '100%',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  ownBubble: {
    backgroundColor: '#FFDD3A',
    borderBottomRightRadius: 5,
  },
  otherBubble: {
    backgroundColor: '#424242',
    borderBottomLeftRadius: 5,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 20,
  },
  ownText: {
    color: '#0D0D0F',
  },
  otherText: {
    color: '#FFFFFF',
  },
  snapContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  snapEmoji: {
    fontSize: 16,
    marginRight: 8,
  },
  snapText: {
    fontSize: 16,
    fontWeight: '500',
  },
  messageTime: {
    fontSize: 12,
    color: '#9E9E9E',
    marginTop: 4,
    marginHorizontal: 4,
  },
  inputContainer: {
    backgroundColor: '#161618',
    borderTopWidth: 1,
    borderTopColor: '#424242',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 15,
    paddingVertical: 12,
    gap: 10,
  },
  snapButton: {
    backgroundColor: '#424242',
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  snapButtonText: {
    fontSize: 20,
  },
  textInput: {
    flex: 1,
    backgroundColor: '#0D0D0F',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#424242',
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: '#FFFFFF',
    fontSize: 16,
    maxHeight: 100,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  sendButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
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
  storyReplyContainer: {
    flexDirection: 'column',
    gap: 8,
  },
  storyPreview: {
    position: 'relative',
    width: 120,
    height: 160,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#161618',
  },
  storyPreviewImage: {
    width: '100%',
    height: '100%',
  },
  videoOverlay: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -12 }, { translateY: -12 }],
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  videoIcon: {
    fontSize: 12,
    color: '#FFFFFF',
  },
  storyCaptionPreview: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  storyCaptionText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '500',
  },
  storyReplyText: {
    fontSize: 16,
    lineHeight: 20,
  },
  imageContainer: {
    flexDirection: 'column',
    alignItems: 'flex-start',
  },
  messageImage: {
    width: 160,
    height: 200,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  videoContainer: {
    flexDirection: 'column',
    alignItems: 'flex-start',
  },
  videoWrapper: {
    position: 'relative',
    width: 160,
    height: 200,
    borderRadius: 12,
    overflow: 'hidden',
  },
  messageVideo: {
    width: '100%',
    height: '100%',
  },
  videoPlayOverlay: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -12 }, { translateY: -12 }],
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  videoPlayIcon: {
    fontSize: 12,
    color: '#FFFFFF',
  },
  captionText: {
    fontSize: 12,
    marginTop: 4,
  },
}); 