/**
 * POST /api/webhooks/chapa
 *
 * Receives Chapa payment event callbacks and verifies them by re-querying
 * the Chapa verify endpoint (Chapa does not sign payloads with HMAC).
 *
 * On verified payment → marks order as paid in Supabase.
 */

import { NextResponse } from 'next/server';
import { getServerEnv, isConfiguredSecret } from '@/lib/env';

const CHAPA_API = 'https://api.chapa.co/v1';

type ChapaCallbackBody = {
  tx_ref?: string;
  status?: string;
  [key: string]: unknown;
};

type ChapaVerifyResponse = {
  status: string;
  data?: {
    status: string;
    tx_ref: string;
    payment_method?: string;
    amount?: number;
  };
};

export async function POST(request: Request) {
  const env = getServerEnv();

  if (!isConfiguredSecret(env.chapaSecretKey, 'CHASECK')) {
    return NextResponse.json({ ok: false, error: 'Chapa not configured.' }, { status: 503 });
  }

  const body = (await request.json().catch(() => null)) as ChapaCallbackBody | null;

  if (!body?.tx_ref) {
    return NextResponse.json({ ok: false, error: 'Missing tx_ref.' }, { status: 400 });
  }

  const txRef = body.tx_ref;

  // ── Verify with Chapa ─────────────────────────────────────────────────────
  const verifyRes = await fetch(`${CHAPA_API}/transaction/verify/${encodeURIComponent(txRef)}`, {
    headers: { Authorization: `Bearer ${env.chapaSecretKey}` },
  });

  const verifyData = (await verifyRes.json()) as ChapaVerifyResponse;

  if (!verifyRes.ok || verifyData.status !== 'success' || verifyData.data?.status !== 'success') {
    // Not paid — log and acknowledge (don't return 4xx to Chapa)
    console.log('chapa_webhook_unverified', txRef, verifyData.data?.status);
    return NextResponse.json({ received: true });
  }

  const paymentMethod = verifyData.data?.payment_method ?? null;

  // ── Update order in Supabase ──────────────────────────────────────────────
  const supabaseUrl = env.supabaseUrl;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

  if (supabaseUrl && serviceKey) {
    await fetch(
      `${supabaseUrl}/rest/v1/orders?chapa_tx_ref=eq.${encodeURIComponent(txRef)}`,
      {
        method: 'PATCH',
        headers: {
          apikey: serviceKey,
          Authorization: `Bearer ${serviceKey}`,
          'Content-Type': 'application/json',
          Prefer: 'return=minimal',
        },
        body: JSON.stringify({
          status: 'paid',
          payment_method: paymentMethod,
          chapa_verified_at: new Date().toISOString(),
        }),
      },
    );
  }

  console.log('chapa_payment_verified', txRef, paymentMethod);
  return NextResponse.json({ received: true });
}
