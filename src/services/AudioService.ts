import { BellSound } from '../types';
import { AudioLoader } from './audio/AudioLoader';
import { AudioPlayer } from './audio/AudioPlayer';

class AudioService {
  private audioContext: AudioContext | null = null;
  private audioLoader: AudioLoader | null = null;
  private audioPlayer: AudioPlayer | null = null;
  private initialized = false;
  private initPromise: Promise<void> | null = null;
  private volume = 1;
  private retryCount = 0;
  private maxRetries = 3;
  private userInteractionReceived = false;

  async initialize(): Promise<void> {
    if (this.initialized) return;
    
    if (this.initPromise) {
      return this.initPromise;
    }

    this.initPromise = (async () => {
      try {
        const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
        if (!AudioContext) {
          throw new Error('Web Audio API is not supported in this browser');
        }

        // Create context but don't resume until user interaction
        this.audioContext = new AudioContext();
        this.audioLoader = new AudioLoader(this.audioContext);
        this.audioPlayer = new AudioPlayer(this.audioContext);
        this.audioPlayer.setVolume(this.volume);

        // Add one-time click handler to resume context
        if (!this.userInteractionReceived) {
          const handleInteraction = async () => {
            if (this.audioContext?.state === 'suspended') {
              await this.audioContext.resume();
            }
            this.userInteractionReceived = true;
            document.removeEventListener('click', handleInteraction);
            document.removeEventListener('touchstart', handleInteraction);
          };

          document.addEventListener('click', handleInteraction);
          document.addEventListener('touchstart', handleInteraction);
        }

        this.initialized = true;
        this.retryCount = 0;
      } catch (error) {
        console.error('Audio initialization failed:', error);
        
        if (this.retryCount < this.maxRetries) {
          this.retryCount++;
          this.cleanup();
          this.initPromise = null;
          console.log(`Retrying initialization (attempt ${this.retryCount}/${this.maxRetries})...`);
          await new Promise(resolve => setTimeout(resolve, 1000));
          return this.initialize();
        }
        
        this.cleanup();
        throw error;
      }
    })();

    return this.initPromise;
  }

  async play(sound: BellSound): Promise<void> {
    if (!this.initialized) {
      await this.initialize();
    }

    if (!this.audioLoader || !this.audioPlayer) {
      throw new Error('Audio system not initialized');
    }

    try {
      const buffer = await this.audioLoader.loadSound(sound);
      await this.audioPlayer.play(buffer);
    } catch (error) {
      console.error('Failed to play sound:', error);
      throw error;
    }
  }

  stop(): void {
    if (this.audioPlayer) {
      this.audioPlayer.stop();
    }
  }

  setVolume(volume: number): void {
    this.volume = Math.max(0, Math.min(1, volume));
    if (this.audioPlayer) {
      this.audioPlayer.setVolume(this.volume);
    }
  }

  cleanup(): void {
    this.stop();
    
    if (this.audioPlayer) {
      this.audioPlayer.dispose();
      this.audioPlayer = null;
    }

    if (this.audioContext) {
      this.audioContext.close().catch(console.error);
      this.audioContext = null;
    }

    if (this.audioLoader) {
      this.audioLoader.clearCache();
      this.audioLoader = null;
    }

    this.initialized = false;
    this.initPromise = null;
  }

  isInitialized(): boolean {
    return this.initialized;
  }
}

export const audioService = new AudioService();