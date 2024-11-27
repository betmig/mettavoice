import * as sdk from 'microsoft-cognitiveservices-speech-sdk';
import type { TTSVoice } from '../../types';

export class MicrosoftTTSAPI {
  private readonly region: string;
  private readonly apiKey: string;
  private synthesizer: sdk.SpeechSynthesizer | null = null;
  private activeAudio: HTMLAudioElement | null = null;

  constructor(apiKey: string, region: string) {
    if (!apiKey?.trim()) {
      throw new Error('API key is required');
    }

    if (!region?.trim()) {
      throw new Error('Region is required');
    }

    if (!/^[a-z]+[0-9]*$/.test(region.trim())) {
      throw new Error('Invalid region format. Example: eastus');
    }

    this.apiKey = apiKey.trim();
    this.region = region.trim().toLowerCase();
  }

  private cleanup() {
    if (this.activeAudio) {
      this.activeAudio.pause();
      this.activeAudio.remove();
      this.activeAudio = null;
    }

    if (this.synthesizer) {
      this.synthesizer.close();
      this.synthesizer = null;
    }
  }

  async synthesizeSpeech(text: string, voiceId: string): Promise<ArrayBuffer> {
    if (!text?.trim()) {
      throw new Error('Text is required');
    }

    if (!voiceId?.trim()) {
      throw new Error('Voice ID is required');
    }

    // Clean up any existing resources
    this.cleanup();

    try {
      const speechConfig = sdk.SpeechConfig.fromSubscription(this.apiKey, this.region);
      speechConfig.speechSynthesisVoiceName = voiceId.trim();
      speechConfig.speechSynthesisOutputFormat = sdk.SpeechSynthesisOutputFormat.Audio24Khz96KBitRateMonoMp3;

      // Create synthesizer with pull audio output stream to prevent double audio
      const pullStream = sdk.AudioOutputStream.createPullStream();
      const audioConfig = sdk.AudioConfig.fromStreamOutput(pullStream);
      this.synthesizer = new sdk.SpeechSynthesizer(speechConfig, audioConfig);

      return new Promise((resolve, reject) => {
        let isResolved = false;

        const cleanup = () => {
          if (this.synthesizer) {
            this.synthesizer.close();
            this.synthesizer = null;
          }
          speechConfig.close();
          audioConfig.close();
        };

        this.synthesizer!.speakTextAsync(
          text.trim(),
          result => {
            if (isResolved) return;
            isResolved = true;

            if (result.errorDetails) {
              cleanup();
              reject(new Error(result.errorDetails));
              return;
            }

            if (result.audioData) {
              cleanup();
              resolve(result.audioData);
            } else {
              cleanup();
              reject(new Error('No audio data received'));
            }
          },
          error => {
            if (isResolved) return;
            isResolved = true;
            cleanup();
            reject(error);
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
    } catch (error: any) {
      this.cleanup();
      console.error('Microsoft TTS error:', error);
      
      if (error.name === 'InvalidOperationError') {
        throw new Error('Invalid operation. Please check your voice selection.');
      }
      if (error.message?.includes('1006')) {
        throw new Error('Invalid API key. Please check your credentials.');
      }
      if (error.message?.includes('1007')) {
        throw new Error('Invalid region. Please check your region setting.');
      }
      
      throw error instanceof Error ? error : new Error('Failed to synthesize speech');
    }
  }

  async previewVoice(voiceId: string, volume: number = 1): Promise<void> {
    if (!voiceId?.trim()) {
      throw new Error('Voice ID is required for preview');
    }

    const previewText = "Hello! This is a preview of how I sound.";
    
    try {
      const audioData = await this.synthesizeSpeech(previewText, voiceId);
      if (!audioData || audioData.byteLength === 0) {
        throw new Error('No audio data received for preview');
      }

      // Clean up any existing audio
      this.cleanup();

      // Create and play new audio
      const blob = new Blob([audioData], { type: 'audio/mpeg' });
      const url = URL.createObjectURL(blob);
      
      this.activeAudio = new Audio(url);
      this.activeAudio.volume = volume;

      await new Promise<void>((resolve, reject) => {
        if (!this.activeAudio) {
          reject(new Error('Audio not initialized'));
          return;
        }

        const onEnded = () => {
          URL.revokeObjectURL(url);
          this.cleanup();
          resolve();
        };

        const onError = (error: ErrorEvent) => {
          URL.revokeObjectURL(url);
          this.cleanup();
          reject(error);
        };

        this.activeAudio.addEventListener('ended', onEnded, { once: true });
        this.activeAudio.addEventListener('error', onError, { once: true });
        this.activeAudio.play().catch(reject);
      });
    } catch (error) {
      console.error('Failed to preview voice:', error);
      throw error instanceof Error ? error : new Error('Failed to preview voice');
    }
  }

  async listVoices(): Promise<{ [locale: string]: TTSVoice[] }> {
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
          voice.Status !== 'Deprecated'
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

          // Sort voices within each locale
          acc[locale].sort((a, b) => a.name.localeCompare(b.name));
          return acc;
        }, {});

      if (Object.keys(voicesByLocale).length === 0) {
        throw new Error('No neural voices found');
      }

      return voicesByLocale;
    } catch (error: any) {
      console.error('Microsoft TTS error:', error);
      throw error instanceof Error ? error : new Error('Failed to fetch voices');
    }
  }
}