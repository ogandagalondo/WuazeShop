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

  it('GET /api/categories returns the 3 pivot categories', async () => {
    const res = await request(app).get('/api/categories');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    const slugs = res.body.map(c => c.slug);
    expect(slugs).toContain('smartphones');
    expect(slugs).toContain('ordinateurs');
    expect(slugs).toContain('televiseurs');
  });
});
