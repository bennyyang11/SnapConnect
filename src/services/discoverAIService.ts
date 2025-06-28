import { callLangChain } from './langchain';

// Content Types for Discover Section
export interface FitnessContent {
  id: string;
  type: 'article' | 'video' | 'tip' | 'recipe' | 'product_review' | 'workout_plan';
  title: string;
  description: string;
  content: string;
  category: string;
  tags: string[];
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
  duration?: string; // "10 min", "30 min", etc.
  equipment?: string[];
  targetMuscles?: string[];
  calories?: number;
  thumbnailEmoji: string;
  author: string;
  rating: number;
  viewCount: number;
  createdAt: Date;
  engagementScore: number;
}

export interface UserPreference {
  categories: string[];
  contentTypes: string[];
  difficultyLevel: string;
  interests: string[];
  interactionHistory: {
    contentId: string;
    action: 'view' | 'like' | 'save' | 'share';
    timestamp: Date;
  }[];
}

export class DiscoverAIService {
  private static readonly CONTENT_CATEGORIES = [
    'Workout Routines',
    'Nutrition & Diet',
    'Supplements',
    'Exercise Techniques',
    'Recovery & Rest',
    'Mental Health',
    'Equipment Reviews',
    'Meal Prep',
    'Weight Loss',
    'Muscle Building',
    'Cardio Training',
    'Strength Training'
  ];

  private static readonly CONTENT_TEMPLATES = {
    article: 'Write a comprehensive fitness article about {topic}. Include practical tips, scientific backing, and actionable advice.',
    video: 'Create a video script for a {duration} fitness video about {topic}. Include step-by-step instructions and form cues.',
    tip: 'Generate a quick, actionable fitness tip about {topic}. Keep it under 100 words but make it highly practical.',
    recipe: 'Create a healthy {mealType} recipe for {goal}. Include ingredients, instructions, and nutritional benefits.',
    product_review: 'Write an honest review of {product} for fitness enthusiasts. Include pros, cons, and best use cases.',
    workout_plan: 'Design a {difficulty} {duration} workout plan for {goal}. Include exercises, sets, reps, and rest periods.'
  };

  /**
   * Generate AI-powered fitness content using OpenAI
   */
  static async generateFitnessContent(
    type: FitnessContent['type'],
    topic: string,
    options: {
      difficulty?: string;
      duration?: string;
      goal?: string;
      equipment?: string[];
    } = {}
  ): Promise<FitnessContent | null> {
    try {
      console.log(`🤖 Generating ${type} content about: ${topic}`);

      // Create context-aware prompt based on content type
      let prompt = '';
      
      switch (type) {
        case 'article':
          prompt = `Write a comprehensive fitness article about ${topic}. Include practical tips, scientific backing, and actionable advice.`;
          break;
        case 'video':
          prompt = `Create a video script for a ${options.duration || '15 min'} fitness video about ${topic}. Include step-by-step instructions and form cues.`;
          break;
        case 'tip':
          prompt = `Generate a quick, actionable fitness tip about ${topic}. Keep it under 100 words but make it highly practical.`;
          break;
        case 'recipe':
          prompt = `Create a healthy recipe for ${topic}. Include ingredients, instructions, and nutritional benefits.`;
          break;
        case 'product_review':
          prompt = `Write an honest review of ${topic} for fitness enthusiasts. Include pros, cons, and best use cases.`;
          break;
        case 'workout_plan':
          prompt = `Design a ${options.difficulty || 'intermediate'} ${options.duration || '30 min'} workout plan for ${topic}. Include exercises, sets, reps, and rest periods.`;
          break;
      }

      // Add context (optimized for tokens)
      const contextPrompt = `${prompt}

Requirements: Mobile-friendly, encouraging tone, use emojis, actionable content.
${options.equipment ? `Equipment: ${options.equipment.join(', ')}` : ''}`;

      // Generate content using LangChain
      const result = await callLangChain(contextPrompt, 'discover_ai');

      if (!result.response) {
        throw new Error('No content generated');
      }

      // Create metadata
      const category = this.categorizeContent(topic, type);
      const tags = this.generateTags(topic, type);
      const difficulty = options.difficulty as FitnessContent['difficulty'] || 'intermediate';

      const content: FitnessContent = {
        id: `ai_content_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type,
        title: this.generateTitle(topic, type),
        description: this.generateDescription(topic, type),
        content: result.response,
        category,
        tags,
        difficulty,
        duration: options.duration,
        equipment: options.equipment,
        targetMuscles: this.extractTargetMuscles(topic),
        calories: this.estimateCalories(type, options.duration),
        thumbnailEmoji: this.selectEmoji(type, category),
        author: 'SnapFit AI',
        rating: this.generateRating(),
        viewCount: this.generateViewCount(),
        createdAt: new Date(),
        engagementScore: 0
      };

      console.log(`✅ Generated ${type} content: "${content.title}"`);
      return content;

    } catch (error) {
      console.error(`❌ Error generating ${type} content:`, error);
      return null;
    }
  }

  /**
   * Generate personalized content recommendations using LangChain
   */
  static async generatePersonalizedRecommendations(
    userPreferences: UserPreference,
    interactionHistory: string[],
    limit: number = 10
  ): Promise<FitnessContent[]> {
    try {
      console.log('🎯 Generating personalized recommendations...');

      // Analyze user preferences (token-optimized)
      const analysisPrompt = `User fitness profile:
Categories: ${userPreferences.categories.join(', ')}
Types: ${userPreferences.contentTypes.join(', ')}
Level: ${userPreferences.difficultyLevel}
Interests: ${userPreferences.interests.join(', ')}
Recent: ${interactionHistory.slice(-5).join(', ')}

Suggest ${limit} relevant fitness topics (comma-separated):`;

      const analysisResult = await callLangChain(analysisPrompt, 'recommendation_engine');
      
      if (!analysisResult.response) {
        return await this.generateTrendingContent(limit);
      }

      // Parse recommended topics
      const recommendedTopics = analysisResult.response
        .split(',')
        .map(topic => topic.trim())
        .filter(topic => topic.length > 0)
        .slice(0, limit);

      // Generate content for each recommended topic
      const recommendations: FitnessContent[] = [];
      
      for (const topic of recommendedTopics) {
        const contentType = this.selectOptimalContentType(userPreferences.contentTypes);
        const content = await this.generateFitnessContent(contentType, topic, {
          difficulty: userPreferences.difficultyLevel,
          duration: this.selectOptimalDuration(userPreferences)
        });
        
        if (content) {
          recommendations.push(content);
        }
      }

      console.log(`✅ Generated ${recommendations.length} personalized recommendations`);
      return recommendations;

    } catch (error) {
      console.error('❌ Error generating recommendations:', error);
      return await this.generateTrendingContent(limit);
    }
  }

  /**
   * Generate trending fitness content when personalization fails
   */
  static async generateTrendingContent(limit: number = 10): Promise<FitnessContent[]> {
    console.log('📈 Generating trending fitness content...');

    const trendingTopics = [
      'HIIT workouts for busy schedules',
      'Best protein powders for muscle growth',
      'Home gym setup on a budget',
      'Meal prep for weight loss',
      'Recovery techniques for athletes',
      'Beginner strength training program',
      'Healthy breakfast recipes',
      'Cardio vs strength training',
      'Sleep optimization for fitness',
      'Pre-workout nutrition timing'
    ];

    const trendingContent: FitnessContent[] = [];

    // Try to generate content with timeout
    try {
      const promises = trendingTopics.slice(0, Math.min(limit, trendingTopics.length)).map(async (topic, index) => {
        const contentType = this.getRandomContentType();
        console.log(`🎯 Generating ${contentType} for topic: ${topic}`);
        
        // Add timeout to prevent hanging
        const timeoutPromise = new Promise<FitnessContent | null>((_, reject) => 
          setTimeout(() => reject(new Error('Content generation timeout')), 10000)
        );
        
        const contentPromise = this.generateFitnessContent(contentType, topic);
        
        try {
          const content = await Promise.race([contentPromise, timeoutPromise]);
          if (content) {
            content.engagementScore = Math.random() * 0.3 + 0.7;
            content.viewCount = Math.floor(Math.random() * 50000) + 10000;
            return content;
          }
        } catch (error) {
          console.log(`⚠️ Failed to generate content for topic: ${topic}`, error instanceof Error ? error.message : 'Unknown error');
          return null;
        }
        return null;
      });

      // Wait for all promises with a global timeout
      const results = await Promise.allSettled(promises);
      
      results.forEach((result, index) => {
        if (result.status === 'fulfilled' && result.value) {
          trendingContent.push(result.value);
        } else {
          console.log(`❌ Content generation failed for topic ${index}:`, result.status === 'rejected' ? result.reason : 'No content returned');
        }
      });

      console.log(`✅ Successfully generated ${trendingContent.length} out of ${limit} requested content items`);
      
    } catch (error) {
      console.error('❌ Error in trending content generation:', error);
    }

    return trendingContent;
  }

  /**
   * Track user interaction and update preferences
   */
  static async trackUserInteraction(
    userId: string,
    contentId: string,
    action: 'view' | 'like' | 'save' | 'share',
    content: FitnessContent
  ): Promise<void> {
    try {
      console.log(`📊 Tracking user interaction: ${action} on ${content.title}`);

      // Use LangChain to analyze interaction and update preferences
      const interactionPrompt = `
        User performed action "${action}" on content:
        Title: ${content.title}
        Category: ${content.category}
        Type: ${content.type}
        Tags: ${content.tags.join(', ')}
        Difficulty: ${content.difficulty}
        
        Based on this interaction, what does this tell us about the user's preferences?
        Provide insights about their interests, preferred content types, and difficulty level.
        Format as JSON: {"interests": [], "preferredTypes": [], "difficultyTrend": ""}
      `;

      const analysisResult = await callLangChain(interactionPrompt, 'user_analysis');
      
      if (analysisResult.response) {
        try {
          const insights = JSON.parse(analysisResult.response);
          console.log('🧠 User preference insights:', insights);
          
          // Store insights for future recommendations
          // In a real app, this would update a user preference database
        } catch (parseError) {
          console.log('📝 Raw insights:', analysisResult.response);
        }
      }

    } catch (error) {
      console.error('❌ Error tracking interaction:', error);
    }
  }

  // Helper functions
  private static categorizeContent(topic: string, type: string): string {
    const lowerTopic = topic.toLowerCase();
    
    if (lowerTopic.includes('nutrition') || lowerTopic.includes('diet') || lowerTopic.includes('meal')) {
      return 'Nutrition & Diet';
    } else if (lowerTopic.includes('supplement') || lowerTopic.includes('protein')) {
      return 'Supplements';
    } else if (lowerTopic.includes('recovery') || lowerTopic.includes('sleep')) {
      return 'Recovery & Rest';
    } else if (lowerTopic.includes('equipment') || lowerTopic.includes('gear')) {
      return 'Equipment Reviews';
    } else if (lowerTopic.includes('cardio') || lowerTopic.includes('running')) {
      return 'Cardio Training';
    } else if (lowerTopic.includes('strength') || lowerTopic.includes('lifting')) {
      return 'Strength Training';
    } else {
      return 'Workout Routines';
    }
  }

  private static generateTags(topic: string, type: string): string[] {
    const baseTags = [type, 'fitness', 'health'];
    const lowerTopic = topic.toLowerCase();
    
    if (lowerTopic.includes('beginner')) baseTags.push('beginner');
    if (lowerTopic.includes('home')) baseTags.push('home_workout');
    if (lowerTopic.includes('weight loss')) baseTags.push('weight_loss');
    if (lowerTopic.includes('muscle')) baseTags.push('muscle_building');
    if (lowerTopic.includes('hiit')) baseTags.push('hiit');
    
    return baseTags;
  }

  private static generateTitle(topic: string, type: string): string {
    const titleTemplates: { [key: string]: string[] } = {
      article: [`The Complete Guide to ${topic}`, `Everything You Need to Know About ${topic}`, `Mastering ${topic}: Expert Tips`],
      video: [`${topic} - Step by Step Tutorial`, `Master ${topic} in Minutes`, `Quick ${topic} Video Guide`],
      tip: [`Pro Tip: ${topic}`, `Quick ${topic} Hack`, `${topic} Made Simple`],
      recipe: [`Healthy ${topic} Recipe`, `Easy ${topic} Meal Prep`, `Nutritious ${topic} Bowl`],
      product_review: [`${topic} Review: Worth It?`, `Honest ${topic} Review`, `${topic} - Pros & Cons`],
      workout_plan: [`${topic} Workout Plan`, `Complete ${topic} Routine`, `${topic} Training Program`]
    };

    const templates = titleTemplates[type] || titleTemplates.article;
    return templates[Math.floor(Math.random() * templates.length)];
  }

  private static generateDescription(topic: string, type: string): string {
    return `Discover everything you need to know about ${topic}. This ${type} provides expert insights and practical tips to help you achieve your fitness goals.`;
  }

  private static extractTargetMuscles(topic: string): string[] {
    const lowerTopic = topic.toLowerCase();
    const muscles: string[] = [];
    
    if (lowerTopic.includes('chest') || lowerTopic.includes('bench')) muscles.push('chest');
    if (lowerTopic.includes('back') || lowerTopic.includes('pull')) muscles.push('back');
    if (lowerTopic.includes('leg') || lowerTopic.includes('squat')) muscles.push('legs');
    if (lowerTopic.includes('arm') || lowerTopic.includes('bicep') || lowerTopic.includes('tricep')) muscles.push('arms');
    if (lowerTopic.includes('shoulder')) muscles.push('shoulders');
    if (lowerTopic.includes('core') || lowerTopic.includes('abs')) muscles.push('core');
    
    return muscles;
  }

  private static estimateCalories(type: string, duration?: string): number | undefined {
    if (!duration) return undefined;
    
    const minutes = parseInt(duration) || 30;
    const baseCaloriesPerMinute = type === 'workout_plan' ? 8 : 0;
    
    return baseCaloriesPerMinute * minutes;
  }

  private static selectEmoji(type: string, category: string): string {
    const emojiMap: { [key: string]: string } = {
      'Workout Routines': '💪',
      'Nutrition & Diet': '🥗',
      'Supplements': '💊',
      'Exercise Techniques': '🏋️',
      'Recovery & Rest': '😴',
      'Mental Health': '🧘',
      'Equipment Reviews': '⚡',
      'Meal Prep': '🍱',
      'Cardio Training': '🏃',
      'Strength Training': '🔥'
    };

    return emojiMap[category] || '💪';
  }

  private static generateRating(): number {
    return Math.round((Math.random() * 2 + 3.5) * 10) / 10; // 3.5-5.0
  }

  private static generateViewCount(): number {
    return Math.floor(Math.random() * 100000) + 1000; // 1K-101K
  }

  private static getRandomContentType(): FitnessContent['type'] {
    const types: FitnessContent['type'][] = ['article', 'video', 'tip', 'recipe', 'workout_plan'];
    return types[Math.floor(Math.random() * types.length)];
  }

  private static selectOptimalContentType(preferredTypes: string[]): FitnessContent['type'] {
    if (preferredTypes.length === 0) return this.getRandomContentType();
    const validType = preferredTypes[0] as FitnessContent['type'];
    return validType || 'article';
  }

  private static selectOptimalDuration(preferences: UserPreference): string {
    const durations = ['10 min', '15 min', '20 min', '30 min', '45 min'];
    return durations[Math.floor(Math.random() * durations.length)];
  }
}

export default DiscoverAIService; 