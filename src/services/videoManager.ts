import * as FileSystem from 'expo-file-system';
import * as MediaLibrary from 'expo-media-library';
import { createContentEmbedding } from './aiFeatures';

interface VideoSession {
  sessionId: string;
  userId: string;
  videoUri: string;
  tempPath: string;
  timestamp: number;
  metadata?: any;
}

class VideoManager {
  private activeSessions: Map<string, VideoSession> = new Map();
  private readonly VIDEO_DIR = `${FileSystem.documentDirectory}videos/`;

  constructor() {
    this.ensureVideoDirectory();
  }

  private async ensureVideoDirectory() {
    try {
      const dirInfo = await FileSystem.getInfoAsync(this.VIDEO_DIR);
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(this.VIDEO_DIR, { intermediates: true });
        console.log('📁 Created video directory:', this.VIDEO_DIR);
      }
    } catch (error) {
      console.error('❌ Error creating video directory:', error);
    }
  }

  // Create a new video session when recording starts
  public createVideoSession(userId: string): string {
    const sessionId = `video_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const tempPath = `${this.VIDEO_DIR}${sessionId}.mov`;
    
    const session: VideoSession = {
      sessionId,
      userId,
      videoUri: '',
      tempPath,
      timestamp: Date.now(),
    };

    this.activeSessions.set(sessionId, session);
    console.log('🎬 Created video session:', sessionId, 'for user:', userId);
    
    return sessionId;
  }

  // Store the video URI when recording completes
  public async completeVideoSession(sessionId: string, videoUri: string): Promise<VideoSession | null> {
    const session = this.activeSessions.get(sessionId);
    if (!session) {
      console.error('❌ Video session not found:', sessionId);
      return null;
    }

    // Copy the video to our managed directory for reliability
    try {
      console.log('📹 Copying video to managed storage...');
      await FileSystem.copyAsync({
        from: videoUri,
        to: session.tempPath
      });

      session.videoUri = session.tempPath;
      console.log('✅ Video copied successfully:', session.tempPath);

      // Enhance with AI metadata
      await this.enhanceVideoWithAI(session);

      return session;
    } catch (error) {
      console.error('❌ Error copying video:', error);
      // Fallback to original URI
      session.videoUri = videoUri;
      return session;
    }
  }

  // Get video from session (no more gallery searching!)
  public getVideoFromSession(sessionId: string): VideoSession | null {
    const session = this.activeSessions.get(sessionId);
    if (!session) {
      console.error('❌ Video session not found:', sessionId);
      return null;
    }

    if (!session.videoUri) {
      console.log('⏳ Video session found but URI not available yet:', sessionId);
      return session; // Return session even without URI
    }

    console.log('📹 Retrieved video from session:', sessionId, session.videoUri);
    return session;
  }

  // Wait for video session to be completed (for async loading)
  public async waitForVideoSession(sessionId: string, timeoutMs: number = 10000): Promise<VideoSession | null> {
    const startTime = Date.now();
    
    while (Date.now() - startTime < timeoutMs) {
      const session = this.activeSessions.get(sessionId);
      
      if (!session) {
        console.error('❌ Video session not found during wait:', sessionId);
        return null;
      }
      
      if (session.videoUri) {
        console.log('✅ Video session completed during wait:', sessionId);
        return session;
      }
      
      // Wait 500ms before checking again
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    console.log('⏰ Timeout waiting for video session completion:', sessionId);
    return this.activeSessions.get(sessionId) || null;
  }

  // Enhance video with AI metadata and store in vector database
  private async enhanceVideoWithAI(session: VideoSession): Promise<void> {
    try {
      console.log('🤖 Enhancing video with AI...');
      
      // Create AI embeddings and store in Pinecone
      const embedding = await createContentEmbedding({
        uri: session.videoUri,
        type: 'video',
        caption: `Video recorded at ${new Date(session.timestamp).toLocaleString()}`,
        userId: session.userId
      });

      if (embedding) {
        session.metadata = {
          embeddingId: embedding.id,
          aiAnalyzed: true,
          enhancedAt: Date.now()
        };
        console.log('✅ Video enhanced with AI embeddings');
      }
    } catch (error) {
      console.error('❌ Error enhancing video with AI:', error);
    }
  }

  // Save to gallery with user tracking
  public async saveToGallery(sessionId: string): Promise<boolean> {
    const session = this.activeSessions.get(sessionId);
    if (!session) {
      console.error('❌ Video session not found for gallery save:', sessionId);
      return false;
    }

    try {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') {
        console.error('❌ Media library permission not granted');
        return false;
      }

      // Save to gallery
      await MediaLibrary.saveToLibraryAsync(session.videoUri);
      console.log('📱 Video saved to gallery successfully');

      // Update session with gallery save status
      session.metadata = {
        ...session.metadata,
        savedToGallery: true,
        savedAt: Date.now()
      };

      return true;
    } catch (error) {
      console.error('❌ Error saving to gallery:', error);
      return false;
    }
  }

  // Clean up session
  public async cleanupSession(sessionId: string): Promise<void> {
    const session = this.activeSessions.get(sessionId);
    if (!session) return;

    try {
      // Delete temporary file if it exists
      if (session.tempPath && session.tempPath.startsWith(this.VIDEO_DIR)) {
        const fileInfo = await FileSystem.getInfoAsync(session.tempPath);
        if (fileInfo.exists) {
          await FileSystem.deleteAsync(session.tempPath);
          console.log('🗑️ Cleaned up temp video:', session.tempPath);
        }
      }
    } catch (error) {
      console.error('❌ Error cleaning up video file:', error);
    }

    this.activeSessions.delete(sessionId);
    console.log('🧹 Video session cleaned up:', sessionId);
  }

  // Get all user videos (from AI database, not gallery)
  public async getUserVideos(userId: string): Promise<any[]> {
    try {
      // Use AI search to find user's videos
      const { searchSimilarContent } = await import('./aiFeatures');
      const results = await searchSimilarContent(`user:${userId} video`, userId, 50);
      
      console.log(`📹 Found ${results.length} videos for user ${userId}`);
      return results;
    } catch (error) {
      console.error('❌ Error getting user videos:', error);
      return [];
    }
  }

  // Smart video search within user's content
  public async searchUserVideos(userId: string, query: string): Promise<any[]> {
    try {
      const { searchSimilarContent } = await import('./aiFeatures');
      const results = await searchSimilarContent(query, userId, 20);
      
      console.log(`🔍 Found ${results.length} videos matching "${query}" for user ${userId}`);
      return results;
    } catch (error) {
      console.error('❌ Error searching user videos:', error);
      return [];
    }
  }
}

export const videoManager = new VideoManager(); 