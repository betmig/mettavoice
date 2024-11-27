import type { Settings } from '../types';

export const updateDisplaySettings = (settings: Settings) => {
  // Apply theme change immediately
  requestAnimationFrame(() => {
    // Update theme first
    document.documentElement.classList.remove('light', 'dark');
    document.documentElement.classList.add(settings.theme);

    // Keep original values between 0-100
    const brightnessValue = Math.max(0, Math.min(100, settings.brightness));
    const contrastValue = Math.max(0, Math.min(100, settings.contrast));
    const sepiaValue = Math.max(0, Math.min(100, settings.sepia));
    const grayscaleValue = Math.max(0, Math.min(100, settings.greyscale));

    // Scale brightness and contrast to appropriate ranges (50-150%)
    const scaledBrightness = 50 + brightnessValue;
    const scaledContrast = 50 + contrastValue;

    // Update CSS custom properties
    document.documentElement.style.setProperty('--brightness', `${scaledBrightness}%`);
    document.documentElement.style.setProperty('--contrast', `${scaledContrast}%`);
    document.documentElement.style.setProperty('--sepia', `${sepiaValue}%`);
    document.documentElement.style.setProperty('--grayscale', `${grayscaleValue}%`);
  });
};