# Misal Hub — Next.js site

Next.js 16 (App Router) + React 19 + GSAP/ScrollTrigger + Lenis. Looks the same as the original static site in `D:\Data\misalhub`
(verified by pixel comparison — see "Keeping the look identical").

## Run

```
npm install
npm run dev        # http://localhost:3000
npm run build && npm start
```

## Where things live

| Want to change…                     | Edit                                   |
| ----------------------------------- | -------------------------------------- |
| Menu items, prices, Jain prices     | `src/data/menu.ts`                     |
| Order WhatsApp number, delivery note, minimum order | `CONFIG` in `src/data/menu.ts` |
| Google reviews + review link        | `src/data/reviews.ts`                  |
| Dish photos                         | `public/images/menu/<dish-id>.jpg` (ids are in `menu.ts`; a missing file is skipped) |
| Page content                        | `src/app/**/page.tsx`                  |
| Scroll / cursor effects             | `src/components/PageEffects.tsx`, `SmoothScroll.tsx` |
| Menu & cart logic                   | `src/components/MenuApp.tsx`, `src/lib/cart.ts` |

## Keeping the look identical

The original CSS is kept **unchanged** in `legacy/`. `scripts/scope-css.mjs` generates `src/styles/<page>.css` from it,
scoping each page's rules under `.pg-<page>` (and renaming `@keyframes`) so pages can't leak styles into each other.

* Edit a stylesheet in `legacy/`, then run `node scripts/scope-css.mjs`. Never edit `src/styles/*.css` by hand.
* Add `?nofx` to any URL to turn animations off (still frame) — used for side-by-side screenshot comparison.

## Notes

* Online orders and franchise applications are handed to the shop on **WhatsApp** (no server, no payments).
  Real card/UPI payment or e-mail delivery needs a backend (e.g. a Next.js route handler + Razorpay / an e-mail service).
* Effects respect `prefers-reduced-motion`.
