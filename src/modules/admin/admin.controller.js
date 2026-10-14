import { Router } from 'express';
import { authService, requireAdminAuth } from './auth.service.js';
import { getDb } from '../../db/database.js';
import { orderService } from '../orders/order.service.js';

export const adminRouter = Router();

// POST /api/admin/login
adminRouter.post('/admin/login', (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'Nom d’utilisateur et mot de passe requis' });
    }
    const result = authService.login(username, password);
    res.json(result);
  } catch (error) {
    res.status(401).json({ error: error.message });
  }
});

// Toutes les routes ci-dessous nécessitent une authentification admin
adminRouter.use('/admin', requireAdminAuth);

// GET /api/admin/me
adminRouter.get('/admin/me', (req, res) => {
  res.json({ authenticated: true, user: req.admin });
});

// POST /api/admin/products - Créer un produit
adminRouter.post('/admin/products', (req, res) => {
  try {
    const { title, category, price, originalPrice, imageUrl, specs, colors, inStock } = req.body;
    if (!title || !category || !price || !imageUrl) {
      return res.status(400).json({ error: 'Champs obligatoires manquants (title, category, price, imageUrl)' });
    }

    const slug = `${title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Date.now().toString().slice(-4)}`;
    const db = getDb();
    const stmt = db.prepare(`
      INSERT INTO products (
        title, slug, category, price, original_price, image_url, specs, colors, in_stock, is_active
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
    `);

    stmt.run(
      title,
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
    const category = req.body.category !== undefined ? req.body.category : existing.category;
    const price = req.body.price !== undefined ? Number(req.body.price) : existing.price;
    const originalPrice = req.body.originalPrice !== undefined ? Number(req.body.originalPrice) : existing.original_price;
    const imageUrl = req.body.imageUrl !== undefined ? req.body.imageUrl : existing.image_url;
    const specs = req.body.specs !== undefined ? JSON.stringify(req.body.specs) : existing.specs;
    const colors = req.body.colors !== undefined ? JSON.stringify(req.body.colors) : existing.colors;
    const inStock = req.body.inStock !== undefined ? (req.body.inStock ? 1 : 0) : existing.in_stock;

    db.prepare(`
      UPDATE products 
      SET title = ?, category = ?, price = ?, original_price = ?, image_url = ?, specs = ?, colors = ?, in_stock = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(title, category, price, originalPrice, imageUrl, specs, colors, inStock, id);

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
    const result = db.prepare(`UPDATE products SET is_active = 0 WHERE id = ?`).run(id);
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Produit non trouvé' });
    }
    res.json({ success: true, message: 'Produit archivé avec succès' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/admin/orders - Lister toutes les commandes
adminRouter.get('/admin/orders', (req, res) => {
  try {
    const orders = orderService.getAllOrders();
    res.json(orders);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PATCH /api/admin/orders/:orderNumber/status - Mettre à jour le statut logistique
adminRouter.patch('/admin/orders/:orderNumber/status', (req, res) => {
  try {
    const { fulfillmentStatus, paymentStatus } = req.body;
    const db = getDb();

    if (fulfillmentStatus) {
      db.prepare(`UPDATE orders SET fulfillment_status = ?, updated_at = CURRENT_TIMESTAMP WHERE order_number = ?`)
        .run(fulfillmentStatus, req.params.orderNumber);
    }
    if (paymentStatus) {
      db.prepare(`UPDATE orders SET payment_status = ?, updated_at = CURRENT_TIMESTAMP WHERE order_number = ?`)
        .run(paymentStatus, req.params.orderNumber);
    }

    const updated = orderService.getOrderByNumber(req.params.orderNumber);
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
