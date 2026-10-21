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

## How ordering works

1. The cart lives in the browser (`src/lib/cart.ts`) but **prices are never trusted from it**: `/api/checkout/create` re-prices every line from `src/data/menu.ts`
   (`priceCart` in `src/lib/pricing.ts`), works out the delivery fee, and creates the Razorpay order for exactly that amount.
2. Delivery: `/api/delivery/quote` geocodes the address (or takes GPS coordinates), asks Google Routes (fallback: OSRM) for the **road distance**, and applies the owner's rules
   in `deliveryQuote()` — ₹50 up to 1 km, ₹80 beyond that, none beyond 5 km. The same function previews the fee in the browser.
3. Payment: Razorpay popup → `/api/checkout/verify` checks the signature → the **Google Apps Script** (`apps-script/Code.gs`) marks the order Paid in the Sheet and e-mails the shop (and the customer, if they gave an address).
   `/api/razorpay/webhook` repeats this server-to-server as a safety net; the script ignores duplicates.
4. Franchise applications: `/api/franchise` → same Apps Script → Sheet row + e-mails.
5. Reviews: `src/lib/server/reviews.ts` loads real Google reviews through the Places API (cached ~1 h), falling back to `src/data/reviews.ts`.

**Setup of the external accounts is in [docs/SETUP.md](docs/SETUP.md)**; settings are listed in [.env.example](.env.example).

## Tests

```
npm test                    # unit tests: delivery fee rules, cart pricing, opening hours, payment signatures
npm run build
npm run test:integration    # the real server against stand-ins for Razorpay + Google (no real money, no real e-mail)
```

## Notes

* Effects respect `prefers-reduced-motion`.
* Dish photos not taken by the shop come from Wikimedia Commons and are credited at `/credits` (`src/data/photo-credits.ts`).
