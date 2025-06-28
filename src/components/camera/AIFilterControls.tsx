import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Animated,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import AIFilterService, { 
  FilterDefinition, 
  AIFilterAnalysis, 
  FilterRecommendation 
} from '../../services/aiFilterService';

interface AIFilterControlsProps {
  isVisible: boolean;
  selectedFilter: string;
  onFilterSelect: (filter: FilterDefinition) => void;
  onToggleAI: () => void;
  capturedImageUri?: string;
}

export default function AIFilterControls({
  isVisible,
  selectedFilter,
  onFilterSelect,
  onToggleAI,
  capturedImageUri,
}: AIFilterControlsProps) {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [captionInput, setCaptionInput] = useState('');
  const [aiAnalysis, setAiAnalysis] = useState<AIFilterAnalysis | null>(null);
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [customFilterPrompt, setCustomFilterPrompt] = useState('');
  const [customFilterResult, setCustomFilterResult] = useState<string>('');
  const [customFilterDefinition, setCustomFilterDefinition] = useState<FilterDefinition | null>(null);
  const [isGeneratingCustom, setIsGeneratingCustom] = useState(false);

  const fadeAnim = React.useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: isVisible ? 1 : 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [isVisible, fadeAnim]);

  const analyzeAndRecommend = async () => {
    if (!captionInput.trim() && !capturedImageUri) {
      Alert.alert('Input Required', 'Please enter a caption or take a photo first to get AI filter recommendations.');
      return;
    }

    setIsAnalyzing(true);
    try {
      console.log('🤖 Starting AI filter analysis...');
      const analysis = await AIFilterService.generateFilterRecommendations(
        captionInput.trim() || undefined,
        capturedImageUri
      );
      
      setAiAnalysis(analysis);
      console.log('✅ AI analysis complete:', analysis.combinedMood);
      
    } catch (error) {
      console.error('❌ AI analysis failed:', error);
      Alert.alert('Analysis Failed', 'Unable to analyze your content. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const generateCustomFilter = async () => {
    if (!customFilterPrompt.trim()) {
      Alert.alert('Input Required', 'Please describe the filter you want to create.');
      return;
    }

    setIsGeneratingCustom(true);
    try {
      const result = await AIFilterService.generateCustomFilterDescription(customFilterPrompt);
      setCustomFilterResult(result);
      
      // Create a FilterDefinition from the custom filter
      // Try to extract a name from the AI response
      const filterName = extractFilterNameFromDescription(result) || 'Custom Filter';
      
      const customFilter: FilterDefinition = {
        id: `custom_${Date.now()}`,
        name: filterName,
        description: result.substring(0, 100) + '...',
        mood: ['custom'],
        visualStyle: 'custom',
        intensity: 'moderate',
        colorPalette: ['#000000', '#ffffff'],
        effects: ['custom_effect'],
        tags: ['custom', 'ai_generated'],
        emoji: '✨'
      };
      
      setCustomFilterDefinition(customFilter);
    } catch (error) {
      console.error('❌ Custom filter generation failed:', error);
      Alert.alert('Generation Failed', 'Unable to generate custom filter. Please try again.');
    } finally {
      setIsGeneratingCustom(false);
    }
  };

  const clearAnalysis = () => {
    setAiAnalysis(null);
    setCaptionInput('');
    setCustomFilterResult('');
    setCustomFilterPrompt('');
    setCustomFilterDefinition(null);
  };

  if (!isVisible) return null;

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Header */}
        <View style={styles.header}>
        <TouchableOpacity style={styles.aiToggleButton} onPress={onToggleAI}>
          <Text style={styles.aiToggleText}>🤖</Text>
          <Text style={styles.aiToggleLabel}>AI</Text>
        </TouchableOpacity>
        <Text style={styles.title}>AI Smart Filters</Text>
        <TouchableOpacity style={styles.clearButton} onPress={clearAnalysis}>
          <Text style={styles.clearButtonText}>Clear</Text>
        </TouchableOpacity>
      </View>

      {/* Caption Input */}
      <View style={styles.inputSection}>
        <Text style={styles.inputLabel}>Describe your mood or feeling:</Text>
        <TextInput
          style={styles.captionInput}
          placeholder="e.g., 'Feeling edgy today' or 'So happy right now!'"
          placeholderTextColor="#888"
          value={captionInput}
          onChangeText={setCaptionInput}
          multiline
          maxLength={200}
        />
        
        <TouchableOpacity 
          style={[styles.analyzeButton, isAnalyzing && styles.analyzeButtonDisabled]}
          onPress={analyzeAndRecommend}
          disabled={isAnalyzing}
        >
          {isAnalyzing ? (
            <ActivityIndicator color="#000" size="small" />
          ) : (
            <Text style={styles.analyzeButtonText}>🔍 Analyze & Recommend</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* AI Analysis Results */}
      {aiAnalysis && (
        <View style={styles.analysisSection}>
          <View style={styles.moodBadge}>
            <Text style={styles.moodText}>
              Detected Mood: {aiAnalysis.combinedMood.toUpperCase()}
            </Text>
          </View>

          {/* Recommended Filters */}
          <Text style={styles.sectionTitle}>🎨 Recommended Filters</Text>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            style={styles.filtersScroll}
            contentContainerStyle={styles.filtersContent}
          >
            {aiAnalysis.topRecommendations.map((recommendation: FilterRecommendation, index) => (
              <TouchableOpacity
                key={recommendation.filter.id}
                style={[
                  styles.filterButton,
                  selectedFilter === recommendation.filter.id && styles.filterButtonSelected
                ]}
                onPress={() => onFilterSelect(recommendation.filter)}
              >
                <Text style={styles.filterEmoji}>{recommendation.filter.emoji}</Text>
                <Text style={[
                  styles.filterName,
                  selectedFilter === recommendation.filter.id && styles.filterNameSelected
                ]}>
                  {recommendation.filter.name}
                </Text>
                <View style={styles.confidenceBadge}>
                  <Text style={styles.confidenceText}>
                    {Math.round(recommendation.confidence * 100)}%
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Filter Description */}
          {selectedFilter !== 'none' && aiAnalysis.topRecommendations.find(r => r.filter.id === selectedFilter) && (
            <View style={styles.filterInfo}>
              <Text style={styles.filterInfoText}>
                {aiAnalysis.topRecommendations.find(r => r.filter.id === selectedFilter)?.reasoning}
              </Text>
            </View>
          )}

          {/* Custom Filter Description when selected */}
          {selectedFilter !== 'none' && customFilterDefinition && selectedFilter === customFilterDefinition.id && (
            <View style={styles.filterInfo}>
              <Text style={styles.filterInfoText}>
                🎨 Your custom AI-generated filter is now active! This unique filter was created based on your description: "{customFilterPrompt}"
              </Text>
            </View>
          )}

          {/* Custom Filter Suggestion */}
          {aiAnalysis.customFilterSuggestion && (
            <View style={styles.customSuggestion}>
              <Text style={styles.customSuggestionTitle}>💡 Custom Filter Idea</Text>
              <Text style={styles.customSuggestionText}>
                {aiAnalysis.customFilterSuggestion}
              </Text>
            </View>
          )}
        </View>
      )}

      {/* Custom Filter Generator */}
      <View style={styles.customSection}>
        <TouchableOpacity 
          style={styles.customToggle}
          onPress={() => setShowCustomInput(!showCustomInput)}
        >
          <Text style={styles.customToggleText}>
            ✨ Create Custom Filter {showCustomInput ? '▼' : '▶'}
          </Text>
        </TouchableOpacity>

        {showCustomInput && (
          <View style={styles.customInputSection}>
            <TextInput
              style={styles.customInput}
              placeholder="Describe your ideal filter (e.g., 'cyberpunk with neon edges')"
              placeholderTextColor="#888"
              value={customFilterPrompt}
              onChangeText={setCustomFilterPrompt}
              multiline
              maxLength={150}
            />
            
            <TouchableOpacity 
              style={[styles.generateButton, isGeneratingCustom && styles.generateButtonDisabled]}
              onPress={generateCustomFilter}
              disabled={isGeneratingCustom}
            >
              {isGeneratingCustom ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.generateButtonText}>Generate Filter</Text>
              )}
            </TouchableOpacity>

            {customFilterResult && (
              <>
                <View style={styles.customResult}>
                  <Text style={styles.customResultTitle}>Your Custom Filter:</Text>
                  <Text style={styles.customResultText}>{customFilterResult}</Text>
                </View>
                
                {/* Custom Filter Selection Button */}
                {customFilterDefinition && (
                  <TouchableOpacity 
                    style={[
                      styles.customFilterButton,
                      selectedFilter === customFilterDefinition.id && styles.customFilterButtonSelected
                    ]}
                    onPress={() => {
                      console.log('🤖 Applying custom filter:', customFilterDefinition);
                      onFilterSelect(customFilterDefinition);
                    }}
                  >
                    <Text style={styles.customFilterButtonEmoji}>✨</Text>
                    <Text style={[
                      styles.customFilterButtonText,
                      selectedFilter === customFilterDefinition.id && styles.customFilterButtonTextSelected
                    ]}>
                      Apply {customFilterDefinition.name}
                    </Text>
                  </TouchableOpacity>
                )}
              </>
            )}
          </View>
        )}
      </View>
      </ScrollView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 20,
    top: 100,
    right: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    borderRadius: 20,
    padding: 20,
    zIndex: 2,
    maxHeight: '70%',
  },
  scrollContent: {
    flexGrow: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  aiToggleButton: {
    alignItems: 'center',
    backgroundColor: 'rgba(64, 224, 208, 0.2)',
    borderWidth: 2,
    borderColor: '#40E0D0',
    borderRadius: 25,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  aiToggleText: {
    fontSize: 18,
    marginBottom: 2,
  },
  aiToggleLabel: {
    color: '#40E0D0',
    fontSize: 10,
    fontWeight: 'bold',
  },
  title: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'center',
  },
  clearButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
  },
  clearButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  inputSection: {
    marginBottom: 20,
  },
  inputLabel: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  captionInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 12,
    color: '#FFFFFF',
    fontSize: 14,
    minHeight: 40,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  analyzeButton: {
    backgroundColor: '#40E0D0',
    borderRadius: 15,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  analyzeButtonDisabled: {
    backgroundColor: 'rgba(64, 224, 208, 0.5)',
  },
  analyzeButtonText: {
    color: '#000',
    fontSize: 14,
    fontWeight: 'bold',
  },
  analysisSection: {
    marginBottom: 20,
  },
  moodBadge: {
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
    borderRadius: 12,
    padding: 8,
    alignItems: 'center',
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#FFD700',
  },
  moodText: {
    color: '#FFD700',
    fontSize: 12,
    fontWeight: 'bold',
  },
  sectionTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  filtersScroll: {
    maxHeight: 100,
  },
  filtersContent: {
    paddingHorizontal: 5,
  },
  filterButton: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 15,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginHorizontal: 5,
    minWidth: 70,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  filterButtonSelected: {
    backgroundColor: 'rgba(64, 224, 208, 0.2)',
    borderColor: '#40E0D0',
  },
  filterEmoji: {
    fontSize: 24,
    marginBottom: 4,
  },
  filterName: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 4,
  },
  filterNameSelected: {
    color: '#40E0D0',
  },
  confidenceBadge: {
    backgroundColor: 'rgba(0, 255, 0, 0.2)',
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  confidenceText: {
    color: '#00FF00',
    fontSize: 8,
    fontWeight: 'bold',
  },
  filterInfo: {
    backgroundColor: 'rgba(64, 224, 208, 0.1)',
    borderRadius: 12,
    padding: 12,
    marginTop: 10,
  },
  filterInfoText: {
    color: '#40E0D0',
    fontSize: 12,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  customSuggestion: {
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    borderRadius: 12,
    padding: 12,
    marginTop: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.3)',
  },
  customSuggestionTitle: {
    color: '#FFD700',
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  customSuggestionText: {
    color: '#FFFFFF',
    fontSize: 11,
    lineHeight: 16,
  },
  customSection: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
    paddingTop: 15,
  },
  customToggle: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
  },
  customToggleText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  customInputSection: {
    marginTop: 12,
  },
  customInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 12,
    color: '#FFFFFF',
    fontSize: 14,
    minHeight: 60,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  generateButton: {
    backgroundColor: '#9370DB',
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  generateButtonDisabled: {
    backgroundColor: 'rgba(147, 112, 219, 0.5)',
  },
  generateButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  customResult: {
    backgroundColor: 'rgba(147, 112, 219, 0.1)',
    borderRadius: 12,
    padding: 12,
    marginTop: 12,
    borderWidth: 1,
    borderColor: 'rgba(147, 112, 219, 0.3)',
  },
  customResultTitle: {
    color: '#9370DB',
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  customResultText: {
    color: '#FFFFFF',
    fontSize: 11,
    lineHeight: 16,
  },
  customFilterButton: {
    backgroundColor: 'rgba(147, 112, 219, 0.2)',
    borderRadius: 15,
    padding: 15,
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(147, 112, 219, 0.5)',
  },
  customFilterButtonSelected: {
    backgroundColor: 'rgba(147, 112, 219, 0.4)',
    borderColor: '#9370DB',
  },
  customFilterButtonEmoji: {
    fontSize: 20,
    marginRight: 8,
  },
  customFilterButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  customFilterButtonTextSelected: {
    color: '#9370DB',
  },
});

// Helper function to extract filter name from AI description
function extractFilterNameFromDescription(description: string): string | null {
  // Look for common patterns like "Filter Name:" or quotes around names
  const patterns = [
    /(?:filter\s+name|name):\s*["']?([^"'\n\r.]+)["']?/i,
    /["']([^"']{2,30})["']\s+(?:filter|effect)/i,
    /^([A-Z][a-zA-Z\s]{2,25})\s+(?:Filter|Effect)/,
  ];
  
  for (const pattern of patterns) {
    const match = description.match(pattern);
    if (match && match[1]) {
      return match[1].trim();
    }
  }
  
  // Fallback: take first meaningful phrase (2-4 words)
  const words = description.split(/\s+/).slice(0, 4);
  if (words.length >= 2 && words.join(' ').length <= 30) {
    return words.join(' ').replace(/[^\w\s]/g, '').trim();
  }
  
  return null;
} 