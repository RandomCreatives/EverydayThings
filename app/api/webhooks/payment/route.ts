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
    first_name?: string;
    last_name?: string;
    meta?: Record<string, unknown>;
  };
};

async function verifyChapaTransaction(txRef: string) {
  const env = getServerEnv();

  if (!isConfiguredSecret(env.chapaSecretKey)) {
    return {
      ok: true,
      mode: 'mock' as const,
      metadata: { verification: 'mock-chapa-telebirr', tx_ref: txRef } as Record<string, unknown>
    };
  }

  const response = await fetch(`${env.chapaVerifyBaseUrl}/${encodeURIComponent(txRef)}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${env.chapaSecretKey}`,
      'Content-Type': 'application/json'
    },
    cache: 'no-store'
  });

  if (!response.ok) return { ok: false, mode: 'chapa' as const, metadata: { status: response.status } as Record<string, unknown> };

  const payload = (await response.json()) as ChapaVerification;
  const isPaid = payload.status === 'success' && payload.data?.status === 'success';

  return { ok: isPaid, mode: 'chapa' as const, metadata: payload as unknown as Record<string, unknown> };
}

export async function POST(request: Request) {
  const payload = (await request.json().catch(() => null)) as PaymentWebhookPayload | null;

  const txRef = typeof payload?.tx_ref === 'string' ? payload.tx_ref.trim() : '';
  if (!txRef) {
    return NextResponse.json({ ok: false, error: 'Missing tx_ref.' }, { status: 400 });
  }

  const verification = await verifyChapaTransaction(txRef);

  if (!verification.ok) {
    return NextResponse.json({ ok: false, error: 'Payment verification failed.' }, { status: 402 });
  }

  // ── Extract missing fields from Chapa meta if not in payload ──────────────
  const vPayload = verification.metadata as unknown as ChapaVerification;
  const vData = vPayload.data;
  const vMeta = vData?.meta || {};

  const imageCode = (typeof payload?.imageCode === 'string' ? payload.imageCode.trim() : '')
    || (typeof vMeta.imageCode === 'string' ? vMeta.imageCode : '');

  const sizeId = (typeof payload?.sizeId === 'string' ? payload.sizeId.trim() : '')
    || (typeof vMeta.sizeId === 'string' ? vMeta.sizeId : '');

  if (!imageCode || !sizeId) {
    return NextResponse.json({ ok: false, error: 'Missing imageCode or sizeId.' }, { status: 400 });
  }

  const customerEmail = (typeof payload?.customerEmail === 'string' ? payload.customerEmail.trim().toLowerCase() : null)
    || vData?.email
    || null;

  const customerName = vData?.first_name ? `${vData.first_name} ${vData.last_name || ''}`.trim() : undefined;
  const customerPhone = typeof vMeta.customerPhone === 'string' ? vMeta.customerPhone : undefined;
  const deliveryAddress = typeof vMeta.deliveryAddress === 'string' ? vMeta.deliveryAddress : undefined;

  const metadata = payload?.metadata && typeof payload.metadata === 'object' ? (payload.metadata as Record<string, unknown>) : {};

  const result = await persistOrder({
    txRef,
    provider: verification.mode === 'chapa' ? 'chapa_telebirr' : 'mock_chapa_telebirr',
    imageCode,
    sizeId,
    customerEmail,
    customerName,
    customerPhone,
    deliveryAddress,
    metadata: { ...metadata, verification: verification.metadata }
  });

  return NextResponse.json({ ok: true, persisted: result.mode });
}
