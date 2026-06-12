import type { Photograph } from '@/lib/types';
import { ProtectedImage } from './ProtectedImage';

export function MasonryArchive({ photographs }: { photographs: Photograph[] }) {
  return (
    <section className="columns-2 gap-3 md:columns-3 md:gap-4 xl:columns-4 2xl:columns-5">
      {photographs.map((photo, index) => (
        <ProtectedImage key={photo.id} photo={photo} priority={index < 2} />
      ))}
    </section>
  );
}
