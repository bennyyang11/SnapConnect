import React, { useState } from 'react';
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
} from 'react-native';
import { Video, ResizeMode } from 'expo-av';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { MainTabParamList } from '../../types';

const { width, height } = Dimensions.get('window');

type PhotoEditorScreenNavigationProp = StackNavigationProp<MainTabParamList, 'PhotoEditor'>;
type PhotoEditorScreenRouteProp = RouteProp<MainTabParamList, 'PhotoEditor'>;



export default function PhotoEditorScreen() {
  const navigation = useNavigation<PhotoEditorScreenNavigationProp>();
  const route = useRoute<PhotoEditorScreenRouteProp>();
  const { photoUri, mediaType, storyReply } = route.params;

  const [caption, setCaption] = useState('');
  const [imageError, setImageError] = useState(false);
  const [videoError, setVideoError] = useState(false);

  // Check if this is a test/invalid URI
  const isTestUri = photoUri?.startsWith('test://') || !photoUri;
  
  // Don't use demo video - if we don't have the actual video, show an error
  const actualUri = photoUri;
  
  // Get specific test URI type for better messaging
  const getTestUriType = () => {
    if (photoUri === 'test://video-recorded-successfully') return 'recorded-successfully';
    if (photoUri === 'test://video-error') return 'error';
    if (photoUri?.startsWith('test://')) return 'generic';
    return null;
  };
  
  const testUriType = getTestUriType();

  const navigateToShare = () => {
    navigation.navigate('ShareScreen', {
      photoUri,
      mediaType,
      caption,
      storyReply,
    });
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backText}>✕</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Edit Photo</Text>
          <View style={styles.headerRight} />
        </View>

        {/* Full Screen Media Preview */}
        <View style={styles.photoContainer}>
          {mediaType === 'video' ? (
            // Video Preview
            isTestUri || videoError || !actualUri ? (
              <View style={styles.placeholderContainer}>
                <Text style={styles.placeholderIcon}>🎥</Text>
                <Text style={styles.placeholderText}>
                  {testUriType === 'recorded-successfully'
                    ? 'Video Recording Complete!'
                    : testUriType === 'error'
                    ? 'Video Recording Error'
                    : 'Video Preview Unavailable'
                  }
                </Text>
                <Text style={styles.placeholderSubtext}>
                  {testUriType === 'recorded-successfully' 
                    ? 'Your video was recorded successfully but cannot be previewed due to system limitations.' 
                    : testUriType === 'error'
                    ? 'There was an error with video recording. Please try again.'
                    : 'Unable to load video preview. The video was recorded successfully.'
                  }
                </Text>
              </View>
            ) : (
              <Video
                source={{ uri: actualUri }}
                style={styles.videoPreview}
                useNativeControls
                resizeMode={ResizeMode.COVER}
                isLooping
                shouldPlay={false}
                onError={() => setVideoError(true)}
              />
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

          {/* Next Arrow Button */}
          <TouchableOpacity style={styles.nextButton} onPress={navigateToShare}>
            <Text style={styles.nextButtonText}>→</Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0D0D0F',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
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
    bottom: 20,
    left: 20,
    right: 20,
  },
  captionInput: {
    backgroundColor: 'rgba(0,0,0,0.6)',
    color: '#FFFFFF',
    fontSize: 16,
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 20,
    minHeight: 40,
    textAlignVertical: 'center',
  },
  nextButton: {
    position: 'absolute',
    bottom: 30,
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

}); 