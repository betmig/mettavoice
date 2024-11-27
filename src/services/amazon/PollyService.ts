import { PollyClient, SynthesizeSpeechCommand, DescribeVoicesCommand } from '@aws-sdk/client-polly';
import type { TTSVoice } from '../../types';

export class PollyService {
  private static instance: PollyService;
  private client: PollyClient | null = null;
  private initialized = false;

  private constructor() {}

  static getInstance(): PollyService {
    if (!PollyService.instance) {
      PollyService.instance = new PollyService();
    }
    return PollyService.instance;
  }

  initialize(accessKeyId: string, secretAccessKey: string): void {
    if (!accessKeyId?.trim() || !secretAccessKey?.trim()) {
      throw new Error('Access Key ID and Secret Access Key are required');
    }

    try {
      this.client = new PollyClient({
        region: 'us-east-1',
        credentials: {
          accessKeyId: accessKeyId.trim(),
          secretAccessKey: secretAccessKey.trim()
        },
        maxAttempts: 3
      });
      this.initialized = true;
    } catch (error) {
      console.error('Failed to initialize Polly client:', error);
      throw new Error('Failed to initialize Amazon Polly client. Please check your credentials.');
    }
  }

  async synthesizeSpeech(text: string, voiceId: string): Promise<void> {
    if (!this.initialized || !this.client) {
      throw new Error('Polly service not initialized');
    }

    try {
      const command = new SynthesizeSpeechCommand({
        Text: text,
        OutputFormat: 'mp3',
        VoiceId: voiceId,
        Engine: 'neural'
      });

      const { AudioStream } = await this.client.send(command);
      
      if (!AudioStream) {
        throw new Error('No audio data received');
      }

      const chunks: Uint8Array[] = [];
      for await (const chunk of AudioStream) {
        chunks.push(chunk);
      }
      
      const audioData = await new Blob(chunks, { type: 'audio/mpeg' }).arrayBuffer();
      const audioContext = new AudioContext();
      const audioBuffer = await audioContext.decodeAudioData(audioData);
      const source = audioContext.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioContext.destination);

      await new Promise<void>((resolve, reject) => {
        source.onended = () => {
          audioContext.close();
          resolve();
        };
        source.onerror = (error) => {
          audioContext.close();
          reject(error);
        };
        source.start();
      });
    } catch (error) {
      console.error('Polly synthesis error:', error);
      
      if (error instanceof Error) {
        if (error.name === 'UnrecognizedClientException') {
          throw new Error('Invalid credentials. Please check your Access Key ID and Secret Access Key.');
        }
        throw error;
      }
      throw new Error('Failed to synthesize speech');
    }
  }

  async listVoices(): Promise<{ [locale: string]: TTSVoice[] }> {
    if (!this.initialized || !this.client) {
      throw new Error('Polly service not initialized');
    }

    try {
      const command = new DescribeVoicesCommand({
        Engine: 'neural',
        IncludeAdditionalLanguageCodes: true
      });

      const response = await this.client.send(command);
      const voices = response.Voices;

      if (!voices || voices.length === 0) {
        throw new Error('No voices available');
      }

      // Group voices by locale
      const voicesByLocale = voices.reduce((acc: { [key: string]: TTSVoice[] }, voice) => {
        if (!voice.Id || !voice.Name || !voice.LanguageCode || !voice.SupportedEngines?.includes('neural')) {
          return acc;
        }

        const locale = voice.LanguageCode;
        if (!acc[locale]) {
          acc[locale] = [];
        }

        // Get language name in the user's locale
        let languageName;
        try {
          languageName = new Intl.DisplayNames([navigator.language], { type: 'language' })
            .of(locale.split('-')[0]);
          // Capitalize first letter
          languageName = languageName.charAt(0).toUpperCase() + languageName.slice(1);
        } catch {
          languageName = voice.LanguageName;
        }

        acc[locale].push({
          id: voice.Id,
          name: `${voice.Name} (${languageName})`,
          preview_url: null,
          locale: voice.LanguageCode
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
      console.error('Failed to fetch voices:', error);
      
      if (error instanceof Error) {
        if (error.message.includes('UnrecognizedClientException')) {
          throw new Error('Invalid credentials. Please check your Access Key ID and Secret Access Key.');
        }
        if (error.message.includes('AccessDeniedException')) {
          throw new Error('Access denied. Please check your credentials and permissions.');
        }
        throw error;
      }
      
      throw new Error('Failed to fetch voices');
    }
  }
}

export const pollyService = PollyService.getInstance();