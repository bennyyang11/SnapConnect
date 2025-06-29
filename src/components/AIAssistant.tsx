import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Alert,
  StyleSheet,
} from 'react-native';
import {
  generateSmartCaption,
  chatWithAI,
  generateAutoTags,
  analyzeContent,
  createContentEmbedding,
  moderateContent,
} from '../services/aiFeatures';

interface AIAssistantProps {
  visible: boolean;
  onClose: () => void;
  contentUri?: string;
  contentType?: 'photo' | 'video';
  onCaptionGenerated?: (caption: string) => void;
  onTagsGenerated?: (tags: string[]) => void;
}

export const AIAssistant: React.FC<AIAssistantProps> = ({
  visible,
  onClose,
  contentUri,
  contentType = 'photo',
  onCaptionGenerated,
  onTagsGenerated,
}) => {
  const [loading, setLoading] = useState(false);
  const [chatMessage, setChatMessage] = useState('');
  const [chatHistory, setChatHistory] = useState<Array<{ role: 'user' | 'ai'; message: string }>>([]);
  const [analysisResult, setAnalysisResult] = useState<any>(null);

  const handleGenerateCaption = async () => {
    if (!contentUri) {
      Alert.alert('Error', 'No content selected');
      return;
    }

    console.log('🤖 AIAssistant: Starting caption generation for URI:', contentUri);
    console.log('🤖 AIAssistant: Content type:', contentType);

    setLoading(true);
    try {
      const caption = await generateSmartCaption(contentUri);
      console.log('✅ AIAssistant: Caption generated successfully:', caption);
      onCaptionGenerated?.(caption);
      Alert.alert('✨ Caption Generated!', caption, [
        { text: 'Copy to Editor', onPress: () => onCaptionGenerated?.(caption) },
        { text: 'OK' }
      ]);
    } catch (error) {
      console.error('❌ AIAssistant: Caption generation failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      Alert.alert('Error', `Failed to generate caption: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateTags = async () => {
    if (!contentUri) {
      Alert.alert('Error', 'No content selected');
      return;
    }

    console.log('🏷️ AIAssistant: Starting tag generation for URI:', contentUri);
    console.log('🏷️ AIAssistant: Content type:', contentType);

    setLoading(true);
    try {
      // First analyze the content to get context
      console.log('🔍 AIAssistant: Analyzing content first...');
      const analysis = await analyzeContent(contentUri, contentType);
      console.log('✅ AIAssistant: Content analysis complete:', analysis);
      
      const contextText = `${analysis.mood} ${analysis.objects.join(' ')} ${analysis.tags.join(' ')}`;
      console.log('📝 AIAssistant: Generated context text:', contextText);
      
      const tags = await generateAutoTags(contextText);
      console.log('✅ AIAssistant: Tags generated successfully:', tags);
      onTagsGenerated?.(tags);
      
      Alert.alert('🏷️ Tags Generated!', tags.join(', '), [
        { text: 'Use Tags', onPress: () => onTagsGenerated?.(tags) },
        { text: 'OK' }
      ]);
    } catch (error) {
      console.error('❌ AIAssistant: Tag generation failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      Alert.alert('Error', `Failed to generate tags: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  const handleAnalyzeContent = async () => {
    if (!contentUri) {
      Alert.alert('Error', 'No content selected');
      return;
    }

    console.log('🔍 AIAssistant: Starting content analysis for URI:', contentUri);
    console.log('🔍 AIAssistant: Content type:', contentType);

    setLoading(true);
    try {
      const analysis = await analyzeContent(contentUri, contentType);
      console.log('✅ AIAssistant: Content analysis complete:', analysis);
      setAnalysisResult(analysis);
      
      Alert.alert(
        '🔍 Content Analysis',
        `Mood: ${analysis.mood}\nObjects: ${analysis.objects.join(', ')}\nColors: ${analysis.colors.join(', ')}\nTags: ${analysis.tags.join(', ')}`,
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('❌ AIAssistant: Content analysis failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      Alert.alert('Error', `Failed to analyze content: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveToVector = async () => {
    if (!contentUri) {
      Alert.alert('Error', 'No content selected');
      return;
    }

    setLoading(true);
    try {
      const result = await createContentEmbedding({
        uri: contentUri,
        type: contentType,
        caption: 'User generated content',
        userId: 'current_user', // You might want to get this from your auth system
      });

      if (result) {
        Alert.alert('✅ Saved!', 'Content has been saved with AI embeddings for smart search and recommendations.');
      } else {
        Alert.alert('Error', 'Failed to save content embeddings');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to save content');
    } finally {
      setLoading(false);
    }
  };

  const handleChatWithAI = async () => {
    if (!chatMessage.trim()) return;

    setLoading(true);
    const userMessage = chatMessage.trim();
    setChatMessage('');

    // Add user message to history
    setChatHistory(prev => [...prev, { role: 'user', message: userMessage }]);

    try {
      const context = analysisResult ? { contentAnalysis: analysisResult } : undefined;
      const aiResponse = await chatWithAI(userMessage, context);
      
      // Add AI response to history
      setChatHistory(prev => [...prev, { role: 'ai', message: aiResponse }]);
    } catch (error) {
      setChatHistory(prev => [...prev, { role: 'ai', message: 'Sorry, I encountered an error. Please try again.' }]);
    } finally {
      setLoading(false);
    }
  };

  const handleModerateContent = async () => {
    if (!contentUri) {
      Alert.alert('Error', 'No content selected');
      return;
    }

    setLoading(true);
    try {
      const moderation = await moderateContent('Content moderation check', contentUri);
      
      const statusEmoji = moderation.isAppropriate ? '✅' : '⚠️';
      const statusText = moderation.isAppropriate ? 'Appropriate' : 'Needs Review';
      
      Alert.alert(
        `${statusEmoji} Content Moderation`,
        `Status: ${statusText}\nConfidence: ${Math.round(moderation.confidence * 100)}%${
          moderation.reasons.length > 0 ? `\nReasons: ${moderation.reasons.join(', ')}` : ''
        }`,
        [{ text: 'OK' }]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to moderate content');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal 
      visible={visible} 
      animationType="slide" 
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>🤖 AI Assistant</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
        </View>

        <ScrollView 
          style={styles.content} 
          showsVerticalScrollIndicator={true}
          bounces={true}
          scrollEventThrottle={16}
          contentContainerStyle={styles.scrollContent}
        >
          {/* AI Tools Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>✨ Content Enhancement</Text>
            
            <TouchableOpacity style={styles.aiButton} onPress={handleGenerateCaption} disabled={loading}>
              <Text style={styles.aiButtonText}>📝 Generate Smart Caption</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.aiButton} onPress={handleGenerateTags} disabled={loading}>
              <Text style={styles.aiButtonText}>🏷️ Generate Auto Tags</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.aiButton} onPress={handleAnalyzeContent} disabled={loading}>
              <Text style={styles.aiButtonText}>🔍 Analyze Content</Text>
            </TouchableOpacity>
          </View>

          {/* AI Storage Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🔮 Smart Features</Text>
            
            <TouchableOpacity style={styles.aiButton} onPress={handleSaveToVector} disabled={loading}>
              <Text style={styles.aiButtonText}>💾 Save for Smart Search</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.aiButton} onPress={handleModerateContent} disabled={loading}>
              <Text style={styles.aiButtonText}>🛡️ Content Moderation</Text>
            </TouchableOpacity>
          </View>

          {/* Chat Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>💬 AI Chat</Text>
            
            <ScrollView 
              style={styles.chatHistory} 
              nestedScrollEnabled={true}
              showsVerticalScrollIndicator={true}
              bounces={true}
            >
              {chatHistory.map((chat, index) => (
                <View key={index} style={[
                  styles.chatBubble,
                  chat.role === 'user' ? styles.userBubble : styles.aiBubble
                ]}>
                  <Text style={[
                    styles.chatText,
                    chat.role === 'user' ? styles.userText : styles.aiText
                  ]}>
                    {chat.message}
                  </Text>
                </View>
              ))}
              {chatHistory.length === 0 && (
                <View style={styles.emptyChat}>
                  <Text style={styles.emptyChatText}>Start a conversation with AI!</Text>
                  <Text style={styles.emptyChatSubtext}>Ask questions about your content or get creative suggestions.</Text>
                </View>
              )}
            </ScrollView>
            
            <View style={styles.chatInput}>
              <TextInput
                style={styles.textInput}
                value={chatMessage}
                onChangeText={setChatMessage}
                placeholder="Ask me anything about your content..."
                placeholderTextColor="#666"
                multiline
                maxLength={500}
              />
              <TouchableOpacity 
                style={[styles.sendButton, (!chatMessage.trim() || loading) && styles.sendButtonDisabled]} 
                onPress={handleChatWithAI}
                disabled={loading || !chatMessage.trim()}
              >
                <Text style={styles.sendButtonText}>Send</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>

        {loading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color="#FFD700" />
            <Text style={styles.loadingText}>AI is thinking...</Text>
          </View>
        )}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 50,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  title: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: 'bold',
  },
  closeButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#333',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    color: '#FFD700',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  aiButton: {
    backgroundColor: '#333',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#555',
  },
  aiButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    textAlign: 'center',
  },
  chatHistory: {
    maxHeight: 200,
    marginBottom: 15,
    backgroundColor: '#222',
    borderRadius: 10,
    padding: 10,
  },
  chatBubble: {
    padding: 10,
    borderRadius: 10,
    marginBottom: 10,
    maxWidth: '80%',
  },
  userBubble: {
    backgroundColor: '#FFD700',
    alignSelf: 'flex-end',
  },
  aiBubble: {
    backgroundColor: '#444',
    alignSelf: 'flex-start',
  },
  chatText: {
    fontSize: 14,
  },
  userText: {
    color: '#000',
  },
  aiText: {
    color: '#FFF',
  },
  chatInput: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  textInput: {
    flex: 1,
    backgroundColor: '#333',
    color: '#FFFFFF',
    padding: 15,
    borderRadius: 10,
    marginRight: 10,
    maxHeight: 100,
    borderWidth: 1,
    borderColor: '#555',
  },
  sendButton: {
    backgroundColor: '#FFD700',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 10,
  },
  sendButtonText: {
    color: '#000',
    fontWeight: 'bold',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#FFD700',
    marginTop: 10,
    fontSize: 16,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  emptyChat: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 30,
  },
  emptyChatText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyChatSubtext: {
    color: '#666',
    fontSize: 14,
    textAlign: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#999',
  },
}); 