import * as sdk from 'microsoft-cognitiveservices-speech-sdk';
import type { TTSVoice } from '../../types';
import { SUPPORTED_LOCALES } from '../../utils/locales';

export class AzureService {
  private static instance: AzureService;
  private apiKey: string | null = null;
  private region: string | null = null;
  private currentSynthesizer: sdk.SpeechSynthesizer | null = null;
  private currentAudio: HTMLAudioElement | null = null;

  private constructor() {}

  static getInstance(): AzureService {
    if (!AzureService.instance) {
      AzureService.instance = new AzureService();
    }
    return AzureService.instance;
  }

  initialize(apiKey: string, region: string): void {
    if (!apiKey?.trim()) {
      throw new Error('API key is required');
    }
    if (!region?.trim()) {
      throw new Error('Region is required');
    }
    this.apiKey = apiKey.trim();
    this.region = region.trim();
  }

  private cleanup(): void {
    if (this.currentAudio) {
      this.currentAudio.pause();
      this.currentAudio.remove();
      this.currentAudio = null;
    }

    if (this.currentSynthesizer) {
      this.currentSynthesizer.close();
      this.currentSynthesizer = null;
    }
  }

  async synthesizeSpeech(text: string, voiceId: string): Promise<void> {
    if (!this.apiKey || !this.region) {
      throw new Error('Azure service not initialized');
    }

    // Clean up any existing resources
    this.cleanup();

    try {
      const speechConfig = sdk.SpeechConfig.fromSubscription(this.apiKey, this.region);
      speechConfig.speechSynthesisVoiceName = voiceId;
      speechConfig.speechSynthesisOutputFormat = sdk.SpeechSynthesisOutputFormat.Audio24Khz96KBitRateMonoMp3;

      // Create synthesizer with pull audio output stream to prevent double audio
      const pullStream = sdk.AudioOutputStream.createPullStream();
      const audioConfig = sdk.AudioConfig.fromStreamOutput(pullStream);
      this.currentSynthesizer = new sdk.SpeechSynthesizer(speechConfig, audioConfig);

      return new Promise((resolve, reject) => {
        let isResolved = false;

        const cleanup = () => {
          this.cleanup();
          speechConfig.close();
          audioConfig.close();
        };

        // Wait for previous audio to finish before starting new synthesis
        this.currentSynthesizer!.speakTextAsync(
          text,
          result => {
            if (isResolved) return;
            isResolved = true;

            if (result.errorDetails) {
              cleanup();
              reject(new Error(result.errorDetails));
              return;
            }

            if (result.audioData) {
              try {
                const blob = new Blob([result.audioData], { type: 'audio/mpeg' });
                const url = URL.createObjectURL(blob);
                
                this.currentAudio = new Audio(url);
                this.currentAudio.volume = 1;

                this.currentAudio.onended = () => {
                  URL.revokeObjectURL(url);
                  cleanup();
                  resolve();
                };

                this.currentAudio.onerror = (error) => {
                  URL.revokeObjectURL(url);
                  cleanup();
                  reject(error);
                };

                this.currentAudio.play().catch(error => {
                  URL.revokeObjectURL(url);
                  cleanup();
                  reject(error);
                });
              } catch (error) {
                cleanup();
                reject(error);
              }
            } else {
              cleanup();
              reject(new Error('No audio data received'));
            }
          },
          error => {
            if (!isResolved) {
              isResolved = true;
              cleanup();
              reject(error);
            }
          }
        );

        // Set a timeout to prevent hanging
        setTimeout(() => {
          if (!isResolved) {
            isResolved = true;
            cleanup();
            reject(new Error('Speech synthesis timed out'));
          }
        }, 30000);
      });
    } catch (error) {
      this.cleanup();
      console.error('Azure synthesis error:', error);
      throw error instanceof Error ? error : new Error('Failed to synthesize speech');
    }
  }

  async listVoices(): Promise<{ [locale: string]: TTSVoice[] }> {
    if (!this.apiKey || !this.region) {
      throw new Error('Azure service not initialized');
    }

    try {
      const endpoint = `https://${this.region}.tts.speech.microsoft.com/cognitiveservices/voices/list`;
      
      const response = await fetch(endpoint, {
        headers: {
          'Ocp-Apim-Subscription-Key': this.apiKey
        }
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Invalid API key. Please check your credentials.');
        }
        if (response.status === 404) {
          throw new Error('Invalid region. Please check your region setting.');
        }
        throw new Error(`Failed to fetch voices: ${response.statusText}`);
      }

      const voices = await response.json();
      
      if (!Array.isArray(voices)) {
        throw new Error('Invalid response format from Azure API');
      }

      // Group voices by locale
      const voicesByLocale = voices
        .filter((voice: any) => 
          voice.VoiceType === 'Neural' &&
          voice.Status !== 'Deprecated' &&
          voice.Locale in SUPPORTED_LOCALES // Only include supported locales
        )
        .reduce((acc: { [locale: string]: TTSVoice[] }, voice: any) => {
          const locale = voice.Locale;
          if (!acc[locale]) {
            acc[locale] = [];
          }

          acc[locale].push({
            id: voice.ShortName,
            name: voice.DisplayName,
            preview_url: null,
            locale: voice.Locale
          });

          return acc;
        }, {});

      // Sort voices within each locale
      Object.values(voicesByLocale).forEach(voices => {
        voices.sort((a, b) => a.name.localeCompare(b.name));
      });

      if (Object.keys(voicesByLocale).length === 0) {
        throw new Error('No neural voices found');
      }

      return voicesByLocale;
    } catch (error) {
      console.error('Azure voices error:', error);
      throw error instanceof Error ? error : new Error('Failed to fetch voices');
    }
  }
}

export const azureService = AzureService.getInstance();