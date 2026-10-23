import { Router } from 'express';
import bcrypt from 'bcryptjs';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { authService, requireAdminAuth, requireSuperAdmin } from './auth.service.js';
import { getDb } from '../../db/database.js';
import { orderService } from '../orders/order.service.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const isServerless = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);
export const uploadDir = isServerless
  ? path.resolve('/tmp', 'uploads')
  : path.resolve(__dirname, '../../public/uploads');

try {
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }
} catch (err) {
  console.warn('[Admin] Note: uploads dir initialization deferred:', err.message);
}

export const adminRouter = Router();

// POST /api/admin/login
adminRouter.post('/admin/login', (req, res) => {
  try {
    const { email, username, password } = req.body;
    const identifier = email || username;
    if (!identifier || !password) {
      return res.status(400).json({ error: 'Adresse e-mail (ou identifiant) et mot de passe requis' });
    }
    const result = authService.login(identifier, password);
    res.json(result);
  } catch (error) {
    res.status(401).json({ error: error.message });
  }
});

// GET /api/settings - Obtenir tous les paramètres du site (public)
adminRouter.get('/settings', (req, res) => {
  try {
    const db = getDb();
    const rows = db.prepare(`SELECT key, value FROM site_settings`).all();
    const settings = {};
    for (const r of rows) {
      try {
        settings[r.key] = JSON.parse(r.value);
      } catch {
        settings[r.key] = r.value;
      }
    }
    res.json(settings);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Toutes les routes ci-dessous nécessitent une authentification admin
adminRouter.use('/admin', requireAdminAuth);

// GET /api/admin/me
adminRouter.get('/admin/me', (req, res) => {
  res.json({ authenticated: true, user: req.admin });
});

// POST /api/admin/upload - Téléverser une image produit (Base64)
adminRouter.post('/admin/upload', (req, res) => {
  try {
    const { image, dataUrl, filename } = req.body;
    const rawData = image || dataUrl;
    if (!rawData) {
      return res.status(400).json({ error: 'Fichier image (image ou dataUrl) requis' });
    }

    const matches = rawData.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) {
      return res.status(400).json({ error: 'Format d’image invalide' });
    }

    const mimeType = matches[1];
    const base64Data = matches[2];
    const buffer = Buffer.from(base64Data, 'base64');

    let ext = '.jpg';
    if (mimeType.includes('png')) ext = '.png';
    else if (mimeType.includes('webp')) ext = '.webp';
    else if (mimeType.includes('gif')) ext = '.gif';

    const nameWithoutExt = path.parse(filename || 'product').name;
    const safeBaseName = nameWithoutExt
      .toLowerCase()
      .replace(/[^a-z0-9_-]/g, '-')
      .slice(0, 30) || 'image';
    const uniqueFileName = `${Date.now()}-${safeBaseName}${ext}`;
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    const filePath = path.join(uploadDir, uniqueFileName);

    fs.writeFileSync(filePath, buffer);
    res.json({ success: true, imageUrl: `/uploads/${uniqueFileName}` });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/admin/products - Créer un produit
adminRouter.post('/admin/products', (req, res) => {
  try {
    const { title, description, category, price, originalPrice, imageUrl, specs, colors, inStock } = req.body;
    if (!title || !category || !price || !imageUrl) {
      return res.status(400).json({ error: 'Champs obligatoires manquants (title, category, price, imageUrl)' });
    }

    const slug = `${title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Date.now().toString().slice(-4)}`;
    const db = getDb();
    const stmt = db.prepare(`
      INSERT INTO products (
        title, description, slug, category, price, original_price, image_url, specs, colors, in_stock, is_active
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
    `);

    stmt.run(
      title,
      description || null,
      slug,
      category,
      Number(price),
      originalPrice ? Number(originalPrice) : null,
      imageUrl,
      specs ? JSON.stringify(specs) : null,
      colors ? JSON.stringify(colors) : null,
      inStock === false ? 0 : 1
    );

    const created = db.prepare(`SELECT * FROM products WHERE slug = ?`).get(slug);
    res.status(201).json(created);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/admin/products/:id - Mettre à jour un produit
adminRouter.put('/admin/products/:id', (req, res) => {
  try {
    const id = Number(req.params.id);
    const db = getDb();
    const existing = db.prepare(`SELECT * FROM products WHERE id = ? AND is_active = 1`).get(id);
    if (!existing) {
      return res.status(404).json({ error: 'Produit non trouvé' });
    }

    const title = req.body.title !== undefined ? req.body.title : existing.title;
    const description = req.body.description !== undefined ? req.body.description : existing.description;
    const category = req.body.category !== undefined ? req.body.category : existing.category;
    const price = req.body.price !== undefined ? Number(req.body.price) : existing.price;
    const originalPrice = req.body.originalPrice !== undefined 
      ? (req.body.originalPrice !== null && req.body.originalPrice !== '' && Number(req.body.originalPrice) > 0 ? Number(req.body.originalPrice) : null)
      : existing.original_price;
    const imageUrl = req.body.imageUrl !== undefined ? req.body.imageUrl : existing.image_url;
    const specs = req.body.specs !== undefined ? JSON.stringify(req.body.specs) : existing.specs;
    const colors = req.body.colors !== undefined ? JSON.stringify(req.body.colors) : existing.colors;
    const inStock = req.body.inStock !== undefined ? (req.body.inStock ? 1 : 0) : existing.in_stock;

    db.prepare(`
      UPDATE products 
      SET title = ?, description = ?, category = ?, price = ?, original_price = ?, image_url = ?, specs = ?, colors = ?, in_stock = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(title, description, category, price, originalPrice, imageUrl, specs, colors, inStock, id);

    const updated = db.prepare(`SELECT * FROM products WHERE id = ?`).get(id);
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PATCH /api/admin/products/:id/discount - Appliquer ou retirer une remise sur un produit
adminRouter.patch('/admin/products/:id/discount', (req, res) => {
  try {
    const id = Number(req.params.id);
    const db = getDb();
    const product = db.prepare(`SELECT * FROM products WHERE id = ? AND is_active = 1`).get(id);
    if (!product) {
      return res.status(404).json({ error: 'Produit non trouvé' });
    }

    const { action, discountPercent, discountedPrice, originalPrice } = req.body;

    if (action === 'remove') {
      const restoredPrice = product.original_price && product.original_price > product.price 
        ? product.original_price 
        : product.price;

      db.prepare(`
        UPDATE products 
        SET price = ?, original_price = NULL, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(restoredPrice, id);

      const updated = db.prepare(`SELECT * FROM products WHERE id = ?`).get(id);
      return res.json({ success: true, message: 'Remise retirée avec succès', product: updated });
    }

    let basePrice = (originalPrice && Number(originalPrice) > 0)
      ? Number(originalPrice)
      : product.price;

    let finalPrice = product.price;
    if (discountPercent !== undefined && discountPercent !== null && discountPercent !== '') {
      const pct = Number(discountPercent);
      if (isNaN(pct) || pct <= 0 || pct >= 100) {
        return res.status(400).json({ error: 'Le pourcentage de remise doit être compris entre 1% et 99%.' });
      }
      finalPrice = Math.round(basePrice * (1 - (pct / 100)));
    } else if (discountedPrice && Number(discountedPrice) > 0) {
      finalPrice = Number(discountedPrice);
    } else {
      return res.status(400).json({ error: 'Veuillez spécifier un pourcentage ou un prix remisé valide.' });
    }

    if (finalPrice >= basePrice) {
      return res.status(400).json({ error: 'Le prix remisé doit être inférieur au prix d’origine.' });
    }

    db.prepare(`
      UPDATE products 
      SET price = ?, original_price = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(finalPrice, basePrice, id);

    const updated = db.prepare(`SELECT * FROM products WHERE id = ?`).get(id);
    res.json({ success: true, message: 'Remise appliquée avec succès', product: updated });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/admin/products/batch-discount - Appliquer ou retirer une remise groupée
adminRouter.post('/admin/products/batch-discount', (req, res) => {
  try {
    const { category, discountPercent, action } = req.body;
    const db = getDb();

    let query = `SELECT * FROM products WHERE is_active = 1`;
    const params = [];
    if (category && category !== 'all') {
      query += ` AND category = ?`;
      params.push(category);
    }
    const products = db.prepare(query).all(...params);

    if (products.length === 0) {
      return res.status(404).json({ error: 'Aucun produit actif trouvé pour cette sélection.' });
    }

    let affectedCount = 0;

    if (action === 'remove') {
      const updateStmt = db.prepare(`
        UPDATE products 
        SET price = CASE WHEN original_price IS NOT NULL AND original_price > price THEN original_price ELSE price END,
            original_price = NULL,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `);

      for (const p of products) {
        updateStmt.run(p.id);
        affectedCount++;
      }

      return res.json({ 
        success: true, 
        message: `Toutes les remises ont été retirées (${affectedCount} articles réinitialisés).`,
        affectedCount 
      });
    }

    const pct = Number(discountPercent);
    if (isNaN(pct) || pct <= 0 || pct >= 100) {
      return res.status(400).json({ error: 'Pourcentage de remise invalide (doit être entre 1% et 99%).' });
    }

    const updateStmt = db.prepare(`
      UPDATE products 
      SET original_price = CASE WHEN original_price IS NOT NULL AND original_price > price THEN original_price ELSE price END,
          price = CAST(ROUND((CASE WHEN original_price IS NOT NULL AND original_price > price THEN original_price ELSE price END) * (1 - (? / 100.0))) AS INTEGER),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);

    for (const p of products) {
      updateStmt.run(pct, p.id);
      affectedCount++;
    }

    res.json({ 
      success: true, 
      message: `Remise de -${pct}% appliquée avec succès sur ${affectedCount} article(s).`,
      affectedCount,
      discountPercent: pct
    });
  } catch (error) {
    console.error('Batch discount error:', error);
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/admin/products/:id - Suppression douce (soft-delete) pour préserver l'historique
adminRouter.delete('/admin/products/:id', (req, res) => {
  try {
    const id = Number(req.params.id);
    const db = getDb();
    const existing = db.prepare(`SELECT * FROM products WHERE id = ?`).get(id);
    if (!existing) {
      return res.status(404).json({ error: 'Produit non trouvé' });
    }

    db.prepare(`UPDATE products SET is_active = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ?`).run(id);
    res.json({ success: true, message: 'Produit archivé avec succès' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/admin/categories - Créer une catégorie
adminRouter.post('/admin/categories', (req, res) => {
  try {
    const { name, slug, icon, description, bannerUrl } = req.body;
    if (!name) {
      return res.status(400).json({ error: 'Le nom de la catégorie est requis' });
    }
    const cleanSlug = (slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-')).toLowerCase();
    const db = getDb();
    const existing = db.prepare(`SELECT * FROM categories WHERE slug = ?`).get(cleanSlug);
    if (existing) {
      return res.status(400).json({ error: 'Une catégorie avec cet identifiant existe déjà' });
    }

    db.prepare(`
      INSERT INTO categories (name, slug, icon, description, banner_url)
      VALUES (?, ?, ?, ?, ?)
    `).run(name, cleanSlug, icon || 'category', description || null, bannerUrl || null);

    const created = db.prepare(`SELECT * FROM categories WHERE slug = ?`).get(cleanSlug);
    res.status(201).json(created);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/admin/categories/:id - Modifier une catégorie
adminRouter.put('/admin/categories/:id', (req, res) => {
  try {
    const id = Number(req.params.id);
    const db = getDb();
    const existing = db.prepare(`SELECT * FROM categories WHERE id = ?`).get(id);
    if (!existing) {
      return res.status(404).json({ error: 'Catégorie non trouvée' });
    }

    const { name, slug, icon, description, bannerUrl } = req.body;
    const newName = name !== undefined ? name : existing.name;
    const newSlug = slug !== undefined ? slug.toLowerCase().replace(/[^a-z0-9]+/g, '-') : existing.slug;
    const newIcon = icon !== undefined ? icon : existing.icon;
    const newDesc = description !== undefined ? description : existing.description;
    const newBanner = bannerUrl !== undefined ? bannerUrl : existing.banner_url;

    db.prepare(`
      UPDATE categories
      SET name = ?, slug = ?, icon = ?, description = ?, banner_url = ?
      WHERE id = ?
    `).run(newName, newSlug, newIcon, newDesc, newBanner, id);

    const updated = db.prepare(`SELECT * FROM categories WHERE id = ?`).get(id);
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/admin/categories/:id - Supprimer une catégorie
adminRouter.delete('/admin/categories/:id', (req, res) => {
  try {
    const id = Number(req.params.id);
    const db = getDb();
    const existing = db.prepare(`SELECT * FROM categories WHERE id = ?`).get(id);
    if (!existing) {
      return res.status(404).json({ error: 'Catégorie non trouvée' });
    }

    const prods = db.prepare(`SELECT COUNT(*) as count FROM products WHERE category = ? AND is_active = 1`).get(existing.slug);
    if (prods && prods.count > 0) {
      return res.status(400).json({ error: `Impossible de supprimer : ${prods.count} article(s) sont encore associés à ce rayon.` });
    }

    db.prepare(`DELETE FROM categories WHERE id = ?`).run(id);
    res.json({ success: true, message: 'Catégorie supprimée avec succès' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/admin/orders - Lister toutes les commandes
adminRouter.get('/admin/orders', (req, res) => {
  try {
    const db = getDb();
    const rows = db.prepare(`
      SELECT o.*, p.image_url as product_image
      FROM orders o
      LEFT JOIN products p ON o.product_id = p.id
      ORDER BY o.id DESC
    `).all();

    const orders = rows.map(r => ({
      ...r,
      orderNumber: r.order_number,
      customerName: r.customer_name,
      customerPhone: r.customer_phone,
      customerNeighborhood: r.customer_neighborhood,
      productId: r.product_id,
      productTitle: r.product_title,
      quantity: r.quantity,
      totalAmount: r.total_amount,
      paymentStatus: r.payment_status,
      fulfillmentStatus: r.fulfillment_status,
      paymentMethod: r.payment_method,
      transactionReference: r.transaction_reference,
      createdAt: r.created_at,
      updatedAt: r.updated_at
    }));

    res.json(orders);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PATCH /api/admin/orders/:orderNumber/status - Mettre à jour statuts commande et paiement
adminRouter.patch('/admin/orders/:orderNumber/status', (req, res) => {
  try {
    const { orderNumber } = req.params;
    const { fulfillmentStatus, paymentStatus } = req.body;
    const db = getDb();

    const existing = db.prepare(`SELECT * FROM orders WHERE order_number = ?`).get(orderNumber);
    if (!existing) {
      return res.status(404).json({ error: 'Commande non trouvée' });
    }

    const newFulfillment = fulfillmentStatus || existing.fulfillment_status;
    const newPayment = paymentStatus || existing.payment_status;

    db.prepare(`
      UPDATE orders 
      SET fulfillment_status = ?, payment_status = ?, updated_at = CURRENT_TIMESTAMP
      WHERE order_number = ?
    `).run(newFulfillment, newPayment, orderNumber);

    const updated = db.prepare(`SELECT * FROM orders WHERE order_number = ?`).get(orderNumber);
    res.json({
      ...updated,
      orderNumber: updated.order_number,
      customerName: updated.customer_name,
      customerPhone: updated.customer_phone,
      customerNeighborhood: updated.customer_neighborhood,
      productId: updated.product_id,
      productTitle: updated.product_title,
      quantity: updated.quantity,
      totalAmount: updated.total_amount,
      paymentStatus: updated.payment_status,
      fulfillmentStatus: updated.fulfillment_status,
      paymentMethod: updated.payment_method,
      transactionReference: updated.transaction_reference,
      createdAt: updated.created_at,
      updatedAt: updated.updated_at
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/admin/settings - Obtenir tous les réglages CMS pour l'admin
adminRouter.get('/admin/settings', (req, res) => {
  try {
    const db = getDb();
    const rows = db.prepare(`SELECT key, value FROM site_settings`).all();
    const settings = {};
    for (const r of rows) {
      try {
        settings[r.key] = JSON.parse(r.value);
      } catch {
        settings[r.key] = r.value;
      }
    }
    res.json(settings);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/admin/settings/:key - Mettre à jour une section CMS spécifique
adminRouter.put('/admin/settings/:key', (req, res) => {
  try {
    const { key } = req.params;
    const db = getDb();
    const payload = req.body.value !== undefined ? req.body.value : req.body;
    const valueStr = typeof payload === 'object' ? JSON.stringify(payload) : String(payload);

    db.prepare(`
      INSERT INTO site_settings (key, value, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = CURRENT_TIMESTAMP
    `).run(key, valueStr);

    res.json({ success: true, key, value: payload });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/admin/settings - Mettre à jour plusieurs sections CMS
adminRouter.put('/admin/settings', (req, res) => {
  try {
    const db = getDb();
    const updates = req.body;
    if (typeof updates !== 'object' || updates === null) {
      return res.status(400).json({ error: 'Payload invalide' });
    }

    const stmt = db.prepare(`
      INSERT INTO site_settings (key, value, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = CURRENT_TIMESTAMP
    `);

    for (const [key, val] of Object.entries(updates)) {
      const valStr = typeof val === 'object' ? JSON.stringify(val) : String(val);
      stmt.run(key, valStr);
    }

    res.json({ success: true, message: 'Paramètres mis à jour' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== COLLABORATORS MANAGEMENT ====================

// GET /api/admin/collaborators - Lister tous les collaborateurs (réservé Super Admin)
adminRouter.get('/admin/collaborators', requireSuperAdmin, (req, res) => {
  try {
    const db = getDb();
    const collaborators = db.prepare(`
      SELECT id, email, username, full_name, role, is_active, created_at, last_login_at
      FROM admin_users
      ORDER BY id ASC
    `).all();
    res.json(collaborators);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/admin/collaborators - Créer un nouveau collaborateur (réservé Super Admin)
adminRouter.post('/admin/collaborators', requireSuperAdmin, (req, res) => {
  try {
    const { email, username, fullName, role, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Adresse e-mail et mot de passe requis' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanUsername = username && username.trim() ? username.trim().toLowerCase() : cleanEmail.split('@')[0].replace(/[^a-zA-Z0-9_-]/g, '');
    const cleanRole = ['SUPER_ADMIN', 'GESTIONNAIRE', 'AGENT'].includes(role) ? role : 'GESTIONNAIRE';
    const cleanFullName = fullName && fullName.trim() ? fullName.trim() : cleanUsername;

    const db = getDb();
    const existing = db.prepare(`
      SELECT id FROM admin_users 
      WHERE LOWER(email) = LOWER(?) OR LOWER(username) = LOWER(?)
    `).get(cleanEmail, cleanUsername);
    if (existing) {
      return res.status(400).json({ error: 'Un collaborateur avec cette adresse email ou cet identifiant existe déjà' });
    }

    const salt = bcrypt.genSaltSync(10);
    const passwordHash = bcrypt.hashSync(password, salt);

    const result = db.prepare(`
      INSERT INTO admin_users (email, username, full_name, role, password_hash, is_active)
      VALUES (?, ?, ?, ?, ?, 1)
    `).run(cleanEmail, cleanUsername, cleanFullName, cleanRole, passwordHash);

    const newCollaborator = db.prepare(`
      SELECT id, email, username, full_name, role, is_active, created_at, last_login_at
      FROM admin_users
      WHERE id = ?
    `).get(result.lastInsertRowid);

    res.status(201).json(newCollaborator);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/admin/collaborators/:id - Mettre à jour un collaborateur (réservé Super Admin)
adminRouter.put('/admin/collaborators/:id', requireSuperAdmin, (req, res) => {
  try {
    const { id } = req.params;
    const { email, username, fullName, role, isActive, password } = req.body;
    const db = getDb();

    const existing = db.prepare(`SELECT * FROM admin_users WHERE id = ?`).get(id);
    if (!existing) {
      return res.status(404).json({ error: 'Collaborateur introuvable' });
    }

    // Protection : on ne peut pas rétrograder le dernier SUPER_ADMIN
    if (existing.role === 'SUPER_ADMIN' && role && role !== 'SUPER_ADMIN') {
      const superAdminCount = db.prepare(`SELECT COUNT(*) as count FROM admin_users WHERE role = 'SUPER_ADMIN' AND is_active = 1`).get().count;
      if (superAdminCount <= 1) {
        return res.status(400).json({ error: 'Impossible de changer le rôle du dernier Super Administrateur actif' });
      }
    }

    // Protection : on ne peut pas désactiver le compte avec lequel on est connecté
    if (req.admin && req.admin.userId === Number(id) && isActive === false) {
      return res.status(400).json({ error: 'Vous ne pouvez pas désactiver votre propre compte' });
    }

    let passwordHash = existing.password_hash;
    if (password && password.trim().length > 0) {
      const salt = bcrypt.genSaltSync(10);
      passwordHash = bcrypt.hashSync(password, salt);
    }

    const updatedEmail = email !== undefined ? email.trim().toLowerCase() : existing.email;
    const updatedUsername = username !== undefined ? username.trim().toLowerCase() : existing.username;
    const updatedFullName = fullName !== undefined ? fullName.trim() : existing.full_name;
    const updatedRole = role !== undefined ? role : existing.role;
    const updatedIsActive = isActive !== undefined ? (isActive ? 1 : 0) : existing.is_active;

    db.prepare(`
      UPDATE admin_users
      SET email = ?, username = ?, full_name = ?, role = ?, is_active = ?, password_hash = ?
      WHERE id = ?
    `).run(updatedEmail, updatedUsername, updatedFullName, updatedRole, updatedIsActive, passwordHash, id);

    const updated = db.prepare(`
      SELECT id, email, username, full_name, role, is_active, created_at, last_login_at
      FROM admin_users
      WHERE id = ?
    `).get(id);

    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/admin/collaborators/:id - Supprimer un collaborateur (réservé Super Admin)
adminRouter.delete('/admin/collaborators/:id', requireSuperAdmin, (req, res) => {
  try {
    const { id } = req.params;
    const db = getDb();

    // Prevent self-deletion
    if (req.admin && req.admin.userId === Number(id)) {
      return res.status(400).json({ error: 'Vous ne pouvez pas supprimer votre propre compte' });
    }

    const target = db.prepare(`SELECT * FROM admin_users WHERE id = ?`).get(id);
    if (!target) {
      return res.status(404).json({ error: 'Collaborateur introuvable' });
    }

    // Prevent deleting last SUPER_ADMIN
    if (target.role === 'SUPER_ADMIN') {
      const superAdminCount = db.prepare(`SELECT COUNT(*) as count FROM admin_users WHERE role = 'SUPER_ADMIN'`).get().count;
      if (superAdminCount <= 1) {
        return res.status(400).json({ error: 'Impossible de supprimer le dernier Super Administrateur' });
      }
    }

    db.prepare(`DELETE FROM admin_users WHERE id = ?`).run(id);
    res.json({ success: true, message: 'Collaborateur supprimé avec succès' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

