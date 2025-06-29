import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Alert,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import FriendshipTimelineCard from '../../components/friendship/FriendshipTimelineCard';
import FriendshipMemoryService, { 
  FriendshipStats, 
  SharedMoment,
  FriendshipTimeline
} from '../../services/friendshipMemoryService';
import { useAppStore } from '../../store/useAppStore';

export default function FriendshipMemoryScreen() {
  const navigation = useNavigation();
  const { user } = useAppStore();
  const [friendships, setFriendships] = useState<FriendshipStats[]>([]);
  const [timelines, setTimelines] = useState<FriendshipTimeline[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SharedMoment[]>([]);
  const [selectedTab, setSelectedTab] = useState<'timeline' | 'insights' | 'search'>('timeline');
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    loadFriendshipData();
  }, [user]);

  const loadFriendshipData = () => {
    if (!user?.id) return;

    // Load friendship stats
    const userFriendships = FriendshipMemoryService.getUserFriendships(user.id);
    setFriendships(userFriendships);

    // Load timelines for each friendship
    const friendshipTimelines: FriendshipTimeline[] = [];
    userFriendships.forEach(friendship => {
      const timeline = FriendshipMemoryService.getFriendshipTimeline(user.id, friendship.friendId);
      if (timeline) {
        friendshipTimelines.push(timeline);
      }
    });
    setTimelines(friendshipTimelines);
  };

  const handleSearch = async () => {
    if (!searchQuery.trim() || !user?.id) return;

    setIsSearching(true);
    try {
      const results = await FriendshipMemoryService.searchSimilarMoments(searchQuery, user.id);
      setSearchResults(results);
      
      if (results.length === 0) {
        Alert.alert('Search Results', 'No memories found for your search. Try sharing some snaps with friends first!');
      }
      
    } catch (error) {
      console.error('Search error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      Alert.alert('Search Error', `Unable to search memories: ${errorMessage}. Check the console for details.`);
    } finally {
      setIsSearching(false);
    }
  };

  const simulateFriendshipData = async () => {
    if (!user?.id) return;

    Alert.alert(
      '📸 Create Demo Friendship Data',
      'This will create sample friendship interactions to demonstrate the AI Memory features. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Create Demo', 
          onPress: async () => {
            try {
              console.log('🎬 Creating demo friendship data...');
              
              // Create sample friendship interactions
              const demoFriend = 'alex_demo_2024';
              const demoSnaps = [
                { caption: "Beach day! 🏖️", mood: "happy", tags: ["beach", "fun"] },
                { caption: "Coffee run ☕", mood: "energetic", tags: ["coffee", "morning"] },
                { caption: "Movie night 🎬", mood: "relaxed", tags: ["movies", "chill"] },
                { caption: "Hiking adventure! 🥾", mood: "adventurous", tags: ["hiking", "nature"] },
                { caption: "Study session 📚", mood: "focused", tags: ["study", "productive"] },
                { caption: "Late night gaming 🎮", mood: "playful", tags: ["gaming", "night"] },
                { caption: "Workout time! 💪", mood: "motivated", tags: ["fitness", "gym"] },
                { caption: "Pizza party! 🍕", mood: "happy", tags: ["food", "party"] },
              ];

              for (let i = 0; i < demoSnaps.length; i++) {
                await FriendshipMemoryService.trackFriendshipSnap(
                  user.id,
                  demoFriend,
                  {
                    ...demoSnaps[i],
                    timestamp: new Date(Date.now() - (7 - i) * 24 * 60 * 60 * 1000) // Spread over last week
                  }
                );
                
                // Add some response snaps
                if (i % 2 === 0) {
                  await FriendshipMemoryService.trackFriendshipSnap(
                    demoFriend,
                    user.id,
                    {
                      caption: `Great time! Love these moments 😊`,
                      mood: "happy",
                      tags: ["response", "friendship"]
                    }
                  );
                }
              }

              loadFriendshipData();
              Alert.alert('✅ Demo Created!', 'Sample friendship data has been created. Check out your AI-powered friendship insights!');
              
            } catch (error) {
              console.error('Error creating demo data:', error);
              Alert.alert('Error', 'Failed to create demo data. Please try again.');
            }
          }
        }
      ]
    );
  };



  const renderTimelineTab = () => (
    <ScrollView style={styles.scrollContainer}>
      {/* Header Stats */}
      <View style={styles.headerStats}>
        <Text style={styles.screenTitle}>🤖 Friendship Memory AI</Text>
        <Text style={styles.screenSubtitle}>
          AI-powered insights into your closest connections
        </Text>
        
        {friendships.length > 0 ? (
          <View style={styles.overallStats}>
            <Text style={styles.overallStatsText}>
              You have {friendships.length} active friendships with AI-tracked memories
            </Text>
          </View>
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>
              🌟 Start snapping with friends to build AI-powered memory timelines!
            </Text>
            <TouchableOpacity style={styles.demoButton} onPress={simulateFriendshipData}>
              <Text style={styles.demoButtonText}>📸 Create Demo Data</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Friendship Timeline Cards */}
      {timelines.map((timeline) => (
        <FriendshipTimelineCard
          key={timeline.friendId}
          friendName={timeline.friendName}
          stats={timeline.stats}
          moments={timeline.highlights}
          insights={timeline.insights}
          onViewFullTimeline={() => {
            Alert.alert(
              '📚 Full Timeline',
              `View complete timeline for ${timeline.friendName}?\n\nThis would open a detailed view with all ${timeline.moments.length} shared moments, insights, and patterns.`,
              [
                { text: 'Cancel' },
                { text: 'View Timeline', onPress: () => console.log('Open full timeline') }
              ]
            );
          }}
        />
      ))}

      {/* Quick Actions */}
      {friendships.length > 0 && (
        <View style={styles.quickActions}>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => setSelectedTab('search')}
          >
            <Text style={styles.actionButtonText}>🔍 Search Memories</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => setSelectedTab('insights')}
          >
            <Text style={styles.actionButtonText}>🧠 AI Insights</Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );

  const renderInsightsTab = () => {
    const patterns = user?.id ? FriendshipMemoryService.getTrendingPatterns(user.id) : null;
    
    return (
      <ScrollView style={styles.scrollContainer}>
        <View style={styles.insightsContainer}>
          <Text style={styles.sectionTitle}>🧠 Your Friendship Patterns</Text>
          
          {patterns ? (
            <>
              <View style={styles.patternCard}>
                <Text style={styles.patternTitle}>⏰ Most Active Time</Text>
                <Text style={styles.patternValue}>{patterns.mostActiveTime}</Text>
                <Text style={styles.patternDescription}>
                  You and your friends are most active during {patterns.mostActiveTime} hours
                </Text>
              </View>

              <View style={styles.patternCard}>
                <Text style={styles.patternTitle}>🎯 Favorite Activity</Text>
                <Text style={styles.patternValue}>{patterns.favoriteActivity}</Text>
                <Text style={styles.patternDescription}>
                  Your most common shared mood across all friendships
                </Text>
              </View>

              {patterns.growingFriendships.length > 0 && (
                <View style={styles.patternCard}>
                  <Text style={styles.patternTitle}>📈 Growing Friendships</Text>
                  <Text style={styles.patternValue}>
                    {patterns.growingFriendships.join(', ')}
                  </Text>
                  <Text style={styles.patternDescription}>
                    These friendships are becoming more active recently
                  </Text>
                </View>
              )}

              <View style={styles.patternCard}>
                <Text style={styles.patternTitle}>😊 Common Moods</Text>
                <Text style={styles.patternValue}>
                  {patterns.commonMoods.join(' • ')}
                </Text>
                <Text style={styles.patternDescription}>
                  The emotions you most often share with friends
                </Text>
              </View>
            </>
          ) : (
            <Text style={styles.emptyInsights}>
              Start sharing snaps to generate AI insights about your friendship patterns!
            </Text>
          )}
        </View>
      </ScrollView>
    );
  };

  const renderSearchTab = () => (
    <ScrollView style={styles.scrollContainer}>
      <View style={styles.searchContainer}>
        <Text style={styles.sectionTitle}>🔍 Search Your Memories</Text>
        <Text style={styles.searchDescription}>
          Use AI to find specific moments based on descriptions, moods, or activities
        </Text>
        
        <View style={styles.searchInputContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="e.g., 'beach day', 'coffee morning', 'fun times'"
            placeholderTextColor="#888"
            value={searchQuery}
            onChangeText={setSearchQuery}
            multiline={false}
          />
          <TouchableOpacity 
            style={[styles.searchButton, isSearching && styles.searchButtonDisabled]}
            onPress={handleSearch}
            disabled={isSearching}
          >
            {isSearching ? (
              <ActivityIndicator color="#000" size="small" />
            ) : (
              <Text style={styles.searchButtonText}>Search</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Search Results */}
        {searchResults.length > 0 && (
          <View style={styles.searchResults}>
            <Text style={styles.searchResultsTitle}>Found {searchResults.length} matching moments:</Text>
            {searchResults.map((moment) => (
              <View key={moment.id} style={styles.searchResultCard}>
                <Text style={styles.resultTheme}>{moment.theme}</Text>
                <Text style={styles.resultSummary}>{moment.summary}</Text>
                <Text style={styles.resultDate}>
                  {moment.timestamp.toLocaleDateString()} • {moment.snaps.length} snaps
                </Text>
                <View style={styles.resultTags}>
                  {moment.tags.map((tag, index) => (
                    <Text key={index} style={styles.resultTag}>#{tag}</Text>
                  ))}
                </View>
              </View>
            ))}
          </View>
        )}

        {searchQuery && searchResults.length === 0 && !isSearching && (
          <Text style={styles.noResults}>
            No matching moments found. Try different keywords!
          </Text>
        )}
      </View>
    </ScrollView>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000000" />
      
      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        <TouchableOpacity 
          style={[styles.tab, selectedTab === 'timeline' && styles.activeTab]}
          onPress={() => setSelectedTab('timeline')}
        >
          <Text style={[styles.tabText, selectedTab === 'timeline' && styles.activeTabText]}>
            📚 Timeline
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.tab, selectedTab === 'insights' && styles.activeTab]}
          onPress={() => setSelectedTab('insights')}
        >
          <Text style={[styles.tabText, selectedTab === 'insights' && styles.activeTabText]}>
            🧠 Insights
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.tab, selectedTab === 'search' && styles.activeTab]}
          onPress={() => setSelectedTab('search')}
        >
          <Text style={[styles.tabText, selectedTab === 'search' && styles.activeTabText]}>
            🔍 Search
          </Text>
        </TouchableOpacity>
      </View>

      {/* Tab Content */}
      {selectedTab === 'timeline' && renderTimelineTab()}
      {selectedTab === 'insights' && renderInsightsTab()}
      {selectedTab === 'search' && renderSearchTab()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0D0D0F',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    marginHorizontal: 20,
    marginTop: 20,
    borderRadius: 15,
    padding: 5,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 10,
  },
  activeTab: {
    backgroundColor: '#9370DB',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#CCCCCC',
  },
  activeTabText: {
    color: '#FFFFFF',
  },
  scrollContainer: {
    flex: 1,
  },
  headerStats: {
    padding: 20,
    alignItems: 'center',
  },
  screenTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 8,
  },
  screenSubtitle: {
    fontSize: 16,
    color: '#CCCCCC',
    textAlign: 'center',
    marginBottom: 20,
  },
  overallStats: {
    backgroundColor: 'rgba(64, 224, 208, 0.1)',
    borderRadius: 15,
    padding: 15,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#40E0D0',
  },
  overallStatsText: {
    fontSize: 14,
    color: '#40E0D0',
    textAlign: 'center',
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    padding: 20,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#CCCCCC',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 24,
  },
  demoButton: {
    backgroundColor: '#FFD700',
    borderRadius: 15,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  demoButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  actionButton: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 15,
    padding: 15,
    marginHorizontal: 5,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  insightsContainer: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 20,
    textAlign: 'center',
  },
  patternCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 15,
    padding: 20,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  patternTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFD700',
    marginBottom: 8,
  },
  patternValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
    textTransform: 'capitalize',
  },
  patternDescription: {
    fontSize: 14,
    color: '#CCCCCC',
    lineHeight: 20,
  },
  emptyInsights: {
    fontSize: 16,
    color: '#CCCCCC',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  searchContainer: {
    padding: 20,
  },
  searchDescription: {
    fontSize: 14,
    color: '#CCCCCC',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
  },
  searchInputContainer: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  searchInput: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 15,
    color: '#FFFFFF',
    fontSize: 16,
    marginRight: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  searchButton: {
    backgroundColor: '#9370DB',
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchButtonDisabled: {
    backgroundColor: 'rgba(147, 112, 219, 0.5)',
  },
  searchButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  searchResults: {
    marginTop: 10,
  },
  searchResultsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 15,
  },
  searchResultCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  resultTheme: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFD700',
    marginBottom: 6,
  },
  resultSummary: {
    fontSize: 14,
    color: '#FFFFFF',
    marginBottom: 8,
    lineHeight: 20,
  },
  resultDate: {
    fontSize: 12,
    color: '#CCCCCC',
    marginBottom: 10,
  },
  resultTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  resultTag: {
    fontSize: 12,
    color: '#9370DB',
    backgroundColor: 'rgba(147, 112, 219, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginRight: 8,
    marginBottom: 4,
  },
  noResults: {
    fontSize: 14,
    color: '#CCCCCC',
    textAlign: 'center',
    fontStyle: 'italic',
    marginTop: 20,
  },
}); 