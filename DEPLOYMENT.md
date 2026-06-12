# Vercel Deployment Checklist

## Required build settings

- Framework Preset: `Next.js`
- Install Command: `npm install`
- Build Command: `npm run build`
- Output Directory: leave empty / Next.js default
- Node.js Version: 20.x or newer

## Required environment variables

Paste these into **Vercel Project → Settings → Environment Variables**.

### Application URL

```bash
NEXT_PUBLIC_SITE_URL=https://your-domain.com
```

If omitted, the app falls back to `https://${VERCEL_URL}` automatically.

### Admin upload gate

```bash
ADMIN_UPLOAD_PASSWORD=use-a-long-random-password
```

Required to access `/admin/upload`. If omitted, the route is disabled and only shows a locked notice.

### Stripe checkout

```bash
STRIPE_SECRET_KEY=sk_live_or_sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_or_pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_CURRENCY=usd
```

If `STRIPE_SECRET_KEY` is omitted, `/api/checkout` returns a controlled Sandbox/Test Mode response instead of throwing a production 500.

### Contact form delivery

Use one provider.

#### Option A — Formspree

```bash
FORMSPREE_ENDPOINT=https://formspree.io/f/your_form_id
```

#### Option B — Resend

```bash
RESEND_API_KEY=re_...
CONTACT_TO_EMAIL=studio@example.com
```

If neither provider is configured, the API validates the payload and logs the inquiry server-side for development.

### Optional CMS variables

Only needed when replacing the local `data/sampleData.ts` source.

```bash
NEXT_PUBLIC_SANITY_PROJECT_ID=...
NEXT_PUBLIC_SANITY_DATASET=production
SANITY_API_READ_TOKEN=...
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
```

## Stripe webhook

Create a Stripe webhook endpoint:

```text
https://your-domain.com/api/webhooks/stripe
```

Subscribe to:

```text
checkout.session.completed
```

Paste the webhook signing secret into `STRIPE_WEBHOOK_SECRET`.

## Security headers

`vercel.json` sets:

- `X-Frame-Options: DENY`
- `X-Content-Type-Options: nosniff`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy`
- `Content-Security-Policy`
- immutable cache headers for `/images/*`

## Pre-deployment commands

Run locally before pushing:

```bash
npm run typecheck
npm run build
```

Both commands should complete successfully.
