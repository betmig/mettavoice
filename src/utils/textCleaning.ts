export const cleanText = (text: string): string => {
    return text
      // Remove smart quotes
      .replace(/[\u2018\u2019]/g, "'")
      .replace(/[\u201C\u201D]/g, '')
      // Normalize dashes and spaces
      .replace(/\s*—\s*/g, ' — ')
      // Normalize ellipsis
      .replace(/\.{3,}/g, '...')
      // Clean up spaces around punctuation
      .replace(/\s+([.,!?;:])/g, '$1')
      .replace(/([.,!?;:])\s+/g, '$1 ')
      // Preserve paragraph breaks
      .replace(/\n{3,}/g, '\n\n')
      // Remove extra whitespace
      .replace(/\s+/g, ' ')
      .trim();
  };