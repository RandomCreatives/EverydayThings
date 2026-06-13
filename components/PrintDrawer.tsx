'use client';

import Image from 'next/image';
import { useState } from 'react';
import { printSizes } from '@/lib/data';
import { DRAWER_IMAGE_SIZES, MUTED_GRAY_BLUR_DATA_URL } from '@/lib/image';
import { usePrintDrawer } from './PrintDrawerProvider';

export function PrintDrawer() {
  const { selectedPhoto, closePrintDrawer } = usePrintDrawer();
  const [sizeId, setSizeId] = useState(printSizes[1]?.id ?? 'medium');
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedSize = printSizes.find((s) => s.id === sizeId) ?? printSizes[0];

  async function proceedToCheckout() {
    if (!selectedPhoto || !selectedSize) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageCode: selectedPhoto.imageCode,
          sizeId: selectedSize.id,
          email: email.trim() || undefined,
          name: name.trim() || undefined,
        }),
      });

      const payload = (await response.json()) as { ok?: boolean; url?: string; error?: string };

      if (!response.ok || !payload.ok || !payload.url) {
        throw new Error(payload.error ?? 'Unable to create checkout session.');
      }

      window.location.assign(payload.url);
    } catch (checkoutError) {
      setError(checkoutError instanceof Error ? checkoutError.message : 'Checkout failed.');
      setIsLoading(false);
    }
  }

  return (
    <aside
      aria-hidden={!selectedPhoto}
      className={`fixed bottom-0 right-0 z-50 h-[86dvh] w-full border-t border-black bg-white transition-transform duration-150 ease-linear md:top-0 md:h-dvh md:max-w-[390px] md:border-l md:border-t-0 ${
        selectedPhoto ? 'translate-y-0 md:translate-x-0' : 'translate-y-full md:translate-x-full md:translate-y-0'
      }`}
    >
      <div className="flex h-full flex-col p-4 font-mono text-[11px] uppercase tracking-[0.08em]">
        <div className="mb-6 flex items-center justify-between border-b border-black pb-3">
          <p>PRINT ORDER</p>
          <button className="text-black" type="button" onClick={closePrintDrawer}>
            [ CLOSE ]
          </button>
        </div>

        {selectedPhoto ? (
          <>
            <div className="relative mb-3 w-full bg-gray-200" style={{ aspectRatio: `${selectedPhoto.aspectRatio}` }}>
              <Image
                src={selectedPhoto.imageUrl}
                alt={selectedPhoto.title}
                fill
                sizes={DRAWER_IMAGE_SIZES}
                placeholder="blur"
                blurDataURL={MUTED_GRAY_BLUR_DATA_URL}
                onContextMenu={(e) => e.preventDefault()}
                className="select-none object-cover"
                draggable={false}
              />
            </div>

            <dl className="mb-5 grid grid-cols-[92px_1fr] gap-y-2 text-gray-700">
              <dt>CODE</dt>
              <dd className="text-black">{selectedPhoto.imageCode}</dd>
              <dt>TITLE</dt>
              <dd>{selectedPhoto.title}</dd>
              <dt>LOCATION</dt>
              <dd>{selectedPhoto.location}</dd>
            </dl>

            {/* Size selector */}
            <label className="mb-2 block text-gray-600" htmlFor="print-size">SIZE</label>
            <select
              id="print-size"
              value={sizeId}
              onChange={(e) => setSizeId(e.target.value)}
              className="mb-4 w-full appearance-none border border-black bg-white p-3 font-mono text-[11px] uppercase tracking-[0.08em] outline-none"
            >
              {printSizes.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label} — {s.dimensions} — {(s.priceCents / 100).toLocaleString()} ETB
                </option>
              ))}
            </select>

            {/* Optional contact fields for Chapa */}
            <label className="mb-2 block text-gray-600" htmlFor="order-name">NAME (OPTIONAL)</label>
            <input
              id="order-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              className="mb-3 w-full border border-black bg-white p-3 font-mono text-[11px] outline-none"
            />

            <label className="mb-2 block text-gray-600" htmlFor="order-email">EMAIL (OPTIONAL)</label>
            <input
              id="order-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              className="mb-4 w-full border border-black bg-white p-3 font-mono text-[11px] outline-none"
            />

            <button
              type="button"
              onClick={proceedToCheckout}
              disabled={isLoading}
              className="mt-auto w-full bg-black px-4 py-4 text-center text-white disabled:bg-gray-500"
            >
              {isLoading ? '[ CREATING SESSION ]' : '[ PAY WITH TELEBIRR / CHAPA ]'}
            </button>

            <p className="mt-2 text-center text-[10px] normal-case tracking-normal text-gray-400">
              Telebirr · CBEBirr · Amole · M-Pesa · Bank transfer
            </p>

            {error ? <p className="mt-3 text-gray-700">{error}</p> : null}
          </>
        ) : null}
      </div>
    </aside>
  );
}
