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

  it('authenticates admin with valid email and returns token (Shopify style)', async () => {
    const res = await request(app).post('/api/admin/login').send({
      email: 'admin@wuazeshop.ga',
      password: 'adminpassword123'
    });
    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
    expect(res.body.email).toBe('admin@wuazeshop.ga');
    authToken = res.body.token;
  });

  it('authenticates admin with username for backward compatibility', async () => {
    const res = await request(app).post('/api/admin/login').send({
      username: 'admin',
      password: 'adminpassword123'
    });
    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
  });

  it('serves admin back-office on dedicated Shopify-style route /admin', async () => {
    const res = await request(app).get('/admin');
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toContain('text/html');
  });

  it('rejects login with invalid password', async () => {
    const res = await request(app).post('/api/admin/login').send({
      email: 'admin@wuazeshop.ga',
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

  it('allows authenticated admin to upload a base64 product image', async () => {
    // 1x1 transparent png in base64
    const sampleBase64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
    const uploadRes = await request(app)
      .post('/api/admin/upload')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        image: sampleBase64,
        filename: 'smartphone-test.png'
      });

    expect(uploadRes.status).toBe(200);
    expect(uploadRes.body.success).toBe(true);
    expect(uploadRes.body.imageUrl).toMatch(/^\/uploads\/\d+-smartphone-test\.png$/);
  });

  it('allows authenticated admin to add a product with a custom description and uploaded image', async () => {
    const res = await request(app)
      .post('/api/admin/products')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        title: 'OnePlus 12 5G Edition Spéciale',
        description: 'Smartphone haut de gamme importé directement de Shenzhen avec processeur Snapdragon 8 Gen 3 et optique Hasselblad.',
        category: 'smartphones',
        price: 520000,
        originalPrice: 580000,
        imageUrl: '/uploads/oneplus12.png',
        specs: ['16GB RAM', '512GB Stockage', 'Charge 100W SuperVOOC'],
        colors: ['#0d7252', '#000000'],
        inStock: true
      });

    expect(res.status).toBe(201);
    expect(res.body.id).toBeDefined();
    expect(res.body.description).toContain('Shenzhen');

    const getRes = await request(app).get(`/api/products/${res.body.id}`);
    expect(getRes.status).toBe(200);
    expect(getRes.body.description).toBe('Smartphone haut de gamme importé directement de Shenzhen avec processeur Snapdragon 8 Gen 3 et optique Hasselblad.');
    expect(getRes.body.image_url).toBe('/uploads/oneplus12.png');
  });

  it('allows authenticated admin to update a product description', async () => {
    const listRes = await request(app).get('/api/products');
    const targetProduct = listRes.body[0];

    const updatedDesc = 'Nouvelle description mise à jour avec garantie locale 6 mois.';
    const updateRes = await request(app)
      .put(`/api/admin/products/${targetProduct.id}`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        description: updatedDesc
      });

    expect(updateRes.status).toBe(200);
    expect(updateRes.body.description).toBe(updatedDesc);
  });

  it('allows admin to list customer orders with WhatsApp numbers and neighborhoods', async () => {
    const res = await request(app)
      .get('/api/admin/orders')
      .set('Authorization', `Bearer ${authToken}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('allows public retrieval of site showcase settings', async () => {
    const res = await request(app).get('/api/settings');
    expect(res.status).toBe(200);
    expect(res.body.hero_section).toBeDefined();
    expect(res.body.promo_section).toBeDefined();
    expect(res.body.contact_section).toBeDefined();
    expect(res.body.hero_section.title).toContain('La technologie');
  });

  it('allows authenticated admin to update a showcase section', async () => {
    const updateRes = await request(app)
      .put('/api/admin/settings/hero_section')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        badge: '✦ Spécial Libreville',
        title: 'Le meilleur de la tech chinoise au Gabon',
        subtitle: 'Livraison express et service après-vente garanti.',
        ctaText: 'Acheter maintenant',
        ctaLink: '#products-section',
        imageUrl: '/uploads/custom-hero.jpg',
        prop1Title: 'Livraison 24h',
        prop1Sub: 'partout à Libreville',
        prop2Title: 'Airtel & Moov',
        prop2Sub: 'Paiement sécurisé',
        prop3Title: 'Assistance VIP',
        prop3Sub: '7j/7 WhatsApp'
      });

    expect(updateRes.status).toBe(200);
    expect(updateRes.body.success).toBe(true);

    const publicRes = await request(app).get('/api/settings');
    expect(publicRes.body.hero_section.badge).toBe('✦ Spécial Libreville');
    expect(publicRes.body.hero_section.title).toBe('Le meilleur de la tech chinoise au Gabon');
  });

  it('allows authenticated admin to update social media links', async () => {
    const updateRes = await request(app)
      .put('/api/admin/settings/social_links')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        facebook: 'https://facebook.com/wuazeshop_test',
        instagram: 'https://instagram.com/wuazeshop_test',
        tiktok: 'https://tiktok.com/@wuazeshop_test',
        whatsapp: 'https://wa.me/241074001122'
      });

    expect(updateRes.status).toBe(200);
    expect(updateRes.body.success).toBe(true);

    const publicRes = await request(app).get('/api/settings');
    expect(publicRes.body.social_links).toBeDefined();
    expect(publicRes.body.social_links.facebook).toBe('https://facebook.com/wuazeshop_test');
    expect(publicRes.body.social_links.instagram).toBe('https://instagram.com/wuazeshop_test');
    expect(publicRes.body.social_links.tiktok).toBe('https://tiktok.com/@wuazeshop_test');
    expect(publicRes.body.social_links.whatsapp).toBe('https://wa.me/241074001122');
  });

  it('allows authenticated admin to update legal terms and privacy policy', async () => {
    const updateRes = await request(app)
      .put('/api/admin/settings/legal_section')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        terms: 'Nouvelles Conditions Générales de Vente WuazeShop 2026',
        privacy: 'Nouvelle Politique de Confidentialité et Protection des Données Gabon'
      });

    expect(updateRes.status).toBe(200);
    expect(updateRes.body.success).toBe(true);

    const publicRes = await request(app).get('/api/settings');
    expect(publicRes.body.legal_section).toBeDefined();
    expect(publicRes.body.legal_section.terms).toBe('Nouvelles Conditions Générales de Vente WuazeShop 2026');
    expect(publicRes.body.legal_section.privacy).toBe('Nouvelle Politique de Confidentialité et Protection des Données Gabon');
  });

  it('keeps public storefront separate with no visible admin links (Shopify architecture)', async () => {
    const storefrontRes = await request(app).get('/');
    expect(storefrontRes.status).toBe(200);
    // Public customers should not see /admin.html links in header, footer or mobile nav
    expect(storefrontRes.text).not.toContain('/admin.html');
    expect(storefrontRes.text).not.toContain('Espace Administrateur CMS');
    // Storefront must contain FAQ section
    expect(storefrontRes.text).toContain('id="faq-section"');
    expect(storefrontRes.text).toContain('Foire Aux Questions');
  });

  it('allows authenticated admin to update FAQ section with questions and answers', async () => {
    const testFaq = [
      {
        id: 'faq_test_1',
        question: 'Comment contacter le service client à Libreville ?',
        answer: 'Notre service client est disponible 7j/7 directement sur WhatsApp au (+241) 074 00 11 22.'
      },
      {
        id: 'faq_test_2',
        question: 'Quel est le mode de transport utilisé depuis Shenzhen ?',
        answer: 'Nous utilisons le fret aérien cargo express avec dédouanement sécurisé à Libreville.'
      }
    ];

    const updateRes = await request(app)
      .put('/api/admin/settings/faq_section')
      .set('Authorization', `Bearer ${authToken}`)
      .send(testFaq);

    expect(updateRes.status).toBe(200);
    expect(updateRes.body.success).toBe(true);

    const publicRes = await request(app).get('/api/settings');
    expect(Array.isArray(publicRes.body.faq_section)).toBe(true);
    expect(publicRes.body.faq_section.length).toBe(2);
    expect(publicRes.body.faq_section[0].question).toBe('Comment contacter le service client à Libreville ?');
    expect(publicRes.body.faq_section[1].answer).toContain('fret aérien cargo express');
  });

  it('allows authenticated admin to create, update and delete a category in CMS', async () => {
    // 1. Create a new category
    const createRes = await request(app)
      .post('/api/admin/categories')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        name: 'Drones & Caméras',
        slug: 'drones-cameras',
        icon: 'videocam',
        description: 'Drones professionnels 4K et stabilisateurs importés de Shenzhen.',
        banner_url: '/images/hero-devices.jpg'
      });

    expect(createRes.status).toBe(201);
    expect(createRes.body.slug).toBe('drones-cameras');
    expect(createRes.body.name).toBe('Drones & Caméras');
    const newCatId = createRes.body.id;

    // 2. Update the category
    const updateRes = await request(app)
      .put(`/api/admin/categories/${newCatId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        name: 'Drones & Stabilisateurs 4K',
        description: 'Drones et gimbals professionnels'
      });

    expect(updateRes.status).toBe(200);
    expect(updateRes.body.name).toBe('Drones & Stabilisateurs 4K');
    expect(updateRes.body.description).toBe('Drones et gimbals professionnels');

    // 3. Delete the category (0 products attached)
    const deleteRes = await request(app)
      .delete(`/api/admin/categories/${newCatId}`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(deleteRes.status).toBe(200);
    expect(deleteRes.body.success).toBe(true);

    // Verify it is gone
    const getRes = await request(app).get('/api/categories/drones-cameras');
    expect(getRes.status).toBe(404);
  });

  it('prevents deleting a category that has attached products', async () => {
    const listRes = await request(app).get('/api/categories');
    const smartphoneCat = listRes.body.find(c => c.slug === 'smartphones');
    expect(smartphoneCat).toBeDefined();

    const deleteRes = await request(app)
      .delete(`/api/admin/categories/${smartphoneCat.id}`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(deleteRes.status).toBe(400);
    expect(deleteRes.body.error).toContain('Impossible de supprimer');
  });

  it('rejects unauthenticated requests to modify categories', async () => {
    const res = await request(app)
      .post('/api/admin/categories')
      .send({ name: 'Hacking', slug: 'hack' });

    expect(res.status).toBe(401);
  });

  it('allows authenticated admin to apply a percentage discount to a product', async () => {
    const listRes = await request(app).get('/api/products');
    const targetProduct = listRes.body[0];
    const initialPrice = targetProduct.price;

    const discountRes = await request(app)
      .patch(`/api/admin/products/${targetProduct.id}/discount`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        discountPercent: 20
      });

    expect(discountRes.status).toBe(200);
    expect(discountRes.body.success).toBe(true);
    expect(discountRes.body.product.price).toBe(Math.round(initialPrice * 0.8));
    expect(discountRes.body.product.original_price).toBe(initialPrice);
  });

  it('allows authenticated admin to remove a discount from a product', async () => {
    const listRes = await request(app).get('/api/products');
    const targetProduct = listRes.body[0];

    const removeRes = await request(app)
      .patch(`/api/admin/products/${targetProduct.id}/discount`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        action: 'remove'
      });

    expect(removeRes.status).toBe(200);
    expect(removeRes.body.success).toBe(true);
    expect(removeRes.body.product.original_price).toBeNull();
  });

  it('allows authenticated admin to apply a batch discount to an entire category', async () => {
    const batchRes = await request(app)
      .post('/api/admin/products/batch-discount')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        category: 'smartphones',
        discountPercent: 15
      });

    expect(batchRes.status).toBe(200);
    expect(batchRes.body.success).toBe(true);
    expect(batchRes.body.affectedCount).toBeGreaterThan(0);

    const checkList = await request(app).get('/api/products?category=smartphones');
    for (const p of checkList.body) {
      expect(p.original_price).toBeGreaterThan(p.price);
    }
  });

  it('allows authenticated admin to batch-remove discounts from a category', async () => {
    const removeBatchRes = await request(app)
      .post('/api/admin/products/batch-discount')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        category: 'smartphones',
        action: 'remove'
      });

    expect(removeBatchRes.status).toBe(200);
    expect(removeBatchRes.body.success).toBe(true);

    const checkList = await request(app).get('/api/products?category=smartphones');
    for (const p of checkList.body) {
      expect(p.original_price).toBeNull();
    }
  });

  // ==================== COLLABORATOR MANAGEMENT TESTS ====================
  let newCollaboratorId;

  it('allows authenticated admin to list team collaborators', async () => {
    const res = await request(app)
      .get('/api/admin/collaborators')
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThanOrEqual(1);
    expect(res.body[0]).toHaveProperty('role');
    expect(res.body[0]).not.toHaveProperty('password_hash');
  });

  it('allows authenticated admin to create a new collaborator with specific role', async () => {
    const res = await request(app)
      .post('/api/admin/collaborators')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        email: 'collaborateur@wuazeshop.ga',
        username: 'collab_marc',
        fullName: 'Marc Ndong',
        role: 'GESTIONNAIRE',
        password: 'collabpassword123'
      });

    expect(res.status).toBe(201);
    expect(res.body.email).toBe('collaborateur@wuazeshop.ga');
    expect(res.body.role).toBe('GESTIONNAIRE');
    expect(res.body.full_name).toBe('Marc Ndong');
    newCollaboratorId = res.body.id;
  });

  let collabToken;
  it('allows new collaborator to log in with their own credentials (email or username, case-insensitive)', async () => {
    // Login with username with mixed case
    const resUsername = await request(app)
      .post('/api/admin/login')
      .send({
        email: 'Collab_Marc',
        password: 'collabpassword123'
      });

    expect(resUsername.status).toBe(200);
    expect(resUsername.body.token).toBeDefined();
    expect(resUsername.body.role).toBe('GESTIONNAIRE');
    expect(resUsername.body.fullName).toBe('Marc Ndong');
    collabToken = resUsername.body.token;

    // Login with email
    const resEmail = await request(app)
      .post('/api/admin/login')
      .send({
        email: 'collaborateur@wuazeshop.ga',
        password: 'collabpassword123'
      });

    expect(resEmail.status).toBe(200);
  });

  it('forbids non-superadmin collaborator from accessing collaborator management (403 Forbidden)', async () => {
    const listRes = await request(app)
      .get('/api/admin/collaborators')
      .set('Authorization', `Bearer ${collabToken}`);

    expect(listRes.status).toBe(403);
    expect(listRes.body.error).toContain('Super Administrateur');

    const createRes = await request(app)
      .post('/api/admin/collaborators')
      .set('Authorization', `Bearer ${collabToken}`)
      .send({
        email: 'intruder@wuazeshop.ga',
        password: 'password123'
      });

    expect(createRes.status).toBe(403);
  });

  it('allows admin to update collaborator role and status', async () => {
    const res = await request(app)
      .put(`/api/admin/collaborators/${newCollaboratorId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        role: 'AGENT',
        isActive: false
      });

    expect(res.status).toBe(200);
    expect(res.body.role).toBe('AGENT');
    expect(res.body.is_active).toBe(0);
  });

  it('blocks login for deactivated collaborator', async () => {
    const res = await request(app)
      .post('/api/admin/login')
      .send({
        email: 'collaborateur@wuazeshop.ga',
        password: 'collabpassword123'
      });

    expect(res.status).toBe(401);
    expect(res.body.error).toContain('désactivé');
  });

  it('allows admin to delete a collaborator safely', async () => {
    const res = await request(app)
      .delete(`/api/admin/collaborators/${newCollaboratorId}`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    const checkList = await request(app)
      .get('/api/admin/collaborators')
      .set('Authorization', `Bearer ${authToken}`);

    expect(checkList.body.some(c => c.id === newCollaboratorId)).toBe(false);
  });
});


