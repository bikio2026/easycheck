import Database from 'better-sqlite3';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const db = new Database(join(__dirname, 'easycheck.db'));

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS restaurants (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    logo_emoji TEXT DEFAULT '🍽️',
    color TEXT DEFAULT '#10b981',
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS categories (
    id TEXT PRIMARY KEY,
    restaurant_id TEXT NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    sort_order INTEGER DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS menu_items (
    id TEXT PRIMARY KEY,
    restaurant_id TEXT NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
    category_id TEXT REFERENCES categories(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    description TEXT DEFAULT '',
    price REAL NOT NULL,
    emoji TEXT DEFAULT '🍴',
    available INTEGER DEFAULT 1,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS tables (
    id TEXT PRIMARY KEY,
    restaurant_id TEXT NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
    label TEXT NOT NULL,
    qr_code TEXT
  );

  CREATE TABLE IF NOT EXISTS sessions (
    id TEXT PRIMARY KEY,
    table_id TEXT NOT NULL REFERENCES tables(id),
    restaurant_id TEXT NOT NULL REFERENCES restaurants(id),
    status TEXT DEFAULT 'open' CHECK(status IN ('open','closed')),
    invite_code TEXT UNIQUE,
    created_at TEXT DEFAULT (datetime('now')),
    closed_at TEXT
  );

  CREATE TABLE IF NOT EXISTS diners (
    id TEXT PRIMARY KEY,
    session_id TEXT NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    avatar TEXT DEFAULT '😀',
    is_host INTEGER DEFAULT 0,
    joined_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS orders (
    id TEXT PRIMARY KEY,
    session_id TEXT NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    diner_id TEXT NOT NULL REFERENCES diners(id),
    menu_item_id TEXT NOT NULL REFERENCES menu_items(id),
    quantity INTEGER DEFAULT 1,
    notes TEXT DEFAULT '',
    status TEXT DEFAULT 'pending' CHECK(status IN ('pending','confirmed','served')),
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS payments (
    id TEXT PRIMARY KEY,
    session_id TEXT NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    diner_id TEXT NOT NULL REFERENCES diners(id),
    amount REAL NOT NULL,
    tip REAL DEFAULT 0,
    method TEXT DEFAULT 'mercadopago',
    status TEXT DEFAULT 'completed',
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS payment_items (
    payment_id TEXT NOT NULL REFERENCES payments(id) ON DELETE CASCADE,
    order_id TEXT NOT NULL REFERENCES orders(id),
    amount REAL NOT NULL,
    PRIMARY KEY (payment_id, order_id)
  );
`);

export default db;
