'use client';

import Image from 'next/image';
import { useRef, useState } from 'react';
import { MUTED_GRAY_BLUR_DATA_URL } from '@/lib/image';
import type { Project } from '@/lib/types';

type AdminUploadPanelProps = {
  projects: Project[];
};

type UploadStatus = 'idle' | 'uploading' | 'success' | 'error';

type UploadedPhoto = {
  imageCode: string;
  imageUrl: string;
  title: string;
  location: string;
};

type DraftImage = {
  file: File;
  objectUrl: string;
  width: number;
  height: number;
  aspectRatio: number;
};

// ── Image code generator ──────────────────────────────────────────────────────
function createImageCode(): string {
  const date = new Date();
  const stamp = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`;
  const suffix = crypto.getRandomValues(new Uint8Array(3))
    .reduce((acc, b) => acc + b.toString(16).padStart(2, '0'), '')
    .toUpperCase()
    .slice(0, 5);
  return `AA-MONO-${stamp}-${suffix}`;
}

// ── Measure image dimensions in-browser ───────────────────────────────────────
function loadImageDimensions(file: File): Promise<DraftImage> {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const img = new window.Image();
    img.onload = () =>
      resolve({
        file,
        objectUrl,
        width: img.naturalWidth,
        height: img.naturalHeight,
        aspectRatio: Number((img.naturalWidth / img.naturalHeight).toFixed(4)),
      });
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Unable to read image dimensions.'));
    };
    img.src = objectUrl;
  });
}

export function AdminUploadPanel({ projects }: AdminUploadPanelProps) {
  const [draft, setDraft] = useState<DraftImage | null>(null);
  const [imageCode, setImageCode] = useState(createImageCode());
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [category, setCategory] = useState('archive');
  const [projectId, setProjectId] = useState('');
  const [isPrintAvailable, setIsPrintAvailable] = useState(true);
  const [status, setStatus] = useState<UploadStatus>('idle');
  const [notice, setNotice] = useState<string | null>(null);
  const [uploaded, setUploaded] = useState<UploadedPhoto[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function receiveFile(file?: File) {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setNotice('Select an image file (JPEG, PNG, WebP, HEIC).');
      return;
    }
    if (draft) URL.revokeObjectURL(draft.objectUrl);
    try {
      const d = await loadImageDimensions(file);
      setDraft(d);
      if (!title) setTitle(file.name.replace(/\.[^.]+$/, '').replaceAll(/[-_]/g, ' '));
      setNotice(`Measured: ${d.width} × ${d.height} px · ratio ${d.aspectRatio}`);
    } catch (e) {
      setNotice(e instanceof Error ? e.message : 'Unable to process image.');
    }
  }

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!draft) { setNotice('Select an image first.'); return; }
    if (title.trim().length < 2) { setNotice('Title is required.'); return; }
    if (location.trim().length < 2) { setNotice('Location is required.'); return; }

    setStatus('uploading');
    setNotice('Uploading…');

    const form = new FormData();
    form.append('file', draft.file);
    form.append('imageCode', imageCode);
    form.append('title', title.trim());
    form.append('description', description.trim());
    form.append('location', location.trim());
    form.append('category', category);
    form.append('projectId', projectId);
    form.append('isPrintAvailable', String(isPrintAvailable));
    form.append('aspectRatio', String(draft.aspectRatio));

    try {
      const res = await fetch('/api/admin/ingest', { method: 'POST', body: form });
      const payload = await res.json() as { ok: boolean; imageCode?: string; imageUrl?: string; error?: string };

      if (!res.ok || !payload.ok) throw new Error(payload.error ?? 'Upload failed.');

      setUploaded((prev) => [
        { imageCode: payload.imageCode!, imageUrl: payload.imageUrl!, title, location },
        ...prev,
      ]);

      // Reset form
      URL.revokeObjectURL(draft.objectUrl);
      setDraft(null);
      setImageCode(createImageCode());
      setTitle('');
      setDescription('');
      setLocation('');
      setCategory('archive');
      setProjectId('');
      setIsPrintAvailable(true);
      if (fileInputRef.current) fileInputRef.current.value = '';
      setStatus('success');
      setNotice(`✓ ${payload.imageCode} saved to Supabase.`);
    } catch (err) {
      setStatus('error');
      setNotice(err instanceof Error ? err.message : 'Upload failed.');
    }
  }

  const inputCls = 'border border-black bg-white p-3 outline-none w-full font-mono text-[11px]';
  const labelCls = 'grid gap-1 font-mono text-[11px] uppercase tracking-[0.08em]';

  return (
    <main className="mx-auto max-w-[1400px] px-3 py-4 md:px-5">
      <header className="mb-6 flex items-end justify-between border-b border-black pb-3 font-mono text-[10px] uppercase tracking-[0.12em]">
        <h1>UPLOAD PHOTOGRAPH</h1>
        <p className="text-gray-500">SAVES TO SUPABASE</p>
      </header>

      <div className="grid gap-10 lg:grid-cols-[440px_1fr]">

        {/* ── Form ── */}
        <form onSubmit={submit} className="grid content-start gap-4">

          {/* Drop zone */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => { e.preventDefault(); void receiveFile(e.dataTransfer.files[0]); }}
            className="grid min-h-52 place-items-center border border-dashed border-black bg-white p-6 text-center font-mono text-[11px] uppercase tracking-[0.08em] text-gray-500 hover:border-gray-500"
          >
            {draft ? (
              <span className="text-black">
                {draft.file.name}<br />
                {draft.width} × {draft.height} px · ratio {draft.aspectRatio}
              </span>
            ) : (
              <span>[ DROP IMAGE OR CLICK TO SELECT ]<br /><span className="normal-case tracking-normal text-gray-400 text-[10px]">JPEG · PNG · WebP · HEIC · max 20 MB</span></span>
            )}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
            className="hidden"
            onChange={(e) => void receiveFile(e.target.files?.[0])}
          />

          {/* Preview */}
          {draft && (
            <div className="relative w-full bg-gray-200" style={{ aspectRatio: `${draft.aspectRatio}` }}>
              <img
                src={draft.objectUrl}
                alt="Preview"
                className="absolute inset-0 h-full w-full select-none object-cover"
                onContextMenu={(e) => e.preventDefault()}
                draggable={false}
              />
            </div>
          )}

          {/* Image code — editable but pre-filled */}
          <label className={labelCls}>
            IMAGE CODE
            <input
              value={imageCode}
              onChange={(e) => setImageCode(e.target.value.toUpperCase())}
              className={inputCls}
              placeholder="AA-MONO-YYYYMMDD-XXXXX"
              required
            />
          </label>

          <label className={labelCls}>
            TITLE <span className="text-gray-400 normal-case tracking-normal">(required)</span>
            <input value={title} onChange={(e) => setTitle(e.target.value)} className={inputCls} required minLength={2} />
          </label>

          <label className={labelCls}>
            DESCRIPTION <span className="text-gray-400 normal-case tracking-normal">(optional)</span>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className={`${inputCls} min-h-[80px] resize-y`}
              maxLength={500}
            />
          </label>

          <label className={labelCls}>
            LOCATION <span className="text-gray-400 normal-case tracking-normal">(required)</span>
            <input value={location} onChange={(e) => setLocation(e.target.value)} className={inputCls} required minLength={2} />
          </label>

          <label className={labelCls}>
            CATEGORY
            <select value={category} onChange={(e) => setCategory(e.target.value)} className={inputCls}>
              <option value="archive">Archive</option>
              <option value="market">Market</option>
              <option value="street">Street</option>
              <option value="roadside">Roadside</option>
              <option value="portrait">Portrait</option>
              <option value="interior">Interior</option>
            </select>
          </label>

          <label className={labelCls}>
            PROJECT / SERIES
            <select value={projectId} onChange={(e) => setProjectId(e.target.value)} className={inputCls}>
              <option value="">— Unassigned —</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>{p.title}</option>
              ))}
            </select>
          </label>

          <label className="flex cursor-pointer items-center justify-between border border-black p-3 font-mono text-[11px] uppercase tracking-[0.08em]">
            PRINT AVAILABLE
            <input
              type="checkbox"
              checked={isPrintAvailable}
              onChange={(e) => setIsPrintAvailable(e.target.checked)}
              className="h-4 w-4 accent-black"
            />
          </label>

          <button
            type="submit"
            disabled={status === 'uploading' || !draft}
            className="w-full bg-black py-4 font-mono text-[11px] uppercase tracking-[0.12em] text-white disabled:bg-gray-400"
          >
            {status === 'uploading' ? '[ UPLOADING… ]' : '[ SAVE TO SUPABASE ]'}
          </button>

          {notice && (
            <p className={`font-mono text-[11px] ${status === 'error' ? 'text-gray-600' : 'text-black'}`}>
              {notice}
            </p>
          )}
        </form>

        {/* ── Uploaded this session ── */}
        <section className="grid content-start gap-4">
          <h2 className="font-mono text-[11px] uppercase tracking-[0.12em]">
            UPLOADED THIS SESSION
            {uploaded.length > 0 && <span className="ml-2 text-gray-400">({uploaded.length})</span>}
          </h2>

          {uploaded.length === 0 ? (
            <p className="font-mono text-[10px] text-gray-400">No uploads yet this session.</p>
          ) : (
            <div className="columns-2 gap-3 md:columns-3 xl:columns-4">
              {uploaded.map((photo) => (
                <figure key={photo.imageCode} className="mb-4 break-inside-avoid">
                  <div className="relative w-full bg-gray-200 aspect-square">
                    <Image
                      src={photo.imageUrl}
                      alt={photo.title}
                      fill
                      sizes="(max-width: 768px) 50vw, 25vw"
                      placeholder="blur"
                      blurDataURL={MUTED_GRAY_BLUR_DATA_URL}
                      className="select-none object-cover"
                      onContextMenu={(e) => e.preventDefault()}
                      draggable={false}
                    />
                  </div>
                  <figcaption className="mt-1 font-mono text-[10px] uppercase tracking-[0.08em] text-gray-500">
                    {photo.imageCode}<br />{photo.location}
                  </figcaption>
                </figure>
              ))}
            </div>
          )}

          {/* Setup reminder */}
          <div className="mt-6 border border-gray-200 p-4 font-mono text-[10px] uppercase tracking-[0.08em] text-gray-500">
            <p className="mb-2 text-black">SUPABASE STORAGE SETUP</p>
            <p>Dashboard → Storage → New bucket → name: <strong>photographs</strong> → Public: ON</p>
          </div>
        </section>
      </div>
    </main>
  );
}
