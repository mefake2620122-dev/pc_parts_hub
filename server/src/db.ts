import { DatabaseSync } from 'node:sqlite';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const isVercel = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);
const dataDir = isVercel ? '/tmp' : path.join(__dirname, '../data');

if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'pc_parts_hub.sqlite');

// On Vercel, copy pre-seeded SQLite database to /tmp if it doesn't exist yet
const bundledDbPath = path.join(__dirname, '../data/pc_parts_hub.sqlite');
if (isVercel && !fs.existsSync(dbPath) && fs.existsSync(bundledDbPath)) {
  try {
    fs.copyFileSync(bundledDbPath, dbPath);
    console.log('Seeded database copied to /tmp/pc_parts_hub.sqlite');
  } catch (err) {
    console.error('Failed to copy bundled SQLite DB to /tmp:', err);
  }
}

export const rawDb = new DatabaseSync(dbPath);

// Enable WAL mode & foreign keys
try {
  rawDb.exec('PRAGMA foreign_keys = ON;');
  rawDb.exec('PRAGMA journal_mode = WAL;');
} catch {
  // Ignore in environments where WAL is not supported
}

// Normalize undefined to null for SQLite parameter binding
function normalizeParams(params: any[]): any[] {
  return params.map(p => (p === undefined ? null : p));
}

export interface StatementWrapper {
  get(...params: any[]): any;
  all(...params: any[]): any[];
  run(...params: any[]): { changes: number; lastInsertRowid: number };
}

export interface DatabaseWrapper {
  exec(sql: string): void;
  prepare(sql: string): StatementWrapper;
  transaction<T extends (...args: any[]) => any>(fn: T): T;
  pragma(sql: string): any;
}

export const db: DatabaseWrapper = {
  exec(sql: string): void {
    rawDb.exec(sql);
  },

  prepare(sql: string): StatementWrapper {
    const stmt = rawDb.prepare(sql);
    return {
      get(...params: any[]) {
        const norm = normalizeParams(params);
        return stmt.get(...norm);
      },
      all(...params: any[]) {
        const norm = normalizeParams(params);
        return stmt.all(...norm);
      },
      run(...params: any[]) {
        const norm = normalizeParams(params);
        const res = stmt.run(...norm);
        return {
          changes: Number(res.changes),
          lastInsertRowid: Number(res.lastInsertRowid)
        };
      }
    };
  },

  transaction<T extends (...args: any[]) => any>(fn: T): T {
    return ((...args: any[]) => {
      rawDb.exec('BEGIN TRANSACTION;');
      try {
        const result = fn(...args);
        rawDb.exec('COMMIT;');
        return result;
      } catch (error) {
        rawDb.exec('ROLLBACK;');
        throw error;
      }
    }) as T;
  },

  pragma(str: string): any {
    try {
      const stmt = rawDb.prepare(`PRAGMA ${str}`);
      return stmt.all();
    } catch {
      return [];
    }
  }
};

export function initDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS admins (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      name TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      icon TEXT DEFAULT '',
      image TEXT DEFAULT '',
      description TEXT DEFAULT '',
      sort_order INTEGER DEFAULT 0,
      is_active INTEGER DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_code TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      category_id INTEGER NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
      brand TEXT NOT NULL,
      model TEXT DEFAULT '',
      price REAL NOT NULL,
      condition TEXT NOT NULL, -- 'Like New', 'Excellent', 'Good', 'Fair'
      stock_status TEXT NOT NULL DEFAULT 'IN_STOCK', -- 'IN_STOCK', 'LOW_STOCK', 'SOLD_OUT'
      quantity INTEGER NOT NULL DEFAULT 1,
      description TEXT DEFAULT '',
      specifications TEXT DEFAULT '{}', -- JSON string of specs
      is_featured INTEGER DEFAULT 0,
      is_new_arrival INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS product_images (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
      image_url TEXT NOT NULL,
      is_primary INTEGER DEFAULT 0,
      sort_order INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS combos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      description TEXT DEFAULT '',
      price REAL NOT NULL,
      image TEXT DEFAULT '',
      stock_status TEXT NOT NULL DEFAULT 'IN_STOCK',
      is_featured INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS combo_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      combo_id INTEGER NOT NULL REFERENCES combos(id) ON DELETE CASCADE,
      product_id INTEGER REFERENCES products(id) ON DELETE SET NULL,
      custom_label TEXT DEFAULT ''
    );

    CREATE TABLE IF NOT EXISTS site_settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS enquiries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id INTEGER REFERENCES products(id) ON DELETE SET NULL,
      product_name TEXT DEFAULT '',
      type TEXT NOT NULL, -- 'WHATSAPP' or 'CALL'
      ip_hash TEXT DEFAULT '',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Create indexes for performance
    CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
    CREATE INDEX IF NOT EXISTS idx_products_stock ON products(stock_status);
    CREATE INDEX IF NOT EXISTS idx_products_featured ON products(is_featured);
    CREATE INDEX IF NOT EXISTS idx_products_new ON products(is_new_arrival);
    CREATE INDEX IF NOT EXISTS idx_products_price ON products(price);
  `);
}
