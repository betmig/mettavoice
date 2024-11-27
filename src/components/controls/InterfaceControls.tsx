import React from 'react';
import { ReadingControls } from './ReadingControls';

interface InterfaceControlsProps {
  isReading: boolean;
  loading: boolean;
  readingComplete: boolean;
  error: string | null;
  currentSutta: boolean;
  onRead: () => void;
  onStop: () => void;
  onRandom: () => void;
}

export const InterfaceControls: React.FC<InterfaceControlsProps> = ({
  isReading,
  loading,
  readingComplete,
  error,
  currentSutta,
  onRead,
  onStop,
  onRandom,
}) => {
  return (
    <div className="space-y-6">
      {error && (
        <div className="p-4 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-200 rounded-xl">
          {error}
        </div>
      )}

      <div className="flex flex-col gap-6">
        <div className="w-full">
          <ReadingControls
            isReading={isReading}
            loading={loading}
            currentSutta={currentSutta}
            onRead={onRead}
            onStop={onStop}
            onRandom={onRandom}
          />
        </div>
      </div>
    </div>
  );
};