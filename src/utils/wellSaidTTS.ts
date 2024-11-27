import type { TTSVoice } from '../types';

export const synthesizeWellSaidSpeech = async (
  text: string,
  apiKey: string,
  voiceId: string
): Promise<ArrayBuffer> => {
  try {
    const response = await fetch('https://api.wellsaidlabs.com/v1/tts/stream', {
      method: 'POST',
      headers: {
        'X-Api-Key': apiKey,
        'Accept': 'audio/mpeg',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        text,
        speaker_id: voiceId,
        format: 'mp3'
      })
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(error.error?.message || 'Failed to synthesize speech');
    }

    return await response.arrayBuffer();
  } catch (error) {
    console.error('WellSaid TTS error:', error);
    throw error;
  }
};

export const fetchWellSaidVoices = async (apiKey: string): Promise<TTSVoice[]> => {
  try {
    const response = await fetch('https://api.wellsaidlabs.com/v1/speakers/list', {
      method: 'GET',
      headers: {
        'X-Api-Key': apiKey,
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(error.error?.message || 'Failed to fetch voices');
    }

    const data = await response.json();
    
    if (!data.speakers || !Array.isArray(data.speakers)) {
      throw new Error('Invalid response format from WellSaid API');
    }

    return data.speakers.map((speaker: any) => ({
      id: speaker.speaker_id || speaker.id,
      name: speaker.name,
      preview_url: speaker.preview_url || null,
      locale: 'en-US'
    }));
  } catch (error) {
    console.error('Failed to fetch WellSaid voices:', error);
    throw error;
  }
};