import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Animated,
} from 'react-native';
import { ARFilterType, AR_FILTERS } from '../../types/ARTypes';

interface ARControlsProps {
  isVisible: boolean;
  selectedFilter: ARFilterType;
  onFilterSelect: (filter: ARFilterType) => void;
  onToggleAR: () => void;
}

export default function ARControls({
  isVisible,
  selectedFilter,
  onFilterSelect,
  onToggleAR,
}: ARControlsProps) {
  if (!isVisible) return null;

  return (
    <Animated.View style={styles.container}>
      {/* AR Toggle Button */}
      <TouchableOpacity 
        style={styles.arToggleButton}
        onPress={onToggleAR}
      >
        <Text style={styles.arToggleText}>✨</Text>
        <Text style={styles.arToggleLabel}>AR</Text>
      </TouchableOpacity>

      {/* Background Filters */}
      <View style={styles.filtersContainer}>
        <Text style={styles.filtersTitle}>Background Filters</Text>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.filtersScroll}
          contentContainerStyle={styles.filtersContent}
        >
          {AR_FILTERS.map((filter) => (
            <TouchableOpacity
              key={filter.id}
              style={[
                styles.filterButton,
                selectedFilter === filter.id && styles.filterButtonSelected
              ]}
              onPress={() => onFilterSelect(filter.id)}
            >
              <Text style={styles.filterEmoji}>{filter.emoji}</Text>
              <Text style={[
                styles.filterName,
                selectedFilter === filter.id && styles.filterNameSelected
              ]}>
                {filter.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Filter Info */}
      {selectedFilter !== 'none' && (
        <View style={styles.filterInfo}>
          <Text style={styles.filterInfoText}>
            {AR_FILTERS.find(f => f.id === selectedFilter)?.description}
          </Text>
        </View>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 20,
    top: 100,
    right: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    borderRadius: 15,
    padding: 15,
    zIndex: 2,
  },
  arToggleButton: {
    alignSelf: 'flex-end',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 221, 58, 0.2)',
    borderWidth: 2,
    borderColor: '#FFDD3A',
    borderRadius: 25,
    paddingHorizontal: 15,
    paddingVertical: 8,
    marginBottom: 15,
  },
  arToggleText: {
    fontSize: 20,
    marginBottom: 2,
  },
  arToggleLabel: {
    color: '#FFDD3A',
    fontSize: 10,
    fontWeight: 'bold',
  },
  filtersContainer: {
    marginBottom: 15,
  },
  filtersTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  filtersScroll: {
    maxHeight: 80,
  },
  filtersContent: {
    paddingHorizontal: 5,
  },
  filterButton: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginHorizontal: 5,
    minWidth: 60,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  filterButtonSelected: {
    backgroundColor: 'rgba(255, 221, 58, 0.2)',
    borderColor: '#FFDD3A',
  },
  filterEmoji: {
    fontSize: 24,
    marginBottom: 4,
  },
  filterName: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '600',
    textAlign: 'center',
  },
  filterNameSelected: {
    color: '#FFDD3A',
  },
  filterInfo: {
    backgroundColor: 'rgba(255, 221, 58, 0.1)',
    borderRadius: 8,
    padding: 8,
  },
  filterInfoText: {
    color: '#FFDD3A',
    fontSize: 12,
    textAlign: 'center',
    fontStyle: 'italic',
  },
}); 