import type { TTSVoice } from '../types';
import { SUPPORTED_LOCALES } from './locales';
import * as sdk from 'microsoft-cognitiveservices-speech-sdk';

export const synthesizeMicrosoftSpeech = async (
  text: string,
  apiKey: string,
  voiceId: string,
  region: string
): Promise<void> => {
  try {
    if (!apiKey?.trim()) {
      throw new Error('API key is required');
    }

    if (!region?.trim()) {
      throw new Error('Region is required');
    }

    const speechConfig = sdk.SpeechConfig.fromSubscription(apiKey.trim(), region.trim());
    speechConfig.speechSynthesisVoiceName = voiceId;
    
    const synthesizer = new sdk.SpeechSynthesizer(speechConfig);

    return new Promise((resolve, reject) => {
      synthesizer.speakTextAsync(
        text,
        result => {
          synthesizer.close();
          
          if (result.errorDetails) {
            reject(new Error(result.errorDetails));
          } else {
            resolve();
          }
        },
        error => {
          synthesizer.close();
          reject(error);
        }
      );
    });
  } catch (error) {
    console.error('Microsoft TTS error:', error);
    throw error instanceof Error ? error : new Error('Failed to synthesize speech');
  }
};

export const fetchMicrosoftVoices = async (
  apiKey: string,
  region: string
): Promise<{ [locale: string]: TTSVoice[] }> => {
  try {
    if (!apiKey?.trim()) {
      throw new Error('API key is required');
    }

    if (!region?.trim()) {
      throw new Error('Region is required');
    }

    const endpoint = `https://${region.trim()}.tts.speech.microsoft.com/cognitiveservices/voices/list`;
    
    const response = await fetch(endpoint, {
      headers: {
        'Ocp-Apim-Subscription-Key': apiKey.trim()
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
    console.error('Microsoft TTS voices error:', error);
    throw error instanceof Error ? error : new Error('Failed to fetch voices');
  }
};