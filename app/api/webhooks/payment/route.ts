import { NextResponse } from 'next/server';
import { getServerEnv, isConfiguredSecret } from '@/lib/env';
import { persistOrder } from '@/lib/orders';

type PaymentWebhookPayload = {
  tx_ref?: unknown;
  imageCode?: unknown;
  sizeId?: unknown;
  customerEmail?: unknown;
  metadata?: unknown;
};

type ChapaVerification = {
  status?: string;
  data?: {
    status?: string;
    tx_ref?: string;
    email?: string;
    meta?: Record<string, unknown>;
  };
};

async function verifyChapaTransaction(txRef: string) {
  const env = getServerEnv();

  if (!isConfiguredSecret(env.chapaSecretKey)) {
    return { ok: true, mode: 'mock' as const, metadata: { verification: 'mock-chapa-telebirr', tx_ref: txRef } };
  }

  const response = await fetch(`${env.chapaVerifyBaseUrl}/${encodeURIComponent(txRef)}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${env.chapaSecretKey}`,
      'Content-Type': 'application/json'
    },
    cache: 'no-store'
  });

  if (!response.ok) return { ok: false, mode: 'chapa' as const, metadata: { status: response.status } };

  const payload = (await response.json()) as ChapaVerification;
  const isPaid = payload.status === 'success' && payload.data?.status === 'success';

  return { ok: isPaid, mode: 'chapa' as const, metadata: payload as Record<string, unknown> };
}

export async function POST(request: Request) {
  const payload = (await request.json().catch(() => null)) as PaymentWebhookPayload | null;

  const txRef = typeof payload?.tx_ref === 'string' ? payload.tx_ref.trim() : '';
  const imageCode = typeof payload?.imageCode === 'string' ? payload.imageCode.trim() : '';
  const sizeId = typeof payload?.sizeId === 'string' ? payload.sizeId.trim() : '';
  const customerEmail = typeof payload?.customerEmail === 'string' ? payload.customerEmail.trim().toLowerCase() : null;
  const metadata = payload?.metadata && typeof payload.metadata === 'object' ? (payload.metadata as Record<string, unknown>) : {};

  if (!txRef || !imageCode || !sizeId) {
    return NextResponse.json({ ok: false, error: 'Missing tx_ref, imageCode, or sizeId.' }, { status: 400 });
  }

  const verification = await verifyChapaTransaction(txRef);

  if (!verification.ok) {
    return NextResponse.json({ ok: false, error: 'Payment verification failed.' }, { status: 402 });
  }

  const result = await persistOrder({
    txRef,
    provider: verification.mode === 'chapa' ? 'chapa_telebirr' : 'mock_chapa_telebirr',
    imageCode,
    sizeId,
    customerEmail,
    metadata: { ...metadata, verification: verification.metadata }
  });

  return NextResponse.json({ ok: true, persisted: result.mode });
}
