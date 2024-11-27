import React from 'react';
import { Timer } from 'lucide-react';

interface TimerToggleProps {
  showTimer: boolean;
  onToggle: (checked: boolean) => void;
}

export const TimerToggle: React.FC<TimerToggleProps> = ({
  showTimer,
  onToggle,
}) => {
  return (
    <label className="flex items-center justify-between bg-gray-50 dark:bg-gray-700/50 p-3 rounded-xl border border-gray-200 dark:border-gray-600 cursor-pointer">
      <div className="flex items-center gap-3">
        <Timer size={18} className="text-gray-600 dark:text-gray-400 min-w-[18px]" />
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Start Meditation Timer After Reading</span>
      </div>
      <div className="relative inline-flex items-center">
        <input
          type="checkbox"
          className="sr-only peer"
          checked={showTimer}
          onChange={(e) => onToggle(e.target.checked)}
        />
        <div className="w-9 h-5 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/25 dark:peer-focus:ring-primary/25 rounded-full peer dark:bg-gray-600 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-gray-600 peer-checked:bg-primary"></div>
      </div>
    </label>
  );
};