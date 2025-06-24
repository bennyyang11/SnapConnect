import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  SafeAreaView,
  FlatList,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useAppStore } from '../../store/useAppStore';
import { Chat, Friend, FriendRequest, ChatStackParamList } from '../../types';

type ChatScreenNavigationProp = StackNavigationProp<ChatStackParamList, 'ChatList'>;

interface ChatItemProps {
  chat: Chat;
  onPress: () => void;
}

const ChatItem: React.FC<ChatItemProps> = ({ chat, onPress }) => {
  const { user } = useAppStore();
  const otherParticipant = chat.participants.find(p => p !== user?.id);
  
  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    
    if (hours < 1) return 'now';
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  return (
    <TouchableOpacity style={styles.chatItem} onPress={onPress}>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>
          {otherParticipant?.charAt(0)?.toUpperCase() || '👤'}
        </Text>
      </View>
      
      <View style={styles.chatInfo}>
        <View style={styles.chatHeader}>
          <Text style={styles.chatName}>
            {chat.name || otherParticipant || 'Unknown'}
          </Text>
          <Text style={styles.chatTime}>
            {formatTime(chat.lastActivity)}
          </Text>
        </View>
        
        <View style={styles.lastMessageContainer}>
          <Text style={styles.lastMessage} numberOfLines={1}>
            {chat.lastMessage?.content || 'Say hi! 👋'}
          </Text>
          {chat.unreadCount > 0 && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadText}>
                {chat.unreadCount > 99 ? '99+' : chat.unreadCount}
              </Text>
            </View>
          )}
        </View>
      </View>
      
      <View style={styles.chatActions}>
        <TouchableOpacity style={styles.snapButton}>
          <Text style={styles.snapText}>📷</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
};

interface FriendItemProps {
  friend: Friend;
  onPress: () => void;
}

const FriendItem: React.FC<FriendItemProps> = ({ friend, onPress }) => (
  <TouchableOpacity style={styles.friendItem} onPress={onPress}>
    <View style={styles.friendAvatar}>
      <Text style={styles.avatarText}>
        {friend.friendId.charAt(0)?.toUpperCase()}
      </Text>
    </View>
    <View style={styles.friendInfo}>
      <Text style={styles.friendName}>{friend.friendId}</Text>
      {friend.snapStreak > 0 && (
        <View style={styles.streakContainer}>
          <Text style={styles.streakText}>🔥 {friend.snapStreak}</Text>
        </View>
      )}
    </View>
  </TouchableOpacity>
);

export default function ChatScreen() {
  const navigation = useNavigation<ChatScreenNavigationProp>();
  const { 
    user, 
    chats, 
    friends, 
    friendRequests, 
    setChats,
    setFriends,
    setFriendRequests 
  } = useAppStore();
  
  const [activeTab, setActiveTab] = useState<'chats' | 'friends'>('chats');
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddingFriend, setIsAddingFriend] = useState(false);
  const [friendUsername, setFriendUsername] = useState('');

  useEffect(() => {
    // Initialize with demo data
    if (chats.length === 0) {
      const demoChats: Chat[] = [
        {
          id: '1',
          participants: [user?.id || 'demo-user', 'john_doe'],
          type: 'direct',
          lastMessage: {
            id: 'm1',
            chatId: '1',
            senderId: 'john_doe',
            type: 'text',
            content: 'Hey! How was your day?',
            isRead: false,
            readBy: [],
            isTemporary: false,
            reactions: [],
            createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
            updatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
          },
          lastActivity: new Date(Date.now() - 2 * 60 * 60 * 1000),
          unreadCount: 2,
          isTyping: [],
          createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        },
        {
          id: '2',
          participants: [user?.id || 'demo-user', 'sarah_wilson'],
          type: 'direct',
          lastMessage: {
            id: 'm2',
            chatId: '2',
            senderId: user?.id || 'demo-user',
            type: 'text',
            content: 'Thanks for the workout tips! 💪',
            isRead: true,
            readBy: [],
            isTemporary: false,
            reactions: [],
            createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000),
            updatedAt: new Date(Date.now() - 5 * 60 * 60 * 1000),
          },
          lastActivity: new Date(Date.now() - 5 * 60 * 60 * 1000),
          unreadCount: 0,
          isTyping: [],
          createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
        }
      ];
      setChats(demoChats);
    }

    if (friends.length === 0) {
      const demoFriends: Friend[] = [
        {
          id: '1',
          userId: user?.id || 'demo-user',
          friendId: 'john_doe',
          status: 'accepted',
          createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          snapStreak: 15,
          mutualFriends: 5,
        },
        {
          id: '2',
          userId: user?.id || 'demo-user',
          friendId: 'sarah_wilson',
          status: 'accepted',
          createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000),
          snapStreak: 7,
          mutualFriends: 3,
        }
      ];
      setFriends(demoFriends);
    }

    if (friendRequests.length === 0) {
      const demoRequests: FriendRequest[] = [
        {
          id: '1',
          senderId: 'alex_chen',
          receiverId: user?.id || 'demo-user',
          status: 'pending',
          message: 'Hey! Met you at the gym yesterday',
          createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        }
      ];
      setFriendRequests(demoRequests);
    }
  }, [user?.id, chats.length, friends.length, friendRequests.length]);

  const openChat = (chat: Chat) => {
    const otherParticipant = chat.participants.find(p => p !== user?.id);
    const contactName = chat.name || otherParticipant || 'Unknown';
    
    navigation.navigate('ChatDetail', {
      chatId: chat.id,
      contactName: contactName,
    });
  };

  const openFriendProfile = (friend: Friend) => {
    Alert.alert(
      '👤 Friend Profile',
      `${friend.friendId}\n🔥 Snap Streak: ${friend.snapStreak} days\n👥 Mutual Friends: ${friend.mutualFriends}`,
      [
        { text: 'Send Snap', onPress: () => console.log('Send snap to friend') },
        { text: 'Chat', onPress: () => console.log('Open chat') },
        { text: 'View Profile', onPress: () => console.log('View profile') },
        { text: 'Cancel', style: 'cancel' }
      ]
    );
  };

  const addFriend = () => {
    if (!friendUsername.trim()) {
      Alert.alert('Error', 'Please enter a username');
      return;
    }

    Alert.alert(
      '👥 Add Friend',
      `Send friend request to ${friendUsername}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Send Request', 
          onPress: () => {
            console.log('Send friend request to:', friendUsername);
            setFriendUsername('');
            setIsAddingFriend(false);
            Alert.alert('✅ Friend Request Sent!', `Request sent to ${friendUsername}`);
          }
        }
      ]
    );
  };

  const acceptFriendRequest = (request: FriendRequest) => {
    Alert.alert(
      '✅ Friend Request Accepted!',
      `You and ${request.senderId} are now friends!`
    );
    // In real app, this would update the backend
  };

  const filteredChats = chats.filter(chat => 
    chat.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    chat.participants.some(p => p.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const filteredFriends = friends.filter(friend => 
    friend.friendId.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Chat</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity 
            style={styles.addButton}
            onPress={() => setIsAddingFriend(true)}
          >
            <Text style={styles.addButtonText}>👥+</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Friend Requests */}
      {friendRequests.filter(r => r.status === 'pending').length > 0 && (
        <View style={styles.requestsContainer}>
          <Text style={styles.requestsTitle}>Friend Requests</Text>
          {friendRequests
            .filter(r => r.status === 'pending')
            .map(request => (
              <View key={request.id} style={styles.requestItem}>
                <View style={styles.requestInfo}>
                  <Text style={styles.requestSender}>{request.senderId}</Text>
                  <Text style={styles.requestMessage}>{request.message}</Text>
                </View>
                <View style={styles.requestActions}>
                  <TouchableOpacity 
                    style={styles.acceptButton}
                    onPress={() => acceptFriendRequest(request)}
                  >
                    <Text style={styles.acceptText}>✅</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.rejectButton}>
                    <Text style={styles.rejectText}>❌</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
        </View>
      )}

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search friends or chats..."
          placeholderTextColor="#9E9E9E"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Tabs */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'chats' && styles.activeTab]}
          onPress={() => setActiveTab('chats')}
        >
          <Text style={[styles.tabText, activeTab === 'chats' && styles.activeTabText]}>
            💬 Chats ({chats.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'friends' && styles.activeTab]}
          onPress={() => setActiveTab('friends')}
        >
          <Text style={[styles.tabText, activeTab === 'friends' && styles.activeTabText]}>
            👥 Friends ({friends.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <ScrollView style={styles.content}>
        {activeTab === 'chats' ? (
          filteredChats.length > 0 ? (
            filteredChats.map(chat => (
              <ChatItem 
                key={chat.id} 
                chat={chat} 
                onPress={() => openChat(chat)}
              />
            ))
          ) : (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>💬 No chats yet</Text>
              <Text style={styles.emptySubtext}>Start a conversation with your friends!</Text>
            </View>
          )
        ) : (
          filteredFriends.length > 0 ? (
            filteredFriends.map(friend => (
              <FriendItem 
                key={friend.id} 
                friend={friend} 
                onPress={() => openFriendProfile(friend)}
              />
            ))
          ) : (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>👥 No friends yet</Text>
              <Text style={styles.emptySubtext}>Add friends to start chatting!</Text>
            </View>
          )
        )}
      </ScrollView>

      {/* Add Friend Modal */}
      {isAddingFriend && (
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>Add Friend</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Enter username..."
              placeholderTextColor="#9E9E9E"
              value={friendUsername}
              onChangeText={setFriendUsername}
              autoCapitalize="none"
            />
            <View style={styles.modalActions}>
              <TouchableOpacity 
                style={styles.cancelButton}
                onPress={() => {
                  setIsAddingFriend(false);
                  setFriendUsername('');
                }}
              >
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.sendButton} onPress={addFriend}>
                <Text style={styles.sendText}>Send Request</Text>
              </TouchableOpacity>
            </View>
          </View>
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
  headerActions: {
    flexDirection: 'row',
  },
  addButton: {
    backgroundColor: '#FFDD3A',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
  },
  addButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  requestsContainer: {
    backgroundColor: '#161618',
    marginHorizontal: 10,
    marginBottom: 10,
    borderRadius: 12,
    padding: 15,
  },
  requestsTitle: {
    color: '#FFDD3A',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  requestItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  requestInfo: {
    flex: 1,
  },
  requestSender: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  requestMessage: {
    color: '#9E9E9E',
    fontSize: 14,
    marginTop: 2,
  },
  requestActions: {
    flexDirection: 'row',
    gap: 10,
  },
  acceptButton: {
    backgroundColor: '#4CAF50',
    padding: 8,
    borderRadius: 20,
  },
  acceptText: {
    fontSize: 12,
  },
  rejectButton: {
    backgroundColor: '#F44336',
    padding: 8,
    borderRadius: 20,
  },
  rejectText: {
    fontSize: 12,
  },
  searchContainer: {
    paddingHorizontal: 20,
    marginBottom: 15,
  },
  searchInput: {
    backgroundColor: '#161618',
    color: '#FFFFFF',
    padding: 12,
    borderRadius: 25,
    fontSize: 16,
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 15,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: '#FFDD3A',
  },
  tabText: {
    color: '#9E9E9E',
    fontSize: 16,
    fontWeight: '500',
  },
  activeTabText: {
    color: '#FFDD3A',
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
  },
  chatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    marginHorizontal: 10,
    marginBottom: 8,
    backgroundColor: '#161618',
    borderRadius: 12,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#FFDD3A',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 15,
  },
  avatarText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0D0D0F',
  },
  chatInfo: {
    flex: 1,
  },
  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  chatName: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  chatTime: {
    color: '#9E9E9E',
    fontSize: 12,
  },
  lastMessageContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  lastMessage: {
    color: '#9E9E9E',
    fontSize: 14,
    flex: 1,
  },
  unreadBadge: {
    backgroundColor: '#FFDD3A',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginLeft: 8,
  },
  unreadText: {
    color: '#0D0D0F',
    fontSize: 12,
    fontWeight: 'bold',
  },
  chatActions: {
    marginLeft: 10,
  },
  snapButton: {
    backgroundColor: '#424242',
    padding: 8,
    borderRadius: 20,
  },
  snapText: {
    fontSize: 16,
  },
  friendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    marginHorizontal: 10,
    marginBottom: 8,
    backgroundColor: '#161618',
    borderRadius: 12,
  },
  friendAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#FFDD3A',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 15,
  },
  friendInfo: {
    flex: 1,
  },
  friendName: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  streakContainer: {
    marginTop: 4,
  },
  streakText: {
    color: '#FF6B35',
    fontSize: 14,
    fontWeight: 'bold',
  },
  emptyContainer: {
    alignItems: 'center',
    padding: 40,
    marginTop: 50,
  },
  emptyText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  emptySubtext: {
    color: '#9E9E9E',
    fontSize: 14,
    textAlign: 'center',
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modal: {
    backgroundColor: '#161618',
    borderRadius: 15,
    padding: 20,
    width: '80%',
  },
  modalTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
  },
  modalInput: {
    backgroundColor: '#0D0D0F',
    color: '#FFFFFF',
    padding: 12,
    borderRadius: 8,
    fontSize: 16,
    marginBottom: 20,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cancelButton: {
    backgroundColor: '#424242',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    flex: 1,
    marginRight: 10,
  },
  cancelText: {
    color: '#FFFFFF',
    textAlign: 'center',
    fontWeight: 'bold',
  },
  sendButton: {
    backgroundColor: '#FFDD3A',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    flex: 1,
  },
  sendText: {
    color: '#0D0D0F',
    textAlign: 'center',
    fontWeight: 'bold',
  },
}); 