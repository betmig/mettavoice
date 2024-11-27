import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Timer } from '../types';
import { useStore } from './useStore';

const createDefaultTimer = (duration: number): Timer => {
  if (isNaN(duration) || duration < 0) {
    duration = 600; // Fallback to 10 minutes if invalid duration
  }
  
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

interface TimerStore {
  mainTimer: Timer;
  widgetTimer: Timer;
  updateMainTimer: (updates: Partial<Timer>) => void;
  updateWidgetTimer: (updates: Partial<Timer>) => void;
  startMainTimer: () => void;
  startWidgetTimer: () => void;
  pauseMainTimer: () => void;
  pauseWidgetTimer: () => void;
  resetMainTimer: (duration: number) => void;
  resetWidgetTimer: (duration: number) => void;
  setMainTimerDuration: (totalSeconds: number) => void;
  setWidgetTimerDuration: (totalSeconds: number) => void;
  initializeTimers: (duration: number) => void;
}

export const useTimerStore = create<TimerStore>()(
  persist(
    (set, get) => ({
      mainTimer: createDefaultTimer(600),
      widgetTimer: createDefaultTimer(600),

      initializeTimers: (duration: number) => {
        set({
          mainTimer: createDefaultTimer(duration),
          widgetTimer: createDefaultTimer(duration)
        });
      },

      updateMainTimer: (updates: Partial<Timer>) => {
        set(state => ({
          mainTimer: { ...state.mainTimer, ...updates }
        }));
      },

      updateWidgetTimer: (updates: Partial<Timer>) => {
        set(state => ({
          widgetTimer: { ...state.widgetTimer, ...updates }
        }));
      },

      startMainTimer: () => {
        const { mainTimer } = get();
        set({
          mainTimer: {
            ...mainTimer,
            isRunning: true,
            remainingSeconds: mainTimer.lastInputTime,
            displaySeconds: mainTimer.lastInputTime
          }
        });
      },

      startWidgetTimer: () => {
        const { widgetTimer } = get();
        set({
          widgetTimer: {
            ...widgetTimer,
            isRunning: true,
            remainingSeconds: widgetTimer.lastInputTime,
            displaySeconds: widgetTimer.lastInputTime
          }
        });
      },

      pauseMainTimer: () => {
        set(state => ({
          mainTimer: {
            ...state.mainTimer,
            isRunning: false
          }
        }));
      },

      pauseWidgetTimer: () => {
        set(state => ({
          widgetTimer: {
            ...state.widgetTimer,
            isRunning: false
          }
        }));
      },

      resetMainTimer: (duration: number) => {
        set({
          mainTimer: createDefaultTimer(duration)
        });
      },

      resetWidgetTimer: (duration: number) => {
        set({
          widgetTimer: createDefaultTimer(duration)
        });
      },

      setMainTimerDuration: (totalSeconds: number) => {
        set({
          mainTimer: createDefaultTimer(totalSeconds)
        });
      },

      setWidgetTimerDuration: (totalSeconds: number) => {
        set({
          widgetTimer: createDefaultTimer(totalSeconds)
        });
      }
    }),
    {
      name: 'metta-voice-timer-storage',
      partialize: (state) => ({
        mainTimer: {
          lastInputTime: state.mainTimer.lastInputTime,
          inputHours: state.mainTimer.inputHours,
          inputMinutes: state.mainTimer.inputMinutes,
          inputSeconds: state.mainTimer.inputSeconds
        },
        widgetTimer: {
          lastInputTime: state.widgetTimer.lastInputTime,
          inputHours: state.widgetTimer.inputHours,
          inputMinutes: state.widgetTimer.inputMinutes,
          inputSeconds: state.widgetTimer.inputSeconds
        }
      })
    }
  )
);