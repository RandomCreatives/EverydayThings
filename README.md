# Minimalist Photography Portfolio + Archive + Print Shop

A high-performance Next.js App Router scaffold for an ultra-minimal photography archive, curated project layer, and non-intrusive print-ordering drawer.

## Implemented scope

1. **Next.js scaffold** — App Router, React, TypeScript, Tailwind CSS.
2. **Archive** — `/archive` fluid CSS-column masonry preserving natural aspect ratios with muted location captions.
3. **Print drawer** — right-side `Sidebar` style drawer with thumbnail, image code, size selector, and checkout action.
4. **Portfolio layer** — `/projects`, `/projects/[id]`, `/about` with linear project sequences and text contact form.
5. **CMS/database structures** — Sanity document schemas and an optional Supabase SQL schema.
6. **Stripe checkout** — `/api/checkout` creates a Checkout Session mapped to `imageCode` and size; `/api/webhooks/stripe` is ready for order persistence.
7. **Image optimization** — `next/image` is used for archive, drawer, project covers, and project detail images with AVIF/WebP, device sizes, cache TTL, explicit `sizes`, and muted gray blur placeholders.
8. **Local content database** — `data/sampleData.ts` holds the active `Photograph` and `Project` arrays mapped to local image assets.
9. **Contact form API** — `/api/contact` validates submissions and can deliver through Formspree or Resend.
10. **Local upload simulator** — `/admin/upload` measures selected image dimensions, generates `aspectRatio` and `imageCode`, and appends mock objects to live local UI state.
11. **Production hardening** — server environment helpers, Stripe sandbox fallback, Vercel URL fallback, HTTP-only admin auth cookie, responsive mobile bottom-sheet drawer, and Vercel security headers.

## Design rules preserved

- Pure white background, black text, muted grays only.
- Raw sticky navigation: `ARCHIVE • PROJECTS • ABOUT & CONTACT`.
- No shadows, rounded cards, heavy framing, parallax, or slow fades.
- Image context menus call `preventDefault()`.
- Hover/tap overlay includes `[ SAVE ]` and `[ ORDER PRINT - {imageCode} ]`.
- Ordering never routes to a cart page; it uses the drawer.

## Run locally

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open `http://localhost:3000`.

## Contact form setup

The contact form posts to `/api/contact` and returns JSON success/error states. Configure one delivery provider in `.env.local`:

```bash
# Option A: Formspree
FORMSPREE_ENDPOINT=https://formspree.io/f/your_form_id

# Option B: Resend
RESEND_API_KEY=re_...
CONTACT_TO_EMAIL=studio@example.com
```

Without a provider, submissions are validated and logged server-side for local development.

## Local upload simulator

Open `/admin/upload` and unlock with the server-side password:

```bash
ADMIN_UPLOAD_PASSWORD=replace-with-a-long-random-password
```

The panel does not persist files. It simulates the ingestion flow by measuring image dimensions in-browser, calculating `aspectRatio`, generating an `imageCode`, and appending the mock object to live client state.

## Stripe setup

Add real keys to `.env.local`:

```bash
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

The checkout route validates:

- `imageCode`
- `sizeId`
- print availability

Then stores these values in Stripe Checkout metadata for fulfillment.

If Stripe is not configured, the route returns a mock URL so the drawer flow remains testable.

## Image optimization

Local raster assets live in:

- `public/images/archive`
- `public/images/projects`

`next.config.mjs` is configured for AVIF/WebP output, custom mobile-first device sizes, and a 30-day optimized image cache. Components use `next/image` with explicit responsive `sizes` and a muted gray `blurDataURL` fallback.

Image target from the project rules:

- WebP/JPEG source acceptable locally; Next.js serves AVIF/WebP where supported
- 72 DPI export target for production source files
- 2000px maximum long edge
- preserve natural aspect ratio

## Data model

The exact TypeScript interfaces are in `lib/types.ts`:

- `Photograph`
- `Project`
- `PrintSize`

The active local content database is `data/sampleData.ts`. `lib/data.ts` re-exports and provides lookup helpers. For production, replace these arrays with Sanity or Supabase reads that map back into the same types.

## Suggested next production additions

- Admin-only ingestion script that reads image dimensions and writes `aspectRatio` automatically.
- Stripe webhook persistence to Supabase/Sanity order documents.
- Email notifications for completed print orders.
- CDN image delivery with cache headers and WebP variants.
- Server-side contact endpoint with spam protection.
