import type { MetadataRoute } from 'next';
import { getServerEnv } from '@/lib/env';

export default function robots(): MetadataRoute.Robots {
  const env = getServerEnv();

  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/archive', '/projects', '/about'],
        disallow: ['/admin', '/api']
      }
    ],
    sitemap: `${env.siteUrl}/sitemap.xml`,
    host: env.siteUrl
  };
}
