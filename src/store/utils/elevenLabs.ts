import type { TTSVoice } from '../../types';

// Track current audio playback
let currentAudio: HTMLAudioElement | null = null;

export const synthesizeElevenLabsSpeech = async (
  text: string,
  voiceId: string,
  apiKey: string
): Promise<void> => {
  try {
    // Stop any existing playback
    if (currentAudio) {
      currentAudio.pause();
      currentAudio.remove();
      currentAudio = null;
    }

    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
      {
        method: 'POST',
        headers: {
          'Accept': 'audio/mpeg',
          'Content-Type': 'application/json',
          'xi-api-key': apiKey
        },
        body: JSON.stringify({
          text,
          model_id: 'eleven_monolingual_v1',
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.75
          }
        })
      }
    );

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(error.error?.message || 'Failed to synthesize speech');
    }

    const audioData = await response.arrayBuffer();
    const blob = new Blob([audioData], { type: 'audio/mpeg' });
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
    console.error('ElevenLabs synthesis error:', error);
    throw error instanceof Error ? error : new Error('Failed to synthesize speech');
  }
};

export const fetchElevenLabsVoices = async (apiKey: string): Promise<TTSVoice[]> => {
  try {
    const response = await fetch('https://api.elevenlabs.io/v1/voices', {
      headers: {
        'Accept': 'application/json',
        'xi-api-key': apiKey
      }
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Invalid API key');
      }
      throw new Error('Failed to fetch voices');
    }

    const data = await response.json();
    
    if (!Array.isArray(data.voices)) {
      throw new Error('Invalid response format');
    }

    return data.voices
      .map((voice: any) => ({
        id: voice.voice_id,
        name: voice.name,
        preview_url: voice.preview_url,
        locale: 'en-US' // ElevenLabs voices are primarily English
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
  } catch (error) {
    console.error('Failed to fetch ElevenLabs voices:', error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to fetch voices');
  }
};