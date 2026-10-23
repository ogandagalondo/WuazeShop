import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { app } from '../../src/server.js';
import { initDb } from '../../src/db/database.js';

describe('Products API', () => {
  beforeAll(() => {
    initDb(':memory:');
  });

  it('GET /api/products returns all active products with prices in FCFA', async () => {
    const res = await request(app).get('/api/products');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThanOrEqual(3);
    expect(res.body[0]).toHaveProperty('price');
    expect(typeof res.body[0].price).toBe('number');
  });

  it('GET /api/products?category=smartphones filters accurately', async () => {
    const res = await request(app).get('/api/products?category=smartphones');
    expect(res.status).toBe(200);
    expect(res.body.length).toBeGreaterThan(0);
    res.body.forEach(item => expect(item.category).toBe('smartphones'));
  });

  it('GET /api/products/:id returns single product detail', async () => {
    const listRes = await request(app).get('/api/products');
    const firstProduct = listRes.body[0];

    const detailRes = await request(app).get(`/api/products/${firstProduct.id}`);
    expect(detailRes.status).toBe(200);
    expect(detailRes.body.title).toBe(firstProduct.title);
    expect(detailRes.body.price).toBe(firstProduct.price);
  });

  it('GET /api/products/:slug returns product detail by slug with specs and colors', async () => {
    const listRes = await request(app).get('/api/products');
    const firstProduct = listRes.body[0];

    const detailRes = await request(app).get(`/api/products/${firstProduct.slug}`);
    expect(detailRes.status).toBe(200);
    expect(detailRes.body.title).toBe(firstProduct.title);
    expect(Array.isArray(detailRes.body.specs)).toBe(true);
    expect(Array.isArray(detailRes.body.colors)).toBe(true);
  });

  it('GET /api/products/non-existent-slug returns 404', async () => {
    const res = await request(app).get('/api/products/non-existent-slug-xyz');
    expect(res.status).toBe(404);
  });

  it('GET /product/:slug serves the product detail HTML page', async () => {
    const res = await request(app).get('/product/iphone-15-pro-max-256gb');
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/html/);
    expect(res.text).toContain('detail-colors-container');
    expect(res.text).toContain('detail-specs-container');
  });

  it('GET /api/categories returns the 3 pivot categories', async () => {
    const res = await request(app).get('/api/categories');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    const slugs = res.body.map(c => c.slug);
    expect(slugs).toContain('smartphones');
    expect(slugs).toContain('ordinateurs');
    expect(slugs).toContain('televiseurs');
  });

  it('GET /category/:slug serves the dedicated category HTML page', async () => {
    const res = await request(app).get('/category/smartphones');
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/html/);
    expect(res.text).toContain('category-products-grid');
    expect(res.text).toContain('category-hero-card');
  });

  it('GET /api/categories/:slug returns category details and products list', async () => {
    const res = await request(app).get('/api/categories/smartphones');
    expect(res.status).toBe(200);
    expect(res.body.slug).toBe('smartphones');
    expect(res.body).toHaveProperty('name');
    expect(Array.isArray(res.body.products)).toBe(true);
    expect(res.body.productCount).toBeGreaterThanOrEqual(1);
    res.body.products.forEach(p => {
      expect(p.category).toBe('smartphones');
    });
  });

  it('GET /api/categories/non-existent returns 404', async () => {
    const res = await request(app).get('/api/categories/non-existent-cat-xyz');
    expect(res.status).toBe(404);
  });

  it('GET /categories serves the dedicated categories grid HTML page', async () => {
    const res = await request(app).get('/categories');
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/html/);
    expect(res.text).toContain('categories-cards-grid');
    expect(res.text).toContain('drawer-about-toggle-btn');
    expect(res.text).toContain('drawer-about-dropdown');
    expect(res.text).toContain('Toutes les catégories');
  });

  it('GET /rayons redirects or serves the categories grid HTML page', async () => {
    const res = await request(app).get('/rayons');
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/html/);
    expect(res.text).toContain('categories-cards-grid');
  });

  it('Storefront pages include the unified hamburger navigation drawer with Toutes les catégories and À propos accordion', async () => {
    const pages = ['/', '/categories', '/category/smartphones', '/tracking'];
    for (const page of pages) {
      const res = await request(app).get(page);
      expect(res.status).toBe(200);
      expect(res.text).toContain('drawer-about-toggle-btn');
      expect(res.text).toContain('drawer-about-dropdown');
      expect(res.text).toContain('Toutes les catégories');
      expect(res.text).toContain('/categories');
      expect(res.text).toContain('Suivi de commande');
      expect(res.text).toContain('/tracking');
    }
  });

  it('GET /api/products returns products with images array', async () => {
    const res = await request(app).get('/api/products');
    expect(res.status).toBe(200);
    const iphone = res.body.find(p => p.slug === 'iphone-15-pro-max-256gb');
    expect(iphone).toBeDefined();
    expect(Array.isArray(iphone.images)).toBe(true);
    expect(iphone.images.length).toBeGreaterThanOrEqual(2);
    expect(iphone.image_url).toBe(iphone.images[0]);
  });

  it('GET /product/:slug includes multi-angle gallery HTML controls', async () => {
    const res = await request(app).get('/product/iphone-15-pro-max-256gb');
    expect(res.status).toBe(200);
    expect(res.text).toContain('gallery-card');
    expect(res.text).toContain('gallery-prev-btn');
    expect(res.text).toContain('gallery-next-btn');
    expect(res.text).toContain('gallery-dots-container');
    expect(res.text).toContain('gallery-counter-pill');
    expect(res.text).toContain('detail-thumbnails-wrapper');
  });
});
