import React, { useEffect, useRef } from 'react';
import { Play, Square, RotateCcw, Volume2, Timer as TimerIcon } from 'lucide-react';
import { useStore } from '../store/useStore';
import { useTimerStore } from '../store/timerStore';
import { audioService } from '../services/AudioService';
import type { BellSound } from '../types';

const BELL_OPTIONS: { value: BellSound; label: string }[] = [
  { value: 'tibetan-bowl', label: 'Tibetan Bowl' },
  { value: 'zen-bell', label: 'Zen Bell' },
  { value: 'meditation-bell', label: 'Meditation Bell' },
  { value: 'temple-bell', label: 'Temple Bell' }
];

interface TimerWidgetProps {
  readingComplete: boolean;
  variant?: 'compact' | 'full' | 'minimal';
  autoStart?: boolean;
  hideTitle?: boolean;
  transparentBg?: boolean;
  isMainTimer?: boolean;
}

export const TimerWidget: React.FC<TimerWidgetProps> = ({ 
  readingComplete, 
  variant = 'compact',
  autoStart = true,
  hideTitle = false,
  transparentBg = false,
  isMainTimer = false
}) => {
  const { settings, updateSettings } = useStore();
  const {
    mainTimer,
    widgetTimer,
    updateMainTimer,
    updateWidgetTimer,
    startMainTimer,
    startWidgetTimer,
    pauseMainTimer,
    pauseWidgetTimer,
    resetMainTimer,
    resetWidgetTimer,
    setMainTimerDuration,
    setWidgetTimerDuration,
    initializeTimers
  } = useTimerStore();

  const timer = isMainTimer ? mainTimer : widgetTimer;
  const updateTimer = isMainTimer ? updateMainTimer : updateWidgetTimer;
  const startTimer = isMainTimer ? startMainTimer : startWidgetTimer;
  const pauseTimer = isMainTimer ? pauseMainTimer : pauseWidgetTimer;
  const resetTimerFn = isMainTimer ? resetMainTimer : resetWidgetTimer;
  const setTimerDuration = isMainTimer ? setMainTimerDuration : setWidgetTimerDuration;

  const timerInterval = useRef<NodeJS.Timeout | null>(null);
  const autoStartTriggered = useRef(false);
  const isFinishing = useRef(false);
  const initialized = useRef(false);

  // Initialize timers with saved duration
  useEffect(() => {
    if (!initialized.current) {
      initializeTimers(settings.lastTimerDuration);
      initialized.current = true;
    }
  }, [settings.lastTimerDuration, initializeTimers]);

  useEffect(() => {
    if (autoStart && settings.autoStartTimerAfterSutta && readingComplete && !timer.isRunning && !autoStartTriggered.current) {
      autoStartTriggered.current = true;
      handleStartPause();
    }
  }, [readingComplete, timer.isRunning, settings.autoStartTimerAfterSutta, autoStart]);

  useEffect(() => {
    if (timer.isRunning && !timerInterval.current) {
      timerInterval.current = setInterval(() => {
        if (timer.remainingSeconds <= 1) {
          handleTimerFinish();
        } else {
          updateTimer({ 
            remainingSeconds: timer.remainingSeconds - 1,
            displaySeconds: timer.remainingSeconds - 1
          });
        }
      }, 1000);
    }

    return () => {
      if (timerInterval.current) {
        clearInterval(timerInterval.current);
        timerInterval.current = null;
      }
    };
  }, [timer.isRunning, timer.remainingSeconds]);

  const playBell = async () => {
    try {
      await audioService.play(settings.bellSound);
    } catch (error) {
      console.error('Failed to play bell:', error);
    }
  };

  const handleTimerFinish = async () => {
    if (!isFinishing.current) {
      isFinishing.current = true;

      if (timerInterval.current) {
        clearInterval(timerInterval.current);
        timerInterval.current = null;
      }

      pauseTimer();
      resetTimerFn(timer.lastInputTime);

      if (settings.playBellAtEnd) {
        await playBell();
      }

      isFinishing.current = false;
    }
  };

  const handleStartPause = () => {
    if (!timer.isRunning) {
      startTimer();
      if (settings.playBellAtStart) {
        playBell().catch(console.error);
      }
    } else {
      if (timerInterval.current) {
        clearInterval(timerInterval.current);
        timerInterval.current = null;
      }
      audioService.stop();
      pauseTimer();
    }
  };

  const handleReset = () => {
    if (timerInterval.current) {
      clearInterval(timerInterval.current);
      timerInterval.current = null;
    }
    audioService.stop();
    resetTimerFn(timer.lastInputTime);
    autoStartTriggered.current = false;
    isFinishing.current = false;
  };

  const handleHoursChange = (increment: boolean) => {
    const newHours = increment 
      ? (timer.inputHours + 1) % 24 
      : timer.inputHours > 0 ? timer.inputHours - 1 : 23;
    
    const totalSeconds = (newHours * 3600) + (timer.inputMinutes * 60) + timer.inputSeconds;
    
    updateTimer({ 
      inputHours: newHours,
      hours: newHours,
      remainingSeconds: totalSeconds,
      displaySeconds: totalSeconds,
      lastInputTime: totalSeconds
    });

    if (isMainTimer) {
      updateSettings({ lastTimerDuration: totalSeconds });
    }
  };

  const handleMinutesChange = (increment: boolean) => {
    const newMinutes = increment 
      ? (timer.inputMinutes + 1) % 60 
      : timer.inputMinutes > 0 ? timer.inputMinutes - 1 : 59;
    
    const totalSeconds = (timer.inputHours * 3600) + (newMinutes * 60) + timer.inputSeconds;
    
    updateTimer({ 
      inputMinutes: newMinutes,
      minutes: newMinutes,
      remainingSeconds: totalSeconds,
      displaySeconds: totalSeconds,
      lastInputTime: totalSeconds
    });

    if (isMainTimer) {
      updateSettings({ lastTimerDuration: totalSeconds });
    }
  };

  const formatTime = (seconds: number): string => {
    if (isNaN(seconds)) {
      return '00:00';
    }
    
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    
    if (h > 0) {
      return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    }
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  if (variant === 'minimal') {
    return (
      <div className={`rounded-xl p-4 ${
        transparentBg ? 'component-container-inner' : 'component-container'
      }`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <TimerIcon size={16} className="text-gray-600 dark:text-gray-400" />
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Meditation Timer
              </span>
            </div>
            <div className="text-xl font-mono text-gray-800 dark:text-gray-200 tabular-nums">
              {formatTime(timer.displaySeconds || timer.remainingSeconds)}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleStartPause}
              className="flex items-center justify-center h-10 px-4 bg-primary text-gray-900 dark:text-gray-900 rounded-lg transition-all duration-200 ease-in-out hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label={timer.isRunning ? 'Stop meditation timer' : 'Start meditation timer'}
              title={timer.isRunning ? 'Stop' : 'Start'}
              disabled={isFinishing.current}
            >
              {timer.isRunning ? <Square size={18} /> : <Play size={18} />}
            </button>
            <button
              onClick={handleReset}
              className="flex items-center justify-center h-10 px-4 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-all duration-200 ease-in-out"
              aria-label="Reset timer"
              title="Reset"
            >
              <RotateCcw size={18} />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`rounded-xl ${
      transparentBg ? 'component-container-inner' : 'component-container'
    } p-4`}>
      {!hideTitle && (
        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-3">
          Meditation Timer
        </h3>
      )}

      {timer.isRunning ? (
        <div className="text-5xl font-mono text-gray-800 dark:text-gray-200 mb-6 text-center tabular-nums">
          {formatTime(timer.displaySeconds || timer.remainingSeconds)}
        </div>
      ) : (
        <div className="flex flex-col items-center space-y-4 mb-6">
          <div className="grid grid-cols-3 gap-4 text-4xl font-mono text-gray-800 dark:text-gray-200">
            <div className="flex flex-col items-center">
              <button
                onClick={() => handleHoursChange(true)}
                className="p-2 text-xl text-gray-600 dark:text-gray-400 hover:text-primary dark:hover:text-primary disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={timer.isRunning}
                aria-label="Increase hours"
              >
                ▲
              </button>
              <div className="h-[1.5em] flex items-center justify-center">
                {String(timer.inputHours).padStart(2, '0')}
              </div>
              <button
                onClick={() => handleHoursChange(false)}
                className="p-2 text-xl text-gray-600 dark:text-gray-400 hover:text-primary dark:hover:text-primary disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={timer.isRunning}
                aria-label="Decrease hours"
              >
                ▼
              </button>
            </div>
            <div className="flex items-center justify-center">
              <span className="text-gray-400 dark:text-gray-500">:</span>
            </div>
            <div className="flex flex-col items-center">
              <button
                onClick={() => handleMinutesChange(true)}
                className="p-2 text-xl text-gray-600 dark:text-gray-400 hover:text-primary dark:hover:text-primary disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={timer.isRunning}
                aria-label="Increase minutes"
              >
                ▲
              </button>
              <div className="h-[1.5em] flex items-center justify-center">
                {String(timer.inputMinutes).padStart(2, '0')}
              </div>
              <button
                onClick={() => handleMinutesChange(false)}
                className="p-2 text-xl text-gray-600 dark:text-gray-400 hover:text-primary dark:hover:text-primary disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={timer.isRunning}
                aria-label="Decrease minutes"
              >
                ▼
              </button>
            </div>
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400 text-center">
            Hours : Minutes
          </div>
        </div>
      )}

      <div className="space-y-4 mt-6">
        <div className="flex items-center justify-between">
          <label className="text-sm text-gray-600 dark:text-gray-400">
            Bell Sound
          </label>
          <select
            value={settings.bellSound}
            onChange={(e) => updateSettings({ bellSound: e.target.value as BellSound })}
            className="px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 border border-gray-300 dark:border-gray-600"
            disabled={timer.isRunning}
          >
            {BELL_OPTIONS.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-wrap gap-4">
          <label className="flex items-center space-x-2">
            <div className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={settings.playBellAtStart}
                onChange={(e) => updateSettings({ playBellAtStart: e.target.checked })}
                disabled={timer.isRunning}
              />
              <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/25 dark:peer-focus:ring-primary/25 rounded-full peer dark:bg-gray-600 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary"></div>
            </div>
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Play at Start
            </span>
          </label>
          <label className="flex items-center space-x-2">
            <div className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={settings.playBellAtEnd}
                onChange={(e) => updateSettings({ playBellAtEnd: e.target.checked })}
                disabled={timer.isRunning}
              />
              <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/25 dark:peer-focus:ring-primary/25 rounded-full peer dark:bg-gray-600 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary"></div>
            </div>
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Play at End
            </span>
          </label>
        </div>

        <div className="flex items-center space-x-2">
          <Volume2 size={16} className="text-gray-600 dark:text-gray-400" />
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={settings.volume}
            onChange={(e) => updateSettings({ volume: parseFloat(e.target.value) })}
            className="flex-1"
            disabled={timer.isRunning}
          />
          <span className="text-sm text-gray-600 dark:text-gray-400 w-12 text-right">
            {Math.round(settings.volume * 100)}%
          </span>
        </div>
      </div>

      <div className="flex items-center space-x-4 mt-6">
        <button
          onClick={handleStartPause}
          className="flex-1 flex items-center justify-center space-x-2 h-12 px-6 bg-primary text-gray-900 dark:text-gray-900 rounded-lg hover:bg-primary-hover transition-all duration-200 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label={timer.isRunning ? 'Stop meditation timer' : 'Start meditation timer'}
          disabled={isFinishing.current}
        >
          {timer.isRunning ? <Square size={20} /> : <Play size={20} />}
          <span>{timer.isRunning ? 'Stop' : 'Start'}</span>
        </button>

      </div>
    </div>
  );
};