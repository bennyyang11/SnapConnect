import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Animated,
  Image,
} from 'react-native';
import { SharedMoment, FriendshipStats } from '../../services/friendshipMemoryService';

interface FriendshipTimelineCardProps {
  friendName: string;
  stats: FriendshipStats;
  moments: SharedMoment[];
  insights: string[];
  onViewFullTimeline: () => void;
}

export default function FriendshipTimelineCard({
  friendName,
  stats,
  moments,
  insights,
  onViewFullTimeline,
}: FriendshipTimelineCardProps) {
  const [expanded, setExpanded] = useState(false);
  const expandAnim = React.useRef(new Animated.Value(0)).current;

  const toggleExpanded = () => {
    const toValue = expanded ? 0 : 1;
    Animated.spring(expandAnim, {
      toValue,
      useNativeDriver: false,
      tension: 100,
      friction: 8,
    }).start();
    setExpanded(!expanded);
  };

  const getTrendEmoji = (trend: string) => {
    switch (trend) {
      case 'growing': return '📈';
      case 'declining': return '📉';
      default: return '📊';
    }
  };

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'growing': return '#00FF00';
      case 'declining': return '#FF6B6B';
      default: return '#FFD700';
    }
  };

  return (
    <View style={styles.container}>
      {/* Header with Friend Info */}
      <TouchableOpacity style={styles.header} onPress={toggleExpanded}>
        <View style={styles.friendInfo}>
          <View style={styles.avatarContainer}>
            <Text style={styles.avatarText}>{friendName.charAt(0).toUpperCase()}</Text>
          </View>
          <View style={styles.headerText}>
            <Text style={styles.friendName}>{friendName}</Text>
            <Text style={styles.statsText}>
              {stats.totalSnaps} snaps • {stats.thisMonthSnaps} this month
            </Text>
          </View>
        </View>
        
        <View style={styles.trendIndicator}>
          <Text style={styles.trendEmoji}>{getTrendEmoji(stats.relationshipTrend)}</Text>
          <Text style={[styles.trendText, { color: getTrendColor(stats.relationshipTrend) }]}>
            {stats.relationshipTrend}
          </Text>
        </View>
      </TouchableOpacity>

      {/* Main Stats */}
      <View style={styles.mainStats}>
        <Text style={styles.highlightStat}>
          You and {friendName} have snapped <Text style={styles.statNumber}>{stats.totalSnaps}</Text> times together
        </Text>
        <Text style={styles.subStat}>
          {stats.thisMonthSnaps} snaps this month — here's your highlight reel! 🎬
        </Text>
      </View>

      {/* Expandable Content */}
      <Animated.View 
        style={[
          styles.expandableContent,
          {
            maxHeight: expandAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [0, 600],
            }),
            opacity: expandAnim,
          },
        ]}
      >
        {/* Shared Moments */}
        {moments.length > 0 && (
          <View style={styles.momentsSection}>
            <Text style={styles.sectionTitle}>🌟 Shared Moments</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {moments.slice(0, 5).map((moment) => (
                <View key={moment.id} style={styles.momentCard}>
                  <Text style={styles.momentTheme}>{moment.theme}</Text>
                  <Text style={styles.momentSummary}>{moment.summary}</Text>
                  <Text style={styles.momentDate}>
                    {moment.timestamp.toLocaleDateString()}
                  </Text>
                  <View style={styles.significanceBar}>
                    <View 
                      style={[
                        styles.significanceFill,
                        { width: `${moment.significance * 100}%` }
                      ]} 
                    />
                  </View>
                  <Text style={styles.momentSnaps}>{moment.snaps.length} snaps</Text>
                </View>
              ))}
            </ScrollView>
          </View>
        )}

        {/* AI Insights */}
        {insights.length > 0 && (
          <View style={styles.insightsSection}>
            <Text style={styles.sectionTitle}>🤖 AI Insights</Text>
            {insights.map((insight, index) => (
              <View key={index} style={styles.insightCard}>
                <Text style={styles.insightText}>{insight}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Friendship Patterns */}
        <View style={styles.patternsSection}>
          <Text style={styles.sectionTitle}>📊 Friendship Patterns</Text>
          
          <View style={styles.patternGrid}>
            <View style={styles.patternItem}>
              <Text style={styles.patternLabel}>Common Moods</Text>
              <Text style={styles.patternValue}>
                {stats.commonMoods.slice(0, 3).join(', ') || 'Building memories...'}
              </Text>
            </View>
            
            <View style={styles.patternItem}>
              <Text style={styles.patternLabel}>Favorite Time</Text>
              <Text style={styles.patternValue}>{stats.favoriteTime}</Text>
            </View>
            
            <View style={styles.patternItem}>
              <Text style={styles.patternLabel}>This Week</Text>
              <Text style={styles.patternValue}>{stats.thisWeekSnaps} snaps</Text>
            </View>
            
            <View style={styles.patternItem}>
              <Text style={styles.patternLabel}>Relationship</Text>
              <Text style={[styles.patternValue, { color: getTrendColor(stats.relationshipTrend) }]}>
                {stats.relationshipTrend}
              </Text>
            </View>
          </View>
        </View>

        {/* View Full Timeline Button */}
        <TouchableOpacity style={styles.viewTimelineButton} onPress={onViewFullTimeline}>
          <Text style={styles.viewTimelineText}>📚 View Full Timeline</Text>
        </TouchableOpacity>
      </Animated.View>

      {/* Expand/Collapse Indicator */}
      <TouchableOpacity style={styles.expandToggle} onPress={toggleExpanded}>
        <Animated.Text 
          style={[
            styles.expandIcon,
            {
              transform: [{
                rotate: expandAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['0deg', '180deg'],
                }),
              }],
            },
          ]}
        >
          ▼
        </Animated.Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 20,
    margin: 10,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  friendInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatarContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#FFD700',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  avatarText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
  },
  headerText: {
    flex: 1,
  },
  friendName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  statsText: {
    fontSize: 14,
    color: '#CCCCCC',
  },
  trendIndicator: {
    alignItems: 'center',
  },
  trendEmoji: {
    fontSize: 24,
    marginBottom: 4,
  },
  trendText: {
    fontSize: 12,
    fontWeight: 'bold',
    textTransform: 'capitalize',
  },
  mainStats: {
    padding: 20,
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
  },
  highlightStat: {
    fontSize: 16,
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 8,
    lineHeight: 24,
  },
  statNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFD700',
  },
  subStat: {
    fontSize: 14,
    color: '#CCCCCC',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  expandableContent: {
    overflow: 'hidden',
  },
  momentsSection: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 15,
  },
  momentCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 15,
    padding: 15,
    marginRight: 15,
    width: 160,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  momentTheme: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFD700',
    marginBottom: 8,
  },
  momentSummary: {
    fontSize: 12,
    color: '#FFFFFF',
    marginBottom: 10,
    lineHeight: 16,
  },
  momentDate: {
    fontSize: 10,
    color: '#CCCCCC',
    marginBottom: 8,
  },
  significanceBar: {
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 2,
    marginBottom: 8,
  },
  significanceFill: {
    height: '100%',
    backgroundColor: '#00FF00',
    borderRadius: 2,
  },
  momentSnaps: {
    fontSize: 10,
    color: '#CCCCCC',
    textAlign: 'center',
  },
  insightsSection: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  insightCard: {
    backgroundColor: 'rgba(64, 224, 208, 0.1)',
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
    borderLeftWidth: 3,
    borderLeftColor: '#40E0D0',
  },
  insightText: {
    fontSize: 14,
    color: '#FFFFFF',
    lineHeight: 20,
  },
  patternsSection: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  patternGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  patternItem: {
    width: '48%',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
  },
  patternLabel: {
    fontSize: 12,
    color: '#CCCCCC',
    marginBottom: 4,
  },
  patternValue: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  viewTimelineButton: {
    margin: 20,
    backgroundColor: '#9370DB',
    borderRadius: 15,
    padding: 15,
    alignItems: 'center',
  },
  viewTimelineText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  expandToggle: {
    alignItems: 'center',
    paddingVertical: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  expandIcon: {
    fontSize: 16,
    color: '#CCCCCC',
  },
}); 