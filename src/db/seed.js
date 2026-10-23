import bcrypt from 'bcryptjs';

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
      in_stock: 1
    }
  ];

  const insertProduct = db.prepare(
    `INSERT OR IGNORE INTO products (title, slug, category, price, original_price, image_url, images, specs, colors, in_stock)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  );
  for (const p of products) {
    const imagesVal = p.images ? JSON.stringify(p.images) : JSON.stringify([p.image_url]);
    insertProduct.run(p.title, p.slug, p.category, p.price, p.original_price, p.image_url, imagesVal, p.specs, p.colors, p.in_stock);
    
    // Update existing products if images is null or empty
    db.prepare(`UPDATE products SET images = ? WHERE slug = ? AND (images IS NULL OR images = '' OR images = '[]')`).run(imagesVal, p.slug);
  }

  // 3. Seed default Admin User (Super Admin Founder)
  const adminCheck = db.prepare(`SELECT id, email, role, full_name FROM admin_users WHERE username = ? OR email = ?`).get('admin', 'admin@wuazeshop.ga');
  if (!adminCheck) {
    const salt = bcrypt.genSaltSync(10);
    const hash = bcrypt.hashSync('adminpassword123', salt);
    db.prepare(`
      INSERT INTO admin_users (username, email, full_name, role, password_hash, is_active) 
      VALUES (?, ?, ?, ?, ?, 1)
    `).run('admin', 'admin@wuazeshop.ga', 'Fondateur WuazeShop', 'SUPER_ADMIN', hash);
  } else {
    db.prepare(`
      UPDATE admin_users 
      SET email = COALESCE(email, 'admin@wuazeshop.ga'),
          full_name = COALESCE(full_name, 'Fondateur WuazeShop'),
          role = COALESCE(role, 'SUPER_ADMIN'),
          is_active = COALESCE(is_active, 1)
      WHERE id = ?
    `).run(adminCheck.id);
  }

  // 4. Seed default Site Settings (CMS Sections)
  const defaultSettings = [
    {
      key: 'hero_section',
      value: JSON.stringify({
        badge: '✦ Nouveauté',
        title: 'La technologie\nà portée de main',
        subtitle: 'Découvrez les derniers smartphones, ordinateurs et accessoires importés directement de Chine au Gabon avec une qualité exceptionnelle et des prix imbattables.',
        ctaText: 'Découvrir',
        ctaLink: '/categories',
        imageUrl: '/images/hero-devices.jpg',
        prop1Title: 'Livraison rapide',
        prop1Sub: 'en 24/48h',
        prop2Title: 'Paiement sécurisé',
        prop2Sub: '100% fiable',
        prop3Title: 'Service client',
        prop3Sub: 'dédié 7j/7'
      })
    },
    {
      key: 'promo_section',
      value: JSON.stringify({
        badge: 'Offre spéciale',
        title: 'Jusqu\'à -20%',
        subtitle: 'sur une sélection de produits',
        description: 'Équipez-vous avec les meilleures marques importées directement de Chine et profitez de nos offres limitées avec garantie constructeur !',
        ctaText: 'Voir l\'offre',
        ctaLink: '#products-section',
        imageUrl: '/images/promo-banner.jpg'
      })
    },
    {
      key: 'trust_pillars',
      value: JSON.stringify([
        { icon: 'verified', title: 'Produits originaux', subtitle: 'Garantie constructeur' },
        { icon: 'local_shipping', title: 'Livraison rapide', subtitle: 'Partout au Gabon' },
        { icon: 'lock', title: 'Paiement sécurisé', subtitle: '100% fiable Airtel & Moov' },
        { icon: 'headset_mic', title: 'Support client', subtitle: 'Toujours à votre écoute' }
      ])
    },
    {
      key: 'contact_section',
      value: JSON.stringify({
        badge: 'Assistance WhatsApp Directe',
        title: 'Une question sur un produit ou son expédition ?',
        subtitle: 'Notre équipe au Gabon et notre acheteur en Chine vous conseillent en temps réel et peuvent vous envoyer des vidéos réelles des articles avant commande.',
        whatsappNumber: '241074001122',
        whatsappDisplay: '(+241) 074 00 11 22',
        buttonText: 'Écrivez-nous sur WhatsApp'
      })
    },
    {
      key: 'footer_section',
      value: JSON.stringify({
        slogan: 'High-Tech Gabon & Chine',
        description: 'Votre univers technologique d\'importation directe Chine & Gabon. Qualité certifiée et sécurité Mobile Money.',
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
WuazeShop est une plateforme d'e-commerce spécialisée dans la sélection, la commande et l'acheminement sécurisé d'articles high-tech neufs depuis la Chine vers le Gabon (Libreville, Port-Gentil, et intérieur du pays).

2. COMMANDE & PRIX
Tous nos prix sont stipulés en Francs CFA (XAF) toutes taxes comprises. La passation de commande s'effectue directement en ligne avec collecte des informations de livraison (nom, téléphone WhatsApp, quartier de résidence au Gabon).

3. MODALITÉS DE RÈGLEMENT (MOBILE MONEY)
Les paiements sont acceptés via Airtel Money et Moov Money. Afin de garantir une transparence totale, l'achat auprès du fabricant ou grossiste en Chine est initié dès constatation effective du règlement.

4. DÉLAIS D'ACHEMINEMENT & LIVRAISON
Les délais habituels d'acheminement Chine-Gabon sont compris entre 7 et 14 jours ouvrés. À l'arrivée à Libreville, notre équipe locale coordonne la livraison finale directement au quartier indiqué.

5. GARANTIE CONSTRUCTEUR & CONFORMITÉ
Chaque appareil bénéficie d'une inspection préalable de conformité avant emballage et d'une garantie constructeur.`,
        privacy: `POLITIQUE DE CONFIDENTIALITÉ & PROTECTION DES DONNÉES PERSONNELLES — WUAZESHOP

1. DONNÉES COLLECTÉES
Dans le cadre de vos commandes sur WuazeShop, nous recueillons uniquement les informations indispensables au bon acheminement de votre colis : votre nom complet, votre numéro de téléphone (utilisé pour les notifications WhatsApp) et votre quartier de résidence au Gabon.

2. FINALITÉ DU TRAITEMENT
Vos données sont strictement réservées à :
- La prise en compte et le traitement de vos commandes d'importation.
- Le suivi logistique et l'information en temps réel sur l'acheminement de vos colis.
- L'assistance clientèle personnalisée via WhatsApp.

3. SÉCURITÉ ET CONFIDENTIALITÉ
WuazeShop s'engage formellement à ne jamais vendre, louer, céder ni diffuser vos coordonnées à des fins de prospection publicitaire tierce. Vos données restent conservées de manière sécurisée et confidentielle.`
      })
    },
    {
      key: 'faq_section',
      value: JSON.stringify([
        {
          id: 'faq_1',
          question: "Quels sont les délais d'acheminement entre la Chine et le Gabon ?",
          answer: "Nos délais habituels d'expédition par fret cargo aérien sont de 7 à 14 jours ouvrés. Dès l'arrivée du colis à l'aéroport international Léon Mba de Libreville, notre équipe locale prend le relais et vous contacte sur WhatsApp pour organiser la livraison à domicile ou au quartier."
        },
        {
          id: 'faq_2',
          question: "Comment s'effectue le règlement par Mobile Money (Airtel & Moov) ?",
          answer: "Le règlement s'effectue directement en ligne en toute sécurité via Airtel Money ou Moov Money. Une fois la transaction validée, vous recevez instantanément votre référence de commande ainsi que les instructions de suivi en temps réel."
        },
        {
          id: 'faq_3',
          question: "Les appareils high-tech sont-ils neufs et sous garantie ?",
          answer: "Oui, absolument. Tous nos appareils (smartphones, ordinateurs portables, téléviseurs 4K, accessoires) sont 100% neufs, d'origine constructeur et livrés sous blister scellé. Nous procédons à une inspection rigoureuse de conformité avant l'envoi."
        },
        {
          id: 'faq_4',
          question: "Livrez-vous dans tous les quartiers de Libreville et en province ?",
          answer: "Oui ! Nous assurons la livraison à domicile ou au bureau dans tout le Grand Libreville (Louis, Glass, Akébé, Nzeng-Ayong, Angondjé, Owendo, etc.) et expédions vers Port-Gentil, Franceville, Oyem et toutes les villes du Gabon."
        },
        {
          id: 'faq_5',
          question: "Puis-je commander un modèle spécifique non affiché sur le site ?",
          answer: "Tout à fait ! Notre acheteur basé directement à Shenzhen peut rechercher le produit exact de votre choix (spécifications précises, coloris, marque). Contactez simplement notre support sur WhatsApp pour recevoir un devis personnalisé."
        }
      ])
    },
    {
      key: 'about_section',
      value: JSON.stringify({
        badge: '✦ Notre Histoire & Notre Mission',
        title: 'Le pont high-tech direct entre Shenzhen et Libreville',
        subtitle: 'WuazeShop révolutionne l\'accès aux nouvelles technologies au Gabon en éliminant les intermédiaires coûteux et en garantissant des appareils certifiés 100% neufs avec un accompagnement local dédié.',
        storyTitle: 'Pourquoi WuazeShop ?',
        storyParagraph1: 'Pendant des années, acquérir un smartphone de dernière génération, un MacBook ou un téléviseur 4K au Gabon relevait du parcours du combattant : prix exorbitants chez les revendeurs locaux, incertitude sur l\'authenticité des produits reconditionnés et délais imprévisibles.',
        storyParagraph2: 'WuazeShop est né d\'une conviction simple : chaque Gabonais a le droit de profiter des toutes dernières innovations high-tech au prix direct usine, avec une transparence absolue et une sécurité totale du paiement à la livraison.',
        storyParagraph3: 'Grâce à notre acheteur basé en immersion au cœur de Shenzhen (la capitale mondiale de l\'électronique) et à notre équipe logistique établie à Libreville, nous sélectionnons, inspectons et acheminons vos commandes par fret cargo aérien express en 7 à 10 jours ouvrés.',
        missionTitle: 'Nos Engagements Inébranlables',
        missionText: 'Garantir des produits 100% neufs d\'origine constructeur sous blister, un dédouanement intégral sans mauvaise surprise à l\'arrivée, et un service client gabonais joignable 7j/7 sur WhatsApp.',
        stat1Number: '100%',
        stat1Label: 'Appareils neufs certifiés & inspectés',
        stat2Number: '7-10 j',
        stat2Label: 'Délai moyen de fret cargo express',
        stat3Number: '1 An',
        stat3Label: 'Garantie constructeur pièces & main d\'œuvre',
        stat4Number: '+1 500',
        stat4Label: 'Clients livrés partout au Gabon'
      })
    }
  ];

  const insertSetting = db.prepare(`
    INSERT OR IGNORE INTO site_settings (key, value) VALUES (?, ?)
  `);
  for (const s of defaultSettings) {
    insertSetting.run(s.key, s.value);
  }
}

