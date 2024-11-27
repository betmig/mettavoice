import React, { useState, useEffect, useRef } from 'react';
import { BookOpen, ExternalLink, Link as LinkIcon, Loader2, ArrowUp } from 'lucide-react';
import { useStore } from '../store/useStore';
import { InterfaceControls } from './controls/InterfaceControls';
import { TimerToggle } from './controls/TimerToggle';
import { TimerWidget } from './TimerWidget';
import { initDatabase, getRandomSutta, getSutta, type Sutta } from '../db';
import { audioService } from '../services/AudioService';
import { formatText } from '../utils/textFormatting';

export const SuttaReader: React.FC = () => {
  const { settings, isReading, setIsReading, speak, currentSuttaId, setCurrentSuttaId, updateSettings } = useStore();
  const [currentSutta, setCurrentSutta] = useState<Sutta | null>(null);
  const [phrases, setPhrases] = useState<string[]>([]);
  const [currentPhraseIndex, setCurrentPhraseIndex] = useState(-1);
  const [loading, setLoading] = useState(false);
  const [readingComplete, setReadingComplete] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showTimer, setShowTimer] = useState(settings.autoStartTimerAfterSutta);
  const textContainerRef = useRef<HTMLDivElement>(null);
  const readingRef = useRef(false);
  const dbInitialized = useRef(false);
  const initializationAttempted = useRef(false);
  const timerWasVisibleBeforeReading = useRef(false);

  useEffect(() => {
    const init = async () => {
      if (initializationAttempted.current) return;
      initializationAttempted.current = true;

      try {
        await initDatabase();
        dbInitialized.current = true;

        if (currentSuttaId) {
          const sutta = getSutta(currentSuttaId);
          if (sutta) {
            setCurrentSutta(sutta);
            setPhrases(formatText(sutta.content));
          } else {
            await fetchRandomSutta();
          }
        } else {
          await fetchRandomSutta();
        }
      } catch (error) {
        console.error('Failed to initialize:', error);
        setError('Failed to load sutta. Please try again.');
      }
    };

    init();
  }, [currentSuttaId]);

  useEffect(() => {
    if (currentSutta) {
      setPhrases(formatText(currentSutta.content));
    }
  }, [currentSutta]);

  const scrollToPhrase = (index: number) => {
    if (textContainerRef.current && index >= 0) {
      const phraseElements = textContainerRef.current.getElementsByClassName('phrase');
      if (phraseElements[index]) {
        phraseElements[index].scrollIntoView({
          behavior: 'smooth',
          block: 'center',
        });
      }
    }
  };

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  const readText = async () => {
    if (!settings.ttsProvider.enabled) {
      setError('Text-to-speech is not enabled. Please enable it in settings.');
      return;
    }

    if (!settings.ttsProvider.selectedVoiceId) {
      setError('Please select a voice in settings before reading.');
      return;
    }

    try {
      timerWasVisibleBeforeReading.current = showTimer;

      setIsReading(true);
      readingRef.current = true;
      setCurrentPhraseIndex(0);
      setReadingComplete(false);
      setError(null);

      for (let i = 0; i < phrases.length && readingRef.current; i++) {
        setCurrentPhraseIndex(i);
        scrollToPhrase(i);

        try {
          await speak(phrases[i]);

          if (readingRef.current) {
            const pauseDuration = phrases[i].match(/[.!?]$/) ? 800 :
              phrases[i].match(/[,;:]$/) ? 400 :
                200;
            await new Promise(resolve => setTimeout(resolve, pauseDuration));
          }
        } catch (error) {
          console.error('Error speaking phrase:', error);
          if (readingRef.current) {
            if (error instanceof Error) {
              setError(error.message);
            } else {
              setError('Failed to read text. Please try again.');
            }
            break;
          }
        }
      }

      if (readingRef.current) {
        setReadingComplete(true);
      }
    } catch (error) {
      console.error('Failed to read text:', error);
      if (readingRef.current) {
        if (error instanceof Error) {
          setError(error.message);
        } else {
          setError('Failed to read text. Please try again.');
        }
      }
    } finally {
      readingRef.current = false;
      setIsReading(false);
      setCurrentPhraseIndex(-1);
    }
  };

  const stopReading = () => {
    readingRef.current = false;
    setIsReading(false);
    setCurrentPhraseIndex(-1);
  };

  const fetchRandomSutta = async () => {
    setLoading(true);
    setError(null);
    stopReading();
    setReadingComplete(false);

    try {
      const sutta = getRandomSutta();
      if (sutta) {
        setCurrentSutta(sutta);
        setCurrentSuttaId(sutta.id);
        setPhrases(formatText(sutta.content));
      } else {
        throw new Error('No sutta found');
      }
    } catch (error) {
      console.error('Error fetching sutta:', error);
      setError('Failed to load sutta. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleTimerToggle = (checked: boolean) => {
    setShowTimer(checked);
    updateSettings({ autoStartTimerAfterSutta: checked });
  };

  return (
    <div className="flex flex-col space-y-4">
      {/* Interface Controls */}
      <div className="component-container p-4 lg:p-6">
        <InterfaceControls
          isReading={isReading}
          loading={loading}
          readingComplete={readingComplete}
          error={error}
          currentSutta={!!currentSutta}
          onRead={readText}
          onStop={stopReading}
          onRandom={fetchRandomSutta}
        />
        <div className="py-3">
          {/* Timer Controls */}
          <TimerToggle
            showTimer={showTimer}
            onToggle={handleTimerToggle}
          />

          {showTimer && (
            <TimerWidget
              readingComplete={readingComplete}
              variant="minimal"
              autoStart={timerWasVisibleBeforeReading.current}
              transparentBg={true}
            />
          )}
        </div>

      </div>

      {/* Main Content */}
      <div className="component-container p-4 lg:p-6">
        {/* Sutta Content Area */}
        <div className={settings.fontFamily}>
          {/* Title - Affected by font settings */}
          <h2
            className="text-2xl font-bold text-gray-800 dark:text-white mb-4"
            style={{ fontSize: `${settings.fontSize + 12}px` }}
          >
            {currentSutta?.title || 'Daily Sutta'}
          </h2>

          {/* Source and Timer Controls - Not affected by font settings */}
          <div className="font-sans text-base mb-6">
            {currentSutta?.source && (
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <LinkIcon size={16} className="text-gray-600 dark:text-gray-400" />
                  {currentSutta.sourceUrl ? (
                    <a
                      href={currentSutta.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => {
                        e.preventDefault();
                        window.open(currentSutta.sourceUrl, '_blank', 'noopener,noreferrer');
                      }}
                      className="text-sm text-primary hover:text-primary-hover transition-colors flex items-center gap-1"
                    >
                      Source: {currentSutta.source}
                      <ExternalLink size={14} />
                    </a>
                  ) : (
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      Source: {currentSutta.source}
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Sutta Content - Affected by font settings */}
          <div
            ref={textContainerRef}
            className="prose dark:prose-invert max-w-none"
            style={{ fontSize: `${settings.fontSize}px` }}
          >
            {currentSutta ? (
              <div className="text-gray-700 dark:text-gray-300 leading-relaxed">
                {phrases.map((phrase, index) => (
                  <span
                    key={index}
                    className={`phrase inline transition-colors duration-300`}
                    style={{
                      backgroundColor: index === currentPhraseIndex
                        ? `${settings.highlightColor}${Math.round(settings.highlightOpacity * 255).toString(16).padStart(2, '0')}`
                        : 'transparent',
                      padding: '0.125rem 0.25rem',
                      margin: '-0.125rem 0',
                      borderRadius: '0.25rem',
                      lineHeight: '2',
                    }}
                  >
                    {phrase}
                    {phrase.match(/[.!?]$/) ? <br /> : ' '}
                  </span>
                ))}
              </div>
            ) : loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 size={32} className="animate-spin text-primary" />
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-gray-500 dark:text-gray-400">
                <BookOpen size={48} className="mb-4" />
                <p>No sutta loaded. Click Random to load one.</p>
              </div>
            )}
          </div>
        </div>

        {/* Back to Top Button - Not affected by font settings */}
        <div className="mt-8 flex justify-center font-sans">
          <button
            onClick={scrollToTop}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-gray-900 dark:text-gray-900 rounded-lg hover:bg-primary-hover transition-colors"
          >
            <ArrowUp size={20} />
            <span>Back to Top</span>
          </button>
        </div>
      </div>
    </div>
  );
};