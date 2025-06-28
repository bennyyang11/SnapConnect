import { ChatOpenAI } from '@langchain/openai';
import { ConversationChain } from 'langchain/chains';
import { BufferWindowMemory } from 'langchain/memory';
import { PromptTemplate } from '@langchain/core/prompts';

// LangChain Service for Conversation Memory
const OPENAI_API_KEY = process.env.EXPO_PUBLIC_OPENAI_API_KEY;

let chatModel: ChatOpenAI | null = null;
let conversationChain: ConversationChain | null = null;

// Token management utilities
const estimateTokens = (text: string): number => {
  // Rough estimation: 1 token ≈ 4 characters for English text
  return Math.ceil(text.length / 4);
};

const truncateInput = (input: string, maxTokens: number = 2000): string => {
  const tokens = estimateTokens(input);
  if (tokens <= maxTokens) return input;
  
  // Truncate to approximate token limit
  const maxChars = maxTokens * 4;
  const truncated = input.substring(0, maxChars);
  return truncated + '... [message truncated]';
};

export const initializeLangChain = () => {
  if (!OPENAI_API_KEY) {
    throw new Error('OpenAI API key not configured. Please add EXPO_PUBLIC_OPENAI_API_KEY to your .env file.');
  }
  
  // Initialize ChatOpenAI model with token-optimized settings
  chatModel = new ChatOpenAI({
    openAIApiKey: OPENAI_API_KEY,
    modelName: 'gpt-3.5-turbo', // Use 3.5-turbo for better token efficiency
    temperature: 0.7,
    maxTokens: 800, // Increase response tokens but manage input tokens
  });

  // Create memory for conversation history with window-based token management
  const memory = new BufferWindowMemory({
    memoryKey: 'chat_history',
    returnMessages: true,
    k: 10, // Keep only last 10 exchanges to prevent token overflow
  });

  // Create conversation prompt template (optimized for token efficiency)
  const prompt = PromptTemplate.fromTemplate(`
    You are an AI Fitness Coach for SnapConnect. Your expertise: exercise, nutrition, recovery, injury prevention.
    
    Personality: Encouraging, professional, adaptive. Use emojis appropriately 💪
    
    Chat History: {chat_history}
    
    User: {input}
    
    Coach:
  `);

  // Create conversation chain
  conversationChain = new ConversationChain({
    llm: chatModel,
    memory: memory,
    prompt: prompt,
    verbose: false,
  });

  console.log('✅ LangChain initialized with conversation memory');
  return true;
};

// Fallback direct OpenAI call when LangChain fails
const callDirectOpenAI = async (input: string): Promise<string> => {
  try {
    if (!chatModel) {
      const directModel = new ChatOpenAI({
        openAIApiKey: OPENAI_API_KEY,
        modelName: 'gpt-3.5-turbo',
        temperature: 0.7,
        maxTokens: 800,
      });

      const response = await directModel.invoke(`You are an AI Fitness Coach. ${input}`);
      return typeof response.content === 'string' ? response.content : 'Sorry, I had trouble generating a response.';
    }

    const response = await chatModel.invoke(`You are an AI Fitness Coach for SnapConnect. ${input}`);
    return typeof response.content === 'string' ? response.content : 'Sorry, I had trouble generating a response.';
  } catch (error) {
    console.error('❌ Direct OpenAI call also failed:', error);
    return "I'm having trouble right now, but I'm here to help with your fitness goals! 💪";
  }
};

// Main conversation function with memory and token management
export const callLangChain = async (input: string, userId: string = 'default'): Promise<{ response: string; memory: any }> => {
  try {
    if (!conversationChain) {
      initializeLangChain();
    }

    if (!conversationChain) {
      console.log('⚠️ LangChain initialization failed, using direct OpenAI');
      const response = await callDirectOpenAI(input);
      return { response, memory: null };
    }

    // Truncate input if too long
    const processedInput = truncateInput(input, 2000);
    const inputTokens = estimateTokens(processedInput);
    
    console.log('🧠 Processing conversation with memory:', {
      originalLength: input.length,
      processedLength: processedInput.length,
      estimatedTokens: inputTokens
    });

    // Call the conversation chain
    const result = await conversationChain.call({
      input: processedInput,
    });

    console.log('✅ LangChain response generated with memory context');

    return {
      response: result.response,
      memory: conversationChain.memory,
    };

  } catch (error) {
    console.error('❌ Error in LangChain conversation:', error);
    
    // Handle specific token limit errors
    if ((error as Error).message && (error as Error).message.includes('maximum context length')) {
      console.log('🔄 Token limit exceeded, clearing old memory and retrying...');
      
      try {
        // Clear older conversation memory and retry
        clearConversationMemory();
        
        const retryResult = await conversationChain?.call({
          input: truncateInput(input, 1500), // Use shorter input for retry
        });

        if (retryResult) {
          return {
            response: `${retryResult.response}\n\n💭 *Note: I had to clear some older conversation history to continue our chat.*`,
            memory: conversationChain?.memory,
          };
        }
      } catch (retryError) {
        console.error('❌ Retry after memory clear also failed:', retryError);
      }
    }

    // Ultimate fallback - use direct OpenAI without memory
    console.log('🔄 LangChain failed completely, falling back to direct OpenAI');
    const fallbackResponse = await callDirectOpenAI(input);
    
    return {
      response: fallbackResponse,
      memory: null,
    };
  }
};

// Get conversation memory summary
export const getConversationSummary = async (userId: string): Promise<string> => {
  try {
    if (!conversationChain?.memory) {
      return "No previous conversation history found.";
    }

    // Get memory variables
    const memoryVars = await conversationChain.memory.loadMemoryVariables({});
    const chatHistory = memoryVars.chat_history;

    if (!chatHistory || chatHistory.length === 0) {
      return "No previous conversation history found.";
    }

    // Create summary using OpenAI
    if (!chatModel) {
      return "Memory available but cannot generate summary.";
    }

    const summaryPrompt = `
      Based on this conversation history, provide a brief summary of:
      1. User's fitness goals
      2. Any mentioned injuries or limitations
      3. Preferred exercises or training style
      4. Recent workout topics discussed
      
      Conversation history:
      ${JSON.stringify(chatHistory, null, 2)}
      
      Provide a concise summary in 2-3 sentences:
    `;

    const summary = await chatModel.invoke(summaryPrompt);
    return typeof summary.content === 'string' ? summary.content : 'Unable to generate summary.';

  } catch (error) {
    console.error('❌ Error generating conversation summary:', error);
    return "Unable to generate conversation summary.";
  }
};

// Clear conversation memory (for new user or reset)
export const clearConversationMemory = (): void => {
  try {
    if (conversationChain?.memory && 'chatHistory' in conversationChain.memory) {
      (conversationChain.memory as any).chatHistory = [];
      console.log('🗑️ Conversation memory cleared');
    }
  } catch (error) {
    console.error('❌ Error clearing conversation memory:', error);
  }
};

// Load conversation memory from external source
export const loadConversationMemory = async (conversationHistory: any[]): Promise<void> => {
  try {
    if (!conversationChain) {
      initializeLangChain();
    }

    if (conversationHistory && conversationHistory.length > 0 && conversationChain?.memory) {
      // Clear existing memory by resetting chat history
      if ('chatHistory' in conversationChain.memory) {
        (conversationChain.memory as any).chatHistory = [];
      }

      // Load previous conversations
      for (const message of conversationHistory) {
        if (message.isUser) {
          await conversationChain.memory.saveContext(
            { input: message.text },
            { output: '' }
          );
        } else {
          await conversationChain.memory.saveContext(
            { input: '' },
            { output: message.text }
          );
        }
      }

      console.log('📚 Loaded conversation memory from history');
    }
  } catch (error) {
    console.error('❌ Error loading conversation memory:', error);
  }
};

// Advanced memory management for token overflow
const manageMemoryTokens = async (): Promise<void> => {
  try {
    if (!conversationChain?.memory) return;

    // Get current memory
    const memoryVars = await conversationChain.memory.loadMemoryVariables({});
    const chatHistory = memoryVars.chat_history;

    if (!chatHistory || chatHistory.length === 0) return;

    // Estimate total tokens in memory
    const memoryText = JSON.stringify(chatHistory);
    const totalTokens = estimateTokens(memoryText);

    console.log('📊 Memory token check:', {
      totalMessages: chatHistory.length,
      estimatedTokens: totalTokens,
      limit: 4000
    });

    // If approaching limit, the BufferWindowMemory will automatically drop old messages
    // But we can also manually trigger cleanup if needed
    if (totalTokens > 3500) {
      console.log('⚠️ Memory approaching token limit, BufferWindowMemory will drop old messages');
    }

  } catch (error) {
    console.error('❌ Error in memory token management:', error);
  }
};

export default {
  initializeLangChain,
  callLangChain,
  getConversationSummary,
  clearConversationMemory,
  loadConversationMemory,
  manageMemoryTokens,
}; 