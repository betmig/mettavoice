import React, { useState, useEffect, useRef } from 'react';
import { BookOpen, ExternalLink, Link as LinkIcon, Loader2, ArrowUp } from 'lucide-react';
import { useStore } from '../store/useStore';
import { InterfaceControls } from './controls/InterfaceControls';
import { TimerToggle } from './controls/TimerToggle';
import { TimerWidget } from './TimerWidget';
import { SuttaText } from './SuttaText';
import { initDatabase, getRandomSutta, getSutta, type Sutta } from '../db';
import { formatText } from '../utils/textFormatting';
import { prepareSpeechText, calculatePauseDuration, validateTTSProvider } from '../utils/speechUtils';

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
    const validationError = validateTTSProvider(settings.ttsProvider);
    if (validationError) {
      setError(validationError);
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
          const cleanedText = prepareSpeechText(phrases[i]);
          await speak(cleanedText);
          
          if (readingRef.current) {
            const pauseDuration = calculatePauseDuration(phrases[i]);
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
      <div className="component-container p-6">
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
      </div>

      <div className="component-container p-6">
        <div className={settings.fontFamily}>
          <h2 
            className="text-2xl font-bold text-gray-800 dark:text-white mb-6"
            style={{ fontSize: `${settings.fontSize + 12}px` }}
          >
            {currentSutta?.title || 'Daily Sutta'}
          </h2>

          <div className="font-sans mb-6">
            {currentSutta?.source && (
              <div className="flex flex-col gap-3">
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
            )}
          </div>

          <div ref={textContainerRef}>
            {currentSutta ? (
              <SuttaText
                content={currentSutta.content}
                currentPhraseIndex={currentPhraseIndex}
                highlightColor={settings.highlightColor}
                highlightOpacity={settings.highlightOpacity}
                fontSize={settings.fontSize}
              />
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

          <div className="mt-10 flex justify-center">
            <button
              onClick={scrollToTop}
              className="flex items-center gap-2 px-6 py-3 bg-primary text-gray-900 dark:text-gray-900 rounded-xl hover:bg-primary-hover transition-colors"
            >
              <ArrowUp size={20} />
              <span>Back to Top</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};