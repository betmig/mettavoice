import React from 'react';
import { formatText } from '../utils/textFormatting';

interface SuttaTextProps {
  content: string;
  currentPhraseIndex: number;
  highlightColor: string;
  highlightOpacity: number;
  fontSize: number;
}

export const SuttaText: React.FC<SuttaTextProps> = ({
  content,
  currentPhraseIndex,
  highlightColor,
  highlightOpacity,
  fontSize
}) => {
  const phrases = formatText(content);

  return (
    <div className="prose dark:prose-invert max-w-[65ch] mx-auto">
      <div 
        className="text-gray-800 dark:text-gray-200"
        style={{ 
          fontSize: `${fontSize}px`,
          lineHeight: '1.6'
        }}
      >
        {phrases.map((phrase, index) => {
          const isEndOfSentence = phrase.match(/[.!?]$/);
          
          return (
            <React.Fragment key={index}>
              <span
                className="phrase transition-colors duration-300"
                style={{
                  backgroundColor: index === currentPhraseIndex
                    ? `${highlightColor}${Math.round(highlightOpacity * 255).toString(16).padStart(2, '0')}`
                    : 'transparent',
                  padding: '0.125rem 0.25rem',
                  margin: '-0.125rem 0',
                  borderRadius: '0.25rem'
                }}
              >
                {phrase}
              </span>
              {isEndOfSentence ? '\n\n' : ' '}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};