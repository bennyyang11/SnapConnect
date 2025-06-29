// Removed Pinecone imports - using LangChain only

// Workout Memory Types
export interface WorkoutEntry {
  id: string;
  userId: string;
  mediaUri: string;
  mediaType: 'photo' | 'video';
  caption: string;
  detectedWorkouts: string[];
  muscleGroups: string[];
  exercises: string[];
  timestamp: number;
  embeddingId: string;
  workoutDate: string; // YYYY-MM-DD format
}

export interface WorkoutSearchResult {
  entry: WorkoutEntry;
  similarity: number;
  relevantText: string;
}

export interface WorkoutSummary {
  query: string;
  workouts: WorkoutSearchResult[];
  summary: string;
  totalWorkouts: number;
  dateRange: { start: string; end: string };
  muscleGroups: string[];
  exercises: string[];
}

// Workout detection keywords and patterns
const WORKOUT_KEYWORDS = [
  // General workout terms
  'workout', 'exercise', 'training', 'gym', 'fitness', 'lift', 'lifting',
  'rep', 'reps', 'set', 'sets', 'weight', 'weights', 'cardio', 'strength',
  
  // Muscle groups
  'chest', 'back', 'shoulders', 'arms', 'legs', 'core', 'abs', 'glutes',
  'biceps', 'triceps', 'quads', 'hamstrings', 'calves', 'lats', 'delts',
  
  // Exercises (including compound names)
  'squat', 'deadlift', 'bench', 'bench press', 'press', 'curl', 'row', 'pullup', 'pushup',
  'plank', 'lunge', 'dip', 'fly', 'raise', 'extension', 'crunch',
  'incline press', 'decline press', 'overhead press', 'shoulder press',
  'barbell row', 'dumbbell row', 'lat pulldown', 'pull down',
  
  // Workout types
  'leg day', 'arm day', 'push day', 'pull day', 'upper body', 'lower body',
  'full body', 'hiit', 'crossfit', 'powerlifting', 'bodybuilding',
  
  // Equipment
  'dumbbell', 'barbell', 'kettlebell', 'machine', 'cable', 'treadmill',
  'bike', 'elliptical', 'smith machine'
];

const MUSCLE_GROUP_MAP: { [key: string]: string[] } = {
  chest: ['chest', 'pecs', 'pectorals', 'bench'],
  back: ['back', 'lats', 'latissimus', 'rows', 'pullups', 'deadlift'],
  shoulders: ['shoulders', 'delts', 'deltoids', 'press', 'raise'],
  arms: ['arms', 'biceps', 'triceps', 'curls', 'extensions'],
  legs: ['legs', 'quads', 'hamstrings', 'calves', 'squats', 'lunges'],
  core: ['core', 'abs', 'abdominals', 'planks', 'crunches'],
  glutes: ['glutes', 'butt', 'hip thrusts', 'bridges']
};

const EXERCISE_PATTERNS = [
  // Common exercise patterns
  /(\d+)\s*(reps?|repetitions?)/gi,
  /(\d+)\s*(sets?)/gi,
  /(\d+)\s*(lbs?|pounds?|kg|kilograms?)/gi,
  /(bench|squat|deadlift|curl|press|row|raise|extension|fly|dip|pullup|pushup|plank|lunge|crunch)/gi
];

export class WorkoutMemoryService {
  private static readonly WORKOUT_NAMESPACE = 'workout_memory';
  
  /**
   * Detect if content is workout-related
   */
  static isWorkoutContent(caption: string): boolean {
    const lowerCaption = caption.toLowerCase();
    return WORKOUT_KEYWORDS.some(keyword => lowerCaption.includes(keyword));
  }

  /**
   * Extract workout information from caption
   */
  static extractWorkoutInfo(caption: string): {
    muscleGroups: string[];
    exercises: string[];
    detectedWorkouts: string[];
  } {
    const lowerCaption = caption.toLowerCase();
    const muscleGroups: string[] = [];
    const exercises: string[] = [];
    const detectedWorkouts: string[] = [];

    // Detect muscle groups
    Object.entries(MUSCLE_GROUP_MAP).forEach(([group, keywords]) => {
      if (keywords.some(keyword => lowerCaption.includes(keyword))) {
        muscleGroups.push(group);
      }
    });

    // Extract exercises using patterns
    EXERCISE_PATTERNS.forEach(pattern => {
      const matches = caption.match(pattern);
      if (matches) {
        exercises.push(...matches.map(match => match.toLowerCase()));
      }
    });

    // Detect specific workout patterns
    if (lowerCaption.includes('leg day')) detectedWorkouts.push('leg day');
    if (lowerCaption.includes('arm day')) detectedWorkouts.push('arm day');
    if (lowerCaption.includes('push day')) detectedWorkouts.push('push day');
    if (lowerCaption.includes('pull day')) detectedWorkouts.push('pull day');
    if (lowerCaption.includes('chest day')) detectedWorkouts.push('chest day');
    if (lowerCaption.includes('back day')) detectedWorkouts.push('back day');

    return {
      muscleGroups: [...new Set(muscleGroups)],
      exercises: [...new Set(exercises)],
      detectedWorkouts: [...new Set(detectedWorkouts)]
    };
  }

  /**
   * Store workout content in Pinecone memory system
   */
  static async storeWorkoutMemory(
    userId: string,
    mediaUri: string,
    mediaType: 'photo' | 'video',
    caption: string
  ): Promise<WorkoutEntry | null> {
    try {
      console.log('🏋️ Storing workout memory in Pinecone for user:', userId);

      // Extract workout information
      const workoutInfo = this.extractWorkoutInfo(caption);
      
      // Only store if it's actually workout-related content
      if (!this.isWorkoutContent(caption)) {
        console.log('📝 Content not workout-related, skipping storage');
        return null;
      }

      // Create workout entry
      const workoutEntry: WorkoutEntry = {
        id: `workout_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userId,
        mediaUri,
        mediaType,
        caption,
        detectedWorkouts: workoutInfo.detectedWorkouts,
        muscleGroups: workoutInfo.muscleGroups,
        exercises: workoutInfo.exercises,
        timestamp: Date.now(),
        embeddingId: `workout_embed_${Date.now()}`,
        workoutDate: new Date().toLocaleDateString('en-CA') // YYYY-MM-DD format in local timezone
      };

      // Store in Pinecone using the existing content embedding system
      try {
        const { createContentEmbedding } = await import('./aiFeatures');
        
        const contentVector = await createContentEmbedding({
          uri: mediaUri,
          type: mediaType,
          caption: caption,
          userId: userId
        });

        if (contentVector) {
          console.log('✅ Workout memory stored in Pinecone successfully');
          console.log('🏋️ Workout details:', {
            muscleGroups: workoutInfo.muscleGroups,
            exercises: workoutInfo.exercises,
            workoutTypes: workoutInfo.detectedWorkouts,
            date: workoutEntry.workoutDate
          });
        } else {
          console.warn('⚠️ Failed to store workout in Pinecone');
        }
      } catch (pineconeError) {
        console.error('❌ Error storing workout in Pinecone:', pineconeError);
      }
      
      return workoutEntry;

    } catch (error) {
      console.error('❌ Error storing workout memory:', error);
      return null;
    }
  }

  /**
   * Search workout memories using natural language (conversation + Pinecone)
   */
  static async searchWorkoutMemories(
    userId: string,
    query: string,
    limit: number = 10
  ): Promise<WorkoutSearchResult[]> {
    try {
      console.log('🔍 Searching workout memories:', query);

      // Search conversation memory for workout mentions
      const conversationResults = await this.searchConversationWorkouts(userId, query, Math.ceil(limit / 2));
      
      // Search Pinecone for stored workout content
      const pineconeResults = await this.searchPineconeWorkouts(userId, query, Math.ceil(limit / 2));

      // Combine and prioritize results
      const combinedResults = [...conversationResults, ...pineconeResults]
        .sort((a, b) => {
          // First by relevance, then by recency
          if (Math.abs(a.similarity - b.similarity) < 0.1) {
            return b.entry.timestamp - a.entry.timestamp; // More recent first
          }
          return b.similarity - a.similarity; // Higher relevance first
        })
        .slice(0, limit);

      console.log(`✅ Found ${conversationResults.length} conversation workouts + ${pineconeResults.length} Pinecone workouts`);
      return combinedResults;

    } catch (error) {
      console.error('❌ Error searching workout memories:', error);
      // Return only conversation results if Pinecone fails
      return await this.searchConversationWorkouts(userId, query, limit);
    }
  }

  /**
   * Search through conversation history for workout mentions
   */
  private static async searchConversationWorkouts(
    userId: string,
    query: string,
    limit: number
  ): Promise<WorkoutSearchResult[]> {
    try {
      console.log('🔍 Searching conversation history for workouts...');

      // Import the fitness messages from the store
      const { useAppStore } = await import('../store/useAppStore');
      const { fitnessMessages } = useAppStore.getState();

      console.log(`📊 Debug: Found ${fitnessMessages?.length || 0} total fitness messages`);

      if (!fitnessMessages || fitnessMessages.length === 0) {
        console.log('📝 No conversation history found');
        return [];
      }

      const lowerQuery = query.toLowerCase();
      const workoutResults: WorkoutSearchResult[] = [];

      // Debug: Log all user messages
      const userMessages = fitnessMessages.filter(msg => msg.isUser && msg.text);
      console.log(`👤 Debug: Found ${userMessages.length} user messages`);
      userMessages.forEach((msg, i) => {
        console.log(`  ${i + 1}. "${msg.text}" (${msg.timestamp.toLocaleString()})`);
      });

      // Search through user messages for workout mentions
      fitnessMessages
        .filter(msg => msg.isUser && msg.text) // Only user messages
        .reverse() // Most recent first
        .forEach((message, index) => {
          const lowerText = message.text.toLowerCase();
          
          // Debug: Check specific keywords
          const foundKeywords = WORKOUT_KEYWORDS.filter(keyword => lowerText.includes(keyword));
          if (foundKeywords.length > 0) {
            console.log(`🎯 Found workout keywords in "${message.text}": ${foundKeywords.join(', ')}`);
          }
          
          // Check if message contains workout-related content
          const isWorkoutRelated = WORKOUT_KEYWORDS.some(keyword => lowerText.includes(keyword));
          
          if (isWorkoutRelated) {
            console.log(`💪 Workout-related message found: "${message.text}"`);
            
            // Extract workout info from the message
            const workoutInfo = this.extractWorkoutInfo(message.text);
            console.log(`📝 Extracted workout info:`, workoutInfo);
            
            // Check if this message matches the query
            const searchText = `${message.text} ${workoutInfo.muscleGroups.join(' ')} ${workoutInfo.exercises.join(' ')}`.toLowerCase();
            
            let relevance = 0;
            
            // Calculate relevance score
            if (lowerQuery.includes('today') && this.isToday(message.timestamp)) {
              relevance += 1.0;
              console.log(`⏰ Today match: +1.0`);
            } else if (lowerQuery.includes('yesterday') && this.isYesterday(message.timestamp)) {
              relevance += 1.0;
              console.log(`⏰ Yesterday match: +1.0`);
            } else if (lowerQuery.includes('last week') && this.isLastWeek(message.timestamp)) {
              relevance += 0.8;
              console.log(`⏰ Last week match: +0.8`);
            } else if (lowerQuery.includes('recent') && this.isRecent(message.timestamp)) {
              relevance += 0.7;
              console.log(`⏰ Recent match: +0.7`);
            }
            
            // Check for specific exercise mentions
            const queryWords = lowerQuery.split(' ');
            queryWords.forEach(word => {
              if (word.length > 2 && searchText.includes(word)) {
                relevance += 0.3;
                console.log(`🔍 Keyword "${word}" match: +0.3`);
              }
            });
            
            // Always include workout-related messages with base relevance
            if (relevance === 0) {
              relevance = 0.5; // Base relevance for any workout mention
              console.log(`💪 Base workout relevance: +0.5`);
            }
            
            console.log(`📊 Total relevance: ${relevance}`);
            
            if (relevance > 0.2) { // Only include relevant results
              // Fix: Use local date instead of UTC to prevent timezone issues
              const localDate = new Date(message.timestamp);
              const year = localDate.getFullYear();
              const month = String(localDate.getMonth() + 1).padStart(2, '0');
              const day = String(localDate.getDate()).padStart(2, '0');
              const workoutDateLocal = `${year}-${month}-${day}`;
              
              const workoutEntry: WorkoutEntry = {
                id: `conv_workout_${message.id}`,
                userId,
                mediaUri: 'conversation://message',
                mediaType: 'photo',
                caption: message.text,
                detectedWorkouts: workoutInfo.detectedWorkouts,
                muscleGroups: workoutInfo.muscleGroups,
                exercises: workoutInfo.exercises,
                timestamp: message.timestamp.getTime(),
                embeddingId: `conv_embed_${message.id}`,
                workoutDate: workoutDateLocal
              };

              workoutResults.push({
                entry: workoutEntry,
                similarity: relevance,
                relevantText: message.text
              });
              
              console.log(`✅ Added workout result: "${message.text}" (score: ${relevance}) - Date: ${workoutDateLocal}`);
            }
          }
        });

      // Sort by relevance and recency
      const sortedResults = workoutResults
        .sort((a, b) => {
          // First by relevance, then by recency
          if (Math.abs(a.similarity - b.similarity) < 0.1) {
            return b.entry.timestamp - a.entry.timestamp; // More recent first
          }
          return b.similarity - a.similarity; // Higher relevance first
        })
        .slice(0, limit);

      console.log(`✅ Found ${sortedResults.length} workout mentions in conversations`);
      return sortedResults;

    } catch (error) {
      console.error('❌ Error searching conversation workouts:', error);
      return [];
    }
  }

  /**
   * Search Pinecone for workout-related content
   */
  private static async searchPineconeWorkouts(
    userId: string,
    query: string,
    limit: number
  ): Promise<WorkoutSearchResult[]> {
    try {
      console.log('🔍 Searching Pinecone for workout content...');

      // Import required functions
      const { queryPinecone } = await import('./pinecone');
      
      // Create search query with workout context
      const workoutQuery = `${query} workout fitness exercise gym training muscle`;
      
      // Convert text query to embeddings first
      try {
        const embeddingResponse = await fetch('https://api.openai.com/v1/embeddings', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.EXPO_PUBLIC_OPENAI_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'text-embedding-3-large',
            input: workoutQuery,
            dimensions: 3072 // Matches your rag-project-index
          }),
        });

        if (!embeddingResponse.ok) {
          throw new Error(`Embedding failed: ${embeddingResponse.status}`);
        }

        const embeddingData = await embeddingResponse.json();
        const queryVector = embeddingData.data[0].embedding;

        // Query Pinecone with the vector
        const pineconeResponse = await queryPinecone(queryVector, limit * 2); // Get more to filter
        const pineconeResults = pineconeResponse.matches || [];
        
        if (!pineconeResults || pineconeResults.length === 0) {
          console.log('📝 No Pinecone workout results found');
          return [];
        }

        console.log(`📊 Found ${pineconeResults.length} Pinecone results`);

        // Convert Pinecone results to WorkoutSearchResult format
        const workoutResults: WorkoutSearchResult[] = [];
        
        for (const result of pineconeResults) {
          try {
            const metadata = result.metadata;
            
            // Only include results that have workout-related content
            const caption = metadata.caption || metadata.text || '';
            const isWorkoutRelated = this.isWorkoutContent(caption);
            
            if (isWorkoutRelated && metadata.userId === userId) {
              // Extract workout info
              const workoutInfo = this.extractWorkoutInfo(caption);
              
              // Create proper date handling for Pinecone stored content
              let workoutDate = '';
              if (metadata.timestamp) {
                const date = new Date(metadata.timestamp);
                const year = date.getFullYear();
                const month = String(date.getMonth() + 1).padStart(2, '0');
                const day = String(date.getDate()).padStart(2, '0');
                workoutDate = `${year}-${month}-${day}`;
              } else {
                workoutDate = new Date().toLocaleDateString('en-CA');
              }
              
              const workoutEntry: WorkoutEntry = {
                id: result.id || `pinecone_${Date.now()}`,
                userId,
                mediaUri: metadata.uri || metadata.mediaUri || 'pinecone://content',
                mediaType: (metadata.type as 'photo' | 'video') || 'photo',
                caption,
                detectedWorkouts: workoutInfo.detectedWorkouts,
                muscleGroups: workoutInfo.muscleGroups,
                exercises: workoutInfo.exercises,
                timestamp: metadata.timestamp || Date.now(),
                embeddingId: result.id || '',
                workoutDate
              };

              workoutResults.push({
                entry: workoutEntry,
                similarity: result.score || 0.7,
                relevantText: caption
              });
              
              console.log(`✅ Added Pinecone workout: "${caption.substring(0, 50)}..." - Date: ${workoutDate}`);
            }
          } catch (entryError) {
            console.warn('⚠️ Error processing Pinecone result:', entryError);
          }
        }

        console.log(`✅ Processed ${workoutResults.length} Pinecone workout results`);
        return workoutResults.slice(0, limit);

      } catch (embeddingError) {
        console.error('❌ Error creating embedding for query:', embeddingError);
        return [];
      }

    } catch (error) {
      console.error('❌ Error searching Pinecone workouts:', error);
      return [];
    }
  }

  // Helper functions for date checking
  private static isToday(date: Date): boolean {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  }

  private static isYesterday(date: Date): boolean {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    return date.toDateString() === yesterday.toDateString();
  }

  private static isLastWeek(date: Date): boolean {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    return date >= oneWeekAgo;
  }

  private static isRecent(date: Date): boolean {
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
    return date >= threeDaysAgo;
  }

  /**
   * Generate AI summary of workout search results
   */
  static async generateWorkoutSummary(
    query: string,
    results: WorkoutSearchResult[]
  ): Promise<WorkoutSummary> {
    try {
      console.log('🤖 Generating workout summary...');

      if (results.length === 0) {
        return {
          query,
          workouts: [],
          summary: "I couldn't find any workout memories matching your search. Try searching for specific exercises, muscle groups, or dates.",
          totalWorkouts: 0,
          dateRange: { start: '', end: '' },
          muscleGroups: [],
          exercises: []
        };
      }

      // Aggregate data
      const allMuscleGroups = [...new Set(results.flatMap(r => r.entry.muscleGroups))];
      const allExercises = [...new Set(results.flatMap(r => r.entry.exercises))];
      const dates = results.map(r => r.entry.workoutDate).sort();
      const dateRange = { start: dates[0], end: dates[dates.length - 1] };

      // Create summary using OpenAI
      const workoutTexts = results.map((r, i) => 
        `${i + 1}. ${r.entry.workoutDate}: ${r.entry.caption}`
      ).join('\n');

      const summaryPrompt = `
        User searched for: "${query}"
        
        Found ${results.length} workout memories:
        ${workoutTexts}
        
        Muscle groups trained: ${allMuscleGroups.join(', ')}
        Exercises performed: ${allExercises.join(', ')}
        Date range: ${dateRange.start} to ${dateRange.end}
        
        Please provide a helpful summary of these workouts that answers the user's query. 
        Be specific about what they did, when they did it, and any patterns you notice.
        Keep it conversational and encouraging.
      `;

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.EXPO_PUBLIC_OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4',
          messages: [
            {
              role: 'system',
              content: 'You are a helpful fitness coach reviewing workout history. Be encouraging and specific.'
            },
            {
              role: 'user',
              content: summaryPrompt
            }
          ],
          max_tokens: 500,
          temperature: 0.7
        }),
      });

      const aiResponse = await response.json();
      const summary = aiResponse.choices?.[0]?.message?.content || 
        `Found ${results.length} workouts matching "${query}". You trained ${allMuscleGroups.join(', ')} between ${dateRange.start} and ${dateRange.end}.`;

      return {
        query,
        workouts: results,
        summary,
        totalWorkouts: results.length,
        dateRange,
        muscleGroups: allMuscleGroups,
        exercises: allExercises
      };

    } catch (error) {
      console.error('❌ Error generating workout summary:', error);
      return {
        query,
        workouts: results,
        summary: `Found ${results.length} workout memories. Check the details below.`,
        totalWorkouts: results.length,
        dateRange: { start: '', end: '' },
        muscleGroups: [],
        exercises: []
      };
    }
  }

  /**
   * Get workout statistics for a user (demo mode)
   */
  static async getWorkoutStats(userId: string): Promise<{
    totalWorkouts: number;
    muscleGroupsWorked: string[];
    exercisesPerformed: string[];
    workoutFrequency: { [key: string]: number };
    recentWorkouts: WorkoutEntry[];
  }> {
    try {
      console.log('📊 Getting workout stats (demo mode)');
      
      // Get demo workout data
      const recentResults = await this.searchWorkoutMemories(userId, 'workout', 50);
      
      const workouts = recentResults.map(r => r.entry);
      const muscleGroupsWorked = [...new Set(workouts.flatMap(w => w.muscleGroups))];
      const exercisesPerformed = [...new Set(workouts.flatMap(w => w.exercises))];
      
      // Calculate workout frequency by date
      const workoutFrequency: { [key: string]: number } = {};
      workouts.forEach(workout => {
        const date = workout.workoutDate;
        workoutFrequency[date] = (workoutFrequency[date] || 0) + 1;
      });

      return {
        totalWorkouts: workouts.length,
        muscleGroupsWorked,
        exercisesPerformed,
        workoutFrequency,
        recentWorkouts: workouts.slice(0, 10)
      };

    } catch (error) {
      console.error('❌ Error getting workout stats:', error);
      return {
        totalWorkouts: 0,
        muscleGroupsWorked: [],
        exercisesPerformed: [],
        workoutFrequency: {},
        recentWorkouts: []
      };
    }
  }
}

export default WorkoutMemoryService; 