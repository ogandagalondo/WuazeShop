import { DatabaseSync } from 'node:sqlite';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pg from 'pg';
import { seedData } from './seed.js';

const { Pool } = pg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let globalDb = null;
let pgPool = null;

export function isPostgresConfigured() {
  if (process.env.NODE_ENV === 'test') return false;
  return Boolean(process.env.POSTGRES_URL || process.env.DATABASE_URL);
}

export function getPgPool() {
  if (!pgPool) {
    let connectionString = process.env.POSTGRES_URL || process.env.DATABASE_URL || process.env.POSTGRES_PRISMA_URL || process.env.POSTGRES_URL_NON_POOLING;
    if (!connectionString) return null;

    // Supprimer le paramètre sslmode de l'URL pour empêcher pg-connection-string de forcer verify-full
    connectionString = connectionString.replace(/([?&])sslmode=[^&]+(&|$)/, '$1').replace(/[?&]$/, '');

    pgPool = new Pool({
      connectionString,
      ssl: { rejectUnauthorized: false }
    });
    pgPool.on('error', (err) => {
      console.error('[PostgreSQL] Unexpected error on idle client:', err);
    });
  }
  return pgPool;
}

function convertSqlToPg(sql) {
  let paramIndex = 1;
  return sql.replace(/\?/g, () => `$${paramIndex++}`);
}

function normalizeParams(args) {
  if (args.length === 1 && Array.isArray(args[0])) {
    return args[0];
  }
  return args;
}

class PgStatement {
  constructor(sql) {
    this.sql = sql;
  }

  async all(...args) {
    const pool = getPgPool();
    const params = normalizeParams(args);
    const pgSql = convertSqlToPg(this.sql);
    const result = await pool.query(pgSql, params);
    return result.rows;
  }

  async get(...args) {
    const pool = getPgPool();
    const params = normalizeParams(args);
    const pgSql = convertSqlToPg(this.sql);
    const result = await pool.query(pgSql, params);
    return result.rows[0];
  }

  async run(...args) {
    const pool = getPgPool();
    const params = normalizeParams(args);
    let pgSql = convertSqlToPg(this.sql);

    const isInsert = /^\s*insert\s+/i.test(pgSql);
    const hasReturning = /returning/i.test(pgSql);
    const isSiteSettings = /insert\s+into\s+site_settings\b/i.test(pgSql);

    const appendReturning = isInsert && !hasReturning && !isSiteSettings;
    const querySql = appendReturning ? `${pgSql} RETURNING id` : pgSql;

    try {
      const result = await pool.query(querySql, params);
      return {
        changes: result.rowCount,
        lastInsertRowid: result.rows && result.rows[0] && result.rows[0].id !== undefined ? result.rows[0].id : null
      };
    } catch (err) {
      if (appendReturning && err.message && err.message.includes('column "id" does not exist')) {
        const fallbackResult = await pool.query(pgSql, params);
        return {
          changes: fallbackResult.rowCount,
          lastInsertRowid: null
        };
      }
      throw err;
    }
  }
}

class PgDbWrapper {
  constructor() {
    this.isPostgres = true;
  }

  prepare(sql) {
    return new PgStatement(sql);
  }

  async exec(sql) {
    const pool = getPgPool();
    return await pool.query(sql);
  }
}

const pgWrapperInstance = new PgDbWrapper();

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
  images TEXT,
  specs TEXT,
  colors TEXT,
  in_stock INTEGER DEFAULT 1,
  weight REAL DEFAULT 0.4,
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
  shipping_method TEXT NOT NULL DEFAULT 'normal',
  shipping_fee INTEGER NOT NULL DEFAULT 0,
  total_weight REAL NOT NULL DEFAULT 0.0,
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
  full_name TEXT,
  role TEXT NOT NULL DEFAULT 'SUPER_ADMIN',
  password_hash TEXT NOT NULL,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  last_login_at DATETIME
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
  if (dbPath !== ':memory:' && isPostgresConfigured()) {
    console.log('[DB] Mode PostgreSQL actif (Supabase).');
    return pgWrapperInstance;
  }

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

  // Migration: Ensure email, full_name, role, is_active, last_login_at, phone, permissions exist on admin_users
  try {
    const tableInfo = db.prepare(`PRAGMA table_info(admin_users)`).all();
    if (!tableInfo.some(col => col.name === 'email')) {
      db.exec(`ALTER TABLE admin_users ADD COLUMN email TEXT;`);
    }
    if (!tableInfo.some(col => col.name === 'full_name')) {
      db.exec(`ALTER TABLE admin_users ADD COLUMN full_name TEXT;`);
    }
    if (!tableInfo.some(col => col.name === 'phone')) {
      db.exec(`ALTER TABLE admin_users ADD COLUMN phone TEXT;`);
    }
    if (!tableInfo.some(col => col.name === 'role')) {
      db.exec(`ALTER TABLE admin_users ADD COLUMN role TEXT DEFAULT 'SUPER_ADMIN';`);
    }
    if (!tableInfo.some(col => col.name === 'permissions')) {
      db.exec(`ALTER TABLE admin_users ADD COLUMN permissions TEXT;`);
    }
    if (!tableInfo.some(col => col.name === 'is_active')) {
      db.exec(`ALTER TABLE admin_users ADD COLUMN is_active INTEGER DEFAULT 1;`);
    }
    if (!tableInfo.some(col => col.name === 'last_login_at')) {
      db.exec(`ALTER TABLE admin_users ADD COLUMN last_login_at DATETIME;`);
    }

    db.exec(`
      CREATE TABLE IF NOT EXISTS collaborator_invitations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        collaborator_id INTEGER,
        email TEXT NOT NULL,
        phone TEXT,
        role TEXT NOT NULL,
        invitation_url TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'SENT',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (collaborator_id) REFERENCES admin_users (id) ON DELETE CASCADE
      );
    `);
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

  // Migration: Ensure images and weight columns exist on products
  try {
    const prodInfo = db.prepare(`PRAGMA table_info(products)`).all();
    if (!prodInfo.some(col => col.name === 'images')) {
      db.exec(`ALTER TABLE products ADD COLUMN images TEXT;`);
    }
    if (!prodInfo.some(col => col.name === 'weight')) {
      db.exec(`ALTER TABLE products ADD COLUMN weight REAL DEFAULT 0.4;`);
    }
  } catch (err) {
    // Column may already exist or table not ready
  }

  // Migration: Ensure shipping columns exist on orders
  try {
    const orderInfo = db.prepare(`PRAGMA table_info(orders)`).all();
    if (!orderInfo.some(col => col.name === 'shipping_method')) {
      db.exec(`ALTER TABLE orders ADD COLUMN shipping_method TEXT DEFAULT 'normal';`);
    }
    if (!orderInfo.some(col => col.name === 'shipping_fee')) {
      db.exec(`ALTER TABLE orders ADD COLUMN shipping_fee INTEGER DEFAULT 0;`);
    }
    if (!orderInfo.some(col => col.name === 'total_weight')) {
      db.exec(`ALTER TABLE orders ADD COLUMN total_weight REAL DEFAULT 0.0;`);
    }
  } catch (err) {
    // Column may already exist or table not ready
  }

  // Seed default data
  seedData(db);

  globalDb = db;
  return db;
}

export function getDb() {
  if (isPostgresConfigured()) {
    return pgWrapperInstance;
  }
  if (!globalDb) {
    globalDb = initDb();
  }
  return globalDb;
}
