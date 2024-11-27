export const formatText = (text: string): string[] => {
  const sentences = text.split(/([.!?]+\s+)/).filter(Boolean);
  
  return sentences.reduce((chunks: string[], sentence) => {
    if (!sentence.trim()) return chunks;

    if (/^[.!?,;:\s]+$/.test(sentence)) {
      if (chunks.length > 0) {
        chunks[chunks.length - 1] += sentence;
      }
      return chunks;
    }

    const phrases = sentence
      .split(/([,;:](?:\s+|$))/)
      .reduce((acc: string[], part) => {
        if (/^[,;:]/.test(part)) {
          if (acc.length > 0) {
            acc[acc.length - 1] += part;
          }
          return acc;
        }

        if (part.length > 100) {
          const subPhrases = part
            .split(/(\s+(?:and|but|or|nor|for|so|yet)\s+)/)
            .filter(Boolean);
          return [...acc, ...subPhrases];
        }

        if (part.trim()) {
          acc.push(part.trim());
        }
        return acc;
      }, []);

    return [...chunks, ...phrases];
  }, []);
};