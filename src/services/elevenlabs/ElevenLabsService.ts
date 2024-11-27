import type { TTSVoice } from '../../types';

export class ElevenLabsService {
  private static instance: ElevenLabsService;
  private apiKey: string | null = null;
  private currentAudio: HTMLAudioElement | null = null;

  private constructor() {}

  static getInstance(): ElevenLabsService {
    if (!ElevenLabsService.instance) {
      ElevenLabsService.instance = new ElevenLabsService();
    }
    return ElevenLabsService.instance;
  }

  initialize(apiKey: string): void {
    if (!apiKey?.trim()) {
      throw new Error('API key is required');
    }
    this.apiKey = apiKey.trim();
  }

  async synthesizeSpeech(text: string, voiceId: string): Promise<void> {
    if (!this.apiKey) {
      throw new Error('ElevenLabs service not initialized');
    }

    // Stop any existing playback
    if (this.currentAudio) {
      this.currentAudio.pause();
      this.currentAudio.remove();
      this.currentAudio = null;
    }

    try {
      const response = await fetch(
        `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
        {
          method: 'POST',
          headers: {
            'Accept': 'audio/mpeg',
            'Content-Type': 'application/json',
            'xi-api-key': this.apiKey
          },
          body: JSON.stringify({
            text,
            model_id: 'eleven_monolingual_v1',
            voice_settings: {
              stability: 0.5,
              similarity_boost: 0.75
            }
          })
        }
      );

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Unknown error' }));
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
      console.error('ElevenLabs synthesis error:', error);
      throw error instanceof Error ? error : new Error('Failed to synthesize speech');
    }
  }

  async listVoices(): Promise<TTSVoice[]> {
    if (!this.apiKey) {
      throw new Error('ElevenLabs service not initialized');
    }

    try {
      const response = await fetch('https://api.elevenlabs.io/v1/voices', {
        headers: {
          'Accept': 'application/json',
          'xi-api-key': this.apiKey
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch voices');
      }

      const data = await response.json();
      
      if (!Array.isArray(data.voices)) {
        throw new Error('Invalid response format');
      }

      return data.voices
        .map((voice: any) => ({
          id: voice.voice_id,
          name: voice.name,
          preview_url: voice.preview_url,
          locale: 'en-US' // ElevenLabs voices are primarily English
        }))
        .sort((a, b) => a.name.localeCompare(b.name));
    } catch (error) {
      console.error('Error fetching ElevenLabs voices:', error);
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

export const elevenLabsService = ElevenLabsService.getInstance();