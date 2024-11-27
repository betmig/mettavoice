import type { TTSVoice } from '../../types';
import { SUPPORTED_LOCALES } from '../../utils/locales';
import * as sdk from 'microsoft-cognitiveservices-speech-sdk';

// Track current playback state
let currentSynthesizer: sdk.SpeechSynthesizer | null = null;
let currentAudio: HTMLAudioElement | null = null;

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

    // Clean up any existing playback
    if (currentAudio) {
      currentAudio.pause();
      currentAudio.remove();
      currentAudio = null;
    }

    if (currentSynthesizer) {
      currentSynthesizer.close();
      currentSynthesizer = null;
    }

    // Configure speech synthesis
    const speechConfig = sdk.SpeechConfig.fromSubscription(apiKey.trim(), region.trim());
    speechConfig.speechSynthesisVoiceName = voiceId;
    speechConfig.speechSynthesisOutputFormat = sdk.SpeechSynthesisOutputFormat.Audio24Khz96KBitRateMonoMp3;

    // Create synthesizer with pull audio output stream
    const pullStream = sdk.AudioOutputStream.createPullStream();
    const audioConfig = sdk.AudioConfig.fromStreamOutput(pullStream);
    currentSynthesizer = new sdk.SpeechSynthesizer(speechConfig, audioConfig);

    return new Promise((resolve, reject) => {
      let isResolved = false;

      const cleanup = () => {
        if (currentAudio) {
          currentAudio.pause();
          currentAudio.remove();
          currentAudio = null;
        }
        if (currentSynthesizer) {
          currentSynthesizer.close();
          currentSynthesizer = null;
        }
        speechConfig.close();
        audioConfig.close();
      };

      currentSynthesizer!.speakTextAsync(
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
              // Create and play audio
              const blob = new Blob([result.audioData], { type: 'audio/mpeg' });
              const url = URL.createObjectURL(blob);
              
              currentAudio = new Audio(url);
              currentAudio.volume = 1;

              // Wait for current audio to finish before resolving
              currentAudio.onended = () => {
                URL.revokeObjectURL(url);
                cleanup();
                resolve();
              };

              currentAudio.onerror = (error) => {
                URL.revokeObjectURL(url);
                cleanup();
                reject(error);
              };

              currentAudio.play().catch(error => {
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
    if (currentSynthesizer) {
      currentSynthesizer.close();
      currentSynthesizer = null;
    }

    if (currentAudio) {
      currentAudio.pause();
      currentAudio.remove();
      currentAudio = null;
    }
    
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