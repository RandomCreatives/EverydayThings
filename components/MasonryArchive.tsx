'use client';

import Image from 'next/image';
import { useCallback, useEffect, useState } from 'react';
import { ARCHIVE_IMAGE_SIZES, MUTED_GRAY_BLUR_DATA_URL } from '@/lib/image';
import type { Photograph } from '@/lib/types';
import { ExpandedImagePanel } from './ExpandedImagePanel';
import { usePrintDrawer } from './PrintDrawerProvider';

// Nav is 44px — keep in sync with Navigation.tsx inline style
const NAV_HEIGHT = 44;

type Props = {
  photographs: Photograph[];
};

function GridThumb({
  photo,
  index,
  onSelect,
}: {
  photo: Photograph;
  index: number;
  onSelect: (photo: Photograph) => void;
}) {
  const { openPrintDrawer } = usePrintDrawer();
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    try {
      const saved = JSON.parse(window.localStorage.getItem('savedImageCodes') ?? '[]') as string[];
      setIsSaved(saved.includes(photo.imageCode));
    } catch {
      // ignore
    }
  }, [photo.imageCode]);

  function toggleSaved(e: React.MouseEvent | React.KeyboardEvent) {
    e.stopPropagation();
    try {
      const saved = JSON.parse(window.localStorage.getItem('savedImageCodes') ?? '[]') as string[];
      const next = saved.includes(photo.imageCode)
        ? saved.filter((c) => c !== photo.imageCode)
        : [...saved, photo.imageCode];
      window.localStorage.setItem('savedImageCodes', JSON.stringify(next));
      setIsSaved(next.includes(photo.imageCode));
    } catch {
      // ignore
    }
  }

  return (
    <figure className="group relative mb-3 break-inside-avoid">
      {/* Clickable image wrapper — proper button for a11y */}
      <button
        type="button"
        className="relative block w-full bg-gray-200 text-left"
        style={{ aspectRatio: `${photo.aspectRatio}` }}
        onClick={() => onSelect(photo)}
        aria-label={`Expand ${photo.title}`}
      >
        <Image onContextMenu={(event) => event.preventDefault()}
          src={photo.imageUrl}
          alt={photo.title}
          fill
          priority={index < 4}
          sizes={ARCHIVE_IMAGE_SIZES}
          placeholder="blur"
          blurDataURL={MUTED_GRAY_BLUR_DATA_URL}
          draggable={false}
          onContextMenu={(e) => e.preventDefault()}
          className="select-none object-cover"
        />
        {/* Hover overlay */}
        <div className="pointer-events-none absolute inset-0 bg-black/0 transition-colors duration-75 group-hover:bg-black/20 group-focus-within:bg-black/20" />

        {/* Save toggle */}
        <span
          role="button"
          tabIndex={0}
          className="absolute left-2 top-2 font-mono text-[10px] uppercase tracking-[0.12em] text-white opacity-0 transition-opacity duration-75 group-hover:opacity-100 group-focus-within:opacity-100"
          onClick={toggleSaved}
          onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && toggleSaved(e)}
          aria-label={isSaved ? 'Unsave image' : 'Save image'}
        >
          {isSaved ? '[ SAVED ]' : '[ SAVE ]'}
        </span>

        {/* Print button */}
        {photo.isPrintAvailable && (
          <span
            role="button"
            tabIndex={0}
            className="absolute bottom-2 left-2 font-mono text-[10px] uppercase tracking-[0.12em] text-white opacity-0 transition-opacity duration-75 group-hover:opacity-100 group-focus-within:opacity-100"
            onClick={(e) => { e.stopPropagation(); openPrintDrawer(photo); }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.stopPropagation();
                openPrintDrawer(photo);
              }
            }}
            aria-label={`Order print of ${photo.title}`}
          >
            [ PRINT ]
          </span>
        )}
      </button>

      <figcaption className="mt-1 font-mono text-[10px] uppercase tracking-[0.08em] text-gray-500">
        {photo.location}
      </figcaption>
    </figure>
  );
}

export function MasonryArchive({ photographs }: Props) {
  const [selected, setSelected] = useState<Photograph | null>(null);

  const handleSelect = useCallback((photo: Photograph) => {
    setSelected((prev) => (prev?.id === photo.id ? null : photo));
  }, []);

  const handleClose = useCallback(() => setSelected(null), []);

  // Support shared links: /archive?image=AA-MONO-001
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('image');
    if (code) {
      const match = photographs.find((p) => p.imageCode === code);
      if (match) setSelected(match);
    }
  }, [photographs]);

  const rest = selected ? photographs.filter((p) => p.id !== selected.id) : photographs;

  if (!selected) {
    return (
      <section className="columns-2 gap-3 md:columns-3 md:gap-4 xl:columns-4 2xl:columns-5">
        {photographs.map((photo, index) => (
          <GridThumb key={photo.id} photo={photo} index={index} onSelect={handleSelect} />
        ))}
      </section>
    );
  }

  return (
    <div className="flex gap-4 md:gap-6">
      {/* Left — sticky expanded panel */}
      <aside
        className="w-full md:w-[640px] lg:w-[760px] xl:w-[860px] shrink-0 md:sticky md:overflow-y-auto"
        style={{
          top: NAV_HEIGHT,
          maxHeight: `calc(100dvh - ${NAV_HEIGHT}px)`,
        }}
      >
        <ExpandedImagePanel photo={selected} onClose={handleClose} />
      </aside>

      {/* Right — reshuffled remaining grid */}
      <section className="hidden md:block flex-1 min-w-0">
        <div className="columns-2 gap-3 lg:columns-3 lg:gap-4">
          {rest.map((photo, index) => (
            <GridThumb key={photo.id} photo={photo} index={index} onSelect={handleSelect} />
          ))}
        </div>
      </section>
    </div>
  );
}
