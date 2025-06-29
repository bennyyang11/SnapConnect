import { FilterDefinition } from './aiFilterService';
import * as FileSystem from 'expo-file-system';
import { manipulateAsync, SaveFormat, ImageResult } from 'expo-image-manipulator';
import ViewShot from 'react-native-view-shot';

export interface FilterEffect {
  id: string;
  name: string;
  brightness?: number;
  contrast?: number;
  saturation?: number;
  hue?: number;
  sepia?: number;
  grayscale?: number;
  blur?: number;
  colorOverlay?: {
    red: number;
    green: number;
    blue: number;
    alpha: number;
  };
}

class ImageProcessingService {
  // Convert filter definition to processing parameters
  private getFilterEffects(filter: FilterDefinition | string): FilterEffect | null {
    if (typeof filter === 'string') {
      // Handle built-in filters
      switch (filter) {
        case 'vintage':
          return {
            id: 'vintage',
            name: 'Vintage',
            brightness: -0.1,
            contrast: 0.2,
            saturation: -0.3,
            sepia: 0.4,
            colorOverlay: { red: 139, green: 69, blue: 19, alpha: 0.2 }
          };
        case 'neon':
          return {
            id: 'neon',
            name: 'Neon',
            brightness: 0.2,
            contrast: 0.3,
            saturation: 0.5,
            colorOverlay: { red: 0, green: 255, blue: 255, alpha: 0.1 }
          };
        case 'rainbow':
        case 'rainbow_sparkles':
          return {
            id: 'rainbow_sparkles',
            name: 'Rainbow Sparkles',
            brightness: 0.3,
            contrast: 0.2,
            saturation: 0.5,
            hue: 30,
            colorOverlay: { red: 255, green: 105, blue: 180, alpha: 0.15 }
          };
        case 'sunset':
          return {
            id: 'sunset',
            name: 'Sunset',
            brightness: 0.1,
            contrast: 0.2,
            saturation: 0.3,
            colorOverlay: { red: 255, green: 140, blue: 0, alpha: 0.15 }
          };
        case 'ocean':
          return {
            id: 'ocean',
            name: 'Ocean',
            brightness: -0.05,
            contrast: 0.1,
            saturation: 0.2,
            colorOverlay: { red: 0, green: 191, blue: 255, alpha: 0.15 }
          };
        case 'forest':
          return {
            id: 'forest',
            name: 'Forest',
            brightness: -0.1,
            contrast: 0.15,
            saturation: 0.25,
            colorOverlay: { red: 34, green: 139, blue: 34, alpha: 0.15 }
          };
        case 'galaxy':
          return {
            id: 'galaxy',
            name: 'Galaxy',
            brightness: -0.2,
            contrast: 0.4,
            saturation: 0.3,
            colorOverlay: { red: 138, green: 43, blue: 226, alpha: 0.15 }
          };
        case 'warm':
          return {
            id: 'warm',
            name: 'Warm',
            brightness: 0.1,
            contrast: 0.1,
            saturation: 0.2,
            colorOverlay: { red: 255, green: 165, blue: 0, alpha: 0.1 }
          };
        case 'cool':
          return {
            id: 'cool',
            name: 'Cool',
            brightness: 0.05,
            contrast: 0.1,
            saturation: 0.1,
            colorOverlay: { red: 173, green: 216, blue: 230, alpha: 0.15 }
          };
        case 'dark_glitch':
          return {
            id: 'dark_glitch',
            name: 'Dark Glitch',
            brightness: -0.3,
            contrast: 0.5,
            saturation: -0.2,
            colorOverlay: { red: 0, green: 0, blue: 0, alpha: 0.2 }
          };
        case 'noir_shadows':
          return {
            id: 'noir_shadows',
            name: 'Noir Shadows',
            brightness: -0.3,
            contrast: 0.5,
            grayscale: 0.7,
            colorOverlay: { red: 0, green: 0, blue: 0, alpha: 0.2 }
          };
        case 'golden_hour':
          return {
            id: 'golden_hour',
            name: 'Golden Hour',
            brightness: 0.15,
            contrast: 0.2,
            saturation: 0.3,
            colorOverlay: { red: 255, green: 215, blue: 0, alpha: 0.2 }
          };
        case 'vaporwave':
          return {
            id: 'vaporwave',
            name: 'Vaporwave',
            brightness: 0.1,
            contrast: 0.3,
            saturation: 0.6,
            hue: -20,
            colorOverlay: { red: 255, green: 0, blue: 255, alpha: 0.15 }
          };
        case 'anime_style':
          return {
            id: 'anime_style',
            name: 'Anime Style',
            brightness: 0.2,
            contrast: 0.4,
            saturation: 0.5,
            colorOverlay: { red: 255, green: 105, blue: 180, alpha: 0.1 }
          };
        case 'soft_pastel':
          return {
            id: 'soft_pastel',
            name: 'Soft Pastel',
            brightness: 0.3,
            contrast: -0.2,
            saturation: -0.1,
            colorOverlay: { red: 255, green: 192, blue: 203, alpha: 0.1 }
          };
        case 'vintage_film':
          return {
            id: 'vintage_film',
            name: 'Vintage Film',
            brightness: -0.1,
            contrast: 0.3,
            saturation: -0.2,
            sepia: 0.6,
            colorOverlay: { red: 139, green: 69, blue: 19, alpha: 0.25 }
          };
        case 'cyberpunk_neon':
          return {
            id: 'cyberpunk_neon',
            name: 'Cyberpunk Neon',
            brightness: 0.1,
            contrast: 0.5,
            saturation: 0.7,
            colorOverlay: { red: 0, green: 255, blue: 255, alpha: 0.15 }
          };
        case 'dreamy_clouds':
          return {
            id: 'dreamy_clouds',
            name: 'Dreamy Clouds',
            brightness: 0.4,
            contrast: -0.1,
            saturation: -0.05,
            blur: 1.0,
            colorOverlay: { red: 255, green: 255, blue: 255, alpha: 0.1 }
          };
        default:
          if (filter.startsWith('custom_')) {
            // For custom AI filters, apply a distinctive effect
            return {
              id: filter,
              name: 'Custom AI Filter',
              brightness: 0.15,
              contrast: 0.25,
              saturation: 0.4,
              colorOverlay: { red: 147, green: 112, blue: 219, alpha: 0.15 }
            };
          }
          return null;
      }
    } else {
      // Handle FilterDefinition objects
      return this.parseFilterDefinition(filter);
    }
  }

  private parseFilterDefinition(filter: FilterDefinition): FilterEffect {
    // Convert AI-generated filter to processing parameters
    const effects: FilterEffect = {
      id: filter.id,
      name: filter.name || 'Custom Filter',
    };

    // Default effects based on filter intensity
    const intensityMultiplier = filter.intensity === 'intense' ? 1.2 : filter.intensity === 'subtle' ? 0.7 : 1.0;

    // Parse effects array to determine adjustments - be more conservative
    const effectsList = filter.effects || [];
    const visualStyle = filter.visualStyle || '';
    const mood = filter.mood?.join(' ') || '';

    // Apply brightness based on various keywords
    if (effectsList.some(e => e.includes('bright') || e.includes('light') || e.includes('glow')) ||
        visualStyle.includes('bright') || mood.includes('happy') || mood.includes('energetic')) {
      effects.brightness = 0.15 * intensityMultiplier;
    }

    // Apply dark effects for dark/edgy filters
    if (effectsList.some(e => e.includes('dark') || e.includes('shadows') || e.includes('noir')) ||
        visualStyle.includes('dark') || visualStyle.includes('glitch') || mood.includes('edgy') || mood.includes('mysterious')) {
      effects.brightness = -0.2 * intensityMultiplier;
      effects.contrast = 0.3 * intensityMultiplier;
      effects.saturation = -0.1 * intensityMultiplier;
    }

    // Apply high contrast for dramatic effects (but be conservative)
    if (effectsList.some(e => e.includes('high_contrast') || e.includes('dramatic') || e.includes('sharp')) ||
        visualStyle.includes('dramatic') || mood.includes('intense')) {
      effects.contrast = 0.25 * intensityMultiplier;
    }

    // Apply moderate saturation for colorful/vibrant effects
    if (effectsList.some(e => e.includes('colorful') || e.includes('vibrant') || e.includes('rainbow') || 
                              e.includes('sparkles') || e.includes('gradient') || e.includes('particles')) ||
        visualStyle.includes('colorful') || mood.includes('celebration') || mood.includes('joyful')) {
      effects.saturation = 0.3 * intensityMultiplier;
    }

    // Apply sepia for vintage effects
    if (effectsList.some(e => e.includes('vintage') || e.includes('sepia') || e.includes('old') || e.includes('film')) ||
        visualStyle.includes('vintage') || mood.includes('nostalgic')) {
      effects.sepia = 0.4 * intensityMultiplier;
    }

    // Apply grayscale for noir/monochrome effects
    if (effectsList.some(e => e.includes('noir') || e.includes('monochrome') || e.includes('black')) ||
        visualStyle.includes('noir') || mood.includes('dramatic') || mood.includes('serious')) {
      effects.grayscale = 0.5 * intensityMultiplier;
    }

    // Apply blur for dreamy/soft effects
    if (effectsList.some(e => e.includes('blur') || e.includes('dreamy') || e.includes('soft') || e.includes('clouds')) ||
        visualStyle.includes('dreamy') || visualStyle.includes('soft') || mood.includes('peaceful')) {
      effects.blur = 0.8 * intensityMultiplier;
    }

    // For custom AI filters, ensure at least some effects are applied (but be subtle)
    if (filter.id.startsWith('custom_') || (!effects.brightness && !effects.contrast && !effects.saturation && !effects.sepia && !effects.grayscale && !effects.blur)) {
      // Apply subtle default custom filter effects
      effects.brightness = 0.1;
      effects.contrast = 0.15;
      effects.saturation = 0.2;
    }

    // Apply color palette as overlay - but ONLY for specific safe color cases
    if (filter.colorPalette && filter.colorPalette.length > 0 && !effectsList.some(e => 
        e.includes('glitch') || e.includes('digital_noise') || e.includes('scan_lines') || e.includes('color_shift'))) {
      const primaryColor = filter.colorPalette[0];
      if (primaryColor.startsWith('#')) {
        const rgb = this.hexToRgb(primaryColor);
        if (rgb) {
          // For dark filters, use subtle dark overlay
          if (visualStyle.includes('dark') || mood.includes('edgy') || mood.includes('mysterious')) {
            effects.colorOverlay = {
              red: 0,
              green: 0,
              blue: 0,
              alpha: 0.1
            };
          } else {
            // For other filters, use very subtle color overlay
            effects.colorOverlay = {
              red: rgb.r,
              green: rgb.g,
              blue: rgb.b,
              alpha: 0.08
            };
          }
        }
      }
    }

    return effects;
  }

  private hexToRgb(hex: string): {r: number, g: number, b: number} | null {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  }

  // Convert filter effects to CSS-style filter string
  private createFilterString(effects: FilterEffect): string {
    const filters: string[] = [];

    if (effects.brightness !== undefined) {
      const brightness = Math.max(0, 1 + effects.brightness);
      filters.push(`brightness(${brightness})`);
    }

    if (effects.contrast !== undefined) {
      const contrast = Math.max(0, 1 + effects.contrast);
      filters.push(`contrast(${contrast})`);
    }

    if (effects.saturation !== undefined) {
      const saturation = Math.max(0, 1 + effects.saturation);
      filters.push(`saturate(${saturation})`);
    }

    if (effects.hue !== undefined) {
      filters.push(`hue-rotate(${effects.hue}deg)`);
    }

    if (effects.sepia !== undefined) {
      const sepia = Math.min(1, Math.max(0, effects.sepia));
      filters.push(`sepia(${sepia})`);
    }

    if (effects.grayscale !== undefined) {
      const grayscale = Math.min(1, Math.max(0, effects.grayscale));
      filters.push(`grayscale(${grayscale})`);
    }

    return filters.join(' ');
  }

  // Apply filter to image using a combination of expo-image-manipulator and CSS filters
  async applyFilterToImage(
    imageUri: string,
    filter: FilterDefinition | string
  ): Promise<string> {
    try {
      console.log('🎨 ImageProcessing: Starting real filter application...', typeof filter === 'string' ? filter : filter.name);
      
      const filterEffect = this.getFilterEffects(filter);
      if (!filterEffect) {
        console.log('🎨 ImageProcessing: No filter effect found, returning original image');
        return imageUri;
      }

      console.log('🎨 ImageProcessing: Applying filter effect:', filterEffect.name);
      console.log('🎨 ImageProcessing: Filter parameters:', {
        brightness: filterEffect.brightness,
        contrast: filterEffect.contrast,
        saturation: filterEffect.saturation,
        blur: filterEffect.blur,
        grayscale: filterEffect.grayscale,
        sepia: filterEffect.sepia
      });

      // Step 1: Apply geometric transformations using expo-image-manipulator
      let processedUri = imageUri;
      const geometricActions: any[] = [];

      // Apply blur if supported
      if (filterEffect.blur !== undefined && filterEffect.blur > 0) {
        try {
          geometricActions.push({
            blur: Math.min(filterEffect.blur * 2, 8), // Increase blur effect
          });
        } catch (blurError) {
          console.log('🎨 Blur not supported in this expo-image-manipulator version');
        }
      }

      if (geometricActions.length > 0) {
        try {
          console.log('🎨 ImageProcessing: Applying geometric transformations:', geometricActions);
          const result = await manipulateAsync(
            imageUri,
            geometricActions,
            { 
              compress: 0.9, 
              format: SaveFormat.JPEG 
            }
          );
          processedUri = result.uri;
          console.log('✅ ImageProcessing: Geometric transformations applied successfully');
        } catch (manipError: any) {
          console.log('⚠️ ImageProcessing: Manipulation failed, using original image:', manipError.message);
          processedUri = imageUri;
        }
      }

      // Step 2: Create CSS filter string for color effects
      const cssFilterString = this.createFilterString(filterEffect);
      console.log('🎨 ImageProcessing: Created CSS filter string:', cssFilterString);
      
      // Note: Filter data is now passed through navigation params instead of being stored automatically
      // This prevents filters from persisting across different photos
      console.log('✅ ImageProcessing: Filter application complete');
      return processedUri;

    } catch (error) {
      console.error('❌ ImageProcessing: Filter application failed:', error);
      // Return original image if processing fails
      return imageUri;
    }
  }

  // Store filter data explicitly when needed (e.g., for editing workflows)
  async storeFilterData(
    imageUri: string, 
    processedUri: string, 
    filterEffect: FilterEffect, 
    cssFilterString: string, 
    filterInfo: any
  ): Promise<void> {
    try {
      const filteredImageData = {
        originalUri: imageUri,
        processedUri: processedUri,
        filterEffect: filterEffect,
        cssFilterString: cssFilterString,
        filterInfo: filterInfo,
        hasColorEffects: true,
        hasGeometricEffects: false,
        timestamp: Date.now()
      };
      
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      const filterKey = `applied_filter_${Date.now()}`;
      await AsyncStorage.setItem(filterKey, JSON.stringify(filteredImageData));
      console.log('🎨 ImageProcessing: Filter metadata stored explicitly');
    } catch (storageError) {
      console.warn('⚠️ Could not store filter metadata:', storageError);
    }
  }

  // Check if a filter should be applied to captured images
  shouldApplyFilter(filter: FilterDefinition | string | null): boolean {
    return filter !== null && filter !== 'none';
  }

  // Get filter effect for preview/overlay purposes
  getFilterEffectForPreview(filter: FilterDefinition | string): FilterEffect | null {
    return this.getFilterEffects(filter);
  }
}

export default new ImageProcessingService(); 