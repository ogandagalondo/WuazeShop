-- Categories table
CREATE TABLE IF NOT EXISTS categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  icon TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Products table
CREATE TABLE IF NOT EXISTS products (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  description TEXT,
  slug TEXT NOT NULL UNIQUE,
  category TEXT NOT NULL,
  price INTEGER NOT NULL,          -- Price in FCFA (XAF)
  original_price INTEGER,          -- Strikethrough price in FCFA
  image_url TEXT NOT NULL,
  images TEXT,                     -- JSON array of all angle image URLs
  specs TEXT,                      -- JSON string of bullet points
  colors TEXT,                     -- JSON string of colors
  in_stock INTEGER DEFAULT 1,      -- 1 for in stock, 0 for out
  weight REAL DEFAULT 0.4,         -- Estimated shipping weight in kg
  is_active INTEGER DEFAULT 1,     -- Soft delete flag
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (category) REFERENCES categories (slug)
);

-- Orders table
CREATE TABLE IF NOT EXISTS orders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_number TEXT NOT NULL UNIQUE,
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,          -- WhatsApp number
  customer_neighborhood TEXT NOT NULL,   -- Gabon neighborhood (ex: Louis, Glass, Akébé)
  product_id INTEGER NOT NULL,
  product_title TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  total_amount INTEGER NOT NULL,         -- FCFA (items + shipping)
  shipping_method TEXT NOT NULL DEFAULT 'normal', -- normal (10000/kg) or express (13500/kg)
  shipping_fee INTEGER NOT NULL DEFAULT 0,        -- FCFA
  total_weight REAL NOT NULL DEFAULT 0.0,         -- Total weight in kg
  payment_status TEXT NOT NULL DEFAULT 'PENDING',  -- PENDING, CONFIRMED_CLEARED, FAILED
  fulfillment_status TEXT NOT NULL DEFAULT 'AWAITING_PROCUREMENT', -- AWAITING_PROCUREMENT, PURCHASED_IN_CHINA, IN_TRANSIT, ARRIVED_GABON, DELIVERED
  payment_method TEXT NOT NULL,          -- AIRTEL_MONEY, MOOV_MONEY, CREDIT_CARD, SIMULATOR
  transaction_reference TEXT UNIQUE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (product_id) REFERENCES products (id)
);

-- Admin users table (Team & Collaborators)
CREATE TABLE IF NOT EXISTS admin_users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE,
  username TEXT NOT NULL UNIQUE,
  full_name TEXT,
  phone TEXT,
  role TEXT NOT NULL DEFAULT 'SUPER_ADMIN',
  permissions TEXT,
  password_hash TEXT NOT NULL,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  last_login_at DATETIME
);

-- Collaborator invitations log table
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

-- Site settings / CMS showcase configuration table
CREATE TABLE IF NOT EXISTS site_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

