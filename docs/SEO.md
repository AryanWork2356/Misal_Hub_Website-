# SEO — what is built in, and what only the owner can do

## Built into the website (nothing to do)

| What | Where | Why it matters |
|------|-------|----------------|
| Unique title + description + canonical for every page | `src/lib/seo.ts` (`pageMeta`), each `page.tsx` | Google shows the right snippet and does not split ranking between duplicate URLs |
| Open Graph + Twitter cards and a generated preview image (1200×630) | `src/app/opengraph-image.tsx` | Good-looking link previews on WhatsApp, Facebook, X, LinkedIn |
| **Restaurant** structured data: address, map pin, hours 8–8, cuisine, menu link, order action, founders, founded 2015 | `restaurantSchema()` on Home | Google Maps / Search "Misal Hub" knowledge panel, "open now", local pack |
| **Menu** structured data: every dish with its price in ₹ | `menuSchema()` on /menu | Dishes and prices can appear in Search |
| **FAQ** accordion + FAQPage data (home + franchise) | `FaqSection`, `HOME_FAQ`, `FRANCHISE_FAQ` in `seo.ts` | Answers questions people type ("misal pav delivery Mira Road", "misal pav franchise") |
| Breadcrumbs, WebSite data | `breadcrumbSchema()`, root layout | Cleaner result display |
| `sitemap.xml`, `robots.txt` (blocks `/api`, blocks preview deployments), web manifest | `src/app/sitemap.ts`, `robots.ts`, `manifest.ts` | Faster, correct crawling; installable on phones |
| Local keywords in titles, headings and an intro line: *Mira Road East, Mira Bhayandar, Misal Pav, delivery, franchise* | home, menu, about, franchise | Ranking for local searches |
| Geo meta tags, phone/address detection, `lang="en-IN"` | root layout | Local relevance |
| `/credits` is marked noindex | `credits/page.tsx` | Keeps a thin page out of search |

Deliberately **not** added: star-rating markup. Google ignores (and can penalise) a business marking up its own
reviews on its own site. Real review stars appear from your Google Business Profile instead.

## When the real domain is connected (5 minutes)

1. Vercel → Project → Settings → Environment Variables → add `NEXT_PUBLIC_SITE_URL` = `https://yourdomain.in` (no trailing slash) → Redeploy.
   Canonical links, sitemap, preview image and structured data all switch to the new domain by themselves.
2. In Vercel → Domains, make the **non-www or www** version primary and redirect the other to it, and leave the `.vercel.app` address redirecting to it.

## Owner tasks that move rankings the most (cannot be done in code)

1. **Google Business Profile** (biggest local-SEO lever). Under the Misal Hub account: category *Maharashtrian restaurant*
   (secondary: *Fast food restaurant*, *Breakfast restaurant*), website = the domain, hours 8–8, add the menu, the
   "Order online" link = `https://yourdomain.in/menu`, phone, and **at least 10 real photos** (dishes, shop front, team).
   Post an update weekly (offers, new dish).
2. **Reviews.** Ask every happy customer for a Google review (print the review QR/link on the bill, bag and at the counter).
   Reply to every review. Number and recency of reviews decide the local pack.
3. **Google Search Console** → add the domain → verify (set `GOOGLE_SITE_VERIFICATION` in Vercel with the code it gives you, redeploy) →
   submit `https://yourdomain.in/sitemap.xml`. Do the same in **Bing Webmaster Tools** (`BING_SITE_VERIFICATION`).
4. **Consistent name, address, phone everywhere** (Google profile, Instagram, Facebook, Justdial, Zomato/Swiggy listing if any):
   exactly "Misal Hub, Shop 2/3, Silver Cassia Apartment, Pleasant Park Road, Near Gayatri Dham, Mira Road East, Mira Bhayandar 401107".
   Confirm which phone number is correct (Google shows 086918 96366, the site uses +91 90041 67448) and make them all the same.
5. **Backlinks**: list the shop on Justdial, Sulekha, Instagram bio, Facebook page, local Mira Road / Mira-Bhayandar
   community groups and food bloggers. Franchise: list on franchise portals (e.g. FranchiseIndia, Franchise Dunia).
6. **Real photos**: replace the Wikimedia stand-in dish photos with your own (`public/images/menu/<dish-id>.jpg`).
   Name files for the dish. Own photos beat stock ones in Google Images and convert better.
7. **Content** (monthly): a short "misal pav" blog/story page (what is misal, Kolhapuri vs Puneri misal, our recipe) will bring
   search traffic. Ask and I will write and add them.

## Quick checks after going live

* https://search.google.com/test/rich-results → paste the home URL (Restaurant + FAQ should be detected) and /menu (Menu).
* https://pagespeed.web.dev → check mobile score.
* Search `site:yourdomain.in` after a few days to see pages indexed.
