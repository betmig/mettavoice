import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useStore } from '../store/useStore';

export const ThemeToggle: React.FC = () => {
  const { settings, updateSettings } = useStore();
  const isDark = settings.theme === 'dark';

  return (
    <button
      onClick={() => updateSettings({ theme: isDark ? 'light' : 'dark' })}
      className={`relative w-20 h-10 rounded-full transition-all duration-500 ease-in-out ${
        isDark 
          ? 'bg-gray-700 border-2 border-primary' 
          : 'bg-gray-200 border-2 border-primary'
      }`}
      aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
    >
      {/* Track Icons */}
      <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400">
        <Sun 
          size={14} 
          className={`transform transition-all duration-500 ease-in-out ${
            isDark ? 'opacity-25 rotate-0' : 'opacity-100 rotate-90'
          }`} 
        />
      </span>
      <span className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400">
        <Moon 
          size={14} 
          className={`transform transition-all duration-500 ease-in-out ${
            isDark ? 'opacity-100 rotate-0' : 'opacity-25 rotate-90'
          }`} 
        />
      </span>

      {/* Sliding Circle */}
      <div
        className={`absolute top-1/2 -translate-y-1/2 w-8 h-8 rounded-full transform transition-all duration-500 ease-in-out ${
          isDark 
            ? 'translate-x-11 bg-primary rotate-180' 
            : 'translate-x-0.5 bg-primary rotate-0'
        } flex items-center justify-center`}
      >
        <div className="relative w-full h-full">
          <Sun 
            size={16} 
            className={`absolute inset-0 m-auto text-white transform transition-all duration-500 ease-in-out ${
              isDark ? 'opacity-0 rotate-90 scale-50' : 'opacity-100 rotate-0 scale-100'
            }`}
          />
          <Moon 
            size={16} 
            className={`absolute inset-0 m-auto text-white transform transition-all duration-500 ease-in-out ${
              isDark ? 'opacity-100 rotate-0 scale-100' : 'opacity-0 -rotate-90 scale-50'
            }`}
          />
        </div>
      </div>
    </button>
  );
};