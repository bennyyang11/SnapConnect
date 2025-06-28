import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
} from 'react-native';
import { ARFilterType } from '../../types/ARTypes';

interface AROverlayProps {
  isActive: boolean;
  selectedFilter: ARFilterType | string;
}

export default function AROverlay({ 
  isActive, 
  selectedFilter
}: AROverlayProps) {
  const overlayOpacity = React.useRef(new Animated.Value(0)).current;
  const textOpacity = React.useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(overlayOpacity, {
      toValue: isActive ? 1 : 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [isActive, overlayOpacity]);

  // Animate custom filter text indicator
  useEffect(() => {
    const isCustomFilter = typeof selectedFilter === 'string' && selectedFilter.startsWith('custom_');
    if (isActive && isCustomFilter) {
      // Fade in, stay visible, then fade out
      Animated.sequence([
        Animated.timing(textOpacity, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.delay(2000),
        Animated.timing(textOpacity, {
          toValue: 0.3,
          duration: 500,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      textOpacity.setValue(0);
    }
  }, [isActive, selectedFilter, textOpacity]);

  // Debug logging for filter application
  console.log('🎨 AROverlay render:', { isActive, selectedFilter, type: typeof selectedFilter });

  if (!isActive || selectedFilter === 'none') return null;

  const getFilterStyle = () => {
    // Handle custom AI-generated filters
    if (typeof selectedFilter === 'string' && selectedFilter.startsWith('custom_')) {
      return styles.customAIOverlay;
    }
    
    // Handle AI filter library filters by ID
    switch (selectedFilter) {
      case 'vintage':
        return styles.vintageOverlay;
      case 'neon':
        return styles.neonOverlay;
      case 'rainbow':
        return styles.rainbowOverlay;
      case 'sunset':
        return styles.sunsetOverlay;
      case 'ocean':
        return styles.oceanOverlay;
      case 'forest':
        return styles.forestOverlay;
      case 'galaxy':
        return styles.galaxyOverlay;
      case 'warm':
        return styles.warmOverlay;
      case 'cool':
        return styles.coolOverlay;
      // AI Filter Library styles
      case 'dark_glitch':
        return styles.darkGlitchOverlay;
      case 'noir_shadows':
        return styles.noirOverlay;
      case 'rainbow_sparkles':
        return styles.rainbowSparklesOverlay;
      case 'golden_hour':
        return styles.goldenHourOverlay;
      case 'vaporwave':
        return styles.vaporwaveOverlay;
      case 'anime_style':
        return styles.animeOverlay;
      case 'soft_pastel':
        return styles.softPastelOverlay;
      case 'vintage_film':
        return styles.vintageFilmOverlay;
      case 'cyberpunk_neon':
        return styles.cyberpunkOverlay;
      case 'dreamy_clouds':
        return styles.dreamyOverlay;
      default:
        return null;
    }
  };

  const filterStyle = getFilterStyle();
  if (!filterStyle) return null;

  const isCustomFilter = typeof selectedFilter === 'string' && selectedFilter.startsWith('custom_');

  return (
    <Animated.View 
      style={[styles.overlay, { opacity: overlayOpacity }]}
      pointerEvents="none"
    >
      <View style={filterStyle} />
      
      {/* Custom Filter Indicator */}
      {isCustomFilter && (
        <Animated.View 
          style={[styles.customFilterIndicator, { opacity: textOpacity }]}
        >
          <Text style={styles.customFilterText}>✨ AI CUSTOM FILTER ACTIVE ✨</Text>
        </Animated.View>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1,
  },
  vintageOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(139, 69, 19, 0.2)',
  },
  neonOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 255, 255, 0.1)',
    shadowColor: '#00FFFF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  rainbowOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 0, 255, 0.1)',
  },
  sunsetOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 140, 0, 0.15)',
  },
  oceanOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 191, 255, 0.15)',
  },
  forestOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(34, 139, 34, 0.15)',
  },
  galaxyOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(138, 43, 226, 0.15)',
  },
  warmOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 165, 0, 0.1)',
  },
  coolOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(173, 216, 230, 0.15)',
  },
    // AI Filter Library overlays  
  customAIOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(147, 112, 219, 0.15)',
    borderWidth: 3.5,
    borderColor: '#9370DB',
    shadowColor: '#9370DB',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 15,
  },
  darkGlitchOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderWidth: 1,
    borderColor: 'rgba(255, 0, 0, 0.2)',
  },
  noirOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    opacity: 0.8,
  },
  rainbowSparklesOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 0, 255, 0.1)',
    shadowColor: '#FF69B4',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 15,
  },
  goldenHourOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
  },
  vaporwaveOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 0, 255, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(0, 255, 255, 0.3)',
  },
  animeOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 105, 180, 0.1)',
    borderWidth: 2,
    borderColor: 'rgba(135, 206, 235, 0.2)',
  },
  softPastelOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 192, 203, 0.1)',
  },
  vintageFilmOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(139, 69, 19, 0.25)',
    opacity: 0.9,
  },
  cyberpunkOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 255, 255, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255, 0, 255, 0.3)',
    shadowColor: '#00FFFF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
  },
  dreamyOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    opacity: 0.7,
  },
  customFilterIndicator: {
    position: 'absolute',
    top: 50,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 10,
  },
  customFilterText: {
    color: '#9370DB',
    fontSize: 14,
    fontWeight: 'bold',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    overflow: 'hidden',
    textAlign: 'center',
  },
}); 