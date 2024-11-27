export const formatText = (text: string): string[] => {
  // Normalize whitespace and quotes
  const normalizedText = text
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/\s+/g, ' ')
    .trim();

  // First split into major sentence boundaries, preserving quotes
  const sentences = normalizedText
    .split(/(?<=[.!?]["']?\s+)(?=[A-Z])/g)
    .filter(Boolean);
  
  return sentences.reduce((chunks: string[], sentence) => {
    if (!sentence.trim()) return chunks;

    // Handle punctuation-only segments
    if (/^[.!?,;:\s]+$/.test(sentence)) {
      if (chunks.length > 0) {
        chunks[chunks.length - 1] += sentence;
      }
      return chunks;
    }

    // Split into natural phrases while preserving quotes and parenthetical content
    const phrases = sentence
      .split(/(?<=[:;,])\s+|(?<=["'])\s+(?=[A-Z])|(?<=\))\s+(?=[A-Z])|(?<=—)\s+(?=[A-Z])|\s+(?=—\s*[A-Z])/g)
      .reduce((acc: string[], part) => {
        const trimmedPart = part.trim();
        if (!trimmedPart) return acc;

        // For very long parts, break at natural boundaries
        if (trimmedPart.length > 60) {
          const subPhrases = trimmedPart
            .split(/(?<=\b(?:and|but|or|nor|for|so|yet|which|who|whom|whose|where|when|why|how|that|if|because|while|unless|until|although|however|therefore|moreover|furthermore|nevertheless|meanwhile|afterwards|through|between|without|within|among|about|into|onto|upon|with|from|then|thus|also|too)\b)\s+/i)
            .filter(Boolean)
            .map(p => p.trim())
            .reduce((subAcc: string[], subPhrase, index, array) => {
              // Combine very short phrases (less than 30 chars) with the next one
              if (subPhrase.length < 30 && index < array.length - 1) {
                subAcc.push(`${subPhrase} ${array[index + 1]}`);
                array[index + 1] = ''; // Mark as used
              } else if (subPhrase) {
                subAcc.push(subPhrase);
              }
              return subAcc;
            }, []);
          
          return [...acc, ...subPhrases.filter(Boolean)];
        }

        // Add normal-length phrases as is
        acc.push(trimmedPart);
        return acc;
      }, []);

    // Post-process phrases
    const processedPhrases = phrases
      .filter(Boolean)
      .map(phrase => {
        // Ensure proper spacing around dashes
        return phrase.replace(/\s*—\s*/g, ' — ').trim();
      })
      .reduce((acc: string[], phrase, index, array) => {
        // Combine very short phrases with the next one
        if (phrase.length < 30 && index < array.length - 1) {
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