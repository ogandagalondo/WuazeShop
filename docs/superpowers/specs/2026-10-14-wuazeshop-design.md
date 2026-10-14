# Document de Conception Technique & Fonctionnelle : WuazeShop

**Date :** 14 Octobre 2026  
**Auteur / Rôle :** Antigravity (IA Assistant) & Promoteur du Projet  
**Projet :** WuazeShop (Boutique High-Tech Gabon & Importation Chine)  
**Référence Design :** Google Stitch (*Projet 9660997007771440011 - Electro Grid Emerald / AkibaTech*)  
**Statut :** En attente de validation (Gate Brainstorming)

---

## 1. Contexte & Intention (Le « Pourquoi »)

### 1.1 Genèse & Problème Métier
L'équipe fondatrice est composée de trois associés :
* Un associé basé en Chine, en contact direct avec les fabricants et grossistes électroniques fiables.
* Le promoteur (administrateur principal) et un second associé basés au Gabon, gérant la clientèle, le marketing et la distribution finale à Libreville et en provinces.

Jusqu'ici, les ventes s'effectuaient de manière informelle (statuts WhatsApp, bouche-à-oreille) sans paiement préalable. Ce mode opératoire présentait une faille majeure : compte tenu du délai d'acheminement maritime ou aérien entre la Chine et le Gabon, plusieurs clients se désistaient à l'arrivée du colis ou n'avaient plus les fonds disponibles. L'équipe devait alors supporter l'intégralité du risque financier, des frais de transport et des stocks bloqués.

### 1.2 Mission de WuazeShop
WuazeShop a pour mission de professionnaliser et sécuriser ce canal de distribution :
1. **Verrouiller les commandes** en exigeant un paiement intégral à 100% avant expédition via les solutions de Mobile Money locales (Airtel Money et Moov Money).
2. **Éliminer les risques d'annulation** : l'associé en Chine n'achète et n'expédie l'appareil auprès du fournisseur que lorsque les fonds sont fermement confirmés et crédités sur le compte de l'agrégateur.
3. **Conserver le pont humain de confiance** grâce à un contact WhatsApp direct omniprésent sur la boutique pour répondre aux questions, conseiller le client et lui envoyer des photos/vidéos réelles des produits.
4. **Offrir une autonomie totale au promoteur** grâce à un CMS / espace d'administration intégré pour piloter le catalogue (Smartphones, Ordinateurs, Téléviseurs) et les commandes sans avoir à modifier le code.

---

## 2. Objectifs, Non-Objectifs & Anti-Objectifs

### 2.1 Objectifs Clés
* **Boutique client ultra-performante et mobile-first** : calquée fidèlement sur la maquette haute fidélité Google Stitch (charte émeraude, typographies *Plus Jakarta Sans* & *Inter*, icônes Material Symbols).
* **Organisation par 3 catégories majeures** :
  1. *Smartphones* (iPhone, Samsung Galaxy, etc.)
  2. *Ordinateurs* (MacBooks, PC portables bureautique et pro)
  3. *Téléviseurs* (Smart TV 4K UHD, écrans)
* **Passerelle de paiement modulaire CEMAC** :
  * Support d'Airtel Money Gabon et Moov Money Gabon (extensible à Orange Money et cartes bancaires).
  * Mode simulateur / sandbox complet pour tester le cycle d'achat de bout en bout dès le développement.
  * Architecture découplée prête à se brancher sur l'API de l'agrégateur choisi (ex. SingPay, CinetPay).
* **Parcours de commande ciblé Gabon** :
  * Formulaire checkout demandant : Nom, Prénom, Numéro WhatsApp, Quartier de résidence.
  * Tarification et devises affichées en Francs CFA (XAF).
* **CMS Administrateur sécurisé** :
  * Espace de gestion réservé au promoteur avec authentification.
  * Ajout, modification, suppression de produits (titre, description, caractéristiques, photos, prix, catégorie).
  * Vue synthétique des commandes et statuts de règlement (En attente / Payé / En transit / Livré).

### 2.2 Non-Objectifs (Hors périmètre initial)
* Pas de système multi-vendeurs (marketplace ouverte à des tiers).
* Pas de passerelle de livraison automatisée par drone ou API de géolocalisation complexe (la livraison au Gabon reste coordonnée manuellement par l'équipe via WhatsApp/téléphone une fois le colis reçu).
* Pas d'obligation pour les acheteurs de créer un compte avec mot de passe avant d'acheter (checkout fluide en tant qu'invité pour maximiser la conversion).

### 2.3 Anti-Objectifs (Ce qui ferait échouer le projet)
* **Pas de commande lancée sur simple déclaration client** : aucune marchandise ne doit être achetée en Chine sans confirmation bancaire/agrégateur réelle et irrévocable.
* **Pas de design générique ou low-cost** : l'utilisateur a expressément rejeté les maquettes rudimentaires au profit de l'esthétique premium de Google Stitch.
* **Pas de complexité technique inutile** : le CMS doit être utilisable immédiatement depuis un smartphone par le promoteur sans formation technique.

---

## 3. Direction Artistique & UI (Alignement Google Stitch)

Le design respecte rigoureusement la charte **Electro Grid Emerald** créée sur Google Stitch :
* **Couleurs** :
  * Vert primaire émeraude : `#006c49` / Conteneur actif `#10b981`
  * Vert secondaire forêt : `#2d6a48` / `#0f5132`
  * Fond clair neutre : `#faf8ff` / Surfaces `#ffffff` / Ardoise `#131b2e`
  * Badges d'alerte / promos : `#ba1a1a`
* **Typographie** :
  * Titres & Display : *Plus Jakarta Sans* (graisses 600, 700, 800)
  * Corps de texte & Données techniques : *Inter*
* **Composants d'interface** :
  * Bandeau supérieur de réassurance Gabon & SAV WhatsApp.
  * En-tête avec barre de recherche et filtre de catégories.
  * Sélecteur d'onglets réactif pour filtrer : *Tout le catalogue*, *Smartphones*, *Ordinateurs*, *Téléviseurs*.
  * Cartes produits riches : badges de promotion (-10%, Nouveauté), puces techniques (Puce M3, autonomie, Retina), pastilles de finitions/couleurs, prix barrés et nets en FCFA.
  * Double bouton d'action sur chaque carte : « Commander » (checkout direct) + « WhatsApp » (demande d'information pré-remplie).
  * Bannière Conciergerie WhatsApp en bas de page et bouton flottant persistant.
  * 4 piliers de confiance : Garantie 12 mois constructeur, Acheminement contrôlé Chine-Gabon, Airtel & Moov Money sécurisés, SAV WhatsApp 7j/7.

---

## 4. Architecture Technique & Choix de Réalisation

*(Ces choix techniques ont été confiés à l'assistant par le promoteur et appliquent les compétences des skills `.agents/skills` : backend-standards, frontend-standards, system-architecture, design-system).*

### 4.1 Stack Technologique Recommandée
* **Frontend & Backend unifié** : **Node.js avec Express / Next.js ou API REST moderne** :
  * Permet un rendu serveur rapide, un SEO optimal et une interface mobile fluide.
  * Utilisation de **Tailwind CSS** configuré avec les tokens du design system Stitch pour un rendu pixel-perfect.
* **Base de Données** : **SQLite avec Prisma ou Drizzle ORM (ou PostgreSQL/Supabase)** :
  * Ultra-légère, sans dépendance de serveur lourd au démarrage, fichier unique facilement sauvegardable, et migration immédiate vers PostgreSQL si nécessaire.
* **Stockage Médias (Photos des produits)** :
  * Stockage local servi statiquement ou compatible Cloudinary / S3 pour les images haute résolution d'appareils.
* **Sécurité & Authentification Administrateur** :
  * Session sécurisée ou JWT avec hachage Argon2/Bcrypt pour l'accès au tableau de bord CMS du promoteur.
  * Protection contre les injections, validation stricte des formulaires (Zod).

### 4.2 Module Passerelle de Paiement (Pattern Adapter)
L'interface de paiement est conçue comme un adaptateur modulaire (`PaymentGatewayInterface`) :
* **Méthodes abstraites** : `initiatePayment()`, `verifyPayment()`, `handleWebhook()`.
* **Implémentation 1 : Simulateur Sandbox (Développement & Recette)** :
  * Permet de choisir Airtel Money ou Moov Money, de simuler un code USSD / push mobile, puis de valider ou échouer la transaction instantanément pour vérifier les changements d'état du site.
* **Implémentation 2 : Passerelle Agrégateur CEMAC (Production)** :
  * Branchement direct sur l'API de l'agrégateur (ex. SingPay Gabon, CinetPay ou Flutterwave) via clés secrètes d'environnement sans réécrire le code métier.

---

## 5. Schéma de Données (Modèle Simplifié)

### Entités Principales
1. **Product** :
   * `id` (UUID / Integer)
   * `title` (ex: "iPhone 15 Pro Max 256GB - Titane")
   * `slug` (unique)
   * `category` (`smartphones`, `ordinateurs`, `televiseurs`, etc.)
   * `price` (Entier FCFA, ex: 850000)
   * `originalPrice` (Optionnel pour promo, ex: 945000)
   * `imageUrl` (URL de la photo principale)
   * `specs` (Puces techniques : "Puce M3", "18h Autonomie"...)
   * `colors` (Palette de couleurs disponibles)
   * `inStock` (Booléen)
   * `createdAt` / `updatedAt`
2. **Category** :
   * `id`, `name`, `slug`, `icon`
3. **Order** :
   * `id` / `orderNumber` (ex: "WZ-2026-0042")
   * `customerName`, `customerPhone` (WhatsApp), `customerNeighborhood` (Quartier)
   * `productId`, `quantity`, `totalAmount` (FCFA)
   * `paymentStatus` (`PENDING`, `CONFIRMED_CLEARED`, `FAILED`)
   * `fulfillmentStatus` (`AWAITING_PROCUREMENT`, `PURCHASED_IN_CHINA`, `IN_TRANSIT`, `ARRIVED_GABON`, `DELIVERED`)
   * `paymentMethod` (`AIRTEL_MONEY`, `MOOV_MONEY`, `SIMULATOR`)
   * `transactionReference`
   * `createdAt`
4. **AdminUser** :
   * `id`, `username`, `passwordHash`

---

## 6. Vérification du Concepteur (Builder Check)

En relisant ce document du point de vue de l'ingénieur chargé de la construction :
1. **Les aspects métier clés sont-ils couverts ?** Oui (modèle 100% commande en amont, Afrique centrale/Gabon, pas de stock dormant, notification préalable au partenaire en Chine).
2. **Le design est-il verrouillé ?** Oui, alignement validé sur le prototype Google Stitch.
3. **Le rôle du CMS est-il défini ?** Oui, un tableau de bord unique pour le promoteur pour CRUD produits et suivi des commandes.
4. **Décisions laissées à l'implémenteur :**
   * Choix de la stack exacte : Application web full-stack Node.js / Express ou Next.js avec Tailwind et base de données SQLite/Prisma.
   * Mise en place du module de simulation de paiement immédiat.

---

## 7. Définition de Terminé (Definition of Done)

Le projet sera considéré comme prêt pour la mise en production lorsque :
1. La boutique publique affiche fidèlement le catalogue Stitch avec les 3 catégories filtrables et les fiches produits complètes.
2. Le panier et la page de commande permettent la saisie des coordonnées complètes (Nom, WhatsApp, Quartier) et le choix du mode Mobile Money.
3. Le simulateur de paiement permet de tester une commande réussie et génère la référence de commande.
4. Le tableau de bord administrateur permet d'ajouter un produit avec photo, d'éditer son prix, et de visualiser la commande payée avec toutes les coordonnées du client.
5. Les boutons WhatsApp pré-remplissent automatiquement le message avec la référence et le produit demandé.
