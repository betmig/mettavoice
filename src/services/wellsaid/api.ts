import axios, { AxiosInstance } from 'axios';
import axiosRetry from 'axios-retry';
import { WELLSAID_CONFIG } from './config';
import { WellSaidError, WellSaidNetworkError, WellSaidAuthError, WellSaidRateLimitError, WellSaidServerError } from './errors';
import type { WellSaidResponse } from './types';

export class WellSaidAPI {
  private client: AxiosInstance;

  constructor(apiKey: string) {
    if (!apiKey?.trim()) {
      throw new WellSaidError('API key is required');
    }

    this.client = axios.create({
      baseURL: WELLSAID_CONFIG.API_BASE_URL,
      timeout: WELLSAID_CONFIG.REQUEST_TIMEOUT,
      headers: {
        'X-Api-Key': apiKey.trim(),
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });

    axiosRetry(this.client, {
      retries: WELLSAID_CONFIG.MAX_RETRIES,
      retryDelay: axiosRetry.exponentialDelay,
      retryCondition: (error) => {
        return axiosRetry.isNetworkOrIdempotentRequestError(error) ||
               error.code === 'ECONNABORTED' ||
               (error.response?.status ?? 0) >= 500;
      }
    });
  }

  async listSpeakers(): Promise<WellSaidResponse> {
    try {
      const response = await this.client.get<WellSaidResponse>('/v1/speakers/list');
      
      if (!response.data?.speakers || !Array.isArray(response.data.speakers)) {
        throw new WellSaidError('Invalid response format from WellSaid API');
      }

      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (!error.response) {
          throw new WellSaidNetworkError();
        }
        
        switch (error.response.status) {
          case 401:
            throw new WellSaidAuthError();
          case 429:
            throw new WellSaidRateLimitError();
          case 500:
          case 502:
          case 503:
          case 504:
            throw new WellSaidServerError();
          default:
            throw new WellSaidError(
              error.response.data?.message || 'Unknown error occurred',
              error.response.status
            );
        }
      }
      
      throw new WellSaidError('Unexpected error occurred while connecting to WellSaid API');
    }
  }

  async synthesizeSpeech(text: string, speakerId: string): Promise<ArrayBuffer> {
    if (!text?.trim()) {
      throw new WellSaidError('Text is required');
    }

    if (!speakerId?.trim()) {
      throw new WellSaidError('Speaker ID is required');
    }

    try {
      const response = await this.client.post(
        '/v1/tts/stream',
        {
          text: text.trim(),
          speaker_id: speakerId.trim(),
          format: 'mp3'
        },
        {
          responseType: 'arraybuffer',
          headers: {
            'Accept': 'audio/mpeg'
          }
        }
      );

      if (!response.data) {
        throw new WellSaidError('No audio data received from WellSaid API');
      }

      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (!error.response) {
          throw new WellSaidNetworkError();
        }

        switch (error.response.status) {
          case 401:
            throw new WellSaidAuthError();
          case 429:
            throw new WellSaidRateLimitError();
          case 400:
            throw new WellSaidError('Invalid request. Please check the text and speaker ID.');
          case 500:
          case 502:
          case 503:
          case 504:
            throw new WellSaidServerError();
          default:
            throw new WellSaidError(
              error.response.data?.message || 'Unknown error occurred',
              error.response.status
            );
        }
      }

      throw new WellSaidError('Unexpected error occurred while connecting to WellSaid API');
    }
  }
}