/**
 * POST /api/checkout
 *
 * Creates a Chapa checkout session for a fine art print order.
 * Supports all Chapa channels: Telebirr, CBEBirr, Amole, M-Pesa, bank.
 *
 * Body: {
 *   imageCode: string
 *   sizeId: string
 *   fullName: string
 *   email: string
 *   phoneNumber: string        — Ethiopian format: 09xx, 07xx, +251xx, 251xx
 *   locationDetails: string    — delivery address
 * }
 *
 * Returns:
 *   { ok: true;  mode: "chapa";   checkoutUrl: string }
 *   { ok: true;  mode: "sandbox"; checkoutUrl: string }
 *   { ok: false; error: string }
 */

import { NextResponse } from 'next/server';
import { getPhotographByCode } from '@/lib/data';
import { getServerEnv, isConfiguredSecret } from '@/lib/env';
import { getPrintSize } from '@/lib/printSizes';
import { getClientIp, rateLimit, rateLimitHeaders } from '@/lib/rateLimit';

const CHAPA_API = 'https://api.chapa.co/v1';
const ETH_PHONE_RE = /^(?:\+?251|0)[97]\d{8}$/;

type CheckoutBody = {
  imageCode?: unknown;
  sizeId?: unknown;
  fullName?: unknown;
  email?: unknown;
  phoneNumber?: unknown;
  locationDetails?: unknown;
};

export async function POST(request: Request) {
  // ── Rate limit: 10 checkout attempts per IP per 10 min ───────────────────
  const ip = getClientIp(request);
  const rl = rateLimit({ key: `checkout:${ip}`, limit: 10, windowMs: 10 * 60 * 1000 });
  if (!rl.ok) {
    return NextResponse.json(
      { ok: false, error: 'Too many checkout attempts. Please wait a few minutes.' },
      { status: 429, headers: rateLimitHeaders(rl) },
    );
  }

  const env = getServerEnv();
  const body = (await request.json().catch(() => null)) as CheckoutBody | null;

  // ── Input validation ──────────────────────────────────────────────────────
  const imageCode = typeof body?.imageCode === 'string' ? body.imageCode.trim() : '';
  const sizeId = typeof body?.sizeId === 'string' ? body.sizeId.trim() : '';
  const fullName = typeof body?.fullName === 'string' ? body.fullName.trim() : '';
  const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : '';
  const phoneNumber = typeof body?.phoneNumber === 'string' ? body.phoneNumber.trim() : '';
  const locationDetails = typeof body?.locationDetails === 'string' ? body.locationDetails.trim() : '';

  if (!imageCode || !sizeId) {
    return NextResponse.json({ ok: false, error: 'Missing imageCode or sizeId.' }, { status: 400 });
  }
  if (fullName.length < 2) {
    return NextResponse.json({ ok: false, error: 'Full name is required.' }, { status: 400 });
  }
  if (!email.includes('@')) {
    return NextResponse.json({ ok: false, error: 'Valid email address is required.' }, { status: 400 });
  }
  if (!ETH_PHONE_RE.test(phoneNumber)) {
    return NextResponse.json(
      { ok: false, error: 'Enter a valid Ethiopian phone number (09xx, 07xx, or +251xx).' },
      { status: 400 },
    );
  }
  if (locationDetails.length < 10) {
    return NextResponse.json({ ok: false, error: 'Delivery location details are required (min 10 characters).' }, { status: 400 });
  }

  const photo = await getPhotographByCode(imageCode);
  const size = getPrintSize(sizeId);

  if (!photo || !photo.isPrintAvailable || !size) {
    return NextResponse.json({ ok: false, error: 'Print is unavailable.' }, { status: 404 });
  }

  const amountEtb = Math.round(size.priceCents / 100);
  const txRef = `ET-MONO-${Date.now()}`;

  // ── Sandbox fallback ──────────────────────────────────────────────────────
  if (!isConfiguredSecret(env.chapaSecretKey)) {
    return NextResponse.json({
      ok: true,
      mode: 'sandbox',
      message: 'Sandbox mode: configure CHAPA_SECRET_KEY to enable live payments.',
      checkoutUrl: `${env.siteUrl}/archive?checkout=sandbox&imageCode=${encodeURIComponent(photo.imageCode)}&size=${encodeURIComponent(size.id)}`,
    });
  }

  // ── Create Chapa session ──────────────────────────────────────────────────
  const [firstName, ...rest] = fullName.split(' ');
  const lastName = rest.join(' ') || '-';

  const chapaPayload = {
    amount: amountEtb.toFixed(2),
    currency: 'ETB',
    email,
    first_name: firstName,
    last_name: lastName,
    phone_number: phoneNumber,
    tx_ref: txRef,
    callback_url: `${env.siteUrl}/api/webhooks/payment`,
    return_url: `${env.siteUrl}/archive?checkout=success&tx_ref=${encodeURIComponent(txRef)}`,
    customization: {
      title: 'Everyday Things — Fine Art Print',
      description: `${photo.title} · ${size.label} (${size.dimensions})`,
    },
    meta: {
      imageCode: photo.imageCode,
      sizeId: size.id,
      customerPhone: phoneNumber,
      deliveryAddress: locationDetails,
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

  return NextResponse.json({
    ok: true,
    mode: 'chapa',
    checkoutUrl: chapaData.data.checkout_url,
  });
}
