/**
 * POST /api/admin/ingest
 *
 * Authenticated admin route (requires valid admin_upload_session cookie).
 * Accepts multipart/form-data with:
 *   - file        : image file (jpeg/png/webp/heic)
 *   - imageCode   : string  e.g. "AA-MONO-20260613-XYZ12"
 *   - title       : string
 *   - description : string (optional)
 *   - location    : string
 *   - category    : string
 *   - projectId   : string (uuid, optional)
 *   - isPrintAvailable : "true" | "false"
 *   - aspectRatio : string  (numeric, calculated client-side)
 *
 * Flow:
 *   1. Verify admin cookie
 *   2. Upload image to Supabase Storage bucket "photographs"
 *   3. Insert row into public.photographs
 *   4. Return the new photograph record
 */

import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { ADMIN_UPLOAD_COOKIE, isAdminUploadConfigured, verifyAdminUploadToken } from '@/lib/adminAuth';
import { getServerEnv } from '@/lib/env';

const ALLOWED_MIME = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif']);
const MAX_BYTES = 20 * 1024 * 1024; // 20 MB

export async function POST(request: Request) {
  // ── Auth check ────────────────────────────────────────────────────────────
  if (!isAdminUploadConfigured()) {
    return NextResponse.json({ ok: false, error: 'Admin upload not configured.' }, { status: 503 });
  }

  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_UPLOAD_COOKIE)?.value;

  if (!verifyAdminUploadToken(token)) {
    return NextResponse.json({ ok: false, error: 'Unauthorized.' }, { status: 401 });
  }

  const env = getServerEnv();
  const supabaseUrl = env.supabaseUrl;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

  if (!supabaseUrl || !serviceKey || serviceKey.includes('replace')) {
    return NextResponse.json({ ok: false, error: 'Supabase is not configured.' }, { status: 503 });
  }

  // ── Parse multipart form ──────────────────────────────────────────────────
  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid form data.' }, { status: 400 });
  }

  const file = formData.get('file');
  const imageCode = String(formData.get('imageCode') ?? '').trim();
  const title = String(formData.get('title') ?? '').trim();
  const description = String(formData.get('description') ?? '').trim() || null;
  const location = String(formData.get('location') ?? '').trim();
  const category = String(formData.get('category') ?? 'archive').trim();
  const projectId = String(formData.get('projectId') ?? '').trim() || null;
  const isPrintAvailable = formData.get('isPrintAvailable') === 'true';
  const aspectRatio = parseFloat(String(formData.get('aspectRatio') ?? '1'));

  if (!(file instanceof File)) {
    return NextResponse.json({ ok: false, error: 'No file provided.' }, { status: 400 });
  }

  if (!ALLOWED_MIME.has(file.type)) {
    return NextResponse.json({ ok: false, error: 'File type not allowed.' }, { status: 400 });
  }

  if (file.size > MAX_BYTES) {
    return NextResponse.json({ ok: false, error: 'File exceeds 20 MB limit.' }, { status: 400 });
  }

  if (!imageCode || !title || !location || isNaN(aspectRatio) || aspectRatio <= 0) {
    return NextResponse.json({ ok: false, error: 'Missing required fields.' }, { status: 400 });
  }

  // ── Upload to Supabase Storage ────────────────────────────────────────────
  const ext = file.type === 'image/png' ? 'png' : file.type === 'image/webp' ? 'webp' : 'jpg';
  const storagePath = `${imageCode.toLowerCase()}.${ext}`;
  const fileBuffer = await file.arrayBuffer();

  const storageRes = await fetch(
    `${supabaseUrl}/storage/v1/object/photographs/${storagePath}`,
    {
      method: 'POST',
      headers: {
        apikey: serviceKey,
        Authorization: `Bearer ${serviceKey}`,
        'Content-Type': file.type,
        'x-upsert': 'true', // allow re-upload of same code
      },
      body: fileBuffer,
    },
  );

  if (!storageRes.ok) {
    const storageErr = await storageRes.text();
    console.error('storage_upload_error', storageErr);
    return NextResponse.json(
      { ok: false, error: 'Image upload failed. Check Supabase Storage bucket.' },
      { status: 502 },
    );
  }

  // Public URL — bucket must be set to public in Supabase dashboard
  const imageUrl = `${supabaseUrl}/storage/v1/object/public/photographs/${storagePath}`;

  // ── Insert photograph row ─────────────────────────────────────────────────
  const insertRes = await fetch(`${supabaseUrl}/rest/v1/photographs`, {
    method: 'POST',
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
    },
    body: JSON.stringify({
      image_code: imageCode,
      image_url: imageUrl,
      aspect_ratio: aspectRatio,
      title,
      description,
      location,
      category,
      project_id: projectId,
      is_print_available: isPrintAvailable,
      price_tier_id: isPrintAvailable ? 'standard' : null,
    }),
  });

  if (!insertRes.ok) {
    const insertErr = await insertRes.text();
    console.error('db_insert_error', insertErr);
    // If duplicate image_code, give a clear message
    if (insertErr.includes('unique') || insertErr.includes('duplicate')) {
      return NextResponse.json(
        { ok: false, error: `Image code "${imageCode}" already exists.` },
        { status: 409 },
      );
    }
    return NextResponse.json({ ok: false, error: 'Database insert failed.' }, { status: 502 });
  }

  const [inserted] = (await insertRes.json()) as { id: string; image_code: string }[];

  return NextResponse.json({
    ok: true,
    imageCode: inserted.image_code,
    id: inserted.id,
    imageUrl,
  });
}
