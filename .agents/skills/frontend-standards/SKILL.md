---
name: frontend-standards
description: Best practices, architecture guidelines, and standards for frontend development, component structure, state management, and web performance. Use when developing, refactoring, or reviewing frontend code.
---

# Frontend Architecture & Standards

This skill defines the technical standards, architectural patterns, and quality requirements for frontend development in the **WuazeShop** project.

---

## 1. Core Principles

- **Mobile-First & Responsive**: All views must be designed mobile-first and seamlessly adapt to tablet and desktop breakpoints.
- **Component-Driven Architecture**: Build modular, reusable, single-responsibility components.
- **Declarative & Predictable State**: Keep state as close as possible to where it is consumed. Distinguish between server state (cached data) and UI state.
- **Zero Layout Shifts (CLS)**: Always reserve dimensions for images, banners, and dynamic content.

---

## 2. Directory & Component Structure

Organize frontend code logically:

```text
src/
├── components/
│   ├── common/           # Reusable generic UI components (Buttons, Inputs, Modals, Cards)
│   ├── layout/           # Header, Footer, Navigation, Sidebar
│   └── shop/             # Domain-specific components (ProductCard, CartDrawer, CheckoutForm)
├── hooks/                # Custom React/frontend hooks
├── services/             # API client services and data fetchers
├── stores/               # Global state / context providers (Cart, Auth, Theme)
├── types/                # TypeScript interfaces and type definitions
└── utils/                # Helper functions, formatters (currency, dates)
```

### Component Guidelines
- Use explicit TypeScript interfaces for all component props.
- Keep components focused: split components exceeding 150-200 lines into sub-components.
- Use early returns for loading, error, and empty states.

---

## 3. State Management Best Practices

1. **Local State**: Use standard state hooks for UI-only state (e.g., dropdown open/close, accordion toggles).
2. **Domain/Cart State**: Use dedicated stores or Context with reducer patterns for shopping cart items, quantities, and totals.
3. **Data Fetching & Cache**: Avoid manual `useEffect` fetching cascades. Use TanStack Query (React Query) or SWR if available, handling loading, error, and cached states cleanly.

---

## 4. Performance & Core Web Vitals Checklist

- [ ] **Image Optimization**: Use WebP/AVIF formats with `srcset` and explicit `width`/`height`. Use lazy loading for off-screen images.
- [ ] **Bundle Size**: Avoid importing entire utility libraries (e.g. import individual lodash functions or use native JS methods).
- [ ] **Debounce Inputs**: Debounce search bars, filter inputs, and quantity adjustments (300ms typical).
- [ ] **Accessible Navigation**: Ensure all interactive elements have semantic tags (`<button>`, `<a>`, `<nav>`, `<main>`), proper `aria-` attributes, and keyboard navigability (`Tab`, `Enter`, `Escape`).
