import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { app } from '../../src/server.js';
import { initDb } from '../../src/db/database.js';

describe('Admin CMS API', () => {
  let authToken;

  beforeAll(() => {
    initDb(':memory:');
  });

  it('blocks unauthorized access to admin product routes', async () => {
    const res = await request(app).post('/api/admin/products').send({ title: 'New Phone' });
    expect(res.status).toBe(401);
  });

  it('authenticates admin with valid credentials and returns token', async () => {
    const res = await request(app).post('/api/admin/login').send({
      username: 'admin',
      password: 'adminpassword123'
    });
    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
    authToken = res.body.token;
  });

  it('rejects login with invalid password', async () => {
    const res = await request(app).post('/api/admin/login').send({
      username: 'admin',
      password: 'wrongpassword'
    });
    expect(res.status).toBe(401);
  });

  it('allows authenticated admin to add a new product', async () => {
    const res = await request(app)
      .post('/api/admin/products')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        title: 'Xiaomi 14 Ultra 512GB',
        category: 'smartphones',
        price: 680000,
        originalPrice: 750000,
        imageUrl: 'https://placehold.co/400',
        specs: ['Leica Optics', 'Snapdragon 8 Gen 3'],
        colors: ['#000000', '#ffffff'],
        inStock: true
      });
    expect(res.status).toBe(201);
    expect(res.body.id).toBeDefined();
    expect(res.body.title).toBe('Xiaomi 14 Ultra 512GB');
  });

  it('allows authenticated admin to update a product price', async () => {
    const listRes = await request(app).get('/api/products');
    const targetProduct = listRes.body[0];

    const updateRes = await request(app)
      .put(`/api/admin/products/${targetProduct.id}`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        price: 799000
      });
    expect(updateRes.status).toBe(200);
    expect(updateRes.body.price).toBe(799000);
  });

  it('allows authenticated admin to soft-delete a product', async () => {
    const createRes = await request(app)
      .post('/api/admin/products')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        title: 'Ancien Modèle Test',
        category: 'smartphones',
        price: 150000,
        imageUrl: 'https://placehold.co/400'
      });
    const createdId = createRes.body.id;

    const delRes = await request(app)
      .delete(`/api/admin/products/${createdId}`)
      .set('Authorization', `Bearer ${authToken}`);
    expect(delRes.status).toBe(200);

    // Ne doit plus apparaître dans le catalogue public
    const publicList = await request(app).get('/api/products');
    expect(publicList.body.some(p => p.id === createdId)).toBe(false);
  });

  it('allows admin to list customer orders with WhatsApp numbers and neighborhoods', async () => {
    const res = await request(app)
      .get('/api/admin/orders')
      .set('Authorization', `Bearer ${authToken}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });
});
