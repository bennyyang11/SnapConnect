import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
  Alert,
  Keyboard,
  TouchableWithoutFeedback,
  Modal,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MuscleBodyDiagram from '../../components/MuscleBodyDiagram';
import { useAppStore } from '../../store/useAppStore';



interface FitnessScreenProps {
  navigation: any;
}

export default function FitnessScreen({ navigation }: FitnessScreenProps) {
  // Use global store for workout data
  const { currentWorkout, clearFitnessChat } = useAppStore();
  
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [selectedMuscle, setSelectedMuscle] = useState<string | null>(null);
  const [showMuscleDetail, setShowMuscleDetail] = useState(false);
  
  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;

  const OPENAI_API_KEY = process.env.EXPO_PUBLIC_OPENAI_API_KEY;

  // Detailed muscle subdivisions
  const MUSCLE_DETAILS: { [key: string]: { name: string, heads: string[] } } = {
    triceps: {
      name: 'Triceps',
      heads: ['Lateral Head', 'Medial Head', 'Long Head']
    },
    biceps: {
      name: 'Biceps',
      heads: ['Long Head', 'Short Head']
    },
    chest: {
      name: 'Chest',
      heads: ['Upper Pectorals', 'Middle Pectorals', 'Lower Pectorals']
    },
    delts: {
      name: 'Deltoids',
      heads: ['Anterior Deltoid', 'Lateral Deltoid', 'Posterior Deltoid']
    },
    quads: {
      name: 'Quadriceps',
      heads: ['Vastus Lateralis', 'Vastus Medialis', 'Vastus Intermedius', 'Rectus Femoris']
    },
    hamstrings: {
      name: 'Hamstrings',
      heads: ['Biceps Femoris', 'Semitendinosus', 'Semimembranosus']
    },
    glutes: {
      name: 'Glutes',
      heads: ['Gluteus Maximus', 'Gluteus Medius', 'Gluteus Minimus']
    },
    lats: {
      name: 'Latissimus Dorsi',
      heads: ['Upper Lats', 'Lower Lats']
    },
    abs: {
      name: 'Abdominals',
      heads: ['Upper Abs', 'Lower Abs', 'Obliques', 'Transverse Abdominis']
    },
    calves: {
      name: 'Calves',
      heads: ['Gastrocnemius', 'Soleus']
    },
    traps: {
      name: 'Trapezius',
      heads: ['Upper Traps', 'Middle Traps', 'Lower Traps']
    }
  };

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
  };

  const handleMuscleClick = (muscle: string) => {
    console.log('Muscle clicked:', muscle); // Debug log
    if (MUSCLE_DETAILS[muscle]) {
      setSelectedMuscle(muscle);
      setShowMuscleDetail(true);
      
      // Provide immediate feedback that the tap was registered
      Alert.alert('🎯 Muscle Selected', `Loading ${MUSCLE_DETAILS[muscle].name} details...`, [
        { text: 'OK', onPress: () => {} }
      ]);
    } else {
      // Fallback for muscles without detailed breakdown
      Alert.alert('💪 Muscle Tapped', `You tapped: ${muscle.charAt(0).toUpperCase() + muscle.slice(1)}`, [
        { text: 'OK', onPress: () => {} }
      ]);
    }
  };

  const getWorkedMuscleHeads = (muscleGroup: string): string[] => {
    const workedHeads: string[] = [];
    currentWorkout.musclesWorked.forEach(muscle => {
      if (muscle.startsWith(`${muscleGroup}.`)) {
        const head = muscle.split('.')[1];
        workedHeads.push(head);
      }
    });
    return workedHeads;
  };

  const getMuscleHeadStatus = (muscleGroup: string, head: string): 'worked' | 'not_worked' => {
    const headKey = head.toLowerCase().replace(/ /g, '_');
    const fullMuscleKey = `${muscleGroup}.${headKey}`;
    return currentWorkout.musclesWorked.includes(fullMuscleKey) ? 'worked' : 'not_worked';
  };



  const handleClearWorkout = () => {
    Alert.alert(
      'New Workout Session',
      'Start a fresh workout session?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Start Fresh',
          onPress: () => {
            clearFitnessChat();
          }
        }
      ]
    );
  };

  useEffect(() => {
    const keyboardWillShowListener = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      (event) => {
        setKeyboardHeight(event.endCoordinates.height);
      }
    );

    const keyboardWillHideListener = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => {
        setKeyboardHeight(0);
      }
    );

    return () => {
      keyboardWillShowListener.remove();
      keyboardWillHideListener.remove();
    };
  }, []);



  // Initialize animations
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.container}>
        {/* Main Content Area - ScrollView moved outside TouchableWithoutFeedback for proper scrolling */}
        <ScrollView 
          style={styles.scrollContainer}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={true}
          bounces={true}
          alwaysBounceVertical={true}
          scrollEventThrottle={16}
        >
          {/* Enhanced Header */}
          <Animated.View style={[styles.header, { opacity: fadeAnim }]}>
            <View style={styles.headerContent}>
              <View style={styles.headerLeft}>
                <Text style={styles.headerEmoji}>🏋️‍♀️</Text>
                <View>
                  <Text style={styles.headerTitle}>AI Fitness Coach</Text>
                  <Text style={styles.headerSubtitle}>Your personal trainer</Text>
                </View>
              </View>
              <TouchableOpacity 
                style={styles.clearButton} 
                onPress={handleClearWorkout}
                activeOpacity={0.8}
              >
                <Text style={styles.clearButtonText}>🔄 Reset</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.headerGlow} />
          </Animated.View>

          {/* Enhanced Body Diagrams - Hide when keyboard is open */}
          {keyboardHeight === 0 && (
            <Animated.View style={[
              styles.bodyDiagramContainer,
              { 
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }, { scale: scaleAnim }]
              }
            ]}>
              <View style={styles.diagramHeader}>
                <Text style={styles.diagramMainTitle}>🎯 Muscle Tracker</Text>
                <Text style={styles.diagramSubtitle}>Tap any muscle for detailed breakdown</Text>
              </View>
              
              <View style={styles.diagramsRow}>
                <View style={styles.diagramColumn}>
                  <View style={styles.diagramLabelContainer}>
                    <Text style={styles.diagramLabel}>🔥 Front View</Text>
                  </View>
                  <View style={styles.diagramWrapper}>
                    <MuscleBodyDiagram 
                      workedMuscles={currentWorkout.musclesWorked}
                      allMuscles={[
                        'chest', 'biceps', 'delts', 'abs', 'quads', 'calves'
                      ]}
                      onMusclePress={handleMuscleClick}
                      view="front"
                    />
                  </View>
                </View>
                <View style={styles.diagramColumn}>
                  <View style={styles.diagramLabelContainer}>
                    <Text style={styles.diagramLabel}>💪 Back View</Text>
                  </View>
                  <View style={styles.diagramWrapper}>
                    <MuscleBodyDiagram 
                      workedMuscles={currentWorkout.musclesWorked}
                      allMuscles={[
                        'triceps', 'lats', 'traps', 'glutes', 'hamstrings', 'calves'
                      ]}
                      onMusclePress={handleMuscleClick}
                      view="back"
                    />
                  </View>
                </View>
              </View>
              
              <View style={styles.legendContainer}>
                <View style={styles.legendRow}>
                  <View style={styles.legendItem}>
                    <View style={[styles.legendDot, { backgroundColor: '#FF4444' }]} />
                    <Text style={styles.legendText}>Worked Today</Text>
                  </View>
                  <View style={styles.legendItem}>
                    <View style={[styles.legendDot, { backgroundColor: '#4444FF' }]} />
                    <Text style={styles.legendText}>Still Need Work</Text>
                  </View>
                </View>
              </View>
            </Animated.View>
          )}

          {/* Chat Preview Area */}
          <View style={styles.chatPreviewSection}>
            <Text style={styles.chatPreviewTitle}>💬 AI Fitness Coach</Text>
            <Text style={styles.chatPreviewSubtitle}>
              Get personalized workout advice and exercise recommendations
            </Text>
            <TouchableOpacity 
              style={styles.chatPreviewButton}
              onPress={() => navigation.navigate('ChatScreen')}
              activeOpacity={0.8}
            >
              <Text style={styles.chatPreviewButtonText}>Start Conversation</Text>
              <Text style={styles.chatPreviewArrow}>→</Text>
            </TouchableOpacity>
          </View>

          {/* SnapSearch AI - Workout Memory Recall */}
          <View style={styles.snapSearchSection}>
            <View style={styles.snapSearchHeader}>
              <Text style={styles.snapSearchTitle}>🔁 SnapSearch AI</Text>
              <Text style={styles.snapSearchBadge}>NEW</Text>
            </View>
            <Text style={styles.snapSearchSubtitle}>
              Search your workout memories using natural language
            </Text>
            <View style={styles.snapSearchExamples}>
              <Text style={styles.exampleText}>"What workouts did I do last week?"</Text>
              <Text style={styles.exampleText}>"Show me my last arm day"</Text>
              <Text style={styles.exampleText}>"My chest workouts this month"</Text>
            </View>
            <TouchableOpacity 
              style={styles.snapSearchButton}
              onPress={() => navigation.navigate('WorkoutSearchScreen')}
              activeOpacity={0.8}
            >
              <Text style={styles.snapSearchButtonIcon}>🔍</Text>
              <Text style={styles.snapSearchButtonText}>Search Workout Memories</Text>
              <Text style={styles.snapSearchArrow}>→</Text>
            </TouchableOpacity>
            <Text style={styles.snapSearchNote}>
              💡 Post workout snaps with captions to build your searchable memory
            </Text>
          </View>

          {/* AI Conversation Memory */}
          <View style={styles.conversationMemorySection}>
            <View style={styles.conversationMemoryHeader}>
              <Text style={styles.conversationMemoryTitle}>🧠 AI Memory</Text>
              <Text style={styles.conversationMemoryBadge}>LIVE</Text>
            </View>
            <Text style={styles.conversationMemorySubtitle}>
              Your AI coach remembers every conversation across sessions
            </Text>
            <View style={styles.memoryFeatures}>
              <View style={styles.memoryFeature}>
                <Text style={styles.memoryFeatureIcon}>💾</Text>
                <Text style={styles.memoryFeatureText}>Persistent memory with LangChain + Pinecone</Text>
              </View>
              <View style={styles.memoryFeature}>
                <Text style={styles.memoryFeatureIcon}>🎯</Text>
                <Text style={styles.memoryFeatureText}>Remembers your goals, injuries & preferences</Text>
              </View>
              <View style={styles.memoryFeature}>
                <Text style={styles.memoryFeatureIcon}>📈</Text>
                <Text style={styles.memoryFeatureText}>Tracks progress and provides continuity</Text>
              </View>
            </View>
            <View style={styles.memoryStatus}>
              <View style={styles.memoryStatusDot} />
              <Text style={styles.memoryStatusText}>Memory Active - AI Coach remembers everything!</Text>
            </View>
          </View>

          {/* Current Workout Summary - Hide when keyboard is open */}
          {currentWorkout.exercises.length > 0 && keyboardHeight === 0 && (
            <View style={styles.workoutSummary}>
              <Text style={styles.summaryTitle}>Today's Workout:</Text>
              <Text style={styles.summaryText}>
                {currentWorkout.exercises.join(' • ')}
              </Text>
            </View>
          )}

          {/* Additional Content for Scrolling */}
          <View style={styles.additionalContent}>
            <Text style={styles.additionalTitle}>🎯 Quick Tips</Text>
            <Text style={styles.additionalText}>
              • Track your progress by tapping muscles{'\n'}
              • Use the AI coach for personalized advice{'\n'}
              • Reset your workout anytime with the button above{'\n'}
              • Focus on balanced muscle training
            </Text>
          </View>
        </ScrollView>

        {/* Chat Bubble - Fixed at Bottom */}
        <TouchableOpacity 
          style={styles.chatBubble}
          onPress={() => navigation.navigate('ChatScreen')}
          activeOpacity={0.8}
        >
          <View style={styles.chatBubbleContent}>
            <Text style={styles.chatBubbleEmoji}>🤖</Text>
            <Text style={styles.chatBubbleText}>Chat with AI Coach</Text>
          </View>
        </TouchableOpacity>

        {/* Muscle Detail Modal - Outside TouchableWithoutFeedback for proper scrolling */}
        <Modal
          visible={showMuscleDetail}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setShowMuscleDetail(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              {selectedMuscle && MUSCLE_DETAILS[selectedMuscle] && (
                <>
                  <View style={styles.modalHeader}>
                    <Text style={styles.modalTitle}>
                      🎯 {MUSCLE_DETAILS[selectedMuscle].name} Breakdown
                    </Text>
                    <TouchableOpacity
                      style={styles.closeButton}
                      onPress={() => setShowMuscleDetail(false)}
                    >
                      <Text style={styles.closeButtonText}>✕</Text>
                    </TouchableOpacity>
                  </View>

                  <ScrollView 
                    style={styles.modalScroll}
                    showsVerticalScrollIndicator={true}
                    bounces={true}
                  >
                    <Text style={styles.modalSubtitle}>
                      Individual Muscle Heads:
                    </Text>
                    
                    {MUSCLE_DETAILS[selectedMuscle].heads.map((head, index) => {
                      const status = getMuscleHeadStatus(selectedMuscle, head);
                      return (
                        <View key={index} style={styles.muscleHeadItem}>
                          <View style={styles.muscleHeadInfo}>
                            <View style={[
                              styles.statusIndicator,
                              status === 'worked' ? styles.workedIndicator : styles.notWorkedIndicator
                            ]}>
                              <Text style={styles.statusText}>
                                {status === 'worked' ? '🟢' : '🔴'}
                              </Text>
                            </View>
                            <Text style={styles.muscleHeadName}>{head}</Text>
                          </View>
                          <Text style={[
                            styles.statusLabel,
                            status === 'worked' ? styles.workedLabel : styles.notWorkedLabel
                          ]}>
                            {status === 'worked' ? 'WORKED' : 'NOT WORKED'}
                          </Text>
                        </View>
                      );
                    })}

                    <View style={styles.suggestionSection}>
                      <Text style={styles.suggestionTitle}>💡 Targeting Tips:</Text>
                      {selectedMuscle === 'triceps' && (
                        <View>
                          <Text style={styles.suggestionText}>• Pushdowns target Lateral & Medial heads</Text>
                          <Text style={styles.suggestionText}>• Overhead extensions hit the Long head</Text>
                          <Text style={styles.suggestionText}>• Dips work all three heads effectively</Text>
                        </View>
                      )}
                      {selectedMuscle === 'biceps' && (
                        <View>
                          <Text style={styles.suggestionText}>• Wide grip curls target Long head</Text>
                          <Text style={styles.suggestionText}>• Preacher curls hit the Short head</Text>
                          <Text style={styles.suggestionText}>• Hammer curls work both heads</Text>
                        </View>
                      )}
                      {selectedMuscle === 'chest' && (
                        <View>
                          <Text style={styles.suggestionText}>• Incline press targets Upper pecs</Text>
                          <Text style={styles.suggestionText}>• Flat bench works Middle pecs</Text>
                          <Text style={styles.suggestionText}>• Dips emphasize Lower pecs</Text>
                        </View>
                      )}
                      {selectedMuscle === 'delts' && (
                        <View>
                          <Text style={styles.suggestionText}>• Front raises target Anterior</Text>
                          <Text style={styles.suggestionText}>• Lateral raises hit Lateral head</Text>
                          <Text style={styles.suggestionText}>• Reverse flies work Posterior</Text>
                        </View>
                      )}
                      {selectedMuscle === 'quads' && (
                        <View>
                          <Text style={styles.suggestionText}>• Squats work all four heads</Text>
                          <Text style={styles.suggestionText}>• Leg extensions isolate quads</Text>
                          <Text style={styles.suggestionText}>• Lunges target Rectus Femoris</Text>
                        </View>
                      )}
                    </View>
                  </ScrollView>
                  </>
                )}
              </View>
            </View>
          </Modal>
        </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0C',
  },
  mainContent: {
    flex: 1,
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 120,
  },
  mainContentContainer: {
    flexGrow: 1,
    paddingBottom: 100,
  },
  chatSection: {
    flex: 1,
    minHeight: 300,
  },
  chatPreviewSection: {
    marginHorizontal: 15,
    marginTop: 30,
    marginBottom: 50,
    backgroundColor: '#111111',
    borderRadius: 20,
    padding: 30,
    borderWidth: 2,
    borderColor: 'rgba(255, 215, 0, 0.3)',
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
    alignItems: 'center',
    minHeight: 180,
  },
  chatPreviewTitle: {
    color: '#FFD700',
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
  },
  chatPreviewSubtitle: {
    color: '#CCCCCC',
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 20,
    paddingHorizontal: 10,
  },
  chatPreviewButton: {
    backgroundColor: '#FFD700',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 25,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 6,
  },
  chatPreviewButtonText: {
    color: '#000000',
    fontSize: 16,
    fontWeight: 'bold',
    marginRight: 10,
  },
  chatPreviewArrow: {
    color: '#000000',
    fontSize: 18,
    fontWeight: 'bold',
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 215, 0, 0.3)',
    backgroundColor: '#111111',
    position: 'relative',
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
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
  },
  headerSubtitle: {
    color: '#FFD700',
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
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
  clearButton: {
    backgroundColor: 'rgba(255, 107, 107, 0.2)',
    borderWidth: 1,
    borderColor: '#FF6B6B',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    shadowColor: '#FF6B6B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  clearButtonText: {
    color: '#FF6B6B',
    fontSize: 12,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  bodyDiagramContainer: {
    alignItems: 'center',
    paddingVertical: 20,
    paddingBottom: 25,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 215, 0, 0.2)',
    backgroundColor: '#0A0A0A',
    marginHorizontal: 10,
    marginVertical: 5,
    borderRadius: 20,
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  diagramHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  diagramMainTitle: {
    color: '#FFD700',
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  diagramSubtitle: {
    color: '#BBBBBB',
    fontSize: 13,
    textAlign: 'center',
    marginTop: 5,
  },
  diagramsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    width: '100%',
    paddingHorizontal: 5,
    gap: 15,
  },
  diagramColumn: {
    alignItems: 'center',
    flex: 1,
    minWidth: 150,
  },
  diagramLabelContainer: {
    marginBottom: 15,
    alignItems: 'center',
  },
  diagramLabel: {
    color: '#FFD700',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  diagramWrapper: {
    backgroundColor: 'rgba(255, 215, 0, 0.05)',
    borderRadius: 15,
    padding: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.2)',
  },
  legendContainer: {
    marginTop: 20,
    marginBottom: 10,
    paddingHorizontal: 20,
  },
  legendRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 30,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  legendText: {
    color: '#CCCCCC',
    fontSize: 13,
    fontWeight: '500',
  },
  chatContainer: {
    flex: 1,
    paddingHorizontal: 15,
    backgroundColor: 'transparent',
  },
  chatContent: {
    paddingVertical: 15,
    paddingBottom: 20,
    flexGrow: 1,
  },
  messageBubble: {
    maxWidth: '80%',
    marginVertical: 6,
    padding: 16,
    borderRadius: 20,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  userMessage: {
    alignSelf: 'flex-end',
    backgroundColor: '#FFD700',
    borderBottomRightRadius: 6,
    shadowColor: '#FFD700',
    marginLeft: 40,
  },
  aiMessage: {
    alignSelf: 'flex-start',
    backgroundColor: '#1E1E1E',
    borderBottomLeftRadius: 6,
    shadowColor: '#000000',
    marginRight: 40,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.1)',
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
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
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
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
    marginTop: 5,
    textAlign: 'right',
  },
  loadingBubble: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E1E1E',
    padding: 16,
    borderRadius: 20,
    borderBottomLeftRadius: 6,
    marginVertical: 6,
    marginRight: 40,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.2)',
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  loadingText: {
    color: '#FFD700',
    marginLeft: 12,
    fontSize: 14,
    fontWeight: '500',
    fontStyle: 'italic',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 15,
    paddingVertical: 12,
    paddingBottom: Platform.OS === 'ios' ? 20 : 15,
    borderTopWidth: 2,
    borderTopColor: '#FFD700',
    backgroundColor: '#161618',
    minHeight: 70,
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 8,
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
    maxHeight: 100,
    minHeight: 50,
    fontSize: 16,
    textAlignVertical: 'top',
    fontWeight: '400',
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
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
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  sendButtonActive: {
    backgroundColor: '#FFD700',
    borderColor: '#FFD700',
    shadowColor: '#FFD700',
    shadowOpacity: 0.4,
    transform: [{ scale: 1.05 }],
  },
  sendButtonText: {
    fontSize: 24,
  },
  chatBubble: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 40 : 30,
    right: 20,
    backgroundColor: '#FFD700',
    borderRadius: 30,
    paddingHorizontal: 20,
    paddingVertical: 15,
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 1000,
  },
  chatBubbleContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  chatBubbleEmoji: {
    fontSize: 20,
    marginRight: 8,
  },
  chatBubbleText: {
    color: '#000000',
    fontSize: 14,
    fontWeight: 'bold',
  },
  workoutSummary: {
    backgroundColor: '#0F0F0F',
    marginHorizontal: 10,
    marginVertical: 5,
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.3)',
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  summaryTitle: {
    color: '#FFD700',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  summaryText: {
    color: '#FFFFFF',
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
    fontWeight: '400',
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#161618',
    borderRadius: 20,
    margin: 20,
    maxHeight: '80%',
    width: '90%',
    borderWidth: 1,
    borderColor: '#FFD700',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#424242',
  },
  modalTitle: {
    color: '#FFD700',
    fontSize: 20,
    fontWeight: 'bold',
    flex: 1,
  },
  closeButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#424242',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalScroll: {
    maxHeight: 400,
  },
  modalSubtitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    margin: 20,
    marginBottom: 10,
  },
  muscleHeadItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#2A2A2A',
  },
  muscleHeadInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  statusIndicator: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  workedIndicator: {
    backgroundColor: 'rgba(34, 197, 94, 0.2)',
    borderWidth: 2,
    borderColor: '#22C55E',
  },
  notWorkedIndicator: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    borderWidth: 2,
    borderColor: '#EF4444',
  },
  statusText: {
    fontSize: 16,
  },
  muscleHeadName: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
  },
  statusLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  workedLabel: {
    color: '#22C55E',
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
  },
  notWorkedLabel: {
    color: '#EF4444',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
  },
  suggestionSection: {
    margin: 20,
    padding: 15,
    backgroundColor: '#2A2A2A',
    borderRadius: 12,
  },
  suggestionTitle: {
    color: '#FFD700',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  suggestionText: {
    color: '#FFFFFF',
    fontSize: 14,
    marginBottom: 6,
    lineHeight: 20,
  },
  additionalContent: {
    marginHorizontal: 15,
    marginTop: 20,
    marginBottom: 30,
    backgroundColor: '#0F0F0F',
    borderRadius: 15,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.2)',
  },
  additionalTitle: {
    color: '#FFD700',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
  },
  additionalText: {
    color: '#CCCCCC',
    fontSize: 14,
    lineHeight: 22,
    textAlign: 'left',
  },
  // SnapSearch AI Styles
  snapSearchSection: {
    backgroundColor: '#0F0F0F',
    marginHorizontal: 10,
    marginVertical: 5,
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.3)',
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  snapSearchHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  snapSearchTitle: {
    color: '#FFD700',
    fontSize: 18,
    fontWeight: 'bold',
  },
  snapSearchBadge: {
    backgroundColor: '#FF4444',
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    overflow: 'hidden',
  },
  snapSearchSubtitle: {
    color: '#CCCCCC',
    fontSize: 14,
    marginBottom: 15,
    lineHeight: 20,
  },
  snapSearchExamples: {
    marginBottom: 15,
  },
  exampleText: {
    color: '#9E9E9E',
    fontSize: 12,
    fontStyle: 'italic',
    marginBottom: 4,
    paddingLeft: 5,
  },
  snapSearchButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFD700',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderRadius: 25,
    marginBottom: 10,
  },
  snapSearchButtonIcon: {
    fontSize: 18,
    marginRight: 10,
  },
  snapSearchButtonText: {
    color: '#000000',
    fontSize: 16,
    fontWeight: 'bold',
    flex: 1,
  },
  snapSearchArrow: {
    color: '#000000',
    fontSize: 16,
    fontWeight: 'bold',
  },
  snapSearchNote: {
    color: '#9E9E9E',
    fontSize: 11,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  // Conversation Memory Styles
  conversationMemorySection: {
    backgroundColor: '#0F0F0F',
    marginHorizontal: 10,
    marginVertical: 5,
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: 'rgba(76, 175, 80, 0.3)',
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  conversationMemoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  conversationMemoryTitle: {
    color: '#4CAF50',
    fontSize: 18,
    fontWeight: 'bold',
  },
  conversationMemoryBadge: {
    backgroundColor: '#4CAF50',
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    overflow: 'hidden',
  },
  conversationMemorySubtitle: {
    color: '#CCCCCC',
    fontSize: 14,
    marginBottom: 15,
    lineHeight: 20,
  },
  memoryFeatures: {
    marginBottom: 15,
  },
  memoryFeature: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  memoryFeatureIcon: {
    fontSize: 16,
    marginRight: 10,
    width: 20,
  },
  memoryFeatureText: {
    color: '#FFFFFF',
    fontSize: 13,
    flex: 1,
  },
  memoryStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },
  memoryStatusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#4CAF50',
    marginRight: 8,
  },
  memoryStatusText: {
    color: '#4CAF50',
    fontSize: 12,
    fontWeight: '500',
  },
}); 