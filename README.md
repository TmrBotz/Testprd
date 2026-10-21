# Digital Store (Next.js 14 + MongoDB + automatic UPI verification)

## Setup
1. `npm install`
2. Copy `.env.example` to `.env.local` and fill every value.
3. `npm run dev` then open http://localhost:3000 (admin: /admin)
4. `npm run build` to check the production build.

## Environment variables
| Name | Required | Notes |
|---|---|---|
| MONGODB_URI | yes | MongoDB Atlas connection string |
| ADMIN_PASSWORD | yes | Admin login password |
| SESSION_SECRET | yes | 32+ characters, signs cookies (HMAC SHA256) |
| PAYMENT_API_URL | yes | https://sky-post-upload-jq4a.onrender.com |
| PAYMENT_API_KEY | yes | Server-side only. Never use NEXT_PUBLIC_ |
| ACCESS_HOURS | no | Default 24 |
| NEXT_PUBLIC_SITE_URL | no | Falls back to VERCEL_PROJECT_PRODUCTION_URL, then http://localhost:3000 |

Missing optional values never crash the app. Missing required values show a clear message only when that feature is used.

## Deploy to Vercel
1. Push this folder to a Git repo and import it in Vercel (framework: Next.js).
2. Add the environment variables above (Production + Preview).
3. MongoDB Atlas: Network Access -> Add IP Address -> `0.0.0.0/0` (Vercel uses dynamic IPs).
4. Deploy. The pay route sets `maxDuration = 60` (Hobby plan maximum).

## Payment verification
`lib/verify.js` calls `POST {PAYMENT_API_URL}/api/verify` with headers `x-api-key` and body `{ utr, amount, orderId }`.
- `success:true` -> approved Order, access cookie, content unlocks.
- `success:false` -> HTTP 402 with the API message. No order, nothing unlocked.
- 401/403/429/5xx, network error, timeout, bad JSON or missing env -> HTTP 503 "temporarily unavailable". No order. Real reason is logged with console.error.
- 55 second timeout per attempt, one retry on network error/timeout. The total budget is capped at 57 seconds so it stays inside the 60 second function limit. If the first attempt uses the full 55 seconds there is no time left for a retry.
- The amount comes from the database price. A UTR can be used once (pre-check + unique index + duplicate-key handling).
- Use QR mode **Auto** so the order ID is in the UPI note (`tn=`). Custom QR images cannot carry it.

## Manual test checklist
1. Open `/admin`, log in, go to Settings: set UPI ID, payee name, QR mode Auto, Save.
2. Dashboard -> New product: title, price 1, add a link, status Published, Save.
3. Open the product page as a buyer: links are hidden, "Unlock now" is shown.
4. Click Unlock now: QR appears, the UPI link contains `tn=ORDxxxxxxxx`, the page shows the same order ID.
5. Pay Rs 1, enter the 12-digit UTR, tap Unlock content.
6. The overlay runs 5-8 seconds, then the product page shows the links and "Access valid until".
7. Reuse the same UTR: "This UTR has already been used."
8. Enter a random 12-digit UTR: the API's failure message is shown and nothing unlocks.
9. Admin -> Orders shows the approved order. Try Revoke, then reload the buyer page.

## Dependency table
| File | Type | Imports (name from file) |
|---|---|---|
| lib/config.js | server/shared | none |
| lib/db.js | server | mongoose |
| lib/slug.js | shared | none |
| lib/format.js | shared | none |
| lib/auth.js | server | crypto, next/headers cookies, next/navigation redirect, config.isProd |
| lib/validate.js | server | slug.slugify, slug.isValidSlug |
| lib/verify.js | server | crypto |
| lib/settings.js | server | db (default), models/Settings (default, DEFAULT_TERMS, DEFAULT_REFUND) |
| lib/access.js | server | db, models/Order, auth.createToken/verifyToken/cookieOptions, config.getAccessHours |
| models/Product.js, Order.js, Settings.js | server | mongoose |
| components/AutoRefresh, CopyButton, LogoutButton, OrderActions, ProductActions, UtrForm, ProductForm, SettingsForm | client | react, next/navigation, next/link, lib/slug (ProductForm only) |
| components/Footer, PublicShell | server | next/link, Footer |
| app/layout.js | server | globals.css, config.getSiteUrl |
| app/page.js, app/p/[slug]/page.js, app/p/[slug]/pay/page.js, app/legal/[type]/page.js | server | db, models, settings.getSettingsSafe, access.getAccess, verify.generateOrderId, format, PublicShell, client components |
| app/admin/page.js | client | react, next/navigation |
| app/admin/(panel)/* | server | db, models, auth.requireAdmin, format, client components |
| app/api/pay/route.js | route | db, models, verify, access.attachAccessCookie, config, validate |
| app/api/admin/**/route.js | route | db, models, auth, validate, config |

## Verification report
Checked by script on the generated files:
- Every `@/` import resolves to a real file, and every named/default import matches an export in that file.
- Every className used in JSX exists in `app/globals.css`.
- `node --check` passes on every non-JSX file; brackets and parentheses balance in all files.

Checked by reading:
- Server Components use no hooks or event handlers. Client Components import no server-only modules.
- `cookies().set` is never used. Cookies are set only on `NextResponse` objects in route handlers.
- `redirect()` and `notFound()` are never inside try/catch.
- Empty database and missing optional env vars: pages render empty states, nothing throws at import time.

Not verified here: `npm install` and `npm run build` could not be run in this environment (no network). Run them yourself before deploying.
