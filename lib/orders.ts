import PDFDocument from 'pdfkit';
import { getPrintSize } from './printSizes';
import { getServerEnv, isConfiguredSecret } from './env';
import { getSupabaseServiceClient, type OrderInsert } from './supabase';

type PersistOrderInput = {
  txRef: string;
  provider: string;
  imageCode: string;
  sizeId: string;
  customerName?: string | null;
  customerEmail?: string | null;
  customerPhone?: string | null;
  deliveryAddress?: string | null;
  amountEtb?: number;
  metadata?: Record<string, unknown>;
};

type ReceiptInput = Required<Pick<PersistOrderInput, 'txRef' | 'provider' | 'imageCode' | 'sizeId'>> & {
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  deliveryAddress: string;
  amountEtb: number;
  printDimensions: string;
};

async function createReceiptPdf(input: ReceiptInput) {
  const document = new PDFDocument({ size: 'A4', margin: 56, info: { Title: `Receipt ${input.txRef}` } });
  const chunks: Buffer[] = [];

  document.on('data', (chunk: Buffer) => chunks.push(chunk));

  const done = new Promise<Buffer>((resolve, reject) => {
    document.on('end', () => resolve(Buffer.concat(chunks)));
    document.on('error', reject);
  });

  document.font('Helvetica');
  document.fontSize(10).text('EVERYDAYTHINGS STORE', { characterSpacing: 1.8 });
  document.moveDown(0.5);
  document.fontSize(20).text('FINE ART PRINT RECEIPT');
  document.moveDown(1.5);
  document.fontSize(9).fillColor('#555555').text('ARCHIVAL MONOCHROME PRINT ORDER / CHAPA ETB PAYMENT');
  document.fillColor('#000000');
  document.moveDown(2);

  const rows: Array<[string, string]> = [
    ['TRANSACTION', input.txRef],
    ['PROVIDER', input.provider.toUpperCase()],
    ['BUYER', input.customerName],
    ['EMAIL', input.customerEmail],
    ['PHONE', input.customerPhone],
    ['DELIVERY', input.deliveryAddress],
    ['IMAGE CODE', input.imageCode],
    ['SIZE', `${input.sizeId.toUpperCase()} / ${input.printDimensions}`],
    ['AMOUNT PAID', `ETB ${input.amountEtb.toLocaleString('en-US')}`],
    ['FULFILLMENT', 'PENDING']
  ];

  rows.forEach(([label, value]) => {
    document.fontSize(9).fillColor('#555555').text(label, { continued: true, width: 120 });
    document.fillColor('#000000').text(value);
    document.moveDown(0.65);
  });

  document.moveDown(2);
  document.fontSize(10).fillColor('#000000').text(
    'Delivery Commitment: Fine art printing, professional archival mounting, and local courier delivery takes up to 10 working days.',
    { lineGap: 4 }
  );
  document.moveDown(2);
  document.fontSize(8).fillColor('#555555').text('Keep this receipt for print pickup, delivery coordination, and fulfillment support.');
  document.end();

  return done;
}

async function uploadReceipt(input: ReceiptInput) {
  const env = getServerEnv();
  const supabase = getSupabaseServiceClient();
  if (!supabase) return null;

  const buffer = await createReceiptPdf(input);
  const path = `${input.txRef}.pdf`;
  const { error } = await supabase.storage.from(env.supabaseReceiptsBucket).upload(path, buffer, {
    contentType: 'application/pdf',
    upsert: true
  });

  if (error) throw new Error(`Receipt upload failed: ${error.message}`);

  const { data, error: signedUrlError } = await supabase.storage.from(env.supabaseReceiptsBucket).createSignedUrl(path, 60 * 60 * 24 * 14);
  if (signedUrlError) throw new Error(`Receipt signed URL failed: ${signedUrlError.message}`);

  return data?.signedUrl ?? null;
}

export async function sendOrderConfirmationEmail(input: ReceiptInput & { receiptUrl?: string | null }) {
  const env = getServerEnv();
  const recipient = env.contactToEmail;

  if (!recipient || !isConfiguredSecret(env.resendApiKey, 're_')) {
    console.log('ORDER_CONFIRMATION_EMAIL_STUB', input);
    return { ok: true, mode: 'stub' as const };
  }

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.resendApiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      from: 'EverydayThings Orders <onboarding@resend.dev>',
      to: [recipient],
      reply_to: input.customerEmail,
      subject: `Pending print shipment — ${input.imageCode}`,
      text: [
        'A new Chapa / TeleBirr print order is ready for fulfillment.',
        '',
        `Transaction: ${input.txRef}`,
        `Buyer: ${input.customerName}`,
        `Email: ${input.customerEmail}`,
        `Phone: ${input.customerPhone}`,
        `Delivery: ${input.deliveryAddress}`,
        `Image code: ${input.imageCode}`,
        `Size: ${input.sizeId} / ${input.printDimensions}`,
        `Amount: ETB ${input.amountEtb}`,
        `Receipt: ${input.receiptUrl ?? 'not available'}`,
        '',
        'Delivery commitment: up to 10 working days.'
      ].join('\n')
    })
  });

  if (!response.ok) throw new Error('Unable to send order confirmation email.');
  return { ok: true, mode: 'resend' as const };
}

export async function persistOrder(input: PersistOrderInput) {
  const env = getServerEnv();
  const supabase = getSupabaseServiceClient();
  const size = getPrintSize(input.sizeId);
  const amountEtb = input.amountEtb ?? (size ? Math.round(size.priceCents / 100) : 0);

  const receiptInput: ReceiptInput = {
    txRef: input.txRef,
    provider: input.provider,
    imageCode: input.imageCode,
    sizeId: input.sizeId,
    customerName: input.customerName ?? 'UNKNOWN CUSTOMER',
    customerEmail: input.customerEmail ?? 'unknown@example.com',
    customerPhone: input.customerPhone ?? 'UNKNOWN PHONE',
    deliveryAddress: input.deliveryAddress ?? 'NO DELIVERY ADDRESS PROVIDED',
    amountEtb,
    printDimensions: size?.dimensions ?? 'UNKNOWN DIMENSIONS'
  };

  if (!supabase) {
    console.log('ORDER_PERSISTENCE_STUB', receiptInput);
    await sendOrderConfirmationEmail(receiptInput);
    return { ok: true, mode: 'stub' as const, order: receiptInput };
  }

  const receiptUrl = await uploadReceipt(receiptInput);

  const order: OrderInsert = {
    tx_ref: input.txRef,
    provider: input.provider,
    image_code: input.imageCode,
    size_id: input.sizeId,
    print_dimensions: receiptInput.printDimensions,
    customer_name: receiptInput.customerName,
    customer_email: receiptInput.customerEmail,
    customer_phone: receiptInput.customerPhone,
    delivery_address: receiptInput.deliveryAddress,
    amount_etb: amountEtb,
    currency: 'ETB',
    payment_status: 'paid',
    fulfillment_status: 'pending',
    receipt_url: receiptUrl,
    metadata: input.metadata ?? {}
  };

  const { data, error } = await supabase.from('orders').insert(order).select('*').single();
  if (error) throw new Error(`Unable to persist order: ${error.message}`);

  await sendOrderConfirmationEmail({ ...receiptInput, receiptUrl });
  return { ok: true, mode: 'supabase' as const, order: data };
}
