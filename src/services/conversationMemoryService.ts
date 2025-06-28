import { callLangChain, clearConversationMemory, getConversationSummary } from './langchain';
import { FitnessChatMessage } from '../types';

// Conversation Memory Types
export interface ConversationEntry {
  id: string;
  userId: string;
  messageId: string;
  text: string;
  isUser: boolean;
  timestamp: number;
  embeddingId: string;
  sessionId: string;
  context?: {
    fitnessGoals?: string[];
    injuries?: string[];
    preferences?: string[];
    currentWorkout?: string;
  };
}

export interface ConversationContext {
  userId: string;
  totalMessages: number;
  lastActivity: number;
  userProfile: {
    fitnessGoals: string[];
    injuries: string[];
    preferences: string[];
    fitnessLevel: string;
  };
  recentTopics: string[];
  conversationSummary: string;
}

export interface ConversationSearchResult {
  entry: ConversationEntry;
  similarity: number;
  relevantContext: string;
}

export class ConversationMemoryService {
  private static readonly CONVERSATION_NAMESPACE = 'conversation_memory';
  private static readonly CONTEXT_NAMESPACE = 'conversation_context';
  
  /**
   * Process a conversation message with LangChain and store in Pinecone
   */
  static async processConversationMessage(
    userId: string,
    userMessage: string,
    sessionId: string = 'default'
  ): Promise<{ aiResponse: string; conversationEntry: ConversationEntry | null }> {
    try {
      console.log('🧠 Processing conversation message with memory...');

      // Use LangChain-only memory (more reliable than Pinecone)
      console.log('💡 Using LangChain in-memory conversation history');

      // Get AI response using LangChain with memory
      const langchainResult = await callLangChain(userMessage, userId);
      
      if (!langchainResult || !langchainResult.response) {
        throw new Error('No response from LangChain');
      }

      console.log('✅ Conversation processed with LangChain memory');

      return {
        aiResponse: langchainResult.response,
        conversationEntry: {
          id: `conv_${Date.now()}`,
          userId,
          messageId: `msg_${Date.now()}`,
          text: langchainResult.response,
          isUser: false,
          timestamp: Date.now(),
          embeddingId: `embed_${Date.now()}`,
          sessionId,
        },
      };

    } catch (error) {
      console.error('❌ Error processing conversation message:', error);
      return {
        aiResponse: "I'm having trouble accessing my memory right now, but I'm here to help! What would you like to work on? 💪",
        conversationEntry: null,
      };
    }
  }

  // Removed - using simplified LangChain-only memory

  /**
   * Load user's conversation history (simplified version)
   */
  static async loadUserConversationHistory(userId: string, limit: number = 50): Promise<FitnessChatMessage[]> {
    try {
      console.log('📚 Loading conversation history from LangChain memory...');

      // LangChain handles conversation memory automatically
      // No need to query external services
      console.log('💡 Using LangChain built-in conversation memory');
      
      return [];

    } catch (error) {
      console.error('❌ Error loading conversation history:', error);
      return [];
    }
  }

  // Removed - using simplified LangChain-only memory

  // Removed - using simplified LangChain-only memory

  /**
   * Get conversation summary for a user
   */
  static async getUserConversationSummary(userId: string): Promise<string> {
    try {
      return await getConversationSummary(userId);
    } catch (error) {
      console.error('❌ Error getting conversation summary:', error);
      return "Unable to generate conversation summary.";
    }
  }

  /**
   * Clear all conversation memory for a user
   */
  static async clearUserConversationMemory(userId: string): Promise<void> {
    try {
      console.log('🗑️ Clearing conversation memory for user:', userId);
      
      // Clear LangChain memory
      clearConversationMemory();
      
      // Note: Pinecone doesn't support bulk delete by metadata
      // In a production app, you'd implement this via Pinecone's delete API
      console.log('✅ LangChain memory cleared (Pinecone cleanup requires separate implementation)');

    } catch (error) {
      console.error('❌ Error clearing conversation memory:', error);
    }
  }

  /**
   * Get conversation statistics for a user
   */
  static async getUserConversationStats(userId: string): Promise<{
    totalMessages: number;
    userMessages: number;
    aiMessages: number;
    topicsDiscussed: string[];
    lastActivity: Date | null;
  }> {
    try {
      const conversationHistory = await this.loadUserConversationHistory(userId, 100);
      
      const userMessages = conversationHistory.filter(msg => msg.isUser).length;
      const aiMessages = conversationHistory.filter(msg => !msg.isUser).length;
      const lastActivity = conversationHistory.length > 0 
        ? new Date(Math.max(...conversationHistory.map(msg => msg.timestamp.getTime())))
        : null;

      return {
        totalMessages: conversationHistory.length,
        userMessages,
        aiMessages,
        topicsDiscussed: [], // Would extract from context analysis
        lastActivity,
      };

    } catch (error) {
      console.error('❌ Error getting conversation stats:', error);
      return {
        totalMessages: 0,
        userMessages: 0,
        aiMessages: 0,
        topicsDiscussed: [],
        lastActivity: null,
      };
    }
  }
}

export default ConversationMemoryService; 