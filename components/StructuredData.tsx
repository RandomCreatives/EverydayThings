import { getPhotographs, getProjects } from '@/lib/data';
import { getServerEnv } from '@/lib/env';

export async function StructuredData() {
  const env = getServerEnv();
  const [projects, photographs] = await Promise.all([getProjects(), getPhotographs()]);
  const data = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: 'Minimal Photo Archive',
    url: env.siteUrl,
    sameAs: ['https://instagram.com', 'https://behance.net', 'https://are.na'],
    mainEntityOfPage: {
      '@type': 'WebSite',
      name: 'Minimal Photo Archive',
      url: env.siteUrl
    },
    subjectOf: [
      ...projects.map((project) => ({
        '@type': 'CreativeWork',
        name: project.title,
        description: project.description,
        url: `${env.siteUrl}/projects/${project.id}`
      })),
      ...photographs.map((photo) => ({
        '@type': 'Photograph',
        name: photo.title,
        contentLocation: photo.location,
        identifier: photo.imageCode,
        image: `${env.siteUrl}${photo.imageUrl}`
      }))
    ]
  };

  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />;
}
