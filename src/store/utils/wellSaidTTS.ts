import type { TTSVoice } from '../../types';
import { WellSaidAPI } from '../../services/wellsaid/api';
import { WellSaidError, WellSaidNetworkError, WellSaidAuthError, WellSaidServerError } from '../../services/wellsaid/errors';

const apiCache = new Map<string, WellSaidAPI>();

const getAPI = (apiKey: string): WellSaidAPI => {
  let api = apiCache.get(apiKey);
  if (!api) {
    api = new WellSaidAPI(apiKey);
    apiCache.set(apiKey, api);
  }
  return api;
};

export const synthesizeWellSaidSpeech = async (
  text: string,
  apiKey: string,
  voiceId: string
): Promise<ArrayBuffer> => {
  if (!apiKey?.trim()) {
    throw new WellSaidError('WellSaid API key is required');
  }

  try {
    const api = getAPI(apiKey.trim());
    return await api.synthesizeSpeech(text, voiceId);
  } catch (error) {
    console.error('WellSaid synthesis error:', error);
    if (error instanceof WellSaidError) {
      throw error;
    }
    throw new WellSaidError('Failed to synthesize speech');
  }
};

export const fetchWellSaidVoices = async (apiKey: string): Promise<TTSVoice[]> => {
  if (!apiKey?.trim()) {
    throw new WellSaidError('WellSaid API key is required');
  }

  try {
    const api = getAPI(apiKey.trim());
    const { speakers } = await api.listSpeakers();

    if (!Array.isArray(speakers)) {
      throw new WellSaidError('Invalid response format from WellSaid API');
    }

    return speakers
      .filter(speaker => speaker.speaker_id && speaker.name)
      .map(speaker => ({
        id: speaker.speaker_id,
        name: speaker.name,
        preview_url: speaker.preview_url || null,
        locale: speaker.language || 'en-US'
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
  } catch (error) {
    console.error('WellSaid voices error:', error);
    
    if (error instanceof WellSaidServerError) {
      throw new WellSaidError('WellSaid API is currently experiencing issues. Please try again later or contact WellSaid support if the problem persists.');
    }
    if (error instanceof WellSaidNetworkError) {
      throw new WellSaidError('Unable to connect to WellSaid API. Please check your internet connection or try again later.');
    }
    if (error instanceof WellSaidAuthError) {
      throw new WellSaidError('Invalid API key. Please check your credentials or contact WellSaid support.');
    }
    if (error instanceof WellSaidError) {
      throw error;
    }
    
    throw new WellSaidError('Failed to fetch voices from WellSaid API');
  }
};