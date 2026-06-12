# Production Audit

## Environment handling

- `lib/env.ts` centralizes server-side environment parsing.
- `NEXT_PUBLIC_SITE_URL` falls back to `https://${VERCEL_URL}` and then `http://localhost:3000`.
- `/api/checkout` never throws for a missing Stripe secret; it returns a controlled Sandbox/Test Mode response.
- Stripe webhook route returns `503` JSON when webhook variables are not configured.

## Admin upload security

- `/admin/upload` is dynamic and server-gated.
- Password is read from server-only `ADMIN_UPLOAD_PASSWORD`.
- Successful login writes an HTTP-only, same-site session cookie.
- If `ADMIN_UPLOAD_PASSWORD` is missing, the route is disabled.

## Design constraint sweep

- No non-monochrome Tailwind palettes remain in `app`, `components`, `lib`, or `data`.
- Legacy `neutral-*` utilities were replaced with `gray-*`.
- Remaining color utilities are monochrome only: white, black, and gray.
- The required solid black checkout/action buttons remain black with white text.
- Image fallback surfaces are muted gray.

## Image protection sweep

Image renderers with context-menu prevention:

- `components/ProtectedImage.tsx`
- `components/PrintDrawer.tsx`
- `components/ProjectGrid.tsx`
- `components/admin/AdminUploadPanel.tsx`

All production archive/project/drawer images use `next/image` with responsive `sizes` and gray blur placeholders.

## Mobile drawer behavior

- Desktop/tablet: right-side slide-out drawer.
- Narrow viewport: bottom-sheet slide-up drawer at `86dvh` height.
- No cart route is introduced.

## Build verification

Passed locally:

```bash
npm run typecheck
npm run build
```
