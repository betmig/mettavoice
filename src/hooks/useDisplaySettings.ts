import { useCallback } from 'react';
import debounce from 'lodash/debounce';
import type { Settings } from '../types';

const DEBOUNCE_DELAY = 16; // Approximately 1 frame at 60fps

export const useDisplaySettings = () => {
  const applyTheme = useCallback((theme: 'light' | 'dark') => {
    document.documentElement.classList.remove('light', 'dark');
    document.documentElement.classList.add(theme);
  }, []);

  const applyFilters = useCallback(
    debounce((settings: Settings) => {
      requestAnimationFrame(() => {
        document.documentElement.style.filter = [
          `brightness(${settings.brightness}%)`,
          `contrast(${settings.contrast}%)`,
          `sepia(${settings.sepia}%)`,
          `grayscale(${settings.greyscale}%)`
        ].join(' ');
      });
    }, DEBOUNCE_DELAY),
    []
  );

  const updateDisplaySettings = useCallback((settings: Settings) => {
    applyTheme(settings.theme);
    applyFilters(settings);
  }, [applyTheme, applyFilters]);

  return { updateDisplaySettings };
};