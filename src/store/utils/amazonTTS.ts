import type { TTSVoice } from '../../types';
import { PollyClient, SynthesizeSpeechCommand, DescribeVoicesCommand } from '@aws-sdk/client-polly';

// Maintain a single client instance
let client: PollyClient | null = null;
let currentAudio: HTMLAudioElement | null = null;

const initializeClient = (accessKeyId: string, secretAccessKey: string) => {
  if (!accessKeyId?.trim() || !secretAccessKey?.trim()) {
    throw new Error('Access Key ID and Secret Access Key are required');
  }

  client = new PollyClient({
    region: 'us-east-1',
    credentials: {
      accessKeyId: accessKeyId.trim(),
      secretAccessKey: secretAccessKey.trim()
    },
    maxAttempts: 3
  });
};

export const synthesizeAmazonSpeech = async (
  text: string,
  accessKeyId: string,
  voiceId: string,
  _region: string, // Region is not needed for Polly
  secretAccessKey: string
): Promise<void> => {
  try {
    // Initialize client if needed
    if (!client) {
      initializeClient(accessKeyId, secretAccessKey);
    }

    // Stop any existing playback
    if (currentAudio) {
      currentAudio.pause();
      currentAudio.remove();
      currentAudio = null;
    }

    const command = new SynthesizeSpeechCommand({
      Text: text,
      OutputFormat: 'mp3',
      VoiceId: voiceId,
      Engine: 'neural'
    });

    const { AudioStream } = await client!.send(command);
    
    if (!AudioStream) {
      throw new Error('No audio data received');
    }

    const chunks: Uint8Array[] = [];
    for await (const chunk of AudioStream) {
      chunks.push(chunk);
    }
    
    const blob = new Blob(chunks, { type: 'audio/mpeg' });
    const url = URL.createObjectURL(blob);

    return new Promise((resolve, reject) => {
      currentAudio = new Audio(url);
      currentAudio.volume = 1;

      currentAudio.onended = () => {
        URL.revokeObjectURL(url);
        if (currentAudio) {
          currentAudio.remove();
          currentAudio = null;
        }
        resolve();
      };

      currentAudio.onerror = (error) => {
        URL.revokeObjectURL(url);
        if (currentAudio) {
          currentAudio.remove();
          currentAudio = null;
        }
        reject(error);
      };

      currentAudio.play().catch(error => {
        URL.revokeObjectURL(url);
        if (currentAudio) {
          currentAudio.remove();
          currentAudio = null;
        }
        reject(error);
      });
    });
  } catch (error) {
    console.error('Amazon Polly error:', error);
    if (error instanceof Error) {
      if (error.name === 'UnrecognizedClientException') {
        throw new Error('Invalid credentials. Please check your Access Key ID and Secret Access Key.');
      }
      throw error;
    }
    throw new Error('Failed to synthesize speech');
  }
};

export const fetchAmazonVoices = async (
  accessKeyId: string,
  _region: string, // Region is not needed for Polly
  secretAccessKey: string
): Promise<{ [locale: string]: TTSVoice[] }> => {
  try {
    // Initialize client if needed
    if (!client) {
      initializeClient(accessKeyId, secretAccessKey);
    }

    const command = new DescribeVoicesCommand({
      Engine: 'neural',
      IncludeAdditionalLanguageCodes: true
    });

    const { Voices } = await client!.send(command);

    if (!Voices || Voices.length === 0) {
      throw new Error('No voices available');
    }

    // Group voices by locale
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
    console.error('Amazon Polly voices error:', error);
    if (error instanceof Error) {
      if (error.name === 'UnrecognizedClientException') {
        throw new Error('Invalid credentials. Please check your Access Key ID and Secret Access Key.');
      }
      throw error;
    }
    throw new Error('Failed to fetch voices');
  }
};