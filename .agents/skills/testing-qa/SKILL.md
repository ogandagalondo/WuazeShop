---
name: testing-qa
description: Testing strategies, quality assurance, unit tests, integration tests, E2E testing workflows, and regression verification. Use when writing tests, reviewing code quality, or preparing a release.
---

# Quality Assurance & Testing Guidelines

This skill outlines testing practices, coverage targets, and verification procedures for **WuazeShop** to guarantee reliability and prevent regressions.

---

## 1. Testing Pyramid for E-Commerce

1. **Unit Tests (High Volume)**:
   - Currency and discount calculation utilities (taxes, cart totals, coupons).
   - Validation schemas (Zod/form rules).
   - Individual UI components in isolation.
2. **Integration Tests (Medium Volume)**:
   - Cart workflows (adding, updating quantities, removing items, stock decrement).
   - Authentication flow (login, token refresh, logout, protected route access).
   - API endpoints (mocking external payment gateways).
3. **End-to-End Tests (Critical Paths)**:
   - User Journey: Landing page -> Product details -> Add to cart -> Checkout -> Order confirmation.
   - Admin Journey: Product creation -> Inventory update -> Order status change.

---

## 2. Test Conventions & Tools

- **Unit & Integration Runner**: Vitest or Jest.
- **Component Testing**: Testing Library (`@testing-library/react` or equivalent).
- **E2E Testing**: Playwright or Cypress.
- **Naming Convention**:
  - `*.test.ts` / `*.test.tsx` for unit/integration tests located next to the tested unit or in `__tests__/`.
  - `*.spec.ts` for end-to-end tests located in `tests/e2e/`.

---

## 3. Best Practices for Test Writing

- **Test Behavior, Not Implementation Details**: Avoid testing internal component state; test what the user sees and interacts with (e.g. click "Ajouter au panier" and assert that badge counter becomes 1).
- **Deterministic & Isolated**: Each test must run independently without relying on previous test executions or global shared mutable state.
- **Mocking External Services**: Always mock external APIs (payment processors, SMS/email notifications, CDN asset upload) during unit and integration runs.

---

## 4. Pre-Commit / Pre-PR Verification Checklist

Before pushing or merging a feature:
- [ ] Linter & Typechecker pass with 0 errors (`npm run lint` and `tsc --noEmit`).
- [ ] All unit and integration test suites pass (`npm test`).
- [ ] Critical e-commerce paths validated with E2E suite.
- [ ] No sensitive credentials or debug logs (`console.log`) in the codebase.
