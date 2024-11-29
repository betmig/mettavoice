import { TTSProvider } from '../types';

export const prepareSpeechText = (text: string): string => {
  return text
    // Remove quotes and parenthetical content for speech
    .replace(/["']/g, '')
    .replace(/\([^)]*\)/g, '')
    // Convert dashes to slight pauses
    .replace(/\s*—\s*/g, ', ')
    // Clean up spaces
    .replace(/\s+/g, ' ')
    .trim();
};

export const calculatePauseDuration = (text: string): number => {
  // Longer pauses at major breaks
  if (text.match(/[.!?]$/)) return 1000;
  // Medium pauses at clause breaks
  if (text.match(/[,;:]$/)) return 500;
  // Short pauses at phrase breaks
  if (text.match(/—$/)) return 300;
  // Minimal pause otherwise
  return 150;
};

export const validateTTSProvider = (provider: TTSProvider): string | null => {
  if (!provider.enabled) {
    return 'Text-to-speech is not enabled. Please enable it in settings.';
  }
  if (!provider.selectedVoiceId) {
    return 'Please select a voice in settings before reading.';
  }
  return null;
};