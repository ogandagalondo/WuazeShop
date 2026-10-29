# Plan d'Implémentation : Calcul et Facturation du Fret Cargo Aérien & Paiement par Carte

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implémenter la tarification et le calcul transparent des frais de transport aérien cargo Chine → Gabon (Colis Normal 10 000 FCFA/kg vs Colis Rapide 13 500 FCFA/kg), la gestion du poids des articles avec calculateur volumétrique en admin, la configuration dynamique des tarifs dans le CMS, l'ajout du paiement par Carte Bancaire (Visa/Mastercard) et le nettoyage de toutes les mentions « fret inclus » sur la boutique.

**Architecture:** 
- Base de données SQLite : extension des tables `products` (colonne `weight`) et `orders` (`shipping_method`, `shipping_fee`, `total_weight`), initialisation de la clé `cargo_settings` dans `site_settings`.
- Moteur de calcul côté serveur (`order.service.js` & `shipping.service.js`) et côté client (`store.js`, `product.js`) pour appliquer $Poids \times Tarif/kg$.
- Paiement : extension de la passerelle simulée pour accepter `CREDIT_CARD` en plus de `AIRTEL_MONEY` et `MOOV_MONEY`.
- Interface d'administration : champs de poids et calculateur volumétrique sur la fiche produit, et section CMS dédiée aux tarifs cargo.
- Vitrine et tunnel d'achat : affichage du poids, sélecteur radio Normal/Rapide dans le tiroir panier avec encart explicatif, ventilation claire au checkout et design 100% responsive.

**Tech Stack:** Node.js, Express, SQLite (`node:sqlite`), Vanilla JS, Tailwind CSS, Vitest.

**Spec:** [`docs/superpowers/specs/2026-10-29-fret-cargo-shipping-design.md`](file:///c:/Users/Excalibur/OneDrive/Bureau/WuazeShop/docs/superpowers/specs/2026-10-29-fret-cargo-shipping-design.md)

## Global Constraints
- `Colis Normal` : tarif par défaut 10 000 FCFA / kg, délai annoncé 2 semaines.
- `Colis Rapide` : tarif par défaut 13 500 FCFA / kg, délai annoncé 1 semaine.
- Poids minimum taxable : 0,1 kg.
- Moyens de paiement supportés : `AIRTEL_MONEY`, `MOOV_MONEY`, `CREDIT_CARD`.
- Compatibilité descendante : les commandes existantes sans frais de port doivent rester valides sans erreur.
- Mobile First : les sélecteurs de paiement et de livraison doivent être optimisés pour les petits écrans (320px+).

## Review Focus
- Panier avec articles multiples : la somme des poids doit être correctement calculée sans erreurs d'arrondi décimal en virgule flottante.
- Calculateur volumétrique : la formule $L \times l \times H / 5000$ ne doit mettre à jour le poids que si le poids volumétrique est supérieur au poids réel.
- Mode de livraison non spécifié : le système doit appliquer par défaut `normal`.
- Paiement par carte : le simulateur doit valider la saisie et créer la commande avec le statut approprié.
- Sauvegarde CMS : la modification des tarifs cargo depuis l'admin doit impacter immédiatement le calcul sur la boutique sans redémarrage serveur.

---

### Task 1: Modèle de Données & Calcul du Fret Cargo (Backend)

**Files:**
- Create: `src/modules/orders/shipping.service.js`
- Modify: `src/db/schema.sql:35-70`
- Modify: `src/db/seed.js:180-220`
- Create: `tests/unit/shipping.test.js`

**Interfaces:**
- Consumes: `site_settings.cargo_settings`
- Produces: `calculateShippingFee(totalWeight, method, cargoSettings)`

- [ ] **Step 1: Write the failing unit tests for shipping calculation**

```javascript
// tests/unit/shipping.test.js
import { describe, it, expect } from 'vitest';
import { calculateShippingFee, calculateVolumetricWeight } from '../../src/modules/orders/shipping.service.js';

describe('Shipping Service', () => {
  it('calculates Normal cargo fee at 10,000 FCFA/kg', () => {
    const fee = calculateShippingFee(0.4, 'normal', { normalRate: 10000, expressRate: 13500 });
    expect(fee).toBe(4000);
  });

  it('calculates Express cargo fee at 13,500 FCFA/kg', () => {
    const fee = calculateShippingFee(2.0, 'express', { normalRate: 10000, expressRate: 13500 });
    expect(fee).toBe(27000);
  });

  it('enforces minimum weight floor of 0.1 kg', () => {
    const fee = calculateShippingFee(0.02, 'normal', { normalRate: 10000, expressRate: 13500, minWeight: 0.1 });
    expect(fee).toBe(1000);
  });

  it('calculates volumetric weight correctly (L*W*H / 5000)', () => {
    const volWeight = calculateVolumetricWeight(30, 20, 10); // 6000 / 5000 = 1.2 kg
    expect(volWeight).toBe(1.2);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**
Run: `npx vitest run tests/unit/shipping.test.js`  
Expected: FAIL with module not found

- [ ] **Step 3: Implement `src/modules/orders/shipping.service.js`**
Create the pure helper functions `calculateShippingFee` and `calculateVolumetricWeight`.

- [ ] **Step 4: Update `src/db/schema.sql` and `src/db/seed.js`**
Add `weight` column to `products`, add `shipping_method`, `shipping_fee`, `total_weight` to `orders`, and seed `cargo_settings` in `defaultSettings`.

- [ ] **Step 5: Run tests to verify they pass**
Run: `npx vitest run tests/unit/shipping.test.js`  
Expected: PASS

- [ ] **Step 6: Commit**
```bash
git add src/modules/orders/shipping.service.js src/db/schema.sql src/db/seed.js tests/unit/shipping.test.js
git commit -m "feat(shipping): implement cargo shipping fee and volumetric calculation service"
```

---

### Task 2: Intégration Commande, Poids & Paiement Carte Bancaire (Backend API)

**Files:**
- Modify: `src/modules/products/product.repository.js:20-60`
- Modify: `src/modules/orders/order.service.js:40-120`
- Modify: `src/modules/payments/simulator.gateway.js:10-50`
- Modify: `src/modules/payments/payment.factory.js:1-25`
- Modify: `tests/integration/checkout.api.test.js:10-90`

**Interfaces:**
- Consumes: `calculateShippingFee`
- Produces: `OrderService.createOrder` accepting `shippingMethod` and `CREDIT_CARD` payment

- [ ] **Step 1: Write integration tests for cargo shipping & card payment**
In `tests/integration/checkout.api.test.js`, add test cases for:
1. Creating an order with `shippingMethod: 'express'`, verifying `shipping_fee` and `total_amount = subtotal + shipping_fee`.
2. Paying via `paymentMethod: 'CREDIT_CARD'`.

- [ ] **Step 2: Run test to verify it fails**
Run: `npx vitest run tests/integration/checkout.api.test.js`  
Expected: FAIL

- [ ] **Step 3: Implement updates in repository, service, and payment gateway**
1. In `product.repository.js`: include `weight` in SELECT, INSERT, and UPDATE queries.
2. In `order.service.js`: fetch product weights, compute `totalWeight`, calculate `shippingFee`, and store in `orders` table.
3. In `payment.factory.js` and `simulator.gateway.js`: register and handle `CREDIT_CARD`.

- [ ] **Step 4: Run integration tests to verify they pass**
Run: `npx vitest run tests/integration/checkout.api.test.js`  
Expected: PASS (7/7 tests)

- [ ] **Step 5: Commit**
```bash
git add src/modules/products/product.repository.js src/modules/orders/order.service.js src/modules/payments/ tests/integration/checkout.api.test.js
git commit -m "feat(api): persist product weight, cargo shipping fees and credit card payment support"
```

---

### Task 3: Administration CMS — Tarifs Cargo & Poids des Produits (Admin UI)

**Files:**
- Modify: `src/public/admin.html:360-460,1100-1250`
- Modify: `src/public/js/admin.js:1600-1900`
- Modify: `tests/integration/admin.api.test.js`

**Interfaces:**
- Consumes: `/api/admin/settings/cargo_settings`
- Produces: Form inputs for product weight + volumetric calculator + CMS cargo rates section

- [ ] **Step 1: Update `admin.html`**
1. In Product Modal: add input `Poids d'expédition (kg)` with toggleable mini-calculator: Longueur, Largeur, Hauteur (cm) and button `Calculer le volume`.
2. In CMS tab: add section `Grille Tarifaire Cargo & Fret Aérien` with inputs for:
   - Tarif Colis Normal (FCFA/kg)
   - Délai Colis Normal
   - Tarif Colis Rapide (FCFA/kg)
   - Délai Colis Rapide
   - Poids minimum taxable (kg)
   - Bouton `Enregistrer les Tarifs Cargo`

- [ ] **Step 2: Update `admin.js`**
1. Wire product weight input and volumetric calculator (`(L * l * h) / 5000`).
2. Include `weight` in product create/update payload.
3. Load and save `cargo_settings` via `saveCmsSection('cargo_settings', payload, 'cms-cargo-saved')`.

- [ ] **Step 3: Test and verify admin settings**
Run: `npx vitest run tests/integration/admin.api.test.js`  
Expected: PASS

- [ ] **Step 4: Commit**
```bash
git add src/public/admin.html src/public/js/admin.js tests/integration/admin.api.test.js
git commit -m "feat(admin): add product weight management, volumetric helper and CMS cargo rates card"
```

---

### Task 4: Expérience Client — Panier, Fiche Produit & Checkout 3 Moyens de Paiement (Storefront)

**Files:**
- Modify: `src/public/js/store.js:300-500`
- Modify: `src/public/index.html:840-880`
- Modify: `src/public/product.html:640-670`
- Modify: `src/public/js/product.js:400-550`

**Interfaces:**
- Consumes: `/api/settings` (`cargo_settings`) and product `weight`
- Produces: Interactive shipping rate selector in Cart Drawer and 3-option responsive checkout modal (Airtel, Moov, Carte)

- [ ] **Step 1: Fiche Produit (`product.html` / `product.js`)**
1. Display transparent shipping estimation badge under price: `✈️ Fret cargo dès X FCFA (Poids: Y kg) • Délais: 1 à 2 semaines`.
2. Add Carte Bancaire in checkout modal.

- [ ] **Step 2: Tiroir Panier (`index.html`, `store.js`)**
1. Display total cumulative weight.
2. Render radio selector for Colis Normal vs Colis Rapide with dynamically calculated amounts.
3. Add explanatory reassurance note: *"Fret cargo aérien direct Shenzhen → Libreville avec dédouanement inclus."*
4. Detail line items: Sous-total articles + Fret cargo aérien = Total à payer.

- [ ] **Step 3: Modal de Paiement Checkout (`index.html`, `product.html`, `category.html`, `categories.html`)**
1. Transform payment radio grid to 3 responsive options:
   - 📱 Airtel Money (Gabon)
   - 📱 Moov Money (Gabon)
   - 💳 Carte Bancaire (Visa / Mastercard)
2. If `CREDIT_CARD` is selected, show card inputs (Numéro de carte, Date expiration MM/AA, CVV) in the simulation flow.

- [ ] **Step 4: Run full test suite**
Run: `npm test`  
Expected: PASS (all tests green)

- [ ] **Step 5: Commit**
```bash
git add src/public/index.html src/public/product.html src/public/js/store.js src/public/js/product.js
git commit -m "feat(store): add interactive cargo options in cart, weight breakdown and credit card checkout"
```

---

### Task 5: Harmonisation du Copywriting sur l'ensemble du Site

**Files:**
- Modify: `src/public/index.html`
- Modify: `src/public/categories.html`
- Modify: `src/public/category.html`
- Modify: `src/public/about.html`
- Modify: `src/public/tracking.html`
- Modify: `src/public/product.html`
- Modify: `src/db/seed.js`

- [ ] **Step 1: Clean up "Fret inclus" across all templates**
Replace all misleading mentions of "Fret cargo aérien inclus" / "Livraison incluse" with transparent, value-focused copy:
- `🇨🇳 Import direct usine Shenzhen → 🇬🇦 Gabon • Fret cargo aérien au poids exact • Airtel, Moov & Carte Bancaire`
- In reassurance badges: `Fret Cargo Aérien Express` instead of `Fret Cargo Aérien Inclus`.

- [ ] **Step 2: Run full test suite**
Run: `npm test`  
Expected: PASS (all tests pass)

- [ ] **Step 3: Commit and Push**
```bash
git add .
git commit -m "refactor(copy): harmonize site-wide messaging to transparent weight-based cargo freight"
git push origin main
```
