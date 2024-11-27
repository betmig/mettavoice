import type { TTSVoice } from '../types';

export const synthesizeOpenAISpeech = async (
  text: string,
  apiKey: string,
  voiceId: string
): Promise<void> => {
  try {
    const response = await fetch('https://api.openai.com/v1/audio/speech', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'tts-1',
        input: text,
        voice: voiceId,
        response_format: 'mp3'
      })
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: { message: 'Unknown error' } }));
      throw new Error(error.error?.message || 'Failed to synthesize speech');
    }

    const audioData = await response.arrayBuffer();
    const audioBlob = new Blob([audioData], { type: 'audio/mpeg' });
    const audioUrl = URL.createObjectURL(audioBlob);
    const audio = new Audio(audioUrl);

    await new Promise<void>((resolve, reject) => {
      audio.onended = () => {
        URL.revokeObjectURL(audioUrl);
        resolve();
      };
      audio.onerror = (error) => {
        URL.revokeObjectURL(audioUrl);
        reject(error);
      };
      audio.play().catch(reject);
    });
  } catch (error) {
    console.error('OpenAI TTS error:', error);
    throw error;
  }
};

// OpenAI TTS currently only supports English voices
const OPENAI_VOICES: TTSVoice[] = [
  { 
    id: 'alloy', 
    name: 'Alloy (English)', 
    preview_url: null,
    locale: 'en-US'
  },
  { 
    id: 'echo', 
    name: 'Echo (English)', 
    preview_url: null,
    locale: 'en-US'
  },
  { 
    id: 'fable', 
    name: 'Fable (English)', 
    preview_url: null,
    locale: 'en-US'
  },
  { 
    id: 'onyx', 
    name: 'Onyx (English)', 
    preview_url: null,
    locale: 'en-US'
  },
  { 
    id: 'nova', 
    name: 'Nova (English)', 
    preview_url: null,
    locale: 'en-US'
  },
  { 
    id: 'shimmer', 
    name: 'Shimmer (English)', 
    preview_url: null,
    locale: 'en-US'
  }
];

export const fetchOpenAIVoices = async (apiKey: string): Promise<TTSVoice[]> => {
  try {
    // Verify API key is valid by checking models endpoint
    const response = await fetch('https://api.openai.com/v1/models', {
      headers: {
        'Authorization': `Bearer ${apiKey}`
      }
    });

    if (!response.ok) {
      throw new Error('Invalid API key or authentication failed');
    }

    // Return the predefined voices since OpenAI only supports English
    return OPENAI_VOICES;
  } catch (error) {
    console.error('Failed to fetch OpenAI voices:', error);
    throw error;
  }
};