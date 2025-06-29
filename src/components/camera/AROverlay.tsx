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
      return [styles.customAIOverlay, styles.colorfulEffect];
    }
    
    // Handle AI filter library filters by ID with enhanced effects
    switch (selectedFilter) {
      case 'vintage':
        return [styles.vintageOverlay, styles.sepiaEffect];
      case 'neon':
        return [styles.neonOverlay, styles.glowEffect];
      case 'rainbow':
      case 'rainbow_sparkles':
        return [styles.rainbowSparklesOverlay, styles.vibrantEffect];
      case 'sunset':
        return [styles.sunsetOverlay, styles.warmEffect];
      case 'ocean':
        return [styles.oceanOverlay, styles.coolEffect];
      case 'forest':
        return [styles.forestOverlay, styles.naturalEffect];
      case 'galaxy':
        return [styles.galaxyOverlay, styles.cosmicEffect];
      case 'warm':
        return [styles.warmOverlay, styles.warmEffect];
      case 'cool':
        return [styles.coolOverlay, styles.coolEffect];
      // AI Filter Library styles with enhanced effects
      case 'dark_glitch':
        return [styles.darkGlitchOverlay, styles.contrastEffect];
      case 'noir_shadows':
        return [styles.noirOverlay, styles.monochromeEffect];
      case 'golden_hour':
        return [styles.goldenHourOverlay, styles.warmGlowEffect];
      case 'vaporwave':
        return [styles.vaporwaveOverlay, styles.synthEffect];
      case 'anime_style':
        return [styles.animeOverlay, styles.popEffect];
      case 'soft_pastel':
        return [styles.softPastelOverlay, styles.softEffect];
      case 'vintage_film':
        return [styles.vintageFilmOverlay, styles.filmEffect];
      case 'cyberpunk_neon':
        return [styles.cyberpunkOverlay, styles.neonEffect];
      case 'dreamy_clouds':
        return [styles.dreamyOverlay, styles.dreamyEffect];
      default:
        return null;
    }
  };

  const filterStyles = getFilterStyle();
  if (!filterStyles) return null;

  const isCustomFilter = typeof selectedFilter === 'string' && selectedFilter.startsWith('custom_');

  return (
    <Animated.View 
      style={[styles.overlay, { opacity: overlayOpacity }]}
      pointerEvents="none"
    >
      {/* Apply multiple filter layers for enhanced effect */}
      {filterStyles.map((style, index) => (
        <View key={index} style={style} />
      ))}
      
      {/* Filter Indicator */}
      {isActive && (
        <Animated.View 
          style={[styles.filterIndicator, { opacity: isCustomFilter ? textOpacity : 1 }]}
        >
          <Text style={styles.filterText}>
            {isCustomFilter ? '✨ AI CUSTOM FILTER ✨' : `🎨 ${selectedFilter?.toUpperCase()} FILTER`}
          </Text>
          <Text style={styles.filterSubtext}>Enhanced in photo editor</Text>
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
    backgroundColor: 'rgba(0, 255, 255, 0.08)',
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
    backgroundColor: 'rgba(147, 112, 219, 0.1)',
  },
  darkGlitchOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.15)',
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
    backgroundColor: 'rgba(255, 0, 255, 0.08)',
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
    backgroundColor: 'rgba(255, 0, 255, 0.1)',
  },
  animeOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 105, 180, 0.08)',
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
    backgroundColor: 'rgba(0, 255, 255, 0.08)',
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
    top: 120, // Moved down to avoid overlapping with top controls
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 10,
  },
  customFilterText: {
    color: '#9370DB',
    fontSize: 12,
    fontWeight: 'bold',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    overflow: 'hidden',
    textAlign: 'center',
  },
  filterIndicator: {
    position: 'absolute',
    top: 120, // Moved down to avoid overlapping with top controls
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 10,
  },
  filterText: {
    color: '#FFDD3A',
    fontSize: 12,
    fontWeight: 'bold',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    overflow: 'hidden',
    textAlign: 'center',
    marginBottom: 3,
  },
  filterSubtext: {
    color: '#FFFFFF',
    fontSize: 9,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
    overflow: 'hidden',
    textAlign: 'center',
  },
  colorfulEffect: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    opacity: 0.7,
  },
  sepiaEffect: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(139, 69, 19, 0.2)',
  },
  glowEffect: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 255, 255, 0.08)',
  },
  vibrantEffect: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 0, 255, 0.1)',
  },
  warmEffect: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 165, 0, 0.1)',
  },
  coolEffect: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(173, 216, 230, 0.15)',
  },
  naturalEffect: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(34, 139, 34, 0.15)',
  },
  cosmicEffect: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(138, 43, 226, 0.15)',
  },
  contrastEffect: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
  },
  monochromeEffect: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    opacity: 0.8,
  },
  warmGlowEffect: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
  },
  synthEffect: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 0, 255, 0.08)',
  },
  popEffect: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 105, 180, 0.08)',
  },
  softEffect: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 192, 203, 0.1)',
  },
  filmEffect: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(139, 69, 19, 0.25)',
    opacity: 0.9,
  },
  neonEffect: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 255, 255, 0.08)',
  },
  dreamyEffect: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    opacity: 0.7,
  },
}); 