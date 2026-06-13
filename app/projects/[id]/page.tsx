import { notFound } from 'next/navigation';
import { ProtectedImage } from '@/components/ProtectedImage';
import { getPhotographsByProject, getProjectById, projects } from '@/lib/data';
import { DETAIL_IMAGE_SIZES } from '@/lib/image';

type ProjectPageProps = {
  params: Promise<{ id: string }>;
};

export function generateStaticParams() {
  return projects.map((project) => ({ id: project.id }));
}

export async function generateMetadata({ params }: ProjectPageProps) {
  const { id } = await params;
  const project = await getProjectById(id);
  return { title: project ? `${project.title} | Everyday Things` : 'Project' };
}

export default async function ProjectPage({ params }: ProjectPageProps) {
  const { id } = await params;
  const project = await getProjectById(id);

  if (!project) notFound();

  const sequence = await getPhotographsByProject(project.id);

  return (
    <main className="mx-auto max-w-5xl px-3 py-4 md:px-5">
      <header className="mb-10 grid gap-4 border-b border-black pb-5 md:grid-cols-[220px_1fr]">
        <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-gray-500">PROJECT</p>
        <div>
          <h1 className="mb-3 font-mono text-[13px] uppercase tracking-[0.16em]">{project.title}</h1>
          <p className="max-w-2xl text-sm leading-relaxed text-gray-700">{project.description}</p>
        </div>
      </header>

      <section className="grid gap-10">
        {sequence.map((photo, index) => (
          <article key={photo.id} className="grid gap-3 md:grid-cols-[80px_1fr]">
            <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-gray-500">
              {String(index + 1).padStart(2, '0')}
            </p>
            <div className="max-w-3xl">
              <ProtectedImage photo={photo} priority={index === 0} sizes={DETAIL_IMAGE_SIZES} />
              <p className="max-w-xl text-xs leading-relaxed text-gray-600">
                {photo.title}. {photo.location}. Code {photo.imageCode}.
              </p>
            </div>
          </article>
        ))}
      </section>
    </main>
  );
}
