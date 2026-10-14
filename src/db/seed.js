import bcrypt from 'bcryptjs';

export function seedData(db) {
  // 1. Seed Categories
  const categories = [
    { name: 'Smartphones & Tablettes', slug: 'smartphones', icon: 'smartphone' },
    { name: 'Ordinateurs & MacBooks', slug: 'ordinateurs', icon: 'laptop_mac' },
    { name: 'Téléviseurs & Écrans', slug: 'televiseurs', icon: 'tv' }
  ];

  const insertCategory = db.prepare(
    `INSERT OR IGNORE INTO categories (name, slug, icon) VALUES (?, ?, ?)`
  );
  for (const cat of categories) {
    insertCategory.run(cat.name, cat.slug, cat.icon);
  }

  // 2. Seed Products (matching Google Stitch AkibaTech prototype)
  const products = [
    {
      title: 'iPhone 15 Pro Max 256GB - Titane Naturel',
      slug: 'iphone-15-pro-max-256gb',
      category: 'smartphones',
      price: 850000,
      original_price: 945000,
      image_url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuA3oZiOSh4V_dQXhR1yfB2D4Biuk0f3TaCrRVJ6N8YFUKcdAs7m4TBi82JF-FkY6IUShOnKyBRKToT2NUeLrvUBaSHpbOfUsWoIk6VLiKQz-0zc353-9qCIIWTDiOGlSsnPeWlB_-CGhrz3Da7IxG1xxbOgxFTO9m8-38f-2ygBr5-q7oeY_MI1mVFuQII3VAxgrGTx30pOd0xddnEOzB1G5s4bvkO-yYv3qF7ewfU3JFEPDbT0wLCj',
      specs: JSON.stringify(['Puce A17 Pro', 'Châssis Titane', 'Appareil Photo 48Mpx', 'Garantie 1 An']),
      colors: JSON.stringify(['#9c9589', '#39383b', '#293644']),
      in_stock: 1
    },
    {
      title: 'MacBook Air 15" M3 - 16GB RAM / 512GB SSD',
      slug: 'macbook-air-15-m3-16gb-512gb',
      category: 'ordinateurs',
      price: 1120000,
      original_price: 1250000,
      image_url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBjdlhDo-8WD0FFJ6WVxV5jVeFQef_GSaDK4eNpz6f-w5OuHzD2kGQSVegev_PS1lwVQHX08EN35glOTCrRbmjfoX_Rj774QhNOREmQK8ZgOEO5_6a5scQ0aev1ujbFC18WVrK4ACgqiTlpos-m2Cz2u8EDQNns0HP3TSM5OpkTRSHKopetwIv_i7CZzcguzSSbJa6Cep06cE2n6nHo9UP8_gFyYSDkCscgCt6_7-ptQd1MfV4suvmR',
      specs: JSON.stringify(['Puce Apple M3', '18h Autonomie', 'Écran Liquid Retina 15.3"', 'Minuit / Argent']),
      colors: JSON.stringify(['#1e2530', '#d2d4d7', '#f0e4d3']),
      in_stock: 1
    },
    {
      title: 'Smart TV 55" Frameless 4K UHD HDR10+ Android TV',
      slug: 'smart-tv-55-frameless-4k-uhd',
      category: 'televiseurs',
      price: 340000,
      original_price: 390000,
      image_url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCAoCZreaDQzXo7TH8NC7JN3QcNX-yLTZ6mNttOaZ-hCrgNUhLCC21W-LoErIa2dhmSXrPlGzqD6oO3lXy2RgwNVQaa71luZeR1WeXWfGc9-70DKTGGcAX1WFdhBhUulIlM7WaQk2ARTa7OZ_4nxjK9Pc40In-fcNJJrjCK2DWQiPU_z6MB4KC6-wlPOJRStY9MRc0f4ajUks_JcthPg6Dd_tj69TLEr95dH4wYqMDFZKIrwnqbodcP',
      specs: JSON.stringify(['Dalle 4K UHD', 'Dolby Audio 20W', 'Android TV avec Netflix & YouTube', 'HDMI 2.1 & Wi-Fi']),
      colors: JSON.stringify(['#1e1e1e']),
      in_stock: 1
    },
    {
      title: 'Sony WH-1000XM5 Casque Sans Fil Réduction Active',
      slug: 'sony-wh-1000xm5-noir',
      category: 'smartphones',
      price: 245000,
      original_price: 270000,
      image_url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDBtf1O_TqqbqtsE5eEvmaAEA_QLuqtj3_Q2z0_suXprXxImVVWWgFkHG5vSiSQJsINWn0asEqus-2xfSDUAHqjQifBQ5H_oCrpVmdliHPGrknUMmAouWr0MvWPZFaHxw-t7tD5mO2l4oEYtm2eVWeJErUuqKVhWZOl89csbdY32F0j9Zc4QFv--Q-0358HeCZkqGuhPgHmTOAEljH6GKxFWL_NO9wqpFUBAckPfsd6ykHmaeJ39l6Y',
      specs: JSON.stringify(['Réduction Active de Bruit Pro', 'Audio Haute Résolution LDAC', '30h Autonomie']),
      colors: JSON.stringify(['#1e1e1e', '#d7d5cb']),
      in_stock: 1
    }
  ];

  const insertProduct = db.prepare(
    `INSERT OR IGNORE INTO products (title, slug, category, price, original_price, image_url, specs, colors, in_stock)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
  );
  for (const p of products) {
    insertProduct.run(p.title, p.slug, p.category, p.price, p.original_price, p.image_url, p.specs, p.colors, p.in_stock);
  }

  // 3. Seed default Admin User
  const adminCheck = db.prepare(`SELECT id FROM admin_users WHERE username = ?`).get('admin');
  if (!adminCheck) {
    const salt = bcrypt.genSaltSync(10);
    const hash = bcrypt.hashSync('adminpassword123', salt);
    db.prepare(`INSERT INTO admin_users (username, password_hash) VALUES (?, ?)`).run('admin', hash);
  }
}
