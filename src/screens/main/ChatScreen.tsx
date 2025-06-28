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
  const isGroup = chat.type === 'group';
  
  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    
    if (hours < 1) return 'now';
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  const getChatDisplayName = () => {
    if (isGroup) {
      return chat.name || `Group (${chat.participants.length})`;
    }
    return otherParticipant || 'Unknown';
  };

  const getChatAvatar = () => {
    if (isGroup) {
      return chat.avatar || '👥';
    }
    return otherParticipant?.charAt(0)?.toUpperCase() || '👤';
  };

  const getLastMessagePrefix = () => {
    if (isGroup && chat.lastMessage) {
      const senderName = chat.lastMessage.senderId === user?.id ? 'You' : chat.lastMessage.senderId;
      return `${senderName}: `;
    }
    return '';
  };

  return (
    <TouchableOpacity style={styles.chatItem} onPress={onPress} activeOpacity={0.7}>
      <View style={[styles.avatar, isGroup && styles.groupAvatar]}>
        <Text style={styles.avatarText}>
          {getChatAvatar()}
        </Text>
        {isGroup && (
          <View style={styles.groupBadge}>
            <Text style={styles.groupBadgeText}>{chat.participants.length}</Text>
          </View>
        )}
      </View>
      
      <View style={styles.chatInfo}>
        <View style={styles.chatHeader}>
          <View style={styles.chatNameContainer}>
            <Text style={styles.chatName}>
              {getChatDisplayName()}
            </Text>
            {isGroup && (
              <Text style={styles.groupIndicator}>GROUP</Text>
            )}
          </View>
          <Text style={styles.chatTime}>
            {formatTime(chat.lastActivity)}
          </Text>
        </View>
        
        <View style={styles.lastMessageContainer}>
          <Text style={styles.lastMessage} numberOfLines={1}>
            {getLastMessagePrefix()}{chat.lastMessage?.content || 'Say hi! 👋'}
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
      
      <TouchableOpacity style={styles.snapButton} activeOpacity={0.7}>
        <Text style={styles.snapText}>📷</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );
};

interface FriendItemProps {
  friend: Friend;
  onPress: () => void;
}

const FriendItem: React.FC<FriendItemProps> = ({ friend, onPress }) => (
  <TouchableOpacity style={styles.friendItem} onPress={onPress} activeOpacity={0.7}>
    <View style={styles.friendAvatar}>
      <Text style={styles.avatarText}>
        {friend.friendId.charAt(0)?.toUpperCase()}
      </Text>
    </View>
    <View style={styles.friendInfo}>
      <Text style={styles.friendName}>{friend.friendId}</Text>
      <View style={styles.friendMeta}>
        {friend.snapStreak > 0 && (
          <View style={styles.streakContainer}>
            <Text style={styles.streakText}>🔥 {friend.snapStreak}</Text>
          </View>
        )}
        <Text style={styles.mutualFriends}>👥 {friend.mutualFriends} mutual</Text>
      </View>
    </View>
    <TouchableOpacity style={styles.chatQuickButton} activeOpacity={0.7}>
      <Text style={styles.chatQuickText}>💬</Text>
    </TouchableOpacity>
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
  const [isCreatingGroup, setIsCreatingGroup] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [selectedFriends, setSelectedFriends] = useState<string[]>([]);

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
        },
        {
          id: '3',
          participants: [user?.id || 'demo-user', 'john_doe', 'sarah_wilson', 'alex_chen'],
          type: 'group',
          name: 'Gym Buddies 💪',
          avatar: '💪',
          lastMessage: {
            id: 'm3',
            chatId: '3',
            senderId: 'alex_chen',
            type: 'text',
            content: 'Anyone up for a workout session tomorrow?',
            isRead: false,
            readBy: [],
            isTemporary: false,
            reactions: [],
            createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000),
            updatedAt: new Date(Date.now() - 1 * 60 * 60 * 1000),
          },
          lastActivity: new Date(Date.now() - 1 * 60 * 60 * 1000),
          unreadCount: 1,
          isTyping: [],
          createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
        },
        {
          id: '4',
          participants: [user?.id || 'demo-user', 'emma_davis', 'mike_johnson'],
          type: 'group',
          name: 'Weekend Plans',
          lastMessage: {
            id: 'm4',
            chatId: '4',
            senderId: 'emma_davis',
            type: 'text',
            content: 'Let\'s grab dinner this Saturday!',
            isRead: true,
            readBy: [],
            isTemporary: false,
            reactions: [],
            createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000),
            updatedAt: new Date(Date.now() - 3 * 60 * 60 * 1000),
          },
          lastActivity: new Date(Date.now() - 3 * 60 * 60 * 1000),
          unreadCount: 0,
          isTyping: [],
          createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
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
        },
        {
          id: '3',
          userId: user?.id || 'demo-user',
          friendId: 'alex_chen',
          status: 'accepted',
          createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
          snapStreak: 12,
          mutualFriends: 2,
        },
        {
          id: '4',
          userId: user?.id || 'demo-user',
          friendId: 'emma_davis',
          status: 'accepted',
          createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
          snapStreak: 3,
          mutualFriends: 4,
        },
        {
          id: '5',
          userId: user?.id || 'demo-user',
          friendId: 'mike_johnson',
          status: 'accepted',
          createdAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000),
          snapStreak: 0,
          mutualFriends: 1,
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
        },
        {
          id: '2',
          senderId: 'emma_davis',
          receiverId: user?.id || 'demo-user',
          status: 'pending',
          message: 'Would love to connect! 🤝',
          createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000),
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

  const createGroupChat = () => {
    if (!groupName.trim()) {
      Alert.alert('Error', 'Please enter a group name');
      return;
    }

    if (selectedFriends.length < 2) {
      Alert.alert('Error', 'Please select at least 2 friends for the group');
      return;
    }

    const newGroupChat: Chat = {
      id: `group_${Date.now()}`,
      participants: [user?.id || 'demo-user', ...selectedFriends],
      type: 'group',
      name: groupName,
      lastActivity: new Date(),
      unreadCount: 0,
      isTyping: [],
      createdAt: new Date(),
    };

    setChats([newGroupChat, ...chats]);
    setGroupName('');
    setSelectedFriends([]);
    setIsCreatingGroup(false);

    Alert.alert(
      '✅ Group Created!',
      `"${groupName}" has been created with ${selectedFriends.length} friends`,
      [
        { 
          text: 'Start Chatting', 
          onPress: () => {
            navigation.navigate('ChatDetail', {
              chatId: newGroupChat.id,
              contactName: groupName,
            });
          }
        },
        { text: 'OK' }
      ]
    );
  };

  const toggleFriendSelection = (friendId: string) => {
    setSelectedFriends(prev => 
      prev.includes(friendId) 
        ? prev.filter(id => id !== friendId)
        : [...prev, friendId]
    );
  };

  const acceptFriendRequest = (request: FriendRequest) => {
    Alert.alert(
      '✅ Friend Request Accepted!',
      `You and ${request.senderId} are now friends!`
    );
    // In real app, this would update the backend
  };

  const rejectFriendRequest = (request: FriendRequest) => {
    Alert.alert(
      'Reject Friend Request',
      `Decline request from ${request.senderId}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Decline', 
          style: 'destructive',
          onPress: () => {
            console.log('Rejected friend request from:', request.senderId);
            Alert.alert('Request Declined', `You declined ${request.senderId}'s request`);
          }
        }
      ]
    );
  };

  const filteredChats = chats.filter(chat => 
    chat.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    chat.participants.some(p => p.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const filteredFriends = friends.filter(friend => 
    friend.friendId.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const pendingRequests = friendRequests.filter(r => r.status === 'pending');

  return (
    <SafeAreaView style={styles.container}>
      {/* Enhanced Header - Fixed */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.title}>Chat</Text>
          <Text style={styles.subtitle}>Stay connected with friends</Text>
        </View>
        <View style={styles.headerButtons}>
          <TouchableOpacity 
            style={styles.addButton}
            onPress={() => setIsAddingFriend(true)}
            activeOpacity={0.8}
          >
            <Text style={styles.addIcon}>👥</Text>
            <Text style={styles.addText}>Add</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.groupButton}
            onPress={() => setIsCreatingGroup(true)}
            activeOpacity={0.8}
          >
            <Text style={styles.groupIcon}>🫂</Text>
            <Text style={styles.groupText}>Group</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Main Scrollable Content */}
      <ScrollView 
        style={styles.mainScrollView} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Enhanced Friend Requests */}
        {pendingRequests.length > 0 && (
          <View style={styles.requestsSection}>
            <View style={styles.requestsHeader}>
              <Text style={styles.requestsTitle}>Friend Requests</Text>
              <View style={styles.requestsBadge}>
                <Text style={styles.requestsBadgeText}>{pendingRequests.length}</Text>
              </View>
            </View>
            
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.requestsScroll}
            >
              {pendingRequests.map(request => (
                <View key={request.id} style={styles.requestCard}>
                  <View style={styles.requestProfileSection}>
                    <View style={styles.requestAvatar}>
                      <Text style={styles.requestAvatarText}>
                        {request.senderId.charAt(0)?.toUpperCase()}
                      </Text>
                    </View>
                    <Text style={styles.requestName}>{request.senderId}</Text>
                    <Text style={styles.requestMessage} numberOfLines={2}>
                      {request.message}
                    </Text>
                    <Text style={styles.requestTime}>
                      {Math.floor((Date.now() - request.createdAt.getTime()) / (1000 * 60 * 60))}h ago
                    </Text>
                  </View>
                  
                  <View style={styles.requestButtonSection}>
                    <TouchableOpacity 
                      style={styles.acceptButton}
                      onPress={() => acceptFriendRequest(request)}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.acceptButtonText}>Accept</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={styles.declineButton}
                      onPress={() => rejectFriendRequest(request)}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.declineButtonText}>Decline</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Enhanced Search Bar */}
        <View style={styles.searchSection}>
          <View style={styles.searchContainer}>
            <Text style={styles.searchIcon}>🔍</Text>
            <TextInput
              style={styles.searchInput}
              placeholder="Search friends, chats..."
              placeholderTextColor="#666"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity 
                style={styles.clearButton}
                onPress={() => setSearchQuery('')}
              >
                <Text style={styles.clearButtonText}>✕</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Enhanced Tabs */}
        <View style={styles.tabSection}>
          <View style={styles.tabContainer}>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'chats' && styles.activeTab]}
              onPress={() => setActiveTab('chats')}
              activeOpacity={0.7}
            >
              <Text style={styles.tabIcon}>💬</Text>
              <Text style={[styles.tabText, activeTab === 'chats' && styles.activeTabText]}>
                Chats
              </Text>
              <View style={[styles.tabBadge, activeTab === 'chats' && styles.activeTabBadge]}>
                <Text style={[styles.tabBadgeText, activeTab === 'chats' && styles.activeTabBadgeText]}>
                  {chats.length}
                </Text>
              </View>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.tab, activeTab === 'friends' && styles.activeTab]}
              onPress={() => setActiveTab('friends')}
              activeOpacity={0.7}
            >
              <Text style={styles.tabIcon}>👥</Text>
              <Text style={[styles.tabText, activeTab === 'friends' && styles.activeTabText]}>
                Friends
              </Text>
              <View style={[styles.tabBadge, activeTab === 'friends' && styles.activeTabBadge]}>
                <Text style={[styles.tabBadgeText, activeTab === 'friends' && styles.activeTabBadgeText]}>
                  {friends.length}
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* Content List */}
        <View style={styles.contentList}>
          {activeTab === 'chats' ? (
            filteredChats.length > 0 ? (
              <View style={styles.listContainer}>
                {filteredChats.map(chat => (
                  <ChatItem 
                    key={chat.id} 
                    chat={chat} 
                    onPress={() => openChat(chat)}
                  />
                ))}
              </View>
            ) : (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyIcon}>💬</Text>
                <Text style={styles.emptyTitle}>No chats yet</Text>
                <Text style={styles.emptySubtext}>Start a conversation with your friends to see your chats here!</Text>
              </View>
            )
          ) : (
            filteredFriends.length > 0 ? (
              <View style={styles.listContainer}>
                {filteredFriends.map(friend => (
                  <FriendItem 
                    key={friend.id} 
                    friend={friend} 
                    onPress={() => openFriendProfile(friend)}
                  />
                ))}
              </View>
            ) : (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyIcon}>👥</Text>
                <Text style={styles.emptyTitle}>No friends yet</Text>
                <Text style={styles.emptySubtext}>Add friends to start chatting and sharing moments!</Text>
              </View>
            )
          )}
        </View>
      </ScrollView>

      {/* Enhanced Add Friend Modal */}
      {isAddingFriend && (
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Friend</Text>
              <TouchableOpacity 
                style={styles.modalCloseButton}
                onPress={() => {
                  setIsAddingFriend(false);
                  setFriendUsername('');
                }}
              >
                <Text style={styles.modalCloseText}>✕</Text>
              </TouchableOpacity>
            </View>
            
            <Text style={styles.modalSubtitle}>Enter their username to send a friend request</Text>
            
            <View style={styles.modalInputContainer}>
              <Text style={styles.modalInputIcon}>@</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="Enter username..."
                placeholderTextColor="#666"
                value={friendUsername}
                onChangeText={setFriendUsername}
                autoCapitalize="none"
                autoFocus={true}
              />
            </View>
            
            <View style={styles.modalActions}>
              <TouchableOpacity 
                style={styles.cancelButton}
                onPress={() => {
                  setIsAddingFriend(false);
                  setFriendUsername('');
                }}
                activeOpacity={0.8}
              >
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.sendButton, !friendUsername.trim() && styles.sendButtonDisabled]} 
                onPress={addFriend}
                disabled={!friendUsername.trim()}
                activeOpacity={0.8}
              >
                <Text style={[styles.sendText, !friendUsername.trim() && styles.sendTextDisabled]}>
                  Send Request
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {/* Create Group Modal */}
      {isCreatingGroup && (
        <View style={styles.modalOverlay}>
          <View style={[styles.modal, styles.groupModal]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Create Group Chat</Text>
              <TouchableOpacity 
                style={styles.modalCloseButton}
                onPress={() => {
                  setIsCreatingGroup(false);
                  setGroupName('');
                  setSelectedFriends([]);
                }}
              >
                <Text style={styles.modalCloseText}>✕</Text>
              </TouchableOpacity>
            </View>
            
            <Text style={styles.modalSubtitle}>Give your group a name and select friends to add</Text>
            
            <View style={styles.modalInputContainer}>
              <Text style={styles.modalInputIcon}>🫂</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="Enter group name..."
                placeholderTextColor="#666"
                value={groupName}
                onChangeText={setGroupName}
                autoCapitalize="words"
              />
            </View>

            <Text style={styles.friendsSelectionTitle}>
              Select Friends ({selectedFriends.length}/20)
            </Text>
            
            <ScrollView style={styles.friendsSelection} showsVerticalScrollIndicator={false}>
              {friends.map(friend => (
                <TouchableOpacity
                  key={friend.id}
                  style={[
                    styles.friendSelectionItem,
                    selectedFriends.includes(friend.friendId) && styles.friendSelectionItemSelected
                  ]}
                  onPress={() => toggleFriendSelection(friend.friendId)}
                  activeOpacity={0.7}
                >
                  <View style={styles.friendSelectionAvatar}>
                    <Text style={styles.avatarText}>
                      {friend.friendId.charAt(0)?.toUpperCase()}
                    </Text>
                  </View>
                  <View style={styles.friendSelectionInfo}>
                    <Text style={styles.friendSelectionName}>{friend.friendId}</Text>
                    {friend.snapStreak > 0 && (
                      <Text style={styles.friendSelectionStreak}>🔥 {friend.snapStreak}</Text>
                    )}
                  </View>
                  <View style={[
                    styles.selectionCheckbox,
                    selectedFriends.includes(friend.friendId) && styles.selectionCheckboxSelected
                  ]}>
                    {selectedFriends.includes(friend.friendId) && (
                      <Text style={styles.checkboxCheck}>✓</Text>
                    )}
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
            
            <View style={styles.modalActions}>
              <TouchableOpacity 
                style={styles.cancelButton}
                onPress={() => {
                  setIsCreatingGroup(false);
                  setGroupName('');
                  setSelectedFriends([]);
                }}
                activeOpacity={0.8}
              >
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[
                  styles.createGroupButton, 
                  (!groupName.trim() || selectedFriends.length < 2) && styles.createGroupButtonDisabled
                ]} 
                onPress={createGroupChat}
                disabled={!groupName.trim() || selectedFriends.length < 2}
                activeOpacity={0.8}
              >
                <Text style={[
                  styles.createGroupText,
                  (!groupName.trim() || selectedFriends.length < 2) && styles.createGroupTextDisabled
                ]}>
                  Create Group
                </Text>
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
  
  // Enhanced Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#1A1A1C',
  },
  headerLeft: {
    flex: 1,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 14,
    color: '#888',
    fontWeight: '500',
  },
  headerButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFDD3A',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 18,
    shadowColor: '#FFDD3A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  addIcon: {
    fontSize: 14,
    marginRight: 4,
  },
  addText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#0D0D0F',
  },
  groupButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4CAF50',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 18,
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  groupIcon: {
    fontSize: 14,
    marginRight: 4,
  },
  groupText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  
  // Enhanced Friend Requests
  requestsSection: {
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#1A1A1C',
  },
  requestsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 15,
  },
  requestsTitle: {
    color: '#FFDD3A',
    fontSize: 18,
    fontWeight: 'bold',
    marginRight: 10,
  },
  requestsBadge: {
    backgroundColor: '#FF4444',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    minWidth: 24,
    alignItems: 'center',
  },
  requestsBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  requestsScroll: {
    paddingHorizontal: 20,
    gap: 12,
  },
  requestCard: {
    width: 180,
    backgroundColor: '#1A1A1C',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#2A2A2C',
  },
  requestProfileSection: {
    alignItems: 'center',
    marginBottom: 16,
  },
  requestAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FFDD3A',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  requestAvatarText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0D0D0F',
  },
  requestName: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 6,
    textAlign: 'center',
  },
  requestMessage: {
    color: '#888',
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 8,
  },
  requestTime: {
    color: '#666',
    fontSize: 11,
    textAlign: 'center',
  },
  requestButtonSection: {
    gap: 8,
  },
  acceptButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
  },
  acceptButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  declineButton: {
    backgroundColor: '#2A2A2C',
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#444',
  },
  declineButtonText: {
    color: '#888',
    fontSize: 14,
    fontWeight: '600',
  },
  
  // Enhanced Search
  searchSection: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A1A1C',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#2A2A2C',
  },
  searchIcon: {
    fontSize: 16,
    marginRight: 12,
    color: '#888',
  },
  searchInput: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
  },
  clearButton: {
    padding: 4,
  },
  clearButtonText: {
    color: '#888',
    fontSize: 14,
  },
  
  // Enhanced Tabs
  tabSection: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#1A1A1C',
    borderRadius: 16,
    padding: 4,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    gap: 6,
  },
  activeTab: {
    backgroundColor: '#FFDD3A',
  },
  tabIcon: {
    fontSize: 16,
  },
  tabText: {
    color: '#888',
    fontSize: 16,
    fontWeight: '600',
  },
  activeTabText: {
    color: '#0D0D0F',
    fontWeight: 'bold',
  },
  tabBadge: {
    backgroundColor: '#2A2A2C',
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
    minWidth: 20,
    alignItems: 'center',
  },
  activeTabBadge: {
    backgroundColor: '#0D0D0F',
  },
  tabBadgeText: {
    color: '#888',
    fontSize: 12,
    fontWeight: 'bold',
  },
  activeTabBadgeText: {
    color: '#FFFFFF',
  },
  
  // Main Scroll and Content
  mainScrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  contentList: {
    flex: 1,
  },
  listContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  
  // Chat Items
  chatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    marginBottom: 12,
    backgroundColor: '#1A1A1C',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#2A2A2C',
  },
  avatar: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: '#FFDD3A',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
    position: 'relative',
  },
  groupAvatar: {
    backgroundColor: '#4CAF50',
  },
  groupBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#FF4444',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    minWidth: 20,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#1A1A1C',
  },
  groupBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  avatarText: {
    fontSize: 20,
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
  chatNameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  chatName: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: 'bold',
    marginRight: 8,
  },
  groupIndicator: {
    backgroundColor: '#4CAF50',
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    textAlign: 'center',
  },
  chatTime: {
    color: '#888',
    fontSize: 13,
    fontWeight: '500',
  },
  lastMessageContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  lastMessage: {
    color: '#888',
    fontSize: 15,
    flex: 1,
    fontWeight: '500',
  },
  unreadBadge: {
    backgroundColor: '#FFDD3A',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginLeft: 8,
    minWidth: 20,
    alignItems: 'center',
  },
  unreadText: {
    color: '#0D0D0F',
    fontSize: 12,
    fontWeight: 'bold',
  },
  snapButton: {
    backgroundColor: '#2A2A2C',
    padding: 12,
    borderRadius: 24,
    marginLeft: 12,
  },
  snapText: {
    fontSize: 18,
  },
  
  // Friend Items
  friendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    marginBottom: 12,
    backgroundColor: '#1A1A1C',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#2A2A2C',
  },
  friendAvatar: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: '#FFDD3A',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  friendInfo: {
    flex: 1,
  },
  friendName: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  friendMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  streakContainer: {
    backgroundColor: '#2A2A2C',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  streakText: {
    color: '#FFDD3A',
    fontSize: 13,
    fontWeight: 'bold',
  },
  mutualFriends: {
    color: '#888',
    fontSize: 13,
    fontWeight: '500',
  },
  chatQuickButton: {
    backgroundColor: '#2A2A2C',
    padding: 12,
    borderRadius: 24,
    marginLeft: 12,
  },
  chatQuickText: {
    fontSize: 18,
  },
  
  // Empty States
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtext: {
    color: '#888',
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 22,
  },
  
  // Enhanced Modal
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modal: {
    backgroundColor: '#1A1A1C',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    borderWidth: 1,
    borderColor: '#2A2A2C',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  modalTitle: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: 'bold',
  },
  modalCloseButton: {
    padding: 8,
  },
  modalCloseText: {
    color: '#888',
    fontSize: 18,
  },
  modalSubtitle: {
    color: '#888',
    fontSize: 15,
    marginBottom: 20,
    lineHeight: 20,
  },
  modalInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2A2A2C',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#333',
  },
  modalInputIcon: {
    color: '#888',
    fontSize: 16,
    marginRight: 12,
    fontWeight: 'bold',
  },
  modalInput: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#2A2A2C',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#444',
  },
  cancelText: {
    color: '#888',
    fontSize: 16,
    fontWeight: '600',
  },
  sendButton: {
    flex: 1,
    backgroundColor: '#FFDD3A',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#333',
  },
  sendText: {
    color: '#0D0D0F',
    fontSize: 16,
    fontWeight: 'bold',
  },
  sendTextDisabled: {
    color: '#666',
  },
  
  // Group Creation Modal
  groupModal: {
    maxHeight: '85%',
  },
  friendsSelectionTitle: {
    color: '#FFDD3A',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
    marginTop: 8,
  },
  friendsSelection: {
    maxHeight: 300,
    marginBottom: 20,
  },
  friendSelectionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    marginBottom: 8,
    backgroundColor: '#2A2A2C',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#333',
  },
  friendSelectionItemSelected: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
  },
  friendSelectionAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFDD3A',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  friendSelectionInfo: {
    flex: 1,
  },
  friendSelectionName: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  friendSelectionStreak: {
    color: '#FFDD3A',
    fontSize: 12,
    fontWeight: '600',
  },
  selectionCheckbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#666',
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectionCheckboxSelected: {
    backgroundColor: '#FFFFFF',
    borderColor: '#FFFFFF',
  },
  checkboxCheck: {
    color: '#4CAF50',
    fontSize: 14,
    fontWeight: 'bold',
  },
  createGroupButton: {
    flex: 1,
    backgroundColor: '#4CAF50',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  createGroupButtonDisabled: {
    backgroundColor: '#333',
  },
  createGroupText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  createGroupTextDisabled: {
    color: '#666',
  },
}); 