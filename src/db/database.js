import { DatabaseSync } from 'node:sqlite';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { seedData } from './seed.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let globalDb = null;

export function initDb(dbPath = 'wuazeshop.db') {
  const db = new DatabaseSync(dbPath);

  // Enable foreign keys
  db.exec('PRAGMA foreign_keys = ON;');

  // Read and execute schema
  const schemaPath = path.join(__dirname, 'schema.sql');
  const schemaSql = fs.readFileSync(schemaPath, 'utf8');
  db.exec(schemaSql);

  // Seed default data
  seedData(db);

  globalDb = db;
  return db;
}

export function getDb() {
  if (!globalDb) {
    globalDb = initDb(process.env.DB_PATH || 'wuazeshop.db');
  }
  return globalDb;
}
