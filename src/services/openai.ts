import OpenAI from 'openai';
import { RAGContext, ContentSuggestion, PersonalBrand } from '../types';

// OpenAI API key from environment variables
const OPENAI_API_KEY = process.env.EXPO_PUBLIC_OPENAI_API_KEY || '';

const openai = new OpenAI({
  apiKey: OPENAI_API_KEY,
});

// Fitness-specific knowledge base for RAG
const FITNESS_KNOWLEDGE_BASE = {
  workoutTypes: [
    'strength training', 'cardio', 'HIIT', 'yoga', 'pilates', 'CrossFit', 
    'powerlifting', 'bodybuilding', 'functional fitness', 'mobility'
  ],
  motivationalPhrases: [
    'Push your limits', 'Stronger than yesterday', 'No excuses', 'Mind over matter',
    'Progress not perfection', 'Beast mode activated', 'Train insane or remain the same',
    'Your only competition is who you were yesterday'
  ],
  fitnessHashtags: [
    '#fitness', '#workout', '#gym', '#strength', '#motivation', '#fitlife',
    '#gains', '#transformation', '#healthylifestyle', '#fitnessjourney'
  ],
  nutritionTips: [
    'Fuel your body with whole foods', 'Stay hydrated', 'Pre-workout nutrition matters',
    'Post-workout recovery is key', 'Balance macronutrients', 'Listen to your body'
  ]
};

class OpenAIService {
  // Generate workout captions based on user context
  async generateWorkoutCaption(
    workoutType: string,
    ragContext: RAGContext,
    personalBrand: PersonalBrand
  ): Promise<ContentSuggestion> {
    if (!OPENAI_API_KEY) {
      throw new Error('OpenAI API key not configured. Please add EXPO_PUBLIC_OPENAI_API_KEY to your .env file.');
    }

    const prompt = this.buildCaptionPrompt(workoutType, ragContext, personalBrand);
    
    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: `You are a fitness content specialist helping fitness influencers create engaging, authentic captions. Use the provided context about the user's fitness profile, recent activity, and personal brand to generate relevant content.`
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 200,
        temperature: 0.7,
      });

      const content = response.choices[0]?.message?.content || '';

      return {
        id: `caption_${Date.now()}`,
        type: 'caption',
        title: `${workoutType} Caption`,
        content: content,
        relevanceScore: this.calculateRelevanceScore(content, ragContext),
        tags: this.extractHashtags(content),
        estimatedEngagement: this.estimateEngagement(content, ragContext),
        generatedAt: new Date(),
      };
    } catch (error) {
      console.error('Error generating caption:', error);
      throw new Error('Failed to generate workout caption');
    }
  }

  // Generate motivational content based on user's recent activity
  async generateMotivationalContent(ragContext: RAGContext): Promise<ContentSuggestion> {
    if (!OPENAI_API_KEY) {
      throw new Error('OpenAI API key not configured. Please add EXPO_PUBLIC_OPENAI_API_KEY to your .env file.');
    }

    const prompt = this.buildMotivationalPrompt(ragContext);

    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: `You are a motivational fitness coach creating inspiring content for fitness influencers. Focus on personal growth, overcoming challenges, and celebrating progress.`
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 180,
        temperature: 0.8,
      });

      const content = response.choices[0]?.message?.content || '';

      return {
        id: `motivation_${Date.now()}`,
        type: 'post_idea',
        title: 'Motivational Content',
        content: content,
        relevanceScore: this.calculateRelevanceScore(content, ragContext),
        tags: this.extractHashtags(content),
        estimatedEngagement: this.estimateEngagement(content, ragContext),
        generatedAt: new Date(),
      };
    } catch (error) {
      console.error('Error generating motivational content:', error);
      throw new Error('Failed to generate motivational content');
    }
  }

  // Generate workout plan suggestions
  async generateWorkoutPlan(
    goal: string,
    experienceLevel: string,
    ragContext: RAGContext
  ): Promise<ContentSuggestion> {
    if (!OPENAI_API_KEY) {
      throw new Error('OpenAI API key not configured. Please add EXPO_PUBLIC_OPENAI_API_KEY to your .env file.');
    }

    const prompt = this.buildWorkoutPlanPrompt(goal, experienceLevel, ragContext);

    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: `You are a certified personal trainer creating workout plans for fitness influencers to share with their audience. Provide practical, safe, and effective routines.`
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 300,
        temperature: 0.6,
      });

      const content = response.choices[0]?.message?.content || '';

      return {
        id: `workout_plan_${Date.now()}`,
        type: 'workout_plan',
        title: `${goal} Workout Plan`,
        content: content,
        relevanceScore: this.calculateRelevanceScore(content, ragContext),
        tags: [goal, experienceLevel, 'workout', 'fitness'],
        estimatedEngagement: this.estimateEngagement(content, ragContext),
        generatedAt: new Date(),
      };
    } catch (error) {
      console.error('Error generating workout plan:', error);
      throw new Error('Failed to generate workout plan');
    }
  }

  // Generate fitness challenges
  async generateFitnessChallenge(ragContext: RAGContext): Promise<ContentSuggestion> {
    if (!OPENAI_API_KEY) {
      throw new Error('OpenAI API key not configured. Please add EXPO_PUBLIC_OPENAI_API_KEY to your .env file.');
    }

    const prompt = this.buildChallengePrompt(ragContext);

    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: `You are a fitness community builder creating engaging challenges for fitness influencers to boost audience participation and community engagement.`
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 250,
        temperature: 0.75,
      });

      const content = response.choices[0]?.message?.content || '';

      return {
        id: `challenge_${Date.now()}`,
        type: 'challenge',
        title: 'Fitness Challenge',
        content: content,
        relevanceScore: this.calculateRelevanceScore(content, ragContext),
        tags: this.extractHashtags(content),
        estimatedEngagement: this.estimateEngagement(content, ragContext) * 1.5, // Challenges typically get higher engagement
        generatedAt: new Date(),
      };
    } catch (error) {
      console.error('Error generating fitness challenge:', error);
      throw new Error('Failed to generate fitness challenge');
    }
  }

  // Private helper methods
  private buildCaptionPrompt(
    workoutType: string,
    ragContext: RAGContext,
    personalBrand: PersonalBrand
  ): string {
    return `
Create an engaging Instagram caption for a ${workoutType} workout post.

User Context:
- Recent workouts: ${ragContext.workoutHistory.slice(0, 3).map(w => w.type).join(', ')}
- Personal brand tone: ${personalBrand.tone}
- Focus areas: ${personalBrand.focusAreas.join(', ')}
- User interests: ${ragContext.userInterests.join(', ')}
- Trending topics: ${ragContext.trendingTopics.join(', ')}

Guidelines:
- Match the ${personalBrand.tone} tone
- Include 3-5 relevant hashtags
- Keep it under 150 words
- Make it authentic and engaging
- Include a call-to-action
`;
  }

  private buildMotivationalPrompt(ragContext: RAGContext): string {
    return `
Create motivational fitness content based on this user's journey:

Recent Activity: ${ragContext.recentActivity.join(', ')}
Interests: ${ragContext.userInterests.join(', ')}

Create inspiring content that:
- Acknowledges common fitness struggles
- Provides encouragement
- Includes actionable advice
- Ends with motivation
- Uses 2-3 fitness hashtags
`;
  }

  private buildWorkoutPlanPrompt(
    goal: string,
    experienceLevel: string,
    ragContext: RAGContext
  ): string {
    return `
Create a ${goal} workout plan for ${experienceLevel} level.

User preferences: ${ragContext.userInterests.join(', ')}
Recent workouts: ${ragContext.workoutHistory.slice(0, 2).map(w => w.type).join(', ')}

Include:
- 4-6 exercises
- Sets and reps
- Brief form tips
- Modification options
- Equipment needed
`;
  }

  private buildChallengePrompt(ragContext: RAGContext): string {
    return `
Create a fun fitness challenge that encourages community participation.

User's fitness focus: ${ragContext.userInterests.slice(0, 3).join(', ')}
Trending: ${ragContext.trendingTopics.join(', ')}

Challenge should:
- Be achievable for most fitness levels
- Encourage social sharing
- Last 7-14 days
- Include tracking method
- Have a motivational hashtag
`;
  }

  private calculateRelevanceScore(content: string, ragContext: RAGContext): number {
    let score = 0.5; // Base score
    
    // Check for user interests
    ragContext.userInterests.forEach(interest => {
      if (content.toLowerCase().includes(interest.toLowerCase())) {
        score += 0.1;
      }
    });

    // Check for trending topics
    ragContext.trendingTopics.forEach(topic => {
      if (content.toLowerCase().includes(topic.toLowerCase())) {
        score += 0.15;
      }
    });

    return Math.min(score, 1.0);
  }

  private extractHashtags(content: string): string[] {
    const hashtagRegex = /#[\w]+/g;
    const matches = content.match(hashtagRegex);
    return matches || [];
  }

  private estimateEngagement(content: string, ragContext: RAGContext): number {
    let baseEngagement = 100; // Base engagement estimate
    
    // Boost for hashtags
    const hashtags = this.extractHashtags(content);
    baseEngagement += hashtags.length * 20;

    // Boost for personal brand alignment
    const brandKeywords = ragContext.personalBrand?.focusAreas || [];
    brandKeywords.forEach(keyword => {
      if (content.toLowerCase().includes(keyword.toLowerCase())) {
        baseEngagement += 30;
      }
    });

    // Boost for trending topics
    ragContext.trendingTopics.forEach(topic => {
      if (content.toLowerCase().includes(topic.toLowerCase())) {
        baseEngagement += 50;
      }
    });

    return baseEngagement;
  }
}

// Additional functions for AI features
export const generateCaption = async (imageUri: string, prompt: string): Promise<string> => {
  if (!OPENAI_API_KEY) {
    throw new Error('OpenAI API key not configured. Please add EXPO_PUBLIC_OPENAI_API_KEY to your .env file.');
  }

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4-vision-preview',
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: prompt },
            { type: 'image_url', image_url: { url: imageUri } }
          ]
        }
      ],
      max_tokens: 150,
      temperature: 0.7,
    });

    return response.choices[0]?.message?.content || 'Unable to generate caption';
  } catch (error) {
    console.error('Error generating caption:', error);
    throw new Error('Failed to generate caption');
  }
};

export const analyzeImage = async (imageUri: string, prompt: string): Promise<string> => {
  if (!OPENAI_API_KEY) {
    throw new Error('OpenAI API key not configured. Please add EXPO_PUBLIC_OPENAI_API_KEY to your .env file.');
  }

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4-vision-preview',
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: prompt },
            { type: 'image_url', image_url: { url: imageUri } }
          ]
        }
      ],
      max_tokens: 200,
      temperature: 0.3,
    });

    return response.choices[0]?.message?.content || '{"mood":"unknown","objects":[],"colors":[],"tags":[]}';
  } catch (error) {
    console.error('Error analyzing image:', error);
    return '{"mood":"unknown","objects":[],"colors":[],"tags":[]}';
  }
};

export const openAIService = new OpenAIService(); 