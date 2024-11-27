import axios, { AxiosInstance } from 'axios';
import axiosRetry from 'axios-retry';
import type { TTSVoice } from '../../types';

export class ElevenLabsAPI {
  private client: AxiosInstance;

  constructor(apiKey: string) {
    if (!apiKey?.trim()) {
      throw new Error('API key is required');
    }

    this.client = axios.create({
      baseURL: 'https://api.elevenlabs.io/v1',
      timeout: 30000,
      headers: {
        'Accept': 'application/json',
        'xi-api-key': apiKey.trim()
      }
    });

    axiosRetry(this.client, {
      retries: 3,
      retryDelay: axiosRetry.exponentialDelay,
      retryCondition: (error) => {
        return axiosRetry.isNetworkOrIdempotentRequestError(error) ||
               error.code === 'ECONNABORTED' ||
               (error.response?.status ?? 0) >= 500;
      }
    });
  }

  async synthesizeSpeech(text: string, voiceId: string): Promise<ArrayBuffer> {
    try {
      const response = await this.client.post(
        `/text-to-speech/${voiceId}`,
        {
          text,
          model_id: 'eleven_monolingual_v1',
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.75
          }
        },
        {
          responseType: 'arraybuffer',
          headers: {
            'Accept': 'audio/mpeg',
            'Content-Type': 'application/json'
          }
        }
      );

      return response.data;
    } catch (error) {
      console.error('Eleven Labs synthesis error:', error);
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 401) {
          throw new Error('Invalid API key');
        }
        if (error.response?.status === 429) {
          throw new Error('Rate limit exceeded. Please try again later.');
        }
        throw new Error(error.response?.data?.detail || 'Failed to synthesize speech');
      }
      throw error;
    }
  }

  async listVoices(): Promise<TTSVoice[]> {
    try {
      const response = await this.client.get('/voices');
      const voices = response.data.voices;

      if (!Array.isArray(voices)) {
        throw new Error('Invalid response format');
      }

      return voices.map((voice: any) => ({
        id: voice.voice_id,
        name: voice.name,
        preview_url: voice.preview_url,
        locale: 'en-US' // Eleven Labs voices are primarily English
      })).sort((a, b) => a.name.localeCompare(b.name));
    } catch (error) {
      console.error('Eleven Labs voices error:', error);
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 401) {
          throw new Error('Invalid API key');
        }
        throw new Error(error.response?.data?.detail || 'Failed to fetch voices');
      }
      throw error;
    }
  }
}