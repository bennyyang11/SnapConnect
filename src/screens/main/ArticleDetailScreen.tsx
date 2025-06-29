import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Share,
  Alert,
  Dimensions,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { FitnessContent } from '../../services/discoverAIService';
import UserInteractionService from '../../services/userInteractionService';
import { useAppStore } from '../../store/useAppStore';

const { width } = Dimensions.get('window');

interface ArticleDetailRouteParams {
  article: FitnessContent;
  source?: string;
}

export default function ArticleDetailScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { article, source = 'discover' } = route.params as ArticleDetailRouteParams;
  const { user } = useAppStore();
  
  const [isLiked, setIsLiked] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [likeCount, setLikeCount] = useState(article.viewCount || 0);

  useEffect(() => {
    // Track view interaction
    handleAction('view');
  }, []);

  const handleAction = async (action: 'view' | 'like' | 'save' | 'share') => {
    try {
      await UserInteractionService.trackInteraction(
        user?.id || 'demo-user',
        article.id,
        action,
        article,
        { source }
      );

      switch (action) {
        case 'like':
          setIsLiked(!isLiked);
          setLikeCount(prev => isLiked ? prev - 1 : prev + 1);
          break;
        case 'save':
          setIsSaved(!isSaved);
          Alert.alert(
            isSaved ? 'Removed from Saved' : 'Saved!',
            isSaved ? 'Article removed from your saved items.' : 'Article saved to your collection.',
            [{ text: 'OK' }]
          );
          break;
        case 'share':
          handleShare();
          break;
      }
    } catch (error) {
      console.error('❌ Error tracking interaction:', error);
    }
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Check out this article: ${article.title}\n\n${article.description}`,
        title: article.title,
      });
    } catch (error) {
      console.error('❌ Error sharing:', error);
    }
  };

  const formatDuration = (duration?: string) => {
    if (!duration) return '';
    return ` • ${duration} read`;
  };

  const getDifficultyColor = (difficulty?: string) => {
    switch (difficulty) {
      case 'beginner': return '#4CAF50';
      case 'intermediate': return '#FF9800';
      case 'advanced': return '#F44336';
      default: return '#9E9E9E';
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
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerActions}>
          <TouchableOpacity 
            style={styles.actionButton} 
            onPress={() => handleAction('save')}
          >
            <Text style={[styles.actionText, isSaved && styles.actionTextActive]}>
              {isSaved ? '📌' : '🔖'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.actionButton} 
            onPress={() => handleAction('share')}
          >
            <Text style={styles.actionText}>🔗</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Article Header */}
        <View style={styles.articleHeader}>
          <Text style={styles.category}>{article.category}</Text>
          <Text style={styles.title}>{article.title}</Text>
          <Text style={styles.description}>{article.description}</Text>
          
          {/* Meta Info */}
          <View style={styles.metaInfo}>
            <View style={styles.metaItem}>
              <Text style={styles.authorText}>{article.author}</Text>
              <Text style={styles.metaText}>
                {formatDuration(article.duration)}
                {article.difficulty && (
                  <Text style={[styles.difficultyText, { color: getDifficultyColor(article.difficulty) }]}>
                    {' • ' + article.difficulty}
                  </Text>
                )}
              </Text>
            </View>
            <View style={styles.emoji}>
              <Text style={styles.emojiText}>{article.thumbnailEmoji}</Text>
            </View>
          </View>

          {/* Stats */}
          <View style={styles.stats}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{article.rating}</Text>
              <Text style={styles.statLabel}>⭐</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{likeCount.toLocaleString()}</Text>
              <Text style={styles.statLabel}>views</Text>
            </View>
            {article.calories && (
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{article.calories}</Text>
                <Text style={styles.statLabel}>cal</Text>
              </View>
            )}
          </View>

          {/* Tags */}
          {article.tags.length > 0 && (
            <View style={styles.tagsContainer}>
              {article.tags.slice(0, 6).map((tag, index) => (
                <View key={index} style={styles.tag}>
                  <Text style={styles.tagText}>#{tag}</Text>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Article Content */}
        <View style={styles.articleContent}>
          <Text style={styles.contentText}>{article.content}</Text>
        </View>

        {/* Equipment & Muscles (if available) */}
        {(article.equipment || article.targetMuscles) && (
          <View style={styles.additionalInfo}>
            {article.equipment && article.equipment.length > 0 && (
              <View style={styles.infoSection}>
                <Text style={styles.infoTitle}>🏋️ Equipment Needed</Text>
                <Text style={styles.infoText}>{article.equipment.join(', ')}</Text>
              </View>
            )}
            
            {article.targetMuscles && article.targetMuscles.length > 0 && (
              <View style={styles.infoSection}>
                <Text style={styles.infoTitle}>💪 Target Muscles</Text>
                <Text style={styles.infoText}>{article.targetMuscles.join(', ')}</Text>
              </View>
            )}
          </View>
        )}
      </ScrollView>

      {/* Bottom Actions */}
      <View style={styles.bottomActions}>
        <TouchableOpacity 
          style={[styles.bottomActionButton, isLiked && styles.likedButton]} 
          onPress={() => handleAction('like')}
        >
          <Text style={styles.bottomActionText}>
            {isLiked ? '❤️' : '🤍'} {isLiked ? 'Liked' : 'Like'}
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.bottomActionButton} 
          onPress={() => handleAction('share')}
        >
          <Text style={styles.bottomActionText}>🔗 Share</Text>
        </TouchableOpacity>
      </View>
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#424242',
  },
  backButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#161618',
  },
  backButtonText: {
    fontSize: 20,
    color: '#FFFFFF',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#161618',
  },
  actionText: {
    fontSize: 16,
    color: '#FFFFFF',
  },
  actionTextActive: {
    color: '#FFDD3A',
  },
  content: {
    flex: 1,
  },
  articleHeader: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#424242',
  },
  category: {
    fontSize: 12,
    color: '#FFDD3A',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    lineHeight: 36,
    marginBottom: 12,
  },
  description: {
    fontSize: 16,
    color: '#B0B0B0',
    lineHeight: 24,
    marginBottom: 16,
  },
  metaInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  metaItem: {
    flex: 1,
  },
  authorText: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  metaText: {
    fontSize: 12,
    color: '#9E9E9E',
    marginTop: 2,
  },
  difficultyText: {
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  emoji: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#161618',
    justifyContent: 'center',
    alignItems: 'center',
  },
  emojiText: {
    fontSize: 24,
  },
  stats: {
    flexDirection: 'row',
    gap: 24,
    marginBottom: 16,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  statLabel: {
    fontSize: 12,
    color: '#9E9E9E',
    marginTop: 2,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    backgroundColor: '#161618',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#424242',
  },
  tagText: {
    fontSize: 12,
    color: '#FFDD3A',
    fontWeight: '500',
  },
  articleContent: {
    padding: 20,
  },
  contentText: {
    fontSize: 16,
    color: '#FFFFFF',
    lineHeight: 26,
  },
  additionalInfo: {
    padding: 20,
    paddingTop: 0,
  },
  infoSection: {
    marginBottom: 16,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFDD3A',
    marginBottom: 6,
  },
  infoText: {
    fontSize: 14,
    color: '#B0B0B0',
    textTransform: 'capitalize',
  },
  bottomActions: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#424242',
    gap: 12,
  },
  bottomActionButton: {
    flex: 1,
    backgroundColor: '#161618',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#424242',
  },
  likedButton: {
    backgroundColor: '#FF1744',
    borderColor: '#FF1744',
  },
  bottomActionText: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '600',
  },
}); 