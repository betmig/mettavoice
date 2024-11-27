export const formatText = (text: string): string[] => {
  // Pre-process text to handle quotes and special characters
  const preprocessedText = text
    // Remove smart quotes and replace with regular quotes
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    // Normalize dashes and spaces
    .replace(/\s*—\s*/g, ' — ')
    .replace(/\s+/g, ' ')
    .trim();

  // Split into sentences while preserving quotes
  const sentences = preprocessedText.match(/[^.!?]+[.!?]+|\s*[.!?]+|[^.!?]+$/g) || [];
  
  return sentences.reduce((chunks: string[], sentence) => {
    const trimmedSentence = sentence.trim();
    if (!trimmedSentence) return chunks;

    // Handle punctuation-only segments
    if (/^[.!?,;:\s]+$/.test(trimmedSentence)) {
      if (chunks.length > 0) {
        chunks[chunks.length - 1] += trimmedSentence;
      }
      return chunks;
    }

    // Split into phrases while preserving quotes
    const phrases = trimmedSentence
      .split(/(?<=[,;:](?:\s|$))|(?<=\)(?:\s|$))|(?<=—(?:\s|$))|\s+(?=—\s*)/g)
      .reduce((acc: string[], part) => {
        const trimmedPart = part.trim();
        if (!trimmedPart) return acc;

        // Handle quoted text as a single unit
        if (/"[^"]*"/.test(trimmedPart)) {
          acc.push(trimmedPart);
          return acc;
        }

        // Handle long phrases
        if (trimmedPart.length > 50) {
          // Split on natural pause points, preserving quotes
          const subPhrases = trimmedPart
            .split(/(?<=[,;:])\s+(?=[^"]*(?:"[^"]*"[^"]*)*$)|(?<=\.\s)(?=[A-Z0-9])|(?<=\b(?:and|but|or|nor|for|so|yet|which|that|if|because|while|unless|until|although|however|therefore)\b)\s+(?=[^"]*(?:"[^"]*"[^"]*)*$)/g)
            .map(p => p.trim())
            .filter(Boolean);

          // Combine very short phrases unless they contain quotes
          const combinedPhrases = subPhrases.reduce((combined: string[], phrase, index, array) => {
            if (phrase.length < 25 && index < array.length - 1 && !/"/.test(phrase + array[index + 1])) {
              combined.push(`${phrase} ${array[index + 1]}`);
              array[index + 1] = ''; // Mark as used
            } else if (phrase) {
              combined.push(phrase);
            }
            return combined;
          }, []);

          return [...acc, ...combinedPhrases.filter(Boolean)];
        }

        acc.push(trimmedPart);
        return acc;
      }, []);

    // Post-process phrases
    const processedPhrases = phrases
      .filter(Boolean)
      .map(phrase => {
        // Remove quotes from text that will be spoken
        return phrase.replace(/"/g, '').trim();
      })
      .reduce((acc: string[], phrase, index, array) => {
        // Combine short phrases more intelligently
        if (
          phrase.length < 25 && 
          index < array.length - 1 && 
          !phrase.endsWith('—') && 
          !array[index + 1].startsWith('—')
        ) {
          acc.push(`${phrase} ${array[index + 1]}`);
          array[index + 1] = ''; // Mark as used
        } else if (phrase) {
          acc.push(phrase);
        }
        return acc;
      }, []);

    return [...chunks, ...processedPhrases.filter(Boolean)];
  }, []);
};