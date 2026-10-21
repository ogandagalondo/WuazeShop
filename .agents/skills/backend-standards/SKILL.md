---
name: backend-standards
description: Architecture standards, API design, data validation, database schemas, authentication, payments, and backend security. Use when building or reviewing server-side logic, database interactions, or APIs.
---

# Backend & API Standards

This skill defines backend architecture patterns, security guidelines, and data modeling standards for the **WuazeShop** project.

---

## 1. API Architecture & Conventions

- **RESTful Endpoints & HTTP Methods**:
  - `GET /api/products` — Retrieve product catalogue (supports pagination: `?page=1&limit=20`, filtering, sorting).
  - `GET /api/products/:id` — Retrieve single product details.
  - `POST /api/cart/items` — Add item to cart.
  - `PATCH /api/cart/items/:id` — Update quantity.
  - `DELETE /api/cart/items/:id` — Remove item from cart.
  - `POST /api/checkout/create-session` — Initiate checkout/payment session.
  - `POST /api/webhooks/stripe` — Handle payment webhook events with signature verification.

- **Consistent JSON Response Format**:
  ```json
  {
    "success": true,
    "data": { ... },
    "error": null,
    "timestamp": "2026-10-14T10:00:00Z"
  }
  ```
  In case of error:
  ```json
  {
    "success": false,
    "data": null,
    "error": {
      "code": "PRODUCT_OUT_OF_STOCK",
      "message": "Le produit sélectionné n'est plus en stock."
    }
  }
  ```

---

## 2. Data Validation & Schemas

- **Strict Input Validation**: Always validate request payloads (body, query, params) before executing business logic (e.g. using Zod, Yup, or Joi).
- **Sanitization**: Sanitize user inputs to prevent XSS and SQL injection. Never pass unvalidated input directly to raw queries.

---

## 3. Security & E-Commerce Transactions

1. **Price Integrity**: Never trust prices sent from the client. Always recalculate totals, shipping fees, discounts, and taxes on the server using verified product records from the database.
2. **Webhooks Verification**: For payment processors (e.g., Stripe, PayPal), always verify the cryptographic webhook signature using the raw request body.
3. **Idempotency**: Ensure order creation and payment callbacks are idempotent using unique order tokens or idempotency keys.
4. **Authentication & Session**: Secure sensitive routes (orders, user profile, admin panel) using HTTP-only cookies or standard JWTs with proper expiration and refresh policies.

---

## 4. Backend Review Checklist

- [ ] Rate limiting applied on public and auth endpoints (`/api/auth/*`, `/api/checkout/*`).
- [ ] Environment secrets (`DATABASE_URL`, `STRIPE_SECRET_KEY`, `JWT_SECRET`) stored strictly in `.env` and never committed to version control.
- [ ] Centralized error handling middleware preventing internal stack traces from leaking to clients.
- [ ] Database indexes present on foreign keys and frequently queried columns (`slug`, `category_id`, `created_at`).
