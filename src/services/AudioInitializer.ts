import { audioService } from './AudioService';

class AudioInitializer {
  private static instance: AudioInitializer;
  private isInitialized = false;

  private constructor() {}

  static getInstance(): AudioInitializer {
    if (!AudioInitializer.instance) {
      AudioInitializer.instance = new AudioInitializer();
    }
    return AudioInitializer.instance;
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Initialize audio service immediately without waiting for user interaction
      await audioService.initialize();
      this.isInitialized = true;
    } catch (error) {
      console.error('Failed to initialize audio:', error);
      // Don't throw, just log the error and continue
      // Audio can be initialized later when needed
    }
  }

  isReady(): boolean {
    return this.isInitialized;
  }
}

export const audioInitializer = AudioInitializer.getInstance();