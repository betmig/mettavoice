import React, { useState, useEffect } from 'react';
import { Play, Loader2 } from 'lucide-react';
import type { TTSVoice, TTSProvider } from '../types';
import { getLocaleDisplayName } from '../utils/locales';

interface VoiceSelectorProps {
  provider: TTSProvider;
  isPreviewPlaying: boolean;
  onVoiceSelect: (voiceId: string) => void;
  onLocaleSelect: (locale: string) => void;
  onPreviewVoice: () => Promise<void>;
}

export const VoiceSelector: React.FC<VoiceSelectorProps> = ({
  provider,
  isPreviewPlaying,
  onVoiceSelect,
  onLocaleSelect,
  onPreviewVoice
}) => {
  const [browserVoices, setBrowserVoices] = useState<SpeechSynthesisVoice[]>([]);

  useEffect(() => {
    const loadVoices = () => {
      const voices = window.speechSynthesis.getVoices();
      if (voices.length > 0) {
        setBrowserVoices(voices);
      }
    };

    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;

    return () => {
      window.speechSynthesis.onvoiceschanged = null;
    };
  }, []);

  const availableVoices = React.useMemo(() => {
    if (!provider.selectedLocale) return [];

    switch (provider.name) {
      case 'browser':
        return browserVoices.filter(voice => voice.lang === provider.selectedLocale);
        
      case 'amazon':
      case 'microsoft':
        return provider.voicesByLocale?.[provider.selectedLocale] || [];
        
      case 'elevenlabs':
      case 'openai':
      case 'wellsaid':
        return provider.voices || [];
        
      default:
        return [];
    }
  }, [provider, browserVoices]);

  const locales = React.useMemo(() => {
    switch (provider.name) {
      case 'browser':
        // Group browser voices by language
        return Object.entries(browserVoices.reduce((acc: { [key: string]: SpeechSynthesisVoice[] }, voice) => {
          if (!acc[voice.lang]) acc[voice.lang] = [];
          acc[voice.lang].push(voice);
          return acc;
        }, {}))
        .map(([code, voices]) => ({
          code,
          name: getLocaleDisplayName(code),
          count: voices.length
        }))
        .sort((a, b) => a.name.localeCompare(b.name));

      case 'amazon':
      case 'microsoft':
        // For multi-language providers, show all available locales
        return Object.entries(provider.voicesByLocale || {})
          .map(([locale, voices]) => ({
            code: locale,
            name: getLocaleDisplayName(locale),
            count: voices.length
          }))
          .sort((a, b) => a.name.localeCompare(b.name));

      case 'elevenlabs':
      case 'openai':
      case 'wellsaid':
        // For English-only providers, only show English
        return [{
          code: 'en-US',
          name: 'English (United States)',
          count: provider.voices?.length || 0
        }];

      default:
        return [];
    }
  }, [provider, browserVoices]);

  const hasValidCredentials = React.useMemo(() => {
    switch (provider.name) {
      case 'amazon':
        return !!(provider.accessKey && provider.secretKey);
      case 'microsoft':
        return !!(provider.apiKey && provider.region);
      case 'elevenlabs':
      case 'openai':
      case 'wellsaid':
        return !!provider.apiKey;
      default:
        return true;
    }
  }, [provider]);

  const showLocaleSelector = provider.name === 'browser' ||
    (provider.name === 'amazon' && hasValidCredentials && provider.voicesByLocale) ||
    (provider.name === 'microsoft' && hasValidCredentials && provider.voicesByLocale) ||
    ['elevenlabs', 'openai', 'wellsaid'].includes(provider.name);

  const hasVoices = locales.length > 0;

  return (
    <div className="space-y-3 mt-3">
      {showLocaleSelector && hasVoices && (
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Language & Region
          </label>
          <select
            value={provider.selectedLocale || ''}
            onChange={(e) => onLocaleSelect(e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 border border-gray-300 dark:border-gray-600"
            disabled={!hasValidCredentials}
          >
            <option value="">Select language</option>
            {locales.map((locale) => (
              <option key={locale.code} value={locale.code}>
                {`${locale.name} (${locale.count} voices)`}
              </option>
            ))}
          </select>
        </div>
      )}

      {provider.selectedLocale && availableVoices.length > 0 && (
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Voice
          </label>
          <select
            value={provider.selectedVoiceId || ''}
            onChange={(e) => onVoiceSelect(e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 border border-gray-300 dark:border-gray-600 mb-3"
            disabled={!hasValidCredentials}
          >
            <option value="">Select voice</option>
            {provider.name === 'browser' ? (
              availableVoices.map((voice) => (
                <option key={voice.voiceURI} value={voice.voiceURI}>
                  {voice.name}
                </option>
              ))
            ) : (
              availableVoices.map((voice) => (
                <option key={voice.id} value={voice.id}>
                  {voice.name}
                </option>
              ))
            )}
          </select>

          {provider.selectedVoiceId && (
            <button
              onClick={onPreviewVoice}
              disabled={isPreviewPlaying}
              className="flex items-center justify-center space-x-2 w-full px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isPreviewPlaying ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <Play size={18} />
              )}
              <span>Preview Voice</span>
            </button>
          )}
        </div>
      )}

      {!hasVoices && hasValidCredentials && (
        <p className="text-sm text-amber-600 dark:text-amber-400">
          No voices available. Please check your credentials and try again.
        </p>
      )}
    </div>
  );
};