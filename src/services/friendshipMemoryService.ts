import OpenAI from 'openai';
import { callLangChain } from './langchain';

// OpenAI API key from environment variables
const OPENAI_API_KEY = process.env.EXPO_PUBLIC_OPENAI_API_KEY || '';

const openai = new OpenAI({
  apiKey: OPENAI_API_KEY,
});

export interface SnapMetadata {
  id: string;
  senderId: string;
  recipientId: string;
  caption?: string;
  imageUri?: string;
  videoUri?: string;
  timestamp: Date;
  location?: {
    latitude: number;
    longitude: number;
    address?: string;
  };
  mood?: string;
  tags?: string[];
  duration?: number; // for videos
  filterUsed?: string;
  isStory?: boolean;
}

export interface FriendshipStats {
  friendId: string;
  friendName: string;
  totalSnaps: number;
  thisMonthSnaps: number;
  thisWeekSnaps: number;
  lastSnapDate: Date;
  favoriteTime: string; // "morning", "afternoon", "evening", "night"
  commonMoods: string[];
  commonLocations: string[];
  streakDays: number;
  averageResponseTime: number; // in minutes
  relationshipTrend: 'growing' | 'stable' | 'declining';
}

export interface SharedMoment {
  id: string;
  participants: string[];
  snaps: SnapMetadata[];
  theme: string;
  mood: string;
  significance: number; // 0-1 relevance score
  summary: string;
  highlightCaption: string;
  timestamp: Date;
  location?: string;
  tags: string[];
}

export interface FriendshipTimeline {
  friendId: string;
  friendName: string;
  stats: FriendshipStats;
  moments: SharedMoment[];
  highlights: SharedMoment[];
  insights: string[];
  embeddingId?: string;
}

export interface CaptionEmbedding {
  id: string;
  snapId: string;
  userId: string;
  friendId: string;
  caption: string;
  embedding: number[];
  metadata: {
    mood?: string;
    timestamp: string;
    location?: string;
    tags: string[];
  };
}

export class FriendshipMemoryService {
  private static snapHistory: SnapMetadata[] = [];
  private static friendshipStats: Map<string, FriendshipStats> = new Map();
  private static friendshipTimelines: Map<string, FriendshipTimeline> = new Map();
  private static captionEmbeddings: CaptionEmbedding[] = [];

  /**
   * Track a new snap between friends
   */
  static async trackFriendshipSnap(
    senderId: string,
    recipientId: string,
    snapData: Partial<SnapMetadata>
  ): Promise<void> {
    try {
      console.log(`👥 Tracking friendship snap between ${senderId} and ${recipientId}`);

      const snap: SnapMetadata = {
        id: `snap_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        senderId,
        recipientId,
        timestamp: new Date(),
        ...snapData
      };

      this.snapHistory.push(snap);

      // Always generate and store embedding for better searchability
      await this.generateCaptionEmbedding(snap);

      // Update friendship stats for both directions
      await this.updateFriendshipStats(senderId, recipientId, snap);
      await this.updateFriendshipStats(recipientId, senderId, snap);

      // Generate shared moments and insights
      await this.analyzeSharedMoments(senderId, recipientId);

      console.log(`✅ Friendship snap tracked successfully`);
      console.log(`📊 Total snaps in history: ${this.snapHistory.length}`);
      console.log(`📊 Total embeddings: ${this.captionEmbeddings.length}`);

    } catch (error) {
      console.error('❌ Error tracking friendship snap:', error);
    }
  }

  /**
   * Generate embedding for snap caption using OpenAI
   */
  private static async generateCaptionEmbedding(snap: SnapMetadata): Promise<void> {
    if (!OPENAI_API_KEY) return;

    try {
      // Create a comprehensive text representation of the snap for embedding
      const textContent = this.createSearchableText(snap);
      
      if (!textContent.trim()) {
        console.log('⚠️ No searchable content for snap:', snap.id);
        return;
      }

      console.log('🧠 Generating caption embedding for:', textContent.slice(0, 50) + '...');

      const response = await openai.embeddings.create({
        model: 'text-embedding-ada-002',
        input: textContent,
      });

      const embedding: CaptionEmbedding = {
        id: `embed_${snap.id}`,
        snapId: snap.id,
        userId: snap.senderId,
        friendId: snap.recipientId,
        caption: textContent, // Store the full searchable text
        embedding: response.data[0].embedding,
        metadata: {
          mood: snap.mood,
          timestamp: snap.timestamp.toISOString(),
          location: snap.location?.address,
          tags: snap.tags || []
        }
      };

      this.captionEmbeddings.push(embedding);
      console.log('✅ Caption embedding generated and stored');

    } catch (error) {
      console.error('❌ Error generating caption embedding:', error);
    }
  }

  /**
   * Create comprehensive searchable text from snap data
   */
  private static createSearchableText(snap: SnapMetadata): string {
    const textParts: string[] = [];

    // Add caption if available
    if (snap.caption && snap.caption.trim()) {
      textParts.push(snap.caption.trim());
    }

    // Add tags
    if (snap.tags && snap.tags.length > 0) {
      textParts.push(snap.tags.join(' '));
    }

    // Add mood
    if (snap.mood) {
      textParts.push(`feeling ${snap.mood}`);
    }

    // Add location context
    if (snap.location?.address) {
      textParts.push(`at ${snap.location.address}`);
    }

    // Add media type context
    if (snap.imageUri) {
      textParts.push('photo picture image');
    }
    if (snap.videoUri) {
      textParts.push('video clip recording');
    }

    // Add filter context
    if (snap.filterUsed && snap.filterUsed !== 'none') {
      textParts.push(`with ${snap.filterUsed} filter`);
    }

    // Add time context
    const hour = snap.timestamp.getHours();
    if (hour < 6) textParts.push('late night early morning');
    else if (hour < 12) textParts.push('morning');
    else if (hour < 18) textParts.push('afternoon');
    else textParts.push('evening');

    // Add day context
    const dayOfWeek = snap.timestamp.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
    textParts.push(dayOfWeek);

    return textParts.join(' ');
  }

  /**
   * Update friendship statistics
   */
  private static async updateFriendshipStats(
    userId: string,
    friendId: string,
    snap: SnapMetadata
  ): Promise<void> {
    const friendshipKey = `${userId}_${friendId}`;
    let stats = this.friendshipStats.get(friendshipKey);

    if (!stats) {
      stats = {
        friendId,
        friendName: `Friend ${friendId.substr(0, 8)}`, // Would get from user service
        totalSnaps: 0,
        thisMonthSnaps: 0,
        thisWeekSnaps: 0,
        lastSnapDate: snap.timestamp,
        favoriteTime: 'afternoon',
        commonMoods: [],
        commonLocations: [],
        streakDays: 0,
        averageResponseTime: 0,
        relationshipTrend: 'stable'
      };
    }

    // Update basic counts
    stats.totalSnaps++;
    stats.lastSnapDate = snap.timestamp;

    // Count this month's snaps
    const now = new Date();
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const thisWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    if (snap.timestamp >= thisMonth) {
      stats.thisMonthSnaps++;
    }
    if (snap.timestamp >= thisWeek) {
      stats.thisWeekSnaps++;
    }

    // Analyze patterns
    this.analyzeFriendshipPatterns(stats, snap);

    this.friendshipStats.set(friendshipKey, stats);
  }

  /**
   * Analyze friendship patterns and preferences
   */
  private static analyzeFriendshipPatterns(stats: FriendshipStats, snap: SnapMetadata): void {
    // Determine favorite time of day
    const hour = snap.timestamp.getHours();
    let timeOfDay: string;
    if (hour < 6) timeOfDay = 'night';
    else if (hour < 12) timeOfDay = 'morning';
    else if (hour < 18) timeOfDay = 'afternoon';
    else timeOfDay = 'evening';

    // Update common moods
    if (snap.mood && !stats.commonMoods.includes(snap.mood)) {
      stats.commonMoods.push(snap.mood);
      if (stats.commonMoods.length > 5) {
        stats.commonMoods = stats.commonMoods.slice(-5); // Keep last 5
      }
    }

    // Update common locations
    if (snap.location?.address && !stats.commonLocations.includes(snap.location.address)) {
      stats.commonLocations.push(snap.location.address);
      if (stats.commonLocations.length > 3) {
        stats.commonLocations = stats.commonLocations.slice(-3); // Keep last 3
      }
    }

    // Determine relationship trend based on recent activity
    if (stats.thisWeekSnaps > stats.thisMonthSnaps / 4) {
      stats.relationshipTrend = 'growing';
    } else if (stats.thisWeekSnaps < stats.thisMonthSnaps / 6) {
      stats.relationshipTrend = 'declining';
    } else {
      stats.relationshipTrend = 'stable';
    }
  }

  /**
   * Analyze and create shared moments between friends
   */
  private static async analyzeSharedMoments(userId: string, friendId: string): Promise<void> {
    try {
      console.log('🔍 Analyzing shared moments...');

      // Get recent snaps between these friends
      const friendSnaps = this.snapHistory.filter(snap => 
        (snap.senderId === userId && snap.recipientId === friendId) ||
        (snap.senderId === friendId && snap.recipientId === userId)
      ).slice(-20); // Last 20 snaps

      if (friendSnaps.length < 3) return; // Need at least 3 snaps to analyze

      // Group snaps by time periods and themes
      const moments = await this.identifySharedMoments(friendSnaps);
      
      // Generate AI insights about the friendship
      const insights = await this.generateFriendshipInsights(userId, friendId, friendSnaps);

      // Create or update friendship timeline
      const timeline: FriendshipTimeline = {
        friendId,
        friendName: `Friend ${friendId.substr(0, 8)}`,
        stats: this.friendshipStats.get(`${userId}_${friendId}`) || {} as FriendshipStats,
        moments,
        highlights: moments.filter(m => m.significance > 0.7),
        insights
      };

      this.friendshipTimelines.set(`${userId}_${friendId}`, timeline);
      console.log('✅ Shared moments analyzed and timeline updated');

    } catch (error) {
      console.error('❌ Error analyzing shared moments:', error);
    }
  }

  /**
   * Identify shared moments from snap groups
   */
  private static async identifySharedMoments(snaps: SnapMetadata[]): Promise<SharedMoment[]> {
    const moments: SharedMoment[] = [];

    // Group snaps by day and location
    const dayGroups = this.groupSnapsByDay(snaps);

    for (const [date, daySnaps] of dayGroups) {
      if (daySnaps.length >= 2) {
        const moment = await this.createSharedMoment(daySnaps, date);
        if (moment) moments.push(moment);
      }
    }

    return moments.sort((a, b) => b.significance - a.significance);
  }

  /**
   * Group snaps by day
   */
  private static groupSnapsByDay(snaps: SnapMetadata[]): Map<string, SnapMetadata[]> {
    const groups = new Map<string, SnapMetadata[]>();

    snaps.forEach(snap => {
      const dateKey = snap.timestamp.toDateString();
      if (!groups.has(dateKey)) {
        groups.set(dateKey, []);
      }
      groups.get(dateKey)!.push(snap);
    });

    return groups;
  }

  /**
   * Create a shared moment from a group of snaps
   */
  private static async createSharedMoment(snaps: SnapMetadata[], date: string): Promise<SharedMoment | null> {
    if (snaps.length === 0) return null;

    try {
      // Analyze the snaps to determine theme and mood
      const captions = snaps.filter(s => s.caption).map(s => s.caption).join(' ');
      const analysis = await this.analyzeMomentTheme(captions, snaps);

      const moment: SharedMoment = {
        id: `moment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        participants: Array.from(new Set([...snaps.map(s => s.senderId), ...snaps.map(s => s.recipientId)])),
        snaps,
        theme: analysis.theme,
        mood: analysis.mood,
        significance: analysis.significance,
        summary: analysis.summary,
        highlightCaption: analysis.highlightCaption,
        timestamp: snaps[0].timestamp,
        location: snaps.find(s => s.location)?.location?.address,
        tags: analysis.tags
      };

      return moment;

    } catch (error) {
      console.error('❌ Error creating shared moment:', error);
      return null;
    }
  }

  /**
   * Analyze moment theme using AI
   */
  private static async analyzeMomentTheme(captions: string, snaps: SnapMetadata[]): Promise<{
    theme: string;
    mood: string;
    significance: number;
    summary: string;
    highlightCaption: string;
    tags: string[];
  }> {
    try {
      const analysisPrompt = `Analyze this friendship moment from ${snaps.length} snaps:

Captions: "${captions}"
Time: ${snaps[0].timestamp.toLocaleDateString()}
Context: Friend activity session

Return JSON:
{
  "theme": "main theme (e.g., 'Adventure Day', 'Chill Hangout', 'Fun Times')",
  "mood": "overall mood",
  "significance": 0.8,
  "summary": "Brief 1-sentence summary",
  "highlightCaption": "Most memorable caption or moment",
  "tags": ["tag1", "tag2", "tag3"]
}`;

      const result = await callLangChain(analysisPrompt, 'moment_analysis');
      
      try {
        const cleanResponse = result.response.replace(/```json\n?|\n?```/g, '').trim();
        return JSON.parse(cleanResponse);
      } catch (parseError) {
        // Fallback analysis
        return {
          theme: 'Friendship Moment',
          mood: 'happy',
          significance: 0.6,
          summary: `Shared ${snaps.length} snaps together`,
          highlightCaption: captions.split(' ').slice(0, 10).join(' ') || 'Fun moment together',
          tags: ['friendship', 'memories']
        };
      }

    } catch (error) {
      console.error('❌ Error analyzing moment theme:', error);
      return {
        theme: 'Shared Moment',
        mood: 'neutral',
        significance: 0.5,
        summary: 'Friendship activity',
        highlightCaption: 'Good times!',
        tags: ['friendship']
      };
    }
  }

  /**
   * Generate AI insights about friendship
   */
  private static async generateFriendshipInsights(
    userId: string,
    friendId: string,
    snaps: SnapMetadata[]
  ): Promise<string[]> {
    try {
      const stats = this.friendshipStats.get(`${userId}_${friendId}`);
      if (!stats) return [];

      const insightPrompt = `Generate 3 personalized friendship insights:

Stats:
- Total snaps: ${stats.totalSnaps}
- This month: ${stats.thisMonthSnaps}
- Common moods: ${stats.commonMoods.join(', ')}
- Trend: ${stats.relationshipTrend}
- Recent snaps: ${snaps.slice(-5).map(s => s.caption || 'photo').join(', ')}

Create engaging, personal insights like:
"You two are most active on weekends!"
"Your friendship is growing stronger this month"
"You both love sharing adventure moments"

Return as JSON array: ["insight1", "insight2", "insight3"]`;

      const result = await callLangChain(insightPrompt, 'friendship_insights');
      
      try {
        const cleanResponse = result.response.replace(/```json\n?|\n?```/g, '').trim();
        return JSON.parse(cleanResponse);
      } catch (parseError) {
        return [
          `You and your friend have shared ${stats.totalSnaps} snaps together!`,
          `Your friendship is ${stats.relationshipTrend} with ${stats.thisMonthSnaps} snaps this month.`,
          `You both enjoy ${stats.commonMoods.slice(0, 2).join(' and ')} moments together.`
        ];
      }

    } catch (error) {
      console.error('❌ Error generating friendship insights:', error);
      return ['Your friendship is special! Keep sharing those moments.'];
    }
  }

  /**
   * Get friendship timeline for a specific friend
   */
  static getFriendshipTimeline(userId: string, friendId: string): FriendshipTimeline | null {
    return this.friendshipTimelines.get(`${userId}_${friendId}`) || null;
  }

  /**
   * Get all friendship stats for a user
   */
  static getUserFriendships(userId: string): FriendshipStats[] {
    const friendships: FriendshipStats[] = [];
    
    for (const [key, stats] of this.friendshipStats) {
      if (key.startsWith(userId)) {
        friendships.push(stats);
      }
    }

    return friendships.sort((a, b) => b.totalSnaps - a.totalSnaps);
  }

  /**
   * Search similar moments using caption embeddings
   */
  static async searchSimilarMoments(query: string, userId: string, friendId?: string): Promise<SharedMoment[]> {
    if (!OPENAI_API_KEY) {
      console.log('⚠️ OpenAI API key not configured, falling back to basic search');
      return this.basicTextSearch(query, userId, friendId);
    }

    try {
      console.log('🔍 Searching similar moments for:', query);

      // Generate embedding for search query
      const response = await openai.embeddings.create({
        model: 'text-embedding-ada-002',
        input: query,
      });

      const queryEmbedding = response.data[0].embedding;

      // Calculate similarity with stored embeddings
      const similarities = this.captionEmbeddings
        .filter(embed => 
          embed.userId === userId && 
          (!friendId || embed.friendId === friendId)
        )
        .map(embed => ({
          embed,
          similarity: this.cosineSimilarity(queryEmbedding, embed.embedding)
        }))
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, 20); // Get more results

      console.log(`📊 Found ${similarities.length} similar captions`);

      // If we have good embedding matches, use them
      if (similarities.length > 0 && similarities[0].similarity > 0.7) {
        const relevantSnapIds = similarities.map(s => s.embed.snapId);
        const moments = this.findMomentsContainingSnaps(relevantSnapIds, userId, friendId);
        
        if (moments.length > 0) {
          console.log(`✅ Found ${moments.length} moments with similar content`);
          return moments;
        }
      }

      // If no good embedding matches, fall back to text search
      console.log('🔄 Falling back to basic text search');
      return this.basicTextSearch(query, userId, friendId);

    } catch (error) {
      console.error('❌ Error searching similar moments:', error);
      // Fall back to basic text search on error
      return this.basicTextSearch(query, userId, friendId);
    }
  }

  /**
   * Basic text search as fallback when embeddings aren't available
   */
  private static basicTextSearch(query: string, userId: string, friendId?: string): SharedMoment[] {
    console.log('🔍 Performing basic text search for:', query);
    
    const queryWords = query.toLowerCase().split(/\s+/).filter(word => word.length > 2);
    const results: Array<{ moment: SharedMoment; score: number }> = [];

    // Search through all snaps first
    const relevantSnaps = this.snapHistory.filter(snap => 
      snap.senderId === userId && 
      (!friendId || snap.recipientId === friendId)
    );

    console.log(`📊 Searching through ${relevantSnaps.length} snaps`);

    // Create temporary moments from individual snaps if they match
    const individualMatches: SharedMoment[] = [];
    
    relevantSnaps.forEach(snap => {
      let score = 0;
      const searchText = [
        snap.caption || '',
        ...(snap.tags || []),
        snap.mood || '',
        snap.location?.address || ''
      ].join(' ').toLowerCase();

      queryWords.forEach(word => {
        if (searchText.includes(word)) {
          score += 1;
        }
      });

      // If we have a decent match, create a temporary moment for this snap
      if (score > 0) {
        const tempMoment: SharedMoment = {
          id: `temp_moment_${snap.id}`,
          participants: [snap.senderId, snap.recipientId],
          snaps: [snap],
          theme: 'Individual Memory',
          mood: snap.mood || 'neutral',
          significance: Math.min(score * 0.3, 1.0),
          summary: snap.caption || `${snap.imageUri ? 'Photo' : 'Video'} snap`,
          highlightCaption: snap.caption || 'Shared moment',
          timestamp: snap.timestamp,
          location: snap.location?.address,
          tags: snap.tags || []
        };
        
        individualMatches.push(tempMoment);
      }
    });

    // Also search through existing moments
    const allTimelines = Array.from(this.friendshipTimelines.values())
      .filter(timeline => !friendId || timeline.friendId === friendId);

    allTimelines.forEach(timeline => {
      timeline.moments.forEach(moment => {
        let score = 0;
        const searchText = [
          moment.summary,
          moment.highlightCaption,
          moment.theme,
          moment.mood,
          ...moment.tags,
          ...moment.snaps.map(s => s.caption || '').join(' ')
        ].join(' ').toLowerCase();

        queryWords.forEach(word => {
          if (searchText.includes(word)) {
            score += 1;
          }
        });

        if (score > 0) {
          results.push({ moment, score });
        }
      });
    });

    // Combine individual matches with moment matches
    const allResults = [
      ...individualMatches.map(moment => ({ moment, score: moment.significance })),
      ...results
    ];

    // Sort by score and return top results
    const sortedResults = allResults
      .sort((a, b) => b.score - a.score)
      .slice(0, 10)
      .map(r => r.moment);

    console.log(`✅ Basic search found ${sortedResults.length} results`);
    return sortedResults;
  }

  /**
   * Find moments that contain specific snap IDs
   */
  private static findMomentsContainingSnaps(snapIds: string[], userId: string, friendId?: string): SharedMoment[] {
    const moments: SharedMoment[] = [];
    
    const timelines = friendId 
      ? [this.getFriendshipTimeline(userId, friendId)].filter(Boolean) as FriendshipTimeline[]
      : Array.from(this.friendshipTimelines.values()).filter(t => 
          t.moments.some(m => m.participants.includes(userId))
        );

    timelines.forEach(timeline => {
      timeline.moments.forEach(moment => {
        if (moment.snaps.some(snap => snapIds.includes(snap.id))) {
          moments.push(moment);
        }
      });
    });

    return moments;
  }

  /**
   * Calculate cosine similarity between two vectors
   */
  private static cosineSimilarity(a: number[], b: number[]): number {
    const dotProduct = a.reduce((sum, val, i) => sum + val * b[i], 0);
    const magnitudeA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
    const magnitudeB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));
    return dotProduct / (magnitudeA * magnitudeB);
  }

  /**
   * Generate friendship highlight reel
   */
  static async generateHighlightReel(userId: string, friendId: string): Promise<{
    title: string;
    description: string;
    moments: SharedMoment[];
    stats: string;
    insights: string[];
  }> {
    try {
      const timeline = this.getFriendshipTimeline(userId, friendId);
      const stats = this.friendshipStats.get(`${userId}_${friendId}`);

      if (!timeline || !stats) {
        return {
          title: 'Friendship Memories',
          description: 'Start sharing more snaps to build your friendship timeline!',
          moments: [],
          stats: 'No data yet',
          insights: []
        };
      }

      const highlightPrompt = `Create a friendship highlight reel title and description:

Stats: ${stats.totalSnaps} total snaps, ${stats.thisMonthSnaps} this month
Trend: ${stats.relationshipTrend}
Top moments: ${timeline.highlights.slice(0, 3).map(h => h.theme).join(', ')}

Generate catchy title and warm description for their friendship journey.

Return JSON:
{
  "title": "Your Amazing Friendship Journey",
  "description": "Celebrating your wonderful moments together!"
}`;

      const result = await callLangChain(highlightPrompt, 'highlight_reel');
      
      let title = 'Your Friendship Highlights';
      let description = `You and ${stats.friendName} have created amazing memories together!`;

      try {
        const cleanResponse = result.response.replace(/```json\n?|\n?```/g, '').trim();
        const parsed = JSON.parse(cleanResponse);
        title = parsed.title || title;
        description = parsed.description || description;
      } catch (parseError) {
        // Use defaults
      }

      return {
        title,
        description,
        moments: timeline.highlights,
        stats: `You and ${stats.friendName} have snapped ${stats.totalSnaps} times together — ${stats.thisMonthSnaps} snaps this month! 📸`,
        insights: timeline.insights
      };

    } catch (error) {
      console.error('❌ Error generating highlight reel:', error);
      return {
        title: 'Friendship Memories',
        description: 'Your friendship journey is just beginning!',
        moments: [],
        stats: 'Keep sharing to build memories!',
        insights: []
      };
    }
  }

  /**
   * Get trending friendship patterns
   */
  static getTrendingPatterns(userId: string): {
    mostActiveTime: string;
    favoriteActivity: string;
    growingFriendships: string[];
    commonMoods: string[];
  } {
    const userFriendships = this.getUserFriendships(userId);
    
    if (userFriendships.length === 0) {
      return {
        mostActiveTime: 'afternoon',
        favoriteActivity: 'chatting',
        growingFriendships: [],
        commonMoods: []
      };
    }

    // Aggregate patterns across all friendships
    const allMoods = userFriendships.flatMap(f => f.commonMoods);
    const growingFriendships = userFriendships
      .filter(f => f.relationshipTrend === 'growing')
      .map(f => f.friendName);

    const moodCounts = allMoods.reduce((acc, mood) => {
      acc[mood] = (acc[mood] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const topMoods = Object.entries(moodCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([mood]) => mood);

    return {
      mostActiveTime: userFriendships[0]?.favoriteTime || 'afternoon',
      favoriteActivity: topMoods[0] || 'fun times',
      growingFriendships,
      commonMoods: topMoods
    };
  }
}

export default FriendshipMemoryService; 