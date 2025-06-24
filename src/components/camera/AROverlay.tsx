import React, { useEffect } from 'react';
import {
  View,
  StyleSheet,
  Animated,
} from 'react-native';
import { ARFilterType } from '../../types/ARTypes';

interface AROverlayProps {
  isActive: boolean;
  selectedFilter: ARFilterType;
}

export default function AROverlay({ 
  isActive, 
  selectedFilter
}: AROverlayProps) {
  const overlayOpacity = React.useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(overlayOpacity, {
      toValue: isActive ? 1 : 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [isActive, overlayOpacity]);

  if (!isActive || selectedFilter === 'none') return null;

  const getFilterStyle = () => {
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
      default:
        return null;
    }
  };

  const filterStyle = getFilterStyle();
  if (!filterStyle) return null;

  return (
    <Animated.View 
      style={[styles.overlay, { opacity: overlayOpacity }]}
      pointerEvents="none"
    >
      <View style={filterStyle} />
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
}); 