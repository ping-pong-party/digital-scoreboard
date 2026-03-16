// Database initialization and management
import initSqlJs, { type Database } from 'sql.js';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { dirname } from 'path';

let db: Database | null = null;
const DB_PATH = process.env.DATABASE_PATH || './.data/app.db';

export async function database(): Promise<Database> {
  if (db) return db;

  const SQL = await initSqlJs();

  // Create data directory if it doesn't exist
  const dir = dirname(DB_PATH);
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }

  // Load existing database or create new one
  if (existsSync(DB_PATH)) {
    const buffer = readFileSync(DB_PATH);
    db = new SQL.Database(buffer);
  } else {
    db = new SQL.Database();
    await initializeSchema();
    saveDbSync();
  }

  return db;
}

async function initializeSchema(): Promise<void> {
  if (!db) throw new Error('Database not initialized');

  // Players table
  db.run(`
    CREATE TABLE IF NOT EXISTS players (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT,
      rating INTEGER NOT NULL DEFAULT 1000,
      createdAt INTEGER NOT NULL
    )
  `);

  // Matches table
  db.run(`
    CREATE TABLE IF NOT EXISTS matches (
      id TEXT PRIMARY KEY,
      playerA_id TEXT,
      playerA_ratingBefore INTEGER,
      playerA_ratingAfter INTEGER,
      playerB_id TEXT,
      playerB_ratingBefore INTEGER,
      playerB_ratingAfter INTEGER,
      scoreA INTEGER NOT NULL DEFAULT 0,
      scoreB INTEGER NOT NULL DEFAULT 0,
      status TEXT NOT NULL,
      startedAt INTEGER NOT NULL,
      completedAt INTEGER,
      createdAt INTEGER NOT NULL,
      rated INTEGER DEFAULT 1
    )
  `);

  console.log('Database schema initialized');
}

export function saveDbSync(): void {
  if (!db) return;
  const data = db.export();
  writeFileSync(DB_PATH, data);
}

let saveTimeout: NodeJS.Timeout | null = null;

export function saveDb(): void {
  if (saveTimeout) clearTimeout(saveTimeout);
  saveTimeout = setTimeout(saveDbSync, 1000);
}

// Save on exit
process.on('SIGINT', () => {
  saveDbSync();
  process.exit(0);
});

process.on('SIGTERM', () => {
  saveDbSync();
  process.exit(0);
});
