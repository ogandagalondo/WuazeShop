---
name: design-system
description: UI/UX design guidelines, design tokens, color palette, typography, micro-interactions, and visual aesthetics. Use when designing user interfaces, styling components, or enhancing UX.
---

# Design System & UI/UX Guidelines

This skill guides the design language, aesthetic standards, and UI token consistency for **WuazeShop** to ensure an appealing, modern, and trustworthy shopping experience.

---

## 1. Aesthetic Philosophy & Brand Identity

WuazeShop aims for a sleek, modern, and high-conversion e-commerce aesthetic:
- **Clarity over Clutter**: Ample negative space, clear visual hierarchy, and prominent calls to action.
- **Modern Depth**: Subtle glassmorphism (`backdrop-filter: blur`), layered cards with soft elevation shadows, and border highlights.
- **Fluid Micro-interactions**: Smooth transitions on hover, focus, and state changes (0.15s - 0.25s ease-out).

---

## 2. Design Tokens & Palette

### Color Palette
- **Primary / Brand**: `#2563EB` (Vibrant Royal Blue) — Actions, primary buttons, highlights.
- **Primary Hover**: `#1D4ED8`
- **Secondary / Accent**: `#7C3AED` (Deep Violet) / `#059669` (Emerald Green for badges/discounts/success).
- **Background Dark**: `#0F172A` (Slate 900) or `#111827` (Gray 900) for dark themes.
- **Background Light**: `#F8FAFC` (Slate 50) for crisp, clean light surfaces.
- **Card / Surface**: `#FFFFFF` (Light) / `#1E293B` (Dark).
- **Text Primary**: `#0F172A` (Light mode) / `#F8FAFC` (Dark mode).
- **Text Muted**: `#64748B` (Light mode) / `#94A3B8` (Dark mode).
- **Border / Divider**: `rgba(226, 232, 240, 0.8)` (Light) / `rgba(51, 65, 85, 0.5)` (Dark).

### Typography
- **Primary Sans**: `Inter`, `Outfit`, or `Plus Jakarta Sans`, sans-serif.
- **Headings**: SemiBold (600) / Bold (700) with tight tracking (`letter-spacing: -0.02em`).
- **Body**: Regular (400) / Medium (500) with comfortable line height (`1.5` to `1.6`).

---

## 3. Reusable UI Component Patterns

### Buttons
- **Primary CTA**: High contrast, rounded (`border-radius: 8px` to `12px`), bold text, subtle hover lift (`transform: translateY(-1px)`).
- **Secondary CTA**: Subtle surface background, subtle border, smooth color transition.
- **Icon Buttons**: Centered icon, minimum tap target of `44px x 44px` on mobile.

### Product Cards
- Aspect ratio for product image: `1:1` or `4:5`.
- Subtle image zoom on hover (`scale(1.03)` with `transition: transform 0.3s ease`).
- Clear price display (with original price strike-through if discounted).
- Accessible "Quick Add" or "Add to Cart" button.

### Badges & Tags
- Pill-shaped (`border-radius: 9999px`), small font (`11px - 12px`), medium font-weight, distinct status colors (e.g. "Nouveau", "Promo", "Rupture").

---

## 4. UI Quality Checklist

- [ ] Every button and link has clear `:hover`, `:focus-visible`, and `:active` states.
- [ ] Adequate contrast ratio (minimum 4.5:1 for standard text according to WCAG AA).
- [ ] No layout shift when hovering or activating states.
- [ ] Responsive drawer/modal animations with backdrop dimming.
