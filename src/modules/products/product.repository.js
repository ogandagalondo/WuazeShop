import { getDb } from '../../db/database.js';

export const productRepository = {
  async findAll({ category } = {}) {
    const db = getDb();
    if (category && category !== 'all') {
      return await db.prepare(
        `SELECT * FROM products WHERE is_active = 1 AND category = ? ORDER BY id DESC`
      ).all(category);
    }
    return await db.prepare(
      `SELECT * FROM products WHERE is_active = 1 ORDER BY id DESC`
    ).all();
  },

  async findById(id) {
    const db = getDb();
    return await db.prepare(`SELECT * FROM products WHERE id = ? AND is_active = 1`).get(id);
  },

  async findBySlug(slug) {
    const db = getDb();
    return await db.prepare(`SELECT * FROM products WHERE slug = ? AND is_active = 1`).get(slug);
  },

  async findAllCategories() {
    const db = getDb();
    return await db.prepare(`SELECT * FROM categories ORDER BY id ASC`).all();
  },

  async findCategoryBySlug(slug) {
    const db = getDb();
    return await db.prepare(`SELECT * FROM categories WHERE slug = ?`).get(slug);
  },

  async findCategoryById(id) {
    const db = getDb();
    return await db.prepare(`SELECT * FROM categories WHERE id = ?`).get(id);
  },

  async createCategory({ name, slug, icon, description, banner_url }) {
    const db = getDb();
    const cleanSlug = (slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-')).toLowerCase();
    await db.prepare(`
      INSERT INTO categories (name, slug, icon, description, banner_url)
      VALUES (?, ?, ?, ?, ?)
    `).run(name, cleanSlug, icon || 'category', description || null, banner_url || null);
    return await this.findCategoryBySlug(cleanSlug);
  },

  async updateCategory(id, { name, slug, icon, description, banner_url }) {
    const db = getDb();
    const existing = await this.findCategoryById(id);
    if (!existing) return null;

    const newName = name !== undefined ? name : existing.name;
    const newSlug = slug !== undefined ? slug.toLowerCase().replace(/[^a-z0-9]+/g, '-') : existing.slug;
    const newIcon = icon !== undefined ? icon : existing.icon;
    const newDesc = description !== undefined ? description : existing.description;
    const newBanner = banner_url !== undefined ? banner_url : existing.banner_url;

    await db.prepare(`
      UPDATE categories
      SET name = ?, slug = ?, icon = ?, description = ?, banner_url = ?
      WHERE id = ?
    `).run(newName, newSlug, newIcon, newDesc, newBanner, id);

    return await this.findCategoryById(id);
  },

  async deleteCategory(id) {
    const db = getDb();
    const existing = await this.findCategoryById(id);
    if (!existing) return false;
    await db.prepare(`DELETE FROM categories WHERE id = ?`).run(id);
    return true;
  }
};
