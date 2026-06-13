'use client';

import Image from 'next/image';
import { useCallback, useEffect, useState } from 'react';
import { ARCHIVE_IMAGE_SIZES, MUTED_GRAY_BLUR_DATA_URL } from '@/lib/image';
import type { Photograph } from '@/lib/types';
import { ExpandedImagePanel } from './ExpandedImagePanel';
import { usePrintDrawer } from './PrintDrawerProvider';

type Props = {
  photographs: Photograph[];
};

// Thumbnail used inside the reshuffled grid (right side)
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

  return (
    <figure className="group relative mb-3 break-inside-avoid cursor-pointer">
      <div
        className="relative bg-gray-200"
        style={{ aspectRatio: `${photo.aspectRatio}` }}
        onClick={() => onSelect(photo)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && onSelect(photo)}
        aria-label={`Expand ${photo.title}`}
      >
        <Image
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
        <div className="pointer-events-none absolute inset-0 bg-black/0 transition-colors duration-75 group-hover:bg-black/20" />
        {/* Print button */}
        {photo.isPrintAvailable && (
          <button
            type="button"
            className="absolute bottom-2 left-2 font-mono text-[10px] uppercase tracking-[0.12em] text-white opacity-0 transition-opacity duration-75 group-hover:opacity-100"
            onClick={(e) => { e.stopPropagation(); openPrintDrawer(photo); }}
          >
            [ PRINT ]
          </button>
        )}
      </div>
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

  // Read ?image= from URL on mount to support shared links
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('image');
    if (code) {
      const match = photographs.find((p) => p.imageCode === code);
      if (match) setSelected(match);
    }
  }, [photographs]);

  // Remaining photos excluding the selected one
  const rest = selected
    ? photographs.filter((p) => p.id !== selected.id)
    : photographs;

  if (!selected) {
    // Default masonry — no selection
    return (
      <section className="columns-2 gap-3 md:columns-3 md:gap-4 xl:columns-4 2xl:columns-5">
        {photographs.map((photo, index) => (
          <GridThumb
            key={photo.id}
            photo={photo}
            index={index}
            onSelect={handleSelect}
          />
        ))}
      </section>
    );
  }

  // Expanded layout — left panel + reshuffled grid
  return (
    <div className="flex gap-4 md:gap-6">
      {/* Left — expanded image + detail */}
      <aside className="w-full md:w-[420px] lg:w-[480px] shrink-0 md:sticky md:top-[52px] md:max-h-[calc(100vh-60px)] md:overflow-y-auto">
        <ExpandedImagePanel photo={selected} onClose={handleClose} />
      </aside>

      {/* Right — reshuffled remaining grid */}
      <section className="hidden md:block flex-1 min-w-0">
        <div className="columns-2 gap-3 lg:columns-3 lg:gap-4">
          {rest.map((photo, index) => (
            <GridThumb
              key={photo.id}
              photo={photo}
              index={index}
              onSelect={handleSelect}
            />
          ))}
        </div>
      </section>
    </div>
  );
}
