# Going live — setup guide

Everything below is **your accounts and your keys**. Nothing here needs coding. Do the steps in this order; each is independent
until step 6. The website already works without them — it just shows friendly "being set up" messages where a service is missing.

| # | What | Time | Needed for |
|---|------|------|------------|
| 1 | Google Sheet + Apps Script | 10 min | orders + franchise applications saved and e-mailed |
| 2 | Razorpay account | 15 min (+ KYC days for live) | taking payments |
| 3 | Google Cloud API key | 15 min | delivery distance, address search |
| 4 | Google Place ID | 3 min | real Google reviews on the home page |
| 5 | Shop pin | 2 min | correct delivery distances |
| 6 | Vercel deploy + environment variables | 10 min | the live website |

---

## 1. Google Sheet + Apps Script (orders + franchise applications)

1. Sign in to Google with the account that should **receive** the e-mails. Create a new Google Sheet, name it e.g. *Misal Hub Orders*.
2. In the sheet: **Extensions → Apps Script**. Delete everything in the editor, paste the whole of [`apps-script/Code.gs`](../apps-script/Code.gs), click **Save**.
3. Click the **gear icon (Project Settings) → Script properties → Add script property**, add two:
   * `SECRET` = a long random password you invent (e.g. 30+ letters/numbers). Write it down — you need it again in step 6.
   * `NOTIFY_EMAIL` = the e-mail address that should get new paid orders and franchise applications.
4. Back in the editor choose the function **selfTest** in the dropdown and click **Run**. Google asks you to authorise — allow it
   (it needs Sheets + sending e-mail). You should now see two new tabs in the sheet (*Orders*, *Franchise Applications*) and a test e-mail should arrive.
5. **Deploy → New deployment →** gear icon **→ Web app**. *Execute as:* **Me**. *Who has access:* **Anyone**. **Deploy**. Copy the **Web app URL**
   (ends in `/exec`) — this is `APPS_SCRIPT_URL`.

> "Anyone" only means the URL can be called; every call must contain your `SECRET`, otherwise the script refuses it.
> Free Gmail accounts can send about 100 script e-mails a day — plenty for one shop.

## 2. Razorpay (online payment — no cash on delivery)

1. Create an account at razorpay.com. You can build and test immediately in **Test Mode** (toggle at the top of the dashboard); going **Live** needs KYC (business PAN, bank account) which Razorpay approves in a few days.
2. **Account & Settings → API Keys → Generate Test Key.** You get a *Key Id* (`rzp_test_…`) and a *Key Secret* (shown once — copy it).
   These are `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET`.
3. **Settings → Webhooks → Add new webhook** (do this after the site is live, step 6):
   * URL: `https://YOUR-SITE/api/razorpay/webhook`
   * Secret: invent any long random text → this is `RAZORPAY_WEBHOOK_SECRET`
   * Events: tick **payment.captured** and **order.paid**.
   The webhook is the safety net: if a customer pays but closes the tab before the site confirms, Razorpay tells the site directly so you still get the order.
4. To test: use Razorpay's test cards/UPI (`success@razorpay` works as a UPI id in test mode). When happy, generate **Live** keys and replace the three Razorpay values.

## 3. Google Cloud API key (delivery distance + address search)

Without it the site falls back to free OpenStreetMap services, which are much worse at Indian addresses (they could not even find "Silver Cassia").
Google costs little at this volume and includes a monthly free credit; it needs a billing account.

1. Go to console.cloud.google.com → create a project (e.g. *misal-hub*) → link a billing account.
2. **APIs & Services → Library**, enable: **Geocoding API**, **Routes API**, **Places API (New)**.
3. **APIs & Services → Credentials → Create credentials → API key.** Click it → *API restrictions* → restrict to those three APIs. (This key lives only on the server, so no website restriction is needed.)
4. Set a **budget alert** (Billing → Budgets) so you hear about unexpected usage.
This is `GOOGLE_MAPS_API_KEY`.

## 4. Your Google Place ID (real reviews)

1. Open https://developers.google.com/maps/documentation/places/web-service/place-id → **Place ID Finder**, search *Misal Hub, Mira Road East*, click your pin, copy the **Place ID** (starts with `ChIJ…`). This is `GOOGLE_PLACE_ID`.
2. With the key from step 3 the home page then shows your **live rating** and up to **5 reviews** (Google's limit per request), refreshed about hourly.
   If either value is missing, the page shows the rating from `src/data/reviews.ts` and the "Read all our reviews on Google" button.

## 5. Your exact shop pin

Open Google Maps, find your shop, **right-click the pin → click the numbers at the top of the menu** (they copy), e.g. `19.2851, 72.8613`.
Set `SHOP_LATLNG=19.2851,72.8613`. Delivery distances and fees are measured from this point, so please check it carefully.
(The old website's map embed used `19.2892, 72.85905`, which OpenStreetMap suggests may be about 2 km away from "Pleasant Park" — confirm the real one.)

## 6. Put the site online (Vercel)

1. Sign in at vercel.com with the GitHub account that owns the repository.
2. **Add New → Project →** import the repository → leave all defaults (Next.js is detected) → **before** clicking Deploy open **Environment Variables** and add every name from [`.env.example`](../.env.example) with the values from steps 1–5
   (leave `ORDERS_IGNORE_HOURS` empty/absent).
3. **Deploy.** You get a `…vercel.app` address. Open it, place a test order with Razorpay **test** keys, and check: the Sheet row appears, the e-mail arrives, the Razorpay dashboard shows the test payment.
4. Add the Razorpay webhook (step 2.3) using your live URL.
5. Custom domain: **Project → Settings → Domains.**
6. When ready for real money: swap the Razorpay test keys for live keys in Vercel and **Redeploy**.

## Decisions to confirm

* **Delivery rules in force:** free up to 1.5 km (inclusive) on orders **above ₹250**; otherwise distance × ₹4 with a **₹30 minimum** (so everything up to 7.5 km pays ₹30); no delivery beyond 10 km. An order of ₹250 or less within 1.5 km therefore also pays the ₹30 minimum. Change any number in `DELIVERY` in `src/lib/pricing.ts`.
* **Fee rounding:** distance is rounded to 0.1 km, then distance × ₹4 is rounded to the nearest rupee, then the ₹30 minimum applies.
* **Distance is by road** (what the rider rides), not a straight line.
* **No GST / packaging charge** is added. Prices are exactly the menu prices.
* **Hours:** orders accepted 8 AM – 8 PM India time; outside that the checkout is blocked with a message.
* **Franchise page** still mentions "Zomato & Swiggy onboarding" as support offered to franchisees (you asked for that earlier). Easy to remove.
* **Dish photos** are stand-ins from Wikimedia Commons (credited at `/credits`). Replace any of them by dropping your own `public/images/menu/<dish-id>.jpg`.

* **Address matching without a Google key:** if the exact address is not on OpenStreetMap, the site tries simpler versions (without flat number, building and "Opp / Near" landmarks) and then charges by the neighbourhood, clearly marked "approximate". Customers can tap "Use my current location" for an exact fee. Google's address search (step 3) is far better at this.
* **Coordinates are trusted from the customer's phone** (GPS or the matched address). The order email shows the typed address plus a map link, so a mismatch is easy to spot; tell us if you want a stricter check.