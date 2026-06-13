/**
 * POST /api/checkout
 *
 * Creates a Chapa checkout session for a fine art print order.
 * Supports all Chapa payment channels including Telebirr and CBEBirr.
 *
 * Body: { imageCode: string; sizeId: string; email?: string; name?: string }
 *
 * Returns:
 *   { ok: true;  mode: "chapa";    url: string }   — redirect to Chapa hosted checkout
 *   { ok: true;  mode: "sandbox";  url: string }   — Chapa not configured, sandbox flow
 *   { ok: false; error: string }                   — validation error
 */

import { NextResponse } from 'next/server';
import { getPhotographByCode, printSizes } from '@/lib/data';
import { getServerEnv, isConfiguredSecret } from '@/lib/env';
import { getSupabaseServiceRole } from '@/lib/supabase';

const CHAPA_API = 'https://api.chapa.co/v1';

type CheckoutBody = {
  imageCode?: string;
  sizeId?: string;
  email?: string;
  name?: string;
};

export async function POST(request: Request) {
  const env = getServerEnv();
  const body = (await request.json().catch(() => null)) as CheckoutBody | null;

  if (!body?.imageCode || !body?.sizeId) {
    return NextResponse.json({ ok: false, error: 'Missing imageCode or sizeId.' }, { status: 400 });
  }

  const photo = await getPhotographByCode(body.imageCode);
  const size = printSizes.find((s) => s.id === body.sizeId);

  if (!photo || !photo.isPrintAvailable || !size) {
    return NextResponse.json({ ok: false, error: 'Print is unavailable.' }, { status: 404 });
  }

  // Amount in Birr (priceCents field repurposed as price in Birr × 100 for consistency)
  const amountBirr = size.priceCents / 100;
  const txRef = `ET-${photo.imageCode}-${size.id}-${Date.now()}`;

  // ── Sandbox fallback when Chapa is not configured ─────────────────────────
  if (!isConfiguredSecret(env.chapaSecretKey, 'CHASECK')) {
    return NextResponse.json({
      ok: true,
      mode: 'sandbox',
      message: env.isProduction
        ? 'Sandbox mode: configure CHAPA_SECRET_KEY to enable live payments.'
        : 'Sandbox mode: add CHAPA_SECRET_KEY to .env.local for live Chapa checkout.',
      url: `${env.siteUrl}/archive?checkout=sandbox&imageCode=${encodeURIComponent(photo.imageCode)}&size=${encodeURIComponent(size.id)}`,
    });
  }

  // ── Create Chapa checkout session ─────────────────────────────────────────
  const chapaPayload = {
    amount: amountBirr.toFixed(2),
    currency: 'ETB',
    email: body.email ?? 'guest@everydaythings.et',
    first_name: body.name ?? 'Guest',
    last_name: 'Buyer',
    tx_ref: txRef,
    callback_url: `${env.siteUrl}/api/webhooks/chapa`,
    return_url: `${env.siteUrl}/archive?checkout=success&tx_ref=${encodeURIComponent(txRef)}`,
    customization: {
      title: 'Everyday Things — Fine Art Print',
      description: `${photo.title} · ${size.label} (${size.dimensions})`,
    },
  };

  const chapaRes = await fetch(`${CHAPA_API}/transaction/initialize`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.chapaSecretKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(chapaPayload),
  });

  const chapaData = (await chapaRes.json()) as {
    status: string;
    data?: { checkout_url: string };
    message?: string;
  };

  if (!chapaRes.ok || chapaData.status !== 'success' || !chapaData.data?.checkout_url) {
    return NextResponse.json(
      { ok: false, error: chapaData.message ?? 'Unable to create Chapa checkout session.' },
      { status: 502 },
    );
  }

  // ── Persist pending order in Supabase ─────────────────────────────────────
  const sb = getSupabaseServiceRole();
  if (sb) {
    // Fire-and-forget — don't block the redirect on DB write
    void fetch(`${env.supabaseUrl}/rest/v1/orders`, {
      method: 'POST',
      headers: {
        apikey: process.env.SUPABASE_SERVICE_ROLE_KEY ?? '',
        Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY ?? ''}`,
        'Content-Type': 'application/json',
        Prefer: 'return=minimal',
      },
      body: JSON.stringify({
        chapa_tx_ref: txRef,
        chapa_checkout_url: chapaData.data.checkout_url,
        photograph_id: photo.id,
        image_code: photo.imageCode,
        print_size_id: size.id,
        amount_birr: amountBirr,
        currency: 'ETB',
        customer_email: body.email ?? null,
        customer_name: body.name ?? null,
        status: 'pending',
      }),
    });
  }

  return NextResponse.json({ ok: true, mode: 'chapa', url: chapaData.data.checkout_url });
}
