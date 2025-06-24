export type ARFilterType = 
  | 'none'
  | 'vintage'
  | 'neon'
  | 'rainbow'
  | 'sunset'
  | 'ocean'
  | 'forest'
  | 'galaxy'
  | 'warm'
  | 'cool';

export interface ARFilterData {
  id: ARFilterType;
  name: string;
  emoji: string;
  description: string;
  category: 'background';
}

export const AR_FILTERS: ARFilterData[] = [
  { id: 'none', name: 'None', emoji: '❌', description: 'No filter', category: 'background' },
  { id: 'vintage', name: 'Vintage', emoji: '📺', description: 'Retro sepia filter', category: 'background' },
  { id: 'neon', name: 'Neon', emoji: '🌈', description: 'Neon glow effect', category: 'background' },
  { id: 'rainbow', name: 'Rainbow', emoji: '🌈', description: 'Rainbow overlay', category: 'background' },
  { id: 'sunset', name: 'Sunset', emoji: '🌅', description: 'Warm sunset tones', category: 'background' },
  { id: 'ocean', name: 'Ocean', emoji: '🌊', description: 'Cool blue tones', category: 'background' },
  { id: 'forest', name: 'Forest', emoji: '🌲', description: 'Natural green tones', category: 'background' },
  { id: 'galaxy', name: 'Galaxy', emoji: '⭐', description: 'Cosmic purple effect', category: 'background' },
  { id: 'warm', name: 'Warm', emoji: '☀️', description: 'Warm color filter', category: 'background' },
  { id: 'cool', name: 'Cool', emoji: '❄️', description: 'Cool color filter', category: 'background' },
]; 