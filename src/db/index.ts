import { sampleSuttas } from './sampleData';

export interface Sutta {
  id: number;
  title: string;
  content: string;
  source?: string;
  sourceUrl?: string;
  category?: string;
  created_at: string;
}

// In-memory storage since we can't use SQLite in the browser
let suttas: Sutta[] = [];
let isInitialized = false;

export const initDatabase = async () => {
  try {
    if (isInitialized) return;

    // Initialize with sample data
    suttas = sampleSuttas.map((sutta, index) => ({
      id: index + 1,
      title: sutta.title,
      content: sutta.content,
      source: sutta.source,
      sourceUrl: sutta.sourceUrl,
      category: sutta.category,
      created_at: new Date().toISOString()
    }));

    isInitialized = true;
  } catch (error) {
    console.error('Failed to initialize database:', error);
    // Don't throw, just log the error and continue with empty suttas
    suttas = [];
    isInitialized = true;
  }
};

export const getSutta = (id: number): Sutta | null => {
  if (!isInitialized) {
    console.warn('Database not initialized, initializing now...');
    // Initialize synchronously in this case
    suttas = sampleSuttas.map((sutta, index) => ({
      id: index + 1,
      title: sutta.title,
      content: sutta.content,
      source: sutta.source,
      sourceUrl: sutta.sourceUrl,
      category: sutta.category,
      created_at: new Date().toISOString()
    }));
    isInitialized = true;
  }
  return suttas.find(sutta => sutta.id === id) || null;
};

export const getRandomSutta = (): Sutta | null => {
  if (!isInitialized) {
    console.warn('Database not initialized, initializing now...');
    // Initialize synchronously in this case
    suttas = sampleSuttas.map((sutta, index) => ({
      id: index + 1,
      title: sutta.title,
      content: sutta.content,
      source: sutta.source,
      sourceUrl: sutta.sourceUrl,
      category: sutta.category,
      created_at: new Date().toISOString()
    }));
    isInitialized = true;
  }
  
  if (suttas.length === 0) return null;
  const randomIndex = Math.floor(Math.random() * suttas.length);
  return suttas[randomIndex];
};

export const getAllSuttas = (): Sutta[] => {
  if (!isInitialized) {
    console.warn('Database not initialized, initializing now...');
    // Initialize synchronously in this case
    suttas = sampleSuttas.map((sutta, index) => ({
      id: index + 1,
      title: sutta.title,
      content: sutta.content,
      source: sutta.source,
      sourceUrl: sutta.sourceUrl,
      category: sutta.category,
      created_at: new Date().toISOString()
    }));
    isInitialized = true;
  }
  return [...suttas].sort((a, b) => 
    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
};