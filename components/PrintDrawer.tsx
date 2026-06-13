'use client';

import Image from 'next/image';
import { useMemo, useState } from 'react';
import { DRAWER_IMAGE_SIZES, MUTED_GRAY_BLUR_DATA_URL } from '@/lib/image';
import { printSizes } from '@/lib/printSizes';
import { usePrintDrawer } from './PrintDrawerProvider';

const ETH_PHONE_RE = /^(?:\+?251|0)[97]\d{8}$/;

export function PrintDrawer() {
  const { selectedPhoto, closePrintDrawer } = usePrintDrawer();
  const [sizeId, setSizeId] = useState(printSizes[1]?.id ?? 'medium');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [locationDetails, setLocationDetails] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedSize = printSizes.find((s) => s.id === sizeId) ?? printSizes[0];

  const canSubmit = useMemo(() => {
    return (
      fullName.trim().length >= 2 &&
      email.trim().includes('@') &&
      ETH_PHONE_RE.test(phoneNumber.trim()) &&
      locationDetails.trim().length >= 10
    );
  }, [fullName, email, phoneNumber, locationDetails]);

  async function proceedToCheckout() {
    if (!selectedPhoto || !selectedSize || !canSubmit) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageCode: selectedPhoto.imageCode,
          sizeId: selectedSize.id,
          fullName: fullName.trim(),
          email: email.trim(),
          phoneNumber: phoneNumber.trim(),
          locationDetails: locationDetails.trim(),
        }),
      });

      const payload = (await response.json()) as {
        ok?: boolean;
        checkoutUrl?: string;
        url?: string;
        error?: string;
      };

      const redirectUrl = payload.checkoutUrl ?? payload.url;

      if (!response.ok || !payload.ok || !redirectUrl) {
        throw new Error(payload.error ?? 'Unable to create checkout session.');
      }

      window.location.assign(redirectUrl);
    } catch (checkoutError) {
      setError(checkoutError instanceof Error ? checkoutError.message : 'Checkout failed.');
      setIsLoading(false);
    }
  }

  const inputCls = 'w-full border border-black bg-white p-3 font-mono text-[11px] outline-none placeholder:normal-case placeholder:tracking-normal placeholder:text-gray-400';
  const labelCls = 'mb-1 block text-gray-600';

  return (
    <aside
      role="dialog"
      aria-modal="true"
      aria-label="Print order"
      aria-hidden={!selectedPhoto}
      className={`fixed bottom-0 right-0 z-50 h-[86dvh] w-full border-t border-black bg-white transition-transform duration-150 ease-linear md:top-0 md:h-dvh md:max-w-[430px] md:border-l md:border-t-0 ${
        selectedPhoto ? 'translate-y-0 md:translate-x-0' : 'translate-y-full md:translate-x-full md:translate-y-0'
      }`}
    >
      <div className="flex h-full flex-col overflow-y-auto p-4 font-mono text-[11px] uppercase tracking-[0.08em]">
        <div className="mb-5 flex items-center justify-between border-b border-black pb-3">
          <p>PRINT ORDER</p>
          <button className="text-black hover:text-gray-500" type="button" onClick={closePrintDrawer}>
            [ CLOSE ]
          </button>
        </div>

        {selectedPhoto ? (
          <>
            {/* Thumbnail */}
            <div
              className="relative mb-3 w-full bg-gray-200"
              style={{ aspectRatio: `${selectedPhoto.aspectRatio}` }}
            >
              <Image onContextMenu={(event) => event.preventDefault()}
                src={selectedPhoto.imageUrl}
                alt={selectedPhoto.title}
                fill
                sizes={DRAWER_IMAGE_SIZES}
                placeholder="blur"
                blurDataURL={MUTED_GRAY_BLUR_DATA_URL}
                className="select-none object-cover"
                draggable={false}
              />
            </div>

            {/* Image details */}
            <dl className="mb-5 grid grid-cols-[92px_1fr] gap-y-2 text-gray-700">
              <dt>CODE</dt>
              <dd className="text-black">{selectedPhoto.imageCode}</dd>
              <dt>TITLE</dt>
              <dd>{selectedPhoto.title}</dd>
              <dt>LOCATION</dt>
              <dd>{selectedPhoto.location}</dd>
            </dl>

            {/* Size */}
            <label className={labelCls} htmlFor="print-size">SIZE</label>
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

            {/* Delivery fields */}
            <label className={labelCls} htmlFor="order-name">FULL NAME</label>
            <input
              id="order-name"
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Your full name"
              className={`mb-3 ${inputCls}`}
              required
              minLength={2}
            />

            <label className={labelCls} htmlFor="order-email">EMAIL ADDRESS</label>
            <input
              id="order-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              className={`mb-3 ${inputCls}`}
              required
            />

            <label className={labelCls} htmlFor="order-phone">PHONE NUMBER</label>
            <input
              id="order-phone"
              type="tel"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="09xx xxx xxxx or +251 9xx xxx xxx"
              className={`mb-3 ${inputCls}`}
              required
            />

            <label className={labelCls} htmlFor="order-location">DELIVERY LOCATION</label>
            <textarea
              id="order-location"
              value={locationDetails}
              onChange={(e) => setLocationDetails(e.target.value)}
              placeholder="Sub-city, woreda, street or landmark..."
              className={`mb-4 min-h-[72px] resize-none ${inputCls}`}
              required
              minLength={10}
            />

            {/* Delivery note */}
            <p className="mb-4 text-[10px] normal-case tracking-normal text-gray-500">
              Delivery takes up to 10 working days. A PDF receipt will be emailed to you.
            </p>

            <button
              type="button"
              onClick={proceedToCheckout}
              disabled={isLoading || !canSubmit}
              className="mt-auto w-full bg-black px-4 py-4 text-center text-white disabled:bg-gray-400"
            >
              {isLoading ? '[ CREATING CHAPA CHECKOUT ]' : '[ PROCEED TO CHAPA CHECKOUT ]'}
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
