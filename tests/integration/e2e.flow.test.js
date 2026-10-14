import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { app } from '../../src/server.js';
import { initDb } from '../../src/db/database.js';

describe('E2E Purchasing, Settlement & CMS Management Lifecycle', () => {
  beforeAll(() => {
    initDb(':memory:');
  });

  it('completes the entire cycle: product creation by admin -> customer checkout -> Mobile Money settlement -> China procurement tracking', async () => {
    // Step 1: Admin logs into CMS
    const loginRes = await request(app).post('/api/admin/login').send({
      username: 'admin',
      password: 'adminpassword123'
    });
    expect(loginRes.status).toBe(200);
    const adminToken = loginRes.body.token;
    expect(adminToken).toBeDefined();

    // Step 2: Admin creates a new high-end smartphone imported from China
    const createProdRes = await request(app)
      .post('/api/admin/products')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        title: 'Xiaomi 14 Ultra Photography Kit 512GB',
        category: 'smartphones',
        price: 690000,
        originalPrice: 750000,
        imageUrl: 'https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=600',
        specs: ['Leica Optics Quad-Cam', '16GB RAM + 512GB', 'Snapdragon 8 Gen 3'],
        colors: ['#0f172a', '#ffffff'],
        inStock: true
      });
    expect(createProdRes.status).toBe(201);
    const newProductId = createProdRes.body.id;
    expect(newProductId).toBeDefined();

    // Step 3: Customer browses the storefront by category
    const catalogRes = await request(app).get('/api/products?category=smartphones');
    expect(catalogRes.status).toBe(200);
    const createdItem = catalogRes.body.find(p => p.id === newProductId);
    expect(createdItem).toBeDefined();
    expect(createdItem.title).toContain('Xiaomi 14 Ultra');
    expect(createdItem.price).toBe(690000);

    // Step 4: Customer checks out with local Gabon details & Mobile Money
    const checkoutRes = await request(app).post('/api/orders/checkout').send({
      productId: newProductId,
      quantity: 1,
      customerName: 'Martial Obiang',
      customerPhone: '+24174889900',
      customerNeighborhood: 'Quartier Louis, Libreville',
      paymentMethod: 'AIRTEL_MONEY'
    });
    expect(checkoutRes.status).toBe(201);
    const { orderNumber, transactionReference, totalAmount } = checkoutRes.body;
    expect(orderNumber).toMatch(/^WZ-\d+/);
    expect(transactionReference).toMatch(/^SIM-/);
    expect(totalAmount).toBe(690000);
    expect(checkoutRes.body.paymentStatus).toBe('PENDING');

    // Step 5: Simulation of Airtel Money push USSD approval (100% upfront settlement)
    const paymentConfirmRes = await request(app)
      .post('/api/payments/simulator/confirm')
      .send({ transactionReference });
    expect(paymentConfirmRes.status).toBe(200);
    expect(paymentConfirmRes.body.status).toBe('CONFIRMED_CLEARED');

    // Step 6: Verify customer order is now confirmed and cleared for procurement
    const orderCheckRes = await request(app).get(`/api/orders/${orderNumber}`);
    expect(orderCheckRes.status).toBe(200);
    expect(orderCheckRes.body.paymentStatus).toBe('CONFIRMED_CLEARED');
    expect(orderCheckRes.body.fulfillmentStatus).toBe('AWAITING_PROCUREMENT');

    // Step 7: Admin inspects orders dashboard
    const adminOrdersRes = await request(app)
      .get('/api/admin/orders')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(adminOrdersRes.status).toBe(200);
    const adminOrder = adminOrdersRes.body.find(o => o.orderNumber === orderNumber);
    expect(adminOrder).toBeDefined();
    expect(adminOrder.customerName).toBe('Martial Obiang');
    expect(adminOrder.customerNeighborhood).toBe('Quartier Louis, Libreville');
    expect(adminOrder.customerPhone).toBe('+24174889900');
    expect(adminOrder.paymentStatus).toBe('CONFIRMED_CLEARED');

    // Step 8: Admin dispatches order to factory associate in China
    const updateStatusRes = await request(app)
      .patch(`/api/admin/orders/${orderNumber}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ fulfillmentStatus: 'IN_PREPARATION_CHINA' });
    expect(updateStatusRes.status).toBe(200);
    expect(updateStatusRes.body.fulfillmentStatus).toBe('IN_PREPARATION_CHINA');

    // Step 9: Final customer order status verification
    const finalOrderRes = await request(app).get(`/api/orders/${orderNumber}`);
    expect(finalOrderRes.status).toBe(200);
    expect(finalOrderRes.body.fulfillmentStatus).toBe('IN_PREPARATION_CHINA');
    expect(finalOrderRes.body.paymentStatus).toBe('CONFIRMED_CLEARED');
  });
});
