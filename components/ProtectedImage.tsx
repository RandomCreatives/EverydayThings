'use client';

import Image from 'next/image';
import { useEffect, useState } from 'react';
import { ARCHIVE_IMAGE_SIZES, MUTED_GRAY_BLUR_DATA_URL } from '@/lib/image';
import type { Photograph } from '@/lib/types';
import { usePrintDrawer } from './PrintDrawerProvider';

type ProtectedImageProps = {
  photo: Photograph;
  priority?: boolean;
  sizes?: string;
};

export function ProtectedImage({ photo, priority = false, sizes = ARCHIVE_IMAGE_SIZES }: ProtectedImageProps) {
  const { openPrintDrawer } = usePrintDrawer();
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    const saved = JSON.parse(window.localStorage.getItem('savedImageCodes') ?? '[]') as string[];
    setIsSaved(saved.includes(photo.imageCode));
  }, [photo.imageCode]);

  function toggleSaved() {
    const saved = JSON.parse(window.localStorage.getItem('savedImageCodes') ?? '[]') as string[];
    const nextSaved = saved.includes(photo.imageCode)
      ? saved.filter((code) => code !== photo.imageCode)
      : [...saved, photo.imageCode];

    window.localStorage.setItem('savedImageCodes', JSON.stringify(nextSaved));
    setIsSaved(nextSaved.includes(photo.imageCode));
  }

  return (
    <figure className="group relative mb-4 break-inside-avoid">
      <div className="relative bg-gray-200" style={{ aspectRatio: `${photo.aspectRatio}` }}>
        <Image onContextMenu={(event) => event.preventDefault()}
          src={photo.imageUrl}
          alt={photo.title}
          fill
          priority={priority}
          sizes={sizes}
          placeholder="blur"
          blurDataURL={MUTED_GRAY_BLUR_DATA_URL}
          draggable={false}
          className="select-none object-cover"
        />
        <div className="pointer-events-none absolute inset-0 bg-black/0 transition-colors duration-75 group-hover:bg-black/25 group-focus-within:bg-black/25" />
        <button
          type="button"
          className="absolute left-2 top-2 font-mono text-[10px] uppercase tracking-[0.12em] text-white opacity-0 transition-opacity duration-75 group-hover:opacity-100 group-focus:opacity-100"
          onClick={toggleSaved}
        >
          {isSaved ? '[ SAVED ]' : '[ SAVE ]'}
        </button>
        {photo.isPrintAvailable ? (
          <button
            type="button"
            className="absolute bottom-2 left-2 font-mono text-[10px] uppercase tracking-[0.12em] text-white opacity-0 transition-opacity duration-75 group-hover:opacity-100 group-focus:opacity-100"
            onClick={() => openPrintDrawer(photo)}
          >
            [ ORDER PRINT - {photo.imageCode} ]
          </button>
        ) : (
          <span className="absolute bottom-2 left-2 font-mono text-[10px] uppercase tracking-[0.12em] text-white opacity-0 transition-opacity duration-75 group-hover:opacity-100">
            [ PRINT UNAVAILABLE - {photo.imageCode} ]
          </span>
        )}
      </div>
      <figcaption className="mt-1 font-mono text-[10px] uppercase tracking-[0.08em] text-gray-500">
        {photo.location}
      </figcaption>
    </figure>
  );
}
