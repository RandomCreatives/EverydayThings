'use client';

import Image from 'next/image';
import Link from 'next/link';
import { MUTED_GRAY_BLUR_DATA_URL, PROJECT_COVER_IMAGE_SIZES } from '@/lib/image';
import type { Project } from '@/lib/types';

export function ProjectGrid({ projects }: { projects: Project[] }) {
  return (
    <section className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {projects.map((project, index) => (
        <Link key={project.id} href={`/projects/${project.id}`} className="group block">
          <div className="relative mb-2 aspect-[4/3] w-full bg-gray-200">
            <Image
              src={project.coverImageUrl}
              alt=""
              fill
              priority={index === 0}
              sizes={PROJECT_COVER_IMAGE_SIZES}
              placeholder="blur"
              blurDataURL={MUTED_GRAY_BLUR_DATA_URL}
              onContextMenu={(event) => event.preventDefault()}
              className="select-none object-cover"
              draggable={false}
            />
          </div>
          <h2 className="font-mono text-[11px] uppercase tracking-[0.12em] text-black group-hover:text-gray-500">
            {project.title}
          </h2>
          <p className="mt-1 max-w-[54ch] text-xs leading-relaxed text-gray-600">{project.description}</p>
        </Link>
      ))}
    </section>
  );
}
