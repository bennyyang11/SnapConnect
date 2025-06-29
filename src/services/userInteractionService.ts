import { callLangChain } from './langchain';
import { FitnessContent, UserPreference } from './discoverAIService';

export interface UserInteraction {
  id: string;
  userId: string;
  contentId: string;
  action: 'view' | 'like' | 'save' | 'share' | 'click' | 'search';
  timestamp: Date;
  metadata?: {
    duration?: number;
    scrollDepth?: number;
    source?: string;
    searchQuery?: string;
    contentTitle?: string;
    contentTags?: string[];
    contentCategory?: string;
  };
}

export interface UserProfile {
  userId: string;
  preferences: UserPreference;
  personalityInsights: {
    preferredContentLength: 'short' | 'medium' | 'long';
    engagementPattern: 'browser' | 'focused_reader' | 'quick_scanner';
    topCategories: string[];
    activeTimeSlots: string[];
  };
  lastUpdated: Date;
}

export class UserInteractionService {
  private static interactions: UserInteraction[] = [];
  private static userProfiles: Map<string, UserProfile> = new Map();

  /**
   * Track a user interaction with content
   */
  static async trackInteraction(
    userId: string,
    contentId: string,
    action: UserInteraction['action'],
    content: FitnessContent,
    metadata?: UserInteraction['metadata']
  ): Promise<void> {
    try {
      console.log(`📊 Tracking ${action} interaction for user ${userId}`);

      const interaction: UserInteraction = {
        id: `interaction_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userId,
        contentId,
        action,
        timestamp: new Date(),
        metadata: {
          ...metadata,
          contentTitle: content?.title || '',
          contentTags: Array.isArray(content?.tags) ? content.tags : [],
          contentCategory: content?.category || '',
        }
      };

      this.interactions.push(interaction);
      await this.updateUserProfile(userId, interaction, content);

      console.log(`✅ Tracked ${action} interaction successfully`);

    } catch (error) {
      console.error('❌ Error tracking interaction:', error);
    }
  }

  /**
   * Track a search query separately for better personalization
   */
  static async trackSearchQuery(
    userId: string,
    searchQuery: string,
    resultCount: number = 0
  ): Promise<void> {
    try {
      console.log(`🔍 Tracking search query for user ${userId}: "${searchQuery}"`);

      const interaction: UserInteraction = {
        id: `search_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userId,
        contentId: `search_${searchQuery.replace(/\s+/g, '_')}`,
        action: 'search',
        timestamp: new Date(),
        metadata: {
          searchQuery,
          source: 'discover_search',
          duration: resultCount
        }
      };

      this.interactions.push(interaction);

      // Update user profile with search interests
      const profile = this.getUserProfile(userId);
      const searchTerms = searchQuery.toLowerCase().split(' ').filter(term => term.length > 2);
      
      searchTerms.forEach(term => {
        if (!profile.preferences.interests.includes(term)) {
          profile.preferences.interests.push(term);
        }
      });

      // Keep only the most recent 20 interests
      profile.preferences.interests = profile.preferences.interests.slice(-20);
      profile.lastUpdated = new Date();
      this.userProfiles.set(userId, profile);

      console.log(`✅ Tracked search query successfully`);

    } catch (error) {
      console.error('❌ Error tracking search query:', error);
    }
  }

  /**
   * Get user's interaction history
   */
  static getUserInteractions(userId: string, limit: number = 50): UserInteraction[] {
    return this.interactions
      .filter(interaction => interaction.userId === userId)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }

  /**
   * Get or create user profile
   */
  static getUserProfile(userId: string): UserProfile {
    let profile = this.userProfiles.get(userId);
    
    if (!profile) {
      profile = {
        userId,
        preferences: {
          categories: [],
          contentTypes: [],
          difficultyLevel: 'intermediate',
          interests: [],
          interactionHistory: []
        },
        personalityInsights: {
          preferredContentLength: 'medium',
          engagementPattern: 'browser',
          topCategories: [],
          activeTimeSlots: []
        },
        lastUpdated: new Date()
      };
      
      this.userProfiles.set(userId, profile);
    }

    return profile;
  }

  /**
   * Generate personalized insights about user behavior
   */
  static async generateUserInsights(userId: string): Promise<string> {
    try {
      const interactions = this.getUserInteractions(userId, 100);
      const profile = this.getUserProfile(userId);

      if (interactions.length === 0) {
        return "Welcome to SnapConnect! Start exploring content to get personalized recommendations.";
      }

      const analysisPrompt = `User fitness activity:
Interactions: ${interactions.length}
Recent: ${interactions.slice(0, 5).map(i => i.action).join(', ')}
Top: ${profile.personalityInsights.topCategories.slice(0, 3).join(', ')}
Level: ${profile.preferences.difficultyLevel}

Provide encouraging fitness insights (100 words max):`;

      const result = await callLangChain(analysisPrompt, 'user_insights');
      
      return result.response || "Keep exploring to discover content that matches your fitness goals!";

    } catch (error) {
      console.error('❌ Error generating user insights:', error);
      return "Continue exploring to get personalized fitness recommendations!";
    }
  }

  /**
   * Update user profile based on interaction
   */
  private static async updateUserProfile(
    userId: string,
    interaction: UserInteraction,
    content: FitnessContent
  ): Promise<void> {
    const profile = this.getUserProfile(userId);

    // Update preferences based on content interaction
    if (!profile.preferences.categories.includes(content.category)) {
      profile.preferences.categories.push(content.category);
    }

    if (!profile.preferences.contentTypes.includes(content.type)) {
      profile.preferences.contentTypes.push(content.type);
    }

    // Update difficulty preference based on engagement
    if (interaction.action === 'like' || interaction.action === 'save') {
      if (content.difficulty && content.difficulty !== profile.preferences.difficultyLevel) {
        profile.preferences.difficultyLevel = content.difficulty;
      }
    }

    // Update top categories
    const categoryIndex = profile.personalityInsights.topCategories.indexOf(content.category);
    if (categoryIndex === -1) {
      profile.personalityInsights.topCategories.unshift(content.category);
    } else {
      profile.personalityInsights.topCategories.splice(categoryIndex, 1);
      profile.personalityInsights.topCategories.unshift(content.category);
    }

    profile.personalityInsights.topCategories = profile.personalityInsights.topCategories.slice(0, 5);

    profile.lastUpdated = new Date();
    this.userProfiles.set(userId, profile);
  }

  /**
   * Get usage statistics
   */
  static getUsageStats(userId: string): {
    totalInteractions: number;
    dailyAverage: number;
    topCategories: string[];
    engagementScore: number;
  } {
    const interactions = this.getUserInteractions(userId);
    const profile = this.getUserProfile(userId);

    const firstInteraction = interactions[interactions.length - 1];
    const daysSinceFirst = firstInteraction 
      ? Math.max(1, Math.ceil((Date.now() - firstInteraction.timestamp.getTime()) / (1000 * 60 * 60 * 24)))
      : 1;

    const engagementScore = interactions.reduce((score, interaction) => {
      const weights = { 'view': 1, 'click': 1.2, 'like': 2, 'save': 3, 'share': 4, 'search': 1.5 };
      return score + (weights[interaction.action] || 1);
    }, 0) / interactions.length || 0;

    return {
      totalInteractions: interactions.length,
      dailyAverage: Math.round((interactions.length / daysSinceFirst) * 10) / 10,
      topCategories: profile.personalityInsights.topCategories.slice(0, 3),
      engagementScore: Math.round(engagementScore * 10) / 10
    };
  }

  /**
   * Get meaningful content topics from user interactions
   */
  static getUserContentInterests(userId: string, limit: number = 10): string[] {
    const interactions = this.getUserInteractions(userId);
    const interests: string[] = [];

    // Collect search queries
    interactions
      .filter(i => i.action === 'search' && i.metadata?.searchQuery)
      .forEach(i => interests.push(i.metadata?.searchQuery || ''));

    // Collect content titles
    interactions
      .filter(i => i.action === 'view' && i.metadata?.contentTitle)
      .forEach(i => interests.push(i.metadata?.contentTitle || ''));

    // Collect content tags
    interactions
      .filter(i => i.metadata?.contentTags && Array.isArray(i.metadata.contentTags))
      .forEach(i => {
        const tags = i.metadata?.contentTags || [];
        if (tags.length > 0) {
          interests.push(...tags);
        }
      });

    // Return unique, most recent interests
    const uniqueInterests = [...new Set(interests)]
      .filter(interest => interest.length > 0)
      .reverse()
      .slice(0, limit);

    return uniqueInterests;
  }
}

export default UserInteractionService; 