export const formatText = (text: string): string[] => {
  // Pre-process text
  const cleanedText = text
    // Remove quotes for speech but preserve them for display
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    // Normalize dashes
    .replace(/\s*—\s*/g, ' — ')
    // Clean up spaces
    .replace(/\s+/g, ' ')
    .trim();

  // Split into meaningful chunks for reading
  const chunks = cleanedText
    .split(/(?<=[.!?])\s+(?=[A-Z"])/)
    .reduce((acc: string[], chunk) => {
      // For very long sentences, split on natural pause points
      if (chunk.length > 150) {
        const subChunks = chunk
          .split(/(?<=[,;:])\s+(?![^(]*\))|(?<=—)\s+(?![^(]*\))/)
          .map(sc => sc.trim())
          .filter(Boolean);
        return [...acc, ...subChunks];
      }
      return [...acc, chunk.trim()];
    }, [])
    .filter(Boolean);

  // Post-process chunks
  return chunks.map(chunk => {
    // Ensure proper spacing around punctuation
    return chunk
      .replace(/\s+([.,!?;:])/g, '$1')
      .replace(/([.,!?;:])\s+/g, '$1 ')
      .trim();
  });
};