import React from 'react';
import { Timer as TimerIcon } from 'lucide-react';
import { TimerWidget } from './TimerWidget';

export const Timer: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 sm:p-6">
        <div className="flex items-center space-x-2 mb-6">
          <TimerIcon className="w-6 h-6 text-primary" />
          <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200">
            Meditation Timer
          </h2>
        </div>
        <div className="w-full">
          <TimerWidget 
            readingComplete={true} 
            variant="full" 
            autoStart={false} 
            hideTitle={true} 
            transparentBg={true}
            isMainTimer={true}
          />
        </div>
      </div>
    </div>
  );
};