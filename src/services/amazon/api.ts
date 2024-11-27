import { PollyClient, SynthesizeSpeechCommand, DescribeVoicesCommand } from '@aws-sdk/client-polly';
import type { TTSVoice } from '../../types';

export class AmazonPollyAPI {
  private client: PollyClient;

  constructor(accessKeyId: string, secretAccessKey: string) {
    if (!this.validateCredentials(accessKeyId, secretAccessKey)) {
      throw new Error('Invalid credentials format. Access Key ID should be 20 characters and Secret Access Key should be 40 characters.');
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
    } catch (error) {
      console.error('Failed to initialize Polly client:', error);
      throw new Error('Failed to initialize Amazon Polly client. Please check your credentials.');
    }
  }

  private validateCredentials(accessKeyId?: string, secretAccessKey?: string): boolean {
    if (!accessKeyId?.trim() || !secretAccessKey?.trim()) {
      return false;
    }

    // AWS Access Key ID format: 20 uppercase alphanumeric characters
    const accessKeyPattern = /^[A-Z0-9]{20}$/;
    
    // AWS Secret Access Key format: 40 base64 characters
    const secretKeyPattern = /^[A-Za-z0-9/+=]{40}$/;

    return accessKeyPattern.test(accessKeyId.trim()) && 
           secretKeyPattern.test(secretAccessKey.trim());
  }

  async synthesizeSpeech(text: string, voiceId: string): Promise<ArrayBuffer> {
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
      
      return new Blob(chunks, { type: 'audio/mpeg' }).arrayBuffer();
    } catch (error: any) {
      console.error('Amazon Polly synthesis error:', error);
      
      if (error.name === 'UnrecognizedClientException') {
        throw new Error('Invalid credentials. Please check your Access Key ID and Secret Access Key format.');
      }
      if (error.name === 'InvalidSampleRateException') {
        throw new Error('Invalid sample rate for the selected voice.');
      }
      if (error.name === 'TextLengthExceededException') {
        throw new Error('Text is too long. Please use a shorter text.');
      }
      if (error.name === 'ServiceUnavailableException') {
        throw new Error('Amazon Polly service is temporarily unavailable. Please try again later.');
      }
      
      throw new Error(error.message || 'Failed to synthesize speech');
    }
  }

  async listVoices(): Promise<{ [locale: string]: TTSVoice[] }> {
    try {
      const command = new DescribeVoicesCommand({
        Engine: 'neural',
        IncludeAdditionalLanguageCodes: true
      });

      const { Voices } = await this.client.send(command);

      if (!Voices || Voices.length === 0) {
        throw new Error('No voices available');
      }

      // Group voices by locale without filtering by language
      const voicesByLocale = Voices
        .filter(voice => 
          voice.Id &&
          voice.Name &&
          voice.LanguageName &&
          voice.SupportedEngines?.includes('neural')
        )
        .reduce((acc: { [locale: string]: TTSVoice[] }, voice) => {
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
            id: voice.Id!,
            name: `${voice.Name} (${languageName})`,
            preview_url: null,
            locale: voice.LanguageCode
          });

          // Sort voices by name within each locale
          acc[locale].sort((a, b) => a.name.localeCompare(b.name));
          return acc;
        }, {});

      if (Object.keys(voicesByLocale).length === 0) {
        throw new Error('No neural voices found');
      }

      return voicesByLocale;
    } catch (error: any) {
      console.error('Amazon Polly voices error:', error);
      
      if (error.name === 'UnrecognizedClientException') {
        throw new Error('Invalid credentials. Please check your Access Key ID and Secret Access Key format.');
      }
      if (error.name === 'ServiceUnavailableException') {
        throw new Error('Amazon Polly service is temporarily unavailable. Please try again later.');
      }
      
      throw new Error(error.message || 'Failed to fetch voices');
    }
  }
}