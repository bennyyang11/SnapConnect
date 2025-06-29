import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MuscleBodyDiagram from '../../components/MuscleBodyDiagram';

interface ChatMessage {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
  exercisesExtracted?: string[];
  musclesWorked?: string[];
}

interface WorkoutSession {
  exercises: string[];
  musclesWorked: string[];
  date: Date;
}

export default function FitnessScreen() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      text: "Hey! I'm your AI fitness coach. Tell me about your workout today and I'll help you optimize your training! 💪",
      isUser: false,
      timestamp: new Date(),
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentWorkout, setCurrentWorkout] = useState<WorkoutSession>({
    exercises: [],
    musclesWorked: [],
    date: new Date(),
  });
  
  const scrollViewRef = useRef<ScrollView>(null);

  const OPENAI_API_KEY = process.env.EXPO_PUBLIC_OPENAI_API_KEY;

  // Comprehensive muscle group mapping
  const EXERCISE_MUSCLE_MAP: { [key: string]: string[] } = {
    // Chest
    'bench press': ['chest', 'triceps', 'front_delts'],
    'dumbbell flies': ['chest'],
    'incline bench': ['upper_chest', 'triceps', 'front_delts'],
    'push ups': ['chest', 'triceps', 'front_delts'],
    'chest press': ['chest', 'triceps'],
    'dips': ['lower_chest', 'triceps'],
    
    // Back
    'pull ups': ['lats', 'rear_delts', 'biceps'],
    'lat pulldown': ['lats', 'rear_delts', 'biceps'],
    'rows': ['middle_traps', 'rhomboids', 'rear_delts', 'biceps'],
    'deadlift': ['lower_back', 'glutes', 'hamstrings', 'traps'],
    'barbell rows': ['middle_traps', 'rhomboids', 'lats', 'rear_delts'],
    
    // Legs
    'squats': ['quads', 'glutes', 'calves'],
    'leg press': ['quads', 'glutes'],
    'lunges': ['quads', 'glutes', 'hamstrings'],
    'leg curls': ['hamstrings'],
    'leg extensions': ['quads'],
    'calf raises': ['calves'],
    
    // Shoulders
    'shoulder press': ['front_delts', 'middle_delts', 'triceps'],
    'lateral raises': ['middle_delts'],
    'rear delt flies': ['rear_delts'],
    'upright rows': ['middle_delts', 'traps'],
    
    // Arms
    'bicep curls': ['biceps'],
    'tricep extensions': ['triceps'],
    'hammer curls': ['biceps', 'forearms'],
    'tricep dips': ['triceps'],
    
    // Core
    'crunches': ['abs'],
    'planks': ['abs', 'core'],
    'russian twists': ['obliques'],
    'leg raises': ['lower_abs'],
  };

  const extractExercisesAndMuscles = (text: string): { exercises: string[], muscles: string[] } => {
    const exercises: string[] = [];
    const muscles: string[] = [];
    
    const lowerText = text.toLowerCase();
    
    // Enhanced exercise detection with common variations
    const exerciseVariations: { [key: string]: string[] } = {
      'bench press': ['bench press', 'bench', 'benching', 'bench pressed'],
      'squats': ['squats', 'squat', 'squatting', 'squatted', 'back squat', 'front squat'],
      'deadlift': ['deadlift', 'deadlifts', 'deadlifting', 'deadlifted', 'dl'],
      'pull ups': ['pull ups', 'pull up', 'pullups', 'pullup', 'chin ups', 'chin up'],
      'push ups': ['push ups', 'push up', 'pushups', 'pushup', 'press ups', 'press up'],
      'bicep curls': ['bicep curls', 'bicep curl', 'curls', 'curl', 'arm curls'],
      'tricep extensions': ['tricep extensions', 'tricep extension', 'triceps', 'tricep'],
      'shoulder press': ['shoulder press', 'shoulder pressed', 'overhead press', 'military press'],
      'lateral raises': ['lateral raises', 'lateral raise', 'side raises', 'side raise'],
      'rows': ['rows', 'row', 'rowing', 'rowed', 'barbell rows', 'dumbbell rows'],
      'dips': ['dips', 'dip', 'dipping', 'dipped'],
      'lunges': ['lunges', 'lunge', 'lunging', 'lunged'],
      'leg press': ['leg press', 'leg pressed', 'leg pressing'],
      'leg curls': ['leg curls', 'leg curl', 'hamstring curls', 'hamstring curl'],
      'leg extensions': ['leg extensions', 'leg extension', 'quad extensions'],
      'calf raises': ['calf raises', 'calf raise', 'calves', 'calf'],
      'crunches': ['crunches', 'crunch', 'crunching'],
      'planks': ['planks', 'plank', 'planking'],
    };

    // Check each exercise and its variations
    Object.keys(EXERCISE_MUSCLE_MAP).forEach(exercise => {
      const variations = exerciseVariations[exercise] || [exercise];
      
      const found = variations.some(variation => {
        // Check for whole word matches to avoid false positives
        const regex = new RegExp(`\\b${variation.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
        return regex.test(lowerText);
      });
      
      if (found) {
        exercises.push(exercise);
        muscles.push(...EXERCISE_MUSCLE_MAP[exercise]);
        console.log(`🏋️ Detected exercise: ${exercise} → muscles: ${EXERCISE_MUSCLE_MAP[exercise].join(', ')}`);
      }
    });
    
    return { 
      exercises: [...new Set(exercises)], 
      muscles: [...new Set(muscles)] 
    };
  };

  const sendMessage = async () => {
    if (!inputText.trim()) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      text: inputText,
      isUser: true,
      timestamp: new Date(),
    };

    // Extract exercises and muscles from user input
    const { exercises, muscles } = extractExercisesAndMuscles(inputText);
    
    if (exercises.length > 0) {
      userMessage.exercisesExtracted = exercises;
      userMessage.musclesWorked = muscles;
      
      // Update current workout session
      setCurrentWorkout(prev => ({
        ...prev,
        exercises: [...new Set([...prev.exercises, ...exercises])],
        musclesWorked: [...new Set([...prev.musclesWorked, ...muscles])],
      }));
    }

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsLoading(true);

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'gpt-4',
          messages: [
            {
              role: 'system',
              content: `You are an expert fitness coach and personal trainer. Help users with workout advice, exercise recommendations, and fitness planning. 
              
              Current workout session: ${currentWorkout.exercises.join(', ')}
              Muscles worked so far: ${currentWorkout.musclesWorked.join(', ')}
              
              Guidelines:
              - Be encouraging and motivational
              - Provide specific exercise recommendations
              - Consider muscle balance and recovery
              - Suggest complementary exercises
              - Keep responses concise but helpful
              - Use emojis to make it engaging
              - If they mention specific exercises, acknowledge what muscles they've worked
              - Suggest what muscle groups they should work next for balance`
            },
            {
              role: 'user',
              content: inputText
            }
          ],
          max_tokens: 300,
          temperature: 0.7,
        }),
      });

      const data = await response.json();
      
      if (data.choices && data.choices[0]) {
        const aiResponse: ChatMessage = {
          id: (Date.now() + 1).toString(),
          text: data.choices[0].message.content,
          isUser: false,
          timestamp: new Date(),
        };
        
        setMessages(prev => [...prev, aiResponse]);
      } else {
        throw new Error('Invalid response from AI');
      }
    } catch (error) {
      console.error('OpenAI API Error:', error);
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        text: "Sorry, I'm having trouble connecting right now. But keep crushing those workouts! 💪 Try asking me again.",
        isUser: false,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const clearWorkout = () => {
    Alert.alert(
      'New Workout Session',
      'Start a fresh workout session?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Start Fresh',
          onPress: () => {
            setCurrentWorkout({
              exercises: [],
              musclesWorked: [],
              date: new Date(),
            });
            setMessages([
              {
                id: Date.now().toString(),
                text: "Fresh workout started! What are you training today? 🔥",
                isUser: false,
                timestamp: new Date(),
              }
            ]);
          }
        }
      ]
    );
  };

  useEffect(() => {
    scrollViewRef.current?.scrollToEnd({ animated: true });
  }, [messages]);

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        style={styles.container} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>💪 AI Fitness Coach</Text>
          <TouchableOpacity style={styles.clearButton} onPress={clearWorkout}>
            <Text style={styles.clearButtonText}>New Workout</Text>
          </TouchableOpacity>
        </View>

        {/* Body Diagram */}
        <View style={styles.bodyDiagramContainer}>
          <MuscleBodyDiagram 
            workedMuscles={currentWorkout.musclesWorked}
            allMuscles={[
              'chest', 'upper_chest', 'lower_chest',
              'lats', 'middle_traps', 'rhomboids', 'lower_back',
              'front_delts', 'middle_delts', 'rear_delts',
              'biceps', 'triceps', 'forearms',
              'abs', 'obliques', 'lower_abs', 'core',
              'quads', 'hamstrings', 'glutes', 'calves'
            ]}
            view="front"
          />
          <Text style={styles.legendText}>
            🔴 Worked Today • 🔵 Still Need Work
          </Text>
        </View>

        {/* Chat Messages */}
        <ScrollView 
          ref={scrollViewRef}
          style={styles.chatContainer}
          contentContainerStyle={styles.chatContent}
          showsVerticalScrollIndicator={false}
        >
          {messages.map((message) => (
            <View
              key={message.id}
              style={[
                styles.messageBubble,
                message.isUser ? styles.userMessage : styles.aiMessage,
              ]}
            >
              <Text style={[
                styles.messageText,
                message.isUser ? styles.userMessageText : styles.aiMessageText,
              ]}>
                {message.text}
              </Text>
              
              {message.exercisesExtracted && message.exercisesExtracted.length > 0 && (
                <View style={styles.exerciseChips}>
                  {message.exercisesExtracted.map((exercise, index) => (
                    <View key={index} style={styles.exerciseChip}>
                      <Text style={styles.exerciseChipText}>{exercise}</Text>
                    </View>
                  ))}
                </View>
              )}
              
              <Text style={styles.timestamp}>
                {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </Text>
            </View>
          ))}
          
          {isLoading && (
            <View style={styles.loadingBubble}>
              <ActivityIndicator size="small" color="#FFD700" />
              <Text style={styles.loadingText}>AI is thinking...</Text>
            </View>
          )}
        </ScrollView>

        {/* Input Area */}
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.textInput}
            value={inputText}
            onChangeText={setInputText}
            placeholder="Tell me about your workout..."
            placeholderTextColor="#9E9E9E"
            multiline
            maxLength={500}
            onSubmitEditing={sendMessage}
          />
          <TouchableOpacity 
            style={[styles.sendButton, inputText.trim() ? styles.sendButtonActive : {}]}
            onPress={sendMessage}
            disabled={!inputText.trim() || isLoading}
          >
            <Text style={styles.sendButtonText}>💪</Text>
          </TouchableOpacity>
        </View>

        {/* Current Workout Summary */}
        {currentWorkout.exercises.length > 0 && (
          <View style={styles.workoutSummary}>
            <Text style={styles.summaryTitle}>Today's Workout:</Text>
            <Text style={styles.summaryText}>
              {currentWorkout.exercises.join(' • ')}
            </Text>
          </View>
        )}
      </KeyboardAvoidingView>
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
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#424242',
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
  },
  clearButton: {
    backgroundColor: '#FF6B6B',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
  },
  clearButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  bodyDiagramContainer: {
    alignItems: 'center',
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#424242',
  },
  legendText: {
    color: '#9E9E9E',
    fontSize: 12,
    marginTop: 10,
  },
  chatContainer: {
    flex: 1,
    paddingHorizontal: 15,
  },
  chatContent: {
    paddingVertical: 20,
  },
  messageBubble: {
    maxWidth: '80%',
    marginVertical: 5,
    padding: 12,
    borderRadius: 18,
  },
  userMessage: {
    alignSelf: 'flex-end',
    backgroundColor: '#FFD700',
  },
  aiMessage: {
    alignSelf: 'flex-start',
    backgroundColor: '#2A2A2A',
  },
  messageText: {
    fontSize: 16,
    lineHeight: 20,
  },
  userMessageText: {
    color: '#000000',
  },
  aiMessageText: {
    color: '#FFFFFF',
  },
  exerciseChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
    gap: 4,
  },
  exerciseChip: {
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FFD700',
  },
  exerciseChipText: {
    color: '#FFD700',
    fontSize: 12,
    fontWeight: '600',
  },
  timestamp: {
    fontSize: 10,
    color: '#9E9E9E',
    marginTop: 5,
    textAlign: 'right',
  },
  loadingBubble: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2A2A2A',
    padding: 12,
    borderRadius: 18,
    marginVertical: 5,
  },
  loadingText: {
    color: '#FFFFFF',
    marginLeft: 8,
    fontSize: 14,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#424242',
    backgroundColor: '#161618',
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#424242',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 10,
    color: '#FFFFFF',
    backgroundColor: '#2A2A2A',
    maxHeight: 100,
    fontSize: 16,
  },
  sendButton: {
    marginLeft: 10,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#424242',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonActive: {
    backgroundColor: '#FFD700',
  },
  sendButtonText: {
    fontSize: 20,
  },
  workoutSummary: {
    backgroundColor: '#1A1A1A',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#424242',
  },
  summaryTitle: {
    color: '#FFD700',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  summaryText: {
    color: '#FFFFFF',
    fontSize: 12,
  },
}); 