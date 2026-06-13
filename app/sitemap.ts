import type { MetadataRoute } from 'next';
import { getProjects } from '@/lib/data';
import { getServerEnv } from '@/lib/env';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const env = getServerEnv();
  const now = new Date();
  const projects = await getProjects();

  return [
    {
      url: env.siteUrl,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.8
    },
    {
      url: `${env.siteUrl}/archive`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 1
    },
    {
      url: `${env.siteUrl}/projects`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.8
    },
    ...projects.map((project) => ({
      url: `${env.siteUrl}/projects/${project.id}`,
      lastModified: new Date(project.createdAt),
      changeFrequency: 'monthly' as const,
      priority: 0.7
    })),
    {
      url: `${env.siteUrl}/about`,
      lastModified: now,
      changeFrequency: 'yearly',
      priority: 0.5
    }
  ];
}
