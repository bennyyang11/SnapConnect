import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  SafeAreaView,
  RefreshControl,
  Animated,
  Dimensions,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAppStore } from '../../store/useAppStore';
import DiscoverAIService, { FitnessContent } from '../../services/discoverAIService';
import UserInteractionService from '../../services/userInteractionService';

const { width } = Dimensions.get('window');

export default function DiscoverScreen() {
  const navigation = useNavigation();
  const { user } = useAppStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [content, setContent] = useState<FitnessContent[]>([]);
  const [allContent, setAllContent] = useState<FitnessContent[]>([]); // Store all content for search
  const [activeTab, setActiveTab] = useState<'trending' | 'recommended' | 'categories'>('trending');
  const [isAILoading, setIsAILoading] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [userInsights, setUserInsights] = useState<string>('');
  const [isSearching, setIsSearching] = useState(false);
  
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const categories = [
    'Workout Routines', 'Nutrition & Diet', 'Supplements', 'Exercise Techniques',
    'Recovery & Rest', 'Mental Health', 'Equipment Reviews', 'Meal Prep',
    'Weight Loss', 'Muscle Building', 'Cardio Training', 'Strength Training'
  ];

  const contentTypes = [
    { type: 'article', emoji: '📰', label: 'Articles' },
    { type: 'video', emoji: '🎥', label: 'Videos' },
    { type: 'tip', emoji: '💡', label: 'Tips' },
    { type: 'recipe', emoji: '🍽️', label: 'Recipes' },
    { type: 'workout_plan', emoji: '💪', label: 'Workouts' },
    { type: 'product_review', emoji: '⭐', label: 'Reviews' }
  ];

  useEffect(() => {
    // Load fallback content immediately to show something to the user
    console.log('🚀 Loading Discover screen with immediate fallback content');
    setContent(getFallbackContent());
    
    // Start animations
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();

    // Try to load AI content in the background (non-blocking)
    loadAIContentInBackground();
    loadUserInsights();
  }, []);

  const loadAIContentInBackground = async () => {
    try {
      console.log('🤖 Attempting to load AI content in background...');
      
      // Add a small delay to let the UI render first
      setTimeout(async () => {
        setIsAILoading(true);
        try {
          const aiContent = await DiscoverAIService.generateTrendingContent(3); // Start with fewer items
          
          if (aiContent.length > 0) {
            console.log('🎉 AI content loaded successfully, replacing fallback content');
            const mixedContent = [...aiContent, ...getFallbackContent().slice(0, 2)]; // Mix AI and fallback
            setContent(mixedContent);
            setAllContent(mixedContent); // Update search content
          } else {
            console.log('📝 AI content generation returned empty, keeping fallback content');
          }
        } catch (error) {
          console.log('🔄 AI content generation failed, keeping fallback content:', error);
        } finally {
          setIsAILoading(false);
        }
      }, 1000); // 1 second delay
      
    } catch (error) {
      console.log('🔄 Background AI loading failed:', error);
      setIsAILoading(false);
    }
  };

  useEffect(() => {
    // Clear search when switching tabs
    if (searchQuery.length > 0) {
      setSearchQuery('');
    }
    
    if (activeTab === 'recommended') {
      loadRecommendedContent();
    } else if (activeTab === 'trending') {
      loadTrendingContent();
    }
  }, [activeTab]);

  // Search functionality with debouncing
  useEffect(() => {
    const searchTimeout = setTimeout(() => {
      if (searchQuery.length > 0) {
        handleSearch(searchQuery);
      } else {
        // Reset to original content when search is cleared
        setContent(allContent);
        setIsSearching(false);
      }
    }, 500); // 500ms debounce

    return () => clearTimeout(searchTimeout);
  }, [searchQuery, allContent]);

  const handleSearch = async (query: string) => {
    if (!query.trim()) return;
    
    setIsSearching(true);
    console.log('🔍 Searching for:', query);

    try {
      // Track the search query for personalization
      await UserInteractionService.trackSearchQuery(
        user?.id || 'demo-user',
        query.trim()
      );

      // Filter existing content first
      const filteredContent = allContent.filter(item =>
        item.title.toLowerCase().includes(query.toLowerCase()) ||
        item.description.toLowerCase().includes(query.toLowerCase()) ||
        item.category.toLowerCase().includes(query.toLowerCase()) ||
        item.tags.some(tag => tag.toLowerCase().includes(query.toLowerCase())) ||
        item.content.toLowerCase().includes(query.toLowerCase())
      );

      console.log(`🎯 Found ${filteredContent.length} matching items in existing content`);

      // If we have good matches, show them
      if (filteredContent.length > 0) {
        setContent(filteredContent);
        
        // Track search result count
        await UserInteractionService.trackSearchQuery(
          user?.id || 'demo-user',
          query.trim(),
          filteredContent.length
        );
      } else {
        // No matches found, generate multiple AI articles for the search query
        console.log('🤖 No matches found, generating multiple AI articles for search query...');
        
        const searchResults = await DiscoverAIService.generateMultipleSearchResults(query, 4);
        
        if (searchResults.length > 0) {
          console.log(`✅ Generated ${searchResults.length} AI articles for search:`, searchResults.map(item => item.title));
          setContent(searchResults);
          
          // Add to all content for future searches
          setAllContent(prev => [...searchResults, ...prev]);
          
          // Track search result count
          await UserInteractionService.trackSearchQuery(
            user?.id || 'demo-user',
            query.trim(),
            searchResults.length
          );
          
          // Track search interactions for all generated content
          searchResults.forEach(async (aiContent) => {
            await UserInteractionService.trackInteraction(
              user?.id || 'demo-user',
              aiContent.id,
              'view',
              aiContent,
              { source: 'search_generated' }
            );
          });
        } else {
          // Show empty state
          setContent([]);
          
          // Track failed search
          await UserInteractionService.trackSearchQuery(
            user?.id || 'demo-user',
            query.trim(),
            0
          );
        }
      }
    } catch (error) {
      console.error('❌ Error in search:', error);
      setContent([]);
    } finally {
      setIsSearching(false);
    }
  };

  const loadInitialContent = async () => {
    setIsLoading(true);
    try {
      console.log('🔄 Loading initial content...');
      
      // Try to generate AI content, but fallback to demo content if it fails
      const trendingContent = await DiscoverAIService.generateTrendingContent(6);
      console.log('✅ Generated trending content:', trendingContent.length, 'items');
      
      const contentToUse = trendingContent.length > 0 ? trendingContent : getFallbackContent();
      setContent(contentToUse);
      setAllContent(contentToUse); // Store for search functionality
    } catch (error) {
      console.error('❌ Error loading content:', error);
      console.log('🔄 Using fallback content due to error');
      const fallbackContent = getFallbackContent();
      setContent(fallbackContent);
      setAllContent(fallbackContent);
    } finally {
      setIsLoading(false);
    }
  };

  const getFallbackContent = (): FitnessContent[] => {
    return [
      {
        id: 'fallback_1',
        type: 'article',
        title: 'The Complete Guide to HIIT Workouts',
        description: 'Discover high-intensity interval training techniques that maximize your workout efficiency and burn calories faster.',
        content: `High-Intensity Interval Training (HIIT) is one of the most effective ways to get fit quickly! 💪

🔥 What is HIIT?
HIIT alternates between short bursts of intense activity and recovery periods. This approach:
- Burns more calories in less time
- Improves cardiovascular health
- Builds strength and endurance
- Can be done anywhere, no equipment needed

⏰ Sample 15-Minute HIIT Workout:
1. Jumping Jacks - 30 seconds
2. Rest - 30 seconds
3. Burpees - 30 seconds
4. Rest - 30 seconds
5. High Knees - 30 seconds
6. Rest - 30 seconds
Repeat 3 times!

💡 Pro Tips:
- Start with 2-3 sessions per week
- Focus on proper form over speed
- Stay hydrated throughout
- Listen to your body and rest when needed

Ready to transform your fitness routine? Give HIIT a try today! 🚀`,
        category: 'Cardio Training',
        tags: ['hiit', 'cardio', 'beginner', 'workout'],
        difficulty: 'intermediate',
        duration: '15 min',
        calories: 120,
        thumbnailEmoji: '🔥',
        author: 'SnapFit AI',
        rating: 4.8,
        viewCount: 45230,
        createdAt: new Date(),
        engagementScore: 0.85
      },
      {
        id: 'fallback_2',
        type: 'recipe',
        title: 'Post-Workout Protein Smoothie Bowl',
        description: 'A delicious and nutritious smoothie bowl recipe perfect for muscle recovery after your workout.',
        content: `Fuel your recovery with this amazing protein smoothie bowl! 🥤

🍓 Ingredients:
- 1 frozen banana
- 1/2 cup frozen berries
- 1 scoop vanilla protein powder
- 1/2 cup Greek yogurt
- 1/4 cup almond milk
- 1 tbsp almond butter

🥣 Toppings:
- Fresh berries
- Granola
- Chia seeds
- Coconut flakes
- Sliced almonds

👨‍🍳 Instructions:
1. Blend frozen fruits with protein powder, yogurt, and almond milk until thick
2. Pour into a bowl
3. Add your favorite toppings
4. Enjoy within 30 minutes post-workout for optimal recovery!

📊 Nutrition Facts:
- Protein: 35g
- Carbs: 42g
- Calories: 380
- Perfect 3:1 carb to protein ratio for recovery

This smoothie bowl provides everything your muscles need to recover and grow stronger! 💪`,
        category: 'Nutrition & Diet',
        tags: ['recipe', 'protein', 'recovery', 'smoothie'],
        difficulty: 'beginner',
        duration: '5 min',
        thumbnailEmoji: '🥤',
        author: 'SnapFit AI',
        rating: 4.9,
        viewCount: 28940,
        createdAt: new Date(),
        engagementScore: 0.92
      },
      {
        id: 'fallback_3',
        type: 'tip',
        title: 'Perfect Push-Up Form',
        description: 'Master the fundamentals of push-ups with proper form to maximize results and prevent injury.',
        content: `Perfect your push-up form with these essential tips! 💪

🎯 Proper Form Checklist:
✅ Hands slightly wider than shoulders
✅ Body in straight plank position
✅ Core engaged throughout
✅ Lower chest to floor (not just head)
✅ Push up in controlled motion
✅ Breathe in going down, out going up

❌ Common Mistakes:
- Sagging hips or piked butt
- Partial range of motion
- Hands too wide or narrow
- Rushing the movement

🔄 Progression Tips:
Beginner: Wall push-ups → Knee push-ups → Full push-ups
Advanced: Diamond push-ups → Archer push-ups → One-arm push-ups

Remember: Quality over quantity! 10 perfect push-ups beat 20 sloppy ones every time! 🏆`,
        category: 'Exercise Techniques',
        tags: ['tip', 'push-ups', 'form', 'strength'],
        difficulty: 'beginner',
        thumbnailEmoji: '💡',
        author: 'SnapFit AI',
        rating: 4.7,
        viewCount: 67800,
        createdAt: new Date(),
        engagementScore: 0.78
      },
      {
        id: 'fallback_4',
        type: 'workout_plan',
        title: 'Beginner Full Body Workout',
        description: 'A complete full-body workout designed for beginners to build strength and confidence in the gym.',
        content: `Start your fitness journey with this beginner-friendly full body workout! 🏋️‍♀️

🎯 Workout Overview:
- Frequency: 3x per week
- Duration: 30-45 minutes
- Equipment: Dumbbells or bodyweight
- Rest: 60-90 seconds between sets

💪 The Workout:

**Upper Body (2 sets each)**
1. Push-ups: 8-12 reps
2. Dumbbell rows: 10-15 reps
3. Shoulder press: 8-12 reps
4. Tricep dips: 8-12 reps

**Lower Body (2 sets each)**
1. Bodyweight squats: 12-15 reps
2. Lunges: 10 reps each leg
3. Glute bridges: 12-15 reps
4. Calf raises: 15-20 reps

**Core (2 sets each)**
1. Plank: 30-60 seconds
2. Modified crunches: 10-15 reps
3. Bird dogs: 10 each side

🎯 Progression Tips:
- Week 1-2: Focus on form
- Week 3-4: Increase reps
- Week 5+: Add weight or advanced variations

Remember: Consistency beats perfection! Show up and do your best! 🌟`,
        category: 'Workout Routines',
        tags: ['workout_plan', 'beginner', 'full_body', 'strength'],
        difficulty: 'beginner',
        duration: '30 min',
        calories: 240,
        thumbnailEmoji: '💪',
        author: 'SnapFit AI',
        rating: 4.6,
        viewCount: 89200,
        createdAt: new Date(),
        engagementScore: 0.82
      }
    ];
  };

  const loadUserInsights = async () => {
    try {
      const userId = user?.id || 'demo-user';
      const insights = await UserInteractionService.generateUserInsights(userId);
      setUserInsights(insights);
    } catch (error) {
      console.error('❌ Error loading insights:', error);
    }
  };

  const loadTrendingContent = async () => {
    setIsLoading(true);
    try {
      console.log('🔄 Loading trending content...');
      const trendingContent = await DiscoverAIService.generateTrendingContent(8);
      
      const contentToUse = trendingContent.length > 0 ? trendingContent : getFallbackContent();
      setContent(contentToUse);
      setAllContent(contentToUse); // Store for search
      console.log('✅ Loaded trending content:', contentToUse.length, 'items');
    } catch (error) {
      console.error('❌ Error loading trending content:', error);
      const fallbackContent = getFallbackContent();
      setContent(fallbackContent);
      setAllContent(fallbackContent);
    } finally {
      setIsLoading(false);
    }
  };

  const loadRecommendedContent = async () => {
    setIsLoading(true);
    try {
      const userId = user?.id || 'demo-user';
      const userProfile = UserInteractionService.getUserProfile(userId);
      
      // Get actual content interests instead of generic interaction types
      const userInterests = UserInteractionService.getUserContentInterests(userId, 15);
      
      console.log('🎯 User content interests count:', userInterests.length);
      
      const recommendations = await DiscoverAIService.generatePersonalizedRecommendations(
        userProfile.preferences,
        userInterests, // Use actual content interests
        8
      );
      
      const contentToUse = recommendations.length > 0 ? recommendations : getFallbackContent();
      setContent(contentToUse);
      setAllContent(contentToUse); // Store for search
      console.log('✅ Loaded recommended content:', contentToUse.length, 'items');
    } catch (error) {
      console.error('❌ Error loading recommendations:', error);
      const fallbackContent = getFallbackContent();
      setContent(fallbackContent);
      setAllContent(fallbackContent);
    } finally {
      setIsLoading(false);
    }
  };

  const generateContentByType = async (type: FitnessContent['type']) => {
    setIsLoading(true);
    try {
      const topics = [
        'strength training fundamentals',
        'healthy meal prep ideas',
        'HIIT workout routines',
        'protein supplement guide',
        'recovery techniques',
        'beginner fitness tips'
      ];
      
      const randomTopic = topics[Math.floor(Math.random() * topics.length)];
      const newContent = await DiscoverAIService.generateFitnessContent(type, randomTopic);
      
      if (newContent) {
        const updatedContent = [newContent, ...content.slice(0, 7)];
        setContent(updatedContent);
        setAllContent(prev => [newContent, ...prev]); // Add to search content
        
        // Track interaction
        await UserInteractionService.trackInteraction(
          user?.id || 'demo-user',
          newContent.id,
          'view',
          newContent,
          { source: 'generated' }
        );
      }
    } catch (error) {
      console.error('❌ Error generating content:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleContentPress = async (item: FitnessContent) => {
    try {
      // Track interaction
      await UserInteractionService.trackInteraction(
        user?.id || 'demo-user',
        item.id,
        'view',
        item,
        { source: activeTab }
      );

      // Navigate to article detail screen
      (navigation as any).navigate('ArticleDetail', {
        article: item,
        source: activeTab
      });
    } catch (error) {
      console.error('❌ Error handling content press:', error);
    }
  };

  const handleAction = async (item: FitnessContent, action: 'like' | 'save' | 'share') => {
    try {
      await UserInteractionService.trackInteraction(
        user?.id || 'demo-user',
        item.id,
        action,
        item
      );
      
      Alert.alert('Success!', `${action === 'like' ? 'Liked' : action === 'save' ? 'Saved' : 'Shared'} "${item.title}"`);
      
      // Refresh insights after interaction
      await loadUserInsights();
    } catch (error) {
      console.error(`❌ Error handling ${action}:`, error);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    // Clear search when refreshing
    setSearchQuery('');
    await loadInitialContent();
    await loadUserInsights();
    setIsRefreshing(false);
  };

  const renderContentCard = (item: FitnessContent, index: number) => (
    <Animated.View 
      key={item.id} 
      style={[styles.contentCard, { opacity: fadeAnim }]}
    >
      <TouchableOpacity onPress={() => handleContentPress(item)} activeOpacity={0.8}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardEmoji}>{item.thumbnailEmoji}</Text>
          <View style={styles.cardMeta}>
            <Text style={styles.cardType}>{item.type.toUpperCase()}</Text>
            <Text style={styles.cardRating}>⭐ {item.rating}</Text>
          </View>
        </View>
        
        <Text style={styles.cardTitle}>{item.title}</Text>
        <Text style={styles.cardDescription}>{item.description}</Text>
        
        <View style={styles.cardFooter}>
          <View style={styles.cardTags}>
            <Text style={styles.cardCategory}>{item.category}</Text>
            {item.difficulty && (
              <Text style={styles.cardDifficulty}>{item.difficulty}</Text>
            )}
          </View>
          <Text style={styles.cardViews}>{item.viewCount.toLocaleString()} views</Text>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <Animated.View style={[styles.header, { opacity: fadeAnim }]}>
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.title}>🔍 Discover</Text>
            <Text style={styles.subtitle}>AI-Powered Fitness Content</Text>
          </View>
          {isAILoading && (
            <View style={styles.aiLoadingIndicator}>
              <ActivityIndicator size="small" color="#FFD700" />
              <Text style={styles.aiLoadingText}>🤖 AI</Text>
            </View>
          )}
        </View>
      </Animated.View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search fitness content..."
          placeholderTextColor="#9E9E9E"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {isSearching ? (
          <ActivityIndicator size="small" color="#FFD700" style={styles.searchIcon} />
        ) : searchQuery.length > 0 ? (
          <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.searchIcon}>
            <Text style={styles.clearButton}>✕</Text>
          </TouchableOpacity>
        ) : (
          <Text style={styles.searchIcon}>🔍</Text>
        )}
      </View>

      {/* Search Suggestions */}
      {searchQuery.length === 0 && activeTab === 'trending' && (
        <View style={styles.suggestionsContainer}>
          <Text style={styles.suggestionsTitle}>💡 Try searching for:</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.suggestionScroll}>
            {['HIIT workouts', 'protein recipes', 'home gym', 'weight loss', 'muscle building', 'cardio'].map((suggestion) => (
              <TouchableOpacity
                key={suggestion}
                style={styles.suggestionChip}
                onPress={() => setSearchQuery(suggestion)}
              >
                <Text style={styles.suggestionText}>{suggestion}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Search Results Header */}
      {searchQuery.length > 0 && (
        <View style={styles.searchResultsHeader}>
          <Text style={styles.searchResultsText}>
            {isSearching ? `🔍 Searching for "${searchQuery}"...` : 
             content.length > 0 ? `📋 Found ${content.length} results for "${searchQuery}"` :
             `❌ No results found for "${searchQuery}"`}
          </Text>
          {!isSearching && content.length === 0 && (
            <Text style={styles.searchResultsSubtext}>
              We generated AI content for your search! Try different keywords.
            </Text>
          )}
        </View>
      )}

      {/* Tabs */}
      <View style={styles.tabContainer}>
        {[
          { key: 'trending', label: '🔥 Trending', },
          { key: 'recommended', label: '🎯 For You' },
          { key: 'categories', label: '📂 Categories' }
        ].map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tab, activeTab === tab.key && styles.activeTab]}
            onPress={() => setActiveTab(tab.key as any)}
          >
            <Text style={[styles.tabText, activeTab === tab.key && styles.activeTabText]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* User Insights */}
      {userInsights && activeTab === 'recommended' && (
        <Animated.View style={[styles.insightsContainer, { opacity: fadeAnim }]}>
          <Text style={styles.insightsTitle}>🧠 Your Fitness Journey</Text>
          <Text style={styles.insightsText}>{userInsights}</Text>
        </Animated.View>
      )}

      {/* Content Type Generator */}
      {activeTab === 'categories' && (
        <Animated.View style={[styles.typeContainer, { opacity: fadeAnim }]}>
          <Text style={styles.typeTitle}>🎲 Generate Content</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.typeScroll}>
            {contentTypes.map((type) => (
              <TouchableOpacity
                key={type.type}
                style={styles.typeButton}
                onPress={() => generateContentByType(type.type as FitnessContent['type'])}
              >
                <Text style={styles.typeEmoji}>{type.emoji}</Text>
                <Text style={styles.typeLabel}>{type.label}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </Animated.View>
      )}

      {/* Content List */}
      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#FFD700" />
            <Text style={styles.loadingText}>Generating AI content...</Text>
          </View>
        ) : (
          <View style={styles.contentGrid}>
            {content.map((item, index) => renderContentCard(item, index))}
          </View>
        )}
        
        {!isLoading && content.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>🤖</Text>
            <Text style={styles.emptyTitle}>Ready to discover!</Text>
            <Text style={styles.emptySubtitle}>
              Start exploring to get personalized AI recommendations
            </Text>
          </View>
        )}
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
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#FFD700',
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  aiLoadingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  aiLoadingText: {
    color: '#FFD700',
    fontSize: 10,
    fontWeight: '600',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  subtitle: {
    fontSize: 14,
    color: '#FFD700',
    marginTop: 4,
    fontWeight: '500',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#111111',
  },
  searchInput: {
    flex: 1,
    backgroundColor: '#1E1E1E',
    borderRadius: 25,
    paddingHorizontal: 20,
    paddingVertical: 12,
    color: '#FFFFFF',
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#FFD700',
  },
  searchIcon: {
    fontSize: 20,
    marginLeft: 15,
  },
  clearButton: {
    fontSize: 18,
    color: '#FFD700',
    fontWeight: 'bold',
  },
  suggestionsContainer: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#111111',
  },
  suggestionsTitle: {
    color: '#FFD700',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  suggestionScroll: {
    flexDirection: 'row',
  },
  suggestionChip: {
    backgroundColor: '#1E1E1E',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#FFD700',
  },
  suggestionText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '500',
  },
  searchResultsHeader: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#111111',
    borderBottomWidth: 1,
    borderBottomColor: '#333333',
  },
  searchResultsText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  searchResultsSubtext: {
    color: '#9E9E9E',
    fontSize: 12,
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#111111',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginHorizontal: 4,
    alignItems: 'center',
    backgroundColor: '#1E1E1E',
  },
  activeTab: {
    backgroundColor: '#FFD700',
  },
  tabText: {
    color: '#9E9E9E',
    fontSize: 14,
    fontWeight: '600',
  },
  activeTabText: {
    color: '#000000',
  },
  insightsContainer: {
    backgroundColor: '#1E1E1E',
    marginHorizontal: 20,
    marginVertical: 10,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FFD700',
  },
  insightsTitle: {
    color: '#FFD700',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  insightsText: {
    color: '#FFFFFF',
    fontSize: 14,
    lineHeight: 20,
  },
  typeContainer: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#111111',
  },
  typeTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  typeScroll: {
    flexDirection: 'row',
  },
  typeButton: {
    backgroundColor: '#1E1E1E',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginRight: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FFD700',
    minWidth: 80,
  },
  typeEmoji: {
    fontSize: 24,
    marginBottom: 4,
  },
  typeLabel: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  contentGrid: {
    padding: 20,
  },
  contentCard: {
    backgroundColor: '#1E1E1E',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#333333',
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardEmoji: {
    fontSize: 32,
  },
  cardMeta: {
    alignItems: 'flex-end',
  },
  cardType: {
    color: '#FFD700',
    fontSize: 12,
    fontWeight: 'bold',
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  cardRating: {
    color: '#FFFFFF',
    fontSize: 12,
    marginTop: 4,
  },
  cardTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
    lineHeight: 24,
  },
  cardDescription: {
    color: '#9E9E9E',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardTags: {
    flexDirection: 'row',
    gap: 8,
  },
  cardCategory: {
    color: '#FFD700',
    fontSize: 12,
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  cardDifficulty: {
    color: '#FFFFFF',
    fontSize: 12,
    backgroundColor: '#333333',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  cardViews: {
    color: '#9E9E9E',
    fontSize: 12,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 50,
  },
  loadingText: {
    color: '#FFD700',
    fontSize: 16,
    marginTop: 12,
    fontWeight: '500',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 50,
  },
  emptyEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  emptySubtitle: {
    color: '#9E9E9E',
    fontSize: 16,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
}); 