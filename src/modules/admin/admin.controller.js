import { Router } from 'express';
import bcrypt from 'bcryptjs';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { authService, requireAdminAuth, requireSuperAdmin } from './auth.service.js';
import { inviteService } from './invite.service.js';
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
adminRouter.post('/admin/login', async (req, res) => {
  try {
    const { email, username, password } = req.body;
    const identifier = email || username;
    if (!identifier || !password) {
      return res.status(400).json({ error: 'Adresse e-mail (ou identifiant) et mot de passe requis' });
    }
    const result = await authService.login(identifier, password);
    res.json(result);
  } catch (error) {
    res.status(401).json({ error: error.message });
  }
});

// GET /api/settings - Obtenir tous les paramètres du site (public)
adminRouter.get('/settings', async (req, res) => {
  try {
    const db = getDb();
    const rows = await db.prepare(`SELECT key, value FROM site_settings`).all();
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

// GET /api/admin/me - Récupérer les informations complètes du collaborateur connecté
adminRouter.get('/admin/me', async (req, res) => {
  try {
    const db = getDb();
    const user = await db.prepare(`
      SELECT id, email, username, full_name, phone, role, is_active, created_at, last_login_at
      FROM admin_users
      WHERE id = ?
    `).get(req.admin.userId);

    if (!user) {
      return res.status(404).json({ error: 'Compte collaborateur introuvable' });
    }

    res.json({
      authenticated: true,
      user: {
        id: user.id,
        userId: user.id,
        email: user.email,
        username: user.username,
        fullName: user.full_name || user.username,
        full_name: user.full_name || user.username,
        phone: user.phone || '',
        role: user.role || 'SUPER_ADMIN',
        isActive: Boolean(user.is_active)
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/admin/me - Permet à CHAQUE collaborateur de modifier UNIQUEMENT ses propres informations (Nom, Email, Téléphone, Username, Mot de passe)
adminRouter.put('/admin/me', async (req, res) => {
  try {
    const userId = req.admin.userId;
    const { fullName, email, phone, username, password } = req.body;
    const db = getDb();

    const existing = await db.prepare(`SELECT * FROM admin_users WHERE id = ?`).get(userId);
    if (!existing) {
      return res.status(404).json({ error: 'Compte collaborateur introuvable' });
    }

    // 1. Validation de l'email si modifié
    let updatedEmail = existing.email;
    if (email !== undefined && email.trim().length > 0) {
      const cleanEmail = email.trim().toLowerCase();
      const emailConflict = await db.prepare(`SELECT id FROM admin_users WHERE LOWER(email) = LOWER(?) AND id != ?`).get(cleanEmail, userId);
      if (emailConflict) {
        return res.status(400).json({ error: 'Cette adresse e-mail est déjà utilisée par un autre collaborateur.' });
      }
      updatedEmail = cleanEmail;
    }

    // 2. Validation du nom d'utilisateur si modifié
    let updatedUsername = existing.username;
    if (username !== undefined && username.trim().length > 0) {
      const cleanUsername = username.trim().toLowerCase();
      const userConflict = await db.prepare(`SELECT id FROM admin_users WHERE LOWER(username) = LOWER(?) AND id != ?`).get(cleanUsername, userId);
      if (userConflict) {
        return res.status(400).json({ error: 'Cet identifiant / nom d\'utilisateur est déjà pris.' });
      }
      updatedUsername = cleanUsername;
    }

    // 3. Validation et hachage du nouveau mot de passe privé
    let passwordHash = existing.password_hash;
    if (password !== undefined && password.trim().length > 0) {
      if (password.trim().length < 6) {
        return res.status(400).json({ error: 'Le nouveau mot de passe doit contenir au moins 6 caractères.' });
      }
      const salt = bcrypt.genSaltSync(10);
      passwordHash = bcrypt.hashSync(password.trim(), salt);
    }

    const updatedFullName = fullName !== undefined ? fullName.trim() : existing.full_name;
    const updatedPhone = phone !== undefined ? phone.trim() : existing.phone;

    // Mise à jour en base : rôle et statut restent strictement inchangés pour préserver la sécurité
    await db.prepare(`
      UPDATE admin_users
      SET email = ?, username = ?, full_name = ?, phone = ?, password_hash = ?
      WHERE id = ?
    `).run(updatedEmail, updatedUsername, updatedFullName, updatedPhone, passwordHash, userId);

    const updatedUser = await db.prepare(`
      SELECT id, email, username, full_name, phone, role, is_active, created_at, last_login_at
      FROM admin_users
      WHERE id = ?
    `).get(userId);

    // Générer une session et token actualisés
    const session = authService.createSession(updatedUser);

    res.json({
      success: true,
      message: 'Vos informations personnelles et votre mot de passe privé ont été mis à jour avec succès.',
      token: session.token,
      user: {
        id: updatedUser.id,
        userId: updatedUser.id,
        email: updatedUser.email,
        username: updatedUser.username,
        fullName: updatedUser.full_name || updatedUser.username,
        full_name: updatedUser.full_name || updatedUser.username,
        phone: updatedUser.phone || '',
        role: updatedUser.role || 'SUPER_ADMIN'
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Alias PUT /api/admin/profile
adminRouter.put('/admin/profile', (req, res, next) => {
  req.url = '/admin/me';
  adminRouter.handle(req, res, next);
});

// Whitelist stricte des types MIME d'images autorisés
const ALLOWED_IMAGE_MIMES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const MAX_UPLOAD_SIZE_BYTES = 5 * 1024 * 1024; // 5 Mo

function isValidImageMagicBytes(buffer, mimeType) {
  if (!buffer || buffer.length < 4) return false;
  // PNG : 89 50 4E 47
  if (mimeType.includes('png')) {
    return buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47;
  }
  // JPEG : FF D8 FF
  if (mimeType.includes('jpeg') || mimeType.includes('jpg')) {
    return buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
  }
  // WebP : RIFF .... WEBP
  if (mimeType.includes('webp')) {
    return buffer.length >= 12 &&
      buffer.toString('ascii', 0, 4) === 'RIFF' &&
      buffer.toString('ascii', 8, 12) === 'WEBP';
  }
  return false;
}

// POST /api/admin/upload - Téléverser une image produit (Base64 sécurisé)
adminRouter.post('/admin/upload', (req, res) => {
  try {
    const { image, dataUrl, filename } = req.body;
    const rawData = image || dataUrl;
    if (!rawData) {
      return res.status(400).json({ error: 'Fichier image (image ou dataUrl) requis' });
    }

    const matches = rawData.match(/^data:([A-Za-z0-9\-+\/]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) {
      return res.status(400).json({ error: 'Format d’image invalide' });
    }

    const mimeType = matches[1].toLowerCase();
    if (!ALLOWED_IMAGE_MIMES.includes(mimeType)) {
      return res.status(400).json({ 
        error: 'Format d’image non autorisé. Formats acceptés : JPEG, PNG, WebP.' 
      });
    }

    const base64Data = matches[2];
    const buffer = Buffer.from(base64Data, 'base64');

    if (buffer.length > MAX_UPLOAD_SIZE_BYTES) {
      return res.status(400).json({ 
        error: 'Le fichier dépasse la taille maximale autorisée de 5 Mo.' 
      });
    }

    if (!isValidImageMagicBytes(buffer, mimeType)) {
      return res.status(400).json({ 
        error: 'Fichier corrompu ou signature binaire d’image invalide.' 
      });
    }

    let ext = '.jpg';
    if (mimeType.includes('png')) ext = '.png';
    else if (mimeType.includes('webp')) ext = '.webp';

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
adminRouter.post('/admin/products', async (req, res) => {
  try {
    let { title, description, category, price, originalPrice, imageUrl, images, specs, colors, weight, inStock } = req.body;

    let imagesArr = [];
    if (Array.isArray(images) && images.length > 0) {
      imagesArr = images.filter(Boolean);
    } else if (typeof images === 'string') {
      try {
        imagesArr = JSON.parse(images);
      } catch {
        imagesArr = images ? [images] : [];
      }
    }
    if (imagesArr.length === 0 && imageUrl) {
      imagesArr = [imageUrl];
    }
    if (!imageUrl && imagesArr.length > 0) {
      imageUrl = imagesArr[0];
    }

    if (!title || !category || !price || (!imageUrl && imagesArr.length === 0)) {
      return res.status(400).json({ error: 'Champs obligatoires manquants (title, category, price, imageUrl)' });
    }

    const parsedWeight = weight !== undefined && weight !== '' && !isNaN(Number(weight)) ? Number(weight) : 0.4;
    const slug = `${title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Date.now().toString().slice(-4)}`;
    const db = getDb();
    const stmt = db.prepare(`
      INSERT INTO products (
        title, description, slug, category, price, original_price, image_url, images, specs, colors, weight, in_stock, is_active
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
    `);

    await stmt.run(
      title,
      description || null,
      slug,
      category,
      Number(price),
      originalPrice ? Number(originalPrice) : null,
      imageUrl,
      JSON.stringify(imagesArr),
      specs ? JSON.stringify(specs) : null,
      colors ? JSON.stringify(colors) : null,
      parsedWeight,
      inStock === false ? 0 : 1
    );

    const created = await db.prepare(`SELECT * FROM products WHERE slug = ?`).get(slug);
    res.status(201).json(created);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/admin/products/:id - Mettre à jour un produit
adminRouter.put('/admin/products/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    const db = getDb();
    const existing = await db.prepare(`SELECT * FROM products WHERE id = ? AND is_active = 1`).get(id);
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

    let imageUrl = req.body.imageUrl !== undefined ? req.body.imageUrl : existing.image_url;
    let imagesVal = existing.images;
    if (req.body.images !== undefined) {
      let imagesArr = Array.isArray(req.body.images) ? req.body.images.filter(Boolean) : [];
      if (imagesArr.length > 0) {
        imagesVal = JSON.stringify(imagesArr);
        imageUrl = imagesArr[0];
      }
    }

    const specs = req.body.specs !== undefined ? JSON.stringify(req.body.specs) : existing.specs;
    const colors = req.body.colors !== undefined ? JSON.stringify(req.body.colors) : existing.colors;
    const weight = req.body.weight !== undefined && req.body.weight !== '' && !isNaN(Number(req.body.weight))
      ? Number(req.body.weight)
      : (existing.weight ?? 0.4);
    const inStock = req.body.inStock !== undefined ? (req.body.inStock ? 1 : 0) : existing.in_stock;

    await db.prepare(`
      UPDATE products 
      SET title = ?, description = ?, category = ?, price = ?, original_price = ?, image_url = ?, images = ?, specs = ?, colors = ?, weight = ?, in_stock = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(title, description, category, price, originalPrice, imageUrl, imagesVal, specs, colors, weight, inStock, id);

    const updated = await db.prepare(`SELECT * FROM products WHERE id = ?`).get(id);
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PATCH /api/admin/products/:id/discount - Appliquer ou retirer une remise sur un produit
adminRouter.patch('/admin/products/:id/discount', async (req, res) => {
  try {
    const id = Number(req.params.id);
    const db = getDb();
    const product = await db.prepare(`SELECT * FROM products WHERE id = ? AND is_active = 1`).get(id);
    if (!product) {
      return res.status(404).json({ error: 'Produit non trouvé' });
    }

    const { action, discountPercent, discountedPrice, originalPrice } = req.body;

    if (action === 'remove') {
      const restoredPrice = product.original_price && product.original_price > product.price 
        ? product.original_price 
        : product.price;

      await db.prepare(`
        UPDATE products 
        SET price = ?, original_price = NULL, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(restoredPrice, id);

      const updated = await db.prepare(`SELECT * FROM products WHERE id = ?`).get(id);
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

    await db.prepare(`
      UPDATE products 
      SET price = ?, original_price = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(finalPrice, basePrice, id);

    const updated = await db.prepare(`SELECT * FROM products WHERE id = ?`).get(id);
    res.json({ success: true, message: 'Remise appliquée avec succès', product: updated });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/admin/products/batch-discount - Appliquer ou retirer une remise groupée
adminRouter.post('/admin/products/batch-discount', async (req, res) => {
  try {
    const { category, discountPercent, action } = req.body;
    const db = getDb();

    let query = `SELECT * FROM products WHERE is_active = 1`;
    const params = [];
    if (category && category !== 'all') {
      query += ` AND category = ?`;
      params.push(category);
    }
    const products = await db.prepare(query).all(...params);

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
        await updateStmt.run(p.id);
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
      await updateStmt.run(pct, p.id);
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
adminRouter.delete('/admin/products/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    const db = getDb();
    const existing = await db.prepare(`SELECT * FROM products WHERE id = ?`).get(id);
    if (!existing) {
      return res.status(404).json({ error: 'Produit non trouvé' });
    }

    await db.prepare(`UPDATE products SET is_active = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ?`).run(id);
    res.json({ success: true, message: 'Produit archivé avec succès' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/admin/categories - Créer une catégorie
adminRouter.post('/admin/categories', async (req, res) => {
  try {
    const { name, slug, icon, description, bannerUrl } = req.body;
    if (!name) {
      return res.status(400).json({ error: 'Le nom de la catégorie est requis' });
    }
    const cleanSlug = (slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-')).toLowerCase();
    const db = getDb();
    const existing = await db.prepare(`SELECT * FROM categories WHERE slug = ?`).get(cleanSlug);
    if (existing) {
      return res.status(400).json({ error: 'Une catégorie avec cet identifiant existe déjà' });
    }

    await db.prepare(`
      INSERT INTO categories (name, slug, icon, description, banner_url)
      VALUES (?, ?, ?, ?, ?)
    `).run(name, cleanSlug, icon || 'category', description || null, bannerUrl || null);

    const created = await db.prepare(`SELECT * FROM categories WHERE slug = ?`).get(cleanSlug);
    res.status(201).json(created);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/admin/categories/:id - Modifier une catégorie
adminRouter.put('/admin/categories/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    const db = getDb();
    const existing = await db.prepare(`SELECT * FROM categories WHERE id = ?`).get(id);
    if (!existing) {
      return res.status(404).json({ error: 'Catégorie non trouvée' });
    }

    const { name, slug, icon, description, bannerUrl } = req.body;
    const newName = name !== undefined ? name : existing.name;
    const newSlug = slug !== undefined ? slug.toLowerCase().replace(/[^a-z0-9]+/g, '-') : existing.slug;
    const newIcon = icon !== undefined ? icon : existing.icon;
    const newDesc = description !== undefined ? description : existing.description;
    const newBanner = bannerUrl !== undefined ? bannerUrl : existing.banner_url;

    await db.prepare(`
      UPDATE categories
      SET name = ?, slug = ?, icon = ?, description = ?, banner_url = ?
      WHERE id = ?
    `).run(newName, newSlug, newIcon, newDesc, newBanner, id);

    const updated = await db.prepare(`SELECT * FROM categories WHERE id = ?`).get(id);
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/admin/categories/:id - Supprimer une catégorie
adminRouter.delete('/admin/categories/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    const db = getDb();
    const existing = await db.prepare(`SELECT * FROM categories WHERE id = ?`).get(id);
    if (!existing) {
      return res.status(404).json({ error: 'Catégorie non trouvée' });
    }

    const prods = await db.prepare(`SELECT COUNT(*) as count FROM products WHERE category = ? AND is_active = 1`).get(existing.slug);
    if (prods && prods.count > 0) {
      return res.status(400).json({ error: `Impossible de supprimer : ${prods.count} article(s) sont encore associés à ce rayon.` });
    }

    await db.prepare(`DELETE FROM categories WHERE id = ?`).run(id);
    res.json({ success: true, message: 'Catégorie supprimée avec succès' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/admin/orders - Lister toutes les commandes
adminRouter.get('/admin/orders', async (req, res) => {
  try {
    const db = getDb();
    const rows = await db.prepare(`
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
adminRouter.patch('/admin/orders/:orderNumber/status', async (req, res) => {
  try {
    const { orderNumber } = req.params;
    const { fulfillmentStatus, paymentStatus } = req.body;
    const db = getDb();

    const existing = await db.prepare(`SELECT * FROM orders WHERE order_number = ?`).get(orderNumber);
    if (!existing) {
      return res.status(404).json({ error: 'Commande non trouvée' });
    }

    const newFulfillment = fulfillmentStatus || existing.fulfillment_status;
    const newPayment = paymentStatus || existing.payment_status;

    await db.prepare(`
      UPDATE orders 
      SET fulfillment_status = ?, payment_status = ?, updated_at = CURRENT_TIMESTAMP
      WHERE order_number = ?
    `).run(newFulfillment, newPayment, orderNumber);

    const updated = await db.prepare(`SELECT * FROM orders WHERE order_number = ?`).get(orderNumber);
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
adminRouter.get('/admin/settings', async (req, res) => {
  try {
    const db = getDb();
    const rows = await db.prepare(`SELECT key, value FROM site_settings`).all();
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
adminRouter.put('/admin/settings/:key', async (req, res) => {
  try {
    const { key } = req.params;
    const db = getDb();
    const payload = req.body.value !== undefined ? req.body.value : req.body;
    const valueStr = typeof payload === 'object' ? JSON.stringify(payload) : String(payload);

    await db.prepare(`
      INSERT INTO site_settings (key, value, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = CURRENT_TIMESTAMP
    `).run(key, valueStr);

    res.json({ success: true, key, value: payload });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/admin/settings - Mettre à jour plusieurs sections CMS
adminRouter.put('/admin/settings', async (req, res) => {
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
      await stmt.run(key, valStr);
    }

    res.json({ success: true, message: 'Paramètres mis à jour' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== COLLABORATORS MANAGEMENT ====================

// GET /api/admin/collaborators - Lister tous les collaborateurs (réservé Super Admin)
adminRouter.get('/admin/collaborators', requireSuperAdmin, async (req, res) => {
  try {
    const db = getDb();
    const collaborators = await db.prepare(`
      SELECT id, email, username, full_name, phone, role, permissions, is_active, created_at, last_login_at
      FROM admin_users
      ORDER BY id ASC
    `).all();
    res.json(collaborators);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/admin/collaborators - Créer un nouveau collaborateur & générer l'invitation (réservé Super Admin)
adminRouter.post('/admin/collaborators', requireSuperAdmin, async (req, res) => {
  try {
    const { email, username, fullName, phone, role, permissions, password } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Adresse e-mail requise pour transmettre les accès au collaborateur' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanUsername = username && username.trim() ? username.trim().toLowerCase() : cleanEmail.split('@')[0].replace(/[^a-zA-Z0-9_-]/g, '');
    const cleanRole = ['SUPER_ADMIN', 'GESTIONNAIRE', 'AGENT'].includes(role) ? role : 'GESTIONNAIRE';
    const cleanFullName = fullName && fullName.trim() ? fullName.trim() : cleanUsername;
    const cleanPhone = phone && phone.trim() ? phone.trim() : null;
    const permissionsStr = permissions ? (typeof permissions === 'string' ? permissions : JSON.stringify(permissions)) : null;

    const db = getDb();
    const existing = await db.prepare(`
      SELECT id FROM admin_users 
      WHERE LOWER(email) = LOWER(?) OR LOWER(username) = LOWER(?)
    `).get(cleanEmail, cleanUsername);
    if (existing) {
      return res.status(400).json({ error: 'Un collaborateur avec cette adresse email ou cet identifiant existe déjà' });
    }

    // Si aucun mot de passe n'est fourni, en générer un fort automatiquement
    const effectivePassword = password && password.trim().length >= 6 
      ? password.trim() 
      : inviteService.generateTempPassword();

    const salt = bcrypt.genSaltSync(10);
    const passwordHash = bcrypt.hashSync(effectivePassword, salt);

    const result = await db.prepare(`
      INSERT INTO admin_users (email, username, full_name, phone, role, permissions, password_hash, is_active)
      VALUES (?, ?, ?, ?, ?, ?, ?, 1)
    `).run(cleanEmail, cleanUsername, cleanFullName, cleanPhone, cleanRole, permissionsStr, passwordHash);

    const newCollaborator = await db.prepare(`
      SELECT id, email, username, full_name, phone, role, permissions, is_active, created_at, last_login_at
      FROM admin_users
      WHERE id = ?
    `).get(result.lastInsertRowid);

    // Préparer le pack d'invitation avec URL et identifiants
    const protocol = req.headers['x-forwarded-proto'] || req.protocol || 'http';
    const host = req.get('host') || 'localhost:3000';
    const baseUrl = `${protocol}://${host}`;
    const invitation = await inviteService.buildInvitation({
      collaborator: newCollaborator,
      password: effectivePassword,
      baseUrl
    });

    res.status(201).json({
      ...newCollaborator,
      invitation
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/admin/collaborators/:id - Mettre à jour un collaborateur (réservé Super Admin)
adminRouter.put('/admin/collaborators/:id', requireSuperAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { email, username, fullName, role, isActive, password } = req.body;
    const db = getDb();

    const existing = await db.prepare(`SELECT * FROM admin_users WHERE id = ?`).get(id);
    if (!existing) {
      return res.status(404).json({ error: 'Collaborateur introuvable' });
    }

    // Protection : on ne peut pas rétrograder le dernier SUPER_ADMIN
    if (existing.role === 'SUPER_ADMIN' && role && role !== 'SUPER_ADMIN') {
      const superAdminRow = await db.prepare(`SELECT COUNT(*) as count FROM admin_users WHERE role = 'SUPER_ADMIN' AND is_active = 1`).get();
      const superAdminCount = superAdminRow ? superAdminRow.count : 0;
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

    await db.prepare(`
      UPDATE admin_users
      SET email = ?, username = ?, full_name = ?, role = ?, is_active = ?, password_hash = ?
      WHERE id = ?
    `).run(updatedEmail, updatedUsername, updatedFullName, updatedRole, updatedIsActive, passwordHash, id);

    const updated = await db.prepare(`
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
adminRouter.delete('/admin/collaborators/:id', requireSuperAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const db = getDb();

    // Prevent self-deletion
    if (req.admin && req.admin.userId === Number(id)) {
      return res.status(400).json({ error: 'Vous ne pouvez pas supprimer votre propre compte' });
    }

    const target = await db.prepare(`SELECT * FROM admin_users WHERE id = ?`).get(id);
    if (!target) {
      return res.status(404).json({ error: 'Collaborateur introuvable' });
    }

    // Prevent deleting last SUPER_ADMIN
    if (target.role === 'SUPER_ADMIN') {
      const superAdminRow = await db.prepare(`SELECT COUNT(*) as count FROM admin_users WHERE role = 'SUPER_ADMIN'`).get();
      const superAdminCount = superAdminRow ? superAdminRow.count : 0;
      if (superAdminCount <= 1) {
        return res.status(400).json({ error: 'Impossible de supprimer le dernier Super Administrateur' });
      }
    }

    await db.prepare(`DELETE FROM admin_users WHERE id = ?`).run(id);
    res.json({ success: true, message: 'Collaborateur supprimé avec succès' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/admin/collaborators/:id/resend-invite - Régénérer et renvoyer une invitation (réservé Super Admin)
adminRouter.post('/admin/collaborators/:id/resend-invite', requireSuperAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const db = getDb();

    const collaborator = await db.prepare(`
      SELECT id, email, username, full_name, phone, role, permissions, is_active, created_at, last_login_at
      FROM admin_users
      WHERE id = ?
    `).get(id);

    if (!collaborator) {
      return res.status(404).json({ error: 'Collaborateur introuvable' });
    }

    // Régénérer un nouveau mot de passe temporaire pour l'invitation
    const tempPassword = inviteService.generateTempPassword();
    const salt = bcrypt.genSaltSync(10);
    const passwordHash = bcrypt.hashSync(tempPassword, salt);

    await db.prepare(`UPDATE admin_users SET password_hash = ? WHERE id = ?`).run(passwordHash, id);

    const protocol = req.headers['x-forwarded-proto'] || req.protocol || 'http';
    const host = req.get('host') || 'localhost:3000';
    const baseUrl = `${protocol}://${host}`;
    const invitation = await inviteService.buildInvitation({
      collaborator,
      password: tempPassword,
      baseUrl
    });

    res.json({
      success: true,
      message: 'Invitation régénérée avec succès',
      invitation
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

