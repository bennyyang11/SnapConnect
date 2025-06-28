import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Alert,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useAppStore } from '../../store/useAppStore';
import { RootStackParamList } from '../../types';
import WorkoutMemoryService, { WorkoutSearchResult, WorkoutSummary } from '../../services/workoutMemoryService';

type WorkoutSearchScreenNavigationProp = StackNavigationProp<RootStackParamList>;

export default function WorkoutSearchScreen() {
  const navigation = useNavigation<WorkoutSearchScreenNavigationProp>();
  const { user } = useAppStore();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<WorkoutSummary | null>(null);
  const [recentSearches, setRecentSearches] = useState<string[]>([
    'Show me my last arm day',
    'What workouts did I do last week?',
    'My chest workouts',
    'Leg day sessions',
    'When did I last do squats?'
  ]);

  const searchInputRef = useRef<TextInput>(null);

  const searchSuggestions = [
    '🏋️ Show me my last arm day',
    '📅 What workouts did I do last week?',
    '💪 My chest workouts this month',
    '🦵 Leg day sessions',
    '🏃‍♀️ My cardio workouts',
    '🔥 High intensity workouts',
    '📊 Show me my squat progress',
    '💯 My best workouts',
    '🗓️ Workouts from December',
    '🎯 Back and bicep sessions'
  ];

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      Alert.alert('Enter a search query', 'Please describe what workout memories you want to find.');
      return;
    }

    setIsSearching(true);
    try {
      console.log('🔍 Searching workout memories:', searchQuery);

      const results = await WorkoutMemoryService.searchWorkoutMemories(
        user?.id || 'demo-user',
        searchQuery,
        10
      );

      const summary = await WorkoutMemoryService.generateWorkoutSummary(
        searchQuery,
        results
      );

      setSearchResults(summary);

      if (!recentSearches.includes(searchQuery)) {
        setRecentSearches(prev => [searchQuery, ...prev.slice(0, 4)]);
      }

    } catch (error) {
      console.error('❌ Error searching workouts:', error);
      Alert.alert('Search Error', 'Failed to search workout memories. Please try again.');
    } finally {
      setIsSearching(false);
    }
  };

  const handleSuggestionPress = (suggestion: string) => {
    const cleanSuggestion = suggestion.replace(/[🏋️📅💪🦵🏃‍♀️🔥📊💯🗓️🎯]/g, '').trim();
    setSearchQuery(cleanSuggestion);
    searchInputRef.current?.focus();
  };

  const formatDate = (dateString: string): string => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    } catch {
      return dateString;
    }
  };

  const renderWorkoutResult = (result: WorkoutSearchResult, index: number) => (
    <View key={result.entry.id} style={styles.workoutCard}>
      <View style={styles.workoutHeader}>
        <View style={styles.workoutInfo}>
          <Text style={styles.workoutDate}>{formatDate(result.entry.workoutDate)}</Text>
          <Text style={styles.similarityScore}>
            {Math.round(result.similarity * 100)}% match
          </Text>
        </View>
        <View style={styles.workoutType}>
          <Text style={styles.workoutTypeText}>
            {result.entry.mediaType === 'photo' ? '📸' : '🎥'}
          </Text>
        </View>
      </View>

      <Text style={styles.workoutCaption}>{result.entry.caption}</Text>

      {result.entry.muscleGroups.length > 0 && (
        <View style={styles.tagsContainer}>
          <Text style={styles.tagsLabel}>Muscle Groups:</Text>
          <View style={styles.tags}>
            {result.entry.muscleGroups.map((muscle, idx) => (
              <View key={idx} style={styles.tag}>
                <Text style={styles.tagText}>{muscle}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {result.entry.exercises.length > 0 && (
        <View style={styles.tagsContainer}>
          <Text style={styles.tagsLabel}>Exercises:</Text>
          <View style={styles.tags}>
            {result.entry.exercises.slice(0, 3).map((exercise, idx) => (
              <View key={idx} style={[styles.tag, styles.exerciseTag]}>
                <Text style={styles.tagText}>{exercise}</Text>
              </View>
            ))}
            {result.entry.exercises.length > 3 && (
              <View style={styles.tag}>
                <Text style={styles.tagText}>+{result.entry.exercises.length - 3} more</Text>
              </View>
            )}
          </View>
        </View>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>SnapSearch AI</Text>
          <Text style={styles.headerSubtitle}>🏋️ Workout Memory Recall</Text>
        </View>
        <View style={styles.headerRight} />
      </View>

      <KeyboardAvoidingView 
        style={styles.content}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.searchContainer}>
          <View style={styles.searchInputContainer}>
            <Text style={styles.searchIcon}>🔍</Text>
            <TextInput
              ref={searchInputRef}
              style={styles.searchInput}
              placeholder="Ask about your workout history..."
              placeholderTextColor="#9E9E9E"
              value={searchQuery}
              onChangeText={setSearchQuery}
              onSubmitEditing={handleSearch}
              returnKeyType="search"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity
                style={styles.clearButton}
                onPress={() => setSearchQuery('')}
              >
                <Text style={styles.clearText}>✕</Text>
              </TouchableOpacity>
            )}
          </View>
          
          <TouchableOpacity
            style={[styles.searchButton, isSearching && styles.searchButtonDisabled]}
            onPress={handleSearch}
            disabled={isSearching}
          >
            {isSearching ? (
              <ActivityIndicator size="small" color="#000000" />
            ) : (
              <Text style={styles.searchButtonText}>Search</Text>
            )}
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
          {searchResults ? (
            <View style={styles.resultsContainer}>
              <View style={styles.summaryContainer}>
                <Text style={styles.summaryTitle}>🤖 AI Summary</Text>
                <Text style={styles.summaryText}>{searchResults.summary}</Text>
                
                {searchResults.totalWorkouts > 0 && (
                  <View style={styles.summaryStats}>
                    <View style={styles.stat}>
                      <Text style={styles.statNumber}>{searchResults.totalWorkouts}</Text>
                      <Text style={styles.statLabel}>Workouts Found</Text>
                    </View>
                    {searchResults.muscleGroups.length > 0 && (
                      <View style={styles.stat}>
                        <Text style={styles.statNumber}>{searchResults.muscleGroups.length}</Text>
                        <Text style={styles.statLabel}>Muscle Groups</Text>
                      </View>
                    )}
                  </View>
                )}
              </View>

              {searchResults.workouts.length > 0 && (
                <View style={styles.workoutsContainer}>
                  <Text style={styles.workoutsTitle}>📋 Your Workout Memories</Text>
                  {searchResults.workouts.map((result, index) => 
                    renderWorkoutResult(result, index)
                  )}
                </View>
              )}
            </View>
          ) : !isSearching ? (
            <View style={styles.suggestionsContainer}>
              <View style={styles.suggestionSection}>
                <Text style={styles.suggestionTitle}>💡 Try asking...</Text>
                {searchSuggestions.map((suggestion, index) => (
                  <TouchableOpacity
                    key={index}
                    style={styles.suggestionItem}
                    onPress={() => handleSuggestionPress(suggestion)}
                  >
                    <Text style={styles.suggestionText}>{suggestion}</Text>
                    <Text style={styles.suggestionArrow}>→</Text>
                  </TouchableOpacity>
                ))}
              </View>

              {recentSearches.length > 0 && (
                <View style={styles.suggestionSection}>
                  <Text style={styles.suggestionTitle}>🕒 Recent Searches</Text>
                  {recentSearches.map((search, index) => (
                    <TouchableOpacity
                      key={index}
                      style={styles.suggestionItem}
                      onPress={() => setSearchQuery(search)}
                    >
                      <Text style={styles.suggestionText}>{search}</Text>
                      <Text style={styles.suggestionArrow}>→</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              <View style={styles.howItWorksContainer}>
                <Text style={styles.howItWorksTitle}>🧠 How SnapSearch AI Works</Text>
                <Text style={styles.howItWorksText}>
                  SnapSearch AI automatically remembers your workout posts and lets you search them using natural language. 
                  {'\n\n'}
                  Post a snap with workout-related captions like "leg day 💪" or "bench press 3x12" and SnapSearch will remember it!
                  {'\n\n'}
                  Then ask questions like "What workouts did I do last week?" or "Show me my chest workouts" to instantly find your fitness memories.
                </Text>
              </View>
            </View>
          ) : (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#FFD700" />
              <Text style={styles.loadingText}>Searching your workout memories...</Text>
              <Text style={styles.loadingSubtext}>Using AI to find the best matches</Text>
            </View>
          )}
        </ScrollView>
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
    backgroundColor: '#161618',
    borderBottomWidth: 1,
    borderBottomColor: '#FFD700',
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
  headerTitleContainer: {
    alignItems: 'center',
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  headerSubtitle: {
    color: '#FFD700',
    fontSize: 12,
    marginTop: 2,
  },
  headerRight: {
    width: 30,
  },
  content: {
    flex: 1,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#161618',
    borderBottomWidth: 1,
    borderBottomColor: '#424242',
    gap: 12,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2A2A2A',
    borderRadius: 25,
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#FFD700',
  },
  searchIcon: {
    fontSize: 16,
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 16,
  },
  clearButton: {
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clearText: {
    color: '#9E9E9E',
    fontSize: 14,
  },
  searchButton: {
    backgroundColor: '#FFD700',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 20,
    minWidth: 80,
    alignItems: 'center',
  },
  searchButtonDisabled: {
    backgroundColor: '#666666',
  },
  searchButtonText: {
    color: '#000000',
    fontSize: 14,
    fontWeight: 'bold',
  },
  scrollContainer: {
    flex: 1,
  },
  resultsContainer: {
    padding: 20,
  },
  summaryContainer: {
    backgroundColor: '#1A1A1A',
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#FFD700',
  },
  summaryTitle: {
    color: '#FFD700',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  summaryText: {
    color: '#FFFFFF',
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 15,
  },
  summaryStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  stat: {
    alignItems: 'center',
  },
  statNumber: {
    color: '#FFD700',
    fontSize: 24,
    fontWeight: 'bold',
  },
  statLabel: {
    color: '#9E9E9E',
    fontSize: 12,
    marginTop: 4,
  },
  workoutsContainer: {
    marginTop: 10,
  },
  workoutsTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  workoutCard: {
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#424242',
  },
  workoutHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  workoutInfo: {
    flex: 1,
  },
  workoutDate: {
    color: '#FFD700',
    fontSize: 14,
    fontWeight: 'bold',
  },
  similarityScore: {
    color: '#9E9E9E',
    fontSize: 12,
    marginTop: 2,
  },
  workoutType: {
    backgroundColor: '#2A2A2A',
    borderRadius: 15,
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  workoutTypeText: {
    fontSize: 16,
  },
  workoutCaption: {
    color: '#FFFFFF',
    fontSize: 16,
    lineHeight: 22,
    marginBottom: 12,
  },
  tagsContainer: {
    marginTop: 8,
  },
  tagsLabel: {
    color: '#9E9E9E',
    fontSize: 12,
    marginBottom: 6,
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  tag: {
    backgroundColor: '#2A2A2A',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FFD700',
  },
  exerciseTag: {
    borderColor: '#4CAF50',
  },
  tagText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '500',
  },
  suggestionsContainer: {
    padding: 20,
  },
  suggestionSection: {
    marginBottom: 30,
  },
  suggestionTitle: {
    color: '#FFD700',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1A1A1A',
    padding: 15,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#424242',
  },
  suggestionText: {
    color: '#FFFFFF',
    fontSize: 15,
    flex: 1,
  },
  suggestionArrow: {
    color: '#FFD700',
    fontSize: 16,
    fontWeight: 'bold',
  },
  howItWorksContainer: {
    backgroundColor: '#1A1A1A',
    borderRadius: 15,
    padding: 20,
    borderWidth: 1,
    borderColor: '#424242',
  },
  howItWorksTitle: {
    color: '#FFD700',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  howItWorksText: {
    color: '#9E9E9E',
    fontSize: 14,
    lineHeight: 20,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    color: '#FFFFFF',
    fontSize: 18,
    marginTop: 20,
    textAlign: 'center',
  },
  loadingSubtext: {
    color: '#9E9E9E',
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
  },
}); 