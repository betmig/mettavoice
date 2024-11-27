import Speech from 'speak-tts';
import { isMobileDevice } from '../../utils/deviceDetection';

export class SpeechService {
  private static instance: SpeechService;
  private speech: Speech | null = null;
  private initialized = false;
  private initPromise: Promise<Speech> | null = null;
  private voicesInitialized = false;
  private retryAttempts = 0;
  private maxRetries = 3;
  private currentVoice: SpeechSynthesisVoice | null = null;
  private isSpeaking = false;

  private constructor() {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.getVoices();
    }
  }

  static getInstance(): SpeechService {
    if (!SpeechService.instance) {
      SpeechService.instance = new SpeechService();
    }
    return SpeechService.instance;
  }

  async initialize(volume: number = 1): Promise<Speech> {
    if (this.initialized && this.speech) {
      return this.speech;
    }

    if (this.initPromise) {
      return this.initPromise;
    }

    this.initPromise = (async () => {
      try {
        await this.cancel();

        this.speech = new Speech();
        
        if (!this.speech.hasBrowserSupport()) {
          throw new Error('Browser does not support speech synthesis');
        }

        // Wait for voices to be loaded first
        await this.waitForVoices();
        const voices = window.speechSynthesis.getVoices();

        // Find the best default voice
        const defaultVoice = this.findDefaultVoice(voices);
        if (!defaultVoice) {
          throw new Error('No suitable voice found');
        }

        await this.speech.init({
          volume,
          lang: defaultVoice.lang,
          voice: defaultVoice.name,
          splitSentences: false,
          listeners: {
            onvoiceschanged: () => {
              this.voicesInitialized = true;
            }
          }
        });

        // Set the default voice
        this.currentVoice = defaultVoice;
        if (this.speech) {
          await this.speech.setVoice(defaultVoice.name);
        }

        this.initialized = true;
        this.retryAttempts = 0;
        return this.speech;
      } catch (error) {
        console.error('Speech initialization error:', error);
        if (this.retryAttempts < this.maxRetries) {
          this.retryAttempts++;
          this.initPromise = null;
          await new Promise(resolve => setTimeout(resolve, 1000));
          return this.initialize(volume);
        }
        throw error;
      }
    })();

    return this.initPromise;
  }

  private findDefaultVoice(voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | undefined {
    // Always try to find Daniel (UK) first
    const danielVoice = voices.find(v => 
      v.name.toLowerCase().includes('daniel') && 
      v.lang === 'en-GB'
    );

    if (danielVoice) {
      return danielVoice;
    }

    // If Daniel is not available, try other UK voices
    const ukVoice = voices.find(v => v.lang === 'en-GB' && v.default) ||
                   voices.find(v => v.lang === 'en-GB');

    if (ukVoice) {
      return ukVoice;
    }

    // Last resort - any English voice
    return voices.find(v => v.lang === 'en-US' && v.default) ||
           voices.find(v => v.lang === 'en-US') ||
           voices.find(v => v.lang.startsWith('en-'));
  }

  private async waitForVoices(timeout: number = 5000): Promise<void> {
    if (this.voicesInitialized) return;

    return new Promise((resolve, reject) => {
      const start = Date.now();

      const checkVoices = () => {
        const voices = window.speechSynthesis.getVoices();
        if (voices.length > 0) {
          this.voicesInitialized = true;
          resolve();
        } else if (Date.now() - start > timeout) {
          reject(new Error('Timeout waiting for voices'));
        } else {
          setTimeout(checkVoices, 100);
        }
      };

      if ('onvoiceschanged' in window.speechSynthesis) {
        window.speechSynthesis.onvoiceschanged = () => {
          const voices = window.speechSynthesis.getVoices();
          if (voices.length > 0) {
            this.voicesInitialized = true;
            resolve();
          }
        };
      }

      checkVoices();
    });
  }

  async speak(text: string): Promise<void> {
    if (!this.initialized || !this.currentVoice) {
      throw new Error('Speech service not initialized or no voice selected');
    }

    // Don't allow overlapping speech
    if (this.isSpeaking) {
      await this.cancel();
    }

    try {
      this.isSpeaking = true;

      return new Promise((resolve, reject) => {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.voice = this.currentVoice;
        utterance.volume = this.speech?.volume || 1;
        utterance.rate = 1;
        utterance.pitch = 1;

        const cleanup = () => {
          this.isSpeaking = false;
          window.speechSynthesis.cancel();
        };

        utterance.onend = () => {
          this.isSpeaking = false;
          resolve();
        };

        utterance.onerror = (error) => {
          cleanup();
          console.error('Speech synthesis error:', error);
          if (error.error === 'interrupted' || error.error === 'canceled') {
            resolve(); // Ignore interruption/cancellation as they're expected
          } else {
            reject(new Error(`Speech synthesis failed: ${error.error || 'Unknown error'}`));
          }
        };

        // Set a timeout to prevent hanging
        const timeoutId = setTimeout(() => {
          cleanup();
          reject(new Error('Speech synthesis timed out'));
        }, 30000);

        try {
          window.speechSynthesis.cancel();
          window.speechSynthesis.speak(utterance);
        } catch (error) {
          clearTimeout(timeoutId);
          cleanup();
          reject(error);
        }
      });
    } catch (error) {
      this.isSpeaking = false;
      throw error;
    }
  }

  async cancel(): Promise<void> {
    if (this.isSpeaking) {
      window.speechSynthesis.cancel();
      this.isSpeaking = false;
      // Give a small delay for the cancellation to take effect
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  async setVoice(voiceId: string): Promise<void> {
    if (!this.initialized) {
      throw new Error('Speech service not initialized');
    }

    await this.cancel();

    const voices = window.speechSynthesis.getVoices();
    const voice = voices.find(v => v.voiceURI === voiceId);
    
    if (!voice) {
      throw new Error('Voice not found');
    }

    this.currentVoice = voice;
    if (this.speech) {
      await this.speech.setVoice(voice.name);
    }
  }

  async setVolume(volume: number): Promise<void> {
    if (!this.speech) {
      throw new Error('Speech service not initialized');
    }
    await this.speech.setVolume(volume);
  }

  getVoices(): SpeechSynthesisVoice[] {
    return window.speechSynthesis.getVoices();
  }

  getCurrentVoice(): SpeechSynthesisVoice | null {
    return this.currentVoice;
  }
}

export const speechService = SpeechService.getInstance();