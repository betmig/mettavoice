export type BellSound = 'tibetan-bowl' | 'zen-bell' | 'meditation-bell' | 'temple-bell';

export interface Settings {
  theme: 'light' | 'dark';
  brightness: number;
  contrast: number;
  sepia: number;
  greyscale: number;
  volume: number;
  selectedVoice: string;
  highlightColor: string;
  highlightOpacity: number;
  autoStartTimerAfterSutta: boolean;
  lastTimerDuration: number;
  ttsProvider: TTSProvider;
  bellSound: BellSound;
  playBellAtStart: boolean;
  playBellAtEnd: boolean;
  fontFamily: string;
  fontSize: number;
}

export interface Timer {
  // Input values (for display)
  inputHours: number;
  inputMinutes: number;
  inputSeconds: number;
  
  // Current timer values (for countdown)
  hours: number;
  minutes: number;
  seconds: number;
  
  // Total remaining seconds
  remainingSeconds: number;
  
  // Display seconds (for reader)
  displaySeconds: number;
  
  // Timer state
  isRunning: boolean;
  lastInputTime: number;
}

export interface TTSProvider {
  name: 'browser' | 'elevenlabs' | 'openai' | 'amazon' | 'microsoft' | 'wellsaid';
  enabled: boolean;
  apiKey?: string;
  accessKey?: string;
  secretKey?: string;
  region?: string;
  selectedVoiceId?: string;
  selectedLocale?: string;
  voices?: TTSVoice[];
  voicesByLocale?: { [locale: string]: TTSVoice[] };
}

export interface TTSVoice {
  id: string;
  name: string;
  preview_url: string | null;
  locale?: string;
}