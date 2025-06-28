import { storage } from './firebase';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import * as FileSystem from 'expo-file-system';

export interface VideoUploadResult {
  success: boolean;
  downloadURL?: string;
  error?: string;
}

export class FirebaseVideoService {
  private static readonly TEMP_VIDEO_FOLDER = 'temp-videos';
  private static readonly AUTO_DELETE_TIME = 24 * 60 * 60 * 1000; // 24 hours

  /**
   * Upload video to Firebase Storage and get public URL
   */
  static async uploadVideo(videoUri: string, userId: string): Promise<VideoUploadResult> {
    try {
      console.log('🔥 Starting Firebase video upload:', videoUri);

      // Check if Firebase Storage is available
      if (!storage) {
        console.log('⚠️ Firebase Storage not available');
        return {
          success: false,
          error: 'Firebase Storage not initialized'
        };
      }

      // Validate input
      if (!videoUri || !videoUri.startsWith('file://')) {
        return {
          success: false,
          error: 'Invalid video URI - must be a local file URI'
        };
      }

      // Generate unique filename
      const timestamp = Date.now();
      const filename = `${userId}_${timestamp}.mp4`;
      const storageRef = ref(storage, `${this.TEMP_VIDEO_FOLDER}/${filename}`);

      // Read file as blob
      console.log('📖 Reading video file...');
      const response = await fetch(videoUri);
      const blob = await response.blob();

      console.log('📤 Uploading to Firebase Storage...');
      
      // Upload with metadata
      const metadata = {
        contentType: 'video/mp4',
        customMetadata: {
          userId: userId,
          uploadTime: timestamp.toString(),
          autoDeleteAfter: (timestamp + this.AUTO_DELETE_TIME).toString()
        }
      };

      const uploadResult = await uploadBytes(storageRef, blob, metadata);
      console.log('✅ Upload completed:', uploadResult.metadata.name);

      // Get download URL
      const downloadURL = await getDownloadURL(storageRef);
      console.log('🔗 Download URL generated:', downloadURL);

      // Schedule auto-delete (in a real app, you'd use Cloud Functions)
      this.scheduleAutoDelete(storageRef, this.AUTO_DELETE_TIME);

      return {
        success: true,
        downloadURL: downloadURL
      };

    } catch (error) {
      console.error('❌ Firebase video upload failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown upload error'
      };
    }
  }

  /**
   * Delete video from Firebase Storage
   */
  static async deleteVideo(downloadURL: string): Promise<boolean> {
    try {
      // Extract file path from download URL
      const urlParts = downloadURL.split('/');
      const filename = urlParts[urlParts.length - 1].split('?')[0];
      const storageRef = ref(storage, `${this.TEMP_VIDEO_FOLDER}/${filename}`);

      await deleteObject(storageRef);
      console.log('🗑️ Video deleted from Firebase:', filename);
      return true;

    } catch (error) {
      console.error('❌ Error deleting video from Firebase:', error);
      return false;
    }
  }

  /**
   * Upload video from MediaLibrary asset
   */
  static async uploadFromGallery(assetUri: string, userId: string): Promise<VideoUploadResult> {
    try {
      console.log('🔥 Uploading video from gallery:', assetUri);

      // For gallery videos, we might need to copy to local storage first
      if (assetUri.startsWith('ph://')) {
        console.log('📱 Converting Photos URI to local file...');
        
        // Create a temporary local copy
        const timestamp = Date.now();
        const tempFile = `${FileSystem.cacheDirectory}temp_video_${timestamp}.mp4`;
        
        try {
          await FileSystem.copyAsync({
            from: assetUri,
            to: tempFile
          });
          
          const result = await this.uploadVideo(tempFile, userId);
          
          // Clean up temp file
          await FileSystem.deleteAsync(tempFile, { idempotent: true });
          
          return result;
        } catch (copyError) {
          console.log('⚠️ Direct copy failed, trying alternate approach...');
          return {
            success: false,
            error: 'Could not process gallery video'
          };
        }
      }

      // For regular file URIs, upload directly
      return await this.uploadVideo(assetUri, userId);

    } catch (error) {
      console.error('❌ Error uploading from gallery:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Gallery upload error'
      };
    }
  }

  /**
   * Schedule auto-delete (simplified version)
   */
  private static scheduleAutoDelete(storageRef: any, delayMs: number): void {
    // In a production app, you'd use Firebase Cloud Functions for this
    // For demo purposes, we'll just log the scheduled deletion
    console.log(`⏰ Video scheduled for auto-delete in ${delayMs / 1000 / 60 / 60} hours`);
    
    // Optional: Set a client-side timeout for immediate cleanup in demo
    setTimeout(async () => {
      try {
        await deleteObject(storageRef);
        console.log('🗑️ Auto-deleted temporary video');
      } catch (error) {
        console.log('⚠️ Auto-delete failed (file may already be deleted)');
      }
    }, Math.min(delayMs, 30 * 60 * 1000)); // Max 30 minutes for demo
  }

  /**
   * Check if URL is a Firebase Storage URL
   */
  static isFirebaseURL(url: string): boolean {
    return url.includes('firebasestorage.googleapis.com');
  }

  /**
   * Get video info without downloading
   */
  static async getVideoInfo(downloadURL: string): Promise<any> {
    try {
      const response = await fetch(downloadURL, { method: 'HEAD' });
      return {
        size: response.headers.get('content-length'),
        type: response.headers.get('content-type'),
        lastModified: response.headers.get('last-modified')
      };
    } catch (error) {
      console.error('Error getting video info:', error);
      return null;
    }
  }
}

export default FirebaseVideoService; 