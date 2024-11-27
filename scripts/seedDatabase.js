import Database from 'better-sqlite3';
import { join } from 'path';
import { mkdir } from 'fs/promises';

const sampleSuttas = [
  {
    title: "The Noble Dwellings",
    content: `Monks, there are these ten noble dwellings in which noble ones dwelled, dwell, and will dwell. Which ten? Here, a monk has abandoned five factors, is endowed with six factors, has one guard, maintains four supports, has removed sectarian truths, has completely given up searching, has unsullied intentions, has tranquilized bodily activity, and is well liberated in mind, well liberated by wisdom...`,
    source: "AN 10.20",
    category: "Noble Living"
  },
  {
    title: "The Four Noble Truths",
    content: `Now this, monks, is the noble truth of suffering: birth is suffering, aging is suffering, illness is suffering, death is suffering; union with what is displeasing is suffering; separation from what is pleasing is suffering; not to get what one wants is suffering; in brief, the five aggregates subject to clinging are suffering...`,
    source: "SN 56.11",
    category: "Core Teachings"
  },
  {
    title: "Mindfulness of Breathing",
    content: `And how, monks, is mindfulness of breathing developed and cultivated, so that it is of great fruit and great benefit? Here a monk, gone to the forest or to the root of a tree or to an empty hut, sits down; having folded his legs crosswise, set his body erect, and established mindfulness in front of him, ever mindful he breathes in, mindful he breathes out...`,
    source: "MN 118",
    category: "Meditation"
  },
  {
    title: "The Five Aggregates",
    content: `The five aggregates, monks, are these: the aggregate of form, the aggregate of feeling, the aggregate of perception, the aggregate of formations, the aggregate of consciousness. These are called the five aggregates. And how does one see these five aggregates as they actually are? Here, monks, one sees form as: 'This is not mine, this I am not, this is not my self.'...`,
    source: "SN 22.59",
    category: "Core Teachings"
  },
  {
    title: "Loving-Kindness",
    content: `This is what should be done by one who is skilled in goodness and who knows the path of peace: Let them be able and upright, straightforward and gentle in speech, humble and not conceited, contented and easily satisfied, unburdened with duties and frugal in their ways, peaceful and calm, and wise and skillful, not proud and demanding in nature...`,
    source: "Sn 1.8",
    category: "Heart Practices"
  }
];

// Ensure data directory exists
await mkdir(join(process.cwd(), 'data'), { recursive: true });

const dbPath = join(process.cwd(), 'data', 'suttas.db');
const db = new Database(dbPath);

// Create schema
db.exec(`
  CREATE TABLE IF NOT EXISTS suttas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    source TEXT,
    category TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

// Prepare insert statement
const insert = db.prepare(
  'INSERT INTO suttas (title, content, source, category) VALUES (?, ?, ?, ?)'
);

// Begin transaction
const transaction = db.transaction((suttas) => {
  for (const sutta of suttas) {
    insert.run(sutta.title, sutta.content, sutta.source, sutta.category);
  }
});

// Execute transaction
try {
  transaction(sampleSuttas);
  console.log('Database seeded successfully!');
} catch (error) {
  console.error('Error seeding database:', error);
  process.exit(1);
}