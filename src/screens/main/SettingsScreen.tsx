import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Alert,
  TextInput,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAppStore } from '../../store/useAppStore';

const PROFILE_EMOJIS = ['😎', '🤳', '📸', '✨', '🎯', '🔥', '⚡', '🎨', '💪', '🚀', '🌟', '🎵', '🏆', '💎', '🦄', '🌈'];
const STREAK_EMOJIS = ['🔥', '⚡', '💥', '⭐', '🎯', '💪', '🚀', '✨', '💎', '🏆', '🌟', '🎨', '💫', '🌈', '🦄', '👑'];

export default function SettingsScreen() {
  const navigation = useNavigation();
  const { user, updateUser } = useAppStore();
  
  const [selectedProfileEmoji, setSelectedProfileEmoji] = useState(user?.avatarEmoji || '😎');
  const [selectedStreakEmoji, setSelectedStreakEmoji] = useState(user?.streakEmoji || '🔥');
  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [bio, setBio] = useState(user?.bio || '');

  const handleSaveSettings = () => {
    // Update user profile with new settings
    const updatedUser = {
      ...user,
      displayName: displayName.trim() || user?.displayName,
      bio: bio.trim() || user?.bio,
      avatarEmoji: selectedProfileEmoji,
      streakEmoji: selectedStreakEmoji,
    };

    console.log('⚙️ SETTINGS: Saving settings for user:', user?.id);
    console.log('⚙️ SETTINGS: Current snap score:', user?.snapScore);
    console.log('⚙️ SETTINGS: Updated user data:', updatedUser);

    if (updateUser) {
      updateUser(updatedUser);
    }

    Alert.alert(
      '✅ Settings Saved!',
      'Your profile has been updated successfully. Your snap score and progress are preserved.',
      [{ text: 'OK', onPress: () => navigation.goBack() }]
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
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settings</Text>
        <TouchableOpacity style={styles.saveButton} onPress={handleSaveSettings}>
          <Text style={styles.saveText}>Save</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Profile Info Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>👤 Profile Information</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Display Name</Text>
            <TextInput
              style={styles.textInput}
              value={displayName}
              onChangeText={setDisplayName}
              placeholder="Enter your display name"
              placeholderTextColor="#9E9E9E"
              maxLength={25}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Bio</Text>
            <TextInput
              style={[styles.textInput, styles.bioInput]}
              value={bio}
              onChangeText={setBio}
              placeholder="Tell others about yourself..."
              placeholderTextColor="#9E9E9E"
              multiline
              maxLength={100}
            />
          </View>
        </View>

        {/* Profile Picture Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🎨 Profile Picture</Text>
          <Text style={styles.sectionSubtitle}>Choose an emoji for your profile</Text>
          
          <View style={styles.currentSelection}>
            <View style={styles.currentAvatar}>
              <Text style={styles.currentAvatarEmoji}>{selectedProfileEmoji}</Text>
            </View>
            <Text style={styles.currentLabel}>Current Profile Picture</Text>
          </View>

          <View style={styles.emojiGrid}>
            {PROFILE_EMOJIS.map((emoji) => (
              <TouchableOpacity
                key={emoji}
                style={[
                  styles.emojiOption,
                  selectedProfileEmoji === emoji && styles.emojiOptionSelected
                ]}
                onPress={() => setSelectedProfileEmoji(emoji)}
              >
                <Text style={styles.emojiText}>{emoji}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Streak Emoji Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🔥 Streak Emoji</Text>
          <Text style={styles.sectionSubtitle}>Customize your streak display</Text>
          
          <View style={styles.currentSelection}>
            <View style={styles.currentStreak}>
              <Text style={styles.currentStreakEmoji}>{selectedStreakEmoji}</Text>
              <Text style={styles.streakNumber}>7</Text>
            </View>
            <Text style={styles.currentLabel}>Current Streak Emoji</Text>
          </View>

          <View style={styles.emojiGrid}>
            {STREAK_EMOJIS.map((emoji) => (
              <TouchableOpacity
                key={emoji}
                style={[
                  styles.emojiOption,
                  selectedStreakEmoji === emoji && styles.emojiOptionSelected
                ]}
                onPress={() => setSelectedStreakEmoji(emoji)}
              >
                <Text style={styles.emojiText}>{emoji}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Notifications */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🔔 Notifications</Text>
          
          <TouchableOpacity style={styles.preferenceItem}>
            <Text style={styles.preferenceIcon}>📱</Text>
            <View style={styles.preferenceContent}>
              <Text style={styles.preferenceTitle}>Push Notifications</Text>
              <Text style={styles.preferenceSubtitle}>Get notified of snaps and messages</Text>
            </View>
            <View style={styles.toggle}>
              <Text style={styles.toggleText}>ON</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.preferenceItem}>
            <Text style={styles.preferenceIcon}>👥</Text>
            <View style={styles.preferenceContent}>
              <Text style={styles.preferenceTitle}>Friend Activity</Text>
              <Text style={styles.preferenceSubtitle}>Notify when friends are active</Text>
            </View>
            <View style={styles.toggle}>
              <Text style={styles.toggleText}>ON</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.preferenceItem}>
            <Text style={styles.preferenceIcon}>📊</Text>
            <View style={styles.preferenceContent}>
              <Text style={styles.preferenceTitle}>Snap Score Updates</Text>
              <Text style={styles.preferenceSubtitle}>Get notified when your score increases</Text>
            </View>
            <View style={styles.toggle}>
              <Text style={styles.toggleText}>ON</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Privacy */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🔒 Privacy & Safety</Text>
          
          <TouchableOpacity style={styles.preferenceItem}>
            <Text style={styles.preferenceIcon}>👁️</Text>
            <View style={styles.preferenceContent}>
              <Text style={styles.preferenceTitle}>Story Privacy</Text>
              <Text style={styles.preferenceSubtitle}>Currently: Friends Only</Text>
            </View>
            <Text style={styles.preferenceArrow}>→</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.preferenceItem}>
            <Text style={styles.preferenceIcon}>💬</Text>
            <View style={styles.preferenceContent}>
              <Text style={styles.preferenceTitle}>Message Privacy</Text>
              <Text style={styles.preferenceSubtitle}>Who can send you snaps</Text>
            </View>
            <Text style={styles.preferenceArrow}>→</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.preferenceItem}>
            <Text style={styles.preferenceIcon}>🚫</Text>
            <View style={styles.preferenceContent}>
              <Text style={styles.preferenceTitle}>Blocked Users</Text>
              <Text style={styles.preferenceSubtitle}>Manage blocked accounts</Text>
            </View>
            <Text style={styles.preferenceArrow}>→</Text>
          </TouchableOpacity>
        </View>

        {/* AI Features */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🤖 AI Features</Text>
          
          <TouchableOpacity style={styles.preferenceItem}>
            <Text style={styles.preferenceIcon}>🎨</Text>
            <View style={styles.preferenceContent}>
              <Text style={styles.preferenceTitle}>AI Filter Suggestions</Text>
              <Text style={styles.preferenceSubtitle}>Smart filter recommendations</Text>
            </View>
            <View style={styles.toggle}>
              <Text style={styles.toggleText}>ON</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.preferenceItem}>
            <Text style={styles.preferenceIcon}>💭</Text>
            <View style={styles.preferenceContent}>
              <Text style={styles.preferenceTitle}>Friendship Memory AI</Text>
              <Text style={styles.preferenceSubtitle}>Track shared moments with friends</Text>
            </View>
            <View style={styles.toggle}>
              <Text style={styles.toggleText}>ON</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.preferenceItem}>
            <Text style={styles.preferenceIcon}>💪</Text>
            <View style={styles.preferenceContent}>
              <Text style={styles.preferenceTitle}>Fitness Tracking</Text>
              <Text style={styles.preferenceSubtitle}>AI-powered workout insights</Text>
            </View>
            <View style={styles.toggle}>
              <Text style={styles.toggleText}>ON</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Data & Storage */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>💾 Data & Storage</Text>
          
          <TouchableOpacity style={styles.preferenceItem}>
            <Text style={styles.preferenceIcon}>📊</Text>
            <View style={styles.preferenceContent}>
              <Text style={styles.preferenceTitle}>Snap Score: {user?.snapScore || 0}</Text>
              <Text style={styles.preferenceSubtitle}>Your current progress</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.preferenceItem}>
            <Text style={styles.preferenceIcon}>🗂️</Text>
            <View style={styles.preferenceContent}>
              <Text style={styles.preferenceTitle}>Clear Cache</Text>
              <Text style={styles.preferenceSubtitle}>Free up storage space</Text>
            </View>
            <Text style={styles.preferenceArrow}>→</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.preferenceItem}>
            <Text style={styles.preferenceIcon}>⬇️</Text>
            <View style={styles.preferenceContent}>
              <Text style={styles.preferenceTitle}>Export Data</Text>
              <Text style={styles.preferenceSubtitle}>Download your SnapConnect data</Text>
            </View>
            <Text style={styles.preferenceArrow}>→</Text>
          </TouchableOpacity>
        </View>

        {/* App Preferences */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🎨 App Appearance</Text>
          
          <TouchableOpacity style={styles.preferenceItem}>
            <Text style={styles.preferenceIcon}>🌙</Text>
            <View style={styles.preferenceContent}>
              <Text style={styles.preferenceTitle}>Dark Mode</Text>
              <Text style={styles.preferenceSubtitle}>Currently: Always On</Text>
            </View>
            <View style={[styles.toggle, { backgroundColor: '#666' }]}>
              <Text style={styles.toggleText}>ON</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.preferenceItem}>
            <Text style={styles.preferenceIcon}>🌍</Text>
            <View style={styles.preferenceContent}>
              <Text style={styles.preferenceTitle}>Language</Text>
              <Text style={styles.preferenceSubtitle}>English (US)</Text>
            </View>
            <Text style={styles.preferenceArrow}>→</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.preferenceItem}>
            <Text style={styles.preferenceIcon}>📱</Text>
            <View style={styles.preferenceContent}>
              <Text style={styles.preferenceTitle}>Haptic Feedback</Text>
              <Text style={styles.preferenceSubtitle}>Vibration for interactions</Text>
            </View>
            <View style={styles.toggle}>
              <Text style={styles.toggleText}>ON</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Account Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🛡️ Account & Support</Text>
          
          <TouchableOpacity style={styles.actionItem}>
            <Text style={styles.actionIcon}>❓</Text>
            <Text style={styles.actionText}>Help & Support</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionItem}>
            <Text style={styles.actionIcon}>📄</Text>
            <Text style={styles.actionText}>Terms & Privacy Policy</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionItem}>
            <Text style={styles.actionIcon}>⭐</Text>
            <Text style={styles.actionText}>Rate SnapConnect</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionItem}>
            <Text style={styles.actionIcon}>🐛</Text>
            <Text style={styles.actionText}>Report a Bug</Text>
          </TouchableOpacity>
        </View>

        {/* App Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>ℹ️ About</Text>
          
          <View style={styles.infoItem}>
            <Text style={styles.infoIcon}>📱</Text>
            <View style={styles.infoContent}>
              <Text style={styles.infoTitle}>SnapConnect Version</Text>
              <Text style={styles.infoSubtitle}>v2.1.0 (Demo Mode)</Text>
            </View>
          </View>

          <View style={styles.infoItem}>
            <Text style={styles.infoIcon}>🏗️</Text>
            <View style={styles.infoContent}>
              <Text style={styles.infoTitle}>Build</Text>
              <Text style={styles.infoSubtitle}>AI-Powered Edition</Text>
            </View>
          </View>

          <View style={styles.infoItem}>
            <Text style={styles.infoIcon}>👨‍💻</Text>
            <View style={styles.infoContent}>
              <Text style={styles.infoTitle}>Powered by</Text>
              <Text style={styles.infoSubtitle}>React Native • OpenAI • LangChain</Text>
            </View>
          </View>
        </View>
      </ScrollView>
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
    paddingTop: 10,
    paddingHorizontal: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#424242',
  },
  backButton: {
    padding: 8,
  },
  backText: {
    fontSize: 24,
    color: '#FFFFFF',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  saveButton: {
    backgroundColor: '#FFDD3A',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  saveText: {
    color: '#000000',
    fontSize: 14,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#9E9E9E',
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: '#161618',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: '#FFFFFF',
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#424242',
  },
  bioInput: {
    height: 80,
    textAlignVertical: 'top',
  },
  currentSelection: {
    alignItems: 'center',
    marginBottom: 20,
    backgroundColor: '#161618',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#424242',
  },
  currentAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FFDD3A',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  currentAvatarEmoji: {
    fontSize: 28,
  },
  currentStreak: {
    alignItems: 'center',
    backgroundColor: '#0D0D0F',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  currentStreakEmoji: {
    fontSize: 24,
    marginBottom: 4,
  },
  streakNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFDD3A',
  },
  currentLabel: {
    fontSize: 12,
    color: '#9E9E9E',
    fontWeight: '600',
  },
  emojiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  emojiOption: {
    width: 45,
    height: 45,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    backgroundColor: '#161618',
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#424242',
  },
  emojiOptionSelected: {
    backgroundColor: '#FFDD3A',
    borderColor: '#FFDD3A',
  },
  emojiText: {
    fontSize: 20,
  },
  preferenceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#161618',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#424242',
  },
  preferenceIcon: {
    fontSize: 20,
    marginRight: 12,
    width: 24,
    textAlign: 'center',
  },
  preferenceContent: {
    flex: 1,
  },
  preferenceTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  preferenceSubtitle: {
    fontSize: 13,
    color: '#9E9E9E',
  },
  preferenceArrow: {
    fontSize: 16,
    color: '#9E9E9E',
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#161618',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#424242',
  },
  actionIcon: {
    fontSize: 20,
    marginRight: 12,
    width: 24,
    textAlign: 'center',
  },
  actionText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#FFFFFF',
  },
  toggle: {
    backgroundColor: '#4CAF50',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 4,
    minWidth: 40,
    alignItems: 'center',
  },
  toggleText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 1,
    backgroundColor: '#2A2A2A',
  },
  infoIcon: {
    fontSize: 18,
    marginRight: 12,
    width: 20,
    textAlign: 'center',
  },
  infoContent: {
    flex: 1,
  },
  infoTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 2,
  },
  infoSubtitle: {
    color: '#888888',
    fontSize: 14,
  },
}); 