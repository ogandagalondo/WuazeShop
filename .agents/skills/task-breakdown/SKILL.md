---
name: task-breakdown
description: Project decomposition into atomic milestones, task scheduling, dependency mapping, and Definition of Done (DoD) verification. Use to organize and plan project phases before coding.
---

# Task Breakdown & Phased Execution Plan

This skill provides a battle-tested structure to split the **WuazeShop** project into atomic, testable, and incremental delivery lots.

---

## 1. Golden Rules of Phased Execution

1. **One Step at a Time**: Never move to the next phase until the current phase is fully built, tested, and verified.
2. **Small Atomic Tasks**: Tasks must be scoped to touch minimal files and be completed with clear input/output expectations.
3. **Continuous Working State**: The main branch / workspace must always run without breaking errors at the conclusion of each task.

---

## 2. Standard E-Commerce Milestone Roadmap

```text
Phase 0: Architecture & Environment Setup
├── Project scaffolding & dependencies installation
├── Database setup, migrations & initial seed data
└── Base layout, navigation & theme tokens

Phase 1: Product Catalog & Navigation
├── Category browsing & product list view (pagination / filters)
├── Search functionality
└── Product detail page (gallery, stock indicator, price formatting)

Phase 2: Cart & State Management
├── Cart store implementation (persistent local storage + state)
├── Add to cart, quantity modifier, item removal
└── Slide-over cart drawer & order summary calculations (tax, shipping)

Phase 3: Checkout Tunnel & Payments
├── Customer information & shipping address form with validation
├── Checkout session creation API
├── Payment provider integration (Stripe Checkout / Elements)
└── Webhook listener for payment confirmation & order status update

Phase 4: Customer Area & Admin Dashboard
├── Order confirmation page & email receipt trigger
├── Customer order history (if authenticated)
└── Basic admin inventory view (manage products, view orders)

Phase 5: Polish, Security & Performance Audit
├── Core Web Vitals audit (LCP, CLS, FID)
├── End-to-end user journey test execution
└── Security headers, rate limiting & error handling audit
```

---

## 3. Atomic Task Template

When detailing a task in the plan, use this standardized structure:

```markdown
### Task [ID]: [Title of the Task]
- **Goal**: Clear 1-sentence description of what this task accomplishes.
- **Files Modified / Created**: Explicit list of target files.
- **Dependencies**: Prerequisites needed before starting.
- **Implementation Steps**: Bullet points of exact changes.
- **Verification / Testing**: How to prove it works (command to run, browser URL to inspect).
```

---

## 4. Definition of Done (DoD) Checklist

A phase or task is strictly considered **DONE** only when:
- [ ] Code compiles without TypeScript or build errors.
- [ ] No regression in existing features or layouts.
- [ ] Verified visually in the browser or via automated tests.
- [ ] Documentation or comments updated where appropriate.
