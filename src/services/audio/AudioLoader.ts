import { BellSound } from '../../types';

const BELL_SOUNDS: Record<BellSound, string> = {
  'tibetan-bowl': 'https://raw.githubusercontent.com/betmig/mindmint/main/public/sounds/tibetan-bowl.mp3',
  'zen-bell': 'https://raw.githubusercontent.com/betmig/mindmint/main/public/sounds/zen-bell.mp3',
  'meditation-bell': 'https://raw.githubusercontent.com/betmig/mindmint/main/public/sounds/meditation-bell.mp3',
  'temple-bell': 'https://raw.githubusercontent.com/betmig/mindmint/main/public/sounds/temple-bell.mp3'
};

export class AudioLoader {
  private audioContext: AudioContext;
  private loadingPromises: Map<BellSound, Promise<AudioBuffer>> = new Map();
  private loadedBuffers: Map<BellSound, AudioBuffer> = new Map();
  private retryCount: Map<BellSound, number> = new Map();
  private maxRetries = 3;

  constructor(audioContext: AudioContext) {
    this.audioContext = audioContext;
  }

  async loadSound(sound: BellSound): Promise<AudioBuffer> {
    // Return cached buffer if available
    const cachedBuffer = this.loadedBuffers.get(sound);
    if (cachedBuffer) {
      return cachedBuffer;
    }

    // Return existing loading promise if one exists
    const existingPromise = this.loadingPromises.get(sound);
    if (existingPromise) {
      return existingPromise;
    }

    const loadPromise = this.fetchAndDecodeSound(sound);
    this.loadingPromises.set(sound, loadPromise);

    try {
      const buffer = await loadPromise;
      this.loadedBuffers.set(sound, buffer);
      this.loadingPromises.delete(sound);
      this.retryCount.delete(sound);
      return buffer;
    } catch (error) {
      this.loadingPromises.delete(sound);
      
      // Retry logic
      const currentRetries = this.retryCount.get(sound) || 0;
      if (currentRetries < this.maxRetries) {
        this.retryCount.set(sound, currentRetries + 1);
        console.log(`Retrying load for ${sound} (attempt ${currentRetries + 1}/${this.maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, 1000)); // Wait before retry
        return this.loadSound(sound);
      }
      
      throw error;
    }
  }

  private async fetchAndDecodeSound(sound: BellSound): Promise<AudioBuffer> {
    try {
      const response = await fetch(BELL_SOUNDS[sound], {
        mode: 'cors',
        cache: 'force-cache'
      });

      if (!response.ok) {
        throw new Error(`Failed to load sound ${sound}: ${response.status} ${response.statusText}`);
      }

      const arrayBuffer = await response.arrayBuffer();
      
      try {
        return await this.audioContext.decodeAudioData(arrayBuffer);
      } catch (decodeError) {
        console.error(`Failed to decode sound ${sound}:`, decodeError);
        throw new Error(`Failed to decode sound ${sound}`);
      }
    } catch (error) {
      console.error(`Failed to load sound ${sound}:`, error);
      throw error;
    }
  }

  clearCache(): void {
    this.loadedBuffers.clear();
    this.loadingPromises.clear();
    this.retryCount.clear();
  }
}