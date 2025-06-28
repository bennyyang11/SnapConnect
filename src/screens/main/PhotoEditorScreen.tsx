import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Image,
  Dimensions,
  TouchableWithoutFeedback,
  Keyboard,
  ScrollView,
  Alert,
  ActivityIndicator,
  Modal,
  KeyboardAvoidingView,
  Platform,
  PanResponder,
  Animated,
} from 'react-native';
import { Video, ResizeMode, AVPlaybackStatus } from 'expo-av';
import * as MediaLibrary from 'expo-media-library';
import * as FileSystem from 'expo-file-system';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { MainTabParamList, RootStackParamList } from '../../types';
import { AIAssistant } from '../../components/AIAssistant';
import { videoManager } from '../../services/videoManager';
import FirebaseVideoService from '../../services/firebaseVideoService';
// import AppVideoStorage, { AppVideo } from '../../services/appVideoStorage';
// import AppVideoGallery from '../../components/AppVideoGallery';

const { width, height } = Dimensions.get('window');

type PhotoEditorScreenNavigationProp = StackNavigationProp<RootStackParamList>;
type PhotoEditorScreenRouteProp = RouteProp<RootStackParamList, 'PhotoEditor'>;

// AI Overlay Types
interface AIOverlay {
  id: string;
  imageUri: string;
  x: number;
  y: number;
  scale: number;
  prompt: string;
}

// AI Model Configuration
type AIModel = 'dalle3' | 'dalle2' | 'stable-diffusion';

interface AIModelConfig {
  name: string;
  description: string;
  maxSize: string;
  strengths: string[];
}

const AI_MODELS: Record<AIModel, AIModelConfig> = {
  'dalle3': {
    name: 'DALL-E 3',
    description: 'Latest OpenAI model with best prompt understanding',
    maxSize: '1024x1024',
    strengths: ['Prompt accuracy', 'High quality', 'Creative interpretation']
  },
  'dalle2': {
    name: 'DALL-E 2', 
    description: 'Reliable OpenAI model with fast generation',
    maxSize: '1024x1024',
    strengths: ['Speed', 'Consistency', 'Lower cost']
  },
  'stable-diffusion': {
    name: 'Stable Diffusion XL',
    description: 'Open-source model with artistic styles',
    maxSize: '1024x1024', 
    strengths: ['Artistic styles', 'Customization', 'Creative freedom']
  }
};

// Trash Can Component
const TrashCan: React.FC<{ isVisible: boolean; isActive: boolean }> = ({ isVisible, isActive }) => {
  if (!isVisible) return null;

  return (
    <Animated.View style={[
      styles.trashCan, 
      { backgroundColor: isActive ? '#FF6B6B' : '#666666' }
    ]}>
      <Text style={styles.trashCanIcon}>🗑️</Text>
      <Text style={styles.trashCanText}>Drop to Delete</Text>
    </Animated.View>
  );
};

// Helper function to check if sticker overlaps with trash can
const isOverTrashCan = (stickerX: number, stickerY: number): boolean => {
  const trashCanX = width / 2 - 50; // Centered horizontally
  const trashCanY = height - 230; // 150 (bottom) + 80 (height) = 230 from bottom
  const trashCanWidth = 100;
  const trashCanHeight = 80;
  const stickerSize = 100;
  
  // Debug logging
  console.log('🗑️ Collision check:', {
    stickerX,
    stickerY,
    trashCanX,
    trashCanY,
    isOverlapping: (
      stickerX + stickerSize > trashCanX &&
      stickerX < trashCanX + trashCanWidth &&
      stickerY + stickerSize > trashCanY &&
      stickerY < trashCanY + trashCanHeight
    )
  });

  return (
    stickerX + stickerSize > trashCanX &&
    stickerX < trashCanX + trashCanWidth &&
    stickerY + stickerSize > trashCanY &&
    stickerY < trashCanY + trashCanHeight
  );
};

// Interactive AI Sticker Component
interface InteractiveAIStickerProps {
  overlay: AIOverlay;
  onUpdate: (id: string, updates: Partial<AIOverlay>) => void;
  onDelete: (id: string) => void;
  onDragStart: () => void;
  onDragMove: (isOverTrash: boolean) => void;
  onDragEnd: (isOverTrash: boolean) => void;
}

const InteractiveAISticker: React.FC<InteractiveAIStickerProps> = ({ overlay, onUpdate, onDelete, onDragStart, onDragMove, onDragEnd }) => {
  // Animated values for gesture handling
  const pan = useRef(new Animated.ValueXY({ x: overlay.x, y: overlay.y })).current;
  const scale = useRef(new Animated.Value(overlay.scale)).current;
  const [isPinching, setIsPinching] = useState(false);
  const currentPos = useRef({ x: overlay.x, y: overlay.y });
  const currentScaleValue = useRef(overlay.scale);
  const lastScale = useRef(overlay.scale);
  const initialPinchDistance = useRef(0);

  // Track animated values to keep currentPos in sync
  useEffect(() => {
    const panListener = pan.addListener(({ x, y }) => {
      currentPos.current = { x, y };
    });
    const scaleListener = scale.addListener(({ value }) => {
      currentScaleValue.current = value;
    });

    return () => {
      pan.removeListener(panListener);
      scale.removeListener(scaleListener);
    };
  }, []);

  // Pan responder for dragging and pinch-to-zoom
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        // Require more movement to start dragging (less sensitive)
        return Math.abs(gestureState.dx) > 5 || Math.abs(gestureState.dy) > 5 || evt.nativeEvent.touches.length === 2;
      },
      onPanResponderGrant: () => {
        // Store current animated position as starting point
        setIsPinching(false);
        lastScale.current = currentScaleValue.current;
        
        // Set the pan offset so dragging starts from current position
        pan.setOffset({
          x: currentPos.current.x,
          y: currentPos.current.y,
        });
        pan.setValue({ x: 0, y: 0 });
        
        // Show trash can when starting to drag
        onDragStart();
      },
      onPanResponderMove: (evt, gestureState) => {
        const touches = evt.nativeEvent.touches;
        
        if (touches.length === 2) {
          // Two finger pinch-to-zoom
          const touch1 = touches[0];
          const touch2 = touches[1];
          const distance = Math.sqrt(
            Math.pow(touch2.pageX - touch1.pageX, 2) + Math.pow(touch2.pageY - touch1.pageY, 2)
          );
          
          if (!isPinching) {
            setIsPinching(true);
            initialPinchDistance.current = distance;
            lastScale.current = currentScaleValue.current;
          }
          
          // Scale based on pinch distance ratio
          const scaleRatio = distance / initialPinchDistance.current;
          const scaleValue = Math.max(0.3, Math.min(3, lastScale.current * scaleRatio));
          scale.setValue(scaleValue);
        } else if (touches.length === 1 && !isPinching) {
          // Single finger drag - use gestureState directly (no amplification)
          pan.setValue({
            x: gestureState.dx,
            y: gestureState.dy,
          });
          
          // Check if over trash can and provide visual feedback
          const currentX = currentPos.current.x + gestureState.dx;
          const currentY = currentPos.current.y + gestureState.dy;
          const isOverTrashNow = isOverTrashCan(currentX, currentY);
          onDragMove(isOverTrashNow);
        }
      },
      onPanResponderRelease: (evt, gestureState) => {
        const touches = evt.nativeEvent.touches;
        
        if (isPinching && touches.length < 2) {
          setIsPinching(false);
        }
        
        // Flatten the offset to get final position
        pan.flattenOffset();
        
        // Check if dropped on trash can
        const isOverTrash = isOverTrashCan(currentPos.current.x, currentPos.current.y);
        
        // Hide trash can and handle drop
        onDragEnd(isOverTrash);
        
        if (isOverTrash) {
          // Delete the sticker if dropped on trash
          onDelete(overlay.id);
          return;
        }
        
        // Calculate constrained final position
        const finalX = Math.max(0, Math.min(width - 100, currentPos.current.x));
        const finalY = Math.max(0, Math.min(height - 100, currentPos.current.y));
        const finalScale = currentScaleValue.current;
        
        // Animate to constrained position if needed
        if (finalX !== currentPos.current.x || finalY !== currentPos.current.y) {
          Animated.parallel([
            Animated.spring(pan, {
              toValue: { x: finalX, y: finalY },
              useNativeDriver: false,
              tension: 150,
              friction: 8,
            }),
            Animated.spring(scale, {
              toValue: finalScale,
              useNativeDriver: false,
              tension: 150,
              friction: 8,
            }),
          ]).start();
        }
        
        // Update overlay state
        onUpdate(overlay.id, {
          x: finalX,
          y: finalY,
          scale: finalScale,
        });
      },
    })
  ).current;

  // Update animated values when overlay props change externally (but not currentPos to avoid reset)
  useEffect(() => {
    // Only update if the overlay props are significantly different from current animated values
    const currentX = currentPos.current.x;
    const currentY = currentPos.current.y;
    const currentScale = currentScaleValue.current;
    
    if (Math.abs(overlay.x - currentX) > 1 || Math.abs(overlay.y - currentY) > 1 || Math.abs(overlay.scale - currentScale) > 0.01) {
      pan.setValue({ x: overlay.x, y: overlay.y });
      scale.setValue(overlay.scale);
      currentPos.current = { x: overlay.x, y: overlay.y };
      currentScaleValue.current = overlay.scale;
    }
  }, [overlay.x, overlay.y, overlay.scale]);

  return (
    <Animated.View
      style={[
        styles.aiOverlay,
        {
          left: 0,
          top: 0,
          transform: [
            { translateX: pan.x },
            { translateY: pan.y },
            { scale: scale },
          ],
        },
      ]}
    >
      <View
        {...panResponder.panHandlers}
        style={styles.stickerContainer}
      >
        <Image source={{ uri: overlay.imageUri }} style={styles.aiOverlayImage} />
      </View>
    </Animated.View>
  );
};

// Helper function to detect fake/temp video URIs
const isVideoURIFake = (uri: string): boolean => {
  if (!uri) return false;
  
  // Check for fake protocols
  const fakeProtocols = ['session://', 'temp://', 'direct://', 'loading://', 'ai://'];
  if (fakeProtocols.some(protocol => uri.startsWith(protocol))) {
    return true;
  }
  
  // Check for URIs that contain protocols but aren't real file/http URIs
  if (uri.includes('://') && !uri.startsWith('file://') && !uri.startsWith('http://') && !uri.startsWith('https://')) {
    return true;
  }
  
  return false;
};

export default function PhotoEditorScreen() {
  const navigation = useNavigation<PhotoEditorScreenNavigationProp>();
  const route = useRoute<PhotoEditorScreenRouteProp>();
  const { photoUri, mediaType, storyReply, videoSessionId } = route.params;

  const [caption, setCaption] = useState('');
  const [imageError, setImageError] = useState(false);
  const [videoError, setVideoError] = useState(false);
  const [videoLoading, setVideoLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [videoDuration, setVideoDuration] = useState(0);
  const [currentPosition, setCurrentPosition] = useState(0);
  const [showVideoControls, setShowVideoControls] = useState(false);
  const [videoFilter, setVideoFilter] = useState('none');
  const [isTempVideo, setIsTempVideo] = useState(false);
  const [actualVideoUri, setActualVideoUri] = useState<string | null>(null);
  const [isSearchingForVideo, setIsSearchingForVideo] = useState(false);
  const [showAIAssistant, setShowAIAssistant] = useState(false);
  const [isVideoProcessing, setIsVideoProcessing] = useState(false);
  const [isUploadingToFirebase, setIsUploadingToFirebase] = useState(false);
  const [firebaseVideoUrl, setFirebaseVideoUrl] = useState<string | null>(null);
  const [showAppGallery, setShowAppGallery] = useState(false);
  
  // AI Overlay State
  const [aiOverlays, setAiOverlays] = useState<AIOverlay[]>([]);
  const [showAIOverlayModal, setShowAIOverlayModal] = useState(false);
  const [overlayPrompt, setOverlayPrompt] = useState('');
  const [isGeneratingOverlay, setIsGeneratingOverlay] = useState(false);
  const [showTrashCan, setShowTrashCan] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isOverTrash, setIsOverTrash] = useState(false);
  const [selectedAIModel, setSelectedAIModel] = useState<AIModel>('dalle3');
  const [showModelSelector, setShowModelSelector] = useState(false);
  
  const videoRef = useRef<Video>(null);

  // Check if this is a temp video file
  useEffect(() => {
    // Immediately detect temp/fake URIs to prevent video loading errors
    if (mediaType === 'video' && photoUri) {
      const isFakeUri = photoUri.includes('://') && !photoUri.startsWith('file://') && !photoUri.startsWith('http://') && !photoUri.startsWith('https://');
      const isTempUri = photoUri.startsWith('session://') || photoUri.startsWith('temp://') || photoUri.startsWith('direct://') || photoUri.startsWith('loading://');
      
      if (isFakeUri || isTempUri) {
        console.log('📹 Detected fake/temp URI, will try to find real video for Firebase upload:', photoUri);
        setIsTempVideo(true);
        setVideoError(false); // Reset error state
        
        // Background search will handle finding the video
      }
    }
    
    checkVideoFile();
  }, [photoUri, mediaType]);



  // Try to upload video to Firebase for real preview
  const tryFirebaseUpload = async (videoUri: string): Promise<string | null> => {
    try {
      setIsUploadingToFirebase(true);
      console.log('🔥 Attempting Firebase upload for video preview...');
      
      // Use a simple user ID for demo
      const userId = 'demo_user_' + Date.now();
      
      // Try uploading to Firebase
      const result = await FirebaseVideoService.uploadVideo(videoUri, userId);
      
      if (result.success && result.downloadURL) {
        console.log('✅ Firebase upload successful! Public URL:', result.downloadURL);
        setFirebaseVideoUrl(result.downloadURL);
        setIsTempVideo(false); // It's now a real, playable URL
        return result.downloadURL;
      } else {
        console.log('⚠️ Firebase upload failed:', result.error);
        return null;
      }
    } catch (error) {
      console.error('❌ Firebase upload error:', error);
      return null;
    } finally {
      setIsUploadingToFirebase(false);
    }
  };

  const checkVideoFile = async () => {
    if (mediaType === 'video' && photoUri) {
      console.log('📹 Checking video file:', photoUri);
      
      // If it's already a file:// URI from our app storage, use it directly
      if (photoUri.startsWith('file://')) {
        console.log('✅ Already a file URI from app storage:', photoUri);
        setActualVideoUri(photoUri);
        setIsTempVideo(false);
        setVideoError(false);
        return;
      }
      
      // If it's a Firebase URL, use it directly
      if (FirebaseVideoService.isFirebaseURL(photoUri)) {
        console.log('✅ Already a Firebase URL:', photoUri);
        setActualVideoUri(photoUri);
        setFirebaseVideoUrl(photoUri);
        setIsTempVideo(false);
        setVideoError(false);
        return;
      }
      
      // Use the photoUri directly for video display
      console.log('📹 Using provided URI for video:', photoUri);
      setActualVideoUri(photoUri);
      setIsTempVideo(true);
      setVideoError(false);
    }
  };

  // Cleanup temp video when component unmounts (if user navigates away)
  useEffect(() => {
    return () => {
      if (isTempVideo && (actualVideoUri || photoUri)) {
        console.log('🧹 Cleaning up temp video on unmount');
        deleteTempVideo();
      }
    };
  }, [isTempVideo, actualVideoUri, photoUri]);

  const saveToGallery = async () => {
    const videoToSave = actualVideoUri || photoUri;
    if (!videoToSave || !isTempVideo) return;
    
    try {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please grant permission to save to your gallery.');
        return;
      }
      
      await MediaLibrary.saveToLibraryAsync(videoToSave);
      Alert.alert('Saved!', 'Video saved to your gallery successfully.');
    } catch (error) {
      console.error('Error saving to gallery:', error);
      Alert.alert('Error', 'Failed to save video to gallery.');
    }
  };

  const deleteTempVideo = async () => {
    const videoToDelete = actualVideoUri || photoUri;
    if (!videoToDelete || !isTempVideo) return;
    
    try {
      // Only try to delete if it's a file URI (not asset URI)
      if (videoToDelete.startsWith('file://')) {
        await FileSystem.deleteAsync(videoToDelete, { idempotent: true });
        console.log('🗑️ Temp video deleted:', videoToDelete);
      } else {
        console.log('📹 Non-file URI, skipping deletion:', videoToDelete);
      }
    } catch (error) {
      console.error('Error deleting temp video:', error);
      // Don't throw error, just log it
    }
  };

  const navigateToShare = () => {
    navigation.navigate('ShareScreen', {
      photoUri: actualVideoUri || photoUri,
      mediaType,
      caption,
      storyReply,
    });
  };

  const handleVideoPlayback = async () => {
    if (videoRef.current) {
      if (isPlaying) {
        await videoRef.current.pauseAsync();
        setIsPlaying(false);
      } else {
        await videoRef.current.playAsync();
        setIsPlaying(true);
      }
    }
  };

  const handleVideoLoad = (status: AVPlaybackStatus) => {
    if (status.isLoaded) {
      setVideoDuration(status.durationMillis || 0);
      setVideoLoading(false);
    }
  };

  const handlePlaybackStatusUpdate = (status: AVPlaybackStatus) => {
    if (status.isLoaded) {
      setCurrentPosition(status.positionMillis || 0);
      setIsPlaying(status.isPlaying);
    }
  };

  const seekVideo = async (position: number) => {
    if (videoRef.current) {
      await videoRef.current.setPositionAsync(position);
    }
  };

  const applyVideoFilter = (filter: string) => {
    setVideoFilter(filter);
    Alert.alert(
      'Filter Applied!',
      `${filter} filter has been applied to your video.`,
      [{ text: 'OK' }]
    );
  };

  const formatTime = (milliseconds: number) => {
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const findMyVideo = async () => {
    console.log('🔍 Manual video search initiated');
    setIsSearchingForVideo(true);
    
    try {
      // Check permissions first
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Please grant media library permission to access your videos.',
          [{ text: 'OK' }]
        );
        setIsSearchingForVideo(false);
        return;
      }
      
      // Get all recent videos and show them to user
      console.log('📱 Getting all recent videos...');
      const allVideos = await MediaLibrary.getAssetsAsync({
        mediaType: 'video',
        sortBy: 'creationTime',
        first: 50, // Get many videos
      });
      
      console.log(`📹 Found ${allVideos.assets.length} total videos`);
      
      if (allVideos.assets.length === 0) {
        Alert.alert(
          'No Videos Found',
          'No videos found in your gallery. Make sure you have recorded some videos first.',
          [{ text: 'OK' }]
        );
        setIsSearchingForVideo(false);
        return;
      }
      
      // Show user the 10 most recent videos with timestamps
      const recentVideos = allVideos.assets.slice(0, 10);
      const videoList = recentVideos.map((video, index) => {
        const videoDate = new Date(video.creationTime);
        const timeAgo = Date.now() - video.creationTime;
        const timeAgoText = timeAgo < 60000 ? 
          `${Math.floor(timeAgo/1000)}s ago` : 
          timeAgo < 3600000 ? 
            `${Math.floor(timeAgo/60000)}m ago` : 
            `${Math.floor(timeAgo/3600000)}h ago`;
        
        return `${index + 1}. ${video.filename || 'Video'} - ${timeAgoText}`;
      }).join('\n');
      
      // Use the most recent video (index 0)
      const mostRecentVideo = recentVideos[0];
      
      Alert.alert(
        '🎥 Found Recent Videos',
        `I found ${allVideos.assets.length} videos in your gallery. Here are the 10 most recent:\n\n${videoList}\n\nWould you like to use the most recent video (#1) for editing?`,
        [
          { 
            text: 'Use Most Recent', 
            onPress: async () => {
              try {
                console.log('✅ Using most recent video:', mostRecentVideo.uri);
                
                // Convert to playable URI
                const assetInfo = await MediaLibrary.getAssetInfoAsync(mostRecentVideo);
                
                if (assetInfo && assetInfo.localUri) {
                  console.log('✅ Got playable URI:', assetInfo.localUri);
                  setActualVideoUri(assetInfo.localUri);
                } else if (assetInfo && assetInfo.uri) {
                  console.log('✅ Using asset URI:', assetInfo.uri);
                  setActualVideoUri(assetInfo.uri);
                } else {
                  console.log('⚠️ Using original URI');
                  setActualVideoUri(mostRecentVideo.uri);
                }
                
                setIsTempVideo(false);
                console.log('✅ Video set successfully');
              } catch (error) {
                console.error('❌ Error setting video:', error);
                Alert.alert('Error', 'Could not load the selected video.');
              }
            } 
          },
          { text: 'Cancel' }
        ]
      );
      
    } catch (error) {
      console.error('❌ Error in manual video search:', error);
      Alert.alert(
        'Search Error',
        'Could not search for videos. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsSearchingForVideo(false);
    }
  };

  // AI Assistant handlers
  const handleAICaptionGenerated = (caption: string) => {
    setCaption(caption);
    setShowAIAssistant(false);
  };
  
  const handleAITagsGenerated = (tags: string[]) => {
    const hashtagText = tags.map(tag => `#${tag}`).join(' ');
    setCaption(prev => prev + ' ' + hashtagText);
    setShowAIAssistant(false);
  };

  const handleVideoSelect = (video: any) => {
    console.log('📱 Selected video from app gallery:', video.id);
    setActualVideoUri(video.uri);
    setIsTempVideo(false);
    setVideoError(false);
    setFirebaseVideoUrl(null); // Reset Firebase URL since this is a local file
    console.log('✅ Successfully loaded video from app gallery');
  };

  // Context-aware prompt building with advanced engineering
  const buildContextAwarePrompt = (userPrompt: string): string => {
    // Analyze photo context (if available)
    const photoContext = analyzePhotoContext();
    
    // Analyze user prompt for context
    const isObject = /\b(object|thing|item)\b/i.test(userPrompt);
    const isCharacter = /\b(person|character|animal|creature)\b/i.test(userPrompt);
    const isAbstract = /\b(effect|glow|sparkle|magic|energy)\b/i.test(userPrompt);
    
    // Style and technical specifications
    const styleSpecs = [
      "ultra-high resolution",
      "professional photography quality", 
      "perfect lighting",
      "crisp sharp details",
      "vibrant colors"
    ];
    
    // Camera and composition terms
    const cameraSpecs = [
      "shot with professional camera",
      "optimal composition",
      "studio lighting setup",
      "shallow depth of field background blur"
    ];
    
    // Background specifications for easy removal
    const backgroundSpecs = [
      "pure white background (#FFFFFF)",
      "completely isolated subject",
      "no shadows on background", 
      "clean edges",
      "perfect cutout ready"
    ];
    
    // Build contextual enhancements
    let contextualEnhancements = "";
    if (isCharacter) {
      contextualEnhancements = "expressive features, dynamic pose, character personality, ";
    } else if (isObject) {
      contextualEnhancements = "realistic textures, material properties, dimensional lighting, ";
    } else if (isAbstract) {
      contextualEnhancements = "luminous effects, particle systems, magical atmosphere, ";
    }
    
    // Fitness-themed context enhancements
    const fitnessContext = photoContext ? `In the context of ${photoContext}, ` : '';
    const fitnessEnhancements = [
      "fitness-inspired design",
      "energetic and motivational aesthetic", 
      "health-conscious visual style",
      "active lifestyle vibes"
    ];
    
    // Combine all elements with fitness context
    return `${fitnessContext}Create a premium quality ${userPrompt} as a digital sticker. ${contextualEnhancements}${fitnessEnhancements.join(', ')}, ${styleSpecs.join(', ')}. ${cameraSpecs.join(', ')}. BACKGROUND: ${backgroundSpecs.join(', ')}. Style: photorealistic with artistic flair, award-winning composition, trending on artstation.`;
  };

  // Analyze photo context for better prompt building
  const analyzePhotoContext = (): string => {
    // This could be enhanced with actual image analysis
    // For now, return fitness-related context
    const contexts = [
      "gym environment",
      "outdoor fitness setting", 
      "workout session",
      "healthy lifestyle moment",
      "fitness journey"
    ];
    
    return contexts[Math.floor(Math.random() * contexts.length)];
  };

  // Generate AI image with multiple model support
  const generateAIImageWithModel = async (model: AIModel, prompt: string): Promise<string | null> => {
    const OPENAI_API_KEY = process.env.EXPO_PUBLIC_OPENAI_API_KEY;
    
    // Validate inputs
    if (!prompt || prompt.trim().length === 0) {
      console.error('❌ Empty prompt provided');
      return null;
    }
    
    if (!OPENAI_API_KEY || OPENAI_API_KEY.length < 10) {
      console.error('❌ Invalid OpenAI API key');
      return null;
    }
    
    console.log(`🤖 Generating image with ${model}`);
    console.log(`📝 Prompt length: ${prompt.length} characters`);
    
    switch (model) {
      case 'dalle3':
        return await callDALLE3API(prompt, OPENAI_API_KEY);
      case 'dalle2':
        return await callDALLE2API(prompt, OPENAI_API_KEY);
      case 'stable-diffusion':
        return await callStableDiffusionAPI(prompt);
      default:
        console.error(`❌ Unsupported model: ${model}`);
        return null;
    }
  };

  // DALL-E 3 API call
  const callDALLE3API = async (prompt: string, apiKey: string): Promise<string | null> => {
    try {
      console.log('🎨 Calling DALL-E 3 API...');
      const response = await fetch('https://api.openai.com/v1/images/generations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: 'dall-e-3',
          prompt,
          n: 1,
          size: '1024x1024',
          quality: 'hd',
          style: 'vivid'
        }),
      });

      const data = await response.json();
      console.log('📦 DALL-E 3 response status:', response.status);
      
      if (!response.ok) {
        console.error('❌ DALL-E 3 API error:', data);
        return null;
      }
      
      if (data.data && data.data[0] && data.data[0].url) {
        console.log('✅ DALL-E 3 success, got image URL');
        return data.data[0].url;
      } else {
        console.log('⚠️ DALL-E 3 response missing image URL:', data);
        return null;
      }
    } catch (error) {
      console.error('❌ DALL-E 3 API call failed:', error);
      return null;
    }
  };

  // DALL-E 2 API call  
  const callDALLE2API = async (prompt: string, apiKey: string): Promise<string | null> => {
    try {
      console.log('🎨 Calling DALL-E 2 API...');
      const response = await fetch('https://api.openai.com/v1/images/generations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: 'dall-e-2',
          prompt,
          n: 1,
          size: '1024x1024'
        }),
      });

      const data = await response.json();
      console.log('📦 DALL-E 2 response status:', response.status);
      
      if (!response.ok) {
        console.error('❌ DALL-E 2 API error:', data);
        return null;
      }
      
      if (data.data && data.data[0] && data.data[0].url) {
        console.log('✅ DALL-E 2 success, got image URL');
        return data.data[0].url;
      } else {
        console.log('⚠️ DALL-E 2 response missing image URL:', data);
        return null;
      }
    } catch (error) {
      console.error('❌ DALL-E 2 API call failed:', error);
      return null;
    }
  };

  // Stable Diffusion API call (placeholder)
  const callStableDiffusionAPI = async (prompt: string): Promise<string | null> => {
    try {
      // This would integrate with services like:
      // - Replicate API
      // - Hugging Face
      // - Custom Stable Diffusion endpoint
      
      console.log('🎨 Stable Diffusion not configured, falling back to DALL-E 2');
      const OPENAI_API_KEY = process.env.EXPO_PUBLIC_OPENAI_API_KEY;
      return await callDALLE2API(prompt, OPENAI_API_KEY);
      
      // Example Stable Diffusion implementation (commented out):
      /*
      const SD_API_KEY = process.env.EXPO_PUBLIC_STABLE_DIFFUSION_API_KEY;
      if (!SD_API_KEY) throw new Error('Stable Diffusion API key not configured');
      
      const response = await fetch('https://api.replicate.com/v1/predictions', {
        method: 'POST',
        headers: {
          'Authorization': `Token ${SD_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          version: "sdxl-model-version-id",
          input: {
            prompt: prompt,
            negative_prompt: "blurry, bad quality, distorted",
            width: 1024,
            height: 1024,
            guidance_scale: 7.5,
            num_inference_steps: 20
          }
        })
      });
      
      const prediction = await response.json();
      // Poll for completion...
      return prediction.output?.[0];
      */
    } catch (error) {
      console.error('Stable Diffusion API error:', error);
      return null;
    }
  };

  // Enhanced AI Image Generation with multiple model support
  const generateAIOverlay = async () => {
    if (!overlayPrompt.trim()) {
      Alert.alert('Input Required', 'Please describe what you want to add to your photo.');
      return;
    }

    setIsGeneratingOverlay(true);
    
    try {
      const REMOVEBG_API_KEY = process.env.EXPO_PUBLIC_REMOVEBG_API_KEY || 'YOUR_REMOVEBG_API_KEY_HERE';
      
      // Enhanced prompt engineering with structured layers
      const enhancedPrompt = buildContextAwarePrompt(overlayPrompt);
      console.log(`🎨 Enhanced prompt for ${AI_MODELS[selectedAIModel].name}:`, enhancedPrompt);
      
      // Try selected AI model first
      let imageUrl = await generateAIImageWithModel(selectedAIModel, enhancedPrompt);
      
      // Fallback strategy: try other models if primary fails
      if (!imageUrl && selectedAIModel !== 'dalle2') {
        console.log(`🔄 ${AI_MODELS[selectedAIModel].name} failed, trying DALL-E 2...`);
        imageUrl = await generateAIImageWithModel('dalle2', enhancedPrompt);
      }
      
      if (!imageUrl) {
        throw new Error('All AI models failed to generate image');
      }
      
      let finalImageUri = imageUrl;
      
      // Remove background from the generated image to ensure transparency
      try {
        console.log('🎯 Removing background from AI-generated image...');
        const backgroundRemovedUri = await removeImageBackground(finalImageUri, REMOVEBG_API_KEY);
        if (backgroundRemovedUri) {
          finalImageUri = backgroundRemovedUri;
          console.log('✅ Background removal successful');
          
          // Optional: Upscale the image for better quality
          try {
            const upscaledUri = await upscaleImage(finalImageUri);
            if (upscaledUri) {
              finalImageUri = upscaledUri;
              console.log('🚀 Image upscaled successfully');
            }
          } catch (upscaleError) {
            console.log('⚠️ Upscaling failed, using original:', upscaleError);
          }
        } else {
          console.log('⚠️ Background removal failed, using original image');
        }
      } catch (bgError) {
        console.warn('⚠️ Background removal error:', bgError);
        // Continue with original image if background removal fails
      }
      
      const newOverlay: AIOverlay = {
        id: Date.now().toString(),
        imageUri: finalImageUri,
        x: width / 2 - 60, // Adjusted for potentially larger images
        y: height / 2 - 60,
        scale: 1,
        prompt: overlayPrompt,
      };
      
      setAiOverlays(prev => [...prev, newOverlay]);
      setOverlayPrompt('');
      setShowAIOverlayModal(false);
      
      Alert.alert(
        'Success!', 
        `Enhanced AI sticker generated with ${AI_MODELS[selectedAIModel].name}! Drag it around or drop on trash to delete.`,
        [{ text: 'Awesome!' }]
      );
    } catch (error) {
      console.error('AI Generation Error:', error);
      Alert.alert(
        'Generation Failed', 
        `Failed to generate AI sticker with ${AI_MODELS[selectedAIModel].name}. Please try again with a different description or model.`,
        [
          { text: 'Try Different Model', onPress: () => setShowModelSelector(true) },
          { text: 'OK' }
        ]
      );
    } finally {
      setIsGeneratingOverlay(false);
    }
  };

  // Optional image upscaling service
  const upscaleImage = async (imageUri: string): Promise<string | null> => {
    try {
      // This would integrate with services like:
      // - Upscayl API
      // - Topaz API
      // - Custom upscaling service
      
      console.log('🔍 Upscaling not configured, skipping...');
      return null;
      
      // Example implementation (commented out):
      /*
      const UPSCALE_API_KEY = process.env.EXPO_PUBLIC_UPSCALE_API_KEY;
      if (!UPSCALE_API_KEY) return null;
      
      const response = await fetch('https://api.upscale-service.com/v1/upscale', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${UPSCALE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          image_url: imageUri,
          scale_factor: 2,
          format: 'png'
        })
      });
      
      const result = await response.json();
      return result.upscaled_url;
      */
    } catch (error) {
      console.error('Upscaling error:', error);
      return null;
    }
  };

  // Helper function to remove background from image
  const removeImageBackground = async (imageUrl: string, apiKey: string): Promise<string | null> => {
    try {
      if (apiKey === 'YOUR_REMOVEBG_API_KEY_HERE') {
        // Fallback: Try using a simple CSS-based approach for better rendering
        console.log('⚠️ Remove.bg API key not configured, using original image with improved rendering');
        return null;
      }

      // Download the image first
      const imageResponse = await fetch(imageUrl);
      const imageBlob = await imageResponse.blob();
      
      // Convert blob to form data
      const formData = new FormData();
      formData.append('image_file', imageBlob as any);
      formData.append('size', 'auto');
      
      // Call remove.bg API
      const response = await fetch('https://api.remove.bg/v1.0/removebg', {
        method: 'POST',
        headers: {
          'X-Api-Key': apiKey,
        },
        body: formData,
      });
      
      if (response.ok) {
        const resultBlob = await response.blob();
        
        // Convert blob to base64 data URI
        return new Promise((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(resultBlob);
        });
      } else {
        console.error('Remove.bg API error:', response.status, response.statusText);
        return null;
      }
    } catch (error) {
      console.error('Background removal error:', error);
      return null;
    }
  };

  const updateOverlay = (id: string, updates: Partial<AIOverlay>) => {
    setAiOverlays(prev => prev.map(overlay => 
      overlay.id === id ? { ...overlay, ...updates } : overlay
    ));
  };

  const deleteOverlay = (id: string) => {
    setAiOverlays(prev => prev.filter(overlay => overlay.id !== id));
  };

  const clearAllOverlays = () => {
    Alert.alert(
      'Clear All Overlays',
      'Are you sure you want to remove all AI overlays?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Clear All', style: 'destructive', onPress: () => setAiOverlays([]) }
      ]
    );
  };

  return (
    <View style={styles.container}>
      <TouchableWithoutFeedback 
        onPress={() => {
          // Only dismiss keyboard if no modals are open
          if (!showAIAssistant && !showAIOverlayModal && !showAppGallery) {
            Keyboard.dismiss();
          }
        }}
      >
        <View style={styles.mainContent}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <Text style={styles.backText}>✕</Text>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>
              {mediaType === 'video' ? 'Edit Video' : 'Edit Photo'}
            </Text>
            <View style={styles.headerRight} />
          </View>

          {/* Full Screen Media Preview */}
          <View style={styles.photoContainer}>
            {mediaType === 'video' ? (
              // Video Preview
              videoError || !photoUri ? (
                <View style={styles.placeholderContainer}>
                  <Text style={styles.placeholderIcon}>🎥</Text>
                  <Text style={styles.placeholderText}>Video Preview Error</Text>
                  <Text style={styles.placeholderSubtext}>
                    Unable to load video preview. Please try recording again.
                  </Text>
                  <TouchableOpacity 
                    style={styles.retryButton}
                    onPress={() => navigation.goBack()}
                  >
                    <Text style={styles.retryButtonText}>Record Another</Text>
                  </TouchableOpacity>
                </View>
              ) : isSearchingForVideo ? (
                <View style={styles.placeholderContainer}>
                  <Text style={styles.placeholderIcon}>🔍</Text>
                  <Text style={styles.placeholderText}>Finding Your Video...</Text>
                  <Text style={styles.placeholderSubtext}>
                    Locating the video you just recorded...
                  </Text>
                </View>
              ) : (photoUri === 'loading://finding-video' || photoUri.startsWith('ai://video-session:')) && !actualVideoUri ? (
                <View style={styles.placeholderContainer}>
                  <Text style={styles.placeholderIcon}>
                    {photoUri.startsWith('ai://video-session:') ? '🤖' : '✅'}
                  </Text>
                  <Text style={styles.placeholderText}>
                    {photoUri.startsWith('ai://video-session:') ? 'AI Processing Video...' : 'Video Recorded!'}
                  </Text>
                  <Text style={styles.placeholderSubtext}>
                    {photoUri.startsWith('ai://video-session:') 
                      ? 'Your video is being enhanced with AI features. This may take a moment...'
                      : 'Your video was recorded successfully. You can add a caption and share it below.'
                    }
                  </Text>
                  <TouchableOpacity 
                    style={styles.findVideoButton}
                    onPress={() => {
                      // Trigger the search again
                      setIsSearchingForVideo(true);
                      checkVideoFile();
                    }}
                  >
                    <Text style={styles.findVideoButtonText}>
                      {photoUri.startsWith('ai://video-session:') ? '🔄 Check Status' : '🔍 Find My Video'}
                    </Text>
                  </TouchableOpacity>
                </View>
              ) : isUploadingToFirebase ? (
                // Show Firebase upload progress
                <View style={styles.placeholderContainer}>
                  <Text style={styles.placeholderIcon}>🔥</Text>
                  <Text style={styles.placeholderText}>Uploading Video...</Text>
                  <Text style={styles.placeholderSubtext}>
                    Uploading your video to get real preview in Expo Go...{'\n'}
                    This will only take a moment!
                  </Text>
                  <ActivityIndicator size="large" color="#FFD700" style={{ marginTop: 20 }} />
                </View>
              ) : isTempVideo || isVideoURIFake(actualVideoUri || photoUri) ? (
                // Show demo placeholder for temp videos or non-file URIs - NO VIDEO COMPONENT
                <View style={styles.placeholderContainer}>
                  <Text style={styles.placeholderIcon}>🎬</Text>
                  <Text style={styles.placeholderText}>Video Recorded!</Text>
                  <Text style={styles.placeholderSubtext}>
                    Your video was saved to your app gallery.{'\n'}
                    Tap the Gallery button above to view all your videos.
                  </Text>
                  
                  {/* Gallery Access Button */}
                  <TouchableOpacity 
                    style={styles.findVideoButton}
                    onPress={() => setShowAppGallery(true)}
                  >
                    <Text style={styles.findVideoButtonText}>📱 Open Gallery</Text>
                  </TouchableOpacity>
                  
                  {/* Test Search Button */}
                  <TouchableOpacity 
                    style={[styles.findVideoButton, { backgroundColor: '#FF6B6B', marginTop: 10 }]}
                    onPress={async () => {
                      console.log('🧪 MANUAL TEST: Searching for video files...');
                      try {
                        // const stats = await AppVideoStorage.getStorageStats();
                        // console.log('📊 Current app storage stats:', stats);
                        
                        // const videos = await AppVideoStorage.getAllVideos();
                        // console.log('📹 Videos in app storage:', videos.length);
                        // videos.forEach((v: any) => console.log(`  - ${v.filename} (${new Date(v.timestamp).toLocaleString()})`));
                        
                        Alert.alert('Storage Info', 'App video storage currently disabled');
                                           } catch (error) {
                        console.error('❌ Test error:', error);
                        Alert.alert('Error', error instanceof Error ? error.message : 'Unknown error');
                      }
                    }}
                  >
                    <Text style={styles.findVideoButtonText}>🧪 Test Storage</Text>
                  </TouchableOpacity>
                  
                  {/* Mock Video Controls */}
                  <View style={styles.mockVideoControls}>
                    <TouchableOpacity 
                      style={styles.playPauseButton}
                      onPress={() => setIsPlaying(!isPlaying)}
                    >
                      <Text style={styles.playPauseText}>
                        {isPlaying ? '⏸️' : '▶️'}
                      </Text>
                    </TouchableOpacity>
                    <Text style={styles.demoText}>
                      {isPlaying ? 'Playing demo video...' : 'Tap to play demo'}
                    </Text>
                  </View>
                </View>
              ) : (() => {
                const videoUriToUse = actualVideoUri || photoUri;
                const isFileUri = videoUriToUse.startsWith('file://');
                const isFirebaseUrl = FirebaseVideoService.isFirebaseURL(videoUriToUse);
                
                console.log('🎬 Video rendering decision:');
                console.log('  - videoUriToUse:', videoUriToUse);
                console.log('  - isFileUri:', isFileUri);
                console.log('  - isFirebaseUrl:', isFirebaseUrl);
                console.log('  - actualVideoUri:', actualVideoUri);
                console.log('  - firebaseVideoUrl:', firebaseVideoUrl);
                
                return isFileUri || isFirebaseUrl;
              })() ? (
                // Render Video component for real file URIs and Firebase URLs
                <View style={styles.videoContainer}>
                  {videoLoading && (
                    <View style={styles.videoLoadingOverlay}>
                      <Text style={styles.loadingText}>Loading video...</Text>
                    </View>
                  )}
                  <TouchableOpacity 
                    style={styles.videoTouchArea}
                    onPress={() => setShowVideoControls(!showVideoControls)}
                    activeOpacity={1}
                  >
                    <Video
                      ref={videoRef}
                      source={{ uri: firebaseVideoUrl || actualVideoUri || photoUri }}
                      style={styles.videoPreview}
                      resizeMode={ResizeMode.COVER}
                      isLooping={false}
                      shouldPlay={false}
                      onLoad={handleVideoLoad}
                      onPlaybackStatusUpdate={handlePlaybackStatusUpdate}
                      onError={(error) => {
                        console.error('Video load error:', error);
                        setVideoError(true);
                        setVideoLoading(false);
                      }}
                    />
                    
                    {/* Video Controls Overlay */}
                    {showVideoControls && !videoLoading && (
                      <View style={styles.videoControlsOverlay}>
                        {/* Play/Pause Button */}
                        <TouchableOpacity
                          style={styles.playPauseButton}
                          onPress={handleVideoPlayback}
                        >
                          <Text style={styles.playPauseText}>
                            {isPlaying ? '⏸️' : '▶️'}
                          </Text>
                        </TouchableOpacity>
                        
                        {/* Progress Bar */}
                        <View style={styles.progressContainer}>
                          <Text style={styles.timeText}>
                            {formatTime(currentPosition)}
                          </Text>
                          <View style={styles.progressBar}>
                            <View 
                              style={[
                                styles.progressFill, 
                                { width: `${(currentPosition / videoDuration) * 100}%` }
                              ]} 
                            />
                            <TouchableOpacity
                              style={[
                                styles.progressThumb,
                                { left: `${(currentPosition / videoDuration) * 100}%` }
                              ]}
                              onPress={() => {}}
                            />
                          </View>
                          <Text style={styles.timeText}>
                            {formatTime(videoDuration)}
                          </Text>
                        </View>
                      </View>
                    )}
                  </TouchableOpacity>
                </View>
              ) : (
                // Fallback placeholder for any other cases
                <View style={styles.placeholderContainer}>
                  <Text style={styles.placeholderIcon}>📱</Text>
                  <Text style={styles.placeholderText}>Video Ready</Text>
                  <Text style={styles.placeholderSubtext}>
                    Your video is ready to edit and share!
                  </Text>
                </View>
              )
            ) : (
              // Photo Preview
              imageError ? (
                <View style={styles.placeholderContainer}>
                  <Text style={styles.placeholderIcon}>📸</Text>
                  <Text style={styles.placeholderText}>Photo Preview</Text>
                  <Text style={styles.placeholderSubtext}>Unable to load photo</Text>
                </View>
              ) : (
                <Image 
                  source={{ uri: photoUri }} 
                  style={styles.photoPreview} 
                  resizeMode="cover"
                  onError={() => setImageError(true)}
                />
              )
            )}
            
            {/* Top right controls */}
            <View style={styles.topRightControls}>
              {/* App Gallery Button - Only show for videos */}
              {mediaType === 'video' && (
                <TouchableOpacity
                  style={styles.galleryButton}
                  onPress={() => setShowAppGallery(true)}
                >
                  <Text style={styles.galleryButtonText}>📱 Gallery</Text>
                </TouchableOpacity>
              )}
              
              {/* AI Assistant Button */}
              <TouchableOpacity
                style={styles.aiAssistantButton}
                onPress={() => setShowAIAssistant(true)}
              >
                <Text style={styles.aiAssistantButtonText}>🤖 AI</Text>
              </TouchableOpacity>
              
              {/* AI Overlay Button */}
              <TouchableOpacity
                style={styles.aiOverlayButton}
                onPress={() => setShowAIOverlayModal(true)}
              >
                <Text style={styles.aiOverlayButtonText}>✨ AI Sticker</Text>
              </TouchableOpacity>
              
              {/* Filter buttons */}
              <TouchableOpacity
                style={[styles.filterButton, videoFilter === 'Vintage' && styles.activeFilterButton]}
                onPress={() => applyVideoFilter('Vintage')}
              >
                <Text style={[styles.filterButtonText, videoFilter === 'Vintage' && styles.activeFilterText]}>Vintage</Text>
              </TouchableOpacity>
            </View>

            {/* Caption Input Overlay */}
            <View style={styles.captionOverlay}>
              <TextInput
                style={styles.captionInput}
                placeholder="Add a caption..."
                placeholderTextColor="rgba(255,255,255,0.6)"
                value={caption}
                onChangeText={setCaption}
                multiline
                maxLength={100}
                returnKeyType="done"
                blurOnSubmit={true}
              />
            </View>

            {/* Temp Video Actions - Only show for temp videos */}
            {isTempVideo && mediaType === 'video' && (
              <View style={styles.tempVideoActions}>
                <TouchableOpacity style={styles.saveButton} onPress={saveToGallery}>
                  <Text style={styles.saveButtonText}>📱 Save to Gallery</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.deleteButton} 
                  onPress={() => {
                    Alert.alert(
                      'Delete Video?',
                      'This will permanently delete the temporary video.',
                      [
                        { text: 'Cancel', style: 'cancel' },
                        { 
                          text: 'Delete', 
                          style: 'destructive',
                          onPress: async () => {
                            await deleteTempVideo();
                            navigation.goBack();
                          }
                        }
                      ]
                    );
                  }}
                >
                  <Text style={styles.deleteButtonText}>🗑️ Delete</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* AI Overlays */}
            {aiOverlays.map((overlay) => (
              <InteractiveAISticker
                key={overlay.id}
                overlay={overlay}
                onUpdate={updateOverlay}
                onDelete={deleteOverlay}
                onDragStart={() => {
                  setShowTrashCan(true);
                  setIsDragging(true);
                  setIsOverTrash(false);
                }}
                onDragMove={(isOverTrashNow) => {
                  setIsOverTrash(isOverTrashNow);
                }}
                onDragEnd={(isOverTrashFinal) => {
                  setShowTrashCan(false);
                  setIsDragging(false);
                  setIsOverTrash(false);
                  console.log('🗑️ Drag ended, isOverTrash:', isOverTrashFinal);
                  // Deletion is handled in the InteractiveAISticker component
                }}
              />
            ))}

            {/* Trash Can - appears when dragging */}
            <TrashCan 
              isVisible={showTrashCan} 
              isActive={isOverTrash}
            />

            {/* Clear All Overlays Button */}
            {aiOverlays.length > 0 && (
              <TouchableOpacity style={styles.clearOverlaysButton} onPress={clearAllOverlays}>
                <Text style={styles.clearOverlaysText}>🗑️ Clear All ({aiOverlays.length})</Text>
              </TouchableOpacity>
            )}

            {/* Next Arrow Button */}
            <TouchableOpacity style={styles.nextButton} onPress={navigateToShare}>
              <Text style={styles.nextButtonText}>→</Text>
            </TouchableOpacity>
          </View>

          {/* Searching for video overlay */}
          {isSearchingForVideo && (
            <View style={styles.searchingOverlay}>
              <View style={styles.searchingContainer}>
                <ActivityIndicator size="large" color="#FFD700" />
                <Text style={styles.searchingText}>Looking for your video...</Text>
                <TouchableOpacity 
                  style={styles.findVideoButton}
                  onPress={findMyVideo}
                >
                  <Text style={styles.findVideoButtonText}>Find My Video</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.findVideoButton, { backgroundColor: '#666' }]}
                  onPress={async () => {
                    try {
                      const allVideos = await MediaLibrary.getAssetsAsync({
                        mediaType: 'video',
                        sortBy: 'creationTime',
                        first: 20,
                      });
                      
                      const videoList = allVideos.assets.map((video, index) => {
                        const timeAgo = Date.now() - video.creationTime;
                        const timeText = timeAgo < 60000 ? `${Math.floor(timeAgo/1000)}s` : `${Math.floor(timeAgo/60000)}m`;
                        return `${index + 1}. ${video.filename} (${timeText} ago)`;
                      }).join('\n');
                      
                      Alert.alert(
                        'All Videos Debug',
                        `Found ${allVideos.assets.length} videos:\n\n${videoList}`,
                        [{ text: 'OK' }]
                      );
                    } catch (error) {
                      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                      Alert.alert('Debug Error', errorMessage);
                    }
                  }}
                >
                  <Text style={styles.findVideoButtonText}>Show All Videos</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      </TouchableWithoutFeedback>

      {/* Modals outside TouchableWithoutFeedback for proper scrolling */}
      
      {/* AI Assistant Modal */}
      <AIAssistant
        visible={showAIAssistant}
        onClose={() => setShowAIAssistant(false)}
        contentUri={actualVideoUri || photoUri}
        contentType={mediaType}
        onCaptionGenerated={handleAICaptionGenerated}
        onTagsGenerated={handleAITagsGenerated}
      />

      {/* AI Overlay Modal */}
      <Modal
        visible={showAIOverlayModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowAIOverlayModal(false)}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <ScrollView 
            contentContainerStyle={styles.aiModalScrollContainer}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.aiModalContent}>
              <View style={styles.aiModalHeader}>
                <Text style={styles.aiModalTitle}>✨ AI Sticker Generator</Text>
                <TouchableOpacity 
                  style={styles.aiModalCloseButton}
                  onPress={() => setShowAIOverlayModal(false)}
                >
                  <Text style={styles.aiModalCloseText}>✕</Text>
                </TouchableOpacity>
              </View>
              
              <Text style={styles.aiModalDescription}>
                Describe what you want to add to your photo and AI will generate it!
              </Text>

              {/* AI Model Selection */}
              <View style={styles.modelSectionContainer}>
                <Text style={styles.modelSectionTitle}>🤖 AI Model</Text>
                <TouchableOpacity 
                  style={styles.selectedModelButton}
                  onPress={() => setShowModelSelector(!showModelSelector)}
                >
                  <View style={styles.selectedModelInfo}>
                    <Text style={styles.selectedModelName}>{AI_MODELS[selectedAIModel].name}</Text>
                    <Text style={styles.selectedModelDesc}>{AI_MODELS[selectedAIModel].description}</Text>
                  </View>
                  <Text style={styles.modelDropdownIcon}>
                    {showModelSelector ? '▲' : '▼'}
                  </Text>
                </TouchableOpacity>

                {showModelSelector && (
                  <View style={styles.modelOptionsContainer}>
                    {(Object.keys(AI_MODELS) as AIModel[]).map((modelKey) => (
                      <TouchableOpacity
                        key={modelKey}
                        style={[
                          styles.modelOption,
                          selectedAIModel === modelKey && styles.modelOptionSelected
                        ]}
                        onPress={() => {
                          setSelectedAIModel(modelKey);
                          setShowModelSelector(false);
                        }}
                      >
                        <View style={styles.modelOptionInfo}>
                          <Text style={[
                            styles.modelOptionName,
                            selectedAIModel === modelKey && styles.modelOptionNameSelected
                          ]}>
                            {AI_MODELS[modelKey].name}
                          </Text>
                          <Text style={styles.modelOptionDesc}>
                            {AI_MODELS[modelKey].description}
                          </Text>
                          <View style={styles.modelStrengths}>
                            {AI_MODELS[modelKey].strengths.map((strength, index) => (
                              <Text key={index} style={styles.strengthTag}>
                                {strength}
                              </Text>
                            ))}
                          </View>
                        </View>
                        {selectedAIModel === modelKey && (
                          <Text style={styles.selectedIndicator}>✓</Text>
                        )}
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>
              
              <TextInput
                style={styles.aiModalInput}
                placeholder="e.g., small cute dinosaur, rainbow, unicorn..."
                placeholderTextColor="#9E9E9E"
                value={overlayPrompt}
                onChangeText={setOverlayPrompt}
                multiline
                maxLength={200}
                returnKeyType="done"
                blurOnSubmit={true}
              />
              
              <View style={styles.characterCount}>
                <Text style={styles.characterCountText}>
                  {overlayPrompt.length}/200 characters
                </Text>
              </View>
              
              <View style={styles.aiModalButtons}>
                <TouchableOpacity 
                  style={styles.aiModalCancelButton}
                  onPress={() => setShowAIOverlayModal(false)}
                >
                  <Text style={styles.aiModalCancelText}>Cancel</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[
                    styles.aiModalGenerateButton,
                    (!overlayPrompt.trim() || isGeneratingOverlay) && styles.aiModalGenerateButtonDisabled
                  ]}
                  onPress={generateAIOverlay}
                  disabled={!overlayPrompt.trim() || isGeneratingOverlay}
                >
                  <Text style={styles.aiModalGenerateText}>
                    {isGeneratingOverlay ? 'Generating...' : `Generate with ${AI_MODELS[selectedAIModel].name}`}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </TouchableWithoutFeedback>
      </Modal>

      {/* App Video Gallery Modal */}
      {/* <AppVideoGallery
        visible={showAppGallery}
        onClose={() => setShowAppGallery(false)}
        onVideoSelect={handleVideoSelect}
      /> */}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0D0D0F',
  },
  mainContent: {
    flex: 1,
    backgroundColor: '#000000',
    position: 'relative',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 15,
    backgroundColor: '#161618',
    borderBottomWidth: 1,
    borderBottomColor: '#424242',
  },
  backButton: {
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  headerRight: {
    width: 30,
  },
  photoContainer: {
    flex: 1,
    backgroundColor: '#000000',
    position: 'relative',
  },
  photoPreview: {
    width: '100%',
    height: '100%',
  },
  videoPreview: {
    width: '100%',
    height: '100%',
  },
  videoContainer: {
    flex: 1,
    position: 'relative',
  },
  videoLoadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  loadingText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
  },
  placeholderContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1a1a1a',
  },
  placeholderIcon: {
    fontSize: 60,
    marginBottom: 16,
  },
  placeholderText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  placeholderSubtext: {
    color: '#9E9E9E',
    fontSize: 14,
    textAlign: 'center',
    paddingHorizontal: 20,
    lineHeight: 20,
  },
  captionOverlay: {
    position: 'absolute',
    bottom: 30,
    left: 20,
    right: 110,
  },
  captionInput: {
    backgroundColor: 'rgba(0,0,0,0.6)',
    color: '#FFFFFF',
    fontSize: 16,
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderRadius: 20,
    minHeight: 45,
    textAlignVertical: 'center',
  },
  nextButton: {
    position: 'absolute',
    bottom: 35,
    right: 30,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FFDD3A',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  nextButtonText: {
    fontSize: 24,
    color: '#0D0D0F',
    fontWeight: 'bold',
  },
  
  // Video Controls Styles
  videoTouchArea: {
    flex: 1,
    position: 'relative',
  },
  videoControlsOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
    padding: 20,
  },
  playPauseButton: {
    alignSelf: 'center',
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 15,
  },
  playPauseText: {
    fontSize: 24,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  timeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '500',
    minWidth: 35,
  },
  progressBar: {
    flex: 1,
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 2,
    position: 'relative',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#FFDD3A',
    borderRadius: 2,
  },
  progressThumb: {
    position: 'absolute',
    top: -6,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#FFDD3A',
    marginLeft: -8,
  },
  
  // Video Editing Panel Styles
  videoEditingPanel: {
    position: 'absolute',
    top: 80,
    right: 15,
    flexDirection: 'column',
    alignItems: 'center',
    gap: 12,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 15,
    paddingVertical: 15,
    paddingHorizontal: 8,
    maxHeight: '60%',
  },
  editButton: {
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    minWidth: 55,
    minHeight: 55,
    justifyContent: 'center',
  },
  editButtonActive: {
    backgroundColor: '#FFDD3A',
  },
  editButtonText: {
    fontSize: 16,
    marginBottom: 2,
  },
  editButtonLabel: {
    color: '#FFFFFF',
    fontSize: 8,
    fontWeight: '500',
    textAlign: 'center',
  },
  editButtonLabelActive: {
    color: '#0D0D0F',
  },

  // Action buttons for video processing states
  retryButton: {
    backgroundColor: '#FF6B6B',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    marginTop: 20,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },

  // Temp video action buttons
  tempVideoActions: {
    position: 'absolute',
    bottom: 100,
    left: 20,
    right: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 15,
  },
  saveButton: {
    flex: 1,
    backgroundColor: '#4CAF50',
    paddingVertical: 12,
    borderRadius: 25,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  deleteButton: {
    flex: 1,
    backgroundColor: '#FF6B6B',
    paddingVertical: 12,
    borderRadius: 25,
    alignItems: 'center',
  },
  deleteButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },

  // Mock video controls for demo mode
  mockVideoControls: {
    alignItems: 'center',
    marginTop: 20,
    gap: 10,
  },
  demoText: {
    color: '#9E9E9E',
    fontSize: 14,
    textAlign: 'center',
  },

  // New styles for the "Find My Video" button
  findVideoButton: {
    backgroundColor: '#FFD700',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    marginTop: 10,
  },
  findVideoButtonText: {
    color: '#000000',
    fontSize: 16,
    fontWeight: 'bold',
  },

  // Searching overlay styles
  searchingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchingContainer: {
    backgroundColor: '#1a1a1a',
    padding: 20,
    borderRadius: 10,
    alignItems: 'center',
  },
  searchingText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 20,
  },

  // Top right controls styles
  topRightControls: {
    position: 'absolute',
    top: 10,
    right: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  aiAssistantButton: {
    backgroundColor: '#FFD700',
    padding: 10,
    borderRadius: 20,
  },
  aiAssistantButtonText: {
    color: '#000000',
    fontSize: 16,
    fontWeight: 'bold',
  },
  filterButton: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    padding: 10,
    borderRadius: 20,
  },
  activeFilterButton: {
    backgroundColor: '#FFDD3A',
  },
  filterButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
  },
  activeFilterText: {
    color: '#0D0D0F',
  },

  // Gallery button styles
  galleryButton: {
    backgroundColor: '#4CAF50',
    padding: 10,
    borderRadius: 20,
  },
  galleryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },

  // AI Overlay button styles
  aiOverlayButton: {
    backgroundColor: '#FF6B6B',
    padding: 10,
    borderRadius: 20,
  },
  aiOverlayButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },

  // AI Modal styles
  aiModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  aiModalScrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100%',
  },
  aiModalContent: {
    backgroundColor: '#1a1a1a',
    borderRadius: 20,
    padding: 20,
    width: '100%',
    maxWidth: 400,
  },
  aiModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  aiModalTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
  },
  aiModalCloseButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  aiModalCloseText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  aiModalDescription: {
    color: '#9E9E9E',
    fontSize: 16,
    marginBottom: 20,
    lineHeight: 22,
  },
  aiModalInput: {
    backgroundColor: '#2a2a2a',
    color: '#FFFFFF',
    fontSize: 16,
    padding: 15,
    borderRadius: 10,
    minHeight: 80,
    textAlignVertical: 'top',
    marginBottom: 20,
  },
  aiModalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 15,
  },
  aiModalCancelButton: {
    flex: 1,
    backgroundColor: '#424242',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  aiModalCancelText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  aiModalGenerateButton: {
    flex: 1,
    backgroundColor: '#FFD700',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  aiModalGenerateButtonDisabled: {
    backgroundColor: '#666666',
  },
  aiModalGenerateText: {
    color: '#000000',
    fontSize: 16,
    fontWeight: 'bold',
  },

  // AI Overlay styles
  aiOverlay: {
    position: 'absolute',
    width: 100,
    height: 100,
    backgroundColor: 'transparent',
  },
  aiOverlayImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
    backgroundColor: 'transparent',
  },
  stickerContainer: {
    width: '100%',
    height: '100%',
    position: 'relative',
    backgroundColor: 'transparent',
  },
  deleteStickerButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FF4444',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  deleteStickerText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  
  // Trash Can styles
  trashCan: {
    position: 'absolute',
    bottom: 150,
    left: width / 2 - 50,
    width: 100,
    height: 80,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    borderStyle: 'dashed',
  },
  trashCanIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  trashCanText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  aiOverlayControls: {
    position: 'absolute',
    top: -10,
    right: -10,
    flexDirection: 'row',
    gap: 5,
  },
  aiOverlayDeleteButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 0, 0, 0.8)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  aiOverlayDeleteText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  aiOverlayResizeButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(0, 150, 255, 0.8)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  aiOverlayResizeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  clearOverlaysButton: {
    position: 'absolute',
    top: 60,
    left: 10,
    backgroundColor: 'rgba(255, 0, 0, 0.8)',
    padding: 8,
    borderRadius: 15,
  },
  clearOverlaysText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },

  // AI Model Selection styles
  modelSectionContainer: {
    marginBottom: 20,
  },
  modelSectionTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  selectedModelButton: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    padding: 10,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  selectedModelInfo: {
    flexDirection: 'column',
  },
  selectedModelName: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  selectedModelDesc: {
    color: '#9E9E9E',
    fontSize: 12,
  },
  modelDropdownIcon: {
    color: '#FFFFFF',
    fontSize: 12,
  },
  modelOptionsContainer: {
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 10,
    padding: 10,
  },
  modelOption: {
    padding: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  modelOptionSelected: {
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  modelOptionInfo: {
    flexDirection: 'column',
  },
  modelOptionName: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  modelOptionNameSelected: {
    color: '#FFDD3A',
  },
  modelOptionDesc: {
    color: '#9E9E9E',
    fontSize: 12,
  },
  modelStrengths: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 5,
    gap: 5,
  },
  strengthTag: {
    backgroundColor: 'rgba(255,221,58,0.2)',
    color: '#FFDD3A',
    fontSize: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    overflow: 'hidden',
  },
  selectedIndicator: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  characterCount: {
    alignItems: 'flex-end',
    marginTop: 10,
  },
  characterCountText: {
    color: '#FFFFFF',
    fontSize: 12,
  },

});