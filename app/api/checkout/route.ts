import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { getPhotographByCode, printSizes } from '@/lib/data';
import { getServerEnv, isConfiguredSecret } from '@/lib/env';

const currency = process.env.NEXT_PUBLIC_CURRENCY ?? 'usd';

export async function POST(request: Request) {
  const env = getServerEnv();
  const body = (await request.json().catch(() => null)) as { imageCode?: string; sizeId?: string } | null;

  if (!body?.imageCode || !body?.sizeId) {
    return NextResponse.json({ error: 'Missing imageCode or sizeId.' }, { status: 400 });
  }

  const photo = getPhotographByCode(body.imageCode);
  const size = printSizes.find((printSize) => printSize.id === body.sizeId);

  if (!photo || !photo.isPrintAvailable || !size) {
    return NextResponse.json({ error: 'Print is unavailable.' }, { status: 404 });
  }

  const stripeSecretKey = env.stripeSecretKey;

  if (!isConfiguredSecret(stripeSecretKey, 'sk_')) {
    return NextResponse.json({
      ok: true,
      mode: 'sandbox',
      message: env.isProduction
        ? 'Sandbox/Test Mode: Stripe is not configured for this deployment.'
        : 'Sandbox/Test Mode: add STRIPE_SECRET_KEY to enable live Stripe Checkout locally.',
      url: `${env.siteUrl}/archive?checkout=sandbox&imageCode=${encodeURIComponent(photo.imageCode)}&size=${encodeURIComponent(size.id)}`
    });
  }

  const stripe = new Stripe(stripeSecretKey, { apiVersion: '2025-02-24.acacia' });

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    success_url: `${env.siteUrl}/archive?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${env.siteUrl}/archive?checkout=cancelled&imageCode=${encodeURIComponent(photo.imageCode)}`,
    metadata: {
      photographId: photo.id,
      imageCode: photo.imageCode,
      sizeId: size.id
    },
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency,
          unit_amount: size.priceCents,
          product_data: {
            name: `Fine Art Print — ${photo.imageCode}`,
            description: `${size.dimensions}. ${photo.title}. ${photo.location}.`,
            metadata: {
              photographId: photo.id,
              imageCode: photo.imageCode,
              sizeId: size.id
            },
            images: [`${env.siteUrl}${photo.imageUrl}`]
          }
        }
      }
    ]
  });

  return NextResponse.json({ ok: true, mode: 'stripe', url: session.url });
}
