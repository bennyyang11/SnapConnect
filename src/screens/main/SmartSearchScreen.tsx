import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  ActivityIndicator,
  Alert,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { searchSimilarContent, getPersonalizedRecommendations } from '../../services/aiFeatures';

const { width } = Dimensions.get('window');

export const SmartSearchScreen: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'search' | 'recommendations'>('search');

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      Alert.alert('Error', 'Please enter a search query');
      return;
    }

    setLoading(true);
    try {
      const results = await searchSimilarContent(searchQuery, undefined, 20);
      setSearchResults(results);
      
      if (results.length === 0) {
        Alert.alert('No Results', 'No similar content found. Try a different search term.');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to search content. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGetRecommendations = async () => {
    setLoading(true);
    try {
      // Example preferences - in a real app, these would come from user profile
      const userPreferences = ['fitness', 'travel', 'food', 'lifestyle', 'photography'];
      const results = await getPersonalizedRecommendations('current_user', userPreferences);
      setRecommendations(results);
      
      if (results.length === 0) {
        Alert.alert('No Recommendations', 'No personalized recommendations available yet. Try creating and saving some content first!');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to get recommendations. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderContentItem = (item: any, index: number) => (
    <View key={index} style={styles.contentItem}>
      <View style={styles.contentInfo}>
        <Text style={styles.contentScore}>
          Score: {Math.round((item.score || 0) * 100)}%
        </Text>
        <Text style={styles.contentCaption} numberOfLines={2}>
          {item.metadata?.caption || 'No caption'}
        </Text>
        <View style={styles.tagsContainer}>
          {(item.metadata?.tags || []).slice(0, 3).map((tag: string, tagIndex: number) => (
            <Text key={tagIndex} style={styles.tag}>
              #{tag}
            </Text>
          ))}
        </View>
        <Text style={styles.contentMeta}>
          Type: {item.metadata?.type || 'unknown'} • 
          {item.metadata?.timestamp ? new Date(item.metadata.timestamp).toLocaleDateString() : 'No date'}
        </Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>🔍 Smart Search</Text>
        <Text style={styles.subtitle}>AI-powered content discovery</Text>
      </View>

      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'search' && styles.activeTab]}
          onPress={() => setActiveTab('search')}
        >
          <Text style={[styles.tabText, activeTab === 'search' && styles.activeTabText]}>
            Search
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'recommendations' && styles.activeTab]}
          onPress={() => setActiveTab('recommendations')}
        >
          <Text style={[styles.tabText, activeTab === 'recommendations' && styles.activeTabText]}>
            For You
          </Text>
        </TouchableOpacity>
      </View>

      {/* Search Tab */}
      {activeTab === 'search' && (
        <View style={styles.tabContent}>
          <View style={styles.searchContainer}>
            <TextInput
              style={styles.searchInput}
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search for content... (e.g., 'sunny day', 'happy moment')"
              placeholderTextColor="#666"
              multiline
            />
            <TouchableOpacity
              style={styles.searchButton}
              onPress={handleSearch}
              disabled={loading}
            >
              <Text style={styles.searchButtonText}>
                {loading ? '🔍' : 'Search'}
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.resultsContainer} showsVerticalScrollIndicator={false}>
            {loading && (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#FFD700" />
                <Text style={styles.loadingText}>Searching with AI...</Text>
              </View>
            )}

            {!loading && searchResults.length > 0 && (
              <View>
                <Text style={styles.resultsHeader}>
                  Found {searchResults.length} similar items
                </Text>
                {searchResults.map((item, index) => renderContentItem(item, index))}
              </View>
            )}

            {!loading && searchQuery && searchResults.length === 0 && (
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateText}>No results found</Text>
                <Text style={styles.emptyStateSubtext}>
                  Try different keywords or create more content to improve search results
                </Text>
              </View>
            )}
          </ScrollView>
        </View>
      )}

      {/* Recommendations Tab */}
      {activeTab === 'recommendations' && (
        <View style={styles.tabContent}>
          <View style={styles.recommendationsHeader}>
            <Text style={styles.recommendationsTitle}>Personalized for You</Text>
            <TouchableOpacity
              style={styles.refreshButton}
              onPress={handleGetRecommendations}
              disabled={loading}
            >
              <Text style={styles.refreshButtonText}>
                {loading ? '🔄' : 'Refresh'}
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.resultsContainer} showsVerticalScrollIndicator={false}>
            {loading && (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#FFD700" />
                <Text style={styles.loadingText}>Getting recommendations...</Text>
              </View>
            )}

            {!loading && recommendations.length > 0 && (
              <View>
                <Text style={styles.resultsHeader}>
                  {recommendations.length} recommendations
                </Text>
                {recommendations.map((item, index) => renderContentItem(item, index))}
              </View>
            )}

            {!loading && recommendations.length === 0 && (
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateText}>No recommendations yet</Text>
                <Text style={styles.emptyStateSubtext}>
                  Create and save content with AI to get personalized recommendations
                </Text>
              </View>
            )}
          </ScrollView>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  header: {
    padding: 20,
    paddingTop: 60,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  title: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  subtitle: {
    color: '#FFD700',
    fontSize: 16,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#222',
    margin: 15,
    borderRadius: 10,
    padding: 5,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
  },
  activeTab: {
    backgroundColor: '#FFD700',
  },
  tabText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  activeTabText: {
    color: '#000000',
  },
  tabContent: {
    flex: 1,
    padding: 15,
  },
  searchContainer: {
    flexDirection: 'row',
    marginBottom: 20,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    backgroundColor: '#333',
    color: '#FFFFFF',
    padding: 15,
    borderRadius: 10,
    fontSize: 16,
    maxHeight: 100,
    borderWidth: 1,
    borderColor: '#555',
  },
  searchButton: {
    backgroundColor: '#FFD700',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderRadius: 10,
    justifyContent: 'center',
  },
  searchButtonText: {
    color: '#000000',
    fontSize: 16,
    fontWeight: 'bold',
  },
  recommendationsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  recommendationsTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
  },
  refreshButton: {
    backgroundColor: '#444',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 8,
  },
  refreshButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  resultsContainer: {
    flex: 1,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    color: '#FFD700',
    marginTop: 10,
    fontSize: 16,
  },
  resultsHeader: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 15,
  },
  contentItem: {
    backgroundColor: '#333',
    borderRadius: 12,
    padding: 15,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#555',
  },
  contentInfo: {
    flex: 1,
  },
  contentScore: {
    color: '#FFD700',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  contentCaption: {
    color: '#FFFFFF',
    fontSize: 16,
    marginBottom: 8,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 8,
  },
  tag: {
    color: '#FFD700',
    fontSize: 12,
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 6,
    marginBottom: 4,
  },
  contentMeta: {
    color: '#999',
    fontSize: 12,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyStateText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  emptyStateSubtext: {
    color: '#999',
    fontSize: 14,
    textAlign: 'center',
    paddingHorizontal: 30,
  },
}); 