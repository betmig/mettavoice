import React, { useState, useEffect } from 'react';
import { Sun, Moon, Scale, Shield, Settings2, Volume2, RotateCcw, Mic, Layout, RefreshCw } from 'lucide-react';
import { useStore } from '../store/useStore';
import { VoiceSelector } from './VoiceSelector';
import { ThemeToggle } from './ThemeToggle';

const DEFAULT_DISPLAY_SETTINGS = {
  brightness: 50,
  contrast: 50,
  sepia: 0,
  greyscale: 0
};

const FONT_FAMILIES = {
  'font-sans': 'Sans Serif',
  'font-serif': 'Serif',
  'font-mono': 'Monospace',
  'font-dyslexic': 'OpenDyslexic'
} as const;

const ttsProviders = [
  {
    name: 'browser' as const,
    label: 'Browser TTS',
    description: 'Use built-in browser text-to-speech',
    requiresAuth: false,
  },
  {
    name: 'amazon' as const,
    label: 'Amazon Polly',
    description: 'AWS Polly text-to-speech service',
    requiresAuth: true,
    fields: ['accessKey', 'secretKey']
  },
  {
    name: 'elevenlabs' as const,
    label: 'Eleven Labs',
    description: 'High-quality AI voices with natural prosody',
    requiresAuth: true,
    fields: ['apiKey']
  },
  {
    name: 'openai' as const,
    label: 'OpenAI TTS',
    description: 'High-quality voices powered by OpenAI',
    requiresAuth: true,
    fields: ['apiKey']
  },
  {
    name: 'microsoft' as const,
    label: 'Microsoft Azure',
    description: 'Azure Cognitive Services TTS',
    requiresAuth: true,
    fields: ['apiKey', 'region']
  },
  {
    name: 'wellsaid' as const,
    label: 'WellSaid Labs',
    description: 'Natural-sounding AI voices',
    requiresAuth: true,
    fields: ['apiKey']
  }
];

export const Settings: React.FC = () => {
  const { settings, updateSettings, updateTTSProvider, previewVoice } = useStore();
  const [activeTab, setActiveTab] = useState<'display' | 'tts'>('display');
  const [showAdvancedTTS, setShowAdvancedTTS] = useState(false);
  const [isPreviewPlaying, setIsPreviewPlaying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [apiKeyInputs, setApiKeyInputs] = useState<{ [key: string]: string }>({});

  const handleApiKeyChange = (provider: string, value: string, field: string = 'apiKey') => {
    setApiKeyInputs(prev => ({ ...prev, [`${provider}-${field}`]: value }));
  };

  const handleApiKeyBlur = async (provider: string, field: string = 'apiKey') => {
    const value = apiKeyInputs[`${provider}-${field}`];
    if (value !== undefined) {
      try {
        if (provider === 'amazon') {
          const accessKey = field === 'accessKey' ? value : settings.ttsProvider.accessKey;
          const secretKey = field === 'secretKey' ? value : settings.ttsProvider.secretKey;
          
          if (accessKey && secretKey) {
            await updateTTSProvider({
              name: 'amazon',
              accessKey,
              secretKey,
              enabled: true
            });
          } else {
            await updateTTSProvider({ [field]: value });
          }
          return;
        }

        if (provider === 'microsoft') {
          const apiKey = field === 'apiKey' ? value : settings.ttsProvider.apiKey;
          const region = field === 'region' ? value : settings.ttsProvider.region;
          
          if (apiKey && region) {
            await updateTTSProvider({
              name: 'microsoft',
              apiKey,
              region,
              enabled: true
            });
          } else {
            await updateTTSProvider({ [field]: value });
          }
          return;
        }

        await updateTTSProvider({ [field]: value });
      } catch (error) {
        setError(error instanceof Error ? error.message : 'Failed to update API key');
      }
    }
  };

  const handleVoiceSelect = async (voiceId: string) => {
    setError(null);
    try {
      await updateTTSProvider({ selectedVoiceId: voiceId });
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to update voice');
    }
  };

  const handleLocaleSelect = async (locale: string) => {
    setError(null);
    try {
      await updateTTSProvider({ selectedLocale: locale, selectedVoiceId: undefined });
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to update locale');
    }
  };

  const handlePreviewVoice = async () => {
    setError(null);
    setIsPreviewPlaying(true);
    try {
      await previewVoice();
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to preview voice');
    } finally {
      setIsPreviewPlaying(false);
    }
  };

  const handleProviderSelect = async (providerName: string) => {
    setError(null);
    try {
      const updates: any = {
        name: providerName,
        enabled: true,
        apiKey: undefined,
        accessKey: undefined,
        secretKey: undefined,
        region: undefined,
        selectedVoiceId: undefined,
        selectedLocale: undefined,
        voices: undefined,
        voicesByLocale: undefined
      };

      if (providerName === 'amazon' && settings.ttsProvider.accessKey && settings.ttsProvider.secretKey) {
        updates.accessKey = settings.ttsProvider.accessKey;
        updates.secretKey = settings.ttsProvider.secretKey;
      } else if (providerName === 'microsoft' && settings.ttsProvider.apiKey && settings.ttsProvider.region) {
        updates.apiKey = settings.ttsProvider.apiKey;
        updates.region = settings.ttsProvider.region;
      }

      await updateTTSProvider(updates);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to update provider');
    }
  };

  const handleResetDisplaySettings = () => {
    updateSettings({
      brightness: DEFAULT_DISPLAY_SETTINGS.brightness,
      contrast: DEFAULT_DISPLAY_SETTINGS.contrast,
      sepia: DEFAULT_DISPLAY_SETTINGS.sepia,
      greyscale: DEFAULT_DISPLAY_SETTINGS.greyscale
    });
  };

  const renderDisplaySettings = () => (
    <div className="space-y-6">
      {/* Theme Toggle */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 text-center">
          Theme
        </h3>
        <div className="flex justify-center">
          <ThemeToggle />
        </div>
      </div>

      {/* Display Controls */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
            Display Controls
          </h3>
          <button
            onClick={handleResetDisplaySettings}
            className="flex items-center gap-2 px-3 py-1.5 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            title="Reset to defaults"
          >
            <RefreshCw size={16} />
            <span>Reset</span>
          </button>
        </div>

        {[
          { label: 'Brightness', value: settings.brightness, max: 100 },
          { label: 'Contrast', value: settings.contrast, max: 100 },
          { label: 'Sepia', value: settings.sepia, max: 100 },
          { label: 'Greyscale', value: settings.greyscale, max: 100 }
        ].map(({ label, value, max }) => (
          <div key={label} className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {label}
              </label>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {value}%
              </span>
            </div>
            <input
              type="range"
              min="0"
              max={max}
              value={value}
              onChange={(e) => updateSettings({ [label.toLowerCase()]: Number(e.target.value) })}
              className="w-full"
            />
          </div>
        ))}
      </div>

      {/* Text Settings */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
          Text Settings
        </h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Font Family
            </label>
            <select
              value={settings.fontFamily}
              onChange={(e) => updateSettings({ fontFamily: e.target.value })}
              className="w-full px-3 py-2 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 border border-gray-300 dark:border-gray-600"
            >
              {Object.entries(FONT_FAMILIES).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Font Size
              </label>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {settings.fontSize}px
              </span>
            </div>
            <input
              type="range"
              min="12"
              max="36"
              step="1"
              value={settings.fontSize}
              onChange={(e) => updateSettings({ fontSize: Number(e.target.value) })}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
              <span>12px</span>
              <span>36px</span>
            </div>
            <div className="mt-2 p-3 bg-gray-100 dark:bg-gray-700 rounded space-y-3">
              <p className={`text-gray-800 dark:text-gray-200 ${settings.fontFamily}`} style={{ fontSize: `${settings.fontSize}px` }}>
                Preview text size with {FONT_FAMILIES[settings.fontFamily as keyof typeof FONT_FAMILIES]}
              </p>
              <p className={`text-gray-600 dark:text-gray-400 ${settings.fontFamily}`} style={{ fontSize: `${settings.fontSize}px` }}>
                The quick brown fox jumps over the lazy dog
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderTTSSettings = () => (
    <div className="space-y-6">
      {error && (
        <div className="mb-4 p-3 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-200 rounded-lg">
          {error}
        </div>
      )}

      {/* Browser TTS */}
      <div className="p-4 rounded-lg border-2 border-primary bg-primary bg-opacity-5">
        <label className="flex items-start space-x-3">
          <div className="relative inline-flex items-center cursor-pointer">
            <input
              type="radio"
              name="ttsProvider"
              checked={settings.ttsProvider.name === 'browser'}
              onChange={() => handleProviderSelect('browser')}
              className="sr-only peer"
            />
            <div className="w-5 h-5 bg-white dark:bg-gray-700 border-2 border-gray-300 dark:border-gray-600 rounded-full peer peer-checked:border-primary peer-checked:bg-primary"></div>
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <span className="font-medium text-gray-900 dark:text-gray-100">
                Browser Text-to-Speech
              </span>
            </div>
            <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">
              Use your browser's built-in text-to-speech capabilities
            </p>
          </div>
        </label>

        {settings.ttsProvider.name === 'browser' && (
          <VoiceSelector
            provider={settings.ttsProvider}
            isPreviewPlaying={isPreviewPlaying}
            onVoiceSelect={handleVoiceSelect}
            onLocaleSelect={handleLocaleSelect}
            onPreviewVoice={handlePreviewVoice}
          />
        )}
      </div>

      {/* Advanced TTS Providers */}
      <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
        <button
          onClick={() => setShowAdvancedTTS(!showAdvancedTTS)}
          className="w-full flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        >
          <span className="font-medium text-gray-700 dark:text-gray-300">
            Advanced TTS Providers
          </span>
          <span className="transform transition-transform duration-200">
            {showAdvancedTTS ? '▼' : '▶'}
          </span>
        </button>

        {showAdvancedTTS && (
          <div className="p-4 space-y-4">
            {ttsProviders.slice(1).map((provider) => (
              <div
                key={provider.name}
                className={`p-4 rounded-lg border-2 transition-colors ${
                  settings.ttsProvider.name === provider.name
                    ? 'border-primary bg-primary bg-opacity-5'
                    : 'border-gray-200 dark:border-gray-700'
                }`}
              >
                <label className="flex items-start space-x-3">
                  <div className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="radio"
                      name="ttsProvider"
                      checked={settings.ttsProvider.name === provider.name}
                      onChange={() => handleProviderSelect(provider.name)}
                      className="sr-only peer"
                    />
                    <div className="w-5 h-5 bg-white dark:bg-gray-700 border-2 border-gray-300 dark:border-gray-600 rounded-full peer peer-checked:border-primary peer-checked:bg-primary"></div>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <span className="font-medium text-gray-900 dark:text-gray-100">
                        {provider.label}
                      </span>
                      <span className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-2 py-1 rounded">
                        Requires API Key
                      </span>
                    </div>
                    <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">
                      {provider.description}
                    </p>

                    {settings.ttsProvider.name === provider.name && (
                      <div className="mt-3 space-y-3">
                        {provider.fields.includes('apiKey') && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                              API Key
                            </label>
                            <input
                              type="password"
                              value={apiKeyInputs[`${provider.name}-apiKey`] ?? settings.ttsProvider.apiKey ?? ''}
                              onChange={(e) => handleApiKeyChange(provider.name, e.target.value)}
                              onBlur={() => handleApiKeyBlur(provider.name)}
                              className="w-full px-3 py-2 border rounded-md text-sm bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 border-gray-300 dark:border-gray-600"
                              placeholder={`Enter your ${provider.label} API key`}
                            />
                          </div>
                        )}

                        {provider.fields.includes('accessKey') && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                              Access Key ID
                            </label>
                            <input
                              type="password"
                              value={apiKeyInputs[`${provider.name}-accessKey`] ?? settings.ttsProvider.accessKey ?? ''}
                              onChange={(e) => handleApiKeyChange(provider.name, e.target.value, 'accessKey')}
                              onBlur={() => handleApiKeyBlur(provider.name, 'accessKey')}
                              className="w-full px-3 py-2 border rounded-md text-sm bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 border-gray-300 dark:border-gray-600"
                              placeholder="Enter your Access Key ID"
                            />
                          </div>
                        )}

                        {provider.fields.includes('secretKey') && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                              Secret Access Key
                            </label>
                            <input
                              type="password"
                              value={apiKeyInputs[`${provider.name}-secretKey`] ?? settings.ttsProvider.secretKey ?? ''}
                              onChange={(e) => handleApiKeyChange(provider.name, e.target.value, 'secretKey')}
                              onBlur={() => handleApiKeyBlur(provider.name, 'secretKey')}
                              className="w-full px-3 py-2 border rounded-md text-sm bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 border-gray-300 dark:border-gray-600"
                              placeholder="Enter your Secret Access Key"
                            />
                          </div>
                        )}

                        {provider.fields.includes('region') && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                              Region
                              <span className="text-red-500 ml-1">*</span>
                            </label>
                            <input
                              type="text"
                              value={apiKeyInputs[`${provider.name}-region`] ?? settings.ttsProvider.region ?? ''}
                              onChange={(e) => handleApiKeyChange(provider.name, e.target.value, 'region')}
                              onBlur={() => handleApiKeyBlur(provider.name, 'region')}
                              className="w-full px-3 py-2 border rounded-md text-sm bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 border-gray-300 dark:border-gray-600"
                              placeholder="e.g., eastus (required)"
                            />
                          </div>
                        )}

                        {(provider.name === 'amazon' ? 
                          (settings.ttsProvider.accessKey && settings.ttsProvider.secretKey) :
                          provider.name === 'microsoft' ?
                            (settings.ttsProvider.apiKey && settings.ttsProvider.region) :
                            settings.ttsProvider.apiKey) && (
                          <VoiceSelector
                            provider={settings.ttsProvider}
                            isPreviewPlaying={isPreviewPlaying}
                            onVoiceSelect={handleVoiceSelect}
                            onLocaleSelect={handleLocaleSelect}
                            onPreviewVoice={handlePreviewVoice}
                          />
                        )}
                      </div>
                    )}
                  </div>
                </label>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Volume Control */}
      <div>
        <label htmlFor="volume-control" className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
          Volume
        </label>
        <div className="flex items-center gap-2">
          <Volume2 size={20} className="text-gray-700 dark:text-gray-300" />
          <div className="flex-1 flex items-center gap-2">
            <input
              id="volume-control"
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={settings.volume}
              onChange={(e) => updateSettings({ volume: parseFloat(e.target.value) })}
              className="flex-1"
            />
            <span className="text-sm font-mono text-gray-600 dark:text-gray-400 w-12 text-right">
              {Math.round(settings.volume * 100)}%
            </span>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 space-y-8">
      <section className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center space-x-2">
            <Settings2 className="w-6 h-6 text-primary" />
            <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200">
              Settings
            </h2>
          </div>
        </div>

        {/* Centered Tab Buttons */}
        <div className="flex justify-center mb-6">
          <div className="inline-flex bg-gray-100 dark:bg-gray-700/50 rounded-lg p-1">
            <button
              onClick={() => setActiveTab('display')}
              className={`flex items-center justify-center space-x-2 px-4 py-2 rounded-lg transition-all duration-200 ${
                activeTab === 'display'
                  ? 'bg-primary text-gray-900 dark:text-gray-900 shadow-sm'
                  : 'text-gray-800 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              <Layout size={20} />
              <span>Display</span>
            </button>
            <button
              onClick={() => setActiveTab('tts')}
              className={`flex items-center justify-center space-x-2 px-4 py-2 rounded-lg transition-all duration-200 ${
                activeTab === 'tts'
                  ? 'bg-primary text-gray-900 dark:text-gray-900 shadow-sm'
                  : 'text-gray-800 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              <Mic size={20} />
              <span>Text-to-Speech</span>
            </button>
          </div>
        </div>

        {activeTab === 'display' && renderDisplaySettings()}
        {activeTab === 'tts' && renderTTSSettings()}
      </section>
    </div>
  );
};