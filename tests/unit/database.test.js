import { describe, it, expect } from 'vitest';
import { initDb } from '../../src/db/database.js';

describe('Database Initialization', () => {
  it('creates required tables and seeds default categories and initial products', () => {
    const db = initDb(':memory:');
    
    // Check categories
    const categories = db.prepare('SELECT slug FROM categories').all();
    const slugs = categories.map(c => c.slug);
    expect(slugs).toContain('smartphones');
    expect(slugs).toContain('ordinateurs');
    expect(slugs).toContain('televiseurs');

    // Check products seeded from Google Stitch design
    const products = db.prepare('SELECT title, price, category FROM products').all();
    expect(products.length).toBeGreaterThanOrEqual(3);
    const titles = products.map(p => p.title);
    expect(titles.some(t => t.includes('iPhone'))).toBe(true);
    expect(titles.some(t => t.includes('MacBook'))).toBe(true);
    expect(titles.some(t => t.includes('Smart TV'))).toBe(true);

    // Check orders table exists
    const ordersTable = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='orders'").get();
    expect(ordersTable).toBeDefined();

    // Check admin_users table exists
    const adminTable = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='admin_users'").get();
    expect(adminTable).toBeDefined();
  });
});
