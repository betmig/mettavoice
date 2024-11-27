import type { TTSVoice } from '../../types';

// OpenAI TTS currently only supports these voices
const OPENAI_VOICES: TTSVoice[] = [
  { 
    id: 'alloy', 
    name: 'Alloy (English)', 
    preview_url: null,
    locale: 'en-US'
  },
  { 
    id: 'echo', 
    name: 'Echo (English)', 
    preview_url: null,
    locale: 'en-US'
  },
  { 
    id: 'fable', 
    name: 'Fable (English)', 
    preview_url: null,
    locale: 'en-US'
  },
  { 
    id: 'onyx', 
    name: 'Onyx (English)', 
    preview_url: null,
    locale: 'en-US'
  },
  { 
    id: 'nova', 
    name: 'Nova (English)', 
    preview_url: null,
    locale: 'en-US'
  },
  { 
    id: 'shimmer', 
    name: 'Shimmer (English)', 
    preview_url: null,
    locale: 'en-US'
  }
];

export class OpenAIService {
  private static instance: OpenAIService;
  private apiKey: string | null = null;
  private currentAudio: HTMLAudioElement | null = null;

  private constructor() {}

  static getInstance(): OpenAIService {
    if (!OpenAIService.instance) {
      OpenAIService.instance = new OpenAIService();
    }
    return OpenAIService.instance;
  }

  initialize(apiKey: string): void {
    if (!apiKey?.trim()) {
      throw new Error('API key is required');
    }
    this.apiKey = apiKey.trim();
  }

  async synthesizeSpeech(text: string, voiceId: string): Promise<void> {
    if (!this.apiKey) {
      throw new Error('OpenAI service not initialized');
    }

    // Stop any existing playback
    if (this.currentAudio) {
      this.currentAudio.pause();
      this.currentAudio.remove();
      this.currentAudio = null;
    }

    try {
      const response = await fetch('https://api.openai.com/v1/audio/speech', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'tts-1',
          input: text,
          voice: voiceId,
          response_format: 'mp3'
        })
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: { message: 'Unknown error' } }));
        throw new Error(error.error?.message || 'Failed to synthesize speech');
      }

      const audioData = await response.arrayBuffer();
      const blob = new Blob([audioData], { type: 'audio/mpeg' });
      const url = URL.createObjectURL(blob);

      return new Promise((resolve, reject) => {
        this.currentAudio = new Audio(url);
        this.currentAudio.volume = 1;

        this.currentAudio.onended = () => {
          URL.revokeObjectURL(url);
          if (this.currentAudio) {
            this.currentAudio.remove();
            this.currentAudio = null;
          }
          resolve();
        };

        this.currentAudio.onerror = (error) => {
          URL.revokeObjectURL(url);
          if (this.currentAudio) {
            this.currentAudio.remove();
            this.currentAudio = null;
          }
          reject(error);
        };

        this.currentAudio.play().catch(error => {
          URL.revokeObjectURL(url);
          if (this.currentAudio) {
            this.currentAudio.remove();
            this.currentAudio = null;
          }
          reject(error);
        });
      });
    } catch (error) {
      console.error('OpenAI synthesis error:', error);
      throw error instanceof Error ? error : new Error('Failed to synthesize speech');
    }
  }

  async listVoices(): Promise<TTSVoice[]> {
    if (!this.apiKey) {
      throw new Error('OpenAI service not initialized');
    }

    try {
      // Verify API key is valid by checking models endpoint
      const response = await fetch('https://api.openai.com/v1/models', {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`
        }
      });

      if (!response.ok) {
        throw new Error('Invalid API key or authentication failed');
      }

      // Return the predefined voices since OpenAI only supports these
      return OPENAI_VOICES;
    } catch (error) {
      console.error('Failed to verify OpenAI credentials:', error);
      throw error instanceof Error ? error : new Error('Failed to fetch voices');
    }
  }

  cleanup(): void {
    if (this.currentAudio) {
      this.currentAudio.pause();
      this.currentAudio.remove();
      this.currentAudio = null;
    }
  }
}

export const openAIService = OpenAIService.getInstance();