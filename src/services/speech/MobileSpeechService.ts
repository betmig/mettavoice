import { isMobileDevice } from '../../utils/deviceDetection';

export class MobileSpeechService {
  private static instance: MobileSpeechService;
  private initialized = false;
  private selectedVoice: SpeechSynthesisVoice | null = null;
  private volume = 1;
  private retryCount = 0;
  private maxRetries = 3;

  private constructor() {
    // Force initial voices load
    if ('speechSynthesis' in window) {
      window.speechSynthesis.getVoices();
    }
  }

  static getInstance(): MobileSpeechService {
    if (!MobileSpeechService.instance) {
      MobileSpeechService.instance = new MobileSpeechService();
    }
    return MobileSpeechService.instance;
  }

  private async waitForVoices(timeout = 5000): Promise<SpeechSynthesisVoice[]> {
    const start = Date.now();

    return new Promise((resolve, reject) => {
      const checkVoices = () => {
        const voices = window.speechSynthesis.getVoices();
        if (voices.length > 0) {
          resolve(voices);
        } else if (Date.now() - start > timeout) {
          reject(new Error('Timeout waiting for voices'));
        } else {
          setTimeout(checkVoices, 100);
        }
      };

      window.speechSynthesis.onvoiceschanged = () => {
        const voices = window.speechSynthesis.getVoices();
        if (voices.length > 0) {
          resolve(voices);
        }
      };

      checkVoices();
    });
  }

  async initialize(volume: number = 1): Promise<void> {
    if (this.initialized) return;

    try {
      if (!('speechSynthesis' in window)) {
        throw new Error('Speech synthesis not supported');
      }

      // Cancel any ongoing speech
      window.speechSynthesis.cancel();

      // Wait for voices with timeout
      const voices = await this.waitForVoices();
      
      // Find best voice for mobile
      const voice = this.findBestVoice(voices);
      if (!voice) {
        throw new Error('No suitable voice found');
      }

      this.selectedVoice = voice;
      this.volume = Math.max(0, Math.min(1, volume));
      this.initialized = true;
      this.retryCount = 0;
    } catch (error) {
      console.error('Failed to initialize mobile speech:', error);
      
      if (this.retryCount < this.maxRetries) {
        this.retryCount++;
        this.cleanup();
        console.log(`Retrying initialization (attempt ${this.retryCount}/${this.maxRetries})...`);
        await new Promise(resolve => setTimeout(resolve, 1000));
        return this.initialize(volume);
      }
      
      this.cleanup();
      throw error;
    }
  }

  private findBestVoice(voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | null {
    // First try to find a US English voice
    let voice = voices.find(v => 
      v.lang === 'en-US' && 
      v.localService && 
      (v.name.toLowerCase().includes('samantha') || v.default)
    );

    // If no US voice found, try any English voice
    if (!voice) {
      voice = voices.find(v => 
        v.lang.startsWith('en-') && 
        v.localService
      );
    }

    // Last resort - any available voice
    if (!voice && voices.length > 0) {
      voice = voices[0];
    }

    return voice;
  }

  async speak(text: string): Promise<void> {
    if (!this.initialized || !this.selectedVoice) {
      await this.initialize();
    }

    // Cancel any ongoing speech
    window.speechSynthesis.cancel();

    return new Promise((resolve, reject) => {
      try {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.voice = this.selectedVoice;
        utterance.volume = this.volume;
        utterance.rate = 1;
        utterance.pitch = 1;

        utterance.onend = () => resolve();
        utterance.onerror = (error) => {
          console.error('Speech synthesis error:', error);
          reject(new Error('Failed to speak text'));
        };

        window.speechSynthesis.speak(utterance);
      } catch (error) {
        console.error('Speech synthesis error:', error);
        reject(error);
      }
    });
  }

  async setVoice(voiceId: string): Promise<void> {
    const voices = window.speechSynthesis.getVoices();
    const voice = voices.find(v => v.voiceURI === voiceId);
    
    if (!voice) {
      throw new Error('Voice not found');
    }

    this.selectedVoice = voice;
  }

  setVolume(volume: number): void {
    this.volume = Math.max(0, Math.min(1, volume));
  }

  getVoices(): SpeechSynthesisVoice[] {
    return window.speechSynthesis.getVoices();
  }

  private cleanup(): void {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    this.selectedVoice = null;
    this.initialized = false;
  }
}

export const mobileSpeechService = MobileSpeechService.getInstance();