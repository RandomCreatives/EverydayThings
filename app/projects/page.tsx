import { ProjectGrid } from '@/components/ProjectGrid';
import { getProjects } from '@/lib/data';

export const metadata = {
  title: 'Projects | Everyday Things'
};

export default async function ProjectsPage() {
  const projects = await getProjects();

  return (
    <main className="mx-auto max-w-[1800px] px-3 py-4 md:px-5">
      <div className="mb-6 font-mono text-[10px] uppercase tracking-[0.12em]">
        <h1>PROJECTS</h1>
      </div>
      <ProjectGrid projects={projects} />
    </main>
  );
}
