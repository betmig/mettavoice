import Speech from 'speak-tts';
import type { Settings } from '../types';

const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

export const initializeVoice = async (defaultSettings: Settings): Promise<[Speech | null, Settings]> => {
  if (typeof window === 'undefined') {
    return [null, defaultSettings];
  }

  const speechInstance = new Speech();
  if (!speechInstance.hasBrowserSupport()) {
    console.warn('Browser does not support speech synthesis');
    return [null, defaultSettings];
  }

  try {
    await speechInstance.init({
      volume: defaultSettings.volume,
      lang: isMobile ? 'en-US' : 'en-GB',
      splitSentences: false
    });

    // Try to set voice immediately
    const voices = window.speechSynthesis.getVoices();
    if (voices.length > 0) {
      let selectedVoice;

      if (isMobile) {
        // Mobile - prefer US English voice
        selectedVoice = voices.find(v => v.lang === 'en-US');
      } else {
        // Desktop - prefer Daniel (UK) or any UK English voice
        selectedVoice = voices.find(v => 
          v.name.toLowerCase().includes('daniel') && 
          v.lang === 'en-GB'
        ) || voices.find(v => v.lang === 'en-GB');
        
        // Fallback to US English if no UK voice found
        if (!selectedVoice) {
          selectedVoice = voices.find(v => v.lang === 'en-US');
        }
      }

      if (selectedVoice) {
        defaultSettings.ttsProvider.selectedVoiceId = selectedVoice.voiceURI;
        defaultSettings.ttsProvider.selectedLocale = selectedVoice.lang;
        speechInstance.setVoice(selectedVoice.name);
      }
    }

    return [speechInstance, defaultSettings];
  } catch (error) {
    console.error('Failed to initialize speech:', error);
    return [null, defaultSettings];
  }
};