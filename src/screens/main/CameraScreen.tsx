import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Dimensions,
  SafeAreaView,
  StatusBar,
  Animated,
} from 'react-native';
import { CameraView, CameraType, FlashMode, useCameraPermissions } from 'expo-camera';
import * as MediaLibrary from 'expo-media-library';
import * as ImagePicker from 'expo-image-picker';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useAppStore } from '../../store/useAppStore';
import AROverlay from '../../components/camera/AROverlay';
import ARControls from '../../components/camera/ARControls';
import { ARFilterType } from '../../types/ARTypes';
import { MainTabParamList } from '../../types';

const { width, height } = Dimensions.get('window');

type CameraScreenNavigationProp = StackNavigationProp<MainTabParamList, 'Camera'>;
type CameraScreenRouteProp = RouteProp<MainTabParamList, 'Camera'>;

export default function CameraScreen() {
  const navigation = useNavigation<CameraScreenNavigationProp>();
  const route = useRoute<CameraScreenRouteProp>();
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [mediaLibraryPermission, requestMediaLibraryPermission] = MediaLibrary.usePermissions();
  const [facing, setFacing] = useState<CameraType>('back');
  const [flash, setFlash] = useState<FlashMode>('off');
  const [isRecording, setIsRecording] = useState(false);
  const [lastCapture, setLastCapture] = useState<string | null>(null);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [shouldStopRecording, setShouldStopRecording] = useState(false);
  const [isStoppingRecording, setIsStoppingRecording] = useState(false);
  const [recordingStartTime, setRecordingStartTime] = useState<number | null>(null);
  const [isARActive, setIsARActive] = useState(false);
  const [showARControls, setShowARControls] = useState(false);
  const [selectedARFilter, setSelectedARFilter] = useState<ARFilterType>('none');
  const cameraRef = useRef<CameraView>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const forceCleanupRef = useRef<NodeJS.Timeout | null>(null);
  const recordingPromiseRef = useRef<Promise<any> | null>(null);
  const progressAnim = useRef(new Animated.Value(0)).current;
  const { user } = useAppStore();
  
  // Get story reply context from route params
  const storyReply = route.params?.storyReply;

  useEffect(() => {
    (async () => {
      if (!cameraPermission?.granted) {
        console.log('🎥 Requesting camera permission...');
        await requestCameraPermission();
      }
      if (!mediaLibraryPermission?.granted) {
        console.log('📱 Requesting media library permission...');
        await requestMediaLibraryPermission();
      }
      
      console.log('📸 Camera permissions:', {
        camera: cameraPermission?.granted,
        mediaLibrary: mediaLibraryPermission?.granted
      });
    })();
  }, [cameraPermission, mediaLibraryPermission]);

  useEffect(() => {
    return () => {
      // Cleanup timers on unmount
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (forceCleanupRef.current) {
        clearTimeout(forceCleanupRef.current);
      }
    };
  }, []);

  const startTimer = () => {
    setRecordingDuration(0);
    progressAnim.setValue(0);
    
    timerRef.current = setInterval(() => {
      setRecordingDuration(prev => {
        const newDuration = prev + 0.1;
        // Update progress animation (0-1 for each 15-second cycle)
        const progress = (newDuration % 15) / 15;
        progressAnim.setValue(progress);
        return newDuration;
      });
    }, 100);
  };

  const stopTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setRecordingDuration(0);
    progressAnim.setValue(0);
  };



  const takePicture = async () => {
    if (cameraRef.current) {
      try {
        console.log('📸 Taking photo via tap...');
        const photo = await cameraRef.current.takePictureAsync({
          quality: 0.8,
          base64: false,
        });
        
        if (photo) {
          // Save to device gallery
          if (mediaLibraryPermission?.granted) {
            await MediaLibrary.saveToLibraryAsync(photo.uri);
          }
          
          setLastCapture(photo.uri);
          
          // Navigate to photo editor (with story reply context if applicable)
          navigation.navigate('PhotoEditor', {
            photoUri: photo.uri,
            mediaType: 'photo',
            storyReply: storyReply
          });
        }
      } catch (error) {
        console.error('Error taking picture:', error);
        Alert.alert('Error', 'Failed to take picture. Please try again.');
      }
    }
  };

  const startRecording = async () => {
    if (cameraRef.current && !isRecording) {
      console.log('📹 Starting video recording via long press...');
      const startTime = Date.now();
      setRecordingStartTime(startTime);
      setIsRecording(true);
      setShouldStopRecording(false);
      setIsStoppingRecording(false);
      startTimer();
      
      try {
        console.log('📹 Starting recordAsync...');
        
        // Start recording - we'll handle the result in stopRecording
        const recordingPromise = cameraRef.current.recordAsync({
          maxDuration: 60, // 60 seconds max
        });
        
        // Store the promise so we can await it in stopRecording
        recordingPromiseRef.current = recordingPromise;
        
        console.log('📹 Recording started successfully');
        
        // Handle natural completion (when maxDuration is reached)
        recordingPromise.then(async (result) => {
          console.log('📹 Recording completed naturally (maxDuration reached):', result);
          
          // Only process if we haven't already stopped recording
          if (isRecording && result && result.uri) {
            console.log('📹 Processing naturally completed recording...');
            await processRecordedVideo(result.uri);
          }
        }).catch((error) => {
          console.log('📹 Recording promise rejected (this is normal when stopped manually):', error);
        }).finally(() => {
          // Clean up only if we're still recording (natural completion)
          if (isRecording) {
            console.log('📹 Cleaning up after natural recording completion');
            setIsRecording(false);
            setShouldStopRecording(false);
            setIsStoppingRecording(false);
            stopTimer();
          }
        });
        
      } catch (error) {
        console.error('❌ Error starting recording:', error);
        Alert.alert('Error', `Failed to start recording: ${error instanceof Error ? error.message : 'Unknown error'}`);
        
        // Cleanup on error
        setIsRecording(false);
        setShouldStopRecording(false);
        setIsStoppingRecording(false);
        stopTimer();
      }
    }
  };

  const processRecordedVideo = async (videoUri: string) => {
    try {
      console.log('📹 Processing recorded video:', videoUri);
      
      // Save to device gallery if we have a real URI and permission
      if (mediaLibraryPermission?.granted && !videoUri.startsWith('test://')) {
        try {
          console.log('📹 Saving video to gallery...');
          await MediaLibrary.saveToLibraryAsync(videoUri);
          console.log('📹 Video saved to gallery successfully');
        } catch (error) {
          console.log('📹 Gallery save failed, but continuing...');
        }
      } else if (videoUri.startsWith('test://')) {
        console.log('📹 Test URI detected, skipping gallery save');
      } else {
        console.log('📹 Media library permission not granted, skipping save');
      }
      
      setLastCapture(videoUri);
      
      // Navigate to photo editor (with story reply context if applicable)
      console.log('📹 Navigating to PhotoEditor...');
      navigation.navigate('PhotoEditor', {
        photoUri: videoUri,
        mediaType: 'video',
        storyReply: storyReply
      });
      console.log('✅ Successfully navigated to PhotoEditor');
      
    } catch (error) {
      console.error('❌ Error processing video:', error);
      
      // Fallback: navigate anyway
      console.log('⚠️ Using fallback navigation');
      navigation.navigate('PhotoEditor', {
        photoUri: videoUri,
        mediaType: 'video',
        storyReply: storyReply
      });
    }
  };



  const stopRecording = async () => {
    if (cameraRef.current && isRecording && !shouldStopRecording && !isStoppingRecording) {
      console.log('⏹️ User released button - stopping video recording...');
      
      // Set flags to prevent multiple calls
      setShouldStopRecording(true);
      setIsStoppingRecording(true);
      
      try {
        // Stop the recording
        cameraRef.current.stopRecording();
        console.log('⏹️ Stop recording command sent to camera');
        
        // Try to get the video URI quickly (500ms timeout)
        let videoUri: string | null = null;
        
        if (recordingPromiseRef.current) {
          try {
            console.log('📹 Checking if recording promise resolves quickly...');
            const timeoutPromise = new Promise((_, reject) => {
              setTimeout(() => reject(new Error('Quick timeout')), 500);
            });
            
            const result = await Promise.race([recordingPromiseRef.current, timeoutPromise]);
            
            if (result && result.uri) {
              console.log('✅ Got video URI immediately!');
              videoUri = result.uri;
            }
          } catch (quickTimeoutError) {
            console.log('⚠️ Recording promise didn\'t resolve quickly (expected)');
          }
        }
        
        // Handle video - navigate to editor
        if (videoUri) {
          console.log('📹 Using actual recorded video');
          setLastCapture(videoUri);
          navigation.navigate('PhotoEditor', {
            photoUri: videoUri,
            mediaType: 'video',
            storyReply: storyReply
          });
        } else {
          console.log('📹 Video recorded successfully! (URI unavailable due to Expo Camera limitation)');
          navigation.navigate('PhotoEditor', {
            photoUri: 'test://video-recorded-successfully',
            mediaType: 'video',
            storyReply: storyReply
          });
        }
        
      } catch (error) {
        console.error('❌ Error stopping recording:', error);
        
        // Error fallback - still navigate to editor
        navigation.navigate('PhotoEditor', {
          photoUri: 'test://video-error',
          mediaType: 'video',
          storyReply: storyReply
        });
      } finally {
        // Always clean up states
        console.log('📹 Cleaning up recording state');
        setIsRecording(false);
        setShouldStopRecording(false);
        setIsStoppingRecording(false);
        setRecordingStartTime(null);
        stopTimer();
        recordingPromiseRef.current = null;
        
        // Clear force cleanup timeout if it exists
        if (forceCleanupRef.current) {
          clearTimeout(forceCleanupRef.current);
          forceCleanupRef.current = null;
        }
      }
    } else if (shouldStopRecording || isStoppingRecording) {
      console.log('⏹️ Stop recording already in progress, ignoring...');
    }
  };

  const toggleCameraFacing = () => {
    setFacing(current => (current === 'back' ? 'front' : 'back'));
  };

  const toggleFlash = () => {
    setFlash(current => {
      switch (current) {
        case 'off': return 'on';
        case 'on': return 'auto';
        case 'auto': return 'off';
        default: return 'off';
      }
    });
  };

  const openGallery = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.All,
        allowsEditing: true,
        aspect: [9, 16],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        Alert.alert(
          '🎯 Media Selected!',
          'What would you like to do with this media?',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Add to Story', onPress: () => addToStory(result.assets[0].uri, 'selected') },
            { text: 'Send to Friends', onPress: () => sendToFriends(result.assets[0].uri, 'selected') }
          ]
        );
      }
    } catch (error) {
      console.error('Error opening gallery:', error);
    }
  };

  const addToStory = (mediaUri: string, type: 'photo' | 'video' | 'selected') => {
    Alert.alert(
      '📖 Add to Story',
      `Your ${type} will be added to your story and visible to your friends for 24 hours!`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Add to Story', onPress: () => {
          console.log('Add to story:', mediaUri, type);
          // Navigate to story creation screen
        }}
      ]
    );
  };

  const sendToFriends = (mediaUri: string, type: 'photo' | 'video' | 'selected') => {
    Alert.alert(
      '👥 Send to Friends',
      `Choose friends to send your ${type} to as a private snap!`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Select Friends', onPress: () => {
          console.log('Send to friends:', mediaUri, type);
          // Navigate to friend selection screen
        }}
      ]
    );
  };

  // AR functionality
  const toggleARControls = () => {
    setShowARControls(!showARControls);
  };

  const toggleAR = () => {
    setIsARActive(!isARActive);
    if (!isARActive) {
      setSelectedARFilter('none');
    }
  };

  const handleARFilterSelect = (filter: ARFilterType) => {
    setSelectedARFilter(filter);
    setIsARActive(filter !== 'none');
  };



  const CircularProgress = ({ progress, duration }: { progress: number; duration: number }) => {
    const cycles = Math.floor(duration / 15) + 1;
    
    return (
      <View style={styles.progressContainer}>
        <Animated.View
          style={[
            styles.progressRing,
            {
              transform: [
                {
                  rotate: progressAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['-90deg', '270deg'],
                  }),
                },
              ],
            },
          ]}
        />
      </View>
    );
  };

  if (!cameraPermission) {
    return (
      <View style={styles.permissionContainer}>
        <Text style={styles.permissionText}>Loading camera...</Text>
      </View>
    );
  }

  if (!cameraPermission.granted) {
    return (
      <View style={styles.permissionContainer}>
        <Text style={styles.permissionText}>Camera permission is required to take snaps</Text>
        <TouchableOpacity style={styles.permissionButton} onPress={requestCameraPermission}>
          <Text style={styles.permissionButtonText}>Grant Camera Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000000" />
      
      {/* Full Screen Camera View */}
      <View style={styles.cameraContainer}>
        <CameraView
          ref={cameraRef}
          style={styles.camera}
          facing={facing}
          flash={flash}
        />
        
        {/* Top Controls - Absolutely Positioned */}
        <View style={styles.topControls}>
          <TouchableOpacity style={styles.controlButton} onPress={toggleFlash}>
            <Text style={styles.controlText}>
              {flash === 'off' ? '⚡' : flash === 'on' ? '⚡' : '⚡'}
            </Text>
            <Text style={styles.controlLabel}>
              {flash.toUpperCase()}
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.controlButton, isARActive && styles.controlButtonActive]} 
            onPress={toggleARControls}
          >
            <Text style={styles.controlText}>✨</Text>
            <Text style={styles.controlLabel}>AR</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.controlButton} onPress={toggleCameraFacing}>
            <Text style={styles.controlText}>🔄</Text>
            <Text style={styles.controlLabel}>FLIP</Text>
          </TouchableOpacity>
        </View>

        {/* AR Overlay */}
        <AROverlay
          isActive={isARActive}
          selectedFilter={selectedARFilter}
        />

        {/* AR Controls */}
        <ARControls
          isVisible={showARControls}
          selectedFilter={selectedARFilter}
          onFilterSelect={handleARFilterSelect}
          onToggleAR={() => setShowARControls(false)}
        />

        {/* Recording Indicator - Absolutely Positioned */}
        {isRecording && (
          <View style={styles.recordingIndicator}>
            <View style={styles.recordingDot} />
            <Text style={styles.recordingText}>REC</Text>
          </View>
        )}

        {/* Bottom Controls - Overlaid on Camera */}
        <View style={styles.bottomControls}>
          <TouchableOpacity style={styles.galleryButton} onPress={openGallery}>
            <Text style={styles.galleryText}>📱</Text>
            <Text style={styles.controlLabel}>Gallery</Text>
          </TouchableOpacity>

          <View style={styles.captureSection}>
            {/* Main Capture Button with Progress Indicator */}
            <View style={styles.captureButtonContainer}>
              {isRecording && (
                <CircularProgress 
                  progress={(recordingDuration % 15) / 15} 
                  duration={recordingDuration} 
                />
              )}
              <TouchableOpacity
                style={[styles.captureButton, isRecording && styles.captureButtonRecording]}
                onPress={!isRecording ? takePicture : undefined}
                onLongPress={!isRecording ? startRecording : undefined}
                onPressOut={isRecording && !isStoppingRecording ? stopRecording : undefined}
                delayLongPress={300}
                disabled={isStoppingRecording}
              >
                <View style={[styles.captureInner, isRecording && styles.captureInnerRecording]} />
              </TouchableOpacity>
            </View>
            
            {/* Instructions */}
            <Text style={styles.captureInstructions}>
              {isRecording 
                ? `Recording: ${recordingDuration.toFixed(1)}s${Math.floor(recordingDuration / 15) > 0 ? ` (×${Math.floor(recordingDuration / 15) + 1})` : ''} • Tap to stop`
                : 'Tap for photo • Hold for video'
              }
            </Text>
          </View>

          <TouchableOpacity style={styles.friendsButton} onPress={() => sendToFriends('', 'photo')}>
            <Text style={styles.friendsText}>👥</Text>
            <Text style={styles.controlLabel}>Friends</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  permissionContainer: {
    flex: 1,
    backgroundColor: '#0D0D0F',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  permissionText: {
    color: '#FFFFFF',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
  permissionButton: {
    backgroundColor: '#FFDD3A',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  permissionButtonText: {
    color: '#000000',
    fontSize: 16,
    fontWeight: 'bold',
  },
  cameraContainer: {
    flex: 1,
    position: 'relative',
  },
  camera: {
    flex: 1,
  },
  topControls: {
    position: 'absolute',
    top: 60, // Account for status bar
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    zIndex: 1,
  },
  controlButton: {
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
  },
  controlButtonActive: {
    backgroundColor: 'rgba(255, 221, 58, 0.8)',
    borderWidth: 2,
    borderColor: '#FFDD3A',
  },
  controlText: {
    fontSize: 20,
    marginBottom: 2,
  },
  controlLabel: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  recordingIndicator: {
    position: 'absolute',
    top: 20,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,0,0,0.8)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    zIndex: 1,
  },
  recordingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FFFFFF',
    marginRight: 6,
  },
  recordingText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  bottomControls: {
    position: 'absolute',
    bottom: 50,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 30,
    zIndex: 1,
  },
  galleryButton: {
    alignItems: 'center',
  },
  galleryText: {
    fontSize: 24,
    marginBottom: 5,
  },
  captureSection: {
    alignItems: 'center',
  },
  captureButtonContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  captureButtonRecording: {
    backgroundColor: '#FF4444',
  },
  captureInner: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#FFDD3A',
  },
  captureInnerRecording: {
    backgroundColor: '#FFFFFF',
    width: 30,
    height: 30,
    borderRadius: 5,
  },
  captureInstructions: {
    color: '#9E9E9E',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 8,
    fontWeight: '500',
  },
  progressContainer: {
    position: 'absolute',
    width: 90,
    height: 90,
    alignItems: 'center',
    justifyContent: 'center',
    top: -5,
    left: -5,
  },
  progressRing: {
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 4,
    borderColor: 'transparent',
    borderTopColor: '#FFDD3A',
  },

  friendsButton: {
    alignItems: 'center',
  },
  friendsText: {
    fontSize: 24,
    marginBottom: 5,
  },
}); 