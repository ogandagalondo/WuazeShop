# WuazeShop Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Construire la boutique e-commerce WuazeShop pour la vente d'électronique depuis la Chine vers le Gabon, avec paiement Mobile Money 100% à l'avance, passerelle de simulation, CMS d'administration complet et interface fidèle au prototype Google Stitch.

**Architecture:** Architecture web full-stack Node.js (Express + SQLite via Prisma/better-sqlite3) structurée selon les standards de l'espace de travail (`backend-standards`, `frontend-standards`). Le domaine métier isole la boutique publique, le CMS d'administration, et une passerelle de paiement modulaire à adaptateurs (Simulateur / CEMAC) pilotée par événements.

**Tech Stack:** Node.js (v18+), Express, SQLite, Zod (validation de données), Tailwind CSS (Design System Electro Grid Emerald), Google Fonts (*Plus Jakarta Sans*, *Inter*), Material Symbols Outlined, Vitest / Supertest pour les tests automatisés.

**Spec:** [docs/superpowers/specs/2026-10-14-wuazeshop-design.md](file:///c:/Users/Excalibur/OneDrive/Bureau/WuazeShop/docs/superpowers/specs/2026-10-14-wuazeshop-design.md)

## Global Constraints

- **Devise unique :** Tous les montants financiers sont exprimés en Francs CFA (XAF), entiers positifs.
- **Règle de commande stricte :** Aucun statut de commande ne passe à `CONFIRMED_CLEARED` sans confirmation irrévocable de paiement par l'agrégateur/simulateur.
- **Formulaire de commande Gabon :** Collecte obligatoire de `customerName`, `customerPhone` (numéro WhatsApp) et `customerNeighborhood` (quartier de résidence).
- **3 catégories pivots initiales :** `smartphones`, `ordinateurs`, `televiseurs`.
- **Fidélité UI :** Application stricte de la charte graphique Google Stitch (*Electro Grid Emerald* : vert primaire `#006c49`, conteneur `#10b981`, ardoise `#131b2e`, fond `#faf8ff`).
- **CMS mono-administrateur :** Accès sécurisé par mot de passe réservé au promoteur pour gérer le catalogue et les commandes.

## Review Focus

1. **Montant altéré au checkout :** Un client modifie le montant côté client &rarr; Le backend recalcule obligatoirement le total depuis la base de données avant d'initier le paiement. (Testé dans Task 5)
2. **Notification webhook dupliquée ou retardée :** L'agrégateur renvoie deux fois la notification de succès &rarr; Idempotence sur la référence de transaction pour éviter les doubles validations. (Testé dans Task 4)
3. **Numéro WhatsApp invalide au checkout :** Saisie d'un numéro incomplet ou mal formé &rarr; Rejet immédiat par validation Zod avec message clair. (Testé dans Task 5)
4. **Tentative d'accès non autorisé au CMS :** Requête vers les endpoints d'administration sans session/token valide &rarr; Réponse HTTP 401/403 systématique. (Testé dans Task 6)
5. **Suppression d'un produit ayant déjà des commandes :** Tentative de suppression d'un produit historique &rarr; Archivage / soft-delete pour conserver l'intégrité des commandes passées. (Testé dans Task 3 & 6)

---

## File Structure

```
WuazeShop/
├── docs/
│   └── superpowers/
│       ├── specs/2026-10-14-wuazeshop-design.md
│       └── plans/2026-10-14-wuazeshop.md
├── src/
│   ├── config/
│   │   └── env.js                     # Variables d'environnement validées
│   ├── db/
│   │   ├── database.js                # Initialisation SQLite
│   │   ├── schema.sql                 # Schéma SQL des tables
│   │   └── seed.js                    # Données initiales (produits Stitch)
│   ├── modules/
│   │   ├── products/
│   │   │   ├── product.repository.js  # Accès aux données produits
│   │   │   ├── product.service.js     # Logique métier produits & catégories
│   │   │   └── product.controller.js  # Routes API publiques produits
│   │   ├── payments/
│   │   │   ├── payment.interface.js   # Contrat PaymentGateway
│   │   │   ├── simulator.gateway.js   # Adaptateur simulateur Airtel/Moov
│   │   │   ├── payment.factory.js     # Résolution de la passerelle active
│   │   │   └── payment.controller.js  # Webhook & endpoints de simulation
│   │   ├── orders/
│   │   │   ├── order.repository.js    # Accès aux données commandes
│   │   │   ├── order.service.js       # Création et transitions de statuts
│   │   │   └── order.controller.js    # Routes API checkout & suivi
│   │   └── admin/
│   │       ├── auth.service.js        # Hachage et vérification de session
│   │       └── admin.controller.js    # Routes d'administration CMS & gestion
│   ├── public/
│   │   ├── css/
│   │   │   └── style.css              # Styles Tailwind compilés
│   │   ├── js/
│   │   │   ├── store.js               # Logique boutique, filtres, panier, modal
│   │   │   └── admin.js               # Logique du dashboard CMS
│   │   ├── index.html                 # Vitrine publique (Fidélité Stitch)
│   │   └── admin.html                 # Tableau de bord CMS du promoteur
│   └── server.js                      # Point d'entrée de l'application Express
├── tests/
│   ├── unit/
│   │   ├── payment.test.js
│   │   └── order.test.js
│   └── integration/
│       ├── products.api.test.js
│       ├── checkout.api.test.js
│       └── admin.api.test.js
├── package.json
└── vitest.config.js
```

---

## Tasks

### Task 1: Initialisation du Projet & Harness de Tests

**Files:**
- Create: `package.json`
- Create: `vitest.config.js`
- Create: `src/server.js`
- Create: `src/config/env.js`
- Test: `tests/unit/server.test.js`

**Interfaces:**
- Produces: `app` (instance Express exportée pour Supertest) et `config` (variables d'environnement).

- [ ] **Step 1: Écrire le test d'intégrité du serveur**
```javascript
// tests/unit/server.test.js
import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../../src/server.js';

describe('Server Healthcheck', () => {
  it('GET /api/health returns status ok', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: 'ok', service: 'WuazeShop' });
  });
});
```

- [ ] **Step 2: Vérifier que le test échoue**
Run: `npx vitest run tests/unit/server.test.js`
Expected: FAIL avec "Cannot find module ../../src/server.js"

- [ ] **Step 3: Initialiser `package.json`, dépendances et implémenter `src/server.js`**
Installer `express`, `dotenv`, `cors`, `zod`, `better-sqlite3`, `bcryptjs`. Créer le serveur Express minimal avec la route `/api/health`.

- [ ] **Step 4: Vérifier que le test réussit**
Run: `npx vitest run tests/unit/server.test.js`
Expected: PASS

- [ ] **Step 5: Commit**
```bash
git add package.json vitest.config.js src/ tests/
git commit -m "chore: setup project structure, express server and test harness"
```

---

### Task 2: Modèle de Données SQLite & Initialisation

**Files:**
- Create: `src/db/schema.sql`
- Create: `src/db/database.js`
- Create: `src/db/seed.js`
- Test: `tests/unit/database.test.js`

**Interfaces:**
- Produces: `getDb()` retournant l'instance SQLite connectée et initialisée avec tables : `categories`, `products`, `orders`, `admin_users`.

- [ ] **Step 1: Écrire le test unitaire de la base de données**
```javascript
// tests/unit/database.test.js
import { describe, it, expect, beforeEach } from 'vitest';
import { getDb, initDb } from '../../src/db/database.js';

describe('Database Initialization', () => {
  it('creates required tables and seeds default categories', () => {
    const db = initDb(':memory:');
    const categories = db.prepare('SELECT slug FROM categories').all();
    const slugs = categories.map(c => c.slug);
    expect(slugs).toContain('smartphones');
    expect(slugs).toContain('ordinateurs');
    expect(slugs).toContain('televiseurs');
  });
});
```

- [ ] **Step 2: Vérifier que le test échoue**
Run: `npx vitest run tests/unit/database.test.js`
Expected: FAIL avec "Cannot find module ../../src/db/database.js"

- [ ] **Step 3: Implémenter le schéma SQL et le module `database.js`**
Définir les tables `categories`, `products`, `orders` et `admin_users` avec contraintes d'intégrité et valeurs par défaut. Insérer les catégories initiales et les 4 produits phares de la maquette Stitch dans le seed.

- [ ] **Step 4: Vérifier que le test passe**
Run: `npx vitest run tests/unit/database.test.js`
Expected: PASS

- [ ] **Step 5: Commit**
```bash
git add src/db/ tests/unit/database.test.js
git commit -m "feat(db): implement SQLite schema, migrations and initial seed data"
```

---

### Task 3: API Catalogue Produits (Lecture & Filtrage par Catégorie)

**Files:**
- Create: `src/modules/products/product.repository.js`
- Create: `src/modules/products/product.service.js`
- Create: `src/modules/products/product.controller.js`
- Test: `tests/integration/products.api.test.js`

**Interfaces:**
- Produces:
  - `GET /api/products` (supporte query param `?category=smartphones`)
  - `GET /api/products/:id` (détail d'un produit avec specs et prix en FCFA)
  - `GET /api/categories` (liste des univers disponibles)

- [ ] **Step 1: Écrire les tests d'intégration du catalogue**
```javascript
// tests/integration/products.api.test.js
import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../../src/server.js';

describe('Products API', () => {
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
    res.body.forEach(item => expect(item.category).toBe('smartphones'));
  });
});
```

- [ ] **Step 2: Vérifier que le test échoue**
Run: `npx vitest run tests/integration/products.api.test.js`
Expected: FAIL 404 sur `/api/products`

- [ ] **Step 3: Implémenter le repository, service et controller produits**
Brancher les routes sur l'application Express dans `src/server.js`.

- [ ] **Step 4: Vérifier que les tests passent**
Run: `npx vitest run tests/integration/products.api.test.js`
Expected: PASS

- [ ] **Step 5: Commit**
```bash
git add src/modules/products/ tests/integration/products.api.test.js
git commit -m "feat(products): implement public catalog query and category filtering"
```

---

### Task 4: Passerelle de Paiement Modulaire & Simulateur Sandbox

**Files:**
- Create: `src/modules/payments/payment.interface.js`
- Create: `src/modules/payments/simulator.gateway.js`
- Create: `src/modules/payments/payment.factory.js`
- Create: `src/modules/payments/payment.controller.js`
- Test: `tests/unit/payment.test.js`

**Interfaces:**
- Produces:
  - `initiatePayment({ orderId, amount, phone, provider }) -> { paymentId, checkoutUrl, status }`
  - `POST /api/payments/simulator/confirm` (déclencheur pour tester le paiement validé sans argent réel)
  - `POST /api/payments/webhook` (réception sécurisée du callback agrégateur)

- [ ] **Step 1: Écrire le test unitaire du simulateur de paiement**
```javascript
// tests/unit/payment.test.js
import { describe, it, expect } from 'vitest';
import { SimulatorGateway } from '../../src/modules/payments/simulator.gateway.js';

describe('Simulator Payment Gateway', () => {
  it('initiates mobile money payment in PENDING state', async () => {
    const gateway = new SimulatorGateway();
    const result = await gateway.initiatePayment({
      orderId: 'WZ-TEST-01',
      amount: 850000,
      phone: '+24174001122',
      provider: 'AIRTEL_MONEY'
    });
    expect(result.status).toBe('PENDING');
    expect(result.transactionReference).toBeDefined();
  });

  it('verifies payment idempotence on duplicate notifications', async () => {
    const gateway = new SimulatorGateway();
    const pay = await gateway.initiatePayment({ orderId: 'WZ-TEST-02', amount: 50000, phone: '+24166000000', provider: 'MOOV_MONEY' });
    const firstConfirm = await gateway.confirmPayment(pay.transactionReference);
    const secondConfirm = await gateway.confirmPayment(pay.transactionReference);
    expect(firstConfirm.status).toBe('CONFIRMED_CLEARED');
    expect(secondConfirm.status).toBe('CONFIRMED_CLEARED');
  });
});
```

- [ ] **Step 2: Vérifier que le test échoue**
Run: `npx vitest run tests/unit/payment.test.js`
Expected: FAIL avec "Cannot find module ../../src/modules/payments/simulator.gateway.js"

- [ ] **Step 3: Implémenter l'interface et le simulateur de paiement**
Gérer la génération de référence, le stockage temporaire du statut de paiement et l'émission de confirmation.

- [ ] **Step 4: Vérifier que les tests passent**
Run: `npx vitest run tests/unit/payment.test.js`
Expected: PASS

- [ ] **Step 5: Commit**
```bash
git add src/modules/payments/ tests/unit/payment.test.js
git commit -m "feat(payments): implement modular gateway interface and sandbox simulator"
```

---

### Task 5: Gestion des Commandes & Checkout Sécurisé

**Files:**
- Create: `src/modules/orders/order.repository.js`
- Create: `src/modules/orders/order.service.js`
- Create: `src/modules/orders/order.controller.js`
- Test: `tests/integration/checkout.api.test.js`

**Interfaces:**
- Produces:
  - `POST /api/orders/checkout` (validation Zod, création commande en PENDING, appel passerelle)
  - `GET /api/orders/:orderNumber` (consultation du statut par le client)

- [ ] **Step 1: Écrire les tests de commande et de protection contre les altérations de prix**
```javascript
// tests/integration/checkout.api.test.js
import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../../src/server.js';

describe('Checkout API', () => {
  it('creates order with valid Gabon customer details and ignores tampered client price', async () => {
    const res = await request(app).post('/api/orders/checkout').send({
      productId: 1,
      quantity: 1,
      tamperedPrice: 1000, // tentative de triche
      customerName: 'Jean Mba',
      customerPhone: '+24174001122',
      customerNeighborhood: 'Louis / Libreville',
      paymentMethod: 'AIRTEL_MONEY'
    });
    expect(res.status).toBe(201);
    expect(res.body.orderNumber).toMatch(/^WZ-\d+/);
    expect(res.body.paymentStatus).toBe('PENDING');
    // Le prix doit être celui de la base (ex: 850 000 FCFA), pas 1000 FCFA
    expect(res.body.totalAmount).toBeGreaterThan(1000);
  });

  it('rejects order if WhatsApp phone number is missing or invalid', async () => {
    const res = await request(app).post('/api/orders/checkout').send({
      productId: 1,
      quantity: 1,
      customerName: 'Jean Mba',
      customerPhone: 'invalid-phone',
      customerNeighborhood: 'Glass'
    });
    expect(res.status).toBe(400);
  });
});
```

- [ ] **Step 2: Vérifier que le test échoue**
Run: `npx vitest run tests/integration/checkout.api.test.js`
Expected: FAIL 404 sur `/api/orders/checkout`

- [ ] **Step 3: Implémenter le service de commande avec validation Zod et calcul de prix côté serveur**
Assurer la transition atomique vers `CONFIRMED_CLEARED` lors de la confirmation du paiement.

- [ ] **Step 4: Vérifier que les tests passent**
Run: `npx vitest run tests/integration/checkout.api.test.js`
Expected: PASS

- [ ] **Step 5: Commit**
```bash
git add src/modules/orders/ tests/integration/checkout.api.test.js
git commit -m "feat(orders): implement secure checkout, price recalculation and order state machine"
```

---

### Task 6: Authentification Admin & CMS de Gestion des Produits

**Files:**
- Create: `src/modules/admin/auth.service.js`
- Create: `src/modules/admin/admin.controller.js`
- Test: `tests/integration/admin.api.test.js`

**Interfaces:**
- Produces:
  - `POST /api/admin/login` &rarr; `{ token }`
  - `POST /api/admin/products` (Création produit)
  - `PUT /api/admin/products/:id` (Mise à jour produit & prix)
  - `DELETE /api/admin/products/:id` (Archivage / suppression sécurisée)
  - `GET /api/admin/orders` (Liste des commandes avec coordonnées WhatsApp et quartiers)

- [ ] **Step 1: Écrire les tests d'autorisation et d'administration**
```javascript
// tests/integration/admin.api.test.js
import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../../src/server.js';

describe('Admin CMS API', () => {
  it('blocks unauthorized access to admin product routes', async () => {
    const res = await request(app).post('/api/admin/products').send({ title: 'New Phone' });
    expect(res.status).toBe(401);
  });

  it('allows authenticated admin to add and update products', async () => {
    const login = await request(app).post('/api/admin/login').send({
      username: 'admin',
      password: 'adminpassword123'
    });
    const token = login.body.token;

    const createRes = await request(app)
      .post('/api/admin/products')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'Xiaomi 14 Ultra 512GB',
        category: 'smartphones',
        price: 680000,
        imageUrl: 'https://placehold.co/400',
        specs: ['Leica Optics', 'Snapdragon 8 Gen 3']
      });
    expect(createRes.status).toBe(201);
  });
});
```

- [ ] **Step 2: Vérifier que le test échoue**
Run: `npx vitest run tests/integration/admin.api.test.js`
Expected: FAIL 404 sur `/api/admin/login`

- [ ] **Step 3: Implémenter l'authentification admin par token et le CRUD sécurisé**
Ajouter middleware de vérification d'authentification pour protéger les routes d'administration.

- [ ] **Step 4: Vérifier que les tests passent**
Run: `npx vitest run tests/integration/admin.api.test.js`
Expected: PASS

- [ ] **Step 5: Commit**
```bash
git add src/modules/admin/ tests/integration/admin.api.test.js
git commit -m "feat(admin): implement secure CMS authentication, product CRUD and orders dashboard API"
```

---

### Task 7: Interface Vitrine Publique & Checkout (Fidélité Google Stitch)

**Files:**
- Create: `src/public/index.html`
- Create: `src/public/js/store.js`
- Create: `src/public/css/style.css`
- Modify: `src/server.js` (servir le dossier `src/public` statiquement)

**Interfaces:**
- Produces: Vitrine web complète intégrant la charte Google Stitch, filtrage réactif des 3 catégories, affichage des prix en FCFA, modal de panier & checkout avec simulation Mobile Money, et boutons WhatsApp interactifs.

- [ ] **Step 1: Intégrer la page `index.html` avec le template Stitch haute fidélité**
Reprendre la structure HTML validée avec Tailwind CSS, polices Google *Plus Jakarta Sans* & *Inter*, et icônes Material Symbols Outlined.

- [ ] **Step 2: Implémenter `src/public/js/store.js`**
Gérer le chargement dynamique des produits depuis `/api/products`, le filtrage par onglets (`Smartphones`, `Ordinateurs`, `Téléviseurs`), le panier interactif et la soumission du formulaire de checkout.

- [ ] **Step 3: Intégrer la modal de simulation Mobile Money**
Afficher la saisie du numéro Airtel/Moov Money, un bouton de simulation « Valider le paiement USSD », et la génération automatique du message WhatsApp avec numéro de commande.

- [ ] **Step 4: Vérifier le bon chargement et l'interactivité dans le navigateur**
Run: Vérifier via tests d'intégration statiques ou navigateur que `GET /` renvoie le HTML complet avec statut 200.

- [ ] **Step 5: Commit**
```bash
git add src/public/ src/server.js
git commit -m "feat(ui): implement Stitch-fidelity public storefront, category tabs and checkout modal"
```

---

### Task 8: Tableau de Bord Administrateur (CMS)

**Files:**
- Create: `src/public/admin.html`
- Create: `src/public/js/admin.js`

**Interfaces:**
- Produces: Interface de gestion privée pour le promoteur permettant de se connecter, consulter les commandes avec filtres de statut, ajouter de nouveaux produits au catalogue et ajuster les prix en FCFA.

- [ ] **Step 1: Créer l'interface `admin.html` (Design épuré et moderne en accord avec la charte émeraude)**
Composants : formulaire de connexion, onglet « Gestion du catalogue » (formulaire d'ajout + tableau des articles existants avec bouton modifier/supprimer), onglet « Commandes & Expéditions » (tableau des commandes avec nom du client, WhatsApp cliquable, quartier et badge de paiement).

- [ ] **Step 2: Implémenter la logique `src/public/js/admin.js`**
Stockage du token de session dans `sessionStorage`, appels aux endpoints `/api/admin/*`, alertes de confirmation d'action, et mise à jour dynamique des tableaux.

- [ ] **Step 3: Vérifier manuellement et par test l'accès et les actions CRUD**
Tester l'ajout d'un nouveau produit via l'interface et vérifier qu'il apparaît immédiatement sur la boutique publique `index.html`.

- [ ] **Step 4: Commit**
```bash
git add src/public/admin.html src/public/js/admin.js
git commit -m "feat(cms): implement dedicated admin dashboard for catalog and orders management"
```

---

### Task 9: Tests de Bout en Bout (E2E) & Validation Finale

**Files:**
- Create: `tests/integration/e2e.flow.test.js`

**Interfaces:**
- Valide le scénario complet :
  1. Le promoteur ajoute un produit via le CMS.
  2. Le client consulte la catégorie correspondante et ajoute l'article au panier.
  3. Le client passe commande avec son numéro WhatsApp et son quartier.
  4. Le paiement Mobile Money est simulé et validé.
  5. La commande passe à `CONFIRMED_CLEARED`.
  6. Le promoteur voit la commande validée prête pour achat en Chine avec le contact WhatsApp du client.

- [ ] **Step 1: Écrire le test d'intégration du flux complet**
```javascript
// tests/integration/e2e.flow.test.js
import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../../src/server.js';

describe('Full E2E Customer to Procurement Flow', () => {
  it('executes the full lifecycle from order to confirmed settlement', async () => {
    // 1. Consultation catalogue
    const productsRes = await request(app).get('/api/products?category=smartphones');
    expect(productsRes.status).toBe(200);
    const product = productsRes.body[0];

    // 2. Checkout
    const checkoutRes = await request(app).post('/api/orders/checkout').send({
      productId: product.id,
      quantity: 1,
      customerName: 'Patrice Ondo',
      customerPhone: '+24177123456',
      customerNeighborhood: 'Akébé / Libreville',
      paymentMethod: 'AIRTEL_MONEY'
    });
    expect(checkoutRes.status).toBe(201);
    const { orderNumber, transactionReference } = checkoutRes.body;

    // 3. Confirmation paiement simulateur
    const confirmRes = await request(app).post('/api/payments/simulator/confirm').send({
      transactionReference
    });
    expect(confirmRes.status).toBe(200);

    // 4. Vérification statut commande
    const orderRes = await request(app).get(`/api/orders/${orderNumber}`);
    expect(orderRes.body.paymentStatus).toBe('CONFIRMED_CLEARED');
    expect(orderRes.body.fulfillmentStatus).toBe('AWAITING_PROCUREMENT');
  });
});
```

- [ ] **Step 2: Exécuter tous les tests pour s'assurer que l'intégralité de la suite passe**
Run: `npx vitest run`
Expected: 100% PASS

- [ ] **Step 3: Commit final de validation**
```bash
git add tests/
git commit -m "test(e2e): verify end-to-end purchasing, settlement and CMS management lifecycle"
```
