---
name: product-specification
description: Functional specifications, user stories, acceptance criteria, scope definition (MVP vs future phases), and user journey mapping. Use during the scoping and planning phase before writing any code.
---

# Product Specification & Functional Scoping

This skill provides a structured methodology to define the functional perimeter, user journeys, and acceptance criteria for **WuazeShop** before implementing features.

---

## 1. Scope Definition & MVP Prioritization

Before coding, every feature must be categorized using the MoSCoW framework:
- **Must Have (MVP)**: Essential for a working shopping experience (e.g., browse products, cart management, checkout with payment, order confirmation).
- **Should Have**: High-value features that can follow the initial MVP (e.g., user reviews, discount promo codes, order history).
- **Could Have**: Enhancements if time permits (e.g., wishlists, multi-currency display, product recommendations).
- **Won't Have (For Now)**: Explicitly excluded from current scope to prevent scope creep (e.g., multi-vendor marketplace, recurring subscriptions).

---

## 2. User Journey Mapping

Document the step-by-step paths for each actor:

### A. Guest / Customer Journey
1. **Discovery**: Lands on home/catalog, filters by category or price, searches by keywords.
2. **Evaluation**: Views product details (photos, description, price, stock status).
3. **Cart Interaction**: Adds items with selected quantity/variant, views mini-cart or cart drawer.
4. **Checkout**: Enters shipping info, selects delivery method, reviews order summary.
5. **Payment**: Secure payment via checkout gateway.
6. **Confirmation**: Receives order summary on screen and email confirmation.

### B. Admin Journey
1. **Catalog Management**: Create, update, or archive products, categories, and inventory.
2. **Order Fulfillment**: View list of orders, filter by payment/shipping status, update order status (Processing, Shipped, Delivered).

---

## 3. User Story & Acceptance Criteria Standards

Every story must follow the standard format with concrete **Given / When / Then** criteria:

```markdown
### US-01: Ajouter un produit au panier
**En tant que** visiteur de la boutique,
**Je veux** ajouter un produit disponible à mon panier,
**Afin de** préparer ma commande.

#### Critères d'acceptation (Gherkin) :
- **Scénario 1 : Ajout d'un produit en stock**
  - **Given** Je suis sur la page d'un produit ayant du stock disponible,
  - **When** Je clique sur "Ajouter au panier",
  - **Then** Le panier s'incrémente, un feedback visuel s'affiche et le sous-total est recalculé.

- **Scénario 2 : Produit en rupture**
  - **Given** Je suis sur la page d'un produit en rupture de stock,
  - **When** J'observe la page,
  - **Then** Le bouton "Ajouter au panier" est désactivé avec la mention "Rupture de stock".
```

---

## 4. Edge Cases & Business Rules Checklist

Before approving any specification, verify these scenarios:
- [ ] What happens if stock changes while a user is in the checkout tunnel?
- [ ] What are the minimum and maximum order quantities allowed per item?
- [ ] How are expired checkout sessions or failed payments handled?
- [ ] What are the validation rules for customer inputs (email, phone, postal code)?
