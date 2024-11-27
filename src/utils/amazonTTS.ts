import type { TTSVoice } from '../types';
import { PollyClient, SynthesizeSpeechCommand, DescribeVoicesCommand } from '@aws-sdk/client-polly';

const validateCredentials = (accessKeyId?: string, secretAccessKey?: string) => {
  const errors = [];
  if (!accessKeyId) errors.push('Access Key ID is required');
  if (!secretAccessKey) errors.push('Secret Access Key is required');
  if (errors.length > 0) {
    throw new Error(errors.join(', '));
  }
};

export const synthesizeAmazonSpeech = async (
  text: string,
  accessKeyId: string,
  voiceId: string,
  region: string,
  secretAccessKey: string
): Promise<ArrayBuffer> => {
  try {
    validateCredentials(accessKeyId, secretAccessKey);

    const client = new PollyClient({
      region: region || 'us-east-1',
      credentials: {
        accessKeyId,
        secretAccessKey
      }
    });

    const command = new SynthesizeSpeechCommand({
      Text: text,
      OutputFormat: 'mp3',
      VoiceId: voiceId,
      Engine: 'neural'
    });

    const { AudioStream } = await client.send(command);
    
    if (!AudioStream) {
      throw new Error('No audio data received');
    }

    const chunks: Uint8Array[] = [];
    for await (const chunk of AudioStream) {
      chunks.push(chunk);
    }
    
    return new Blob(chunks, { type: 'audio/mpeg' }).arrayBuffer();
  } catch (error) {
    console.error('Amazon Polly error:', error);
    if (error instanceof Error) {
      if (error.message.includes('The security token included in the request is invalid')) {
        throw new Error('Invalid credentials. Please check your Access Key ID and Secret Access Key.');
      }
      throw error;
    }
    throw new Error('Failed to synthesize speech');
  }
};

export const fetchAmazonVoices = async (
  accessKeyId: string,
  _region: string,
  secretAccessKey: string
): Promise<TTSVoice[]> => {
  try {
    validateCredentials(accessKeyId, secretAccessKey);

    const client = new PollyClient({
      region: 'us-east-1',
      credentials: {
        accessKeyId,
        secretAccessKey
      }
    });

    const command = new DescribeVoicesCommand({
      Engine: 'neural',
      IncludeAdditionalLanguageCodes: true
    });

    const { Voices } = await client.send(command);

    if (!Voices || Voices.length === 0) {
      throw new Error('No voices available');
    }

    return Voices
      .filter(voice => 
        voice.Id &&
        voice.Name &&
        voice.LanguageName &&
        voice.SupportedEngines?.includes('neural') &&
        (voice.LanguageCode.startsWith('en-') || 
         voice.AdditionalLanguageCodes?.some(code => code.startsWith('en-')))
      )
      .map(voice => ({
        id: voice.Id!,
        name: `${voice.Name} (${voice.LanguageName})`,
        preview_url: null
      }));
  } catch (error) {
    console.error('Failed to fetch Amazon voices:', error);
    if (error instanceof Error) {
      if (error.message.includes('The security token included in the request is invalid')) {
        throw new Error('Invalid credentials. Please check your Access Key ID and Secret Access Key.');
      }
      throw error;
    }
    throw new Error('Failed to fetch voices');
  }
};