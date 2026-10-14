import { getDb } from '../../db/database.js';

export const productRepository = {
  findAll({ category } = {}) {
    const db = getDb();
    if (category && category !== 'all') {
      return db.prepare(
        `SELECT * FROM products WHERE is_active = 1 AND category = ? ORDER BY id DESC`
      ).all(category);
    }
    return db.prepare(
      `SELECT * FROM products WHERE is_active = 1 ORDER BY id DESC`
    ).all();
  },

  findById(id) {
    const db = getDb();
    return db.prepare(`SELECT * FROM products WHERE id = ? AND is_active = 1`).get(id);
  },

  findBySlug(slug) {
    const db = getDb();
    return db.prepare(`SELECT * FROM products WHERE slug = ? AND is_active = 1`).get(slug);
  },

  findAllCategories() {
    const db = getDb();
    return db.prepare(`SELECT * FROM categories ORDER BY id ASC`).all();
  }
};
