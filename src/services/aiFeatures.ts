import { generateCaption, analyzeImage } from './openai';
import { queryPinecone, upsertToPinecone } from './pinecone';
import { callLangChain } from './langchain';

// AI-powered content analysis and enhancement
export interface ContentAnalysis {
  caption: string;
  tags: string[];
  mood: string;
  objects: string[];
  colors: string[];
  confidence: number;
}

export interface ContentVector {
  id: string;
  vector: number[];
  metadata: {
    uri: string;
    type: 'photo' | 'video';
    caption: string;
    tags: string[];
    timestamp: number;
    userId: string;
  };
}

// 1. AI-POWERED CAPTION GENERATION
export const generateSmartCaption = async (imageUri: string, context?: string): Promise<string> => {
  try {
    console.log('🤖 Generating smart caption for content...');
    
    // Use OpenAI to analyze the image and generate a caption
    const prompt = context 
      ? `Generate a fun, engaging caption for this image. Context: ${context}`
      : 'Generate a fun, engaging caption for this image that would work well on social media';
    
    const caption = await generateCaption(imageUri, prompt);
    
    console.log('✅ Smart caption generated:', caption);
    return caption;
  } catch (error) {
    console.error('❌ Error generating smart caption:', error);
    return 'Unable to generate caption';
  }
};

// 2. CONTENT VECTOR EMBEDDING AND STORAGE
export const createContentEmbedding = async (content: {
  uri: string;
  type: 'photo' | 'video';
  caption: string;
  userId: string;
}): Promise<ContentVector | null> => {
  try {
    console.log('🔮 Creating content embedding...');
    
    // Analyze the content first
    const analysis = await analyzeContent(content.uri, content.type);
    
    // Create a text representation for embedding
    const textForEmbedding = `${content.caption} ${analysis.tags.join(' ')} ${analysis.mood} ${analysis.objects.join(' ')}`;
    
    // Get embedding from OpenAI
    const response = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.EXPO_PUBLIC_OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'text-embedding-3-large',
        input: textForEmbedding,
        dimensions: 3072 // Matches your rag-project-index
      }),
    });
    
    const embeddingData = await response.json();
    
    if (!embeddingData.data || !embeddingData.data[0]) {
      throw new Error('Failed to generate embedding');
    }
    
    const contentVector: ContentVector = {
      id: `content_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      vector: embeddingData.data[0].embedding,
      metadata: {
        uri: content.uri,
        type: content.type,
        caption: content.caption,
        tags: analysis.tags,
        timestamp: Date.now(),
        userId: content.userId,
      },
    };
    
    // Store in Pinecone
    const upsertResult = await upsertToPinecone([{
      id: contentVector.id,
      values: contentVector.vector,
      metadata: contentVector.metadata,
    }]);
    
    console.log('✅ Content embedding created and stored');
    return contentVector;
    
  } catch (error) {
    console.error('❌ Error creating content embedding:', error);
    return null;
  }
};

// 3. SMART CONTENT SEARCH
export const searchSimilarContent = async (query: string, userId?: string, limit: number = 10) => {
  try {
    console.log('🔍 Searching for similar content:', query);
    
    // Create embedding for the search query
    const response = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.EXPO_PUBLIC_OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'text-embedding-3-large',
        input: query,
        dimensions: 3072
      }),
    });
    
    const embeddingData = await response.json();
    const queryVector = embeddingData.data[0].embedding;
    
    // Search Pinecone for similar content
    const searchResults = await queryPinecone(queryVector, limit);
    
    // Filter by user if specified
    const filteredResults = userId 
      ? (searchResults.matches || []).filter((match: any) => match.metadata?.userId === userId)
      : (searchResults.matches || []);
    
    console.log(`✅ Found ${filteredResults?.length || 0} similar content items`);
    return filteredResults || [];
    
  } catch (error) {
    console.error('❌ Error searching similar content:', error);
    return [];
  }
};

// 4. CONTENT ANALYSIS
export const analyzeContent = async (uri: string, type: 'photo' | 'video'): Promise<ContentAnalysis> => {
  try {
    console.log('🔍 Analyzing content...');
    
    if (type === 'photo') {
      // Use OpenAI Vision API for image analysis
      const analysis = await analyzeImage(uri, 
        'Analyze this image and provide: mood, objects, colors, and suggested tags. Format as JSON with keys: mood, objects, colors, tags'
      );
      
      // Parse the analysis (you might need to adjust based on actual response format)
      const parsed = JSON.parse(analysis);
      
      return {
        caption: '',
        tags: parsed.tags || [],
        mood: parsed.mood || 'neutral',
        objects: parsed.objects || [],
        colors: parsed.colors || [],
        confidence: 0.8,
      };
    } else {
      // For videos, we'll use a simplified analysis
      return {
        caption: '',
        tags: ['video', 'media'],
        mood: 'dynamic',
        objects: ['video_content'],
        colors: ['mixed'],
        confidence: 0.6,
      };
    }
  } catch (error) {
    console.error('❌ Error analyzing content:', error);
    return {
      caption: '',
      tags: ['content'],
      mood: 'unknown',
      objects: [],
      colors: [],
      confidence: 0.1,
    };
  }
};

// 5. AI CHAT ASSISTANT
export const chatWithAI = async (message: string, context?: any): Promise<string> => {
  try {
    console.log('💬 Chatting with AI assistant...');
    
    const contextualPrompt = context 
      ? `User message: "${message}". Context: ${JSON.stringify(context)}`
      : message;
    
    const response = await callLangChain(contextualPrompt);
    
    console.log('✅ AI response generated');
    return response.response || 'I apologize, but I could not process your request at this time.';
    
  } catch (error) {
    console.error('❌ Error in AI chat:', error);
    return 'Sorry, I encountered an error. Please try again.';
  }
};

// 6. PERSONALIZED CONTENT RECOMMENDATIONS
export const getPersonalizedRecommendations = async (userId: string, preferences: string[]): Promise<any[]> => {
  try {
    console.log('🎯 Getting personalized recommendations...');
    
    // Create a preference vector
    const preferenceText = preferences.join(' ');
    const response = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.EXPO_PUBLIC_OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'text-embedding-3-large',
        input: preferenceText,
        dimensions: 3072
      }),
    });
    
    const embeddingData = await response.json();
    const preferenceVector = embeddingData.data[0].embedding;
    
    // Search for similar content
    const recommendations = await queryPinecone(preferenceVector, 15);
    
    // Filter out user's own content and return recommendations
    const filteredRecommendations = (recommendations.matches || []).filter(
      (match: any) => match.metadata?.userId !== userId
    ) || [];
    
    console.log(`✅ Found ${filteredRecommendations.length} personalized recommendations`);
    return filteredRecommendations;
    
  } catch (error) {
    console.error('❌ Error getting recommendations:', error);
    return [];
  }
};

// 7. AUTO-TAGGING SYSTEM
export const generateAutoTags = async (content: string): Promise<string[]> => {
  try {
    console.log('🏷️ Generating auto tags...');
    
    const prompt = `Generate 5-10 relevant hashtags for this content: "${content}". Return only the hashtags without # symbols, separated by commas.`;
    
    const response = await callLangChain(prompt);
    const tags = response.response.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);
    
    console.log('✅ Auto tags generated:', tags);
    return tags;
    
  } catch (error) {
    console.error('❌ Error generating auto tags:', error);
    return [];
  }
};

// 8. CONTENT MODERATION
export const moderateContent = async (content: string, imageUri?: string): Promise<{
  isAppropriate: boolean;
  confidence: number;
  reasons: string[];
}> => {
  try {
    console.log('🛡️ Moderating content...');
    
    const moderationPrompt = `Analyze this content for appropriateness: "${content}". 
    Return JSON with: isAppropriate (boolean), confidence (0-1), reasons (array of strings if inappropriate).`;
    
    const response = await callLangChain(moderationPrompt);
    const moderation = JSON.parse(response.response);
    
    console.log('✅ Content moderation complete');
    return {
      isAppropriate: moderation.isAppropriate ?? true,
      confidence: moderation.confidence ?? 0.5,
      reasons: moderation.reasons ?? [],
    };
    
  } catch (error) {
    console.error('❌ Error moderating content:', error);
    return {
      isAppropriate: true,
      confidence: 0.1,
      reasons: ['Error in moderation'],
    };
  }
}; 