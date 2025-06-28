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
   * Store workout content in memory system (demo mode - logs only)
   */
  static async storeWorkoutMemory(
    userId: string,
    mediaUri: string,
    mediaType: 'photo' | 'video',
    caption: string
  ): Promise<WorkoutEntry | null> {
    try {
      console.log('🏋️ Storing workout memory for user (demo mode):', userId);

      // Extract workout information
      const workoutInfo = this.extractWorkoutInfo(caption);
      
      // Create workout entry (demo mode - no actual storage)
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
        embeddingId: `demo_embed_${Date.now()}`,
        workoutDate: new Date().toISOString().split('T')[0]
      };

      console.log('✅ Workout memory logged (demo mode):', {
        muscleGroups: workoutInfo.muscleGroups,
        exercises: workoutInfo.exercises,
        workoutTypes: workoutInfo.detectedWorkouts
      });
      
      return workoutEntry;

    } catch (error) {
      console.error('❌ Error storing workout memory:', error);
      return null;
    }
  }

  /**
   * Search workout memories using natural language (conversation + demo)
   */
  static async searchWorkoutMemories(
    userId: string,
    query: string,
    limit: number = 10
  ): Promise<WorkoutSearchResult[]> {
    try {
      console.log('🔍 Searching workout memories:', query);

      // Search both conversation memory AND demo data
      const conversationResults = await this.searchConversationWorkouts(userId, query, limit);
      const demoResults = this.getDemoWorkoutResults(query, limit);

      // Combine and prioritize conversation results
      const combinedResults = [...conversationResults, ...demoResults].slice(0, limit);

      console.log(`✅ Found ${conversationResults.length} conversation workouts + ${demoResults.length} demo workouts`);
      return combinedResults;

    } catch (error) {
      console.error('❌ Error searching workout memories:', error);
      return this.getDemoWorkoutResults(query, limit);
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
                workoutDate: message.timestamp.toISOString().split('T')[0]
              };

              workoutResults.push({
                entry: workoutEntry,
                similarity: relevance,
                relevantText: message.text
              });
              
              console.log(`✅ Added workout result: "${message.text}" (score: ${relevance})`);
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
   * Generate demo workout results for demonstration
   */
  private static getDemoWorkoutResults(query: string, limit: number): WorkoutSearchResult[] {
    const lowerQuery = query.toLowerCase();
    
    const demoWorkouts = [
      {
        id: 'demo_workout_1',
        userId: 'demo-user',
        mediaUri: 'demo://workout1.jpg',
        mediaType: 'photo' as const,
        caption: '💪 Crushed chest day today! Bench press 3x12, incline press 3x10, flies 3x15. Feeling the pump! #ChestDay #BenchPress',
        detectedWorkouts: ['chest day'],
        muscleGroups: ['chest', 'arms'],
        exercises: ['bench press', 'incline press', 'flies'],
        timestamp: Date.now() - (2 * 24 * 60 * 60 * 1000), // 2 days ago
        embeddingId: 'demo_embed_1',
        workoutDate: new Date(Date.now() - (2 * 24 * 60 * 60 * 1000)).toISOString().split('T')[0]
      },
      {
        id: 'demo_workout_2',
        userId: 'demo-user',
        mediaUri: 'demo://workout2.jpg',
        mediaType: 'photo' as const,
        caption: '🦵 Leg day destruction! Squats 4x8, Romanian deadlifts 3x10, leg press 3x15. Can barely walk! #LegDay #Squats',
        detectedWorkouts: ['leg day'],
        muscleGroups: ['legs', 'glutes'],
        exercises: ['squats', 'deadlifts', 'leg press'],
        timestamp: Date.now() - (5 * 24 * 60 * 60 * 1000), // 5 days ago
        embeddingId: 'demo_embed_2',
        workoutDate: new Date(Date.now() - (5 * 24 * 60 * 60 * 1000)).toISOString().split('T')[0]
      },
      {
        id: 'demo_workout_3',
        userId: 'demo-user',
        mediaUri: 'demo://workout3.jpg',
        mediaType: 'photo' as const,
        caption: '💪 Pull day vibes! Lat pulldowns 4x10, barbell rows 3x8, bicep curls 3x12. Back and biceps on fire! #PullDay #BackDay',
        detectedWorkouts: ['pull day'],
        muscleGroups: ['back', 'arms'],
        exercises: ['pulldowns', 'rows', 'curls'],
        timestamp: Date.now() - (7 * 24 * 60 * 60 * 1000), // 7 days ago
        embeddingId: 'demo_embed_3',
        workoutDate: new Date(Date.now() - (7 * 24 * 60 * 60 * 1000)).toISOString().split('T')[0]
      },
      {
        id: 'demo_workout_4',
        userId: 'demo-user',
        mediaUri: 'demo://workout4.jpg',
        mediaType: 'photo' as const,
        caption: '🔥 HIIT cardio session! 30 minutes of intervals on the treadmill. Sweat city! #Cardio #HIIT #Treadmill',
        detectedWorkouts: ['cardio'],
        muscleGroups: ['core'],
        exercises: ['running', 'intervals'],
        timestamp: Date.now() - (10 * 24 * 60 * 60 * 1000), // 10 days ago
        embeddingId: 'demo_embed_4',
        workoutDate: new Date(Date.now() - (10 * 24 * 60 * 60 * 1000)).toISOString().split('T')[0]
      },
      {
        id: 'demo_workout_5',
        userId: 'demo-user',
        mediaUri: 'demo://workout5.jpg',
        mediaType: 'photo' as const,
        caption: '💪 Arm day complete! Bicep curls 4x12, tricep extensions 4x10, hammer curls 3x15. Arms are pumped! #ArmDay #Biceps #Triceps',
        detectedWorkouts: ['arm day'],
        muscleGroups: ['arms'],
        exercises: ['curls', 'extensions'],
        timestamp: Date.now() - (12 * 24 * 60 * 60 * 1000), // 12 days ago
        embeddingId: 'demo_embed_5',
        workoutDate: new Date(Date.now() - (12 * 24 * 60 * 60 * 1000)).toISOString().split('T')[0]
      }
    ];

    // Filter workouts based on query relevance
    const filteredWorkouts = demoWorkouts.filter(workout => {
      const searchText = `${workout.caption} ${workout.muscleGroups.join(' ')} ${workout.exercises.join(' ')} ${workout.detectedWorkouts.join(' ')}`.toLowerCase();
      
      // Check for keyword matches
      if (lowerQuery.includes('chest') && searchText.includes('chest')) return true;
      if (lowerQuery.includes('leg') && searchText.includes('leg')) return true;
      if (lowerQuery.includes('arm') && searchText.includes('arm')) return true;
      if (lowerQuery.includes('back') && searchText.includes('back')) return true;
      if (lowerQuery.includes('pull') && searchText.includes('pull')) return true;
      if (lowerQuery.includes('cardio') && searchText.includes('cardio')) return true;
      if (lowerQuery.includes('squat') && searchText.includes('squat')) return true;
      if (lowerQuery.includes('bench') && searchText.includes('bench')) return true;
      if (lowerQuery.includes('week') || lowerQuery.includes('last') || lowerQuery.includes('recent')) return true;
      
      return true; // Return all for general queries
    });

    // Convert to WorkoutSearchResult format
    return filteredWorkouts.slice(0, limit).map(workout => ({
      entry: workout,
      similarity: 0.85, // Demo similarity score
      relevantText: workout.caption
    }));
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