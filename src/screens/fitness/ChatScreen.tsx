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
  Keyboard,
  TouchableWithoutFeedback,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppStore } from '../../store/useAppStore';
import { FitnessChatMessage } from '../../types';
import ConversationMemoryService from '../../services/conversationMemoryService';

interface ChatScreenProps {
  navigation: any;
  route: any;
}

export default function ChatScreen({ navigation, route }: ChatScreenProps) {
  // Use global store instead of local state
  const { 
    fitnessMessages, 
    currentWorkout, 
    addFitnessMessage, 
    updateCurrentWorkout, 
    clearFitnessChat 
  } = useAppStore();
  
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [memoryStatus, setMemoryStatus] = useState<'active' | 'error' | 'loading'>('loading');
  
  const scrollViewRef = useRef<ScrollView>(null);
  const textInputRef = useRef<TextInput>(null);
  
  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const OPENAI_API_KEY = process.env.EXPO_PUBLIC_OPENAI_API_KEY;

  // Comprehensive exercise-muscle mapping with specific heads
  const EXERCISE_MUSCLE_MAP: { [key: string]: string[] } = {
    // Triceps exercises
    'tricep pushdown': ['triceps.lateral_head', 'triceps.medial_head'],
    'tricep push down': ['triceps.lateral_head', 'triceps.medial_head'],
    'overhead tricep extension': ['triceps.long_head', 'triceps.lateral_head'],
    'tricep dips': ['triceps.lateral_head', 'triceps.medial_head', 'triceps.long_head'],
    'close grip bench press': ['triceps.lateral_head', 'triceps.medial_head', 'chest.middle_pectorals'],
    'tricep kickbacks': ['triceps.lateral_head', 'triceps.long_head'],
    
    // Biceps exercises
    'bicep curls': ['biceps.long_head', 'biceps.short_head'],
    'hammer curls': ['biceps.long_head', 'biceps.short_head'],
    'preacher curls': ['biceps.short_head'],
    'concentration curls': ['biceps.short_head'],
    'cable curls': ['biceps.long_head', 'biceps.short_head'],
    
    // Chest exercises
    'bench press': ['chest.middle_pectorals', 'chest.upper_pectorals', 'triceps.lateral_head'],
    'incline bench press': ['chest.upper_pectorals', 'delts.anterior_deltoid'],
    'decline bench press': ['chest.lower_pectorals'],
    'dumbbell flies': ['chest.middle_pectorals', 'chest.upper_pectorals'],
    'incline flies': ['chest.upper_pectorals'],
    'push ups': ['chest.middle_pectorals', 'triceps.lateral_head'],
    'chest press': ['chest.middle_pectorals', 'triceps.lateral_head'],
    'dips': ['chest.lower_pectorals', 'triceps.lateral_head'],
    
    // Shoulder exercises
    'shoulder press': ['delts.anterior_deltoid', 'delts.lateral_deltoid'],
    'lateral raises': ['delts.lateral_deltoid'],
    'front raises': ['delts.anterior_deltoid'],
    'rear delt flies': ['delts.posterior_deltoid'],
    'upright rows': ['delts.lateral_deltoid'],
    
    // Back exercises
    'pull ups': ['lats.upper_lats', 'lats.lower_lats', 'biceps.long_head'],
    'lat pulldown': ['lats.upper_lats', 'lats.lower_lats'],
    'rows': ['lats.lower_lats', 'delts.posterior_deltoid'],
    'barbell rows': ['lats.lower_lats', 'delts.posterior_deltoid'],
    'deadlift': ['hamstrings.biceps_femoris', 'glutes.gluteus_maximus'],
    
    // Leg exercises
    'squats': ['quads.vastus_lateralis', 'quads.vastus_medialis', 'quads.rectus_femoris', 'glutes.gluteus_maximus'],
    'leg press': ['quads.vastus_lateralis', 'quads.vastus_medialis', 'quads.rectus_femoris'],
    'lunges': ['quads.rectus_femoris', 'glutes.gluteus_maximus', 'hamstrings.biceps_femoris'],
    'leg curls': ['hamstrings.biceps_femoris', 'hamstrings.semitendinosus'],
    'leg extensions': ['quads.vastus_lateralis', 'quads.vastus_medialis', 'quads.rectus_femoris'],
    'calf raises': ['calves.gastrocnemius', 'calves.soleus'],
    
    // Core exercises
    'crunches': ['abs.upper_abs'],
    'planks': ['abs.transverse_abdominis', 'abs.upper_abs'],
    'russian twists': ['abs.obliques'],
    'leg raises': ['abs.lower_abs'],
    
    // Back exercises
    'shrugs': ['traps.upper_traps'],
    'face pulls': ['traps.middle_traps', 'delts.posterior_deltoid'],
  };

  const extractExercisesAndMuscles = (text: string): { exercises: string[], muscles: string[] } => {
    const exercises: string[] = [];
    const muscles: string[] = [];
    
    const lowerText = text.toLowerCase();
    
    Object.keys(EXERCISE_MUSCLE_MAP).forEach(exercise => {
      if (lowerText.includes(exercise)) {
        exercises.push(exercise);
        muscles.push(...EXERCISE_MUSCLE_MAP[exercise]);
      }
    });
    
    return { 
      exercises: [...new Set(exercises)], 
      muscles: [...new Set(muscles)] 
    };
  };

  const dismissKeyboard = () => {
    Keyboard.dismiss();
    textInputRef.current?.blur();
  };

  const sendMessage = async () => {
    if (!inputText.trim()) return;

    const userMessage: FitnessChatMessage = {
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
      
      // Update current workout session using global store
      updateCurrentWorkout(exercises, muscles);
    }

    // Add user message to global store
    addFitnessMessage(userMessage);
    const messageText = inputText;
    setInputText('');
    setIsLoading(true);
    
    // Dismiss keyboard after sending message
    dismissKeyboard();

    try {
      console.log('🧠 Using ConversationMemoryService for AI response with memory...');
      
      // Get user ID from store
      const { user } = useAppStore.getState();
      const userId = user?.id || 'demo-user';
      
      // Process conversation with memory using ConversationMemoryService
      const result = await ConversationMemoryService.processConversationMessage(
        userId,
        messageText,
        'fitness_chat'
      );
      
      if (result.aiResponse) {
        const aiResponse: FitnessChatMessage = {
          id: (Date.now() + 1).toString(),
          text: result.aiResponse,
          isUser: false,
          timestamp: new Date(),
        };
        
        // Add AI response to global store
        addFitnessMessage(aiResponse);
        
        // Update memory status to active after successful processing
        setMemoryStatus('active');
        
        console.log('✅ Message processed with conversation memory');
        
        // Show memory indicator in console for demo
        if (result.conversationEntry) {
          console.log('💾 Conversation stored in Pinecone:', {
            messageId: result.conversationEntry.messageId,
            userId: result.conversationEntry.userId,
            timestamp: new Date(result.conversationEntry.timestamp).toLocaleString()
          });
        }
      } else {
        throw new Error('No response from conversation memory service');
      }
    } catch (error) {
      console.error('❌ Conversation Memory Service Error:', error);
      
      // Set memory status to error
      setMemoryStatus('error');
      
      // Fallback to basic response
      const errorMessage: FitnessChatMessage = {
        id: (Date.now() + 1).toString(),
        text: "I'm having trouble accessing my memory right now, but I'm here to help! What would you like to work on today? 💪 (Memory temporarily unavailable)",
        isUser: false,
        timestamp: new Date(),
      };
      addFitnessMessage(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearWorkout = () => {
    Alert.alert(
      'Clear Chat & Memory',
      'This will clear the current chat and AI conversation memory. The AI will forget your previous conversations.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: async () => {
            try {
              const { user } = useAppStore.getState();
              const userId = user?.id || 'demo-user';
              
              // Clear conversation memory in Pinecone/LangChain
              await ConversationMemoryService.clearUserConversationMemory(userId);
              
              // Clear local chat
              clearFitnessChat();
              
              console.log('🗑️ Cleared conversation memory and local chat');
            } catch (error) {
              console.error('❌ Error clearing conversation memory:', error);
              // Still clear local chat even if memory clear fails
              clearFitnessChat();
            }
          }
        }
      ]
    );
  };

  useEffect(() => {
    const keyboardWillShowListener = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      (event) => {
        const newKeyboardHeight = event.endCoordinates.height;
        setKeyboardHeight(newKeyboardHeight);
        
        // Scroll to bottom with minimal delay
        setTimeout(() => {
          scrollViewRef.current?.scrollToEnd({ animated: true });
        }, 150);
      }
    );

    const keyboardWillHideListener = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => {
        setKeyboardHeight(0);
        setTimeout(() => {
          scrollViewRef.current?.scrollToEnd({ animated: true });
        }, 100);
      }
    );

    return () => {
      keyboardWillShowListener.remove();
      keyboardWillHideListener.remove();
    };
  }, []);

  useEffect(() => {
    // Scroll to bottom when new messages are added
    const timer = setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
    
    // Extra scroll for keyboard scenarios
    if (keyboardHeight > 0) {
      const extraTimer = setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 200);
      return () => {
        clearTimeout(timer);
        clearTimeout(extraTimer);
      };
    }
    
    return () => clearTimeout(timer);
  }, [fitnessMessages, keyboardHeight]);

  // Initialize memory system when component mounts
  useEffect(() => {
    const initializeMemory = async () => {
      try {
        console.log('🧠 Initializing conversation memory...');
        
        // Set memory as active since we're using LangChain's built-in memory
        setMemoryStatus('active');
        
        // Add a simple welcome message
        const welcomeMessage: FitnessChatMessage = {
          id: `welcome_${Date.now()}`,
          text: `🤖 AI Fitness Coach ready! I'll remember our conversation during this session. What would you like to work on today? 💪`,
          isUser: false,
          timestamp: new Date(),
        };
        
        // Add welcome message to store
        addFitnessMessage(welcomeMessage);
        
        console.log('✅ Memory system initialized');
      } catch (error) {
        console.error('❌ Error initializing memory:', error);
        setMemoryStatus('error');
      }
    };

    // Initialize after a short delay to allow UI to render
    const timer = setTimeout(() => {
      initializeMemory();
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  // Initialize animations
  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.container}>
        <TouchableWithoutFeedback 
          onPress={dismissKeyboard}
          accessible={false}
        >
          <View style={styles.headerWrapper}>
            {/* Header */}
            <Animated.View style={[styles.header, { opacity: fadeAnim }]}>
              {/* Top Row - Navigation and Actions */}
              <View style={styles.headerTopRow}>
                <TouchableOpacity 
                  style={styles.backButton}
                  onPress={() => navigation.goBack()}
                  activeOpacity={0.7}
                >
                  <Text style={styles.backButtonText}>←</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={styles.clearButton} 
                  onPress={handleClearWorkout}
                  activeOpacity={0.7}
                >
                  <Text style={styles.clearButtonIcon}>🔄</Text>
                </TouchableOpacity>
              </View>

              {/* Main Header Content */}
              <View style={styles.headerMainContent}>
                <View style={styles.headerTitleSection}>
                  <Text style={styles.headerEmoji}>🤖</Text>
                  <View style={styles.headerTextContainer}>
                    <Text style={styles.headerTitle}>AI Fitness Coach</Text>
                    <Text style={styles.headerSubtitle}>Your personal training assistant</Text>
                  </View>
                </View>
                
                {/* Memory Status - Prominent and Clean */}
                <View style={[
                  styles.memoryIndicator,
                  memoryStatus === 'error' && styles.memoryIndicatorError,
                  memoryStatus === 'loading' && styles.memoryIndicatorLoading
                ]}>
                  <Text style={styles.memoryIcon}>
                    {memoryStatus === 'active' ? '🧠' : 
                     memoryStatus === 'error' ? '⚠️' : '⏳'}
                  </Text>
                  <Text style={styles.memoryText}>
                    {memoryStatus === 'active' ? 'Memory Active' : 
                     memoryStatus === 'error' ? 'Memory Offline' : 'Loading...'}
                  </Text>
                </View>
              </View>
              
              <View style={styles.headerGlow} />
            </Animated.View>
          </View>
        </TouchableWithoutFeedback>

        {/* Chat Messages Area - Outside TouchableWithoutFeedback for proper scrolling */}
        <View style={styles.chatSection}>
          <ScrollView 
            ref={scrollViewRef}
            style={styles.chatContainer}
            contentContainerStyle={[
              styles.chatContent,
              { paddingBottom: keyboardHeight > 0 ? 80 : 30 }
            ]}
            showsVerticalScrollIndicator={true}
            keyboardShouldPersistTaps="always"
            scrollEnabled={true}
            bounces={true}
            alwaysBounceVertical={true}
            scrollEventThrottle={16}
            automaticallyAdjustKeyboardInsets={false}
            keyboardDismissMode="interactive"
          >
            {fitnessMessages.map((message) => (
              <Animated.View
                key={message.id}
                style={[
                  styles.messageBubble,
                  message.isUser ? styles.userMessage : styles.aiMessage,
                  { opacity: fadeAnim }
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
              </Animated.View>
            ))}
            
            {isLoading && (
              <View style={styles.loadingBubble}>
                <ActivityIndicator size="small" color="#FFD700" />
                <Text style={styles.loadingText}>AI is thinking...</Text>
              </View>
            )}
          </ScrollView>
        </View>

        {/* Input Area - Always Visible at Bottom */}
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 50 : 0}
          style={styles.keyboardAvoidingView}
        >
          <View style={styles.inputContainer}>
            <TextInput
              ref={textInputRef}
              style={styles.textInput}
              value={inputText}
              onChangeText={setInputText}
              placeholder="Ask your AI fitness coach anything..."
              placeholderTextColor="#9E9E9E"
              multiline
              maxLength={500}
              returnKeyType="send"
              blurOnSubmit={false}
              onSubmitEditing={sendMessage}
              onFocus={() => {
                setTimeout(() => {
                  scrollViewRef.current?.scrollToEnd({ animated: true });
                }, 100);
              }}
            />
            <TouchableOpacity 
              style={[styles.sendButton, inputText.trim() ? styles.sendButtonActive : {}]}
              onPress={sendMessage}
              disabled={!inputText.trim() || isLoading}
              activeOpacity={0.8}
            >
              <Text style={styles.sendButtonText}>💪</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0C',
  },
  headerWrapper: {
    // Simple wrapper, no special styles needed
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 15,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 215, 0, 0.2)',
    backgroundColor: '#111111',
    position: 'relative',
  },
  headerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  headerMainContent: {
    alignItems: 'center',
    gap: 16,
  },
  headerTitleSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTextContainer: {
    alignItems: 'center',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.3)',
  },
  backButtonText: {
    color: '#FFD700',
    fontSize: 18,
    fontWeight: 'bold',
  },
  headerEmoji: {
    fontSize: 32,
    marginRight: 12,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: 'bold',
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  headerSubtitle: {
    color: '#FFD700',
    fontSize: 13,
    fontWeight: '500',
    marginTop: 4,
    textAlign: 'center',
    opacity: 0.9,
  },
  memoryIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(76, 175, 80, 0.2)',
    borderWidth: 1.5,
    borderColor: '#4CAF50',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  memoryIcon: {
    fontSize: 14,
    marginRight: 6,
  },
  memoryText: {
    color: '#4CAF50',
    fontSize: 12,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  memoryIndicatorError: {
    backgroundColor: 'rgba(244, 67, 54, 0.2)',
    borderColor: '#F44336',
    shadowColor: '#F44336',
  },
  memoryIndicatorLoading: {
    backgroundColor: 'rgba(255, 193, 7, 0.2)',
    borderColor: '#FFC107',
    shadowColor: '#FFC107',
  },
  clearButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 107, 107, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 107, 0.3)',
  },
  clearButtonIcon: {
    fontSize: 18,
  },
  headerGlow: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: '#FFD700',
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
    elevation: 4,
  },
  chatSection: {
    flex: 1,
  },
  chatContainer: {
    flex: 1,
    paddingHorizontal: 15,
    backgroundColor: 'transparent',
  },
  chatContent: {
    paddingTop: 15,
    paddingBottom: 20,
    flexGrow: 1,
    justifyContent: 'flex-end',
  },
  messageBubble: {
    maxWidth: '85%',
    marginVertical: 8,
    padding: 18,
    borderRadius: 22,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  userMessage: {
    alignSelf: 'flex-end',
    backgroundColor: '#FFD700',
    borderBottomRightRadius: 8,
    shadowColor: '#FFD700',
    marginLeft: 50,
  },
  aiMessage: {
    alignSelf: 'flex-start',
    backgroundColor: '#1E1E1E',
    borderBottomLeftRadius: 8,
    shadowColor: '#000000',
    marginRight: 50,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.2)',
  },
  messageText: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '400',
  },
  userMessageText: {
    color: '#000000',
    fontWeight: '500',
  },
  aiMessageText: {
    color: '#FFFFFF',
    fontWeight: '400',
  },
  exerciseChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 12,
    gap: 6,
  },
  exerciseChip: {
    backgroundColor: 'rgba(255, 215, 0, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.6)',
  },
  exerciseChipText: {
    color: '#FFD700',
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  timestamp: {
    fontSize: 10,
    color: '#9E9E9E',
    marginTop: 8,
    textAlign: 'right',
  },
  loadingBubble: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E1E1E',
    padding: 18,
    borderRadius: 22,
    borderBottomLeftRadius: 8,
    marginVertical: 8,
    marginRight: 50,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.2)',
  },
  loadingText: {
    color: '#FFD700',
    marginLeft: 12,
    fontSize: 14,
    fontWeight: '500',
    fontStyle: 'italic',
  },
  keyboardAvoidingView: {
    flex: 0,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 20 : 15,
    borderTopWidth: 2,
    borderTopColor: '#FFD700',
    backgroundColor: '#111111',
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 10,
  },
  textInput: {
    flex: 1,
    borderWidth: 2,
    borderColor: '#FFD700',
    borderRadius: 25,
    paddingHorizontal: 20,
    paddingVertical: 15,
    color: '#FFFFFF',
    backgroundColor: '#1A1A1A',
    maxHeight: 120,
    minHeight: 50,
    fontSize: 16,
    textAlignVertical: 'top',
    fontWeight: '400',
  },
  sendButton: {
    marginLeft: 12,
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#333333',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#555555',
  },
  sendButtonActive: {
    backgroundColor: '#FFD700',
    borderColor: '#FFD700',
    transform: [{ scale: 1.05 }],
  },
  sendButtonText: {
    fontSize: 24,
  },
}); 