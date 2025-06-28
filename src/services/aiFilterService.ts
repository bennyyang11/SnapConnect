import OpenAI from 'openai';
import { callLangChain } from './langchain';

// OpenAI API key from environment variables
const OPENAI_API_KEY = process.env.EXPO_PUBLIC_OPENAI_API_KEY || '';

const openai = new OpenAI({
  apiKey: OPENAI_API_KEY,
});

// Filter definitions with mood mappings
export interface FilterDefinition {
  id: string;
  name: string;
  description: string;
  mood: string[];
  visualStyle: string;
  intensity: 'subtle' | 'moderate' | 'intense';
  colorPalette: string[];
  effects: string[];
  tags: string[];
  emoji: string;
}

export interface EmotionAnalysis {
  primaryEmotion: string;
  confidence: number;
  secondaryEmotions: string[];
  mood: string;
  energy: 'low' | 'medium' | 'high';
  valence: 'negative' | 'neutral' | 'positive';
}

export interface FilterRecommendation {
  filter: FilterDefinition;
  confidence: number;
  reasoning: string;
  matchFactors: string[];
}

export interface AIFilterAnalysis {
  textAnalysis?: EmotionAnalysis;
  faceAnalysis?: EmotionAnalysis;
  combinedMood: string;
  topRecommendations: FilterRecommendation[];
  customFilterSuggestion?: string;
}

// AI-powered filter library
const AI_FILTER_LIBRARY: FilterDefinition[] = [
  // Dark/Edgy Filters
  {
    id: 'dark_glitch',
    name: 'Dark Glitch',
    description: 'Corrupted digital aesthetic with dark tones',
    mood: ['edgy', 'rebellious', 'intense', 'mysterious', 'angry'],
    visualStyle: 'glitch',
    intensity: 'intense',
    colorPalette: ['#000000', '#1a1a1a', '#ff0000', '#00ff00'],
    effects: ['glitch', 'digital_noise', 'scan_lines', 'color_shift'],
    tags: ['cyberpunk', 'dark', 'tech', 'underground'],
    emoji: '⚡'
  },
  {
    id: 'noir_shadows',
    name: 'Film Noir',
    description: 'Classic black and white with dramatic shadows',
    mood: ['dramatic', 'mysterious', 'sophisticated', 'moody', 'serious'],
    visualStyle: 'noir',
    intensity: 'moderate',
    colorPalette: ['#000000', '#ffffff', '#808080'],
    effects: ['high_contrast', 'vignette', 'grain', 'shadows'],
    tags: ['classic', 'monochrome', 'cinema', 'vintage'],
    emoji: '🎬'
  },
  
  // Happy/Bright Filters
  {
    id: 'rainbow_sparkles',
    name: 'Rainbow Sparkles',
    description: 'Vibrant rainbow effects with sparkling particles',
    mood: ['happy', 'joyful', 'excited', 'energetic', 'celebration'],
    visualStyle: 'colorful',
    intensity: 'intense',
    colorPalette: ['#ff0000', '#ff8800', '#ffff00', '#00ff00', '#0088ff', '#8800ff'],
    effects: ['sparkles', 'rainbow_gradient', 'light_rays', 'particles'],
    tags: ['fun', 'celebration', 'vibrant', 'magical'],
    emoji: '🌈'
  },
  {
    id: 'golden_hour',
    name: 'Golden Hour',
    description: 'Warm, glowing sunset-inspired filter',
    mood: ['content', 'peaceful', 'romantic', 'nostalgic', 'warm'],
    visualStyle: 'warm',
    intensity: 'moderate',
    colorPalette: ['#ffd700', '#ff8c00', '#ff6347', '#fffacd'],
    effects: ['warm_tone', 'soft_glow', 'lens_flare', 'color_grade'],
    tags: ['sunset', 'warm', 'cozy', 'dreamy'],
    emoji: '🌅'
  },
  
  // Aesthetic Filters
  {
    id: 'vaporwave',
    name: 'Vaporwave',
    description: 'Retro 80s aesthetic with neon colors',
    mood: ['nostalgic', 'dreamy', 'relaxed', 'aesthetic', 'chill'],
    visualStyle: 'retro',
    intensity: 'moderate',
    colorPalette: ['#ff00ff', '#00ffff', '#ff1493', '#9370db'],
    effects: ['neon_glow', 'gradient_overlay', 'grid_lines', 'chromatic_aberration'],
    tags: ['80s', 'synthwave', 'neon', 'retro'],
    emoji: '🏙️'
  },
  {
    id: 'anime_style',
    name: 'Anime Style',
    description: 'Japanese animation inspired with enhanced colors',
    mood: ['playful', 'creative', 'energetic', 'youthful', 'fun'],
    visualStyle: 'animated',
    intensity: 'moderate',
    colorPalette: ['#ff69b4', '#87ceeb', '#98fb98', '#ffd700'],
    effects: ['cel_shading', 'outline_enhance', 'color_pop', 'soft_highlight'],
    tags: ['anime', 'manga', 'kawaii', 'otaku'],
    emoji: '🎌'
  },
  
  // Calm/Peaceful Filters
  {
    id: 'soft_pastel',
    name: 'Soft Pastel',
    description: 'Gentle pastel tones with soft blur',
    mood: ['calm', 'peaceful', 'gentle', 'serene', 'relaxed'],
    visualStyle: 'soft',
    intensity: 'subtle',
    colorPalette: ['#ffc0cb', '#e6e6fa', '#f0fff0', '#fff8dc'],
    effects: ['soft_blur', 'pastel_overlay', 'gentle_glow', 'texture_smooth'],
    tags: ['pastel', 'soft', 'minimal', 'zen'],
    emoji: '🌸'
  },
  {
    id: 'vintage_film',
    name: 'Vintage Film',
    description: 'Classic film photography aesthetic',
    mood: ['nostalgic', 'thoughtful', 'artistic', 'timeless', 'classic'],
    visualStyle: 'vintage',
    intensity: 'moderate',
    colorPalette: ['#8b4513', '#daa520', '#cd853f', '#f5deb3'],
    effects: ['film_grain', 'color_fade', 'light_leaks', 'border_vignette'],
    tags: ['vintage', 'film', 'analog', 'classic'],
    emoji: '📷'
  },
  
  // Additional mood-based filters
  {
    id: 'cyberpunk_neon',
    name: 'Cyberpunk',
    description: 'Futuristic neon-lit cityscape vibes',
    mood: ['futuristic', 'edgy', 'intense', 'tech', 'modern'],
    visualStyle: 'cyberpunk',
    intensity: 'intense',
    colorPalette: ['#00ffff', '#ff00ff', '#ffff00', '#000000'],
    effects: ['neon_outline', 'digital_distortion', 'holographic', 'electric'],
    tags: ['cyberpunk', 'futuristic', 'neon', 'tech'],
    emoji: '🤖'
  },
  {
    id: 'dreamy_clouds',
    name: 'Dreamy Clouds',
    description: 'Soft, ethereal cloud-like overlay',
    mood: ['dreamy', 'peaceful', 'romantic', 'soft', 'fantasy'],
    visualStyle: 'ethereal',
    intensity: 'subtle',
    colorPalette: ['#ffffff', '#e6e6fa', '#87ceeb', '#ffd1dc'],
    effects: ['cloud_overlay', 'soft_focus', 'light_diffusion', 'dreamy_glow'],
    tags: ['clouds', 'dreamy', 'soft', 'romantic'],
    emoji: '☁️'
  }
];

export class AIFilterService {
  /**
   * Analyze text caption for emotional content and mood
   */
  static async analyzeTextEmotion(caption: string): Promise<EmotionAnalysis> {
    try {
      console.log('🔍 Analyzing text emotion for caption:', caption.substring(0, 50) + '...');

      const analysisPrompt = `Analyze the emotional content of this text: "${caption}"
      
      Respond with JSON:
      {
        "primaryEmotion": "main emotion (happy, sad, angry, excited, calm, edgy, mysterious, etc.)",
        "confidence": 0.8,
        "secondaryEmotions": ["emotion1", "emotion2"],
        "mood": "overall mood",
        "energy": "low/medium/high",
        "valence": "negative/neutral/positive"
      }`;

      const result = await callLangChain(analysisPrompt, 'emotion_analysis');
      
      try {
        const cleanResponse = result.response.replace(/```json\n?|\n?```/g, '').trim();
        const analysis = JSON.parse(cleanResponse);
        console.log('✅ Text emotion analysis complete:', analysis.primaryEmotion);
        return analysis;
      } catch (parseError) {
        console.log('⚠️ Using fallback emotion parsing');
        return this.extractEmotionFromText(result.response);
      }

    } catch (error) {
      console.error('❌ Error analyzing text emotion:', error);
      return {
        primaryEmotion: 'neutral',
        confidence: 0.5,
        secondaryEmotions: [],
        mood: 'neutral',
        energy: 'medium',
        valence: 'neutral'
      };
    }
  }

  /**
   * Analyze facial expressions in image using OpenAI Vision
   */
  static async analyzeFacialExpression(imageUri: string): Promise<EmotionAnalysis> {
    if (!OPENAI_API_KEY) {
      throw new Error('OpenAI API key not configured');
    }

    try {
      console.log('😊 Analyzing facial expressions in image...');

      const response = await openai.chat.completions.create({
        model: 'gpt-4-vision-preview',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: `Analyze facial expressions in this image. Return JSON:
                {
                  "primaryEmotion": "main emotion detected",
                  "confidence": 0.8,
                  "secondaryEmotions": ["emotion1", "emotion2"],
                  "mood": "overall mood",
                  "energy": "low/medium/high",
                  "valence": "negative/neutral/positive"
                }`
              },
              {
                type: 'image_url',
                image_url: { url: imageUri }
              }
            ]
          }
        ],
        max_tokens: 300,
        temperature: 0.3,
      });

      const content = response.choices[0]?.message?.content || '{}';
      
      try {
        const cleanContent = content.replace(/```json\n?|\n?```/g, '').trim();
        const analysis = JSON.parse(cleanContent);
        console.log('✅ Facial expression analysis complete:', analysis.primaryEmotion);
        return analysis;
      } catch (parseError) {
        console.log('⚠️ Using fallback facial expression parsing');
        return this.extractEmotionFromText(content);
      }

    } catch (error) {
      console.error('❌ Error analyzing facial expression:', error);
      return {
        primaryEmotion: 'neutral',
        confidence: 0.5,
        secondaryEmotions: [],
        mood: 'neutral',
        energy: 'medium',
        valence: 'neutral'
      };
    }
  }

  /**
   * Generate comprehensive filter recommendations based on text and/or image
   */
  static async generateFilterRecommendations(
    caption?: string,
    imageUri?: string
  ): Promise<AIFilterAnalysis> {
    try {
      console.log('🎨 Generating AI filter recommendations...');

      // Parallel analysis of text and image
      const [textAnalysis, faceAnalysis] = await Promise.all([
        caption ? this.analyzeTextEmotion(caption) : Promise.resolve(undefined),
        imageUri ? this.analyzeFacialExpression(imageUri) : Promise.resolve(undefined)
      ]);

      // Combine analyses to determine overall mood
      const combinedMood = this.combineMoodAnalyses(textAnalysis, faceAnalysis);

      // Find matching filters
      const filterRecommendations = this.matchFiltersToMood(combinedMood, textAnalysis, faceAnalysis);

      // Generate custom filter suggestion if needed
      const customFilterSuggestion = await this.generateCustomFilterSuggestion(
        combinedMood,
        caption,
        textAnalysis,
        faceAnalysis
      );

      console.log('✅ Filter recommendations generated:', filterRecommendations.length);

      return {
        textAnalysis,
        faceAnalysis,
        combinedMood,
        topRecommendations: filterRecommendations,
        customFilterSuggestion
      };

    } catch (error) {
      console.error('❌ Error generating filter recommendations:', error);
      throw error;
    }
  }

  /**
   * Generate a custom filter based on AI analysis
   */
  static async generateCustomFilterDescription(prompt: string): Promise<string> {
    try {
      console.log('🎨 Generating custom filter from prompt:', prompt.substring(0, 50) + '...');

      const filterPrompt = `Create a detailed description for a custom photo filter: "${prompt}"
      
      Include:
      - Creative filter name
      - Visual effects and style
      - Color palette
      - Mood it conveys
      - Specific effects to apply
      
      Be creative and visual.`;

      const result = await callLangChain(filterPrompt, 'custom_filter');
      console.log('✅ Custom filter description generated');
      
      return result.response;

    } catch (error) {
      console.error('❌ Error generating custom filter:', error);
      return 'Unable to generate custom filter. Try describing the mood or style you want.';
    }
  }

  /**
   * Get all available filters by category
   */
  static getFiltersByMood(mood: string): FilterDefinition[] {
    return AI_FILTER_LIBRARY.filter(filter => 
      filter.mood.some(filterMood => 
        filterMood.toLowerCase().includes(mood.toLowerCase()) ||
        mood.toLowerCase().includes(filterMood.toLowerCase())
      )
    );
  }

  /**
   * Get filter by ID
   */
  static getFilterById(filterId: string): FilterDefinition | undefined {
    return AI_FILTER_LIBRARY.find(filter => filter.id === filterId);
  }

  /**
   * Get all available filters
   */
  static getAllFilters(): FilterDefinition[] {
    return AI_FILTER_LIBRARY;
  }

  // Private helper methods
  private static extractEmotionFromText(text: string): EmotionAnalysis {
    const emotionKeywords = {
      happy: ['happy', 'joy', 'smile', 'excited', 'great', 'awesome', 'love', 'amazing'],
      sad: ['sad', 'down', 'upset', 'cry', 'tears', 'hurt', 'depressed'],
      angry: ['angry', 'mad', 'furious', 'rage', 'annoyed', 'pissed'],
      excited: ['excited', 'pumped', 'energy', 'hyped', 'thrilled'],
      calm: ['calm', 'peaceful', 'serene', 'relaxed', 'zen', 'chill'],
      edgy: ['edgy', 'dark', 'intense', 'rebel', 'underground', 'fierce'],
      mysterious: ['mysterious', 'secret', 'hidden', 'enigma', 'dark'],
      romantic: ['romantic', 'love', 'heart', 'beautiful', 'gorgeous'],
      nostalgic: ['nostalgic', 'memories', 'old', 'vintage', 'throwback']
    };

    let detectedEmotion = 'neutral';
    let maxMatches = 0;

    for (const [emotion, keywords] of Object.entries(emotionKeywords)) {
      const matches = keywords.filter(keyword => 
        text.toLowerCase().includes(keyword)
      ).length;
      
      if (matches > maxMatches) {
        maxMatches = matches;
        detectedEmotion = emotion;
      }
    }

    return {
      primaryEmotion: detectedEmotion,
      confidence: maxMatches > 0 ? Math.min(maxMatches * 0.3, 1.0) : 0.5,
      secondaryEmotions: [],
      mood: detectedEmotion,
      energy: maxMatches > 2 ? 'high' : 'medium',
      valence: ['happy', 'excited', 'calm', 'romantic'].includes(detectedEmotion) ? 'positive' : 
               ['sad', 'angry'].includes(detectedEmotion) ? 'negative' : 'neutral'
    };
  }

  private static combineMoodAnalyses(
    textAnalysis?: EmotionAnalysis,
    faceAnalysis?: EmotionAnalysis
  ): string {
    if (!textAnalysis && !faceAnalysis) return 'neutral';
    if (!textAnalysis) return faceAnalysis!.mood;
    if (!faceAnalysis) return textAnalysis.mood;

    // Prioritize facial expression if confidence is significantly higher
    if (faceAnalysis.confidence > textAnalysis.confidence + 0.2) {
      return faceAnalysis.mood;
    }
    
    // Otherwise use text analysis
    return textAnalysis.mood;
  }

  private static matchFiltersToMood(
    combinedMood: string,
    textAnalysis?: EmotionAnalysis,
    faceAnalysis?: EmotionAnalysis
  ): FilterRecommendation[] {
    let matchingFilters = this.getFiltersByMood(combinedMood);
    
    // If no direct matches, get broader matches
    if (matchingFilters.length === 0) {
      const emotion = textAnalysis?.primaryEmotion || faceAnalysis?.primaryEmotion || 'neutral';
      matchingFilters = this.getFiltersByMood(emotion);
    }

    // Still no matches? Get some default recommendations
    if (matchingFilters.length === 0) {
      matchingFilters = AI_FILTER_LIBRARY.slice(0, 3);
    }
    
    // Score and rank filters
    const recommendations = matchingFilters.map(filter => {
      let confidence = 0.5;
      const matchFactors: string[] = [];

      // Mood matching
      if (filter.mood.includes(combinedMood)) {
        confidence += 0.3;
        matchFactors.push(`Matches ${combinedMood} mood`);
      }

      // Energy level matching
      if (textAnalysis || faceAnalysis) {
        const energy = textAnalysis?.energy || faceAnalysis?.energy || 'medium';
        if (
          (energy === 'high' && filter.intensity === 'intense') ||
          (energy === 'medium' && filter.intensity === 'moderate') ||
          (energy === 'low' && filter.intensity === 'subtle')
        ) {
          confidence += 0.2;
          matchFactors.push(`Matches ${energy} energy level`);
        }
      }

      // Valence matching
      if (textAnalysis || faceAnalysis) {
        const valence = textAnalysis?.valence || faceAnalysis?.valence || 'neutral';
        if (
          (valence === 'positive' && ['happy', 'joyful', 'excited'].some(mood => filter.mood.includes(mood))) ||
          (valence === 'negative' && ['dark', 'moody', 'intense'].some(mood => filter.mood.includes(mood)))
        ) {
          confidence += 0.15;
          matchFactors.push(`Matches ${valence} sentiment`);
        }
      }

      return {
        filter,
        confidence: Math.min(confidence, 1.0),
        reasoning: `This filter matches your ${combinedMood} mood with ${filter.intensity} intensity`,
        matchFactors
      };
    });

    // Sort by confidence and return top 3
    return recommendations
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, 3);
  }

  private static async generateCustomFilterSuggestion(
    combinedMood: string,
    caption?: string,
    textAnalysis?: EmotionAnalysis,
    faceAnalysis?: EmotionAnalysis
  ): Promise<string | undefined> {
    try {
      if (!caption || (!textAnalysis && !faceAnalysis)) return undefined;

      const customPrompt = `Based on the mood "${combinedMood}" and caption "${caption}", suggest a unique filter concept not found in typical apps. Be creative and specific about visual effects, colors, and style. Keep it under 100 words.`;

      const result = await callLangChain(customPrompt, 'custom_filter_suggestion');
      return result.response;

    } catch (error) {
      console.error('Error generating custom filter suggestion:', error);
      return undefined;
    }
  }
}

export default AIFilterService; 