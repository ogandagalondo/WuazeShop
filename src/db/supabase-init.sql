-- =================================================================
-- WUAZESHOP — INITIALISATION DE LA BASE DE DONNÉES SUPABASE (POSTGRESQL)
-- =================================================================
-- Exécutez ce script dans : Supabase Dashboard > SQL Editor > New Query > RUN

-- 1. Table Categories
CREATE TABLE IF NOT EXISTS categories (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  icon TEXT NOT NULL,
  description TEXT,
  banner_url TEXT,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 2. Table Products
CREATE TABLE IF NOT EXISTS products (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  slug TEXT NOT NULL UNIQUE,
  category TEXT NOT NULL REFERENCES categories (slug),
  price INTEGER NOT NULL,
  original_price INTEGER,
  image_url TEXT NOT NULL,
  images TEXT,
  specs TEXT,
  colors TEXT,
  in_stock INTEGER DEFAULT 1,
  weight REAL DEFAULT 0.4,
  is_active INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 3. Table Orders
CREATE TABLE IF NOT EXISTS orders (
  id SERIAL PRIMARY KEY,
  order_number TEXT NOT NULL UNIQUE,
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  customer_neighborhood TEXT NOT NULL,
  product_id INTEGER NOT NULL REFERENCES products (id),
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
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 4. Table Admin Users (Équipe et Collaborateurs)
CREATE TABLE IF NOT EXISTS admin_users (
  id SERIAL PRIMARY KEY,
  email TEXT UNIQUE,
  username TEXT NOT NULL UNIQUE,
  full_name TEXT,
  phone TEXT,
  role TEXT NOT NULL DEFAULT 'SUPER_ADMIN',
  permissions TEXT,
  password_hash TEXT NOT NULL,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  last_login_at TIMESTAMPTZ
);

-- 5. Table Collaborator Invitations
CREATE TABLE IF NOT EXISTS collaborator_invitations (
  id SERIAL PRIMARY KEY,
  collaborator_id INTEGER REFERENCES admin_users (id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  phone TEXT,
  role TEXT NOT NULL,
  invitation_url TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'SENT',
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 6. Table Site Settings (CMS Showcase & Paramètres Cargo)
CREATE TABLE IF NOT EXISTS site_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- =================================================================
-- INSERTION DES DONNÉES INITIALES (SEED)
-- =================================================================

-- Catégories
INSERT INTO categories (name, slug, icon, description, banner_url) VALUES
('Smartphones & Tablettes', 'smartphones', 'smartphone', 'Les plus récents smartphones flagships Apple, Samsung et Xiaomi importés directement d’usines certifiées avec garantie 12 mois.', '/images/hero-devices.jpg'),
('Ordinateurs & MacBooks', 'ordinateurs', 'laptop_mac', 'Laptops performants, ultrabooks professionnels et MacBooks Apple Silicon pour la productivité et le gaming.', '/images/promo-banner.jpg'),
('Téléviseurs & Écrans', 'televiseurs', 'tv', 'Smart TV 4K UHD, dalles OLED & QLED sans bordure avec Dolby Vision et applications intégrées.', '/images/promo-banner.jpg'),
('Audio, Casques & Écouteurs', 'audio', 'headphones', 'Casques à réduction de bruit active, écouteurs True Wireless et enceintes haute-fidélité pour audiophiles.', '/images/hero-devices.jpg'),
('Montres Connectées', 'montres', 'watch', 'Smartwatches et bracelets connectés pour le suivi santé, sport et notifications instantanées.', '/images/hero-devices.jpg'),
('Accessoires & Câbles', 'accessoires', 'electrical_services', 'Chargeurs rapides 20W/65W, câbles certifiés et coques de protection premium.', '/images/hero-devices.jpg')
ON CONFLICT (slug) DO UPDATE SET
  description = EXCLUDED.description,
  banner_url = EXCLUDED.banner_url;

-- Produits initiaux du catalogue
INSERT INTO products (title, slug, category, price, original_price, image_url, images, specs, colors, weight, in_stock) VALUES
(
  'iPhone 15 Pro Max 256GB - Titane Naturel',
  'iphone-15-pro-max-256gb',
  'smartphones',
  850000,
  945000,
  'https://lh3.googleusercontent.com/aida-public/AB6AXuA3oZiOSh4V_dQXhR1yfB2D4Biuk0f3TaCrRVJ6N8YFUKcdAs7m4TBi82JF-FkY6IUShOnKyBRKToT2NUeLrvUBaSHpbOfUsWoIk6VLiKQz-0zc353-9qCIIWTDiOGlSsnPeWlB_-CGhrz3Da7IxG1xxbOgxFTO9m8-38f-2ygBr5-q7oeY_MI1mVFuQII3VAxgrGTx30pOd0xddnEOzB1G5s4bvkO-yYv3qF7ewfU3JFEPDbT0wLCj',
  '["https://lh3.googleusercontent.com/aida-public/AB6AXuA3oZiOSh4V_dQXhR1yfB2D4Biuk0f3TaCrRVJ6N8YFUKcdAs7m4TBi82JF-FkY6IUShOnKyBRKToT2NUeLrvUBaSHpbOfUsWoIk6VLiKQz-0zc353-9qCIIWTDiOGlSsnPeWlB_-CGhrz3Da7IxG1xxbOgxFTO9m8-38f-2ygBr5-q7oeY_MI1mVFuQII3VAxgrGTx30pOd0xddnEOzB1G5s4bvkO-yYv3qF7ewfU3JFEPDbT0wLCj","/uploads/1792656440385-153988-2-1_large.jpg","/images/hero-devices.jpg"]',
  '["Puce A17 Pro","Châssis Titane","Appareil Photo 48Mpx","Garantie 1 An"]',
  '["#9c9589","#39383b","#293644"]',
  0.4,
  1
),
(
  'MacBook Air 15" M3 - 16GB RAM / 512GB SSD',
  'macbook-air-15-m3-16gb-512gb',
  'ordinateurs',
  1120000,
  1250000,
  'https://lh3.googleusercontent.com/aida-public/AB6AXuBjdlhDo-8WD0FFJ6WVxV5jVeFQef_GSaDK4eNpz6f-w5OuHzD2kGQSVegev_PS1lwVQHX08EN35glOTCrRbmjfoX_Rj774QhNOREmQK8ZgOEO5_6a5scQ0aev1ujbFC18WVrK4ACgqiTlpos-m2Cz2u8EDQNns0HP3TSM5OpkTRSHKopetwIv_i7CZzcguzSSbJa6Cep06cE2n6nHo9UP8_gFyYSDkCscgCt6_7-ptQd1MfV4suvmR',
  '["https://lh3.googleusercontent.com/aida-public/AB6AXuBjdlhDo-8WD0FFJ6WVxV5jVeFQef_GSaDK4eNpz6f-w5OuHzD2kGQSVegev_PS1lwVQHX08EN35glOTCrRbmjfoX_Rj774QhNOREmQK8ZgOEO5_6a5scQ0aev1ujbFC18WVrK4ACgqiTlpos-m2Cz2u8EDQNns0HP3TSM5OpkTRSHKopetwIv_i7CZzcguzSSbJa6Cep06cE2n6nHo9UP8_gFyYSDkCscgCt6_7-ptQd1MfV4suvmR","/images/promo-banner.jpg","/images/hero-devices.jpg"]',
  '["Puce Apple M3","18h Autonomie","Écran Liquid Retina 15.3\\"","Minuit / Argent"]',
  '["#1e2530","#d2d4d7","#f0e4d3"]',
  2.2,
  1
),
(
  'Smart TV 55" Frameless 4K UHD HDR10+ Android TV',
  'smart-tv-55-frameless-4k-uhd',
  'televiseurs',
  340000,
  390000,
  'https://lh3.googleusercontent.com/aida-public/AB6AXuCAoCZreaDQzXo7TH8NC7JN3QcNX-yLTZ6mNttOaZ-hCrgNUhLCC21W-LoErIa2dhmSXrPlGzqD6oO3lXy2RgwNVQaa71luZeR1WeXWfGc9-70DKTGGcAX1WFdhBhUulIlM7WaQk2ARTa7OZ_4nxjK9Pc40In-fcNJJrjCK2DWQiPU_z6MB4KC6-wlPOJRStY9MRc0f4ajUks_JcthPg6Dd_tj69TLEr95dH4wYqMDFZKIrwnqbodcP',
  '["https://lh3.googleusercontent.com/aida-public/AB6AXuCAoCZreaDQzXo7TH8NC7JN3QcNX-yLTZ6mNttOaZ-hCrgNUhLCC21W-LoErIa2dhmSXrPlGzqD6oO3lXy2RgwNVQaa71luZeR1WeXWfGc9-70DKTGGcAX1WFdhBhUulIlM7WaQk2ARTa7OZ_4nxjK9Pc40In-fcNJJrjCK2DWQiPU_z6MB4KC6-wlPOJRStY9MRc0f4ajUks_JcthPg6Dd_tj69TLEr95dH4wYqMDFZKIrwnqbodcP","/images/promo-banner.jpg"]',
  '["Dalle 4K UHD","Dolby Audio 20W","Android TV avec Netflix & YouTube","HDMI 2.1 & Wi-Fi"]',
  '["#1e1e1e"]',
  14.5,
  1
),
(
  'Sony WH-1000XM5 Casque Sans Fil Réduction Active',
  'sony-wh-1000xm5-noir',
  'audio',
  245000,
  270000,
  'https://lh3.googleusercontent.com/aida-public/AB6AXuDBtf1O_TqqbqtsE5eEvmaAEA_QLuqtj3_Q2z0_suXprXxImVVWWgFkHG5vSiSQJsINWn0asEqus-2xfSDUAHqjQifBQ5H_oCrpVmdliHPGrknUMmAouWr0MvWPZFaHxw-t7tD5mO2l4oEYtm2eVWeJErUuqKVhWZOl89csbdY32F0j9Zc4QFv--Q-0358HeCZkqGuhPgHmTOAEljH6GKxFWL_NO9wqpFUBAckPfsd6ykHmaeJ39l6Y',
  '["https://lh3.googleusercontent.com/aida-public/AB6AXuDBtf1O_TqqbqtsE5eEvmaAEA_QLuqtj3_Q2z0_suXprXxImVVWWgFkHG5vSiSQJsINWn0asEqus-2xfSDUAHqjQifBQ5H_oCrpVmdliHPGrknUMmAouWr0MvWPZFaHxw-t7tD5mO2l4oEYtm2eVWeJErUuqKVhWZOl89csbdY32F0j9Zc4QFv--Q-0358HeCZkqGuhPgHmTOAEljH6GKxFWL_NO9wqpFUBAckPfsd6ykHmaeJ39l6Y","/images/hero-devices.jpg"]',
  '["Réduction Active de Bruit Pro","Audio Haute Résolution LDAC","30h Autonomie"]',
  '["#1e1e1e","#d7d5cb"]',
  0.8,
  1
),
(
  'Apple Watch Ultra 2 GPS + Cellular 49mm Titane',
  'apple-watch-ultra-2-titane',
  'montres',
  590000,
  650000,
  'https://lh3.googleusercontent.com/aida-public/AB6AXuBjdlhDo-8WD0FFJ6WVxV5jVeFQef_GSaDK4eNpz6f-w5OuHzD2kGQSVegev_PS1lwVQHX08EN35glOTCrRbmjfoX_Rj774QhNOREmQK8ZgOEO5_6a5scQ0aev1ujbFC18WVrK4ACgqiTlpos-m2Cz2u8EDQNns0HP3TSM5OpkTRSHKopetwIv_i7CZzcguzSSbJa6Cep06cE2n6nHo9UP8_gFyYSDkCscgCt6_7-ptQd1MfV4suvmR',
  '["https://lh3.googleusercontent.com/aida-public/AB6AXuBjdlhDo-8WD0FFJ6WVxV5jVeFQef_GSaDK4eNpz6f-w5OuHzD2kGQSVegev_PS1lwVQHX08EN35glOTCrRbmjfoX_Rj774QhNOREmQK8ZgOEO5_6a5scQ0aev1ujbFC18WVrK4ACgqiTlpos-m2Cz2u8EDQNns0HP3TSM5OpkTRSHKopetwIv_i7CZzcguzSSbJa6Cep06cE2n6nHo9UP8_gFyYSDkCscgCt6_7-ptQd1MfV4suvmR","/images/hero-devices.jpg"]',
  '["Boîtier Titane 49mm","Autonomie 72h","GPS Double Fréquence","Écran 3000 nits"]',
  '["#9c9589","#f97316"]',
  0.3,
  1
),
(
  'Chargeur Rapide 65W GaN Dual USB-C + USB-A',
  'chargeur-rapide-65w-gan',
  'accessoires',
  25000,
  32000,
  'https://lh3.googleusercontent.com/aida-public/AB6AXuA3oZiOSh4V_dQXhR1yfB2D4Biuk0f3TaCrRVJ6N8YFUKcdAs7m4TBi82JF-FkY6IUShOnKyBRKToT2NUeLrvUBaSHpbOfUsWoIk6VLiKQz-0zc353-9qCIIWTDiOGlSsnPeWlB_-CGhrz3Da7IxG1xxbOgxFTO9m8-38f-2ygBr5-q7oeY_MI1mVFuQII3VAxgrGTx30pOd0xddnEOzB1G5s4bvkO-yYv3qF7ewfU3JFEPDbT0wLCj',
  '["https://lh3.googleusercontent.com/aida-public/AB6AXuA3oZiOSh4V_dQXhR1yfB2D4Biuk0f3TaCrRVJ6N8YFUKcdAs7m4TBi82JF-FkY6IUShOnKyBRKToT2NUeLrvUBaSHpbOfUsWoIk6VLiKQz-0zc353-9qCIIWTDiOGlSsnPeWlB_-CGhrz3Da7IxG1xxbOgxFTO9m8-38f-2ygBr5-q7oeY_MI1mVFuQII3VAxgrGTx30pOd0xddnEOzB1G5s4bvkO-yYv3qF7ewfU3JFEPDbT0wLCj"]',
  '["Technologie GaN III","Charge Rapide 65W","Compatible iPhone & MacBook","Protection Surtension"]',
  '["#ffffff","#1e1e1e"]',
  0.2,
  1
)
ON CONFLICT (slug) DO NOTHING;

-- Administrateur Fondateur (HansAdmin)
INSERT INTO admin_users (username, email, full_name, role, password_hash, is_active)
VALUES (
  'HansAdmin',
  'ogandagalondo@gmail.com',
  'Hans.L',
  'SUPER_ADMIN',
  '$2a$10$XF6nm7dH8UWZzKiuxy9B3eAJ44Dz57dDbn684Ex/jZuW6JDOKPwt.',
  1
)
ON CONFLICT (username) DO UPDATE SET
  email = EXCLUDED.email,
  full_name = EXCLUDED.full_name,
  password_hash = EXCLUDED.password_hash;

-- Configuration du CMS et Paramètres Cargo
INSERT INTO site_settings (key, value) VALUES
(
  'cargo_settings',
  '{"normalRate":10000,"normalDelay":"2 semaines","expressRate":13500,"expressDelay":"1 semaine","minWeight":0.1}'
),
(
  'announcement_bar',
  '{"enabled":true,"text":"🇨🇳 Shenzhen → 🇬🇦 Gabon | Fret cargo pesé au gramme près | Airtel Money, Moov Money et Carte Bancaire","secondaryText":"✈️ Deux formules au choix : Colis Rapide (1 semaine à 13 500 F/kg) ou Colis Normal (2 semaines à 10 000 F/kg)"}'
),
(
  'hero_section',
  '{"badge":"✦ Import direct d''usine Shenzhen","title":"Vos appareils high-tech neufs\\nau prix direct de Shenzhen","subtitle":"Commandez vos smartphones, ordinateurs et écrans au tarif d''usine. Chaque colis est vérifié à Shenzhen, expédié en vol cargo et remis en main propre à Libreville dès 10 000 FCFA le kilo.","ctaText":"Voir les produits et tarifs","ctaLink":"/categories","imageUrl":"/images/hero-devices.jpg","prop1Title":"Colis Normal : 2 semaines","prop1Sub":"10 000 FCFA par kilo","prop2Title":"Colis Rapide : 1 semaine","prop2Sub":"13 500 FCFA par kilo","prop3Title":"Airtel, Moov et CB","prop3Sub":"Règlement sécurisé en FCFA","prop4Title":"100% Neuf sous blister","prop4Sub":"Contrôle visuel avant vol"}'
)
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;
