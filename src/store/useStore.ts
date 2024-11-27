import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { Settings, Timer, TTSProvider } from '../types';
import { updateDisplaySettings } from './utils/displaySettings';
import { speechService } from '../services/speech/SpeechService';
import { mobileSpeechService } from '../services/speech/MobileSpeechService';
import { isMobileDevice } from '../utils/deviceDetection';
import { elevenLabsService } from '../services/elevenlabs/ElevenLabsService';
import { openAIService } from '../services/openai/OpenAIService';
import { pollyService } from '../services/amazon/PollyService';
import { azureService } from '../services/microsoft/AzureService';

// Get system theme preference
const getSystemTheme = () => {
  if (typeof window !== 'undefined') {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  return 'light';
};

const defaultSettings: Settings = {
  theme: getSystemTheme(),
  brightness: 50,
  contrast: 50,
  sepia: 0,
  greyscale: 0,
  volume: 1,
  selectedVoice: '',
  highlightColor: '#b87537',
  highlightOpacity: 0.3,
  autoStartTimerAfterSutta: false,
  lastTimerDuration: 600, // 10 minutes in seconds
  ttsProvider: {
    name: 'browser',
    enabled: true,
    selectedVoiceId: '',
    selectedLocale: 'en-GB'
  },
  bellSound: 'tibetan-bowl',
  playBellAtStart: true,
  playBellAtEnd: true,
  fontFamily: 'font-sans',
  fontSize: 16
};

const createDefaultTimer = (duration: number): Timer => {
  const hours = Math.floor(duration / 3600);
  const minutes = Math.floor((duration % 3600) / 60);
  const seconds = duration % 60;

  return {
    hours,
    minutes,
    seconds,
    remainingSeconds: duration,
    isRunning: false,
    lastInputTime: duration,
    inputHours: hours,
    inputMinutes: minutes,
    inputSeconds: seconds,
    displaySeconds: duration
  };
};

export const useStore = create(
  persist(
    (set, get) => ({
      settings: defaultSettings,
      timer: createDefaultTimer(defaultSettings.lastTimerDuration),
      isReading: false,
      currentSuttaId: null,

      setCurrentSuttaId: (id: number | null) => set({ currentSuttaId: id }),
      setIsReading: (isReading: boolean) => set({ isReading }),

      updateSettings: (newSettings: Partial<Settings>) => {
        set(state => {
          const updatedSettings = { ...state.settings, ...newSettings };
          
          // If lastTimerDuration changed, update timer state
          if (newSettings.lastTimerDuration !== undefined && 
              newSettings.lastTimerDuration !== state.settings.lastTimerDuration) {
            return {
              settings: updatedSettings,
              timer: createDefaultTimer(newSettings.lastTimerDuration)
            };
          }
          
          return { settings: updatedSettings };
        });

        // Apply display settings immediately
        const updatedSettings = { ...get().settings, ...newSettings };
        updateDisplaySettings(updatedSettings);
      },

      updateTimer: (updates: Partial<Timer>) => {
        set(state => ({
          timer: { ...state.timer, ...updates }
        }));
      },

      startTimer: () => {
        const { timer } = get();
        set({
          timer: {
            ...timer,
            isRunning: true,
            remainingSeconds: timer.lastInputTime,
            displaySeconds: timer.lastInputTime
          }
        });
      },

      pauseTimer: () => {
        set(state => ({
          timer: {
            ...state.timer,
            isRunning: false
          }
        }));
      },

      resetTimer: () => {
        const { settings } = get();
        set({
          timer: createDefaultTimer(settings.lastTimerDuration)
        });
      },

      setTimerDuration: (totalSeconds: number) => {
        set(state => ({
          settings: {
            ...state.settings,
            lastTimerDuration: totalSeconds
          },
          timer: createDefaultTimer(totalSeconds)
        }));
      },

      updateTTSProvider: async (provider: Partial<TTSProvider>) => {
        const currentSettings = get().settings;
        const updatedProvider = {
          ...currentSettings.ttsProvider,
          ...provider
        };

        try {
          switch (updatedProvider.name) {
            case 'elevenlabs':
              if (updatedProvider.apiKey) {
                elevenLabsService.initialize(updatedProvider.apiKey);
                const voices = await elevenLabsService.listVoices();
                updatedProvider.voices = voices;
              }
              break;

            case 'openai':
              if (updatedProvider.apiKey) {
                openAIService.initialize(updatedProvider.apiKey);
                const voices = await openAIService.listVoices();
                updatedProvider.voices = voices;
              }
              break;

            case 'amazon':
              if (updatedProvider.accessKey && updatedProvider.secretKey) {
                pollyService.initialize(updatedProvider.accessKey, updatedProvider.secretKey);
                const voicesByLocale = await pollyService.listVoices();
                updatedProvider.voicesByLocale = voicesByLocale;
              }
              break;

            case 'microsoft':
              if (updatedProvider.apiKey && updatedProvider.region) {
                azureService.initialize(updatedProvider.apiKey, updatedProvider.region);
                const voicesByLocale = await azureService.listVoices();
                updatedProvider.voicesByLocale = voicesByLocale;
              }
              break;
          }

          if (updatedProvider.name === 'browser' && updatedProvider.selectedVoiceId) {
            const service = isMobileDevice() ? mobileSpeechService : speechService;
            await service.setVoice(updatedProvider.selectedVoiceId);
          }

          set(state => ({
            settings: {
              ...state.settings,
              ttsProvider: updatedProvider
            }
          }));
        } catch (error) {
          console.error('Failed to update TTS provider:', error);
          throw error;
        }
      },

      speak: async (text: string) => {
        const { settings } = get();
        const provider = settings.ttsProvider;
        
        if (!provider.enabled) {
          throw new Error('Text-to-speech is not enabled');
        }

        if (!provider.selectedVoiceId) {
          throw new Error('Please select a voice in settings before reading');
        }

        try {
          switch (provider.name) {
            case 'browser': {
              const service = isMobileDevice() ? mobileSpeechService : speechService;
              await service.speak(text);
              break;
            }

            case 'elevenlabs': {
              if (!provider.apiKey) throw new Error('Eleven Labs API key required');
              await elevenLabsService.synthesizeSpeech(text, provider.selectedVoiceId);
              break;
            }

            case 'openai': {
              if (!provider.apiKey) throw new Error('OpenAI API key required');
              await openAIService.synthesizeSpeech(text, provider.selectedVoiceId);
              break;
            }

            case 'amazon': {
              if (!provider.accessKey || !provider.secretKey) {
                throw new Error('Amazon credentials required');
              }
              await pollyService.synthesizeSpeech(text, provider.selectedVoiceId);
              break;
            }

            case 'microsoft': {
              if (!provider.apiKey || !provider.region) {
                throw new Error('Microsoft API key and region required');
              }
              await azureService.synthesizeSpeech(text, provider.selectedVoiceId);
              break;
            }

            default:
              throw new Error(`Unsupported TTS provider: ${provider.name}`);
          }

          await new Promise(resolve => setTimeout(resolve, 250));
        } catch (error) {
          console.error('Speech synthesis error:', error);
          throw error;
        }
      },

      previewVoice: async () => {
        const { settings } = get();
        const provider = settings.ttsProvider;
        
        if (!provider.enabled) {
          throw new Error('Text-to-speech is not enabled');
        }

        if (!provider.selectedVoiceId) {
          throw new Error('Please select a voice to preview');
        }

        const previewText = "Hello! This is a preview of how I sound.";

        try {
          await get().speak(previewText);
        } catch (error) {
          console.error('Voice preview error:', error);
          throw error;
        }
      }
    }),
    {
      name: 'metta-voice-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        settings: state.settings,
        currentSuttaId: state.currentSuttaId,
        lastTimerDuration: state.settings.lastTimerDuration
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          // Apply theme and display settings immediately after rehydration
          updateDisplaySettings(state.settings);
          
          // Initialize timer with saved duration
          const duration = state.settings.lastTimerDuration;
          state.timer = createDefaultTimer(duration);
        }
      }
    }
  )
);