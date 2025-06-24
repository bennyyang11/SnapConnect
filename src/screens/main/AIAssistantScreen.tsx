import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { useAppStore } from '../../store/useAppStore';
import { openAIService } from '../../services/openai';
import { ContentSuggestion, RAGContext } from '../../types';

export default function AIAssistantScreen() {
  const { user, contentSuggestions, addContentSuggestion, setLoading, isLoading } = useAppStore();
  const [activeTab, setActiveTab] = useState<'captions' | 'workouts' | 'motivation' | 'challenges'>('captions');

  // Mock RAG context for demonstration
  const mockRAGContext: RAGContext = {
    userInterests: ['strength training', 'HIIT', 'nutrition', 'motivation'],
    recentActivity: ['completed leg workout', 'shared protein recipe', 'posted gym selfie'],
    workoutHistory: [
      {
        id: '1',
        type: 'strength training',
        duration: 60,
        intensity: 'high',
        exercises: [
          { name: 'squats', sets: 4, reps: 12 },
          { name: 'deadlifts', sets: 3, reps: 8 }
        ],
        date: new Date(),
      }
    ],
    socialInteractions: ['liked workout video', 'commented on nutrition post'],
    trendingTopics: ['New Year fitness', 'home workouts', 'protein recipes'],
    personalBrand: {
      tone: 'motivational',
      focusAreas: ['strength', 'nutrition', 'mindset'],
      catchPhrases: ['stronger every day', 'progress not perfection'],
      contentThemes: ['workout tips', 'healthy recipes', 'motivation'],
    }
  };

  const generateContent = async (type: string) => {
    if (!user) {
      Alert.alert('Error', 'Please log in to use AI features');
      return;
    }

    setLoading(true);
    try {
      let suggestion: ContentSuggestion;

      switch (type) {
        case 'caption':
          suggestion = await openAIService.generateWorkoutCaption(
            'strength training',
            mockRAGContext,
            mockRAGContext.personalBrand
          );
          break;
        case 'motivation':
          suggestion = await openAIService.generateMotivationalContent(mockRAGContext);
          break;
        case 'workout':
          suggestion = await openAIService.generateWorkoutPlan(
            'muscle building',
            'intermediate',
            mockRAGContext
          );
          break;
        case 'challenge':
          suggestion = await openAIService.generateFitnessChallenge(mockRAGContext);
          break;
        default:
          throw new Error('Invalid content type');
      }

      addContentSuggestion(suggestion);
    } catch (error: any) {
      Alert.alert('AI Generation Failed', 'Unable to generate content. Please check your OpenAI API key.');
      console.error('AI generation error:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderTabContent = () => {
    const suggestions = contentSuggestions.filter(s => {
      switch (activeTab) {
        case 'captions':
          return s.type === 'caption';
        case 'workouts':
          return s.type === 'workout_plan';
        case 'motivation':
          return s.type === 'post_idea';
        case 'challenges':
          return s.type === 'challenge';
        default:
          return false;
      }
    });

    return (
      <View style={styles.tabContent}>
        <TouchableOpacity
          style={styles.generateButton}
          onPress={() => {
            switch (activeTab) {
              case 'captions':
                generateContent('caption');
                break;
              case 'workouts':
                generateContent('workout');
                break;
              case 'motivation':
                generateContent('motivation');
                break;
              case 'challenges':
                generateContent('challenge');
                break;
            }
          }}
          disabled={isLoading}
        >
          <Text style={styles.generateButtonText}>
            {isLoading ? 'Generating...' : `Generate ${activeTab.slice(0, -1)}`}
          </Text>
        </TouchableOpacity>

        {suggestions.length === 0 ? (
          <View style={styles.placeholder}>
            <Text style={styles.placeholderText}>
              🤖 AI-generated {activeTab} will appear here
            </Text>
            <Text style={styles.subText}>
              Tap the generate button to create personalized content based on your fitness profile
            </Text>
          </View>
        ) : (
          <ScrollView style={styles.suggestionsList}>
            {suggestions.map((suggestion) => (
              <View key={suggestion.id} style={styles.suggestionCard}>
                <Text style={styles.suggestionTitle}>{suggestion.title}</Text>
                <Text style={styles.suggestionContent}>{suggestion.content}</Text>
                <View style={styles.suggestionMeta}>
                  <Text style={styles.metaText}>
                    Relevance: {Math.round(suggestion.relevanceScore * 100)}%
                  </Text>
                  <Text style={styles.metaText}>
                    Est. Engagement: {suggestion.estimatedEngagement}
                  </Text>
                </View>
                {suggestion.tags.length > 0 && (
                  <View style={styles.tagsContainer}>
                    {suggestion.tags.map((tag, index) => (
                      <Text key={index} style={styles.tag}>{tag}</Text>
                    ))}
                  </View>
                )}
              </View>
            ))}
          </ScrollView>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>AI Assistant</Text>
        <Text style={styles.subtitle}>RAG-Powered Content Generation</Text>
      </View>

      <View style={styles.tabs}>
        {(['captions', 'workouts', 'motivation', 'challenges'] as const).map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.activeTab]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {renderTabContent()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0D0D0F',
  },
  header: {
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#424242',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  subtitle: {
    fontSize: 14,
    color: '#FFDD3A',
    marginTop: 4,
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: '#161618',
    paddingHorizontal: 4,
    paddingVertical: 4,
    margin: 16,
    borderRadius: 12,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
  },
  activeTab: {
    backgroundColor: '#FFDD3A',
  },
  tabText: {
    fontSize: 12,
    color: '#9E9E9E',
    fontWeight: '600',
  },
  activeTabText: {
    color: '#0D0D0F',
  },
  tabContent: {
    flex: 1,
    padding: 16,
  },
  generateButton: {
    backgroundColor: '#FFDD3A',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 20,
  },
  generateButtonText: {
    color: '#0D0D0F',
    fontSize: 16,
    fontWeight: 'bold',
  },
  placeholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  placeholderText: {
    fontSize: 18,
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 10,
  },
  subText: {
    fontSize: 14,
    color: '#9E9E9E',
    textAlign: 'center',
  },
  suggestionsList: {
    flex: 1,
  },
  suggestionCard: {
    backgroundColor: '#161618',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#424242',
  },
  suggestionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFDD3A',
    marginBottom: 8,
  },
  suggestionContent: {
    fontSize: 14,
    color: '#FFFFFF',
    lineHeight: 20,
    marginBottom: 12,
  },
  suggestionMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  metaText: {
    fontSize: 12,
    color: '#9E9E9E',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  tag: {
    backgroundColor: '#424242',
    color: '#FFFFFF',
    fontSize: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
}); 