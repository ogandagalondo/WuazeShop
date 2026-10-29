# Spécification de Conception : Calcul et Facturation du Fret Cargo Aérien (Shenzhen → Libreville)

- **Date** : 29 Octobre 2026  
- **Projet** : WuazeShop (E-commerce High-Tech Gabon / Chine)  
- **Statut** : En attente de validation  
- **Fichier** : `docs/superpowers/specs/2026-10-29-fret-cargo-shipping-design.md`

---

## 1. Contexte & Intention (Le « Pourquoi »)

Actuellement, plusieurs mentions sur la vitrine et dans le code de WuazeShop indiquent que le fret cargo aérien ou la livraison sont « inclus » ou offerts. 

En réalité, les marchandises sont achetées neuves à Shenzhen (Chine) puis acheminées vers Libreville (Gabon) par des transitaires aériens spécialisés (agences de cargo). Ce coût de fret aérien représente un montant réel et incompressible facturé au kilogramme, que la boutique ne peut pas absorber à ses frais.

L'objectif de cette fonctionnalité est de :
1. **Facturer le juste coût d'expédition au client** selon le poids réel ou volumétrique des articles commandés.
2. **Offrir au client le choix du délai d'acheminement** (formule normale ou rapide).
3. **Garantir une transparence absolue dès la fiche produit jusqu'au paiement**, afin d'éliminer toute incompréhension ou sentiment de frais cachés.
4. **Harmoniser l'ensemble des textes du site** pour supprimer les mentions inexactes de « fret inclus ».

---

## 2. Tarification & Options Cargo Convenues

En accord avec le collaborateur en Chine et les agences de cargo assurant la liaison Chine → Gabon :

| Formule | Tarif Cargo au kg | Délai réel entrepôt | Délai annoncé au client (avec marge d'imprévus) |
| :--- | :--- | :--- | :--- |
| **Colis Normal** | **10 000 FCFA / kg** | ~7 jours | **2 semaines** |
| **Colis Rapide** | **13 500 FCFA / kg** | ~3 jours | **1 semaine** |

### Règle de calcul du montant d'expédition :
$$\text{Frais de port} = \text{Poids total du panier (en kg)} \times \text{Tarif au kg de la formule choisie}$$
*Exemple : Un panier de 0,4 kg en formule Colis Normal revient à $0,4 \times 10\,000 = 4\,000\text{ FCFA}$.*  
*Un panier de 2,2 kg en formule Colis Rapide revient à $2,2 \times 13\,500 = 29\,700\text{ FCFA}$.*

---

## 3. Objectifs, Non-Objectifs & Anti-Objectifs

### Objectifs (Goals)
- **Gestion du poids dans le catalogue** : Permettre à l'administrateur de renseigner le poids d'expédition (en kg) lors de l'ajout ou de la modification de chaque produit, avec un outil d'assistance pour le calcul volumétrique ($L \times l \times h / 5000$).
- **Parcours client transparent en 3 temps** :
  1. *Fiche Produit* : estimation indicative des frais de port sous le prix d'achat.
  2. *Tiroir Panier (Cart Drawer)* : affichage du poids cumulé, sélection par bouton radio entre Colis Normal et Colis Rapide, encart explicatif sur le fret aérien international, et calcul en temps réel du total net.
  3. *Tunnel de Commande & Paiement* : ventilation distincte du prix des articles et du fret cargo, enregistrement de l'option choisie dans la commande en base de données.
- **Harmonisation des textes vitrine** : Remplacer sur tout le site les mentions « Fret cargo inclus » par « Fret cargo aérien au poids exact ».

### Non-Objectifs (Out of Scope)
- Connexion API en temps réel avec les transporteurs (les agences de cargo locales à Shenzhen et Libreville ne disposent pas d'API publique ; les tarifs sont des barèmes fixes au kilo configurés dans le système).
- Livraison du dernier kilomètre à domicile dans Libreville (le colis arrive au hub cargo / agence de retrait de Libreville).

### Anti-Objectifs (Ce qu'il faut absolument éviter)
- Ne jamais cacher les frais de port jusqu'au dernier clic de paiement (effet de surprise qui détruit la conversion).
- Ne pas compliquer la saisie en forçant l'administrateur à mesurer chaque petit produit s'il connaît déjà son poids estimé.
- Ne pas casser la compatibilité avec les commandes existantes déjà enregistrées dans SQLite.

---

## 4. Architecture & Modifications Techniques

### 4.1 Base de données (SQLite)
1. **Table `products`** :
   - Ajout de la colonne `weight` (`REAL DEFAULT 0.4`) pour stocker le poids en kg de chaque article.
2. **Table `orders`** :
   - Ajout des colonnes :
     - `shipping_method` (`TEXT DEFAULT 'normal'`) : `'normal'` ou `'express'`.
     - `shipping_fee` (`INTEGER DEFAULT 0`) : montant du transport en FCFA.
     - `total_weight` (`REAL DEFAULT 0.0`) : poids cumulé des articles au moment de la commande.

### 4.2 Administration des Produits (`admin.html` & `admin.js`)
- **Nouveau champ dans le formulaire produit** :
  - `Poids d'expédition (kg)` (ex: `0.4`, `1.8`, `0.15`).
- **Calculateur volumétrique optionnel** :
  - Petit volet dépliable ou champs facultatifs : Longueur (cm), Largeur (cm), Hauteur (cm).
  - Bouton « Calculer le volume » qui applique la formule $\frac{L \times l \times H}{5000}$ et met à jour le poids si le volume est supérieur.

### 4.3 Expérience Client & Panier
1. **Fiche Produit (`product.html` / `product.js`)** :
   - Badge / ligne sous le prix : `✈️ Fret cargo aérien dès X FCFA selon le poids (Y kg)`.
   - Rappel des délais indicatifs : 1 à 2 semaines.
2. **Tiroir Panier (`index.html`, `store.js`, etc.)** :
   - Sélecteur de livraison :
     - `🔘 Colis Normal (2 semaines) — 10 000 FCFA/kg : [Montant] FCFA`
     - `🔘 Colis Rapide (1 semaine) — 13 500 FCFA/kg : [Montant] FCFA`
   - Note explicative sous le sélecteur : *« Acheminement cargo aérien direct depuis Shenzhen jusqu'à Libreville avec dédouanement inclus. »*
   - Ligne dédiée dans le sous-total :
     - Sous-total articles : `X FCFA`
     - Fret cargo aérien ([Formule]) : `Y FCFA`
     - **Total commande : (X + Y) FCFA**
3. **Tunnel de Commande & Paiement (`order.service.js`, `order.controller.js`)** :
   - Validation que le montant total inclut bien le `shipping_fee` calculé.
   - Envoi du récapitulatif complet dans la notification de commande et le suivi de colis.

### 4.4 Nettoyage des Textes du Site (Copywriting)
Mise à jour des mentions « Fret cargo aérien inclus » dans :
- Le ruban défilant supérieur (`top-announcement-bar`)
- Les bannières Hero et capsules de réassurance
- Les pages `categories.html`, `category.html`, `about.html`, `tracking.html`
- Formulations de remplacement : *« Import direct usine Shenzhen → Gabon • Fret cargo aérien au poids exact • Paiement sécurisé Mobile Money »*.

---

## 5. Ce qui est laissé au développeur (Choix techniques)
- Poids minimum par commande : arrondi au dixième de kilo le plus proche (ex: 0,1 kg minimum) pour éviter les frais à zéro franc.
- Option de livraison par défaut dans le panier : `Colis Normal` présélectionné par défaut (option la plus économique pour le client).
- Animation fluide de mise à jour des totaux lors du basculement entre Colis Normal et Colis Rapide dans le tiroir panier.
