import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { app } from '../../src/server.js';
import { initDb } from '../../src/db/database.js';

describe('Checkout API', () => {
  beforeAll(() => {
    initDb(':memory:');
  });

  it('creates order with valid Gabon customer details, calculates normal cargo shipping and ignores tampered client price', async () => {
    const res = await request(app).post('/api/orders/checkout').send({
      productId: 1,
      quantity: 1,
      tamperedPrice: 1000, // tentative d'altération de prix
      customerName: 'Jean Mba',
      customerPhone: '+24174001122',
      customerNeighborhood: 'Louis / Libreville',
      shippingMethod: 'normal',
      paymentMethod: 'AIRTEL_MONEY'
    });
    expect(res.status).toBe(201);
    expect(res.body.orderNumber).toMatch(/^WZ-\d+/);
    expect(res.body.paymentStatus).toBe('PENDING');
    expect(res.body.shippingMethod).toBe('normal');
    expect(res.body.shippingFee).toBe(4000); // 0.4kg * 10000 FCFA/kg
    expect(res.body.totalWeight).toBe(0.4);
    // Le prix réel de l'iPhone 15 Pro Max est 850 000 FCFA + 4 000 FCFA de fret
    expect(res.body.totalAmount).toBe(854000);
    expect(res.body.transactionReference).toBeDefined();
  });

  it('calculates express cargo shipping fee and supports CREDIT_CARD payment method', async () => {
    const res = await request(app).post('/api/orders/checkout').send({
      productId: 1,
      quantity: 2,
      customerName: 'Marie Avomo',
      customerPhone: '+24174112233',
      customerNeighborhood: 'Angondjé',
      shippingMethod: 'express',
      paymentMethod: 'CREDIT_CARD'
    });
    expect(res.status).toBe(201);
    expect(res.body.shippingMethod).toBe('express');
    expect(res.body.totalWeight).toBe(0.8); // 2 * 0.4kg
    expect(res.body.shippingFee).toBe(10800); // 0.8kg * 13500 FCFA/kg
    expect(res.body.paymentMethod).toBe('CREDIT_CARD');
    // 2 * 850 000 = 1 700 000 + 10 800 = 1 710 800
    expect(res.body.totalAmount).toBe(1710800);
  });

  it('rejects order if WhatsApp phone number is missing or invalid', async () => {
    const res = await request(app).post('/api/orders/checkout').send({
      productId: 1,
      quantity: 1,
      customerName: 'Jean Mba',
      customerPhone: '12', // trop court
      customerNeighborhood: 'Glass',
      paymentMethod: 'AIRTEL_MONEY'
    });
    expect(res.status).toBe(400);
    expect(res.body.error).toBeDefined();
  });

  it('rejects order if Gabon neighborhood is missing', async () => {
    const res = await request(app).post('/api/orders/checkout').send({
      productId: 1,
      quantity: 1,
      customerName: 'Jean Mba',
      customerPhone: '+24174001122',
      customerNeighborhood: '',
      paymentMethod: 'AIRTEL_MONEY'
    });
    expect(res.status).toBe(400);
  });

  it('GET /api/orders/:orderNumber retrieves accurate order status', async () => {
    const createRes = await request(app).post('/api/orders/checkout').send({
      productId: 1,
      quantity: 1,
      customerName: 'Alice Ondo',
      customerPhone: '+24166001122',
      customerNeighborhood: 'Akébé',
      paymentMethod: 'MOOV_MONEY'
    });
    const { orderNumber } = createRes.body;

    const getRes = await request(app).get(`/api/orders/${orderNumber}`);
    expect(getRes.status).toBe(200);
    expect(getRes.body.orderNumber).toBe(orderNumber);
    expect(getRes.body.customerName).toBe('Alice Ondo');
    expect(getRes.body.paymentStatus).toBe('PENDING');
    expect(getRes.body.fulfillmentStatus).toBe('AWAITING_PROCUREMENT');
    expect(getRes.body.productTitle).toBeDefined();
    expect(getRes.body.customerNeighborhood).toBe('Akébé');
    expect(getRes.body.customerPhone).toBe('+241 •• •• •• 22');
  });

  it('returns 404 when tracking a non-existent order reference', async () => {
    const res = await request(app).get('/api/orders/WZ-999999999');
    expect(res.status).toBe(404);
    expect(res.body.error).toContain('non trouvée');
  });

  it('navigates to dedicated parcel tracking page from storefront', async () => {
    const res = await request(app).get('/');
    expect(res.status).toBe(200);
    expect(res.text).toContain('/tracking');
    expect(res.text).not.toContain('id="tracking-section"');
  });

  it('serves the dedicated parcel tracking page at /tracking and /suivi', async () => {
    const res = await request(app).get('/tracking');
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/html/);
    expect(res.text).toContain('id="tracking-search-form"');
    expect(res.text).toContain('Suivre mon Colis en Direct');

    const suiviRes = await request(app).get('/suivi');
    expect(suiviRes.status).toBe(200);
  });
});
