import { Router } from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { authService, requireAdminAuth } from './auth.service.js';
import { getDb } from '../../db/database.js';
import { orderService } from '../orders/order.service.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadDir = path.resolve(__dirname, '../../public/uploads');

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
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
    const originalPrice = req.body.originalPrice !== undefined ? Number(req.body.originalPrice) : existing.original_price;
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
