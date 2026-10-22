import { DatabaseSync } from 'node:sqlite';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { seedData } from './seed.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let globalDb = null;

const FALLBACK_SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  icon TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS products (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  description TEXT,
  slug TEXT NOT NULL UNIQUE,
  category TEXT NOT NULL,
  price INTEGER NOT NULL,
  original_price INTEGER,
  image_url TEXT NOT NULL,
  specs TEXT,
  colors TEXT,
  in_stock INTEGER DEFAULT 1,
  is_active INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (category) REFERENCES categories (slug)
);

CREATE TABLE IF NOT EXISTS orders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_number TEXT NOT NULL UNIQUE,
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  customer_neighborhood TEXT NOT NULL,
  product_id INTEGER NOT NULL,
  product_title TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  total_amount INTEGER NOT NULL,
  payment_status TEXT NOT NULL DEFAULT 'PENDING',
  fulfillment_status TEXT NOT NULL DEFAULT 'AWAITING_PROCUREMENT',
  payment_method TEXT NOT NULL,
  transaction_reference TEXT UNIQUE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (product_id) REFERENCES products (id)
);

CREATE TABLE IF NOT EXISTS admin_users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE,
  username TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS site_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
`;

export function resolveDbPath(requestedPath) {
  if (requestedPath && requestedPath !== 'wuazeshop.db') {
    return requestedPath;
  }
  if (process.env.DB_PATH) {
    return process.env.DB_PATH;
  }
  const isServerless = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);
  if (isServerless) {
    return path.join('/tmp', 'wuazeshop.db');
  }
  return path.resolve(__dirname, '../../wuazeshop.db');
}

export function initDb(dbPath = resolveDbPath()) {
  const targetPath = resolveDbPath(dbPath);
  const isServerless = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);

  // In serverless /tmp environment, copy initial database if available and not yet present in /tmp
  if (isServerless && targetPath.startsWith('/tmp') && !fs.existsSync(targetPath)) {
    const seedDbFile = path.resolve(__dirname, '../../wuazeshop.db');
    if (fs.existsSync(seedDbFile)) {
      try {
        fs.copyFileSync(seedDbFile, targetPath);
      } catch (err) {
        console.warn('[DB] Could not copy initial db file to /tmp:', err.message);
      }
    }
  }

  const db = new DatabaseSync(targetPath);

  // Enable foreign keys
  db.exec('PRAGMA foreign_keys = ON;');

  // Read and execute schema (file with fallback to embedded string)
  let schemaSql = FALLBACK_SCHEMA_SQL;
  try {
    const schemaPath = path.join(__dirname, 'schema.sql');
    if (fs.existsSync(schemaPath)) {
      schemaSql = fs.readFileSync(schemaPath, 'utf8');
    }
  } catch (err) {
    // Keep embedded fallback
  }
  db.exec(schemaSql);

  // Migration: Ensure email column exists on admin_users
  try {
    const tableInfo = db.prepare(`PRAGMA table_info(admin_users)`).all();
    const hasEmail = tableInfo.some(col => col.name === 'email');
    if (!hasEmail) {
      db.exec(`ALTER TABLE admin_users ADD COLUMN email TEXT;`);
    }
  } catch (err) {
    // Column may already exist or table not ready
  }

  // Migration: Ensure description and banner_url columns exist on categories
  try {
    const catInfo = db.prepare(`PRAGMA table_info(categories)`).all();
    if (!catInfo.some(col => col.name === 'description')) {
      db.exec(`ALTER TABLE categories ADD COLUMN description TEXT;`);
    }
    if (!catInfo.some(col => col.name === 'banner_url')) {
      db.exec(`ALTER TABLE categories ADD COLUMN banner_url TEXT;`);
    }
  } catch (err) {
    // Columns may already exist or table not ready
  }

  // Seed default data
  seedData(db);

  globalDb = db;
  return db;
}

export function getDb() {
  if (!globalDb) {
    globalDb = initDb();
  }
  return globalDb;
}

