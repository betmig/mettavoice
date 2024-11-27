export const formatText = (text: string): string[] => {
  // Normalize whitespace, quotes, and dashes
  const normalizedText = text
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/\s*—\s*/g, ' — ')
    .replace(/\s+/g, ' ')
    .trim();

  // Split into sentences while preserving quotes and apostrophes
  const rawSentences = normalizedText.match(/[^.!?]+[.!?]+|\s*[.!?]+|[^.!?]+$/g) || [];
  
  // Process each sentence into natural speaking chunks
  return rawSentences.reduce((chunks: string[], sentence) => {
    const trimmedSentence = sentence.trim();
    if (!trimmedSentence) return chunks;

    // Handle punctuation-only segments
    if (/^[.!?,;:\s]+$/.test(trimmedSentence)) {
      if (chunks.length > 0) {
        chunks[chunks.length - 1] += trimmedSentence;
      }
      return chunks;
    }

    // Split into natural pauses while preserving grammatical units
    const phrases = trimmedSentence
      .split(/(?<=[:;,](?:\s|$))|(?<=\)(?:\s|$))|(?<=—(?:\s|$))|\s+(?=—\s*)/g)
      .reduce((acc: string[], part) => {
        const trimmedPart = part.trim();
        if (!trimmedPart) return acc;

        // Handle long phrases
        if (trimmedPart.length > 50) {
          // Split on natural pause points while preserving contractions
          const subPhrases = trimmedPart
            .split(/(?<=[,;:])\s+(?=[A-Z0-9])|(?<=\.\s)(?=[A-Z0-9])|(?<=\b(?:and|but|or|nor|for|so|yet|which|that|if|because|while|unless|until|although|however|therefore)\b)\s+/g)
            .map(p => p.trim())
            .filter(Boolean);

          // Combine very short phrases
          const combinedPhrases = subPhrases.reduce((combined: string[], phrase, index, array) => {
            if (phrase.length < 25 && index < array.length - 1) {
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

    // Post-process to ensure natural flow
    const processedPhrases = phrases
      .filter(Boolean)
      .map(phrase => {
        // Preserve contractions and possessives
        return phrase
          .replace(/(?<=\w)'(?=\w)/g, "'")  // Regular apostrophe for contractions
          .replace(/(?<=\w)'s\b/g, "'s")    // Regular apostrophe for possessives
          .trim();
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