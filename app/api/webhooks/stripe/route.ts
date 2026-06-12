import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { getServerEnv, isConfiguredSecret } from '@/lib/env';

export async function POST(request: Request) {
  const env = getServerEnv();

  const stripeSecretKey = env.stripeSecretKey;
  const stripeWebhookSecret = env.stripeWebhookSecret;

  if (!isConfiguredSecret(stripeSecretKey, 'sk_') || !isConfiguredSecret(stripeWebhookSecret, 'whsec_')) {
    return NextResponse.json({ ok: false, error: 'Stripe webhook is not configured.' }, { status: 503 });
  }

  const stripe = new Stripe(stripeSecretKey, { apiVersion: '2025-02-24.acacia' });
  const signature = (await headers()).get('stripe-signature');
  const body = await request.text();

  if (!signature) {
    return NextResponse.json({ ok: false, error: 'Missing Stripe signature.' }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, stripeWebhookSecret);
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : 'Invalid Stripe signature.' },
      { status: 400 }
    );
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    // Production hook point: persist order by session.metadata.imageCode / sizeId.
    console.log('checkout.session.completed', session.id, session.metadata);
  }

  return NextResponse.json({ received: true });
}
