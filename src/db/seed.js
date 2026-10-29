import bcrypt from 'bcryptjs';
import { config } from '../config/env.js';

export function seedData(db) {
  // 1. Seed Categories (Full 6 categories matching TechNova storefront & CMS)
  const categories = [
    { 
      name: 'Smartphones & Tablettes', 
      slug: 'smartphones', 
      icon: 'smartphone',
      description: 'Les plus récents smartphones flagships Apple, Samsung et Xiaomi importés directement d’usines certifiées avec garantie 12 mois.',
      banner_url: '/images/hero-devices.jpg'
    },
    { 
      name: 'Ordinateurs & MacBooks', 
      slug: 'ordinateurs', 
      icon: 'laptop_mac',
      description: 'Laptops performants, ultrabooks professionnels et MacBooks Apple Silicon pour la productivité et le gaming.',
      banner_url: '/images/promo-banner.jpg'
    },
    { 
      name: 'Téléviseurs & Écrans', 
      slug: 'televiseurs', 
      icon: 'tv',
      description: 'Smart TV 4K UHD, dalles OLED & QLED sans bordure avec Dolby Vision et applications intégrées.',
      banner_url: '/images/promo-banner.jpg'
    },
    { 
      name: 'Audio, Casques & Écouteurs', 
      slug: 'audio', 
      icon: 'headphones',
      description: 'Casques à réduction de bruit active, écouteurs True Wireless et enceintes haute-fidélité pour audiophiles.',
      banner_url: '/images/hero-devices.jpg'
    },
    { 
      name: 'Montres Connectées', 
      slug: 'montres', 
      icon: 'watch',
      description: 'Smartwatches et bracelets connectés pour le suivi santé, sport et notifications instantanées.',
      banner_url: '/images/hero-devices.jpg'
    },
    { 
      name: 'Accessoires & Câbles', 
      slug: 'accessoires', 
      icon: 'electrical_services',
      description: 'Chargeurs rapides 20W/65W, câbles certifiés et coques de protection premium.',
      banner_url: '/images/hero-devices.jpg'
    }
  ];

  const insertOrUpdateCategory = db.prepare(`
    INSERT INTO categories (name, slug, icon, description, banner_url) 
    VALUES (?, ?, ?, ?, ?)
    ON CONFLICT(slug) DO UPDATE SET 
      description = COALESCE(categories.description, excluded.description),
      banner_url = COALESCE(categories.banner_url, excluded.banner_url)
  `);
  for (const cat of categories) {
    insertOrUpdateCategory.run(cat.name, cat.slug, cat.icon, cat.description, cat.banner_url);
  }

  // 2. Seed Products across categories with multi-angle gallery images
  const products = [
    {
      title: 'iPhone 15 Pro Max 256GB - Titane Naturel',
      slug: 'iphone-15-pro-max-256gb',
      category: 'smartphones',
      price: 850000,
      original_price: 945000,
      image_url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuA3oZiOSh4V_dQXhR1yfB2D4Biuk0f3TaCrRVJ6N8YFUKcdAs7m4TBi82JF-FkY6IUShOnKyBRKToT2NUeLrvUBaSHpbOfUsWoIk6VLiKQz-0zc353-9qCIIWTDiOGlSsnPeWlB_-CGhrz3Da7IxG1xxbOgxFTO9m8-38f-2ygBr5-q7oeY_MI1mVFuQII3VAxgrGTx30pOd0xddnEOzB1G5s4bvkO-yYv3qF7ewfU3JFEPDbT0wLCj',
      images: [
        'https://lh3.googleusercontent.com/aida-public/AB6AXuA3oZiOSh4V_dQXhR1yfB2D4Biuk0f3TaCrRVJ6N8YFUKcdAs7m4TBi82JF-FkY6IUShOnKyBRKToT2NUeLrvUBaSHpbOfUsWoIk6VLiKQz-0zc353-9qCIIWTDiOGlSsnPeWlB_-CGhrz3Da7IxG1xxbOgxFTO9m8-38f-2ygBr5-q7oeY_MI1mVFuQII3VAxgrGTx30pOd0xddnEOzB1G5s4bvkO-yYv3qF7ewfU3JFEPDbT0wLCj',
        '/uploads/1792656440385-153988-2-1_large.jpg',
        '/images/hero-devices.jpg'
      ],
      specs: JSON.stringify(['Puce A17 Pro', 'Châssis Titane', 'Appareil Photo 48Mpx', 'Garantie 1 An']),
      colors: JSON.stringify(['#9c9589', '#39383b', '#293644']),
      weight: 0.4,
      in_stock: 1
    },
    {
      title: 'MacBook Air 15" M3 - 16GB RAM / 512GB SSD',
      slug: 'macbook-air-15-m3-16gb-512gb',
      category: 'ordinateurs',
      price: 1120000,
      original_price: 1250000,
      image_url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBjdlhDo-8WD0FFJ6WVxV5jVeFQef_GSaDK4eNpz6f-w5OuHzD2kGQSVegev_PS1lwVQHX08EN35glOTCrRbmjfoX_Rj774QhNOREmQK8ZgOEO5_6a5scQ0aev1ujbFC18WVrK4ACgqiTlpos-m2Cz2u8EDQNns0HP3TSM5OpkTRSHKopetwIv_i7CZzcguzSSbJa6Cep06cE2n6nHo9UP8_gFyYSDkCscgCt6_7-ptQd1MfV4suvmR',
      images: [
        'https://lh3.googleusercontent.com/aida-public/AB6AXuBjdlhDo-8WD0FFJ6WVxV5jVeFQef_GSaDK4eNpz6f-w5OuHzD2kGQSVegev_PS1lwVQHX08EN35glOTCrRbmjfoX_Rj774QhNOREmQK8ZgOEO5_6a5scQ0aev1ujbFC18WVrK4ACgqiTlpos-m2Cz2u8EDQNns0HP3TSM5OpkTRSHKopetwIv_i7CZzcguzSSbJa6Cep06cE2n6nHo9UP8_gFyYSDkCscgCt6_7-ptQd1MfV4suvmR',
        '/images/promo-banner.jpg',
        '/images/hero-devices.jpg'
      ],
      specs: JSON.stringify(['Puce Apple M3', '18h Autonomie', 'Écran Liquid Retina 15.3"', 'Minuit / Argent']),
      colors: JSON.stringify(['#1e2530', '#d2d4d7', '#f0e4d3']),
      weight: 2.2,
      in_stock: 1
    },
    {
      title: 'Smart TV 55" Frameless 4K UHD HDR10+ Android TV',
      slug: 'smart-tv-55-frameless-4k-uhd',
      category: 'televiseurs',
      price: 340000,
      original_price: 390000,
      image_url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCAoCZreaDQzXo7TH8NC7JN3QcNX-yLTZ6mNttOaZ-hCrgNUhLCC21W-LoErIa2dhmSXrPlGzqD6oO3lXy2RgwNVQaa71luZeR1WeXWfGc9-70DKTGGcAX1WFdhBhUulIlM7WaQk2ARTa7OZ_4nxjK9Pc40In-fcNJJrjCK2DWQiPU_z6MB4KC6-wlPOJRStY9MRc0f4ajUks_JcthPg6Dd_tj69TLEr95dH4wYqMDFZKIrwnqbodcP',
      images: [
        'https://lh3.googleusercontent.com/aida-public/AB6AXuCAoCZreaDQzXo7TH8NC7JN3QcNX-yLTZ6mNttOaZ-hCrgNUhLCC21W-LoErIa2dhmSXrPlGzqD6oO3lXy2RgwNVQaa71luZeR1WeXWfGc9-70DKTGGcAX1WFdhBhUulIlM7WaQk2ARTa7OZ_4nxjK9Pc40In-fcNJJrjCK2DWQiPU_z6MB4KC6-wlPOJRStY9MRc0f4ajUks_JcthPg6Dd_tj69TLEr95dH4wYqMDFZKIrwnqbodcP',
        '/images/promo-banner.jpg'
      ],
      specs: JSON.stringify(['Dalle 4K UHD', 'Dolby Audio 20W', 'Android TV avec Netflix & YouTube', 'HDMI 2.1 & Wi-Fi']),
      colors: JSON.stringify(['#1e1e1e']),
      weight: 14.5,
      in_stock: 1
    },
    {
      title: 'Sony WH-1000XM5 Casque Sans Fil Réduction Active',
      slug: 'sony-wh-1000xm5-noir',
      category: 'audio',
      price: 245000,
      original_price: 270000,
      image_url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDBtf1O_TqqbqtsE5eEvmaAEA_QLuqtj3_Q2z0_suXprXxImVVWWgFkHG5vSiSQJsINWn0asEqus-2xfSDUAHqjQifBQ5H_oCrpVmdliHPGrknUMmAouWr0MvWPZFaHxw-t7tD5mO2l4oEYtm2eVWeJErUuqKVhWZOl89csbdY32F0j9Zc4QFv--Q-0358HeCZkqGuhPgHmTOAEljH6GKxFWL_NO9wqpFUBAckPfsd6ykHmaeJ39l6Y',
      images: [
        'https://lh3.googleusercontent.com/aida-public/AB6AXuDBtf1O_TqqbqtsE5eEvmaAEA_QLuqtj3_Q2z0_suXprXxImVVWWgFkHG5vSiSQJsINWn0asEqus-2xfSDUAHqjQifBQ5H_oCrpVmdliHPGrknUMmAouWr0MvWPZFaHxw-t7tD5mO2l4oEYtm2eVWeJErUuqKVhWZOl89csbdY32F0j9Zc4QFv--Q-0358HeCZkqGuhPgHmTOAEljH6GKxFWL_NO9wqpFUBAckPfsd6ykHmaeJ39l6Y',
        '/images/hero-devices.jpg'
      ],
      specs: JSON.stringify(['Réduction Active de Bruit Pro', 'Audio Haute Résolution LDAC', '30h Autonomie']),
      colors: JSON.stringify(['#1e1e1e', '#d7d5cb']),
      weight: 0.8,
      in_stock: 1
    },
    {
      title: 'Apple Watch Ultra 2 GPS + Cellular 49mm Titane',
      slug: 'apple-watch-ultra-2-titane',
      category: 'montres',
      price: 590000,
      original_price: 650000,
      image_url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBjdlhDo-8WD0FFJ6WVxV5jVeFQef_GSaDK4eNpz6f-w5OuHzD2kGQSVegev_PS1lwVQHX08EN35glOTCrRbmjfoX_Rj774QhNOREmQK8ZgOEO5_6a5scQ0aev1ujbFC18WVrK4ACgqiTlpos-m2Cz2u8EDQNns0HP3TSM5OpkTRSHKopetwIv_i7CZzcguzSSbJa6Cep06cE2n6nHo9UP8_gFyYSDkCscgCt6_7-ptQd1MfV4suvmR',
      images: [
        'https://lh3.googleusercontent.com/aida-public/AB6AXuBjdlhDo-8WD0FFJ6WVxV5jVeFQef_GSaDK4eNpz6f-w5OuHzD2kGQSVegev_PS1lwVQHX08EN35glOTCrRbmjfoX_Rj774QhNOREmQK8ZgOEO5_6a5scQ0aev1ujbFC18WVrK4ACgqiTlpos-m2Cz2u8EDQNns0HP3TSM5OpkTRSHKopetwIv_i7CZzcguzSSbJa6Cep06cE2n6nHo9UP8_gFyYSDkCscgCt6_7-ptQd1MfV4suvmR',
        '/images/hero-devices.jpg'
      ],
      specs: JSON.stringify(['Boîtier Titane 49mm', 'Autonomie 72h', 'GPS Double Fréquence', 'Écran 3000 nits']),
      colors: JSON.stringify(['#9c9589', '#f97316']),
      weight: 0.3,
      in_stock: 1
    },
    {
      title: 'Chargeur Rapide 65W GaN Dual USB-C + USB-A',
      slug: 'chargeur-rapide-65w-gan',
      category: 'accessoires',
      price: 25000,
      original_price: 32000,
      image_url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuA3oZiOSh4V_dQXhR1yfB2D4Biuk0f3TaCrRVJ6N8YFUKcdAs7m4TBi82JF-FkY6IUShOnKyBRKToT2NUeLrvUBaSHpbOfUsWoIk6VLiKQz-0zc353-9qCIIWTDiOGlSsnPeWlB_-CGhrz3Da7IxG1xxbOgxFTO9m8-38f-2ygBr5-q7oeY_MI1mVFuQII3VAxgrGTx30pOd0xddnEOzB1G5s4bvkO-yYv3qF7ewfU3JFEPDbT0wLCj',
      images: [
        'https://lh3.googleusercontent.com/aida-public/AB6AXuA3oZiOSh4V_dQXhR1yfB2D4Biuk0f3TaCrRVJ6N8YFUKcdAs7m4TBi82JF-FkY6IUShOnKyBRKToT2NUeLrvUBaSHpbOfUsWoIk6VLiKQz-0zc353-9qCIIWTDiOGlSsnPeWlB_-CGhrz3Da7IxG1xxbOgxFTO9m8-38f-2ygBr5-q7oeY_MI1mVFuQII3VAxgrGTx30pOd0xddnEOzB1G5s4bvkO-yYv3qF7ewfU3JFEPDbT0wLCj'
      ],
      specs: JSON.stringify(['Technologie GaN III', 'Charge Rapide 65W', 'Compatible iPhone & MacBook', 'Protection Surtension']),
      colors: JSON.stringify(['#ffffff', '#1e1e1e']),
      weight: 0.2,
      in_stock: 1
    }
  ];

  const insertProduct = db.prepare(
    `INSERT OR IGNORE INTO products (title, slug, category, price, original_price, image_url, images, specs, colors, weight, in_stock)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  );
  for (const p of products) {
    const imagesVal = p.images ? JSON.stringify(p.images) : JSON.stringify([p.image_url]);
    insertProduct.run(p.title, p.slug, p.category, p.price, p.original_price, p.image_url, imagesVal, p.specs, p.colors, p.weight ?? 0.4, p.in_stock);
    
    // Update existing products if images is null or empty, and update weight
    db.prepare(`UPDATE products SET images = ? WHERE slug = ? AND (images IS NULL OR images = '' OR images = '[]')`).run(imagesVal, p.slug);
    db.prepare(`UPDATE products SET weight = ? WHERE slug = ? AND (weight IS NULL OR weight = 0.4 OR weight = 0)`).run(p.weight ?? 0.4, p.slug);
  }

  // 3. Seed Super Admin (Fondateur) depuis .env ou fixtures en environnement de test
  const isTest = process.env.NODE_ENV === 'test';
  const targetUsername = isTest ? 'admin' : (config.adminUsername || 'admin');
  const targetEmail = isTest ? 'admin@wuazeshop.ga' : (config.adminEmail || 'admin@wuazeshop.ga');
  const targetFullName = isTest ? 'Fondateur WuazeShop' : (config.adminFullName || 'Fondateur WuazeShop');
  const targetPassword = isTest ? 'adminpassword123' : (config.adminPassword || 'adminpassword123');

  const adminCheck = db.prepare(`
    SELECT id, email, username, role, full_name, password_hash 
    FROM admin_users 
    WHERE role = 'SUPER_ADMIN' OR username = ? OR email = ?
    ORDER BY id ASC LIMIT 1
  `).get(targetUsername, targetEmail);

  if (!adminCheck) {
    const salt = bcrypt.genSaltSync(10);
    const hash = bcrypt.hashSync(targetPassword, salt);
    db.prepare(`
      INSERT INTO admin_users (username, email, full_name, role, password_hash, is_active) 
      VALUES (?, ?, ?, 'SUPER_ADMIN', ?, 1)
    `).run(targetUsername, targetEmail, targetFullName, hash);
  } else {
    const updates = ['username = ?', 'email = ?', 'full_name = ?', "role = 'SUPER_ADMIN'", 'is_active = 1'];
    const params = [targetUsername, targetEmail, targetFullName];

    if (!isTest && process.env.ADMIN_PASSWORD && process.env.ADMIN_PASSWORD.trim().length >= 6) {
      const salt = bcrypt.genSaltSync(10);
      const hash = bcrypt.hashSync(process.env.ADMIN_PASSWORD.trim(), salt);
      updates.push('password_hash = ?');
      params.push(hash);
    } else if (isTest) {
      const salt = bcrypt.genSaltSync(10);
      const hash = bcrypt.hashSync('adminpassword123', salt);
      updates.push('password_hash = ?');
      params.push(hash);
    }

    params.push(adminCheck.id);
    db.prepare(`UPDATE admin_users SET ${updates.join(', ')} WHERE id = ?`).run(...params);
  }


  // 4. Seed default Site Settings (CMS Sections)
  const defaultSettings = [
    {
      key: 'announcement_bar',
      value: JSON.stringify({
        enabled: true,
        text: '🇨🇳 Shenzhen → 🇬🇦 Gabon | Fret cargo pesé au gramme près | Airtel Money, Moov Money et Carte Bancaire',
        secondaryText: '✈️ Deux formules au choix : Colis Rapide (1 semaine à 13 500 F/kg) ou Colis Normal (2 semaines à 10 000 F/kg)'
      })
    },
    {
      key: 'cargo_settings',
      value: JSON.stringify({
        normalRate: 10000,
        normalDelay: '2 semaines',
        expressRate: 13500,
        expressDelay: '1 semaine',
        minWeight: 0.1
      })
    },
    {
      key: 'hero_section',
      value: JSON.stringify({
        badge: '✦ Import direct d\'usine Shenzhen',
        title: 'Vos appareils high-tech neufs\nau prix direct de Shenzhen',
        subtitle: 'Commandez vos smartphones, ordinateurs et écrans au tarif d\'usine. Chaque colis est vérifié à Shenzhen, expédié en vol cargo et remis en main propre à Libreville dès 10 000 FCFA le kilo.',
        ctaText: 'Voir les produits et tarifs',
        ctaLink: '/categories',
        imageUrl: '/images/hero-devices.jpg',
        prop1Title: 'Colis Normal : 2 semaines',
        prop1Sub: '10 000 FCFA par kilo',
        prop2Title: 'Colis Rapide : 1 semaine',
        prop2Sub: '13 500 FCFA par kilo',
        prop3Title: 'Airtel, Moov et CB',
        prop3Sub: 'Règlement sécurisé en FCFA',
        prop4Title: '100% Neuf sous blister',
        prop4Sub: 'Contrôle visuel avant vol'
      })
    },
    {
      key: 'promo_section',
      value: JSON.stringify({
        badge: 'Économie directe usine',
        title: 'Jusqu\'à 30% d\'économie',
        subtitle: 'face aux boutiques physiques de Libreville',
        description: 'Sans boutique intermédiaire ni marge de revendeur local, vous payez uniquement le prix fabricant et le fret aérien au poids exact de votre commande.',
        ctaText: 'Comparer les tarifs',
        ctaLink: '#products-section',
        imageUrl: '/images/promo-banner.jpg'
      })
    },
    {
      key: 'trust_pillars',
      value: JSON.stringify([
        { icon: 'verified', title: 'Matériel 100% neuf', subtitle: 'Boîte scellée d\'origine constructeur' },
        { icon: 'flight_takeoff', title: 'Fret aérien au poids exact', subtitle: '10 000 F/kg ou 13 500 F/kg selon l\'urgence' },
        { icon: 'credit_card', title: 'Règlement sécurisé en FCFA', subtitle: 'Airtel Money, Moov Money et Carte Bancaire' },
        { icon: 'support_agent', title: 'Assistance locale à Libreville', subtitle: 'Photos et vidéos du colis sur WhatsApp' }
      ])
    },
    {
      key: 'contact_section',
      value: JSON.stringify({
        badge: 'Assistance WhatsApp 7j/7',
        title: 'Une question sur un modèle ou une demande spécifique ?',
        subtitle: 'Notre équipe à Libreville et notre correspondant à Shenzhen répondent à vos questions techniques et peuvent vérifier la disponibilité d\'une référence précise sous 24 heures.',
        whatsappNumber: '241074001122',
        whatsappDisplay: '(+241) 074 00 11 22',
        buttonText: 'Poser une question sur WhatsApp'
      })
    },
    {
      key: 'footer_section',
      value: JSON.stringify({
        slogan: 'High-Tech direct usine Shenzhen & Gabon',
        description: 'Importation directe d\'équipements neufs depuis Shenzhen jusqu\'à votre quartier à Libreville. Fret au poids exact et règlements sécurisés en FCFA.',
        copyright: '© 2026 WuazeShop. Tous droits réservés.'
      })
    },
    {
      key: 'social_links',
      value: JSON.stringify({
        facebook: 'https://facebook.com/wuazeshop',
        instagram: 'https://instagram.com/wuazeshop',
        tiktok: 'https://tiktok.com/@wuazeshop',
        whatsapp: 'https://wa.me/241074001122'
      })
    },
    {
      key: 'legal_section',
      value: JSON.stringify({
        terms: `CONDITIONS GÉNÉRALES DE VENTE ET D'UTILISATION (CGV/CGU) — WUAZESHOP GABON

1. OBJET DU SERVICE
WuazeShop assure la commande, l'inspection et l'acheminement sécurisé d'articles high-tech neufs depuis Shenzhen (Chine) jusqu'au Gabon (Libreville, Port-Gentil et intérieur du pays).

2. PRIX ET TARIFICATION DU FRET
Tous les prix des produits sont affichés en Francs CFA (XAF). Le fret cargo aérien est calculé selon le poids réel ou volumétrique au panier :
- Formule Colis Normal (2 semaines prévisionnelles) : 10 000 FCFA par kilo.
- Formule Colis Rapide (1 semaine prévisionnelle) : 13 500 FCFA par kilo.
Aucun frais additionnel non mentionné au récapitulatif ne sera exigé à la livraison.

3. RÈGLEMENTS SÉCURISÉS
Les paiements s'effectuent par Airtel Money, Moov Money ou Carte Bancaire (Visa / Mastercard). L'achat auprès de l'usine à Shenzhen est déclenché immédiatement après confirmation de la transaction.

4. RÉCEPTION ET LIVRAISON LOCALE
À l'arrivée du vol cargo à l'aéroport Léon Mba de Libreville, notre équipe prend en charge les démarches et contacte le client sur WhatsApp pour convenir de la remise en main propre.

5. CONFORMITÉ ET ÉCHANGE
Chaque boîte fait l'objet d'un contrôle des scellés avant le vol. En cas de non-conformité constatée au déballage, notre équipe locale traite votre dossier sans délai.`,
        privacy: `POLITIQUE DE CONFIDENTIALITÉ — WUAZESHOP GABON

1. DONNÉES RECUEILLIES
Nous collectons uniquement les éléments nécessaires au traitement logistique : votre nom, votre numéro de téléphone (utilisé pour les notifications WhatsApp) et votre quartier de résidence au Gabon.

2. UTILISATION DES INFORMATIONS
Vos données servent uniquement à :
- Préparer et acheminer votre commande.
- Vous transmettre les avis de pesée, de départ du vol et d'arrivée à Libreville.
- Assurer le service après-vente par notre équipe locale.

3. SÉCURITÉ
WuazeShop ne commercialise et ne cède aucune donnée personnelle. Vos coordonnées restent strictement confidentielles.`
      })
    },
    {
      key: 'faq_section',
      value: JSON.stringify([
        {
          id: 'faq_1',
          question: "Combien de temps prend la livraison entre la Chine et Libreville ?",
          answer: "Le délai dépend de la formule choisie au moment de la commande. Le Colis Rapide arrive en 1 semaine (3 jours de vol direct entrepôt plus marge de sécurité). Le Colis Normal arrive en 2 semaines (7 jours de transit régulier). Dès l'atterrissage à l'aéroport Léon Mba, notre équipe locale vous contacte sur WhatsApp pour fixer l'heure de livraison à votre domicile ou bureau."
        },
        {
          id: 'faq_2',
          question: "Comment sont calculés les frais de transport aérien ?",
          answer: "Le tarif s'applique au poids réel de votre commande, ou au poids volumétrique si le colis est très volumineux. Le tarif est de 10 000 FCFA par kilo en Colis Normal et 13 500 FCFA par kilo en Colis Rapide, avec un minimum de 100 grammes. Le montant exact s'affiche directement dans votre panier avant paiement."
        },
        {
          id: 'faq_3',
          question: "Les produits sont-ils authentiques et neufs ?",
          answer: "Tous nos articles proviennent directement des fabricants et distributeurs agréés à Shenzhen. Chaque appareil est neuf, sous emballage scellé d'origine. Avant le départ du vol cargo, notre acheteur procède à un contrôle visuel de la boîte et des scellés."
        },
        {
          id: 'faq_4',
          question: "Quels sont les moyens de paiement acceptés ?",
          answer: "Vous pouvez régler directement en ligne en Francs CFA par Airtel Money Gabon, Moov Money Gabon ou Carte Bancaire (Visa et Mastercard). Dès la validation, vous recevez votre numéro de commande pour suivre l'acheminement de votre colis."
        },
        {
          id: 'faq_5',
          question: "Peut-on commander un produit qui ne figure pas sur le site ?",
          answer: "Oui. Notre acheteur est basé au centre technologique de Shenzhen. Envoyez-nous la référence, la marque et la configuration souhaitée sur WhatsApp. Nous vérifions la disponibilité auprès des usines et vous transmettons un devis avec le fret sous 24 heures."
        }
      ])
    },
    {
      key: 'about_section',
      value: JSON.stringify({
        badge: 'Liaison Shenzhen — Libreville',
        title: 'Des appareils d\'usine livrés au Gabon sans marge intermédiaire',
        subtitle: 'WuazeShop relie directement les centres de production de Shenzhen aux acheteurs du Gabon, avec un fret aérien pesé au gramme et une remise en main propre à Libreville.',
        storyTitle: 'Pourquoi nous avons créé WuazeShop',
        storyParagraph1: 'Acheter un smartphone récent, un ordinateur portable ou un téléviseur à Libreville implique souvent de payer le double du prix d\'origine ou d\'hésiter face à des appareils reconditionnés présentés comme neufs.',
        storyParagraph2: 'Nous avons conçu un circuit direct : un acheteur sur place à Shenzhen qui s\'approvisionne auprès des usines certifiées, un partenariat avec des transitaires cargo fiables, et une équipe de réception à Libreville qui gère l\'arrivée et la livraison au quartier.',
        storyParagraph3: 'Chaque commande fait l\'objet d\'un contrôle visuel avant emballage. Vous payez le prix de l\'appareil et le tarif de fret au kilo, sans frais imprévus à l\'arrivée.',
        missionTitle: 'Nos engagements concrets',
        missionText: 'Des appareils scellés d\'origine, un poids de colis vérifié sur balance certifiée, un suivi par étape et un interlocuteur local joignable sur WhatsApp.',
        stat1Number: '100%',
        stat1Label: 'Appareils scellés d\'origine constructeur',
        stat2Number: '1-2 sem',
        stat2Label: 'Délai prévisionnel selon la formule cargo',
        stat3Number: '1 An',
        stat3Label: 'Garantie constructeur pièces et assistance',
        stat4Number: '0 FCFA',
        stat4Label: 'Aucun frais caché à la livraison'
      })
    }
  ];

  const insertSetting = db.prepare(`
    INSERT OR IGNORE INTO site_settings (key, value) VALUES (?, ?)
  `);
  for (const s of defaultSettings) {
    insertSetting.run(s.key, s.value);
  }

  // Ensure cargo_settings is always initialized
  const cargoRow = db.prepare(`SELECT value FROM site_settings WHERE key = 'cargo_settings'`).get();
  if (!cargoRow) {
    const defaultCargo = defaultSettings.find(s => s.key === 'cargo_settings');
    db.prepare(`INSERT INTO site_settings (key, value) VALUES ('cargo_settings', ?)`).run(defaultCargo.value);
  }

  // Always update keys with the latest high-converting copy
  const keysToUpdate = ['announcement_bar', 'hero_section', 'promo_section', 'trust_pillars', 'contact_section', 'footer_section', 'faq_section', 'about_section', 'legal_section'];
  for (const k of keysToUpdate) {
    const settingObj = defaultSettings.find(s => s.key === k);
    if (settingObj) {
      db.prepare(`UPDATE site_settings SET value = ? WHERE key = ?`).run(settingObj.value, k);
    }
  }
}


