---
name: system-architecture
description: System architecture design, database modeling (ERD), API contract specifications, external service integrations, and technical trade-off evaluation. Use prior to implementation when designing data schemas or architecture.
---

# System Architecture & Data Modeling

This skill defines the technical blueprint, data schemas, and integration contracts for **WuazeShop** before writing code.

---

## 1. High-Level Architecture Topology

```mermaid
graph TD
    Client[Web Frontend / Mobile Browser] -->|HTTPS / REST / JSON| Server[Application Backend / API Server]
    Server -->|ORM / SQL| DB[(Relational Database: SQLite / PostgreSQL)]
    Server -->|Webhooks & Payment Sessions| Stripe[Payment Gateway: Stripe]
    Server -->|Asset Storage| Storage[Media / CDN Storage]
    Server -->|Transactional Emails| EmailService[Email Delivery Service]
```

---

## 2. Relational Data Model (Schema Blueprint)

Define the primary entities and relationships before running database migrations:

```mermaid
erDiagram
    CATEGORY ||--o{ PRODUCT : contains
    PRODUCT ||--o{ PRODUCT_VARIANT : has
    PRODUCT ||--o{ CART_ITEM : referenced_by
    PRODUCT ||--o{ ORDER_ITEM : ordered_as
    USER ||--o{ ORDER : places
    USER ||--o{ CART : owns
    CART ||--o{ CART_ITEM : holds
    ORDER ||--o{ ORDER_ITEM : composed_of
    ORDER ||--|| PAYMENT_TRANSACTION : settled_by

    USER {
        string id PK
        string email UK
        string name
        string role "customer | admin"
        datetime created_at
    }

    PRODUCT {
        string id PK
        string slug UK
        string name
        string description
        decimal price
        int stock_quantity
        string category_id FK
        json images
        boolean is_active
    }

    ORDER {
        string id PK
        string order_number UK
        string user_id FK "nullable for guest checkout"
        string status "pending | paid | shipped | cancelled"
        decimal total_amount
        decimal shipping_fee
        json shipping_address
        datetime created_at
    }

    ORDER_ITEM {
        string id PK
        string order_id FK
        string product_id FK
        int quantity
        decimal unit_price
    }

    PAYMENT_TRANSACTION {
        string id PK
        string order_id FK
        string provider "stripe"
        string provider_session_id UK
        string status "pending | succeeded | failed"
        decimal amount
        datetime paid_at
    }
```

---

## 3. API Contract Specifications (Data Transfer Objects)

Every endpoint must have its request schema and response format documented before implementation.

### Example Contract: Create Order / Checkout Session
- **Endpoint**: `POST /api/checkout/create-session`
- **Headers**: `Content-Type: application/json`
- **Request Body**:
  ```typescript
  interface CreateCheckoutSessionRequest {
    items: Array<{
      productId: string;
      quantity: number;
    }>;
    customerEmail: string;
    shippingAddress: {
      fullName: string;
      street: string;
      city: string;
      postalCode: string;
      country: string;
    };
  }
  ```
- **Response (200 OK)**:
  ```typescript
  interface CreateCheckoutSessionResponse {
    success: true;
    data: {
      orderId: string;
      checkoutUrl: string;
      expiresAt: string;
    };
  }
  ```

---

## 4. Architectural Decision Records (ADR) Checklist

Before starting implementation, document any trade-offs:
- [ ] Database Choice: Embedded (SQLite) for rapid MVP vs PostgreSQL for scalable production.
- [ ] State Management: Server-side sessions vs Client-side persistent cart with backend sync.
- [ ] Asset Strategy: Local upload storage vs Cloudinary / S3 bucket.
- [ ] Fallback & Circuit Breaking: How does the application behave if payment or email services timeout?
