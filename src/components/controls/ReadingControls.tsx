import React from 'react';
import { Volume2, RefreshCw, Loader2 } from 'lucide-react';

interface ReadingControlsProps {
  isReading: boolean;
  loading: boolean;
  currentSutta: boolean;
  onRead: () => void;
  onStop: () => void;
  onRandom: () => void;
}

export const ReadingControls: React.FC<ReadingControlsProps> = ({
  isReading,
  loading,
  currentSutta,
  onRead,
  onStop,
  onRandom,
}) => {
  return (
    <div className="flex flex-col sm:flex-row gap-4">
      <button
        onClick={isReading ? onStop : onRead}
        className="flex-1 flex items-center justify-center space-x-2 h-14 sm:h-12 px-6 bg-primary text-gray-900 dark:text-gray-900 rounded-xl hover:bg-primary-hover transition-all duration-200 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed"
        aria-label={isReading ? 'Stop reading' : 'Start reading'}
        disabled={!currentSutta || loading}
      >
        <Volume2 size={22} />
        <span className="font-medium">{isReading ? 'Stop' : 'Read'}</span>
      </button>
      <button
        onClick={onRandom}
        className="flex-1 flex items-center justify-center space-x-2 h-14 sm:h-12 px-6 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition-all duration-200 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed"
        disabled={loading}
        aria-label="Load random sutta"
      >
        {loading ? (
          <Loader2 size={22} className="animate-spin" />
        ) : (
          <RefreshCw size={22} />
        )}
        <span className="font-medium">Random</span>
      </button>
    </div>
  );
};